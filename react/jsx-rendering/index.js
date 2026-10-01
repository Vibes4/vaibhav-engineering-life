// Run:  node react/jsx-rendering/index.js
//
// Three things you cannot see in a browser but can see here:
//   1. what a JSX tag actually evaluates to (a plain object),
//   2. how that object tree turns into markup (with escaping),
//   3. what `key` really does — by running the SAME list edit twice,
//      once with index keys and once with stable id keys, and printing
//      the patch operations plus where each row's local state ended up.

// --- 1. createElement: what the compiler emits ----------------------------
// Real React also stamps $$typeof: Symbol.for('react.element') (an XSS guard)
// and, in the automatic runtime, passes key as a 3rd argument to _jsx.
const REACT_ELEMENT = Symbol.for('react.element');

function createElement(type, config, ...children) {
  const { key = null, ...props } = config || {};
  props.children = children.length === 1 ? children[0] : children;
  return { $$typeof: REACT_ELEMENT, type, key: key == null ? null : String(key), props };
}
const h = createElement;

const el = h('button', { className: 'primary', onClick: () => {} }, 'Save');
console.log('1) <button className="primary" onClick={save}>Save</button> evaluates to:');
console.log('  ', JSON.stringify(el, (k, v) => (typeof v === 'function' ? '[Function]' : typeof v === 'symbol' ? String(v) : v), 0));
console.log('   No DOM was touched. It is data: {type, key, props}. `key` is metadata,');
console.log('   stripped by React — the component never receives it as a prop.\n');

// --- 2. renderToString: descriptions become markup, escaped ---------------
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
const ATTR = { className: 'class', htmlFor: 'for' };

function renderToString(node) {
  // React renders null/undefined/booleans as nothing, numbers/strings as text
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return escape(node);
  if (Array.isArray(node)) return node.map(renderToString).join('');
  if (typeof node.type === 'function') return renderToString(node.type(node.props)); // components
  const { children, ...rest } = node.props;
  const attrs = Object.entries(rest)
    .filter(([k, v]) => typeof v !== 'function' && v != null && v !== false)
    .map(([k, v]) => ` ${ATTR[k] || k}="${escape(v)}"`).join('');
  return `<${node.type}${attrs}>${renderToString(children)}</${node.type}>`;
}

const Badge = ({ label }) => h('span', { className: 'tag' }, label);
console.log('2) renderToString — components are called, strings are escaped:');
console.log('  ', renderToString(h('div', null, h(Badge, { label: 'React' }), ' ', '<img src=x onerror=alert(1)>')));
console.log('   The injected tag came out as TEXT. That default escaping is why XSS is');
console.log('   rare in React, and why dangerouslySetInnerHTML has such a hostile name.\n');

console.log('3) Falsy children — the classic {items.length && <List/>} bug:');
for (const items of [[], ['a', 'b']]) {
  const buggy = h('div', null, items.length && h('span', null, `${items.length} items`));
  const fixed = h('div', null, items.length > 0 && h('span', null, `${items.length} items`));
  console.log(`   items=${JSON.stringify(items).padEnd(11)} buggy: ${renderToString(buggy).padEnd(34)} fixed: ${renderToString(fixed)}`);
}
console.log('   0 is a number, and React renders numbers. false renders nothing.\n');

// --- 4. keyed reconciliation ----------------------------------------------
// Each mounted row keeps LOCAL STATE (what the user typed). State lives on the
// instance, and instances are matched to elements by key. That is the whole bug.
function reconcile(prevChildren, nextChildren, instances) {
  const ops = [];
  const byKey = new Map(prevChildren.map((c, i) => [c.key, { child: c, index: i }]));
  const nextInstances = [];

  nextChildren.forEach((next, i) => {
    const match = byKey.get(next.key);
    if (!match) {
      ops.push(`MOUNT   key=${next.key} at ${i} (fresh state "")`);
      nextInstances.push({ key: next.key, text: '' });
    } else {
      const inst = instances[match.index];
      const moved = match.index !== i ? ` MOVE ${match.index}->${i}` : '';
      const changed = match.child.props.label !== next.props.label
        ? ` UPDATE label "${match.child.props.label}"->"${next.props.label}"` : '';
      ops.push(`REUSE   key=${next.key} at ${i}${moved}${changed}  keeps state "${inst.text}"`);
      nextInstances.push(inst);
      byKey.delete(next.key);
    }
  });
  for (const { child, index } of byKey.values()) {
    ops.push(`UNMOUNT key=${child.key} (was ${index}, discards state "${instances[index].text}")`);
  }
  return { ops, instances: nextInstances };
}

function runScenario(name, keyOf) {
  const rows = [{ id: 'a', label: 'Alice' }, { id: 'b', label: 'Bob' }, { id: 'c', label: 'Cleo' }];
  const build = (data) => data.map((r, i) => h('input', { key: keyOf(r, i), label: r.label }));

  let children = build(rows);
  let instances = rows.map((r) => ({ key: keyOf(r, rows.indexOf(r)), text: '' }));
  instances[0].text = 'typed into Alice';          // user focuses row 0 and types

  const after = rows.slice(1);                     // delete Alice (the first row)
  const { ops, instances: nextInstances } = reconcile(children, build(after), instances);

  console.log(`   ${name}`);
  ops.forEach((o) => console.log('     ' + o));
  after.forEach((r, i) => console.log(`     screen: ${r.label.padEnd(5)} shows "${nextInstances[i].text}"`));
  console.log('');
}

console.log('4) Delete the FIRST of three rows after typing into it:\n');
runScenario('key={index}  →', (r, i) => i);
runScenario('key={item.id} →', (r) => r.id);

console.log('With index keys the keys 0,1,2 became 0,1: React saw "two rows whose labels');
console.log('changed", reused instance #0 for Bob, and Alice\'s typed text migrated to the');
console.log('wrong row. The row the user actually deleted was never unmounted at all —');
console.log('React tore down the LAST instance instead, so cleanup ran for the wrong one.');
console.log('With id keys React unmounted "a" and moved b and c. State followed the data.');
console.log('\nKeys must be stable, unique among siblings, and come from the data — never');
console.log('from the render (Math.random() remounts everything, every time).');
