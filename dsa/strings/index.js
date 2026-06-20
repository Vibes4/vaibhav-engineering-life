// Run:  node dsa/strings/index.js
// Valid Anagram (frequency count) + Longest Substring Without Repeating Characters.

// Valid Anagram: O(n) time, O(1) space (fixed alphabet).
function isAnagram(a, b) {
  if (a.length !== b.length) return false;
  const count = {};
  for (const ch of a) count[ch] = (count[ch] || 0) + 1;
  for (const ch of b) {
    if (!count[ch]) return false;   // missing or already exhausted
    count[ch]--;
  }
  return true;
}

// Longest substring without repeating characters: sliding window, O(n) time.
function lengthOfLongestSubstring(s) {
  const lastSeen = new Map();   // char -> last index
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (lastSeen.has(ch) && lastSeen.get(ch) >= left) {
      left = lastSeen.get(ch) + 1;   // jump past the previous occurrence
    }
    lastSeen.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}

console.log('Valid Anagram:');
console.log('  "listen","silent" ->', isAnagram('listen', 'silent')); // true
console.log('  "rat","car"       ->', isAnagram('rat', 'car'));       // false

console.log('\nLongest Substring Without Repeating Chars:');
console.log('  "abcabcbb" ->', lengthOfLongestSubstring('abcabcbb')); // 3 ("abc")
console.log('  "bbbbb"    ->', lengthOfLongestSubstring('bbbbb'));    // 1 ("b")
console.log('  "pwwkew"   ->', lengthOfLongestSubstring('pwwkew'));   // 3 ("wke")

// ───────── More problems ─────────

// Group Anagrams: bucket by sorted-key. O(n·k log k) time, O(n·k) space.
function groupAnagrams(strs) {
  const buckets = new Map();
  for (const s of strs) {
    const key = s.split('').sort().join('');   // anagrams share the sorted key
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(s);
  }
  return [...buckets.values()];
}

// Longest Palindromic Substring: expand around center. O(n²) time, O(1) space.
function longestPalindrome(s) {
  if (s.length < 2) return s;
  let start = 0, maxLen = 1;
  const expand = (l, r) => {
    while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
    if (r - l - 1 > maxLen) { maxLen = r - l - 1; start = l + 1; } // window grew
  };
  for (let i = 0; i < s.length; i++) {
    expand(i, i);       // odd-length center
    expand(i, i + 1);   // even-length center
  }
  return s.slice(start, start + maxLen);
}

console.log('\nGroup Anagrams:');
console.log('  ["eat","tea","tan","ate","nat","bat"] ->',
  JSON.stringify(groupAnagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat'])));

console.log('\nLongest Palindromic Substring:');
console.log('  "babad" ->', longestPalindrome('babad')); // "bab" or "aba"
console.log('  "cbbd"  ->', longestPalindrome('cbbd'));   // "bb"
