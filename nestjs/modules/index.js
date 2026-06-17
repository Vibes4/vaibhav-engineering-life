// Run:  node nestjs/modules/index.js
// Simulates Nest's module encapsulation (private providers + exports) in plain JS.

// A "module" = { providers it owns, which it exports, modules it imports }
function defineModule({ name, providers = {}, exports = [], imports = [] }) {
  return { name, providers, exports, imports };
}

// Resolve a provider visible to `mod`: own providers + imported modules' EXPORTS only.
function resolve(mod, token, registry) {
  if (mod.providers[token]) return mod.providers[token];           // own (private) provider
  for (const impName of mod.imports) {
    const imp = registry[impName];
    if (imp.exports.includes(token)) return imp.providers[token];  // visible only if exported
  }
  return undefined;
}

const AuthModule = defineModule({
  name: 'AuthModule',
  providers: { AuthService: 'AuthService()', TokenHelper: 'TokenHelper()' },
  exports: ['AuthService'],            // TokenHelper stays PRIVATE
});

const UsersModule = defineModule({
  name: 'UsersModule',
  providers: { UsersService: 'UsersService()' },
  imports: ['AuthModule'],
});

const registry = { AuthModule, UsersModule };

console.log('UsersModule resolving AuthService :', resolve(UsersModule, 'AuthService', registry), '(exported -> OK)');
console.log('UsersModule resolving TokenHelper :', resolve(UsersModule, 'TokenHelper', registry), '(NOT exported -> undefined)');
console.log('UsersModule resolving UsersService:', resolve(UsersModule, 'UsersService', registry), '(own provider -> OK)');

console.log('\nLesson: providers are private to their module; only `exports` cross the boundary,');
console.log('and the consumer must `imports` that module. This is Nest encapsulation.');
