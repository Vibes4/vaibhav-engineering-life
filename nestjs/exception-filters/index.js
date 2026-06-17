// Run:  node nestjs/exception-filters/index.js
// Simulates Nest's HttpException hierarchy + a global catch-all filter.

class HttpException extends Error {
  constructor(message, status) { super(message); this.status = status; }
  getStatus() { return this.status; }
}
class BadRequestException extends HttpException { constructor(m = 'Bad Request') { super(m, 400); } }
class UnauthorizedException extends HttpException { constructor(m = 'Unauthorized') { super(m, 401); } }
class NotFoundException extends HttpException { constructor(m = 'Not Found') { super(m, 404); } }

// A global "AllExceptionsFilter": known HttpException -> its status; unknown -> sanitized 500
function allExceptionsFilter(exception) {
  const isHttp = exception instanceof HttpException;
  const status = isHttp ? exception.getStatus() : 500;
  // Full detail logged server-side:
  console.log(`   [server log] ${exception.name}: ${exception.message}`);
  return {
    statusCode: status,
    message: isHttp ? exception.message : 'Internal server error',  // sanitize unknowns
    timestamp: '2026-06-18T00:00:00.000Z',
  };
}

// Simulate handlers that throw various exceptions
function runHandler(name, fn) {
  console.log(`\n=== ${name} ===`);
  try {
    const result = fn();
    console.log('   -> 200', JSON.stringify(result));
  } catch (err) {
    console.log('   -> response', JSON.stringify(allExceptionsFilter(err)));
  }
}

runHandler('GET /users/5 (ok)',        () => ({ id: 5, name: 'Ada' }));
runHandler('GET /users/0 (bad input)', () => { throw new BadRequestException('id cannot be 0'); });
runHandler('GET /secret (no token)',   () => { throw new UnauthorizedException(); });
runHandler('GET /users/999 (missing)', () => { throw new NotFoundException('User 999 not found'); });
runHandler('GET /boom (unknown bug)',  () => { throw new TypeError('cannot read prop of undefined'); });

console.log('\nKnown HttpExceptions keep their status; unknown errors -> sanitized 500 (no leak).');
