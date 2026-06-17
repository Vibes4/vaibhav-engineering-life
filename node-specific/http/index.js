// Run:  node node-specific/http/index.js   then visit http://localhost:4000
// A pure-Node HTTP server. Notice how much you do by hand vs Express.
const http = require('http');
const { URL } = require('url');

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const route = `${req.method} ${url.pathname}`;

  // ---- Manual routing ----
  if (route === 'GET /') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Hello from raw Node http!' }));
  }

  if (route === 'GET /greet') {
    // ---- Manual query parsing ----
    const name = url.searchParams.get('name') || 'stranger';
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end(`Hi, ${name}!`);
  }

  // ---- Manual path param parsing (what Express gives you as req.params.id) ----
  // There is NO req.params in raw http — you parse the pathname yourself.
  // Approach A: split the path into segments.
  const segments = url.pathname.split('/').filter(Boolean);   // "/users/42" -> ["users","42"]
  if (req.method === 'GET' && segments[0] === 'users' && segments.length === 2) {
    const id = segments[1];                                   // the :id path param
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ userId: id, via: 'split segments' }));
  }

  // Approach B: a regex with a capture group (closer to how routers match patterns).
  const orderMatch = url.pathname.match(/^\/orders\/(\w+)$/);  // captures the id
  if (req.method === 'GET' && orderMatch) {
    const [, orderId] = orderMatch;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ orderId, via: 'regex capture group' }));
  }

  if (route === 'POST /echo') {
    // ---- Manual body parsing (what express.json() does for you) ----
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 1e6) { res.writeHead(413).end('Payload too large'); req.destroy(); }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ youSent: body }));
      } catch {
        res.writeHead(400).end('Invalid JSON');
      }
    });
    return;
  }

  // ---- Manual 404 ----
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(4000, () => {
  console.log('Raw Node server on http://localhost:4000');
  console.log('Try:  curl http://localhost:4000/greet?name=Vaibhav');
  console.log('      curl http://localhost:4000/users/42      # path param via split');
  console.log('      curl http://localhost:4000/orders/A100   # path param via regex');
  console.log('      curl -XPOST http://localhost:4000/echo -d \'{"a":1}\' -H "Content-Type: application/json"');
});
