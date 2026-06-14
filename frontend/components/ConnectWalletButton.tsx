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
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.34rem 0.85rem",
                  borderRadius: "4px",
                  background: "linear-gradient(180deg, #1c1005 0%, #110900 100%)",
                  border: "1px solid rgba(217, 164, 65, 0.45)",
                  boxShadow:
                    "0 1px 4px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,220,120,0.06)",
                  cursor: "pointer",
                  fontFamily: "var(--font-ui)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  lineHeight: 1,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#2be3d4",
                    boxShadow: "0 0 7px rgba(43,227,212,0.75)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "0.66rem", color: "#e9b95c" }}>
                  {account.displayName}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    width: 1,
                    height: 10,
                    background: "rgba(217,164,65,0.25)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "0.58rem", color: "#9c8a64", whiteSpace: "nowrap" }}>
                  {chain.name.replace(/\s*testnet$/i, "")}
                </span>
              </button>
            )}
          </span>
        );
      }}
    </ConnectButton.Custom>
  );
}
