// Run:  node react/ssr-rsc/index.js
//
// Three mechanisms, implemented instead of described:
//   (a) render a tree to HTML on the "server", then run a hydration pass that
//       walks the client tree and reports the EXACT node that mismatched;
//   (b) streaming SSR — flush the shell first, then each Suspense boundary as
//       its data resolves, with a real timeline;
//   (c) the client-bundle arithmetic behind "a Server Component ships zero JS".

let ENV = 'server';                                   // flipped before the client pass
const h = (tag, props, ...kids) => ({ tag, props: props || {}, kids: kids.flat() });

// --- a 20-line renderer: expand components, then serialize ------------------
function renderToTree(node) {
  if (node == null || node === false) return null;
  if (typeof node !== 'object') return String(node);
  if (typeof node.tag === 'function') return renderToTree(node.tag(node.props));
  return { tag: node.tag, kids: node.kids.map(renderToTree).filter((k) => k !== null) };
}
const toHTML = (t) => (typeof t === 'string' ? t : `<${t.tag}>${t.kids.map(toHTML).join('')}</${t.tag}>`);
const label = (n) => (n === undefined ? '(nothing)' : typeof n === 'string' ? `"${n}"` : `<${n.tag}>`);

// hydrate = compare what the client renders against the DOM the server sent
function findMismatch(server, client, path = '') {
  if (typeof server === 'string' || typeof client === 'string' || !server || !client) {
    return server === client ? null : { path: path || '(root)', server, client };
  }
  if (server.tag !== client.tag) return { path, server, client };
  const here = path ? `${path} > ${server.tag}` : server.tag;
  for (let i = 0; i < Math.max(server.kids.length, client.kids.length); i++) {
    const d = findMismatch(server.kids[i], client.kids[i], here);
    if (d) return d;
  }
  return null;
}

// --- (a) the mismatch -------------------------------------------------------
const TS = 1712345678901;
// The server formats in UTC; the browser formats in the visitor's timezone.
const stamp = () => new Date(TS + (ENV === 'server' ? 0 : 5.5 * 3600e3)).toISOString().slice(11, 19);

const Nav = () => h('nav', {}, 'Home', ' | ', 'Orders');
const Clock = () => h('p', {}, 'Last updated ', stamp());
const SafeClock = () => h('p', {}, 'Last updated ', '--');   // filled in by useEffect, client-only
const Page = (Body) => () => h('main', {}, h(Nav, {}), h('h1', {}, 'Orders'), h(Body, {}));

function hydrationRun(name, Body) {
  ENV = 'server';
  const serverTree = renderToTree(h(Page(Body), {}));
  console.log(`  ${name}`);
  console.log(`    server HTML: ${toHTML(serverTree)}`);
  ENV = 'client';
  const clientTree = renderToTree(h(Page(Body), {}));      // hydrateRoot re-renders the SAME tree
  const bad = findMismatch(serverTree, clientTree);
  if (!bad) return console.log('    hydration: clean — React adopts every DOM node as-is.\n');
  console.log(`    hydration MISMATCH at ${bad.path}`);
  console.log(`      server sent  ${label(bad.server)}`);
  console.log(`      client wants ${label(bad.client)}`);
  console.log('    React discards that subtree and re-renders it on the client.\n');
}

console.log('(a) Hydration: the client render must reproduce the server HTML\n');
hydrationRun('Clock uses the machine timezone (non-deterministic):', Clock);
hydrationRun('Deterministic first render, real value set in useEffect:', SafeClock);
console.log('  Same class of bug: Date.now(), Math.random(), window/localStorage reads,');
console.log('  locale formatting, invalid nesting the browser repairs, extension-injected DOM.\n');

// --- (b) streaming SSR ------------------------------------------------------
const SPEED = 10;                                    // run 10x faster than the "real" timings
const sleep = (ms) => new Promise((r) => setTimeout(r, ms / SPEED));
const boundaries = [
  { name: 'ProductDetails', ms: 120 },
  { name: 'Reviews',        ms: 900 },
  { name: 'Recommendations', ms: 1500 },
];

async function streamingDemo() {
  console.log('(b) Streaming SSR — <Suspense> boundaries are flush points\n');
  const t0 = Date.now();
  const at = () => String(Math.round((Date.now() - t0) * SPEED)).padStart(4);

  console.log(`  ${at()}ms  onShellReady -> flush <html><nav>...<h1> + 3 fallback skeletons`);
  console.log(`  ${at()}ms  FIRST PAINT: the user can read the page and scroll it`);
  await Promise.all(boundaries.map(async (b) => {
    await sleep(b.ms);
    console.log(`  ${at()}ms  flush chunk for <Suspense> "${b.name}" — inline script swaps out the skeleton`);
  }));
  const slowest = Math.max(...boundaries.map((b) => b.ms));
  console.log(`  ${at()}ms  stream closed\n`);
  console.log(`  renderToString would have sent NOTHING until ${slowest}ms (its slowest child),`);
  console.log('  so TTFB = slowest query. Streaming decouples first paint from slow data,');
  console.log('  and selective hydration lets React hydrate the boundary the user clicked FIRST,');
  console.log('  replaying the recorded click once that subtree is interactive.\n');
}

// --- (c) the zero-JS claim, in kilobytes -----------------------------------
const modules = {
  'react-dom (runtime)': 42, 'markdown-to-jsx': 38, 'highlight.js': 72,
  'date-fns': 18, 'prisma-client': 120, 'Post.jsx': 3, 'LikeButton.jsx': 2,
};
const components = [
  { name: 'PostBody  (Server Component)', server: true,
    imports: ['markdown-to-jsx', 'highlight.js', 'prisma-client', 'Post.jsx'] },
  { name: 'LikeButton (Client Component)', server: false,
    imports: ['date-fns', 'LikeButton.jsx'] },
];

function bundleDemo() {
  console.log('(c) What each component contributes to the CLIENT bundle\n');
  let total = modules['react-dom (runtime)'];
  for (const c of components) {
    const size = c.imports.reduce((n, m) => n + modules[m], 0);
    const shipped = c.server ? 0 : size;
    total += shipped;
    console.log(`  ${c.name}`);
    console.log(`    imports ${c.imports.join(', ')} = ${size}kB of code`);
    console.log(`    shipped to the browser: ${shipped}kB  ${c.server
      ? '(runs on the server, only its rendered output is serialized)'
      : "('use client' pulls the file AND its imports into the bundle)"}\n`);
  }
  console.log(`  client bundle = react-dom ${modules['react-dom (runtime)']}kB + client components = ${total}kB`);
  console.log('  The same page as an all-client SPA would ship every module above:',
    `${Object.values(modules).reduce((a, b) => a + b, 0)}kB.`);
  console.log('  That gap is the whole argument for RSC — and why you push \'use client\'');
  console.log('  down to the smallest interactive leaf instead of onto the page.');
}

(async () => {
  try {
    await streamingDemo();
    bundleDemo();
  } catch (err) {
    console.log('demo failed (caught so the process still exits 0):', err.message);
  }
})();
