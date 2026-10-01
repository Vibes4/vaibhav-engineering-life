/* Front-end controller: builds the sidenav and loads each module's
   index.html (explanation) + index.js (runnable code) into the content pane.
   Also handles the persisted dark-mode toggle. */

const MODULES = {
  "EY GDS — Cloud Native (AWS)": {
    folder: "interviews", divider: "Interviews",
    items: [
      ["ey-playbook",              "① Interview playbook",        "round structure, answer shape, opening script"],
      ["ey-aws-compute-storage",   "② AWS: Compute & Storage",    "EC2 · EKS · Lambda · S3 · ASG · Spot"],
      ["ey-aws-data",              "③ AWS: RDS & DynamoDB",       "Multi-AZ, replicas, partition keys, GSI"],
      ["ey-aws-network-security",  "④ AWS: VPC, IAM & Security",  "subnets, SG vs NACL, roles, secrets"],
      ["ey-aws-integration",       "⑤ AWS: API GW, SQS, SNS",     "event-driven, idempotency, DLQ, saga"],
      ["ey-nodejs",                "⑥ Node.js & TypeScript",      "event loop, streams, errors, memory, TS"],
      ["ey-microservices",         "⑦ Microservices & APIs",      "boundaries, REST design, resiliency, observability"],
      ["ey-iac-cicd",              "⑧ IaC, CI/CD & Testing",      "Terraform vs CFN, state, drift, pipelines"],
      ["ey-wellarchitected-cost",  "⑨ Well-Architected & Cost",   "6 pillars, DR, security, cost levers"],
      ["ey-scenarios",             "⑩ Scenario & Design round",   "order system, debug slow API, migration"],
      ["ey-behavioural",           "⑪ Behavioural & HR",          "STAR stories, why EY, managerial round"],
      ["ey-rapid-fire",            "⑫ 60-min rapid revision",     "one-liner drill — read this last"]
    ]
  },
  "JavaScript": {
    folder: "javascript", divider: "Language & Frameworks",
    items: [
      ["types-coercion",       "Types & coercion",       "==, ===, typeof, NaN, falsy"],
      ["scope-hoisting",       "Scope & hoisting",       "var/let/const, TDZ, blocks"],
      ["closures",             "Closures",               "lexical scope, data privacy"],
      ["this-binding",         "this & binding",         "call, apply, bind, arrow"],
      ["prototypes",           "Prototypes & classes",   "proto chain, inheritance"],
      ["async",                "Promises & async/await", "microtasks, error handling"],
      ["array-methods",        "Array & object methods", "map, filter, reduce, spread"],
      ["es-features",          "Modern JS (ES6+)",       "destructuring, optional chaining"],
      ["iterators-generators", "Iterators & generators", "Symbol.iterator, yield"]
    ]
  },
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
  "React": {
    folder: "react",
    items: [
      ["overview",             "React overview",          "declarative UI, VDOM, why React"],
      ["jsx-rendering",        "JSX & rendering",         "elements, lists, keys, conditionals"],
      ["components-props",     "Components & props",      "composition, purity, one-way data"],
      ["state",                "State & useState",        "batching, immutability, snapshots"],
      ["effects",              "useEffect & lifecycle",   "deps, cleanup, StrictMode"],
      ["hooks",                "Hooks: rules, refs, memo","call order, useRef, useMemo, custom"],
      ["advanced-hooks",       "Advanced hooks",          "useReducer, transitions, external stores"],
      ["context-state",        "Context & state mgmt",    "prop drilling, Redux vs Zustand vs Query"],
      ["forms-events",         "Forms & events",          "controlled vs uncontrolled, synthetic"],
      ["data-fetching",        "Data fetching",           "race conditions, caching, React Query"],
      ["performance",          "Performance & re-renders","memo, profiling, virtualization"],
      ["reconciliation-fiber", "Reconciliation & Fiber",  "diffing, keys, render vs commit"],
      ["patterns",             "Component patterns",      "error boundaries, portals, HOC, hooks"],
      ["routing",              "Routing (React Router)",  "nested routes, params, loaders"],
      ["testing",              "Testing React",           "RTL queries, user-event, MSW"],
      ["ssr-rsc",              "SSR, hydration & RSC",    "CSR/SSR/SSG, streaming, server components"]
    ]
  },
  "SQL": {
    folder: "sql", divider: "Data & Storage",
    items: [
      ["basics",            "SQL basics & pooling",   "pools, parameterized queries"],
      ["joins",             "Joins",                  "inner, left, right, full"],
      ["indexing",          "Indexing & tuning",      "B-tree, EXPLAIN ANALYZE"],
      ["transactions-acid", "Transactions & ACID",    "isolation levels, locking"],
      ["normalization",     "Normalization",          "1NF–3NF, when to denormalize"]
    ]
  },
  "MongoDB (Mongoose)": {
    folder: "mongodb",
    items: [
      ["basics",          "MongoDB + Mongoose",     "schemas, queries, populate"],
      ["data-modeling",   "Data modeling",          "embed vs reference"],
      ["aggregation",     "Aggregation pipeline",   "$match, $group, $lookup"],
      ["indexing",        "Indexing & performance", "IXSCAN, ESR rule, explain"],
      ["transactions",    "Transactions",           "sessions, ACID, write concern"]
    ]
  },
  "Datastore Internals": {
    folder: "mastery",
    items: [
      ["mongodb",       "MongoDB internals",  "replica sets, sharding, WiredTiger, oplog"],
      ["redis",         "Redis",              "single-thread, persistence, cluster"],
      ["elasticsearch", "Elasticsearch",      "inverted index, CRUD, pagination types"]
    ]
  },
  "Networking": {
    folder: "mastery", divider: "Networking",
    items: [
      ["networking",      "Networking overview",      "TCP/TLS/HTTP, DNS, load balancing"],
      ["tls",             "TLS / SSL",                "handshake, certs, mTLS, ciphers"],
      ["dns",             "DNS",                      "resolution, records, anycast, DNSSEC"],
      ["http",            "HTTP/1.1 · 2 · 3 · QUIC",  "multiplexing, HOL blocking, caching"],
      ["load-balancing",  "Load Balancing & Proxies", "L4/L7, algorithms, health checks"]
    ]
  },
  "Distributed Theory": {
    folder: "mastery", divider: "Distributed Systems",
    items: [
      ["distributed-systems", "Distributed Systems",  "CAP, consensus, consistency, clocks"],
      ["concurrency",         "Concurrency & Async",  "event loop, locks, races, CAS"]
    ]
  },
  "Messaging & Streaming": {
    folder: "mastery",
    items: [
      ["kafka",     "Kafka",     "partitions, ISR, consumer groups, lag"],
      ["rabbitmq",  "RabbitMQ",  "exchanges, acks, DLQ, backpressure"]
    ]
  },
  "Cloud & Infrastructure": {
    folder: "mastery", divider: "Cloud & Infrastructure",
    items: [
      ["cloud",           "Cloud",                     "compute, storage, networking, IAM"],
      ["cloud-providers", "Cloud: AWS vs Azure vs GCP","service equivalents + unique features"],
      ["infrastructure",  "Infrastructure",            "containers, IaC, CI/CD, service mesh"],
      ["kubernetes",      "Kubernetes",                "pods, controllers, scheduling, probes"]
    ]
  },
  "Reliability, Security & Ops": {
    folder: "mastery", divider: "Reliability, Security & Ops",
    items: [
      ["observability",          "Observability",            "metrics, logs, traces, OTel, SLO"],
      ["rate-limiting",          "Rate Limiting & Resiliency","token bucket, breakers, backoff"],
      ["auth",                   "Auth · OAuth2 / OIDC / JWT","tokens, flows, sessions, RBAC"],
      ["performance-engineering","Performance Engineering",  "latency, throughput, profiling, p99"],
      ["production-scenarios",   "Production Scenarios",     "incidents: RCA, debugging, prevention"]
    ]
  },
  "System Design — Building Blocks": {
    folder: "system-design", divider: "System Design — Patterns",
    items: [
      ["fundamentals",         "SD fundamentals",      "scalability, CAP, load balancing"],
      ["caching",              "Caching & Redis",      "patterns, eviction, invalidation"],
      ["message-queues",       "Message queues",       "Kafka, RabbitMQ, async work"],
      ["url-shortener",        "URL shortener",        "base62, hashing, scale"],
      ["chat-system",          "Chat system",          "websockets, fan-out, presence"],
      ["notification-service", "Notification service", "push/email, queues, retries"],
      ["file-upload",          "File upload service",  "chunking, presigned URLs"]
    ]
  },
  "Case Studies": {
    folder: "system-design/case-studies", collapsed: true, divider: "System Design — Case Studies",
    items: [
      ["reddit",              "How Reddit Works",              "hot ranking, votes, read-heavy"],
      ["airbnb",              "How Airbnb Works",              "geo+date search, no double-booking"],
      ["twitter-timeline",    "How Twitter Timeline Works",    "fan-out on write vs read"],
      ["slack",               "How Slack Works",               "websockets, channel fan-out, presence"],
      ["google-docs",         "How Google Docs Works",         "OT/CRDT collaborative editing"],
      ["bluesky",             "How Bluesky Works",             "AT Protocol, feed generators"],
      ["stock-exchange",      "How the Stock Exchange Works",  "order book, price-time matching"],
      ["payment-system",      "How a Payment System Works",    "idempotency, double-entry ledger"],
      ["spotify",             "How Spotify Works",             "CDN streaming, adaptive bitrate"],
      ["tinder",              "How Tinder Works",              "geo proximity, mutual match"],
      ["uber-nearby-drivers", "How Uber Finds Drivers",        "geohash/quadtree proximity"],
      ["youtube",             "How YouTube Works",             "transcode ladder, CDN, ABR"],
      ["whatsapp",            "How WhatsApp Works",            "E2E encryption, delivery receipts"],
      ["airtag",              "How Apple AirTag Works",        "Find My network, rotating keys"],
      ["s3",                  "How AWS S3 Works",              "object storage, consistent hashing"],
      ["lambda",              "How AWS Lambda Works",          "serverless, cold starts, scaling"],
      ["chatgpt",             "How LLMs Like ChatGPT Work",    "tokens, autoregression, sampling"]
    ]
  },
  "AWS — Compute & Containers": {
    link: "aws.html#service/", divider: "AWS Services", collapsed: true,
    items: [
      ["ec2",    "EC2",    "virtual machines · ASG · instance roles"],
      ["ecs",    "ECS",    "containers on Fargate behind the ALB"],
      ["lambda", "Lambda", "serverless functions · event handlers"],
      ["ecr",    "ECR",    "private container image registry"]
    ]
  },
  "AWS — Identity & Security": {
    link: "aws.html#service/", collapsed: true,
    items: [
      ["iam",             "IAM",             "users · groups · roles · policies"],
      ["security-groups", "Security Groups", "stateful firewall · SG chain"],
      ["authorization",   "Authorization",   "end-user AuthN/AuthZ · JWT · Cognito"],
      ["nacl",            "NACL",            "stateless subnet firewall"]
    ]
  },
  "AWS — Networking": {
    link: "aws.html#service/", collapsed: true,
    items: [
      ["vpc",          "VPC",                 "your isolated network"],
      ["cidr",         "CIDR",                "/16, /24, IP planning"],
      ["subnets",      "Subnets",             "public · private app · private DB"],
      ["route-tables", "Route Tables",        "0.0.0.0/0 → IGW / NAT"],
      ["igw",          "Internet Gateway",    "VPC ↔ internet door"],
      ["nat-gateway",  "NAT Gateway",         "outbound-only internet for private subnets"],
      ["alb",          "ALB",                 "Layer 7 load balancer"],
      ["nlb",          "NLB",                 "Layer 4 load balancer · static IPs"],
      ["api-gateway",  "API Gateway",         "managed API front door → Lambda"],
      ["cloudfront",   "CloudFront / CDN",    "global edge cache + TLS + WAF"]
    ]
  },
  "AWS — Integration & Scaling": {
    link: "aws.html#service/", collapsed: true,
    items: [
      ["step-functions", "Step Functions", "workflows · sagas · retries"],
      ["sqs",            "SQS",            "queues · DLQ · workers"],
      ["sns",            "SNS",            "pub/sub · fan-out · notifications"],
      ["eventbridge",    "EventBridge",    "event bus · rules · targets"],
      ["auto-scaling",   "Auto Scaling",   "ECS service scaling · EC2 ASG"]
    ]
  },
  "AWS — Data, Storage & Monitoring": {
    link: "aws.html#service/", collapsed: true,
    items: [
      ["rds",        "RDS",        "managed PostgreSQL/MySQL · Multi-AZ"],
      ["dynamodb",   "DynamoDB",   "serverless key/value · carts · sessions"],
      ["s3",         "S3",         "object storage · static site · images"],
      ["cloudwatch", "CloudWatch", "metrics · logs · alarms · dashboards"]
    ]
  },
  "Exercises": {
    folder: "exercises", collapsed: true, divider: "Practice · Requirements",
    items: [
      ["url-shortener",        "URL Shortener",        "FR + NFR spec"],
      ["whatsapp",             "WhatsApp",             "FR + NFR spec"],
      ["uber",                 "Uber",                 "FR + NFR spec"],
      ["youtube",              "YouTube",              "FR + NFR spec"],
      ["instagram",            "Instagram",            "FR + NFR spec"],
      ["google-drive",         "Google Drive",         "FR + NFR spec"],
      ["dropbox",              "Dropbox",              "FR + NFR spec"],
      ["netflix",              "Netflix",              "FR + NFR spec"],
      ["amazon-cart",          "Amazon Cart",          "FR + NFR spec"],
      ["notification-service", "Notification Service", "FR + NFR spec"],
      ["chat-system",          "Chat System",          "FR + NFR spec"],
      ["rate-limiter",         "Rate Limiter",         "FR + NFR spec"],
      ["search-engine",        "Search Engine",        "FR + NFR spec"],
      ["payment-gateway",      "Payment Gateway",      "FR + NFR spec"],
      ["ticket-booking",       "Ticket Booking",       "FR + NFR spec"],
      ["food-delivery",        "Food Delivery",        "FR + NFR spec"],
      ["news-feed",            "News Feed",            "FR + NFR spec"],
      ["distributed-cache",    "Distributed Cache",    "FR + NFR spec"],
      ["metrics-system",       "Metrics System",       "FR + NFR spec"],
      ["logging-platform",     "Logging Platform",     "FR + NFR spec"]
    ]
  }
};

const navList = document.getElementById("nav-list");
const content = document.getElementById("content");
const search  = document.getElementById("search");

// Flat lookup: "folder/slug" is unique because slugs repeat across sections (e.g. "basics").
const flat = {};
const keyOf = (folder, slug) => `${folder}::${slug}`;

function renderItems(parent, { folder, items, link }) {
  items.forEach(([slug, name, blurb]) => {
    const a = document.createElement("a");
    a.className = "nav-item";
    if (link) {
      // External page (e.g. the AWS Services designer): plain link, no in-page loading.
      a.href = link + slug;
      a.innerHTML = `${name}<small>${blurb}</small>`;
      parent.appendChild(a);
      return;
    }
    const key = keyOf(folder, slug);
    flat[key] = { folder, slug, name, blurb };
    a.dataset.key = key;
    a.href = "#" + key;
    a.innerHTML = `${name}<small>${blurb}</small>`;
    parent.appendChild(a);
  });
}

function renderGroupInto(parent, [group, def]) {
  const details = document.createElement("details");
  details.className = "nav-group";
  details.open = !def.collapsed;               // collapsed groups start closed
  details._defaultOpen = details.open;         // remembered so search-clear can restore it
  const summary = document.createElement("summary");
  summary.className = "nav-group-title";
  summary.textContent = group;
  details.appendChild(summary);
  renderItems(details, def);
  parent.appendChild(details);
}

function buildNav() {
  navList.innerHTML = "";

  // A `divider` starts a new collapsible MEGA-section that owns every group
  // declared after it (until the next divider). Groups before the first divider
  // stay "loose" at the top of the nav (the core curriculum).
  const looseGroups = [];
  const sections = [];          // { title, groups: [[name, def], ...] }
  let current = null;
  for (const entry of Object.entries(MODULES)) {
    if (entry[1].divider) { current = { title: entry[1].divider, groups: [] }; sections.push(current); }
    (current ? current.groups : looseGroups).push(entry);
  }

  looseGroups.forEach(entry => renderGroupInto(navList, entry));

  sections.forEach(sec => {
    const wrap = document.createElement("details");
    wrap.className = "nav-divider-group";
    const single = sec.groups.length === 1;
    // single-group section inherits that group's collapsed flag; multi-group opens by default
    wrap.open = single ? !sec.groups[0][1].collapsed : true;
    wrap._defaultOpen = wrap.open;

    const sum = document.createElement("summary");
    sum.className = "nav-section-divider";
    sum.textContent = sec.title;
    wrap.appendChild(sum);

    // For a lone group the inner title would just echo the section label, so
    // render its items directly; multi-group sections keep their sub-headers.
    if (single) renderItems(wrap, sec.groups[0][1]);
    else sec.groups.forEach(entry => renderGroupInto(wrap, entry));

    navList.appendChild(wrap);
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

/* Turn each <h2> "major concept" + the content that follows it into a
   collapsible <details class="acc"> panel (open by default, click to close).
   The <h1>/intro stay as a fixed header; the .interview Q&A card is left
   untouched (it already has its own per-question accordions). */
function groupIntoAccordions(root) {
  const nodes = Array.from(root.childNodes);
  const frag = document.createDocumentFragment();
  let body = null; // current open panel's body, or null when outside a panel

  const openPanel = (summaryHTML) => {
    const d = document.createElement("details");
    d.className = "acc";
    d.open = true;
    const s = document.createElement("summary");
    s.innerHTML = summaryHTML;
    body = document.createElement("div");
    body.className = "acc-body";
    d.append(s, body);
    frag.appendChild(d);
  };

  nodes.forEach(node => {
    const el = node.nodeType === 1 ? node : null;
    if (el && el.tagName === "H2") {            // start a new collapsible concept
      openPanel(el.innerHTML);
      return;
    }
    if (el && el.classList.contains("interview")) {  // leave the Q&A card standalone
      body = null;
      frag.appendChild(node);
      return;
    }
    (body || frag).appendChild(node);           // header content, or current panel body
  });

  root.innerHTML = "";
  root.appendChild(frag);
}

/* Insert a "Collapse all / Expand all" control above the concept accordions so
   the whole page can be folded down to its headings in one click. The label
   stays in sync if the user opens/closes individual panels by hand. */
function addAccordionToolbar(root) {
  const panels = root.querySelectorAll("details.acc");
  if (panels.length < 2) return;              // not worth a button for a tiny page

  const bar = document.createElement("div");
  bar.className = "acc-toolbar";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "acc-toggle-all";

  const sync = () => {
    const anyOpen = Array.from(panels).some(p => p.open);
    btn.textContent = anyOpen ? "⊟ Collapse all" : "⊞ Expand all";
    btn.dataset.action = anyOpen ? "collapse" : "expand";
  };
  btn.addEventListener("click", () => {
    const expand = btn.dataset.action === "expand";
    panels.forEach(p => { p.open = expand; });
    sync();
  });
  panels.forEach(p => p.addEventListener("toggle", sync));
  sync();

  bar.appendChild(btn);
  root.insertBefore(bar, root.firstChild);
}

/* ---------- Mermaid diagrams ----------
   Content is injected via innerHTML, so Mermaid can't use startOnLoad. After each
   module loads we render any `<pre class="mermaid">` blocks in place. Concept panels
   are open by default, so blocks are visible (non-zero width) at render time. */
function mermaidTheme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "neutral";
}
async function renderMermaid() {
  const m = window.mermaid;
  if (!m) return;
  const nodes = content.querySelectorAll(".mermaid:not([data-processed])");
  if (!nodes.length) return;
  try {
    m.initialize({ startOnLoad: false, theme: mermaidTheme(), securityLevel: "loose",
                   flowchart: { useMaxWidth: true }, sequence: { useMaxWidth: true } });
    await m.run({ nodes });
  } catch (e) { /* on parse error, leave the diagram source visible rather than blow up the page */ }
}

let currentKey = null;

async function loadModule(key) {
  const meta = flat[key];
  if (!meta) return;
  currentKey = key;

  document.querySelectorAll(".nav-item").forEach(el =>
    el.classList.toggle("active", el.dataset.key === key));

  // make sure the active item's group AND its mega-section are expanded
  const activeEl = document.querySelector(".nav-item.active");
  if (activeEl) {
    const grp = activeEl.closest(".nav-group");          if (grp) grp.open = true;
    const sec = activeEl.closest(".nav-divider-group");  if (sec) sec.open = true;
  }

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
    groupIntoAccordions(content);
    addAccordionToolbar(content);
    renderMermaid();
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
  // Mermaid bakes the theme into the rendered SVG, so re-load the current page to re-theme diagrams.
  if (currentKey && content.querySelector(".mermaid")) loadModule(currentKey);
});
syncThemeIcon();

/* ---------- Mobile sidebar drawer ---------- */
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebarBackdrop = document.getElementById("sidebar-backdrop");
const sidebarToggleIcon = document.getElementById("sidebar-toggle-icon");
const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

function setSidebar(open) {
  sidebar.classList.toggle("-translate-x-full", !open);
  sidebar.classList.toggle("translate-x-0", open);
  sidebarBackdrop.classList.toggle("hidden", !open);
  if (sidebarToggleIcon) sidebarToggleIcon.textContent = open ? "✕" : "☰";
  sidebarToggle.setAttribute("aria-expanded", String(open));
}
const openSidebar  = () => setSidebar(true);
const closeSidebar = () => setSidebar(false);

sidebarToggle.addEventListener("click", () =>
  setSidebar(sidebar.classList.contains("-translate-x-full")));
sidebarBackdrop.addEventListener("click", closeSidebar);
// Close the drawer after picking a module (but not when toggling a group header)
navList.addEventListener("click", (e) => {
  if (e.target.closest(".nav-item") && isMobile()) closeSidebar();
});
// Esc closes it too
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isMobile()) closeSidebar();
});

/* ---------- Collapse / expand the entire sidenav ---------- */
const navToggleAll = document.getElementById("nav-toggle-all");
const navToggleAllLabel = document.getElementById("nav-toggle-all-label");
if (navToggleAll) {
  navToggleAll.addEventListener("click", () => {
    const panels = document.querySelectorAll("#nav-list .nav-divider-group, #nav-list .nav-group");
    const anyOpen = Array.from(panels).some(d => d.open);
    panels.forEach(d => { d.open = !anyOpen; });   // all open -> close everything, else open everything
    navToggleAllLabel.textContent = anyOpen ? "⊞ Expand all" : "⊟ Collapse all";
  });
}

/* ---------- Search ---------- */
search.addEventListener("input", () => {
  const q = search.value.toLowerCase().trim();
  const visible = el => el.style.display !== "none";

  // 1) show/hide individual items
  document.querySelectorAll(".nav-item").forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q) ? "" : "none";
  });

  // 2) collapse/hide groups, then mega-sections, based on whether they hold a hit.
  //    While searching, open containers with matches; on clear, restore the
  //    remembered default-open state (so manually-closed sections don't pop open
  //    just because the search box was emptied — except groups, which reset).
  document.querySelectorAll(".nav-group").forEach(group => {
    const any = Array.from(group.querySelectorAll(".nav-item")).some(visible);
    group.style.display = q && !any ? "none" : "";
    group.open = q ? any : group._defaultOpen;
  });
  document.querySelectorAll(".nav-divider-group").forEach(sec => {
    const any = Array.from(sec.querySelectorAll(".nav-item")).some(visible);
    sec.style.display = q && !any ? "none" : "";
    sec.open = q ? any : sec._defaultOpen;
  });
});

window.addEventListener("hashchange", () => {
  const key = decodeURIComponent(location.hash.slice(1));
  if (flat[key]) loadModule(key);
});

buildNav();
const initial = decodeURIComponent(location.hash.slice(1));
if (flat[initial]) loadModule(initial);
