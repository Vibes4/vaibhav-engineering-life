// Run:  node dsa/hashmap/index.js
// Frequency counter (Map) + contains-duplicate (Set).

// Frequency counter: O(n) time, O(k) space (k distinct items).
function frequency(items) {
  const freq = new Map();
  for (const item of items) {
    freq.set(item, (freq.get(item) || 0) + 1);
  }
  return freq;
}

// Most frequent element.
function mostFrequent(items) {
  let best = null, bestCount = 0;
  for (const [item, count] of frequency(items)) {
    if (count > bestCount) { best = item; bestCount = count; }
  }
  return { item: best, count: bestCount };
}

// Contains duplicate: O(n) time, O(n) space. Returns true on first repeat.
function containsDuplicate(nums) {
  const seen = new Set();
  for (const n of nums) {
    if (seen.has(n)) return true;   // O(1) membership check
    seen.add(n);
  }
  return false;
}

const words = ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple'];
console.log('Frequency map:', Object.fromEntries(frequency(words)));
console.log('Most frequent:', mostFrequent(words)); // apple x3

console.log('\nContains duplicate:');
console.log('  [1,2,3,4]   ->', containsDuplicate([1, 2, 3, 4]));   // false
console.log('  [1,2,3,1]   ->', containsDuplicate([1, 2, 3, 1]));   // true

// ───────── More problems ─────────

// Two Sum (complement HashMap): O(n) time, O(n) space.
function twoSumMap(nums, target) {
  const seen = new Map();              // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return null;
}

// Valid Anagram (frequency map compare): O(n) time, O(k) space.
function isAnagramMap(a, b) {
  if (a.length !== b.length) return false;
  const count = new Map();
  for (const ch of a) count.set(ch, (count.get(ch) || 0) + 1);
  for (const ch of b) {
    if (!count.get(ch)) return false;  // missing or already exhausted
    count.set(ch, count.get(ch) - 1);
  }
  return true;
}

console.log('\nTwo Sum (HashMap):');
console.log('  [2,7,11,15], target 9 ->', twoSumMap([2, 7, 11, 15], 9)); // [0,1]
console.log('  [3,2,4],     target 6 ->', twoSumMap([3, 2, 4], 6));      // [1,2]

console.log('\nValid Anagram (HashMap):');
console.log('  "listen","silent" ->', isAnagramMap('listen', 'silent')); // true
console.log('  "rat","car"       ->', isAnagramMap('rat', 'car'));       // false
