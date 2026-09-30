var express = require('express');
var crypto = require('crypto');

var router = express.Router();
var requests = new Map();
var auditEvents = [];
var MAX_PROMPT_LENGTH = 500;
var MAX_PAGE_SIZE = 25;
var MAX_ROW_LIMIT = 100;

var schemaMetadata = {
  schema: 'reporting',
  domains: {
    vehicle: {
      label: 'Vehicle operations',
      table: 'reporting.vehicle_summary',
      columns: ['model', 'region', 'status', 'service_events', 'warranty_claims'],
      metrics: ['vehicle count', 'service events', 'warranty claims']
    },
    warranty: {
      label: 'Warranty activity',
      table: 'reporting.warranty_claims',
      columns: ['claim_month', 'dealer', 'claim_count', 'approved_amount'],
      metrics: ['claim count', 'approved amount']
    },
    dealer: {
      label: 'Dealer inventory',
      table: 'reporting.dealer_inventory',
      columns: ['dealer', 'region', 'model', 'inventory_count', 'days_in_stock'],
      metrics: ['inventory count', 'days in stock']
    },
    service: {
      label: 'Service history',
      table: 'reporting.service_history',
      columns: ['service_month', 'region', 'service_events', 'repeat_visits'],
      metrics: ['service events', 'repeat visits']
    }
  }
};

var fixtureRows = {
  vehicle: [
    { model: 'Atlas X', region: 'North', status: 'Active', service_events: 182, warranty_claims: 14 },
    { model: 'Civic Trail', region: 'West', status: 'Active', service_events: 156, warranty_claims: 9 },
    { model: 'Volt Runner', region: 'East', status: 'Service', service_events: 91, warranty_claims: 21 },
    { model: 'Atlas X', region: 'South', status: 'Active', service_events: 204, warranty_claims: 17 }
  ],
  warranty: [
    { claim_month: '2026-06', dealer: 'Northstar Motors', claim_count: 42, approved_amount: 18240 },
    { claim_month: '2026-07', dealer: 'Westline Automotive', claim_count: 37, approved_amount: 15480 },
    { claim_month: '2026-08', dealer: 'Eastgate Motors', claim_count: 51, approved_amount: 23100 },
    { claim_month: '2026-09', dealer: 'Southpoint Auto', claim_count: 28, approved_amount: 11950 }
  ],
  dealer: [
    { dealer: 'Northstar Motors', region: 'North', model: 'Atlas X', inventory_count: 38, days_in_stock: 19 },
    { dealer: 'Westline Automotive', region: 'West', model: 'Civic Trail', inventory_count: 24, days_in_stock: 31 },
    { dealer: 'Eastgate Motors', region: 'East', model: 'Volt Runner', inventory_count: 17, days_in_stock: 12 },
    { dealer: 'Southpoint Auto', region: 'South', model: 'Atlas X', inventory_count: 29, days_in_stock: 23 }
  ],
  service: [
    { service_month: '2026-06', region: 'North', service_events: 318, repeat_visits: 41 },
    { service_month: '2026-07', region: 'West', service_events: 274, repeat_visits: 34 },
    { service_month: '2026-08', region: 'East', service_events: 291, repeat_visits: 38 },
    { service_month: '2026-09', region: 'South', service_events: 227, repeat_visits: 29 }
  ]
};

function id(prefix) {
  return prefix + '-' + crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function userFromRequest(req) {
  var userId = req.get('x-user-id');
  var role = req.get('x-reporting-role') || 'reporting_analyst';
  if (!userId) return null;
  return { userId: userId, role: role };
}

function requireUser(req, res, next) {
  var user = userFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Authentication required.' });
  req.reportingUser = user;
  next();
}

function addAudit(request, user, eventType, outcome, details) {
  var event = Object.assign({
    eventId: id('evt'),
    requestId: request && request.requestId,
    eventType: eventType,
    outcome: outcome,
    userId: user && user.userId,
    role: user && user.role,
    timestamp: now()
  }, details || {});
  auditEvents.push(Object.freeze(event));
  return event;
}

function detectDomain(prompt) {
  var value = prompt.toLowerCase();
  if (/warranty|claim/.test(value)) return 'warranty';
  if (/dealer|inventory|stock/.test(value)) return 'dealer';
  if (/service|repair|workshop|visit/.test(value)) return 'service';
  if (/vehicle|vin|fleet|car|model/.test(value)) return 'vehicle';
  return null;
}

function interpret(prompt) {
  var domain = detectDomain(prompt);
  var lower = prompt.toLowerCase();
  if (!domain) return { status: 'clarification', clarification: 'Please name a supported area such as vehicles, warranty, dealer inventory, or service history.' };
  if (!/(count|number|amount|total|average|avg|trend|rate|how many|list|show|compare|events|claims|inventory|stock|visits)/.test(lower)) {
    return { status: 'clarification', clarification: 'Please include a metric or comparison, such as count, total, trend, or average.' };
  }
  var metadata = schemaMetadata.domains[domain];
  var metric = metadata.metrics.find(function (item) { return lower.indexOf(item.split(' ')[0]) >= 0; }) || metadata.metrics[0];
  var timeElement = /month|monthly|quarter|year|2026|last|recent/.test(lower) ? 'Requested time period' : 'Current approved sample period';
  var sql = 'SELECT ' + metadata.columns.slice(0, 4).join(', ') + ' FROM ' + metadata.table + ' ORDER BY 1 LIMIT 25';
  return {
    status: 'interpreted',
    domain: domain,
    domainLabel: metadata.label,
    mappedTable: metadata.table,
    intent: { subjectArea: metadata.label, metric: metric, filter: 'Approved reporting rows', grouping: metadata.columns[0], timeElement: timeElement, confidence: 0.94 },
    sql: sql
  };
}

function maskRows(rows, role) {
  return rows.map(function (row) {
    var output = Object.assign({}, row);
    if (role === 'reporting_analyst') {
      Object.keys(output).forEach(function (key) {
        if (/vin|email|customer|phone|amount/.test(key)) output[key] = '[masked]';
      });
    }
    return output;
  });
}

function resultFor(request, user, page, size, sort) {
  var safePage = Math.max(1, Number(page) || 1);
  var safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(size) || MAX_PAGE_SIZE));
  var rows = (fixtureRows[request.domain] || []).slice(0, request.rowLimit);
  if (sort && Object.prototype.hasOwnProperty.call(rows[0] || {}, sort)) {
    rows.sort(function (a, b) { return String(a[sort]).localeCompare(String(b[sort]), undefined, { numeric: true }); });
  }
  var start = (safePage - 1) * safeSize;
  var pageRows = maskRows(rows.slice(start, start + safeSize), user.role);
  return {
    requestId: request.requestId,
    executionStatus: request.executionStatus,
    columns: Object.keys(pageRows[0] || rows[0] || {}),
    rows: pageRows,
    rowCount: pageRows.length,
    totalRows: rows.length,
    page: safePage,
    pageSize: safeSize,
    totalPages: Math.max(1, Math.ceil(rows.length / safeSize)),
    queryContext: { sqlReference: request.sqlFingerprint, source: request.mappedTable, domain: request.domainLabel },
    executedAt: request.completedAt
  };
}

function validateSql(sql, user) {
  var reasons = [];
  var normalized = String(sql || '').trim();
  if (!normalized) reasons.push('SQL_REQUIRED');
  if (normalized.split(';').filter(Boolean).length !== 1) reasons.push('MULTI_STATEMENT');
  if (/--|\/\*/.test(normalized)) reasons.push('COMMENTS_NOT_ALLOWED');
  if (!/^select\b/i.test(normalized)) reasons.push('SELECT_ONLY');
  if (/\b(insert|update|delete|merge|drop|alter|truncate|create|copy|grant|revoke)\b/i.test(normalized)) reasons.push('READ_ONLY_REQUIRED');
  var tableMatch = normalized.match(/\bfrom\s+([a-z_][\w.]+)/i);
  var table = tableMatch && tableMatch[1].toLowerCase();
  var allowed = Object.keys(schemaMetadata.domains).map(function (key) { return schemaMetadata.domains[key].table; });
  if (!table || allowed.indexOf(table) === -1) reasons.push('OBJECT_NOT_APPROVED');
  var limitMatch = normalized.match(/\blimit\s+(\d+)/i);
  if (!limitMatch) reasons.push('ROW_LIMIT_REQUIRED');
  if (limitMatch && Number(limitMatch[1]) > MAX_ROW_LIMIT) reasons.push('ROW_LIMIT_EXCEEDED');
  if ((normalized.match(/\bjoin\b/gi) || []).length > 1) reasons.push('JOIN_SCOPE_EXCEEDED');
  if (user.role === 'reporting_analyst' && /\b(approved_amount|customer|vin|email|phone)\b/i.test(normalized)) reasons.push('COLUMN_POLICY_BLOCKED');
  return { allowed: reasons.length === 0, reasons: reasons, table: table };
}

router.use(requireUser);

router.get('/schema-metadata', function (req, res) {
  res.json({ schema: schemaMetadata.schema, domains: Object.keys(schemaMetadata.domains).map(function (key) { return Object.assign({ key: key }, schemaMetadata.domains[key]); }) });
});

router.post('/nl-queries', function (req, res) {
  var prompt = typeof req.body.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt || prompt.length > MAX_PROMPT_LENGTH) return res.status(400).json({ error: 'Enter a question under ' + MAX_PROMPT_LENGTH + ' characters.' });
  var user = req.reportingUser;
  var interpretation = interpret(prompt);
  if (user.role === 'reporting_analyst' && interpretation.sql) {
    interpretation.sql = interpretation.sql.replace(', approved_amount', '');
  }
  var request = { requestId: id('req'), prompt: prompt, userId: user.userId, role: user.role, createdAt: now(), status: interpretation.status, executionStatus: interpretation.status === 'interpreted' ? 'queued' : 'failed', domain: interpretation.domain, domainLabel: interpretation.domainLabel, mappedTable: interpretation.mappedTable, intent: interpretation.intent, sql: interpretation.sql, sqlFingerprint: interpretation.sql ? crypto.createHash('sha256').update(interpretation.sql).digest('hex').slice(0, 16) : null, rowLimit: MAX_ROW_LIMIT };
  if (interpretation.clarification) request.clarification = interpretation.clarification;
  requests.set(request.requestId, request);
  addAudit(request, user, 'interpretation', interpretation.status, { prompt: prompt, intent: interpretation.intent, sqlFingerprint: request.sqlFingerprint });
  return res.status(201).json(request);
});

router.get('/nl-queries/:requestId', function (req, res) {
  var request = requests.get(req.params.requestId);
  if (!request || request.userId !== req.reportingUser.userId) return res.status(404).json({ error: 'Request not found.' });
  res.json(request);
});

router.post('/query-validations', function (req, res) {
  var user = req.reportingUser;
  var request = requests.get(req.body.requestId);
  var validation = validateSql(req.body.sql || (request && request.sql), user);
  var validationId = id('val');
  if (!request) return res.status(404).json({ validationId: validationId, decision: 'blocked', reasonCodes: ['REQUEST_NOT_FOUND'] });
  request.validationId = validationId;
  request.validation = validation;
  request.validationStatus = validation.allowed ? 'validated' : 'blocked';
  if (validation.allowed) request.status = 'validated';
  addAudit(request, user, 'validation', validation.allowed ? 'allowed' : 'blocked', { validationId: validationId, reasonCodes: validation.reasons, referencedObject: validation.table });
  res.status(validation.allowed ? 200 : 422).json({ validationId: validationId, requestId: request.requestId, decision: validation.allowed ? 'allowed' : 'blocked', reasonCodes: validation.reasons, policyVersion: 'demo-2026-09', executionEligible: validation.allowed });
});

router.post('/query-executions', function (req, res) {
  var request = requests.get(req.body.requestId);
  var user = req.reportingUser;
  if (!request || request.userId !== user.userId) return res.status(404).json({ error: 'Request not found.' });
  if (request.validationStatus !== 'validated') return res.status(403).json({ error: 'This request has not passed reporting validation.', requestId: request.requestId });
  request.executionStatus = 'completed';
  request.status = 'completed';
  request.completedAt = now();
  addAudit(request, user, 'execution', 'completed', { sqlFingerprint: request.sqlFingerprint, rowCount: (fixtureRows[request.domain] || []).length });
  res.json(resultFor(request, user, 1, req.body.pageSize, req.body.sort));
});

router.get('/nl-queries/:requestId/status', function (req, res) {
  var request = requests.get(req.params.requestId);
  if (!request || request.userId !== req.reportingUser.userId) return res.status(404).json({ error: 'Request not found.' });
  res.json({ requestId: request.requestId, executionStatus: request.executionStatus, status: request.status, updatedAt: request.completedAt || request.createdAt });
});

router.get('/results/:requestId', function (req, res) {
  var request = requests.get(req.params.requestId);
  if (!request || request.userId !== req.reportingUser.userId) return res.status(404).json({ error: 'Result not found.' });
  if (request.executionStatus !== 'completed') return res.status(409).json({ requestId: request.requestId, executionStatus: request.executionStatus, message: 'Results are not ready.' });
  addAudit(request, req.reportingUser, 'result_view', 'rendered', { displayOutcome: 'masked-or-authorized' });
  res.json(resultFor(request, req.reportingUser, req.query.page, req.query.size, req.query.sort));
});

router.post('/nl-queries/:requestId/refinements', function (req, res) {
  var parent = requests.get(req.params.requestId);
  if (!parent || parent.userId !== req.reportingUser.userId) return res.status(404).json({ error: 'Request not found.' });
  if (typeof req.body.prompt !== 'string' || !req.body.prompt.trim()) return res.status(400).json({ error: 'Enter a refinement question.' });
  var childPrompt = req.body.prompt.trim();
  var interpretation = interpret(childPrompt);
  var child = { requestId: id('req'), parentRequestId: parent.requestId, prompt: childPrompt, userId: parent.userId, role: parent.role, createdAt: now(), status: interpretation.status, executionStatus: 'queued', domain: interpretation.domain, domainLabel: interpretation.domainLabel, mappedTable: interpretation.mappedTable, intent: interpretation.intent, sql: interpretation.sql, sqlFingerprint: interpretation.sql ? crypto.createHash('sha256').update(interpretation.sql).digest('hex').slice(0, 16) : null, rowLimit: MAX_ROW_LIMIT };
  if (interpretation.clarification) child.clarification = interpretation.clarification;
  requests.set(child.requestId, child);
  addAudit(child, req.reportingUser, 'refinement', interpretation.status, { parentRequestId: parent.requestId, prompt: childPrompt });
  res.status(201).json(child);
});

router.get('/audit/:requestId', function (req, res) {
  if (!/audit|manager|admin/i.test(req.reportingUser.role)) return res.status(403).json({ error: 'Audit access is restricted.' });
  res.json({ requestId: req.params.requestId, events: auditEvents.filter(function (event) { return event.requestId === req.params.requestId; }) });
});

router.get('/operations/metrics', function (req, res) {
  if (!/manager|admin/i.test(req.reportingUser.role)) return res.status(403).json({ error: 'Operations metrics access is restricted.' });
  var completed = auditEvents.filter(function (event) { return event.eventType === 'execution' && event.outcome === 'completed'; }).length;
  res.json({ requestCount: requests.size, auditEventCount: auditEvents.length, completedExecutions: completed, responseSlaSeconds: 10, validationSlaSeconds: 2 });
});

module.exports = router;