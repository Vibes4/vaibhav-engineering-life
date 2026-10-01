// Run:  node react/data-fetching/index.js
//
// Everything the naive `useEffect + fetch` gets wrong, demonstrated for real:
//   a) a race condition where the FIRST request resolves LAST and wins,
//   b) the `ignore` flag fix,  c) the AbortController fix,
//   d) a ~30-line cache with in-flight dedupe + stale-while-revalidate,
//   e) a waterfall vs Promise.all, with timings.

let networkCalls = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A fake API. `q` decides the latency, so we can force out-of-order responses.
async function api(q, ms, signal) {
  networkCalls++;
  await sleep(ms);
  if (signal?.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
  return `results for "${q}"`;
}

// --- a) the race condition --------------------------------------------------
async function naive() {
  let rendered = null;                       // pretend this is setState
  // The user types "a" (slow query, 120ms) then "ab" (fast query, 20ms).
  const runs = [api('a', 120), api('ab', 20)];
  await Promise.all(runs.map(async (p, i) => {
    const data = await p;
    rendered = data;                         // ❌ whoever resolves LAST wins
    console.log(`   effect ${i} resolved -> setState(${JSON.stringify(data)})`);
  }));
  return rendered;
}

// --- b) the `ignore` flag ---------------------------------------------------
async function withIgnoreFlag() {
  let rendered = null;
  const effects = [];
  const runEffect = (q, ms) => {
    let ignore = false;                      // scoped to THIS effect run
    const promise = api(q, ms).then((data) => {
      if (ignore) { console.log(`   effect for "${q}" resolved but is IGNORED (cleanup ran)`); return; }
      rendered = data;
      console.log(`   effect for "${q}" resolved -> setState(${JSON.stringify(data)})`);
    });
    effects.push(promise);
    return () => { ignore = true; };         // the cleanup React runs before the next effect
  };
  const cleanupA = runEffect('a', 120);
  cleanupA();                                // deps changed: cleanup runs BEFORE the next effect
  runEffect('ab', 20);
  await Promise.all(effects);
  return rendered;
}

// --- c) AbortController -----------------------------------------------------
async function withAbort() {
  let rendered = null;
  const pending = [];
  const start = (q, ms) => {
    const ctrl = new AbortController();
    pending.push(api(q, ms, ctrl.signal)
      .then((d) => { rendered = d; console.log(`   "${q}" applied`); })
      .catch((e) => { if (e.name === 'AbortError') console.log(`   "${q}" ABORTED — connection freed, server work stopped`); else throw e; }));
    return ctrl;
  };
  const first = start('a', 120);
  first.abort();                             // cleanup aborts the outdated request
  start('ab', 20);
  await Promise.all(pending);
  return rendered;
}

// --- d) cache: dedupe + stale-while-revalidate ------------------------------
function createQueryCache({ staleTime = 50 } = {}) {
  const cache = new Map();                   // key -> { data, at, promise }
  return {
    async query(key, fn) {
      const entry = cache.get(key);
      // 1. an in-flight promise for this key? share it — DEDUPLICATION.
      if (entry?.promise) return entry.promise;
      // 2. fresh cached value? return it with no network call at all.
      if (entry && Date.now() - entry.at < staleTime) return entry.data;
      // 3. stale value? serve it NOW and revalidate in the background — SWR.
      if (entry) {
        const promise = fn().then((data) => { cache.set(key, { data, at: Date.now() }); return data; });
        cache.set(key, { ...entry, promise });
        return entry.data;                   // instant, possibly stale
      }
      // 4. cold: store the PROMISE so concurrent callers dedupe onto it.
      const promise = fn().then((data) => { cache.set(key, { data, at: Date.now() }); return data; });
      cache.set(key, { promise });
      return promise;
    },
    peek: (key) => cache.get(key)?.data,
  };
}

// --- e) waterfall vs parallel -----------------------------------------------
async function waterfall() {
  const t = Date.now();
  const user = await api('user', 60);        // Profile renders a spinner...
  const posts = await api('posts', 60);      // ...so Posts only mounts now
  return { ms: Date.now() - t, got: [user, posts].length };
}
async function parallel() {
  const t = Date.now();
  const [user, posts] = await Promise.all([api('user', 60), api('posts', 60)]);
  return { ms: Date.now() - t, got: [user, posts].length };
}

(async function main() {
  console.log('=== a) The race condition ===');
  console.log('   User types "a" (slow, 120ms) then "ab" (fast, 20ms).');
  console.log('   rendered:', JSON.stringify(await naive()));
  console.log('   ❌ The input says "ab" but the screen shows results for "a".\n');

  console.log('=== b) Fix 1: the `ignore` flag in cleanup ===');
  console.log('   rendered:', JSON.stringify(await withIgnoreFlag()));
  console.log('   ✅ The stale response still arrives — it is just never applied.\n');

  console.log('=== c) Fix 2: AbortController ===');
  console.log('   rendered:', JSON.stringify(await withAbort()));
  console.log('   ✅ Same correctness, plus the request is actually cancelled.\n');

  console.log('=== d) Cache: dedupe + stale-while-revalidate ===');
  networkCalls = 0;
  const qc = createQueryCache({ staleTime: 50 });
  // Five components mount at once and all ask for the same key.
  const results = await Promise.all([1, 2, 3, 4, 5].map(() => qc.query('user:1', () => api('user:1', 30))));
  console.log(`   5 concurrent reads -> ${networkCalls} network call(s); all agree: ${new Set(results).size === 1}`);
  await qc.query('user:1', () => api('user:1', 30));
  console.log(`   read again while fresh  -> still ${networkCalls} network call(s) (cache hit)`);
  await sleep(70);                                        // let it go stale
  const stale = await qc.query('user:1', () => api('user:1', 30));
  console.log(`   read after staleTime    -> returned cached "${stale}" INSTANTLY, revalidating in background`);
  await sleep(50);
  console.log(`   background refetch done -> ${networkCalls} network call(s) total\n`);

  console.log('=== e) Waterfall vs Promise.all ===');
  const w = await waterfall();
  const p = await parallel();
  console.log(`   sequential await   : ${w.ms}ms`);
  console.log(`   Promise.all        : ${p.ms}ms  (~half — the requests never depended on each other)`);
  console.log('   A parent that returns <Spinner/> while loading creates this by accident:');
  console.log('   the child cannot mount, so its effect cannot start.\n');

  console.log('Lesson: the fetch call is one line. Correctness is cancellation, a single');
  console.log('status field, dedupe, caching, revalidation and retries — which is exactly');
  console.log('the surface React Query / SWR own, and which RSC + route loaders move to the server.');
})();
