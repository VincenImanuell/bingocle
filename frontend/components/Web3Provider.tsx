"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig, initialChain } from "@/lib/wagmi";

/* RainbowKit dark theme tuned to the page's gold/teal fantasy palette */
const rkTheme = darkTheme({
  accentColor: "#d9a441",
  accentColorForeground: "#2b1a05",
  borderRadius: "medium",
  overlayBlur: "small",
});

rkTheme.colors.modalBackground = "#11100c";
rkTheme.colors.modalBorder = "rgba(217, 164, 65, 0.35)";
rkTheme.colors.modalText = "#f5e6c8";
rkTheme.colors.modalTextSecondary = "#cdbb96";
rkTheme.colors.closeButton = "#cdbb96";
rkTheme.colors.closeButtonBackground = "#1a0d09";
rkTheme.colors.actionButtonBorder = "rgba(217, 164, 65, 0.25)";
rkTheme.colors.generalBorder = "rgba(217, 164, 65, 0.18)";

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={rkTheme}
          initialChain={initialChain}
          modalSize="wide"
          appInfo={{ appName: "Bingocle" }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
