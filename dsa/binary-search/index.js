// Run:  node dsa/binary-search/index.js
// Classic search + search-insert-position + first occurrence (lower bound).

// Classic binary search: O(log n). Returns index or -1.
function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

// Search insert position: index where target is, or would be inserted. O(log n).
function searchInsert(arr, target) {
  let lo = 0, hi = arr.length;          // note: hi is length (exclusive)
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// First occurrence (lower bound) with duplicates. O(log n). -1 if absent.
function firstOccurrence(arr, target) {
  let lo = 0, hi = arr.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (arr[mid] === target) { ans = mid; hi = mid - 1; } // keep going left
    else if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return ans;
}

const a = [1, 3, 5, 7, 9, 11];
console.log('binarySearch(7) ->', binarySearch(a, 7));   // 3
console.log('binarySearch(4) ->', binarySearch(a, 4));   // -1
console.log('searchInsert(6) ->', searchInsert(a, 6));   // 3
console.log('searchInsert(12)->', searchInsert(a, 12));  // 6

const dups = [1, 2, 2, 2, 3, 4];
console.log('\nfirstOccurrence(2) ->', firstOccurrence(dups, 2)); // 1
console.log('firstOccurrence(5) ->', firstOccurrence(dups, 5));   // -1

// ───────── More problems ─────────

// Last occurrence (upper bound) with duplicates. O(log n) time, O(1) space. -1 if absent.
function lastOccurrence(arr, target) {
  let lo = 0, hi = arr.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (arr[mid] === target) { ans = mid; lo = mid + 1; } // keep going right
    else if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return ans;
}

console.log('\nlastOccurrence(2) ->', lastOccurrence(dups, 2)); // 3
console.log('lastOccurrence(5) ->', lastOccurrence(dups, 5));   // -1
