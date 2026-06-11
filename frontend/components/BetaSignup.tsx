"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { Kelp } from "./ornaments";

const BUBBLES = [
  { left: "12%", bottom: "8%", size: 7, duration: "7s", delay: "0s" },
  { left: "22%", bottom: "4%", size: 4, duration: "9s", delay: "2.5s" },
  { left: "46%", bottom: "6%", size: 5, duration: "8s", delay: "1.2s" },
  { left: "63%", bottom: "3%", size: 4, duration: "10s", delay: "4s" },
  { left: "78%", bottom: "9%", size: 6, duration: "7.5s", delay: "0.8s" },
  { left: "90%", bottom: "5%", size: 4, duration: "9.5s", delay: "3.2s" },
];

export default function BetaSignup() {
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      showToast("✦ Please enter a valid email address.");
      return;
    }
    setEmail("");
    showToast("✦ You're on the list — welcome to the beta!");
  }

  return (
    <section id="beta" className="relative scroll-mt-16 bg-night">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5">
        <div className="beta-band">
          <div className="beta-rays" aria-hidden="true" />
          <Kelp />
          <Kelp flip />
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {BUBBLES.map((b, i) => (
              <span
                key={i}
                className="bubble"
                style={{
                  left: b.left,
                  bottom: b.bottom,
                  width: b.size,
                  height: b.size,
                  animationDuration: b.duration,
                  animationDelay: b.delay,
                }}
              />
            ))}
          </div>

          <div className="relative z-10 mx-auto max-w-2xl px-6 py-20 text-center sm:py-24">
            <Reveal>
              <h2 className="h-display text-4xl sm:text-5xl">
                Join the <span className="gold">Bingocle Beta</span>
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p
                className="mt-4 font-body text-lg italic opacity-85"
                style={{ color: "#f5e6c8" }}
              >
                Leave your email and be the first to test the community bingo
                experience.
              </p>
            </Reveal>

            <Reveal delay={240}>
            <form
              noValidate
              onSubmit={handleSubmit}
              className="mx-auto mt-9 flex max-w-md flex-col items-stretch gap-3 sm:flex-row"
            >
              <label htmlFor="beta-email" className="sr-only">
                Email address
              </label>
              <input
                id="beta-email"
                type="email"
                className="input-dark flex-1"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="btn btn-gold px-8">
                Send
              </button>
            </form>
            </Reveal>
          </div>
        </div>
      </div>

      {/* permanently mounted live region so announcements are reliable */}
      <div
        className="toast-banner"
        role="status"
        style={{ visibility: toast ? "visible" : "hidden" }}
      >
        {toast && (
          <span key={toast} className="toast-inner">
            {toast}
          </span>
        )}
      </div>
    </section>
  );
}
