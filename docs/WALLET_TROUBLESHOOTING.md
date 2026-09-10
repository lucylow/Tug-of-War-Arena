# Wallet troubleshooting

Wallet connection is optional. The arena, crew, and World companion stay playable without MetaMask.

## User-facing recovery

1. Retry from a supported browser with MetaMask unlocked.
2. If the request was rejected, connect again when ready. The app does not auto-retry rejections.
3. If the network is wrong, use **SWITCH NETWORK** or **CONTINUE DEMO**.
4. If the extension is missing, locked, pending, or duplicated, continue in demo mode.

## Causes

| Symptom | Likely cause | Recovery |
| --- | --- | --- |
| MetaMask unavailable | No injected provider / native unsupported | Continue demo |
| User rejected | EIP-1193 `4001` | Return to idle. Do not auto-retry. |
| Already pending | `-32002` | Open the MetaMask popup |
| Wrong network | Unsupported chain | Switch or continue demo |
| Network not added | `4902` | User must approve add-network |
| Extension locked | Locked MetaMask | Unlock, then retry |
| Multiple extensions | `ethereum.providers` | Prefer `isMetaMask` without mutating the global |
| Provider timeout | No response | Retry once, then recovery UI |
| Account / chain changed | Provider event | Re-detect. Do not assume the session is still live |
| Native unsupported | iOS/Android has no `window.ethereum` | Demo fallback |
| Provider disconnected | `4900` / `4901` | Gameplay stays. Web3 becomes unavailable |

## Implementation notes

Browser provider access is isolated in `lib/blockchain/wallet/` adapters and `lib/wallet/`. The Decentraland World never reads `window`, `document`, or `window.ethereum`.
