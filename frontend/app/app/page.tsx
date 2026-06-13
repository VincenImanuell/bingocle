import type { Metadata } from "next";
import OnchainGame from "@/components/app/OnchainGame";

export const metadata: Metadata = {
  title: "Bingocle — App",
};

export default function AppPage() {
  return (
    <main className="min-h-screen bg-[#0e0c08]">
      <OnchainGame />
    </main>
  );
}
