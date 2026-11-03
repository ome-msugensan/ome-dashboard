/* University Financial Performance: GAA budget allocation and utilization, FY 2020–2026.
   Figures come from the OME report "GAA Budget Allocation and Utilization Monitoring Report, FY 2020–2026",
   which is based on the GAA (DBM) and the University Budget Office's budget execution records. */
(function () {
  'use strict';
  const O = window.OME;
  const esc = O.esc;

  const C = { ps: '#720455', mooe: '#ffab00', co: '#7d8fa3', approp: '#efdfae', allot: '#720455', oblig: '#b45f95', disb: '#ffab00' };
  const charts = [];
  const clearSurveyCharts = O.clearCharts || (() => {});
  O.clearCharts = () => { clearSurveyCharts(); while (charts.length) charts.pop().destroy(); };
  function chart(canvas, cfg) {
    if (!window.Chart) { canvas.parentElement.innerHTML = '<p class="muted small">Charts need an internet connection (Chart.js loads from a CDN).</p>'; return; }
    Chart.defaults.font.family = getComputedStyle(document.documentElement).fontFamily;
    Chart.defaults.color = '#5d6670';
    charts.push(new Chart(canvas, cfg));
  }

  /* ------------------------------ Data ------------------------------ */
  const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

  // Annex A: GAA appropriation by expense class (PhP).
  const GAA = {
    ps: [326570000, 350331000, 383720000, 395675000, 430317187, 475467000, 544492000],
    mooe: [28214000, 31669000, 43204000, 95971000, 110603000, 143993000, 154793000],
    co: [10000000, 76100000, 28562000, 110000000, 2140000000, 1005000000, 265000000]
  };
  const DRIVERS = [
    'Base year; CO limited to the PhP 10.00M infirmary building',
    'CO projects: College of Medicine Building Phase II (50.00M), Biodiversity Center (16.10M)',
    'CO down to 28.56M; offset by College of Medicine support (50.49M across PS, MOOE, CO)',
    'Free Higher Education enters the SUC budget (55.20M MOOE); College of Medicine carrying capacity (128.53M)',
    'Major Capital Outlay additions including Campus Modernization and Advanced Campus Network Development (~PhP 2.14B CO total)',
    'Expansion of Campus ICT Systems and Solutions (1,000.00M CO)',
    'ICT project not repeated; three new facilities (260.00M CO) and PS +14.5%'
  ];

  // Annex I: Budget execution report (Budget Management Office), PhP, as recorded. FY 2026 is as of July 2026.
  // [year, class, appropriation, allotment, obligation, disbursement, unreleased, unobligated, unpaid, flagged]
  const BMO = [
    [2020, 'PS', 326570000.00, 312753000.00, 309865511.00, 307530242.37, 13817000.00, 2887489.00, 2335268.63],
    [2020, 'MOOE', 28314000.00, 25212600.00, 25212152.79, 23102709.55, 3101400.00, 447.21, 2109443.24],
    [2020, 'CO', 10000000.00, 0, 0, 0, 0, 0, 0],
    [2020, 'Total', 364884000.00, 337965600.00, 335077663.79, 330632951.92, 16918400.00, 2887936.21, 4444711.87],
    [2021, 'PS', 350331000.00, 332531000.00, 332523819.40, 332393899.45, 17800000.00, 7180.60, 129919.95],
    [2021, 'MOOE', 31669000.00, 31669000.00, 31668953.30, 31508068.15, 0, 46.70, 160885.15],
    [2021, 'CO', 76100000.00, 76100000.00, 76100000.00, 25063360.29, 0, 0, 51036639.71],
    [2021, 'Total', 458100000.00, 440300000.00, 440292772.70, 388965327.89, 17800000.00, 7227.30, 51327444.81],
    [2022, 'PS', 383720000.00, 361455253.00, 361301895.44, 359321196.67, 22264747.00, 153357.56, 1980698.77],
    [2022, 'MOOE', 98401000.00, 91823450.00, 88162089.17, 85469755.04, 6577550.00, 3661360.83, 2692334.13],
    [2022, 'CO', 28562000.00, 28562000.00, 21787107.26, 0, 0, 6774892.74, 21787107.26],
    [2022, 'Total', 510683000.00, 481840703.00, 471251091.87, 444790951.71, 28842297.00, 10589611.13, 26460140.16],
    [2023, 'PS', 395675000.00, 372405942.00, 372383657.22, 372061070.84, 23269058.00, 22284.78, 322586.38],
    [2023, 'MOOE', 95971000.00, 94793550.00, 94793540.74, 94758493.60, 1177450.00, 9.26, 35047.14],
    [2023, 'CO', 110000000.00, 110000000.00, 110000000.00, 4844395.56, 0, 0, 105155604.44],
    [2023, 'Total', 601646000.00, 577199492.00, 577177197.96, 471663960.00, 24446508.00, 22294.04, 105513237.96],
    [2024, 'PS', 430317187.00, 429186960.00, 425919304.24, 422117212.42, 1130227.00, 3267655.76, 3802091.82],
    [2024, 'MOOE', 110603000.00, 110603000.00, 110601712.37, 110217593.67, 0, 1287.63, 384118.70],
    [2024, 'CO', 2140000000.00, 2065000000.00, 2062551229.59, 1338859640.40, 0, 2448770.41, 723691589.19, true],
    [2024, 'Total', 2680920187.00, 2604789960.00, 2599072246.20, 1871194446.49, 1130227.00, 5717713.80, 727877799.71],
    [2025, 'PS', 475467000.00, 453869979.00, 453866812.85, 452458138.13, 21597021.00, 3166.15, 1408674.72],
    [2025, 'MOOE', 143993000.00, 143993000.00, 143918680.06, 135660769.81, 0, 74319.94, 8257910.25],
    [2025, 'CO', 1005000000.00, 5000000.00, 4239809.64, 1663274.81, 1000000000.00, 760190.36, 2576534.83],
    [2025, 'Total', 1624460000.00, 602862979.00, 602025302.55, 589782182.75, 1021597021.00, 837676.45, 12243119.80],
    [2026, 'PS', 430317187.00, 429186960.00, 318924435.82, 315940473.09, 34904236.00, 185663328.18, 2983962.73],
    [2026, 'MOOE', 110603000.00, 110603000.00, 111017166.47, 79533642.13, 0, 48775833.53, 31483524.34],
    [2026, 'CO', 2140000000.00, 2065000000.00, 136360000.00, 20454000.00, 35000000.00, 93640000.00, 115906000.00],
    [2026, 'Total', 2680920187.00, 2604789960.00, 566301602.29, 415928115.22, 69904236.00, 328079161.71, 150373487.07, true]
  ].map(([year, cls, approp, allot, oblig, disb, unreleased, unobligated, unpaid, flagged]) => ({ year, cls, approp, allot, oblig, disb, unreleased, unobligated, unpaid, flagged: !!flagged }));
  const bmo = (year, cls) => BMO.find(r => r.year === year && r.cls === cls);

  // Report body figures (corrected where Annex I notes a recording error).
  const RELEASE = { // appropriation vs allotment, PhP M (BMO records; 2026 appropriation corrected)
    approp: [364.884, 458.100, 510.683, 601.646, 2680.920, 1624.460, 964.285],
    allot: [337.966, 440.300, 481.841, 577.199, 2604.790, 602.863, 894.381]
  };
  const UTIL = YEARS.map(year => {
    const t = bmo(year, 'Total');
    return { year, allot: year === 2026 ? 894380764 : t.allot, oblig: t.oblig, disb: t.disb };
  });
  const BALANCES = [
    [2020, 26.92, true, 2.89, 4.45, 'PS unreleased 13.82; CO infirmary unreleased 10.00'],
    [2021, 17.80, false, 0.01, 51.33, 'CO unpaid obligations 51.04'],
    [2022, 28.84, false, 10.59, 26.46, 'PS unreleased 22.26; CO unpaid obligations 21.79'],
    [2023, 24.45, false, 0.02, 105.51, 'CO unpaid obligations 105.16'],
    [2024, 76.13, true, 5.72, 727.88, 'CO unpaid obligations 723.69; CO unreleased 75.00'],
    [2025, 1021.60, false, 0.84, 12.24, 'CO ICT project unreleased 1,000.00'],
    ['2026 (Jul)', 69.90, false, 328.08, 150.37, 'PS unobligated 185.66; CO unpaid 115.91']
  ];
  const RECONCILE = [
    [2024, 'CO', '2,140.00', '2,140.00', '0.00', 'Includes major projects (Campus Modernization Program, Advanced Campus Network Development, etc.)'],
    [2022, 'MOOE', '43.20', '98.40', '+55.20', 'Equals the FY 2023 Free Higher Education line exactly; confirm whether FY 2022 FHE funds were released separately or the figure was carried over in error'],
    [2024, 'PS', '379.48', '430.32', '+50.84', 'Funding source for confirmation.'],
    [2024, 'MOOE', '108.30', '110.60', '+2.30', 'Additional SARO'],
    [2026, 'PS / MOOE', '544.49 / 154.79', '539.49 / 159.79', '−5.00 / +5.00', 'Product Development of Indigenous Crop and Fish Products (5.00M) is PS in the GAA tab, MOOE in the Report; check the GAA page'],
    [2020, 'MOOE', '28.21', '28.31', '+0.10', 'Transcription or a small additional release']
  ];

  // Annexes B–H: GAA line items. [category, line item, PS, MOOE, CO]
  const GAS = 'General Administration and Support', STO = 'Support to Operations', OPS = 'Operations', PRJ = 'Project(s)';
  const LFP = 'Locally-Funded Project(s) - ';
  const GMS = 'General Management and Supervision', APB = 'Administration of Personnel Benefits', AUX = 'Auxiliary Services';
  const HE = 'Higher Education Program - Provision of Higher Education Services';
  const ADV = 'Advanced Education Program - Provision of Advanced Education Services';
  const RES = 'Research Program - Conduct of Research Services';
  const EXT = 'Technical Advisory Extension Program - Provision of Extension Services';
  const FUT = LFP + 'Capacity Development on Futures Thinking and Strategic Foresight';
  const LINES = {
    2020: { annex: 'B', source: 'General Appropriations Act, FY 2020 (Official Gazette, Vol. 116 No. 1, Jan. 6, 2020), MSU chapter (R.3), pp. 758-763. MSU-General Santos grouped under Bangsamoro Autonomous Region in Muslim Mindanao (BARMM) regional line.', rows: [
      [GAS, GMS, 49137000, 10750000, 0], [GAS, APB, 14754000, 0, 0], [STO, AUX, 11462000, 1443000, 0],
      [OPS, HE, 242209000, 14522000, 0], [OPS, LFP + 'Construction/Completion of Infirmary and Medical Service Building, MSU-General Santos', 0, 0, 10000000],
      [OPS, ADV, 0, 28000, 0], [OPS, RES, 5966000, 1116000, 0], [OPS, EXT, 3042000, 355000, 0]] },
    2021: { annex: 'C', source: 'General Appropriations Act, FY 2021 (Official Gazette, Vol. 116 No. 52, Dec. 28, 2020), MSU chapter (R.3), pp. 778-784. MSU-General Santos grouped under Bangsamoro Autonomous Region in Muslim Mindanao (BARMM) regional line.', rows: [
      [GAS, GMS, 48472000, 11608000, 0], [GAS, APB, 16590000, 0, 0], [STO, AUX, 13751000, 1666000, 0],
      [STO, LFP + 'Expansion of University Medical Services Building, MSU Gensan', 0, 0, 10000000],
      [OPS, HE, 261504000, 16545000, 0], [OPS, LFP + 'Conduct of Activities for Sports and Culture Development', 0, 200000, 0],
      [OPS, LFP + 'Construction of College of Medicine Building (Phase II), MSU General Santos City', 0, 0, 50000000],
      [OPS, ADV, 0, 28000, 0], [OPS, RES, 6784000, 1261000, 0],
      [OPS, 'Research Program - ' + LFP + 'Construction of Center for Biodiversity Studies in SOCCSKSARGEN', 0, 0, 16100000],
      [OPS, EXT, 3230000, 361000, 0]] },
    2022: { annex: 'D', source: 'General Appropriations Act, FY 2022 (Official Gazette, Vol. 118 No. 1, Jan. 3, 2022), MSU chapter (R.3), pp. 773-778. MSU-General Santos grouped under Region XII - SOCCSKSARGEN regional line.', rows: [
      [GAS, GMS, 49765000, 11608000, 0], [GAS, APB, 811000, 0, 0], [STO, AUX, 14878000, 1666000, 0],
      [OPS, HE, 286392000, 16545000, 0],
      [OPS, LFP + 'Infrastructure and Smart Campus Development, Operationalization of Face-to-Face Classes and Upgrading/Procurement of Equipment', 0, 4180000, 6600000],
      [OPS, FUT, 0, 400000, 0],
      [OPS, LFP + 'Establishment and/or Support to the College of Medicine, MSU - General Santos', 21571000, 6955000, 21962000],
      [OPS, LFP + 'Conduct of Activities for Sports and Culture Development', 0, 100000, 0],
      [OPS, LFP + 'Student Assistance Program', 0, 100000, 0],
      [OPS, ADV, 0, 28000, 0], [OPS, RES, 7032000, 1261000, 0], [OPS, EXT, 3271000, 361000, 0]] },
    2023: { annex: 'E', source: 'General Appropriations Act, FY 2023 (Official Gazette), MSU chapter (R.3), pp. 778-785. MSU-General Santos grouped under Region XII - SOCCSKSARGEN regional line.', rows: [
      [GAS, GMS, 50683000, 12032000, 0], [GAS, APB, 2397000, 0, 0], [STO, AUX, 14746000, 1727000, 0],
      [OPS, HE, 295585000, 17150000, 0], [OPS, ADV, 0, 29000, 0], [OPS, RES, 7322000, 1307000, 0], [OPS, EXT, 3371000, 374000, 0],
      [PRJ, LFP + 'Free Higher Education', 0, 55197000, 0],
      [PRJ, LFP + 'Construction of the Virtual Learning Studio', 0, 0, 10000000],
      [PRJ, FUT, 0, 400000, 0],
      [PRJ, LFP + 'Increase in Carrying Capacity of the College of Medicine', 21571000, 6955000, 100000000],
      [PRJ, LFP + 'Higher Education Research and Innovation Project', 0, 600000, 0],
      [PRJ, LFP + 'Financial Assistance to Athletes', 0, 200000, 0]] },
    2024: { annex: 'F', source: 'General Appropriations Act, FY 2024 (Official Gazette, Vol. 119 No. 52, Dec. 25, 2023), MSU chapter (R.3), pp. 784-792. MSU-General Santos grouped under Region XII - SOCCSKSARGEN regional line.', rows: [
      [GAS, GMS, 51247000, 12805000, 0], [GAS, APB, 1609000, 0, 0], [STO, AUX, 15395000, 6324000, 0],
      [OPS, HE, 300504000, 21231000, 5000000], [OPS, ADV, 0, 206000, 0], [OPS, RES, 7346000, 3578000, 0], [OPS, EXT, 3397000, 388000, 0],
      [PRJ, LFP + 'Free Higher Education', 0, 54020000, 0],
      [PRJ, LFP + 'Completion of the University Gymnasium (Phase 2), MSU - General Santos', 0, 0, 75000000],
      [PRJ, LFP + 'Increase in Carrying Capacity of the College of Medicine', 0, 10000000, 10000000],
      [PRJ, FUT, 0, 400000, 0],
      [PRJ, LFP + 'Assessment and Characterization of Water Quality, Inland Capture Fisheries, Watershed, and Socio-economic of Important Water Bodies for Social and Economic Transformation in Central Mindanao', 0, 5000000, 0],
      [PRJ, LFP + 'Major Infrastructure Additions (Campus Modernization Program & Advanced Campus Network Development)', 50844000, 2297000, 2050000000]] },
    2025: { annex: 'G', source: 'General Appropriations Act, FY 2025 (Official Gazette, Vol. 120 No. 53, Dec. 30, 2024), MSU chapter (R.3), pp. 794-800. MSU-General Santos grouped under Region XII - SOCCSKSARGEN regional line.', rows: [
      [GAS, GMS, 51638000, 13045000, 0], [GAS, APB, 93965000, 0, 0], [STO, AUX, 15098000, 6493000, 0],
      [OPS, HE, 303984000, 23789000, 5000000], [OPS, ADV, 0, 1425000, 0], [OPS, RES, 7385000, 13833000, 0], [OPS, EXT, 3397000, 388000, 0],
      [PRJ, LFP + 'Free Higher Education', 0, 54020000, 0],
      [PRJ, LFP + 'Retrofitting of Academic Buildings, MSU - General Santos', 0, 30000000, 0],
      [PRJ, LFP + 'Tulong Dunong Program', 0, 1000000, 0],
      [PRJ, LFP + 'Expansion of Campus ICT Systems and Solutions', 0, 0, 1000000000]] },
    2026: { annex: 'H', source: 'General Appropriations Act, FY 2026 (Official Gazette, Vol. 122 No. 1, Jan. 5, 2026), MSU chapter (S.3), pp. 871-877. MSU-General Santos grouped under Region XII - SOCCSKSARGEN regional line.', rows: [
      [GAS, GMS, 62816000, 13292000, 0], [GAS, APB, 38611000, 0, 0], [STO, AUX, 17468000, 6667000, 0],
      [OPS, HE, 408525000, 48410000, 5000000], [OPS, 'Higher Education Program - Free Higher Education', 0, 60729000, 0],
      [OPS, ADV, 0, 1431000, 0], [OPS, RES, 8435000, 23869000, 0], [OPS, EXT, 3637000, 395000, 0],
      [PRJ, LFP + 'Completion of University Gymnasium, MSU-General Santos', 0, 0, 75000000],
      [PRJ, LFP + 'Construction of Academic Complex Building, MSU-General Santos', 0, 0, 150000000],
      [PRJ, LFP + 'Product Development and Commercialization of Indigenous Crop and Fish Products Phase III, MSU-General Santos', 5000000, 0, 0],
      [PRJ, LFP + 'Construction of Academic Facility for Peace, Culture and Arts, MSU - General Santos', 0, 0, 35000000]] }
  };

  const FINDINGS = [
    { section: 'II. Overview of the Annual Budget', items: [
      { title: 'Finding 2.1 — Budget Growth',
        reported: 'The 2024 budget reached PhP 2.68B due to major Capital Outlay additions such as the Campus Modernization Program and Advanced Campus Network Development. The 2025 budget subsequently adjusted to PhP 1.62B.',
        observations: 'Annual budget variations were substantially influenced by changes in Capital Outlay (CO) appropriations. Personnel Services (PS) and Maintenance and Other Operating Expenses (MOOE) appropriations generally increased annually throughout FY 2020–2026, reflecting an upward trend in funding for personnel and operating requirements.',
        validation: 'Confirm the major Capital Outlay (CO) projects and their corresponding appropriations with the University Budget Office and concerned implementing units.',
        action: 'Present Personnel Services (PS), Maintenance and Other Operating Expenses (MOOE), and Capital Outlay (CO) appropriations separately to provide a clearer picture of annual budget trends.' },
      { title: 'Finding 2.2 — Variations in Allotment Release Rates',
        reported: 'Allotment release rates were 92.6% (2020), 96.1% (2021), 94.4% (2022), 95.9% (2023), 97.2% (2024), 37.1% (2025), and 92.8% (2026, as of July). Excluding the ₱1.00 billion ICT appropriation, the adjusted 2025 release rate was approximately 96.5%.',
        observations: 'Release rates exceeded 90% in most years, except 2025. Significant differences between appropriations and allotments were observed in Capital Outlay, particularly in 2025. The ₱75.00 million difference recorded in 2024 requires reconciliation with the reported unreleased appropriation.',
        validation: 'Reconcile the reported appropriations and allotments with the University Budget Office records, taking into account the SARO issued in 2026. Confirm the status of any remaining differences, particularly those involving Capital Outlay projects.',
        action: 'Coordinate with the University Budget Office to ensure that allotment releases are reflected in the corresponding financial reports and that any remaining discrepancies are documented and reconciled.' },
      { title: 'Finding 2.3 — Differences in Budget Records',
        reported: 'A difference of ₱55.197 million was identified between the FY 2022 GAA MOOE appropriation and the University Budget Office record. For FY 2024, the appropriation figures are substantially consistent, but a ₱75.00 million difference between Capital Outlay appropriations and allotments was not reflected in the reported unreleased appropriations.',
        observations: 'FY 2022 — The difference is driven entirely by Maintenance and Other Operating Expenses (MOOE), where the GAA recorded PhP 43.20M compared to PhP 98.40M in the BMO Report. This exact ₱55.20M difference corresponds to the FY 2023 Free Higher Education line, which the report flags for confirmation to determine if funds were released separately or carried over in error. FY 2024 — The large difference is primarily driven by major Capital Outlay additions, specifically the Campus Modernization Program and Advanced Campus Network Development, which include ₱2,050M in CO not in the baseline GAA. Additional variances in Personnel Services (+₱50.84M) and MOOE (+₱2.30M) bring the total difference to approximately PhP 2.10B.',
        validation: 'Reconcile the identified differences using FAR No. 1, relevant SAROs, and supporting records from the University Budget Office.',
        action: 'Coordinate with the University Budget Office to clarify the differences and ensure consistency in budget monitoring records.',
        table: true }
    ] },
    { section: 'III. Analysis by Expense Classification', items: [
      { title: 'A. Personnel Services (PS)', lead: 'PS covers salaries, wages, allowances, benefits and other compensation of university personnel.',
        reported: 'PS appropriations increased by 66.7%, from ₱326.57 million in 2020 to ₱544.49 million in 2026. Appropriations increased annually, including an 8.8% increase in 2024. Administration of Personnel Benefits increased from ₱1.61 million in 2024 to ₱93.97 million in 2025, while Higher Education PS increased by 34.4% in 2026.',
        observations: 'PS recorded high obligation and disbursement rates relative to allotments from 2020 to 2025. Unreleased PS appropriations ranged from ₱1.13 million to ₱23.27 million during these years.',
        validation: 'Confirm the status of unreleased PS appropriations and significant annual changes using the Personnel Services Itemization and Plantilla of Personnel (PSIPOP), applicable DBM release records, and supporting documents from the University Budget Office and Human Resource Management Office.',
        action: 'Coordinate with the University Budget Office and Human Resource Management Office to regularly monitor PS appropriations, allotment releases, and staffing-related budget requirements.' },
      { title: 'B. Maintenance and Other Operating Expenses (MOOE)', lead: 'MOOE covers utilities, supplies, repairs, training, scholarships and other operating and administrative costs.',
        reported: 'MOOE appropriations increased from ₱28.21 million in 2020 to ₱154.79 million in 2026, approximately 5.5 times the initial amount. Notable allocations include Free Higher Education (₱54.02–60.73 million annually from 2023 to 2026), Higher Education Services, Research Services, and the ₱30.00 million retrofitting of academic buildings in 2025.',
        observations: 'MOOE recorded generally high allotment release and obligation rates during FY 2020–2025. Unpaid obligations increased from ₱0.38 million in 2024 to ₱8.26 million in 2025. Research MOOE appropriations also increased substantially during the review period.',
        validation: 'Confirm the status of reported unpaid MOOE obligations and the utilization of significant program and project allocations using supporting records from the University Budget Office, Accounting Office, and concerned implementing units.',
        action: 'Coordinate with the concerned offices to monitor MOOE utilization, outstanding obligations, and the implementation status of major funded activities.' },
      { title: 'C. Capital Outlay (CO)', lead: 'CO covers buildings, facilities, equipment, ICT systems and other assets that last beyond one year.',
        reported: 'CO appropriations varied significantly, from ₱10.00 million in 2020 to ₱2,140.00 million in 2024, before decreasing to ₱1,005.00 million in 2025 and ₱265.00 million in 2026. Differences between appropriations and allotments were recorded in 2020 (₱10.00 million), 2024 (₱75.00 million), 2025 (₱1,000.00 million), and 2026 (₱35.00 million).',
        observations: 'Significant differences between CO obligations and disbursements were recorded, particularly in 2022, 2023, and 2024. The GAA also includes ₱75.00 million for the University Gymnasium (Phase 2) in 2024 and another ₱75.00 million for its completion in 2026. The release and implementation status of these appropriations requires confirmation.',
        validation: 'Verify the allotment release, obligation, disbursement, and implementation status of major CO projects using relevant Budget Office records, procurement documents, contracts, and project accomplishment reports.',
        action: 'Coordinate with the University Budget Office and concerned implementing units to regularly monitor CO projects, including their budget utilization, implementation progress, and outstanding obligations.' }
    ] },
    { section: 'IV. Budget Utilization', items: [
      { title: 'Finding 4.1 — Obligation Rates',
        reported: 'Obligation rates ranged from 97.8% in 2022 to approximately 100% in 2021 and 2023. The largest unobligated allotment balance among completed fiscal years was ₱10.59 million in 2022, comprising ₱6.77 million in CO, ₱3.66 million in MOOE, and ₱0.15 million in PS.',
        observations: 'The records indicate high obligation rates relative to reported allotments. However, while CO allotments were fully obligated in 2021 and 2023, only 32.9% and 4.4% of the corresponding obligations were disbursed, respectively.',
        validation: 'Verify the status and timing of CO obligations and corresponding disbursements in 2021 and 2023 using Obligation Request and Status (ORS) documents, contracts, notices to proceed, and relevant accounting records.',
        action: 'Coordinate with the University Budget Office, Accounting Office, and concerned implementing units to regularly monitor CO obligations and corresponding disbursements, particularly those with significant outstanding balances.' },
      { title: 'Finding 4.2 — Disbursement Gap',
        reported: 'Year-end unpaid obligations amounted to ₱51.33 million in 2021, ₱105.51 million in 2023, and ₱727.88 million in 2024, with Capital Outlay (CO) accounting for more than 99% of the reported balances in each year. CO disbursements represented 32.9% of obligations in 2021, 0.0% in 2022, 4.4% in 2023, and 64.9% in 2024.',
        observations: 'Significant differences between CO obligations and disbursements were recorded, particularly in 2022, 2023, and 2024. The largest reported unpaid CO obligation balance was ₱723.69 million in 2024. The status of these obligations and corresponding project implementation requires further verification.',
        validation: 'Verify the status and aging of unpaid CO obligations using FAR No. 3, relevant accounting records, project accomplishment reports, and contract billing documents. Determine whether the reported balances were subsequently disbursed, remained outstanding, or were otherwise adjusted in accordance with applicable rules.',
        action: 'Coordinate with the University Budget Office, Accounting Office, and concerned implementing units to periodically reconcile outstanding CO obligations and monitor their corresponding disbursements and project implementation status.' },
      { title: 'Finding 4.3 — FY 2026 Budget Utilization (as of July 2026)',
        reported: 'As of July 2026, 63.3% of total allotments had been obligated. Obligation rates were 63.2% for Personnel Services (PS), 69.5% for Maintenance and Other Operating Expenses (MOOE), and 59.3% for Capital Outlay (CO). CO disbursements represented 15.0% of recorded obligations, while unpaid MOOE obligations amounted to ₱31.48 million.',
        observations: 'As of July 2026, CO recorded ₱93.64 million in unobligated allotments and ₱115.91 million in unpaid obligations. These balances warrant continued monitoring of project implementation and disbursement status during the remaining months of the fiscal year.',
        validation: 'Verify the procurement, implementation, obligation, and disbursement status of major FY 2026 CO projects, including the University Gymnasium, Academic Complex Building, and Peace, Culture and Arts Facility. Confirm the status of unpaid MOOE obligations using relevant accounting records.',
        action: 'Coordinate with the University Budget Office, Procurement Office, Accounting Office, and concerned implementing units to regularly monitor the utilization of remaining FY 2026 allotments and the status of outstanding obligations.' }
    ] },
    { section: 'V. Outstanding Balances and Areas of Concern', items: [
      { title: 'Finding 5.1 — Unreleased Appropriations',
        reported: 'Cumulative annual unreleased appropriations amounted to ₱1,195.73 million during FY 2020–2025, comprising ₱1,085.00 million in Capital Outlay (CO), ₱99.88 million in Personnel Services (PS), and ₱10.86 million in Maintenance and Other Operating Expenses (MOOE). Excluding the ₱1,000.00 million in unreleased CO appropriations recorded for FY 2025, the cumulative amount was ₱195.73 million.',
        observations: 'Unreleased PS appropriations were recorded in each fiscal year, with varying amounts. Unreleased CO appropriations were also identified in 2020, 2024, and 2025. The reasons for these differences between appropriations and allotments require confirmation from the concerned offices.',
        validation: 'Reconcile the reported unreleased appropriations against applicable Special Allotment Release Orders (SAROs), GAA-as-release-document provisions, and supporting records from the University Budget Office. Verify the status of unreleased PS appropriations using PSIPOP and relevant staffing records. Confirm the specific projects associated with the unreleased CO appropriations and determine whether subsequent releases or adjustments were recorded.' },
      { title: 'Finding 5.2 — Unobligated Allotments',
        reported: 'PhP 20.06M was left unobligated across 2020–2025, half of it in 2022 (CO PhP 6.77M, MOOE PhP 3.66M). As of July 2026, PhP 328.08M is unobligated, including CO PhP 93.64M.',
        observations: 'Completed years show strong commitment of released funds. The 2022 Capital Outlay unobligated balance requires verification to determine its disposition. The 2026 CO balance is the main risk to watch this year.',
        validation: 'BAC resolutions and notices of award for 2022 CO (to identify bid savings); reversion records; procurement status of 2026 CO.' },
      { title: 'Finding 5.3 — Unpaid Obligations',
        reported: 'Cumulative annual unobligated allotments amounted to ₱20.06 million during FY 2020–2025, with ₱10.59 million recorded in 2022, representing more than half of the total. The 2022 balance included ₱6.77 million in Capital Outlay (CO) and ₱3.66 million in Maintenance and Other Operating Expenses (MOOE). As of July 2026, unobligated allotments amounted to ₱328.08 million, including ₱93.64 million in CO.',
        observations: 'Completed fiscal years generally recorded high obligation rates relative to reported allotments. The 2022 CO unobligated balance warrants verification of its status and disposition. The FY 2026 unobligated balances require continued monitoring during the remaining months of the fiscal year.',
        validation: 'Verify the status and disposition of the FY 2022 unobligated CO allotment using relevant procurement and budget records, including BAC resolutions, notices of award, and applicable reversion records. Confirm the procurement, obligation, and implementation status of FY 2026 CO projects using supporting documents from the concerned offices.' }
    ] }
  ];

  /* ------------------------------ Helpers ------------------------------ */
  const sum = arr => arr.reduce((a, b) => a + b, 0);
  const total = i => GAA.ps[i] + GAA.mooe[i] + GAA.co[i];
  const M = v => v / 1e6;
  const fmtM = (v, d = 2) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtPeso = v => v ? Number(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '';
  const fmtPeso2 = v => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (a, b, d = 1) => b ? (a / b * 100).toFixed(d) + '%' : '—';
  const signed = (v, d = 2) => (v > 0 ? '+' : v < 0 ? '−' : '') + fmtM(Math.abs(v), d);
  const kpi = (label, value, foot) => `<div class="card kpi"><div class="label">${label}</div><div class="value">${value}</div><div class="foot">${foot || ''}</div></div>`;
  const yearLabels = YEARS.map(y => y === 2026 ? '2026 (Jul)' : String(y));
  const moneyTick = v => '₱' + Number(v).toLocaleString('en-US') + 'M';

  function head(title, subtitle) {
    return `<div class="section-head fin-page-head"><div><span class="fin-eyebrow">Office of Monitoring and Evaluation · Financial Performance</span><h2>${title}</h2><p class="muted">${subtitle}</p></div></div>`;
  }
  function subnav(active) {
    const links = [['finance', 'Budget Dashboard'], ['finance-findings', 'Findings & Recommendations'], ['finance-annexes', 'Line Items & Execution Report']];
    return `<nav class="fin-subnav no-print" aria-label="Financial Performance pages">${links.map(([route, label]) =>
      `<a href="#/${route}"${route === active ? ' class="active" aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`;
  }
  const sourceNote = '<p class="fin-source">Source: OME, <em>GAA Budget Allocation and Utilization Monitoring Report, FY 2020–2026</em>, based on the General Appropriations Act (DBM) and the University Budget Office\'s budget execution records. FY 2026 figures are as of July 2026; the reporting cutoffs for FY 2020–2025 remain subject to confirmation by the University Budget Office.</p>';

  /* ------------------------------ Budget dashboard ------------------------------ */
  function dashboard(el) {
    const first = total(0), last = total(6);
    const peak = Math.max(...YEARS.map((_, i) => total(i)));
    const unpaid2025 = sum(BMO.filter(r => r.cls === 'Total' && r.year <= 2025).map(r => r.unpaid));
    el.innerHTML = head('University Financial Performance', 'GAA budget allocation and utilization of MSU – General Santos, FY 2020–2026: appropriations, allotments, obligations and disbursements by expense class.') + subnav('finance') + `
      <div class="stack fin-page">
        <div class="grid kpis">
          ${kpi('FY 2026 GAA appropriation', '₱' + fmtM(M(last)) + '<small>M</small>', `+${((last / first - 1) * 100).toFixed(0)}% from ₱${fmtM(M(first))}M in FY 2020`)}
          ${kpi('Peak appropriation', '₱' + fmtM(peak / 1e9) + '<small>B</small>', 'FY 2024 · major Capital Outlay additions')}
          ${kpi('FY 2026 release rate', pct(RELEASE.allot[6], RELEASE.approp[6]), '93–97% in most years; 37.1% in FY 2025')}
          ${kpi('Obligation rate, FY 2020–2025', '≥97.8%', 'Of allotments obligated each year (97.8–100%)')}
          ${kpi('Unpaid obligations, FY 2020–2025', '₱' + fmtM(M(unpaid2025)) + '<small>M</small>', 'Year-end balances; about 97% Capital Outlay')}
        </div>

        <div class="card">
          <h3>Release rates held at 93–97% every year except 2025</h3>
          <p class="small muted">Appropriation vs. allotment, PhP millions. The percentage is the share of the appropriation released by DBM.</p>
          <div class="chart-box tall"><canvas id="finRelease"></canvas></div>
          <p class="fin-note">2024 includes PhP 2,050M CO not in the baseline GAA. The 2025 gap is the PhP 1,000M ICT project that was not released. 2026 is as of July (appropriation corrected to PhP 964.29M).</p>
        </div>

        <div class="card">
          <h3>GAA appropriation by year</h3>
          <p class="small muted">The appropriation rose 164% over seven years and peaked in FY 2024.</p>
          <div class="table-wrap"><table><thead><tr><th>Fiscal year</th><th class="num">GAA appropriation (PhP M)</th><th class="num">Change vs. prior year (PhP M)</th><th class="num">Change (%)</th><th>Main driver</th></tr></thead><tbody>
            ${YEARS.map((y, i) => { const t = total(i), p = i ? total(i - 1) : null; return `<tr><td>${y}</td><td class="num">${fmtM(M(t))}</td><td class="num">${p == null ? '—' : signed(M(t - p))}</td><td class="num">${p == null ? '—' : signed((t / p - 1) * 100, 1) + '%'}</td><td>${esc(DRIVERS[i])}</td></tr>`; }).join('')}
          </tbody></table></div>
        </div>

        <div class="grid g2">
          <div class="card">
            <h3>Appropriation by expense class</h3>
            <p class="small muted">Personnel Services (PS), Maintenance and Other Operating Expenses (MOOE) and Capital Outlay (CO), PhP millions.</p>
            <div class="chart-box tall"><canvas id="finClass"></canvas></div>
          </div>
          <div class="card">
            <h3>PS share fell from 89.5% to 56.5%</h3>
            <p class="small muted">GAA appropriation by expense class (PhP M).</p>
            <div class="table-wrap"><table><thead><tr><th>Year</th><th class="num">PS</th><th class="num">MOOE</th><th class="num">CO</th><th class="num">Total</th><th class="num">PS share</th></tr></thead><tbody>
              ${YEARS.map((y, i) => `<tr><td>${y}</td><td class="num">${fmtM(M(GAA.ps[i]))}</td><td class="num">${fmtM(M(GAA.mooe[i]))}</td><td class="num">${fmtM(M(GAA.co[i]))}</td><td class="num"><b>${fmtM(M(total(i)))}</b></td><td class="num">${pct(GAA.ps[i], total(i))}</td></tr>`).join('')}
            </tbody></table></div>
            <p class="fin-note">PS +66.7%, MOOE about 5.5 times, and CO from PhP 10.00M to a PhP 2,140.00M peak in 2024.</p>
          </div>
        </div>

        <div class="card">
          <h3>Budget utilization: allotment, obligation and disbursement</h3>
          <p class="small muted">All expense classes, PhP millions. The University obligated 97.8–100% of its allotments in FY 2020–2025, but disbursements trailed obligations, especially in 2021, 2023 and 2024.</p>
          <div class="chart-box tall"><canvas id="finUtil"></canvas></div>
          <div class="table-wrap"><table><thead><tr><th>Fiscal year</th><th class="num">Allotment</th><th class="num">Obligation</th><th class="num">Disbursement</th><th class="num">Obligated / allotment</th><th class="num">Disbursed / obligation</th></tr></thead><tbody>
            ${UTIL.map((u, i) => `<tr><td>${yearLabels[i]}</td><td class="num">${fmtM(M(u.allot))}</td><td class="num">${fmtM(M(u.oblig))}</td><td class="num">${fmtM(M(u.disb))}</td><td class="num">${pct(u.oblig, u.allot)}</td><td class="num">${pct(u.disb, u.oblig)}</td></tr>`).join('')}
          </tbody></table></div>
        </div>

        <div class="card">
          <h3>0–65% of Capital Outlay obligations were paid by year-end</h3>
          <p class="small muted">Disbursements as a share of obligations by expense class. 2020 CO had no obligations. These are year-end snapshots; unpaid amounts may be settled the following year. 2026 is as of July.</p>
          <div class="chart-box"><canvas id="finDisb"></canvas></div>
        </div>

        <div class="card">
          <h3>Outstanding balances by year</h3>
          <p class="small muted">PhP millions. From FY 2020 to 2025, cumulative unreleased appropriations reached ₱1.20 billion and year-end unpaid obligations ₱927.87 million; Capital Outlay accounted for about 91% and 97% of them.</p>
          <div class="table-wrap"><table><thead><tr><th>Fiscal year</th><th class="num">Unreleased appropriation</th><th class="num">Unobligated allotment</th><th class="num">Unpaid obligation</th><th>Largest component</th></tr></thead><tbody>
            ${BALANCES.map(([y, unrel, adj, unob, unpaid, note]) => `<tr><td>${y}</td><td class="num">${fmtM(unrel)}${adj ? '*' : ''}</td><td class="num">${fmtM(unob)}</td><td class="num">${fmtM(unpaid)}</td><td>${esc(note)}</td></tr>`).join('')}
          </tbody></table></div>
          <p class="fin-note">* Adjusted to include Capital Outlay appropriations that were not allotted (₱10.00 million in 2020 and ₱75.00 million in 2024), which were not reflected in the unreleased appropriations reported by the University Budget Office.</p>
        </div>

        <div class="grid g2">
          <div class="card">
            <h3>Most significant changes, 2020–2026</h3>
            <ol class="fin-list">
              <li><b>Scale.</b> The GAA appropriation rose from PhP 364.78M to PhP 964.29M (+164%), reaching a peak of PhP 2.68B in 2024. MOOE grew 5.5 times and PS 66.7%.</li>
              <li><b>Composition.</b> PS fell from 89.5% to 56.5% of the budget as MOOE programs and projects expanded.</li>
              <li><b>Capital projects.</b> CO grew from PhP 10.00M to a peak of PhP 2.14B in 2024, driven by major infrastructure and campus development programs.</li>
              <li><b>Free Higher Education.</b> From FY 2023, Free Higher Education was separately identified in the University's GAA, with annual MOOE appropriations of ₱54.02–60.73 million through FY 2026.</li>
            </ol>
          </div>
          <div class="card">
            <h3>Recurring patterns</h3>
            <ul class="fin-list">
              <li><b>PS</b> is released 4–6% short in most years, then obligated and paid almost in full.</li>
              <li><b>MOOE</b> is released, obligated and paid at 92–100% in every completed year.</li>
              <li><b>CO</b> is either released in full or not at all; once released it is obligated quickly but paid slowly (0–65% by year-end).</li>
            </ul>
            <p class="small"><a href="#/finance-findings">Read the findings and recommended actions →</a></p>
          </div>
        </div>
        ${sourceNote}
      </div>`;

    const money = { ticks: { callback: moneyTick }, grid: { color: '#eee9ee' } };
    chart(el.querySelector('#finRelease'), {
      type: 'bar',
      data: { labels: yearLabels, datasets: [
        { label: 'Appropriation', data: RELEASE.approp, backgroundColor: C.approp, borderColor: '#d9c27c', borderWidth: 1 },
        { label: 'Allotment', data: RELEASE.allot, backgroundColor: C.allot }
      ] },
      options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: money, x: { grid: { display: false } } },
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: {
          label: c => `${c.dataset.label}: ₱${fmtM(c.parsed.y)}M`,
          footer: items => 'Released: ' + pct(RELEASE.allot[items[0].dataIndex], RELEASE.approp[items[0].dataIndex]) } } } },
      plugins: [{ id: 'releaseLabels', afterDatasetsDraw(c) {
        const { ctx } = c, meta = c.getDatasetMeta(0);
        ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = '#4c0239'; ctx.font = '600 12px ' + Chart.defaults.font.family;
        meta.data.forEach((bar, i) => ctx.fillText(pct(RELEASE.allot[i], RELEASE.approp[i]), (bar.x + c.getDatasetMeta(1).data[i].x) / 2, bar.y - 8));
        ctx.restore();
      } }]
    });
    chart(el.querySelector('#finClass'), {
      type: 'bar',
      data: { labels: YEARS, datasets: [
        { label: 'PS', data: GAA.ps.map(M), backgroundColor: C.ps },
        { label: 'MOOE', data: GAA.mooe.map(M), backgroundColor: C.mooe },
        { label: 'CO', data: GAA.co.map(M), backgroundColor: C.co }
      ] },
      options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        scales: { x: { stacked: true, grid: { display: false } }, y: { ...money, stacked: true } },
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ₱${fmtM(c.parsed.y)}M`, footer: items => 'Total: ₱' + fmtM(M(total(items[0].dataIndex))) + 'M' } } } }
    });
    chart(el.querySelector('#finUtil'), {
      type: 'bar',
      data: { labels: yearLabels, datasets: [
        { label: 'Allotment', data: UTIL.map(u => M(u.allot)), backgroundColor: C.allot },
        { label: 'Obligation', data: UTIL.map(u => M(u.oblig)), backgroundColor: C.oblig },
        { label: 'Disbursement', data: UTIL.map(u => M(u.disb)), backgroundColor: C.disb }
      ] },
      options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: money, x: { grid: { display: false } } },
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ₱${fmtM(c.parsed.y)}M` } } } }
    });
    const disbRate = cls => YEARS.map(y => { const r = bmo(y, cls); return r.oblig ? +(r.disb / r.oblig * 100).toFixed(1) : null; });
    chart(el.querySelector('#finDisb'), {
      type: 'line',
      data: { labels: yearLabels, datasets: [
        { label: 'PS', data: disbRate('PS'), borderColor: '#b9b3bd', backgroundColor: '#b9b3bd', pointRadius: 3, tension: .2 },
        { label: 'MOOE', data: disbRate('MOOE'), borderColor: '#b9b3bd', backgroundColor: '#b9b3bd', borderDash: [6, 5], pointRadius: 3, tension: .2 },
        { label: 'CO', data: disbRate('CO'), borderColor: C.ps, backgroundColor: C.ps, borderWidth: 3, pointRadius: 5, tension: .2 }
      ] },
      options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, spanGaps: false,
        scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' }, grid: { color: '#eee9ee' } }, x: { grid: { display: false } } },
        plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y == null ? 'no obligations' : c.parsed.y.toFixed(1) + '%'}` } } } }
    });
  }

  /* ------------------------------ Findings ------------------------------ */
  function findings(el) {
    const block = f => `<details class="fin-finding">
      <summary>${esc(f.title)}</summary>
      <div class="fin-finding-body">
        ${f.lead ? `<p class="muted">${esc(f.lead)}</p>` : ''}
        <dl>
          <dt>Reported data</dt><dd>${esc(f.reported)}</dd>
          <dt>Observations</dt><dd>${esc(f.observations)}</dd>
          <dt>For validation</dt><dd>${esc(f.validation)}</dd>
          ${f.action ? `<dt>Recommended action</dt><dd>${esc(f.action)}</dd>` : ''}
        </dl>
        ${f.table ? `<div class="table-wrap"><table><thead><tr><th>Year</th><th>Class</th><th class="num">GAA (PhP M)</th><th class="num">BMO report (PhP M)</th><th class="num">Difference (PhP M)</th><th>To confirm</th></tr></thead><tbody>
          ${RECONCILE.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="num">${r[2]}</td><td class="num">${r[3]}</td><td class="num">${r[4]}</td><td>${esc(r[5])}</td></tr>`).join('')}
        </tbody></table></div>` : ''}
      </div>
    </details>`;
    el.innerHTML = head('Findings & Recommendations', 'Observations from the GAA budget allocation and utilization review, matters for validation, and recommended actions for the concerned offices.') + subnav('finance-findings') + `
      <div class="stack fin-page">
        <div class="grid g2">
          <div class="card">
            <h3>Purpose of the review</h3>
            <p>MSU – General Santos' GAA appropriation grew from PhP 364.78M in FY 2020 to PhP 964.29M in FY 2026, reaching a peak of PhP 2.68B in FY 2024. The review examines trends in appropriations, allotments, obligations and disbursements across the seven GAA years to identify areas requiring further monitoring and validation. It aims to:</p>
            <ul class="fin-list">
              <li>Present annual budget trends by expense class: PS, MOOE and CO.</li>
              <li>Compare appropriations, allotments, obligations and disbursements across fiscal years.</li>
              <li>Examine reported balances: unreleased appropriations, unobligated allotments and unpaid obligations.</li>
              <li>Identify areas requiring clarification and validation by the concerned offices.</li>
            </ul>
          </div>
          <div class="card">
            <h3>Definition of terms</h3>
            <dl class="fin-terms">
              <dt>Appropriation</dt><dd>Spending authority provided under the General Appropriations Act (GAA).</dd>
              <dt>Allotment</dt><dd>Authority released by the Department of Budget and Management (DBM) to incur obligations.</dd>
              <dt>Obligation</dt><dd>Financial commitment for authorized expenditures.</dd>
              <dt>Disbursement</dt><dd>Actual payment of funds.</dd>
              <dt>Unreleased appropriation</dt><dd>Appropriation minus allotment.</dd>
              <dt>Unobligated allotment</dt><dd>Allotment minus obligation.</dd>
              <dt>Unpaid obligation</dt><dd>Obligation minus disbursement.</dd>
            </dl>
          </div>
        </div>
        <div class="card fin-callout">
          <h3>Data notes</h3>
          <p>The review identified the following discrepancies requiring reconciliation with the University Budget Office:</p>
          <ol class="fin-list">
            <li>Differences between GAA appropriations and University Budget Office records were identified for FY 2020, 2022, 2024 and 2026 (see Finding 2.3).</li>
            <li>FY 2020 Capital Outlay records show ₱10.00 million in appropriations without corresponding allotments. For FY 2024, a ₱75.00 million difference between CO appropriations and allotments was not reflected in the reported unreleased appropriation. These discrepancies require clarification by the University Budget Office.</li>
          </ol>
        </div>
        ${FINDINGS.map(group => `<section class="card fin-findings-group"><h3>${esc(group.section)}</h3>${group.items.map(block).join('')}</section>`).join('')}
        <div class="card">
          <h3>Matters for further validation and monitoring</h3>
          <ol class="fin-list">
            <li>Reconciliation of identified differences between GAA appropriations and the University Budget Office's records.</li>
            <li>Verification of reported unreleased appropriations, particularly those under Capital Outlay and Personnel Services.</li>
            <li>Monitoring of unobligated allotments and unpaid obligations, including the implementation and disbursement status of major Capital Outlay projects.</li>
            <li>Continued monitoring of FY 2026 budget utilization based on updated financial and project implementation reports.</li>
          </ol>
          <p class="small muted">These matters may be coordinated with the University Budget Office and other concerned offices to support subsequent monitoring, reporting, and management decision-making.</p>
        </div>
        <div class="card">
          <h3>Conclusion</h3>
          <p>The review of GAA budget records for FY 2020–2026 indicates an overall increase in appropriations, with varying levels of allotment, obligation and disbursement across expense classes. The records show generally high obligation rates for completed fiscal years, while differences between obligations and disbursements were particularly evident in Capital Outlay.</p>
          <p>These observations are based on available financial records and do not establish the underlying causes of the reported variations. Further validation by the Budget Management Office, Accounting Office and concerned implementing units is recommended. The findings may serve as a basis for continued monitoring of budget utilization, project implementation and institutional planning.</p>
          <div class="fin-signatories">
            <div><span>Prepared by</span><b>Ruby Jane Uy Facurib</b>Administrative Aide VI, Office of Monitoring and Evaluation</div>
            <div><span>Reviewed and noted by</span><b>Jypzie Catedrilla, DIT</b>Director, Office of Monitoring and Evaluation</div>
          </div>
        </div>
        ${sourceNote}
      </div>`;
  }

  /* ------------------------------ Annexes ------------------------------ */
  let annexYear = 2026;
  function annexes(el) {
    const render = () => {
      const data = LINES[annexYear], i = YEARS.indexOf(annexYear);
      const lineTable = `<div class="table-wrap"><table class="fin-lines"><thead><tr><th>Budget category</th><th>Line item / program</th><th class="num">PS (PhP)</th><th class="num">MOOE (PhP)</th><th class="num">CO (PhP)</th><th class="num">Total (PhP)</th></tr></thead><tbody>
        ${data.rows.map(([cat, item, ps, mooe, co]) => `<tr><td>${esc(cat)}</td><td>${esc(item)}</td><td class="num">${fmtPeso(ps)}</td><td class="num">${fmtPeso(mooe)}</td><td class="num">${fmtPeso(co)}</td><td class="num">${fmtPeso(ps + mooe + co)}</td></tr>`).join('')}
        <tr class="fin-total"><td colspan="2">TOTAL, MSU-General Santos (${annexYear})</td><td class="num">${fmtPeso(GAA.ps[i])}</td><td class="num">${fmtPeso(GAA.mooe[i])}</td><td class="num">${fmtPeso(GAA.co[i])}</td><td class="num">${fmtPeso(total(i))}</td></tr>
      </tbody></table></div>`;
      el.querySelector('#finLines').innerHTML = `<p class="small muted">Annex ${data.annex}. GAA FY ${annexYear} line items.</p>${lineTable}<p class="fin-note">Source: ${esc(data.source)}</p>`;
      el.querySelectorAll('[data-year]').forEach(b => { const on = Number(b.dataset.year) === annexYear; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    };
    el.innerHTML = head('Line Items & Execution Report', 'The data behind the review: GAA line items for each fiscal year and the Budget Management Office\'s budget execution report.') + subnav('finance-annexes') + `
      <div class="stack fin-page">
        <div class="card">
          <h3>Annex A. GAA budget summary by expense class</h3>
          <p class="small muted">Philippine pesos, as appropriated in the General Appropriations Act for each fiscal year.</p>
          <div class="table-wrap"><table><thead><tr><th>Fiscal year</th><th class="num">Personnel Services</th><th class="num">MOOE</th><th class="num">Capital Outlay</th><th class="num">Total budget</th><th class="num">Change vs. prior year (PhP)</th><th class="num">Change (%)</th></tr></thead><tbody>
            ${YEARS.map((y, j) => { const t = total(j), p = j ? total(j - 1) : null; return `<tr><td>${y}</td><td class="num">${fmtPeso(GAA.ps[j])}</td><td class="num">${fmtPeso(GAA.mooe[j])}</td><td class="num">${fmtPeso(GAA.co[j])}</td><td class="num"><b>${fmtPeso(t)}</b></td><td class="num">${p == null ? '—' : (t >= p ? '+' : '−') + fmtPeso(Math.abs(t - p))}</td><td class="num">${p == null ? '—' : signed((t / p - 1) * 100, 1) + '%'}</td></tr>`; }).join('')}
          </tbody></table></div>
        </div>
        <div class="card">
          <div class="fin-card-head"><h3>Annexes B–H. GAA line items by fiscal year</h3>
            <div class="fin-years" role="group" aria-label="Fiscal year">${YEARS.map(y => `<button type="button" class="btn ghost" data-year="${y}">${y}</button>`).join('')}</div></div>
          <div id="finLines"></div>
        </div>
        <div class="card">
          <h3>Annex I. Budget execution report, FY 2020–2026 (Budget Management Office)</h3>
          <p class="small muted">PhP, as recorded in the Report tab. FY 2026 is as of July 2026. Rows marked † contain recording errors noted below; the dashboard uses the corrected figures.</p>
          <div class="table-wrap"><table class="fin-exec"><thead><tr><th>Fiscal year</th><th>Class</th><th class="num">Appropriation</th><th class="num">Allotment</th><th class="num">Obligation</th><th class="num">Disbursement</th><th class="num">Unreleased appropriation</th><th class="num">Unobligated allotment</th><th class="num">Unpaid obligation</th></tr></thead><tbody>
            ${BMO.map(r => `<tr${r.cls === 'Total' ? ' class="fin-total"' : ''}><td>${r.year === 2026 ? '2026 (Jul)' : r.year}</td><td>${r.cls}${r.flagged ? ' †' : ''}</td>${['approp', 'allot', 'oblig', 'disb', 'unreleased', 'unobligated', 'unpaid'].map(k => `<td class="num">${fmtPeso2(r[k])}</td>`).join('')}</tr>`).join('')}
          </tbody></table></div>
          <p class="fin-note"><b>† Recording notes.</b> (1) 2020 CO: PhP 10,000,000.00 was appropriated but not allotted; the unreleased appropriation should read 10,000,000.00 (2020 total unreleased: 26,918,400.00). (2) 2024 CO: the unreleased appropriation should read 75,000,000.00 (2,140,000,000.00 − 2,065,000,000.00); 2024 total unreleased: 76,130,227.00. (3) 2026 Total: the appropriation cell shows the allotment total and the allotment cell shows the obligation total. Correct totals: appropriation 964,285,000.00; allotment 894,380,764.00. The Appropriation column may include funds beyond the GAA (see Finding 2.3).</p>
        </div>
        ${sourceNote}
      </div>`;
    el.querySelectorAll('[data-year]').forEach(b => b.addEventListener('click', () => { annexYear = Number(b.dataset.year); render(); }));
    render();
  }

  O.views.finance = dashboard;
  O.views['finance-findings'] = findings;
  O.views['finance-annexes'] = annexes;
})();
