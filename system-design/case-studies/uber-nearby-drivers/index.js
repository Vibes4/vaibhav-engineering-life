// Run:  node system-design/case-studies/uber-nearby-drivers/index.js
//
// Demo: geohash-style grid bucketing for "find nearby drivers".
// Goal: show how quantizing each driver's lat/lng into a GRID CELL lets us
// answer "who is near the rider?" by scanning only the rider's cell + its 8
// neighbours — instead of measuring distance to EVERY driver.

// --- 1. The grid -----------------------------------------------------------
// We chop the world into square cells of CELL_SIZE degrees. A point's cell is
// just floor(coord / CELL_SIZE). This is the core idea: 2D position -> a
// discrete (cellX, cellY) bucket key. ~0.01 degrees is roughly ~1.1km.
const CELL_SIZE = 0.01;

function cellOf(lat, lng) {
  const cx = Math.floor(lng / CELL_SIZE); // x axis = longitude
  const cy = Math.floor(lat / CELL_SIZE); // y axis = latitude
  return `${cx}:${cy}`;
}

// --- 2. The index ----------------------------------------------------------
// A map from cell key -> list of drivers in that cell. Updating a driver's
// location is O(1): recompute its cell key and drop it in that bucket. No
// global re-sort — this is what makes the brutal write rate affordable.
const index = new Map();
function addDriver(driver) {
  const key = cellOf(driver.lat, driver.lng);
  if (!index.has(key)) index.set(key, []);
  index.get(key).push(driver);
}

// --- 3. Some drivers scattered around a rider near (12.970, 77.595) --------
const drivers = [
  { id: 'D1', lat: 12.9712, lng: 77.5950 }, // very close
  { id: 'D2', lat: 12.9688, lng: 77.5961 }, // close, next cell over
  { id: 'D3', lat: 12.9905, lng: 77.5950 }, // ~2km north -> outside 3x3
  { id: 'D4', lat: 12.9701, lng: 77.5849 }, // close, neighbour cell
  { id: 'D5', lat: 13.1000, lng: 77.7000 }, // far away (different area)
];
drivers.forEach(addDriver);

// --- 4. The "nearby" query -------------------------------------------------
// Compute the rider's cell, then scan that cell PLUS its 8 surrounding cells.
// Why the neighbours? A driver just across a cell boundary is physically close
// but sits in an adjacent bucket — querying only the rider's own cell misses them.
function nearbyDrivers(lat, lng) {
  const cx = Math.floor(lng / CELL_SIZE);
  const cy = Math.floor(lat / CELL_SIZE);
  const candidates = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const bucket = index.get(`${cx + dx}:${cy + dy}`);
      if (bucket) candidates.push(...bucket);
    }
  }
  return candidates;
}

// --- 5. Run it -------------------------------------------------------------
const rider = { lat: 12.9700, lng: 77.5950 };
console.log('=== Uber nearby-driver grid bucketing ===\n');
console.log(`Rider at (${rider.lat}, ${rider.lng}) -> cell ${cellOf(rider.lat, rider.lng)}\n`);

const found = nearbyDrivers(rider.lat, rider.lng);
console.log(`Scanned 9 cells (rider's cell + 8 neighbours).`);
console.log(`Candidate drivers found: ${found.map((d) => d.id).join(', ')}\n`);

console.log('--- Why this matters ---');
console.log(`We looked at ${found.length} candidates instead of all ${drivers.length} drivers.`);
console.log('At real scale that is "scan ~9 small buckets" vs "measure distance to');
console.log('millions of drivers". The grid throws away the far-away majority for free.');
