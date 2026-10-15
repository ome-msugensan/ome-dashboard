/* "Evaluate an Office" - the public Client Satisfaction Survey form. */
(function () {
  'use strict';
  const { Store, SQD, esc } = window.OME;

  const CONSENT = [
    'I confirm that I have read and understood the Privacy Notice provided above.',
    'I voluntarily agree to participate in this Client Satisfaction Survey conducted by Mindanao State University – General Santos.',
    'I consent to the collection, processing, storage, and analysis of the information I provide for the purpose of evaluating and improving the quality of services of the university.',
    'I understand that my responses will be treated with confidentiality and that reports generated from this survey will not identify me personally.',
    'I understand that my participation is voluntary, and I may choose not to answer optional questions or discontinue participation at any time.'
  ];
  const GENDERS = ['Female', 'Male', 'Non-Binary', 'Prefer not to say', 'Other'];
  const TYPES = ['Student (Istudyante)', 'Alumni', 'Fresh Graduate', 'Graduate', 'Faculty/Employee (Kawani)', 'Parent/Guardian (Magulang/Tagapag-alaga)', 'Prospective student (Posibleng Mag-aaral)', 'Visitor (Bisita)'];
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

  function render(el, opts) {
    const preset = (opts && opts.office) || '';
    const today = new Date().toISOString().slice(0, 10);
    el.innerHTML = `
    <div class="survey">
      <div class="section-head"><div>
        <h2>Client Satisfaction Survey</h2>
        <p class="muted">Help us improve our services by evaluating the office you transacted with. It takes about 3 minutes.<br>
        <i>Tulungan kaming mapabuti ang aming serbisyo sa pamamagitan ng pagsusuri sa opisinang inyong pinuntahan.</i></p>
      </div></div>
      <form id="cssForm" novalidate>
        <div class="card">
          <h3>Privacy Notice</h3>
          <p class="small">Mindanao State University – General Santos, through the Office of Monitoring and Evaluation, collects the information in this form to measure client satisfaction and improve its services, in accordance with the Data Privacy Act of 2012 (RA 10173). Personal details are kept confidential, are accessible only to authorized personnel, and are never shown in published reports.</p>
          <p class="small muted"><i>Prototype note: replace this paragraph with the university's official privacy notice text.</i></p>
          <div class="field"><div class="q req">Informed Consent Declaration</div>
            <div class="options">${CONSENT.map((c, i) => `<label><input type="checkbox" name="consent" value="${i}"> <span>${esc(c)}</span></label>`).join('')}</div>
          </div>
          <div class="grid g2">
            <div class="field"><label class="req" for="legal">Legal name</label><input type="text" id="legal" name="legal" autocomplete="name"></div>
            <div class="field"><label class="req" for="cdate">Date</label><input type="date" id="cdate" name="cdate" value="${today}"></div>
          </div>
        </div>

        <div class="card">
          <h3>Client information</h3>
          <div class="grid g2">
            <div class="field"><label class="req" for="gender">Gender</label><select id="gender" name="gender"><option value="">Select…</option>${GENDERS.map(g => `<option>${esc(g)}</option>`).join('')}</select></div>
            <div class="field"><label class="req" for="ctype">Client type</label><select id="ctype" name="ctype"><option value="">Select…</option>${TYPES.map(g => `<option>${esc(g)}</option>`).join('')}</select></div>
            <div class="field"><label for="contact">Contact number <span class="muted small">(optional)</span></label><input type="tel" id="contact" name="contact" autocomplete="tel"></div>
            <div class="field"><label for="email">Email address <span class="muted small">(optional)</span></label><input type="email" id="email" name="email" autocomplete="email"></div>
          </div>
        </div>

        <div class="card">
          <h3>Office and service</h3>
          <div class="grid g2">
            <div class="field"><label class="req" for="office">Office / unit / laboratory where the service was availed<span class="tl">Opisina, yunit, o laboratoryo kung saan napakinabangan ang serbisyo</span></label>
              <select id="office" name="office"><option value="">Select…</option>${Store.lists.offices.map(o => `<option ${o === preset ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>
            <div class="field"><label for="unit">Office or department<span class="tl">Piliin ang opisina o departamento</span></label>
              <select id="unit" name="unit"><option value="">Select an office first</option></select></div>
            <div class="field"><label class="req" for="service">Service availed<span class="tl">Napakinabangang serbisyo</span></label><input type="text" id="service" name="service" placeholder="e.g. Request for TOR"></div>
            <div class="field"><label for="staff">Employee who provided the service <span class="muted small">(optional)</span><span class="tl">Kawani ng opisina na nagbigay ng serbisyo</span></label><input type="text" id="staff" name="staff"></div>
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
          <p class="small muted mobile-only">5 = Strongly Agree · 4 = Agree · 3 = Neither · 2 = Disagree · 1 = Strongly Disagree</p>
          <div class="table-wrap"><table class="likert">
            <thead><tr><th></th>${LIKERT.map(l => `<th title="${esc(l.tl)}">${esc(l.en)}</th>`).join('')}</tr></thead>
            <tbody>${SQD.map((q, i) => `<tr data-q="${i}"><td>${esc(q.en)}<span class="tl">${esc(q.tl)}</span></td>${LIKERT.map(l =>
              `<td data-l="${l.v ? l.v : 'N/A'}"><input type="radio" name="sqd${i}" value="${l.v}" aria-label="${esc(q.short)}: ${l.en}"></td>`).join('')}</tr>`).join('')}</tbody>
          </table></div>
        </div>

        <div class="card">
          <div class="field"><label for="comment">Comments and recommendations <span class="muted small">(optional)</span><span class="tl">Mga komento at rekomendasyon</span></label><textarea id="comment" name="comment"></textarea></div>
          <div id="formError" class="error-text" role="alert"></div>
          <div class="btn-row"><button class="btn" type="submit">Submit evaluation</button></div>
        </div>
      </form>
    </div>`;

    const form = el.querySelector('#cssForm');
    const officeSel = form.office, unitSel = form.unit;
    function fillUnits() {
      const units = Store.hierarchy[officeSel.value] || [];
      unitSel.innerHTML = units.length
        ? '<option value="">Select…</option>' + units.map(u => `<option>${esc(u)}</option>`).join('')
        : `<option value="">${officeSel.value ? 'Not applicable' : 'Select an office first'}</option>`;
      unitSel.disabled = !units.length;
    }
    officeSel.addEventListener('change', fillUnits);
    fillUnits();

    // CC2 and CC3 do not apply when the client does not know the CC (ARTA guideline).
    form.addEventListener('change', e => {
      if (e.target.name !== 'cc1') return;
      const skip = e.target.value === '3';
      ['cc2wrap', 'cc3wrap'].forEach(id => {
        const w = form.querySelector('#' + id);
        w.style.opacity = skip ? .45 : 1;
        w.querySelectorAll('input').forEach(i => { i.disabled = skip; if (skip) i.checked = false; });
      });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const err = [];
      const val = n => (form.elements[n] && form.elements[n].value || '').trim();
      const radio = n => { const c = form.querySelector(`input[name="${n}"]:checked`); return c ? +c.value : null; };
      if (form.querySelectorAll('input[name=consent]:checked').length < CONSENT.length) err.push('Please tick all consent statements.');
      if (!val('legal')) err.push('Legal name is required.');
      if (!val('gender') || !val('ctype')) err.push('Gender and client type are required.');
      if (!val('office')) err.push('Choose the office where the service was availed.');
      if (!val('service')) err.push('Describe the service availed.');
      const cc1 = radio('cc1'), skip = cc1 === 3;
      if (cc1 == null || (!skip && (radio('cc2') == null || radio('cc3') == null))) err.push("Answer the Citizen's Charter questions.");
      let missing = 0;
      form.querySelectorAll('.likert tbody tr').forEach(tr => {
        const ok = radio('sqd' + tr.dataset.q) != null;
        tr.classList.toggle('missing', !ok);
        if (!ok) missing++;
      });
      if (missing) err.push(`Rate all service quality statements (${missing} left).`);
      const box = form.querySelector('#formError');
      if (err.length) { box.innerHTML = err.map(esc).join('<br>'); return; }

      // Only anonymized fields are kept for analysis; identity fields stay out of the dataset.
      const ref = 'CSS-' + Date.now().toString(36).toUpperCase();
      Store.addSubmission({
        id: ref, date: val('cdate') || new Date().toISOString().slice(0, 10), office: val('office'), unit: val('unit'),
        gender: val('gender'), type: val('ctype'), cc1, cc2: skip ? -1 : radio('cc2'), cc3: skip ? -1 : radio('cc3'),
        sqd: SQD.map((_, i) => radio('sqd' + i)), comment: val('comment'), service: val('service'), source: 'web'
      });
      el.innerHTML = `<div class="survey"><div class="card thankyou">
        <h2>Thank you for your feedback!</h2>
        <p>Salamat sa inyong pagsagot. Your evaluation of <b>${esc(val('office'))}</b> has been recorded.</p>
        <p>Reference number <span class="ref">${ref}</span></p>
        <p class="small muted">Prototype: the response is saved in this browser only and is already included in the dashboard.</p>
        <div class="btn-row" style="justify-content:center"><a class="btn" href="#/evaluate">Evaluate another office</a><a class="btn ghost" href="#/dashboard">View dashboard</a></div>
      </div></div>`;
      window.scrollTo(0, 0);
    });
  }

  window.OME.views = window.OME.views || {};
  window.OME.views.evaluate = render;
})();
