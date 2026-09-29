# Implementation Requirements Checklist

**Purpose**: Provide an implementation acceptance checklist that agents can execute one item at a time.  
**Feature**: LLM Intent Interpretation for Natural-Language Questions and governed PostgreSQL reporting workflow

## Functional Acceptance Criteria

- [ ] Authenticated reporting users can submit a non-empty natural-language question for approved automotive reporting domains and receive a unique request/query identifier
- [ ] The platform interprets supported questions into structured intent containing mapped domain/subject area and at least one requested metric, filter, grouping, or time element
- [ ] Recognized business terms are mapped to approved PostgreSQL schema metadata and entity dictionaries without requiring end-user SQL, table-name, or column-name knowledge
- [ ] For clear approved requests, the platform produces candidate PostgreSQL SQL preview/output context using only approved read-only schemas, tables, and views
- [ ] Generated database interaction uses SQL consistently for approved PostgreSQL reporting requests
- [ ] Ambiguous, incomplete, unsupported, or low-confidence requests return a clarification or status response identifying the unresolved entity, dimension, filter, relationship path, or time element instead of finalizing executable SQL
- [ ] Invalid request payloads, oversized inputs, unsupported formats, and interpretation-service failures return non-success responses that preserve the user session and operational traceability
- [ ] Approved interpreted requests flow through validation before execution, and unvalidated query identifiers cannot be executed
- [ ] Validated requests execute against approved PostgreSQL reporting sources and return either interactive results or a processing status response linked to the same request/query identifier
- [ ] Completed requests render interactive tabular results with row data, column headers, row/page metadata, and request-linked query context
- [ ] Delayed, timed-out, failed, blocked, ambiguous, or oversized requests present governed status, clarification, or failure states instead of misleading completed output
- [ ] Users can refine a request from the results/status experience, and the refined request is traceably linked to the original request lifecycle
- [ ] Primary happy-path behavior, alternate clarification/status paths, and blocked/failure paths are implemented for intent interpretation, validation, execution, and result retrieval

## UI Acceptance Criteria

- [ ] The web interface provides a natural-language query entry experience for authenticated reporting users
- [ ] Prompt submission validates required input presence and configured input limits before sending requests
- [ ] The UI does not expose SQL authoring/editing controls, raw database credentials, unrestricted database access, or internal rule details
- [ ] Interpretation outcomes are presented as either generated output context/SQL preview or a clarification/status message understandable by non-technical users
- [ ] The results interface displays execution state as queued, running, completed, or failed and updates visible status without requiring request resubmission
- [ ] The results experience shows interactive tabular data with sortable columns, formatted values, and pagination or equivalent bounded navigation for multi-row datasets
- [ ] Completed result views display original request context, request/query identifier, execution timestamp or equivalent request metadata, and source/query lineage context tied to the executed SQL reference and source objects/domain
- [ ] Failed or delayed requests show non-technical status/error messaging with the request identifier and never present partial output as completed final results
- [ ] The interface supports refinement submission from status/clarification/error states while preserving request context
- [ ] Masked values render consistently across initial load, pagination, sorting, filtering, refresh, and repeated access for the same request and security context
- [ ] Suppressed fields and unauthorized metadata are not rendered, stored in browser-visible payloads, or implied through hidden columns
- [ ] Responsive rendering and controlled row-volume handling keep large result sets usable within configured limits
- [ ] Applicable accessibility expectations for forms, status messaging, tables, and error states are implemented

## API and Integration Acceptance Criteria

- [ ] API endpoints required by the implemented flow exist for natural-language submission, request retrieval by identifier, SQL validation, execution, status retrieval, results retrieval, and audit retrieval/search where source-supported
- [ ] Natural-language submission APIs return a request/query identifier, interpretation status, mapped domain metadata, and either SQL preview/output context or clarification payload
- [ ] Validation APIs reject invalid PostgreSQL syntax, non-read-only statements, DDL/DML, COPY, MERGE, stacked or multi-statement payloads, and unsafe patterns before execution routing
- [ ] Validation APIs block access to schemas, tables, views, joins, rows, columns, and predicates not approved for the authenticated role
- [ ] Validation responses return governed allow/block outcomes and non-sensitive reason codes without invoking execution for blocked queries
- [ ] Execution APIs reject requests whose query identifier is not already validated and authorized for the target PostgreSQL reporting source
- [ ] Execution and retrieval APIs enforce page-size bounds, row-limit ceilings, timeout thresholds, and allowed sort-field constraints on every request
- [ ] Results APIs return only authorized data and include request-linked traceability metadata for executed SQL reference and source dataset/domain
- [ ] Status APIs return non-terminal processing payloads for delayed requests that can be polled until completion, timeout, or failure
- [ ] Audit APIs support retrieval/search of lifecycle records by request/event identifier and standard filters such as user, time window, and outcome type where implemented
- [ ] PostgreSQL access uses governed, read-only, scoped connectivity; direct unrestricted database access is not exposed through API responses
- [ ] Existing application contracts remain backward-compatible unless a source-supported endpoint change explicitly requires otherwise

## Business Logic and Data Acceptance Criteria

- [ ] Intent interpretation uses approved PostgreSQL schema metadata, approved views, and entity dictionaries rather than free-form database discovery
- [ ] Structured intent extraction covers automotive reporting entities and concepts such as vehicle, VIN, warranty, dealer, inventory, service history, customer ownership, fleet, supplier, financing, recall, and related approved domains where applicable
- [ ] Generated SQL is syntactically valid PostgreSQL for approved requests and limited to read-only SELECT-based patterns by default
- [ ] Validation parses SQL structurally rather than relying only on string matching, including statement type, referenced objects, selected columns, join predicates, filters, row limits, and timeout/resource controls
- [ ] Queries referencing unapproved schemas, tables, views, or objects outside the approved metadata catalog are blocked
- [ ] Queries missing required limits, exceeding configured row thresholds, violating join-scope policy, or presenting timeout/cardinality/resource risk are blocked before PostgreSQL execution
- [ ] Role-based access control is enforced across interpretation, validation, execution, result retrieval, and audit access
- [ ] Row-level and column-level restrictions are applied for protected customer, vehicle, financing, registration, warranty, dealer, supplier, and OEM-related data where policy metadata requires them
- [ ] Classified fields are masked, redacted, rewritten, excluded, or fully suppressed according to role and policy metadata before execution eligibility and before result serialization as required by the flow
- [ ] Unauthorized raw field access is denied, and policy enforcement occurs server-side rather than through client-side hiding
- [ ] Request, interpretation, validation, execution, status-transition, refinement-linkage, and result metadata records are persisted with stable identifiers sufficient for retrieval and traceability
- [ ] Immutable audit records are created for validation attempts, execution attempts/outcomes, result-view interactions, and full prompt-to-outcome lifecycle events with required identity, role, policy, source, timestamp, and outcome fields
- [ ] Audit records preserve lineage among original prompt, interpreted intent, generated SQL or SQL hash/reference, validation decision, execution outcome, accessed domain/source, and delivered result/status outcome
- [ ] Required result payload fields are present before completed-state rendering, including columns, rows, executionStatus, requestId/queryId, and queryContext where source-supported
- [ ] Error handling covers invalid request identifiers, unresolved security context, unauthorized result access, blocked validation, execution failure, timeout, and interpretation-service failure without leaking restricted details

## Non-Functional Acceptance Criteria

- [ ] Authenticated access is required for all reporting, results, validation, execution, and audit operations
- [ ] RBAC and least-privilege behavior are enforced using authenticated user/role context throughout the monolith's web and API boundaries
- [ ] Prompt content, SQL artifacts, and result delivery are handled with input sanitization and protections against SQL injection, prompt injection, comment-based bypass, and stacked-statement bypass attempts
- [ ] Sensitive data handling aligns with stated GDPR, CCPA, SOC 2, ISO 27001, and internal automotive data-governance expectations where source-supported
- [ ] Audit storage is immutable or append-only with tamper-evident controls, protected access, and encrypted transport/storage where source-supported
- [ ] Structured logs and metrics capture request/query identifiers, user identity or reference, mapped domains, confidence outcome, validation decisions, policy reason codes, status transitions, execution duration, row count, masking outcomes, and failure causes
- [ ] Audit capture and observability are implemented so they do not materially prevent interactive request handling from meeting the feature SLA
- [ ] For at least 95% of successful requests under normal operating conditions, the user receives either a processing status update or final results within 10 seconds
- [ ] Interpretation returns candidate SQL/output context or clarification within the stated interactive target for normal approved requests, including the 5-second target where implemented from source-supported requirements
- [ ] Validation performance remains within the interactive workflow budget and supports the stated standard-query target where source-supported
- [ ] Standard audit search responses meet the stated performance expectation where that capability is implemented
- [ ] Pagination interactions for cached/normal result pages meet the stated response expectation where source-supported
- [ ] Concurrency throttling, query cancellation, timeout enforcement, and resource-governor protections prevent database overload during approved execution
- [ ] Implementation respects monolith architecture while preserving internal API boundaries relevant to web and service flows
- [ ] No Golden Repo-specific constraints are inferred or implemented beyond source-supported local conventions because none were provided
- [ ] Verification covers highest-risk behaviors: unsafe SQL blocking, role-based masking/suppression, unauthorized access denial, delayed-status handling, and prompt-to-result audit lineage

## Traceability

- [ ] Every implemented change maps back to the feature’s source-supported functional requirements, acceptance criteria, user interaction flows, technical considerations, or success metrics
- [ ] Every non-blocking Open Question that was implemented has a recorded decision + one-line rationale in specs/<slug>/assumptions.md (no Open Question is silently assumed)
- [ ] No BLOCKING Open Question was implemented as an assumption (a feature with an unresolved blocking question is held at needs-clarification, not completed)

## Notes

- Never resolve an Open Question silently. In an unattended run, record the chosen assumption + rationale in specs/<slug>/assumptions.md; blocking questions must instead hold the feature at needs-clarification.
- Mark an item complete only after verifying actual implementation code and behavior.