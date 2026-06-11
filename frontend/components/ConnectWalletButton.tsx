"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

/* RainbowKit connect flow behind the page's own fantasy button chrome */
export default function ConnectWalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const connected = mounted && account && chain;

        return (
          <span
            {...(!mounted && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none" as const,
                userSelect: "none" as const,
              },
            })}
          >
            {!connected ? (
              <button
                type="button"
                onClick={openConnectModal}
                className="btn btn-mini-gold"
              >
                Connect Wallet
              </button>
            ) : chain.unsupported ? (
              <button
                type="button"
                onClick={openChainModal}
                className="btn btn-blood"
              >
                Wrong Network
              </button>
            ) : (
              <button
                type="button"
                onClick={openAccountModal}
                className="btn btn-mini-gold"
              >
                {account.displayName}
              </button>
            )}
          </span>
        );
      }}
    </ConnectButton.Custom>
  );
}
