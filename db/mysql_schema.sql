-- Import into the MySQL database selected in phpMyAdmin.
CREATE TABLE IF NOT EXISTS responses (
  id varchar(64) NOT NULL PRIMARY KEY,
  response_date date NOT NULL,
  office varchar(250) NOT NULL,
  unit varchar(250) NOT NULL DEFAULT '',
  service varchar(500) NOT NULL DEFAULT '',
  gender varchar(100) NOT NULL DEFAULT '',
  client_type varchar(100) NOT NULL DEFAULT '',
  cc1 tinyint NOT NULL,
  cc2 tinyint NOT NULL,
  cc3 tinyint NOT NULL,
  sqd char(11) NOT NULL,
  comment text NOT NULL,
  routed tinyint(1) NOT NULL DEFAULT 0,
  source varchar(10) NOT NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY responses_date_office_idx (response_date, office),
  KEY responses_source_idx (source),
  CONSTRAINT responses_sqd_check CHECK (sqd REGEXP '^[0-5]{11}$'),
  CONSTRAINT responses_source_check CHECK (source IN ('seed','import','web'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS respondent_details (
  response_id varchar(64) NOT NULL PRIMARY KEY,
  encrypted_data longtext NOT NULL,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY respondent_details_created_idx (created_at),
  CONSTRAINT respondent_details_response_fk FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_settings (
  singleton tinyint NOT NULL PRIMARY KEY,
  settings_json longtext NOT NULL,
  import_meta_json longtext NOT NULL,
  CONSTRAINT site_settings_singleton_check CHECK (singleton = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO site_settings (singleton, settings_json, import_meta_json) VALUES (1, '{}', '{}');

CREATE TABLE IF NOT EXISTS clients_served (
  office varchar(250) NOT NULL,
  period varchar(20) NOT NULL,
  clients int NOT NULL,
  PRIMARY KEY (office, period),
  CONSTRAINT clients_served_positive_check CHECK (clients > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS findings (
  id varchar(64) NOT NULL PRIMARY KEY,
  title varchar(250) NOT NULL,
  office varchar(250) NOT NULL DEFAULT '',
  period varchar(20) NOT NULL DEFAULT '',
  findings text NOT NULL,
  actions text NOT NULL,
  file_name varchar(250) NOT NULL DEFAULT '',
  file_data longtext NOT NULL,
  added datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash char(64) NOT NULL PRIMARY KEY,
  expires_at datetime NOT NULL,
  KEY admin_sessions_expiry_idx (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
  ip_hash char(64) NOT NULL PRIMARY KEY,
  attempts smallint NOT NULL DEFAULT 0,
  reset_at datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
