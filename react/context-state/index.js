// Run:  node react/context-state/index.js
//
// Two experiments, no React needed:
//   1. a mini Context: a Provider broadcasts to EVERY consumer, and the value is
//      compared by identity — so an inline object literal wakes the whole tree
//      even when the data is byte-for-byte equal.
//   2. a ~30-line subscribe/selector store: the same update, but only the
//      components whose SELECTED SLICE changed re-render.

// --- 1. a mini Context ------------------------------------------------------
function createContext() {
  const consumers = [];                       // components that called useContext
  let current;                                // the last provided value
  return {
    provide(value) {
      // React compares the provider value with Object.is. Nothing else.
      if (Object.is(current, value)) return { changed: false, rerendered: 0 };
      current = value;
      // A change re-renders every consumer. There is no selector, no equality
      // check on what each consumer actually reads, and React.memo cannot stop it.
      consumers.forEach((c) => c.render(current));
      return { changed: true, rerendered: consumers.length };
    },
    consume(name, reads) { consumers.push({ name, reads, render() { renders[name] = (renders[name] || 0) + 1; } }); },
  };
}

let renders = {};
const total = () => Object.values(renders).reduce((a, b) => a + b, 0);

console.log('=== 1. Context broadcast ===\n');
const Ctx = createContext();
// A realistic tree: 6 consumers, but only ONE of them reads `cart`.
['Header', 'Avatar', 'ThemeToggle', 'CartBadge', 'Footer', 'Settings']
  .forEach((n) => Ctx.consume(n, n === 'CartBadge' ? 'cart' : 'user'));

const user = { id: 1, name: 'Ada' };
let cart = { count: 0 };

renders = {};
Ctx.provide({ user, cart });                                   // initial mount value
console.log('mount:                       consumers rendered =', total());

// --- the inline-object-literal pitfall --------------------------------------
// <Ctx.Provider value={{ user, cart }}>  creates a NEW object every render of
// the provider component, even when user and cart are untouched.
renders = {};
const a = { user, cart };
const b = { user, cart };
console.log('\ndeep-equal? user/cart same refs:', a.user === b.user && a.cart === b.cart);
console.log('Object.is(a, b):                ', Object.is(a, b), ' <- React only looks at this');
const r1 = Ctx.provide(b);
console.log(`provider re-rendered for an UNRELATED reason -> ${r1.rerendered} consumers re-rendered`);
console.log('   ...for zero data change. This is the #1 Context perf bug.\n');

// --- the memoized value -----------------------------------------------------
renders = {};
const memoized = b;                                            // useMemo(() => ({user,cart}), [user,cart])
const r2 = Ctx.provide(memoized);
console.log(`useMemo keeps the identity stable -> ${r2.rerendered} consumers re-rendered (bail-out)\n`);

// --- a REAL change: still a full broadcast ----------------------------------
renders = {};
cart = { count: 1 };                                           // only the cart changed
const r3 = Ctx.provide({ user, cart });
console.log('cart.count 0 -> 1 (user untouched):');
console.log(`   consumers re-rendered = ${r3.rerendered}`, JSON.stringify(renders));
console.log('   5 of those 6 do not even read `cart`. Memoization cannot fix this —');
console.log('   Context has no selectors. That is what a store is for.\n');

// --- 2. a tiny subscribe/selector store -------------------------------------
console.log('=== 2. Selector store (what Zustand/useSyncExternalStore do) ===\n');

function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    getState: () => state,
    setState(patch) {
      const next = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
      if (Object.is(state, next)) return;
      state = next;
      listeners.forEach((l) => l());          // notify; each listener decides for itself
    },
    subscribe(selector, onChange) {
      let selected = selector(state);
      const listener = () => {
        const nextSelected = selector(state);
        // THE WHOLE POINT: compare the SLICE, not the root object.
        if (Object.is(selected, nextSelected)) return;
        selected = nextSelected;
        onChange(nextSelected);
      };
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const store = createStore({ user, cart: { count: 0 } });
renders = {};
const wire = (name, selector) => store.subscribe(selector, () => { renders[name] = (renders[name] || 0) + 1; });
wire('Header',      (s) => s.user);
wire('Avatar',      (s) => s.user.name);
wire('ThemeToggle', (s) => s.user.id);
wire('CartBadge',   (s) => s.cart.count);     // the only one that reads cart
wire('Footer',      (s) => s.user);
wire('Settings',    (s) => s.user);

store.setState({ cart: { count: 1 } });       // the exact same update as before
console.log('cart.count 0 -> 1 through the store:');
console.log(`   components re-rendered = ${total()}`, JSON.stringify(renders));

store.setState((s) => ({ ...s, cart: { count: 1 } }));   // new root object, same count
console.log(`   new root object but count still 1 -> total renders still ${total()} (slice equal)\n`);

// --- the lesson -------------------------------------------------------------
console.log('Context  : 1 update -> 6 re-renders (broadcast by value identity)');
console.log('Store    : 1 update -> 1 re-render  (each subscriber compares its own slice)');
console.log('\nContext is dependency injection. Reach for it for ambient, rarely-changing');
console.log('values (theme, locale, session). When many consumers need different slices of');
console.log('something that changes often, you need per-subscriber selection, not a Provider.');
