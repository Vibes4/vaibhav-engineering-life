// Run:  node system-design/case-studies/twitter-timeline/index.js
//
// Demo: Twitter's "fan-out on write" (push) timeline delivery.
// When a user tweets, we PUSH the tweet id into each follower's precomputed
// timeline. Reading a timeline is then just reading a list -> O(1).

// --- The social graph: who follows whom ---
// followers.get(userId) => array of userIds who follow that user.
const followers = new Map();
function follow(follower, followee) {
  const list = followers.get(followee) || [];
  list.push(follower);
  followers.set(followee, list);
}

// --- Precomputed timelines: userId -> array of tweet ids (newest last) ---
const timelines = new Map();

// --- The tweet store: tweet id -> tweet content (stored ONCE) ---
const tweets = new Map();
let nextTweetId = 1;

// FAN-OUT ON WRITE: the expensive work happens here, at tweet time.
// We loop over every follower and push the tweet id into their timeline.
function postTweet(author, text) {
  const id = nextTweetId++;
  tweets.set(id, { author, text });            // store content once

  const fans = followers.get(author) || [];
  for (const fan of fans) {                     // push id to each follower
    const tl = timelines.get(fan) || [];
    tl.push(id);
    timelines.set(fan, tl);
  }
  console.log(`@${author} tweeted #${id} -> pushed to ${fans.length} follower timeline(s)`);
}

// READING is now trivial: just read the precomputed list. O(1) to fetch ids.
function getTimeline(user) {
  const ids = timelines.get(user) || [];
  return ids.map((id) => `#${id} @${tweets.get(id).author}: ${tweets.get(id).text}`);
}

console.log('=== Twitter timeline: fan-out on write (push) ===\n');

// Build a small graph: alice and bob follow carol; alice also follows dave.
follow('alice', 'carol');
follow('bob', 'carol');
follow('alice', 'dave');

// People tweet -> ids get pushed into followers' timelines immediately.
postTweet('carol', 'hello world');
postTweet('dave', 'learning system design');
postTweet('carol', 'second tweet');

console.log("\nalice's timeline (just a list read — O(1)):");
getTimeline('alice').forEach((t) => console.log('  ' + t));

console.log("\nbob's timeline:");
getTimeline('bob').forEach((t) => console.log('  ' + t));

// NOTE: celebrities use fan-out on READ instead. Pushing one tweet to
// 100M followers (a "fan-out storm") would be far too slow, so their
// tweets are pulled and merged into your timeline only when you read it.
