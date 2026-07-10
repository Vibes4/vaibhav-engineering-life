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

**MongoDB:** basics (+ Mongoose) · data modeling (embed vs reference) · aggregation pipeline ·
indexing & performance · transactions

**SQL:** basics & pooling · joins · indexing & tuning · transactions & ACID · normalization

## Notes on the demos

- Most demos are **dependency-free** (Node core + Express only) so they run immediately.
- `mongodb` needs `npm install mongoose` + a running MongoDB; otherwise it prints reference
  code and exits cleanly.
- `sql` runs a zero-dependency simulation by default; install `pg` + set `DATABASE_URL` for
  a live Postgres demo.
- Server demos listen on different ports (3001–3012, 4000, 5000, 7001/7002). Stop one with
  `Ctrl+C` before starting another, or they'll conflict.
```
