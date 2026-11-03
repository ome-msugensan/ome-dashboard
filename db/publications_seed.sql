-- Source: Scopus-Indexed Publications.xlsx, As of 09092026. Run only once on an empty publications table.
INSERT INTO scopus_publications (publication_title, publication_date, publication_venue, author_name, school, college, department)
SELECT seed.* FROM (
SELECT 'OUTER-CONNECTED WEAKLY CONNECTED 2-DOMINATION IN GRAPHS' AS publication_title, '2026' AS publication_date, 'Far East Journal of Mathematical Sciences' AS publication_venue, 'Kient Rey L. Zuyco' AS author_name, 'MSU-GSC' AS school, 'CNSM' AS college, 'Mathematics Department' AS department
UNION ALL
SELECT 'OUTER-CONNECTED WEAKLY CONNECTED 2-DOMINATION IN GRAPHS', '2026', 'Far East Journal of Mathematical Sciences', 'Mae P. Militante', 'MSU-GSC', 'CNSM', 'Mathematics Department'
UNION ALL
SELECT 'OUTER-CONNECTED WEAKLY CONNECTED 2-DOMINATION IN GRAPHS', '2026', 'Far East Journal of Mathematical Sciences', 'Doli-Jane U. Tejada', 'MSU-GSC', 'CNSM', 'Mathematics Department'
UNION ALL
SELECT 'OUTER-CONNECTED WEAKLY CONNECTED 2-DOMINATION IN GRAPHS', '2026', 'Far East Journal of Mathematical Sciences', 'Rendon A. Dela Cruz', 'MSU-GSC', 'CNSM', 'Mathematics Department'
UNION ALL
SELECT 'Assessing English writing needs for civil engineering students: evidence from a Philippine college', '2026', 'International Journal of Evaluation and Research in Education', 'Sittie Aina T. Pandapatan', 'MSU-Marawi', '', 'Mamitua Saber Institute of Research and Creation'
UNION ALL
SELECT 'Assessing English writing needs for civil engineering students: evidence from a Philippine college', '2026', 'International Journal of Evaluation and Research in Education', 'Abdullah H. Edris', 'MSU-Marawi', '', 'Integrated Laboratory School'
UNION ALL
SELECT 'Assessing English writing needs for civil engineering students: evidence from a Philippine college', '2026', 'International Journal of Evaluation and Research in Education', 'Johara D. Alangca-Azis', 'MSU-Marawi', 'CSSH', ''
UNION ALL
SELECT 'Assessing English writing needs for civil engineering students: evidence from a Philippine college', '2026', 'International Journal of Evaluation and Research in Education', 'Stephen A. Fadare', 'MSU-Sulu', 'CAS', ''
UNION ALL
SELECT 'Assessing English writing needs for civil engineering students: evidence from a Philippine college', '2026', 'International Journal of Evaluation and Research in Education', 'Al-Nor D. Ansao', 'University of Science and Technology of Southern Philippines', 'COE&A', 'Department of Civil Engineering'
UNION ALL
SELECT 'Assessing English writing needs for civil engineering students: evidence from a Philippine college', '2026', 'International Journal of Evaluation and Research in Education', 'Basmah S. Hussain', 'MSU-GSC', 'CSSH', 'English Department'
UNION ALL
SELECT 'Artificial Intelligence for Sustainable Human Development: Integrating Humanities, Education, and Intelligent Information Systems', '2026', 'Journal of Intelligent Decision Making and Information Science', 'Norman Ralph B. Isla', 'MSU-GSC', 'CSSH', 'English Department'
UNION ALL
SELECT 'Artificial Intelligence for Sustainable Human Development: Integrating Humanities, Education, and Intelligent Information Systems', '2026', 'Journal of Intelligent Decision Making and Information Science', 'Cem Cagri Donmez', 'Marmara University, Stonebridge University, Istanbul Topkapi University', '', ''
UNION ALL
SELECT 'Artificial Intelligence for Sustainable Human Development: Integrating Humanities, Education, and Intelligent Information Systems', '2026', 'Journal of Intelligent Decision Making and Information Science', 'Firas Kh. Jaber', 'Middle Technical University', 'Technical Engineering Collage-Baghdad', 'Department of Surveying Engineering Techniques'
UNION ALL
SELECT 'Artificial Intelligence for Sustainable Human Development: Integrating Humanities, Education, and Intelligent Information Systems', '2026', 'Journal of Intelligent Decision Making and Information Science', 'Ezzaddin Hasan Kadhim', 'Al-Mustaqbal University', 'College of Administrative Sciences', 'Department of Accounting'
UNION ALL
SELECT 'Artificial Intelligence for Sustainable Human Development: Integrating Humanities, Education, and Intelligent Information Systems', '2026', 'Journal of Intelligent Decision Making and Information Science', 'Alfred Howard Miller', 'Higher Colleges of Technology', 'Business Division', 'Marketing'
UNION ALL
SELECT 'Artificial Intelligence for Sustainable Human Development: Integrating Humanities, Education, and Intelligent Information Systems', '2026', 'Journal of Intelligent Decision Making and Information Science', 'Sameh Awad Alla El Sayad Ibrahim', 'Ain Shams University', '', 'Department of Media and Children''s Culture'
UNION ALL
SELECT 'Artificial Intelligence for Sustainable Human Development: Integrating Humanities, Education, and Intelligent Information Systems', '2026', 'Journal of Intelligent Decision Making and Information Science', 'Mohamed M. Abbassy', 'Beni-Suef University', 'Faculty of Computers and Artificial Intelligence', ''
UNION ALL
SELECT 'Clique Structure of Intersection Graphs of Submodules', '2026', 'International Journal of Mathematics and Computer Science', 'Rolando P. Malalay', 'Zamboanga Peninsula Polytechnic State University', 'College of Teacher Education', ''
UNION ALL
SELECT 'Clique Structure of Intersection Graphs of Submodules', '2026', 'International Journal of Mathematics and Computer Science', 'Rosalio G. Artes', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'Clique Structure of Intersection Graphs of Submodules', '2026', 'International Journal of Mathematics and Computer Science', 'Ebrahim Alpe A. Simpal', 'MSU-GSC', '', ''
UNION ALL
SELECT 'Clique Structure of Intersection Graphs of Submodules', '2026', 'International Journal of Mathematics and Computer Science', 'Edwin B. Fabillar', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'Discriminant Bounds and Rigidity Criteria for Ramification in Number Field Extensions', '2026', 'International Journal of Mathematics and Computer Science', 'Abdurajan B. Lintasan', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'Discriminant Bounds and Rigidity Criteria for Ramification in Number Field Extensions', '2026', 'International Journal of Mathematics and Computer Science', 'Central Mindanao University', 'Central Mindanao University', '', ''
UNION ALL
SELECT 'Discriminant Bounds and Rigidity Criteria for Ramification in Number Field Extensions', '2026', 'International Journal of Mathematics and Computer Science', 'Jean D. Bergante', 'MSU-GSC', 'CNSM', 'Mathematics Department'
UNION ALL
SELECT 'Discriminant Bounds and Rigidity Criteria for Ramification in Number Field Extensions', '2026', 'International Journal of Mathematics and Computer Science', 'Nor Etika Fatimah P. Lintasan', 'Universidad De Zamboanga', '', ''
UNION ALL
SELECT 'Examining Artificial Intelligence Literacy of Filipino College Students Using the Theory of Planned Behavior', '2026', 'European Journal of Educational Research', 'Jovar G. Pantao', 'MSU-GSC', 'COED', 'Bachelor of Elementary Education Department'
UNION ALL
SELECT 'Examining Artificial Intelligence Literacy of Filipino College Students Using the Theory of Planned Behavior', '2026', 'European Journal of Educational Research', 'Michael B. Cahapay', 'MSU-GSC', 'COED', 'Bachelor of Elementary Education Department'
UNION ALL
SELECT 'Examining Artificial Intelligence Literacy of Filipino College Students Using the Theory of Planned Behavior', '2026', 'European Journal of Educational Research', 'Diane Mae P. Ulanday-Lozano', 'MSU-GSC', 'COED', 'Bachelor of Elementary Education Department'
UNION ALL
SELECT 'Examining Artificial Intelligence Literacy of Filipino College Students Using the Theory of Planned Behavior', '2026', 'European Journal of Educational Research', 'Maria Theresa P. Pelones', 'MSU-GSC', 'COED', 'Bachelor of Secondary Education Department'
UNION ALL
SELECT 'Examining Artificial Intelligence Literacy of Filipino College Students Using the Theory of Planned Behavior', '2026', 'European Journal of Educational Research', 'Esmaida Andang-Alaiden', 'MSU-GSC', 'COED', 'Bachelor of Secondary Education Department'
UNION ALL
SELECT 'Examining Artificial Intelligence Literacy of Filipino College Students Using the Theory of Planned Behavior', '2026', 'European Journal of Educational Research', 'Rhumer S. Lañojan', 'MSU-GSC', 'COED', 'Bachelor of Secondary Education Department'
UNION ALL
SELECT 'Examining Artificial Intelligence Literacy of Filipino College Students Using the Theory of Planned Behavior', '2026', 'European Journal of Educational Research', 'Almera M. Sales', 'MSU-GSC', 'COED', 'Bachelor of Secondary Education Department'
UNION ALL
SELECT 'Examining Artificial Intelligence Literacy of Filipino College Students Using the Theory of Planned Behavior', '2026', 'European Journal of Educational Research', 'Jay Carlo S. Bagayas', 'MSU-GSC', 'COED', 'Bachelor of Physical Education Department'
UNION ALL
SELECT 'Cultural Intelligence as a Mediator Between Language Learning Strategies and Intercultural Communicative Competence', '2026', 'New Educational Review', 'Jovenel B. Dadulla', 'Northern Bukidnon State College', '', ''
UNION ALL
SELECT 'Cultural Intelligence as a Mediator Between Language Learning Strategies and Intercultural Communicative Competence', '2026', 'New Educational Review', 'Brandon N. Obenza', 'MSU-GSC', 'COED', 'Bachelor of Secondary Education Department'
UNION ALL
SELECT 'Starch fine structure predicts glycemic index variation in whole-grain rice', '2026', 'Carbohydrate Polymers', 'Putlih Adzra Pautong', 'MSU-GSC', 'CNSM', 'Chemistry Department'
UNION ALL
SELECT 'Starch fine structure predicts glycemic index variation in whole-grain rice', '2026', 'Carbohydrate Polymers', 'Rhowell Navarro Tiozon Jr.', '', '', ''
UNION ALL
SELECT 'Starch fine structure predicts glycemic index variation in whole-grain rice', '2026', 'Carbohydrate Polymers', 'Reuben James Q. Buenafe', '', '', ''
UNION ALL
SELECT 'Starch fine structure predicts glycemic index variation in whole-grain rice', '2026', 'Carbohydrate Polymers', 'Ana Rose Ramos-Castrosanto', '', '', ''
UNION ALL
SELECT 'Starch fine structure predicts glycemic index variation in whole-grain rice', '2026', 'Carbohydrate Polymers', 'Hyeyeon Kim', '', '', ''
UNION ALL
SELECT 'Starch fine structure predicts glycemic index variation in whole-grain rice', '2026', 'Carbohydrate Polymers', 'Gacel Perfinian', '', '', ''
UNION ALL
SELECT 'Starch fine structure predicts glycemic index variation in whole-grain rice', '2026', 'Carbohydrate Polymers', 'Glenn Vincent P. Ong', '', '', ''
UNION ALL
SELECT 'Starch fine structure predicts glycemic index variation in whole-grain rice', '2026', 'Carbohydrate Polymers', 'Il-Ryong Choi', '', '', ''
UNION ALL
SELECT 'Starch fine structure predicts glycemic index variation in whole-grain rice', '2026', 'Carbohydrate Polymers', 'Rodolfo Sumayao', 'De La Salle University', '', 'Chemistry Department'
UNION ALL
SELECT 'Starch fine structure predicts glycemic index variation in whole-grain rice', '2026', 'Carbohydrate Polymers', 'Nese Sreenivasulu', '', '', ''
UNION ALL
SELECT 'Sequential Fixed-Accuracy Estimation for Parameters of Markov-Dependent Observations', '2026', 'International Journal of Mathematics and Computer Science', 'Rosalio G. Artes', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'Sequential Fixed-Accuracy Estimation for Parameters of Markov-Dependent Observations', '2026', 'International Journal of Mathematics and Computer Science', 'Jobelle Sorino-Simblante', 'Central Mindanao University', '', ''
UNION ALL
SELECT 'Sequential Fixed-Accuracy Estimation for Parameters of Markov-Dependent Observations', '2026', 'International Journal of Mathematics and Computer Science', 'Emmylou Aujero-Tamama', 'MSU-GSC', 'CNSM', 'Mathematics Department'
UNION ALL
SELECT 'Sequential Fixed-Accuracy Estimation for Parameters of Markov-Dependent Observations', '2026', 'International Journal of Mathematics and Computer Science', 'Journey A. Geolin', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'Shedding Light in the Intricate Relationship Between Reproductive Biology and Some Structural Stock Dynamics: Current Status of Frigate Tuna in Southern Philippines', '2026', 'Agricultural Research', 'John Christian D. Entia', 'MSU-GSC', 'OVCREI', 'Histopathology Laboratory'
UNION ALL
SELECT 'Shedding Light in the Intricate Relationship Between Reproductive Biology and Some Structural Stock Dynamics: Current Status of Frigate Tuna in Southern Philippines', '2026', 'Agricultural Research', 'Niña Mae B. Nabre', 'MSU-GSC', 'COF&A', 'Department of Aquaculture'
UNION ALL
SELECT 'Shedding Light in the Intricate Relationship Between Reproductive Biology and Some Structural Stock Dynamics: Current Status of Frigate Tuna in Southern Philippines', '2026', 'Agricultural Research', 'Glennville A. Castrence', 'MSU-GSC', 'COF&A', 'Department of Aquaculture'
UNION ALL
SELECT 'Shedding Light in the Intricate Relationship Between Reproductive Biology and Some Structural Stock Dynamics: Current Status of Frigate Tuna in Southern Philippines', '2026', 'Agricultural Research', 'Red Arthur Duke A. Amoncio', 'MSU-GSC', 'OVCREI', 'Histopathology Laboratory'
UNION ALL
SELECT 'Shedding Light in the Intricate Relationship Between Reproductive Biology and Some Structural Stock Dynamics: Current Status of Frigate Tuna in Southern Philippines', '2026', 'Agricultural Research', 'Edna P. Guevarra', 'MSU-GSC', 'CNSM', 'Department of Biological Sciences and Environmental Studies'
UNION ALL
SELECT 'Peace Education in ASEAN Higher Education: A Meta-Synthesis of Practices, Outcomes, and Lessons on Education for Peace in Post-Pandemic', '2026', 'Journal of Teacher Education for Sustainability', 'Rehna Sotto', 'University of Jyväskylä', '', 'Department of Language and Communication Studies'
UNION ALL
SELECT 'Peace Education in ASEAN Higher Education: A Meta-Synthesis of Practices, Outcomes, and Lessons on Education for Peace in Post-Pandemic', '2026', 'Journal of Teacher Education for Sustainability', 'Jovar G. Pantao', 'MSU-GSC', 'COED', 'Bachelor of Elementary Education Department'
UNION ALL
SELECT 'RESTRAINED CONNECTED 2-DOMINATION IN GRAPHS', '2026', 'Far East Journal of Mathematical Sciences', 'Doli-Jane U. Tejada', 'MSU-GSC', 'CNSM', 'Mathematics Department'
UNION ALL
SELECT 'RESTRAINED CONNECTED 2-DOMINATION IN GRAPHS', '2026', 'Far East Journal of Mathematical Sciences', 'Isagani S. Cabahug', 'Central Mindanao University', '', 'Mathematics Department'
UNION ALL
SELECT 'Mass transport phenomenon during ultrasound-assisted osmotic dehydration of skipjack tuna (Katsuwonus pelamis)', '2026', 'Sustainable Food Technology', 'Guillermo P. Pantuhan', 'MSU-GSC', 'COA', 'Department of Agricultural and Biosystems Engineering'
UNION ALL
SELECT 'Mass transport phenomenon during ultrasound-assisted osmotic dehydration of skipjack tuna (Katsuwonus pelamis)', '2026', 'Sustainable Food Technology', 'Arnold R. Elepaño', 'University of the Philippines Los Baños', 'College of Engineering and Agro-Industrial Technology', 'Institute of Agricultural and Biosystems Engineering'
UNION ALL
SELECT 'Mass transport phenomenon during ultrasound-assisted osmotic dehydration of skipjack tuna (Katsuwonus pelamis)', '2026', 'Sustainable Food Technology', 'Kevin F. Yaptenco', 'University of the Philippines Los Baños', 'College of Engineering and Agro-Industrial Technology', 'Institute of Agricultural and Biosystems Engineering'
UNION ALL
SELECT 'Mass transport phenomenon during ultrasound-assisted osmotic dehydration of skipjack tuna (Katsuwonus pelamis)', '2026', 'Sustainable Food Technology', 'Omar F. Zubia', 'University of the Philippines Los Baños', 'College of Engineering and Agro-Industrial Technology', 'Institute of Agricultural and Biosystems Engineering'
UNION ALL
SELECT 'Mass transport phenomenon during ultrasound-assisted osmotic dehydration of skipjack tuna (Katsuwonus pelamis)', '2026', 'Sustainable Food Technology', 'Katherine Ann T. Castillo-Israel', 'University of the Philippines Los Baños', 'College of Agriculture and Food Science', 'Institute of Food Science and Technology'
UNION ALL
SELECT 'Assessment of Out-of-Pocket Expenditure of HER2-Positive Breast Cancer Patients in a Tertiary Cancer Center and Private Clinics in the Philippines', '2026', 'Acta Medica Philippina', 'Karen Anjela M. Mondragon', 'University of the Philippines Manila', 'Department of Medicine', 'Division of Medical Oncology'
UNION ALL
SELECT 'Assessment of Out-of-Pocket Expenditure of HER2-Positive Breast Cancer Patients in a Tertiary Cancer Center and Private Clinics in the Philippines', '2026', 'Acta Medica Philippina', 'Rich Ericson C. King', 'University of the Philippines Manila', 'Department of Medicine', 'Division of Medical Oncology'
UNION ALL
SELECT 'Assessment of Out-of-Pocket Expenditure of HER2-Positive Breast Cancer Patients in a Tertiary Cancer Center and Private Clinics in the Philippines', '2026', 'Acta Medica Philippina', 'Lance Isidore G. Catedral', 'MSU-GSC', 'College of Medicine', 'Community & Allied Department'
UNION ALL
SELECT 'Assessment of Out-of-Pocket Expenditure of HER2-Positive Breast Cancer Patients in a Tertiary Cancer Center and Private Clinics in the Philippines', '2026', 'Acta Medica Philippina', 'Frederic Ivan L. Ting', 'University of the Philippines Manila', 'Department of Medicine', 'Division of Medical Oncology'
UNION ALL
SELECT 'Assessment of Out-of-Pocket Expenditure of HER2-Positive Breast Cancer Patients in a Tertiary Cancer Center and Private Clinics in the Philippines', '2026', 'Acta Medica Philippina', 'Rogelio N. Velasco', 'University of the Philippines Manila', 'Department of Medicine', 'Division of Medical Oncology'
UNION ALL
SELECT 'Assessment of Out-of-Pocket Expenditure of HER2-Positive Breast Cancer Patients in a Tertiary Cancer Center and Private Clinics in the Philippines', '2026', 'Acta Medica Philippina', 'Aylmer Rex B. Hernandez', 'University of the Philippines Manila', 'Department of Medicine', 'Division of Medical Oncology'
UNION ALL
SELECT 'Assessment of Out-of-Pocket Expenditure of HER2-Positive Breast Cancer Patients in a Tertiary Cancer Center and Private Clinics in the Philippines', '2026', 'Acta Medica Philippina', 'Irisyl Orolfo Real', 'University of the Philippines Manila', 'Department of Medicine', 'Division of Medical Oncology'
UNION ALL
SELECT 'Assessment of Out-of-Pocket Expenditure of HER2-Positive Breast Cancer Patients in a Tertiary Cancer Center and Private Clinics in the Philippines', '2026', 'Acta Medica Philippina', ' Lia M. Palileo-Villanueva', 'University of the Philippines Manila', 'Department of Medicine', ''
UNION ALL
SELECT 'Effectiveness of a 5-week high-intensity interval training on endurance capacities and BMI reduction among overweight female student-athletes', '2026', 'Pedagogy of Physical Culture and Sports', 'Jet Longakit', 'MSU-IIT', '', ''
UNION ALL
SELECT 'Effectiveness of a 5-week high-intensity interval training on endurance capacities and BMI reduction among overweight female student-athletes', '2026', 'Pedagogy of Physical Culture and Sports', 'Deljun R. Rodriguez', 'Northwestern Mindanao State College of Science and Technology', '', ''
UNION ALL
SELECT 'Effectiveness of a 5-week high-intensity interval training on endurance capacities and BMI reduction among overweight female student-athletes', '2026', 'Pedagogy of Physical Culture and Sports', 'Jessel Gay Wacan', 'MSU-GSC', 'COED', 'Bachelor of Physical Education Department'
UNION ALL
SELECT 'Effectiveness of a 5-week high-intensity interval training on endurance capacities and BMI reduction among overweight female student-athletes', '2026', 'Pedagogy of Physical Culture and Sports', 'Jay Carlo S. Bagayas', 'MSU-GSC', 'COED', 'Bachelor of Physical Education Department'
UNION ALL
SELECT 'Effectiveness of a 5-week high-intensity interval training on endurance capacities and BMI reduction among overweight female student-athletes', '2026', 'Pedagogy of Physical Culture and Sports', 'Mussar A. Salamat', 'MSU-GSC', 'COED', 'Bachelor of Physical Education Department'
UNION ALL
SELECT 'Effectiveness of a 5-week high-intensity interval training on endurance capacities and BMI reduction among overweight female student-athletes', '2026', 'Pedagogy of Physical Culture and Sports', 'Mara L. Cuya', 'MSU-GSC', 'COED', 'Bachelor of Physical Education Department'
UNION ALL
SELECT 'Effectiveness of a 5-week high-intensity interval training on endurance capacities and BMI reduction among overweight female student-athletes', '2026', 'Pedagogy of Physical Culture and Sports', 'Leonard John Carrillo', 'Caraga State University Cabadbaran Campus', '', ''
UNION ALL
SELECT 'Effectiveness of a 5-week high-intensity interval training on endurance capacities and BMI reduction among overweight female student-athletes', '2026', 'Pedagogy of Physical Culture and Sports', 'Earl Joshua Christian Andallaza', 'Bukidnon State University-Damulog Campus', '', ''
UNION ALL
SELECT 'Effectiveness of a 5-week high-intensity interval training on endurance capacities and BMI reduction among overweight female student-athletes', '2026', 'Pedagogy of Physical Culture and Sports', 'Yasmina Alag', 'MSU Baloi Community High School', '', ''
UNION ALL
SELECT 'Effectiveness of a 5-week high-intensity interval training on endurance capacities and BMI reduction among overweight female student-athletes', '2026', 'Pedagogy of Physical Culture and Sports', 'Rolan Mancha', 'Agusan del Sur State College of Agriculture and Technology', '', ''
UNION ALL
SELECT 'A Dirichlet Space Uncertainty Principle for Analytic Functions', '2026', 'International Journal of Mathematics and Computer Science', 'Artes Rosalio Jr.', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'A Dirichlet Space Uncertainty Principle for Analytic Functions', '2026', 'International Journal of Mathematics and Computer Science', 'Hashim Adznar', 'Sulu State University Capitol Site', '', ''
UNION ALL
SELECT 'A Dirichlet Space Uncertainty Principle for Analytic Functions', '2026', 'International Journal of Mathematics and Computer Science', 'Jonem Fathima', 'MSU-Buug', '', ''
UNION ALL
SELECT 'A Dirichlet Space Uncertainty Principle for Analytic Functions', '2026', 'International Journal of Mathematics and Computer Science', 'Jeanifer Bingco-Lanzuela', 'MSU-GSC', 'CNSM', 'Mathematics Department'
UNION ALL
SELECT 'A Dirichlet Space Uncertainty Principle for Analytic Functions', '2026', 'International Journal of Mathematics and Computer Science', 'Abubakar Al-Jayson', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'Integrative Profiling of Antimicrobial Resistance Risks in a Philippine Peri-Urban Community: Insights From Clinical Data, Wastewater Analysis and Community Engagement', '2026', 'Tropical Medicine and International Health', 'Maria Catherine B. Otero', 'University of the Philippines Manila', 'College of Medicine', 'Department of Clinical Epidemiology'
UNION ALL
SELECT 'Integrative Profiling of Antimicrobial Resistance Risks in a Philippine Peri-Urban Community: Insights From Clinical Data, Wastewater Analysis and Community Engagement', '2026', 'Tropical Medicine and International Health', 'Veronica Frances D. Barcinas', 'MSU-GSC', 'CNSM', 'Department of Biological Sciences and Environmental Studies'
UNION ALL
SELECT 'Integrative Profiling of Antimicrobial Resistance Risks in a Philippine Peri-Urban Community: Insights From Clinical Data, Wastewater Analysis and Community Engagement', '2026', 'Tropical Medicine and International Health', 'Refeim M. Miguel', 'University of the Philippines Los Baños', 'School of Environmental Science and Management', ''
UNION ALL
SELECT 'Integrative Profiling of Antimicrobial Resistance Risks in a Philippine Peri-Urban Community: Insights From Clinical Data, Wastewater Analysis and Community Engagement', '2026', 'Tropical Medicine and International Health', 'Dann Marie N. Del Mundo', 'University of the Philippines Mindanao', 'College of Science and Mathematics', 'Department of Food Science and Chemistry'
UNION ALL
SELECT 'Integrative Profiling of Antimicrobial Resistance Risks in a Philippine Peri-Urban Community: Insights From Clinical Data, Wastewater Analysis and Community Engagement', '2026', 'Tropical Medicine and International Health', 'Caroline Marie B. Jaraula', '', '', ''
UNION ALL
SELECT 'Integrative Profiling of Antimicrobial Resistance Risks in a Philippine Peri-Urban Community: Insights From Clinical Data, Wastewater Analysis and Community Engagement', '2026', 'Tropical Medicine and International Health', 'Lynn Esther E. Rallos', 'MSU-GSC', 'CNSM', 'Department of Biological Sciences and Environmental Studies'
UNION ALL
SELECT 'Integrative Profiling of Antimicrobial Resistance Risks in a Philippine Peri-Urban Community: Insights From Clinical Data, Wastewater Analysis and Community Engagement', '2026', 'Tropical Medicine and International Health', 'Emmanuel S. Baja', 'University of the Philippines Manila', 'College of Medicine', 'Department of Clinical Epidemiology'
UNION ALL
SELECT 'Integrative Profiling of Antimicrobial Resistance Risks in a Philippine Peri-Urban Community: Insights From Clinical Data, Wastewater Analysis and Community Engagement', '2026', 'Tropical Medicine and International Health', 'Lyre Anni E. Murao', 'MSU-GSC', 'CNSM', 'Department of Biological Sciences and Environmental Studies'
UNION ALL
SELECT 'Organochlorine Pesticide Residues in Feeds and Tissues of Female Mallard Ducks in Candaba, Pampanga, Philippines: An Exploratory Study', '2026', 'Advances in Animal and Veterinary Sciences', 'Josh Elisha R. Octura', 'MSU-GSC', 'COA', 'Department of Animal Science'
UNION ALL
SELECT 'Organochlorine Pesticide Residues in Feeds and Tissues of Female Mallard Ducks in Candaba, Pampanga, Philippines: An Exploratory Study', '2026', 'Advances in Animal and Veterinary Sciences', 'Renato S. A. Vega', 'University of the Philippines Los Baños', 'College of Agriculture and Food Science', 'Institute of Animal Science'
UNION ALL
SELECT 'Detection and Antimicrobial Susceptibility of Escherichia coli in Retail Chicken Breast Meat in General Santos City, Philippines', '2026', 'Advances in Animal and Veterinary Sciences', 'Alexis N. Miole', 'MSU-GSC', 'COA', 'Department of Animal Science'
UNION ALL
SELECT 'Detection and Antimicrobial Susceptibility of Escherichia coli in Retail Chicken Breast Meat in General Santos City, Philippines', '2026', 'Advances in Animal and Veterinary Sciences', 'Gabrielle Beatrix B. Francisco', 'MSU-GSC', 'OVCREI', ''
UNION ALL
SELECT 'Detection and Antimicrobial Susceptibility of Escherichia coli in Retail Chicken Breast Meat in General Santos City, Philippines', '2026', 'Advances in Animal and Veterinary Sciences', 'Chrizyll Joy G. Paulo', 'Sultan Kudarat State University', 'Graduate School', ''
UNION ALL
SELECT 'Detection and Antimicrobial Susceptibility of Escherichia coli in Retail Chicken Breast Meat in General Santos City, Philippines', '2026', 'Advances in Animal and Veterinary Sciences', 'Harlequin S. Tamayo', 'Sultan Kudarat State University', 'Graduate School', ''
UNION ALL
SELECT 'Detection and Antimicrobial Susceptibility of Escherichia coli in Retail Chicken Breast Meat in General Santos City, Philippines', '2026', 'Advances in Animal and Veterinary Sciences', 'Mahalea U. Sabilla', 'Sultan Kudarat State University', 'Graduate School', ''
UNION ALL
SELECT 'Detection and Antimicrobial Susceptibility of Escherichia coli in Retail Chicken Breast Meat in General Santos City, Philippines', '2026', 'Advances in Animal and Veterinary Sciences', 'Michael M. Sebastian', 'Sultan Kudarat State University', 'Graduate School', ''
UNION ALL
SELECT 'Detection and Antimicrobial Susceptibility of Escherichia coli in Retail Chicken Breast Meat in General Santos City, Philippines', '2026', 'Advances in Animal and Veterinary Sciences', 'Gibbs Ada Rose B.Cawan', 'Sultan Kudarat State University', 'Graduate School', ''
UNION ALL
SELECT 'Detection and Antimicrobial Susceptibility of Escherichia coli in Retail Chicken Breast Meat in General Santos City, Philippines', '2026', 'Advances in Animal and Veterinary Sciences', 'Keiven Mark B. Ampode', 'Sultan Kudarat State University', 'Graduate School', ''
UNION ALL
SELECT 'Beyond the blue economy: indigenous knowledge, resilience, and the social ecologies of small-scale fisheries in the Philippines', '2026', 'Maritime Studies', 'Malona V. Alinsug', 'MSU-GSC', 'School of Graduate Studies', ''
UNION ALL
SELECT 'Beyond the blue economy: indigenous knowledge, resilience, and the social ecologies of small-scale fisheries in the Philippines', '2026', 'Maritime Studies', 'Kara Isobel V. Alinsug', 'University of the Philippines Diliman', 'College of Social Sciences', 'Department of Political Science'
UNION ALL
SELECT 'Futenvol: an innovative game for physical education students', '2026', 'Journal of Education and Learning', 'Jay Carlo S Bagayas', 'MSU-GSC', 'COED', 'Bachelor of Physical Education Department'
UNION ALL
SELECT 'Futenvol: an innovative game for physical education students', '2026', 'Journal of Education and Learning', 'Chiedel Joan San Diego', 'MSU-IIT', 'School of Graduate Studies', ''
UNION ALL
SELECT 'Futenvol: an innovative game for physical education students', '2026', 'Journal of Education and Learning', 'Sotero O. Malayao', 'MSU-IIT', 'Department of Science and Mathematics Education', ''
UNION ALL
SELECT 'Futenvol: an innovative game for physical education students', '2026', 'Journal of Education and Learning', 'Griffter A. Sumando', 'MSU-IIT', 'COED', 'Bachelor of Physical Education Department'
UNION ALL
SELECT 'Noting Down the Shared Testicular Microarchitectural Structures of Neritic Tuna Disclosing Congruence across Three Species', '2026', 'Philippine Journal of Science', 'John Christian D. Entia', 'MSU-GSC', 'OVCREI', 'Histopathology Laboratory'
UNION ALL
SELECT 'Noting Down the Shared Testicular Microarchitectural Structures of Neritic Tuna Disclosing Congruence across Three Species', '2026', 'Philippine Journal of Science', 'Niña Mae B. Nabre', 'MSU-GSC', 'COF&A', 'Department of Aquaculture'
UNION ALL
SELECT 'Noting Down the Shared Testicular Microarchitectural Structures of Neritic Tuna Disclosing Congruence across Three Species', '2026', 'Philippine Journal of Science', 'Red Arthur Duke A. Amoncio', 'MSU-GSC', 'OVCREI', 'Histopathology Laboratory'
UNION ALL
SELECT 'Design and economic evaluation of hybrid solar PV systems for coffee processing facilities: A case study of a social enterprise in Bukidnon, Philippines', '2026', 'IOP Conference Series: Earth and Environmental Science', 'Roberto Emphasis Tabal', 'MSU-GSC', 'COA', 'Department of Agricultural and Biosystems Engineering'
UNION ALL
SELECT 'Design and economic evaluation of hybrid solar PV systems for coffee processing facilities: A case study of a social enterprise in Bukidnon, Philippines', '2026', 'IOP Conference Series: Earth and Environmental Science', 'Xymel Pearl Sombrio Almocera', 'MSU-GSC', 'COA', 'Department of Agricultural and Biosystems Engineering'
UNION ALL
SELECT 'Design and economic evaluation of hybrid solar PV systems for coffee processing facilities: A case study of a social enterprise in Bukidnon, Philippines', '2026', 'IOP Conference Series: Earth and Environmental Science', 'Jim M. Venezuela', '', '', ''
UNION ALL
SELECT 'From Advocates to Targets: Chilling Effects of Red-Tagging on Peace Advocates in Mindanao, Philippines', '2026', 'Ius Gentium', 'Kenneth C. Lisbo', 'MSU-GSC', 'CSSH', 'Department of Political Science'
UNION ALL
SELECT 'From Advocates to Targets: Chilling Effects of Red-Tagging on Peace Advocates in Mindanao, Philippines', '2026', 'Ius Gentium', 'Novie Arren P. Barretto', 'MSU-GSC', 'CSSH', 'Department of Sociology'
UNION ALL
SELECT 'From Advocates to Targets: Chilling Effects of Red-Tagging on Peace Advocates in Mindanao, Philippines', '2026', 'Ius Gentium', 'Renz Anthony R. Sumapal', 'MSU-GSC', 'CSSH', 'Department of Psychology'
UNION ALL
SELECT 'Generation Z’s Attitudes on Global Climate Justice: A Case Study', '2026', 'Environmental Education and Sustainable Development: Challenges and Prospects for the Future', 'Christine Faith Murillo', 'MSU-GSC', 'CSSH', 'Department of Political Science'
UNION ALL
SELECT 'Generation Z’s Attitudes on Global Climate Justice: A Case Study', '2026', 'Environmental Education and Sustainable Development: Challenges and Prospects for the Future', 'Yvonnie Antolin', 'MSU-GSC', 'CSSH', 'Department of Political Science'
UNION ALL
SELECT 'Generation Z’s Attitudes on Global Climate Justice: A Case Study', '2026', 'Environmental Education and Sustainable Development: Challenges and Prospects for the Future', 'Lance Guiang', 'MSU-GSC', 'CSSH', 'Department of Political Science'
UNION ALL
SELECT 'Generation Z’s Attitudes on Global Climate Justice: A Case Study', '2026', 'Environmental Education and Sustainable Development: Challenges and Prospects for the Future', 'Charles Rj Arroyo', 'MSU-GSC', 'CSSH', 'Department of Political Science'
UNION ALL
SELECT 'Generation Z’s Attitudes on Global Climate Justice: A Case Study', '2026', 'Environmental Education and Sustainable Development: Challenges and Prospects for the Future', 'Kathleen Mariel Parreñas', 'MSU-GSC', 'CSSH', 'Department of Political Science'
UNION ALL
SELECT 'Generation Z’s Attitudes on Global Climate Justice: A Case Study', '2026', 'Environmental Education and Sustainable Development: Challenges and Prospects for the Future', 'Phil Rodolf Quisel', 'MSU-GSC', 'CSSH', 'Department of Political Science'
UNION ALL
SELECT 'Generation Z’s Attitudes on Global Climate Justice: A Case Study', '2026', 'Environmental Education and Sustainable Development: Challenges and Prospects for the Future', 'Chardrey Tan', 'MSU-GSC', 'CSSH', 'Department of Political Science'
UNION ALL
SELECT 'Generation Z’s Attitudes on Global Climate Justice: A Case Study', '2026', 'Environmental Education and Sustainable Development: Challenges and Prospects for the Future', 'Mearlyn Vargas', 'MSU-GSC', 'CSSH', 'Department of Political Science'
UNION ALL
SELECT 'Generation Z’s Attitudes on Global Climate Justice: A Case Study', '2026', 'Environmental Education and Sustainable Development: Challenges and Prospects for the Future', 'Kenneth C. Lisbo', 'MSU-GSC', 'CSSH', 'Department of Political Science'
UNION ALL
SELECT 'Analysis of Organochlorine Pesticides and Heavy Metal Concentrations in the Dorsolateral Muscle Tissues of Bullet Tuna ( Auxis rochei Risso, 1810) from Sarangani Bay, Southern Mindanao, Philippines', '2026', 'IOP Conference Series: Earth and Environmental Science', 'Hechanova K.', 'MSU-GSC', 'CNSM', 'Department of Biological Sciences and Environmental Studies'
UNION ALL
SELECT 'Analysis of Organochlorine Pesticides and Heavy Metal Concentrations in the Dorsolateral Muscle Tissues of Bullet Tuna ( Auxis rochei Risso, 1810) from Sarangani Bay, Southern Mindanao, Philippines', '2026', 'IOP Conference Series: Earth and Environmental Science', 'Mamalo M.J.', 'MSU-GSC', 'CNSM', 'Department of Biological Sciences and Environmental Studies'
UNION ALL
SELECT 'Analysis of Organochlorine Pesticides and Heavy Metal Concentrations in the Dorsolateral Muscle Tissues of Bullet Tuna ( Auxis rochei Risso, 1810) from Sarangani Bay, Southern Mindanao, Philippines', '2026', 'IOP Conference Series: Earth and Environmental Science', 'Ronaldo T. Bigsang', 'MSU-GSC', 'CNSM', 'Department of Biological Sciences and Environmental Studies'
UNION ALL
SELECT 'Analysis of Organochlorine Pesticides and Heavy Metal Concentrations in the Dorsolateral Muscle Tissues of Bullet Tuna ( Auxis rochei Risso, 1810) from Sarangani Bay, Southern Mindanao, Philippines', '2026', 'IOP Conference Series: Earth and Environmental Science', 'Descallar A.', 'MSU-GSC', 'CNSM', 'Department of Biological Sciences and Environmental Studies'
UNION ALL
SELECT 'Trends, Trajectories and Tomorrows of AI Regulations in Philippine Higher Educational Institutions', '2026', 'Higher Education Quarterly', 'Cathy Mae Toquero', 'MSU-GSC', 'COED', 'Bachelor of Elementary Education Department'
UNION ALL
SELECT 'Design and Development of a Remote-Controlled Mudboat Using the Embedded Control System', '2026', '2026 10th International Conference on Mechanical Engineering and Robotics Research, ICMERR 2026', 'Rosalie S. Cabeltes', 'Green Valley College Foundation Incorporated', 'College of Engineering and Technology', 'Mechanical Engineering Department'
UNION ALL
SELECT 'Design and Development of a Remote-Controlled Mudboat Using the Embedded Control System', '2026', '2026 10th International Conference on Mechanical Engineering and Robotics Research, ICMERR 2026', 'Danilo P. Dadula', 'MSU-GSC', 'COE', 'Mechanical Engineering Department'
UNION ALL
SELECT 'Research note: peace education teachers’ perceptions of interculturality, peace, and peacebuilding in Mindanao, Philippines', '2026', 'Intercultural Education', 'Rehna Sotto', 'University of Jyväskylä', '', 'Department of Language and Communication Studies'
UNION ALL
SELECT 'Research note: peace education teachers’ perceptions of interculturality, peace, and peacebuilding in Mindanao, Philippines', '2026', 'Intercultural Education', 'Jovar G. Pantao', 'MSU-GSC', 'COED', 'Bachelor of Elementary Education Department'
UNION ALL
SELECT 'Left to Figure It Out: Toward Responsive Governance for Special Needs Homeschooling in Southeastern Philippines', '2026', 'IGI Global', 'Ivy May M. Akiangan', 'Ateneo De Davao University', '', ''
UNION ALL
SELECT 'Left to Figure It Out: Toward Responsive Governance for Special Needs Homeschooling in Southeastern Philippines', '2026', 'IGI Global', 'Francis N. Reginio', 'University of Southeastern Philippines', '', ''
UNION ALL
SELECT 'Left to Figure It Out: Toward Responsive Governance for Special Needs Homeschooling in Southeastern Philippines', '2026', 'IGI Global', 'Jun Rex H. Halique', 'MSU-GSC', 'CSSH', 'Department of Political Science'
UNION ALL
SELECT 'Sequential Corona of Graphs: Proximity and Connectivity Properties', '2026', 'International Journal of Mathematics and Computer Science', 'Rosalio G. Artes', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'Sequential Corona of Graphs: Proximity and Connectivity Properties', '2026', 'International Journal of Mathematics and Computer Science', 'Arsanial E. Sappayani', 'Sulu State University', '', ''
UNION ALL
SELECT 'Sequential Corona of Graphs: Proximity and Connectivity Properties', '2026', 'International Journal of Mathematics and Computer Science', 'Berlita Y. Disca', 'MSU-GSC', 'CNSM', 'Mathematics Department'
UNION ALL
SELECT 'Sequential Corona of Graphs: Proximity and Connectivity Properties', '2026', 'International Journal of Mathematics and Computer Science', 'Doli-Jane U. Tejada', 'MSU-GSC', 'CNSM', 'Mathematics Department'
UNION ALL
SELECT 'Graph Polynomial Representation Resulting from Total Network Interactions', '2026', 'International Journal of Mathematics and Computer Science', 'Rosalio G. Artes', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'Graph Polynomial Representation Resulting from Total Network Interactions', '2026', 'International Journal of Mathematics and Computer Science', 'Berlita Y. Disca', 'MSU-GSC', 'CNSM', 'Mathematics Department'
UNION ALL
SELECT 'Graph Polynomial Representation Resulting from Total Network Interactions', '2026', 'International Journal of Mathematics and Computer Science', 'Glee Ann L. Tampipi', 'Central Mindanao University', '', ''
UNION ALL
SELECT 'Graph Polynomial Representation Resulting from Total Network Interactions', '2026', 'International Journal of Mathematics and Computer Science', 'Kheerza J. Jikilulla', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'Graph Polynomial Representation Resulting from Total Network Interactions', '2026', 'International Journal of Mathematics and Computer Science', 'Cesar A. Persial', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'Graph Polynomial Representation Resulting from Total Network Interactions', '2026', 'International Journal of Mathematics and Computer Science', 'Sisteta U. Kamdon', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'On the Domination Neighborhood Polynomial of a Graph', '2026', 'International Journal of Mathematics and Computer Science', 'Rosalio G. Artes', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'On the Domination Neighborhood Polynomial of a Graph', '2026', 'International Journal of Mathematics and Computer Science', 'Benjamin N. Omamalin', 'Bohol Island State University-Balilihan Campus Magsija', '', ''
UNION ALL
SELECT 'On the Domination Neighborhood Polynomial of a Graph', '2026', 'International Journal of Mathematics and Computer Science', 'Rendon A. Dela Cruz', 'MSU-GSC', 'CNSM', 'Mathematics Department'
UNION ALL
SELECT 'On the Domination Neighborhood Polynomial of a Graph', '2026', 'International Journal of Mathematics and Computer Science', 'Alcyn R. Bakkang', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'Doubly Convex Neighborhood Polynomials', '2026', 'International Journal of Mathematics and Computer Science', 'Rosalio G. Artes', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'Doubly Convex Neighborhood Polynomials', '2026', 'International Journal of Mathematics and Computer Science', 'Myrna S. Kiram', 'Sulu State University', '', ''
UNION ALL
SELECT 'Doubly Convex Neighborhood Polynomials', '2026', 'International Journal of Mathematics and Computer Science', 'Jeanette G. Bayona', 'Iloilo State University of Fisheries Science and Technology', '', ''
UNION ALL
SELECT 'Doubly Convex Neighborhood Polynomials', '2026', 'International Journal of Mathematics and Computer Science', 'Doli-Jane U. Tejada', 'MSU-GSC', 'CNSM', 'Mathematics Department'
UNION ALL
SELECT 'Doubly Convex Neighborhood Polynomials', '2026', 'International Journal of Mathematics and Computer Science', 'Noor-Han N. Ulal', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'Bernstein-Type Inequalities in Gaussian Reproducing Kernel Hilbert Spaces via Operator Methods', '2026', 'International Journal of Mathematics and Computer Science', 'Rosalio G. Artes', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'Bernstein-Type Inequalities in Gaussian Reproducing Kernel Hilbert Spaces via Operator Methods', '2026', 'International Journal of Mathematics and Computer Science', 'Javier J. Haiber', 'Sulu State University', '', ''
UNION ALL
SELECT 'Bernstein-Type Inequalities in Gaussian Reproducing Kernel Hilbert Spaces via Operator Methods', '2026', 'International Journal of Mathematics and Computer Science', 'Liza N. Bordios', 'MSU-Buug', '', ''
UNION ALL
SELECT 'Bernstein-Type Inequalities in Gaussian Reproducing Kernel Hilbert Spaces via Operator Methods', '2026', 'International Journal of Mathematics and Computer Science', 'Jeanifer Bingco-Lanzuela', 'MSU-GSC', 'CNSM', 'Mathematics Department'
UNION ALL
SELECT 'Bernstein-Type Inequalities in Gaussian Reproducing Kernel Hilbert Spaces via Operator Methods', '2026', 'International Journal of Mathematics and Computer Science', 'Kheerza J. Jikilulla', 'MSU-TCTO', '', ''
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Gina A. Opiniano', 'Ateneo de Manila University', '', ''
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Liz Jackson', 'University of Hong Kong', '', ''
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Mary John Mananzan Sr.', 'Institute of Women’s Studies', '', ''
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Bernardo N. Caslib', 'University of the Philippines Manila and Ateneo de Manila University', '', ''
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Jean Emily P. Tan', 'Ateneo de Manila University', '', ''
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Mariefe B. Cruz', 'University of Santo Tomas', '', ''
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Agnes S. Oblefias', 'Polytechnic University of the Philippine', '', ''
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Rowena Azada-Palacios', 'Ateneo de Manila University', '', ''
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Ian Clark R. Parcon', 'Ateneo de Manila University', '', ''
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Ma. Glovedi Joy L. Bigornia', 'Yonsei University', 'United Graduate School of Theology', ''
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Najifah P. Macaraya', 'MSU-GSC', 'CSSH', 'Department of Political Science'
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Ma. Theresa T. Payongayong', 'University of the Philippines Diliman', '', ''
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Mary Pauline V. Saquing-Sellers', 'Trinity University of Asia St. Luke', 'College of Nursing', ''
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Vincent Aljon A. Cifra', '', '', ''
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Mika Okabe', 'University of Osaka', '', ''
UNION ALL
SELECT 'Gender in Philippine education and philosophy: A collective writing project', '2026', 'Routledge', 'Jessica Heybach', 'Western Michigan University', '', ''
) AS seed WHERE NOT EXISTS (SELECT 1 FROM scopus_publications);
