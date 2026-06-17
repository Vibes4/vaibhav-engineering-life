// Run:  node nestjs/overview/index.js
// NestJS needs the full toolchain (npm i @nestjs/core @nestjs/common + TypeScript).
// This script prints the architecture so you can review it without that setup.
// The real NestJS code is shown in the module pages.

console.log('NestJS architecture');
console.log('===================\n');

const layers = [
  ['main.ts',        'bootstrap: NestFactory.create(AppModule) -> app.listen(3000)'],
  ['AppModule',      '@Module root: imports feature modules, ties everything together'],
  ['FeatureModule',  '@Module: { controllers, providers, imports, exports }'],
  ['Controller',     '@Controller("users") @Get(":id") -> handles HTTP, delegates to service'],
  ['Service',        '@Injectable() business logic, injected into the controller via DI'],
  ['Repository/DB',  'TypeORM / Prisma / Mongoose data access (injected too)'],
];
for (const [name, desc] of layers) console.log(`  ${name.padEnd(15)} ${desc}`);

console.log('\nRequest lifecycle order:');
console.log('  Middleware -> Guards -> Interceptors(pre) -> Pipes -> Controller');
console.log('             -> Service -> Interceptors(post) -> Response');
console.log('  (Exception Filters catch errors thrown anywhere above)\n');

console.log('Equivalent minimal app (TypeScript):');
console.log(`
  // main.ts
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  // app.module.ts
  @Module({ controllers: [UsersController], providers: [UsersService] })
  export class AppModule {}

  // users.controller.ts
  @Controller('users')
  export class UsersController {
    constructor(private readonly users: UsersService) {}   // <- DI
    @Get(':id') findOne(@Param('id') id: string) { return this.users.findOne(id); }
  }
`);
