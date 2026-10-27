-- Run in the OME database before importing the four licensure tables from PAPs.
-- These tables are independent of the Client Satisfaction Survey tables.
CREATE TABLE IF NOT EXISTS licensure_programs (
  program_id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  program_key varchar(50) NOT NULL,
  program_name varchar(255) NOT NULL,
  exam_title varchar(255) NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sort_order int DEFAULT 0,
  status enum('Active','Inactive') DEFAULT 'Active',
  UNIQUE KEY licensure_program_key_unique (program_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS licensure_exam_periods (
  period_id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  program_id int NOT NULL,
  exam_period_label varchar(100) NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY licensure_period_program_idx (program_id),
  CONSTRAINT ome_licensure_period_program_fk FOREIGN KEY (program_id)
    REFERENCES licensure_programs (program_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS licensure_results (
  result_id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  period_id int NOT NULL,
  group_type enum('MSU','National') NOT NULL,
  taker_type enum('First','Overall') NOT NULL,
  passers int DEFAULT 0,
  takers int DEFAULT 0,
  rate decimal(5,2) DEFAULT 0.00,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY licensure_result_period_idx (period_id),
  CONSTRAINT ome_licensure_result_period_fk FOREIGN KEY (period_id)
    REFERENCES licensure_exam_periods (period_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS licensure_topnotchers (
  topnotcher_id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  period_id int NOT NULL,
  rank_position int NOT NULL,
  full_name varchar(255) NOT NULL,
  rating decimal(5,2) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY licensure_topnotcher_period_name_unique (period_id, full_name),
  KEY licensure_topnotcher_period_rank_idx (period_id, rank_position),
  CONSTRAINT ome_licensure_topnotcher_period_fk FOREIGN KEY (period_id)
    REFERENCES licensure_exam_periods (period_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
