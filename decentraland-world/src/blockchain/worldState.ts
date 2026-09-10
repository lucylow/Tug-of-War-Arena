export interface WorldBlockchainState {
  walletConnected: boolean
  address: string | null
  chainId: number | null
  latestProof: string | null
  demoMode: boolean
}

export function createWorldBlockchainState(): WorldBlockchainState {
  return {
    walletConnected: false,
    address: null,
    chainId: null,
    latestProof: 'demo-offchain-hash',
    demoMode: true,
  }
}
