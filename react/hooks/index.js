// Run:  node react/hooks/index.js
//
// A mini-React whose hooks live in a CALL-ORDER slot array - the same data
// structure the real one uses. Because the mechanism is real, the failure
// modes are real too: we break the Rules of Hooks and watch the slots
// misalign, then prove what refs, useMemo and useCallback actually buy.

// --- mini-React over a call-order slot array -------------------------------
function createReact() {
  const instances = new Map();          // component instance -> its hook slots
  let current = null, cursor = 0;

  const slots = () => instances.get(current);

  function useState(initial) {
    const i = cursor++, s = slots();
    if (!(i in s)) s[i] = { type: 'state', value: typeof initial === 'function' ? initial() : initial };
    const slot = s[i];
    const inst = current;
    return [slot.value, (v) => {
      const next = typeof v === 'function' ? v(slot.value) : v;
      if (Object.is(slot.value, next)) return;       // Object.is bail-out
      slot.value = next;
      render(inst);                                   // a state change RE-RENDERS
    }];
  }

  function useRef(initial) {
    const i = cursor++, s = slots();
    // the SAME object is handed back every render; mutating it renders nothing
    if (!(i in s)) s[i] = { type: 'ref', box: { current: initial } };
    return s[i].box;
  }

  function useMemo(factory, deps) {
    const i = cursor++, s = slots(), prev = s[i];
    if (prev && sameDeps(prev.deps, deps)) return prev.value;
    const value = factory();
    s[i] = { type: 'memo', deps, value };
    return value;
  }

  // useCallback(fn, deps) IS useMemo(() => fn, deps) - that is not a metaphor
  const useCallback = (fn, deps) => useMemo(() => fn, deps);

  const sameDeps = (a, b) =>
    !!a && !!b && a.length === b.length && a.every((d, i) => Object.is(d, b[i]));

  function render(inst) {
    if (!instances.has(inst)) instances.set(inst, []);
    const prev = current;
    current = inst; cursor = 0;
    inst.fn();
    current = prev;
  }

  const mount = (name, fn) => { const inst = { name, fn }; render(inst); return inst; };
  return { useState, useRef, useMemo, useCallback, render, mount, slots: (i) => instances.get(i) };
}

const R = createReact();
const { useState, useRef, useMemo, useCallback } = R;

// --- 1. a hook inside an `if` corrupts the slots ---------------------------
console.log('1) Why hooks must be called unconditionally\n');
let loggedIn = true;
const Bad = R.mount('Bad', function () {
  if (loggedIn) var [name] = useState('Ada');       // slot 0 ONLY when logged in
  const [count] = useState(0);                      // slot 0 or slot 1 - it moves!
  console.log(`   loggedIn=${loggedIn}  name=${JSON.stringify(name)}  count=${JSON.stringify(count)}`);
});
console.log('   slots after render 1:', JSON.stringify(R.slots(Bad).map((s) => s.value)));
loggedIn = false;
R.render(Bad);
console.log('   slots after render 2:', JSON.stringify(R.slots(Bad).map((s) => s.value)));
console.log("   -> `count` read slot 0 and got the STRING 'Ada'. No error, just wrong data.");
console.log('   Real React often throws "Rendered fewer hooks than expected"; when the');
console.log('   counts happen to match it fails silently exactly like this.\n');

// --- 2. a ref survives renders WITHOUT causing one -------------------------
console.log('2) useRef persists without rendering; useState renders\n');
let bumpRef, bumpState, renders = 0;
R.mount('Counter', function () {
  const clicks = useRef(0);
  const [n, setN] = useState(0);
  bumpRef = () => { clicks.current++; };
  bumpState = () => setN((v) => v + 1);
  console.log(`   render #${++renders}  ref.current=${clicks.current}  state=${n}`);
});
bumpRef(); bumpRef(); bumpRef();
console.log('   3 ref writes happened -> zero renders, the screen still shows 0');
bumpState();
console.log('   one setState -> a render, and NOW the ref value becomes visible\n');

// --- 3. useMemo skips work; useCallback preserves identity -----------------
console.log('3) Memoization: counting real invocations and comparing identities\n');
let factoryRuns = 0, query = 'a';
const fns = [];
const List = R.mount('List', function () {
  const items = useMemo(() => {
    factoryRuns++;                                   // count REAL invocations
    return ['ant', 'bee', 'cat'].filter((x) => x.includes(query));
  }, [query]);
  const onPick = useCallback((id) => id, []);        // empty deps -> never recreated
  fns.push(onPick);
  console.log(`   query="${query}" items=${JSON.stringify(items)} factory invocations=${factoryRuns}`);
});
R.render(List);                                      // same query
R.render(List);                                      // same query again
query = 'c';
R.render(List);                                      // deps changed
console.log(`   4 renders, but the factory ran ${factoryRuns} times: only when [query] changed.`);
console.log(`   useCallback identity across renders: Object.is(fns[0], fns[3]) = ${Object.is(fns[0], fns[3])}`);
console.log(`   an inline arrow would be: Object.is(() => {}, () => {}) = ${Object.is(() => {}, () => {})}`);
console.log('   That identity is the point: it keeps React.memo children and dependency');
console.log('   arrays from invalidating on every single render.\n');

// --- 4. a custom hook shares LOGIC, never STATE ----------------------------
console.log('4) Two components, one custom hook, two independent states\n');
function useCounter(start) {                         // just a function calling hooks
  const [n, setN] = useState(start);
  return [n, () => setN((v) => v + 1)];
}
const boxes = {};
for (const name of ['Header', 'Sidebar']) {
  R.mount(name, function () {
    const [n, inc] = useCounter(0);
    boxes[name] = inc;
    console.log(`   ${name.padEnd(8)} count=${n}`);
  });
}
console.log('   clicking Header three times:');
boxes.Header(); boxes.Header(); boxes.Header();
console.log('   Sidebar never re-rendered and never changed: each call site got its own');
console.log('   slot array. Custom hooks reuse the LOGIC; state stays per-component.');
console.log('   To actually share a value you need lifted state, context, or a store.');
