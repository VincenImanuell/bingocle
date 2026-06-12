import type { Metadata } from "next";
import OnchainGame from "@/components/app/OnchainGame";

export const metadata: Metadata = {
  title: "Bingocle — Live Market",
};

export default function PlayPage() {
  return (
    <main className="min-h-screen bg-[#0e0c08]">
      <OnchainGame />
    </main>
  );
}
