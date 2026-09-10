import { CHAIN_ID } from "@/lib/blockchain/network";
import { DEMO_WALLET_ADDRESS } from "@/lib/blockchain/wallet/types";

export { DemoWalletAdapter } from "../demoAdapter";
export { DEMO_WALLET_ADDRESS as DEMO_IDENTITY_ADDRESS } from "../types";

export const DEMO_WALLET_ACCOUNT = {
  address: DEMO_WALLET_ADDRESS,
  chainId: CHAIN_ID,
  demo: true as const,
  label: "DEMO" as const,
};
