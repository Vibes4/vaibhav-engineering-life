/* Front-end controller: builds the sidenav and loads each module's
   index.html (explanation) + index.js (runnable code) into the content pane.
   Also handles the persisted dark-mode toggle. */

const MODULES = {
  "Node.js Core": {
    folder: "node-specific",
    items: [
      ["globals",         "Globals & process",      "__dirname, process, argv, env"],
      ["modules",         "Modules: CJS vs ESM",    "require, module.exports, import"],
      ["event-loop",      "Event Loop & timers",    "phases, microtasks, nextTick"],
      ["events",          "EventEmitter",           "pub/sub, on/emit, memory leaks"],
      ["error-handling",  "Error handling",         "try/catch, callbacks, promises, process"],
      ["fs",              "File System (fs)",       "sync, callback, promises"],
      ["path",            "Path",                   "join, resolve, parse"],
      ["os",              "OS",                     "cpus, memory, platform"],
      ["streams",         "Streams",                "readable, writable, pipe, backpressure"],
      ["buffer",          "Buffer",                 "binary data, encodings"],
      ["http",            "HTTP (no framework)",    "createServer, routing by hand"],
      ["url-querystring", "URL & Query String",     "URL, URLSearchParams"],
      ["crypto",          "Crypto",                 "hash, hmac, encrypt, bcrypt vs sha"],
      ["util",            "Util",                   "promisify, inspect, types"],
      ["child-process",   "Child Process",          "spawn, exec, fork"],
      ["cluster",         "Cluster",                "multi-core scaling"],
      ["worker-threads",  "Worker Threads",         "CPU-bound parallelism"]
    ]
  },
  "Express.js": {
    folder: "express-specific",
    items: [
      ["basics",          "Express basics",         "app, listen, first route"],
      ["routing",         "Routing",                "methods, params, chaining"],
      ["middleware",      "Middleware",             "the heart of Express"],
      ["req-res",         "Request & Response",     "req object, res helpers"],
      ["static-files",    "Static files",           "express.static"],
      ["router",          "Router (modular)",       "express.Router(), mounting"],
      ["body-parsing",    "Body parsing",           "json, urlencoded, multipart"],
      ["error-handling",  "Error handling",         "4-arg middleware, async errors"],
      ["templating",      "Template engines",       "EJS / views / SSR"],
      ["rest-api",        "REST API design",        "CRUD, status codes, versioning"],
      ["validation",      "Validation & security",  "input validation, helmet, cors"],
      ["auth-jwt",        "Authentication (JWT)",   "sessions vs tokens, middleware"]
    ]
  },
  "NestJS": {
    folder: "nestjs",
    items: [
      ["overview",          "NestJS overview",         "what, why, architecture"],
      ["modules",           "Modules",                 "@Module, encapsulation"],
      ["controllers",       "Controllers",             "routing, decorators, params"],
      ["providers-di",      "Providers & DI",          "@Injectable, injection, scopes"],
      ["request-lifecycle", "Lifecycle features",      "middleware, guards, pipes, interceptors"],
      ["exception-filters", "Exception filters",       "centralized error handling"],
      ["features",          "Ecosystem & features",    "TypeORM, GraphQL, microservices"]
    ]
  },
  "MongoDB": {
    folder: "mongodb",
    items: [
      ["basics",          "MongoDB + Mongoose",     "schemas, queries, populate"],
      ["data-modeling",   "Data modeling",          "embed vs reference"],
      ["aggregation",     "Aggregation pipeline",   "$match, $group, $lookup"],
      ["indexing",        "Indexing & performance", "IXSCAN, ESR rule, explain"],
      ["transactions",    "Transactions",           "sessions, ACID, write concern"]
    ]
  },
  "SQL": {
    folder: "sql",
    items: [
      ["basics",            "SQL basics & pooling",   "pools, parameterized queries"],
      ["joins",             "Joins",                  "inner, left, right, full"],
      ["indexing",          "Indexing & tuning",      "B-tree, EXPLAIN ANALYZE"],
      ["transactions-acid", "Transactions & ACID",    "isolation levels, locking"],
      ["normalization",     "Normalization",          "1NF–3NF, when to denormalize"]
    ]
  },
  "Wrap-up": {
    folder: "express-specific",
    items: [
      ["why-express",     "Why Express over Node?", "what Express adds on top of node"]
    ]
  }
};

const navList = document.getElementById("nav-list");
const content = document.getElementById("content");
const search  = document.getElementById("search");

// Flat lookup: "folder/slug" is unique because slugs repeat across sections (e.g. "basics").
const flat = {};
const keyOf = (folder, slug) => `${folder}::${slug}`;

function buildNav() {
  navList.innerHTML = "";
  for (const [group, { folder, items }] of Object.entries(MODULES)) {
    const title = document.createElement("div");
    title.className = "nav-group-title";
    title.textContent = group;
    navList.appendChild(title);

    items.forEach(([slug, name, blurb]) => {
      const key = keyOf(folder, slug);
      flat[key] = { folder, slug, name, blurb };
      const a = document.createElement("a");
      a.className = "nav-item";
      a.dataset.key = key;
      a.href = "#" + key;
      a.innerHTML = `${name}<small>${blurb}</small>`;
      navList.appendChild(a);
    });
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

async function loadModule(key) {
  const meta = flat[key];
  if (!meta) return;

  document.querySelectorAll(".nav-item").forEach(el =>
    el.classList.toggle("active", el.dataset.key === key));

  const base = `${meta.folder}/${meta.slug}`;
  content.innerHTML = `<p class="placeholder">Loading ${meta.name}…</p>`;

  try {
    const [htmlRes, jsRes] = await Promise.all([
      fetch(`${base}/index.html`),
      fetch(`${base}/index.js`)
    ]);
    const explanation = await htmlRes.text();
    const code = jsRes.ok ? await jsRes.text() : "// (no index.js for this page)";

    const runCmd = `node ${base}/index.js`;
    const codeBlock = jsRes.ok ? `
      <h2>📄 Code — <code>${base}/index.js</code></h2>
      <div class="run-banner">
        <span># run it:</span> <span class="cmd-text">${runCmd}</span>
        <button class="copy-btn run-copy" onclick="copyRunCmd(this)" data-cmd="${runCmd}">Copy</button>
      </div>
      <div class="code-wrap">
        <div class="code-head">
          <span class="run-cmd">$ ${runCmd}</span>
        </div>
        <pre><code>${escapeHtml(code)}</code></pre>
      </div>` : "";

    content.innerHTML = explanation + codeBlock;
    content.scrollTop = 0;
  } catch (e) {
    content.innerHTML = `<div class="callout warn"><strong>Could not load module.</strong>
      Are you running through the server? Open a terminal here and run
      <code>npm install && npm start</code>, then visit
      <code>http://localhost:3000</code>. (Browsers block <code>fetch()</code> on <code>file://</code>.)</div>`;
  }
}

window.copyRunCmd = function (btn) {
  navigator.clipboard.writeText(btn.dataset.cmd).then(() => {
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = "Copy"), 1200);
  });
};

/* ---------- Dark mode ---------- */
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
function syncThemeIcon() {
  themeIcon.textContent = document.documentElement.classList.contains("dark") ? "☀️" : "🌙";
}
themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  try { localStorage.setItem("theme", isDark ? "dark" : "light"); } catch (e) {}
  syncThemeIcon();
});
syncThemeIcon();

/* ---------- Search ---------- */
search.addEventListener("input", () => {
  const q = search.value.toLowerCase();
  document.querySelectorAll(".nav-item").forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q) ? "" : "none";
  });
});

window.addEventListener("hashchange", () => {
  const key = decodeURIComponent(location.hash.slice(1));
  if (flat[key]) loadModule(key);
});

buildNav();
const initial = decodeURIComponent(location.hash.slice(1));
if (flat[initial]) loadModule(initial);
