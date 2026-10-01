// Run:  node react/patterns/index.js
//
//   1. ONE piece of logic written three ways — HOC, render prop, custom hook —
//      run side by side, with line count and nesting depth measured from the
//      real source text so the readability argument is not hand-waving
//   2. error-boundary semantics: a render error is caught, an event-handler
//      error and an async error escape
//   3. a compound component whose child reads shared state with zero props
//
// No React: components are plain functions returning strings, and context is a
// stack the way React's provider stack works. The composition shapes are real.

// --- a 12-line context stack ----------------------------------------------
const stack = new Map();
const createContext = () => ({ id: Symbol('ctx') });
function provide(ctx, value, render) {
  const had = stack.has(ctx), prev = stack.get(ctx);
  stack.set(ctx, value);
  try { return render(); } finally { had ? stack.set(ctx, prev) : stack.delete(ctx); }
}
function useContext(ctx) {
  if (!stack.has(ctx)) throw new Error('useTabs must be used inside <Tabs>');
  return stack.get(ctx);
}

// --- 1. the same logic, three ways ----------------------------------------
const getUser  = () => ({ name: 'Ada' });
const getTheme = () => 'dark';
const getPage  = (items) => ({ rows: items.slice(0, 2), of: items.length });
const summary  = (user, theme, page) =>
  `${user.name} | ${theme} | showing ${page.rows.join(',')} of ${page.of}`;

let mounted = 0;   // every wrapper below is a real component in the tree

// (a) HOCs: wrappers that inject props
const withUser  = (C) => (p) => (mounted++, C({ ...p, user: getUser() }));
const withTheme = (C) => (p) => (mounted++, C({ ...p, theme: getTheme() }));
const withPage  = (C) => (p) => (mounted++, C({ ...p, page: getPage(p.items) }));

// (b) render props: components that call children with the value
const User  = ({ children }) => (mounted++, children(getUser()));
const Theme = ({ children }) => (mounted++, children(getTheme()));
const Page  = ({ items, children }) => (mounted++, children(getPage(items)));

// (c) custom hooks: plain function calls, no component in the tree
const useUser  = () => getUser();
const useTheme = () => getTheme();
const usePage  = (items) => getPage(items);

function hocVersion(items) {
  const Dashboard = ({ user, theme, page }) => summary(user, theme, page);
  const Wrapped = withUser(withTheme(withPage(Dashboard)));
  return Wrapped({ items });
}
function renderPropVersion(items) {
  return User({ children: (user) =>
    Theme({ children: (theme) =>
      Page({ items, children: (page) =>
        summary(user, theme, page) }) }) });
}
function hookVersion(items) {
  const user  = useUser();
  const theme = useTheme();
  const page  = usePage(items);
  return summary(user, theme, page);
}

const items = ['a', 'b', 'c', 'd'];
console.log('1) Three implementations of the same three concerns:');
for (const fn of [hocVersion, renderPropVersion, hookVersion]) {
  const src = fn.toString().split('\n');
  const depth = Math.max(...src.map((l) => Math.floor((l.match(/^ */)[0].length) / 2)));
  mounted = 0;
  const out = fn(items);
  console.log(`   ${fn.name.padEnd(18)} -> ${out}`);
  console.log(`   ${''.padEnd(18)}    ${src.length} lines, nesting depth ${depth}, ` +
              `${mounted} extra component(s) in the tree`);
}
console.log('   Identical output, three very different shapes. HOCs read flat but bury');
console.log('   three anonymous wrappers in the tree; render props keep the tree honest');
console.log('   and pay in nesting; hooks add neither. A fourth concern costs the hook');
console.log('   version one line and the other two a whole extra layer.\n');

console.log('   HOC-only failure — two wrappers injecting the same prop name:');
const withThemeA = (C) => (p) => C({ ...p, theme: 'light-from-A' });
const collided = withThemeA(withTheme(({ theme }) => theme));
console.log(`   withThemeA(withTheme(C)) -> "${collided({})}" — the inner HOC silently won.`);
console.log('   Hooks cannot collide: you name the variable at the call site.\n');

// --- 2. error boundary semantics -------------------------------------------
console.log('2) What an error boundary does and does not catch');
function ErrorBoundary(render) {
  try { return render(); }                        // getDerivedStateFromError path
  catch (err) { return `[fallback] boundary caught during render: "${err.message}"`; }
}

console.log('   ' + ErrorBoundary(() => { throw new Error('bad render'); }));
console.log('   ' + ErrorBoundary(() => 'healthy subtree rendered normally'));

const onClick = () => { throw new Error('handler blew up'); };
const view = ErrorBoundary(() => 'button rendered fine');
console.log(`   ${view}; now the user clicks:`);
try { onClick(); }                                 // runs OUTSIDE render — boundary is not on the stack
catch (err) { console.log(`   ESCAPED the boundary: "${err.message}" — handlers need try/catch`); }

(async () => {
  await Promise.resolve()
    .then(() => { throw new Error('fetch failed'); })
    .catch((err) => {
      console.log(`   ESCAPED the boundary: "${err.message}" — async has left the React stack`);
      // the fix: park it in state and re-throw during the next render
      const boundaryError = err;
      console.log('   ' + ErrorBoundary(() => { if (boundaryError) throw boundaryError; }));
      console.log('   (that re-throw is what react-error-boundary\'s showBoundary does)\n');
    });

  // --- 3. compound components --------------------------------------------
  console.log('3) Compound components — implicit state through context');
  const TabsCtx = createContext();
  const Tabs = (defaultValue, children) =>
    provide(TabsCtx, { active: defaultValue }, () => children.map((c) => c()).join('\n'));
  const Tab = (value, label) => {
    const { active } = useContext(TabsCtx);        // no props threaded down from Tabs
    return `     ${active === value ? '[x]' : '[ ]'} ${label}`;
  };
  const TabPanel = (value, body) => {
    const { active } = useContext(TabsCtx);
    return active === value ? `     ── ${body}` : '';
  };

  console.log(Tabs('billing', [
    () => Tab('profile', 'Profile'),
    () => Tab('billing', 'Billing'),
    () => TabPanel('billing', 'Invoices for March'),
  ]));
  console.log('   Tab was called with (value, label) only — "active" arrived through context.');
  console.log('   That is what lets consumers rearrange the markup freely.');

  try { Tab('profile', 'Orphan'); }                // rendered outside the provider
  catch (err) { console.log(`   Outside <Tabs>: "${err.message}" — always throw this, never crash on undefined.`); }
})();
