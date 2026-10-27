/* Survey response management for signed-in OME personnel. */
(function () {
  'use strict';
  const O = window.OME;
  const { Store, SQD, summarize, groupBy, periodsOf, periodKey, periodLabel, importForms, fmt, esc } = O;
  let tab = 'import';
  let pending = null; // parsed import awaiting confirmation

  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.append(t); setTimeout(() => t.remove(), 2600);
  }

  function authed() { return Store.authenticated; }

  function render(el) {
    if (!authed()) return login(el);
    el.innerHTML = `
      <div class="section-head"><div><h2>Survey Response Management</h2><p class="muted">For authorized OME personnel only.</p></div>
        <button class="btn subtle" id="logout">Sign out</button></div>
      <div class="subtabs">${[['import', 'Import survey results'], ['respondents', 'Respondent details'], ['validate', 'Validate response counts'], ['categories', 'Manage reporting categories'], ['findings', 'Upload summarized findings']]
        .map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'active' : ''}">${l}</button>`).join('')}</div>
      <div id="pane"></div>`;
    el.querySelector('#logout').onclick = async () => {
      try { await Store.logout(); location.hash = '#/login'; location.reload(); } catch (error) { toast(error.message); }
    };
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(el); });
    const pane = el.querySelector('#pane');
    ({ import: importPane, respondents: respondentsPane, validate: validatePane, categories: categoriesPane, findings: findingsPane })[tab](pane, () => render(el));
  }

  function login(el) {
    el.innerHTML = '<div class="card login"><h2>Admin sign-in required</h2><p>Sign in with an OME staff account to manage survey data.</p><a class="btn" href="#/login">Sign in</a></div>';
  }

  async function respondentsPane(pane) {
    pane.innerHTML = '<div class="card"><h3>Respondent details</h3><p class="small muted">Loading details…</p></div>';
    try {
      const { respondents } = await Store.respondentDetails();
      if (!pane.isConnected) return;
      pane.innerHTML = `<div class="card"><h3>Respondent details</h3>
        <p class="small muted">Only signed-in OME personnel can view these details. Historical imported responses have no saved personal details.</p>
        <p class="small">${respondents.length} site submission${respondents.length === 1 ? '' : 's'} with saved details</p>
        ${respondents.length ? `<div class="btn-row"><button class="btn subtle" id="exportRespondents">Export respondent details (CSV)</button></div>
        <div class="table-wrap"><table><thead><tr><th>Reference</th><th>Date</th><th>Legal name</th><th>Contact</th><th>Email</th><th>Office</th><th>Unit</th><th>Service</th><th>Staff</th></tr></thead><tbody>
          ${respondents.map(r => `<tr><td>${esc(r.id)}</td><td>${esc(r.date)}</td><td>${esc(r.legalName)}</td><td>${esc(r.contact)}</td><td>${esc(r.email)}</td><td>${esc(r.office)}</td><td>${esc(r.unit)}</td><td>${esc(r.service)}</td><td>${esc(r.staff)}</td></tr>`).join('')}
        </tbody></table></div>` : '<p class="muted">No new site submissions yet.</p>'}</div>`;
      const exportButton = pane.querySelector('#exportRespondents');
      if (exportButton) exportButton.onclick = () => {
        const columns = ['id', 'date', 'legalName', 'contact', 'email', 'office', 'unit', 'service', 'staff'];
        const safeCell = value => /^[=+\-@\t\r]/.test(String(value || '')) ? "'" + value : value;
        O.downloadText('respondent-details.csv', O.toCSV([
          ['Reference', 'Date', 'Legal name', 'Contact', 'Email', 'Office', 'Unit', 'Service', 'Staff'],
          ...respondents.map(r => columns.map(c => safeCell(r[c] || '')))
        ]));
      };
    } catch (error) {
      if (pane.isConnected) pane.innerHTML = `<div class="card"><h3>Respondent details</h3><p class="error-text">${esc(error.message)}</p></div>`;
    }
  }

  /* ---------- Import ---------- */
  function importPane(pane, rerender) {
    const meta = Store.importMeta();
    pane.innerHTML = `<div class="grid g2">
      <div class="card"><h3>Import survey results</h3>
        <p class="small">Upload the CSV from the Google Sheet (<i>File → Download → Comma-separated values</i>) or from Google Forms (<i>Responses → Download responses</i>).
        Names, contact numbers, e-mails and staff names are removed during import. Only the anonymized answers are kept.</p>
        <div class="dropzone" id="dz"><p><b>Drop the CSV file here</b> or</p><label class="btn ghost">Choose file<input type="file" accept=".csv,text/csv" id="file" hidden></label></div>
        <div id="preview" style="margin-top:14px"></div>
      </div>
      <div class="card"><h3>Current dataset</h3>
        <table><tbody>
          <tr><td>Source</td><td>${esc(meta.source)}${meta.builtIn ? ' <span class="pill neutral">built-in</span>' : ''}</td></tr>
          <tr><td>${meta.builtIn ? 'Exported' : 'Imported'}</td><td>${esc(meta.exported || meta.importedAt || '')}</td></tr>
          <tr><td>Responses from sheet</td><td>${fmt.num(Store.baseRows().length)}</td></tr>
          <tr><td>Submitted on this site</td><td>${fmt.num(Store.submissions().length)}</td></tr>
        </tbody></table>
        <div class="btn-row" style="margin-top:14px">
          <button class="btn subtle" id="exportSubs" ${Store.submissions().length ? '' : 'disabled'}>Export site submissions (CSV)</button>
        </div>
      </div></div>`;

    const dz = pane.querySelector('#dz'), file = pane.querySelector('#file');
    const read = f => { const r = new FileReader(); r.onload = () => preview(pane, f.name, r.result, rerender); r.readAsText(f); };
    file.onchange = () => file.files[0] && read(file.files[0]);
    dz.ondragover = e => { e.preventDefault(); dz.classList.add('drag'); };
    dz.ondragleave = () => dz.classList.remove('drag');
    dz.ondrop = e => { e.preventDefault(); dz.classList.remove('drag'); e.dataTransfer.files[0] && read(e.dataTransfer.files[0]); };
    pane.querySelector('#exportSubs').onclick = () => {
      const head = ['Reference', 'Date', 'Office', 'Unit', 'Service', 'Gender', 'Client type', 'CC1', 'CC2', 'CC3'].concat(SQD.map(q => q.code)).concat(['Comment']);
      const L = Store.lists;
      const rows = Store.submissions().map(s => [s.id, s.date, s.office, s.unit, s.service || '', s.gender, s.type, L.cc1[s.cc1] || '', L.cc2[s.cc2] || '', L.cc3[s.cc3] || ''].concat(s.sqd.map(v => v || 'N/A')).concat([s.comment]));
      O.downloadText('site-submissions.csv', O.toCSV([head].concat(rows)));
    };
  }

  function preview(pane, name, text, rerender) {
    const res = importForms(text);
    pending = res;
    const box = pane.querySelector('#preview');
    if (res.issues.wrongColumns) {
      box.innerHTML = `<div class="callout">This file has ${res.header.length} columns. The Client Satisfaction Survey export has 42 (Timestamp … Comments). Check that you exported the right sheet.</div>`;
      return;
    }
    const dates = res.rows.map(r => r.date).sort();
    const i = res.issues;
    const warn = (n, label) => n ? `<li><span class="pill warn">${n}</span> ${label}</li>` : '';
    box.innerHTML = `<h4>${esc(name)}</h4>
      <table><tbody>
        <tr><td>Rows in file</td><td class="num">${fmt.num(res.total)}</td></tr>
        <tr><td>Valid responses</td><td class="num"><b>${fmt.num(res.rows.length)}</b></td></tr>
        <tr><td>Date range</td><td class="num">${dates[0] || '–'} to ${dates[dates.length - 1] || '–'}</td></tr>
      </tbody></table>
      <ul class="issue-list small" style="margin-top:10px">${warn(i.duplicates, 'duplicate submissions skipped (same timestamp, e-mail and office)') + warn(i.badDate, 'rows with an unreadable timestamp skipped') +
        warn(i.routed, 'responses with an extra sub-office answer from another section (form routing; ignored)') + warn(i.missingRatings, 'responses with one or more unanswered ratings (counted as N/A)') + warn(i.outOfRange, 'responses with a rating outside 1–5 (counted as N/A)') +
        (i.unknownOffice.length ? `<li><span class="pill warn">${i.unknownOffice.length}</span> office name(s) not in the current list: ${i.unknownOffice.map(esc).join('; ')}</li>` : '') || '<li><span class="pill good">OK</span> No issues found</li>'}</ul>
      <div class="btn-row" style="margin-top:10px"><button class="btn" id="confirmImport" ${res.rows.length ? '' : 'disabled'}>Replace dataset with these ${fmt.num(res.rows.length)} responses</button></div>`;
    box.querySelector('#confirmImport').onclick = async () => {
      const button = box.querySelector('#confirmImport'); button.disabled = true;
      try {
        await Store.replaceImported(pending.rows, { source: name });
        toast('Import complete'); pending = null; rerender();
      } catch (error) { toast(error.message); button.disabled = false; }
    };
  }

  /* ---------- Validate ---------- */
  function validatePane(pane) {
    const rows = Store.all();
    const pt = Store.settings.periodType;
    const periods = periodsOf(rows, pt);
    const offices = [...new Set(rows.map(r => r.office))].sort();
    const served = Store.clientsServed();

    const incomplete = rows.filter(r => r.sqd.some(v => !v)).length;
    const routed = rows.filter(r => r.routed);
    const noUnit = rows.filter(r => !r.unit && (Store.hierarchy[r.originalOffice || r.office] || []).length);
    const noCC = rows.filter(r => r.cc1 < 0).length;

    pane.innerHTML = `
      <div class="grid g3">
        <div class="card kpi"><div class="label">Total responses</div><div class="value">${fmt.num(rows.length)}</div><div class="foot">${periods.length} ${pt}s · ${offices.length} offices</div></div>
        <div class="card kpi"><div class="label">With N/A or blank ratings</div><div class="value">${fmt.num(incomplete)}</div><div class="foot">Excluded item by item from scores</div></div>
        <div class="card kpi"><div class="label">Form routing issues</div><div class="value">${fmt.num(routed.length)}</div><div class="foot">Also answered another office's section</div></div>
      </div>
      ${routed.length ? `<div class="callout" style="margin-top:16px"><b>Check the Google Form's section routing.</b> ${routed.length} clients were shown a second office's sub-office question after answering their own
        (most from ${[...groupBy(routed, r => r.originalOffice || r.office)].sort((a, b) => b[1].length - a[1].length).slice(0, 3).map(([k, v]) => `${esc(k)} (${v.length})`).join(', ')}).
        In the Google Form, these sub-office options continue to the next section instead of jumping to <i>Service Quality</i>: every option under the Institute of Islamic, Arabic, and International Studies and under the OVC for Research, Extension, and Innovation;
        Procurement Management Office, Accounting Office and Business Income Generating Office (OVC for Administration and Finance); and Civil Security Services (Office of the Chancellor).
        These responses are still counted under the domain office the client chose; the extra answer is ignored.</div>` : ''}
      ${noUnit.length ? `<p class="small muted">${noUnit.length} responses chose a domain office but no sub-office or department. They are reported as “office-level / not specified”.</p>` : ''}
      ${noCC ? `<p class="small muted">${noCC} responses have no CC1 answer.</p>` : ''}
      <div class="card" style="margin-top:16px"><h3>Responses by office and ${pt}</h3>
        <p class="small muted">Type the number of clients each office served in a period (from its logbook or transaction records) to compute the response rate. Leave blank if not tracked.</p>
        <div class="table-wrap"><table id="vt"><thead><tr><th>Office</th>${periods.map(p => `<th class="num">${periodLabel(p)}</th>`).join('')}<th class="num">Total</th></tr></thead><tbody>
        ${offices.map(o => {
          const rs = rows.filter(r => r.office === o);
          return `<tr><td>${esc(o)}</td>${periods.map(p => {
            const n = rs.filter(r => periodKey(r.date, pt) === p).length, key = o + '||' + p, sv = served[key];
            return `<td class="num"><b>${n || '·'}</b>${sv ? `<div class="small ${n / sv < .1 ? 'delta-down' : 'muted'}">${(n / sv * 100).toFixed(0)}% of ${sv}</div>` : ''}
              <input type="number" min="0" placeholder="served" data-k="${esc(key)}" value="${sv || ''}" style="width:78px;margin-top:3px;font-size:.78rem;padding:3px 6px" aria-label="Clients served by ${esc(o)} in ${periodLabel(p)}"></td>`;
          }).join('')}<td class="num"><b>${rs.length}</b></td></tr>`;
        }).join('')}
        <tr class="total"><td>Total</td>${periods.map(p => `<td class="num">${rows.filter(r => periodKey(r.date, pt) === p).length}</td>`).join('')}<td class="num">${rows.length}</td></tr>
        </tbody></table></div></div>`;
    pane.querySelectorAll('input[data-k]').forEach(i => i.onchange = async () => {
      try { await Store.setServed(i.dataset.k, +i.value || 0); validatePane(pane); toast('Saved'); }
      catch (error) { toast(error.message); }
    });
  }

  /* ---------- Categories ---------- */
  function categoriesPane(pane, rerender) {
    const s = Store.settings;
    const offices = [...new Set(Store.baseRows().concat(Store.submissions()).map(r => r.office))].sort();
    pane.innerHTML = `<div class="grid g2">
      <div class="card"><h3>Reporting periods and targets</h3>
        <div class="field"><label for="pt">Reporting period</label><select id="pt"><option value="month">Monthly</option><option value="quarter">Quarterly</option><option value="year">Annual</option></select></div>
        <div class="field"><label for="tg">Satisfaction target (% Agree / Strongly Agree)</label><input type="number" id="tg" min="0" max="100" value="${s.target}"></div>
        <div class="field"><label for="mr">Minimum responses before an office is ranked</label><input type="number" id="mr" min="1" value="${s.minResponses}"></div>
        <h4 style="margin-top:16px">Rating scale</h4><p class="small muted">Lower bound of each rating, in CSS %. Adjust these to match the scale your office reports with (for example, the ARTA guideline).</p>
        <table><tbody>${s.bands.map((b, i) => `<tr><td><input type="text" data-bl="${i}" value="${esc(b.label)}"></td><td>≥ <input type="number" data-bm="${i}" value="${b.min}" style="width:80px"> %</td></tr>`).join('')}</tbody></table>
        <div class="btn-row" style="margin-top:14px"><button class="btn" id="saveSet">Save settings</button><button class="btn subtle" id="resetSet">Restore defaults</button></div>
      </div>
      <div class="card"><h3>Office reporting names</h3>
        <p class="small muted">Rename an office for reports, or merge two offices by giving them the same reporting name. The original responses stay unchanged.</p>
        <div class="table-wrap"><table><thead><tr><th>Office in survey</th><th>Report as</th></tr></thead><tbody>
        ${offices.map((o, i) => `<tr><td class="small">${esc(o)}</td><td><input type="text" data-alias="${i}" value="${esc(s.aliases[o] || '')}" placeholder="(same)" style="width:100%"></td></tr>`).join('')}
        </tbody></table></div>
        <h4 style="margin-top:16px">Service dimensions</h4>
        <table><tbody>${SQD.map(q => `<tr><td><b>${q.code}</b></td><td>${esc(q.dim)}</td><td class="small muted">${esc(q.short)}</td></tr>`).join('')}</tbody></table>
      </div></div>`;
    pane.querySelector('#pt').value = s.periodType;
    pane.querySelector('#saveSet').onclick = async () => {
      const aliases = {};
      pane.querySelectorAll('[data-alias]').forEach(i => { if (i.value.trim()) aliases[offices[+i.dataset.alias]] = i.value.trim(); });
      const bands = s.bands.map((b, i) => ({ label: pane.querySelector(`[data-bl="${i}"]`).value.trim() || b.label, min: +pane.querySelector(`[data-bm="${i}"]`).value || 0 })).sort((a, b) => b.min - a.min);
      try {
        await Store.saveSettings({ periodType: pane.querySelector('#pt').value, target: +pane.querySelector('#tg').value || 80, minResponses: +pane.querySelector('#mr').value || 1, bands, aliases });
        O.filters.period = '';
        toast('Settings saved'); rerender();
      } catch (error) { toast(error.message); }
    };
    pane.querySelector('#resetSet').onclick = async () => {
      try { await Store.resetSettings(); toast('Defaults restored'); rerender(); }
      catch (error) { toast(error.message); }
    };
  }

  /* ---------- Findings ---------- */
  function findingsPane(pane, rerender) {
    const rows = Store.all();
    const pt = Store.settings.periodType;
    const periods = periodsOf(rows, pt);
    const offices = [...new Set(rows.map(r => r.office))].sort();
    const list = Store.findings();
    pane.innerHTML = `<div class="grid g2">
      <div class="card"><h3>Upload summarized findings</h3>
        <p class="small muted">Findings appear in section VII of the CSS report and the office-level summary for the matching office and period.</p>
        <form id="ff">
          <div class="field"><label class="req" for="ft">Title</label><input type="text" id="ft" style="width:100%" placeholder="e.g. Q3 CSS findings – Registrar"></div>
          <div class="grid g2"><div class="field"><label for="fo">Office</label><select id="fo" style="width:100%"><option value="">All offices</option>${offices.map(o => `<option>${esc(o)}</option>`).join('')}</select></div>
          <div class="field"><label for="fp">Period</label><select id="fp" style="width:100%"><option value="">All periods</option>${periods.map(p => `<option value="${p}">${periodLabel(p)}</option>`).join('')}</select></div></div>
          <div class="field"><label class="req" for="fs">Summary of findings</label><textarea id="fs"></textarea></div>
          <div class="field"><label for="fa">Recommendations / action plan</label><textarea id="fa"></textarea></div>
          <div class="field"><label for="ffile">Attachment (PDF, DOCX or XLSX, up to 1 MB)</label><input type="file" id="ffile" accept=".pdf,.doc,.docx,.xls,.xlsx"></div>
          <div class="error-text" id="fe"></div>
          <button class="btn" type="submit">Save findings</button>
        </form></div>
      <div class="card"><h3>Uploaded findings</h3>
        ${list.length ? list.map(f => `<div class="quote"><b>${esc(f.title)}</b><div class="meta">${esc(f.office || 'All offices')} · ${f.period ? periodLabel(f.period) : 'All periods'} · added ${esc(f.added)}${f.fileName ? ' · 📎 ' + esc(f.fileName) : ''}</div>
          <p class="small" style="white-space:pre-wrap;margin:6px 0">${esc(f.findings)}</p><button class="btn danger" data-del="${f.id}" style="padding:3px 10px;font-size:.8rem">Remove</button></div>`).join('') : '<p class="muted">Nothing uploaded yet.</p>'}
      </div></div>`;
    pane.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      try { await Store.removeFinding(b.dataset.del); rerender(); }
      catch (error) { toast(error.message); }
    });
    pane.querySelector('#ff').onsubmit = e => {
      e.preventDefault();
      const v = id => pane.querySelector('#' + id).value.trim();
      if (!v('ft') || !v('fs')) { pane.querySelector('#fe').textContent = 'Title and summary are required.'; return; }
      const finish = async (fileName, fileData) => {
        try {
          await Store.addFinding({ title: v('ft'), office: v('fo'), period: v('fp'), findings: v('fs'), actions: v('fa'), fileName, fileData });
          toast('Findings saved'); rerender();
        } catch (error) { pane.querySelector('#fe').textContent = error.message; }
      };
      const f = pane.querySelector('#ffile').files[0];
      if (!f) return finish('', '');
      if (f.size > 1024 * 1024) { pane.querySelector('#fe').textContent = 'The attachment must be 1 MB or smaller.'; return; }
      const r = new FileReader(); r.onload = () => finish(f.name, r.result); r.readAsDataURL(f);
    };
  }

  O.views = O.views || {};
  O.views.admin = render;
})();
