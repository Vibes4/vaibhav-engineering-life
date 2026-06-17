// Run:  node nestjs/request-lifecycle/index.js
// Simulates Nest's lifecycle order: Middleware -> Guard -> Interceptor(pre)
//   -> Pipe -> Handler -> Interceptor(post) -> Exception Filter (on error).

class HttpException extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

// Each piece logs when it runs so you can SEE the order.
const middleware   = (req) => { console.log('1. Middleware    : log request', req.path); };
const guard        = (req) => { console.log('2. Guard         : check auth');
                                if (!req.authorized) throw new HttpException('Forbidden', 403); };
const pipeValidate = (req) => { console.log('4. Pipe          : validate/transform body');
                                if (req.body && typeof req.body.age === 'string') req.body.age = Number(req.body.age);
                                if (req.body && req.body.age < 0) throw new HttpException('age must be >= 0', 400); };
const handler      = (req) => { console.log('5. Handler       : run controller method');
                                return { ok: true, body: req.body }; };
const exceptionFilter = (err) => ({ statusCode: err.status || 500, error: err.message });

function handleRequest(req) {
  console.log(`\n=== ${req.path} (authorized=${req.authorized}) ===`);
  try {
    middleware(req);
    guard(req);
    console.log('3. Interceptor   : (before) start timer');
    pipeValidate(req);
    const result = handler(req);
    console.log('6. Interceptor   : (after) stop timer, transform response');
    console.log('   -> 200', JSON.stringify(result));
  } catch (err) {
    console.log('X. ExceptionFilter: caught ->', JSON.stringify(exceptionFilter(err)));
  }
}

// Happy path
handleRequest({ path: '/users', authorized: true, body: { name: 'Ada', age: '36' } });
// Guard rejects (no auth) — pipes/handler never run
handleRequest({ path: '/users', authorized: false, body: {} });
// Pipe validation fails — handler never runs, filter formats the error
handleRequest({ path: '/users', authorized: true, body: { name: 'X', age: -5 } });
