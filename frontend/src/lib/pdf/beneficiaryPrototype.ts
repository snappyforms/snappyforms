import { PDFDocument, StandardFonts } from 'pdf-lib';
/** Fill the official template, retaining AcroForm fields for review. */
export async function fillBeneficiaryPrototype(template: ArrayBuffer | Uint8Array, answers: Record<string, string>, active?: {
    signature?: string;
}) {
    const doc = await PDFDocument.load(template);
    const form = doc.getForm();
    const mapping: Record<string, string> = { 'Name of volunteer': answers.name, 'Birthdate': answers.dob, 'Last 4 digits of SSN': /^\d{4}$/.test(answers.ssnLast4 || '') ? answers.ssnLast4 : '', 'Address of volunteer': answers.address, 'City': answers.city, 'State': 'PA', 'ZIP code': answers.zip, 'Name of agency': answers.org, 'Agency Phone Number': answers.orgPhone, 'Address of agency': answers.orgAddress, 'City_2': answers.orgCity, 'State_2': 'PA', 'ZIP code_2': answers.orgZip, 'Start Date of Service': answers.start, 'Expected End Date of Service': answers.end, 'Monthly Schedule of ServiceRow1': answers.schedule, '1': answers.tasks, '2': answers.task2 || '', '3': answers.task3 || '', 'Name of Site Manager please print': active?.signature || '', 'Date': active?.signature ? new Date().toLocaleDateString('en-US') : '' };
    for (let n = 1; n <= 4; n++)
        mapping[`Estimated Weekly HoursWeek ${n}`] = answers.hours;
    mapping['Estimated Weekly HoursTotal Monthly Estimated Hours'] = answers.hours && answers.hours !== 'Unknown' ? String(Number(answers.hours) * 4) : '';
    for (const [k, v] of Object.entries(mapping)) {
        const f = form.getTextField(k);
        f.setText(v === 'Unknown' ? '' : v);
        if (['1', '2', '3'].includes(k)) f.enableMultiline();
        f.setFontSize(9);
    }
    const radio = form.getRadioGroup('Group4');
    const opts = radio.getOptions();
    if (answers.transport === 'Yes' && opts[0])
        radio.select(opts[0]);
    if (answers.transport === 'No' && opts[1])
        radio.select(opts[1]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    if (active?.signature) {
        doc.getPages()[0].drawText(`Demo signature: ${active.signature.replace(/[^ -~]/g, '').slice(0, 70)}`, { x: 40, y: 113, size: 9, font });
    }
    // The source reuses Text1 for the destination and an unrelated widget.
    // Hide its widgets and use a dedicated destination field so its blank appearance
    // cannot cover the office name, and edits cannot affect another section.
    const sharedField = form.getFieldMaybe('Text1');
    if (sharedField) {
        sharedField.enableReadOnly();
        for (const widget of sharedField.acroField.getWidgets()) widget.setFlags(widget.getFlags() | 2);
    }
    const destination = form.createTextField('SnappyForms county destination');
    destination.enableMultiline();
    destination.setText(answers.office && answers.office !== 'Confirm my assigned county office'
        ? `${answers.office}\nFax: ${answers.fax || 'To be confirmed'}` : '');
    destination.addToPage(doc.getPages()[0], { x: 359, y: 517, width: 196, height: 44,
        borderWidth: 0, font });
    destination.setFontSize(8);

    for (const p of doc.getPages())
        p.drawText('DEMONSTRATION ONLY - NOT SUBMITTED - signature is simulated', { x: 35, y: 10, size: 7, font });
    form.updateFieldAppearances(font);
    return doc.save();
}
