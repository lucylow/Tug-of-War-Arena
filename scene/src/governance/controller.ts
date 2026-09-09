import { governanceConfig } from './config'
import { DaoClient } from './services/daoClient'
import type { GovernanceWorldState } from './types'

export class GovernanceController {
  private readonly client: DaoClient
  public readonly state: GovernanceWorldState

  constructor(state: GovernanceWorldState, client?: DaoClient) {
    this.state = state
    this.client =
      client ??
      new DaoClient({
        apiUrl: governanceConfig.apiUrl,
        mode: governanceConfig.mode,
      })
  }

  refresh(): void {
    this.state.loading = true
    this.state.error = null

    void this.client
      .getOverview()
      .then((overview) => {
        this.state.overview = overview
        this.state.lastRefreshAt = Date.now()
        this.state.loading = false
      })
      .catch((error) => {
        this.state.loading = false
        this.state.error = error instanceof Error ? error.message : 'Unable to refresh DAO data'
      })
  }
}
