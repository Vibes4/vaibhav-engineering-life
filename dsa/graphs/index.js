// Run:  node dsa/graphs/index.js
// Adjacency-list DFS + BFS, plus Number of Islands on a grid.

const graph = {
  A: ['B', 'C'], B: ['A', 'D'], C: ['A', 'D', 'E'], D: ['B', 'C'], E: ['C'],
};

// DFS: O(V + E). Recursion with a visited set.
function dfs(graph, start, visited = new Set(), order = []) {
  visited.add(start);
  order.push(start);
  for (const next of graph[start]) {
    if (!visited.has(next)) dfs(graph, next, visited, order);
  }
  return order;
}

// BFS: O(V + E). Mark visited on enqueue.
function bfs(graph, start) {
  const visited = new Set([start]), order = [], queue = [start];
  while (queue.length) {
    const node = queue.shift();
    order.push(node);
    for (const next of graph[node]) {
      if (!visited.has(next)) { visited.add(next); queue.push(next); }
    }
  }
  return order;
}

// Number of Islands: flood-fill each landmass. O(rows * cols).
function numIslands(grid) {
  let count = 0;
  const sink = (r, c) => {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] !== '1') return;
    grid[r][c] = '0';                       // mark visited
    sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1);
  };
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === '1') { count++; sink(r, c); }
    }
  }
  return count;
}

console.log('DFS from A:', dfs(graph, 'A').join(' -> '));
console.log('BFS from A:', bfs(graph, 'A').join(' -> '));

const grid = [
  ['1', '1', '0', '0'],
  ['1', '0', '0', '1'],
  ['0', '0', '1', '1'],
];
console.log('\nNumber of Islands:', numIslands(grid)); // 2

// ───────── More problems ─────────

// Small graph node for the clone demo.
class GraphNode {
  constructor(val) { this.val = val; this.neighbors = []; }
}

// Clone Graph: DFS with visited Map of original -> clone. O(V + E) time, O(V) space.
function cloneGraph(node, visited = new Map()) {
  if (!node) return null;
  if (visited.has(node)) return visited.get(node);   // already cloned -> reuse
  const copy = new GraphNode(node.val);
  visited.set(node, copy);                           // record before recursing (handles cycles)
  for (const nb of node.neighbors) {
    copy.neighbors.push(cloneGraph(nb, visited));
  }
  return copy;
}

// Structural equality check (different objects, same shape) for the demo.
function sameStructure(a, b, seen = new Set()) {
  if (a === b) return false;                          // must be distinct objects
  if (!a || !b || a.val !== b.val) return false;
  if (a.neighbors.length !== b.neighbors.length) return false;
  if (seen.has(a)) return true;
  seen.add(a);
  return a.neighbors.every((nb, i) => sameStructure(nb, b.neighbors[i], seen));
}

// Build a tiny graph: 1-2, 1-3, 2-4 (undirected, with a cycle 1<->2).
const g1 = new GraphNode(1), g2 = new GraphNode(2), g3 = new GraphNode(3), g4 = new GraphNode(4);
g1.neighbors = [g2, g3];
g2.neighbors = [g1, g4];
g3.neighbors = [g1];
g4.neighbors = [g2];

const cloned = cloneGraph(g1);
console.log('\nClone Graph:');
console.log('  clone is a different object ->', cloned !== g1);          // true
console.log('  clone is structurally equal ->', sameStructure(g1, cloned)); // true
