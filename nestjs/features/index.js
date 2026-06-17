// Run:  node nestjs/features/index.js
// A quick reference of the NestJS ecosystem (printed, since each needs its own package).

const groups = {
  'Data access':        ['@nestjs/typeorm', 'Prisma', '@nestjs/mongoose'],
  'Validation & config':['ValidationPipe + class-validator', '@nestjs/config'],
  'Auth & security':    ['@nestjs/passport', '@nestjs/jwt', '@nestjs/throttler', 'helmet'],
  'API styles':         ['REST (controllers)', '@nestjs/graphql', '@nestjs/microservices', '@nestjs/websockets'],
  'Productivity':       ['@nestjs/swagger', '@nestjs/testing', '@nestjs/schedule', '@nestjs/bull', '@nestjs/cache-manager'],
};

console.log('NestJS ecosystem (first-party modules)\n');
for (const [group, items] of Object.entries(groups)) {
  console.log(group);
  items.forEach((i) => console.log('   • ' + i));
  console.log();
}

console.log('CLI scaffolding example:');
console.log('   $ nest g resource users');
console.log('   -> generates users.module / .controller / .service / dto / spec files\n');

console.log('Testing pattern (DI makes mocking trivial):');
console.log(`   const moduleRef = await Test.createTestingModule({
     providers: [UsersService, { provide: DbService, useValue: mockDb }],
   }).compile();
   const service = moduleRef.get(UsersService);`);
