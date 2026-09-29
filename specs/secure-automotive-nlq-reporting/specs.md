# Feature: LLM Intent Interpretation for Natural-Language Questions; As a Data Governance Administrator, I want LLM-generated reporting queries constrained by approved PostgreSQL rules so that sensitive automotive data is protected during AI-assisted reporting; As an Automotive Reporting Analyst, I want query results returned through an interactive interface with status feedback so that I can review PostgreSQL data efficiently and trust the reporting outcome (+23 more)
Status: NEW
Owner: Astra
Last Updated: 2026-09-23

## Summary
This feature delivers an end-to-end AI-assisted automotive reporting workflow in a monolithic application spanning web UI and API-service behavior. The platform accepts authenticated users’ natural-language reporting questions, uses an LLM to interpret intent, generates candidate PostgreSQL SQL constrained to approved reporting metadata, validates generated SQL against governance and access policies, executes only approved read-only queries, and returns either interactive results or status feedback through the web interface.

The feature solves three connected problems:

1. Reporting users currently need SQL expertise or specialist assistance to query approved automotive reporting data.
2. AI-generated SQL introduces governance, privacy, and safety risks unless constrained to approved PostgreSQL objects, role-based access controls, masking rules, and execution guardrails.
3. Users and compliance stakeholders need explainable results, visible status, and complete prompt-to-result traceability for trust, operations, and audit review.

Expected outcomes are:
- Authorized reporting users can submit non-empty natural-language requests for approved automotive reporting domains without writing SQL.
- The platform generates only governed, read-only PostgreSQL query artifacts or returns clarification/status when intent is ambiguous or unsafe.
- Validation blocks unauthorized, unsafe, or policy-violating SQL before execution.
- Approved requests return interactive results or processing status within required SLA targets under normal conditions.
- The platform captures immutable audit records linking prompt, interpreted intent, generated SQL, validation decision, execution outcome, result access, and timing.

## Scope
### In Scope
- Natural-language query intake for approved automotive reporting domains.
- LLM-based intent interpretation for PostgreSQL reporting use cases.
- Mapping business terms to approved PostgreSQL schema metadata and domain context.
- Candidate SQL generation as read-only PostgreSQL SQL for approved requests.
- Clarification responses when requests are ambiguous, incomplete, unsupported, unsafe, or below confidence threshold.
- Validation of generated SQL against:
  - read-only SELECT-only rules
  - approved schemas, tables, and views
  - role-based access controls
  - row-level and column-level restrictions
  - masking, redaction, and exclusion policies
  - prohibited operations and unsafe patterns
  - join scope, row-limit, page-size, and timeout/resource guardrails
- Controlled PostgreSQL execution only for validated requests.
- Interactive results delivery with status states, tabular output, pagination support, and request/query context.
- User-safe failure, delay, clarification, and denial messaging.
- Result-view security enforcement, including masking/suppression before serialization.
- Immutable audit trail across prompt, interpretation, validation, execution, and result-view lifecycle.
- Operational logging and metrics for latency, outcomes, status transitions, row counts, and failure causes.
- Audit search and retrieval for authorized audit roles.

### Out of Scope
- Direct SQL authoring or editing by end users.
- Write or schema-changing database operations, including INSERT, UPDATE, DELETE, MERGE, DROP, ALTER, TRUNCATE, CREATE, and COPY.
- Dashboard building, dashboard visualization layout, chart configuration, or widget management.
- Scheduled reports, subscriptions, batch delivery, or export formats beyond the interactive results view.
- Multi-turn conversational memory across sessions beyond immediate clarification/refinement response.
- Manual approval workflow for every query execution.
- Enterprise-wide identity lifecycle management or role provisioning outside reporting policy configuration.
- Non-PostgreSQL data sources or cross-database execution/federation.
- Enterprise SIEM replacement.
- Manual editing or correction of audit records.
- Advanced customization and personalization features called out as future work.

## Application Type & Platform Context
- **Application Type:** Mixed web and API-service.
- **Architecture Style:** Monolith.
- **Source Evidence:** The feature is explicitly defined for “web, api-service,” classified as “mixed,” and described as “an AI reporting platform monolith spanning web and API behavior.”
- **Platform Responsibilities in Scope:**
  - Web UI for natural-language input, clarification/status messaging, and interactive results.
  - API-service behavior for interpretation, validation, execution, results retrieval, status retrieval, and audit retrieval.
  - Internal API boundaries remain relevant within the monolith.

## Actors and Permissions
### Actors
1. **Automotive Reporting Analyst / Reporting Analyst**
   - Can submit natural-language reporting questions for approved automotive domains.
   - Can receive interpretation outcome, SQL-backed context, clarification, status, and interactive results for authorized requests.
   - Must not receive direct SQL editing controls, unrestricted database access, or raw database credentials.
   - Can refine a request from the results interface when refinement is supported.

2. **Automotive Operations Manager / Operations Manager / Reporting Operations Manager**
   - Can submit or review approved reporting requests.
   - Can receive interactive results or status updates for authorized requests.
   - Can review operational metrics where exposed by API.

3. **Data Governance Administrator / Data Governance Manager**
   - Maintains or relies on approved PostgreSQL rules, policy metadata, approved domains, protected fields, and role mappings.
   - Requires auditability and governance traceability for validation and retrieval outcomes.

4. **Data Access Administrator / Data Security Administrator / Security Administrator**
   - Relies on validation of generated SQL against role, access, and safety policies.
   - Requires enforcement of masking, redaction, exclusion, and policy-bypass detection before execution.

5. **Compliance Auditor / Compliance Manager**
   - Can search and review audit records if authorized for audit access.
   - Must receive role-restricted audit access.
   - Must not be exposed to restricted underlying values beyond permitted audit metadata.

### Permission and Access Constraints
- Authenticated session is required for submission, execution, results access, and audit access.
- RBAC must be enforced for:
  - allowed reporting domains
  - approved schemas/tables/views
  - row-level and column-level data visibility
  - result access by request/domain/security context
  - audit review access
- Result payloads and UI responses must exclude unauthorized rows, columns, raw restricted values, database credentials, and hidden field metadata.
- Authorization must be enforced server-side; client-side hiding alone is insufficient.
- Access denial responses must be authorization-safe and non-sensitive.

### Open Question
- The source names several related personas with overlapping authority, but it does not define a canonical role model or exact permission matrix per role. A consolidated role-permission mapping is needed before implementation.

## Feature Development Intent
This is feature-development work to build a single consolidated, end-to-end reporting capability across UI and service layers. The required behavior spans multiple lifecycle stages that must function together:

1. Accept a user’s natural-language reporting question.
2. Interpret the question into structured intent mapped to approved automotive reporting metadata.
3. Generate candidate read-only PostgreSQL SQL or return clarification/status when interpretation is not sufficiently clear.
4. Validate generated SQL against governance, privacy, access, and execution-safety rules.
5. Execute only validated queries against approved PostgreSQL sources using controlled read-only access.
6. Return interactive results or status feedback with explainable request/query context.
7. Apply result-time masking/suppression and access checks before any data reaches the client.
8. Persist immutable audit and observability records across the full lifecycle.

The delivered outcome must be a governed, explainable, auditable AI-assisted reporting workflow that reduces dependency on hand-written SQL while protecting sensitive automotive data.

## UI Design & Interaction Contract
### Supported UI Experiences
#### 1. Natural-Language Query Interface
The UI shall allow an authenticated reporting user to enter a natural-language question about approved automotive reporting domains. The interface supports plain-language requests and does not require SQL syntax, table names, or column names.

Supported domains explicitly referenced in source include:
- vehicle
- VIN
- warranty
- dealer inventory
- service history
- customer ownership
- recall
- fleet asset
- workshop
- supplier
- financing
- invoices

#### 2. Interpretation Outcome Display
After submission, the UI shall display one of:
- structured interpretation status/output context
- candidate SQL preview or SQL-backed query context
- clarification message identifying unresolved element(s)
- processing status
- error message

Clarification responses shall identify the missing or unclear element, such as:
- missing dimension
- filter
- entity
- time window
- unsupported topic
- ambiguous automotive term
- unresolved relationship path

#### 3. Interactive Results View
For approved completed requests, the UI shall render results in an interactive tabular view with:
- column headers
- formatted values
- sortable columns where supported
- pagination controls for multi-page datasets
- request-level metadata
- row count or page count when available
- execution state
- query context tied to the executed SQL and source PostgreSQL objects or source dataset/domain

The UI shall preserve request context alongside the displayed results so users understand what the data represents.

#### 4. Status View
The UI shall display execution state as:
- queued
- running
- completed
- failed

The state shall update without requiring the user to resubmit the request. Source allows polling or push updates, but does not mandate one approach.

#### 5. Failure/Delay View
If execution fails, times out, or exceeds the normal response window, the UI shall show:
- a non-technical status or error message
- the request identifier
- no partial or misleading final results presented as complete

#### 6. Refinement from Results Interface
Where a delayed, ambiguous, or oversized request requires user follow-up, the UI shall allow the Reporting Analyst to submit a refined natural-language request from the results interface and preserve traceability to the original request.

### UI Validation Rules
- Prompt input must be non-empty.
- Prompt must be within configured input length limits.
- Frontend validates pagination and page number/page size input formats where user-entered.
- Frontend validates refinement input length and safe character handling where refinement is available.
- Completed-state rendering requires payload presence for required fields identified by source: columns, rows, executionStatus, requestId, and queryContext.

### UI Security and Content Constraints
- UI must not expose:
  - raw database credentials
  - direct SQL editing controls
  - unrestricted database access
  - restricted fields
  - hidden field metadata
  - raw SQL or internal rule details in blocked/error cases where source requires user-safe messaging
- Masked values must be displayed consistently across:
  - initial load
  - pagination
  - sorting
  - filtering
  - manual refresh
for the same requestId and security context.

### Accessibility Expectations
The source does not specify formal accessibility standards or WCAG requirements.

### Open Questions
- Exact screen inventory, page layouts, and navigation transitions are not specified.
- Whether the SQL shown in the UI is full text, a summary, or a reference ID is inconsistent across stories and needs product clarification.
- Whether sorting/filtering are all server-side, all client-side, or mixed is not specified.
- No source-supported copy deck exists for exact user-facing labels or status text.

## API Contract
Only source-supported operations are captured below. Similar endpoints appear across stories; because this is a consolidated feature, these operations represent required API capabilities, though final endpoint normalization remains an open question.

### Natural-Language Query Submission and Retrieval
#### POST
Supported source variants:
- `POST /api/reporting/nl-queries`
- `POST /api/reporting/query`
- `POST /api/reporting/queries`

Required behavior:
- Accept authenticated natural-language request input.
- Validate non-empty prompt and configured input constraints.
- Create a query/request record with a unique identifier (`requestId` and/or `queryId` as named by source).
- Return interpretation status linked to the identifier.
- Return mapped domain metadata plus either:
  - candidate SQL preview/output context, or
  - clarification payload, or
  - processing status response

#### GET
Supported source variants:
- `GET /api/reporting/nl-queries/{queryId}`
- `GET /api/reporting/query/{queryId}`

Required behavior:
- Retrieve the previously created interpretation artifact by identifier.
- Return interpretation status, mapped domain metadata, and SQL preview/output context or clarification outcome.

### Schema Metadata Retrieval
Supported source variants:
- `GET /api/reporting/schema-metadata`

Required behavior:
- Expose approved schema metadata used for downstream mapping and reporting workflows, subject to authorization.

### SQL Validation
Supported source variants:
- `POST /api/reporting/query-validations`
- `POST /api/nl-queries/validate`
- `POST /api/reporting/query/validate`
- `POST /api/reporting/query-requests/validate`
- `POST /api/reporting/query-requests/authorize`

Required behavior:
- Receive generated SQL plus authenticated user context.
- Parse and validate SQL before execution.
- Reject any statement that is not read-only SELECT-based SQL.
- Reject invalid PostgreSQL syntax where specified.
- Reject multi-statement payloads.
- Reject unauthorized schemas, tables, views, columns, joins, predicates, or unsafe patterns.
- Enforce row-limit, timeout, page-size, and safety constraints where applicable.
- Apply or determine required masking/redaction/exclusion policy outcome before eligibility for execution.
- Return governed allow/block outcome with non-sensitive reason code(s).
- Must not call execution API for blocked queries.
- Persist immutable validation audit record.

### SQL Execution
Supported source variants:
- `POST /api/nl-queries/execute`
- `POST /api/reporting/query-executions`
- `POST /api/reporting/query/execute`
- `POST /api/reporting/query-requests/execute`

Required behavior:
- Accept identifier for previously validated SQL/request.
- Reject execution when query/request is not in validated state.
- Reject execution when caller is not authorized for targeted PostgreSQL reporting source.
- Execute only read-only approved SQL using controlled/scoped credentials.
- Apply page size, row limit, timeout threshold, and resource controls before submission to PostgreSQL.
- Return either:
  - first page of formatted results, or
  - status response containing identifier and execution state
within SLA constraints for successful requests under normal operating conditions.

### Results Retrieval
Supported source variants:
- `GET /api/reporting/results/{queryId}`
- `GET /api/nl-queries/{queryId}/results`
- `GET /api/reporting/query-requests/{requestId}/results`
- `GET /api/reporting/query/{queryId}/results`
- `GET /api/results/{requestId}`
- `GET /api/results/{requestId}/pages?page={n}&size={m}`
- `GET /api/results/{requestId}/metadata`

Required behavior:
- Return paginated result data and metadata for authorized, approved requests.
- Enforce result-view authorization and row/column policy before serialization.
- Include traceability metadata linking rows to executed SQL reference and source dataset/domain.
- Exclude suppressed fields and unauthorized metadata from payload.
- Return authorization error when result set or governing security context cannot be resolved.

### Status Retrieval
Supported source variants:
- `GET /api/reporting/status/{queryId}`
- `GET /api/nl-queries/{queryId}/status`
- `GET /api/reporting/query-requests/{requestId}/status`
- `GET /api/results/{requestId}/status`
- `GET /api/reporting/queries/{queryId}/status`

Required behavior:
- Return non-terminal processing state when execution has not yet completed.
- Return identifier-correlated status payload.
- Support repeated retrieval without resubmission.
- Final terminal states include completed, failed, and timed out where referenced.

### Audit APIs
Supported source variants:
- `POST /api/audit/query-events`
- `GET /api/audit/query-events/{eventId}`
- `GET /api/audit/query-events/search`
- `GET /api/audit/query-validations/{validationId}`
- `GET /api/reporting/audit/{requestId}`
- `POST /api/reporting/audit/events`
- `GET /api/audit/query-access/{queryId}`

Required behavior:
- Persist immutable audit entries for lifecycle events.
- Support retrieval by event ID and by search filters such as user, date/time window, and outcome type.
- Restrict access to authorized audit roles.

### Operations / Monitoring APIs
Supported source variants:
- `GET /api/reporting/operations/metrics`
- `GET /api/monitoring/query-metrics`
- `GET /api/reporting/metrics/intent-processing`

Required behavior:
- Expose metrics for success rate, failure causes, SLA attainment, latency, timeout rate, and related operational indicators where provided.

### API Error Behavior
The platform shall return:
- non-success status for invalid request payloads
- clarification/status rather than success when interpretation is ambiguous or below confidence threshold
- blocked/governed response with non-sensitive reason codes for validation denial
- authorization-safe errors for unauthorized execution or results access
- non-technical failure/delay messages with request identifier for execution failures or long-running requests

### API Open Questions
- The canonical endpoint set is not consistent across stories and requires consolidation.
- The source uses both `requestId` and `queryId`; identifier strategy must be normalized.
- Exact request/response schemas, HTTP status codes, and pagination metadata shape are not fully specified.
- Idempotency requirements for submission, execution, refinement, and audit-write operations are not specified.
- Whether validation rewrites SQL or stores masking policy separately is not fully defined.

## Business Logic & Rules
1. Natural-language submission requires authenticated user context.
2. Submission must create a request/query record linked to a unique identifier.
3. The system shall interpret natural-language questions only against approved automotive reporting domains and approved PostgreSQL schema metadata.
4. The user is not required to provide SQL syntax, table names, or column names.
5. For a clear supported question, the platform shall produce structured intent containing:
   - identified subject area
   - at least one requested metric, filter, grouping, or time element
6. The system shall map recognized business terms to approved PostgreSQL schema context; it shall not use free-form database discovery.
7. If a request is ambiguous, incomplete, unsupported, lacks sufficient relationship path, lacks required time/filter context, or falls below confidence threshold, the system shall return clarification or processing status instead of finalizing successful interpretation.
8. Generated database-interaction language shall be SQL for PostgreSQL.
9. Generated SQL shall be syntactically valid PostgreSQL where source explicitly requires it.
10. Generated SQL shall be limited to read-only SELECT-based patterns.
11. The system shall reject:
    - INSERT
    - UPDATE
    - DELETE
    - MERGE
    - DROP
    - ALTER
    - TRUNCATE
    - CREATE
    - COPY
    - multi-statement payloads
12. SQL shall reference only approved PostgreSQL schemas, tables, and views allowed for the requester’s role.
13. SQL shall be blocked if it references unauthorized objects or restricted columns.
14. Validation shall inspect SQL structure and not rely only on string matching where source specifies parsing/AST-based validation.
15. Validation shall detect unsafe patterns, including policy-bypass attempts, comments/stacked-statement bypass behavior, disallowed joins, prohibited functions if configured, wildcard overreach on restricted objects, and prohibited predicates where specified.
16. Validation shall enforce row-level and column-level restrictions by role.
17. For protected fields, the system shall apply configured masking, redaction, or exclusion rules before execution eligibility or before result serialization, depending on policy stage.
18. If the role lacks access to a protected field, unrestricted raw field access shall be denied.
19. Validation shall block queries that exceed configured safety controls, including:
    - missing required row limits
    - excessive row limits
    - disallowed join scope
    - estimated timeout risk
    - resource-governance threshold violations
20. Blocked validation shall not trigger PostgreSQL execution.
21. Every executed query must have a recorded successful validation event before execution.
22. Execution is permitted only for validated and authorized requests.
23. Execution shall use read-only, controlled, scoped database access and shall not expose credentials.
24. Execution shall enforce:
    - page size bounds
    - maximum row limits
    - timeout thresholds
    - concurrency/resource controls where configured
25. If execution completes within the interactive threshold, the system shall return results.
26. If execution does not complete within the interactive threshold but remains valid/running, the system shall return a processing status response rather than leaving the request without feedback.
27. Result views shall show execution state as queued, running, completed, or failed.
28. Completed results shall include query context linking output to executed SQL reference and source schema/table/view or dataset/domain.
29. Partial or incomplete outputs shall not be presented as completed final results.
30. Result access shall reapply masking/suppression and authorization consistently across initial load, pagination, sorting, filtering, and refresh for the same request/security context.
31. Result access shall be denied if the user lacks permission or if governing security context cannot be resolved.
32. The system shall preserve traceability between original request and refined request when refinement is submitted from the results interface.
33. The platform shall capture immutable, linked audit evidence across prompt, interpretation, SQL generation, validation, execution, result delivery/access, timing, and outcome.

## Data Model & Validation
Only source-supported entities and fields are included.

### Core Entities
#### 1. Query / Request Record
Fields explicitly supported across source:
- requestId and/or queryId
- original natural-language text / prompt
- interpreted request status / interpretation status
- interpreted intent summary
- mapped domain metadata / mapped schema context
- generated SQL or SQL preview / SQL reference / SQL hash / SQL fingerprint
- requesting user identity
- requester role
- status / executionStatus
- timing / timestamps
- source dataset/domain identifiers where applicable

Validation:
- prompt/requestText must be non-empty
- prompt must be within configured input length limits
- prompt must meet supported input format rules
- malformed payloads and disallowed control characters must be rejected where configured

#### 2. Structured Intent
Fields explicitly supported:
- subject area
- metric
- filter
- grouping
- time element
- mapped domains/entities
- confidence outcome
- clarification reason

Validation:
- must include identified subject area and at least one requested metric, filter, grouping, or time element for clear interpretations
- if unresolved/ambiguous, clarification payload replaces successful interpretation

#### 3. Validation Record
Fields explicitly supported:
- validationId or queryId linkage
- requester identity
- requester role
- referenced objects
- SQL text or SQL hash/fingerprint
- policy version
- validation outcome / decision outcome
- policy reason code / blocking reason(s)
- policy checks evaluated
- timestamp
- downstream approval flag where applicable

Validation:
- immutable
- created for each validation attempt
- recorded before execution decision is finalized

#### 4. Execution Record
Fields explicitly supported:
- requestId/queryId
- validation reference
- execution state
- execution start/end timestamps
- execution duration / latency
- rows returned / row count
- timeout outcome / failure code
- data source identifier / source reference
- outcome code

Validation:
- execution allowed only when validatedSql=true / validated state equivalent
- requested page size must be within configured maximum
- requested row limit must not exceed service ceiling

#### 5. Result Payload
Fields explicitly supported:
- requestId
- executionStatus
- columns
- rows
- queryContext
- page metadata / page number / page size
- total rows when available
- row count
- source-aligned columns
- dataset/source lineage metadata
- execution timestamp where included

Validation:
- completed-state payload must include columns, rows, executionStatus, requestId, and queryContext before UI renders completed state
- rows and columns must already reflect row/column policy enforcement before serialization

#### 6. Audit Record / Query Event
Fields explicitly supported:
- eventId where applicable
- requestId/queryId
- prompt or prompt hash/reference
- interpreted intent
- generated SQL or SQL hash/reference
- validation decision
- execution outcome
- user identity / actor
- requester role / resolved role
- timestamp
- accessed data domain / source channel / source reference
- policy identifiers applied
- display outcome / rendered / partially masked / denied
- timing / latency data
- result metadata where permitted

Validation:
- immutable / append-only / tamper-evident per source expectations
- role-restricted access
- required audit fields must be present
- restricted payload values must not be exposed to unauthorized audit viewers

### Reference Data / Policy Data
Source-supported policy inputs:
- approved PostgreSQL schemas, tables, views
- role-policy mappings
- data-classification metadata
- approved entity dictionaries
- approved domain mappings
- allowlists for schema objects
- masking/redaction/exclusion policy metadata
- row-level and column-level policy definitions
- timeout, row-limit, page-size, and execution safety thresholds

### Retention Expectations
The source requires immutable audit storage and retention aligned to internal compliance/privacy obligations, but does not specify exact retention durations.

### Open Questions
- Canonical entity names and whether `requestId` and `queryId` are separate records or aliases.
- Exact payload schemas for interpretation, validation, status, results, audit search, and metrics.
- Exact shape of queryContext, lineage metadata, and policy identifiers.
- Exact configuration fields for confidence threshold, row limits, timeout limits, and join-scope policy.

## Functional Requirements
### Natural-Language Intake and Interpretation
FR-1. The platform shall require an authenticated session to submit a natural-language reporting request.

FR-2. The platform shall accept a non-empty natural-language question for approved automotive reporting domains and create a request record linked to a unique identifier.

FR-3. The platform shall return an interpretation response linked to the created identifier.

FR-4. For a clear supported question, the platform shall produce structured intent data that includes the identified subject area and at least one requested metric, filter, grouping, or time element.

FR-5. The platform shall map recognized business terms from the user question to approved PostgreSQL schema context used for downstream processing.

FR-6. The platform shall not require the user to supply SQL syntax, table names, or column names.

FR-7. The platform shall generate SQL as the query language for approved PostgreSQL reporting requests.

FR-8. The platform shall return either candidate SQL preview/output context, a clarification payload, or a processing status response for submitted requests.

FR-9. If the request is ambiguous, incomplete, unsupported, below the confidence threshold, or lacks sufficient relationship/filter/time context, the platform shall return a clarification or processing status message identifying the unresolved element instead of finalizing SQL.

FR-10. If the request payload is invalid, exceeds configured input limits, or the interpretation service fails, the platform shall return a non-success error response, preserve the user session, and record failure details for operational tracing.

FR-11. Under normal operating conditions, the interpretation service shall return a candidate SQL preview, generated output context, clarification outcome, or processing status within 5 seconds for approved requests where specifically required by source, and within 10 seconds where broader submission stories define that threshold.

### SQL Generation and Governance
FR-12. The platform shall generate only read-only PostgreSQL SQL for approved requests by default.

FR-13. Generated SQL shall be syntactically valid PostgreSQL for requests that resolve successfully to candidate SQL.

FR-14. Generated SQL shall use only approved PostgreSQL schemas, tables, or views from the approved metadata catalog.

FR-15. The platform shall not generate candidate executable SQL for ambiguous or unsupported requests.

FR-16. The platform shall preserve traceability between the original prompt, interpreted intent, mapped schema context, and generated SQL or clarification outcome.

### SQL Validation
FR-17. The platform shall validate each generated SQL statement before execution is permitted.

FR-18. The validation service shall reject any statement that is not read-only SELECT-based SQL.

FR-19. The validation service shall reject invalid PostgreSQL syntax where provided to the validation endpoint.

FR-20. The validation service shall reject INSERT, UPDATE, DELETE, MERGE, ALTER, DROP, CREATE, TRUNCATE, COPY, and multi-statement payloads.

FR-21. The validation service shall allow access only to schemas, tables, and views mapped to the authenticated user’s reporting role.

FR-22. The validation service shall block execution when SQL references an unapproved or unauthorized object.

FR-23. The validation service shall inspect referenced columns and enforce role-based row-level and column-level restrictions.

FR-24. If SQL references protected customer, vehicle, financing, warranty, dealer, registration, supplier, or related classified fields, the platform shall apply configured masking, redaction, or exclusion rules or block validation when the requester lacks required access.

FR-25. The validation service shall reject SQL containing unsafe patterns or policy-bypass attempts, including unauthorized joins, disallowed predicates, wildcard overreach on restricted objects, comments/stacked-statement bypass, and other prohibited constructs identified by policy.

FR-26. The validation service shall enforce configured safety controls including required row limits, maximum row limits, join-scope restrictions, timeout risk thresholds, and other execution-safety thresholds.

FR-27. When validation fails, the platform shall return a governed response with non-sensitive reason code(s) and shall not call the execution endpoint.

FR-28. Each validation attempt shall create an immutable validation audit record containing the required traceability fields supported by source.

### Execution
FR-29. The platform shall execute SQL only when the request/query is in a validated state.

FR-30. If execution is requested for a non-validated query/request, the platform shall reject execution with an authorization-safe or validation-safe error response and shall not submit SQL to PostgreSQL.

FR-31. The execution service shall verify the caller is authorized for the targeted PostgreSQL reporting source before execution.

FR-32. The execution service shall use read-only, scoped, controlled database access and shall not expose database connection details in API or UI responses.

FR-33. The execution service shall enforce configured page size, maximum row limit, execution timeout, and resource controls on every approved request.

FR-34. For at least 95% of successful requests under normal operating conditions, the system shall return either a processing status update or final results within 10 seconds of submission/execution, as applicable to the request stage.

FR-35. If execution completes within the interactive threshold, the platform shall return the first page of formatted results or make the completed result payload available for retrieval.

FR-36. If execution exceeds the interactive threshold but remains in progress, the platform shall return a status response containing the request/query identifier and current execution state.

FR-37. The platform shall support status retrieval without requiring request resubmission.

### Results and Interactive Interface
FR-38. The platform shall render approved result sets in an interactive view with column headers, formatted values, and pagination for multi-page results.

FR-39. The results interface shall display execution state as queued, running, completed, or failed.

FR-40. The results interface shall update the visible state without requiring the user to resubmit the request.

FR-41. Completed results shall include query context linking the displayed output to the executed SQL reference and source PostgreSQL objects or source data domain.

FR-42. The interactive results view shall preserve original request context alongside displayed results.

FR-43. The platform shall support sortable tabular output where source explicitly requires sortable results.

FR-44. The platform shall enforce row limits and responsive rendering behavior so large result sets remain usable without exceeding performance thresholds.

FR-45. If execution fails or exceeds the normal response window, the interface shall show a non-technical status or error message with the request identifier and shall not present partial or misleading final output as complete.

FR-46. The platform shall support request refinement from the results interface for delayed, ambiguous, timed-out, or oversized requests and shall preserve traceability between original and refined requests.

### Result Security and Masking
FR-47. Before serializing or rendering results, the platform shall resolve the authenticated user’s reporting role and applicable row-level and column-level policies.

FR-48. Result responses and the interactive grid shall include only rows and columns permitted by the user’s resolved role.

FR-49. Restricted fields shall be omitted before payload serialization when policy requires suppression.

FR-50. For maskable fields, the platform shall display the approved masked representation consistently across initial load, pagination, sorting, filtering, and manual refresh for the same request/security context.

FR-51. If the user lacks permission to view the result set or its governing security context cannot be resolved, the platform shall deny access and shall not return raw result data or hidden field metadata.

FR-52. Each result-view interaction shall record an immutable audit event containing request identifier, user identity, resolved role, applied policy identifiers, timestamp, and display outcome.

### Audit and Observability
FR-53. The platform shall record an immutable audit trail for each natural-language PostgreSQL reporting interaction, including prompt, interpreted intent, generated SQL or SQL reference, validation decision, execution outcome, user identity, timestamp, and accessed data domain/source reference.

FR-54. Audit records shall preserve prompt-to-intent-to-SQL-to-result lineage by a linked request/query identifier.

FR-55. The platform shall restrict audit search and retrieval to authorized audit roles.

FR-56. The platform shall support audit search by user, time window, and outcome type.

FR-57. The platform shall log status transitions, execution duration, row count, failure codes, and related timing data for operational monitoring and troubleshooting.

FR-58. The platform shall capture latency and outcome events sufficient to verify 10-second response-or-status SLA attainment for successful requests.

## Non-Functional Requirements
### Performance
NFR-1. For at least 95% of successful requests under normal operating conditions, the system shall return either final results or a processing/status response within 10 seconds.

NFR-2. For approved interpretation requests, the interpretation service shall return candidate SQL preview, output context, clarification, or processing status within 5 seconds where specifically required by source story US 3406.

NFR-3. Validation should complete within 2 seconds for standard queries under normal operating conditions where specified by source story US 3448.

NFR-4. Page navigation responses for cached result pages should complete within 2 seconds under normal load where specified by source story US 3498.

NFR-5. Audit search should return standard filtered results within 3 seconds for authorized reviewers where specified by source story US 3460.

NFR-6. Validation and security enforcement shall not materially prevent the platform from meeting the 10-second user-facing response-or-status SLA.

### Reliability and Resilience
NFR-7. The platform shall degrade gracefully by returning processing status when interpretation or execution cannot complete within the immediate interactive window.

NFR-8. The platform shall avoid excessive backend calls when updating status; polling or push updates are both permitted by source, provided they avoid excessive backend load.

NFR-9. The platform shall preserve request state for later retrieval by identifier when execution remains valid and running after the interactive threshold.

### Security
NFR-10. All user-facing and API access shall require authenticated access.

NFR-11. The platform shall enforce RBAC across submission, validation, execution, results access, and audit access.

NFR-12. The platform shall use least-privilege/read-only/scoped database access for PostgreSQL execution.

NFR-13. The platform shall sanitize prompt and SQL inputs and defend against prompt injection, SQL injection, policy bypass via comments or stacked statements, and unsafe SQL patterns identified by policy.

NFR-14. The platform shall use encrypted transport for API and database communications where specified.

NFR-15. Audit storage shall be immutable/tamper-evident per source expectations.

NFR-16. The platform shall not expose raw restricted values, raw database credentials, unrestricted database access, or unauthorized hidden metadata in API or UI responses.

### Compliance and Governance
NFR-17. The feature shall support GDPR, CCPA, and internal data-governance traceability requirements as explicitly cited in source.

NFR-18. Where cited in source, auditability and controls shall support compliance review expectations referencing SOC 2 and ISO 27001; exact control mappings are not specified in source.

NFR-19. Sensitive customer, vehicle, financing, warranty, dealer, registration, supplier, and OEM-related data shall be masked, redacted, excluded, or denied according to role and policy.

### Observability
NFR-20. The platform shall emit structured logs/metrics for request identifiers, user/role context where permitted, mapped domains, validation outcomes, reason codes, execution states, latency, row counts, and failure causes.

NFR-21. Observability and audit capture shall support troubleshooting, SLA monitoring, compliance review, and lifecycle explainability.

## Acceptance Scenarios
### Scenario 1: Successful natural-language interpretation and candidate SQL generation
**Given** an authenticated Reporting Analyst  
**And** the analyst submits a non-empty natural-language question about an approved automotive reporting domain  
**When** the platform processes the request  
**Then** the platform creates a request record with a unique identifier  
**And** returns interpretation status linked to that identifier  
**And** returns structured intent mapped to approved PostgreSQL schema context  
**And** returns candidate read-only PostgreSQL SQL preview or equivalent output context  
**And** does not require the analyst to provide SQL syntax, table names, or column names

### Scenario 2: Ambiguous natural-language request requires clarification
**Given** an authenticated Reporting Analyst  
**And** the submitted request contains ambiguous automotive terms or lacks a required metric, dimension, filter, entity, relationship path, or time element  
**When** the platform attempts interpretation  
**Then** the platform does not finalize SQL  
**And** returns a clarification response identifying the unresolved element  
**And** preserves traceability for the request

### Scenario 3: Invalid submission payload is rejected
**Given** an authenticated user  
**When** the user submits an invalid request payload, an empty prompt, malformed input, or input exceeding configured limits  
**Then** the platform returns a non-success response  
**And** preserves the user session  
**And** records failure details for operational tracing

### Scenario 4: Validation blocks non-read-only SQL
**Given** generated SQL has been submitted for validation  
**When** the SQL contains INSERT, UPDATE, DELETE, ALTER, DROP, CREATE, COPY, TRUNCATE, MERGE, or multiple statements  
**Then** the validation service rejects the SQL  
**And** returns a governed blocked outcome with a non-sensitive reason code  
**And** does not call the execution endpoint  
**And** writes an immutable validation audit record

### Scenario 5: Validation blocks unauthorized schema/object access
**Given** generated SQL references PostgreSQL objects  
**And** the requester’s role is resolved  
**When** the SQL references a schema, table, or view not approved for that role  
**Then** the validation service blocks execution eligibility  
**And** returns a governed response  
**And** records the referenced objects, decision outcome, reason code, and timestamp in immutable audit storage

### Scenario 6: Validation applies masking or exclusion for protected fields
**Given** generated SQL references protected customer, vehicle, financing, warranty, dealer, registration, supplier, or OEM-sensitive fields  
**When** the request is evaluated against role and classification policy  
**Then** the platform applies configured masking, redaction, or exclusion handling when permitted  
**Or** blocks the request when the role lacks access  
**And** records the policy decision in the validation audit trail

### Scenario 7: Execution request for non-validated query is rejected
**Given** a client calls the execution API with a query/request identifier  
**When** the referenced query/request is not in a validated state  
**Then** the platform rejects execution with an authorization-safe or validation-safe error response  
**And** does not submit SQL to PostgreSQL

### Scenario 8: Approved query completes within interactive threshold
**Given** a validated and authorized reporting query  
**When** execution completes within the interactive threshold  
**Then** the platform returns the first page of results or makes the completed result available for retrieval  
**And** the response includes request/query identifier, execution state, result rows, columns, and query context  
**And** the results are limited to authorized rows and columns  
**And** the platform records execution and delivery audit events

### Scenario 9: Approved query exceeds interactive threshold
**Given** a validated and authorized reporting query  
**When** execution does not complete within the interactive threshold but remains in progress  
**Then** the platform returns a processing status message within 10 seconds  
**And** includes the request/query identifier and current execution state  
**And** allows the client to poll status without resubmitting the request

### Scenario 10: Interactive results view renders governed data
**Given** a completed approved request  
**And** the authenticated user is authorized to view the result set  
**When** the user opens the results view  
**Then** the platform returns only permitted rows and columns  
**And** suppresses prohibited fields before serialization  
**And** displays masked values consistently where masking is allowed  
**And** shows original request context plus query/source lineage metadata  
**And** renders an interactive grid with column headers, formatted values, and pagination

### Scenario 11: Result access is denied when security context cannot be resolved
**Given** a user requests a completed result set  
**When** the user lacks permission to the result or the governing security context cannot be resolved  
**Then** the platform denies access with an authorization error  
**And** does not return raw result rows, hidden field metadata, or restricted values  
**And** records a denied result-view audit event

### Scenario 12: Execution failure returns safe UI feedback
**Given** a reporting request has failed during execution or exceeded the normal response window  
**When** the user opens or submits the request in the interactive workflow  
**Then** the interface shows a non-technical failure or status message  
**And** includes the request identifier  
**And** does not display partial output as completed final results

### Scenario 13: Refinement from results interface preserves traceability
**Given** a Reporting Analyst is viewing a delayed, ambiguous, timed-out, or oversized request outcome  
**When** the analyst submits a refined request from the results interface  
**Then** the platform creates a new governed request flow  
**And** links the refined request to the original request in traceability and audit records

### Scenario 14: Audit reviewer searches prompt-to-result lifecycle
**Given** an authenticated user with authorized audit role  
**When** the user searches audit records by user, time window, or outcome type  
**Then** the platform returns linked lifecycle records containing prompt, interpreted intent, generated SQL or reference, validation decision, execution outcome, actor, timestamp, and reporting context  
**And** applies role-restricted access to audit content

## Traceability Matrix
| Source ID | Requirement | Acceptance Criteria | Test Coverage |
|---|---|---|---|
| US 3406 | FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-8, FR-9, FR-10, FR-11 | Authenticated analyst can submit non-empty NL question; system creates request ID; returns structured intent; maps business terms to approved schema context; returns clarification for ambiguous/low-confidence requests; invalid payloads return non-success and are traced; response within 5 seconds under normal conditions | API tests for submission/validation; interpretation contract tests; ambiguity handling tests; latency monitoring tests |
| US 3442 | FR-7, FR-12, FR-15, FR-16 | System converts NL request to candidate read-only PostgreSQL SQL; returns clarification instead of executable query when ambiguous; records prompt, intent, query context | API tests for SQL generation; traceability persistence tests; clarification path tests |
| US 3463 | FR-2, FR-13, FR-14, FR-16 | Authenticated analyst gets requestId and interpreted status; confidently mapped request generates syntactically valid read-only SQL using approved schema objects; ambiguous/unsupported requests return clarification; traceability is stored and exposed; response or status within 10 seconds | End-to-end interpretation tests; SQL syntax validation tests; metadata mapping tests; traceability retrieval tests |
| US 3484 | FR-7, FR-12, FR-15 | SQL is generated as consistent query language; limited to read-only by default; clarification/status returned instead of executing unsafe or ambiguous SQL | SQL generation behavior tests; prohibited-operation tests |
| US 3422 | FR-17, FR-18, FR-21, FR-23, FR-24, FR-53 | Query generation constrained to approved PostgreSQL objects and read-only operations; RBAC and masking/redaction/exclusion enforced; audit records prompt, intent, SQL, access decision, and execution outcome | Validation policy tests; masking tests; audit completeness tests |
| US 3434 | FR-18, FR-20, FR-21, FR-22, FR-24, FR-26, FR-27, FR-28 | Validation endpoint rejects non-SELECT SQL and multi-statement payloads; only approved objects by role allowed; masking/exclusion policy applied; row-limit/join/timeout risks blocked; immutable audit record created | Validation API tests; AST/policy parsing tests; safety-control tests; immutable audit tests |
| US 3448 | FR-17, FR-23, FR-24, FR-25, FR-26, FR-27 | Each generated SQL statement validated against role/data policies before execution; sensitive fields masked/redacted/excluded; unsafe patterns blocked and denial recorded | Security validation tests; prompt/SQL bypass tests; denial-reason tests |
| US 3472 | FR-17, FR-23, FR-24, FR-25, FR-27 | Generated SQL validated against approved schemas, read-only rules, unsafe patterns, and role restrictions before execution; unauthorized or non-compliant SQL blocked and logged | Validation and authorization tests; audit rejection tests |
| US 3487 | FR-19, FR-22, FR-24, FR-25, FR-28 | Invalid PostgreSQL syntax blocked; unauthorized objects/columns blocked; prohibited join patterns blocked with rule code; validation audit record retrievable by validationId | Syntax validation tests; restricted-column tests; rule-code response tests; audit retrieval tests |
| US 3525 | FR-18, FR-21, FR-24, FR-25, FR-26, FR-28 | Read-only parsed statement plus role allowlist required; protected columns rewritten or blocked; disallowed operations/wildcard/joins/predicates blocked; row-limit and timeout controls enforced; immutable validation audit entry written | Validation workflow tests; masking rewrite tests; safety threshold tests; audit field tests |
| US 3451 | FR-29, FR-30, FR-33, FR-34, FR-35, FR-36, FR-37, FR-41 | Execution endpoint rejects non-validated queryId; validated queries return first page of results or status within 10 seconds for 95% of successful requests; row/page/timeout rules enforced; traceability metadata included; status endpoint supports polling | Execution API tests; SLA tests; pagination/timeout tests; status polling tests |
| US 3475 | FR-29, FR-31, FR-33, FR-35, FR-36, FR-57, FR-58 | Execute rejects unvalidated or unauthorized source access; controls page size/max rows/timeout; results endpoint returns correlated result payload; status endpoint returns processing state; audit/observability records emitted | Execution authorization tests; result/status retrieval tests; observability event tests |
| US 3495 | FR-29, FR-33, FR-34, FR-41, FR-53, FR-57 | Only validated SQL executed; pagination/row-limit/timeout/resource controls applied; full prompt-to-SQL-to-result lifecycle logged | Controlled execution tests; lifecycle audit tests; database protection tests |
| US 3536 | FR-29, FR-32, FR-33, FR-35, FR-36 | Authenticated Reporting Analyst executes approved read-only query and gets query identifier; completed queries return paginated results; long-running queries return processing status; non-approved schemas/non-read-only statements rejected; limits/timeouts enforced | PostgreSQL execution tests; approved-schema tests; pagination/status tests |
| US 3544 | FR-21, FR-24, FR-33, FR-35, FR-53 | Retrieval uses only approved PostgreSQL schemas/tables/views; restricted columns masked/excluded; blocked operations rejected; results endpoint returns paginated data with queryId; retrieval request records audit event | Retrieval governance tests; field masking tests; audit event tests |
| US 3425 | FR-34, FR-38, FR-39, FR-40, FR-41, FR-45 | Approved request retrieves PostgreSQL data in interactive results view; status/result within 10 seconds for 95% of successful requests; UI displays queued/running/completed/failed without resubmission; completed results include query context; failures show non-technical message and request ID | UI results tests; status refresh tests; SLA tests; failure-state tests |
| US 3445 | FR-34, FR-38, FR-41, FR-53, FR-57 | System returns interactive results or processing status within 10 seconds; presents pagination/controlled row limits and visible executed SQL linkage; logs prompt, SQL, execution outcome, timing, and access events | UI pagination tests; explainability metadata tests; audit/monitoring tests |
| US 3498 | FR-38, FR-42, FR-44 | Interactive grid shows column headers, formatted values, pagination controls; original request context shown with results; configured row limits and responsive rendering enforced | UI rendering tests; context display tests; performance tests for paged grids |
| US 3501 | FR-47, FR-48, FR-49, FR-50, FR-51, FR-52 | Results and grid include only permitted rows/columns; suppressed columns omitted before serialization; masked values consistent across interactions; unauthorized or unresolved security context denied; result-view audit event written | Result authorization tests; payload inspection tests; masking consistency tests; audit view-event tests |
| US 3510 | FR-45, FR-46 | System shows processing status for delayed/timed-out/in-progress requests; presents clarification/failure for ambiguous/unsafe/oversized requests; allows refined request linked to original | Results-state tests; refinement linkage tests |
| US 3513 | FR-34, FR-38, FR-41, FR-45, FR-53 | Successful approved query returns interactive result within 10 seconds for 95% normal-load requests; validation and masking enforced before display; result view includes tabular UI plus lineage metadata; blocked cases return user-safe error; audit trail recorded | End-to-end result delivery tests; display-governance tests; audit completeness tests |
| US 3522 | FR-34, FR-36, FR-57 | Processing status message returned within 10 seconds when results not yet ready; status does not expose restricted SQL/internal logic/data; request/status/timing/context logged | Status response tests; safe messaging tests; operational logging tests |
| US 3460 | FR-53, FR-55, FR-56 | Immutable audit trail includes prompt, generated SQL, validation decision, execution outcome, identity, timestamp, and data domain; only authorized audit roles can search/review; evidence preserved for compliance review | Audit lifecycle tests; audit RBAC tests; search tests |
| US 3533 | FR-53, FR-54, FR-55, FR-58 | System logs each request from prompt through outcome in linked immutable record; audit access is role-restricted; latency and outcome events support SLA verification | Linked-lifecycle audit tests; restricted audit access tests; metrics correlation tests |
| US 3553 | FR-34, FR-33, FR-53, FR-57 | Immutable audit trail recorded for each PostgreSQL retrieval request; results or status returned within 10 seconds for 95% of successful requests; pagination/row limits/timeouts enforced and failures captured | Retrieval audit tests; SLA tests; policy-breach capture tests |

## Open Questions
1. **Canonical API surface:** Multiple endpoint variants are present for similar capabilities. Which final endpoint paths are authoritative for submission, validation, execution, results, status, audit, and metrics?
2. **Identifier model:** Are `requestId` and `queryId` distinct entities, aliases for the same entity, or parent/child identifiers across interpretation and execution stages?
3. **Role model:** What is the final consolidated RBAC matrix across Reporting Analyst, Automotive Reporting Analyst, Operations Manager, Reporting Operations Manager, Data Governance Administrator/Manager, Data Access Administrator, Data Security Administrator, Security Administrator, Compliance Auditor, and Compliance Manager?
4. **SQL exposure in UI:** Should completed results display full executed SQL text, a summarized SQL explanation, or only a SQL reference identifier?
5. **Query context contract:** What exact fields constitute `queryContext` and dataset lineage metadata?
6. **Validation output contract:** What exact response schema should represent allow/block outcomes, masking requirements, approval token/state, and reason codes?
7. **Execution state model:** Source consistently references queued, running, completed, and failed, and also mentions timed out. Is timed out a separate terminal state in the public contract?
8. **Interpretation confidence threshold:** What numeric or configured threshold determines whether clarification is returned?
9. **Input limits:** What are the configured maximum prompt length, supported languages/input formats, and disallowed control-character rules?
10. **Pagination defaults and maxima:** What are the default page size, maximum page size, maximum row cap, and total-row disclosure rules?
11. **Allowed sorting/filtering fields:** Which result columns may be sorted or filtered by API/UI, and must sorting/filtering be re-authorized on every request?
12. **SQL rewrite behavior:** When masking/exclusion is required, does validation rewrite SQL, annotate the execution plan, or apply suppression only at result serialization?
13. **Estimated timeout/cardinality risk:** What mechanism and thresholds determine “estimated execution timeout risk” and excessive cardinality?
14. **Audit retention:** What retention duration applies to prompts, SQL artifacts, validation records, execution logs, and result-view events?
15. **Audit content restrictions:** Which audit roles may view raw prompt text and SQL text versus hashes/references only?
16. **Result persistence model:** Are result sets stored, cached, or always re-fetched from execution artifacts for pagination and refresh?
17. **Status update mechanism:** Will the web UI use polling, server push, or a hybrid model for status refresh?
18. **Refinement contract:** What API and data shape are authoritative for linking refined requests to original requests?
19. **Operational metrics authorization:** Which roles may access metrics endpoints?
20. **Compliance references:** GDPR and CCPA are explicit; SOC 2 and ISO 27001 are mentioned in some stories. Are those formal feature requirements or informational context only for implementation controls?

## Source References
### Feature
- Feature ID 2072057114
- Feature Reference 2072057114
- Feature Title: LLM Intent Interpretation for Natural-Language Questions; As a Data Governance Administrator, I want LLM-generated reporting queries constrained by approved PostgreSQL rules so that sensitive automotive data is protected during AI-assisted reporting; As an Automotive Reporting Analyst, I want query results returned through an interactive interface with status feedback so that I can review PostgreSQL data efficiently and trust the reporting outcome (+23 more)

### User Stories
- US 3385 — LLM Intent Interpretation for Natural-Language Questions
- US 3406 — As an Automotive Reporting Analyst, I want to ask natural-language questions about PostgreSQL reporting data so that I can obtain business insights without writing SQL
- US 3422 — As a Data Governance Administrator, I want LLM-generated reporting queries constrained by approved PostgreSQL rules so that sensitive automotive data is protected during AI-assisted reporting
- US 3425 — As an Automotive Reporting Analyst, I want query results returned through an interactive interface with status feedback so that I can review PostgreSQL data efficiently and trust the reporting outcome
- US 3434 — As a Data Governance Manager, I want AI-generated PostgreSQL queries validated against access and compliance rules so that automotive reporting data remains secure and governed
- US 3442 — As a Reporting Analyst, I want to ask for automotive business data in natural language so that I can obtain insights without writing PostgreSQL queries
- US 3445 — As an Operations Manager, I want interactive reporting results and status visibility so that I can obtain automotive business insights efficiently and trust the reporting outcome
- US 3448 — As a Data Access Administrator, I want natural-language queries validated against role and data policies so that sensitive automotive data is not exposed through generated SQL
- US 3451 — As an Automotive Operations Manager, I want validated natural-language queries to return interactive PostgreSQL results or status updates so that I can act on reporting requests quickly
- US 3460 — As a Compliance Auditor, I want a complete audit trail for natural-language PostgreSQL interactions so that automotive reporting access can be reviewed and explained
- US 3463 — As a Reporting Analyst, I want to submit natural-language requests for vehicle, warranty, service history, and dealer reporting so that I can obtain SQL-backed insights without writing SQL manually
- US 3472 — As a Security Administrator, I want generated SQL for customer, vehicle, warranty, and supplier reporting to be validated against access and compliance policies so that unauthorized or unsafe queries are blocked before execution
- US 3475 — As a Reporting Operations Manager, I want validated SQL requests to execute with status messaging, resource controls, and full audit logging so that automotive reporting remains reliable, traceable, and within service expectations
- US 3484 — As a Reporting Analyst, I want the platform to generate SQL for approved reporting requests so that PostgreSQL database interaction uses a consistent query language
- US 3487 — As a Data Security Administrator, I want generated SQL validated against access and compliance rules so that automotive reporting data is protected before database interaction occurs
- US 3495 — As an Operations Manager, I want approved SQL execution to be traceable and performance-controlled so that reporting workflows remain auditable and responsive
- US 3498 — As a Reporting Analyst, I want to view retrieved automotive reporting data in an interactive grid so that I can review results without leaving the reporting platform
- US 3501 — As a Compliance Manager, I want sensitive automotive reporting results to be masked by role in the interactive interface so that customer, vehicle, and financial data stays protected
- US 3510 — As a Reporting Analyst, I want the results interface to show processing status and support query refinement so that I can continue analysis when retrieved data is delayed or ambiguous
- US 3513 — As a Reporting Analyst, I want to receive interactive results for an approved natural-language query so that I can analyze automotive reporting data without waiting on manual report creation
- US 3522 — As a Reporting Analyst, I want to receive a processing status message when my natural-language query takes longer to complete so that I know the automotive report request is still being handled
- US 3525 — As a Data Security Administrator, I want the platform to validate LLM-derived reporting queries against access and safety guardrails so that customer, vehicle, and OEM data is protected before execution
- US 3533 — As a Compliance Auditor, I want the platform to trace each natural-language reporting request from prompt through execution outcome so that AI-generated reporting remains explainable and reviewable
- US 3536 — As a Reporting Analyst, I want to run approved reporting queries against PostgreSQL so that I can retrieve automotive business data for analysis
- US 3544 — As a Reporting Analyst, I want to retrieve requested automotive reporting data from PostgreSQL so that I can analyze current vehicle, dealer, warranty, and service information without manual extraction
- US 3553 — As a Data Governance Administrator, I want PostgreSQL retrieval requests and outcomes to be fully audited and performance-controlled so that automotive reporting access remains explainable, compliant, and operationally resilient

### Golden Repo / Convention References
- No Golden Repo constraints were available in the provided source context.