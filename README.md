# Node.js & Express Learnings

An interactive learning app covering Node.js core modules and Express.js, built for
**senior Node / Express / MongoDB / SQL interview prep**. Each topic has:

- a clear **explanation** + **interview Q&A** (`index.html`)
- a **runnable** `index.js` you execute with `node`

Built with **Tailwind CSS** and a persisted, no-flash **dark-mode toggle** (🌙 / ☀️, top-left).
MongoDB and SQL each get their own dedicated, multi-module section.

## Run it

```bash
cd nodejs-learnings
npm install        # installs express (needed by the server + some demos)
npm start          # starts the static server
# open http://localhost:3000
```

> **Why a server?** The home page loads each module via `fetch()`, and browsers block
> `fetch()` on the `file://` protocol. `npm start` serves everything over HTTP so it works.
> (`server.js` is itself the simplest possible Express example.)

## How to use it

1. Open `http://localhost:3000`.
2. Click any module in the left sidebar — the explanation + Q&A renders on the right,
   followed by its source code and the exact command to run it.
3. Run any module directly in a terminal, e.g.:

```bash
node node-specific/event-loop/index.js
node express-specific/rest-api/index.js     # then curl localhost:3010/api/v1/users
node express-specific/why-express/index.js  # raw http vs express, side by side
```

## Structure

```
nodejs-learnings/
├── index.html          # Tailwind shell: sidebar + content pane + dark toggle
├── app.js              # builds nav, loads module index.html + index.js, theme logic
├── styles.css          # dark-aware component theming via CSS variables
├── server.js           # static server (run this)
├── package.json
├── node-specific/      # Node core modules
│   └── <module>/ { index.html, index.js }
├── express-specific/   # Express modules + "Why Express?"
│   └── <module>/ { index.html, index.js }
├── react/              # React section (16 topics)
│   └── <module>/ { index.html, index.js }
├── mongodb/            # MongoDB section
│   └── <module>/ { index.html, index.js }
└── sql/                # SQL section
    └── <module>/ { index.html, index.js }
```

## Modules

**Node core:** globals/process · modules (CJS vs ESM) · event loop · EventEmitter · fs ·
path · os · streams · buffer · http · url/querystring · crypto · util · child_process ·
cluster · worker_threads

**Express:** basics · routing · middleware · req/res · static files · router ·
body parsing · error handling · templating · REST API · validation & security ·
auth (JWT) · **Why Express over Node?**

**NestJS:** overview · modules · controllers · providers & DI · lifecycle
(middleware/guards/pipes/interceptors) · exception filters · ecosystem & features

**React:** overview · JSX & rendering · components & props · state (useState) ·
useEffect & lifecycle · hooks (rules, refs, memoization) · advanced hooks (useReducer,
transitions, external stores) · context & state management · forms & events ·
data fetching · performance & re-renders · reconciliation & Fiber · component patterns ·
routing (React Router) · testing (RTL) · SSR, hydration & Server Components

**MongoDB:** basics (+ Mongoose) · data modeling (embed vs reference) · aggregation pipeline ·
indexing & performance · transactions

**SQL:** basics & pooling · joins · indexing & tuning · transactions & ACID · normalization

## Notes on the demos

- Most demos are **dependency-free** (Node core + Express only) so they run immediately.
- `react` demos are **zero-dependency**: React itself is a browser library, so each script
  implements the mechanism being taught (a mini hook dispatcher, a keyed diff, a route
  matcher, a fetch cache) and prints what happens — runnable with plain `node`.
- `mongodb` needs `npm install mongoose` + a running MongoDB; otherwise it prints reference
  code and exits cleanly.
- `sql` runs a zero-dependency simulation by default; install `pg` + set `DATABASE_URL` for
  a live Postgres demo.
- Server demos listen on different ports (3001–3012, 4000, 5000, 7001/7002). Stop one with
  `Ctrl+C` before starting another, or they'll conflict.
```

## ☁️ AWS Services — Architecture Designer (`aws.html`)

An interactive, data-driven AWS architecture learning tool built around a production
e-commerce reference platform (2 AZs, public / private-app / private-DB subnets,
CloudFront → ALB → ECS → RDS, plus SQS/SNS/EventBridge/Step Functions, Lambda, DynamoDB,
S3, ECR, CloudWatch, Auto Scaling, IAM, security groups, NACLs, NAT, route tables).

- **Architecture canvas** — zoom/pan SVG; every node, arrow, and boundary is clickable.
  Production vs Beginner layouts, dependency highlighting, traffic-type legend filters.
- **Node details** — 20+ consistent sections per service (ELI5 + technical, placement,
  connections, security, IAM, scaling, availability, cost, mistakes, creation steps,
  config example, production checklist, failure behaviour).
- **Connection explorer** — protocol, port, route, SG chain, NAT/internet requirements.
- **Networking** — VPC flow, interactive CIDR calculator, route tables, SG chain
  (with the 0.0.0.0/0 anti-pattern), NACL example. **IAM** explainer with real policies.
- **Request-flow animation**, **architecture path mode**, **failure simulations**,
  **service comparisons**, **security review** + **production readiness score**
  driven by a rule engine over what-if settings, and **Beginner mode** everywhere.

All content lives as structured data in `aws/data/` (services, connections, layouts,
rules, comparisons, paths, scenarios) so it can be extended without touching the UI.

## 🎯 Interviews (`interviews/`)

A dedicated **Interviews** section at the top of the sidebar — one folder per company /
role, each holding a set of question sheets you can drill before the round.

### EY GDS — Senior Cloud Native Developer (AWS)

Built from the posted JD (Node.js/TypeScript · EC2/EKS/Lambda · S3 · RDS/DynamoDB ·
VPC/IAM/Security Groups · API Gateway/SNS/SQS · CloudFormation/Terraform · CI/CD ·
security · cost) plus published EY GDS interview experiences. **12 sheets**, in the
order they're meant to be read:

| # | Sheet | Covers |
|---|-------|--------|
| ① | Interview playbook | round-by-round timing, the 4-beat answer template, opening script, gaps to pre-empt, questions to ask |
| ② | AWS: Compute & Storage | Lambda vs Fargate vs EKS vs EC2, cold starts, concurrency, ASG, Spot, S3 classes, pre-signed multipart uploads |
| ③ | AWS: RDS & DynamoDB | Multi-AZ vs replicas, Aurora, slow-query diagnosis, zero-downtime migrations, partition keys, LSI/GSI, single-table design |
| ④ | AWS: VPC, IAM & Security | packet trace to a private RDS, SG vs NACL, NAT cost/HA, CIDR planning, peering/TGW/PrivateLink, IAM evaluation, secrets, leaked-key runbook |
| ⑤ | AWS: API GW, SQS, SNS | SQS/SNS/EventBridge/Kinesis selection, visibility timeout, DLQs, idempotency, transactional outbox, saga, event versioning |
| ⑥ | Node.js & TypeScript | event loop phases, microtask ordering, CPU-bound work, backpressure, error taxonomy, memory-leak diagnosis, strict TS |
| ⑦ | Microservices & APIs | service boundaries, strangler fig, 7 Rs, REST design, cascading-failure defences, observability, zero-downtime deploys, caching |
| ⑧ | IaC, CI/CD & Testing | Terraform vs CloudFormation vs CDK, state, drift, environment structure, pipeline design, OIDC, security gates |
| ⑨ | Well-Architected & Cost | six pillars with levers, RTO/RPO design, multi-account security, OWASP for Node, bill-doubled investigation |
| ⑩ | Scenario & Design round | the clarify-first framework, order-processing design, "API got slow" debug, monolith migration, rapid-fire designs |
| ⑪ | Behavioural & HR | STAR weighting, the three stories to write down, mentoring, why EY, managerial + HR round |
| ⑫ | 60-min rapid revision | one-liner drill tables for every topic above — read this last |

Each question is a collapsible `<details class="qa">` so the sheet doubles as a
self-test: read the question, answer out loud, then open it to check.

**Adding another company:** create `interviews/<slug>/index.html` (a plain HTML
fragment — `h2` headings become collapsible panels automatically) and add an entry to
the `"EY GDS — Cloud Native (AWS)"` block in `app.js`, or a new sibling group under the
same `divider: "Interviews"`.
