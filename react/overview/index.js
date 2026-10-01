// Run:  node react/overview/index.js
//
// React's whole thesis is UI = f(state). To show why that is worth a runtime,
// we build the SAME little todo widget twice against a fake DOM that records
// every mutation: once imperatively (you write the transitions) and once
// declaratively (you re-describe the result, a diff computes the transition).
// The mutation logs are the lesson.

// --- a fake DOM that records every write ----------------------------------
function makeDom() {
  const log = [];
  return {
    tree: { list: [], counter: '', banner: '' },
    log,
    setCounter(v) { this.tree.counter = v; log.push(`SET counter = "${v}"`); },
    setBanner(v)  { this.tree.banner  = v; log.push(`SET banner  = "${v}"`); },
    insert(i, v)  { this.tree.list.splice(i, 0, v); log.push(`INSERT list[${i}] = "${v}"`); },
    remove(i)     { const [v] = this.tree.list.splice(i, 1); log.push(`REMOVE list[${i}] ("${v}")`); },
    replace(i, v) { this.tree.list[i] = v; log.push(`REPLACE list[${i}] = "${v}"`); },
  };
}

// --- 1. the imperative version --------------------------------------------
// Every mutation path must remember every derived value. Three paths x three
// derived values = nine places to keep in sync, by hand, forever.
function imperative() {
  const dom = makeDom();
  const todos = [];

  const add = (text) => {
    todos.push(text);
    dom.insert(todos.length - 1, text);
    dom.setCounter(`${todos.length} items`);
    dom.setBanner(todos.length ? '' : 'Nothing to do');
  };

  const rename = (i, text) => {
    todos[i] = text;
    dom.replace(i, text);
    dom.setCounter(`${todos.length} items`);   // pointless write: count did not change
    dom.setBanner(todos.length ? '' : 'Nothing to do');
  };

  const remove = (i) => {
    todos.splice(i, 1);
    dom.remove(i);
    // BUG: this path forgot the counter and the banner. Nothing crashes.
    // The screen simply disagrees with the data, and only on THIS path.
  };

  add('buy milk'); add('write tests'); rename(1, 'write GOOD tests'); remove(0); remove(0);
  return { dom, todos };
}

// --- 2. the declarative version -------------------------------------------
// render() is a pure function of state. Nobody writes a transition; a diff
// derives the minimal mutation list from two descriptions. This is React.
const render = (todos) => ({
  list: todos.slice(),
  counter: `${todos.length} items`,
  banner: todos.length ? '' : 'Nothing to do',
});

function commit(dom, prev, next) {
  // positional diff, deliberately naive — the real reconciler is keyed
  for (let i = 0; i < Math.max(prev.list.length, next.list.length); i++) {
    if (i >= next.list.length)      dom.remove(next.list.length);
    else if (i >= prev.list.length) dom.insert(i, next.list[i]);
    else if (prev.list[i] !== next.list[i]) dom.replace(i, next.list[i]);
  }
  if (prev.counter !== next.counter) dom.setCounter(next.counter);
  if (prev.banner  !== next.banner)  dom.setBanner(next.banner);
}

function declarative() {
  const dom = makeDom();
  let todos = [];
  let prev = { list: [], counter: '', banner: '' };
  const setState = (nextTodos) => {
    todos = nextTodos;
    const next = render(todos);     // re-describe EVERYTHING from state
    commit(dom, prev, next);        // React works out what actually changed
    prev = next;
  };

  setState(['buy milk']);
  setState(['buy milk', 'write tests']);
  setState(['buy milk', 'write GOOD tests']);
  setState(['write GOOD tests']);
  setState([]);
  return { dom, todos };
}

// --- 3. compare the two mutation logs -------------------------------------
const imp = imperative();
const dec = declarative();

console.log('IMPERATIVE — you write the transitions');
imp.dom.log.forEach((l) => console.log('   ' + l));
console.log(`   data:   ${JSON.stringify(imp.todos)}`);
console.log(`   screen: list=${JSON.stringify(imp.dom.tree.list)} counter="${imp.dom.tree.counter}" banner="${imp.dom.tree.banner}"`);
console.log(`   ${imp.dom.log.length} mutations, and the screen is ${JSON.stringify(imp.todos) === JSON.stringify(imp.dom.tree.list) && imp.dom.tree.counter === `${imp.todos.length} items` ? 'correct' : 'WRONG'}\n`);

console.log('DECLARATIVE — you describe the result, a diff derives the transition');
dec.dom.log.forEach((l) => console.log('   ' + l));
console.log(`   data:   ${JSON.stringify(dec.todos)}`);
console.log(`   screen: list=${JSON.stringify(dec.dom.tree.list)} counter="${dec.dom.tree.counter}" banner="${dec.dom.tree.banner}"`);
console.log(`   ${dec.dom.log.length} mutations, and the screen is ${JSON.stringify(dec.todos) === JSON.stringify(dec.dom.tree.list) && dec.dom.tree.counter === `${dec.todos.length} items` ? 'correct' : 'WRONG'}\n`);

// --- 4. why ----------------------------------------------------------------
console.log('Read the logs side by side:');
console.log('  * The imperative remove() path forgot the counter and the banner.');
console.log('    Nothing threw. The UI just quietly disagrees with the data, on one path only.');
console.log('  * The imperative rename() path over-writes the counter with the same value —');
console.log('    the mirror-image mistake, invisible until it costs a repaint or an animation.');
console.log('  * The declarative version cannot desynchronise: there IS no code path that');
console.log('    updates the list without re-deriving counter and banner from the same state.');
console.log('  * The diff still emits only what changed. Note it did emit an extra REPLACE');
console.log('    when the first row was deleted: this positional diff has no identity, so it');
console.log('    thinks row 0 changed text. That is precisely the problem `key` solves.');
console.log('\nThat trade is the entire pitch: N states x M update paths collapses into');
console.log('one pure render(state) plus one shared diff. The virtual DOM is not about raw');
console.log('speed — it is what makes "re-describe everything" affordable and predictable.');
