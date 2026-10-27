# Move PAPs licensure data into OME

OME has an independent licensure dashboard, topnotchers page, and management screens. They connect to the **OME** database through `licensure_api.php` and use the existing OME administrator sign-in. No OME page needs the PAPs website or database after migration.

## Before changing either database

1. Export a full backup of the existing OME database and keep it on your computer, outside `htdocs`.
2. Export a full backup of the existing PAPs database too. InfinityFree does not provide automatic backups for free accounts.
3. Confirm you selected the correct database before every import: the destination is `if0_42396485_ome_website`, not the PAPs database.
4. Do not share the SQL downloads publicly. They can contain names, survey responses, or other personal information.

## Export the latest licensure records from PAPs

In the InfinityFree client area, open **MySQL Databases** and then **phpMyAdmin** for the PAPs database. Select that database and choose **Export → Custom → SQL**. Select **only** these four tables:

1. `licensure_programs`
2. `licensure_exam_periods`
3. `licensure_results`
4. `licensure_topnotchers`

Keep both **structure and data** selected if these tables do **not** yet exist in OME. Do not include `users`, `admin_sessions`, survey tables, or unrelated PAPs tables. Do not enable `CREATE DATABASE`, `USE paps_monitoring`, or `DROP TABLE` in the export. Download the `.sql` file and keep it outside the website folder. A local PAPs SQL snapshot also exists, but it may not include the latest hosted edits; prefer this fresh export.

## Import into OME

1. Open phpMyAdmin for `if0_42396485_ome_website`.
2. Confirm that it has the existing OME survey tables and **does not yet have** the four `licensure_*` tables.
3. Open **Import**, choose the fresh four-table SQL file, and start the import.
4. Confirm the four tables appear and contain rows. Useful checks in phpMyAdmin's SQL tab:

   ```sql
   SELECT COUNT(*) AS programs FROM licensure_programs;
   SELECT COUNT(*) AS periods FROM licensure_exam_periods;
   SELECT COUNT(*) AS results FROM licensure_results;
   SELECT COUNT(*) AS topnotchers FROM licensure_topnotchers;
   ```

If the four tables already exist in OME, **do not import another structure-and-data dump on top of them**. If they are empty, export **data only** from PAPs and import the four tables in dependency order (programs, periods, results, topnotchers). If they already contain OME edits, stop and reconcile the two copies before importing to avoid duplicate IDs or overwriting edits.

If you are starting with no PAPs data, import `db/licensure_schema.sql` into the OME database instead. That creates empty, editable licensure tables. It is **not needed** when importing the four PAPs tables with their structure.

## Upload and verify the OME website

Upload the changed `index.html` and `css/styles.css`, plus the new `js/licensure.js` and `licensure_api.php`, to the matching paths in OME's `htdocs`. Keep the OME `private/config.php` pointed at `if0_42396485_ome_website`; do not replace it with the PAPs database config. The SQL export and files in `db/` stay **outside** `htdocs`.

Open OME over HTTPS and check:

- **Licensure → Performance Dashboard**: program options, date filters, chart, results table, and CSV export.
- **Licensure → Topnotchers**: filters, names, ranks, and ratings.
- **OME Admin sign-in → Licensure → Manage Data**: add or edit a program, period, result, and topnotcher. Verify the changes remain after refresh.
- Existing Client Satisfaction Survey pages still load and retain their records.

Only after these checks and the two backups are safe should you stop using the PAPs website. Do not delete its hosting account or database until you are confident the OME copy contains all current licensure records.
