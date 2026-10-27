/* University KPI Monitoring: independent dashboard and administrator workspace. */
(function () {
  'use strict';
  const O = window.OME;
  const esc = O.esc;
  const state = { data: null, direction: '', year: null, search: '', notice: '', error: false, openIndicatorId: null };
  let loadToken = 0;
  const fields = ['indicator_name', 'baseline_2025', 'baseline_note', 'remarks'];

  async function request(action, body) {
    const response = await fetch('kpi_api.php?action=' + encodeURIComponent(action), {
      method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `KPI request failed (${response.status})`);
    return result;
  }
  function availableYears() {
    return [...new Set([2026, 2027, 2028, 2029, 2030, ...state.data.years.map(row => Number(row.report_year))])]
      .filter(year => Number.isInteger(year) && year >= 2026 && year <= 2100).sort((a, b) => a - b);
  }
  async function refresh() {
    state.data = await request('data');
    state.data.years = Array.isArray(state.data.years) ? state.data.years : [];
    const years = availableYears();
    if (!years.includes(Number(state.year))) {
      const current = new Date().getFullYear();
      state.year = years.filter(year => year <= current).pop() || years[0];
    }
    return state.data;
  }
  function yearly(item, year = state.year) {
    return state.data.years.find(row => Number(row.indicator_id) === Number(item.indicator_id) && Number(row.report_year) === Number(year));
  }
  function text(value) { return value == null || String(value).trim() === '' ? '<span class="kpi-dash">—</span>' : esc(value).replace(/\n/g, '<br>'); }
  function head(title, subtitle, action = '') {
    return `<div class="section-head kpi-page-head"><div><span class="kpi-head-eyebrow">Office of Monitoring and Evaluation · University KPI Monitoring</span><h2>${title}</h2><p class="muted">${subtitle}</p></div>${action ? `<div class="kpi-head-action">${action}</div>` : ''}</div>`;
  }
  function notice() { return state.notice ? `<p class="kpi-notice${state.error ? ' is-error' : ''}" role="${state.error ? 'alert' : 'status'}">${esc(state.notice)}</p>` : ''; }
  function setNotice(message, error = false) { state.notice = message; state.error = error; }
  function directionOptions(allLabel = 'All strategic directions') {
    return `<option value="">${allLabel}</option>` + state.data.directions.map(direction =>
      `<option value="${Number(direction.direction_id)}" ${state.direction === String(direction.direction_id) ? 'selected' : ''}>Direction ${Number(direction.direction_number)} · ${esc(direction.title)}</option>`).join('');
  }
  function filtered() {
    const query = state.search.toLocaleLowerCase();
    const directions = state.data.directions.filter(direction => !state.direction || String(direction.direction_id) === state.direction);
    return directions.map(direction => ({ direction, indicators: state.data.indicators.filter(indicator =>
      String(indicator.direction_id) === String(direction.direction_id) &&
      (!query || `${indicator.indicator_name} ${indicator.remarks} ${direction.title}`.toLocaleLowerCase().includes(query)))
    })).filter(group => group.indicators.length);
  }
  function summary() {
    const updates = state.data.years.filter(record => {
      const actual = record.actual_value?.trim();
      return actual && !/^(no actual data|not yet available)$/i.test(actual);
    }).length;
    return `<div class="kpi-summary" aria-label="KPI overview">
      <div class="kpi-summary-item"><span>Strategic Directions</span><strong>${state.data.directions.length}</strong></div>
      <div class="kpi-summary-item"><span>KPIs Monitored</span><strong>${state.data.indicators.length}</strong></div>
      <div class="kpi-summary-item"><span>Yearly Actuals Recorded</span><strong>${updates}</strong></div>
    </div>`;
  }
  function valueCell(label, value, extra = '') {
    return `<td data-label="${esc(label)}"><span class="kpi-mobile-label">${esc(label)}</span><span class="kpi-cell-value">${text(value)}${extra}</span></td>`;
  }
  function yearCell(item, year) {
    const record = yearly(item, year);
    const actual = record?.actual_value?.trim();
    const unavailable = /^(no actual data|not yet available)$/i.test(actual || '');
    return `<td data-label="${year}"><span class="kpi-mobile-label">${year}</span><span class="kpi-cell-value">
      <span class="kpi-year-target"><span>Target</span><strong>${text(record?.target_value)}</strong></span>
      ${actual ? `<span class="kpi-year-actual${unavailable ? ' is-unavailable' : ''}"><span>Actual${record.actual_as_of ? ` · ${esc(record.actual_as_of)}` : ''}</span><strong>${text(actual)}</strong></span>` : ''}
      ${record?.year_note ? `<span class="kpi-year-note">${text(record.year_note)}</span>` : ''}
    </span></td>`;
  }
  function indicatorRow(item) {
    return `<tr><th scope="row" data-label="KPI">${esc(item.indicator_name)}</th>
      ${valueCell('Baseline 2025', item.baseline_2025, item.baseline_note ? `<span class="kpi-cell-note">${text(item.baseline_note)}</span>` : '')}
      ${availableYears().map(year => yearCell(item, year)).join('')}
      ${valueCell('Standing remarks', item.remarks)}</tr>`;
  }
  function directionTable(group) {
    const { direction, indicators } = group;
    const years = availableYears();
    const minWidth = 480 + years.length * 145;
    return `<section class="kpi-direction" aria-labelledby="kpi-direction-${Number(direction.direction_id)}">
      <header class="kpi-direction-head"><div><span class="kpi-eyebrow">Strategic Direction ${Number(direction.direction_number)}</span><h3 id="kpi-direction-${Number(direction.direction_id)}">${esc(direction.title)}</h3></div><span class="kpi-direction-count">${indicators.length} KPI${indicators.length === 1 ? '' : 's'}</span></header>
      <div class="kpi-table-scroll" role="region" tabindex="0" aria-label="Strategic Direction ${Number(direction.direction_number)} KPI table">
        <p class="kpi-scroll-hint" aria-hidden="true">Scroll sideways to view each year’s target and actual accomplishment.</p>
        <table class="kpi-table" style="--kpi-min-width:${minWidth}px"><caption class="sr-only">${esc(direction.title)} KPIs, baseline 2025 and yearly targets and actuals</caption>
          <colgroup><col style="width:19%"><col style="width:12%">${years.map(() => `<col style="width:${(48 / years.length).toFixed(2)}%">`).join('')}<col style="width:21%"></colgroup>
          <thead><tr><th scope="col">KPI</th><th scope="col">Baseline 2025</th>${years.map(year => `<th scope="col">${year}</th>`).join('')}<th scope="col">Remarks</th></tr></thead>
          <tbody>${indicators.map(indicatorRow).join('')}</tbody></table>
      </div></section>`;
  }
  function renderDashboard(root) {
    const groups = filtered();
    const shown = groups.reduce((sum, group) => sum + group.indicators.length, 0);
    root.innerHTML = `${head('University KPI Monitoring', 'Compare the 2025 baseline with each year’s target and actual accomplishment.', state.data.canEdit ? '<a class="btn" href="#/kpi-manage">Update KPI data</a>' : '')}
      ${summary()}
      <section class="card kpi-filter-panel" aria-label="KPI filters"><div><span class="kpi-eyebrow">Explore the scorecard</span><h3>Find an Indicator</h3><p class="muted small">Targets and actuals appear as recorded; different KPIs use different units.</p></div>
        <div class="kpi-filter-grid"><label>Strategic Direction<select id="kpi-direction-filter">${directionOptions()}</select></label>
          <label>Search KPI or Remarks<input id="kpi-search" type="search" value="${esc(state.search)}" placeholder="Search Indicators" autocomplete="off"></label></div>
        <p class="kpi-result-count" role="status">Showing ${shown} of ${state.data.indicators.length} KPIs</p></section>
      <div class="kpi-directions">${groups.length ? groups.map(directionTable).join('') : '<div class="card kpi-empty">No KPIs match those filters. Try another direction or search term.</div>'}</div>
      <p class="kpi-source-note">Source: supplied OME University KPI monitoring tables and subsequent annual updates. Each actual appears in its own reporting-year column.</p>`;
    bindFilters(root, renderDashboard);
  }
  function manageGroup(group) {
    const { direction, indicators } = group;
    return `<section class="kpi-manage-group" aria-labelledby="kpi-manage-${Number(direction.direction_id)}"><header><div><span class="kpi-eyebrow">Strategic Direction ${Number(direction.direction_number)}</span><h3 id="kpi-manage-${Number(direction.direction_id)}">${esc(direction.title)}</h3><span class="kpi-direction-count">${indicators.length} KPI${indicators.length === 1 ? '' : 's'}</span></div><button class="btn ghost kpi-edit-direction" type="button" data-id="${Number(direction.direction_id)}">Edit Direction</button></header>
      <div class="kpi-manage-items">${indicators.map(item => {
        return `<details class="kpi-manage-item" ${Number(state.openIndicatorId) === Number(item.indicator_id) ? 'open' : ''}><summary><strong>${esc(item.indicator_name)}</strong><span>View and edit annual values</span></summary>
          <div class="kpi-manage-item-body"><p class="kpi-manage-help">Existing targets are shown below. Edit a year if its approved target changes or you need to record an accomplishment.</p><div class="kpi-manage-year-list"><div class="kpi-manage-year-heading" aria-hidden="true"><span>Year</span><span>Target</span><span>Actual accomplishment</span><span></span></div>${availableYears().map(year => {
            const record = yearly(item, year);
            return `<div class="kpi-manage-year-row"><strong class="kpi-manage-year">${year}</strong><div class="kpi-manage-value"><span class="kpi-manage-mobile-label">Target</span>${text(record?.target_value)}</div><div class="kpi-manage-value"><span class="kpi-manage-mobile-label">Actual accomplishment</span>${text(record?.actual_value)}${record?.actual_as_of ? `<small>As of ${esc(record.actual_as_of)}</small>` : ''}</div><button class="btn ghost kpi-edit-year" type="button" data-id="${Number(item.indicator_id)}" data-year="${year}" aria-label="Edit ${year} target and actual for ${esc(item.indicator_name)}">Edit ${year}</button></div>`;
          }).join('')}</div><div class="kpi-manage-actions"><button class="btn ghost kpi-edit-indicator" type="button" data-id="${Number(item.indicator_id)}" aria-label="Edit details for ${esc(item.indicator_name)}">Edit KPI details</button><button class="btn ghost kpi-add-year" type="button" data-id="${Number(item.indicator_id)}" aria-label="Add another year for ${esc(item.indicator_name)}">Add another year</button></div></div></details>`;
      }).join('')}</div></section>`;
  }
  function renderManage(root) {
    if (!state.data.canEdit) {
      root.innerHTML = `${head('Update University KPI Data', 'OME administrator access is required.')}<div class="card"><p>You do not have permission to edit University KPI records.</p><a class="btn" href="#/kpi">View dashboard</a></div>`;
      return;
    }
    const groups = filtered();
    const shown = groups.reduce((sum, group) => sum + group.indicators.length, 0);
    root.innerHTML = `${head('Update University KPI Data', 'Maintain KPI details and record each year’s target, actual, reporting date, and evidence.', '<button class="btn" id="kpi-add" type="button">Add KPI</button>')}${notice()}
      ${summary()}
      <section class="card kpi-filter-panel" aria-label="Find a KPI to edit"><div><span class="kpi-eyebrow">Data management</span><h3>Find a KPI Record</h3><p class="muted small">Open a KPI to edit a target and actual within its year. Add another year when the plan extends.</p></div>
        <div class="kpi-filter-grid"><label>Strategic direction<select id="kpi-direction-filter">${directionOptions()}</select></label>
          <label>Search KPI or Remarks<input id="kpi-search" type="search" value="${esc(state.search)}" placeholder="Search Indicators" autocomplete="off"></label></div>
        <p class="kpi-result-count" role="status">Showing ${shown} of ${state.data.indicators.length} KPIs</p></section>
      <div class="kpi-manage-groups">${groups.length ? groups.map(manageGroup).join('') : '<div class="card kpi-empty">No KPI records match those filters.</div>'}</div>`;
    bindFilters(root, renderManage);
    root.querySelector('#kpi-add').onclick = () => indicatorDialog(root);
    root.querySelectorAll('.kpi-edit-indicator').forEach(button => button.onclick = () =>
      indicatorDialog(root, state.data.indicators.find(item => Number(item.indicator_id) === Number(button.dataset.id))));
    root.querySelectorAll('.kpi-edit-year').forEach(button => button.onclick = () =>
      yearDialog(root, state.data.indicators.find(item => Number(item.indicator_id) === Number(button.dataset.id)), Number(button.dataset.year)));
    root.querySelectorAll('.kpi-add-year').forEach(button => button.onclick = () =>
      yearDialog(root, state.data.indicators.find(item => Number(item.indicator_id) === Number(button.dataset.id)), Math.max(...availableYears()) + 1));
    root.querySelectorAll('.kpi-edit-direction').forEach(button => button.onclick = () =>
      directionDialog(root, state.data.directions.find(item => Number(item.direction_id) === Number(button.dataset.id))));
  }
  function bindFilters(root, render) {
    root.querySelector('#kpi-direction-filter').onchange = event => {
      state.direction = event.target.value; render(root); root.querySelector('#kpi-direction-filter').focus({ preventScroll: true });
    };
    root.querySelector('#kpi-search').oninput = event => {
      state.search = event.target.value;
      const start = event.target.selectionStart, end = event.target.selectionEnd;
      render(root);
      const search = root.querySelector('#kpi-search');
      search.focus({ preventScroll: true }); search.setSelectionRange(start, end);
    };
  }
  function openDialog(title, body, onSave) {
    const returnFocus = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.className = 'kpi-dialog';
    dialog.innerHTML = `<form class="kpi-dialog-form"><header><h2>${esc(title)}</h2><button type="button" class="kpi-dialog-close" aria-label="Close dialog">×</button></header><div class="kpi-dialog-body">${body}<p class="kpi-dialog-error" role="alert" tabindex="-1" hidden></p></div><footer><button type="button" class="btn subtle kpi-dialog-cancel">Cancel</button><button type="submit" class="btn kpi-dialog-save">Save changes</button></footer></form>`;
    document.body.append(dialog);
    const close = () => dialog.close();
    dialog.querySelector('.kpi-dialog-close').onclick = close;
    dialog.querySelector('.kpi-dialog-cancel').onclick = close;
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (returnFocus?.isConnected) returnFocus.focus();
      else document.querySelector('.kpi-manage-item[open] summary')?.focus();
    });
    dialog.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault();
      const save = dialog.querySelector('.kpi-dialog-save');
      const error = dialog.querySelector('.kpi-dialog-error');
      save.disabled = true; error.hidden = true; error.textContent = '';
      try { await onSave(dialog.querySelector('form')); dialog.close(); }
      catch (cause) { error.textContent = cause.message || 'Could not save this KPI. Please try again.'; error.hidden = false; error.focus(); save.disabled = false; }
    });
    dialog.showModal();
    dialog.querySelector('[required]')?.focus();
    return dialog;
  }
  function indicatorDialog(root, item) {
    const currentDirection = item?.direction_id || state.direction || state.data.directions[0]?.direction_id;
    const input = (label, name, options = {}) => `<label class="${options.wide ? 'kpi-field-wide' : ''}">${label}${options.large ? `<textarea name="${name}" maxlength="${options.max || 5000}" rows="${options.rows || 3}">${esc(item?.[name] || '')}</textarea>` : `<input name="${name}" type="${options.number ? 'number' : 'text'}" ${options.number ? 'min="0"' : `maxlength="${options.max || 500}"`} ${options.required ? 'required' : ''} value="${esc(item?.[name] ?? (options.number ? '0' : ''))}">`}</label>`;
    const body = `<p class="muted small">Edit the KPI identity and 2025 baseline here. Use “Update year” for annual targets, actuals, and reporting dates.</p>
      <div class="kpi-form-grid"><label class="kpi-field-wide">Strategic Direction<select name="direction_id" required>${state.data.directions.map(direction => `<option value="${Number(direction.direction_id)}" ${String(direction.direction_id) === String(currentDirection) ? 'selected' : ''}>Direction ${Number(direction.direction_number)} · ${esc(direction.title)}</option>`).join('')}</select></label>
      ${input('KPI name', 'indicator_name', { wide: true, required: true, max: 255 })}
      ${input('Baseline 2025', 'baseline_2025', { max: 1000 })}${input('Baseline explanation', 'baseline_note', { wide: true, large: true, max: 3000 })}
      ${input('Standing remarks and means of verification', 'remarks', { wide: true, large: true, max: 5000, rows: 5 })}
      ${input('Display order', 'sort_order', { number: true })}</div>`;
    openDialog(item ? 'Edit KPI' : 'Add KPI', body, async form => {
      const values = { indicator_id: Number(item?.indicator_id || 0), direction_id: Number(form.elements.direction_id.value), sort_order: Number(form.elements.sort_order.value) };
      fields.forEach(field => { values[field] = form.elements[field].value.trim(); });
      const saved = await request('save-indicator', values);
      await refresh(); state.openIndicatorId = Number(item?.indicator_id || saved.indicator_id);
      setNotice(item ? 'KPI details updated.' : 'KPI added. Open it to enter an annual target and result.'); renderManage(root);
    });
  }
  function yearDialog(root, item, selectedYear = state.year) {
    const record = yearly(item, selectedYear);
    const body = `<p class="muted small">The saved target for this year is prefilled. You may revise it when needed. Changing the year loads that year’s saved values. Leave unknown actuals blank, not zero.</p>
      <div class="kpi-form-grid">
        <label class="kpi-field-wide">Reporting year<input name="report_year" type="number" min="2026" max="2100" step="1" required value="${Number(selectedYear)}"></label>
        <label>Annual target<input name="target_value" type="text" maxlength="500" value="${esc(record?.target_value || '')}"></label>
        <label>Actual accomplishment<input name="actual_value" type="text" maxlength="1000" value="${esc(record?.actual_value || '')}"></label>
        <label class="kpi-field-wide">Actual as-of date or period<input name="actual_as_of" type="text" maxlength="150" value="${esc(record?.actual_as_of || '')}" placeholder="e.g. August 2027"></label>
        <label class="kpi-field-wide">Year-specific remarks or evidence<textarea name="year_note" maxlength="5000" rows="5">${esc(record?.year_note || '')}</textarea></label>
      </div>`;
    const dialog = openDialog(`Update ${Number(selectedYear)} · ${item.indicator_name}`, body, async form => {
      const year = Number(form.elements.report_year.value);
      if (!Number.isInteger(year) || year < 2026 || year > 2100) throw new Error('Enter a reporting year from 2026 to 2100.');
      await request('save-year', {
        indicator_id: Number(item.indicator_id), report_year: year,
        target_value: form.elements.target_value.value.trim(), actual_value: form.elements.actual_value.value.trim(),
        actual_as_of: form.elements.actual_as_of.value.trim(), year_note: form.elements.year_note.value.trim()
      });
      state.year = year;
      await refresh(); state.openIndicatorId = Number(item.indicator_id); setNotice(`${year} target and actual saved.`); renderManage(root);
    });
    dialog.querySelector('[name="report_year"]').addEventListener('change', event => {
      const year = Number(event.target.value);
      if (!Number.isInteger(year) || year < 2026 || year > 2100) return;
      const saved = yearly(item, year);
      const form = dialog.querySelector('form');
      for (const field of ['target_value', 'actual_value', 'actual_as_of', 'year_note']) form.elements[field].value = saved?.[field] || '';
      dialog.querySelector('h2').textContent = `Update ${year} · ${item.indicator_name}`;
    });
  }
  function directionDialog(root, item) {
    openDialog(`Edit Strategic Direction ${Number(item.direction_number)}`, `<p class="muted small">Changing this title updates both the dashboard and the KPI editor.</p><label class="kpi-direction-title-label">Strategic direction title<input name="title" type="text" maxlength="255" required value="${esc(item.title)}"></label>`, async form => {
      await request('save-direction', { direction_id: Number(item.direction_id), title: form.elements.title.value.trim() });
      await refresh(); setNotice('Strategic direction updated.'); renderManage(root);
    });
  }
  function errorPage(root, error) {
    root.innerHTML = `${head('University KPI data unavailable', 'The survey and licensure sections remain available.')}<div class="card kpi-error-page"><p role="alert">${esc(error.message)}</p><button class="btn" type="button" id="kpi-retry">Try again</button></div>`;
    root.querySelector('#kpi-retry').onclick = () => load(root, location.hash.split('?')[0] === '#/kpi-manage' ? renderManage : renderDashboard);
  }
  async function load(root, render) {
    const token = ++loadToken;
    const expectedRoute = render === renderManage ? 'kpi-manage' : 'kpi';
    root.innerHTML = '<div class="card" role="status">Loading University KPI data…</div>';
    try {
      await refresh();
      if (token !== loadToken || root !== document.getElementById('view') || location.hash.split('?')[0] !== '#/' + expectedRoute) return;
      render(root);
    } catch (error) { if (token === loadToken && location.hash.split('?')[0] === '#/' + expectedRoute) errorPage(root, error); }
  }
  O.views.kpi = root => load(root, renderDashboard);
  O.views['kpi-manage'] = root => load(root, renderManage);
})();
