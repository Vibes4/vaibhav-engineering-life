// Run:  node system-design/case-studies/chatgpt/index.js
//
// A tiny autoregressive text generator — the SAME loop ChatGPT uses,
// but with a toy n-gram (Markov) model instead of a transformer.
//
// The loop: look at the recent context -> get a distribution over the
// next token -> SAMPLE one (temperature-controlled) -> append -> repeat.
// "Just predict the next token" is genuinely how fluent text appears.

// --- Seeded PRNG so the output is reproducible (not raw Math.random) ---
function makeRng(seed) {
  let s = seed >>> 0;
  return function next() {
    // xorshift32: deterministic pseudo-random in [0, 1)
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

// --- "Training": build a bigram model (next-token counts per token) ---
const training =
  'the cat sat on the mat the cat ate the fish the dog sat on the log ' +
  'the dog ate the bone the cat and the dog sat on the mat together';

const tokens = training.split(' ');          // tokenization (here: by word)
const model = new Map();                      // token -> { nextToken: count }
for (let i = 0; i < tokens.length - 1; i++) {
  const cur = tokens[i], nxt = tokens[i + 1];
  if (!model.has(cur)) model.set(cur, new Map());
  const m = model.get(cur);
  m.set(nxt, (m.get(nxt) || 0) + 1);
}

// --- Sampling with temperature ---
// temperature -> 0 : sharp, picks the most likely next token (deterministic-ish)
// temperature  > 1 : flatter distribution, more random / "creative"
function sampleNext(curToken, temperature, rng) {
  const counts = model.get(curToken);
  if (!counts) return null; // no known continuation -> stop
  const entries = [...counts.entries()];

  // Turn counts into temperature-scaled weights: weight = count^(1/T)
  const weights = entries.map(([, c]) => Math.pow(c, 1 / temperature));
  const total = weights.reduce((a, b) => a + b, 0);

  // Roulette-wheel sample from the distribution.
  let r = rng() * total;
  for (let i = 0; i < entries.length; i++) {
    r -= weights[i];
    if (r <= 0) return entries[i][0];
  }
  return entries[entries.length - 1][0];
}

function generate(start, n, temperature, rng) {
  const out = [start];
  let cur = start;
  for (let i = 0; i < n; i++) {
    const next = sampleNext(cur, temperature, rng); // <- predict next token
    if (next === null) break;
    out.push(next);                                  // <- append
    cur = next;                                      // <- feed back in (autoregressive)
  }
  return out.join(' ');
}

console.log('=== Low temperature (0.3) — focused, repetitive ===');
console.log(' ', generate('the', 14, 0.3, makeRng(42)));

console.log('\n=== Higher temperature (1.2) — more varied ===');
console.log(' ', generate('the', 14, 1.2, makeRng(42)));

console.log('\nSame loop as a real LLM; only the next-token model differs.');
