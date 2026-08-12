/* DSA practice controller (list-only): a flat, priority-ordered list of the
   top-100 Google questions. Each problem shows its statement + example test
   cases and a "Solve on LeetCode" link — no in-browser editor. */
(function () {
  var PROBLEMS = window.DSA_PROBLEMS || [];
  var state = { id: PROBLEMS.length ? PROBLEMS[0].id : null, filter: '' };

  // LeetCode URL: our id equals the LeetCode slug except for a few overrides.
  var LC_SLUG = { 'two-sum-ii-sorted': 'two-sum-ii-input-array-is-sorted' };
  function lcUrl(p) { return 'https://leetcode.com/problems/' + (LC_SLUG[p.id] || p.id) + '/'; }

  var els = {
    list: document.getElementById('dsa-list-items'),
    search: document.getElementById('dsa-search'),
    main: document.getElementById('dsa-main')
  };

  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function byId(id) { for (var i = 0; i < PROBLEMS.length; i++) if (PROBLEMS[i].id === id) return PROBLEMS[i]; return null; }

  var solvedKey = function (id) { return 'dsa.solved.' + id; };
  function isSolved(id) { try { return localStorage.getItem(solvedKey(id)) === '1'; } catch (e) { return false; } }
  function toggleSolved(id) { try { localStorage.setItem(solvedKey(id), isSolved(id) ? '0' : '1'); } catch (e) {} }

  /* ---------- left list (flat, numbered, priority order) ---------- */
  function renderList() {
    var q = state.filter.toLowerCase();
    els.list.innerHTML = '';
    PROBLEMS.forEach(function (p, i) {
      if (q && (p.title + ' ' + p.tags.join(' ')).toLowerCase().indexOf(q) === -1) return;
      var row = document.createElement('div');
      row.className = 'dsa-item' + (p.id === state.id ? ' active' : '');
      row.setAttribute('data-id', p.id);
      row.innerHTML =
        '<div class="dsa-item-main">' +
          '<div class="t"><span class="idx">' + (i + 1) + '.</span>' +
            (isSolved(p.id) ? '<span class="solved">✔</span>' : '') + esc(p.title) + '</div>' +
          '<div class="m"><span class="pill ' + p.difficulty + '">' + p.difficulty + '</span> &middot; ' + esc(p.tags.join(', ')) + '</div>' +
        '</div>' +
        '<a class="dsa-item-lc" href="' + lcUrl(p) + '" target="_blank" rel="noopener" title="Open on LeetCode">↗</a>';
      els.list.appendChild(row);
    });
    if (!els.list.children.length) els.list.innerHTML = '<div style="padding:16px;color:var(--muted);font-size:13px">No problems match.</div>';
  }

  // Delegated: clicking a row selects it; clicking the ↗ link opens LeetCode.
  els.list.addEventListener('click', function (e) {
    if (e.target.closest('.dsa-item-lc')) return;
    var it = e.target.closest('.dsa-item'); if (!it) return;
    state.id = it.getAttribute('data-id'); renderList(); renderMain();
  });

  /* ---------- example test cases ---------- */
  function renderExamples(p) {
    var tests = (p.tests || []).slice(0, 3);
    if (!tests.length) return '';
    var html = '<div class="dsa-examples"><div class="dsa-ex-head">Example test cases</div>';
    tests.forEach(function (t, i) {
      html += '<div class="dsa-example">' +
        '<div class="ex-n">Example ' + (i + 1) + '</div>' +
        '<div class="ex-row"><span class="ex-k">Input</span><pre>' + esc(t.stdin) + '</pre></div>' +
        '<div class="ex-row"><span class="ex-k">Output</span><pre>' + esc(t.expected === '' ? '(empty)' : t.expected) + '</pre></div>' +
      '</div>';
    });
    if ((p.tests || []).length > tests.length) {
      html += '<div class="dsa-ex-more">+ ' + (p.tests.length - tests.length) + ' more example(s) — see the full set on LeetCode</div>';
    }
    html += '</div>';
    return html;
  }

  /* ---------- right detail (read-only) ---------- */
  function renderMain() {
    var p = byId(state.id);
    if (!p) { els.main.innerHTML = '<p style="color:var(--muted)">Pick a problem from the left.</p>'; return; }
    els.main.innerHTML =
      '<div class="dsa-topbar"><a href="../index.html">← Back to modules</a>' +
        '<button class="dsa-btn" id="dsa-theme">\u{1F319} Theme</button></div>' +
      '<div class="dsa-statement">' +
        '<h2>' + esc(p.title) + ' <span class="pill ' + p.difficulty + '">' + p.difficulty + '</span></h2>' +
        '<div class="tags">' + esc(p.tags.join(' · ')) + '</div>' +
        p.statement +
        '<div class="dsa-io">' + p.io + '</div>' +
        renderExamples(p) +
      '</div>' +
      '<div class="dsa-actions">' +
        '<a class="dsa-lc" href="' + lcUrl(p) + '" target="_blank" rel="noopener">Solve on LeetCode ↗</a>' +
        '<button class="dsa-btn" id="dsa-solved">' + (isSolved(p.id) ? '✔ Solved — click to unmark' : 'Mark as solved') + '</button>' +
      '</div>';
    document.getElementById('dsa-theme').addEventListener('click', toggleTheme);
    document.getElementById('dsa-solved').addEventListener('click', function () { toggleSolved(p.id); renderList(); renderMain(); });
  }

  /* ---------- theme (shared with the main app via localStorage) ---------- */
  function toggleTheme() {
    var dark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
  }

  /* ---------- search ---------- */
  els.search.addEventListener('input', function () { state.filter = els.search.value; renderList(); });

  renderList();
  renderMain();
})();
