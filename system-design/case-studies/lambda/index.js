// Run:  node system-design/case-studies/lambda/index.js
//
// Simulating the AWS Lambda execution-environment lifecycle.
//
// Core idea: Lambda keeps a POOL of reusable sandboxed environments.
//   - A free (warm) environment -> reuse it -> FAST.
//   - No free environment       -> spin up a new one (COLD START) -> SLOW,
//                                  but only up to the CONCURRENCY LIMIT.
// One environment serves ONE request at a time, so concurrency N needs N envs.

const CONCURRENCY_LIMIT = 3; // max environments allowed at once
const COLD_START_MS = 200;   // cost to initialize a fresh environment
const WARM_OVERHEAD_MS = 2;  // cost to reuse an existing one

let nextEnvId = 1;
const pool = []; // each env: { id, busy }

// Find a free warm env, or create a new one if under the limit.
function acquireEnv() {
  let env = pool.find((e) => !e.busy);
  if (env) {
    return { env, cold: false, latency: WARM_OVERHEAD_MS };
  }
  if (pool.length < CONCURRENCY_LIMIT) {
    env = { id: nextEnvId++, busy: false };
    pool.push(env);
    return { env, cold: true, latency: COLD_START_MS + WARM_OVERHEAD_MS };
  }
  return null; // no capacity -> THROTTLED (429)
}

// Simulate handling one invocation. We model "busy" with a setTimeout so
// concurrent requests can overlap and compete for environments.
function invoke(label) {
  const result = acquireEnv();
  if (!result) {
    console.log(`[${label}] THROTTLED (429) - hit concurrency limit of ${CONCURRENCY_LIMIT}`);
    return;
  }
  const { env, cold, latency } = result;
  env.busy = true;
  console.log(
    `[${label}] -> env #${env.id}  ${cold ? 'COLD START' : 'warm reuse '}  (~${latency}ms)`
  );
  // Free the environment after the (simulated) work finishes.
  setTimeout(() => {
    env.busy = false;
  }, 50);
}

// --- Burst 1: 4 simultaneous requests, pool is empty ---
console.log('=== Burst 1: 4 requests at once (cold) ===');
invoke('req-1'); // cold, env #1
invoke('req-2'); // cold, env #2
invoke('req-3'); // cold, env #3
invoke('req-4'); // no env free + at limit -> throttled

// --- Burst 2: after envs free up, new requests reuse them (warm) ---
setTimeout(() => {
  console.log('\n=== Burst 2: 3 requests after warm-up (reuse) ===');
  invoke('req-5'); // warm reuse
  invoke('req-6'); // warm reuse
  invoke('req-7'); // warm reuse

  setTimeout(() => {
    console.log(`\nPool size: ${pool.length} environment(s) created total.`);
    console.log('Note: warm reuse is ~100x faster than a cold start.');
  }, 100);
}, 100);
