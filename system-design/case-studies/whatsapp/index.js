// Run:  node system-design/case-studies/whatsapp/index.js
//
// Demonstrates the heart of WhatsApp: Alice and Bob derive the SAME secret key
// using Diffie-Hellman WITHOUT it ever crossing the wire, encrypt a message
// with it, prove the relaying server only sees ciphertext, and Bob decrypts.
// Also models the tick state machine. Uses only Node's built-in `crypto`.

const crypto = require("crypto");

// ---- 1. Public agreement: both pick the same DH group (safe to be public) -
// Like agreeing on the shared base paint color. modp14 is a standard group.
const alice = crypto.getDiffieHellman("modp14");
const bob = crypto.getDiffieHellman("modp14");

// ---- 2. Each side makes a PRIVATE key and a PUBLIC key --------------------
// generateKeys() creates the private key (kept secret) and the public key.
const alicePub = alice.generateKeys(); // public = safe to send over the wire
const bobPub = bob.generateKeys();

console.log("Over the wire, the server only ever sees these PUBLIC keys:");
console.log("  Alice public:", alicePub.toString("hex").slice(0, 32) + "...");
console.log("  Bob   public:", bobPub.toString("hex").slice(0, 32) + "...");

// ---- 3. Each combines THEIR private + the OTHER's public ------------------
// The shared secret is computed locally on each device. It never travels.
const aliceSecret = alice.computeSecret(bobPub);
const bobSecret = bob.computeSecret(alicePub);

console.log("\nSecrets computed locally (never sent). Do they match?",
  aliceSecret.equals(bobSecret)); // -> true, the DH magic

// ---- 4. Derive a fast symmetric AES key from the shared secret ------------
// Hash the big secret down to a 256-bit AES key.
const aesKey = crypto.createHash("sha256").update(aliceSecret).digest();

// ---- 5. Alice encrypts a message; the server relays only ciphertext -------
function encrypt(key, plaintext) {
  const iv = crypto.randomBytes(12); // fresh nonce per message
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return { iv, ct, tag: cipher.getAuthTag() };
}
function decrypt(key, { iv, ct, tag }) {
  const d = crypto.createDecipheriv("aes-256-gcm", key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
}

const message = "Hey Bob, the eagle lands at noon.";
const packet = encrypt(aesKey, message);

console.log("\n--- What the SERVER sees while relaying (store-and-forward) ---");
console.log("  ciphertext:", packet.ct.toString("hex"));
console.log("  (server cannot read it: it has no private key)\n");

// ---- 6. Bob decrypts with HIS copy of the derived key ---------------------
const bobAesKey = crypto.createHash("sha256").update(bobSecret).digest();
console.log("Bob decrypts ->", decrypt(bobAesKey, packet));

// ---- 7. The tick state machine, driven by ACKs flowing back to Alice ------
const TICKS = {
  sent:      "✓  (single grey) server got Alice's message",
  delivered: "✓✓ (double grey) reached Bob's device",
  read:      "✓✓ (blue)        Bob opened the chat",
};
console.log("\n--- Tick state machine (one-way transitions) ---");
for (const state of ["sent", "delivered", "read"]) {
  console.log("  " + TICKS[state]);
}
