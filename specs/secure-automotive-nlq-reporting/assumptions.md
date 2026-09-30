# Implementation Assumptions

- **oq-1: Screen inventory and navigation** - Use one responsive reporting workspace containing intake, status, clarification, results, and audit context; this matches the monolith scope while avoiding unsupported navigation complexity.
- **oq-2: SQL display policy** - Show a governed SQL preview/reference for approved requests and never show SQL for blocked requests; this preserves explainability without providing SQL authoring controls.
- **oq-3: Sorting and filtering** - Enforce pagination and row limits on the server, with sorting limited to the authorized result page in the client; this keeps the demo deterministic without inventing an unapproved query API.
- **oq-4: User-facing copy** - Use concise, non-technical labels for statuses, clarification, denial, and failure states; the specification requires safe messaging but provides no copy deck.
