import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { fillBeneficiaryPrototype } from '../src/lib/pdf/beneficiaryPrototype';

async function main() {
  const template = readFileSync('public/forms/pa-1938.pdf');
  const answers = { name: 'Maya Johnson', dob: '1992-06-15', ssnLast4: '0123', address: '123 Maple Street', city: 'Philadelphia', zip: '19104', org: 'Maple Community Pantry', orgPhone: '2155550143', orgAddress: '456 Garden Avenue', orgCity: 'Philadelphia', orgZip: '19104', start: '2026-11-01', end: '2026-11-30', schedule: 'Mondays 9am-1pm', tasks: 'Sort donations', task2: 'Pack grocery bags', task3: 'Welcome visitors', office: 'Philadelphia CAO - West District', fax: '215-560-2053', hours: '4', transport: 'No' };
  const bytes = await fillBeneficiaryPrototype(template, answers, { signature: 'Jordan Lee' });
  if (process.env.PDF_PREVIEW_PATH) writeFileSync(process.env.PDF_PREVIEW_PATH, bytes);
  const result = await PDFDocument.load(bytes);
  const form = result.getForm();
  assert.equal(form.getTextField('Name of volunteer').getText(), 'Maya Johnson');
  assert.equal(form.getTextField('Name of agency').getText(), answers.org);
  assert.equal(form.getTextField('Last 4 digits of SSN').getText(), '0123', 'Preserve exactly four digits, including leading zeros');
  for (const [number, value] of [['1', answers.tasks], ['2', answers.task2], ['3', answers.task3]]) {
    assert.equal(form.getTextField(number).getText(), value);
  }
  assert.equal(form.getTextField('SnappyForms county destination').getText(), `${answers.office}\nFax: ${answers.fax}`);
  assert(form.getField('Text1').acroField.getWidgets().every(w => (w.getFlags() & 2) !== 0), 'Shared blank widgets must be hidden so they cannot obscure the destination');
  const changed = await PDFDocument.load(await fillBeneficiaryPrototype(template, { ...answers, name: 'Taylor Reed', ssnLast4: '9876', office: 'Lancaster County Assistance Office', fax: '717-299-7565' }));
  assert.equal(changed.getForm().getTextField('Name of volunteer').getText(), 'Taylor Reed');
  assert.equal(changed.getForm().getTextField('Last 4 digits of SSN').getText(), '9876');
  assert.equal(changed.getForm().getTextField('SnappyForms county destination').getText(), 'Lancaster County Assistance Office\nFax: 717-299-7565');
  assert.equal(form.getTextField('Estimated Weekly HoursTotal Monthly Estimated Hours').getText(), '16');
  assert.equal(form.getRadioGroup('Group4').getSelected(), 'NO');
  assert.equal(form.getTextField('Name of Site Manager please print').getText(), 'Jordan Lee');
  assert.equal(form.getTextField('MONTHLY HOURS').getText(), undefined, 'County-only field must remain blank');
  for (const name of ['Name of volunteer', 'Name of agency', '1']) {
    const widgets = form.getTextField(name).acroField.getWidgets();
    assert(widgets.length > 0);
    assert(widgets.every(w => w.getAppearances()?.normal), `${name} must have an appearance stream`);
  }
  const unknown = await PDFDocument.load(await fillBeneficiaryPrototype(template, { ...answers, ssnLast4: '', hours: 'Unknown', tasks: 'Unknown', transport: 'Unknown' }));
  assert.equal(unknown.getForm().getTextField('1').getText(), undefined);
  assert.equal(unknown.getForm().getTextField('Last 4 digits of SSN').getText(), undefined);
  assert.equal(unknown.getForm().getRadioGroup('Group4').getSelected(), undefined);
  console.log('Official PA-1938 mapping, interactive fields, signatures, unknowns, and county-only fields passed.');
}
void main();
