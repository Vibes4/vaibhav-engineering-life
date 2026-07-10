// Run:  node system-design/case-studies/youtube/index.js
//
// Simulates YouTube's transcode fan-out: one uploaded video is turned into a
// "rendition ladder" (many resolutions), each rendition is sliced into fixed
// length segments, and we print an HLS-style manifest. No npm packages.

// ---- 1. The uploaded source video (what the creator gave us) --------------
const upload = {
  title: "My Trip to the Mountains",
  durationSec: 47,           // total length of the video
  sourceHeight: 1080,        // creator uploaded 1080p; we won't make anything taller
};

// ---- 2. The rendition ladder: every quality we COULD produce --------------
// Each rung has a target resolution and an average bitrate (kbps).
// A slow phone picks a low rung; fast fiber picks a high one.
const LADDER = [
  { name: "240p",  height: 240,  bitrateKbps: 400 },
  { name: "480p",  height: 480,  bitrateKbps: 1200 },
  { name: "720p",  height: 720,  bitrateKbps: 2800 },
  { name: "1080p", height: 1080, bitrateKbps: 5000 },
];

const SEGMENT_SEC = 6; // fixed segment length — same across ALL renditions

// We only make renditions up to the source resolution (can't upscale quality).
const renditions = LADDER.filter((r) => r.height <= upload.sourceHeight);

// ---- 3. Fan out: slice each rendition into fixed-length segments ----------
function segmentsFor(durationSec) {
  // ceil so the final, shorter segment is still included.
  const count = Math.ceil(durationSec / SEGMENT_SEC);
  const segs = [];
  for (let i = 0; i < count; i++) {
    const start = i * SEGMENT_SEC;
    const len = Math.min(SEGMENT_SEC, durationSec - start); // last one is short
    segs.push({ index: i, durationSec: len });
  }
  return segs;
}

console.log(`\n=== UPLOAD: "${upload.title}" (${upload.durationSec}s, ${upload.sourceHeight}p source) ===`);
console.log(`Transcoding fan-out -> ${renditions.length} renditions, ${SEGMENT_SEC}s segments each\n`);

// ---- 4. Print the MASTER manifest (lists every quality for the player) ----
console.log("#EXTM3U   <-- master.m3u8 (the player reads this first)");
for (const r of renditions) {
  console.log(`#EXT-X-STREAM-INF:BANDWIDTH=${r.bitrateKbps * 1000},RESOLUTION=x${r.height}`);
  console.log(`  ${r.name}/index.m3u8`);
}

// ---- 5. Print a MEDIA manifest per rendition (the actual segment list) ----
for (const r of renditions) {
  const segs = segmentsFor(upload.durationSec);
  const sizeKB = Math.round((r.bitrateKbps / 8) * upload.durationSec); // bytes ~= kbps/8 * sec
  console.log(`\n--- ${r.name}/index.m3u8  (${segs.length} segments, ~${sizeKB} KB total) ---`);
  console.log("#EXTM3U");
  for (const s of segs) {
    console.log(`#EXTINF:${s.durationSec.toFixed(1)},`);
    console.log(`segment_${String(s.index).padStart(3, "0")}.ts`);
  }
  console.log("#EXT-X-ENDLIST");
}

console.log("\nNote: segment_005.ts of 240p and of 1080p cover the SAME seconds,");
console.log("so the player can swap quality between any two segments seamlessly.");
