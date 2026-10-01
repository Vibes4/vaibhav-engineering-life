// Run:  node react/components-props/index.js
//
// A component is a function of its props. This file makes that literal: we
// "render" plain functions and compare their return values, which is exactly
// what StrictMode does when it calls your component twice in development.

const render = (Comp, props) => Comp(props);           // "rendering" == calling
const twice = (Comp, props) => [render(Comp, props), render(Comp, props)];
const same = (a, b) => (a === b ? 'IDENTICAL' : 'DIVERGED');

// --- 1. an impure component ------------------------------------------------
// Three separate sins, all of which "work" in dev until they do not:
//   (a) mutates a module-level array,  (b) mutates a prop object,
//   (c) derives output from that mutated state.
const auditLog = [];                                   // module-level, shared by every render

function ImpureRow({ user }) {
  auditLog.push(user.id);                              // (a) side effect during render
  user.views = (user.views || 0) + 1;                  // (b) writing to the PARENT's object
  user.name = user.name.toUpperCase();                 // (b) again, and not idempotent-looking
  return `<li>${user.name} — seen ${user.views}x (audit size ${auditLog.length})</li>`;
}

console.log('1) Impure component, called twice with the SAME props object:');
const impureProps = { user: { id: 'u1', name: 'Ada', views: 0 } };
const [i1, i2] = twice(ImpureRow, impureProps);
console.log('   render 1:', i1);
console.log('   render 2:', i2);
console.log('   →', same(i1, i2), '— same input, different output. Render is not a function any more.');
console.log(`   the parent's own object was rewritten behind its back: ${JSON.stringify(impureProps.user)}`);
console.log(`   and a module-level array grew to ${auditLog.length} entries nobody asked for.\n`);

// --- 2. the same component, pure -------------------------------------------
// Derive during render; never write. Anything that must be recorded is an
// effect (useEffect) or an event handler — both run AFTER render, once.
function PureRow({ user, views, onSeen }) {
  const name = user.name.toUpperCase();                // derived, local, thrown away
  return `<li>${name} — seen ${views}x (onSeen: ${typeof onSeen})</li>`;
}

console.log('2) Pure component, called twice with the same props:');
const pureProps = { user: { id: 'u1', name: 'Ada' }, views: 0, onSeen: () => {} };
const [p1, p2] = twice(PureRow, pureProps);
console.log('   render 1:', p1);
console.log('   render 2:', p2);
console.log('   →', same(p1, p2), `— and the props are untouched: ${JSON.stringify(pureProps.user)}`);
console.log('   StrictMode double-renders precisely to make case 1 fail loudly in dev.\n');

// --- 3. why "it changed on the second render" is not cosmetic ---------------
// The dangerous shape is a mutation that COMPOUNDS. Uppercasing twice looks
// harmless; incrementing twice does not.
console.log('3) Non-idempotent mutation compounds across renders:');
const cart = { items: 2, total: 20 };
function ImpureTotal({ cart, shipping }) { cart.total += shipping; return `total ${cart.total}`; }
console.log('   render 1:', render(ImpureTotal, { cart, shipping: 5 }));
console.log('   render 2:', render(ImpureTotal, { cart, shipping: 5 }), '  ← the user was charged twice');
function PureTotal({ cart, shipping }) { return `total ${cart.total + shipping}`; }
const fresh = { items: 2, total: 20 };
console.log('   pure    :', render(PureTotal, { cart: fresh, shipping: 5 }), 'and again',
  render(PureTotal, { cart: fresh, shipping: 5 }), '\n');

// --- 4. mutation also defeats change detection ------------------------------
console.log('4) Mutation keeps the reference, so memoization skips the update:');
const memo = (Comp) => { let lastProps, lastResult;
  return (props) => {
    if (lastProps && Object.keys(props).every((k) => Object.is(lastProps[k], props[k]))) {
      return lastResult + '   (memo HIT — component never re-ran)';
    }
    lastProps = props; lastResult = Comp(props); return lastResult;
  };
};
const MemoRow = memo(({ user }) => `<li>${user.name}</li>`);
const user = { name: 'Ada' };
console.log('   first :', MemoRow({ user }));
user.name = 'Grace';                                   // mutation: same reference
console.log('   after mutating in place :', MemoRow({ user }));
console.log('   after replacing the object:', MemoRow({ user: { name: 'Grace' } }), '\n');

// --- 5. composition vs inheritance -----------------------------------------
// Inheritance: the subclass must know how the base renders in order to override it.
class BaseButton {
  render() { return `<button class="${this.className()}">${this.label()}</button>`; }
  className() { return 'btn'; }
  label() { return 'Click'; }
}
class DangerButtonOO extends BaseButton {
  className() { return 'btn danger'; }                 // fine — until the base renames className()
  label() { return 'Delete'; }
}
console.log('5) Inheritance — coupled to the base class\'s internal method names:');
console.log('   ', new DangerButtonOO().render());
console.log('   Add an icon slot to BaseButton and every subclass must be revisited.\n');

// React's answer: a generic component + props, plus children for the hole.
const Button = ({ variant = 'primary', children, ...rest }) =>
  `<button class="btn ${variant}"${rest.disabled ? ' disabled' : ''}>${children}</button>`;
const DangerButton = (props) => Button({ ...props, variant: 'danger' });   // specialisation
const Card = ({ title, children, footer }) =>
  `<section><h3>${title}</h3><div>${children}</div><footer>${footer}</footer></section>`;

console.log('   Composition — props for variants, children for structure:');
console.log('   ', DangerButton({ children: 'Delete', disabled: true }));
console.log('   ', Card({ title: 'Billing', children: '<table/>', footer: Button({ children: 'Save' }) }));
console.log('   Card knows nothing about a table or a button; it renders holes.');
console.log('   Shared LOGIC → custom hook. Shared MARKUP → component. Shared STRUCTURE → children.');
