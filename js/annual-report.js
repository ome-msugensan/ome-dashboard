/* Annual Report: placeholder layout for the OME annual report until its data is available. */
(function () {
  'use strict';
  const O = window.OME;

  // Planned report sections. Each links to the module that will feed it once the annual data is compiled.
  const SECTIONS = [
    { title: 'Executive Summary', text: 'Key accomplishments, challenges and directions of the University for the year.' },
    { title: 'Client Satisfaction', text: 'Annual CSS results by office, service quality ratings and client feedback.', route: 'dashboard' },
    { title: 'Licensure Examination Performance', text: 'Passing rates against the national average and topnotchers by program.', route: 'licensure' },
    { title: 'University KPI Accomplishments', text: 'Targets and actual accomplishments under each strategic direction.', route: 'kpi' },
    { title: 'Financial Performance', text: 'Budget allocation, release, obligation and disbursement for the fiscal year.', route: 'finance' },
    { title: 'Research and Publications', text: 'Scopus-indexed publications and department and faculty rankings.', route: 'publications' }
  ];
  const HIGHLIGHTS = ['CSS rating', 'Licensure passing rate', 'KPIs met', 'Budget utilization'];

  function annualReport(el) {
    el.innerHTML = `
      <div class="section-head"><div><span class="ar-eyebrow">Office of Monitoring and Evaluation · Annual Report</span><h2>Annual Report</h2><p class="muted">A yearly summary of the University's performance across client satisfaction, licensure, strategic KPIs, finances and research.</p></div></div>
      <div class="stack">
        <div class="card ar-status" role="status">
          <span class="ar-badge">In preparation</span>
          <div><h3>The annual report data is being compiled</h3><p class="muted">This page shows the planned layout of the report. Figures will appear here once the data for the reporting year is available.</p></div>
        </div>
        <section aria-labelledby="arHighlightsTitle">
          <h3 class="ar-section-title" id="arHighlightsTitle">Year at a glance</h3>
          <div class="grid ar-highlights">${HIGHLIGHTS.map(label => `<div class="card ar-highlight"><span>${label}</span><strong aria-label="No data yet">—</strong><small>Awaiting data</small></div>`).join('')}</div>
        </section>
        <section aria-labelledby="arSectionsTitle">
          <h3 class="ar-section-title" id="arSectionsTitle">Report sections</h3>
          <ol class="ar-sections">${SECTIONS.map((s, i) => `<li class="card ar-section">
            <span class="ar-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
            <div><h4>${s.title}</h4><p class="muted">${s.text}</p>${s.route ? `<a href="#/${s.route}">View current ${s.title.toLowerCase()} data →</a>` : ''}</div>
            <span class="ar-pill">Awaiting data</span>
          </li>`).join('')}</ol>
        </section>
      </div>`;
  }

  O.views['annual-report'] = annualReport;
})();
