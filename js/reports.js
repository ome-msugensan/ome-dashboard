/* Printable reports: CSS report, office-level summary, period-to-period comparison. */
(function () {
  'use strict';
  const O = window.OME;
  const { Store, SQD, THEMES, summarize, band, groupBy, filterRows, periodsOf, periodKey, periodLabel, commentsWithThemes, fmt, esc, toCSV, downloadText } = O;

  const sel = { kind: 'css', period: '', office: '', compare: '' };
  let lastTable = null; // rows for "Download CSV"

  function render(el) {
    const all = Store.all();
    const pt = Store.settings.periodType;
    const periods = periodsOf(all, pt);
    const offices = [...new Set(all.map(r => r.office))].sort();
    if (sel.kind === 'compare' && !sel.compare && periods.length > 1) { sel.period = periods[periods.length - 1]; sel.compare = periods[periods.length - 2]; }

    el.innerHTML = `
      <div class="section-head no-print"><div><h2>Reports</h2><p class="muted">Generate a report, then print it or save it as PDF.</p></div></div>
      <div class="card filters no-print">
        <label>Report<select id="rKind">
          <option value="css">Client Satisfaction Survey (CSS) report</option>
          <option value="office">Office-level summary</option>
          <option value="compare">Period-to-period comparison</option></select></label>
        <label>${sel.kind === 'compare' ? 'Current period' : 'Period'}<select id="rPeriod">${sel.kind === 'compare' ? '' : '<option value="">All periods</option>'}${periods.map(p => `<option value="${p}">${periodLabel(p)}</option>`).join('')}</select></label>
        ${sel.kind === 'compare' ? `<label>Compare with<select id="rCompare">${periods.map(p => `<option value="${p}">${periodLabel(p)}</option>`).join('')}</select></label>` : ''}
        <label>Office<select id="rOffice">${sel.kind === 'office' ? '' : '<option value="">All offices (university-wide)</option>'}${offices.map(o => `<option>${esc(o)}</option>`).join('')}</select></label>
        <div class="btn-row" style="margin-left:auto"><button class="btn subtle" id="rCsv">Download CSV</button><button class="btn" id="rPrint">Print / Save as PDF</button></div>
      </div>
      <div id="doc" style="margin-top:16px"></div>`;

    const $ = id => el.querySelector('#' + id);
    $('rKind').value = sel.kind;
    if (sel.kind === 'office' && !sel.office) sel.office = offices[0];
    $('rPeriod').value = sel.period; $('rOffice').value = sel.office;
    if ($('rCompare')) $('rCompare').value = sel.compare;
    el.querySelectorAll('select').forEach(s => s.addEventListener('change', () => {
      const kindChanged = sel.kind !== $('rKind').value;
      sel.kind = $('rKind').value; sel.period = $('rPeriod').value; sel.office = $('rOffice').value;
      sel.compare = $('rCompare') ? $('rCompare').value : '';
      if (kindChanged) { sel.period = ''; sel.compare = ''; if (sel.kind !== 'office') sel.office = ''; }
      render(el);
    }));
    $('rPrint').onclick = () => window.print();
    $('rCsv').onclick = () => lastTable && downloadText(`css-${sel.kind}-${sel.period || 'all'}.csv`, toCSV(lastTable));

    const doc = $('doc');
    if (sel.kind === 'compare') doc.innerHTML = compareReport(all, pt);
    else doc.innerHTML = cssReport(all, pt, sel.kind === 'office');
  }

  function header(title, sub) {
    return `<header><div class="logos"><img src="img/ome-logo.png" alt="OME"></div><div class="uni">MINDANAO STATE UNIVERSITY – GENERAL SANTOS</div><div class="small">Office of Monitoring and Evaluation</div>
      <h2>${title}</h2><div class="small muted">${sub}</div></header>`;
  }

  function sqdTable(s) {
    const head = ['Statement', 'SA (5)', 'A (4)', 'N (3)', 'D (2)', 'SD (1)', 'N/A', 'Responses', 'Mean', 'CSS %'];
    const body = SQD.map((q, i) => { const it = s.items[i]; return [`${q.code} – ${q.en}`, it.counts[5], it.counts[4], it.counts[3], it.counts[2], it.counts[1], it.counts[0], it.n, fmt.score(it.mean), fmt.pct(it.pct)]; });
    lastTable = [head].concat(body).concat([['Overall', '', '', '', '', '', '', '', fmt.score(s.mean), fmt.pct(s.css)]]);
    return `<div class="table-wrap"><table><thead><tr>${head.map((h, i) => `<th class="${i ? 'num' : ''}">${h}</th>`).join('')}</tr></thead><tbody>
      ${body.map(r => `<tr>${r.map((v, i) => `<td class="${i ? 'num' : ''}">${i ? v : esc(v)}</td>`).join('')}</tr>`).join('')}
      <tr class="total"><td>Overall</td><td colspan="7"></td><td class="num">${fmt.score(s.mean)}</td><td class="num">${fmt.pct(s.css)}</td></tr></tbody></table></div>`;
  }

  function countTable(title, values) {
    const total = values.reduce((a, v) => a + v[1], 0) || 1;
    return `<table><thead><tr><th>${title}</th><th class="num">Count</th><th class="num">%</th></tr></thead><tbody>
      ${values.map(([k, n]) => `<tr><td>${esc(k)}</td><td class="num">${n}</td><td class="num">${(n / total * 100).toFixed(1)}%</td></tr>`).join('')}
      <tr class="total"><td>Total</td><td class="num">${total}</td><td class="num">100%</td></tr></tbody></table>`;
  }

  function tally(rows, fn) {
    return [...groupBy(rows, fn)].sort((a, b) => b[1].length - a[1].length).map(([k, v]) => [k || 'Not specified', v.length]);
  }

  function findingsFor(office, period) {
    return Store.findings().filter(f => (!f.office || !office || f.office === office) && (!f.period || !period || f.period === period));
  }

  function cssReport(all, pt, officeLevel) {
    const rows = filterRows(all, { period: sel.period, office: sel.office });
    const s = summarize(rows);
    const b = band(s.css);
    const scope = sel.office || 'All offices (university-wide)';
    const title = officeLevel ? 'Office-Level Client Satisfaction Summary' : 'Client Satisfaction Survey (CSS) Report';
    if (!rows.length) return `<div class="report-doc">${header(title, esc(scope))}<p class="muted">No responses for this selection.</p></div>`;
    const dates = rows.map(r => r.date).sort();
    const ccList = (k, list) => list.map((label, i) => [label, rows.filter(r => r[k] === i).length]);
    const cm = commentsWithThemes(rows);
    const themes = THEMES.map(t => [t.label, cm.filter(c => c.themes.includes(t.id)).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
    const breakdown = officeLevel
      ? [...groupBy(rows, r => r.unit || '(Office-level / not specified)')]
      : [...groupBy(rows, r => r.office)];
    const bdRows = breakdown.map(([k, rs]) => ({ k, n: rs.length, ...summarize(rs) })).sort((a, b) => b.n - a.n);
    const sorted = SQD.map((q, i) => ({ q, ...s.items[i] })).filter(d => d.n).sort((a, b) => b.pct - a.pct);
    const findings = findingsFor(sel.office, sel.period);

    return `<div class="report-doc">
      ${header(title, `${esc(scope)} · ${sel.period ? periodLabel(sel.period) : `${dates[0]} to ${dates[dates.length - 1]}`}`)}
      <h3>I. Summary</h3>
      <p>A total of <b>${fmt.num(s.n)}</b> clients answered the survey${sel.period ? ` in ${periodLabel(sel.period)}` : ''}. The overall CSS score is <b>${fmt.pct(s.css)}</b>
        (average rating ${fmt.score(s.mean)} out of 5), rated <b>${b.label}</b>. ${fmt.pct(s.satisfiedPct)} of clients said they were satisfied with the service they availed (SQD0).</p>
      <p>Strongest dimension: <b>${esc(sorted[0].q.short)}</b> (${fmt.pct(sorted[0].pct)}). Weakest dimension: <b>${esc(sorted[sorted.length - 1].q.short)}</b> (${fmt.pct(sorted[sorted.length - 1].pct)}).</p>

      <h3>II. Respondent profile</h3>
      <div class="grid g2 keep">${countTable('Client type', tally(rows, r => r.type))}${countTable('Gender', tally(rows, r => r.gender))}</div>

      <h3>III. Citizen's Charter results</h3>
      ${countTable('CC1 – Awareness', ccList('cc1', Store.lists.cc1))}
      <div class="grid g2 keep" style="margin-top:10px">${countTable('CC2 – Visibility', ccList('cc2', Store.lists.cc2))}${countTable('CC3 – Helpfulness', ccList('cc3', Store.lists.cc3))}</div>

      <h3>IV. Service quality dimensions</h3>
      <p class="small muted">CSS % is the share of Agree and Strongly Agree ratings among the responses that rated the item. N/A is excluded.</p>
      ${sqdTable(s)}

      <h3>V. Results by ${officeLevel ? (Store.unitKind(sel.office) === 'department' ? 'department' : 'office') : 'domain office'}</h3>
      <table><thead><tr><th>${officeLevel ? (Store.unitKind(sel.office) === 'department' ? 'Department' : 'Office') : 'Domain office'}</th><th class="num">Responses</th><th class="num">Mean</th><th class="num">CSS %</th><th>Rating</th></tr></thead><tbody>
      ${bdRows.map(r => `<tr><td>${esc(r.k)}</td><td class="num">${r.n}</td><td class="num">${fmt.score(r.mean)}</td><td class="num">${fmt.pct(r.css)}</td><td>${band(r.css).label}</td></tr>`).join('')}</tbody></table>

      <h3>VI. Client comments</h3>
      <p>${fmt.num(cm.length)} clients left a substantive comment. Main themes:</p>
      ${themes.length ? `<table><thead><tr><th>Theme</th><th class="num">Comments</th></tr></thead><tbody>${themes.map(t => `<tr><td>${esc(t[0])}</td><td class="num">${t[1]}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">No comments.</p>'}
      ${cm.filter(c => c.negative).slice(0, 5).map(c => `<div class="quote">${esc(c.r.comment)}<div class="meta">${esc(c.r.unit || c.r.office)}</div></div>`).join('')}

      <h3>VII. Findings and action plan</h3>
      ${findings.length ? findings.map(f => `<div style="margin-bottom:12px"><b>${esc(f.title)}</b> <span class="small muted">${esc(f.office || 'All offices')} · ${f.period ? periodLabel(f.period) : 'All periods'}</span>
        <p style="white-space:pre-wrap;margin:4px 0">${esc(f.findings)}</p>${f.actions ? `<p style="white-space:pre-wrap;margin:4px 0"><b>Action plan:</b> ${esc(f.actions)}</p>` : ''}${f.fileName ? `<p class="small">Attachment: ${f.fileData ? `<a href="${f.fileData}" download="${esc(f.fileName)}">${esc(f.fileName)}</a>` : esc(f.fileName)}</p>` : ''}</div>`).join('')
        : '<p class="muted">No summarized findings uploaded for this office and period yet. Authorized personnel can add them under Admin → Findings.</p>'}

      <div class="sign"><div>Prepared by<br><span class="muted small">Office of Monitoring and Evaluation</span></div><div>Noted by<br><span class="muted small">&nbsp;</span></div></div>
      <p class="small muted" style="margin-top:24px">Generated ${new Date().toLocaleString()} · Source: ${esc(Store.importMeta().source)}</p>
    </div>`;
  }

  function compareReport(all, pt) {
    const a = filterRows(all, { period: sel.compare, office: sel.office });
    const b = filterRows(all, { period: sel.period, office: sel.office });
    const sa = summarize(a), sb = summarize(b);
    const scope = sel.office || 'All offices (university-wide)';
    const head = ['Measure', periodLabel(sel.compare), periodLabel(sel.period), 'Change (pts)'];
    const lines = [['Responses', sa.n, sb.n, ''], ['Overall CSS score', sa.css, sb.css, 'd'], ['Satisfied clients (SQD0)', sa.satisfiedPct, sb.satisfiedPct, 'd']]
      .concat(SQD.map((q, i) => [`${q.code} ${q.short}`, sa.items[i].pct, sb.items[i].pct, 'd']));
    lastTable = [head].concat(lines.map(l => [l[0], l[1] == null ? '' : (+l[1]).toFixed(1), l[2] == null ? '' : (+l[2]).toFixed(1), l[3] && l[1] != null && l[2] != null ? (l[2] - l[1]).toFixed(1) : '']));
    const offices = [...new Set(a.concat(b).map(r => r.office))].sort().map(o => {
      const x = summarize(a.filter(r => r.office === o)), y = summarize(b.filter(r => r.office === o));
      return { o, x, y };
    });
    return `<div class="report-doc">
      ${header('Period-to-Period Comparison', `${esc(scope)} · ${periodLabel(sel.compare)} vs ${periodLabel(sel.period)}`)}
      <h3>I. Key measures</h3>
      <table><thead><tr>${head.map((h, i) => `<th class="${i ? 'num' : ''}">${h}</th>`).join('')}</tr></thead><tbody>
      ${lines.map(l => `<tr><td>${esc(l[0])}</td><td class="num">${l[3] ? fmt.pct(l[1]) : fmt.num(l[1])}</td><td class="num">${l[3] ? fmt.pct(l[2]) : fmt.num(l[2])}</td><td class="num">${l[3] && l[1] != null && l[2] != null ? O.delta(l[2] - l[1]) : '–'}</td></tr>`).join('')}</tbody></table>
      ${(sa.n < 30 || sb.n < 30) ? '<p class="small muted">One of the periods has fewer than 30 responses, so changes may not be meaningful.</p>' : ''}
      ${sel.office ? '' : `<h3>II. Offices</h3><table><thead><tr><th>Office</th><th class="num">n (${periodLabel(sel.compare)})</th><th class="num">CSS %</th><th class="num">n (${periodLabel(sel.period)})</th><th class="num">CSS %</th><th class="num">Change</th></tr></thead><tbody>
      ${offices.map(r => `<tr><td>${esc(r.o)}</td><td class="num">${r.x.n}</td><td class="num">${fmt.pct(r.x.css)}</td><td class="num">${r.y.n}</td><td class="num">${fmt.pct(r.y.css)}</td><td class="num">${r.x.css != null && r.y.css != null ? O.delta(r.y.css - r.x.css) : '–'}</td></tr>`).join('')}</tbody></table>`}
      <p class="small muted" style="margin-top:24px">Generated ${new Date().toLocaleString()}</p>
    </div>`;
  }

  O.views = O.views || {};
  O.views.reports = render;
})();
