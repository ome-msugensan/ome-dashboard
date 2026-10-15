# OME Client Satisfaction Survey: Prototype

A website prototype for the **Office of Monitoring and Evaluation, MSU – General Santos**. Clients evaluate an office with the Client Satisfaction Survey (CSS), and OME sees the results on a dashboard and in printable reports.

> **Prototype:** there is no server or database. New submissions, imports, findings and settings are saved only in the browser you use (localStorage). Connecting a backend comes after the presentation.

## Run it locally

Open `index.html` in a browser (double-click it). Charts load Chart.js from a CDN, so you need an internet connection for them.

## Pages

| Page | What it does |
|---|---|
| **Evaluate an Office** | The CSS questionnaire: consent, client info, office → unit picker, Citizen's Charter (CC1–CC3), 11 service quality items (SQD0–SQD10), comments. |
| **Dashboard** | KPIs (overall CSS score, % satisfied clients, respondents, response rate, offices), trend, ratings by dimension, ratings by office (expandable to units), period comparison. |
| **Service Quality** | High-satisfaction areas, areas needing improvement, frequent concerns, CC awareness, comment themes with the comments behind them. |
| **Reports** | CSS report, office-level summary, period-to-period comparison. Print / save as PDF, or download CSV. |
| **Admin** | Demo passcode `ome2026`. Import the Google Sheet CSV, validate response counts (and enter clients served for response rate), manage reporting periods, targets, rating scale and office names, and upload summarized findings. |

## How scores are computed

- **CSS score**: the share of all SQD ratings that are *Agree* (4) or *Strongly Agree* (5). N/A and blank answers are excluded.
- **Satisfied clients**: the share of respondents who answered 4 or 5 on SQD0 ("I am satisfied with the service that I availed").
- **Average rating**: the mean of all SQD ratings on the 1–5 scale.
- **Rating scale and target**: defaults are Outstanding ≥ 90%, Very Satisfactory ≥ 80%, Satisfactory ≥ 70%, Fair ≥ 60%, Poor < 60%, and an 80% target. Change them in Admin → Manage reporting categories to match the scale OME reports with.
- **Comment themes** come from keyword matching in English and Filipino, defined in `js/core.js` (`THEMES`).

## Data and privacy

`data.js` holds an **anonymized** copy of the CSS Google Sheet responses. Legal names, contact numbers, e-mails, staff names and the consent text are removed, and e-mails or phone numbers inside comments are masked. Keep the GitHub repository **private**, because the comments are still free text written by clients.

To refresh `data.js` from a new export:

```bash
python tools/build_data.py "CLIENT-SATISFACTION-SURVEY (Responses).csv" data.js
```

Never commit the raw export. `*.csv` is listed in `.gitignore`.

## Files

```
index.html        page shell and router
css/styles.css    styles
data.js           anonymized survey responses (generated)
js/core.js        data store, metrics, CSV import, comment themes
js/survey.js      Evaluate an Office
js/dashboard.js   Dashboard and Service Quality
js/reports.js     Reports
js/admin.js       Admin (response management)
tools/build_data.py  builds data.js from the Google Sheet CSV
```
