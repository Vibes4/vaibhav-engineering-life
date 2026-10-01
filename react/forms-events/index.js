// Run:  node react/forms-events/index.js
//
// Three simulations, zero dependencies:
//   1. the DOM event path — capture down, target, bubble up — and what
//      stopPropagation() actually truncates.
//   2. a controlled input vs an uncontrolled one, counting renders for 10 keystrokes.
//   3. a validation reducer with ONE status field, driven through a real submit.

// --- 1. the event path ------------------------------------------------------
// Real tree: root container (where React 17+ delegates) > form > fieldset > input.
const PATH = ['root', 'form', 'fieldset', 'input'];

function dispatchEvent(handlers, stopAt = null) {
  // handlers: { 'form:capture': fn, 'input:bubble': fn, ... }
  const log = [];
  let stopped = false;
  const fire = (node, phase) => {
    if (stopped) return;
    const key = `${node}:${phase}`;
    if (handlers[key]) log.push(key);
    if (stopAt === key) { stopped = true; log.push('   ⟂ stopPropagation() — path truncated here'); }
  };
  PATH.forEach((n) => fire(n, 'capture'));                    // capture: root -> target
  fire(PATH[PATH.length - 1], 'target');                      // at the target
  [...PATH].reverse().slice(1).forEach((n) => fire(n, 'bubble'));  // bubble: target -> root
  return log;
}

const handlers = {
  'root:capture': 1, 'form:capture': 1, 'fieldset:capture': 1, 'input:capture': 1,
  'input:target': 1,
  'fieldset:bubble': 1, 'form:bubble': 1, 'root:bubble': 1,
};

console.log('=== 1. Event propagation ===\n');
console.log('Full path (onClickCapture runs top-down, onClick bottom-up):');
dispatchEvent(handlers).forEach((l) => console.log('   ' + l));
console.log('\nSame click, but fieldset calls e.stopPropagation() in the bubble phase:');
dispatchEvent(handlers, 'fieldset:bubble').forEach((l) => console.log('   ' + l));
console.log('\n   -> form and root never hear it. This is how a dropdown stops a');
console.log('      document-level "click outside to close" handler.');
console.log('   -> A capture handler on `form` would still have run: capture happens BEFORE');
console.log('      any child can cancel. That is why analytics belongs in the capture phase.\n');

// --- 2. controlled vs uncontrolled ------------------------------------------
console.log('=== 2. Controlled vs uncontrolled: 10 keystrokes ===\n');

function controlledInput(keys) {
  let state = '';                      // React owns the value
  let renders = 1;                     // initial render
  for (const k of keys) {
    state = state + k;                 // setState(e.target.value)
    renders++;                         // ...schedules a re-render of the owner
  }
  return { value: state, renders, reads: 'any time, during render' };
}

function uncontrolledInput(keys) {
  const dom = { value: '' };           // the DOM node owns the value
  let renders = 1;
  for (const k of keys) dom.value += k;   // browser mutates the node; React is unaware
  const readOnSubmit = dom.value;         // ref.current.value — one read, at submit
  return { value: readOnSubmit, renders, reads: 'only via a ref / FormData' };
}

const keys = 'ada@bar.io'.split('');
const c = controlledInput(keys);
const u = uncontrolledInput(keys);
console.log(`controlled   value="${c.value}"  renders=${c.renders}   read: ${c.reads}`);
console.log(`uncontrolled value="${u.value}"  renders=${u.renders}   read: ${u.reads}`);
console.log(`\n   ${c.renders - u.renders} extra renders for 10 characters — per field.`);
console.log('   Invisible on a 3-field form; measurable on a 60-field one. That trade is');
console.log('   exactly why react-hook-form registers inputs uncontrolled and lets');
console.log('   components subscribe to just the slice they render.\n');

// --- 3. a validation reducer with ONE status field --------------------------
console.log('=== 3. Validation reducer (one status, not three booleans) ===\n');

const rules = {
  email:    (v) => (/^\S+@\S+\.\S+$/.test(v) ? undefined : 'Enter a valid email'),
  password: (v) => (v.length >= 8 ? undefined : 'At least 8 characters'),
};
const validateAll = (values) =>
  Object.fromEntries(Object.entries(rules)
    .map(([k, fn]) => [k, fn(values[k] ?? '')])
    .filter(([, e]) => e));

const init = { values: { email: '', password: '' }, errors: {}, touched: {}, status: 'editing' };

function reducer(state, action) {
  switch (action.type) {
    case 'change': {
      const values = { ...state.values, [action.name]: action.value };
      // Re-validate live ONLY once the field has been touched or a submit failed.
      const live = state.touched[action.name] || state.status === 'error';
      const errors = { ...state.errors };
      if (live) { const e = rules[action.name](action.value); e ? errors[action.name] = e : delete errors[action.name]; }
      return { ...state, values, errors, status: state.status === 'success' ? 'editing' : state.status };
    }
    case 'blur': {
      const errors = { ...state.errors };
      const e = rules[action.name](state.values[action.name]);
      e ? errors[action.name] = e : delete errors[action.name];
      return { ...state, touched: { ...state.touched, [action.name]: true }, errors };
    }
    case 'submit': {
      const errors = validateAll(state.values);
      // Every field counts as touched on submit — that is the only moment you may
      // show an error for a field the user never visited.
      const touched = { email: true, password: true };
      return Object.keys(errors).length
        ? { ...state, errors, touched, status: 'error' }
        : { ...state, errors: {}, touched, status: 'submitting' };
    }
    case 'serverError': return { ...state, status: 'error', errors: { form: action.message } };
    case 'success':     return { ...state, status: 'success', errors: {} };
    default: return state;
  }
}

const show = (s, label) =>
  console.log(`   ${label.padEnd(34)} status=${s.status.padEnd(10)} errors=${JSON.stringify(s.errors)}`);

let s = init;
show(s, 'initial');
s = reducer(s, { type: 'change', name: 'email', value: 'a' });   show(s, 'types "a" (untouched: silent)');
s = reducer(s, { type: 'blur',  name: 'email' });                show(s, 'blurs email');
s = reducer(s, { type: 'change', name: 'email', value: 'a@b.io' }); show(s, 'fixes it (touched: live clear)');
s = reducer(s, { type: 'submit' });                              show(s, 'submits with empty password');
s = reducer(s, { type: 'change', name: 'password', value: 'hunter2!' }); show(s, 'fills password');
s = reducer(s, { type: 'submit' });                              show(s, 'submits again');
s = reducer(s, { type: 'serverError', message: 'Email already registered' }); show(s, 'server rejects');
s = reducer(s, { type: 'change', name: 'email', value: 'c@d.io' }); show(s, 'edits after server error');
s = reducer(s, { type: 'submit' });                              show(s, 'submits');
s = reducer(s, { type: 'success' });                             show(s, 'server accepts');

console.log('\n   `status` is a single string, so isSubmitting+isError can never both be true.');
console.log('   Errors appear on blur or submit, and clear live once a field is touched —');
console.log('   validating every keystroke from the first character just shouts at the user.');
