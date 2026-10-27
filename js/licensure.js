/* Independent OME licensure dashboard, topnotchers, and administration. */
(function () {
  'use strict';
  const O = window.OME;
  const esc = O.esc;
  const state = { data: null, program: '', from: '', to: '', dateWarning: '', taker: 'First', metric: 'rate', topProgram: '', topPeriod: '', topYear: '', search: '', notice: '', noticeError: false };
  let loadToken = 0;
  let chart = null;
  const oldClear = O.clearCharts;
  O.clearCharts = () => { loadToken++; if (chart) { chart.destroy(); chart = null; } if (oldClear) oldClear(); };

  async function request(action, body) {
    const response = await fetch('licensure_api.php?action=' + encodeURIComponent(action), {
      method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }
  async function refresh() { state.data = await request('data'); return state.data; }
  function num(value) { return Number(value || 0); }
  function dateOf(period) {
    if (!period) return 0;
    const match = /(?:^|\s)((?:19|20)\d{2})$/.exec(period.exam_period_label);
    if (!match) return 0;
    const months = ['jan january', 'feb february', 'mar march', 'apr april', 'may', 'jun june',
      'jul july', 'aug august', 'sep sept september', 'oct october', 'nov november', 'dec december'];
    const words = period.exam_period_label.slice(0, match.index).toLowerCase().match(/[a-z]+/g) || [];
    const month = [...words].reverse().map(word => months.findIndex(names => names.split(' ').includes(word))).find(index => index >= 0);
    return month === undefined ? 0 : Date.UTC(Number(match[1]), month, 1);
  }
  function periodName(id) { return state.data.periods.find(p => num(p.period_id) === num(id))?.exam_period_label || ''; }
  function programName(id) { return state.data.programs.find(p => num(p.program_id) === num(id))?.program_name || ''; }
  function program(id) { return state.data.programs.find(p => num(p.program_id) === num(id)); }
  function period(id) { return state.data.periods.find(p => num(p.period_id) === num(id)); }
  function results(id) { return state.data.results.filter(r => num(r.period_id) === num(id)); }
  function topnotchers(id) { return state.data.topnotchers.filter(t => num(t.period_id) === num(id)); }
  function result(id, group, taker) { return results(id).find(r => r.group_type === group && r.taker_type === taker); }
  function rate(row) { return row ? num(row.rate).toFixed(2) + '%' : '—'; }
  function options(items, value, label, selected, allLabel) {
    return (allLabel === undefined ? '' : `<option value="">${esc(allLabel)}</option>`) + items.map(item =>
      `<option value="${esc(value(item))}" ${String(value(item)) === String(selected) ? 'selected' : ''}>${esc(label(item))}</option>`).join('');
  }
  function head(title, subtitle, action = '') {
    return `<div class="section-head lic-page-head"><div><span class="lic-head-eyebrow">Office of Monitoring and Evaluation · Licensure</span><h2>${title}</h2><p class="muted">${subtitle}</p></div>${action ? `<div class="lic-head-action">${action}</div>` : ''}</div>`;
  }
  function setNotice(message, isError = false) { state.notice = message; state.noticeError = isError; }
  function feedback() { return state.notice ? `<p class="lic-feedback${state.noticeError ? ' is-error' : ''}" role="${state.noticeError ? 'alert' : 'status'}">${esc(state.notice)}</p>` : ''; }
  function renderAndFocus(root, render, selector) {
    setNotice('');
    render(root);
    root.querySelector(selector)?.focus({ preventScroll: true });
  }
  function table(headers, rows, empty, caption) {
    return `<div class="lic-table-wrap" role="region" aria-label="${esc(caption)}" tabindex="0"><p class="lic-scroll-hint" aria-hidden="true">Scroll sideways to see all columns.</p><table class="lic-table"><caption class="sr-only">${esc(caption)}</caption><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}" class="lic-empty">${empty}</td></tr>`}</tbody></table></div>`;
  }
  function errorPage(root, error) {
    root.innerHTML = `${head('Licensure data unavailable', 'The survey remains available while this section is being set up.')}<div class="card"><p role="alert">${esc(error.message)}</p><p class="muted small">Install the licensure tables in the OME database, then import the four licensure tables from PAPs.</p><button class="btn" id="lic-retry">Try again</button></div>`;
    root.querySelector('#lic-retry').onclick = () => renderCurrent(root);
  }
  async function loadPage(root, render) {
    const token = ++loadToken;
    setNotice('');
    root.innerHTML = '<div class="card" role="status">Loading licensure data…</div>';
    try {
      await refresh();
      if (token !== loadToken || root !== document.getElementById('view')) return;
      render(root);
    } catch (error) { if (token === loadToken) errorPage(root, error); }
  }
  function renderCurrent(root) {
    const route = location.hash.split('?')[0];
    if (route === '#/licensure-topnotchers') loadPage(root, renderTopnotchers);
    else if (route === '#/licensure-manage') loadPage(root, renderManage);
    else loadPage(root, renderDashboard);
  }
  function dashboardPeriods() {
    const active = state.data.programs.filter(p => p.status === 'Active');
    const selected = active.some(p => String(p.program_id) === state.program) ? state.program : String(active[0]?.program_id || '');
    state.program = selected;
    return state.data.periods.filter(p => String(p.program_id) === selected &&
      (!state.from || dateOf(p) >= new Date(state.from + '-01').getTime()) &&
      (!state.to || dateOf(p) <= new Date(state.to + '-01').getTime())).sort((a, b) => dateOf(a) - dateOf(b));
  }
  function renderDashboard(root) {
    const periods = dashboardPeriods();
    const current = program(state.program);
    root.innerHTML = `${head('Licensure Performance Dashboard', 'Compare MSU-GSC and national examination results across reporting periods.', state.data.authenticated ? '<a class="btn ghost" href="#/licensure-manage">Manage data</a>' : '')}
      <section class="card lic-panel lic-comparison-panel" aria-label="Licensure filters"><div class="lic-filter-heading"><div><span class="lic-eyebrow">Explore results</span><h3>Choose your comparison</h3><p class="muted small">Select a program, reporting period, and taker group. The chart and records update together.</p></div></div><div class="lic-filters lic-dashboard-filters">
        <label>Program<select id="lic-program">${options(state.data.programs.filter(p => p.status === 'Active'), p => p.program_id, p => p.program_name, state.program)}</select></label>
        <label>From month<input id="lic-from" type="month" value="${esc(state.from)}"></label>
        <label>To month<input id="lic-to" type="month" value="${esc(state.to)}"></label>
        <label>Taker type<select id="lic-taker"><option value="First" ${state.taker === 'First' ? 'selected' : ''}>First-time</option><option value="Overall" ${state.taker === 'Overall' ? 'selected' : ''}>Overall</option></select></label>
        <div class="lic-filter-actions"><button class="btn subtle" id="lic-clear" type="button">Clear dates</button>
        <button class="btn ghost" id="lic-export" type="button">Export data</button></div>
      </div><p class="lic-filter-error" id="lic-date-error" role="status" ${state.dateWarning ? '' : 'hidden'}>${esc(state.dateWarning)}</p></section>
      <section class="card lic-panel"><div class="lic-panel-head"><div><h3>Performance trend</h3><p class="muted small">${esc(current?.exam_title || 'Select a program')} · oldest to latest</p></div><label>View by <select id="lic-metric"><option value="rate" ${state.metric === 'rate' ? 'selected' : ''}>Passing rate (%)</option><option value="passers" ${state.metric === 'passers' ? 'selected' : ''}>Passers</option><option value="takers" ${state.metric === 'takers' ? 'selected' : ''}>Takers</option></select></label></div>
        ${periods.length ? '<div class="lic-chart"><canvas id="lic-chart" role="img" aria-label="MSU and national performance by exam period"></canvas></div>' : '<p class="lic-empty">No exam periods match these filters.</p>'}
      </section>
      <section class="card lic-panel lic-detail-panel"><div class="lic-panel-head"><div><span class="lic-eyebrow">Examination records</span><h3>Detailed examination results</h3><p class="muted small">${esc(current?.program_name || 'Select a program')} · First-time and overall passing rates</p></div><span class="lic-count-pill">${periods.length} period${periods.length === 1 ? '' : 's'}</span></div>
        ${table(['Exam period', 'MSU first-time', 'MSU overall', 'National first-time', 'National overall'], [...periods].reverse().map(p => `<tr><th scope="row">${esc(p.exam_period_label)}</th><td class="lic-rate">${rate(result(p.period_id, 'MSU', 'First'))}</td><td class="lic-rate">${rate(result(p.period_id, 'MSU', 'Overall'))}</td><td class="lic-rate">${rate(result(p.period_id, 'National', 'First'))}</td><td class="lic-rate">${rate(result(p.period_id, 'National', 'Overall'))}</td></tr>`).join(''), 'No exam periods match these filters.', 'Detailed examination results')}
      </section>`;
    root.querySelector('#lic-program').onchange = event => { state.program = event.target.value; renderAndFocus(root, renderDashboard, '#lic-program'); };
    root.querySelector('#lic-from').onchange = event => { state.from = event.target.value; state.dateWarning = ''; if (state.from && state.to && state.from > state.to) { state.to = ''; state.dateWarning = 'The end month was cleared because it was before the start month.'; } renderAndFocus(root, renderDashboard, '#lic-from'); };
    root.querySelector('#lic-to').onchange = event => { state.to = event.target.value; state.dateWarning = ''; if (state.from && state.to && state.to < state.from) { state.from = ''; state.dateWarning = 'The start month was cleared because it was after the end month.'; } renderAndFocus(root, renderDashboard, '#lic-to'); };
    root.querySelector('#lic-taker').onchange = event => { state.taker = event.target.value; renderAndFocus(root, renderDashboard, '#lic-taker'); };
    root.querySelector('#lic-metric').onchange = event => { state.metric = event.target.value; renderAndFocus(root, renderDashboard, '#lic-metric'); };
    root.querySelector('#lic-clear').onclick = () => { state.from = ''; state.to = ''; state.dateWarning = ''; renderAndFocus(root, renderDashboard, '#lic-clear'); };
    root.querySelector('#lic-export').onclick = () => exportDashboard(periods, current);
    drawChart(root, periods);
  }
  function drawChart(root, periods) {
    if (chart) { chart.destroy(); chart = null; }
    const canvas = root.querySelector('#lic-chart');
    if (!canvas) return;
    if (!window.Chart) {
      const fallback = document.createElement('p');
      fallback.className = 'lic-chart-fallback';
      fallback.textContent = 'The chart needs an internet connection. The detailed results remain available below.';
      canvas.parentElement.replaceWith(fallback);
      return;
    }
    const values = group => periods.map(p => {
      const row = result(p.period_id, group, state.taker);
      return row ? num(row[state.metric]) : null;
    });
    chart = new Chart(canvas, { type: 'line', data: { labels: periods.map(p => p.exam_period_label), datasets: [
      { label: 'MSU-GSC', data: values('MSU'), borderColor: '#720455', backgroundColor: '#720455', tension: .25, pointRadius: 4 },
      { label: 'National', data: values('National'), borderColor: '#9a6400', backgroundColor: '#ffab00', borderDash: [6, 4], pointBorderColor: '#9a6400', pointBackgroundColor: '#ffab00', tension: .25, pointRadius: 4 }
    ] }, options: { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' }, plugins: { tooltip: { callbacks: { label: context => `${context.dataset.label}: ${context.parsed.y}${state.metric === 'rate' ? '%' : ''}` } } }, scales: { y: { beginAtZero: true, max: state.metric === 'rate' ? 100 : undefined } } } });
  }
  function exportDashboard(periods, current) {
    const safe = value => /^[=+\-@]/.test(String(value)) ? "'" + value : value;
    const rows = [['Record type', 'Program', 'Examination', 'Exam period', 'Group', 'Taker type', 'Passers', 'Takers', 'Rate (%)', 'Rank', 'Topnotcher', 'Rating (%)']];
    for (const p of periods) {
      for (const r of results(p.period_id)) rows.push(['Result', safe(current?.program_name || ''), safe(current?.exam_title || ''), p.exam_period_label, r.group_type, r.taker_type, r.passers, r.takers, r.rate, '', '', '']);
      for (const t of topnotchers(p.period_id)) rows.push(['Topnotcher', safe(current?.program_name || ''), safe(current?.exam_title || ''), p.exam_period_label, '', '', '', '', '', t.rank_position, safe(t.full_name), t.rating ?? '']);
    }
    O.downloadText(`ome-licensure-${current?.program_key || 'data'}.csv`, '\ufeff' + O.toCSV(rows), 'text/csv;charset=utf-8');
  }

  function topFiltered() {
    let periods = state.data.periods;
    if (state.topProgram) periods = periods.filter(p => String(p.program_id) === state.topProgram);
    if (state.topYear) periods = periods.filter(p => p.exam_period_label.endsWith(state.topYear));
    if (state.topPeriod) periods = periods.filter(p => String(p.period_id) === state.topPeriod);
    const ids = new Set(periods.map(p => String(p.period_id)));
    return state.data.topnotchers.filter(t => ids.has(String(t.period_id))).sort((a, b) => dateOf(period(b.period_id)) - dateOf(period(a.period_id)) || num(a.rank_position) - num(b.rank_position) || a.full_name.localeCompare(b.full_name));
  }
  function renderTopnotchers(root) {
    const years = [...new Set(state.data.periods.map(p => p.exam_period_label.slice(-4)))].filter(y => /^\d{4}$/.test(y)).sort().reverse();
    const periodChoices = state.data.periods.filter(p => (!state.topProgram || String(p.program_id) === state.topProgram) && (!state.topYear || p.exam_period_label.endsWith(state.topYear))).sort((a, b) => dateOf(b) - dateOf(a));
    if (state.topPeriod && !periodChoices.some(p => String(p.period_id) === state.topPeriod)) state.topPeriod = '';
    const top = topFiltered();
    root.innerHTML = `${head('Topnotchers', 'Recognizing outstanding licensure examination results.')}${feedback()}
      <section class="card lic-panel"><div class="lic-filter-heading"><div><span class="lic-eyebrow">Explore records</span><h3>Find a topnotcher</h3></div><p class="muted small">Narrow the list by program, year, or exam date.</p></div><div class="lic-filters lic-top-filters">
        <label>Program<select id="lic-top-program">${options(state.data.programs, p => p.program_id, p => p.program_name, state.topProgram, 'All programs')}</select></label>
        <label>Exam year<select id="lic-top-year">${options(years, y => y, y => y, state.topYear, 'All years')}</select></label>
        <label>Exam date<select id="lic-top-period">${options(periodChoices, p => p.period_id, p => `${p.exam_period_label} · ${programName(p.program_id)}`, state.topPeriod, 'All exam dates')}</select></label>
        <div class="lic-filter-actions"><button class="btn subtle" id="lic-top-clear" type="button">Clear filters</button>
        ${state.data.authenticated ? '<button class="btn" id="lic-top-add" type="button">Add topnotcher</button>' : ''}</div>
      </div></section><section class="card lic-panel lic-top-results" aria-labelledby="lic-top-list-title"><div class="lic-results-head"><div><span class="lic-eyebrow">Results</span><h3 id="lic-top-list-title">Topnotcher records</h3></div><p class="lic-count" role="status">${top.length} topnotcher${top.length === 1 ? '' : 's'} found</p></div>
      ${table(['Exam period', 'Program / examination', 'Rank', 'Full name', 'Rating', ...(state.data.authenticated ? ['Actions'] : [])], top.map(t => {
        const p = period(t.period_id), course = program(p?.program_id);
        return `<tr><td class="lic-period-cell">${esc(p?.exam_period_label || '')}</td><td><strong>${esc(course?.program_name || '')}</strong><span class="lic-sub">${esc(course?.exam_title || '')}</span></td><td><span class="lic-rank-badge">#${num(t.rank_position)}</span></td><th scope="row">${esc(t.full_name)}</th><td class="lic-rate">${t.rating === null ? '<span class="lic-unrecorded">Not recorded</span>' : num(t.rating).toFixed(2) + '%'}</td>${state.data.authenticated ? `<td class="lic-actions"><button class="btn ghost lic-top-edit" type="button" data-id="${num(t.topnotcher_id)}" aria-label="Edit ${esc(t.full_name)}">Edit</button><button class="btn danger lic-top-delete" type="button" data-id="${num(t.topnotcher_id)}" aria-label="Delete ${esc(t.full_name)}">Delete</button></td>` : ''}</tr>`;
      }).join(''), 'No topnotchers match these filters. Try another program or date.', 'Licensure examination topnotchers')}</section>`;
    root.querySelector('#lic-top-program').onchange = e => { state.topProgram = e.target.value; state.topPeriod = ''; renderAndFocus(root, renderTopnotchers, '#lic-top-program'); };
    root.querySelector('#lic-top-year').onchange = e => { state.topYear = e.target.value; state.topPeriod = ''; renderAndFocus(root, renderTopnotchers, '#lic-top-year'); };
    root.querySelector('#lic-top-period').onchange = e => { state.topPeriod = e.target.value; renderAndFocus(root, renderTopnotchers, '#lic-top-period'); };
    root.querySelector('#lic-top-clear').onclick = () => { state.topProgram = ''; state.topPeriod = ''; state.topYear = ''; renderAndFocus(root, renderTopnotchers, '#lic-top-clear'); };
    root.querySelector('#lic-top-add')?.addEventListener('click', () => topModal(root));
    root.querySelectorAll('.lic-top-edit').forEach(b => b.onclick = () => topModal(root, state.data.topnotchers.find(t => num(t.topnotcher_id) === num(b.dataset.id))));
    root.querySelectorAll('.lic-top-delete').forEach(b => b.onclick = () => deleteTop(root, num(b.dataset.id)));
  }
  let dialogSequence = 0;
  function openModal(title, content, onSubmit, settings = {}) {
    const dialog = document.createElement('dialog');
    dialog.className = 'lic-dialog';
    const titleId = `lic-dialog-title-${++dialogSequence}`;
    const previousFocus = document.activeElement;
    dialog.setAttribute('aria-labelledby', titleId);
    dialog.innerHTML = `<form method="dialog" class="lic-modal-form"><header><h2 id="${titleId}">${esc(title)}</h2><button type="button" class="lic-close" aria-label="Close dialog">×</button></header><div class="lic-modal-body">${content}<p class="lic-form-error" role="alert" tabindex="-1" hidden></p></div><footer><button type="button" class="btn subtle lic-cancel">Cancel</button><button type="submit" class="btn lic-save">${esc(settings.saveLabel || 'Save changes')}</button></footer></form>`;
    if (settings.destructive) dialog.classList.add('lic-confirm');
    document.body.append(dialog);
    const close = () => dialog.close();
    dialog.querySelector('.lic-close').onclick = close;
    dialog.querySelector('.lic-cancel').onclick = close;
    dialog.addEventListener('click', e => { if (e.target === dialog) close(); });
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (previousFocus?.isConnected) previousFocus.focus();
      else {
        const target = document.querySelector('#view .lic-feedback, #view .section-head h2');
        if (target) { target.tabIndex = -1; target.focus(); }
      }
    });
    dialog.querySelector('form').onsubmit = async e => {
      e.preventDefault();
      const error = dialog.querySelector('.lic-form-error');
      const button = dialog.querySelector('.lic-save');
      error.hidden = true; button.disabled = true;
      try { await onSubmit(dialog); close(); }
      catch (cause) { error.textContent = cause.message; error.hidden = false; error.focus(); }
      finally { button.disabled = false; }
    };
    dialog.showModal();
    (settings.destructive ? dialog.querySelector('.lic-cancel') : dialog.querySelector('[required]') || dialog.querySelector('.lic-close')).focus();
    return dialog;
  }
  function confirmDelete(message) {
    return new Promise(resolve => {
      let approved = false;
      const dialog = openModal('Confirm deletion', `<p>${esc(message)}</p><p class="muted small">This cannot be undone.</p>`, async () => { approved = true; }, { saveLabel: 'Delete', destructive: true });
      dialog.addEventListener('close', () => resolve(approved));
    });
  }
  function closeThen(dialog, next) {
    dialog.addEventListener('close', next, { once: true });
    dialog.close();
  }
  function topModal(root, item) {
    const currentPeriod = item?.period_id || state.topPeriod || state.data.periods.find(p => !state.topProgram || String(p.program_id) === state.topProgram)?.period_id || '';
    const dialog = openModal(item ? 'Edit topnotcher' : 'Add topnotcher', `<p class="muted small">Choose the examination, then enter the ranking details.</p><div class="lic-form-grid">
      <label>Program<select name="program_id" required>${options(state.data.programs, p => p.program_id, p => p.program_name, period(currentPeriod)?.program_id || state.topProgram)}</select></label>
      <label>Exam date<select name="period_id" required></select></label>
      <label>Rank<input type="number" name="rank_position" min="1" required value="${item ? num(item.rank_position) : ''}"></label>
      <label>Rating (%)<input type="number" name="rating" min="0" max="100" step="0.01" value="${item?.rating ?? ''}" placeholder="Optional"></label>
      <label class="lic-wide">Full name<input type="text" name="full_name" maxlength="255" required value="${esc(item?.full_name || '')}"></label>
    </div>`, async modal => {
      const form = modal.querySelector('form');
      await request('save-topnotcher', { topnotcher_id: item ? num(item.topnotcher_id) : 0, period_id: Number(form.elements.period_id.value), rank_position: Number(form.elements.rank_position.value), full_name: form.elements.full_name.value.trim(), rating: form.elements.rating.value === '' ? null : Number(form.elements.rating.value) });
      await refresh(); setNotice(item ? 'Topnotcher updated.' : 'Topnotcher added.'); renderTopnotchers(root);
    }, { saveLabel: item ? 'Save changes' : 'Add topnotcher' });
    const pSelect = dialog.querySelector('[name=program_id]'), dSelect = dialog.querySelector('[name=period_id]');
    function sync() {
      const choices = state.data.periods.filter(p => String(p.program_id) === pSelect.value).sort((a, b) => dateOf(b) - dateOf(a));
      dSelect.innerHTML = options(choices, p => p.period_id, p => p.exam_period_label, currentPeriod, 'Select exam date');
    }
    pSelect.onchange = () => { sync(); dSelect.value = ''; };
    sync();
  }
  async function deleteTop(root, id) {
    const item = state.data.topnotchers.find(t => num(t.topnotcher_id) === id);
    if (!item || !await confirmDelete(`Delete ${item.full_name} from ${periodName(item.period_id)}?`)) return;
    try { await request('delete-topnotcher', { topnotcher_id: id }); await refresh(); setNotice('Topnotcher deleted.'); renderTopnotchers(root); }
    catch (error) { setNotice(error.message, true); renderTopnotchers(root); }
  }

  function renderManage(root) {
    if (!state.data.authenticated) {
      root.innerHTML = `${head('Manage Licensure Data', 'OME administrators can add programs, exam periods, results, and topnotchers.')}<div class="card"><p>Sign in through OME Admin to edit licensure data.</p><a class="btn" href="#/admin">Go to Admin sign in</a></div>`;
      return;
    }
    const list = state.data.programs.filter(p => `${p.program_name} ${p.exam_title}`.toLowerCase().includes(state.search.toLowerCase()));
    const programCount = state.data.programs.length;
    const activeCount = state.data.programs.filter(p => p.status === 'Active').length;
    const periodCount = state.data.periods.length;
    root.innerHTML = `${head('Manage Licensure Data', 'Maintain programs, examination periods, results, and topnotchers.', '<button class="btn" id="lic-add-program" type="button">Add program</button>')}${feedback()}
      <section class="lic-manage-overview" aria-label="Licensure records overview"><div class="lic-manage-stat"><span class="lic-stat-label">Programs</span><strong>${programCount}</strong><span class="lic-stat-note">${activeCount} active</span></div><div class="lic-manage-stat"><span class="lic-stat-label">Exam periods</span><strong>${periodCount}</strong><span class="lic-stat-note">Across all programs</span></div><div class="lic-manage-stat"><span class="lic-stat-label">Topnotchers</span><strong>${state.data.topnotchers.length}</strong><span class="lic-stat-note">Recorded results</span></div></section>
      <section class="card lic-panel lic-directory-panel"><div class="lic-filter-heading"><div><span class="lic-eyebrow">Program directory</span><h3>Find a program</h3><p class="muted small">Search by course or licensure examination, then manage its records below.</p></div></div><div class="lic-panel-head lic-directory-tools"><label class="lic-search">Search programs<input type="search" id="lic-search" placeholder="Search by program or examination" value="${esc(state.search)}" autocomplete="off"></label><span class="lic-count-pill" role="status">${list.length} of ${programCount} programs</span></div></section>
      <section class="lic-list-section" aria-labelledby="lic-program-list-title"><div class="lic-list-heading"><div><span class="lic-eyebrow">Examinations</span><h3 id="lic-program-list-title">Programs and examinations</h3></div><p class="muted small">View periods, edit details, or add a new exam period.</p></div><div class="lic-program-grid">${list.length ? list.map(p => `<article class="lic-program-card"><div class="lic-program-card-top"><span class="lic-program-type">Licensure program</span><span class="lic-status ${p.status === 'Active' ? 'is-active' : 'is-inactive'}">${esc(p.status)}</span></div><h4>${esc(p.program_name)}</h4><div class="lic-program-exam"><span class="lic-detail-label">Examination</span><p>${esc(p.exam_title)}</p></div><div class="lic-program-card-bottom"><span class="lic-period-count"><strong>${state.data.periods.filter(x => num(x.program_id) === num(p.program_id)).length}</strong> exam periods</span><div class="lic-card-actions"><button class="btn lic-program-periods" type="button" data-id="${num(p.program_id)}" aria-label="View exam periods for ${esc(p.program_name)}">View periods</button><button class="btn ghost lic-program-edit" type="button" data-id="${num(p.program_id)}" aria-label="Edit ${esc(p.program_name)}">Edit</button><button class="btn ghost lic-program-add-period" type="button" data-id="${num(p.program_id)}" aria-label="Add exam period for ${esc(p.program_name)}">Add period</button></div></div></article>`).join('') : '<p class="lic-empty-state">No programs match this search. Try a different name or examination.</p>'}</div></section>`;
    root.querySelector('#lic-search').oninput = e => {
      state.search = e.target.value;
      setNotice('');
      const start = e.target.selectionStart, end = e.target.selectionEnd;
      renderManage(root);
      const search = root.querySelector('#lic-search');
      search.focus();
      search.setSelectionRange(start, end);
    };
    root.querySelector('#lic-add-program').onclick = () => programModal(root);
    root.querySelectorAll('.lic-program-edit').forEach(b => b.onclick = () => programModal(root, program(b.dataset.id)));
    root.querySelectorAll('.lic-program-periods').forEach(b => b.onclick = () => periodsModal(root, num(b.dataset.id)));
    root.querySelectorAll('.lic-program-add-period').forEach(b => b.onclick = () => periodModal(root, num(b.dataset.id)));
  }
  function programModal(root, item) {
    openModal(item ? 'Edit program' : 'Add program', `<p class="muted small">Program information is used in the dashboard, filters, and exports.</p><div class="lic-form-grid">
      <label class="lic-wide">Program name<input name="program_name" type="text" maxlength="255" required value="${esc(item?.program_name || '')}"></label>
      <label class="lic-wide">Examination title<input name="exam_title" type="text" maxlength="255" required value="${esc(item?.exam_title || '')}"></label>
      <label>Program key<input name="program_key" type="text" pattern="[A-Za-z0-9_-]{2,50}" maxlength="50" required value="${esc(item?.program_key || '')}" title="2 to 50 letters, numbers, underscores, or hyphens"></label>
      <label>Display order<input name="sort_order" type="number" min="0" value="${num(item?.sort_order)}" required></label>
      <label>Status<select name="status"><option ${item?.status !== 'Inactive' ? 'selected' : ''}>Active</option><option ${item?.status === 'Inactive' ? 'selected' : ''}>Inactive</option></select></label>
    </div>`, async dialog => {
      const f = dialog.querySelector('form').elements;
      await request('save-program', { program_id: num(item?.program_id), program_name: f.program_name.value.trim(), exam_title: f.exam_title.value.trim(), program_key: f.program_key.value.trim(), sort_order: Number(f.sort_order.value), status: f.status.value });
      await refresh(); setNotice(item ? 'Program updated.' : 'Program added.'); renderManage(root);
    }, { saveLabel: item ? 'Save changes' : 'Add program' });
  }
  function periodsModal(root, programId) {
    const course = program(programId);
    const list = state.data.periods.filter(p => num(p.program_id) === programId).sort((a, b) => dateOf(b) - dateOf(a));
    const content = `${feedback()}<p class="muted">${esc(course?.program_name || '')} · ${esc(course?.exam_title || '')}</p><div class="lic-modal-toolbar"><span>${list.length} exam period${list.length === 1 ? '' : 's'}</span><button class="btn" type="button" id="lic-modal-add-period">Add period</button></div>
      ${table(['Period', 'MSU first-time', 'MSU overall', 'National first-time', 'National overall', 'Actions'], list.map(p => `<tr><th scope="row">${esc(p.exam_period_label)}</th><td class="lic-rate">${rate(result(p.period_id, 'MSU', 'First'))}</td><td class="lic-rate">${rate(result(p.period_id, 'MSU', 'Overall'))}</td><td class="lic-rate">${rate(result(p.period_id, 'National', 'First'))}</td><td class="lic-rate">${rate(result(p.period_id, 'National', 'Overall'))}</td><td class="lic-actions"><button class="btn ghost lic-period-edit" type="button" data-id="${num(p.period_id)}" aria-label="Edit ${esc(p.exam_period_label)}">Edit</button><button class="btn danger lic-period-delete" type="button" data-id="${num(p.period_id)}" aria-label="Delete ${esc(p.exam_period_label)}">Delete</button></td></tr>`).join(''), 'No exam periods yet.', 'Exam period output')}`;
    const dialog = openModal('Exam period output', content, async () => {});
    dialog.classList.add('lic-dialog-wide');
    dialog.querySelector('.lic-save').remove();
    dialog.querySelector('.lic-cancel').textContent = 'Close';
    dialog.querySelector('#lic-modal-add-period').onclick = () => closeThen(dialog, () => periodModal(root, programId));
    dialog.querySelectorAll('.lic-period-edit').forEach(b => b.onclick = () => { const item = period(b.dataset.id); closeThen(dialog, () => periodModal(root, programId, item)); });
    dialog.querySelectorAll('.lic-period-delete').forEach(b => b.onclick = async () => {
      const p = period(b.dataset.id);
      if (!await confirmDelete(`Delete ${p.exam_period_label} and all its results and topnotchers?`)) return;
      try { await request('delete-period', { period_id: num(p.period_id) }); await refresh(); setNotice('Exam period deleted.'); closeThen(dialog, () => { renderManage(root); periodsModal(root, programId); }); }
      catch (error) { const message = dialog.querySelector('.lic-form-error'); message.textContent = error.message; message.hidden = false; message.focus(); }
    });
  }
  function topRow(item = {}) {
    return `<div class="lic-top-row"><label>Rank<input type="number" name="rank" min="1" required value="${item.rank_position ?? ''}"></label><label>Full name<input type="text" name="name" maxlength="255" required value="${esc(item.full_name || '')}"></label><label>Rating (%)<input type="number" name="rating" min="0" max="100" step="0.01" value="${item.rating ?? ''}" placeholder="Optional"></label><button class="btn danger lic-remove-top" type="button" aria-label="Remove topnotcher row">Remove</button></div>`;
  }
  function periodModal(root, programId, item) {
    const course = program(programId);
    const metrics = [['MSU', 'First', 'MSU first-time'], ['MSU', 'Overall', 'MSU overall'], ['National', 'First', 'National first-time'], ['National', 'Overall', 'National overall']];
    const metricHtml = metrics.map(([group, type, label]) => {
      const r = item ? result(item.period_id, group, type) : null;
      return `<fieldset class="lic-metric" data-key="${group}:${type}"><legend>${label}</legend><label>Passers<input type="number" name="passers" min="0" required value="${r ? num(r.passers) : ''}"></label><label>Takers<input type="number" name="takers" min="0" required value="${r ? num(r.takers) : ''}"></label><output>${rate(r)}</output></fieldset>`;
    }).join('');
    const dialog = openModal(item ? 'Edit exam period' : 'Add exam period', `<p class="muted">${esc(course?.program_name || '')} · ${esc(course?.exam_title || '')}</p><label class="lic-block">Exam period<input type="text" name="exam_label" maxlength="100" required value="${esc(item?.exam_period_label || '')}" placeholder="e.g. March 2026"></label><p class="muted small">Enter passers and takers for each group. Passing rates update automatically.</p><div class="lic-metric-grid">${metricHtml}</div><div class="lic-modal-toolbar"><div><h3>Topnotchers</h3><p class="muted small">Optional; rows removed here are deleted when you save.</p></div><button class="btn ghost" type="button" id="lic-add-top-row">Add topnotcher</button></div><div id="lic-top-rows">${item ? topnotchers(item.period_id).map(topRow).join('') : ''}</div>`, async modal => {
      const label = modal.querySelector('[name=exam_label]').value.trim();
      const results = {};
      modal.querySelectorAll('.lic-metric').forEach(box => { results[box.dataset.key] = { passers: Number(box.querySelector('[name=passers]').value), takers: Number(box.querySelector('[name=takers]').value) }; });
      const topnotchers = [...modal.querySelectorAll('.lic-top-row')].map(row => ({ rank_position: Number(row.querySelector('[name=rank]').value), full_name: row.querySelector('[name=name]').value.trim(), rating: row.querySelector('[name=rating]').value === '' ? null : Number(row.querySelector('[name=rating]').value) }));
      await request('save-period', { period_id: num(item?.period_id), program_id: programId, exam_period_label: label, results, topnotchers });
      await refresh(); setNotice(item ? 'Exam period updated.' : 'Exam period added.'); renderManage(root);
    }, { saveLabel: item ? 'Save changes' : 'Add exam period' });
    dialog.classList.add('lic-dialog-wide');
    const rows = dialog.querySelector('#lic-top-rows');
    dialog.querySelector('#lic-add-top-row').onclick = () => { rows.insertAdjacentHTML('beforeend', topRow()); rows.lastElementChild.querySelector('[name=rank]').focus(); };
    rows.onclick = e => { if (e.target.closest('.lic-remove-top')) e.target.closest('.lic-top-row').remove(); };
    dialog.querySelectorAll('.lic-metric').forEach(box => {
      box.oninput = () => {
        const passers = box.querySelector('[name=passers]');
        const takers = box.querySelector('[name=takers]');
        const p = Number(passers.value), t = Number(takers.value);
        passers.setCustomValidity(passers.value !== '' && takers.value !== '' && p > t ? 'Passers cannot exceed takers.' : '');
        box.querySelector('output').textContent = passers.validationMessage ? 'Check counts' : t > 0 ? (p / t * 100).toFixed(2) + '%' : '0.00%';
      };
    });
  }

  O.views.licensure = root => loadPage(root, renderDashboard);
  O.views['licensure-topnotchers'] = root => loadPage(root, renderTopnotchers);
  O.views['licensure-manage'] = root => loadPage(root, renderManage);
})();
