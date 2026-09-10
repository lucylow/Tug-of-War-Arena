# Wallet Runtime Architecture

Wallet connection is optional. A failed wallet must never crash the UI.

## Matrix

| Runtime | Adapter | `window.ethereum` |
| --- | --- | --- |
| React Native iOS/Android | Native deeplink adapter, else demo | Never |
| React Native Web | Browser adapter if injected, else demo | Only when injected |
| Browser | Browser adapter if injected, else demo | Only when injected |
| Decentraland SDK7 | Scene-safe demo blockchain state | Never |
| Server | No wallet UI | Never |

## MetaMask crash path

The extension error `Failed to connect to MetaMask` from `chrome-extension://.../inpage.js` is treated as a provider failure:

1. Catch it
2. Normalize it (`lib/blockchain/wallet/errors.ts`)
3. Log a diagnostic object without extension internals
4. Keep the UI alive
5. Offer Try Again + Continue Demo

`@metamask/connect-evm` is initialized only on native iOS/Android. Web never calls the extension SDK `Object.connect` path.

The Demo adapter uses display-only identity `0x000000000000000000000000000000000000dEaD` and never creates a private key.
