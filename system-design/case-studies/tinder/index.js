// Run:  node system-design/case-studies/tinder/index.js
//
// A tiny Tinder-style matching engine.
// Core idea: a "like" is a DIRECTED edge (A -> B). A MATCH is a
// bidirectional edge: A likes B AND B likes A. We detect it in O(1)
// at write time by checking the reverse key — no scanning, no batch job.
//
// NOTE on geo (not coded here to keep it small): in the real system you
// would FIRST narrow the candidate pool by geohash. "Find people near me"
// becomes "find users whose geohash starts with my prefix" (e.g. '9q8yy'),
// turning a planet-wide scan into a cheap indexed prefix lookup. The match
// logic below only runs on that already-small nearby candidate set.

// The "store" of right-swipes. Key = `${swiper}:${swipee}` -> true.
// In production this is a key-value store like DynamoDB / Redis.
const likes = new Map();

const matches = []; // emitted mutual matches

// Record a right-swipe and synchronously check for a mutual match.
function swipeRight(swiper, swipee) {
  const key = `${swiper}:${swipee}`;
  likes.set(key, true);
  console.log(`  ${swiper} swiped RIGHT on ${swipee}`);

  // O(1) reverse lookup: has the other person already liked me back?
  const reverseKey = `${swipee}:${swiper}`;
  if (likes.has(reverseKey)) {
    // Sort so a match is recorded once, not twice (A-B == B-A).
    const pair = [swiper, swipee].sort();
    matches.push(pair);
    console.log(`  >>> MATCH! ${pair[0]} <-> ${pair[1]} can now chat <<<`);
  }
}

function swipeLeft(swiper, swipee) {
  // Left swipes are basically fire-and-forget (just remember we saw them).
  console.log(`  ${swiper} swiped left on ${swipee}`);
}

// --- Simulate a sequence of swipes (assume all are already "nearby") ---
console.log('=== Swipe stream ===');
swipeRight('Alice', 'Bob');     // one-way so far
swipeLeft('Alice', 'Carol');
swipeRight('Bob', 'Carol');     // one-way
swipeRight('Bob', 'Alice');     // <- completes Alice<->Bob -> MATCH
swipeRight('Carol', 'Dave');
swipeRight('Dave', 'Carol');    // <- completes Carol<->Dave -> MATCH
swipeRight('Alice', 'Dave');    // one-way, no reciprocation

console.log('\n=== Final state ===');
console.log('Total likes recorded:', likes.size);
console.log('Mutual matches:', matches.length);
for (const [a, b] of matches) {
  console.log(`  - ${a} & ${b}`);
}

// Show why it's cheap: detecting each match was a single Map lookup,
// not a search over all likes. That O(1) reverse-check at write time is
// what makes matches feel instant.
