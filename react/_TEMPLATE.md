# React module spec (read before writing any page)

Each topic is a folder: `react/<slug>/` containing exactly two files:

  index.html   — an HTML **fragment** (explanation), injected via innerHTML by app.js
  index.js     — a **runnable Node script**, executed as `node react/<slug>/index.js`

## index.html rules

- It is a FRAGMENT: no <!DOCTYPE>, <html>, <head>, <body>, <script>, <style>, no <link>.
- First line is always:
      <h1>Page Title <span class="tag react">React</span></h1>
  followed by 1–2 intro <p> paragraphs (this becomes the fixed page header).
- After the intro, EVERY major concept is an `<h2>` — app.js converts each <h2> plus the
  content that follows it into a collapsible panel. So: 5–9 <h2> sections per page, each
  with real explanation underneath (paragraphs, <ul>, tables, code, callouts).
- Use <h3> for sub-points inside a section. Never use <h1> again.
- Inline code: <code>useState</code>. Multi-line code: <pre><code>…</code></pre>
  (escape < > & as &lt; &gt; &amp; inside <pre>; JSX examples MUST be escaped).
- Callouts (use 2–4 per page, not more):
      <div class="callout"><strong>Note:</strong> …</div>
      <div class="callout warn"><strong>Gotcha:</strong> …</div>
      <div class="callout tip"><strong>Senior tip:</strong> …</div>
- Tables are supported: <table><thead><tr><th>…</th></tr></thead><tbody>…</tbody></table>
- Diagrams (optional, at most one or two per page) use Mermaid, rendered by app.js:
      <pre class="mermaid">
      flowchart TD
        A["Label with spaces"] --> B["Other label"]
      </pre>
  ALWAYS quote node labels: A["Text"]. No parentheses/brackets/pipes inside labels.
  Keep diagrams under ~12 nodes. Valid mermaid 10.x only (flowchart / sequenceDiagram).
- The LAST element on the page is always the interview card, with 4–7 questions:
      <div class="interview">
        <h3>🎯 Interview questions</h3>
        <details><summary>Question?</summary><p>Tight, correct answer.</p></details>
        …
      </div>

## index.js rules

- First line: `// Run:  node react/<slug>/index.js`
- **ZERO dependencies.** `react` and `react-dom` are NOT installed and must NOT be required.
  Node 18+ built-ins only (and usually none at all).
- It must actually run and print useful output. Never print fake/pretend results.
- Because React is a browser library, demonstrate the *mechanism* instead of rendering DOM:
  implement the concept in ~40–120 lines of plain JS (a mini hook dispatcher, a keyed diff,
  a memoization cache, a reducer store, a race-condition simulation, …), then log what
  happens and why. This is honest, runnable, and is exactly what senior interviews probe.
- Structure the file as clearly separated sections with `// --- section name ---` comments
  and `console.log` output that reads like a lesson. 60–150 lines is the sweet spot.
- Where the real React API differs from the simulation, say so in a comment.

## Voice & depth

Match the existing modules (see javascript/closures, nestjs/overview): dense, senior-level,
no filler, explains *why* and the trade-offs, names real pitfalls. React 18/19 accurate:
- StrictMode double-invokes effects and renders in development only.
- Automatic batching applies everywhere in React 18 (not just event handlers).
- `useEffect` cleanup runs before the next effect and on unmount.
- Function components + hooks are the default; class components only for error boundaries.
- Do not invent APIs. If something is Next.js-specific or library-specific, say so.
