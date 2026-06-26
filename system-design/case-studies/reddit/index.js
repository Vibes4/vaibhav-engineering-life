// Run:  node system-design/case-studies/reddit/index.js
//
// Demo: Reddit's classic "hot" ranking score.
// Goal: show how a NEWER post with FEWER votes can still outrank an
// OLDER post with MORE votes — because the formula blends votes AND freshness.

// A fixed point in time that all post ages are measured against.
// Reddit uses Dec 8 2005; the exact value doesn't matter, only that it's constant.
const EPOCH = new Date('2005-12-08T00:00:00Z').getTime() / 1000; // in seconds

// The hot score formula (simplified from Reddit's real one):
//   score = sign * log10(max(|votes|, 1))  +  (secondsSinceEpoch / 45000)
// - log10(votes): diminishing returns — first votes matter most.
// - sign: handles downvoted posts (negative net votes push score down).
// - time term: grows with newer posts, giving them a head start.
//   45000 seconds (~12.5h) is the "half-life" knob that controls decay speed.
function hotScore(ups, downs, createdEpochSeconds) {
  const votes = ups - downs;                  // net score
  const order = Math.log10(Math.max(Math.abs(votes), 1));
  const sign = votes > 0 ? 1 : votes < 0 ? -1 : 0;
  const seconds = createdEpochSeconds - EPOCH;
  return (sign * order + seconds / 45000).toFixed(7);
}

// Helper: turn "hours ago" into an absolute epoch-second timestamp.
const NOW = Date.now() / 1000;
const hoursAgo = (h) => NOW - h * 3600;

// Sample posts. Notice the tension:
//  - "Old viral post" has FAR more votes but is 2 days old.
//  - "Fresh decent post" has fewer votes but was posted 1 hour ago.
const posts = [
  { title: 'Old viral post (2 days old)',     ups: 9000, downs: 200, created: hoursAgo(48) },
  { title: 'Fresh decent post (1 hour old)',  ups: 120,  downs: 5,   created: hoursAgo(1)  },
  { title: 'Mediocre new post (10 min old)',  ups: 8,    downs: 1,   created: hoursAgo(0.16) },
  { title: 'Controversial old post',          ups: 500,  downs: 480, created: hoursAgo(36) },
];

// Compute each post's hot score.
const ranked = posts
  .map((p) => ({ ...p, score: Number(hotScore(p.ups, p.downs, p.created)) }))
  .sort((a, b) => b.score - a.score); // highest score first

console.log('=== Reddit "Hot" ranking ===\n');
ranked.forEach((p, i) => {
  console.log(`#${i + 1}  score=${p.score.toFixed(4)}`);
  console.log(`     ${p.title}`);
  console.log(`     net votes: ${p.ups - p.downs}\n`);
});

console.log('--- Why this matters ---');
console.log('The fresh post can outrank the 2-day-old viral post even with');
console.log('far fewer votes: log10 compresses the vote gap, while the time');
console.log('term gives newer posts a head start. That is what keeps "Hot" fresh.');
