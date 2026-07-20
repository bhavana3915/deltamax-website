const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSendGridPayload } = require('./server');

test('buildSendGridPayload creates the expected SendGrid email content', () => {
  const payload = buildSendGridPayload({
    fullName: 'Jane Doe',
    workEmail: 'jane@example.com',
    phoneNumber: '1234567890',
    companyName: 'Acme Corp',
    service: 'Data Quality Monitoring',
    message: 'Need help with data quality.'
  });

  assert.equal(payload.personalizations[0].to[0].email, 'bhavana@neualto.com');
  assert.equal(payload.reply_to.email, 'jane@example.com');
  assert.match(payload.content[0].value, /Name: Jane Doe/);
  assert.match(payload.content[0].value, /Need help with data quality\./);
});
