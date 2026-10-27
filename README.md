# OME Client Satisfaction Survey

A PHP/MySQL website for the Office of Monitoring and Evaluation, MSU – General Santos. Clients submit the Client Satisfaction Survey; staff review results, import Google Forms CSV files, manage reporting settings, and prepare reports.

## Local setup

The local installation on this computer uses the XAMPP MariaDB server. A downloaded snapshot of the hosted OME database has been imported locally as `if0_42396485_ome_website`; the older `ome_css` database remains untouched. The local site uses its existing `ome_css_app` database account, which has access to the imported database. The downloaded SQL file is local-only and ignored by Git because it contains accounts and survey records.

Start MySQL in the XAMPP Control Panel, then run this from the project folder:

```powershell
php -S 127.0.0.1:8000 router.php
```

Open `http://127.0.0.1:8000` and sign in with an account from the imported OME database. Do not re-import the initial schema or seed into this snapshot. The ignored `private/config.php` selects the local database and keeps the matching personal-details encryption key from the hosted configuration. Keep a secure backup of that key: saved personal details cannot be read if it is lost. Password hashes are stored in the imported `ome_users` table.

## Set up another MySQL database

1. Create an empty MySQL/MariaDB database with `utf8mb4` encoding.
2. Import `db/mysql_schema.sql`, `db/auth_schema.sql`, then `db/mysql_seed.sql` into that new database with phpMyAdmin or a MySQL client. Import the seed before any new survey data or CSV imports.
3. Copy `private/config.example.php` to `private/config.php`. Set the database host, port, name, user, password, the admin password hash, a unique 64-character hexadecimal `pii_key`, and the site's exact origin (for example, `https://example.com`). Generate the key with `php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"` and store it securely.
4. Run the website on PHP 8.0 or later with PDO MySQL and OpenSSL enabled.

To refresh the database seed after rebuilding `data.js`, run `node scripts/build-mysql-assets.js`. This also regenerates `private/form.json` from the survey source. Node is only needed for this development step; the website itself runs on PHP.

## Uploading to InfinityFree

InfinityFree's free hosting supports PHP and MySQL. For an existing OME installation, import **only** `db/auth_schema.sql` into the existing OME database; do not re-import the seed or replace the database. Use the exact MySQL hostname shown in the control panel. Keep the existing hosted `private/config.php` and its `admin_password_hash`: the initial account-creation form uses that passcode once. Enable HTTPS because `.htaccess` redirects traffic there.

Upload `index.html`, `api.php`, `licensure_api.php`, `.htaccess`, `css/`, `js/`, `img/`, `private/auth.php`, `private/form.json`, and `private/.htaccess` into the domain's `htdocs` directory. Keep the hosted `private/config.php` in place. **Do not upload the local `private/config.php` or `private/local-admin-password.php`.** Keep `data.js`, `db/`, `scripts/`, `tools/`, raw survey exports, and the SQL seed outside `htdocs`; import SQL through phpMyAdmin. Upload complete files, not code pasted into older copies.

For an existing OME site, `deploy/ome-auth-upload.zip` contains the changed web files with their folder paths preserved. It intentionally excludes the database SQL and `private/config.php`.

After uploading, check that the site opens over HTTPS, `/api.php?action=health` reports `ok`, `/api.php?action=auth-status` returns `setupRequired: true` before the first account, and `/private/config.php` returns 403. Create the first admin, sign in, add a test regular user from **Users**, and verify that regular users cannot open Admin or Manage Data. Then test a survey submission. The website uses only GET and POST requests because InfinityFree blocks PUT and DELETE.

A database on this computer cannot serve a site uploaded to InfinityFree. The hosted copy needs its own MySQL database and config.

## Independent licensure section

OME now contains its own licensure performance dashboard, topnotchers page, and editing screens. They use four `licensure_*` tables in the **OME** database and OME staff admin accounts; PAPs is not contacted. Follow [the licensure migration guide](db/LICENSURE-MIGRATION.md) to export the latest four tables from PAPs and import them safely into OME. Back up both databases first. `db/licensure_schema.sql` is for creating empty licensure tables when no PAPs structure is being imported.

## University KPI Monitoring

The KPI dashboard is separate from the survey and licensure records. It includes the eight strategic directions and 42 indicators transcribed from the supplied OME scorecard screenshots. The dashboard keeps the year-by-year scorecard: each year is its own column, with that year's actual accomplishment displayed beneath its target. The admin editor shows the same annual records by KPI, lets staff revise a target or actual for any year, and can add later years from 2026 through 2100. The 2025 baseline remains separate. Values remain text because the source mixes percentages, counts, currency, and milestones. Only OME admin accounts can open **Update KPI Data** or save changes.

For an existing InfinityFree installation with the KPI section already installed, back up the OME database, then import **only** `db/university_kpi_yearly_migration.sql` into that same database in phpMyAdmin. The migration creates the annual table and copies the **current** 2026–2030 targets plus any edited 2026 actuals from the existing KPI table. It uses `INSERT IGNORE`, so rerunning it will not overwrite annual edits. A fresh installation imports `db/university_kpi_schema.sql` first, then the yearly migration. Upload `index.html`, `kpi_api.php`, `js/kpi.js`, and `css/kpi.css` to the corresponding locations under `htdocs`. Keep the hosted `private/config.php` unchanged. Do not upload `db/` or a local config file. Refresh the site and check **University KPI Monitoring → KPI Dashboard** and, as an admin, **Update KPI Data**. These local file changes do not install the tables or upload the site automatically.

## Data and access

- Existing source responses are anonymized before import. Names, contact details, staff names, and consent text are not in the database seed.
- New survey submissions save any supplied name, contact number, email, and staff name in a separate encrypted MySQL table. These fields are optional. Only signed-in administrators can view or export them from the **Respondent details** tab. The API deletes identifying details after three years; the anonymized survey answers remain. Signed-in users can view the dashboards and reports, which receive only survey answers; comments have e-mail addresses and phone numbers masked.
- The dashboard and reports read the current database, so new submissions and imports appear after refresh. Reports can be printed or downloaded as CSV.
- Sign-in uses individual accounts. Admins are OME staff and can create other admin or regular accounts. Regular accounts are faculty, staff, or student; they can view dashboards and submit evaluations but cannot edit dashboard data or manage accounts. Passwords need at least 12 characters. Users can change their own password under **My account**. Sessions use hashed tokens in HttpOnly, SameSite cookies.
- The signed-in dashboard currently displays individual anonymized comments. Review those comments and the university's publication policy before expanding access.
- Keep this repository private while it contains `data.js` and `db/mysql_seed.sql`, because comments are free text from clients. Never commit raw spreadsheet exports or `private/config.php`.

## Main files

| File | Purpose |
| --- | --- |
| `index.html`, `css/`, `js/`, `img/` | Website interface |
| `api.php` | PHP API for survey, dashboard, admin, and reports |
| `licensure_api.php`, `js/licensure.js` | Independent licensure API and interface |
| `kpi_api.php`, `js/kpi.js`, `css/kpi.css` | University KPI dashboard and admin editor |
| `db/university_kpi_schema.sql` | University KPI tables and screenshot-based seed records |
| `db/university_kpi_yearly_migration.sql` | Add annual KPI records without replacing existing data |
| `db/mysql_schema.sql` | MySQL tables and indexes |
| `db/auth_schema.sql`, `private/auth.php`, `js/users.js` | User accounts, sessions, and account management |
| `db/licensure_schema.sql` | Empty licensure tables, if not importing PAPs table structure |
| `db/mysql_seed.sql` | Anonymized source responses |
| `private/form.json` | Survey questions and office structure |
| `private/config.example.php` | Example local or hosted database configuration |
| `scripts/build-mysql-assets.js` | Regenerate form metadata and seed SQL from `data.js` |
| `tools/build_data.py` | Rebuild anonymized `data.js` from a raw Google Forms export |
