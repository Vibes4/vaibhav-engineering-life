// Run:  node system-design/case-studies/stock-exchange/index.js
//
// A tiny LIMIT-ORDER-BOOK matching engine demonstrating PRICE-TIME PRIORITY.
// - Bids (buyers) are matched best (highest) price first.
// - Asks (sellers) are matched best (lowest) price first.
// - Among orders at the same price, the EARLIEST arrival fills first (FIFO).
// A trade happens when the best bid price >= best ask price (they "cross").

let seq = 0; // global arrival counter -> gives us the "time" in price-TIME priority

const bids = []; // resting buy orders
const asks = []; // resting sell orders

// Keep bids sorted: highest price first; ties broken by earliest seq.
function sortBids() { bids.sort((a, b) => b.price - a.price || a.seq - b.seq); }
// Keep asks sorted: lowest price first; ties broken by earliest seq.
function sortAsks() { asks.sort((a, b) => a.price - b.price || a.seq - b.seq); }

function submit(side, price, qty) {
  const order = { side, price, qty, seq: seq++ };
  // The opposite book is what we try to match against.
  const book = side === 'BUY' ? asks : bids;

  while (order.qty > 0 && book.length > 0) {
    const best = book[0]; // best resting order on the other side
    // Does the incoming order cross the best opposite price?
    const crosses = side === 'BUY' ? order.price >= best.price
                                   : order.price <= best.price;
    if (!crosses) break; // no match possible -> stop

    const tradeQty = Math.min(order.qty, best.qty);
    // Price-time priority: trade executes at the RESTING order's price.
    console.log(`  TRADE: ${tradeQty} @ ${best.price}  (${side} #${order.seq} x resting #${best.seq})`);
    order.qty -= tradeQty;
    best.qty -= tradeQty;
    if (best.qty === 0) book.shift(); // fully filled -> remove from book
  }

  // Any unfilled remainder rests in the book and waits.
  if (order.qty > 0) {
    if (side === 'BUY') { bids.push(order); sortBids(); }
    else { asks.push(order); sortAsks(); }
  }
}

function printBook() {
  console.log('  ASKS (sellers):', asks.map(o => `${o.qty}@${o.price}`).join(' ') || '(empty)');
  console.log('  BIDS (buyers): ', bids.map(o => `${o.qty}@${o.price}`).join(' ') || '(empty)');
}

// --- Scenario --------------------------------------------------------------
console.log('Submit SELL 5 @ 101'); submit('SELL', 101, 5);
console.log('Submit SELL 5 @ 100  (better price -> ahead of 101)'); submit('SELL', 100, 5);
console.log('Submit BUY  3 @ 99   (too low, rests)'); submit('BUY', 99, 3);
console.log('\nBook now:'); printBook();

console.log('\nSubmit BUY 8 @ 101  (crosses -> fills cheapest asks first):');
submit('BUY', 101, 8); // takes 5@100, then 3@101 (price-time priority)

console.log('\nFinal book:'); printBook();
