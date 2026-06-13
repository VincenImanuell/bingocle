"use client";

import { useAccount } from "wagmi";
import DemoGame from "./DemoGame";
import OnchainGame from "./OnchainGame";

export default function GameRouter() {
  const { isConnected } = useAccount();
  if (isConnected) return <OnchainGame />;
  return <DemoGame />;
}
