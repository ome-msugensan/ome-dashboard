/* Dashboard (KPIs + survey results) and Service Quality Analysis views. */
(function () {
  'use strict';
  const O = window.OME;
  const { Store, SQD, THEMES, summarize, band, groupBy, filterRows, periodsOf, periodKey, periodLabel, commentsWithThemes, fmt, esc } = O;

  const C = { maroon: '#7a1d2c', gold: '#c8992b', grey: '#9aa3ad', good: '#1f7a4d', bad: '#b3261e', light: '#e9d3d7' };
  const charts = [];
  function chart(canvas, cfg) {
    if (!window.Chart) { canvas.parentElement.innerHTML = '<p class="muted small">Charts need an internet connection (Chart.js loads from a CDN).</p>'; return; }
    Chart.defaults.font.family = getComputedStyle(document.documentElement).fontFamily;
    Chart.defaults.color = '#5d6670';
    charts.push(new Chart(canvas, cfg));
  }
  O.clearCharts = () => { while (charts.length) charts.pop().destroy(); };

  // Shared filter state across Dashboard / Quality views.
  const filters = { period: '', office: '', type: '' };

  function filterBar(rows, onChange, extra) {
    const pt = Store.settings.periodType;
    const periods = periodsOf(rows, pt);
    const offices = [...new Set(rows.map(r => r.office))].sort();
    const types = [...new Set(rows.map(r => r.type))].sort();
    const wrap = document.createElement('div');
    wrap.className = 'card filters no-print';
    wrap.innerHTML = `
      <label>Reporting period<select data-f="period"><option value="">All periods</option>${periods.map(p => `<option value="${p}">${periodLabel(p)}</option>`).join('')}</select></label>
      <label>Office<select data-f="office"><option value="">All offices</option>${offices.map(o => `<option>${esc(o)}</option>`).join('')}</select></label>
      <label>Client type<select data-f="type"><option value="">All client types</option>${types.map(o => `<option>${esc(o)}</option>`).join('')}</select></label>
      <span class="muted small" style="margin-left:auto">${extra || ''}</span>`;
    wrap.querySelectorAll('select').forEach(s => {
      s.value = filters[s.dataset.f] || '';
      if (s.value !== filters[s.dataset.f]) filters[s.dataset.f] = '';
      s.addEventListener('change', () => { filters[s.dataset.f] = s.value; onChange(); });
    });
    return wrap;
  }

  const kpi = (label, value, foot) => `<div class="card kpi"><div class="label">${label}</div><div class="value">${value}</div><div class="foot">${foot || ''}</div></div>`;

  function responseRate(rows) {
    const served = Store.clientsServed(), pt = Store.settings.periodType;
    const keys = Object.keys(served);
    if (!keys.length) return null;
    let served_n = 0, resp = 0;
    for (const k of keys) {
      const [office, period] = k.split('||');
      if ((filters.office && office !== filters.office) || (filters.period && period !== filters.period)) continue;
      served_n += served[k];
      resp += rows.filter(r => r.office === office && periodKey(r.date, pt) === period).length;
    }
    return served_n ? { pct: resp / served_n * 100, resp, served: served_n } : null;
  }

  /* ------------------------------ Dashboard ------------------------------ */
  function dashboard(el) {
    const all = Store.all();
    el.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'section-head';
    head.innerHTML = `<div><h2>Client Satisfaction Dashboard</h2><p class="muted">How clients rate MSU-GenSan offices across the 11 service quality dimensions (SQD0–SQD10).</p></div>`;
    el.append(head, filterBar(all, () => dashboard(el), `${fmt.num(all.length)} responses on record`));
    const body = document.createElement('div');
    body.className = 'stack';
    el.append(body);

    const rows = filterRows(all, filters);
    const s = summarize(rows);
    const rr = responseRate(all);
    const b = band(s.css);
    const officeStats = [...groupBy(rows, r => r.office)].map(([o, rs]) => ({ o, n: rs.length, ...summarize(rs) })).sort((a, b) => b.css - a.css);

    body.insertAdjacentHTML('beforeend', `<div class="grid kpis">
      ${kpi('Overall satisfaction rating', `${fmt.pct(s.css)}`, `<span class="pill ${b.cls}">${b.label}</span> &nbsp;avg ${fmt.score(s.mean)} / 5`)}
      ${kpi('Satisfied clients', fmt.pct(s.satisfiedPct), 'Agree or strongly agree with SQD0')}
      ${kpi('Respondents', fmt.num(s.n), filters.period ? periodLabel(filters.period) : 'All periods')}
      ${kpi('Response rate', rr ? fmt.pct(rr.pct) : '<small>Not tracked</small>', rr ? `${fmt.num(rr.resp)} of ${fmt.num(rr.served)} clients served` : 'Enter clients served in Admin')}
      ${kpi('Offices evaluated', fmt.num(officeStats.length), `Target: ${Store.settings.target}% satisfied`)}
    </div>`);

    if (!rows.length) { body.insertAdjacentHTML('beforeend', '<div class="card muted">No responses match these filters.</div>'); return; }

    body.insertAdjacentHTML('beforeend', `
      <div class="grid g2">
        <div class="card"><h3>Overall satisfaction trend</h3><p class="small muted">CSS score (bars: number of responses) by ${Store.settings.periodType}.</p><div class="chart-box"><canvas id="cTrend"></canvas></div></div>
        <div class="card"><h3>Ratings by service dimension</h3><p class="small muted">Share of Agree / Strongly Agree for each statement.</p><div class="chart-box"><canvas id="cDims"></canvas></div></div>
      </div>
      <div class="card"><div class="section-head"><div><h3>Satisfaction by office or service unit</h3><p class="small muted">Click an office to see its units. Offices with fewer than ${Store.settings.minResponses} responses are shown in grey.</p></div></div>
        <div class="table-wrap"><table id="officeTable"><thead><tr><th>Office</th><th class="num">Responses</th><th class="num">Avg (1–5)</th><th style="width:22%">CSS score</th><th class="num">%</th><th>Rating</th></tr></thead><tbody></tbody></table></div>
      </div>
      <div class="card"><div class="section-head"><div><h3>Comparison across reporting periods</h3><p class="small muted">Each dimension's CSS score per period.</p></div></div><div class="table-wrap" id="periodCompare"></div></div>`);

    // Trend
    const pt = Store.settings.periodType;
    const trend = [...groupBy(filterRows(all, Object.assign({}, filters, { period: '' })), r => periodKey(r.date, pt))].sort((a, b) => a[0] < b[0] ? -1 : 1);
    chart(body.querySelector('#cTrend'), {
      data: {
        labels: trend.map(t => periodLabel(t[0])),
        datasets: [
          { type: 'line', label: 'CSS score (%)', data: trend.map(t => +summarize(t[1]).css.toFixed(1)), borderColor: C.maroon, backgroundColor: C.maroon, yAxisID: 'y', tension: .25, pointRadius: 4 },
          { type: 'bar', label: 'Responses', data: trend.map(t => t[1].length), backgroundColor: C.light, yAxisID: 'y1' }
        ]
      },
      options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        scales: { y: { min: 0, max: 100, title: { display: true, text: 'CSS %' } }, y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Responses' } } },
        plugins: { legend: { position: 'bottom' } } }
    });

    // Dimensions
    chart(body.querySelector('#cDims'), {
      type: 'bar',
      data: { labels: SQD.map(q => q.code + ' ' + q.short), datasets: [{ label: '% satisfied', data: s.items.map(i => i.pct == null ? null : +i.pct.toFixed(1)), backgroundColor: s.items.map(i => i.pct >= Store.settings.target ? C.maroon : C.gold), borderRadius: 4 }] },
      options: { indexAxis: 'y', maintainAspectRatio: false, scales: { x: { min: 0, max: 100 } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.raw}% satisfied · avg ${fmt.score(s.items[c.dataIndex].mean)}` } } } }
    });

    // Office table with expandable units
    const tb = body.querySelector('#officeTable tbody');
    const row = (name, st, indent, low) => {
      const bd = band(st.css);
      return `<tr style="${low ? 'color:#9aa3ad' : ''}"><td style="padding-left:${10 + indent * 22}px">${name}</td><td class="num">${fmt.num(st.n)}</td><td class="num">${fmt.score(st.mean)}</td>
        <td><div class="bar"><span style="width:${st.css || 0}%;background:${low ? C.grey : st.css >= Store.settings.target ? C.maroon : C.gold}"></span></div></td>
        <td class="num">${fmt.pct(st.css)}</td><td><span class="pill ${low ? 'neutral' : bd.cls}">${bd.label}</span></td></tr>`;
    };
    tb.innerHTML = officeStats.map((st, i) => row(`<a href="#" data-i="${i}">${esc(st.o)}</a>`, st, 0, st.n < Store.settings.minResponses)).join('');
    tb.addEventListener('click', e => {
      const a = e.target.closest('a[data-i]'); if (!a) return;
      e.preventDefault();
      const tr = a.closest('tr');
      if (tr.nextElementSibling && tr.nextElementSibling.classList.contains('sub')) {
        while (tr.nextElementSibling && tr.nextElementSibling.classList.contains('sub')) tr.nextElementSibling.remove();
        return;
      }
      const st = officeStats[+a.dataset.i];
      const units = [...groupBy(rows.filter(r => r.office === st.o), r => r.unit || '(Office-level / not specified)')].map(([u, rs]) => ({ u, n: rs.length, ...summarize(rs) })).sort((a, b) => b.n - a.n);
      const tmp = document.createElement('tbody');
      tmp.innerHTML = units.map(u => row(esc(u.u), u, 1, u.n < Store.settings.minResponses)).join('');
      [...tmp.children].reverse().forEach(r => { r.classList.add('sub'); tr.after(r); });
    });

    // Period comparison
    const pc = body.querySelector('#periodCompare');
    const byP = [...groupBy(filterRows(all, Object.assign({}, filters, { period: '' })), r => periodKey(r.date, pt))].sort((a, b) => a[0] < b[0] ? -1 : 1).map(([p, rs]) => ({ p, ...summarize(rs) }));
    const recent = byP.slice(-6);
    pc.innerHTML = `<table><thead><tr><th>Dimension</th>${recent.map(p => `<th class="num">${periodLabel(p.p)}<br><span style="font-weight:400;text-transform:none">n=${p.n}</span></th>`).join('')}<th class="num">Change</th></tr></thead><tbody>
      ${SQD.map((q, i) => {
        const vals = recent.map(p => p.items[i].pct);
        const d = vals.length > 1 && vals[vals.length - 1] != null && vals[vals.length - 2] != null ? vals[vals.length - 1] - vals[vals.length - 2] : null;
        return `<tr><td>${q.code} ${esc(q.short)}</td>${vals.map(v => `<td class="num">${fmt.pct(v)}</td>`).join('')}<td class="num">${delta(d)}</td></tr>`;
      }).join('')}
      <tr class="total"><td>Overall CSS score</td>${recent.map(p => `<td class="num">${fmt.pct(p.css)}</td>`).join('')}<td class="num">${delta(recent.length > 1 ? recent[recent.length - 1].css - recent[recent.length - 2].css : null)}</td></tr>
      </tbody></table>
      ${byP.length > 6 ? `<p class="small muted">Showing the latest 6 of ${byP.length} periods. Change compares the last two periods shown.</p>` : '<p class="small muted">Change compares the last two periods shown. Note that periods with few responses swing widely.</p>'}`;
  }

  function delta(d) {
    if (d == null || isNaN(d)) return '–';
    const cls = d > 0.05 ? 'delta-up' : d < -0.05 ? 'delta-down' : 'muted';
    return `<span class="${cls}">${d > 0 ? '▲' : d < 0 ? '▼' : ''} ${Math.abs(d).toFixed(1)} pts</span>`;
  }
  O.delta = delta;

  /* ------------------------- Service Quality Analysis ------------------------- */
  let activeTheme = '';
  function quality(el) {
    const all = Store.all();
    el.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'section-head';
    head.innerHTML = `<div><h2>Service Quality Analysis</h2><p class="muted">Where clients are most and least satisfied, and what they say in their comments.</p></div>`;
    el.append(head, filterBar(all, () => quality(el)));
    const body = document.createElement('div');
    body.className = 'stack';
    el.append(body);

    const rows = filterRows(all, filters);
    if (!rows.length) { body.innerHTML = '<div class="card muted">No responses match these filters.</div>'; return; }
    const st = Store.settings;
    const s = summarize(rows);
    const dims = SQD.map((q, i) => ({ q, ...s.items[i] })).filter(d => d.n);
    const sortedDims = [...dims].sort((a, b) => b.pct - a.pct);
    const offices = [...groupBy(rows, r => filters.office ? (r.unit || '(Office-level)') : r.office)]
      .map(([o, rs]) => ({ o, n: rs.length, ...summarize(rs) })).filter(o => o.n >= st.minResponses).sort((a, b) => b.css - a.css);
    const unitWord = filters.office ? 'units' : 'offices';

    const li = (name, pct, n) => `<li><span>${name}${n != null ? ` <span class="muted small">(${n})</span>` : ''}</span><div class="bar"><span style="width:${pct}%;background:${pct >= st.target ? C.maroon : C.gold}"></span></div><b class="num" style="text-align:right">${fmt.pct(pct)}</b></li>`;
    const low = offices.filter(o => o.css < st.target).sort((a, b) => a.css - b.css);
    const lowDims = sortedDims.filter(d => d.pct < st.target).reverse();

    body.insertAdjacentHTML('beforeend', `
      <div class="grid g2">
        <div class="card"><h3>Areas with high satisfaction</h3>
          <h4 class="muted">Top service dimensions</h4><ul class="rank-list">${sortedDims.slice(0, 4).map(d => li(`${d.q.code} ${esc(d.q.short)}`, d.pct)).join('')}</ul>
          <h4 class="muted" style="margin-top:14px">Top ${unitWord}</h4><ul class="rank-list">${offices.slice(0, 5).map(o => li(esc(o.o), o.css, o.n)).join('') || '<li class="muted">Not enough responses to rank.</li>'}</ul>
        </div>
        <div class="card"><h3>Areas needing improvement</h3><p class="small muted">Below the ${st.target}% satisfaction target.</p>
          <h4 class="muted">Dimensions</h4><ul class="rank-list">${lowDims.slice(0, 4).map(d => li(`${d.q.code} ${esc(d.q.short)}`, d.pct)).join('') || '<li class="muted">All dimensions meet the target.</li>'}</ul>
          <h4 class="muted" style="margin-top:14px">${unitWord[0].toUpperCase() + unitWord.slice(1)}</h4><ul class="rank-list">${low.slice(0, 5).map(o => li(esc(o.o), o.css, o.n)).join('') || `<li class="muted">All ranked ${unitWord} meet the target.</li>`}</ul>
        </div>
      </div>
      <div class="grid g2">
        <div class="card"><h3>Frequently identified concerns</h3><p class="small muted">Comment topics, counting only comments from clients whose average rating was below 3.5, plus the dimensions with the most Disagree / Strongly Disagree ratings.</p><div id="concerns"></div></div>
        <div class="card"><h3>Citizen's Charter awareness</h3><div class="chart-box"><canvas id="cCC"></canvas></div></div>
      </div>
      <div class="card"><h3>Client feedback themes</h3><p class="small muted">Comments are grouped by keyword (English and Filipino). A comment can belong to more than one theme. Click a theme to read the comments.</p><div id="themes"></div><div id="quotes"></div></div>`);

    // Concerns
    const cm = commentsWithThemes(rows);
    const neg = cm.filter(c => c.negative);
    const concernCounts = THEMES.filter(t => t.concern).map(t => ({ t, n: neg.filter(c => c.themes.includes(t.id)).length })).filter(x => x.n).sort((a, b) => b.n - a.n);
    const disagree = dims.map(d => ({ d, n: d.counts[1] + d.counts[2], pct: (d.counts[1] + d.counts[2]) / d.n * 100 })).sort((a, b) => b.pct - a.pct).slice(0, 3);
    body.querySelector('#concerns').innerHTML = `
      <table><thead><tr><th>Concern</th><th class="num">Mentions</th></tr></thead><tbody>
      ${concernCounts.map(x => `<tr><td>${esc(x.t.label)}</td><td class="num">${x.n}</td></tr>`).join('') || '<tr><td colspan="2" class="muted">No negative comments in this selection.</td></tr>'}
      </tbody></table>
      <h4 class="muted" style="margin-top:14px">Most disagreement</h4>
      <table><tbody>${disagree.map(x => `<tr><td>${x.d.q.code} ${esc(x.d.q.short)}</td><td class="num">${fmt.num(x.n)} clients</td><td class="num">${fmt.pct(x.pct)}</td></tr>`).join('')}</tbody></table>`;

    // CC chart
    const ccCount = (key, list) => list.map((_, i) => rows.filter(r => r[key] === i).length);
    const cc1 = ccCount('cc1', Store.lists.cc1);
    chart(body.querySelector('#cCC'), {
      type: 'bar',
      data: { labels: ['Knows CC, saw it', 'Knows CC, did not see it', 'Learned of CC here', 'Does not know CC'], datasets: [{ data: cc1, backgroundColor: [C.maroon, C.gold, '#b8707c', C.grey], borderRadius: 4 }] },
      options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.raw} (${(c.raw / rows.length * 100).toFixed(1)}%)` } } } }
    });

    // Themes
    const themeCounts = THEMES.map(t => ({ t, n: cm.filter(c => c.themes.includes(t.id)).length }));
    const other = cm.filter(c => !c.themes.length).length;
    const themeEl = body.querySelector('#themes');
    const drawThemes = () => {
      themeEl.innerHTML = `<p class="small"><b>${fmt.num(cm.length)}</b> substantive comments out of ${fmt.num(rows.length)} responses.</p>` +
        themeCounts.map(x => `<button class="theme-chip ${activeTheme === x.t.id ? 'active' : ''}" data-t="${x.t.id}">${esc(x.t.label)} <b>${x.n}</b></button>`).join('') +
        `<button class="theme-chip ${activeTheme === 'other' ? 'active' : ''}" data-t="other">Other <b>${other}</b></button>`;
      const list = activeTheme ? cm.filter(c => activeTheme === 'other' ? !c.themes.length : c.themes.includes(activeTheme)) : [];
      body.querySelector('#quotes').innerHTML = activeTheme ? list.slice(0, 40).map(c => `<div class="quote">${esc(c.r.comment)}<div class="meta">${esc(c.r.office)}${c.r.unit ? ' · ' + esc(c.r.unit) : ''} · ${c.r.date}${c.avg != null ? ` · avg rating ${c.avg.toFixed(1)}` : ''}</div></div>`).join('') + (list.length > 40 ? `<p class="small muted">Showing 40 of ${list.length}.</p>` : '') : '';
    };
    themeEl.addEventListener('click', e => {
      const b = e.target.closest('[data-t]'); if (!b) return;
      activeTheme = activeTheme === b.dataset.t ? '' : b.dataset.t; drawThemes();
    });
    drawThemes();
  }

  O.views = O.views || {};
  O.views.dashboard = dashboard;
  O.views.quality = quality;
  O.filters = filters;
})();
