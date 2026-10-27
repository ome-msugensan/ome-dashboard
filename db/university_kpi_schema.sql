-- Import once into the existing OME MySQL database (if0_42396485_ome_website).
-- Independent from the CSS and licensure tables. INSERT IGNORE preserves later staff edits.
CREATE TABLE IF NOT EXISTS university_kpi_directions (
  direction_id INT NOT NULL PRIMARY KEY,
  direction_number TINYINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  UNIQUE KEY university_kpi_direction_number_unique (direction_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS university_kpi_indicators (
  indicator_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  direction_id INT NOT NULL,
  indicator_name VARCHAR(255) NOT NULL,
  baseline_2025 TEXT NOT NULL,
  baseline_note TEXT NOT NULL,
  target_2026 VARCHAR(500) NOT NULL,
  actual_2026 TEXT NOT NULL,
  actual_as_of VARCHAR(150) NOT NULL,
  target_2027 VARCHAR(500) NOT NULL,
  target_2028 VARCHAR(500) NOT NULL,
  target_2029 VARCHAR(500) NOT NULL,
  target_2030 VARCHAR(500) NOT NULL,
  remarks TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  updated_by INT DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY university_kpi_direction_order_idx (direction_id, sort_order),
  CONSTRAINT university_kpi_indicator_direction_fk FOREIGN KEY (direction_id)
    REFERENCES university_kpi_directions (direction_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO university_kpi_directions (direction_id, direction_number, title) VALUES
  (1, 1, 'Redefining the Mission of MSU–General Santos'),
  (2, 2, 'Student Support and Development'),
  (3, 3, 'Faculty Development and Support'),
  (4, 4, 'Extension, Linkages, and Internationalization'),
  (5, 5, 'Functional and Sustainable Research and Development Culture'),
  (6, 6, 'Strategic Infrastructure Planning'),
  (7, 7, 'Enhancing the Organizational Structure and the Commitment to Quality Assurance'),
  (8, 8, 'Expanding Alumni Relations and Participation');

-- Values are transcribed from the supplied OME KPI screenshots. Mixed units and
-- milestone checkmarks are intentionally stored as text; no invented rates are calculated.
INSERT IGNORE INTO university_kpi_indicators
  (indicator_id, direction_id, sort_order, indicator_name, baseline_2025, target_2026, target_2027, target_2028, target_2029, target_2030, actual_2026, actual_as_of, baseline_note, remarks)
VALUES
  (101,1,1,'Revised VMGO approved by BOR','✓','✓','✓','✓','✓','✓','Achieved','2026','','IPDevO has achieved this KPI this year.'),
  (102,1,2,'Stakeholder consultation activities conducted','✓','✓','✓','✓','✓','✓','Achieved','2026','','IPDevO has achieved this KPI this year.'),
  (103,1,3,'Programs aligned to revised VMGO (%)','85%','100%','100%','100%','100%','100%','','','','OVCAA, CCSID. Every program has a course catalog with revised VMGO.'),
  (104,1,4,'Annual institutional scorecard published','None','✓','✓','✓','✓','✓','','','','OME. SPMS, DPCR, OPCR.'),

  (201,2,1,'Retention rate','97.08%','97.5%','98%','99–100%','99–100%','99–100%','No actual data','','Computed using enrollees (1st to 3rd year) in AY 2023–2024 and enrollees (2nd to 4th year) in AY 2024–2025.','Data unavailable due to ongoing enrolment and transition to the Student Academic Information System (SAIS).'),
  (202,2,2,'Graduation rate','59.81%','60%','62%','64%','66%','68%','71.40%','August 2026','Computed using first-year students enrolled in first semester AY 2021–2022 and graduates of second semester AY 2024–2025.','First-year students (S.Y. 2022–2023): 2,021; students graduated S.Y. 2025–2026: 1,443; 1,443 / 2,021 = 71.40%.'),
  (203,2,3,'Graduate employability (6–12 months)','95.13%','96%','97%','98–100%','98–100%','98–100%','Not yet available','','Further study is needed to check whether graduates'' academic program matches their employment.','Colleges track graduates'' employability. The Alumni Relations Office will consolidate data once the tracking system is established.'),
  (204,2,4,'Students with scholarship/aid','1,655','1,700','1,750','1,800','1,850','1,900','2,712','August 2026','','Scholarship Coordinating Office. Number of students with scholarship in 2026: 2,712.'),
  (205,2,5,'Students accessing guidance/mental health services','1,013','1,200','1,400','1,600','1,800','2,000','800','July 31, 2026','Students who underwent Assessment and Counseling, Assessment for Admission/Practicum, and Exit Assessment Clearance.','Guidance Counseling Office revised targets: 2026, 800 (first half); 2027, 2,000; 2028, 2,200; 2029, 2,500; 2030, 2,500.'),

  (301,3,1,'Faculty with PhD/DBA/DM','53','63','73','83','93','103','70 permanent faculty members','August 14, 2026','','Human Resource Management and Development Office. Doctoral degree holders: permanent 70; contractual 31.'),
  (302,3,2,'Faculty with publications/year','37','100','130','160','180','200','35 faculty members','July 31, 2026','','Research Division, OVCREI. 35 as of July 2026.'),
  (303,3,3,'Faculty trained in pedagogy/digital skills','70%','75%','80%','80%','85%','90%','80%','August 2026','','CCSID.'),
  (304,3,4,'Faculty satisfaction index','>90%','>92%','>92%','>93%','>94%','>95%','93.74%','First term, S.Y. 2025–2026','','OME. Data collection for the second semester of 2025–2026 is ongoing.'),

  (401,4,1,'Active MOUs/MOAs','24','30','35','40','45','50','40','August 2026','','Extension Services Office: 26 active MOA/MOU; IIAS: 2 active MOU; CoEd: 1 active MOU and 1 MOA; CFAS: 1 active MOA; CHS: 4 active MOA; CSSH: 4 active MOA; OIA: ongoing partner communication; IPDM: 2 active MOA.'),
  (402,4,2,'International and national partner institutions','44','50','55','60','65','70','40 based on active MOAs/MOUs','August 2026','','Office of International Affairs.'),
  (403,4,3,'Community extension projects with documented impact','4','6','8','10','12','14','1','August 2026','','Extension.'),
  (404,4,4,'Externally and internally funded projects','24','26','28','30','32','34','29','July 2026','','Extension, OIA, IPDM, CWS. Extension: 26; IPDM: 3.'),
  (405,4,5,'National and international paper presentations','7','10','13','16','19','22','3','July 2026','','Extension, OIA, IPDM. Extension: 3.'),
  (406,4,6,'Inbound/outbound cases (BOR Resolution 391, S. 2025)','Inbound: 17 students from Indonesia; outbound: 20 CSSH English Department students and 14 Education students','Inbound visiting professors: 6; outbound: 10','Inbound visiting professors: 10; outbound: 22','Inbound visiting professors: 12; outbound: 37','Inbound visiting professors: 16; outbound: 38','Inbound visiting professors: 18; outbound: 44','Outbound: 8 BEED students','July 2026','','OIA. This one KPI continues across pages 11 and 12 of the supplied source.'),

  (501,5,1,'Publications in Scopus-indexed and university journals/year','39','50','60','70','80','100','27 Scopus-indexed papers','July 31, 2026','','Research Division. 2026 research: 27 Scopus-indexed papers.'),
  (502,5,2,'Citation index (institutional)','28 / 18','30 / 19','35 / 20','40 / 21','45 / 22','50 / 23','','','','No data received from the research division; baseline and target data are under revision.'),
  (503,5,3,'Registered IP/patents/utility models','15','20','25','30','40','50','2 copyrights registered','August 2026','','Innovation.'),
  (504,5,4,'Active research centers','6','7','8','8','10','10','9','July 31, 2026','','Research: RSRC, Biodiversity, Halal, Women’s Studies, Water Lab, MEIC, RBRC, CASTS.'),
  (505,5,5,'Internally and externally funded research grants','18','20','20','25','25','30','22','July 31, 2026','','Research: 19 internal and 3 external agencies.'),
  (506,5,6,'National and international paper presentations','91','100','102','110','115','120','40','July 2026','','Research, Colleges. Paper presentations in 2026: 40.'),
  (507,5,7,'Capacity-building activities conducted','6','8','10','12','15','20','2','July 2026','','Research: 2.'),

  (601,6,1,'Completion of campus master plan (%)','50%','66.66%','80%','95%','100%','100%','57.33%','August 2026','','ICTO. ICT Phase 1: 100% × 33.33% = 33.33%; Phase 2: 72% × 33.33% = 24.00%; Phase 3: SARO released in August 2026.'),
  (602,6,2,'Smart classrooms installed','9.8%','46.41%','60%','70%','80%','100%','15.69%','August 2026','','ICT Phase 1: 4 e-classrooms completed and 11 e-classrooms (one per college). Phase 2 includes database, network, data science, speech, and computer graphics labs. Completed: 4 e-classrooms, 11 e-classrooms, 6 original laboratories, and 3 e-laboratories. The source notes a revised baseline from 40% to 9.8% and revised 2026–2030 targets.'),
  (603,6,3,'Library digital resource subscriptions','4','5','6','6','7','8','5','July 2026','','Library: Gale Reviewed, Wiley Books, Philippine E-journal, ProQuest, CABE. Source notes target revisions: 2026 5 (from 8); 2027 6 (from 10); 2028 6 (from 12); 2029 7 (from 15); 2030 8 (from 20).'),
  (604,6,4,'Renewable energy usage (%)','0%','0%','1%','5%','10%','20%','','','','Not yet embedded in the infrastructure plans.'),
  (605,6,5,'Wi-Fi campus coverage','60%','65%','70%','75%','80%','90%','','','','ICT Phase 1 coverage completed: 19 buildings with Wi-Fi.'),

  (701,7,1,'Accredited undergraduate programs (AACCUP)','63%','70%','75%','80%','85%','90%','62.5%','August 27, 2026','','Total programs: 40; Level 3: 24; Level 2: 1.'),
  (702,7,2,'Accredited graduate programs (AACCUP)','53%','60%','65%','70%','75%','80%','35%','August 27, 2026','','Total programs: 17; Level 3: 1; Level 2: 5.'),
  (703,7,3,'ISO 21001:2018 certification scope','Partial','✓','✓','✓','✓','✓','','','','QuAMSO.'),
  (704,7,4,'Percentage satisfaction of service delivery','No baseline data','>90%','>92%','>93%','>94%','>95%','94.74%','August 2026','','OME. Based on eight frontline service offices.'),
  (705,7,5,'AUN-QA assessed programs','None','None','None','8','10','12','','','','QuAMSO.'),
  (706,7,6,'World/impact rankings','WURI 2025; Webometrics','2','2','2','3','3','3','July 2026','','QuAMSO. Three rankings: THE Impact, WURI, and Higher Education.'),

  (801,8,1,'Active alumni chapters','5','6','7','8','9','10','5','July 2026','','ARO. Five chapters: MSU-GSC Chapter, AMSUA, Palimbang Chapter, MSUAA–Metro Gensan, and MSUAA–National Board of Directors.'),
  (802,8,2,'Alumni database completeness','33,700; 90%','95%','96%','97%','98%','99%','94.5%','July 2026','','ARO. 35,385 alumni records as of July 2026.'),
  (803,8,3,'Alumni donations/endowment','₱330,805.00','₱500,000','₱1,000,000','₱1,500,000','₱2,000,000','₱3,000,000','','','','A series of donation-drive activities is planned for the second half of the year, including Balik Tambler events and intramurals.'),
  (804,8,4,'Alumni mentors engaged','32','50','70','80','90','100','','','','ARO.'),
  (805,8,5,'Tracer study coverage','1,397 (5%)','25%','50%','60%','70%','80%','','','','GCO.');
