/* Secondary views: networking (VPC flow, CIDR, route tables, security groups, NACL), IAM,
   request flow animation, e-commerce map, comparisons, failure scenarios,
   security review + production readiness score, service catalog. */
window.AwsViews = (function () {
  let ctx;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const svc = id => ctx.services.find(s => s.id === id);
  const link = id => { const s = svc(id); return s ? `<a class="svc-link" data-open-service="${id}">${s.icon} ${esc(s.shortName)}</a>` : esc(id); };
  const li = arr => `<ul>${(arr || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const wire = scope => {
    scope.querySelectorAll("[data-open-service]").forEach(a => a.addEventListener("click", ev => { ev.stopPropagation(); ctx.openService(a.dataset.openService); }));
    scope.querySelectorAll("[data-open-conn]").forEach(a => a.addEventListener("click", ev => { ev.stopPropagation(); ctx.openConnection(a.dataset.openConn); }));
  };
  const B = () => ctx.beginner();

  function init(c) { ctx = c; }

  /* ======================= NETWORKING ======================= */
  function renderNetworking(root, sub = "flow") {
    root.innerHTML = `<div class="inner">
      <h2>🕸️ VPC Networking</h2>
      <p class="lead">${B() ? "Think of the VPC as your own building inside AWS's city. The building has a front gate (Internet Gateway), public rooms near the entrance, private rooms in the back, and a back door that only opens from the inside (NAT Gateway). Click any box to learn more." : "The VPC is an isolated network in one Region spanning all Availability Zones. Public/private is decided purely by route tables. Click any element for its full node details."}</p>
      <div class="subtabs" data-subtabs>
        <button data-sub="flow" class="${sub === "flow" ? "active" : ""}">Traffic flow</button>
        <button data-sub="cidr" class="${sub === "cidr" ? "active" : ""}">CIDR explainer</button>
        <button data-sub="routes" class="${sub === "routes" ? "active" : ""}">Route tables</button>
        <button data-sub="sg" class="${sub === "sg" ? "active" : ""}">Security groups</button>
        <button data-sub="nacl" class="${sub === "nacl" ? "active" : ""}">NACL</button>
      </div>
      <div class="subview ${sub === "flow" ? "active" : ""}" data-subview="flow">${netFlow()}</div>
      <div class="subview ${sub === "cidr" ? "active" : ""}" data-subview="cidr">${cidrView()}</div>
      <div class="subview ${sub === "routes" ? "active" : ""}" data-subview="routes">${routesView()}</div>
      <div class="subview ${sub === "sg" ? "active" : ""}" data-subview="sg">${sgView()}</div>
      <div class="subview ${sub === "nacl" ? "active" : ""}" data-subview="nacl">${naclView()}</div>
    </div>`;
    root.querySelectorAll("[data-sub]").forEach(b => b.addEventListener("click", () => {
      root.querySelectorAll("[data-sub]").forEach(x => x.classList.toggle("active", x === b));
      root.querySelectorAll("[data-subview]").forEach(v => v.classList.toggle("active", v.dataset.subview === b.dataset.sub));
      location.hash = `#view/networking/${b.dataset.sub}`;
    }));
    wire(root); wireCidr(root); wireRoutes(root); wireSg(root);
  }

  function netFlow() {
    const box = (x, y, w, h, cls, title, sub, id) => `<g data-open-service="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" class="box ${cls}"/><text x="${x + w / 2}" y="${y + 24}" text-anchor="middle">${esc(title)}</text><text x="${x + w / 2}" y="${y + 42}" text-anchor="middle" class="s">${esc(sub)}</text></g>`;
    const arrow = (x1, y1, x2, y2, label, cls = "") => `<path d="M${x1},${y1} L${x2},${y2}" class="ln ${cls}" marker-end="url(#na)"/>${label ? `<text x="${(x1 + x2) / 2 + 8}" y="${(y1 + y2) / 2 + 4}" class="p">${esc(label)}</text>` : ""}`;
    const L = 40, R = 470;
    return `<div class="two-col">
      <div class="diagram-box"><svg class="dg" viewBox="0 0 420 620" width="420"><defs><marker id="na" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/></marker></defs>
        <text x="20" y="22" class="grp-l">INBOUND — how a request reaches the database</text>
        ${box(L, 40, 340, 56, "ext", "Internet", "shopper's browser (via CloudFront)", "cloudfront")}
        ${arrow(210, 96, 210, 124, "HTTPS 443")}
        ${box(L, 126, 340, 56, "", "Internet Gateway", "VPC's door · public RT 0.0.0.0/0 → igw", "igw")}
        ${arrow(210, 182, 210, 210)}
        <rect x="24" y="212" width="372" height="90" class="grp"/><text x="34" y="228" class="grp-l">PUBLIC SUBNET 10.0.1.0/24</text>
        ${box(L, 236, 340, 56, "pub", "ALB", "alb-sg: 443 from CloudFront · TLS ends here", "alb")}
        ${arrow(210, 302, 210, 330, "HTTP 8080 · alb-sg → ecs-sg")}
        <rect x="24" y="332" width="372" height="90" class="grp"/><text x="34" y="348" class="grp-l">PRIVATE APP SUBNET 10.0.11.0/24</text>
        ${box(L, 356, 340, 56, "priv", "ECS tasks / EC2", "no public IP · RT 0.0.0.0/0 → NAT", "ecs")}
        ${arrow(210, 422, 210, 450, "TCP 5432 · ecs-sg → rds-sg")}
        <rect x="24" y="452" width="372" height="90" class="grp"/><text x="34" y="468" class="grp-l">PRIVATE DB SUBNET 10.0.21.0/24</text>
        ${box(L, 476, 340, 56, "db", "RDS", "RT: local only · never internet-reachable", "rds")}
        <text x="210" y="580" text-anchor="middle" class="s">Each hop is allowed by a security-group reference, not a CIDR.</text>
        <text x="210" y="598" text-anchor="middle" class="s">Replies flow back automatically (security groups are stateful).</text>
      </svg></div>
      <div>
        <div class="diagram-box"><svg class="dg" viewBox="0 0 420 330" width="420">
          <text x="20" y="22" class="grp-l">OUTBOUND — private task calls an external API</text>
          ${box(L, 40, 340, 56, "priv", "Private subnet · ECS task", "10.0.11.x · needs payment API", "ecs")}
          ${arrow(210, 96, 210, 124, "private RT: 0.0.0.0/0 → nat")}
          ${box(L, 126, 340, 56, "pub", "NAT Gateway (public subnet)", "rewrites source → Elastic IP", "nat-gateway")}
          ${arrow(210, 182, 210, 210, "public RT: 0.0.0.0/0 → igw")}
          ${box(L, 212, 340, 56, "", "Internet Gateway", "", "igw")}
          ${arrow(210, 268, 210, 296)}
          <text x="210" y="318" text-anchor="middle">🌐 Internet (payment provider, package registries)</text>
        </svg></div>
        <div class="note"><b>Why does NAT exist?</b><br>${B() ? "Workers in the back rooms sometimes need to fetch things from town — updates, or a call to the bank. But we never want strangers walking in through that door. The NAT Gateway is a door that only opens from the inside: workers can go out and come back, nobody can come in." : "Private servers sometimes need to download updates or call external APIs, but we don't want the internet to directly start a connection to those servers. NAT allows outbound-initiated internet access while keeping the private server unreachable from the internet. It tracks each connection so replies return to the right task, and it has no public IP of the task's own to attack."}</div>
        <div class="note ok"><b>When is NAT NOT required?</b> If the private tier only talks to AWS services, use VPC endpoints instead: gateway endpoints for ${link("s3")} and ${link("dynamodb")} are free; interface endpoints cover ECR, CloudWatch Logs, SQS, Secrets Manager. ${link("rds")} needs neither NAT nor endpoints.</div>
        <div class="card-grid" style="margin-top:12px">${["vpc", "subnets", "route-tables", "igw", "nat-gateway", "security-groups", "nacl", "cidr"].map(id => { const s = svc(id); return s ? `<div class="card clickable" data-open-service="${id}"><h4><span class="ic">${s.icon}</span>${esc(s.shortName)}</h4><p>${esc(s.tagline)}</p></div>` : ""; }).join("")}</div>
      </div>
    </div>`;
  }

  /* ---- CIDR ---- */
  const SUBNET_PLAN = [
    { cidr: "10.0.1.0/24", tier: "public", az: "A", use: "ALB nodes, NAT Gateway A" }, { cidr: "10.0.2.0/24", tier: "public", az: "B", use: "ALB nodes, NAT Gateway B" },
    { cidr: "10.0.11.0/24", tier: "app", az: "A", use: "ECS tasks, EC2, Lambda ENIs, interface endpoints" }, { cidr: "10.0.12.0/24", tier: "app", az: "B", use: "ECS tasks, EC2, Lambda ENIs, interface endpoints" },
    { cidr: "10.0.21.0/24", tier: "db", az: "A", use: "RDS primary" }, { cidr: "10.0.22.0/24", tier: "db", az: "B", use: "RDS standby" }
  ];
  function parseCidr(str) {
    const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec((str || "").trim()); if (!m) return null;
    const o = m.slice(1, 5).map(Number), p = +m[5]; if (o.some(x => x > 255) || p > 32) return null;
    const ip = ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3];
    const size = 2 ** (32 - p), mask = p === 0 ? 0 : (~0 << (32 - p)) >>> 0;
    const net = (ip & mask) >>> 0, last = net + size - 1;
    const fmt = n => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
    return { prefix: p, size, usable: Math.max(0, size - 5), first: fmt(net), last: fmt(last), firstUsable: fmt(net + 4), lastUsable: fmt(last - 1), net, last: last, netStr: fmt(net), lastStr: fmt(last), mask: fmt(mask), reserved: [[fmt(net), "network address"], [fmt(net + 1), "VPC router"], [fmt(net + 2), "Amazon DNS"], [fmt(net + 3), "reserved for future use"], [fmt(last), "network broadcast (not supported, reserved)"]] };
  }
  function cidrView() {
    // /16 split into 16 blocks of /20 (4096 addresses each); then zoom into first /19 (32 × /24)
    const blocks24 = Array.from({ length: 32 }, (_, i) => { const c = `10.0.${i}.0/24`; const plan = SUBNET_PLAN.find(p => p.cidr === c); return { i, c, plan }; });
    return `<div class="two-col">
      <div>
        <h3 style="margin-top:0">The plan, visually</h3>
        <p style="color:var(--muted);font-size:13px">VPC <code>10.0.0.0/16</code> = 65,536 addresses. Each row below zooms in one level. Click a block.</p>
        <div style="font-size:11px;color:var(--faint);margin-top:8px">10.0.0.0/16 split into 16 × /20 blocks (4,096 addresses each)</div>
        <div class="cidr-bar" data-bar="20">${Array.from({ length: 16 }, (_, i) => `<div class="${i === 0 ? "used u-vpc" : ""}" data-cidr="10.0.${i * 16}.0/20" title="10.0.${i * 16}.0/20">${i === 0 ? "in use ↓" : `.${i * 16}`}</div>`).join("")}</div>
        <div style="font-size:11px;color:var(--faint);margin-top:10px">10.0.0.0/19 zoomed: 32 × /24 blocks (256 addresses each, 251 usable)</div>
        <div class="cidr-bar" data-bar="24" style="height:54px">${blocks24.map(b => `<div class="${b.plan ? "used u-" + b.plan.tier : ""}" data-cidr="${b.c}" title="${b.c}${b.plan ? " · " + b.plan.tier + " " + b.plan.az : ""}">${b.plan ? (b.plan.tier === "public" ? "pub" : b.plan.tier) + "-" + b.plan.az : "." + b.i}</div>`).join("")}</div>
        <div class="pill-row" style="margin:8px 0 14px;font-size:11.5px"><span class="pill" style="border-color:var(--pub-b)">■ public</span><span class="pill" style="border-color:var(--priv-b)">■ private app</span><span class="pill" style="border-color:var(--db-b)">■ private DB</span><span class="pill">□ free for growth</span></div>
        <table class="tbl"><thead><tr><th>Subnet</th><th>Tier / AZ</th><th>Usable IPs</th><th>Holds</th></tr></thead><tbody>
          ${SUBNET_PLAN.map(p => `<tr class="clickable" data-cidr="${p.cidr}"><td><code>${p.cidr}</code></td><td>${p.tier} · AZ-${p.az}</td><td>251</td><td class="dim">${esc(p.use)}</td></tr>`).join("")}
        </tbody></table>
      </div>
      <div>
        <h3 style="margin-top:0">CIDR calculator</h3>
        <div class="cidr-calc"><input id="cidr-input" value="10.0.0.0/16" spellcheck="false"><button class="icon-btn" data-cidr-calc>Calculate</button></div>
        <div id="cidr-out"></div>
        <h3>What the numbers mean</h3>
        ${B() ? `<div class="eli5">An IP address is like a house number with four parts (10.0.11.7). The number after the slash says how many parts are "the street name" and how many are "the house numbers". /16 means the first two parts are fixed (10.0.*.*) so you have 65,536 house numbers. /24 means three parts are fixed (10.0.11.*) so you have 256 house numbers on that street. Streets must not share house numbers, so subnets must not overlap.</div>` : ""}
        <ul style="line-height:1.7;font-size:13.5px">
          <li><b>/16</b> → 16 bits fixed, 16 bits for hosts → 2¹⁶ = <b>65,536</b> addresses. The VPC's whole range.</li>
          <li><b>/24</b> → 24 bits fixed, 8 for hosts → 2⁸ = <b>256</b> addresses; AWS reserves 5 per subnet, so <b>251 usable</b>.</li>
          <li><b>Why no overlap?</b> A route table matches the most specific prefix; overlapping subnets would make the router's choice ambiguous, and AWS refuses to create them. Also plan against VPC peering / on-prem ranges: 10.0.0.0/16 cannot peer with another 10.0.0.0/16.</li>
          <li><b>Production design:</b> one /16 per VPC; tiers get a distinct second-to-last octet range (1–9 public, 11–19 app, 21–29 DB) so a glance at an IP tells you its tier and AZ; leave most of the /16 unused for new AZs, EKS pods, or migrations. Interface endpoints and Fargate tasks each consume an IP in the app subnet — a /24 is fine for hundreds of tasks; use /22 or larger for EKS.</li>
          <li><b>Limits:</b> VPC CIDR must be /16 – /28. You can add secondary CIDR blocks later, but cannot shrink or change the primary.</li>
        </ul>
        <div class="pill-row"><span class="pill" data-open-service="cidr">🔢 Open the full CIDR node</span><span class="pill" data-open-service="subnets">🧩 Subnets</span><span class="pill" data-open-service="vpc">🏠 VPC</span></div>
      </div>
    </div>`;
  }
  function wireCidr(root) {
    const input = root.querySelector("#cidr-input"), out = root.querySelector("#cidr-out"); if (!input) return;
    const show = str => {
      const r = parseCidr(str);
      if (!r) { out.innerHTML = `<div class="note bad">Not a valid CIDR. Format: <code>10.0.0.0/16</code></div>`; return; }
      const plan = SUBNET_PLAN.find(p => p.cidr === str.trim());
      out.innerHTML = `<div class="pill-row" style="margin:8px 0"><div class="stat"><b>${r.size.toLocaleString()}</b><span>total addresses</span></div><div class="stat"><b>${r.prefix <= 28 ? r.usable.toLocaleString() : "n/a"}</b><span>usable in a subnet (−5 reserved)</span></div><div class="stat"><b>/${r.prefix}</b><span>${r.prefix} fixed bits · ${32 - r.prefix} host bits</span></div></div>
        <div class="kv" style="margin-top:8px"><div class="k">Range</div><div class="v"><code>${r.netStr}</code> – <code>${r.lastStr}</code></div><div class="k">Subnet mask</div><div class="v"><code>${r.mask}</code></div><div class="k">Usable hosts</div><div class="v"><code>${r.firstUsable}</code> – <code>${r.lastUsable}</code></div>
        ${plan ? `<div class="k">In this architecture</div><div class="v">${plan.tier} subnet, AZ-${plan.az}: ${esc(plan.use)}</div>` : ""}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:8px">AWS reserves 5 addresses in every subnet:</div><table class="tbl" style="margin-top:4px">${r.reserved.map(([a, w]) => `<tr><td><code>${a}</code></td><td class="dim">${w}</td></tr>`).join("")}</table>
        ${r.prefix < 16 || r.prefix > 28 ? `<div class="note warn">A VPC CIDR must be between /16 and /28.</div>` : ""}`;
    };
    root.querySelector("[data-cidr-calc]").addEventListener("click", () => show(input.value));
    input.addEventListener("keydown", e => { if (e.key === "Enter") show(input.value); });
    root.querySelectorAll("[data-cidr]").forEach(el => el.addEventListener("click", () => { input.value = el.dataset.cidr; show(input.value); root.querySelectorAll(".cidr-bar div").forEach(d => d.classList.toggle("sel", d.dataset.cidr === el.dataset.cidr)); }));
    show(input.value);
  }

  /* ---- Route tables ---- */
  const ROUTE_TABLES = [
    { id: "public", name: "Public route table", assoc: "10.0.1.0/24 (AZ-A), 10.0.2.0/24 (AZ-B)", routes: [
      { dest: "10.0.0.0/16", target: "local", why: "Every route table has this and you cannot remove it: any address inside the VPC is delivered directly." },
      { dest: "0.0.0.0/0", target: "igw-0abc (Internet Gateway)", why: "Any traffic going outside the VPC goes through the Internet Gateway. This single route is what makes the subnet 'public'. The ALB and NAT Gateways live here." }] },
    { id: "private-a", name: "Private app route table — AZ-A", assoc: "10.0.11.0/24", routes: [
      { dest: "10.0.0.0/16", target: "local", why: "Reach the ALB, the database, and other tasks directly." },
      { dest: "0.0.0.0/0", target: "nat-0aaa (NAT Gateway in 10.0.1.0/24, AZ-A)", why: "Outbound internet (payment APIs, ECR pulls without endpoints) goes via the NAT in the SAME AZ. Nothing from the internet can initiate a connection because the subnet has no IGW route and tasks have no public IPs." },
      { dest: "pl-63a5400a (S3 prefix list)", target: "vpce-s3 (gateway endpoint)", why: "S3 traffic stays on the AWS network and bypasses NAT charges." },
      { dest: "pl-02cd2c6b (DynamoDB prefix list)", target: "vpce-dynamodb (gateway endpoint)", why: "Same for DynamoDB — free and private." }] },
    { id: "private-b", name: "Private app route table — AZ-B", assoc: "10.0.12.0/24", routes: [
      { dest: "10.0.0.0/16", target: "local", why: "Local VPC delivery." },
      { dest: "0.0.0.0/0", target: "nat-0bbb (NAT Gateway in 10.0.2.0/24, AZ-B)", why: "One route table per AZ so each AZ uses its own NAT. If AZ-A fails, AZ-B still has outbound access — and you avoid cross-AZ data charges." },
      { dest: "S3 / DynamoDB prefix lists", target: "gateway endpoints", why: "Same endpoints as AZ-A (gateway endpoints are VPC-wide)." }] },
    { id: "db", name: "Database route table", assoc: "10.0.21.0/24, 10.0.22.0/24", routes: [
      { dest: "10.0.0.0/16", target: "local", why: "The application subnets can reach the database; that is all it needs." },
      { dest: "(no 0.0.0.0/0 route)", target: "—", why: "Databases generally don't need direct internet access. RDS patches and backs itself up over AWS-internal channels. No default route means even a misconfigured security group cannot leak data to the internet." }] }
  ];
  function routesView() {
    return `<p class="lead">A subnet is associated with exactly one route table. The router picks the most specific matching prefix. Click a row for the explanation.</p>
      <div class="subtabs" data-rt-tabs>${ROUTE_TABLES.map((t, i) => `<button data-rt="${t.id}" class="${i === 0 ? "active" : ""}">${esc(t.name)}</button>`).join("")}</div>
      ${ROUTE_TABLES.map((t, i) => `<div class="subview ${i === 0 ? "active" : ""}" data-rt-view="${t.id}">
        <div style="font-size:12.5px;color:var(--muted);margin-bottom:6px">Associated subnets: <code>${esc(t.assoc)}</code></div>
        <table class="tbl"><thead><tr><th style="width:34%">Destination</th><th>Target</th></tr></thead><tbody>
          ${t.routes.map((r, j) => `<tr class="clickable" data-rt-row="${t.id}-${j}"><td><code>${esc(r.dest)}</code></td><td>${esc(r.target)}</td></tr>`).join("")}
        </tbody></table>
        ${t.routes.map((r, j) => `<div class="note" data-rt-note="${t.id}-${j}" style="display:${j === 1 ? "block" : "none"}"><b>${esc(r.dest)} → ${esc(r.target)}</b><br>${esc(r.why)}</div>`).join("")}
      </div>`).join("")}
      <div class="note warn" style="margin-top:16px"><b>Common mistakes:</b> pointing a "private" subnet at the IGW (it silently becomes public); one NAT shared by both AZs; forgetting to associate the new subnet (it falls back to the main route table); giving the DB subnet a NAT route "just in case".</div>
      <div class="pill-row"><span class="pill" data-open-service="route-tables">🗺️ Open the Route Tables node</span><span class="pill" data-open-service="igw">🌐 IGW</span><span class="pill" data-open-service="nat-gateway">🔁 NAT Gateway</span></div>`;
  }
  function wireRoutes(root) {
    root.querySelectorAll("[data-rt]").forEach(b => b.addEventListener("click", () => { root.querySelectorAll("[data-rt]").forEach(x => x.classList.toggle("active", x === b)); root.querySelectorAll("[data-rt-view]").forEach(v => v.classList.toggle("active", v.dataset.rtView === b.dataset.rt)); }));
    root.querySelectorAll("[data-rt-row]").forEach(r => r.addEventListener("click", () => { const id = r.dataset.rtRow; const tbl = id.slice(0, id.lastIndexOf("-")); root.querySelectorAll(`[data-rt-note^="${tbl}-"]`).forEach(n => n.style.display = n.dataset.rtNote === id ? "block" : "none"); }));
  }

  /* ---- Security groups ---- */
  const SGS = [
    { id: "alb-sg", name: "ALB Security Group (alb-sg)", attached: "ALB nodes (public subnets)", inbound: [["HTTPS", "443", "CloudFront origin-facing prefix list (com.amazonaws.global.cloudfront.origin-facing)", "Only CloudFront may reach the ALB; nobody can bypass WAF/caching."], ["HTTP", "80", "same prefix list (optional)", "Only to redirect to HTTPS."]], outbound: [["TCP", "8080", "ecs-sg", "Forward to tasks and run health checks."]], bad: [["HTTPS", "443", "0.0.0.0/0", "Attackers hit the ALB DNS name directly, skipping CloudFront + WAF."]] },
    { id: "ecs-sg", name: "ECS Task Security Group (ecs-sg)", attached: "Every Fargate task ENI (API + worker)", inbound: [["TCP", "8080", "alb-sg", "Only the load balancer may send requests. New ALB nodes / tasks are covered automatically because the rule references a group, not IPs."]], outbound: [["TCP", "5432", "rds-sg", "Database queries."], ["HTTPS", "443", "0.0.0.0/0 (via NAT / endpoints)", "AWS APIs (SQS, S3, DynamoDB, ECR, logs) and third-party APIs."]], bad: [["TCP", "8080", "10.0.0.0/16", "Any compromised host in the VPC can call the API directly."], ["ALL", "ALL", "0.0.0.0/0", "The classic 'make it work' rule — exposes every port."]] },
    { id: "rds-sg", name: "RDS Security Group (rds-sg)", attached: "RDS instance ENIs (DB subnets)", inbound: [["TCP", "5432", "ecs-sg", "Only application tasks may open the PostgreSQL port."], ["TCP", "5432", "lambda-sg / bastion-sg (optional)", "Add only the groups that genuinely need SQL access."]], outbound: [["—", "—", "none needed", "RDS never initiates connections to your resources; stateful replies are automatic."]], bad: [["TCP", "5432", "0.0.0.0/0", "Any IP on the internet (if a route exists) or any host in the VPC can attempt to log in. This is the #1 data-breach misconfiguration."]] }
  ];
  function sgView() {
    return `<p class="lead">${B() ? "Security groups are bodyguards standing next to each server. Each one has a short list of who may talk to it. In a good design, each bodyguard only lets in the previous team — never 'everyone'." : "Security groups are stateful, ENI-level firewalls with allow-only rules. Referencing another security group as the source means the rule follows the workload: any ENI that carries alb-sg is allowed, nothing else."}</p>
      <div class="two-col">
        <div>
          <div class="pill-row" style="margin-bottom:6px"><button class="icon-btn" data-sg-toggle>Show the 0.0.0.0/0 anti-pattern</button></div>
          <div class="sg-chain" id="sg-chain">
            <div class="sg-box ext"><b>🌐 Internet → CloudFront</b><span>shoppers · WAF · TLS</span></div>
            <div class="sg-arrow" data-sg-arrow="0">↓ HTTPS 443 · source: CloudFront prefix list</div>
            <div class="sg-box" data-sg="alb-sg"><b>🛡️ alb-sg</b><span>ALB nodes · public subnets</span></div>
            <div class="sg-arrow" data-sg-arrow="1">↓ TCP 8080 · source: alb-sg</div>
            <div class="sg-box" data-sg="ecs-sg"><b>🛡️ ecs-sg</b><span>ECS tasks · private app subnets</span></div>
            <div class="sg-arrow" data-sg-arrow="2">↓ TCP 5432 · source: ecs-sg</div>
            <div class="sg-box" data-sg="rds-sg"><b>🛡️ rds-sg</b><span>RDS · private DB subnets</span></div>
          </div>
          <div class="note ok" id="sg-note"><b>Why this is safer than 0.0.0.0/0:</b> each tier can be reached only from the tier before it. A leaked database password is useless unless the attacker is already running inside an ECS task. Rules stay correct as tasks scale in and out because they reference groups, not IP addresses that change.</div>
        </div>
        <div id="sg-detail">${sgDetail(SGS[0], false)}</div>
      </div>
      <div class="pill-row" style="margin-top:14px"><span class="pill" data-open-service="security-groups">🛡️ Open the Security Groups node</span><span class="pill" data-open-service="nacl">🚧 Compare with NACL</span></div>`;
  }
  function sgDetail(sg, bad) {
    const row = r => `<tr><td>${r[0]}</td><td><code>${r[1]}</code></td><td>${esc(r[2])}</td><td class="dim">${esc(r[3])}</td></tr>`;
    return `<h3 style="margin-top:0">${esc(sg.name)}</h3><div style="font-size:12.5px;color:var(--muted)">Attached to: ${esc(sg.attached)}</div>
      <h4 style="margin:12px 0 4px;font-size:12px;text-transform:uppercase;color:var(--faint)">Inbound rules ${bad ? "(anti-pattern)" : ""}</h4>
      <table class="tbl"><thead><tr><th>Type</th><th>Port</th><th>Source</th><th>Why</th></tr></thead><tbody>${(bad ? sg.bad : sg.inbound).map(row).join("")}</tbody></table>
      <h4 style="margin:12px 0 4px;font-size:12px;text-transform:uppercase;color:var(--faint)">Outbound rules</h4>
      <table class="tbl"><thead><tr><th>Type</th><th>Port</th><th>Destination</th><th>Why</th></tr></thead><tbody>${sg.outbound.map(row).join("")}</tbody></table>
      <p style="font-size:12px;color:var(--muted);margin-top:8px">Stateful: replies to allowed inbound requests are permitted automatically — no outbound rule for ephemeral ports is needed (unlike NACLs).</p>`;
  }
  function wireSg(root) {
    const chain = root.querySelector("#sg-chain"); if (!chain) return;
    let bad = false, cur = "alb-sg";
    const refresh = () => {
      root.querySelector("#sg-detail").innerHTML = sgDetail(SGS.find(s => s.id === cur), bad);
      chain.querySelectorAll("[data-sg]").forEach(b => { b.classList.toggle("sel", b.dataset.sg === cur); b.classList.toggle("bad", bad); });
      chain.querySelectorAll("[data-sg-arrow]").forEach((a, i) => { a.classList.toggle("bad", bad); a.textContent = bad ? ["↓ HTTPS 443 · source: 0.0.0.0/0", "↓ TCP 8080 · source: 0.0.0.0/0", "↓ TCP 5432 · source: 0.0.0.0/0"][i] : ["↓ HTTPS 443 · source: CloudFront prefix list", "↓ TCP 8080 · source: alb-sg", "↓ TCP 5432 · source: ecs-sg"][i]; });
      const note = root.querySelector("#sg-note"); note.className = "note " + (bad ? "bad" : "ok");
      note.innerHTML = bad ? "<b>With 0.0.0.0/0 everywhere:</b> the ALB can be hit directly (bypassing WAF), any host in the VPC or on the internet can call the API port, and the database accepts login attempts from anywhere. One leaked credential = full breach. This is what the Security Review flags as <i>0.0.0.0/0 database access</i>." : "<b>Why this is safer than 0.0.0.0/0:</b> each tier can be reached only from the tier before it. A leaked database password is useless unless the attacker is already running inside an ECS task. Rules stay correct as tasks scale in and out because they reference groups, not IP addresses that change.";
      root.querySelector("[data-sg-toggle]").textContent = bad ? "Show the correct chain" : "Show the 0.0.0.0/0 anti-pattern";
    };
    chain.querySelectorAll("[data-sg]").forEach(b => b.addEventListener("click", () => { cur = b.dataset.sg; refresh(); }));
    root.querySelector("[data-sg-toggle]").addEventListener("click", () => { bad = !bad; refresh(); });
    refresh();
  }

  /* ---- NACL ---- */
  function naclView() {
    return `<p class="lead">${B() ? "A NACL is a guard at the door of a whole room (subnet). It checks every person walking in AND every person walking out, and it forgets them immediately — so you must explicitly allow the replies too." : "Network ACLs are stateless, subnet-level filters with numbered allow/deny rules evaluated in order (lowest number first, first match wins, implicit deny at the end). Because they are stateless you must allow ephemeral return ports (1024–65535)."}</p>
      <h3>Example: NACL for the private DB subnets (10.0.21.0/24, 10.0.22.0/24)</h3>
      <div class="two-col"><div><h4 style="font-size:12px;text-transform:uppercase;color:var(--faint)">Inbound</h4><table class="tbl"><thead><tr><th>#</th><th>Type</th><th>Port</th><th>Source</th><th>Allow/Deny</th></tr></thead><tbody>
        <tr><td>100</td><td>TCP</td><td>5432</td><td>10.0.11.0/24</td><td class="yes">ALLOW</td></tr>
        <tr><td>110</td><td>TCP</td><td>5432</td><td>10.0.12.0/24</td><td class="yes">ALLOW</td></tr>
        <tr><td>*</td><td>ALL</td><td>ALL</td><td>0.0.0.0/0</td><td class="no">DENY</td></tr></tbody></table></div>
      <div><h4 style="font-size:12px;text-transform:uppercase;color:var(--faint)">Outbound</h4><table class="tbl"><thead><tr><th>#</th><th>Type</th><th>Port</th><th>Destination</th><th>Allow/Deny</th></tr></thead><tbody>
        <tr><td>100</td><td>TCP</td><td>1024–65535</td><td>10.0.11.0/24</td><td class="yes">ALLOW</td></tr>
        <tr><td>110</td><td>TCP</td><td>1024–65535</td><td>10.0.12.0/24</td><td class="yes">ALLOW</td></tr>
        <tr><td>*</td><td>ALL</td><td>ALL</td><td>0.0.0.0/0</td><td class="no">DENY</td></tr></tbody></table></div></div>
      <div class="note warn"><b>The classic NACL bug:</b> you allow inbound 5432 but forget the outbound ephemeral-port rule. The SYN arrives, the SYN-ACK reply is dropped at the subnet edge, and every connection hangs. Security groups do not have this problem because they are stateful.</div>
      <div class="note"><b>Where NACLs earn their keep:</b> denying a known-bad CIDR across a whole subnet (SGs cannot deny), restricting the DB tier to the app-tier CIDRs as a second layer, and satisfying compliance controls that require subnet-level filtering. Most teams keep the default allow-all NACL on public/app subnets and rely on security groups.</div>
      <div class="pill-row"><span class="pill" data-open-service="nacl">🚧 Open the NACL node</span><span class="pill" data-open-service="security-groups">🛡️ Security Groups</span></div>`;
  }

  /* ======================= IAM ======================= */
  const IAM_TERMS = [
    { t: "User", d: "A person or application with long-lived credentials (password / access keys). Use for humans only — and prefer SSO/Identity Center even then.", e: "A named person with their own key to the building." },
    { t: "Group", d: "A collection of users that share policies (e.g. Developers, Billing). Groups cannot be nested and cannot be assumed.", e: "A team — everyone on the team gets the same keys." },
    { t: "Role", d: "An identity with permissions that is assumed temporarily by a trusted principal (an ECS task, a Lambda function, an EC2 instance, a user in another account). Credentials are short-lived and rotated automatically.", e: "A badge you borrow for a shift. It says what doors you can open, and it stops working when the shift ends." },
    { t: "Policy", d: "A JSON document listing Allow/Deny statements: Effect, Action (s3:GetObject), Resource (an ARN), optional Condition. Attached to users, groups, or roles (identity-based) or to resources like buckets and queues (resource-based).", e: "The list written on the badge: 'may open the photo box, may not open the money drawer'." },
    { t: "Permission", d: "A single allowed (or denied) action on a resource, resulting from evaluating all applicable policies. Explicit Deny always wins; otherwise you need at least one Allow.", e: "One line on the badge's list." },
    { t: "Resource", d: "The AWS object being acted on, identified by an ARN (arn:aws:s3:::shop-images/*). Scoping policies to specific ARNs is the heart of least privilege.", e: "A specific door or drawer." },
    { t: "Trust policy", d: "The part of a role that says WHO may assume it (e.g. ecs-tasks.amazonaws.com). Permission policies say WHAT the role can do.", e: "The rule about who is allowed to borrow this badge." },
    { t: "Authentication", d: "Proving who you are: SigV4-signed requests with the role's temporary credentials; users with password + MFA.", e: "Showing your face at the door." },
    { t: "Authorization", d: "Deciding what you may do: IAM evaluates identity policies, resource policies, permission boundaries, SCPs, and session policies.", e: "The guard reading your badge before opening the door." },
    { t: "Least privilege", d: "Grant only the actions and resources the workload actually uses. Start from CloudTrail activity (IAM Access Analyzer can generate policies) and tighten over time.", e: "Give each worker only the keys for their own job." }
  ];
  const IAM_EXAMPLES = [
    { who: "ECS Task Role", to: "s3", icon: "📦", trust: "ecs-tasks.amazonaws.com", actions: ["s3:PutObject", "s3:GetObject"], resource: "arn:aws:s3:::shop-product-images/*", story: "The API container uploads product images. The task assumes its task role; the SDK signs each S3 request with the role's temporary credentials. No access keys exist anywhere in the image." },
    { who: "Lambda Execution Role", to: "dynamodb", icon: "λ", trust: "lambda.amazonaws.com", actions: ["dynamodb:UpdateItem", "dynamodb:GetItem"], resource: "arn:aws:dynamodb:us-east-1:123456789012:table/shop-metrics", story: "The OrderPlaced handler updates counters. Its execution role also has AWSLambdaBasicExecutionRole for CloudWatch Logs. It cannot touch the orders table because that ARN is not in the policy." },
    { who: "EC2 Instance Role (instance profile)", to: "cloudwatch", icon: "🖥️", trust: "ec2.amazonaws.com", actions: ["cloudwatch:PutMetricData", "logs:PutLogEvents", "logs:CreateLogStream"], resource: "* (CloudWatch metrics do not support resource-level ARNs; logs can be scoped to log-group ARNs)", story: "The CloudWatch agent on an EC2 instance publishes memory and disk metrics and ships logs. The instance profile delivers rotating credentials through IMDSv2 — no keys on disk." }
  ];
  function renderIam(root) {
    root.innerHTML = `<div class="inner"><h2>🔑 IAM — who may do what</h2>
      <p class="lead">${B() ? "IAM is the badge office of the building. Every worker (a server, a container, a function, a person) gets a badge that lists exactly which doors they may open. Nobody carries secret passwords around; badges expire and are replaced automatically." : "IAM answers two questions for every AWS API call: who is calling (authentication) and are they allowed (authorization). Workloads should always use roles with short-lived credentials; policies should name specific actions and resource ARNs."}</p>
      <div class="diagram-box"><svg class="dg" viewBox="0 0 980 150" width="980"><defs><marker id="ia" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/></marker></defs>
        <rect x="20" y="40" width="200" height="70" class="box"/><text x="120" y="70" text-anchor="middle">User / Service</text><text x="120" y="90" text-anchor="middle" class="s">ECS task · Lambda · EC2 · person</text>
        <path d="M220,75 L290,75" class="ln" marker-end="url(#ia)"/><text x="255" y="65" text-anchor="middle" class="p">assumes</text>
        <rect x="292" y="40" width="200" height="70" class="box" data-open-service="iam"/><text x="392" y="70" text-anchor="middle">IAM Role</text><text x="392" y="90" text-anchor="middle" class="s">trust policy: who may assume</text>
        <path d="M492,75 L562,75" class="ln" marker-end="url(#ia)"/><text x="527" y="65" text-anchor="middle" class="p">has</text>
        <rect x="564" y="40" width="200" height="70" class="box" data-open-service="iam"/><text x="664" y="70" text-anchor="middle">IAM Policy</text><text x="664" y="90" text-anchor="middle" class="s">Allow · Action · Resource</text>
        <path d="M764,75 L834,75" class="ln" marker-end="url(#ia)"/><text x="799" y="65" text-anchor="middle" class="p">grants access to</text>
        <rect x="836" y="40" width="130" height="70" class="box"/><text x="901" y="70" text-anchor="middle">AWS Service</text><text x="901" y="90" text-anchor="middle" class="s">S3 · DynamoDB · …</text>
        <text x="490" y="138" text-anchor="middle" class="s">Temporary credentials (STS) are delivered automatically to the task/function/instance. No access keys in code.</text>
      </svg></div>
      <h3>Three real examples — click one</h3>
      <div class="subtabs" data-iam-tabs>${IAM_EXAMPLES.map((e, i) => `<button data-iam="${i}" class="${i === 0 ? "active" : ""}">${e.icon} ${esc(e.who)} → ${esc(svc(e.to).shortName)}</button>`).join("")}</div>
      <div id="iam-example"></div>
      <h3>Vocabulary — click a term</h3>
      <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">${IAM_TERMS.map((t, i) => `<div class="iam-term" data-term="${i}"><b>${esc(t.t)}</b><span>${esc(B() ? t.e : t.d)}</span></div>`).join("")}</div>
      <div id="iam-term-detail"></div>
      <h3>Two different kinds of "auth" in this architecture</h3>
      <div class="two-col"><div class="card"><h4>🔑 IAM (service-to-service)</h4><p>Which AWS principal may call which AWS API. ECS task role → S3; Lambda role → DynamoDB; API Gateway → invoke Lambda. Machine identities, SigV4 signatures.</p><p><span class="pill" data-open-service="iam">Open IAM</span></p></div>
      <div class="card"><h4>🎫 Application authorization (end users)</h4><p>Which shopper may see which order. Cognito / OIDC issues a JWT; the API (or an API Gateway authorizer / ALB OIDC action) validates it and applies roles. IAM knows nothing about your shoppers.</p><p><span class="pill" data-open-service="authorization">Open Authorization</span></p></div></div>
    </div>`;
    const ex = root.querySelector("#iam-example");
    const showEx = i => {
      const e = IAM_EXAMPLES[i];
      ex.innerHTML = `<div class="two-col"><div class="card"><h4>${e.icon} ${esc(e.who)} → ${link(e.to)}</h4><p>${esc(e.story)}</p>
          <div class="kv" style="margin-top:8px"><div class="k">Trusted principal</div><div class="v"><code>${esc(e.trust)}</code></div><div class="k">Actions</div><div class="v">${e.actions.map(a => `<code>${a}</code>`).join(" ")}</div><div class="k">Resource</div><div class="v"><code style="word-break:break-all">${esc(e.resource)}</code></div></div></div>
        <div><div class="code-head"><span>Trust policy (who may assume)</span></div><pre><code>${esc(JSON.stringify({ Version: "2012-10-17", Statement: [{ Effect: "Allow", Principal: { Service: e.trust }, Action: "sts:AssumeRole" }] }, null, 2))}</code></pre>
        <div class="code-head"><span>Permission policy (what it may do)</span></div><pre><code>${esc(JSON.stringify({ Version: "2012-10-17", Statement: [{ Effect: "Allow", Action: e.actions, Resource: e.resource.split(" ")[0] }] }, null, 2))}</code></pre></div></div>`;
      root.querySelectorAll("[data-iam]").forEach(b => b.classList.toggle("active", +b.dataset.iam === i)); wire(ex);
    };
    root.querySelectorAll("[data-iam]").forEach(b => b.addEventListener("click", () => showEx(+b.dataset.iam)));
    showEx(0);
    root.querySelectorAll("[data-term]").forEach(t => t.addEventListener("click", () => {
      const term = IAM_TERMS[+t.dataset.term];
      root.querySelectorAll("[data-term]").forEach(x => x.classList.toggle("sel", x === t));
      root.querySelector("#iam-term-detail").innerHTML = `<div class="eli5" style="margin-top:10px"><b>${esc(term.t)} — simple</b>${esc(term.e)}</div><div class="tech"><b>${esc(term.t)} — technical</b>${esc(term.d)}</div>`;
    }));
    wire(root);
  }

  /* ======================= REQUEST FLOW ======================= */
  let flowTimer = null;
  function renderFlow(root) {
    const F = window.AWS_REQUEST_FLOW; let cur = 0, playing = false;
    root.innerHTML = `<div class="inner"><h2>🚦 Complete request flow</h2>
      <p class="lead">A shopper opens <code>${esc(F.url)}</code>. Press play or click any step. Each stage explains what happens there${B() ? " in plain words" : ""}.</p>
      <div class="pb-ctl" style="margin:0 0 6px"><button class="primary" data-flow="play">▶ Play</button><button data-flow="prev">‹ Prev</button><button data-flow="next">Next ›</button><button data-flow="reset">↺ Reset</button><button data-flow="canvas">📍 Show this path on the architecture</button></div>
      <div class="flow" id="flow-steps"></div>
      <div id="flow-detail"></div>
    </div>`;
    const steps = root.querySelector("#flow-steps"), detail = root.querySelector("#flow-detail");
    const draw = () => {
      steps.innerHTML = F.steps.map((s, i) => `<div class="st ${i === cur ? "cur" : i < cur ? "done" : ""}" data-step="${i}">${i === cur ? '<div class="packet">📨</div>' : ""}<div class="ic">${s.icon}</div><div class="t">${esc(s.title)}</div><div class="tm">${esc(s.time)}</div></div>${i < F.steps.length - 1 ? `<div class="ar ${i < cur ? "lit" : ""}">→</div>` : ""}`).join("");
      steps.querySelectorAll("[data-step]").forEach(d => d.addEventListener("click", () => { cur = +d.dataset.step; stop(); draw(); }));
      const s = F.steps[cur];
      detail.innerHTML = `<div class="card"><h4><span class="ic">${s.icon}</span>Step ${cur + 1} of ${F.steps.length}: ${esc(s.title)}</h4>
        ${B() ? `<div class="eli5"><b>Simple</b>${esc(s.eli5)}</div><details><summary style="cursor:pointer;font-size:12.5px;color:var(--muted)">Technical</summary><div class="tech">${esc(s.tech)}</div></details>` : `<div class="tech"><b>Technical</b>${esc(s.tech)}</div><details><summary style="cursor:pointer;font-size:12.5px;color:var(--muted)">Simple</summary><div class="eli5">${esc(s.eli5)}</div></details>`}
        <p style="font-size:12.5px;color:var(--muted)">⏱ ${esc(s.time)}${s.service ? ` · <span class="pill" data-open-service="${s.service}">Open ${esc(svc(s.service).shortName)} node</span>` : ""}</p></div>`;
      wire(detail);
    };
    const stop = () => { playing = false; if (flowTimer) clearInterval(flowTimer); flowTimer = null; root.querySelector("[data-flow=play]").textContent = "▶ Play"; };
    root.querySelector("[data-flow=play]").addEventListener("click", () => {
      if (playing) return stop();
      playing = true; root.querySelector("[data-flow=play]").textContent = "⏸ Pause";
      if (cur >= F.steps.length - 1) cur = 0; draw();
      flowTimer = setInterval(() => { if (cur >= F.steps.length - 1) return stop(); cur++; draw(); }, 2200);
    });
    root.querySelector("[data-flow=prev]").addEventListener("click", () => { stop(); cur = Math.max(0, cur - 1); draw(); });
    root.querySelector("[data-flow=next]").addEventListener("click", () => { stop(); cur = Math.min(F.steps.length - 1, cur + 1); draw(); });
    root.querySelector("[data-flow=reset]").addEventListener("click", () => { stop(); cur = 0; draw(); });
    root.querySelector("[data-flow=canvas]").addEventListener("click", () => ctx.startPath("request-to-db"));
    draw();
  }

  /* ======================= E-COMMERCE ======================= */
  function renderEcommerce(root) {
    root.innerHTML = `<div class="inner"><h2>🛒 E-commerce components → AWS services</h2>
      <p class="lead">${B() ? "Every part of an online shop maps to a few AWS building blocks. Click a service to open its full explanation." : "Component-to-service mapping for the reference platform. Each row shows the primary flow and the reasoning; click any service for its node."}</p>
      <table class="tbl"><thead><tr><th style="width:20%">Component</th><th style="width:26%">AWS services</th><th style="width:22%">Flow</th><th>${B() ? "In plain words" : "Why this mapping"}</th></tr></thead><tbody>
        ${window.AWS_ECOMMERCE.map(r => `<tr><td><b>${esc(r.component)}</b></td><td>${r.services.map(link).join(" · ")}</td><td class="dim mono" style="font-size:12px">${esc(r.flow)}</td><td class="dim">${esc(B() ? r.eli5 : r.why)}</td></tr>`).join("")}
      </tbody></table>
      <h3>Beginner vs Production architecture</h3>
      <p class="lead">The beginner version is Internet → ALB → ECS → RDS → S3 in one AZ. Production adds the pieces below — switch the canvas mode to compare, or open a service to see why it exists.</p>
      <div class="card-grid">${window.AWS_LAYOUTS.diff.map(d => `<div class="card"><h4>➕ ${esc(d.added)}</h4><p>${esc(d.why)}</p><p>${d.services.map(link).join(" · ")}</p></div>`).join("")}</div>
      <div class="pill-row" style="margin-top:14px"><span class="pill" data-layout="beginner">👶 View beginner architecture</span><span class="pill" data-layout="production">🏭 View production architecture</span></div>
    </div>`;
    root.querySelectorAll("[data-layout]").forEach(b => b.addEventListener("click", () => ctx.showArchitecture(b.dataset.layout)));
    wire(root);
  }

  /* ======================= COMPARISONS ======================= */
  function renderComparisons(root, selectedId) {
    const all = window.AWS_COMPARISONS; const sel = all.find(c => c.id === selectedId) || all[0];
    root.innerHTML = `<div class="inner"><h2>⚖️ Service comparisons</h2>
      <p class="lead">Services that are commonly confused, side by side. ${B() ? "Each comparison starts with a plain-language summary." : "Rows are dimensions; the verdict line gives the default choice for this architecture."}</p>
      <div class="subtabs">${all.map(c => `<button data-cmp="${c.id}" class="${c.id === sel.id ? "active" : ""}">${esc(c.title)}</button>`).join("")}</div>
      <div id="cmp-body"></div></div>`;
    const body = root.querySelector("#cmp-body");
    const show = c => {
      body.innerHTML = `<h3 style="margin-top:6px">${esc(c.title)}</h3>
        ${B() ? `<div class="eli5"><b>In plain words</b>${esc(c.beginner)}</div>` : `<div class="note"><b>Verdict:</b> ${esc(c.verdict)}</div>`}
        <div style="overflow-x:auto"><table class="tbl"><thead><tr><th style="width:18%"></th>${c.items.map(id => `<th>${link(id)}<div style="font-weight:500;color:var(--muted);font-size:11.5px;margin-top:3px">${esc(svc(id).tagline)}</div></th>`).join("")}</tr></thead>
        <tbody>${c.rows.map(r => `<tr><td><b>${esc(r[0])}</b></td>${r.slice(1).map(v => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
        ${B() ? `<div class="note"><b>Verdict:</b> ${esc(c.verdict)}</div>` : `<div class="eli5" style="margin-top:10px"><b>In plain words</b>${esc(c.beginner)}</div>`}`;
      root.querySelectorAll("[data-cmp]").forEach(b => b.classList.toggle("active", b.dataset.cmp === c.id)); wire(body);
    };
    root.querySelectorAll("[data-cmp]").forEach(b => b.addEventListener("click", () => { location.hash = `#compare/${b.dataset.cmp}`; show(all.find(c => c.id === b.dataset.cmp)); }));
    show(sel);
  }

  /* ======================= FAILURES ======================= */
  function renderFailures(root, selectedId) {
    const S = window.AWS_SCENARIOS; const sel = S.find(s => s.id === selectedId) || S[0];
    root.innerHTML = `<div class="inner"><h2>💥 What happens if this fails?</h2>
      <p class="lead">${B() ? "Good architectures expect things to break. Pick a failure to see what AWS does automatically, what still works, and what you must set up yourself." : "Each scenario explains the blast radius, the AWS mechanisms that contain it, and the mitigations you own. 'Simulate' marks failed and surviving components on the architecture canvas."}</p>
      <div class="scenario-list">${S.map(s => `<button data-sc="${s.id}" class="${s.id === sel.id ? "sel" : ""}">💥 ${esc(s.title)}</button>`).join("")}</div>
      <div id="sc-body" style="margin-top:14px"></div></div>`;
    const body = root.querySelector("#sc-body");
    const show = sc => {
      const s = sc.service ? svc(sc.service) : null; const f = sc.custom || (s && s.failure);
      body.innerHTML = `<div class="fail-box"><b class="t" style="font-size:16px">${esc(sc.title)}</b>
        <p style="line-height:1.65">${esc(f.whatHappens)}</p>
        <div class="two-col"><div><b>AWS mechanisms that provide resilience</b>${li(f.awsMechanisms)}</div><div><b>What you must do</b>${li(f.mitigations)}</div></div>
        <div class="pill-row" style="margin-top:10px"><button class="icon-btn" data-simulate="${sc.id}">🎬 Simulate on the architecture canvas</button>${s ? `<span class="pill" data-open-service="${s.id}">${s.icon} Open ${esc(s.shortName)} node</span>` : ""}</div></div>`;
      root.querySelectorAll("[data-sc]").forEach(b => b.classList.toggle("sel", b.dataset.sc === sc.id));
      body.querySelector("[data-simulate]").addEventListener("click", () => ctx.simulate(sc.id)); wire(body);
    };
    root.querySelectorAll("[data-sc]").forEach(b => b.addEventListener("click", () => { location.hash = `#scenario/${b.dataset.sc}`; show(S.find(s => s.id === b.dataset.sc)); }));
    show(sel);
  }

  /* ======================= SECURITY REVIEW + SCORE ======================= */
  let archState = { preset: "production", settings: { ...window.AWS_ARCH.PRESETS.production.settings } };
  function renderSecurity(root) {
    const A = window.AWS_ARCH;
    root.innerHTML = `<div class="inner"><h2>🛡️ Security review & production readiness</h2>
      <p class="lead">${B() ? "This inspects the architecture's settings like a checklist inspector. Change the switches to see what breaks the score, then press Run Security Review to get the list of problems and how to fix them." : "Rules evaluate a structured description of the architecture (below). Toggle settings to run what-if analysis; the score and findings recompute from the same rule engine."}</p>
      <div class="pill-row" style="align-items:center"><label style="font-size:12.5px;color:var(--muted)">Architecture:</label>
        <select id="preset-sel" class="icon-btn" style="height:auto;padding:6px 10px">${Object.entries(A.PRESETS).map(([k, p]) => `<option value="${k}">${esc(p.name)}</option>`).join("")}<option value="custom">Custom (what-if)</option></select>
        <button class="icon-btn" id="run-review" style="background:var(--accent);color:#111;border-color:var(--accent);font-weight:700">🔍 Run Security Review</button>
        <button class="icon-btn" id="show-score">📊 Production Readiness Score</button></div>
      <p id="preset-desc" style="font-size:12.5px;color:var(--muted)"></p>
      <details class="sec" id="whatif-box"><summary>⚙️ What-if settings (${A.SETTINGS.length}) — toggle to change the architecture</summary><div class="sec-body"><div class="whatif" id="whatif"></div></div></details>
      <div id="score-out"></div>
      <div id="review-out"></div>
    </div>`;
    const presetSel = root.querySelector("#preset-sel"), whatif = root.querySelector("#whatif"), desc = root.querySelector("#preset-desc");
    const drawWhatif = () => {
      whatif.innerHTML = A.SETTINGS.map(([k, label, group, hint]) => `<label><input type="checkbox" data-set="${k}" ${archState.settings[k] ? "checked" : ""}><div><span>${esc(label)}</span><span class="h">${esc(group)} · ${esc(hint)}</span></div></label>`).join("");
      whatif.querySelectorAll("[data-set]").forEach(cb => cb.addEventListener("change", () => { archState.settings[cb.dataset.set] = cb.checked; archState.preset = "custom"; presetSel.value = "custom"; desc.textContent = "Custom architecture — edited from the what-if switches."; drawScore(); drawReview(); }));
    };
    presetSel.value = archState.preset;
    const applyPreset = () => { const p = A.PRESETS[presetSel.value]; if (p) { archState = { preset: presetSel.value, settings: { ...p.settings } }; desc.textContent = p.description; } else desc.textContent = "Custom architecture — edited from the what-if switches."; drawWhatif(); drawScore(); drawReview(); };
    presetSel.addEventListener("change", applyPreset);
    let reviewRan = false, scoreOpen = true, selCat = null;
    const scoreOut = root.querySelector("#score-out"), reviewOut = root.querySelector("#review-out");
    const colFor = n => n >= 85 ? "var(--ok)" : n >= 60 ? "var(--warn)" : "var(--bad)";
    const drawScore = () => {
      if (!scoreOpen) { scoreOut.innerHTML = ""; return; }
      const r = A.evaluate(archState.settings);
      scoreOut.innerHTML = `<h3>Production Readiness Score</h3>
        <div class="overall"><div class="ring" style="--pct:${r.overall};--ring-col:${colFor(r.overall)}"><span>${r.overall}%</span></div>
          <div><div style="font-size:18px;font-weight:800">Production Readiness: ${r.overall}%</div><div style="color:var(--muted);font-size:13px;line-height:1.5">Weighted: Security 25% · Availability 20% · Networking 15% · Scalability 15% · Observability 15% · Cost 10%. ${r.findings.length} failing check${r.findings.length === 1 ? "" : "s"}. Click a category to see exactly how its score was calculated.</div></div></div>
        <div class="score-grid">${r.categories.map(c => `<div class="score ${selCat === c.name ? "sel" : ""}" data-cat="${c.name}"><div class="l">${c.name}</div><div class="n" style="color:${colFor(c.score)}">${c.score}%</div><i><b style="width:${c.score}%;background:${colFor(c.score)}"></b></i><div style="font-size:11px;color:var(--faint);margin-top:4px">${c.rules.filter(x => x.passed).length}/${c.rules.length} checks · weight ${Math.round(A.CATEGORY_WEIGHT[c.name] * 100)}%</div></div>`).join("")}</div>
        <div id="cat-detail"></div>`;
      const showCat = name => {
        selCat = name; const c = r.categories.find(x => x.name === name);
        scoreOut.querySelectorAll("[data-cat]").forEach(d => d.classList.toggle("sel", d.dataset.cat === name));
        scoreOut.querySelector("#cat-detail").innerHTML = `<div class="card" style="margin-top:10px"><h4>${esc(name)} = ${c.got} / ${c.total} weight points = ${c.score}%</h4>
          ${c.rules.map(x => `<div class="rule-row"><span class="st" style="color:${x.passed ? "var(--ok)" : "var(--bad)"}">${x.passed ? "PASS" : "FAIL"}</span><div><b>${esc(x.risk)}</b><div style="color:var(--muted);font-size:12.5px">${esc(x.passed ? x.why.split(". ")[0] + "." : x.fix)}</div><div style="margin-top:3px">${(x.related || []).map(link).join(" · ")}</div></div><span class="w">weight ${x.weight}</span></div>`).join("")}</div>`;
        wire(scoreOut);
      };
      scoreOut.querySelectorAll("[data-cat]").forEach(d => d.addEventListener("click", () => showCat(d.dataset.cat)));
      if (selCat) showCat(selCat);
    };
    const drawReview = () => {
      if (!reviewRan) { reviewOut.innerHTML = ""; return; }
      const r = A.evaluate(archState.settings);
      const counts = ["critical", "high", "medium", "low"].map(s => [s, r.findings.filter(f => f.severity === s).length]);
      reviewOut.innerHTML = `<h3>Security Review — ${r.findings.length ? `${r.findings.length} finding${r.findings.length === 1 ? "" : "s"}` : "no findings 🎉"}</h3>
        <div class="pill-row" style="margin-bottom:8px">${counts.map(([s, n]) => `<span class="pill" style="border-color:var(--${s === "critical" ? "crit" : s === "high" ? "bad" : s === "medium" ? "warn" : "info"})">${s}: ${n}</span>`).join("")}</div>
        ${r.findings.length ? r.findings.map(f => `<div class="finding sev-${f.severity}"><div class="fh"><span class="sev">${f.severity}</span>${esc(f.risk)}<span style="margin-left:auto;font-size:11px;color:var(--faint)">${esc(f.category)}</span></div>
          <div class="fb"><b>Why it matters</b>${esc(f.why)}<b>How to fix</b>${esc(f.fix)}<b>Related</b>${(f.related || []).map(link).join(" · ")}</div></div>`).join("") : `<div class="note ok">Every rule passed for this configuration. The remaining non-security recommendations (tracing, cross-Region DR) appear in the readiness score.</div>`}`;
      wire(reviewOut);
    };
    root.querySelector("#run-review").addEventListener("click", () => { reviewRan = true; drawReview(); reviewOut.scrollIntoView({ behavior: "smooth", block: "start" }); });
    root.querySelector("#show-score").addEventListener("click", () => { scoreOpen = !scoreOpen; drawScore(); });
    applyPreset();
  }

  /* ======================= CATALOG ======================= */
  const CATS = [["compute", "Compute"], ["containers", "Containers & Registry"], ["identity", "Identity & Security"], ["networking", "Networking"], ["integration", "Application Integration / Event Driven"], ["scaling", "Auto Scaling & Reliability"], ["database", "Databases"], ["storage", "Storage"], ["monitoring", "Monitoring & Observability"]];
  function renderCatalog(root, filter) {
    root.innerHTML = `<div class="inner"><h2>📚 Service catalog</h2>
      <p class="lead">All ${ctx.services.length} services in this module, grouped by category. ${B() ? "Each card shows the simple explanation." : "Each card shows the tagline and placement."} Click a card for the full node.</p>
      <div class="subtabs"><button data-cf="" class="${!filter ? "active" : ""}">All</button>${CATS.map(([k, l]) => `<button data-cf="${k}" class="${filter === k ? "active" : ""}"><span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--c-${k});margin-right:6px"></span>${l}</button>`).join("")}</div>
      ${CATS.filter(([k]) => !filter || filter === k).map(([k, l]) => { const items = ctx.services.filter(s => s.category === k); return items.length ? `<h3><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--c-${k});margin-right:8px"></span>${l}</h3><div class="card-grid">${items.map(s => `<div class="card clickable" data-open-service="${s.id}"><h4><span class="ic">${s.icon}</span>${esc(s.name)}</h4><p>${esc(B() ? s.eli5 : s.tagline)}</p><div class="badges"><span class="bdg scope-${s.placement.scope}">${{ vpc: "inside VPC", "vpc-edge": "VPC building block", regional: "outside VPC", global: "global", concept: "concept" }[s.placement.scope]}</span>${s.placement.scope === "vpc" ? `<span class="bdg ${s.placement.subnet === "public" ? "pub" : ""}">${s.placement.subnet}</span>` : ""}</div></div>`).join("")}</div>` : ""; }).join("")}
    </div>`;
    root.querySelectorAll("[data-cf]").forEach(b => b.addEventListener("click", () => renderCatalog(root, b.dataset.cf)));
    wire(root);
  }

  return { init, renderNetworking, renderIam, renderFlow, renderEcommerce, renderComparisons, renderFailures, renderSecurity, renderCatalog, CATS, parseCidr };
})();
