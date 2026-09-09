export interface GovernanceHealth {
  ok: boolean
  latencyMs: number | null
  source: 'demo' | 'live'
  message: string
}

export async function checkGovernanceEndpoint(url: string): Promise<GovernanceHealth> {
  const started = Date.now()
  try {
    const response = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
    return {
      ok: response.ok,
      latencyMs: Date.now() - started,
      source: 'live',
      message: response.ok ? 'Governance source reachable' : `Governance source returned ${response.status}`,
    }
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      source: 'live',
      message: error instanceof Error ? error.message : 'Governance source unavailable',
    }
  }
}
