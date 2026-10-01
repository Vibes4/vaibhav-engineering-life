// Run:  node react/routing/index.js
//
// A router is two algorithms: COMPILE a path pattern into a matcher, and RANK
// the candidates so the most specific one wins. We implement both, using the
// same scoring weights React Router v6/v7 uses in `computeScore`, then resolve
// real URLs against a flat table and a nested one (the nested chain is exactly
// what each <Outlet /> renders).

// --- 1. compile "/users/:id/posts/:postId" and "/files/*" into a regex ------
function compile(pattern) {
  const params = [];
  const source = pattern
    .split('/')
    .filter(Boolean)
    .map((seg) => {
      if (seg === '*') { params.push('*'); return '/(.*)'; }            // splat: rest of path
      if (seg.startsWith(':')) { params.push(seg.slice(1)); return '/([^/]+)'; }
      return '/' + seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');          // static, escaped
    })
    .join('');
  return { regex: new RegExp('^' + (source || '/') + '/?$'), params };
}

function matchPath(pattern, pathname) {
  const { regex, params } = compile(pattern);
  const m = regex.exec(pathname);
  if (!m) return null;
  const out = {};
  params.forEach((name, i) => { out[name] = decodeURIComponent(m[i + 1]); }); // ALWAYS strings
  return out;
}

// --- 2. specificity scoring (React Router's real weights) -------------------
const STATIC = 10, DYNAMIC = 3, INDEX = 2, EMPTY = 1, SPLAT_PENALTY = -2;
const isSplat = (s) => s === '*';

function computeScore(path, index) {
  const segments = path.split('/');
  let score = segments.length;                       // more segments = more specific
  if (segments.some(isSplat)) score += SPLAT_PENALTY;
  if (index) score += INDEX;
  return segments.filter((s) => !isSplat(s)).reduce(
    (acc, s) => acc + (/^:\w+$/.test(s) ? DYNAMIC : s === '' ? EMPTY : STATIC), score);
}

// --- 3. resolve a FLAT table: rank once, then take the first match ----------
const flat = [
  { path: '/', el: 'Home' },
  { path: '/users', el: 'UserList' },
  { path: '/users/new', el: 'NewUser' },
  { path: '/users/:id', el: 'UserDetail' },
  { path: '/users/:id/posts/:postId', el: 'Post' },
  { path: '/files/*', el: 'FileBrowser' },
  { path: '*', el: 'NotFound' },
].map((r) => ({ ...r, score: computeScore(r.path) }))
 .sort((a, b) => b.score - a.score);                 // declaration order is IRRELEVANT in v6

console.log('1) Route table ranked by specificity (static 10 > dynamic 3 > splat -2)');
for (const r of flat) console.log(`   ${String(r.score).padStart(3)}  ${r.path.padEnd(26)} ${r.el}`);

console.log('\n2) Resolving URLs — the first route in ranked order that matches wins');
for (const url of ['/', '/users', '/users/new', '/users/7', '/users/7/posts/42',
                   '/files/docs/2024/q3.pdf', '/nope/at/all']) {
  const hit = flat.map((r) => ({ r, params: matchPath(r.path, url) })).find((x) => x.params);
  const p = JSON.stringify(hit.params);
  console.log(`   ${url.padEnd(26)} -> ${hit.r.el.padEnd(12)} pattern ${hit.r.path.padEnd(22)} params ${p}`);
}
console.log('   note /users/new beat /users/:id purely on score, not on where it was written.');

// --- 4. a NESTED table: flatten to branches, then match the whole chain -----
const nested = [
  { path: '/', el: 'RootLayout', children: [
      { index: true, el: 'Home' },
      { path: 'login', el: 'Login' },
      { el: 'RequireAuth', children: [                    // pathless LAYOUT route = a guard
          { path: 'dashboard', el: 'DashLayout', children: [
              { index: true, el: 'Overview' },
              { path: 'reports/:reportId', el: 'Report' },
          ]},
      ]},
      { path: '*', el: 'NotFound' },
  ]},
];

function flatten(routes, parentPath = '', parentChain = []) {
  const branches = [];
  for (const route of routes) {
    const path = [parentPath, route.path ?? ''].filter(Boolean).join('/').replace(/\/+/g, '/');
    const chain = [...parentChain, route];
    if (route.children) branches.push(...flatten(route.children, path, chain));
    if (route.el && !route.children) branches.push({ path: path || '/', chain, score: computeScore(path || '/', route.index) });
  }
  return branches.sort((a, b) => b.score - a.score);
}

const branches = flatten(nested);
console.log('\n3) Nested routes — one URL matches a CHAIN; every parent renders an <Outlet/>');
for (const url of ['/', '/login', '/dashboard', '/dashboard/reports/2024-q3', '/whatever']) {
  const hit = branches.map((b) => ({ b, params: matchPath(b.path, url) })).find((x) => x.params);
  const names = hit.b.chain.map((r) => r.el);
  console.log(`   ${url.padEnd(26)} -> ${names.join(' > ')}`);
  console.log(`   ${''.padEnd(29)} leaf params ${JSON.stringify(hit.params)}`);
}
console.log('   RequireAuth is pathless: it adds no URL segment but wraps everything below it,');
console.log('   which is how a whole section is guarded with one route entry.');

// --- 5. the deep-link 404, in one line -------------------------------------
console.log('\n4) Why /dashboard/reports/2024-q3 404s on a hard refresh');
const filesOnDisk = new Set(['/index.html', '/assets/app.js']);
for (const req of ['/assets/app.js', '/dashboard/reports/2024-q3']) {
  const served = filesOnDisk.has(req) ? req : '404 — unless the server falls back to /index.html';
  console.log(`   GET ${req.padEnd(30)} -> ${served}`);
}
console.log('   The route table above lives in the JS bundle, so it cannot help until');
console.log('   index.html is served and booted. That fallback IS the fix.');

// --- 6. params are strings, and a table with no catch-all has no answer ----
console.log('\n5) Two traps');
const { id } = matchPath('/users/:id', '/users/7');
console.log(`   params are ALWAYS strings: id === 7 is ${id === 7}, Number(id) === 7 is ${Number(id) === 7}`);
try {
  const noCatchAll = [{ path: '/users/:id', el: 'UserDetail' }];
  const url = '/settings';
  const hit = noCatchAll.find((r) => matchPath(r.path, url));
  if (!hit) throw new Error(`no route matched ${url}`);
} catch (err) {
  console.log(`   ${err.message} -> React Router renders nothing at all.`);
  console.log('   Always ship a <Route path="*" element={<NotFound />} /> as the last resort.');
}
