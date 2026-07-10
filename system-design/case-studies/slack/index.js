// Run:  node system-design/case-studies/slack/index.js
//
// Concept: real-time message FAN-OUT via an in-memory pub/sub hub.
// A channel is just a list of subscribers. When someone publishes a message
// to a channel, the hub looks up that channel's subscribers and pushes the
// message to each of them -- and to NOBODY in other channels.
// This is exactly what Slack's gateway/pub-sub tier does at scale.

class PubSubHub {
  constructor() {
    // channelName -> Map(userName -> deliver callback)
    this.channels = new Map();
  }

  // A user "subscribes" by joining a channel and giving us a way to deliver.
  subscribe(channel, user, deliver) {
    if (!this.channels.has(channel)) this.channels.set(channel, new Map());
    this.channels.get(channel).set(user, deliver);
    console.log(`  [join]    ${user} joined ${channel}`);
  }

  // Publishing fans the message out to every subscriber of THAT channel only.
  publish(channel, fromUser, text) {
    const subscribers = this.channels.get(channel);
    console.log(`\n[publish] ${fromUser} -> ${channel}: "${text}"`);
    if (!subscribers || subscribers.size === 0) {
      console.log(`  (no subscribers -- message goes nowhere)`);
      return;
    }
    for (const [user, deliver] of subscribers) {
      // In real Slack this is a write down each subscriber's WebSocket.
      deliver(channel, fromUser, text, user);
    }
  }
}

// --- Demo -----------------------------------------------------------------

const hub = new PubSubHub();

// Each user's "socket": just prints what landed in their client.
const socket = (channel, from, text, me) =>
  console.log(`  [recv]    ${me} sees in ${channel}: ${from}: "${text}"`);

// Alice & Bob are in #general; Bob & Carol are in #random.
hub.subscribe('#general', 'Alice', socket);
hub.subscribe('#general', 'Bob', socket);
hub.subscribe('#random', 'Bob', socket);
hub.subscribe('#random', 'Carol', socket);

// Message to #general reaches Alice and Bob, but NOT Carol.
hub.publish('#general', 'Alice', 'Standup in 5!');

// Message to #random reaches Bob and Carol, but NOT Alice.
hub.publish('#random', 'Carol', 'Lunch?');

// Notice Bob -- who is in both -- receives both; Alice and Carol stay isolated.
console.log('\nFan-out delivered each message ONLY to that channel\'s members.');
