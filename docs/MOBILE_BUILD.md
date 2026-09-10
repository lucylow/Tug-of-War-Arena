# Mobile companion build

Tug of War Arena: Friendzone is a React Native / Expo companion. It does not render the Decentraland World.

```bash
pnpm install
pnpm check
pnpm lint
pnpm test
```

## Platforms

- **web:** `pnpm dev` (server + Expo web)
- **iOS:** `pnpm ios`
- **Android:** `pnpm android`

## Wallet differences

| Runtime | Live wallet | Demo |
| --- | --- | --- |
| Browser / Expo web | MetaMask Connect + injected provider, behind `BrowserWalletAdapter` | Always available |
| iOS / Android | MetaMask Connect deeplink when the app is installed. **No `window.ethereum`.** | Always available |
| Decentraland World | Abstract status only. No browser provider. | Demo terminal |

Play is never blocked on a wallet. Use **CONTINUE DEMO** whenever a provider is missing, locked, rejected, or on the wrong network.
