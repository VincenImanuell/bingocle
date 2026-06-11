import TopBar from "@/components/TopBar";
import Hero from "@/components/Hero";
import SectionNav from "@/components/SectionNav";
import AboutSection from "@/components/AboutSection";
import HowToPlay from "@/components/HowToPlay";
import GamePreview from "@/components/GamePreview";
import BetaSignup from "@/components/BetaSignup";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <div className="bg-noise" aria-hidden="true" />
      <TopBar />
      <Hero />
      <SectionNav />
      <main className="midlands">
        <AboutSection />
        <HowToPlay />
        <GamePreview />
      </main>
      <BetaSignup />
      <Footer />
    </>
  );
}
