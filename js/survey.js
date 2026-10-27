/* "Evaluate an Office" - the public Client Satisfaction Survey form. */
(function () {
  'use strict';
  const { Store, SQD, esc } = window.OME;

  const F = Store.form;
  const CONSENT = F.consent;
  const GENDERS = F.genders.concat(['Other']);
  const TYPES = F.clientTypes.concat(['Other']);
  const LIKERT = [
    { v: 5, en: 'Strongly Agree', tl: 'Lubos na sumasang-ayon' },
    { v: 4, en: 'Agree', tl: 'Sumasang-ayon' },
    { v: 3, en: 'Neither', tl: 'Walang kinikilingan' },
    { v: 2, en: 'Disagree', tl: 'Hindi sumasang-ayon' },
    { v: 1, en: 'Strongly Disagree', tl: 'Lubos na hindi sumasang-ayon' },
    { v: 0, en: 'N/A', tl: 'Hindi angkop' }
  ];

  const radios = (name, opts) => '<div class="options">' + opts.map((o, i) =>
    `<label><input type="radio" name="${name}" value="${i}" required> <span>${esc(o)}</span></label>`).join('') + '</div>';

  // Format the supplied notice without changing its wording or order.
  function noticeBody(body) {
    const categories = new Set(['Optional Identifying Information', 'Contact Information',
      'Demographic Information', 'Service-Related Information', 'Feedback and Evaluation Data']);
    const html = [];
    let listing = false;
    const closeList = () => { if (listing) { html.push('</ul>'); listing = false; } };
    for (const text of body.split(/\n+/).map(line => line.trim()).filter(Boolean)) {
      if (categories.has(text)) {
        closeList();
        html.push(`<h5>${esc(text)}</h5><ul>`);
        listing = true;
      } else if (/:$/.test(text) && !/reach out to:$/.test(text)) {
        closeList();
        html.push(`<p>${esc(text)}</p><ul>`);
        listing = true;
      } else {
        if (/^(Providing personal information|Processing of your data|These are collected|Survey results will|in accordance with|If you have privacy concerns|Date last updated:)/.test(text)) closeList();
        html.push(listing ? `<li>${esc(text)}</li>` : `<p>${esc(text)}</p>`);
      }
    }
    closeList();
    return html.join('');
  }

  function render(el, opts) {
    const preset = (opts && opts.office) || '';
    const todayParts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(part => [part.type, part.value]));
    const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
    el.innerHTML = `
    <div class="survey">
      <div class="section-head"><div>
        <h2>Client Satisfaction Survey</h2>
        <p class="muted">Help us improve our services by evaluating the office you transacted with. It takes about 3 minutes.<br>
        <i>Tulungan kaming mapabuti ang aming serbisyo sa pamamagitan ng pagsusuri sa opisinang inyong pinuntahan.</i></p>
      </div></div>
      <form id="cssForm" novalidate>
        <p class="survey-required-note">Fields marked <span aria-hidden="true">*</span> are required.</p>
        <div class="card">
          <h3>Data Privacy Notice</h3>
          <div class="privacy-copy">${F.intro.split(/\n+/).map(p => `<p>${esc(p)}</p>`).join('')}</div>
          <details class="notice"><summary><span class="notice-show">Read the full privacy notice</span><span class="notice-hide">Hide the full privacy notice</span></summary>
            <div class="privacy-full-content">${F.notice.map(n => `<section class="privacy-section"><h4>${esc(n.heading.replace(/:$/, ''))}</h4><div>${noticeBody(n.body)}</div></section>`).join('')}</div>
          </details>
          <div class="field survey-consent"><div class="q req">Informed Consent Declaration</div>
            <div class="options">${CONSENT.map((c, i) => `<label><input type="checkbox" name="consent" value="${i}"> <span>${esc(c)}</span></label>`).join('')}</div>
          </div>
          <p class="callout small">Your name and contact details are stored securely for authorized OME staff. The public dashboard and reports use survey answers without these details. Please do not put personal details in comments.</p>
        </div>

        <div class="card">
          <h3>Client information</h3>
          <div class="grid g2">
            <div class="field"><label for="legal">Legal name <span class="muted small">(optional)</span></label><input type="text" id="legal" name="legal" autocomplete="name" maxlength="250"></div>
            <div class="field"><label class="req" for="cdate">Date</label><input type="date" id="cdate" name="cdate" value="${today}" max="${today}" required></div>
            <div class="field"><label for="contact">Contact number <span class="muted small">(optional)</span></label><input type="tel" id="contact" name="contact" autocomplete="tel" maxlength="80"></div>
            <div class="field"><label for="email">Email address <span class="muted small">(optional)</span></label><input type="email" id="email" name="email" autocomplete="email" maxlength="254"></div>
            <div class="field"><label class="req" for="gender">Gender</label><select id="gender" name="gender"><option value="">Select…</option>${GENDERS.map(g => `<option>${esc(g)}</option>`).join('')}</select>
              <input type="text" id="genderOther" name="genderOther" placeholder="Please specify" hidden style="margin-top:6px"></div>
            <div class="field"><label class="req" for="ctype">Client type</label><select id="ctype" name="ctype"><option value="">Select…</option>${TYPES.map(g => `<option>${esc(g)}</option>`).join('')}</select>
              <input type="text" id="ctypeOther" name="ctypeOther" placeholder="Please specify" hidden style="margin-top:6px"></div>
          </div>
        </div>

        <div class="card">
          <h3>Office and service</h3>
          <div class="grid g2">
            <div class="field"><label class="req survey-label-bilingual" for="office"><span class="survey-label-title">Office / unit / laboratory where the service was availed <span class="survey-required-mark" aria-hidden="true">*</span></span><span class="tl">Opisina, yunit, o laboratoryo kung saan napakinabangan ang serbisyo</span></label>
              <select id="office" name="office"><option value="">Select…</option>${Store.structure.map(o => `<option value="${esc(o.office)}" ${o.office === preset ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></div>
            <div class="field" id="unitWrap"><label class="req survey-label-bilingual" for="unit"><span class="survey-label-title"><span id="unitQ">Choose the office where the service was availed.</span> <span class="survey-required-mark" aria-hidden="true">*</span></span><span class="tl" id="unitTl">Piliin ang opisina kung saan napakinabangan ang serbisyo.</span></label>
              <select id="unit" name="unit"><option value="">Select a domain office first</option></select></div>
            <div class="field"><label class="req survey-label-bilingual" for="service"><span class="survey-label-title">Service availed <span class="survey-required-mark" aria-hidden="true">*</span></span><span class="tl">Napakinabangang serbisyo</span></label><input type="text" id="service" name="service" placeholder="e.g. Request for TOR"></div>
            <div class="field"><label for="staff">Staff who assisted you <span class="muted small">(optional)</span></label><input type="text" id="staff" name="staff" maxlength="250"></div>
          </div>
        </div>

        <div class="card">
          <h3>Citizen's Charter</h3>
          <p class="small muted">The Citizen's Charter (CC) is an official document that lists the services of a government office, with requirements, fees and processing time.</p>
          <div class="field"><div class="q req">CC1. Which of the following best describes your awareness of a Citizen's Charter?</div>${radios('cc1', Store.lists.cc1)}</div>
          <div class="field" id="cc2wrap"><div class="q req">CC2. If you are aware of the CC, would you say that the CC of this office was:</div>${radios('cc2', Store.lists.cc2)}</div>
          <div class="field" id="cc3wrap"><div class="q req">CC3. If you are aware of the CC, how much did the CC help you in your transaction?</div>${radios('cc3', Store.lists.cc3)}</div>
        </div>

        <div class="card">
          <h3>Service quality</h3>
          <p class="small muted">Rate how much you agree with each statement. Choose N/A if it does not apply to your transaction.</p>
          <div class="table-wrap survey-rating-wrap"><table class="likert">
            <thead><tr><th scope="col">Statement</th>${LIKERT.map(l => `<th scope="col" title="${esc(l.tl)}">${esc(l.en)}</th>`).join('')}</tr></thead>
            <tbody>${SQD.map((q, i) => `<tr data-q="${i}"><td role="rowheader">${esc(q.en)}<span class="tl">${esc(q.tl)}</span></td>${LIKERT.map(l =>
              `<td data-l="${l.v ? l.v : 'N/A'}"><label class="likert-choice"><input type="radio" name="sqd${i}" value="${l.v}" aria-label="${esc(q.short)}: ${l.en}"><span class="likert-choice-text">${esc(l.en)}</span></label></td>`).join('')}</tr>`).join('')}</tbody>
          </table></div>
        </div>

        <div class="card">
          <h3>Comments and submission</h3>
          <div class="field"><label for="comment">Comments and recommendations <span class="muted small">(optional)</span><span class="tl">Mga komento at rekomendasyon</span></label><textarea id="comment" name="comment"></textarea></div>
          <div id="formError" class="error-text" role="alert" tabindex="-1"></div>
          <div class="btn-row"><button class="btn" type="submit">Submit evaluation</button></div>
        </div>
      </form>
    </div>`;

    const form = el.querySelector('#cssForm');
    const officeSel = form.office, unitSel = form.unit;
    // Like the Google Form: each domain office opens its own list of offices or departments;
    // College of Law and College of Medicine have none.
    function fillUnits() {
      const units = Store.hierarchy[officeSel.value] || [];
      const kind = Store.unitKind(officeSel.value) || 'office';
      form.querySelector('#unitQ').textContent = `Choose the ${kind} where the service was availed.`;
      form.querySelector('#unitTl').textContent = `Piliin ang ${kind === 'department' ? 'departamento' : 'opisina'} kung saan napakinabangan ang serbisyo.`;
      unitSel.innerHTML = units.length
        ? '<option value="">Select…</option>' + units.map(u => `<option>${esc(u)}</option>`).join('')
        : '<option value="">Select a domain office first</option>';
      form.querySelector('#unitWrap').hidden = !!officeSel.value && !units.length;
    }
    officeSel.addEventListener('change', fillUnits);
    fillUnits();
    [['gender', 'genderOther'], ['ctype', 'ctypeOther']].forEach(([sel, other]) =>
      form[sel].addEventListener('change', () => { form[other].hidden = form[sel].value !== 'Other'; }));

    // CC2 and CC3 do not apply when the client does not know the CC (ARTA guideline).
    form.addEventListener('change', e => {
      if (e.target.matches?.('input, select')) e.target.removeAttribute('aria-invalid');
      if (e.target.name !== 'cc1') return;
      const skip = e.target.value === '3';
      ['cc2wrap', 'cc3wrap'].forEach(id => {
        const w = form.querySelector('#' + id);
        w.hidden = skip;
        w.querySelectorAll('input').forEach(i => { i.disabled = skip; if (skip) i.checked = false; });
      });
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const box = form.querySelector('#formError');
      box.textContent = '';
      form.querySelectorAll('[aria-invalid="true"]').forEach(input => input.removeAttribute('aria-invalid'));
      form.querySelectorAll('.likert tr.missing').forEach(row => row.classList.remove('missing'));
      const invalidTargets = [];
      const val = n => (form.elements[n] && form.elements[n].value || '').trim();
      const radio = n => { const c = form.querySelector(`input[name="${n}"]:checked`); return c ? +c.value : null; };
      const requireAnswer = (missing, target) => { if (missing) invalidTargets.push(target); };
      const uncheckedConsent = Array.from(form.querySelectorAll('input[name=consent]')).find(input => !input.checked);
      requireAnswer(!!uncheckedConsent, uncheckedConsent);
      requireAnswer(!val('cdate') || !form.elements.cdate.validity.valid, form.elements.cdate);
      requireAnswer(!!val('email') && !form.elements.email.validity.valid, form.elements.email);
      const gender = val('gender') === 'Other' ? val('genderOther') : val('gender');
      const ctype = val('ctype') === 'Other' ? val('ctypeOther') : val('ctype');
      requireAnswer(!gender, val('gender') === 'Other' ? form.elements.genderOther : form.elements.gender);
      requireAnswer(!ctype, val('ctype') === 'Other' ? form.elements.ctypeOther : form.elements.ctype);
      requireAnswer(!val('office'), form.elements.office);
      if (val('office')) requireAnswer(!!(Store.hierarchy[val('office')] || []).length && !val('unit'), form.elements.unit);
      requireAnswer(!val('service'), form.elements.service);
      const cc1 = radio('cc1'), skip = cc1 === 3;
      requireAnswer(cc1 == null, form.querySelector('input[name="cc1"]'));
      if (!skip && cc1 != null) {
        requireAnswer(radio('cc2') == null, form.querySelector('input[name="cc2"]'));
        requireAnswer(radio('cc3') == null, form.querySelector('input[name="cc3"]'));
      }
      form.querySelectorAll('.likert tbody tr').forEach(tr => {
        requireAnswer(radio('sqd' + tr.dataset.q) == null, tr.querySelector('input[type="radio"]'));
      });
      if (invalidTargets.length) {
        const first = invalidTargets[0];
        first.setAttribute('aria-invalid', 'true');
        first.closest('.likert tr')?.classList.add('missing');
        (first.closest('label') || first).scrollIntoView({ behavior: 'smooth', block: 'center' });
        first.focus({ preventScroll: true });
        return;
      }

      // Personal details are stored separately from the public survey answers.
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      let ref;
      try {
        const saved = await Store.addSubmission({
        consent: true, legalName: val('legal'), contact: val('contact'), email: val('email'), staff: val('staff'),
        date: val('cdate'), office: val('office'), unit: val('unit'),
        gender, type: ctype, cc1, cc2: skip ? -1 : radio('cc2'), cc3: skip ? -1 : radio('cc3'),
        sqd: SQD.map((_, i) => radio('sqd' + i)), comment: val('comment'), service: val('service')
        });
        ref = saved.id;
      } catch (error) {
        box.textContent = error.message || 'Could not submit your response. Please try again.';
        box.scrollIntoView({ block: 'center' }); box.focus();
        submit.disabled = false;
        return;
      }
      el.innerHTML = `<div class="survey"><div class="card thankyou">
        <h2>Thank you for your feedback!</h2>
        <p>Salamat sa inyong pagsagot. Your evaluation of <b>${esc(val('office'))}</b> has been recorded.</p>
        <p>Reference number <span class="ref">${ref}</span></p>
        <p class="small muted">Your response is saved and included in the dashboard.</p>
        <div class="btn-row" style="justify-content:center"><a class="btn" href="#/evaluate">Evaluate another office</a><a class="btn ghost" href="#/dashboard">View dashboard</a></div>
      </div></div>`;
      window.scrollTo(0, 0);
    });
  }

  window.OME.views = window.OME.views || {};
  window.OME.views.evaluate = render;
})();
