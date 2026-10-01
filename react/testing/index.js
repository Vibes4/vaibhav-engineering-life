// Run:  node react/testing/index.js
//
// Two mechanisms from React Testing Library, implemented for real:
//   (a) the QUERY PRIORITY resolver — which query RTL wants you to use for each
//       element, and why a missing accessible name is an accessibility bug;
//   (b) the getBy / queryBy / findBy semantics — throw, null, and retry —
//       against an element that only appears after an async round-trip.

// --- a tiny accessible DOM -------------------------------------------------
// Each node carries what a browser would compute: a role, an accessible name,
// plus the fallbacks RTL falls back to when the name is missing.
const tree = [
  { tag: 'h1',       role: 'heading',  name: 'Orders' },
  { tag: 'input',    role: 'textbox',  name: 'Email', label: 'Email' },
  { tag: 'input',    role: 'textbox',  name: null, placeholder: 'Search orders' },
  { tag: 'input',    role: 'textbox',  name: null, value: 'ada@example.com' },
  { tag: 'button',   role: 'button',   name: 'Submit order' },
  { tag: 'button',   role: 'button',   name: null, testid: 'icon-trash' },   // icon-only, no aria-label
  { tag: 'p',        role: null,       name: null, text: 'No orders yet' },
  { tag: 'img',      role: 'img',      name: null, alt: 'Company logo' },
  { tag: 'div',      role: null,       name: null, testid: 'sales-chart' },  // canvas wrapper
  { tag: 'div',      role: null,       name: null },                          // unreachable
];

// --- (a) the priority order, exactly as RTL documents it -------------------
const PRIORITY = [
  { q: 'getByRole',            when: (e) => e.role && e.name,
    fmt: (e) => `getByRole('${e.role}', { name: /${e.name.toLowerCase()}/i })`,
    why: 'role + accessible name is what a screen reader announces' },
  { q: 'getByLabelText',       when: (e) => e.label,
    fmt: (e) => `getByLabelText(/${e.label.toLowerCase()}/i)`,
    why: 'how a user fills in a form field' },
  { q: 'getByPlaceholderText', when: (e) => e.placeholder,
    fmt: (e) => `getByPlaceholderText(/${e.placeholder.toLowerCase()}/i)`,
    why: 'no label exists — the field probably SHOULD have one' },
  { q: 'getByText',            when: (e) => e.text,
    fmt: (e) => `getByText(/${e.text.toLowerCase()}/i)`,
    why: 'non-interactive copy the user reads' },
  { q: 'getByDisplayValue',    when: (e) => e.value,
    fmt: (e) => `getByDisplayValue('${e.value}')`,
    why: 'a prefilled input with no label or placeholder' },
  { q: 'getByAltText',         when: (e) => e.alt,
    fmt: (e) => `getByAltText(/${e.alt.toLowerCase()}/i)`,
    why: 'images and iframes' },
  { q: 'getByTestId',          when: (e) => e.testid,
    fmt: (e) => `getByTestId('${e.testid}')`,
    why: 'LAST RESORT — invisible to users and to assistive tech' },
];

console.log('(a) Which query wins for each element, walking the priority list top-down\n');
for (const el of tree) {
  const hit = PRIORITY.find((p) => p.when(el));
  const desc = `<${el.tag}>`.padEnd(9);
  if (!hit) {
    console.log(`  ${desc} UNREACHABLE — no role, no name, no text, no test id.`);
    console.log(`            A user cannot describe it and a test cannot find it.\n`);
    continue;
  }
  const rank = PRIORITY.indexOf(hit) + 1;
  console.log(`  ${desc} #${rank} ${hit.fmt(el).padEnd(46)} ${hit.why}`);
  if (hit.q === 'getByTestId' && el.role) {
    console.log(`            ^ it HAS role="${el.role}" but no accessible name — add aria-label`);
    console.log(`              and it becomes getByRole('${el.role}', { name: ... }). Fixing the`);
    console.log('              test here is literally fixing an accessibility bug.\n');
  }
}
console.log('  Rule: drop a level only when the level above genuinely does not apply.\n');

// --- (b) a mutable "DOM" where one element arrives late --------------------
const dom = [{ role: 'status', name: 'Loading orders' }];
setTimeout(() => {
  dom.length = 0;                                   // spinner removed
  dom.push({ role: 'row', name: 'Order 1001' });     // data rendered
}, 60);                                              // e.g. a resolved fetch

const matches = (sel) => dom.filter((e) => e.role === sel.role && (!sel.name || e.name === sel.name));

// getBy*: throws immediately, and prints the DOM to help you
function getBy(sel) {
  const found = matches(sel);
  if (found.length === 0) {
    throw new Error(`Unable to find an element with role "${sel.role}". ` +
      `Present roles: [${dom.map((e) => e.role).join(', ') || 'none'}]`);
  }
  if (found.length > 1) throw new Error(`Found multiple elements — use getAllBy*`);
  return found[0];
}
// queryBy*: returns null instead of throwing — the ONLY one usable for absence
const queryBy = (sel) => matches(sel)[0] ?? null;

// findBy*: getBy retried on an interval until it succeeds or the timeout fires
function findBy(sel, { timeout = 1000, interval = 20 } = {}) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    (function attempt() {
      try { return resolve({ el: getBy(sel), waited: Date.now() - started }); }
      catch (err) {
        if (Date.now() - started >= timeout) return reject(err);
        setTimeout(attempt, interval);
      }
    })();
  });
}

(async function demo() {
  console.log('(b) getBy / queryBy / findBy against data that arrives after ~60ms\n');

  console.log('  expect(getByRole("status")).toBeInTheDocument()');
  console.log(`    -> found "${getBy({ role: 'status' }).name}" — it is already rendered\n`);

  console.log('  getByRole("row")  // asserting the data row is there, immediately');
  try { getBy({ role: 'row' }); }
  catch (err) { console.log(`    -> THREW: ${err.message}`); }
  console.log('       getBy fails the test at the query, before expect() ever runs.\n');

  console.log('  expect(queryByRole("row")).not.toBeInTheDocument()');
  console.log(`    -> returned ${queryBy({ role: 'row' })} — no throw, so absence is assertable.`);
  console.log('       This is why queryBy exists: getBy can never express "should NOT be there".\n');

  console.log('  expect(await findByRole("row")).toBeInTheDocument()');
  const { el, waited } = await findBy({ role: 'row' });
  console.log(`    -> resolved with "${el.name}" after ~${waited}ms of retrying\n`);

  console.log('  await waitForElementToBeRemoved(() => queryByRole("status"))');
  console.log(`    -> the spinner is now ${queryBy({ role: 'status' })} — removal confirmed\n`);

  console.log('  findByRole("dialog")  // nothing will ever render this');
  try { await findBy({ role: 'dialog' }, { timeout: 120 }); }
  catch (err) { console.log(`    -> REJECTED after the timeout: ${err.message}`); }

  console.log('\n  Takeaway: getBy = must exist now, queryBy = may be absent,');
  console.log('  findBy = will exist soon (always await it — an un-awaited promise is truthy,');
  console.log('  so expect(screen.findByText(...)).toBeInTheDocument() passes even when wrong).');
})();
