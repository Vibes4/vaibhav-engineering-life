// Run:  node system-design/case-studies/bluesky/index.js
//
// Concept: pluggable FEED GENERATORS on top of a shared firehose.
// Bluesky doesn't give you one fixed algorithm. The same pool of posts (the
// "firehose") is fed through DIFFERENT feed generators, each of which filters
// and ranks differently, producing DIFFERENT timelines from identical input.
// A feed generator is just: (posts) => orderedListOfPostRefs.

// The firehose: every post that flowed across the network. In real AT Proto a
// generator would return only URIs; we keep the object here for readability.
const firehose = [
  { uri: 'at://alice/1', author: 'alice', text: 'sunset over the bay #photography', tags: ['photography'], ts: 105 },
  { uri: 'at://bob/2',   author: 'bob',   text: 'my cat knocked over a vase',       tags: ['cats'],        ts: 110 },
  { uri: 'at://cara/3',  author: 'cara',  text: 'macro shot of a bee #photography', tags: ['photography'], ts: 130 },
  { uri: 'at://dan/4',   author: 'dan',   text: 'kitten asleep in a shoe #cats',    tags: ['cats'],        ts: 125 },
  { uri: 'at://eve/5',   author: 'eve',   text: 'just shipped a feature',           tags: [],              ts: 140 },
];

// Generator A: "Cat Pics" -> only posts tagged #cats, newest first.
function catFeed(posts) {
  return posts
    .filter(p => p.tags.includes('cats'))
    .sort((a, b) => b.ts - a.ts);
}

// Generator B: "Photography, chronological" -> only #photography, oldest first.
function photoFeed(posts) {
  return posts
    .filter(p => p.tags.includes('photography'))
    .sort((a, b) => a.ts - b.ts);
}

// The client just runs a chosen generator over the firehose and hydrates refs.
function renderFeed(name, generator) {
  console.log(`\n=== Feed: ${name} ===`);
  const result = generator(firehose);
  if (result.length === 0) { console.log('  (empty)'); return; }
  result.forEach((p, i) =>
    console.log(`  ${i + 1}. [t=${p.ts}] @${p.author}: ${p.text}`));
}

// --- Demo -----------------------------------------------------------------

console.log(`One firehose of ${firehose.length} posts -> different feeds per user choice:`);
renderFeed('Cat Pics (newest first)', catFeed);
renderFeed('Photography (oldest first)', photoFeed);

console.log('\nSame input firehose, different generators -> different timelines.');
console.log('That swappability is the whole point of AT Protocol feed generators.');
