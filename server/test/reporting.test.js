var test = require('node:test');
var assert = require('node:assert/strict');
var app = require('../app');

var server;
var baseUrl;

test.before(async function () {
  server = app.listen(0);
  await new Promise(function (resolve) { server.once('listening', resolve); });
  baseUrl = 'http://127.0.0.1:' + server.address().port;
});

test.after(async function () {
  await new Promise(function (resolve, reject) { server.close(function (error) { error ? reject(error) : resolve(); }); });
});

function headers(role) {
  return { 'content-type': 'application/json', 'x-user-id': 'test-user', 'x-reporting-role': role || 'reporting_analyst' };
}

async function request(path, options) {
  var response = await fetch(baseUrl + path, options);
  return { response: response, body: await response.json() };
}

test('requires authenticated reporting context', async function () {
  var result = await request('/api/reporting/schema-metadata');
  assert.equal(result.response.status, 401);
});

test('interprets an approved question and returns governed SQL', async function () {
  var result = await request('/api/reporting/nl-queries', { method: 'POST', headers: headers(), body: JSON.stringify({ prompt: 'Show warranty claims by dealer' }) });
  assert.equal(result.response.status, 201);
  assert.equal(result.body.status, 'interpreted');
  assert.match(result.body.sql, /^SELECT /);
  assert.match(result.body.sql, /reporting\.warranty_claims/);
  assert.doesNotMatch(result.body.sql, /approved_amount/);
});

test('blocks unsafe and unapproved SQL before execution', async function () {
  var created = await request('/api/reporting/nl-queries', { method: 'POST', headers: headers(), body: JSON.stringify({ prompt: 'Show vehicle count' }) });
  var result = await request('/api/reporting/query-validations', { method: 'POST', headers: headers(), body: JSON.stringify({ requestId: created.body.requestId, sql: 'DROP TABLE reporting.vehicle_summary; SELECT 1' }) });
  assert.equal(result.response.status, 422);
  assert.equal(result.body.decision, 'blocked');
  assert.ok(result.body.reasonCodes.includes('MULTI_STATEMENT'));
  assert.ok(result.body.reasonCodes.includes('READ_ONLY_REQUIRED'));
});

test('executes validated requests and masks analyst results', async function () {
  var created = await request('/api/reporting/nl-queries', { method: 'POST', headers: headers(), body: JSON.stringify({ prompt: 'Show dealer inventory by model' }) });
  var validation = await request('/api/reporting/query-validations', { method: 'POST', headers: headers(), body: JSON.stringify({ requestId: created.body.requestId, sql: created.body.sql }) });
  assert.equal(validation.body.decision, 'allowed');
  var executed = await request('/api/reporting/query-executions', { method: 'POST', headers: headers(), body: JSON.stringify({ requestId: created.body.requestId }) });
  assert.equal(executed.response.status, 200);
  assert.equal(executed.body.executionStatus, 'completed');
  assert.ok(executed.body.rows.length > 0);
  assert.equal(executed.body.queryContext.source, 'reporting.dealer_inventory');
});