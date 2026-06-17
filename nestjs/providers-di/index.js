// Run:  node nestjs/providers-di/index.js
// A tiny IoC container that mirrors how Nest resolves & injects providers.

class Container {
  constructor() { this.providers = new Map(); this.singletons = new Map(); }

  // register a provider: token -> { deps, factory, scope }
  register(token, { deps = [], useClass, useValue, useFactory, scope = 'singleton' }) {
    this.providers.set(token, { deps, useClass, useValue, useFactory, scope });
  }

  resolve(token) {
    const p = this.providers.get(token);
    if (!p) throw new Error(`No provider for ${token}`);
    if (p.useValue !== undefined) return p.useValue;

    // singleton: build once and cache
    if (p.scope === 'singleton' && this.singletons.has(token)) return this.singletons.get(token);

    const deps = p.deps.map((d) => this.resolve(d));        // recursively inject deps
    const instance = p.useFactory ? p.useFactory(...deps) : new p.useClass(...deps);

    if (p.scope === 'singleton') this.singletons.set(token, instance);
    return instance;
  }
}

// --- providers (constructor injection like Nest) ---
class DatabaseService { query(table, id) { return `${table}#${id}`; } }
class UsersService {
  constructor(db) { this.db = db; this.id = Math.floor(Math.random() * 1000); }
  findOne(id) { return this.db.query('users', id); }
}

const c = new Container();
c.register('DatabaseService', { useClass: DatabaseService });
c.register('UsersService', { useClass: UsersService, deps: ['DatabaseService'] });
c.register('CONFIG', { useValue: { env: 'prod' } });                     // useValue
c.register('Logger', { useFactory: () => ({ log: (m) => `[log] ${m}` }) }); // useFactory

const users = c.resolve('UsersService');
console.log('UsersService.findOne(42) ->', users.findOne('42'));   // db injected automatically
console.log('CONFIG (useValue)        ->', JSON.stringify(c.resolve('CONFIG')));
console.log('Logger (useFactory)      ->', c.resolve('Logger').log('hi'));

// singleton proof: same instance returned every time
console.log('\nsingleton? same instance ->', c.resolve('UsersService') === c.resolve('UsersService'));
console.log('Nest default scope is singleton — built once, injected everywhere.');
