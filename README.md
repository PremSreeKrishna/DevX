# Orion Reports

Orion Reports is a governed natural-language automotive reporting workspace. The current implementation provides a working React client and Express API for authenticated request intake, approved-domain interpretation, read-only SQL governance, role-aware results, pagination, refinement, and append-only lifecycle auditing.

## Run locally

Install dependencies once in each application folder:

```powershell
npm --prefix client install
npm --prefix server install
```

Start the API in one terminal:

```powershell
npm run server:start
```

Start the web client in another terminal:

```powershell
npm run client:dev
```

Open the Vite URL shown by the client command. The Vite development proxy forwards `/api` requests to the Express API on port `3000`.

## Verify

```powershell
npm run client:build
npm run client:lint
npm run server:test
```

The API requires the `x-user-id` and `x-reporting-role` headers. The client supplies a demo reporting session for local development. The server currently uses governed fixture data so the full workflow is testable without exposing credentials or requiring a local database; PostgreSQL connectivity and production identity providers remain deployment integrations.

## Specification source

The feature requirements and acceptance checklist are under `specs/secure-automotive-nlq-reporting/`. The feature remains `PENDING` until the entire checklist, including production PostgreSQL, identity, policy persistence, and operational controls, is implemented and verified.