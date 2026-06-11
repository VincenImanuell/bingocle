# Bingocle — Frontend

Landing page for **Bingocle**, the AI-powered community bingo prediction
market on Mantle. Dark-fantasy card-game look, built with Next.js 16
(App Router), Tailwind CSS v4, and wagmi + RainbowKit for wallet connect.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run lint    # ESLint
npm run build   # production build
npm run start   # serve the production build
```

## Demo app (`/app`)

The **Launch App** button (and the play buttons on the landing page) opens a
fully playable demo of the game loop — no contracts needed yet:

1. **Join** the demo event (Mantle Builder Demo Day, 100 demo USDC).
2. **Submit words** — the demo AI Curator normalizes aliases
   ("artificial intelligence" → AI), merges duplicates into votes, and
   rejects generic/spam words. A new word that survives makes you its
   **Word Founder** (free seed position).
3. **Market** — tap tiles on your 5×5 card to buy positions at the listed
   price/multiplier.
4. **Live** — a simulated Speech Oracle validates words on a script of
   transcript snippets (with confidence scores and the occasional
   rejected near-miss). Tiles mark live; bingo bonuses (line / diagonal /
   double / full card) pay out as they complete. Speed toggle: 1× / 2× / 4×.
5. **Claim** — settlement table, claimable rewards, and a Human-vs-AI
   leaderboard.

Game logic lives in `components/app/engine.ts` (pure functions: curation,
card generation, line detection, rewards) and `components/app/data.ts`
(word pool, odds, oracle script). Swap the simulated oracle for real
contract events later without touching the UI.

## Wallet connect (wagmi + RainbowKit)

The **Connect Wallet** button in the top bar opens a RainbowKit modal with
multi-wallet support (MetaMask, Rabby, OKX, Coinbase, Phantom, … — installed
browser wallets are auto-detected via EIP-6963). Chains: **Mantle Sepolia**
(default) and **Mantle**.

Browser-extension wallets work out of the box. To also enable
WalletConnect QR wallets, copy `.env.example` to `.env.local` and set:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your id from cloud.walletconnect.com>
```

Wallet config lives in `lib/wagmi.ts`; the themed provider is
`components/Web3Provider.tsx`.

## Structure

```
app/
  layout.tsx        # fonts, metadata, Web3Provider
  page.tsx          # section assembly
  globals.css       # design system: palette, buttons, cards, board, motion
components/
  TopBar.tsx        # utility bar + Launch App + Connect Wallet
  Hero.tsx          # hero panel: canopy, smoke, card fan, CTAs
  SectionNav.tsx    # gold nav strip under the hero
  AboutSection.tsx  # "What is Bingocle?" + card fan
  HowToPlay.tsx     # copy + preview frame + game-flow panels
  GamePreview.tsx   # 5×5 live bingo board in an ornate frame
  BetaSignup.tsx    # underwater beta sign-up band (client)
  Footer.tsx        # wordmark + isometric BINGO tiles
  Reveal.tsx        # scroll-reveal wrapper (IntersectionObserver)
  Web3Provider.tsx  # wagmi + react-query + RainbowKit (fantasy theme)
  ConnectWalletButton.tsx
  ornaments.tsx     # shared SVG/CSS decorations
lib/
  wagmi.ts          # chains (Mantle Sepolia / Mantle) + wagmi config
```

All visuals are hand-built with CSS/SVG — no image assets.
