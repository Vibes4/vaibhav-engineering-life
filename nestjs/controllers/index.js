// Run:  node nestjs/controllers/index.js
// Simulates how Nest turns decorator metadata into a route table + dispatches a request.

// --- a tiny metadata store (what @Controller/@Get write under the hood) ---
const routes = [];
const Controller = (prefix) => (cls) => { cls.prefix = prefix; };
const Route = (method) => (path) => (target, key) =>
  routes.push({ method, path, cls: target.constructor, handler: key });

const Get = Route('GET');
const Post = Route('POST');

// --- a "controller" (decorators applied manually since this is plain JS) ---
class UsersController {
  findAll(query) { return [{ id: 1, role: query.role || 'all' }]; }
  findOne(params) { return { id: params.id, name: 'Ada' }; }
  create(body) { return { id: 99, ...body, created: true }; }
}
Controller('users')(UsersController);
Get('')(UsersController.prototype, 'findAll');
Get(':id')(UsersController.prototype, 'findOne');
Post('')(UsersController.prototype, 'create');

// --- build the route table (what Nest does at bootstrap) ---
const fullPath = (r) => `/${r.cls.prefix}${r.path ? '/' + r.path : ''}`;
console.log('Route table built from decorators:');
routes.forEach((r) => console.log(`  ${r.method.padEnd(4)} ${fullPath(r).padEnd(12)} -> ${r.cls.name}.${r.handler}()`));

// --- dispatch a couple of fake requests ---
const instance = new UsersController();
function dispatch(method, path, { params = {}, query = {}, body = {} } = {}) {
  const match = routes.find((r) => r.method === method &&
    new RegExp('^/' + r.cls.prefix + (r.path === ':id' ? '/[^/]+' : r.path ? '/' + r.path : '') + '$').test(path));
  if (!match) return console.log(`  ${method} ${path} -> 404`);
  const arg = match.path === ':id' ? params : match.method === 'POST' ? body : query;
  console.log(`  ${method} ${path} ->`, JSON.stringify(instance[match.handler](arg)));
}

console.log('\nDispatching requests:');
dispatch('GET', '/users', { query: { role: 'admin' } });
dispatch('GET', '/users/42', { params: { id: '42' } });
dispatch('POST', '/users', { body: { name: 'Grace' } });
