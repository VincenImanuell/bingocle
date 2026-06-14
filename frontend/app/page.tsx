import SmoothScroll from "@/components/SmoothScroll";
import TopBar from "@/components/TopBar";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import HowToPlay from "@/components/HowToPlay";
import GamePreview from "@/components/GamePreview";
import BetaSignup from "@/components/BetaSignup";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <div className="bg-noise" aria-hidden="true" />
      <TopBar />
      <Hero />
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
