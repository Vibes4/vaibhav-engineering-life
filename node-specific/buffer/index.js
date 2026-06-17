// Run:  node node-specific/buffer/index.js

// 1) Create buffers
const fromStr = Buffer.from('Héllo', 'utf8');
console.log('--- from string ---');
console.log('bytes        :', fromStr);                 // <Buffer ...>
console.log('length       :', fromStr.length, 'bytes (note: 6, not 5 — é is 2 bytes)');
console.log('as hex       :', fromStr.toString('hex'));
console.log('as base64    :', fromStr.toString('base64'));
console.log('back to utf8 :', fromStr.toString('utf8'));

// 2) alloc vs allocUnsafe
console.log('\n--- alloc ---');
const safe = Buffer.alloc(4);            // zero-filled
console.log('alloc(4)      :', safe);     // <Buffer 00 00 00 00>

// 3) Encoding conversion (common in APIs / JWT / basic auth)
console.log('\n--- base64 round trip ---');
const encoded = Buffer.from('user:pass').toString('base64');
console.log('encoded:', encoded);
console.log('decoded:', Buffer.from(encoded, 'base64').toString());

// 4) Buffer is a Uint8Array
console.log('\nis Uint8Array?', Buffer.alloc(2) instanceof Uint8Array);

// 5) The multi-byte split problem (why you concat buffers, not strings)
const part1 = Buffer.from([0xC3]);   // first half of 'é'
const part2 = Buffer.from([0xA9]);   // second half
console.log('\n--- multi-byte split ---');
console.log('decode halves separately:', part1.toString() + part2.toString(), '(garbled)');
console.log('concat THEN decode      :', Buffer.concat([part1, part2]).toString(), '(correct é)');

// 6) Read/write numbers at byte offsets (binary protocols)
const buf = Buffer.alloc(4);
buf.writeUInt32BE(1_000_000, 0);
console.log('\nwrote uint32 BE:', buf, '-> read back:', buf.readUInt32BE(0));
