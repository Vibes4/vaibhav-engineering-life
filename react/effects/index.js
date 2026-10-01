// Run:  node react/effects/index.js
//
// React is a browser library, so instead of rendering DOM we build a mini
// effect scheduler that stores effects in call-order slots and does the REAL
// shallow Object.is dependency comparison React does. Then we watch the four
// behaviours interviewers probe: skipping, re-running with cleanup, the
// object-literal infinite loop, and StrictMode's double mount.

// --- a mini effect scheduler ----------------------------------------------
function createHost(label) {
  let slots = [];            // one slot per useEffect call, keyed by CALL ORDER
  let cursor = 0;
  let pending = [];          // effects committed this render, run AFTER "paint"
  let component = null;
  let renders = 0;

  function useEffect(setup, deps) {
    const slot = cursor++;
    const prev = slots[slot];
    // React's rule: no deps array => always re-run; otherwise shallow Object.is
    const changed =
      !prev || !deps || !prev.deps ||
      deps.length !== prev.deps.length ||
      deps.some((d, i) => !Object.is(d, prev.deps[i]));
    if (changed) pending.push(slot);
    else console.log(`   [${label}] deps unchanged -> effect SKIPPED`);
    slots[slot] = { setup, deps, cleanup: prev ? prev.cleanup : undefined };
  }

  function render(fn) {
    if (fn) component = fn;
    cursor = 0;
    pending = [];
    renders++;
    component();
    // commit + paint happen here; useEffect callbacks are deferred until after
    for (const slot of pending) {
      const s = slots[slot];
      if (s.cleanup) { console.log(`   [${label}] cleanup of the PREVIOUS effect`); s.cleanup(); }
      s.cleanup = s.setup() || undefined;   // a returned function becomes the cleanup
    }
  }

  function unmount() {
    for (const s of slots) if (s && s.cleanup) { console.log(`   [${label}] unmount cleanup`); s.cleanup(); }
    slots = []; cursor = 0;
  }

  return { useEffect, render, unmount, renders: () => renders };
}

// --- 1. deps unchanged -> skipped, deps changed -> cleanup then re-run -----
console.log('1) Dependency comparison: skip vs cleanup-then-rerun\n');
const chat = createHost('chat');
let roomId = 'general';
chat.render(function ChatRoom() {
  console.log(`   render #${chat.renders()} roomId=${roomId}`);
  chat.useEffect(() => {
    const room = roomId;                       // the cleanup closes over THIS render
    console.log(`   [chat] connect("${room}")`);
    return () => console.log(`   [chat] disconnect("${room}")`);
  }, [roomId]);
});
console.log('   -- re-render with the SAME roomId --');
chat.render();
console.log('   -- re-render after roomId changes to "travel" --');
roomId = 'travel';
chat.render();
console.log('   -- unmount --');
chat.unmount();
console.log('   Ordering is always: cleanup(old value) BEFORE setup(new value).\n');

// --- 2. an object literal as a dependency = infinite loop ------------------
console.log('2) An object dependency is a new reference every render\n');
const loop = createHost('loop');
let runs = 0;
const CAP = 5;
loop.render(function Search() {
  const options = { sort: 'asc' };             // new object literal EVERY render
  loop.useEffect(() => {
    runs++;
    console.log(`   effect run #${runs} (deps compared with Object.is on a fresh object)`);
    if (runs < CAP) loop.render();             // stands in for the setState that re-renders
    else console.log(`   ...capped at ${CAP}; in a real app this never stops.`);
  }, [options]);
});
console.log(`   Object.is({sort:'asc'}, {sort:'asc'}) = ${Object.is({ sort: 'asc' }, { sort: 'asc' })}`);
console.log("   Fix: depend on the primitives ([sort]), build the object inside the effect,");
console.log('   or stabilize it with useMemo.\n');

// --- 3. StrictMode double mount: leaking vs balanced -----------------------
console.log('3) StrictMode mounts, unmounts, then mounts again (dev only)\n');
function strictMount(name, withCleanup) {
  let open = 0;
  const Subscribing = (host) =>
    host.useEffect(() => {
      open++;
      console.log(`   [${name}] subscribe   -> open subscriptions: ${open}`);
      if (!withCleanup) return;                // the leaky version returns nothing
      return () => { open--; console.log(`   [${name}] unsubscribe -> open subscriptions: ${open}`); };
    }, []);

  const first = createHost(name);
  first.render(() => Subscribing(first));      // mount
  first.unmount();                             // StrictMode's immediate unmount
  const second = createHost(name);             // fresh instance = the remount
  second.render(() => Subscribing(second));
  return open;
}
const leaked = strictMount('no-cleanup', false);
console.log(`   -> ${leaked} subscriptions still open. The double mount EXPOSED the leak.\n`);
const balanced = strictMount('with-cleanup', true);
console.log(`   -> ${balanced} subscription open, exactly as in production.\n`);

console.log('Lesson: an effect that is safe to re-run is safe, full stop. The dependency');
console.log('array is a truthful list of what the body reads - not a switch for "run once".');
console.log('Never silence StrictMode with a hasRun ref; add the cleanup it is asking for.');
