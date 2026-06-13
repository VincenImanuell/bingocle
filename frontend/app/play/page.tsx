import type { Metadata } from "next";
import GameRouter from "@/components/app/GameRouter";

export const metadata: Metadata = {
  title: "Bingocle — Play",
};

export default function PlayPage() {
  return (
    <main className="min-h-screen bg-[#0e0c08]">
      <GameRouter />
    </main>
  );
}
