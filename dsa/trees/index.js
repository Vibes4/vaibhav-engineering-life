// Run:  node dsa/trees/index.js
// Build a binary tree, then inorder DFS, level-order BFS, and maxDepth.

class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

//         4
//       /   \
//      2     6
//     / \   / \
//    1   3 5   7
const root = new TreeNode(4,
  new TreeNode(2, new TreeNode(1), new TreeNode(3)),
  new TreeNode(6, new TreeNode(5), new TreeNode(7)));

// Inorder DFS: left, node, right -> sorted for a BST. O(n).
function inorder(node, out = []) {
  if (!node) return out;
  inorder(node.left, out);
  out.push(node.val);
  inorder(node.right, out);
  return out;
}

// Level-order BFS: group nodes by depth using a queue. O(n).
function levelOrder(root) {
  if (!root) return [];
  const levels = [], queue = [root];
  while (queue.length) {
    const level = [], size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    levels.push(level);
  }
  return levels;
}

// Max depth: O(n).
function maxDepth(node) {
  if (!node) return 0;
  return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
}

console.log('Inorder  (sorted):', inorder(root).join(' '));  // 1 2 3 4 5 6 7
console.log('Level order (BFS):', JSON.stringify(levelOrder(root)));
console.log('Max depth        :', maxDepth(root));            // 3

// ───────── More problems ─────────

// Validate BST: every node within (min, max) bounds. O(n) time, O(h) space.
function isValidBST(node, min = -Infinity, max = Infinity) {
  if (!node) return true;
  if (node.val <= min || node.val >= max) return false;       // out of allowed range
  return isValidBST(node.left, min, node.val)                 // left subtree < node
    && isValidBST(node.right, node.val, max);                 // right subtree > node
}

// Lowest Common Ancestor (general BINARY TREE): node where p and q split. O(n) time, O(h) space.
function lowestCommonAncestor(node, p, q) {
  if (!node || node === p || node === q) return node;         // hit a target or dead end
  const left = lowestCommonAncestor(node.left, p, q);
  const right = lowestCommonAncestor(node.right, p, q);
  if (left && right) return node;                             // p and q on opposite sides
  return left || right;                                       // both on one side (or neither)
}

console.log('\nValidate BST:');
console.log('  sample tree above ->', isValidBST(root)); // true
const badBST = new TreeNode(5, new TreeNode(1), new TreeNode(4, new TreeNode(3), new TreeNode(6)));
console.log('  invalid tree      ->', isValidBST(badBST)); // false

console.log('\nLowest Common Ancestor:');
const lcaNode = lowestCommonAncestor(root, root.left.left, root.left.right); // nodes 1 and 3
console.log('  LCA(1, 3) ->', lcaNode.val); // 2
console.log('  LCA(1, 7) ->', lowestCommonAncestor(root, root.left.left, root.right.right).val); // 4
