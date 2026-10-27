-- Import into the existing OME database AFTER university_kpi_schema.sql.
-- This is additive and idempotent: existing KPI edits are read from the current
-- indicator table, and later edits to yearly records are never overwritten.
CREATE TABLE IF NOT EXISTS university_kpi_yearly (
  indicator_id INT NOT NULL,
  report_year SMALLINT UNSIGNED NOT NULL,
  target_value VARCHAR(500) NOT NULL DEFAULT '',
  actual_value TEXT NOT NULL,
  actual_as_of VARCHAR(150) NOT NULL DEFAULT '',
  year_note TEXT NOT NULL,
  updated_by INT DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (indicator_id, report_year),
  KEY university_kpi_yearly_year_idx (report_year),
  CONSTRAINT university_kpi_yearly_indicator_fk FOREIGN KEY (indicator_id)
    REFERENCES university_kpi_indicators (indicator_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO university_kpi_yearly
  (indicator_id, report_year, target_value, actual_value, actual_as_of, year_note)
SELECT indicator_id, 2026, target_2026, actual_2026, actual_as_of, ''
FROM university_kpi_indicators;

INSERT IGNORE INTO university_kpi_yearly
  (indicator_id, report_year, target_value, actual_value, actual_as_of, year_note)
SELECT indicator_id, 2027, target_2027, '', '', ''
FROM university_kpi_indicators;

INSERT IGNORE INTO university_kpi_yearly
  (indicator_id, report_year, target_value, actual_value, actual_as_of, year_note)
SELECT indicator_id, 2028, target_2028, '', '', ''
FROM university_kpi_indicators;

INSERT IGNORE INTO university_kpi_yearly
  (indicator_id, report_year, target_value, actual_value, actual_as_of, year_note)
SELECT indicator_id, 2029, target_2029, '', '', ''
FROM university_kpi_indicators;

INSERT IGNORE INTO university_kpi_yearly
  (indicator_id, report_year, target_value, actual_value, actual_as_of, year_note)
SELECT indicator_id, 2030, target_2030, '', '', ''
FROM university_kpi_indicators;
