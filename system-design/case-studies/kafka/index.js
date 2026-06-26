// Run:  node system-design/case-studies/kafka/index.js
//
// Demo: an in-memory partitioned commit log, the heart of Kafka.
// Goal: show (1) a producer appending records, (2) a partitioner routing by
// key so the SAME key always lands in the SAME partition (ordering), and
// (3) a consumer reading from a tracked OFFSET and committing its progress.

// --- 1. The topic = an array of partitions, each an append-only log --------
const NUM_PARTITIONS = 3;
const partitions = Array.from({ length: NUM_PARTITIONS }, () => []);

// A tiny deterministic hash so the same key always maps to the same partition.
function hash(str) {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

// The partitioner: key present -> hash(key) % N. This is what guarantees
// that all events for one entity stay in one partition, hence in order.
function partitionFor(key) {
  return hash(key) % NUM_PARTITIONS;
}

// --- 2. The producer: append a record to the end of its partition's log ----
function produce(key, value) {
  const p = partitionFor(key);
  const offset = partitions[p].length; // offset = current length BEFORE push
  partitions[p].push({ key, value, offset });
}

// Three users; notice each user's events all go to one partition.
produce('user_A', 'login');
produce('user_B', 'login');
produce('user_A', 'add_to_cart');
produce('user_C', 'login');
produce('user_A', 'checkout');
produce('user_B', 'logout');

// --- 3. Show the partitions and per-partition ordering ---------------------
console.log('=== Partitioned commit log ===\n');
partitions.forEach((log, p) => {
  console.log(`Partition ${p}:`);
  log.forEach((r) => console.log(`  offset ${r.offset}: ${r.key} -> ${r.value}`));
  if (log.length === 0) console.log('  (empty)');
});
console.log('\nNote: every "user_A" record is in ONE partition, in submit order.\n');

// --- 4. A consumer reading partition 0 from a tracked offset ---------------
// The consumer stores its own committed offset. On restart it resumes here.
const committed = { 0: 0 }; // start of partition 0

function consumeFrom(partition) {
  const log = partitions[partition];
  let offset = committed[partition];
  console.log(`=== Consumer reading partition ${partition} from offset ${offset} ===`);
  while (offset < log.length) {
    const r = log[offset];
    console.log(`  read offset ${offset}: ${r.key} -> ${r.value}  [processing...]`);
    offset += 1;
    committed[partition] = offset; // commit AFTER processing (at-least-once)
  }
  console.log(`Committed offset now ${committed[partition]} (caught up).\n`);
}

consumeFrom(0);

console.log('--- Why this matters ---');
console.log('Reading did not delete anything: re-running consumeFrom(0) from offset 0');
console.log('would replay the same records. Partitions give parallelism; keys give');
console.log('per-entity ordering; offsets let each consumer track its own progress.');
