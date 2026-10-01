/* AWS Services module controller: menu, tabs, search, routing, modes, canvas wiring. */
(function () {
  const $ = s => document.querySelector(s);
  const services = window.AWS_SERVICES, connections = window.AWS_CONNECTIONS, layouts = window.AWS_LAYOUTS;
  const CAT_ORDER = [["compute", "Compute"], ["containers", "Containers & Registry"], ["identity", "Identity & Security"], ["networking", "Networking"], ["integration", "Application Integration / Event Driven"], ["scaling", "Auto Scaling & Reliability"], ["database", "Databases"], ["storage", "Storage"], ["monitoring", "Monitoring & Observability"]];
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const State = { view: "architecture", layout: "production", beginner: false, deps: false, selected: null, path: null, pathStep: 0, hidden: new Set(), scenario: null };
  try { State.beginner = localStorage.getItem("aws-beginner") === "1"; } catch (e) {}

  const svc = id => services.find(s => s.id === id);
  const conn = id => connections.find(c => c.id === id);

  /* ---------------- canvas ---------------- */
  const stage = $("#stage"), svgEl = $("#canvas-svg");
  AwsCanvas.init({ stage, svg: svgEl, services, connections, handlers: {
    onNode: (n, s) => { if (s) openService(s.id, { fromCanvas: true, inst: n.inst }); else if (n.inst === "users") openUsers(); },
    onEdge: (c, e) => openConnection(c.id, e),
    onBoundary: b => { if (b.service) openService(b.service, { boundary: b }); },
    onBackground: () => { if (!State.path && !State.scenario) { AwsCanvas.clearHighlight(); } }
  } });
  function renderCanvas(fit = true) { AwsCanvas.render(layouts[State.layout], { beginner: State.beginner, fit }); AwsCanvas.setHiddenTypes(State.hidden); $("#stage-hint").textContent = State.layout === "production" ? "Production e-commerce reference architecture · 2 AZs · click anything" : "Beginner architecture · 1 AZ · compare with Production"; }
  $("#zoom-in").addEventListener("click", () => AwsCanvas.zoomBy(1.25));
  $("#zoom-out").addEventListener("click", () => AwsCanvas.zoomBy(0.8));
  $("#zoom-fit").addEventListener("click", () => AwsCanvas.fit());
  window.addEventListener("resize", () => { if (State.view === "architecture") AwsCanvas.fit(); });
  $("#layout-seg").addEventListener("click", e => { const b = e.target.closest("[data-layout]"); if (b) setLayout(b.dataset.layout); });
  function setLayout(l) {
    State.layout = l; document.querySelectorAll("#layout-seg button").forEach(b => b.classList.toggle("active", b.dataset.layout === l));
    stopPath(); State.scenario = null; renderCanvas();
    if (l === "beginner") showDiffNote();
  }
  $("#btn-diff").addEventListener("click", showDiffNote);
  function showDiffNote() {
    const head = $("#panel-head"), body = $("#panel-body");
    head.innerHTML = `<div class="row"><span class="ic">➕</span><div><h2>Beginner → Production</h2><div class="full">What was added, and why</div></div><button class="close">✕</button></div>
      <p class="tagline">The beginner architecture (Internet → ALB → ECS → RDS → S3, one AZ) works for learning. Each item below is a real production requirement — click a service to open it.</p>
      <div class="panel-actions"><button data-l="beginner">👶 Show beginner canvas</button><button data-l="production">🏭 Show production canvas</button></div>`;
    head.querySelector(".close").addEventListener("click", AwsPanel.close);
    head.querySelectorAll("[data-l]").forEach(b => b.addEventListener("click", () => setLayout(b.dataset.l)));
    body.innerHTML = layouts.diff.map((d, i) => `<details class="sec" open><summary><span class="num">${i + 1}</span>${esc(d.added)}</summary><div class="sec-body"><p>${esc(d.why)}</p><div class="pill-row">${d.services.map(id => svc(id) ? `<span class="pill" data-open-service="${id}">${svc(id).icon} ${esc(svc(id).shortName)}</span>` : "").join("")}</div></div></details>`).join("");
    body.querySelectorAll("[data-open-service]").forEach(a => a.addEventListener("click", () => openService(a.dataset.openService)));
    AwsPanel.open();
  }

  /* ---------------- panel ---------------- */
  AwsPanel.init({ root: $("#aws-panel"), head: $("#panel-head"), body: $("#panel-body"), ctx: {
    services, connections, TRAFFIC: AwsCanvas.TRAFFIC,
    beginner: () => State.beginner, depsMode: () => State.deps,
    instancesOf: id => layouts.production.nodes.filter(n => n.service === id).map(n => n.inst),
    openService, openConnection,
    locate: id => { showView("architecture"); if (State.layout !== "production" && !layouts[State.layout].nodes.some(n => n.service === id)) setLayout("production"); AwsCanvas.highlightService(id); AwsCanvas.focusInstances(AwsCanvas.instancesOf(id), { scaleTo: 1 }); },
    locateConnection: (c, e) => { showView("architecture"); const lay = layouts[State.layout]; const hasEdge = lay.edges.some(x => x.conn === c.id); if (!hasEdge && State.layout !== "production") setLayout("production"); const edge = e || layouts[State.layout].edges.find(x => x.conn === c.id); if (edge) { AwsCanvas.highlightEdge(c.id, edge.from, edge.to); AwsCanvas.focusInstances([edge.from, edge.to], { scaleTo: 1 }); } else AwsCanvas.highlightService(c.source); },
    toggleDeps: id => { State.deps = !State.deps; syncDepsButton(); if (State.deps) { showView("architecture"); AwsCanvas.highlightDependencies(id, svc(id).dependencies || []); } else AwsCanvas.highlightService(id); },
    openScenario: id => { const sc = window.AWS_SCENARIOS.find(s => s.service === id); if (sc) { location.hash = `#scenario/${sc.id}`; } else { openService(id, { openSection: 21 }); } },
    openComparison: id => { location.hash = `#compare/${id}`; },
    onClose: () => { if (!State.path && !State.scenario) AwsCanvas.clearHighlight(); State.selected = null; syncMenuActive(); }
  } });

  function openService(id, opts = {}) {
    const s = svc(id); if (!s) return;
    State.selected = { type: "service", id };
    if (location.hash !== `#service/${id}`) history.replaceState(null, "", `#service/${id}`);
    AwsPanel.renderService(s, opts);
    syncMenuActive();
    if (State.view === "architecture" && !State.path && !State.scenario) {
      if (State.deps) AwsCanvas.highlightDependencies(id, s.dependencies || []);
      else AwsCanvas.highlightService(id);
      if (!opts.fromCanvas) { const insts = AwsCanvas.instancesOf(id); if (insts.length) AwsCanvas.focusInstances(insts, { scaleTo: 0.95 }); }
    }
  }
  function openConnection(id, edge) {
    const c = conn(id); if (!c) return;
    State.selected = { type: "connection", id };
    history.replaceState(null, "", `#connection/${id}`);
    AwsPanel.renderConnection(c, edge);
    if (State.view === "architecture" && !State.path && !State.scenario) AwsCanvas.highlightEdge(id, edge && edge.from, edge && edge.to);
    syncMenuActive();
  }
  function openUsers() {
    const head = $("#panel-head"), body = $("#panel-body");
    head.innerHTML = `<div class="row"><span class="ic">👤</span><div><h2>Users / Internet</h2><div class="full">Shoppers' browsers and mobile apps</div></div><button class="close">✕</button></div><p class="tagline">Not an AWS service — the public internet. Everything users can reach must be deliberately exposed: CloudFront, API Gateway, and (indirectly) the ALB. Nothing else in the architecture has a public IP.</p>`;
    head.querySelector(".close").addEventListener("click", AwsPanel.close);
    const outs = connections.filter(c => c.source === "users"), ins = connections.filter(c => c.target === "users");
    body.innerHTML = `<h4>Users talk to</h4><div class="conn-list">${outs.map(c => `<div class="conn-card" data-open-conn="${c.id}"><div class="arrow">➡</div><div><div class="who">${esc(svc(c.target).shortName)} <span class="bdg k-${c.kind}">${c.kind}</span></div><div class="why">${esc(State.beginner ? c.eli5 : c.explanation)}</div></div><div></div></div>`).join("")}</div>
      <h4>Users receive</h4><div class="conn-list">${ins.map(c => `<div class="conn-card" data-open-conn="${c.id}"><div class="arrow">⬅</div><div><div class="who">${esc(svc(c.source).shortName)}</div><div class="why">${esc(State.beginner ? c.eli5 : c.explanation)}</div></div><div></div></div>`).join("")}</div>`;
    body.querySelectorAll("[data-open-conn]").forEach(a => a.addEventListener("click", () => openConnection(a.dataset.openConn)));
    AwsPanel.open(); AwsCanvas.highlightService("users");
    // pseudo node highlight
    AwsCanvas.clearHighlight(); const g = document.querySelector('[data-inst="users"]'); if (g) g.classList.add("selected");
  }

  /* ---------------- views ---------------- */
  AwsViews.init({ services, connections, beginner: () => State.beginner, openService, openConnection,
    startPath: id => { showView("architecture"); startPath(id); },
    simulate: id => { showView("architecture"); simulate(id); },
    showArchitecture: l => { showView("architecture"); setLayout(l); } });
  const viewRenderers = {
    networking: (root, arg) => AwsViews.renderNetworking(root, arg),
    iam: root => AwsViews.renderIam(root),
    flow: root => AwsViews.renderFlow(root),
    ecommerce: root => AwsViews.renderEcommerce(root),
    comparisons: (root, arg) => AwsViews.renderComparisons(root, arg),
    failures: (root, arg) => AwsViews.renderFailures(root, arg),
    security: root => AwsViews.renderSecurity(root),
    catalog: root => AwsViews.renderCatalog(root)
  };
  function showView(v, arg) {
    State.view = v;
    document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("active", b.dataset.view === v));
    document.querySelectorAll(".view").forEach(x => x.classList.toggle("active", x.id === `view-${v}`));
    if (v === "architecture") { requestAnimationFrame(() => AwsCanvas.fit()); }
    else { const root = $(`#view-${v}`); viewRenderers[v](root, arg); root.scrollTop = 0; }
  }
  $("#tabs").addEventListener("click", e => { const b = e.target.closest("[data-view]"); if (!b) return; location.hash = `#view/${b.dataset.view}`; });
  function rerenderCurrentView() { if (State.view !== "architecture") viewRenderers[State.view]($(`#view-${State.view}`)); else renderCanvas(false); }

  /* ---------------- menu ---------------- */
  function buildMenu() {
    const root = $("#menu-cats"); root.innerHTML = "";
    CAT_ORDER.forEach(([k, label]) => {
      const items = services.filter(s => s.category === k); if (!items.length) return;
      const d = document.createElement("details"); d.className = "cat"; d.open = true;
      d.innerHTML = `<summary><span class="dot" style="background:var(--c-${k})"></span>${label}<span class="n">${items.length}</span></summary>` + items.map(s => `<div class="svc-item" data-id="${s.id}"><span class="ic">${s.icon}</span><div><div class="nm">${esc(s.shortName)}</div><div class="tg">${esc(State.beginner ? s.eli5.split(". ")[0] + "." : s.tagline)}</div></div><span class="scope">${{ vpc: "in VPC", "vpc-edge": "VPC", regional: "outside", global: "global", concept: "concept" }[s.placement.scope]}</span></div>`).join("");
      root.appendChild(d);
    });
    root.querySelectorAll(".svc-item").forEach(el => el.addEventListener("click", () => { openService(el.dataset.id); if (window.innerWidth < 900) $("#aws-menu").classList.remove("open"); }));
    syncMenuActive();
  }
  function syncMenuActive() { document.querySelectorAll(".svc-item").forEach(el => el.classList.toggle("active", State.selected && State.selected.type === "service" && State.selected.id === el.dataset.id)); }
  $("#menu-collapse").addEventListener("click", e => { const cats = document.querySelectorAll("#menu-cats .cat"); const anyOpen = [...cats].some(c => c.open); cats.forEach(c => c.open = !anyOpen); e.target.textContent = anyOpen ? "expand all" : "collapse all"; });
  $("#menu-toggle").addEventListener("click", () => $("#aws-menu").classList.toggle("open"));

  /* deps toggle */
  $("#deps-toggle").addEventListener("click", () => { State.deps = !State.deps; syncDepsButton(); if (State.selected && State.selected.type === "service") { showView("architecture"); State.deps ? AwsCanvas.highlightDependencies(State.selected.id, svc(State.selected.id).dependencies || []) : AwsCanvas.highlightService(State.selected.id); AwsPanel.renderService(svc(State.selected.id)); } });
  function syncDepsButton() { const b = $("#deps-toggle"); b.classList.toggle("on", State.deps); b.textContent = `🌳 Show dependencies — ${State.deps ? "on" : "off"}`; }

  /* legend */
  function buildLegend() {
    const root = $("#legend"); root.innerHTML = "";
    const style = { async: "dashed", event: "dashed", monitoring: "dotted", control: "dotted" };
    Object.entries(AwsCanvas.TRAFFIC).forEach(([k, label]) => {
      const b = document.createElement("button"); b.className = style[k] || ""; b.style.setProperty("--col", `var(--t-${k})`); b.innerHTML = `<i></i>${label}`; b.title = "Click to hide/show these arrows";
      b.addEventListener("click", () => { if (State.hidden.has(k)) State.hidden.delete(k); else State.hidden.add(k); b.classList.toggle("off", State.hidden.has(k)); AwsCanvas.setHiddenTypes(State.hidden); });
      root.appendChild(b);
    });
  }

  /* ---------------- path mode ---------------- */
  const pathSel = $("#path-select");
  window.AWS_PATHS.forEach(p => { const o = document.createElement("option"); o.value = p.id; o.textContent = p.title; pathSel.appendChild(o); });
  pathSel.addEventListener("change", () => { if (pathSel.value) { showView("architecture"); startPath(pathSel.value); } else stopPath(); });
  const bar = $("#path-bar"); let pathTimer = null;
  function startPath(id) {
    const p = window.AWS_PATHS.find(x => x.id === id); if (!p) return;
    if (State.layout !== "production") setLayout("production");
    State.scenario = null; State.path = p; State.pathStep = 0; pathSel.value = id; AwsPanel.close(); drawPath();
    history.replaceState(null, "", `#path/${id}`);
  }
  function stopPath() { State.path = null; if (pathTimer) clearInterval(pathTimer); pathTimer = null; bar.classList.remove("open"); pathSel.value = ""; AwsCanvas.clearHighlight(); }
  function drawPath() {
    const p = State.path; if (!p) return; const i = State.pathStep, st = p.steps[i];
    AwsCanvas.highlightPath(p.steps, i);
    bar.classList.add("open");
    bar.innerHTML = `<div class="pb-head"><b>🧭 ${esc(p.title)}</b><span style="color:var(--muted);font-size:12px">${esc(p.question)}</span><button class="close" title="Exit path mode">✕</button></div>
      <div class="path-steps">${p.steps.map((s, j) => `<button class="${j === i ? "cur" : j < i ? "done" : ""}" data-step="${j}"><span class="n">${j + 1}</span>${esc(s.title)}</button>`).join("")}</div>
      <div class="pb-body"><div class="t">Hop ${i + 1}/${p.steps.length}: ${esc(st.title)}</div>${esc(State.beginner ? st.eli5 : st.tech)}${st.service ? ` <a class="svc-link" data-open-service="${st.service}">open ${esc(svc(st.service).shortName)} ›</a>` : ""}</div>
      <div class="pb-ctl"><button data-p="prev">‹ Prev</button><button data-p="next" class="primary">Next ›</button><button data-p="play">${pathTimer ? "⏸ Pause" : "▶ Auto-play"}</button><button data-p="restart">↺ Restart</button></div>`;
    bar.querySelector(".close").addEventListener("click", stopPath);
    bar.querySelectorAll("[data-step]").forEach(b => b.addEventListener("click", () => { State.pathStep = +b.dataset.step; drawPath(); }));
    bar.querySelector("[data-p=prev]").addEventListener("click", () => { State.pathStep = Math.max(0, i - 1); drawPath(); });
    bar.querySelector("[data-p=next]").addEventListener("click", () => { State.pathStep = Math.min(p.steps.length - 1, i + 1); drawPath(); });
    bar.querySelector("[data-p=restart]").addEventListener("click", () => { State.pathStep = 0; drawPath(); });
    bar.querySelector("[data-p=play]").addEventListener("click", () => { if (pathTimer) { clearInterval(pathTimer); pathTimer = null; drawPath(); return; } pathTimer = setInterval(() => { if (State.pathStep >= p.steps.length - 1) { clearInterval(pathTimer); pathTimer = null; drawPath(); return; } State.pathStep++; drawPath(); }, 2600); drawPath(); });
    bar.querySelectorAll("[data-open-service]").forEach(a => a.addEventListener("click", () => { const id = a.dataset.openService; AwsPanel.renderService(svc(id)); }));
  }

  /* ---------------- failure simulation ---------------- */
  function simulate(id) {
    const sc = window.AWS_SCENARIOS.find(s => s.id === id); if (!sc) return;
    if (State.layout !== "production") setLayout("production");
    stopPath(); State.scenario = sc; AwsPanel.close();
    AwsCanvas.simulateFailure(sc.failNodes, sc.survivors);
    const s = sc.service ? svc(sc.service) : null; const f = sc.custom || (s && s.failure);
    bar.classList.add("open");
    bar.innerHTML = `<div class="pb-head"><b>💥 ${esc(sc.title)}</b><span style="color:var(--muted);font-size:12px">red = failed · green = keeps serving · faded = unaffected/irrelevant</span><button class="close">✕</button></div>
      <div class="pb-body">${esc(f.whatHappens)}</div>
      <div class="pb-ctl"><button data-s="details" class="primary">Full scenario ›</button>${s ? `<button data-s="svc">Open ${esc(s.shortName)} node</button>` : ""}<button data-s="clear">Clear simulation</button></div>`;
    bar.querySelector(".close").addEventListener("click", clearSim);
    bar.querySelector("[data-s=clear]").addEventListener("click", clearSim);
    bar.querySelector("[data-s=details]").addEventListener("click", () => { location.hash = `#scenario/${sc.id}`; });
    const sb = bar.querySelector("[data-s=svc]"); if (sb) sb.addEventListener("click", () => AwsPanel.renderService(s));
  }
  function clearSim() { State.scenario = null; bar.classList.remove("open"); AwsCanvas.clearHighlight(); }

  /* ---------------- search ---------------- */
  const searchIn = $("#aws-search"), results = $("#search-results");
  function doSearch(q) {
    q = q.trim().toLowerCase(); if (!q) { results.classList.remove("open"); results.innerHTML = ""; return; }
    const hi = t => esc(t).replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"), "<mark>$1</mark>");
    const score = s => { const n = (s.shortName + " " + s.name + " " + s.fullName).toLowerCase(); if (n.startsWith(q) || s.id === q) return 3; if (n.includes(q)) return 2; if ((s.tagline + " " + s.whatIsIt + " " + (s.related || []).join(" ")).toLowerCase().includes(q)) return 1; return 0; };
    const svcHits = services.map(s => [score(s), s]).filter(x => x[0]).sort((a, b) => b[0] - a[0]).slice(0, 8);
    const connHits = connections.filter(c => c.trafficType !== "structure" && (c.id.includes(q) || (c.label + " " + c.explanation).toLowerCase().includes(q))).slice(0, 5);
    const cmpHits = window.AWS_COMPARISONS.filter(c => c.title.toLowerCase().includes(q)).slice(0, 4);
    const pathHits = window.AWS_PATHS.filter(p => p.title.toLowerCase().includes(q)).slice(0, 3);
    const scHits = window.AWS_SCENARIOS.filter(s => s.title.toLowerCase().includes(q)).slice(0, 3);
    let html = "";
    if (svcHits.length) html += `<div class="sr-group">Services</div>` + svcHits.map(([, s]) => { const inc = connections.filter(c => c.target === s.id && c.trafficType !== "structure").length, out = connections.filter(c => c.source === s.id && c.trafficType !== "structure").length; return `<div class="sr-item" data-sr="service:${s.id}"><span class="ic">${s.icon}</span><div><div class="t">${hi(s.name)} <span class="bdg" style="margin-left:4px">${{ vpc: "inside VPC", "vpc-edge": "VPC block", regional: "outside VPC", global: "global", concept: "concept" }[s.placement.scope]}</span></div><div class="d">${hi(s.tagline)}</div><div class="d" style="font-size:11px">${inc} incoming · ${out} outgoing · related: ${(s.related || []).slice(0, 4).map(r => svc(r) ? svc(r).shortName : r).join(", ")}</div></div></div>`; }).join("");
    if (connHits.length) html += `<div class="sr-group">Connections</div>` + connHits.map(c => `<div class="sr-item" data-sr="connection:${c.id}"><span class="ic">🔗</span><div><div class="t">${esc(svc(c.source) ? svc(c.source).shortName : c.source)} → ${esc(svc(c.target) ? svc(c.target).shortName : c.target)} <span class="d" style="display:inline">· ${hi(c.label)}</span></div><div class="d">${hi(c.explanation.slice(0, 120))}…</div></div></div>`).join("");
    if (cmpHits.length) html += `<div class="sr-group">Comparisons</div>` + cmpHits.map(c => `<div class="sr-item" data-sr="compare:${c.id}"><span class="ic">⚖️</span><div class="t">${hi(c.title)}</div></div>`).join("");
    if (pathHits.length) html += `<div class="sr-group">Architecture paths</div>` + pathHits.map(p => `<div class="sr-item" data-sr="path:${p.id}"><span class="ic">🧭</span><div class="t">${hi(p.title)}</div></div>`).join("");
    if (scHits.length) html += `<div class="sr-group">Failure scenarios</div>` + scHits.map(s => `<div class="sr-item" data-sr="scenario:${s.id}"><span class="ic">💥</span><div class="t">${hi(s.title)}</div></div>`).join("");
    if (!html) html = `<div class="sr-item"><span class="ic">🤷</span><div class="d">No matches for “${esc(q)}”. Try a service name (RDS, NAT, ALB) or a topic (queue, cache, subnet).</div></div>`;
    results.innerHTML = html; results.classList.add("open");
    results.querySelectorAll("[data-sr]").forEach((el, i) => { if (i === 0) el.classList.add("active"); el.addEventListener("click", () => { go(el.dataset.sr); }); });
  }
  function go(target) {
    const [type, id] = target.split(":"); results.classList.remove("open"); searchIn.blur();
    if (type === "service") openService(id, { searchNote: `Search result for “${esc(searchIn.value)}”: below is what ${esc(svc(id).shortName)} does, where it sits in the architecture, who talks to it, its security requirements, and how to create it. Use <b>Locate on canvas</b> to see it in the diagram.` });
    if (type === "connection") openConnection(id);
    if (type === "compare") location.hash = `#compare/${id}`;
    if (type === "path") { showView("architecture"); startPath(id); }
    if (type === "scenario") location.hash = `#scenario/${id}`;
    searchIn.value = "";
  }
  searchIn.addEventListener("input", () => doSearch(searchIn.value));
  searchIn.addEventListener("focus", () => { if (searchIn.value) doSearch(searchIn.value); });
  searchIn.addEventListener("keydown", e => {
    const items = [...results.querySelectorAll("[data-sr]")]; let idx = items.findIndex(x => x.classList.contains("active"));
    if (e.key === "ArrowDown") { e.preventDefault(); idx = Math.min(items.length - 1, idx + 1); items.forEach((x, i) => x.classList.toggle("active", i === idx)); }
    if (e.key === "ArrowUp") { e.preventDefault(); idx = Math.max(0, idx - 1); items.forEach((x, i) => x.classList.toggle("active", i === idx)); }
    if (e.key === "Enter" && items[idx]) go(items[idx].dataset.sr);
    if (e.key === "Escape") { results.classList.remove("open"); searchIn.blur(); }
  });
  document.addEventListener("click", e => { if (!e.target.closest(".search-wrap")) results.classList.remove("open"); });
  document.addEventListener("keydown", e => {
    if (e.key === "/" && document.activeElement !== searchIn && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); searchIn.focus(); }
    if (e.key === "Escape") { if (AwsPanel.isOpen()) AwsPanel.close(); else if (State.path) stopPath(); else if (State.scenario) clearSim(); else AwsCanvas.clearHighlight(); }
  });

  /* ---------------- beginner + theme ---------------- */
  const bt = $("#beginner-toggle");
  function syncBeginner() { bt.classList.toggle("on", State.beginner); document.documentElement.classList.toggle("beginner", State.beginner); }
  bt.addEventListener("click", () => {
    State.beginner = !State.beginner; try { localStorage.setItem("aws-beginner", State.beginner ? "1" : "0"); } catch (e) {}
    syncBeginner(); buildMenu(); rerenderCurrentView();
    if (State.selected) { State.selected.type === "service" ? AwsPanel.renderService(svc(State.selected.id)) : AwsPanel.renderConnection(conn(State.selected.id)); }
    if (State.path) drawPath();
  });
  const tt = $("#theme-toggle");
  const syncTheme = () => tt.textContent = document.documentElement.classList.contains("dark") ? "☀️" : "🌙";
  tt.addEventListener("click", () => { const d = document.documentElement.classList.toggle("dark"); try { localStorage.setItem("theme", d ? "dark" : "light"); } catch (e) {} syncTheme(); });
  syncTheme();

  /* ---------------- routing ---------------- */
  function route() {
    const h = decodeURIComponent(location.hash.slice(1)); const [kind, id, arg] = h.split("/");
    if (kind === "service" && svc(id)) { if (State.view !== "architecture" && !document.querySelector(`#view-${State.view}`).classList.contains("active")) showView("architecture"); openService(id); return; }
    if (kind === "connection" && conn(id)) { openConnection(id); return; }
    if (kind === "compare") { showView("comparisons", id); return; }
    if (kind === "scenario") { showView("failures", id); return; }
    if (kind === "path") { showView("architecture"); startPath(id); return; }
    if (kind === "view" && (id === "architecture" || viewRenderers[id])) { showView(id, arg); return; }
    showView("architecture");
  }
  window.addEventListener("hashchange", route);

  /* ---------------- boot ---------------- */
  syncBeginner(); buildMenu(); buildLegend(); syncDepsButton(); renderCanvas();
  route();
  if (!location.hash) { requestAnimationFrame(() => AwsCanvas.fit()); }
})();
