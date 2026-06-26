// Run:  node system-design/case-studies/spotify/index.js
//
// ADAPTIVE BITRATE (ABR) selection with a simple BUFFER-AWARE rule.
// Given a bitrate ladder and a sequence of measured bandwidths, pick the
// highest bitrate that fits each segment -- but if the buffer is dangerously
// low, force the safest (lowest) rung to avoid a stall (rebuffer).

const ladder = [96, 160, 320];        // available bitrates in kbps (the "ladder")
const SEGMENT_SECONDS = 4;            // each audio chunk holds 4s of playback
const LOW_BUFFER = 6;                 // below this many seconds buffered -> play it safe

// Measured network bandwidth (kbps) just before fetching each segment.
const measuredBandwidth = [400, 350, 120, 80, 300, 500, 150];

// Pick the highest ladder rung that is <= available bandwidth.
function highestThatFits(bw) {
  let choice = ladder[0]; // never go below the lowest rung
  for (const rung of ladder) if (rung <= bw) choice = rung;
  return choice;
}

let buffer = 0; // seconds of audio currently buffered ahead of playback
console.log('Ladder:', ladder.join('/'), 'kbps   low-buffer guard:', LOW_BUFFER, 's\n');

measuredBandwidth.forEach((bw, i) => {
  let chosen;
  let note;

  if (buffer < LOW_BUFFER) {
    // Buffer-aware safety: ignore an optimistic bandwidth reading and grab
    // the lowest rung so we refill the buffer fast and don't risk silence.
    chosen = ladder[0];
    note = `buffer low (${buffer.toFixed(1)}s) -> SAFE rung`;
  } else {
    // Healthy buffer: take the best quality the bandwidth can sustain.
    chosen = highestThatFits(bw);
    note = `buffer ok (${buffer.toFixed(1)}s) -> best that fits`;
  }

  // Simulate the download: time to fetch this segment = bits / bandwidth.
  const downloadTime = (chosen * SEGMENT_SECONDS) / bw; // seconds
  // While downloading, that much playback drains from the buffer...
  buffer -= downloadTime;
  if (buffer < 0) buffer = 0; // a stall would have happened; clamp to empty
  // ...then the freshly downloaded segment is added.
  buffer += SEGMENT_SECONDS;

  console.log(
    `seg ${i + 1}: bw=${String(bw).padStart(3)}kbps  -> ${String(chosen).padStart(3)}kbps  ` +
    `(${note}; bufferAfter=${buffer.toFixed(1)}s)`
  );
});

console.log('\nNote: with a healthy buffer ABR climbs to 320kbps (segment 6), but a');
console.log('low buffer or a bandwidth drop forces the safe 96kbps rung to avoid stalls.');
