/* Data store, metrics and CSV import for the CSS prototype.
 * Everything is kept in the browser (localStorage); there is no server. */
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
    target: 80,               // % satisfied target used to flag "needs improvement"
    minResponses: 10,         // minimum responses before an office is ranked
    bands: [                  // CSS score rating scale (lower bound, label)
      { min: 90, label: 'Outstanding' },
      { min: 80, label: 'Very Satisfactory' },
      { min: 70, label: 'Satisfactory' },
      { min: 60, label: 'Fair' },
      { min: 0, label: 'Poor' }
    ],
    aliases: {}               // office name -> reporting name
  };

  const KEY = 'ome-css-proto-v1';
  const seed = window.CSS_SEED;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  let state = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
  }

  function unpackSeed() {
    const L = seed.lists, U = seed.units;
    return seed.rows.map((r, i) => ({
      id: 's' + i, date: r[0], office: L.offices[r[1]], unit: r[2] >= 0 ? U[r[2]] : '',
      gender: L.genders[r[3]], type: L.types[r[4]].trim(),
      cc1: r[5], cc2: r[6], cc3: r[7], sqd: r[8].split('').map(Number), comment: r[9], source: 'sheet'
    }));
  }

  const Store = {
    SQD, THEMES, lists: seed.lists, hierarchy: seed.hierarchy,
    get settings() { return Object.assign({}, DEFAULT_SETTINGS, state.settings || {}); },
    saveSettings(s) { state.settings = s; save(); },
    resetSettings() { delete state.settings; save(); },

    baseRows() { return state.imported ? state.imported : unpackSeed(); },
    submissions() { return state.submissions || []; },
    all() {
      const alias = this.settings.aliases;
      return this.baseRows().concat(this.submissions()).map(r => alias[r.office] ? Object.assign({}, r, { office: alias[r.office], originalOffice: r.office }) : r);
    },
    addSubmission(rec) {
      state.submissions = this.submissions().concat([rec]);
      return save();
    },
    replaceImported(rows, meta) { state.imported = rows; state.importMeta = meta; return save(); },
    importMeta() { return state.importMeta || { source: seed.source, exported: seed.exported, rows: seed.rows.length, builtIn: true }; },
    clientsServed() { return state.served || {}; },
    setServed(key, n) { state.served = this.clientsServed(); if (n > 0) state.served[key] = n; else delete state.served[key]; save(); },
    findings() { return state.findings || []; },
    addFinding(f) { state.findings = this.findings().concat([f]); return save(); },
    removeFinding(id) { state.findings = this.findings().filter(f => f.id !== id); save(); },
    resetAll() { state = {}; save(); }
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

  /* ---------- Metrics ---------- */
  function summarize(rows) {
    const items = SQD.map(() => ({ counts: [0, 0, 0, 0, 0, 0], n: 0, sum: 0, sat: 0 })); // counts[0] = N/A
    let allN = 0, allSum = 0, allSat = 0, satClients = 0, satBase = 0;
    for (const r of rows) {
      r.sqd.forEach((v, i) => {
        const it = items[i];
        it.counts[v]++;
        if (v > 0) { it.n++; it.sum += v; if (v >= 4) it.sat++; allN++; allSum += v; if (v >= 4) allSat++; }
      });
      if (r.sqd[0] > 0) { satBase++; if (r.sqd[0] >= 4) satClients++; }
    }
    items.forEach(it => { it.mean = it.n ? it.sum / it.n : null; it.pct = it.n ? it.sat / it.n * 100 : null; });
    return {
      n: rows.length, items,
      mean: allN ? allSum / allN : null,          // average rating, 1-5
      css: allN ? allSat / allN * 100 : null,      // % of all ratings that are Agree / Strongly Agree
      satisfiedPct: satBase ? satClients / satBase * 100 : null // % of clients who agreed with SQD0
    };
  }

  function band(pct) {
    if (pct == null) return { label: 'No data', cls: 'neutral' };
    const s = Store.settings;
    const b = s.bands.find(b => pct >= b.min) || s.bands[s.bands.length - 1];
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
    const issues = { badDate: 0, missingRatings: 0, outOfRange: 0, duplicates: 0, unknownOffice: [], wrongColumns: header.length < 42 };
    if (issues.wrongColumns) return { rows: [], issues, total: body.length, header };
    const seen = new Set(), out = [];
    const known = new Set(seed.lists.offices);
    body.forEach((x, idx) => {
      const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec((x[0] || '').trim());
      if (!m) { issues.badDate++; return; }
      const date = `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
      const office = (x[1] || '').trim().replace(/\s*\(.*\)\s*$/, '');
      if (!known.has(office) && !issues.unknownOffice.includes(office)) issues.unknownOffice.push(office);
      const dupKey = [(x[0] || '').trim(), (x[9] || '').trim().toLowerCase(), office].join('|');
      if (seen.has(dupKey)) { issues.duplicates++; return; }
      seen.add(dupKey);
      let unit = '';
      for (let i = 15; i < 30; i++) if ((x[i] || '').trim()) { unit = x[i].trim(); break; }
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
        sqd: raw.map(v => /^[1-5]$/.test(v) ? +v : 0), comment, source: 'import'
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
