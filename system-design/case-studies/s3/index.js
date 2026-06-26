// Run:  node system-design/case-studies/s3/index.js
//
// Demo: a consistent-hashing ring, the trick that lets S3-style storage add
// and remove nodes without re-shuffling almost everything.
// Goal: show that with consistent hashing, adding a node remaps only a SMALL
// fraction of keys — unlike plain hash(key) % N, which remaps nearly all.

const crypto = require('crypto');

// Hash any string to a number on a ring of size RING (0 .. RING-1).
const RING = 2 ** 32;
function hashRing(str) {
  const hex = crypto.createHash('md5').update(str).digest('hex').slice(0, 8);
  return parseInt(hex, 16) % RING;
}

// --- The ring --------------------------------------------------------------
// We place each physical node at several points ("virtual nodes") so load
// spreads evenly and no single node owns a giant arc of the ring.
const VNODES = 50;

function buildRing(nodes) {
  const ring = []; // sorted list of { point, node }
  for (const node of nodes) {
    for (let v = 0; v < VNODES; v++) {
      ring.push({ point: hashRing(`${node}#${v}`), node });
    }
  }
  ring.sort((a, b) => a.point - b.point);
  return ring;
}

// A key belongs to the FIRST node clockwise from the key's hash point.
function nodeFor(ring, key) {
  const p = hashRing(key);
  for (const slot of ring) if (slot.point >= p) return slot.node;
  return ring[0].node; // wrapped past the end -> first node
}

// --- Run it ----------------------------------------------------------------
const keys = Array.from({ length: 10000 }, (_, i) => `object-${i}.dat`);

const before = buildRing(['nodeA', 'nodeB', 'nodeC']);
const placementBefore = keys.map((k) => nodeFor(before, k));

// Now ADD a fourth node and re-place every key.
const after = buildRing(['nodeA', 'nodeB', 'nodeC', 'nodeD']);
const placementAfter = keys.map((k) => nodeFor(after, k));

// Count how many keys changed which node they live on.
let moved = 0;
for (let i = 0; i < keys.length; i++) {
  if (placementBefore[i] !== placementAfter[i]) moved++;
}

console.log('=== Consistent hashing ring ===\n');
console.log(`Keys: ${keys.length}`);
console.log('Added nodeD to a 3-node ring (now 4 nodes).\n');
console.log(`Keys that moved: ${moved}  (${((moved / keys.length) * 100).toFixed(1)}%)`);
console.log(`Ideal fraction for going 3 -> 4 nodes: ~${(100 / 4).toFixed(1)}%\n`);

console.log('--- Compare with plain hash(key) % N ---');
let movedModulo = 0;
for (const k of keys) {
  if (hashRing(k) % 3 !== hashRing(k) % 4) movedModulo++;
}
console.log(`With hash % N, keys that would move: ${movedModulo} (${((movedModulo / keys.length) * 100).toFixed(1)}%)`);
console.log('\nThat is the whole point: the ring moves ~1/N of keys; modulo moves almost all.');
