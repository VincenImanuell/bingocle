import type { Metadata } from "next";
import DemoGame from "@/components/app/DemoGame";

export const metadata: Metadata = {
  title: "Bingocle — Play",
};

export default function AppPage() {
  return <DemoGame />;
}
