// Run:  node system-design/case-studies/payment-system/index.js
//
// A double-entry ledger with IDEMPOTENCY KEYS.
// Goal: prove that retrying the SAME request (same idempotency key) does NOT
// move money twice, and that debits always equal credits.

const balances = { alice: 100, bob: 0, carol: 0 }; // current balances
const ledger = [];                                  // append-only entry log
const processed = new Map();                         // idempotencyKey -> stored result

// Move money from one account to another, guarded by an idempotency key.
// In a real system the idempotency record + ledger writes happen in ONE
// atomic DB transaction; here a single synchronous function gives us that.
function transfer(idempotencyKey, from, to, amount) {
  // If we've seen this key, return the SAVED result. No money moves again.
  if (processed.has(idempotencyKey)) {
    console.log(`  [${idempotencyKey}] duplicate -> returning stored result, NO new movement`);
    return processed.get(idempotencyKey);
  }

  if (balances[from] < amount) {
    const result = { ok: false, reason: 'insufficient funds' };
    processed.set(idempotencyKey, result); // cache failures too, so retries are stable
    return result;
  }

  // Double-entry: one debit and one matching credit. Their sum is zero.
  ledger.push({ key: idempotencyKey, account: from, delta: -amount }); // debit
  ledger.push({ key: idempotencyKey, account: to,   delta: +amount }); // credit
  balances[from] -= amount;
  balances[to]   += amount;

  const result = { ok: true, from, to, amount };
  processed.set(idempotencyKey, result); // record key WITH the movement
  console.log(`  [${idempotencyKey}] transferred ${amount}: ${from} -> ${to}`);
  return result;
}

// --- Scenario --------------------------------------------------------------
console.log('Transfer 30 alice -> bob  (key=t1)');
transfer('t1', 'alice', 'bob', 30);

console.log('\nRETRY the exact same request (key=t1) -- e.g. lost response, client retries:');
transfer('t1', 'alice', 'bob', 30); // must NOT move money again

console.log('\nA genuinely new transfer 20 alice -> carol (key=t2):');
transfer('t2', 'alice', 'carol', 20);

console.log('\nFinal balances:', balances);

// Invariant check: every transaction's deltas net to zero -> debits == credits.
const sumOfAllDeltas = ledger.reduce((s, e) => s + e.delta, 0);
console.log('Sum of all ledger deltas (must be 0):', sumOfAllDeltas);
console.log('Total money in system (must equal starting 100):',
  Object.values(balances).reduce((a, b) => a + b, 0));
console.log(sumOfAllDeltas === 0 ? 'OK: debits == credits' : 'BUG: books do not balance!');
