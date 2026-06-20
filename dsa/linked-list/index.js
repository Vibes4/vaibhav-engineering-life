// Run:  node dsa/linked-list/index.js
// Build a list, reverse it, and detect a cycle with fast/slow pointers.

class Node {
  constructor(val) { this.val = val; this.next = null; }
}

function fromArray(arr) {
  const dummy = new Node(null);
  let tail = dummy;
  for (const v of arr) { tail.next = new Node(v); tail = tail.next; }
  return dummy.next;
}

function toArray(head) {
  const out = [];
  for (let n = head; n; n = n.next) out.push(n.val);
  return out;
}

// Reverse in place: O(n) time, O(1) space.
function reverse(head) {
  let prev = null, curr = head;
  while (curr) {
    const next = curr.next;   // save before overwriting
    curr.next = prev;         // flip the link
    prev = curr;
    curr = next;
  }
  return prev;                // new head
}

// Floyd's cycle detection: O(n) time, O(1) space.
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

const list = fromArray([1, 2, 3, 4, 5]);
console.log('Original:', toArray(list));
console.log('Reversed:', toArray(reverse(fromArray([1, 2, 3, 4, 5]))));

// Build a cycle: tail -> node 3
const cyc = fromArray([1, 2, 3, 4]);
let tail = cyc; while (tail.next) tail = tail.next;
tail.next = cyc.next.next;   // point tail back into the list
console.log('\nDetect cycle:');
console.log('  acyclic [1,2,3] ->', hasCycle(fromArray([1, 2, 3]))); // false
console.log('  with cycle      ->', hasCycle(cyc));                   // true

// ───────── More problems ─────────

// Middle of the Linked List: fast/slow pointers. O(n) time, O(1) space.
function middleNode(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {            // fast moves 2x, slow lands on middle
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;                           // for even length, the second middle
}

// Merge Two Sorted Lists: dummy head, splice smaller node each step. O(n+m) time, O(1) space.
function mergeTwoLists(l1, l2) {
  const dummy = new Node(null);
  let tail = dummy;
  while (l1 && l2) {
    if (l1.val <= l2.val) { tail.next = l1; l1 = l1.next; }
    else { tail.next = l2; l2 = l2.next; }
    tail = tail.next;
  }
  tail.next = l1 || l2;                  // attach the remaining tail
  return dummy.next;
}

console.log('\nMiddle Node:');
console.log('  [1,2,3,4,5] ->', middleNode(fromArray([1, 2, 3, 4, 5])).val); // 3
console.log('  [1,2,3,4]   ->', middleNode(fromArray([1, 2, 3, 4])).val);    // 3

console.log('\nMerge Two Sorted Lists:');
console.log('  [1,2,4] + [1,3,4] ->',
  toArray(mergeTwoLists(fromArray([1, 2, 4]), fromArray([1, 3, 4])))); // [1,1,2,3,4,4]
