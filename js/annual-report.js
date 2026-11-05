/* Annual Reports library; documents remain in Google Drive. */
(function () {
  'use strict';
  const O = window.OME, esc = O.esc;
  const DEFAULT_DRIVE_MANAGER = 'https://script.google.com/a/macros/msugensan.edu.ph/s/AKfycbwMJMM3lbQmIGi49M7vchZetDvGHlfrA_6QlchUG543k6WOff3ZNeM9XsruGVmWP0FV/exec';
  let active = 0;
  let cleanupCatalog = () => {};
  async function request(action, payload) {
    const response = await fetch('annual_reports_api.php?action=' + action, {method:payload ? 'POST' : 'GET', credentials:'same-origin', cache:'no-store', headers:payload ? {'Content-Type':'application/json'} : {}, body:payload ? JSON.stringify(payload) : undefined});
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.error || 'Could not load annual reports.');
    return json;
  }
  function driveId(value) {
    try {
      const url = new URL(value.trim());
      if (!['drive.google.com','docs.google.com'].includes(url.hostname) || url.protocol !== 'https:') return '';
      const match = url.pathname.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
      const id = match ? match[1] : url.searchParams.get('id');
      return /^[A-Za-z0-9_-]{10,200}$/.test(id || '') ? id : '';
    } catch (_) { return ''; }
  }
  function driveFile(id, key) { return `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media&key=${encodeURIComponent(key)}`; }
  function managerUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'script.google.com' && /^(?:\/macros|\/a\/macros\/msugensan\.edu\.ph)\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname) ? url : null;
    } catch (_) { return null; }
  }
  function driveManager(root, data, refresh, acceptCatalog) {
    const url = managerUrl(data.driveManagerUrl || DEFAULT_DRIVE_MANAGER);
    if (!url) {
      root.querySelector('.ar-feedback').textContent = 'The Drive manager is not configured yet. Deploy the Apps Script and add its web app URL to the site configuration.';
      return;
    }
    const nonce = [...crypto.getRandomValues(new Uint8Array(16))].map(n => n.toString(16).padStart(2, '0')).join('');
    url.searchParams.set('origin', location.origin); url.searchParams.set('token', nonce);
    const dialog = document.createElement('dialog'); dialog.className = 'kpi-dialog ar-manager-dialog'; dialog.setAttribute('aria-label', 'Upload an annual report');
    dialog.innerHTML = '<div class="ar-manager-layout"><header><h2>Upload annual report</h2><button type="button" class="kpi-dialog-close" aria-label="Close file manager">×</button></header><p class="ar-manager-note">Use a Google account with access to the reports folder. <a target="_blank" rel="noopener noreferrer">Sign in to Google</a></p><iframe title="Google Drive report manager"></iframe></div>';
    dialog.querySelector('iframe').src = url.href; dialog.querySelector('a').href = url.href;
    const previous = document.activeElement; document.body.append(dialog);
    const message = async event => {
      const trusted = event.origin === 'https://script.google.com' || /^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/i.test(event.origin);
      const msg = event.data;
      if (!trusted || !msg || msg.channel !== 'ome-annual-drive' || msg.token !== nonce) return;
      if (msg.type === 'catalog') { acceptCatalog(msg.items); return; }
      if (!/^[A-Za-z0-9_-]{10,200}$/.test(msg.fileId || '')) return;
      try {
        if (msg.type === 'uploaded') {
          if (msg.fileType !== 'pdf' || typeof msg.title !== 'string' || !msg.title.trim() || msg.title.length > 255 || (msg.year && !/^(19|20|21)\d{2}$/.test(String(msg.year)))) return;
          if (!data.rows.some(row => row.drive_file_id === msg.fileId)) await request('save', {id:0, title:msg.title.trim(), report_year:msg.year ? Number(msg.year) : null, file_type:msg.fileType, drive_file_id:msg.fileId});
          await refresh('File uploaded and added to the library.');
        } else if (msg.type === 'deleted') {
          for (const row of data.rows.filter(row => row.drive_file_id === msg.fileId)) await request('delete', {id:Number(row.id)});
          await refresh('File moved to Google Drive trash and removed from the library.');
        }
      } catch (error) { root.querySelector('.ar-feedback').textContent = `Drive changed, but the library could not be updated: ${error.message} Close the manager and add or remove the entry manually.`; }
    };
    window.addEventListener('message', message);
    dialog.addEventListener('close', () => { window.removeEventListener('message', message); dialog.remove(); if (previous?.isConnected) previous.focus({preventScroll:true}); });
    dialog.querySelector('button').onclick = () => dialog.close(); dialog.showModal();
  }
  function openDrivePreview(item) {
    const dialog = document.createElement('dialog'); dialog.className = 'ar-reader'; dialog.setAttribute('aria-label', 'Reader: ' + item.title);
    dialog.innerHTML = '<div class="ar-reader-layout ar-reader-drive"><header class="ar-reader-head"><strong></strong><button type="button" class="ar-reader-close" aria-label="Close reader">×</button></header><iframe title="PDF reader" allow="fullscreen"></iframe></div>';
    dialog.querySelector('strong').textContent = item.title;
    dialog.querySelector('iframe').src = `https://drive.google.com/file/d/${encodeURIComponent(item.drive_file_id)}/preview`;
    const previous = document.activeElement; document.body.append(dialog);
    dialog.querySelector('.ar-reader-close').onclick = () => dialog.close();
    dialog.addEventListener('close', () => { dialog.remove(); if (previous?.isConnected) previous.focus({preventScroll:true}); });
    dialog.showModal();
  }
  function editDialog(item, onSaved) {
    const dialog = document.createElement('dialog'); dialog.className = 'kpi-dialog ar-edit-dialog';
    dialog.innerHTML = `<form class="kpi-dialog-form"><header><h2>${item ? 'Edit report' : 'Add report'}</h2><button type="button" class="kpi-dialog-close" aria-label="Close dialog">×</button></header><div class="kpi-dialog-body"><p>Upload your PDF to Google Drive first. Set access to “Anyone with the link”, then paste its share link below.</p><label>Report title <input name="title" required maxlength="255" value="${esc(item?.title || '')}"></label><label>Year <input name="year" type="number" min="1900" max="2100" value="${esc(item?.report_year || '')}"></label><input name="type" type="hidden" value="pdf"><label>Google Drive share link <input name="link" type="url" required placeholder="https://drive.google.com/file/d/…" value="${item ? `https://drive.google.com/file/d/${esc(item.drive_file_id)}/view` : ''}"></label><p class="ar-form-error" role="alert" hidden></p></div><footer><button type="button" class="btn subtle ar-cancel">Cancel</button><button class="btn" type="submit">Save report</button></footer></form>`;
    const previous = document.activeElement; document.body.append(dialog);
    const form = dialog.querySelector('form'); form.elements.type.value = 'pdf';
    dialog.querySelector('.kpi-dialog-close').onclick = dialog.querySelector('.ar-cancel').onclick = () => dialog.close();
    dialog.addEventListener('close', () => { dialog.remove(); if (previous?.isConnected) previous.focus({preventScroll:true}); });
    form.onsubmit = async event => {
      event.preventDefault(); const error = dialog.querySelector('.ar-form-error'), button = form.querySelector('[type=submit]');
      const id = driveId(form.elements.link.value); error.hidden = true;
      if (!id) { error.textContent = 'Enter a valid Google Drive file share link.'; error.hidden = false; return; }
      button.disabled = true;
      try { await request('save', {id:Number(item?.id || 0),title:form.elements.title.value.trim(),report_year:form.elements.year.value ? Number(form.elements.year.value) : null,file_type:form.elements.type.value,drive_file_id:id}); dialog.close(); await onSaved(); }
      catch (cause) { error.textContent = cause.message; error.hidden = false; button.disabled = false; }
    };
    dialog.showModal();
  }
  async function annualReport(root) {
    cleanupCatalog();
    const token = ++active;
    root.innerHTML = '<div class="card" role="status">Loading annual reports…</div>';
    let data;
    try { data = await request('data'); }
    catch (error) { if (token === active && root.isConnected) root.innerHTML = `<div class="card"><h2>Annual reports unavailable</h2><p role="alert">${esc(error.message)}</p></div>`; return; }
    if (token !== active || !root.isConnected || location.hash.split('?')[0] !== '#/annual-report') return;
    root.innerHTML = `<div class="section-head ar-hero"><div><span class="ar-eyebrow">Office of Monitoring and Evaluation · Library</span><h2>Annual Reports</h2><p>Explore the University's annual reports and read them here.</p></div>${data.canEdit ? '<div class="ar-hero-actions"><button type="button" class="btn" id="ar-manager">+ Upload PDF</button></div>' : ''}</div><p class="ar-catalog-status" role="status" aria-live="polite"></p><p class="ar-feedback" role="status" aria-live="polite"></p><div id="ar-collection"><section class="ar-feature" aria-label="Latest annual report" hidden></section><section class="ar-shelf" aria-label="Annual report collection"><h3 class="ar-previous-heading" hidden>Previous reports</h3><div class="ar-grid"></div></section></div>`;
    const grid = root.querySelector('.ar-grid');
    const collection = root.querySelector('#ar-collection'), feature = root.querySelector('.ar-feature'), previousHeading = root.querySelector('.ar-previous-heading');
    const status = root.querySelector('.ar-catalog-status');
    let driveFiles = null, visibleRows = [], catalogFrame, timeout, catalogState = 'loading';
    function reportYear(item) {
      const explicit = Number(item.report_year);
      if (Number.isInteger(explicit) && explicit >= 1900 && explicit <= 2100) return explicit;
      for (const text of [item.source_name, item.title]) {
        const years = [...new Set(String(text || '').match(/\b(?:19|20)\d{2}\b/g) || [])];
        if (years.length === 1) return Number(years[0]);
      }
      return 0;
    }
    function catalogRows() {
      const rows = driveFiles === null ? data.rows.filter(row => row.file_type === 'pdf') : driveFiles.map(file => {
        const saved = data.rows.find(row => row.file_type === 'pdf' && row.drive_file_id === file.id);
        if (saved) return {...saved, source_name:file.name};
        const title = file.name.replace(/\.pdf$/i, '').trim();
        const years = [...new Set(title.match(/\b(?:19|20)\d{2}\b/g) || [])];
        return {id:0, title, report_year:years.length === 1 ? years[0] : null, file_type:'pdf', drive_file_id:file.id};
      });
      return rows.sort((a, b) => reportYear(b) - reportYear(a) || a.title.localeCompare(b.title) || a.drive_file_id.localeCompare(b.drive_file_id));
    }
    function show() {
      grid.setAttribute('aria-busy', catalogState === 'loading' ? 'true' : 'false');
      if (catalogState === 'loading') {
        visibleRows = [];
        feature.hidden = true; feature.innerHTML = ''; previousHeading.hidden = true; root.querySelector('.ar-shelf').hidden = false;
        grid.innerHTML = `<span class="sr-only" role="status">Loading annual reports from Google Drive…</span>${Array.from({length:5}, () => '<div class="ar-book-skeleton" aria-hidden="true"><div class="ar-skeleton-cover"></div><div class="ar-skeleton-line"></div><div class="ar-skeleton-line short"></div></div>').join('')}`;
        return;
      }
      const rows = visibleRows = catalogRows();
      const latest = rows.length && reportYear(rows[0]) ? rows[0] : null;
      const rest = latest ? rows.slice(1) : rows;
      const cover = item => `<span class="ar-cover" data-cover="${esc(item.drive_file_id)}"><span class="ar-cover-fallback"><span>ANNUAL REPORT</span><strong>${esc(reportYear(item) || '')}</strong><span>${esc(item.title)}</span></span></span>`;
      const actions = item => data.canEdit ? `<div class="ar-book-actions"><button type="button" data-edit="${esc(item.drive_file_id)}">Edit details</button>${driveFiles === null && item.id ? `<button type="button" data-delete="${esc(item.drive_file_id)}">Remove entry</button>` : ''}</div>` : '';
      feature.hidden = !latest;
      feature.innerHTML = latest ? `<button type="button" class="ar-feature-cover" data-open="${esc(latest.drive_file_id)}" aria-label="Read ${esc(latest.title)}">${cover(latest)}</button><div class="ar-feature-content"><span class="ar-feature-label">Latest report</span><h3>${esc(latest.title)}</h3><p>Report year · ${esc(reportYear(latest))}</p><button type="button" class="ar-feature-open" data-open="${esc(latest.drive_file_id)}">Open report <span aria-hidden="true">→</span></button>${actions(latest)}</div>` : '';
      previousHeading.hidden = !latest || !rest.length;
      root.querySelector('.ar-shelf').hidden = !!latest && !rest.length;
      grid.innerHTML = rest.length ? rest.map(item => `<article class="ar-book"><button type="button" class="ar-open" data-open="${esc(item.drive_file_id)}" aria-label="Read ${esc(item.title)}">${cover(item)}<span class="ar-book-info"><span class="ar-book-title">${esc(item.title)}</span><span class="ar-book-meta">${esc(reportYear(item) || 'Year not specified')}</span><span class="ar-read-label" aria-hidden="true">Read report <span>↗</span></span></span></button>${actions(item)}</article>`).join('') : latest ? '' : `<div class="card ar-empty">${catalogState === 'failed' ? 'No saved reports available.' : 'No reports available yet.'}</div>`;
      if (data.driveApiKey && window.OMEAnnualReader) rows.forEach(item => OMEAnnualReader.cover(driveFile(item.drive_file_id, data.driveApiKey), item.file_type, collection.querySelector(`[data-cover="${item.drive_file_id}"]`)));
      else rows.forEach(item => {
        const target = collection.querySelector(`[data-cover="${item.drive_file_id}"]`), img = document.createElement('img');
        img.alt = ''; img.onload = () => { if (target.isConnected) target.replaceChildren(img); };
        img.src = `https://drive.google.com/thumbnail?id=${encodeURIComponent(item.drive_file_id)}&sz=w400`;
      });
    }
    const reload = async (notice = 'Report saved.') => { const next = await request('data'); Object.assign(data, next); if (root.isConnected) { if (catalogFrame) catalogFrame.src = catalogFrame.src; show(); root.querySelector('.ar-feedback').textContent = notice; } };
    root.querySelector('#ar-manager')?.addEventListener('click', () => driveManager(root, data, reload, acceptCatalog));
    collection.onclick = async event => {
      const button = event.target.closest('button'); if (!button) return;
      const item = visibleRows.find(row => row.drive_file_id === (button.dataset.open || button.dataset.edit || button.dataset.delete)); if (!item) return;
      if (button.dataset.open) {
        if (!data.driveApiKey && item.file_type === 'pdf') return openDrivePreview(item);
        OMEAnnualReader.open({url:driveFile(item.drive_file_id, data.driveApiKey),type:item.file_type,title:item.title});
      } else if (button.dataset.edit) editDialog(item, reload);
      else if (button.dataset.delete && confirm(`Remove “${item.title}” from the library? The Google Drive file will not be deleted.`)) {
        try { await request('delete', {id:Number(item.id)}); data = await request('data'); show(); root.querySelector('.ar-feedback').textContent = 'Report removed from the library.'; }
        catch (error) { root.querySelector('.ar-feedback').textContent = error.message; }
      }
    };
    show();
    const catalogUrl = managerUrl(data.driveManagerUrl || DEFAULT_DRIVE_MANAGER);
    if (!catalogUrl) { catalogState = 'failed'; status.textContent = 'Google Drive is not configured; showing saved report entries.'; show(); return; }
    const nonce = [...crypto.getRandomValues(new Uint8Array(16))].map(n => n.toString(16).padStart(2, '0')).join('');
    catalogUrl.searchParams.set('mode', 'catalog'); catalogUrl.searchParams.set('origin', location.origin); catalogUrl.searchParams.set('token', nonce);
    catalogFrame = document.createElement('iframe'); catalogFrame.hidden = true; catalogFrame.title = 'Google Drive connection'; catalogFrame.src = catalogUrl.href; root.append(catalogFrame);
    function failed(message) {
      driveFiles = null; catalogState = 'failed'; show();
      status.replaceChildren(document.createTextNode(message + ' '));
      const link = document.createElement('a'); link.href = catalogUrl.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Sign in to Google'; status.append(link);
      status.append(document.createTextNode(', then '));
      const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'ar-catalog-retry'; retry.textContent = 'reconnect'; retry.onclick = () => { catalogState = 'loading'; show(); status.textContent = 'Connecting to Google Drive…'; catalogFrame.src = catalogUrl.href; clearTimeout(timeout); timeout = setTimeout(() => failed('Could not connect to the Drive folder. Showing saved report entries.'), 15000); }; status.append(retry, document.createTextNode('.'));
    }
    function acceptCatalog(items) {
      if (!Array.isArray(items) || items.length > 10000) return;
      const seen = new Set();
      driveFiles = items.filter(file => file && /^[A-Za-z0-9_-]{10,200}$/.test(file.id || '') && typeof file.name === 'string' && file.name.length <= 255 && /\.pdf$/i.test(file.name) && !seen.has(file.id) && seen.add(file.id));
      catalogState = 'ready'; clearTimeout(timeout); status.textContent = ''; show();
    }
    function receive(event) {
      const trusted = event.origin === 'https://script.google.com' || /^https:\/\/[a-z0-9-]+\.googleusercontent\.com$/i.test(event.origin);
      const msg = event.data;
      if (!trusted || !msg || msg.channel !== 'ome-annual-catalog' || msg.token !== nonce) return;
      if (msg.type === 'error') { clearTimeout(timeout); failed('Could not access the Drive folder. Showing saved report entries.'); return; }
      if (msg.type !== 'catalog' || !Array.isArray(msg.items) || msg.items.length > 10000) return;
      acceptCatalog(msg.items);
    }
    window.addEventListener('message', receive);
    const onRoute = () => { if (location.hash.split('?')[0] !== '#/annual-report') cleanupCatalog(); };
    window.addEventListener('hashchange', onRoute);
    timeout = setTimeout(() => failed('Could not connect to the Drive folder. Showing saved report entries.'), 15000);
    cleanupCatalog = () => { clearTimeout(timeout); window.removeEventListener('message', receive); window.removeEventListener('hashchange', onRoute); catalogFrame?.remove(); cleanupCatalog = () => {}; };
  }
  O.views['annual-report'] = annualReport;
})();
