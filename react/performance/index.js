// Run:  node react/performance/index.js
//
// Three measurable lessons about React performance, with no React involved:
//   1. a parent render cascades into children, memo stops it, and an inline
//      object prop silently un-stops it
//   2. what memoization actually buys on a genuinely expensive computation
//   3. why virtualization is arithmetic, not magic
//
// The mini-renderer below models React's real rule: a parent that renders
// renders its children unconditionally, unless the child is wrapped in memo
// AND every prop passes an Object.is comparison.

const { performance } = require('node:perf_hooks');

// --- a 30-line renderer with React's bail-out rule -------------------------
const counts = new Map();
const prevProps = new Map();

function component(name, fn) {
  const self = { name, memo: false, fn };
  return self;
}
function memo(c) { return { ...c, name: c.name, memo: true }; }

function renderTree(node, props = {}) {
  if (node.memo) {
    const last = prevProps.get(node.name);
    // shallow Object.is over every prop — exactly what React.memo does
    if (last && Object.keys(props).length === Object.keys(last).length &&
        Object.keys(props).every((k) => Object.is(props[k], last[k]))) {
      console.log(`      ${node.name}: SKIPPED (memo, props shallow-equal)`);
      return;
    }
  }
  prevProps.set(node.name, props);
  counts.set(node.name, (counts.get(node.name) || 0) + 1);
  console.log(`      ${node.name}: rendered  (total ${counts.get(node.name)})`);
  (node.fn ? node.fn(props) : []).forEach(([child, p]) => renderTree(child, p));
}

// --- 1. the cascade, memo, and the inline object that defeats it -----------
console.log('1) A parent render cascades into every child, props or not');
const Leaf = component('Leaf');
const Sidebar = component('Sidebar', () => [[Leaf, {}]]);
const Plain = component('Parent', () => [[Sidebar, {}]]);

console.log('   parent state changed → render:');
renderTree(Plain);
console.log('   parent state changed again → render:');
renderTree(Plain);
console.log('   Sidebar takes NO props and still rendered twice.\n');

console.log('2) React.memo with a stable prop stops the cascade');
counts.clear(); prevProps.clear();
const MemoSidebar = memo(component('MemoSidebar', () => [[Leaf, {}]]));
const STABLE = { theme: 'dark' };                 // one object, hoisted out of render
const WithMemo = component('Parent2', () => [[MemoSidebar, { cfg: STABLE }]]);
renderTree(WithMemo);
renderTree(WithMemo);
console.log(`   Object.is(STABLE, STABLE) = ${Object.is(STABLE, STABLE)} → memo bails out\n`);

console.log('3) The same memo, defeated by an inline object literal');
counts.clear(); prevProps.clear();
const seen = [];
const WithInline = component('Parent3', () => {
  const cfg = { theme: 'dark' };                  // recreated every render, as in JSX
  seen.push(cfg);
  return [[MemoSidebar, { cfg }]];
});
renderTree(WithInline);
renderTree(WithInline);
console.log(`   Object.is(render1.cfg, render2.cfg) = ${Object.is(seen[0], seen[1])}`);
console.log(`   deep-equal? ${JSON.stringify(seen[0]) === JSON.stringify(seen[1])} — but memo compares REFERENCES, so it re-renders.`);
console.log('   Same failure for [] , () => {} , and children passed as JSX.\n');

// --- 2. memoization on a genuinely expensive computation -------------------
console.log('4) useMemo, measured — deps unchanged means the work is skipped');
function expensive(n) {                            // stand-in for sorting/parsing 50k rows
  let acc = 0;
  for (let i = 0; i < n; i++) acc += Math.sqrt(i) * Math.sin(i);
  return Math.round(acc);
}
const N = 4_000_000;
function useMemoSim() {
  let deps, value;
  return (nextDeps, compute) => {
    if (deps && nextDeps.every((d, i) => Object.is(d, deps[i]))) return value;  // cache hit
    deps = nextDeps; value = compute();
    return value;
  };
}
const cache = useMemoSim();
const RENDERS = 5;

let t0 = performance.now();
for (let r = 0; r < RENDERS; r++) expensive(N);
const rawMs = performance.now() - t0;

t0 = performance.now();
for (let r = 0; r < RENDERS; r++) cache([N], () => expensive(N));
const memoMs = performance.now() - t0;

console.log(`   ${RENDERS} renders, recomputing every time : ${rawMs.toFixed(1)} ms`);
console.log(`   ${RENDERS} renders, useMemo([N])           : ${memoMs.toFixed(1)} ms`);
console.log(`   saved ${(rawMs - memoMs).toFixed(1)} ms (${(rawMs / memoMs).toFixed(1)}x) — the deps check costs microseconds`);

// the other half of the truth: memoizing something cheap is a net loss
const cheap = useMemoSim();
t0 = performance.now();
for (let r = 0; r < 200_000; r++) { const x = r * 2; void x; }
const cheapRaw = performance.now() - t0;
t0 = performance.now();
for (let r = 0; r < 200_000; r++) cheap([7], () => 7 * 2);
const cheapMemo = performance.now() - t0;
console.log(`   200k cheap ops direct: ${cheapRaw.toFixed(1)} ms vs memoized: ${cheapMemo.toFixed(1)} ms`);
console.log('   → memoize expensive work and unstable references, not arithmetic.\n');

// --- 3. virtualization as arithmetic --------------------------------------
console.log('5) Virtualization — cost stops scaling with data size');
const rows = 100_000, rowH = 40, viewport = 600, overscan = 5, nodesPerRow = 6;
const visible = Math.ceil(viewport / rowH) + overscan * 2;
console.log(`   list: ${rows.toLocaleString()} rows × ${rowH}px, viewport ${viewport}px, overscan ${overscan}`);
console.log(`   unvirtualized : ${rows.toLocaleString()} row components, ~${(rows * nodesPerRow).toLocaleString()} DOM nodes`);
console.log(`   windowed      : ${visible} row components, ~${visible * nodesPerRow} DOM nodes`);
console.log(`   ratio         : ${Math.round(rows / visible).toLocaleString()}x less work per render`);
console.log(`   scrolling to row 90,000 still renders ${visible} rows — that is the point.`);
console.log('\nOrder of attack: fix the algorithm → move state down → virtualize → split → transitions → memo.');
