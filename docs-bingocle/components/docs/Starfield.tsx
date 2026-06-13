"use client";

import { useEffect, useRef } from "react";

type Star = { x: number; y: number; vx: number; vy: number; r: number; t: number };

// Lightweight constellation field: drifting stars + faint links between near
// neighbours, plus a slow twinkle. Pauses when the tab is hidden.
export function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let raf = 0;
    let running = true;

    function seed() {
      const density = Math.min(150, Math.floor((w * h) / 14000));
      stars = Array.from({ length: density }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.4 + 0.4,
        t: Math.random() * Math.PI * 2,
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function frame() {
      if (!running) return;
      ctx!.clearRect(0, 0, w, h);

      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;
        s.t += 0.02;
        if (s.x < 0) s.x = w;
        if (s.x > w) s.x = 0;
        if (s.y < 0) s.y = h;
        if (s.y > h) s.y = 0;
      }

      // links
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const a = stars[i];
          const b = stars[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 120 * 120) {
            const alpha = (1 - Math.sqrt(d2) / 120) * 0.18;
            ctx!.strokeStyle = `rgba(168,130,255,${alpha})`;
            ctx!.lineWidth = 0.6;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      // stars
      for (const s of stars) {
        const tw = 0.55 + Math.sin(s.t) * 0.45;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(201,180,255,${0.35 + tw * 0.45})`;
        ctx!.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    if (reduce) {
      frame.call(null); // single static paint
    } else {
      frame();
    }

    const onResize = () => resize();
    const onVis = () => {
      running = !document.hidden && !reduce;
      if (running) frame();
      else cancelAnimationFrame(raf);
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="bg-field" aria-hidden>
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <canvas ref={ref} className="bg-canvas" />
    </div>
  );
}
