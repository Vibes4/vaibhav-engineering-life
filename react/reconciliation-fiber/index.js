// Run:  node react/reconciliation-fiber/index.js
//
// Reconciliation, made visible:
//   1. a keyed diff that emits real patch operations — the SAME reorder run
//      with index keys and with stable ids, so the extra work and the state
//      mismatch show up as data
//   2. type change tears the subtree down; same type keeps the instance
//   3. time slicing vs a blocking loop, printed as an interleaving
//
// Simplified vs React: no fiber alternates, no lanes bitmask, and React walks
// its list from both ends before falling back to a key map. The rules that
// decide insert/move/remove/update are the real ones.

// --- 1. keyed diff ---------------------------------------------------------
// A child: { key, type, data, state }  — `state` stands for useState/DOM state
//          (a half-typed input) that lives with the matched instance.
function diff(oldKids, newKids) {
  const ops = [];
  const oldByKey = new Map(oldKids.map((c, i) => [c.key, { c, i }]));
  let lastPlaced = 0;            // React's rule: only nodes that fall BEHIND get moved

  newKids.forEach((next, i) => {
    const hit = oldByKey.get(next.key);
    if (!hit) { ops.push(`MOUNT   ${next.data} at ${i} (fresh state)`); return; }
    oldByKey.delete(next.key);
    if (hit.c.type !== next.type) {                 // heuristic 1: type differs
      ops.push(`REPLACE ${hit.c.data} -> ${next.data} at ${i} (unmount + remount, state lost)`);
      return;
    }
    // heuristic 2: same type -> keep the instance, carry its state, patch props
    next.state = hit.c.state;
    if (hit.i < lastPlaced) ops.push(`MOVE    ${next.data} to position ${i}`);
    else lastPlaced = hit.i;                        // already in relative order, leave it
    if (hit.c.data !== next.data) ops.push(`UPDATE  slot ${i}: "${hit.c.data}" -> "${next.data}"`);
  });
  for (const { c, i } of oldByKey.values()) ops.push(`REMOVE  ${c.data} at ${i}`);
  return ops;
}

const items = [
  { id: 'a', label: 'Apple',  state: 'draft on Apple' },
  { id: 'b', label: 'Banana', state: '' },
  { id: 'c', label: 'Cherry', state: '' },
];
const reordered = [items[2], items[0], items[1]];   // Cherry moved to the front

const build = (list, keyFn) =>
  list.map((it, i) => ({ key: keyFn(it, i), type: 'Row', data: it.label, state: it.state }));

for (const [name, keyFn] of [['index keys', (_, i) => String(i)], ['stable ids', (it) => it.id]]) {
  const before = build(items, keyFn);
  const after = build(reordered, keyFn).map((c) => ({ ...c, state: '' }));  // state comes from the match
  const ops = diff(before, after);
  console.log(`1) Reorder [a,b,c] -> [c,a,b] with ${name}: ${ops.length} operation(s)`);
  ops.forEach((o) => console.log('     ' + o));
  const owner = after.find((c) => c.state)?.data ?? '(nobody)';
  console.log(`     the half-typed draft ended up on: ${owner}\n`);
}
console.log('   Index keys match by POSITION: every row is re-patched and the draft');
console.log('   follows slot 0 instead of Apple. Ids match by IDENTITY: nodes move,');
console.log('   no props are touched, and state stays with its own item.\n');

// --- 2. type change vs same type ------------------------------------------
console.log('2) Different type at the same position tears the subtree down');
let instanceId = 0;
const mounted = new Map();                          // stateNode identity + its local state
function render(pos, type, props) {
  const prev = mounted.get(pos);
  if (prev && prev.type === type) {
    prev.props = props;                             // same type: patch props, keep state
    console.log(`   ${type} at ${pos}: reused instance #${prev.id}, scroll=${prev.state.scroll}`);
    return prev;
  }
  if (prev) console.log(`   unmounting ${prev.type} #${prev.id} — cleanup runs, state discarded`);
  const node = { id: ++instanceId, type, props, state: { scroll: 0 } };
  mounted.set(pos, node);
  console.log(`   ${type} at ${pos}: MOUNTED instance #${node.id}, scroll=0`);
  return node;
}
const panel = render('slot', 'ReadOnly', { value: 1 });
panel.state.scroll = 240;                           // user scrolls
render('slot', 'ReadOnly', { value: 2 });           // prop change, same type
render('slot', 'EditForm', { value: 2 });           // type change
console.log('   Same trap: a component defined inside another gets a new function');
console.log('   identity every render, so its type differs and it remounts every time.\n');

// --- 3. time slicing -------------------------------------------------------
console.log('3) Time slicing — an interruptible unit-of-work loop');
const UNITS = 40, COST = 1.2, BUDGET = 5, INPUT_AT = 8;   // simulated ms
let clock = 0, seen = false;

console.log('   blocking (pre-Fiber stack reconciler): one uninterruptible recursion');
for (let u = 1; u <= UNITS; u++) {
  clock += COST;
  if (clock >= INPUT_AT && !seen) {                 // the keypress lands mid-render
    seen = true;
    console.log(`     t=${clock.toFixed(1)} keypress arrives — thread busy on unit ${u}, event queued`);
  }
}
console.log(`     t=${clock.toFixed(1)} render finished, keypress finally handled`);
console.log(`     → ${(clock - INPUT_AT).toFixed(1)}ms of input lag, one dropped frame\n`);

console.log('   sliced (Fiber + scheduler): yield whenever the budget is spent');
clock = 0; seen = false;
let done = 0, sliceStart = 0, lag = 0;
while (done < UNITS) {
  clock += COST; done++;
  if (clock - sliceStart >= BUDGET) {                        // shouldYield()
    if (!seen) console.log(`     t=${clock.toFixed(1)} yielded after unit ${done} — browser gets the thread`);
    if (clock >= INPUT_AT && !seen) {
      seen = true; lag = clock - INPUT_AT;
      console.log(`     t=${clock.toFixed(1)} SYNC LANE jumps the queue: keypress handled (${lag.toFixed(1)}ms lag)`);
      clock += 0.5;
      console.log(`     t=${clock.toFixed(1)} transition work resumes at unit ${done + 1}`);
    }
    sliceStart = clock;
  }
}
console.log(`     t=${clock.toFixed(1)} transition finished — ${(lag).toFixed(1)}ms lag instead of ${(UNITS * COST - INPUT_AT).toFixed(1)}ms`);
console.log('   Same total work, but the urgent update was not stuck behind it.');
console.log('   That is exactly what startTransition and useDeferredValue buy you —');
console.log('   priority, not speed. One 400ms component is still 400ms.');
