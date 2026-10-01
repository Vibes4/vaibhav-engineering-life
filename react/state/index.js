// Run:  node react/state/index.js
//
// React is a browser library, so instead of rendering DOM we build a ~50-line
// mini-React that stores hooks the same way the real one does, and then watch
// the exact behaviours that trip people up: lazy init, batching, stale
// snapshots, functional updates, bail-outs and mutation.

// --- a tiny React that behaves like the real scheduler --------------------
const Mini = (() => {
  let hooks = [];        // one slot per useState call, keyed by CALL ORDER
  let cursor = 0;        // reset before every render — this is why the rules of hooks exist
  let component = null;
  let queue = [];        // pending updates, exactly like React's update queue
  let scheduled = false;
  let renders = 0;

  function useState(initial) {
    const slot = cursor++;
    if (!(slot in hooks)) {
      // the initializer runs ONCE; a function argument is called lazily
      hooks[slot] = typeof initial === 'function' ? initial() : initial;
    }
    const setState = (update) => { queue.push({ slot, update }); schedule(); };
    return [hooks[slot], setState];           // returns a SNAPSHOT, not a live binding
  }

  function schedule() {
    if (scheduled) return;                    // React 18 automatic batching: one flush per tick
    scheduled = true;
    queueMicrotask(flush);
  }

  function flush() {
    scheduled = false;
    let changed = false;
    for (const { slot, update } of queue) {
      const prev = hooks[slot];
      // a function argument is a FUNCTIONAL UPDATE, fed the latest queued value
      const next = typeof update === 'function' ? update(prev) : update;
      if (!Object.is(prev, next)) { hooks[slot] = next; changed = true; }
    }
    queue = [];
    if (changed) render();
    else console.log('     → bail-out: Object.is says nothing changed, no re-render');
  }

  function render(fn) {
    if (fn) component = fn;
    cursor = 0;                               // slots are matched by order, every time
    renders++;
    component();
  }

  return {
    useState, render,
    renders: () => renders,
    reset() { hooks = []; cursor = 0; queue = []; scheduled = false; renders = 0; },
  };
})();

const { useState, render } = Mini;
const tick = () => new Promise((r) => setTimeout(r, 0));   // let the microtask flush run

(async function main() {
  // --- 1. lazy initialization ---------------------------------------------
  console.log('1) Lazy initialization — the argument only matters on mount');
  let expensiveCalls = 0;
  const parse = () => { expensiveCalls++; return ['a', 'b']; };
  Mini.reset();
  let bump;
  render(function List() {
    const [rows] = useState(parse);            // pass the FUNCTION, don't call it
    const [, setN] = useState(0);
    bump = () => setN((n) => n + 1);
    console.log(`   render #${Mini.renders()} rows=${JSON.stringify(rows)}`);
  });
  bump(); await tick();
  bump(); await tick();
  console.log(`   parse() ran ${expensiveCalls} time across ${Mini.renders()} renders`);
  console.log('   useState(parse())  would have run it every render and thrown the result away\n');

  // --- 2. batching ---------------------------------------------------------
  console.log('2) Automatic batching — three setters, one re-render');
  Mini.reset();
  let handler;
  render(function Counter() {
    const [count, setCount] = useState(0);
    handler = () => { setCount(count + 1); setCount(count + 1); setCount(count + 1); };
    console.log(`   render #${Mini.renders()} count=${count}`);
  });
  handler();
  console.log('   (all three setters queued; nothing has re-rendered yet)');
  await tick();
  console.log('   count ended at 1, not 3 — every call read the SAME stale snapshot 0\n');

  // --- 3. functional updates ----------------------------------------------
  console.log('3) Functional updates — the same three calls, composed');
  Mini.reset();
  render(function Counter2() {
    const [count, setCount] = useState(0);
    handler = () => { setCount((c) => c + 1); setCount((c) => c + 1); setCount((c) => c + 1); };
    console.log(`   render #${Mini.renders()} count=${count}`);
  });
  handler(); await tick();
  console.log('   count ended at 3 — each updater receives the previous queued value\n');

  // --- 4. the stale closure a setInterval creates --------------------------
  console.log('4) Stale closure — why a timer must use the functional form');
  const snapshot = 0;                          // pretend this is `count` captured at render
  const naive = [];
  const functional = [];
  let live = 0;
  for (let t = 0; t < 3; t++) {
    naive.push(snapshot + 1);                  // setCount(count + 1) inside setInterval
    live = live + 1;                           // setCount(c => c + 1)
    functional.push(live);
  }
  console.log(`   setCount(count + 1) each tick → ${JSON.stringify(naive)}  (frozen at the mount snapshot)`);
  console.log(`   setCount(c => c + 1) each tick → ${JSON.stringify(functional)}  (always current)\n`);

  // --- 5. mutation vs a new reference --------------------------------------
  console.log('5) Mutation is invisible to React — Object.is decides everything');
  const before = { name: 'Ada', tags: ['dev'] };
  const mutated = before;  mutated.tags.push('admin');
  console.log(`   after push:     Object.is(before, mutated) = ${Object.is(before, mutated)}  → React skips the render`);
  const copied = { ...before, tags: [...before.tags, 'owner'] };
  console.log(`   after spread:   Object.is(before, copied)  = ${Object.is(before, copied)}  → React re-renders`);

  Mini.reset();
  let mutate, replace;
  render(function Profile() {
    const [user, setUser] = useState({ name: 'Ada', tags: [] });
    mutate  = () => { user.tags.push('admin'); setUser(user); };
    replace = () => setUser((u) => ({ ...u, tags: [...u.tags, 'admin'] }));
    console.log(`   render #${Mini.renders()} tags=${JSON.stringify(user.tags)}`);
  });
  console.log('   calling the mutating version:');
  mutate(); await tick();
  console.log('   calling the immutable version:');
  replace(); await tick();
  console.log('   note the mutated data was there all along — it just never triggered a render\n');

  // --- 6. derived state drifts out of sync ---------------------------------
  console.log('6) Derived state duplicates the source of truth');
  const items = [{ price: 10 }, { price: 5 }];
  let storedTotal = items.reduce((s, i) => s + i.price, 0);   // useState + useEffect
  console.log(`   stored total after mount: ${storedTotal}`);
  items.push({ price: 100 });                                  // an update the effect missed
  console.log(`   items changed → stored total is now WRONG: ${storedTotal}`);
  console.log(`   computed during render is always right:     ${items.reduce((s, i) => s + i.price, 0)}`);
  console.log('\n   Rule: if it can be computed from props or state, compute it — do not store it.');
})();
