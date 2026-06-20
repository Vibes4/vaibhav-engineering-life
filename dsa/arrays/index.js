// Run:  node dsa/arrays/index.js
// Two Sum (HashMap) + Sliding Window maximum subarray sum of size k.

// Two Sum: O(n) time, O(n) space.
function twoSum(nums, target) {
  const seen = new Map();            // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return null;
}

// Sliding Window: max sum of any contiguous subarray of size k. O(n) time, O(1) space.
function maxSubarraySum(nums, k) {
  if (nums.length < k) return null;
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += nums[i];   // first window
  let best = windowSum;
  for (let i = k; i < nums.length; i++) {
    windowSum += nums[i] - nums[i - k];               // slide: add right, drop left
    best = Math.max(best, windowSum);
  }
  return best;
}

console.log('Two Sum:');
console.log('  [2,7,11,15], target 9 ->', twoSum([2, 7, 11, 15], 9)); // [0,1]
console.log('  [3,2,4],     target 6 ->', twoSum([3, 2, 4], 6));      // [1,2]

console.log('\nSliding Window (max sum of size k):');
console.log('  [2,1,5,1,3,2], k=3 ->', maxSubarraySum([2, 1, 5, 1, 3, 2], 3)); // 9
console.log('  [1,1,1,1,1],   k=2 ->', maxSubarraySum([1, 1, 1, 1, 1], 2));    // 2

// ───────── More problems ─────────

// Best Time to Buy & Sell Stock: track min-so-far, one pass. O(n) time, O(1) space.
function maxProfit(prices) {
  let minPrice = Infinity, best = 0;
  for (const p of prices) {
    if (p < minPrice) minPrice = p;            // cheapest day to have bought
    else best = Math.max(best, p - minPrice);  // sell today vs best so far
  }
  return best;
}

// Product of Array Except Self: prefix * suffix, no division. O(n) time, O(n) space.
function productExceptSelf(nums) {
  const out = new Array(nums.length).fill(1);
  let prefix = 1;
  for (let i = 0; i < nums.length; i++) {      // products of everything to the left
    out[i] = prefix;
    prefix *= nums[i];
  }
  let suffix = 1;
  for (let i = nums.length - 1; i >= 0; i--) { // multiply in products to the right
    out[i] *= suffix;
    suffix *= nums[i];
  }
  return out;
}

// Move Zeroes: two pointers in-place, keep non-zero order. O(n) time, O(1) space.
function moveZeroes(nums) {
  let insert = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== 0) {                        // swap non-zero to the front slot
      [nums[insert], nums[i]] = [nums[i], nums[insert]];
      insert++;
    }
  }
  return nums;
}

// Merge Intervals: sort by start, merge overlaps. O(n log n) time, O(n) space.
function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [sorted[0].slice()];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i][0] <= last[1]) last[1] = Math.max(last[1], sorted[i][1]); // overlap
    else merged.push(sorted[i].slice());
  }
  return merged;
}

console.log('\nBest Time to Buy & Sell Stock:');
console.log('  [7,1,5,3,6,4] ->', maxProfit([7, 1, 5, 3, 6, 4])); // 5

console.log('\nProduct Except Self:');
console.log('  [1,2,3,4] ->', productExceptSelf([1, 2, 3, 4])); // [24,12,8,6]

console.log('\nMove Zeroes:');
console.log('  [0,1,0,3,12] ->', moveZeroes([0, 1, 0, 3, 12])); // [1,3,12,0,0]

console.log('\nMerge Intervals:');
console.log('  [[1,3],[2,6],[8,10],[15,18]] ->',
  JSON.stringify(mergeIntervals([[1, 3], [2, 6], [8, 10], [15, 18]]))); // [[1,6],[8,10],[15,18]]
