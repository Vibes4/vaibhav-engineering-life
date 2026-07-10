// Run:  node system-design/case-studies/google-docs/index.js
//
// Concept: Operational Transformation (OT) for collaborative editing.
// Two users make CONCURRENT inserts on the same base string. We show that with
// a correct transform(), applying the ops in EITHER order converges to the
// same final document. That "converges either way" property is the whole game.

// An operation: insert `text` at index `pos` (against the shared base string).
const ins = (pos, text) => ({ pos, text });

// Apply one insert operation to a string.
function apply(doc, op) {
  return doc.slice(0, op.pos) + op.text + doc.slice(op.pos);
}

// transform(a, b): rewrite op `b` so it still means the right thing AFTER `a`
// has been applied. If `a` inserted text at/under b's position, everything to
// b's right shifted, so b's index must move by a.text.length.
// Tie-break on equal positions so both sides agree on an order (here: a first).
function transform(a, b) {
  if (a.pos < b.pos || (a.pos === b.pos && true)) {
    return { pos: b.pos + a.text.length, text: b.text };
  }
  return { pos: b.pos, text: b.text }; // a is to the right -> b unaffected
}

// --- Demo -----------------------------------------------------------------

const base = 'cat';                // both users start from the same document
const alice = ins(1, 'X');         // Alice inserts "X" at index 1  -> "cXat"
const bob = ins(3, 'Y');           // Bob   inserts "Y" at index 3  -> "catY"

console.log(`base document : "${base}"`);
console.log(`Alice's op    : insert "${alice.text}" at ${alice.pos}`);
console.log(`Bob's op      : insert "${bob.text}" at ${bob.pos}`);

// Ordering 1: apply Alice, then Bob transformed against Alice.
const bobAfterAlice = transform(alice, bob);
let doc1 = apply(base, alice);
doc1 = apply(doc1, bobAfterAlice);
console.log(`\nOrder A->B    : apply Alice, then Bob(transformed pos ${bobAfterAlice.pos}) = "${doc1}"`);

// Ordering 2: apply Bob, then Alice transformed against Bob.
const aliceAfterBob = transform(bob, alice);
let doc2 = apply(base, bob);
doc2 = apply(doc2, aliceAfterBob);
console.log(`Order B->A    : apply Bob, then Alice(transformed pos ${aliceAfterBob.pos}) = "${doc2}"`);

console.log(`\nConverged?    : ${doc1 === doc2 ? 'YES -- both orders gave "' + doc1 + '"' : 'NO -- divergence bug!'}`);
console.log('Without transform(), Bob\'s op at 3 would have landed at the wrong index and the replicas would disagree.');
