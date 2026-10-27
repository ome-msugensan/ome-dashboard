/* Shared survey data, metrics and CSV import. Persistent data lives in MySQL. */
(function () {
  'use strict';

  const SQD = [
    { code: 'SQD0', short: 'Overall satisfaction', dim: 'Overall', en: 'I am satisfied with the service that I availed.', tl: 'Ako ay nasiyahan sa serbisyong aking natanggap.' },
    { code: 'SQD1', short: 'Reasonable time', dim: 'Responsiveness', en: 'I spent a reasonable amount of time for my transaction.', tl: 'Ako ay gumugol ng makatwirang oras para sa aking transaksiyon.' },
    { code: 'SQD2', short: 'Followed requirements', dim: 'Reliability', en: 'The office followed steps and requirements for service.', tl: 'Sinunod ng opisina ang itinakdang mga hakbang at mga kinakailangan sa serbisyo.' },
    { code: 'SQD3', short: 'Easy, simple steps', dim: 'Access & Facilities', en: 'The steps (including payment) I needed to do for my transaction were easy and simple.', tl: 'Madali at simple ang mga hakbang (kasama ang pagbabayad) na aking kinailangang gawin para sa aking transaksiyon.' },
    { code: 'SQD4', short: 'Information easy to find', dim: 'Communication', en: 'I easily found information about my transaction from the office or its website.', tl: 'Madali akong nakahanap ng impormasyon tungkol sa aking transaksiyon mula sa opisina o sa opisyal nitong website.' },
    { code: 'SQD5', short: 'Value for money', dim: 'Costs', en: 'The amount I paid for my transaction is value for money.', tl: 'Makatwiran ang halagang aking binayaran para sa aking transaksiyon.' },
    { code: 'SQD6', short: 'Fair to everyone', dim: 'Integrity', en: 'I feel the office was fair to everyone during my transaction.', tl: 'Naniniwala ako na naging patas ang opisina sa lahat sa proseso ng aking transaksiyon.' },
    { code: 'SQD7', short: 'Courteous, helpful staff', dim: 'Assurance', en: 'I was treated courteously by the staff, and (if asked for help) the staff was helpful.', tl: 'Magalang at matulungin ang mga kawani ng opisina sa aking transaksiyon.' },
    { code: 'SQD8', short: 'Got what I needed', dim: 'Outcome', en: 'I got what I needed from the service provider / office, or (if denied) denial of request was sufficiently explained to me.', tl: 'Nakuha ko ang aking kailangan mula sa opisina, o kung hindi man, ito ay naipaliwanag nang malinaw sa akin.' },
    { code: 'SQD9', short: 'Adequate facilities', dim: 'Facilities', en: 'The office facilities, equipment, and related resources available were adequate for my transaction.', tl: 'Ang mga pasilidad, kagamitan, at iba pang kinakailangang resources ng opisina ay sapat para sa aking transaksiyon.' },
    { code: 'SQD10', short: 'Clean, well-maintained', dim: 'Cleanliness', en: 'The office was clean and well-maintained.', tl: 'Malinis at maayos ang kalagayan ng opisina.' }
  ];

  // Keyword rules for grouping free-text comments (English + Filipino).
  const THEMES = [
    { id: 'time', label: 'Waiting time & speed', concern: true, re: /\b(wait|waiting|queue|line|slow|fast|faster|quick|delay|delayed|long|time|matagal|tagal|pila|bilis|bagal)\b/i },
    { id: 'staff', label: 'Staff courtesy & attitude', concern: true, re: /\b(staff|rude|attitude|polite|courteous|approachable|friendly|kind|respect|personnel|employee|mabait|bastos|masungit|sungit|magalang|accommodat\w*)\b/i },
    { id: 'facilities', label: 'Facilities & equipment', concern: true, re: /\b(facilit\w*|aircon|air\s?con|chair|chairs|room|space|equipment|computer|wifi|wi-fi|internet|ventilation|electric\w*|fan|building|init|upuan)\b/i },
    { id: 'clean', label: 'Cleanliness', concern: true, re: /\b(clean\w*|dirty|cr|comfort room|restroom|toilet|linis|malinis|marumi|trash|garbage)\b/i },
    { id: 'info', label: 'Information & communication', concern: true, re: /\b(inform\w*|announce\w*|signage|sign|posted|website|page|update\w*|communicat\w*|respond\w*|reply|replies|message|clear|clarity|instruction\w*|guide)\b/i },
    { id: 'process', label: 'Process & requirements', concern: true, re: /\b(process\w*|requirement\w*|procedure\w*|steps|document\w*|form|forms|system|online|digital|paperwork|transaction\w*)\b/i },
    { id: 'praise', label: 'Appreciation & praise', concern: false, re: /\b(thank\w*|good|great|keep it up|keep up|excellent|satisf\w*|salamat|mahusay|maayos|nice|well done|helpful|amazing|best|galing)\b/i }
  ];

  const DEFAULT_SETTINGS = {
    periodType: 'month',      // month | quarter | year
    target: 80,               // CSS score (%) target used to flag "needs improvement"; 80% = weighted mean 4.00
    minResponses: 10,         // minimum responses before an office is ranked
    bands: [                  // rating scale: lower bound of the weighted mean (1-5), label
      { min: 4.21, label: 'Outstanding' },
      { min: 3.41, label: 'Very Satisfactory' },
      { min: 2.61, label: 'Satisfactory' },
      { min: 1.81, label: 'Fair' },
      { min: 1, label: 'Poor' }
    ],
    aliases: {}               // office name -> reporting name
  };

  const seed = window.OME_BOOTSTRAP;
  const form = seed.form;
  // Domain office -> its sub-offices or departments, in the order of the Google Form.
  const hierarchy = {};
  form.structure.forEach(s => { hierarchy[s.office] = s.units; });
  const UNIT_COLS = 15; // export columns P..AD hold the sub-office answer of form sections 1..15

  let state = seed;
  async function request(path, method = 'GET', body) {
    const res = await fetch(path, {
      method, credentials: 'same-origin', cache: 'no-store',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }
  async function mutate(path, method, body) {
    const result = await request(path, method, body);
    try { state = await request('/api.php?action=bootstrap'); }
    catch (error) {
      console.error('Saved, but could not refresh the latest data:', error);
      setTimeout(() => location.reload(), 1500);
    }
    return result;
  }

  const Store = {
    SQD, THEMES, form, lists: seed.lists, hierarchy, structure: form.structure,
    unitKind(office) { const s = form.structure.find(x => x.office === office); return s && s.unitKind; },
    get settings() { return Object.assign({}, DEFAULT_SETTINGS, state.settings || {}); },
    get authenticated() { return Boolean(state.authenticated); },
    get user() { return state.user || null; },
    async login(email, password) { return mutate('/api.php?action=login', 'POST', { email, password }); },
    async logout() { return mutate('/api.php?action=logout', 'POST'); },
    async respondentDetails() { return request('/api.php?action=respondents'); },
    async saveSettings(s) { return mutate('/api.php?action=save-settings', 'POST', s); },
    async resetSettings() { return mutate('/api.php?action=reset-settings', 'POST'); },

    baseRows() { return state.baseRows || []; },
    submissions() { return state.submissions || []; },
    all() {
      const alias = this.settings.aliases;
      return this.baseRows().concat(this.submissions()).map(r => alias[r.office] ? Object.assign({}, r, { office: alias[r.office], originalOffice: r.office }) : r);
    },
    async addSubmission(rec) { return mutate('/api.php?action=submissions', 'POST', rec); },
    async replaceImported(rows, meta) { return mutate('/api.php?action=import', 'POST', { rows, source: meta.source }); },
    importMeta() { return state.importMeta || {}; },
    clientsServed() { return state.served || {}; },
    async setServed(key, n) { const [office, period] = key.split('||'); return mutate('/api.php?action=served', 'POST', { office, period, clients: n }); },
    findings() { return state.findings || []; },
    async addFinding(f) { return mutate('/api.php?action=findings', 'POST', f); },
    async removeFinding(id) { return mutate('/api.php?action=delete-finding&id=' + encodeURIComponent(id), 'POST'); }
  };

  /* ---------- Periods ---------- */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function periodKey(date, type) {
    const y = date.slice(0, 4), m = +date.slice(5, 7);
    if (type === 'year') return y;
    if (type === 'quarter') return y + '-Q' + Math.ceil(m / 3);
    return date.slice(0, 7);
  }
  function periodLabel(key) {
    if (/^\d{4}-\d{2}$/.test(key)) return MONTHS[+key.slice(5) - 1] + ' ' + key.slice(0, 4);
    if (/Q/.test(key)) return key.slice(5) + ' ' + key.slice(0, 4);
    return key;
  }

  /* ---------- Metrics ----------
   * Weighted mean = Σ(f × r) / N: each rating r (1-5) times how many clients gave it (f),
   * divided by the number of ratings N (N/A excluded). CSS score (%) = weighted mean ÷ 5 × 100.
   * The overall score uses SQD1-SQD10; SQD0 ("I am satisfied…") is reported on its own. */
  const SCORED = SQD.map((q, i) => i).filter(i => i > 0);

  function summarize(rows) {
    const items = SQD.map(() => ({ counts: [0, 0, 0, 0, 0, 0], n: 0, sum: 0 })); // counts[0] = N/A
    let allN = 0, allSum = 0, satClients = 0, satBase = 0;
    for (const r of rows) {
      r.sqd.forEach((v, i) => {
        const it = items[i];
        it.counts[v]++;
        if (v > 0) { it.n++; it.sum += v; if (SCORED.includes(i)) { allN++; allSum += v; } }
      });
      if (r.sqd[0] > 0) { satBase++; if (r.sqd[0] >= 4) satClients++; }
    }
    items.forEach(it => { it.mean = it.n ? it.sum / it.n : null; it.pct = it.n ? it.mean / 5 * 100 : null; });
    const mean = allN ? allSum / allN : null;
    return {
      n: rows.length, items,
      mean,                                        // overall weighted mean of SQD1-SQD10, 1-5
      css: mean == null ? null : mean / 5 * 100,   // CSS score: weighted mean as a percentage
      satisfiedPct: satBase ? satClients / satBase * 100 : null // % of clients who agreed with SQD0
    };
  }

  // Rating label for a CSS score. Bands hold weighted-mean lower bounds (1-5), compared at the
  // two decimals reports show; bands saved before the switch held % bounds and still work.
  function band(pct) {
    if (pct == null) return { label: 'No data', cls: 'neutral' };
    const s = Store.settings;
    const onMean = s.bands.every(b => b.min <= 5);
    const value = onMean ? Math.round(pct / 20 * 100) / 100 : pct;
    const b = s.bands.find(b => value >= b.min) || s.bands[s.bands.length - 1];
    const cls = pct >= s.target ? 'good' : pct >= s.target - 10 ? 'warn' : 'bad';
    return { label: b.label, cls };
  }

  function groupBy(rows, fn) {
    const m = new Map();
    for (const r of rows) { const k = fn(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); }
    return m;
  }

  function filterRows(rows, f) {
    return rows.filter(r =>
      (!f.office || r.office === f.office) &&
      (!f.unit || r.unit === f.unit) &&
      (!f.type || r.type === f.type) &&
      (!f.period || periodKey(r.date, f.periodType || Store.settings.periodType) === f.period));
  }

  function periodsOf(rows, type) {
    return [...new Set(rows.map(r => periodKey(r.date, type)))].sort();
  }

  function themesOf(text) {
    return THEMES.filter(t => t.re.test(text)).map(t => t.id);
  }

  function commentsWithThemes(rows) {
    return rows.filter(r => r.comment).map(r => {
      const rated = r.sqd.filter(v => v > 0);
      const avg = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null;
      return { r, avg, themes: themesOf(r.comment), negative: avg != null && avg < 3.5 };
    });
  }

  /* ---------- CSV import (Google Forms export) ---------- */
  function parseCSV(text) {
    const rows = []; let row = [], field = '', i = 0, q = false;
    text = text.replace(/^﻿/, '');
    while (i < text.length) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); rows.push(row); row = []; field = '';
      } else field += c;
      i++;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows.filter(r => r.some(x => x.trim() !== ''));
  }

  // Converts a Forms CSV into anonymized records and a validation report.
  // Names, contact numbers, e-mails and staff names are discarded here.
  function importForms(text) {
    const table = parseCSV(text);
    const header = table[0] || [];
    const body = table.slice(1);
    const issues = { badDate: 0, missingRatings: 0, outOfRange: 0, duplicates: 0, routed: 0, unknownOffice: [], wrongColumns: header.length < 42 };
    if (issues.wrongColumns) return { rows: [], issues, total: body.length, header };
    const seen = new Set(), out = [];
    const struct = form.structure;
    body.forEach((x, idx) => {
      const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec((x[0] || '').trim());
      if (!m) { issues.badDate++; return; }
      const date = `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
      const label = (x[1] || '').trim();
      const k = struct.findIndex(s => s.label === label || s.office === label.replace(/\s*\(.*\)\s*$/, ''));
      const office = k >= 0 ? struct[k].office : label;
      if (k < 0 && !issues.unknownOffice.includes(office)) issues.unknownOffice.push(office);
      const dupKey = [(x[0] || '').trim(), (x[9] || '').trim().toLowerCase(), office].join('|');
      if (seen.has(dupKey)) { issues.duplicates++; return; }
      seen.add(dupKey);
      // The unit is the answer in this office's own section; answers in other sections come from form routing.
      const unit = k >= 0 && k < UNIT_COLS ? (x[15 + k] || '').trim() : '';
      let routed = false;
      for (let i = 0; i < UNIT_COLS; i++) if (i !== k && (x[15 + i] || '').trim()) routed = true;
      if (routed) issues.routed++;
      const raw = x.slice(30, 41).map(v => (v || '').trim());
      if (raw.some(v => v && !/^[1-5]$/.test(v))) issues.outOfRange++;
      if (raw.some(v => !v)) issues.missingRatings++;
      let comment = (x[41] || '').trim();
      if (comment.length < 4 || /^(none|n\/?a|wala( po)?|nothing|none so far|no comments?)\.?$/i.test(comment)) comment = '';
      comment = comment.replace(/\S+@\S+/g, '[email removed]').replace(/(\+?63|0)9\d{9}/g, '[number removed]');
      const ix = (list, v) => list.indexOf((v || '').trim());
      out.push({
        id: 'i' + idx, date, office, unit, gender: (x[6] || '').trim(), type: (x[7] || '').trim(),
        cc1: ix(seed.lists.cc1, x[10]), cc2: ix(seed.lists.cc2, x[11]), cc3: ix(seed.lists.cc3, x[12]),
        sqd: raw.map(v => /^[1-5]$/.test(v) ? +v : 0), comment, routed, source: 'import'
      });
    });
    return { rows: out, issues, total: body.length, header };
  }

  /* ---------- Helpers ---------- */
  const fmt = {
    pct: v => v == null ? '–' : v.toFixed(1) + '%',
    num: v => v == null ? '–' : v.toLocaleString(),
    score: v => v == null ? '–' : v.toFixed(2)
  };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function downloadText(name, text, type) {
    const blob = new Blob([text], { type: type || 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function toCSV(rows) {
    return rows.map(r => r.map(v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : v).join(',')).join('\n');
  }

  window.OME = { Store, SQD, THEMES, summarize, band, groupBy, filterRows, periodsOf, periodKey, periodLabel, themesOf, commentsWithThemes, importForms, fmt, esc, downloadText, toCSV };
})();
