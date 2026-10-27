-- Import this once into the existing OME database (not the former PAPs database).
-- The first OME admin is created on the website using the existing admin passcode.
CREATE TABLE IF NOT EXISTS ome_users (
  id int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
  full_name varchar(150) NOT NULL,
  email varchar(254) NOT NULL,
  password_hash varchar(255) NOT NULL,
  role enum('admin','user') NOT NULL,
  category enum('ome_staff','faculty','staff','student') NOT NULL,
  active tinyint(1) NOT NULL DEFAULT 1,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY ome_users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash char(64) NOT NULL PRIMARY KEY,
  user_id int unsigned NOT NULL,
  expires_at datetime NOT NULL,
  KEY user_sessions_user_idx (user_id),
  KEY user_sessions_expiry_idx (expires_at),
  CONSTRAINT user_sessions_user_fk FOREIGN KEY (user_id) REFERENCES ome_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ome_auth_setup_lock (
  id tinyint NOT NULL PRIMARY KEY
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO ome_auth_setup_lock (id) VALUES (1);

-- login_attempts already exists in the original OME schema. This makes the
-- auth migration usable if that table was not imported previously.
CREATE TABLE IF NOT EXISTS login_attempts (
  ip_hash char(64) NOT NULL PRIMARY KEY,
  attempts smallint NOT NULL DEFAULT 0,
  reset_at datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
