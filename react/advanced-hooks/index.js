// Run:  node react/advanced-hooks/index.js
//
// Three mechanisms you cannot see from the API surface:
//   1. a reducer is a PURE function, so it is testable with no React at all
//   2. useTransition = two priority queues, where urgent work interrupts
//   3. tearing, and the snapshot discipline useSyncExternalStore enforces

// --- 1. a reducer store, and the reducer unit-tested on its own ------------
console.log('1) useReducer: transitions as data, testable outside any component\n');

function cartReducer(state, action) {          // (state, action) => newState, PURE
  switch (action.type) {
    case 'added':
      return { ...state, items: [...state.items, action.item], status: 'editing' };
    case 'removed':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case 'checkout_started':
      return { ...state, status: 'submitting', error: null };
    case 'checkout_failed':
      return { ...state, status: 'error', error: action.error };
    default:
      return state;                            // unknown action -> SAME reference -> bail-out
  }
}

function createStore(reducer, initial) {
  let state = initial;
  const dispatch = (action) => {               // dispatch identity is stable forever
    const next = reducer(state, action);
    const changed = !Object.is(state, next);
    state = next;
    console.log(`   dispatch ${String(action.type).padEnd(17)} -> ${changed ? 'render' : 'BAIL-OUT (same ref)'}  ${JSON.stringify(state)}`);
  };
  return { dispatch, get: () => state };
}

const store = createStore(cartReducer, { items: [], status: 'idle', error: null });
const dispatchAtMount = store.dispatch;        // captured before any state change
store.dispatch({ type: 'added', item: { id: 1, name: 'mug' } });
store.dispatch({ type: 'added', item: { id: 2, name: 'hat' } });
store.dispatch({ type: 'removed', id: 1 });
store.dispatch({ type: 'checkout_started' });
store.dispatch({ type: 'checkout_failed', error: 'card declined' });
store.dispatch({ type: 'unknown' });
console.log(`   dispatch identity after 6 updates is unchanged: ${Object.is(dispatchAtMount, store.dispatch)}`);
console.log('   -> it never belongs in a dependency array and is safe to pass via context.\n');

console.log('   Now unit-test the reducer directly - no component, no DOM, no renderer:');
const assert = (name, got, want) =>
  console.log(`   ${JSON.stringify(got) === JSON.stringify(want) ? 'PASS' : 'FAIL'}  ${name}`);
const base = { items: [], status: 'idle', error: null };
assert('added appends the item', cartReducer(base, { type: 'added', item: { id: 9 } }).items, [{ id: 9 }]);
assert('checkout_started clears the error', cartReducer({ ...base, error: 'x' }, { type: 'checkout_started' }).error, null);
assert('reducer never mutates its input', base.items, []);
console.log(`   PASS  unknown action returns the identical reference: ${Object.is(base, cartReducer(base, { type: 'nope' }))}`);
console.log('   That testability is the main reason to reach for useReducer.\n');

// --- 2. concurrent priority: blocking render vs a transition --------------
console.log('2) useTransition: urgent keystrokes interrupt non-urgent list renders\n');
const keys = ['r', 'e', 'a', 'c', 't'];
const COST = 3;                                // "units of work" to render the big list

function blocking() {
  const frames = [];
  for (const k of keys) {
    frames.push(`type:${k}`);
    for (let u = 0; u < COST; u++) frames.push(`list(${k})`);   // cannot be interrupted
  }
  return frames;
}

function withTransition() {
  const frames = [];
  let inFlight = null, done = 0;
  for (const k of keys) {
    if (inFlight) { frames.push(`ABORT list(${inFlight}) after ${done}/${COST}`); }
    frames.push(`type:${k}`);                  // urgent update always paints first
    inFlight = k; done = 1;
    frames.push(`list(${k})`);                 // background work starts, then is preempted
  }
  while (done < COST) { frames.push(`list(${inFlight})`); done++; }   // no more input: finish
  return frames;
}

console.log('   blocking  :', blocking().join(' '));
console.log('   transition:', withTransition().join(' '));
console.log(`   Blocking renders the list ${keys.length} times fully (${keys.length * COST} units) and the caret`);
console.log('   lags. The transition paints every keystroke immediately, throws away each');
console.log('   superseded list render, and commits only the final one. isPending stays');
console.log('   true from the first startTransition until that final render commits.\n');

// --- 3. tearing, and the snapshot that fixes it ---------------------------
console.log('3) Tearing: two subscribers reading a store that mutates mid-render\n');
const externalStore = {
  value: 'light',
  listeners: new Set(),
  read() { return this.value; },                       // raw read - NOT snapshot-safe
  set(v) { this.value = v; this.listeners.forEach((l) => l()); },
  subscribe(l) { this.listeners.add(l); return () => this.listeners.delete(l); },
};

// concurrent render: React renders A, yields to the browser, then renders B
const torn = [];
torn.push(`Header  read -> ${externalStore.read()}`);
externalStore.set('dark');                             // a "theme change" during the yield
torn.push(`Sidebar read -> ${externalStore.read()}`);
console.log('   raw reads:', torn.join(' | '));
console.log('   -> ONE committed frame shows two different themes. That is tearing.\n');

// useSyncExternalStore style: take getSnapshot() once and render the whole tree from it
externalStore.set('light');
function renderWithSnapshot() {
  const snapshot = externalStore.read();               // cached snapshot for THIS render
  const out = [`Header  read -> ${snapshot}`];
  externalStore.set('dark');                           // same mid-render mutation
  out.push(`Sidebar read -> ${snapshot}`);
  return out;
}
console.log('   snapshot reads:', renderWithSnapshot().join(' | '));
console.log('   -> consistent frame. The store change notifies the subscriber, and React');
console.log('      re-renders the whole tree from the NEW snapshot.');
console.log('   getSnapshot must return a cached value: a fresh object each call fails the');
console.log('   Object.is check every time and React throws an infinite-loop error.');
