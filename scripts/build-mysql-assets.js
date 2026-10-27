const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const text = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
const prefix = 'window.CSS_SEED = ';
if (!text.includes(prefix)) throw new Error('Unrecognized data.js seed');
const seed = JSON.parse(text.slice(text.indexOf(prefix) + prefix.length).trim().replace(/;\s*$/, ''));

fs.mkdirSync(path.join(root, 'private'), { recursive: true });
fs.writeFileSync(path.join(root, 'private', 'form.json'), JSON.stringify({ form: seed.form, lists: seed.lists }));

const hex = value => {
  const encoded = Buffer.from(String(value ?? ''), 'utf8').toString('hex');
  return encoded ? `0x${encoded}` : "''";
};
const cols = '(id,response_date,office,unit,service,gender,client_type,cc1,cc2,cc3,sqd,comment,routed,source)';
const lines = [
  '-- Import after db/mysql_schema.sql into a new database, before any CSV imports.',
  'SET NAMES utf8mb4;',
  'START TRANSACTION;'
];
for (let start = 0; start < seed.rows.length; start += 100) {
  const rows = seed.rows.slice(start, start + 100).map((r, offset) => {
    const i = start + offset;
    const values = [hex(`s${i}`), hex(r[0]), hex(seed.lists.offices[r[1]]), hex(r[2] >= 0 ? seed.units[r[2]] : ''), hex(''), hex(seed.lists.genders[r[3]]), hex(seed.lists.types[r[4]].trim()), Number(r[5]), Number(r[6]), Number(r[7]), hex(r[8]), hex(r[9] || ''), r[10] ? 1 : 0, hex('seed')];
    return '(' + values.join(',') + ')';
  });
  lines.push(`INSERT IGNORE INTO responses ${cols} VALUES\n${rows.join(',\n')};`);
}
const meta = JSON.stringify({ source: seed.source, exported: seed.exported, rows: seed.rows.length, builtIn: true });
lines.push(`UPDATE site_settings SET import_meta_json = ${hex(meta)} WHERE singleton = 1 AND import_meta_json = '{}';`);
lines.push('COMMIT;');
fs.writeFileSync(path.join(root, 'db', 'mysql_seed.sql'), lines.join('\n') + '\n');
console.log(`Generated MySQL seed for ${seed.rows.length} anonymized responses.`);
