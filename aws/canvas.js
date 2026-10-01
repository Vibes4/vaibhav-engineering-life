/* Canvas engine: renders a layout (boundaries, nodes, edges) into SVG, handles zoom/pan,
   selection highlighting, dependency highlighting, path mode and failure simulation. */
window.AwsCanvas = (function () {
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  };
  const TRAFFIC = {
    http: "HTTP/HTTPS", internal: "Internal service-to-service", database: "Database", async: "Async message",
    event: "Event", storage: "Storage", monitoring: "Monitoring / logging", control: "Control / IAM", network: "Network path"
  };

  let svg, viewport, stage, layout, services, connections, handlers;
  let nodeEls = {}, edgeEls = [], boundaryEls = {};
  let scale = 1, tx = 0, ty = 0;
  let hiddenTypes = new Set();
  let beginner = false;

  function init(opts) {
    stage = opts.stage; svg = opts.svg; services = opts.services; connections = opts.connections; handlers = opts.handlers;
    viewport = el("g", { id: "viewport" }, svg);
    setupPanZoom();
  }
  const svcById = id => services.find(s => s.id === id);
  const connById = id => connections.find(c => c.id === id);
  const nodeById = inst => layout.nodes.find(n => n.inst === inst);

  function render(newLayout, opts = {}) {
    layout = newLayout; beginner = !!opts.beginner;
    viewport.innerHTML = ""; nodeEls = {}; edgeEls = []; boundaryEls = {};
    defs();
    const gB = el("g", { class: "layer-boundaries" }, viewport);
    const gE = el("g", { class: "layer-edges" }, viewport);
    const gN = el("g", { class: "layer-nodes" }, viewport);
    const gC = el("g", { class: "layer-captions" }, viewport);
    layout.boundaries.forEach(b => drawBoundary(b, gB));
    layout.nodes.forEach(n => drawNode(n, gN));
    layout.edges.forEach((e, i) => drawEdge(e, i, gE));
    (layout.captions || []).forEach(c => { const t = el("text", { x: c.x, y: c.y, class: c.cls || "cap" }, gC); t.textContent = c.text; });
    applyHidden();
    if (opts.fit !== false) fit();
  }

  function defs() {
    const d = el("defs", {}, viewport);
    Object.keys(TRAFFIC).forEach(t => {
      const m = el("marker", { id: `arrow-${t}`, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, d);
      el("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: `var(--t-${t})` }, m);
    });
    const m = el("marker", { id: "arrow-sel", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, d);
    el("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "var(--sel)" }, m);
  }

  function drawBoundary(b, parent) {
    const g = el("g", { class: `boundary b-${b.kind}-g`, "data-id": b.id }, parent);
    el("rect", { x: b.x, y: b.y, width: b.w, height: b.h, class: `b-${b.kind}` }, g);
    const t = el("text", { x: b.x + 12, y: b.y + 18, class: "b-label" + (b.kind === "region" || b.kind === "vpc" ? " big" : "") }, g);
    t.textContent = b.label;
    if (b.kind === "public" || b.kind === "private" || b.kind === "db") {
      const s = el("text", { x: b.x + b.w - 12, y: b.y + 18, class: "b-label", "text-anchor": "end" }, g);
      s.textContent = b.kind === "public" ? "RT: 0.0.0.0/0 → IGW" : b.kind === "private" ? "RT: 0.0.0.0/0 → NAT" : "RT: local only · no internet";
      s.style.fontSize = "10.5px"; s.style.fontWeight = "600";
    }
    g.addEventListener("click", ev => { ev.stopPropagation(); handlers.onBoundary && handlers.onBoundary(b); });
    boundaryEls[b.id] = g;
  }

  function nodeLabel(n) {
    const s = n.service ? svcById(n.service) : null;
    return n.label || (s ? s.shortName : n.inst);
  }
  function nodeSub(n) {
    if (beginner && n.service) { const s = svcById(n.service); if (s && s.tagline) return s.tagline.length > 46 ? s.tagline.slice(0, 44) + "…" : s.tagline; }
    return n.sub || "";
  }
  function drawNode(n, parent) {
    const s = n.service ? svcById(n.service) : null;
    const cls = ["node", n.optional ? "optional" : "", n.chip ? "chip" : "", n.pseudo ? "pseudo" : ""].filter(Boolean).join(" ");
    const g = el("g", { class: cls, "data-inst": n.inst, "data-service": n.service || "" }, parent);
    el("rect", { x: n.x, y: n.y, width: n.w, height: n.h, class: "box" }, g);
    if (s) el("rect", { x: n.x, y: n.y, width: 5, height: n.h, class: "bar", fill: `var(--c-${s.category})` }, g);
    const ic = el("text", { x: n.x + 16, y: n.y + n.h / 2 + 7, class: "ic" }, g);
    ic.textContent = n.icon || (s ? s.icon : "•");
    const lbl = el("text", { x: n.x + 48, y: n.y + (n.chip ? n.h / 2 + 4 : 24), class: "lbl" }, g);
    lbl.textContent = nodeLabel(n);
    if (!n.chip || nodeSub(n)) {
      const sub = el("text", { x: n.x + 48, y: n.y + (n.chip ? n.h / 2 + 17 : 41), class: "sub" }, g);
      sub.textContent = nodeSub(n);
      if (n.chip) { lbl.setAttribute("y", n.y + n.h / 2 - 2); }
    }
    if (s && !n.chip) {
      const tag = scopeTag(s, n);
      if (tag) {
        const tw = tag.length * 5.6 + 10;
        el("rect", { x: n.x + n.w - tw - 6, y: n.y + 6, width: tw, height: 14, class: "tagbg", fill: tagColor(s) }, g);
        const t = el("text", { x: n.x + n.w - tw / 2 - 6, y: n.y + 16, class: "tag", "text-anchor": "middle" }, g);
        t.textContent = tag;
      }
    }
    g.addEventListener("click", ev => { ev.stopPropagation(); handlers.onNode && handlers.onNode(n, s); });
    nodeEls[n.inst] = g;
  }
  function scopeTag(s, n) {
    if (n.optional) return "OPTIONAL";
    const sc = s.placement && s.placement.scope;
    if (sc === "regional") return "OUTSIDE VPC"; if (sc === "global") return "GLOBAL"; if (sc === "concept") return "CONCEPT";
    if (sc === "vpc") return s.placement.subnet === "public" ? "PUBLIC" : "PRIVATE";
    return null;
  }
  function tagColor(s) {
    const sc = s.placement && s.placement.scope;
    if (sc === "vpc") return s.placement.subnet === "public" ? "var(--pub-b)" : "var(--priv-b)";
    if (sc === "regional" || sc === "global") return "var(--managed-b)";
    return "var(--faint)";
  }

  /* ---- edges ---- */
  function anchor(n, side) {
    const cx = n.x + n.w / 2, cy = n.y + n.h / 2;
    switch (side) {
      case "top": return [cx, n.y]; case "bottom": return [cx, n.y + n.h];
      case "left": return [n.x, cy]; case "right": return [n.x + n.w, cy];
      default: return [cx, cy];
    }
  }
  function autoSide(a, b) {
    const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
    const dx = bx - ax, dy = by - ay;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? ["right", "left"] : ["left", "right"];
    return dy > 0 ? ["bottom", "top"] : ["top", "bottom"];
  }
  function roundedPath(pts, r = 14) {
    if (pts.length === 2) {
      const [a, b] = pts; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const horiz = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]);
      return horiz ? `M${a[0]},${a[1]} C${mx},${a[1]} ${mx},${b[1]} ${b[0]},${b[1]}` : `M${a[0]},${a[1]} C${a[0]},${my} ${b[0]},${my} ${b[0]},${b[1]}`;
    }
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i - 1], c = pts[i], n = pts[i + 1];
      const d1 = Math.hypot(c[0] - p[0], c[1] - p[1]), d2 = Math.hypot(n[0] - c[0], n[1] - c[1]);
      const r1 = Math.min(r, d1 / 2), r2 = Math.min(r, d2 / 2);
      const a = [c[0] - (c[0] - p[0]) / d1 * r1, c[1] - (c[1] - p[1]) / d1 * r1];
      const b = [c[0] + (n[0] - c[0]) / d2 * r2, c[1] + (n[1] - c[1]) / d2 * r2];
      d += ` L${a[0]},${a[1]} Q${c[0]},${c[1]} ${b[0]},${b[1]}`;
    }
    const l = pts[pts.length - 1]; d += ` L${l[0]},${l[1]}`;
    return d;
  }
  function drawEdge(e, idx, parent) {
    const a = nodeById(e.from), b = nodeById(e.to), c = connById(e.conn);
    if (!a || !b || !c) return;
    const [sa, sb] = autoSide(a, b);
    const p1 = anchor(a, e.fromSide || sa), p2 = anchor(b, e.toSide || sb);
    const pts = [p1, ...(e.via || []), p2];
    const g = el("g", { class: `edge t-${c.trafficType} k-${c.kind}`, "data-conn": c.id, "data-idx": idx, "data-from": e.from, "data-to": e.to }, parent);
    el("path", { d: roundedPath(pts), class: "hit" }, g);
    const line = el("path", { d: roundedPath(pts), class: "line", "marker-end": `url(#arrow-${c.trafficType})` }, g);
    // label
    const len = line.getTotalLength ? line.getTotalLength() : 0;
    if (len > 60) {
      const mid = line.getPointAtLength(len * (e.labelAt ?? 0.5));
      const txt = beginner ? shortBeginner(c) : c.label;
      const w = txt.length * 5.4 + 8;
      el("rect", { x: mid.x - w / 2, y: mid.y - 8, width: w, height: 14, class: "elbg" }, g);
      const t = el("text", { x: mid.x, y: mid.y + 3, class: "el", "text-anchor": "middle" }, g);
      t.textContent = txt;
    }
    g.addEventListener("click", ev => { ev.stopPropagation(); handlers.onEdge && handlers.onEdge(c, e); });
    edgeEls.push({ g, e, c, line });
  }
  function shortBeginner(c) {
    const m = { http: "web request", internal: "hands the request on", database: "reads / writes data", async: "to-do slip", event: "announces an event", storage: "stores / fetches files", monitoring: "sends health reports", control: "gives instructions", network: "network path" };
    if (c.id === "rds-replication") return "twin copy";
    return m[c.trafficType] || c.label;
  }

  /* ---- hidden traffic types ---- */
  function setHiddenTypes(set) { hiddenTypes = set; applyHidden(); }
  function applyHidden() { edgeEls.forEach(({ g, c }) => g.classList.toggle("hidden", hiddenTypes.has(c.trafficType))); }

  /* ---- highlighting ---- */
  function clearHighlight() {
    Object.values(nodeEls).forEach(g => { g.classList.remove("selected", "dim", "rel-in", "rel-out", "failed", "survivor", "path-step", "path-current", "dep-required", "dep-recommended", "dep-optional", "dep-alternative"); g.querySelectorAll(".stepbg,.stepnum,.failx").forEach(x => x.remove()); });
    edgeEls.forEach(({ g, line }) => { g.classList.remove("selected", "dim", "rel-in", "rel-out", "path-active", "animated"); line.removeAttribute("marker-end"); line.setAttribute("marker-end", `url(#arrow-${g.dataset.conn && connById(g.dataset.conn).trafficType})`); });
    Object.values(boundaryEls).forEach(g => g.classList.remove("dim"));
  }
  function instancesOf(serviceId) { return layout.nodes.filter(n => n.service === serviceId).map(n => n.inst); }

  /* highlight a service: its instances + inbound/outbound edges; dim the rest */
  function highlightService(serviceId, { dimOthers = true } = {}) {
    clearHighlight();
    const insts = new Set(instancesOf(serviceId));
    if (!insts.size) return;
    const related = new Set(insts);
    edgeEls.forEach(({ g, e }) => {
      const isOut = insts.has(e.from), isIn = insts.has(e.to);
      if (isOut && !isIn) { g.classList.add("rel-out"); related.add(e.to); }
      else if (isIn && !isOut) { g.classList.add("rel-in"); related.add(e.from); }
      else if (isIn && isOut) { g.classList.add("rel-out"); }
      else if (dimOthers) g.classList.add("dim");
    });
    Object.entries(nodeEls).forEach(([inst, g]) => {
      if (insts.has(inst)) g.classList.add("selected");
      else if (related.has(inst)) { const n = nodeById(inst); const out = edgeEls.some(x => insts.has(x.e.from) && x.e.to === inst); g.classList.add(out ? "rel-out" : "rel-in"); }
      else if (dimOthers) g.classList.add("dim");
    });
  }
  function highlightEdge(connId, fromInst, toInst) {
    clearHighlight();
    edgeEls.forEach(({ g, e, c, line }) => {
      const match = c.id === connId && (!fromInst || (e.from === fromInst && e.to === toInst));
      if (match) { g.classList.add("selected"); line.setAttribute("marker-end", "url(#arrow-sel)"); }
      else g.classList.add("dim");
    });
    const keep = new Set(); edgeEls.filter(x => x.g.classList.contains("selected")).forEach(x => { keep.add(x.e.from); keep.add(x.e.to); });
    Object.entries(nodeEls).forEach(([inst, g]) => { if (!keep.has(inst)) g.classList.add("dim"); else g.classList.add("selected"); });
  }
  function highlightDependencies(serviceId, deps) {
    clearHighlight();
    const own = new Set(instancesOf(serviceId));
    const depMap = {}; deps.forEach(d => depMap[d.id] = d.kind);
    Object.entries(nodeEls).forEach(([inst, g]) => {
      const n = nodeById(inst);
      if (own.has(inst)) g.classList.add("selected");
      else if (n.service && depMap[n.service]) g.classList.add(`dep-${depMap[n.service]}`);
      else g.classList.add("dim");
    });
    edgeEls.forEach(({ g, e }) => {
      const na = nodeById(e.from), nb = nodeById(e.to);
      const ok = (own.has(e.from) && nb.service && depMap[nb.service]) || (own.has(e.to) && na.service && depMap[na.service]);
      if (!ok) g.classList.add("dim");
    });
  }
  /* path mode: steps = [{inst}], current index */
  function highlightPath(steps, current) {
    clearHighlight();
    const insts = steps.map(s => s.inst).filter(Boolean);
    const set = new Set(insts);
    Object.entries(nodeEls).forEach(([inst, g]) => { if (!set.has(inst)) g.classList.add("dim"); });
    insts.forEach((inst, i) => {
      const g = nodeEls[inst]; if (!g) return;
      g.classList.add("path-step");
      if (steps.indexOf(steps.find(s => s.inst === inst)) === current || insts[current] === inst) { /* handled below */ }
      const n = nodeById(inst);
      // step number badge (first occurrence index +1)
      const existing = g.querySelector(".stepbg"); if (existing) return;
      el("circle", { cx: n.x + n.w - 4, cy: n.y - 2, r: 11, class: "stepbg" }, g);
      const t = el("text", { x: n.x + n.w - 4, y: n.y + 2, class: "stepnum", "text-anchor": "middle" }, g);
      t.textContent = String(i + 1);
    });
    const cur = steps[current] && steps[current].inst;
    if (cur && nodeEls[cur]) nodeEls[cur].classList.add("path-current");
    // edges between consecutive steps
    edgeEls.forEach(({ g, e, line }) => {
      let on = false;
      for (let i = 0; i < insts.length - 1; i++) {
        if ((e.from === insts[i] && e.to === insts[i + 1]) || (e.from === insts[i + 1] && e.to === insts[i])) { on = true; if (i === current - 1 || i === current) g.classList.add("animated"); }
      }
      if (on) { g.classList.add("path-active"); line.setAttribute("marker-end", "url(#arrow-sel)"); } else g.classList.add("dim");
    });
    Object.values(boundaryEls).forEach(g => g.classList.add("dim"));
    if (cur) focusInstances([cur], { scaleTo: Math.max(scale, 0.9), animate: true });
  }
  function simulateFailure(failInsts, survivors) {
    clearHighlight();
    const f = new Set(failInsts), s = new Set(survivors || []);
    Object.entries(nodeEls).forEach(([inst, g]) => {
      if (f.has(inst)) { g.classList.add("failed"); const n = nodeById(inst); const t = el("text", { x: n.x + n.w - 26, y: n.y + n.h - 8, class: "failx" }, g); t.textContent = "💥"; }
      else if (s.has(inst)) g.classList.add("survivor");
      else g.classList.add("dim");
    });
    edgeEls.forEach(({ g, e }) => { if (f.has(e.from) || f.has(e.to)) g.classList.add("dim"); else if (s.has(e.from) && s.has(e.to)) g.classList.add("path-active"); else g.classList.add("dim"); });
  }

  /* ---- pan / zoom ---- */
  function applyTransform() { viewport.setAttribute("transform", `translate(${tx},${ty}) scale(${scale})`); }
  function setupPanZoom() {
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0, moved = false;
    stage.addEventListener("mousedown", e => { if (e.button !== 0) return; dragging = true; moved = false; sx = e.clientX; sy = e.clientY; ox = tx; oy = ty; stage.classList.add("panning"); });
    window.addEventListener("mousemove", e => { if (!dragging) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.abs(dx) + Math.abs(dy) > 3) moved = true; tx = ox + dx; ty = oy + dy; applyTransform(); });
    window.addEventListener("mouseup", () => { if (dragging && !moved) handlers.onBackground && handlers.onBackground(); dragging = false; stage.classList.remove("panning"); });
    stage.addEventListener("wheel", e => {
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomAt(mx, my, factor);
    }, { passive: false });
    // touch: single-finger pan, pinch zoom
    let lastTouch = null, lastDist = 0;
    stage.addEventListener("touchstart", e => { if (e.touches.length === 1) { lastTouch = [e.touches[0].clientX, e.touches[0].clientY]; } else if (e.touches.length === 2) { lastDist = dist(e.touches); } }, { passive: true });
    stage.addEventListener("touchmove", e => {
      if (e.touches.length === 1 && lastTouch) { tx += e.touches[0].clientX - lastTouch[0]; ty += e.touches[0].clientY - lastTouch[1]; lastTouch = [e.touches[0].clientX, e.touches[0].clientY]; applyTransform(); }
      else if (e.touches.length === 2) { const d = dist(e.touches); const r = stage.getBoundingClientRect(); const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left, cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top; if (lastDist) zoomAt(cx, cy, d / lastDist); lastDist = d; }
      e.preventDefault();
    }, { passive: false });
    stage.addEventListener("touchend", () => { lastTouch = null; lastDist = 0; });
    const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  }
  function zoomAt(mx, my, factor) {
    const ns = Math.min(3, Math.max(0.2, scale * factor)); factor = ns / scale;
    tx = mx - (mx - tx) * factor; ty = my - (my - ty) * factor; scale = ns; applyTransform();
  }
  function zoomBy(f) { const r = stage.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, f); }
  function fit(pad = 24) {
    const r = stage.getBoundingClientRect(); if (!layout) return;
    const { W, H } = layout.size;
    scale = Math.min((r.width - pad * 2) / W, (r.height - pad * 2) / H);
    tx = (r.width - W * scale) / 2; ty = (r.height - H * scale) / 2; applyTransform();
  }
  function focusInstances(insts, { scaleTo = 1.1, animate = true } = {}) {
    const ns = insts.map(nodeById).filter(Boolean); if (!ns.length) return;
    const minX = Math.min(...ns.map(n => n.x)), minY = Math.min(...ns.map(n => n.y));
    const maxX = Math.max(...ns.map(n => n.x + n.w)), maxY = Math.max(...ns.map(n => n.y + n.h));
    const r = stage.getBoundingClientRect();
    const boxW = maxX - minX + 200, boxH = maxY - minY + 200;
    const target = Math.min(scaleTo, (r.width) / boxW, (r.height) / boxH);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const ntx = r.width / 2 - cx * target, nty = r.height / 2 - cy * target;
    if (animate) animateTo(target, ntx, nty); else { scale = target; tx = ntx; ty = nty; applyTransform(); }
  }
  let anim = null;
  function animateTo(s2, x2, y2) {
    if (anim) cancelAnimationFrame(anim);
    const s1 = scale, x1 = tx, y1 = ty, t0 = performance.now(), dur = 380;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      scale = s1 + (s2 - s1) * e; tx = x1 + (x2 - x1) * e; ty = y1 + (y2 - y1) * e; applyTransform();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  return { init, render, fit, zoomBy, focusInstances, instancesOf, clearHighlight, highlightService, highlightEdge, highlightDependencies, highlightPath, simulateFailure, setHiddenTypes, TRAFFIC, get layout() { return layout; } };
})();
