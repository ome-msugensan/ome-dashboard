(function () {
  'use strict';
  const O = window.OME, esc = O.esc;
  const fields = [
    ['publication_title', 'Publication Title', 1000], ['publication_date', 'Date of Publication', 100],
    ['publication_venue', 'Book Chapter/Journal/Conference Proceedings Published', 1000], ['author_name', 'Author', 255],
    ['school', 'School', 500], ['college', 'College/Domain', 500], ['department', 'Department', 500]
  ];
  let data = null, token = 0;
  let scrollCleanup = () => {};
  const pageSize = 10;
  const filterFields = fields.slice(1);
  function pagination(page, total) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    return `<nav class="pub-pagination" aria-label="Results pages"><button class="btn btn-outline" type="button" data-page="prev" aria-label="Previous page" ${page <= 1 ? 'disabled' : ''}>&lt;</button><span>Page ${page} of ${pages}</span><button class="btn btn-outline" type="button" data-page="next" aria-label="Next page" ${page >= pages ? 'disabled' : ''}>&gt;</button></nav>`;
  }
  async function request(action, body) {
    const response = await fetch('publications_api.php?action=' + action, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', headers: body === undefined ? {} : {'Content-Type': 'application/json'}, body: body === undefined ? undefined : JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Request failed.');
    return result;
  }
  const value = v => v ? esc(v).replace(/\n/g, '<br>') : '<span class="muted">—</span>';
  function header(title, description, action = '') { return `<div class="section-head kpi-page-head"><div><span class="kpi-head-eyebrow">Office of Monitoring and Evaluation · Research</span><h2>${title}</h2><p class="muted">${description}</p></div><div class="kpi-head-action">${action}</div></div>`; }
  function isGsc(school) {
    const name = String(school || '').trim().toLowerCase().replace(/[–—]/g, '-').replace(/\s*[-]\s*/g, '-').replace(/\s+/g, ' ');
    return ['msu-gsc', 'mindanao state university-general santos'].includes(name);
  }
  function publicationKey(row) {
    return JSON.stringify(fields.slice(0, 3).map(([name]) => String(row[name] || '').trim().toLowerCase()));
  }
  function publicationYear(date) {
    const years = String(date || '').match(/\b(?:1[0-9]{3}|2[0-9]{3})\b/g) || [];
    const unique = [...new Set(years)];
    return unique.length === 1 ? unique[0] : '';
  }
  function rankings(rows) {
    const groups = new Map();
    rows.forEach(r => {
      if (!isGsc(r.school) || !r.college.trim() || !r.department.trim() || !r.publication_title.trim()) return;
      const key = `${r.college.trim().toLowerCase()}\u0000${r.department.trim().toLowerCase()}`;
      if (!groups.has(key)) groups.set(key, {college:r.college.trim(), department:r.department.trim(), titles:new Set()});
      groups.get(key).titles.add(publicationKey(r));
    });
    const list = [...groups.values()].sort((a,b) => b.titles.size-a.titles.size || a.department.localeCompare(b.department));
    let rank = 0, last = -1;
    return list.map(r => { if (r.titles.size !== last) { rank++; last = r.titles.size; } return {...r, rank}; });
  }
  function facultyRankings(rows) {
    const groups = new Map();
    rows.forEach(r => {
      const name = r.author_name.trim(), title = r.publication_title.trim();
      if (!isGsc(r.school) || !name || !title) return;
      const key = name.toLowerCase();
      if (!groups.has(key)) groups.set(key, { name, colleges: new Set(), departments: new Set(), titles: new Set() });
      const group = groups.get(key);
      group.titles.add(publicationKey(r));
      if (r.college.trim()) group.colleges.add(r.college.trim());
      if (r.department.trim()) group.departments.add(r.department.trim());
    });
    const list = [...groups.values()].sort((a, b) => b.titles.size - a.titles.size || a.name.localeCompare(b.name));
    let rank = 0, last = -1;
    return list.map(r => { if (r.titles.size !== last) { rank++; last = r.titles.size; } return {...r, rank}; });
  }
  function publicationGroups(rows) {
    const groups = new Map();
    rows.forEach(row => {
      const key = publicationKey(row);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    return [...groups.values()];
  }
  function prepareTableScroll(root) {
    scrollCleanup();
    const viewport = root.querySelector('.pub-table-scroll');
    if (!viewport) return;
    const table = viewport.querySelector('table'), header = table.querySelector('thead');
    const frame = document.createElement('div'); frame.className = 'pub-table-frame';
    viewport.before(frame); frame.append(viewport);
    const controls = document.createElement('div'); controls.className = 'pub-scroll-controls';
    controls.innerHTML = '<div class="pub-scroll-track" role="region" aria-label="Scroll table horizontally" tabindex="0"><div></div></div>';
    frame.append(controls);
    const track = controls.querySelector('.pub-scroll-track'), spacer = track.firstElementChild;
    const controller = new AbortController(), options = { signal: controller.signal };
    let syncing = false;
    viewport.addEventListener('scroll', () => { if (!syncing) { syncing = true; track.scrollLeft = viewport.scrollLeft; syncing = false; } }, options);
    track.addEventListener('scroll', () => { if (!syncing) { syncing = true; viewport.scrollLeft = track.scrollLeft; syncing = false; } }, options);
    const update = () => {
      if (!root.isConnected || !frame.isConnected) { controller.abort(); return; }
      const nav = document.querySelector('nav.tabs');
      const navBottom = nav && !nav.hidden ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
      const overflow = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      const viewportRect = viewport.getBoundingClientRect();
      controls.hidden = overflow === 0 || viewportRect.top >= window.innerHeight || viewportRect.bottom <= navBottom;
      if (!controls.hidden) {
        controls.style.left = `${Math.max(0, viewportRect.left)}px`;
        controls.style.width = `${Math.min(viewportRect.right, window.innerWidth) - Math.max(0, viewportRect.left)}px`;
        controls.style.bottom = `${Math.max(0, window.innerHeight - viewportRect.bottom - controls.offsetHeight)}px`;
      }
      spacer.style.width = `${track.clientWidth + overflow}px`;
      if (!controls.hidden) track.scrollLeft = viewport.scrollLeft;
      const tableRect = table.getBoundingClientRect();
      const offset = Math.max(0, Math.min(navBottom - tableRect.top, tableRect.height - header.offsetHeight));
      header.querySelectorAll('th').forEach(th => { th.style.transform = `translateY(${offset}px)`; });
    };
    window.addEventListener('scroll', update, { ...options, passive: true });
    window.addEventListener('resize', update, options);
    scrollCleanup = () => controller.abort();
    update();
  }
  function drawList(root) {
    root.innerHTML = header('Scopus-Indexed Publications', 'Explore publication records and their authors and affiliations.', data.canEdit ? '<button class="btn" id="pub-add" type="button">Add record</button>' : '') + `
      <div class="card pub-filter"><form id="pub-search-form" role="search"><label for="pub-search">Search all fields</label><div class="pub-search-row"><input id="pub-search" type="search" placeholder="Search publication records" autocomplete="off"><button class="btn" type="submit">Search</button><button id="pub-clear-search" class="btn btn-outline" type="button" hidden>Clear search</button></div></form><details class="pub-filter-details"><summary>Filter by field</summary><form id="pub-filter-form"><div class="pub-filter-grid">${filterFields.map(([key,label]) => `<label for="filter-${key}">${esc(label)}<input id="filter-${key}" data-filter="${key}" type="search" placeholder="Filter ${esc(label)}" autocomplete="off"></label>`).join('')}</div><div class="pub-filter-footer"><button id="pub-apply" class="btn" type="submit" disabled>Apply filters</button><button id="pub-clear" class="btn btn-outline" type="button" disabled>Clear filters</button></div></form></details><p id="pub-count" class="muted small" role="status" aria-live="polite"></p></div>
      <div id="pub-list" class="pub-list"></div><dialog id="pub-dialog" class="kpi-dialog"></dialog>`;
    const list = root.querySelector('#pub-list'), count = root.querySelector('#pub-count');
    let page = 1;
    let appliedQuery = '', appliedFilters = filterFields.map(([key]) => [key, '']);
    const expanded = new Map();
    function updateClearButton() {
      const hasDraft = [...root.querySelectorAll('[data-filter]')].some(input => input.value.trim());
      root.querySelector('#pub-apply').disabled = !hasDraft;
      root.querySelector('#pub-clear').disabled = !appliedFilters.some(([, term]) => term);
      root.querySelector('#pub-clear-search').hidden = !appliedQuery;
    }
    function filter() {
      const scrollLeft = list.querySelector('.pub-table-scroll')?.scrollLeft || 0;
      const query = appliedQuery, filters = appliedFilters;
      updateClearButton();
      const groups = publicationGroups(data.rows);
      const matched = groups.filter(group => group.some(r => fields.some(([key]) => String(r[key] || '').toLowerCase().includes(query)) && filters.every(([key, term]) => String(r[key] || '').toLowerCase().includes(term))));
      page = Math.min(page, Math.max(1, Math.ceil(matched.length / pageSize)));
      const start = (page - 1) * pageSize, rows = matched.slice(start, start + pageSize);
      count.textContent = matched.length ? `Showing ${start + 1}–${start + rows.length} of ${matched.length} matching publications (${groups.length} total). Use + to show additional authors.` : `No matching publications (${groups.length} total)`;
      list.innerHTML = rows.length ? `<p class="pub-scroll-hint">Scroll sideways to see all columns. Use + to show all authors and affiliations.</p><div class="card pub-table-scroll" role="region" aria-label="Publication records table, scroll horizontally to see all columns" tabindex="0"><table class="pub-table pub-records-table"><caption class="pub-visually-hidden">Scopus-indexed publications and their authors</caption><thead><tr>${fields.map(([,label]) => `<th scope="col">${esc(label)}</th>`).join('')}${data.canEdit ? '<th scope="col">Actions</th>' : ''}</tr></thead>${rows.map(group => { const id = Number(group[0].id), isOpen = expanded.get(id) ?? Boolean(query || filters.some(([, term]) => term)), visible = isOpen ? group : group.slice(0, 1); return `<tbody>${visible.map((r, index) => `<tr>${index === 0 ? `<th scope="rowgroup" rowspan="${visible.length}">${value(r.publication_title)}${group.length > 1 ? `<div class="pub-expand-wrap"><button type="button" class="pub-expand" data-expand="${id}" aria-expanded="${isOpen}" aria-label="${isOpen ? 'Hide additional authors' : 'Show all ' + group.length + ' authors'} for ${esc(r.publication_title)}">${isOpen ? '−' : '+'}</button><span>${group.length} authors</span></div>` : ''}${data.canEdit ? `<button type="button" class="pub-add-coauthors" data-add-authors="${id}">+ Add authors</button>` : ''}</th><td rowspan="${visible.length}">${value(r.publication_date)}</td><td rowspan="${visible.length}">${value(r.publication_venue)}</td>` : ''}${fields.slice(3).map(([key]) => `<td>${value(r[key])}</td>`).join('')}${data.canEdit ? `<td><div class="pub-actions"><button class="btn btn-outline" data-edit="${Number(r.id)}" type="button" aria-label="Edit record for ${esc(r.author_name || r.publication_title)}">Edit</button><button class="btn btn-outline" data-delete="${Number(r.id)}" type="button" aria-label="Delete record for ${esc(r.author_name || r.publication_title)}">Delete</button></div></td>` : ''}</tr>`).join('')}</tbody>`; }).join('')}</table></div>${pagination(page, matched.length)}` : '<div class="card pub-empty">No records found. Try a different search or clear the filters.</div>';
      prepareTableScroll(list);
      const viewport = list.querySelector('.pub-table-scroll');
      if (viewport) viewport.scrollLeft = scrollLeft;
    }
    root.querySelectorAll('[data-filter]').forEach(input => input.addEventListener('input', updateClearButton));
    root.querySelector('#pub-search-form').addEventListener('submit', event => { event.preventDefault(); appliedQuery = root.querySelector('#pub-search').value.trim().toLowerCase(); appliedFilters = filterFields.map(([key]) => [key, '']); root.querySelectorAll('[data-filter]').forEach(input => { input.value = ''; }); page = 1; expanded.clear(); filter(); });
    root.querySelector('#pub-clear-search').addEventListener('click', () => { root.querySelector('#pub-search').value = ''; appliedQuery = ''; page = 1; expanded.clear(); filter(); });
    root.querySelector('#pub-filter-form').addEventListener('submit', event => { event.preventDefault(); appliedFilters = [...root.querySelectorAll('[data-filter]')].map(input => [input.dataset.filter, input.value.trim().toLowerCase()]); appliedQuery = ''; root.querySelector('#pub-search').value = ''; page = 1; expanded.clear(); filter(); });
    root.querySelector('#pub-clear').addEventListener('click', () => { root.querySelectorAll('[data-filter]').forEach(input => { input.value = ''; }); appliedFilters = filterFields.map(([key]) => [key, '']); page = 1; expanded.clear(); filter(); });
    list.addEventListener('click', event => { const button = event.target.closest('[data-page]'); if (!button || button.disabled) return; page += button.dataset.page === 'next' ? 1 : -1; filter(); });
    list.addEventListener('click', event => { const button = event.target.closest('[data-expand]'); if (!button) return; const id = Number(button.dataset.expand); expanded.set(id, button.getAttribute('aria-expanded') !== 'true'); filter(); list.querySelector(`[data-expand="${id}"]`)?.focus(); });
    filter();
    if (data.canEdit) {
      const saved = () => { filter(); count.textContent += ' · Record saved.'; };
      root.querySelector('#pub-add').addEventListener('click', () => addPublication(root, saved));
      list.addEventListener('click', async event => {
        const addAuthorsButton = event.target.closest('[data-add-authors]'), editButton = event.target.closest('[data-edit]'), deleteButton = event.target.closest('[data-delete]');
        if (addAuthorsButton) { const row = data.rows.find(r => Number(r.id) === Number(addAuthorsButton.dataset.addAuthors)); if (row) addPublication(root, saved, row); }
        if (editButton) edit(root, data.rows.find(r => Number(r.id) === Number(editButton.dataset.edit)), saved);
        if (deleteButton) {
          const row = data.rows.find(r => Number(r.id) === Number(deleteButton.dataset.delete));
          if (!row || !confirm(`Delete the author record for ${row.author_name || row.publication_title}? This cannot be undone.`)) return;
          deleteButton.disabled = true;
          try { await request('delete', {id:Number(row.id)}); data = await request('data'); filter(); }
          catch (error) { alert(error.message); deleteButton.disabled = false; }
        }
      });
    }
  }
  function addPublication(root, onSave, publication = null) {
    const dialog = root.querySelector('#pub-dialog');
    const authors = [...new Set(data.rows.map(r => r.author_name.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    dialog.setAttribute('aria-labelledby', 'pub-dialog-title');
    dialog.innerHTML = `<form id="pub-multiple-form"><div class="pub-dialog-head"><h2 id="pub-dialog-title">${publication ? 'Add authors to publication' : 'Add publication'}</h2><p>Enter the publication details once, then add each author and their affiliation.</p></div><div class="pub-form-grid">${fields.slice(0, 3).map(([key, label, max]) => `<label>${esc(label)}${key === 'publication_title' ? ' *' : ''}<textarea name="${key}" maxlength="${max}" rows="${key === 'publication_date' ? 1 : 2}" ${key === 'publication_title' ? 'required' : ''} ${publication ? 'readonly' : ''}>${esc(publication?.[key] || '')}</textarea></label>`).join('')}</div><datalist id="pub-author-options">${authors.map(name => `<option value="${esc(name)}"></option>`).join('')}</datalist><div id="pub-author-list" class="pub-author-list"></div><div class="pub-author-add"><button class="btn btn-outline" type="button" id="pub-add-author">+ Add another author</button></div><p class="pub-form-error" role="alert"></p><div class="pub-dialog-actions"><button class="btn btn-outline" type="button" id="pub-cancel">Cancel</button><button class="btn" type="submit">Save publication</button></div></form>`;
    const list = dialog.querySelector('#pub-author-list'), add = dialog.querySelector('#pub-add-author');
    function renumber() {
      const rows = [...list.querySelectorAll('[data-author-row]')];
      rows.forEach((section, index) => { section.querySelector('legend').textContent = `Author ${index + 1}`; section.querySelector('[data-remove-author]').hidden = rows.length === 1; section.querySelector('[data-remove-author]').setAttribute('aria-label', `Remove author ${index + 1}`); });
      add.disabled = rows.length >= 50;
    }
    function addAuthor() {
      if (list.children.length >= 50) return;
      const section = document.createElement('fieldset'); section.dataset.authorRow = ''; section.className = 'pub-author-row';
      section.innerHTML = `<legend>Author</legend><div class="pub-form-grid pub-author-grid">${fields.slice(3).map(([key,label,max]) => `<label>${esc(label)}${key === 'author_name' ? ' *' : ''}<input name="${key}" maxlength="${max}" ${key === 'author_name' ? 'list="pub-author-options" required autocomplete="off"' : ''}></label>`).join('')}</div><button class="btn btn-outline pub-remove-author" data-remove-author type="button">Remove author</button>`;
      list.append(section); renumber();
      section.querySelector('[name="author_name"]').addEventListener('change', event => {
        const matches = data.rows.filter(r => r.author_name === event.target.value.trim());
        if (!matches.length) return;
        ['school', 'college', 'department'].forEach(key => { const variants = [...new Set(matches.map(r => r[key]))]; const input = section.querySelector(`[name="${key}"]`); if (variants.length === 1 && !input.value.trim()) input.value = variants[0]; });
      });
    }
    addAuthor();
    add.addEventListener('click', () => { addAuthor(); list.lastElementChild.querySelector('[name="author_name"]').focus(); });
    list.addEventListener('click', event => { const button = event.target.closest('[data-remove-author]'); if (!button || list.children.length <= 1) return; button.closest('[data-author-row]').remove(); renumber(); });
    dialog.querySelector('#pub-cancel').onclick = () => dialog.close();
    dialog.querySelector('form').onsubmit = async event => {
      event.preventDefault(); const form = event.currentTarget, button = form.querySelector('[type="submit"]');
      const body = Object.fromEntries(fields.slice(0, 3).map(([key]) => [key, form.elements[key].value]));
      body.authors = [...list.querySelectorAll('[data-author-row]')].map(section => Object.fromEntries(fields.slice(3).map(([key]) => [key, section.querySelector(`[name="${key}"]`).value])));
      button.disabled = true;
      try { await request('save-publication', body); } catch (error) { form.querySelector('.pub-form-error').textContent = error.message; button.disabled = false; return; }
      dialog.close();
      try { data = await request('data'); onSave(); } catch (error) { alert('The publication was saved, but the list could not be refreshed. Reload the page to see it.'); }
    };
    dialog.showModal();
  }
  function edit(root, row = {}, onSave) {
    const dialog = root.querySelector('#pub-dialog');
    const authors = [...new Set(data.rows.map(r => r.author_name.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    dialog.setAttribute('aria-labelledby', 'pub-dialog-title');
    dialog.innerHTML = `<form id="pub-form"><div class="pub-dialog-head"><h2 id="pub-dialog-title">${row.id ? 'Edit author record' : 'Add author record'}</h2><p>Enter one record per author. Use the same title, date and venue for coauthors.</p><p>${row.id ? 'Changes to a venue, author, school, college or department replace that exact previous value in all publication records. A previously blank value changes only this record. Title and date changes affect only this record.' : 'Start typing an author name to select a saved author.'}</p></div><div class="pub-form-grid">${fields.map(([key,label,max]) => `<label>${esc(label)}${key === 'publication_title' ? ' *' : ''}${key === 'author_name' ? `<input name="author_name" list="pub-author-options" maxlength="${max}" value="${esc(row[key] || '')}" autocomplete="off"><datalist id="pub-author-options">${authors.map(name => `<option value="${esc(name)}"></option>`).join('')}</datalist>` : `<textarea name="${key}" maxlength="${max}" rows="${key === 'publication_title' || key === 'publication_venue' ? 2 : 1}" ${key === 'publication_title' ? 'required' : ''}>${esc(row[key] || '')}</textarea>`}</label>`).join('')}</div><p class="pub-change-preview" aria-live="polite"></p><p class="pub-form-error" role="alert"></p><div class="pub-dialog-actions"><button class="btn btn-outline" type="button" id="pub-cancel">Cancel</button><button class="btn" type="submit">Save record</button></div></form>`;
    const sharedFields = fields.slice(2);
    if (row.id) {
      const preview = () => {
        const changes = sharedFields.filter(([key]) => row[key] && dialog.querySelector(`[name="${key}"]`).value.trim() !== row[key]);
        dialog.querySelector('.pub-change-preview').textContent = changes.length ? 'Matching records to update: ' + changes.map(([key, label]) => `${label}: ${data.rows.filter(r => r[key] === row[key]).length}`).join('; ') + '.' : '';
      };
      sharedFields.forEach(([key]) => dialog.querySelector(`[name="${key}"]`).addEventListener('input', preview));
    }
    if (!row.id) dialog.querySelector('[name="author_name"]').addEventListener('change', event => {
      const matches = data.rows.filter(r => r.author_name === event.target.value.trim());
      if (!matches.length) return;
      ['school', 'college', 'department'].forEach(key => {
        const variants = [...new Set(matches.map(r => r[key]))];
        const input = dialog.querySelector(`[name="${key}"]`);
        if (variants.length === 1 && !input.value.trim()) input.value = variants[0];
      });
    });
    dialog.querySelector('#pub-cancel').onclick = () => dialog.close();
    dialog.querySelector('form').onsubmit = async event => {
      event.preventDefault(); const form = event.currentTarget, button = form.querySelector('[type=submit]');
      const body = Object.fromEntries(new FormData(form)); body.id = Number(row.id || 0); if (row.id) body.original_values = Object.fromEntries(sharedFields.map(([key]) => [key, row[key]])); button.disabled = true;
      try { await request('save', body); data = await request('data'); dialog.close(); onSave(); }
      catch (error) { form.querySelector('.pub-form-error').textContent = error.message; button.disabled = false; }
    };
    dialog.showModal();
  }
  function drawRankings(root, year = '') {
    const years = [...new Set(data.rows.map(r => publicationYear(r.publication_date)).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
    const list = rankings(year ? data.rows.filter(r => publicationYear(r.publication_date) === year) : data.rows);
    root.innerHTML = header('Department Rankings', 'Compare MSU-GSC departments by their Scopus-indexed publications.', '<a class="btn" href="#/publications">View publications</a>') + `<form class="card pub-year-filter" id="pub-year-form"><label for="pub-ranking-year">Publication year</label><select id="pub-ranking-year"><option value="">All years</option>${years.map(y => `<option value="${y}" ${year === y ? 'selected' : ''}>${y}</option>`).join('')}</select><button class="btn" type="submit">Apply year</button></form><div id="pub-year-results" aria-live="polite">${list.length ? `<div class="card pub-table-scroll" role="region" aria-label="Department rankings table, scroll horizontally to see all columns" tabindex="0"><table class="pub-table pub-rankings-table"><caption class="pub-visually-hidden">Department rankings by number of publications${year ? ' in ' + year : ''}</caption><thead><tr><th scope="col">College</th><th scope="col">Department</th><th scope="col">Number of Publications</th><th scope="col">Ranking</th></tr></thead><tbody>${list.map(r => `<tr><td>${esc(r.college)}</td><th scope="row">${esc(r.department)}</th><td>${r.titles.size}</td><td>${r.rank}</td></tr>`).join('')}</tbody></table></div>` : `<div class="card pub-empty">No eligible department records${year ? ' for ' + year : ' yet'}.</div>`}</div>`;
    root.querySelector('#pub-year-form').addEventListener('submit', event => { event.preventDefault(); const selected = root.querySelector('#pub-ranking-year').value; drawRankings(root, selected); root.querySelector('#pub-ranking-year').focus(); });
    prepareTableScroll(root);
  }
  function drawFacultyRankings(root) {
    const list = facultyRankings(data.rows);
    root.innerHTML = header('Faculty Rankings', 'Compare MSU-GSC authors by their Scopus-indexed publications.', '<a class="btn" href="#/publications">View publications</a>') + `<p class="muted small">Based on author affiliations in publication records; faculty status is not recorded separately. Ties share a rank.</p>${list.length ? `<div class="card pub-table-scroll" role="region" aria-label="Faculty rankings table, scroll horizontally to see all columns" tabindex="0"><table class="pub-table pub-faculty-table"><caption class="pub-visually-hidden">Faculty rankings by number of publications</caption><thead><tr><th scope="col">Faculty</th><th scope="col">College/Domain</th><th scope="col">Department</th><th scope="col">Number of Publications</th><th scope="col">Ranking</th></tr></thead><tbody>${list.map(r => `<tr><th scope="row">${esc(r.name)}</th><td>${r.colleges.size ? [...r.colleges].map(esc).join('<br>') : '—'}</td><td>${r.departments.size ? [...r.departments].map(esc).join('<br>') : '—'}</td><td>${r.titles.size}</td><td>${r.rank}</td></tr>`).join('')}</tbody></table></div>` : '<div class="card pub-empty">No eligible MSU-GSC author records yet.</div>'}`;
    prepareTableScroll(root);
  }
  async function open(root, page) {
    const route = {publications: '#/publications', department: '#/publication-rankings', faculty: '#/faculty-rankings'}[page];
    const current = ++token; root.innerHTML = '<div class="card" role="status">Loading publication records…</div>';
    try { data = await request('data'); if (current !== token || !root.isConnected || location.hash.split('?')[0] !== route) return; if (page === 'faculty') drawFacultyRankings(root); else if (page === 'department') drawRankings(root); else drawList(root); }
    catch (error) { if (current !== token || location.hash.split('?')[0] !== route) return; root.innerHTML = `${header('Publications unavailable', 'The records could not be loaded.')}<div class="card pub-empty"><p role="alert">${esc(error.message)}</p><button class="btn" id="pub-retry">Try again</button></div>`; root.querySelector('#pub-retry').onclick = () => open(root, page); }
  }
  O.views.publications = root => open(root, 'publications');
  O.views['publication-rankings'] = root => open(root, 'department');
  O.views['faculty-rankings'] = root => open(root, 'faculty');
})();
