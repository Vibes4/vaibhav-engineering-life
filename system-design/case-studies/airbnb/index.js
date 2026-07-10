// Run:  node system-design/case-studies/airbnb/index.js
//
// Demo: Airbnb's booking engine — the interval-overlap check that
// prevents double-booking. We store bookings as date ranges per listing
// and reject any new booking that overlaps an existing one.

// Parse a "YYYY-MM-DD" string into a comparable timestamp (ms).
const day = (s) => new Date(s + 'T00:00:00Z').getTime();

// THE CORE RULE of the whole system.
// Ranges are HALF-OPEN: [checkIn, checkOut). The checkout day is NOT occupied,
// so one guest's checkout can be another guest's check-in — no conflict.
// Two ranges overlap iff:  aStart < bEnd  AND  bStart < aEnd
function overlaps(aIn, aOut, bIn, bOut) {
  return day(aIn) < day(bOut) && day(bIn) < day(aOut);
}

// In-memory "database": listingId -> array of confirmed bookings.
const bookings = new Map();

// Try to book. Returns true if accepted, false if it conflicts.
// In a real system this whole function runs inside ONE atomic DB transaction
// (with a row lock) so two concurrent requests can't both pass the check.
function tryBook(listingId, checkIn, checkOut) {
  const existing = bookings.get(listingId) || [];

  // Reject if the new range overlaps ANY existing booking for this listing.
  const conflict = existing.find((b) => overlaps(checkIn, checkOut, b.checkIn, b.checkOut));

  if (conflict) {
    console.log(`REJECTED  ${listingId}  ${checkIn} -> ${checkOut}`);
    console.log(`          conflicts with existing ${conflict.checkIn} -> ${conflict.checkOut}\n`);
    return false;
  }

  existing.push({ checkIn, checkOut });
  bookings.set(listingId, existing);
  console.log(`ACCEPTED  ${listingId}  ${checkIn} -> ${checkOut}\n`);
  return true;
}

console.log('=== Airbnb booking engine (overlap detection) ===\n');

// Listing "loft-42" — watch which bookings get accepted vs rejected.
tryBook('loft-42', '2026-07-01', '2026-07-05'); // ACCEPTED (calendar empty)
tryBook('loft-42', '2026-07-05', '2026-07-08'); // ACCEPTED (check-in == prev checkout: OK)
tryBook('loft-42', '2026-07-04', '2026-07-06'); // REJECTED (overlaps both above)
tryBook('loft-42', '2026-07-10', '2026-07-12'); // ACCEPTED (separate range)
tryBook('loft-42', '2026-07-11', '2026-07-11'); // REJECTED (inside the 10->12 range)

// A DIFFERENT listing is unaffected by loft-42's calendar.
tryBook('villa-7', '2026-07-04', '2026-07-06');  // ACCEPTED (different listing)

console.log('--- Why this matters ---');
console.log('The single line `aStart < bEnd && bStart < aEnd` is the whole');
console.log('double-booking guard. In production the check + insert must be');
console.log('ONE atomic transaction, or two guests could both pass the check.');
