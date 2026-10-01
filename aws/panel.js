/* Details drawer: renders a service node (20-section structure) or a connection. */
window.AwsPanel = (function () {
  let root, head, body, ctx;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const li = arr => `<ul>${(arr || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const ol = arr => `<ol>${(arr || []).map(x => `<li>${esc(x)}</li>`).join("")}</ol>`;
  const CAT_LABEL = { compute: "Compute", containers: "Containers & Registry", identity: "Identity & Security", networking: "Networking", integration: "Application Integration", scaling: "Auto Scaling & Reliability", database: "Databases", storage: "Storage", monitoring: "Monitoring & Observability" };
  const SCOPE_LABEL = { vpc: "Inside your VPC", "vpc-edge": "VPC building block", regional: "AWS managed · outside VPC", global: "Global service · outside VPC", concept: "Concept (not a resource)" };

  function init(opts) { root = opts.root; head = opts.head; body = opts.body; ctx = opts.ctx; root.querySelector(".close").addEventListener("click", close); }
  function open() { root.classList.add("open"); }
  function close() { root.classList.remove("open"); ctx.onClose && ctx.onClose(); }
  const svc = id => ctx.services.find(s => s.id === id);
  const svcLink = id => { const s = svc(id); return s ? `<a class="svc-link" data-open-service="${id}">${esc(s.shortName)}</a>` : esc(id === "users" ? "Users / Internet" : id); };
  const sec = (num, title, html, question) => `<details class="sec" ${[1, 2, 3, 6, 7].includes(num) ? "open" : ""}><summary><span class="num">${num}</span>${esc(title)}${question ? `<span class="q">${esc(question)}</span>` : ""}</summary><div class="sec-body">${html}</div></details>`;

  function explain(simple, technical) {
    const b = ctx.beginner();
    const e = `<div class="eli5"><b>Simple explanation</b>${esc(simple)}</div>`;
    const t = `<div class="tech"><b>Technical explanation</b>${esc(technical)}</div>`;
    return b ? e + `<details style="margin-top:6px"><summary style="cursor:pointer;font-size:12.5px;color:var(--muted)">Show technical explanation</summary>${t}</details>` : t + `<details style="margin-top:6px"><summary style="cursor:pointer;font-size:12.5px;color:var(--muted)">Show simple explanation</summary>${e}</details>`;
  }

  function renderService(s, opts = {}) {
    const conns = ctx.connections;
    const incoming = conns.filter(c => c.target === s.id && c.source !== s.id);
    const outgoing = conns.filter(c => c.source === s.id && c.target !== s.id);
    const self = conns.filter(c => c.source === s.id && c.target === s.id);
    const p = s.placement || {};
    const beginner = ctx.beginner();
    const catLabel = CAT_LABEL[s.category] || s.category;
    const onCanvas = ctx.instancesOf(s.id).length > 0;

    head.innerHTML = `
      <div class="row"><span class="ic">${s.icon}</span>
        <div><h2>${esc(s.name)}</h2><div class="full">${esc(s.fullName)}</div></div>
        <button class="close" title="Close (Esc)">✕</button></div>
      <p class="tagline">${esc(s.tagline)}</p>
      <div class="badges">
        <span class="bdg cat" style="background:var(--c-${s.category})">${esc(catLabel)}</span>
        <span class="bdg scope-${p.scope}">${SCOPE_LABEL[p.scope] || p.scope}</span>
        ${p.scope === "vpc" ? `<span class="bdg ${p.subnet === "public" ? "pub" : "scope-vpc"}">${p.subnet === "public" ? "public subnet" : p.subnet === "private-db" ? "private DB subnet" : p.subnet === "private-app" ? "private app subnet" : "subnet: " + p.subnet}</span>` : ""}
        <span class="bdg">${p.internetAccessible ? "🌐 internet-reachable" : "🔒 not internet-reachable"}</span>
      </div>
      <div class="panel-actions">
        ${onCanvas ? `<button data-act="locate">📍 Locate on canvas</button>` : ""}
        <button data-act="deps" class="${ctx.depsMode() ? "on" : ""}">🌳 Show dependencies</button>
        <button data-act="fail">💥 What if it fails?</button>
        ${comparisonsFor(s.id).map(c => `<button data-act="compare" data-id="${c.id}">⚖️ ${esc(c.title)}</button>`).join("")}
      </div>`;
    head.querySelector(".close").addEventListener("click", close);
    head.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => {
      const a = b.dataset.act;
      if (a === "locate") ctx.locate(s.id);
      if (a === "deps") { ctx.toggleDeps(s.id); b.classList.toggle("on"); }
      if (a === "fail") ctx.openScenario(s.id);
      if (a === "compare") ctx.openComparison(b.dataset.id);
    }));

    const connCard = (c, dir) => {
      const other = dir === "in" ? c.source : c.target;
      const arrow = dir === "in" ? "→" : "→";
      const who = dir === "in" ? `${svcLink(other)} <span>→</span> ${esc(s.shortName)}` : `${esc(s.shortName)} <span>→</span> ${svcLink(other)}`;
      return `<div class="conn-card" data-open-conn="${c.id}">
        <div class="arrow">${dir === "in" ? "⬅" : "➡"}</div>
        <div><div class="who">${who} <span class="bdg k-${c.kind}" style="margin-left:6px">${c.kind}</span></div>
          <div class="why">${esc(beginner ? c.eli5 : c.explanation)}</div>
          <div class="how"><span class="tt" style="background:var(--t-${c.trafficType})"></span>${esc(ctx.TRAFFIC[c.trafficType] || c.trafficType)} · ${esc(c.protocol)} · port ${esc(c.port)}</div></div>
        <div style="font-size:11px;color:var(--faint)">details ›</div></div>`;
    };
    const yn = v => v ? `<span class="no">Yes</span>` : `<span class="yes">No</span>`;
    const secObj = s.security || {};
    const secRows = [["IAM", secObj.iam], ["Security groups", secObj.securityGroups], ["NACL", secObj.nacl], ["Encryption", secObj.encryption], ["Authentication", secObj.authentication], ["Authorization", secObj.authorization], ["Secrets", secObj.secrets], ["Least privilege", secObj.leastPrivilege]];
    const checklistKey = `aws-cl-${s.id}`;
    let saved = {}; try { saved = JSON.parse(localStorage.getItem(checklistKey) || "{}"); } catch (e) {}
    const doneCount = (s.productionChecklist || []).filter((_, i) => saved[i]).length;

    body.innerHTML = `
      ${opts.searchNote ? `<div class="note">${opts.searchNote}</div>` : ""}
      ${sec(1, "What is it?", `<p>${esc(s.whatIsIt)}</p>`)}
      ${sec(2, beginner ? "Explain like I'm 5" : "Technical explanation", explain(s.eli5, s.technical), beginner ? "" : "")}
      ${sec(3, "Why do we need it?", li(s.whyUse), "what problem does it solve?")}
      ${sec(4, "When should I use it?", li(s.whenToUse))}
      ${sec(5, "When should I NOT use it?", li(s.whenNotToUse), "alternatives & misuse")}
      ${sec(6, "Where does it live? (network placement)", `
        <p>${esc(p.summary)}</p>
        <div class="kv">
          <div class="k">Scope</div><div class="v">${SCOPE_LABEL[p.scope] || esc(p.scope)}</div>
          <div class="k">Subnet</div><div class="v">${esc(p.subnet)}</div>
          <div class="k">Internet accessible</div><div class="v">${p.internetAccessible ? '<span class="no">Yes — reachable from the public internet</span>' : '<span class="yes">No</span>'}</div>
          <div class="k">Security group</div><div class="v">${esc(p.securityGroup)}</div>
          <div class="k">NACL</div><div class="v">${esc(p.nacl)}</div>
          <div class="k">Route table</div><div class="v">${esc(p.routeTable)}</div>
          <div class="k">NAT required</div><div class="v">${esc(p.nat)}</div>
          <div class="k">Internet Gateway</div><div class="v">${esc(p.igw)}</div>
          ${p.vpcOptional ? `<div class="k">Optional VPC attachment</div><div class="v">${esc(p.vpcOptional)}</div>` : ""}
        </div>`, "public or private?")}
      ${sec(7, "What is it connected to?", `
        ${beginner ? `<div class="eli5">${esc(s.beginnerConnectionHint)}</div>` : ""}
        <h4>Incoming — who talks to ${esc(s.shortName)}? (${incoming.length})</h4>
        <div class="conn-list">${incoming.map(c => connCard(c, "in")).join("") || '<div class="empty">Nothing initiates connections to this service in the reference architecture.</div>'}</div>
        <h4>Outgoing — who does ${esc(s.shortName)} talk to? (${outgoing.length})</h4>
        <div class="conn-list">${outgoing.map(c => connCard(c, "out")).join("") || '<div class="empty">This service does not initiate connections in the reference architecture.</div>'}</div>
        ${self.length ? `<h4>Internal</h4><div class="conn-list">${self.map(c => connCard(c, "out")).join("")}</div>` : ""}
        <p style="font-size:12px;color:var(--faint);margin-top:8px">Click a connection for protocol, port, route, security group chain, and NAT/internet requirements.</p>`, "who talks to whom?")}
      ${sec(8, "How does data flow?", `<div class="two-col"><div><b>Enters</b>${li(s.dataFlow && s.dataFlow.in)}</div><div><b>Leaves</b>${li(s.dataFlow && s.dataFlow.out)}</div></div>`)}
      ${sec(9, "Networking requirements", li(s.networking))}
      ${sec(10, "Security requirements", `<div class="kv">${secRows.map(([k, v]) => `<div class="k">${k}</div><div class="v">${esc(v)}</div>`).join("")}</div>`)}
      ${sec(11, "IAM requirements", li(s.iam))}
      ${sec(12, "Scaling", li(s.scaling))}
      ${sec(13, "Availability (Multi-AZ, failover, DR)", li(s.availability))}
      ${sec(14, "Cost considerations", li(s.cost))}
      ${sec(15, "Common mistakes", li(s.commonMistakes))}
      ${sec(16, "Production best practices", li(s.bestPractices))}
      ${sec(17, "How to create it (AWS Console)", `${ol(s.creationSteps)}<h4>Production recommendations</h4>${li(s.productionRecommendations)}`)}
      ${sec(18, "Configuration example", `<div class="code-head"><span>${esc(s.configExample.title)} · ${esc(s.configExample.lang)}</span><button class="copy" data-copy>Copy</button></div><pre><code>${esc(s.configExample.code)}</code></pre>`)}
      ${sec(19, "Production checklist", `<div class="cl-progress"><span data-cl-count>${doneCount}/${(s.productionChecklist || []).length} done</span><i><b data-cl-bar style="width:${(doneCount / Math.max(1, (s.productionChecklist || []).length)) * 100}%"></b></i></div>
        <div class="checklist">${(s.productionChecklist || []).map((x, i) => `<label class="${saved[i] ? "done" : ""}"><input type="checkbox" data-cl="${i}" ${saved[i] ? "checked" : ""}> <span>${esc(x)}</span></label>`).join("")}</div>
        <p style="font-size:11.5px;color:var(--faint)">Saved in this browser only.</p>`)}
      ${sec(20, "Dependencies", `<div class="dep-tree"><div class="root">${s.icon} ${esc(s.shortName)}</div>${(s.dependencies || []).map(d => `<div class="dep" data-open-service="${d.id}"><span class="bdg k-${d.kind}">${d.kind}</span><span>${svcLink(d.id)}</span><span class="why">— ${esc(d.why)}</span></div>`).join("")}</div>
        <div class="pill-row" style="margin-top:10px"><span style="font-size:12px;color:var(--muted);align-self:center">Related:</span>${(s.related || []).map(r => svc(r) ? `<span class="pill" data-open-service="${r}">${svc(r).icon} ${esc(svc(r).shortName)}</span>` : "").join("")}</div>`, "what must exist first?")}
      ${sec(21, "What happens if it fails?", `<div class="fail-box"><b class="t">${esc(s.failure.title)}</b><p>${esc(s.failure.whatHappens)}</p><b>AWS mechanisms that help</b>${li(s.failure.awsMechanisms)}<b>Mitigations</b>${li(s.failure.mitigations)}</div>`)}
      ${sec(22, "Role in the e-commerce platform", `<p>${esc(s.ecommerceRole)}</p>`)}
    `;
    wire(body);
    body.scrollTop = 0;
    // checklist persistence
    body.querySelectorAll("[data-cl]").forEach(cb => cb.addEventListener("change", () => {
      saved[cb.dataset.cl] = cb.checked; try { localStorage.setItem(checklistKey, JSON.stringify(saved)); } catch (e) {}
      cb.closest("label").classList.toggle("done", cb.checked);
      const n = Object.values(saved).filter(Boolean).length, tot = (s.productionChecklist || []).length;
      body.querySelector("[data-cl-count]").textContent = `${n}/${tot} done`; body.querySelector("[data-cl-bar]").style.width = `${(n / tot) * 100}%`;
    }));
    const cp = body.querySelector("[data-copy]"); if (cp) cp.addEventListener("click", () => { navigator.clipboard.writeText(s.configExample.code).then(() => { cp.textContent = "Copied!"; setTimeout(() => cp.textContent = "Copy", 1200); }); });
    if (opts.openSection) { const d = body.querySelectorAll("details.sec")[opts.openSection - 1]; if (d) { d.open = true; d.scrollIntoView({ block: "start" }); } }
    open();
  }

  function comparisonsFor(id) { return (window.AWS_COMPARISONS || []).filter(c => c.items.includes(id)); }

  function renderConnection(c, edge) {
    const src = svc(c.source), dst = svc(c.target);
    const beginner = ctx.beginner();
    const name = id => id === "users" ? "Users / Internet" : (svc(id) ? svc(id).name : id);
    const icon = id => id === "users" ? "👤" : (svc(id) ? svc(id).icon : "•");
    head.innerHTML = `
      <div class="row"><span class="ic">${icon(c.source)}<span style="font-size:16px;color:var(--muted)"> → </span>${icon(c.target)}</span>
        <div><h2>${esc(src ? src.shortName : name(c.source))} → ${esc(dst ? dst.shortName : name(c.target))}</h2><div class="full">Connection · ${esc(c.label)}</div></div>
        <button class="close">✕</button></div>
      <div class="badges">
        <span class="bdg" style="border-color:var(--t-${c.trafficType});color:var(--t-${c.trafficType})"><span class="tt" style="background:var(--t-${c.trafficType})"></span>${esc(ctx.TRAFFIC[c.trafficType] || c.trafficType)}</span>
        <span class="bdg k-${c.kind}">${c.kind}</span>
        <span class="bdg">${c.internetRequired ? "🌐 crosses the internet" : "🔒 stays on AWS / private network"}</span>
      </div>
      <div class="panel-actions"><button data-act="locate">📍 Locate on canvas</button></div>`;
    head.querySelector(".close").addEventListener("click", close);
    head.querySelector("[data-act=locate]").addEventListener("click", () => ctx.locateConnection(c, edge));
    body.innerHTML = `
      <details class="sec" open><summary><span class="num">1</span>Who talks to whom?</summary><div class="sec-body">
        <div class="kv">
          <div class="k">Source</div><div class="v">${svcLink(c.source)} — ${esc(name(c.source))}</div>
          <div class="k">Destination</div><div class="v">${svcLink(c.target)} — ${esc(name(c.target))}</div>
          <div class="k">Direction</div><div class="v">${esc(name(c.source))} initiates the connection${c.trafficType === "async" && /pull|Receive|polls/i.test(c.protocol + c.label) ? " (pull model — the consumer polls; the queue never connects inward)" : ""}.</div>
        </div></div></details>
      <details class="sec" open><summary><span class="num">2</span>${beginner ? "Simple explanation" : "Why & how"}</summary><div class="sec-body">${explain(c.eli5, c.explanation)}</div></details>
      <details class="sec" open><summary><span class="num">3</span>Protocol & network path</summary><div class="sec-body"><div class="kv">
          <div class="k">Protocol</div><div class="v">${esc(c.protocol)}</div>
          <div class="k">Typical port</div><div class="v"><code>${esc(c.port)}</code></div>
          <div class="k">Traffic type</div><div class="v"><span class="tt" style="background:var(--t-${c.trafficType})"></span>${esc(ctx.TRAFFIC[c.trafficType] || c.trafficType)}</div>
          <div class="k">Network</div><div class="v">${esc(c.network)}</div>
          <div class="k">Route</div><div class="v">${esc(c.route)}</div>
          <div class="k">Internet required</div><div class="v">${c.internetRequired ? '<span class="no">Yes</span>' : '<span class="yes">No</span>'}</div>
          <div class="k">NAT required</div><div class="v">${c.natRequired ? '<span class="no">Yes</span>' : '<span class="yes">No</span>'}</div>
        </div></div></details>
      <details class="sec" open><summary><span class="num">4</span>Security</summary><div class="sec-body"><p>${esc(c.security)}</p></div></details>
      <details class="sec"><summary><span class="num">5</span>Requirement level</summary><div class="sec-body"><p><span class="bdg k-${c.kind}">${c.kind}</span> ${kindText(c.kind)}</p></div></details>
      <div class="pill-row" style="margin-top:14px">${src ? `<span class="pill" data-open-service="${src.id}">${src.icon} Open ${esc(src.shortName)}</span>` : ""}${dst ? `<span class="pill" data-open-service="${dst.id}">${dst.icon} Open ${esc(dst.shortName)}</span>` : ""}</div>`;
    wire(body); body.scrollTop = 0; open();
  }
  function kindText(k) {
    return { required: "This connection is part of the core reference architecture; the platform does not work without it.", recommended: "Strongly advised in production, but the application would technically function without it.", optional: "Used only in some deployments; include it when the described scenario applies to you.", alternative: "An alternative to another path in the diagram (e.g. API Gateway → Lambda instead of ALB → ECS). You typically choose one, not both." }[k] || "";
  }

  function wire(scope) {
    scope.querySelectorAll("[data-open-service]").forEach(a => a.addEventListener("click", ev => { ev.stopPropagation(); ctx.openService(a.dataset.openService); }));
    scope.querySelectorAll("[data-open-conn]").forEach(a => a.addEventListener("click", ev => { ev.stopPropagation(); ctx.openConnection(a.dataset.openConn); }));
  }

  return { init, open, close, renderService, renderConnection, isOpen: () => root.classList.contains("open") };
})();
