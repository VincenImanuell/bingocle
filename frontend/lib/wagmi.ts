import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mantle, mantleSepoliaTestnet } from "wagmi/chains";

/* WalletConnect Cloud project id — injected/browser wallets work without
   it; set a real id in .env.local to enable WalletConnect QR wallets.
   https://cloud.walletconnect.com */
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "bingocle-dev-placeholder";

export const wagmiConfig = getDefaultConfig({
  appName: "Bingocle",
  projectId,
  chains: [mantleSepoliaTestnet, mantle],
  ssr: true,
});

export const initialChain = mantleSepoliaTestnet;
