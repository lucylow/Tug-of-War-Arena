const ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const TX = /^0x[a-fA-F0-9]{64}$/;

const EXPLORERS: Record<number, string> = {
  1: "https://etherscan.io",
  137: "https://polygonscan.com",
  80002: "https://amoy.polygonscan.com",
};

function explorerBase(chainId: number | null | undefined): string | null {
  if (chainId == null || !(chainId in EXPLORERS)) return null;
  return EXPLORERS[chainId] ?? null;
}

export function getExplorerAddressUrl(chainId: number | null | undefined, address: string | null | undefined): string | null {
  const base = explorerBase(chainId);
  if (!base || !address || !ADDRESS.test(address)) return null;
  return `${base}/address/${address}`;
}

export function getExplorerTransactionUrl(chainId: number | null | undefined, hash: string | null | undefined): string | null {
  const base = explorerBase(chainId);
  if (!base || !hash || !TX.test(hash)) return null;
  return `${base}/tx/${hash}`;
}

export function getExplorerProofUrl(chainId: number | null | undefined, hash: string | null | undefined): string | null {
  if (!hash || hash.startsWith("demo_")) return null;
  return getExplorerTransactionUrl(chainId, hash);
}
