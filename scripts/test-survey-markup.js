// Smoke-test both survey renderers without submitting data or needing a database.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const omeRoot = path.resolve(__dirname, '..');
const publicRoot = path.resolve(omeRoot, '..', 'client-satisfaction-survey');

function verify(root) {
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'private', 'form.json'), 'utf8'));
  const structure = metadata.form.structure;
  const wrappers = {
    '#unitQ': { textContent: '' },
    '#unitTl': { textContent: '' },
    '#unitWrap': { hidden: false },
    '#cc2wrap': { hidden: false, querySelectorAll: () => [{ disabled: false, checked: true }] },
    '#cc3wrap': { hidden: false, querySelectorAll: () => [{ disabled: false, checked: true }] }
  };
  const listeners = {};
  const fakeForm = {
    office: { value: '', addEventListener() {} },
    unit: { innerHTML: '' },
    gender: { addEventListener() {} },
    ctype: { addEventListener() {} },
    querySelector: selector => wrappers[selector],
    addEventListener: (event, handler) => { listeners[event] = handler; }
  };
  const element = {
    innerHTML: '',
    querySelector: selector => selector === '#cssForm' ? fakeForm : null
  };
  const store = {
    form: metadata.form,
    lists: metadata.lists,
    structure,
    hierarchy: Object.fromEntries(structure.map(item => [item.office, item.units])),
    unitKind: office => structure.find(item => item.office === office)?.unitKind || 'office'
  };
  const sqd = Array.from({ length: 11 }, (_, index) => ({
    short: `Item ${index + 1}`, en: `Statement ${index + 1}`, tl: `Pahayag ${index + 1}`
  }));
  const ome = { Store: store, SQD: sqd, esc: value => String(value), views: {} };
  const script = fs.readFileSync(path.join(root, 'js', 'survey.js'), 'utf8');
  vm.runInNewContext(script, { window: { OME: ome }, Date, Intl, Object });
  ome.views.evaluate(element);

  assert.match(element.innerHTML, /class="survey-required-note"/);
  const markup = element.innerHTML.toLowerCase();
  const privacyEnd = markup.indexOf('<h3>client information</h3>');
  const clientEnd = markup.indexOf('<h3>office and service</h3>');
  assert.ok(privacyEnd > 0 && clientEnd > privacyEnd, 'Client information must be a separate section');
  assert.ok(element.innerHTML.indexOf('id="legal"') > privacyEnd, 'Legal name belongs with client information');
  assert.ok(element.innerHTML.indexOf('id="cdate"') > privacyEnd, 'Date belongs with client information');
  assert.ok(element.innerHTML.indexOf('id="cdate"') < clientEnd, 'Date must precede office details');
  assert.match(element.innerHTML, /Comments and submission/i);
  if (root === omeRoot) assert.doesNotMatch(element.innerHTML, /Question 1 of 11/);
  assert.equal((element.innerHTML.match(/<tr data-q=/g) || []).length, 11);
  assert.equal((element.innerHTML.match(/class="likert-choice"/g) || []).length, 66);
  assert.doesNotMatch(element.innerHTML, /Swipe sideways to view all columns/);
  assert.match(element.innerHTML, /max="\d{4}-\d{2}-\d{2}" required/);
  assert.ok(listeners.change, 'Citizen’s Charter change handler should be installed');
  listeners.change({ target: { name: 'cc1', value: '3' } });
  assert.equal(wrappers['#cc2wrap'].hidden, true);
  assert.equal(wrappers['#cc3wrap'].hidden, true);
  listeners.change({ target: { name: 'cc1', value: '0' } });
  assert.equal(wrappers['#cc2wrap'].hidden, false);
  assert.equal(wrappers['#cc3wrap'].hidden, false);
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /css\/survey\.css\?v=/);
  return root;
}

console.log(`Survey markup OK: ${verify(omeRoot)}`);
if (fs.existsSync(path.join(publicRoot, 'js', 'survey.js')) && fs.existsSync(path.join(publicRoot, 'private', 'form.json'))) {
  console.log(`Survey markup OK: ${verify(publicRoot)}`);
} else {
  console.log('Standalone survey check skipped: sibling project not present.');
}
// The two sites may be updated separately; this check covers shared form behavior only.
const omeScript = fs.readFileSync(path.join(omeRoot, 'js', 'survey.js'), 'utf8');
const omeStyle = fs.readFileSync(path.join(omeRoot, 'css', 'survey.css'), 'utf8');
assert.equal((omeScript.match(/class="req survey-label-bilingual"/g) || []).length, 3);
assert.match(omeStyle, /\.survey \.grid\.g2 > \.field > label \{ flex: 1 0 auto; \}/);
assert.match(omeStyle, /@media \(max-width: 1199px\)/);
assert.match(omeStyle, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
console.log('OME field alignment and responsive rating rules OK.');
