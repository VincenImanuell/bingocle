import type { Metadata } from "next";
import DemoGame from "@/components/app/DemoGame";

export const metadata: Metadata = {
  title: "Bingocle — Demo",
};

export default function PlayPage() {
  return (
    <main className="min-h-screen bg-[#0e0c08]">
      <DemoGame />
    </main>
  );
}
