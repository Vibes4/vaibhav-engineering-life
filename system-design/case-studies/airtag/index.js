// Run:  node system-design/case-studies/airtag/index.js
//
// Simulates Apple's "Find My" crowdsourced network and its privacy design:
//  - the tag broadcasts a ROTATING public key each interval (anti-tracking)
//  - a passing FINDER encrypts its own GPS to that key and uploads it
//  - APPLE stores only ciphertext it can't read (a blind dropbox)
//  - only the OWNER, with the private key, can decrypt the location
// Uses Node's built-in `crypto` (Elliptic-Curve Diffie-Hellman). No npm.

const crypto = require("crypto");

// ---- 1. At pairing, tag + owner share a SEED. From it the owner can ------
// re-derive every rotating keypair the tag will ever broadcast.
const sharedSeed = crypto.randomBytes(16);

// Deterministically derive the keypair for a given rotation interval `n`.
// Real AirTags use a key-derivation chain; we hash (seed + n) for clarity.
function deriveKeypair(seed, n) {
  const priv = crypto.createHash("sha256").update(seed).update(String(n)).digest();
  const ec = crypto.createECDH("prime256v1");
  ec.setPrivateKey(priv);                 // owner's secret for interval n
  return { ec, publicKey: ec.getPublicKey() }; // public part = the BLE beacon
}

// ---- 2. The tag "broadcasts" the public key for the current interval -----
const interval = 7; // e.g. the 7th 15-minute window since pairing
const tag = deriveKeypair(sharedSeed, interval);
console.log("Tag broadcasts beacon (rotating public key) for interval", interval);
console.log("  beacon:", tag.publicKey.toString("hex").slice(0, 40) + "...");
console.log("  (next interval it broadcasts a totally different-looking key)\n");

// ---- 3. A passing FINDER device encrypts ITS GPS to the beacon key -------
// The finder makes an ephemeral keypair, does ECDH against the beacon's
// public key to get a shared secret, and AES-encrypts its location.
function finderReport(beaconPubKey, location) {
  const eph = crypto.createECDH("prime256v1");
  const ephPub = eph.generateKeys();
  const shared = eph.computeSecret(beaconPubKey);        // finder side secret
  const aesKey = crypto.createHash("sha256").update(shared).digest();
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  const ct = Buffer.concat([c.update(JSON.stringify(location), "utf8"), c.final()]);
  return { ephPub, iv, ct, tag: c.getAuthTag() };
}

const finderGPS = { lat: 37.7749, lng: -122.4194 }; // finder's own location
const report = finderReport(tag.publicKey, finderGPS);
console.log("Finder encrypts ITS location to the beacon and uploads anonymously.");

// ---- 4. APPLE just stores {hash(beacon) -> ciphertext}. It can't read it. -
const apple = new Map();
const beaconHash = crypto.createHash("sha256").update(tag.publicKey).digest("hex");
apple.set(beaconHash, report);
console.log("Apple stores ciphertext indexed by beacon-hash (blind dropbox):");
console.log("  ", beaconHash.slice(0, 24) + "...  ->  <unreadable blob>\n");

// ---- 5. The OWNER re-derives the keys, fetches the report, decrypts -------
const owner = deriveKeypair(sharedSeed, interval);       // same keypair as tag
const myHash = crypto.createHash("sha256").update(owner.publicKey).digest("hex");
const fetched = apple.get(myHash);                        // ask Apple for my tag

const ownerShared = owner.ec.computeSecret(fetched.ephPub); // matches finder's
const ownerKey = crypto.createHash("sha256").update(ownerShared).digest();
const d = crypto.createDecipheriv("aes-256-gcm", ownerKey, fetched.iv);
d.setAuthTag(fetched.tag);
const plain = Buffer.concat([d.update(fetched.ct), d.final()]).toString("utf8");

console.log("Owner decrypts the report ->", plain);
console.log("Only the owner (holding the private key) could read this location.");
