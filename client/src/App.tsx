import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Role = 'reporting_analyst' | 'reporting_manager' | 'compliance_auditor'
type RequestState = 'idle' | 'queued' | 'running' | 'completed' | 'clarification' | 'failed'

type RequestRecord = {
  requestId: string
  prompt: string
  status: string
  executionStatus: string
  domainLabel?: string
  mappedTable?: string
  intent?: { subjectArea: string; metric: string; grouping: string; timeElement: string; confidence: number }
  sql?: string
  sqlFingerprint?: string
  clarification?: string
}

type Results = {
  columns: string[]
  rows: Record<string, string | number>[]
  rowCount: number
  totalRows: number
  page: number
  pageSize: number
  totalPages: number
  queryContext: { sqlReference: string; source: string; domain: string }
  executedAt?: string
}

const API = '/api/reporting'

function App() {
  const [role, setRole] = useState<Role>('reporting_analyst')
  const [prompt, setPrompt] = useState('Show warranty claims by dealer for the last quarter')
  const [request, setRequest] = useState<RequestRecord | null>(null)
  const [results, setResults] = useState<Results | null>(null)
  const [state, setState] = useState<RequestState>('idle')
  const [message, setMessage] = useState('Ready for a governed reporting question.')
  const [error, setError] = useState('')
  const [sort, setSort] = useState('')
  const [refinement, setRefinement] = useState('')

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    'x-user-id': 'demo-analyst',
    'x-reporting-role': role,
  }), [role])

  async function post(path: string, body: unknown) {
    const response = await fetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || data.reasonCodes?.join(', ') || 'The reporting request could not be completed.')
    return data
  }

  async function submitQuestion(event: FormEvent) {
    event.preventDefault()
    if (!prompt.trim() || prompt.trim().length > 500) {
      setError('Enter a question between 1 and 500 characters.')
      return
    }
    setError('')
    setResults(null)
    setState('queued')
    setMessage('Interpreting your question against approved reporting domains...')
    try {
      const created: RequestRecord = await post('/nl-queries', { prompt })
      setRequest(created)
      if (created.status === 'clarification') {
        setState('clarification')
        setMessage(created.clarification || 'More detail is needed before a safe report can be prepared.')
        return
      }
      setState('running')
      setMessage('Validating the generated report plan and preparing results...')
      await post('/query-validations', { requestId: created.requestId, sql: created.sql })
      const completed: Results = await post('/query-executions', { requestId: created.requestId, pageSize: 25 })
      setResults(completed)
      setState('completed')
      setMessage('Report completed with governed, role-aware results.')
    } catch (submitError) {
      setState('failed')
      setError(submitError instanceof Error ? submitError.message : 'The report could not be completed.')
      setMessage('The request was stopped before incomplete results could be shown.')
    }
  }

  useEffect(() => {
    if (!request || state !== 'running') return
    const timer = window.setInterval(async () => {
      const response = await fetch(`${API}/nl-queries/${request.requestId}/status`, { headers })
      if (!response.ok) return
      const status = await response.json()
      if (status.executionStatus === 'completed') setState('completed')
    }, 2000)
    return () => window.clearInterval(timer)
  }, [headers, request, state])

  async function refineQuestion(event: FormEvent) {
    event.preventDefault()
    if (!request || !refinement.trim()) return
    setError('')
    setState('queued')
    setMessage('Creating a traceable refinement...')
    try {
      const child: RequestRecord = await post(`/nl-queries/${request.requestId}/refinements`, { prompt: refinement })
      setPrompt(refinement)
      setRefinement('')
      setRequest(child)
      setResults(null)
      if (child.status === 'clarification') {
        setState('clarification')
        setMessage(child.clarification || 'More detail is needed before a safe report can be prepared.')
        return
      }
      setState('running')
      setMessage('Validating the refined report plan and preparing results...')
      await post('/query-validations', { requestId: child.requestId, sql: child.sql })
      const completed: Results = await post('/query-executions', { requestId: child.requestId, pageSize: 25 })
      setResults(completed)
      setState('completed')
      setMessage('Refined report completed with governed, role-aware results.')
    } catch (refinementError) {
      setState('failed')
      setError(refinementError instanceof Error ? refinementError.message : 'The refinement could not be completed.')
      setMessage('The refinement was stopped before incomplete results could be shown.')
    }
  }

  async function changeSort(column: string) {
    if (!request || state !== 'completed') return
    const response = await fetch(`${API}/results/${request.requestId}?sort=${encodeURIComponent(column)}`, { headers })
    if (response.ok) {
      setResults(await response.json())
      setSort(column)
    }
  }

  async function changePage(page: number) {
    if (!request || !results) return
    const response = await fetch(`${API}/results/${request.requestId}?page=${page}&sort=${encodeURIComponent(sort)}`, { headers })
    if (response.ok) setResults(await response.json())
  }

  const statusLabel = state === 'idle' ? 'Ready' : state === 'clarification' ? 'Needs clarification' : state[0].toUpperCase() + state.slice(1)

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark"><span>OR</span><div><strong>Orion Reports</strong><small>Governed automotive intelligence</small></div></div>
        <div className="session-control"><span className="online-dot" /> Demo session <select value={role} onChange={(event) => setRole(event.target.value as Role)} aria-label="Reporting role"><option value="reporting_analyst">Reporting Analyst</option><option value="reporting_manager">Operations Manager</option><option value="compliance_auditor">Compliance Auditor</option></select></div>
      </header>

      <section className="hero-copy"><p className="eyebrow">NATURAL-LANGUAGE REPORTING</p><h1>Ask the fleet<br /><em>what changed.</em></h1><p className="intro">Translate an operational question into a governed PostgreSQL report without writing SQL. Every result is scoped, traceable, and shaped by your reporting role.</p></section>

      <section className="workspace-grid">
        <form className="query-panel" onSubmit={submitQuestion}>
          <div className="panel-heading"><div><span className="step-number">01</span><h2>Ask a question</h2></div><span className="limit">{prompt.length}/500</span></div>
          <label htmlFor="question">What would you like to understand?</label>
          <textarea id="question" value={prompt} maxLength={500} onChange={(event) => setPrompt(event.target.value)} placeholder="e.g. Which dealers have the most warranty claims this quarter?" rows={5} />
          {error && <p className="error-message" role="alert">{error}</p>}
          <div className="suggestions"><button type="button" onClick={() => setPrompt('Compare service events by region this month')}>Service events by region</button><button type="button" onClick={() => setPrompt('Show dealer inventory by model')}>Dealer inventory by model</button></div>
          <button className="primary-action" type="submit"><span>Run governed report</span><span aria-hidden="true">↗</span></button>
          <p className="privacy-note"><span>◈</span> Protected by role-based access and audit logging</p>
        </form>

        <aside className="status-panel" aria-live="polite">
          <div className="panel-heading"><div><span className="step-number">02</span><h2>Request status</h2></div><span className={`status-pill status-${state}`}>{statusLabel}</span></div>
          <div className={`status-orbit status-${state}`}><span className="orbit-core">{state === 'completed' ? '✓' : state === 'failed' ? '!' : state === 'clarification' ? '?' : '◌'}</span></div>
          <p className="status-message">{message}</p>
          {request && <dl className="request-facts"><div><dt>Request ID</dt><dd>{request.requestId.slice(0, 18)}...</dd></div>{request.domainLabel && <div><dt>Reporting domain</dt><dd>{request.domainLabel}</dd></div>}{request.intent && <div><dt>Interpretation confidence</dt><dd>{Math.round(request.intent.confidence * 100)}%</dd></div>}</dl>}
          {request?.intent && <div className="intent-tags"><span>{request.intent.metric}</span><span>{request.intent.grouping}</span><span>{request.intent.timeElement}</span></div>}
          {request?.sql && <div className="sql-reference"><span>Governed query reference</span><code>{request.sqlFingerprint}</code></div>}
        </aside>
      </section>

      {results && state === 'completed' && <section className="results-panel"><div className="results-heading"><div><p className="eyebrow">03 / DELIVERED RESULTS</p><h2>{results.queryContext.domain}</h2><p>{request?.prompt}</p></div><div className="result-count"><strong>{results.totalRows}</strong><span>authorized rows</span></div></div><div className="table-wrap"><table><thead><tr>{results.columns.map((column) => <th key={column}><button type="button" onClick={() => void changeSort(column)}>{column.replaceAll('_', ' ')} <span>{sort === column ? '↓' : '↕'}</span></button></th>)}</tr></thead><tbody>{results.rows.map((row, index) => <tr key={`${results.page}-${index}`}>{results.columns.map((column) => <td key={column}>{String(row[column])}</td>)}</tr>)}</tbody></table></div><div className="results-footer"><span>Showing page {results.page} of {results.totalPages} · source {results.queryContext.source}</span><div className="pagination"><button type="button" disabled={results.page <= 1} onClick={() => void changePage(results.page - 1)}>←</button><button type="button" disabled={results.page >= results.totalPages} onClick={() => void changePage(results.page + 1)}>→</button></div></div></section>}

      {(state === 'clarification' || state === 'failed' || state === 'completed') && request && <form className="refine-panel" onSubmit={refineQuestion}><div><p className="eyebrow">CONTINUE THE TRACE</p><h2>Refine this request</h2><p>Start a related question while keeping this request's lineage available to authorized reviewers.</p></div><div className="refine-input"><input value={refinement} onChange={(event) => setRefinement(event.target.value)} placeholder="Add a filter, time period, or comparison..." aria-label="Refine request" /><button type="submit">Prepare refinement ↗</button></div></form>}
      <footer><span>ORION REPORTS / GOVERNED DATA WORKSPACE</span><span>Read-only access · Policy v2026.09</span></footer>
    </main>
  )
}

export default App
