# Bingocle

**Prediction Market Bingo Komunitas Bertenaga AI di Mantle**

> Trade the words before they hit the card — diverifikasi live oleh AI Oracle, di-settle di Mantle.

**Hackathon:** The Turing Test Hackathon 2026 (Phase II — AI Awakening) · Mantle Network
**Track:** Consumer & Viral DApps — Track 04 (sponsor: Animoca Minds, Animoca Brands, OpenCheck)
**Deadline submission:** **15 Juni 2026, 15:59** · Demo Day 2–3 Juli · Awards 10 Juli
**Dokumen:** master Bahasa (file ini) · versi English: `Bingocle_EN.md` · salinan Bahasa: `Bingocle_ID.md`

---

## 0. Baca Ini Dulu — Cara Track Ini *Sebenarnya* Dinilai

Setiap proyek dinilai dengan **dua scorecard**, keduanya wajib, dijumlah jadi 100 poin (terverifikasi dari rubrik resmi "Judging Criteria of AI Awakening"):

| Bagian | Poin | Penilai | Yang diukur |
|---|---|---|---|
| **Part A — Mantle General** | 50 | Semua juri | Technical (15) · Ecosystem fit (10) · Business (10) · Innovation (10) · UX (5) |
| **Part B — Animoca track-specific** | 50 | Juri Animoca Brands | **100% soal Minds Bazaar Capability** (lihat §12.2) |

**Insight penentu:** Part B — separuh nilai — **bukan** soal smart contract. Yang dinilai adalah **Capability yang dipublish ke Minds Bazaar**: skill agent AI percakapan, live di Bazaar, dioperasikan lewat **email + Telegram**, didokumentasikan agar Mind milik user *lain* bisa equip dan jalankan, dengan percakapan build disertakan sebagai bukti.

> **Catatan OpenCheck:** rubrik **tidak punya scorecard OpenCheck terpisah** — satu-satunya kartu track-specific = Animoca. OpenCheck co-sponsor; perlakukan sebagai *sinergi verifikasi/keaslian* (bukti Oracle on-chain), bukan poin tambahan.

Maka Bingocle dikirim sebagai **dua deliverable berpasangan**:

1. **Bingocle Capability** (mesin Part B) — permukaan konsumen. Skill Mind yang membuat siapa pun bisa buat/join event bingo prediksi, submit kata, beli posisi, nonton live, claim — sepenuhnya lewat chat. Deliverable *inti*, bukan tambahan.
2. **Bingocle on-chain** (mesin Part A) — lapisan kepercayaan + inovasi. Smart contract di Mantle + AI Speech Oracle + web app publik. "Side infrastructure (live, dengan URL)" yang dipanggil Capability; meraih poin Technical/Innovation/Ecosystem.

> Capability = produk untuk track ini; chain = tulang punggungnya.

---

## 1. Ringkasan Eksekutif

**Bingocle** adalah consumer dApp yang mengubah audiens pasif sebuah event live (konferensi, podcast, debat, livestream, demo day) menjadi pemain aktif dalam sebuah **prediction market berbentuk bingo** — di mana seluruh siklus permainan dijalankan dan diverifikasi oleh **AI Agent on-chain di Mantle Network**.

Dalam satu kalimat:

> Komunitas mengusulkan kata yang mereka prediksi akan disebut selama event, AI mengkurasi kata menjadi word pool dan bingo card, setiap kata menjadi aset prediksi on-chain, lalu **AI Validation Oracle mendengarkan event live (speech-to-text + LLM) dan menulis hasil validasinya langsung ke smart contract di Mantle** — memicu settlement, marking card, dan distribusi reward secara otomatis dan transparan.

Tidak ada admin yang menandai kata manual. Tidak ada black box. Setiap keputusan AI tercatat permanen on-chain — langsung mewujudkan tema Turing Test: *on-chain benchmarking of AI, agent identity, dan radical transparency* (lihat §6).

Untuk track Consumer & Viral DApps, seluruh pengalaman itu **dibungkus sebagai Minds Capability** sehingga user — atau Mind milik user lain — bisa bermain cukup dengan mengobrol.

### Posisi

| Item | Detail |
|---|---|
| **Track utama** | Consumer & Viral DApps (Animoca Minds, Animoca Brands, OpenCheck) |
| **Target hadiah** | Track Winner ($8.500) · Top-20 Deployment ($1.000) · Best UI/UX ($3.000) · Community Voting ($8.500) |
| **Chain** | Mantle Network (Sepolia testnet → Mainnet) |
| **AI inti** | AI Validation Oracle (STT + LLM) · AI Word Curator · AI Odds Engine · Bingocle Capability (Minds, email + Telegram) |
| **Identitas agent** | ERC-8004 Agent Identity NFT untuk AI Validation Oracle |

---

## 2. Nama & Tagline

**Bingocle** = **Bing**o + Or**acle** — bingo yang diwasiti AI oracle on-chain.

Tagline utama:

> **Trade the words before they hit the card.**

Alternatif:
- *Where community words become on-chain prediction markets.*
- *Submit words. Trade predictions. Let the AI call the bingo.*
- *The first bingo game refereed by an on-chain AI oracle.*

---

## 3. Latar Belakang & Masalah

Dalam seminar Web3, podcast, debat, atau demo day hackathon, ada kata yang hampir pasti disebut pembicara: *Blockchain, Wallet, AI, Funding, Mainnet, Gas Fee, Community*. Tapi audiens hanya menonton — tidak ada mekanisme partisipasi, prediksi, atau reward.

Empat masalah yang diselesaikan Bingocle:

### 3.1 Event satu arah, audiens pasif
Seminar, konferensi, livestream berjalan satu arah. Engagement audiens rendah dan cepat turun.

### 3.2 Prediction market terlalu serius dan menakutkan untuk pengguna baru
Platform existing (politik, harga crypto, olahraga) punya barrier tinggi: jargon finansial, UX kompleks, taruhan besar. Tidak ada *on-ramp* fun untuk pengguna Web2.

### 3.3 Prediction market butuh oracle — dan oracle untuk "kata yang diucapkan manusia" belum ada
Gap teknis yang menarik: tidak ada infrastruktur untuk menyelesaikan market berbasis *ucapan dalam event live*. Validasi manual lambat, bisa dicurangi, tidak scalable. **Bingocle membangun AI Speech Oracle on-chain sebagai solusinya.**

### 3.4 Bingo tradisional statis
Bingo klasik hanya mencocokkan angka. Tidak ada layer komunitas, ekonomi, maupun strategi.

---

## 4. Solusi

Bingocle menggabungkan empat lapisan dalam satu permainan:

```
Community Submission  →  kata datang dari komunitas, dikurasi AI
+ Bingo Game          →  format permainan yang semua orang sudah paham
+ Prediction Market   →  setiap kata = aset prediksi on-chain di Mantle
+ AI Oracle           →  AI mendengarkan event live & menyelesaikan market on-chain
```

…lalu mengeksposnya melalui **Minds Capability percakapan** sehingga pemain tidak pernah butuh terminal, seed phrase, atau pengetahuan Web3.

Yang membedakan Bingocle dari "bingo app" biasa: **AI bukan fitur tempelan, melainkan wasit permainan.** Seluruh integritas game bergantung pada AI agent yang keputusannya dapat diaudit on-chain.

**Bukan "Polymarket dengan skin bingo".** Engine market di bawahnya mirip, tapi 3 pembeda nyata: (1) outcome = **kata submisi komunitas**, bottom-up, bukan market define-admin; (2) **oracle = AI speech oracle pada audio live** — kelas market yang Polymarket/UMA tidak bisa resolve; (3) **layer pola bingo** (line, diagonal, full-card bonus) = meta-game di atas outcome individual. Lead pitch dengan angle bingo + AI-oracle + komunitas; market = value layer di bawahnya.

---

## 5. Kenapa Mantle

1. **Biaya transaksi sangat rendah** — game konsumen dengan banyak transaksi mikro (buy posisi kata, marking, claim) hanya viabel di chain ber-fee rendah seperti Mantle.
2. **Account Abstraction & gasless UX** — pengguna Web2 (penonton podcast, peserta seminar) bisa main tanpa paham gas. Sponsored transactions via paymaster.
3. **ERC-8004 Agent Identity** — standar identitas agent yang dipionirkan di ekosistem Mantle. AI Validation Oracle Bingocle terdaftar sebagai agent ber-NFT identitas, dengan track record validasi terakumulasi on-chain.
4. **Aset ekosistem** — entry fee dan reward pool dalam **MNT / USDC di Mantle**; reward pool event korporat dapat ditempatkan pada aset yield-bearing Mantle (mETH) sebagai pengembangan lanjutan.
5. **Alignment narasi** — Mantle sedang membangun *agent economy*. Bingocle mendemonstrasikan kategori baru: **AI agent sebagai oracle konsumen** yang menghasilkan nilai on-chain nyata.

---

## 6. Kenapa Ini Proyek "Turing Test"

Tesis hackathon = **on-chain benchmarking of AI**, **agent identity**, dan mekanisme **Human vs. AI** di Phase II. Bingocle dibangun di atas tesis itu, bukan ditempeli:

| Pilar Turing Test | Bagaimana Bingocle mewujudkannya |
|---|---|
| **On-chain AI benchmarking** | Setiap verdict Oracle (kata, confidence, bukti transkrip, timestamp) ditulis on-chain. Akurasi AI *terukur publik seiring waktu* — dispute rate & akurasi hit terakumulasi sebagai benchmark on-chain, bukan klaim marketing. |
| **Agent identity** | Validation Oracle memegang **ERC-8004 Identity NFT**. Reputasinya (jumlah event, akurasi, dispute rate) terikat ke identitas itu dan tumbuh on-chain — track record AI yang dapat di-benchmark dan portable. |
| **Human vs. AI** | Karena market dapat dijangkau lewat Minds Capability, **pemain manusia dan Mind AI user lain trading di market kata yang sama**. Leaderboard bisa memisah akurasi prediksi Human vs. AI — instance langsung dan playable dari mekanisme Human-vs-AI Phase II. |
| **"Turing" test itu sendiri** | *Bisakah wasit AI menilai "apakah kata ini benar disebut" sebaik manusia?* Dispute window = tes live: komunitas boleh menantang verdict apa pun; dispute rate konsisten rendah = AI **lolos** tes, tercatat selamanya. |
| **Radical transparency** | Tanpa black box. Siapa pun bisa membuka Mantle Explorer dan memeriksa setiap keputusan AI + buktinya. Inference off-chain, akuntabilitas on-chain. |

> Framing jujur untuk juri: AI **jalan off-chain** (STT + LLM), lalu agent ber-identitas ERC-8004 **commit verdict-nya on-chain**. Ini memenuhi "AI-powered function callable on-chain" lewat interpretasi agent-menulis-on-chain — jangan over-claim sebagai inference di dalam EVM.

---

## 7. Fitur Inti

### 7.1 ⭐ Bingocle Capability (Minds Bazaar) — permukaan konsumen *(inti Part B)*

Capability = cara user nyata bertemu Bingocle. Dipublish ke **Minds Bazaar** dengan nama publik, ID publik, dan activation message tanpa friksi, ia agent percakapan yang menjalankan game penuh lewat **email dan Telegram** — tanpa terminal, tanpa onboarding teknis.

Yang bisa dilakukan user (atau Mind milik user lain) cukup dengan chat:
- *"Buat event Bingocle untuk podcast saya malam ini, tema Web3, pool 100 USDC."* → membuat event on-chain.
- *"Join event #MANTLE-DEMO dan submit 3 kata: airdrop, mainnet, liquidity."*
- *"Beli 10 USDC di AI dan 4 di Airdrop."* → menempatkan posisi (gasless).
- *"Bagaimana card saya?"* → mengembalikan card ter-mark live + kata mana yang sudah muncul.
- *"Claim reward saya."* → settle dan claim on-chain.

Dua syarat langsung dari scorecard, jadi prioritas utama:
- **`/agent-guide` untuk cross-Mind reproducibility (Path B):** panduan lengkap dan akurat agar *Mind milik user yang benar-benar berbeda, tanpa konteks builder, bisa equip dan operasikan Capability.* **Juri akan mengetes ini langsung** — jadi guide direkayasa dan dilatih dengan Mind bersih, bukan dipikir belakangan.
- **Transparansi proses build:** seluruh percakapan build (thread email/Telegram builder↔Mind, ide → Capability jadi) ditangkap sejak hari pertama dan disertakan, menunjukkan pemecahan masalah iteratif asli, bukan tool yang dibungkus belakangan. *Bernilai hingga 10 poin; buat secara sengaja.*

### 7.2 ⭐ AI Validation Oracle — "the referee" *(Part A: Innovation + Technical)*

AI agent yang menggantikan validasi manual sepenuhnya:

1. **Listen** — agent menerima audio stream event live (mic venue / audio livestream).
2. **Transcribe** — speech-to-text (Whisper) mentranskripsi real-time.
3. **Match & Reason** — LLM (Claude) mencocokkan transkrip dengan word pool: menangani sinonim, akronim, konteks (mis. "artificial intelligence" → match "AI"; "dompet digital" → match "Wallet"). Juga menolak false positive.
4. **Commit on-chain** — setiap kata tervalidasi ditulis ke kontrak `OracleRegistry` di Mantle, dengan timestamp, cuplikan transkrip (bukti), dan confidence score.
5. **Settle** — commit on-chain ini otomatis memicu marking card, deteksi pola bingo, dan kalkulasi reward — semuanya di smart contract, tanpa campur tangan manusia.

**Properti penting:**
- ✅ *AI-powered function callable on-chain* (syarat Deployment Award terpenuhi by design).
- ✅ Auditable: siapa pun bisa memeriksa setiap keputusan AI + buktinya di Mantle Explorer.
- ✅ Dispute window: periode singkat di mana komunitas dapat men-flag verdict yang dianggap salah sebelum settlement final (human-in-the-loop sebagai safety net, bukan operator).
- ✅ Agent memegang **ERC-8004 Identity NFT** — reputasi oracle terakumulasi on-chain.

### 7.3 AI Word Curator — moderasi & normalisasi otomatis

Saat fase submission, LLM otomatis:
- **Normalisasi**: `ai` / `Ai` / `artificial intelligence` → `AI`; `smartcontract` → `Smart Contract`.
- **Deduplikasi semantik**: kata bermakna sama digabung beserta vote-nya.
- **Filter**: kata kasar, spam, link, kata terlalu umum (*dan, yang, itu*), dan kata di luar tema ditolak — dengan alasan ditampilkan ke user.
- **Theme relevance scoring**: setiap kata diberi skor relevansi terhadap tema event.

Hasil kurasi (word pool final 25 kata untuk card 5×5) di-commit on-chain sebagai merkle root agar tidak bisa diubah setelah market dibuka.

### 7.4 AI Odds Engine — penentuan harga & multiplier

LLM + data vote komunitas menentukan harga awal dan multiplier setiap kata:

- **Sinyal komunitas**: jumlah vote (lebih banyak vote → probabilitas dianggap tinggi → harga tinggi, multiplier kecil).
- **Sinyal AI**: LLM menilai probabilitas kemunculan kata dari tema, deskripsi event, profil pembicara — menangkap kata *under-voted* tapi hampir pasti muncul.

| Kata | Vote | AI Probability | Harga Awal | Multiplier |
|---|---|---|---|---|
| AI | 25 | 0.95 | 0.80 | 1.2× |
| Blockchain | 18 | 0.85 | 0.70 | 1.5× |
| Funding | 15 | 0.60 | 0.55 | 1.7× |
| Airdrop | 5 | 0.20 | 0.25 | 2.5× |

Parameter final di-publish on-chain sebelum market dibuka — transparan dan tidak bisa dimanipulasi setelahnya.

### 7.5 ⭐ Word Founder — kenapa orang submit kata *(insentif submisi)*

**Masalah yang difix:** di desain naif, submit kata nol edge — malah lebih buruk: kata yang kamu yakini jadi populer, harga naik, multiplier turun, jadi *kamu dan semua dapat odds lebih jelek.* Insentif kebalik. Mekanik **Word Founder** memperbaikinya dan menjadikan submisi sebagai on-ramp.

Submit kata yang lolos masuk pool final → kamu jadi **Founder** kata itu. **Satu Founder per kata = wallet yang submit paling awal (timestamp paling dini); submit kata sama belakangan tetap kehitung vote tapi tidak dapat hak Founder** (co-founder split = varian post-hackathon). Founder dapat:

1. **Free seed position** — 1 share gratis kata itu. Prediksi costless dengan upside nyata. Ini hook inti: *submisi = tiket lotre gratis atas prediksimu sendiri* — entry Web2 tanpa uang yang sempurna.
2. **Founder price** — hak beli lebih banyak di harga pembukaan (termurah) selama window awal, **sebelum** trading publik melebarkan pool parimutuel. Jadi ya — submitter dapat entry termurah, by design.
3. *(opsi)* **Curator royalty** — potongan kecil (mis. 1% pool kata itu) saat settlement kalau kata muncul, reward mencari kata bagus.

**Dua cara dapat posisi — mental model bersih:**
- **Submit (gratis, skill):** usulkan kata. Kata lolos = founder stake termurah gratis. Reward = skill prediksi + nyari kata. On-ramp viral, barrier nol.
- **Buy (bayar, conviction):** beli lebih di kata mana pun pada odds berjalan. Reward = conviction modal. Layer depth.

**Contoh angka:** Kamu submit "Airdrop" awal; lolos di harga 0.25 / mult 2.5×. Sebagai Founder dapat 1 share gratis + window 60 detik beli @0.25 sebelum publik banjir. Kalau "airdrop" disebut → share gratismu bayar 1 × 2.5 = 2.5 (modal nol), dan beli founder-price-mu 2.5× sementara latecomer bayar lebih mahal. Kalau TIDAK disebut → kamu cuma rugi yang dibayar; seed gratis = rugi nol. Downside terbatas, upside asimetris.

**Pengaman Sybil (wajib):** 1 wallet = maks 3 kata + 1 card/event; seed gratis di-fund dari **pool sponsor/faucet kecil bercaps, BUKAN dari pool parimutuel buyer**; curation filter + social-login dedup; founder allocation di-cap ≤ X% pool kata, transparan on-chain.

### 7.6 Channel-native delivery — email + Telegram

Scorecard memberi nilai untuk Capability yang terasa **native di email dan Telegram**:

- **Telegram bot / Mini App**: join event, submit kata, lihat card, beli posisi, terima push real-time ("🔔 'AI' baru saja disebut — card kamu tinggal 1 kata menuju BINGO!") di grup komunitas event.
- **Email**: flow percakapan sama untuk user inbox-native — buat event, terima gambar card, terima ringkasan settlement, claim lewat link satu-tap.
- **Angle Agent-vs-Human**: manusia dan Mind AI bisa main di market sama — selaras tema *Human vs. AI* (§6).

### 7.7 Prediction Market On-chain

- **Buy position** pada kata (MVP: buy-only, parimutuel pool per kata) menggunakan MNT/USDC di Mantle.
- Harga & multiplier dari AI Odds Engine, tercatat on-chain.
- Market terkunci otomatis saat event mulai (timestamp on-chain).
- Settlement otomatis ter-trigger oleh commit AI Oracle.
- **Lanjutan**: sell/exit position, dynamic AMM pricing, live in-event market.

### 7.8 Bingo Card NFT, Kondisi Menang & Reward

**Bingo Card NFT.** Setiap bingo card di-mint sebagai **NFT di Mantle** — susunan unik per user (shuffle dari pool sama, fairness terjaga), terkunci saat market tutup, jadi koleksi/bukti partisipasi.

**Kapan event selesai** (mana duluan): organizer menutup event (talk selesai) · time cap (mis. 60 menit) · semua/mayoritas kata tervalidasi. **Bukan** karena ada yang bingo duluan — **bingo tidak menghentikan game.** Berhenti di bingo pertama akan mematikan market (posisi pada kata yang belum disebut hangus) dan menurunkan bingo jadi sekadar undian shuffle card, karena validasi me-mark semua card serempak.

**Pemenang banyak — 2 jalur reward independen, dihitung smart contract:**
- **Prediction reward** = `amount × multiplier` untuk tiap kata yang kamu pegang posisinya dan tervalidasi muncul. Semua holder kata itu dibayar (parimutuel).
- **Bingo bonus** dari reward pool: 1 line = 50, diagonal = 75, 2 line = 100, full card = 500 (konfigurasi per event). **Bertingkat & numpuk** — bisa kena berkali-kali seiring kata tervalidasi (1 line → 2 line → full card).
- *(opsi)* **First-bingo jackpot** — bonus fix untuk yang bingo pertama; menambah sensasi race **tanpa** menghentikan event.

**Pemenang ditentukan leaderboard:** ranking by profit / akurasi prediksi / jumlah bingo (split Human vs AI, §6). Skill ada di market; bingo = layer luck + viral.

**Claim on-chain** + riwayat reward transparan.

### 7.9 Leaderboard, Streak & Viral Loop

- Leaderboard global & per-event: top profit, top bingo, top akurasi prediksi — dan **split Human vs. AI** (§6).
- **Share card**: hasil bingo card (marking & profit) dibagikan sebagai gambar ke X/Telegram satu tombol — *built-in viral loop* untuk Community Voting.
- Streak & badge on-chain (soulbound) untuk pemain multi-event.

### 7.10 Onboarding Web2-friendly

- **Social login + embedded wallet** (mis. Privy/Web3Auth) — tanpa seed phrase.
- **Gasless transactions** via Account Abstraction/paymaster di Mantle.
- Mode **free-play** (poin, tanpa dana) untuk event edukasi; mode **staked** (MNT/USDC) untuk event kompetitif. *Lead dengan free-play untuk menekan optik "judi".*

---

## 8. Arsitektur Teknis

```
┌─────────────────────────────────────────────────────────────────┐
│                      PERMUKAAN KONSUMEN                          │
│   Bingocle Capability (Minds Bazaar)  ·  Telegram  ·  Email     │
│   Next.js Web App (wallet / social login / gasless via AA)       │
│   → cross-Mind operable via /agent-guide                         │
└────────────────┬────────────────────────────────────────────────┘
                 │  intent percakapan → API
┌────────────────▼────────────────────────────────────────────────┐
│                       AI AGENT LAYER                             │
│  ┌──────────────────┐ ┌─────────────────┐ ┌───────────────────┐ │
│  │ AI Validation     │ │ AI Word Curator │ │ AI Odds Engine    │ │
│  │ Oracle            │ │ (LLM moderasi   │ │ (LLM probability  │ │
│  │ (Whisper STT +    │ │  + normalisasi +│ │  + community vote │ │
│  │  LLM matching)    │ │  dedup + filter)│ │  → price/mult.)   │ │
│  └────────┬─────────┘ └────────┬────────┘ └─────────┬─────────┘ │
│           │  signed txs (agent wallet, ERC-8004 identity)        │
└───────────┼────────────────────┼─────────────────────┼──────────┘
            │                    │                     │
┌───────────▼────────────────────▼─────────────────────▼──────────┐
│                  SMART CONTRACTS — MANTLE NETWORK                 │
│  EventFactory   — buat & konfigurasi event                       │
│  WordPool       — merkle root word pool final + odds             │
│  WordMarket     — buy position, parimutuel pool, Founder seed    │
│  OracleRegistry — commit validasi AI (kata, bukti, confidence)   │
│  BingoCardNFT   — mint card unik per user (ERC-721)              │
│  RewardVault    — settlement, bingo bonus, claim                 │
│  AgentIdentity  — ERC-8004 NFT untuk AI Oracle + reputasi        │
└──────────────────────────────────────────────────────────────────┘
```

**Stack:** Solidity (Foundry/Hardhat) · Next.js + wagmi/viem · Node.js agent service · Whisper (STT) · Claude API (matching, kurasi, odds) · Minds Capability SDK · Telegram Bot API · email gateway · Mantle Sepolia → Mainnet.

**Keamanan & fairness:**
- Word pool & odds dikunci via merkle root sebelum market buka.
- Oracle commit menyertakan bukti transkrip + confidence; dispute window sebelum settlement final.
- Satu wallet = satu card per event; rate-limit submission; semua deadline ditegakkan timestamp kontrak, bukan backend.
- Validation log lengkap on-chain: apa yang divalidasi, kapan, oleh agent mana, dengan bukti apa.

---

## 9. Flow Utama

### 9.1 Flow Singkat

```
Organizer membuat event (on-chain, EventFactory)
        ↓
User submit kata (maks 3/user) → submitter jadi Word Founder
        ↓
AI Word Curator: normalisasi → dedup → filter → ranking
        ↓
Word pool final (25 kata) + odds AI di-commit on-chain
        ↓
Founder dapat free seed + window founder-price awal
        ↓
Bingo Card NFT di-mint untuk tiap peserta
        ↓
Market publik dibuka — user buy posisi kata (MNT/USDC, gasless)
        ↓
Event mulai → market terkunci otomatis
        ↓
AI Validation Oracle mendengarkan live → commit kata
yang muncul ke OracleRegistry (+ bukti transkrip)
        ↓
Smart contract: mark semua card → deteksi pola bingo
        ↓
Dispute window singkat → settlement final
        ↓
RewardVault: prediction reward + bingo bonus → claim
        ↓
Leaderboard (termasuk Human vs AI) & share card (viral loop)
```

### 9.2 Flow User (via Capability)

1. Buka Bingocle Capability di Minds (atau DM bot Telegram / balas email) → social login atau connect wallet.
2. Pilih event aktif → baca tema & aturan.
3. Submit maksimal 3 kata yang diprediksi disebut → jadi Founder kata yang lolos pool.
4. Lihat hasil kurasi AI & ranking kata komunitas; klaim free Founder seed.
5. Terima Bingo Card NFT.
6. Opsional beli posisi lebih (founder price di window awal; odds berjalan setelahnya).
7. Event live: tonton card ter-mark real-time setiap AI memvalidasi kata; terima notifikasi Telegram/email.
8. Event selesai: claim reward, cek leaderboard, share hasil card.

### 9.3 Flow Organizer

1. Buat event dengan chat ke Capability (atau via dashboard): nama, tema, deskripsi, jadwal, ukuran card, reward pool (deposit MNT/USDC), sumber audio.
2. Buka fase submission → pantau kurasi AI (override sebagai moderator terakhir bila perlu).
3. Finalisasi word pool → window founder, lalu market publik terbuka otomatis.
4. Saat event mulai: hubungkan audio stream ke AI Oracle.
5. Setelah event: review dispute (jika ada) → settlement final otomatis.

---

## 10. Contoh Skenario Lengkap

**Event:** Mantle Builder Demo Day · Tema: Web3, AI, Startup · Reward pool: 1.000 USDC · Card 5×5.

1. 120 peserta submit kata. AI Curator menggabungkan `ai` / `Artificial Intelligence` → **AI** (38 vote), menolak 14 kata spam/di luar tema.
2. Word pool 25 kata + odds di-commit on-chain. *AI: 0.80 / 1.2× · Airdrop: 0.25 / 2.5×.*
3. User A submit "Airdrop" awal → Founder: 1 share gratis + beli 4 USDC lagi di harga founder 0.25. Via Capability Telegram juga beli **AI** 10 USDC. Card NFT-nya ter-mint.
4. Demo day berlangsung. Menit 12:30 pembicara berkata *"…kami pakai artificial intelligence untuk…"* → Oracle commit `AI ✅` + cuplikan transkrip + confidence 0.97 → semua card ter-mark otomatis.
5. Sepanjang event 14 kata tervalidasi. Card User A membentuk 1 line bingo.
6. Settlement: User A menerima 10 × 1.2 = 12 USDC (AI muncul) + payout Airdrop bila disebut + 50 USDC bonus bingo. Claim on-chain.
7. User A membagikan card hasil + profit ke X. Teman-temannya join event berikutnya.

---

## 11. Target Pengguna & Use Case

| Segmen | Use case |
|---|---|
| **Event/Conference Organizer** | Engagement layer — audiens aktif sepanjang acara |
| **Komunitas Web3 & DAO** | Side game saat AMA, community call, town hall |
| **Hackathon Organizer** | Game selama demo day & pitching (meta: bisa dimainkan saat demo day hackathon ini sendiri) |
| **Podcast & Livestreamer** | Penonton menebak kata yang akan diucapkan host/guest; notifikasi via Telegram |
| **Debat & Media** | Prediksi kata kunci kandidat/narasumber |
| **Edukasi** | Free-play mode: bingo materi pelajaran, reward poin |

---

## 12. Alignment dengan Kriteria Penilaian

Dipetakan ke **scorecard unified asli (Animoca / Consumer & Viral DApps)**, dengan estimasi diri yang jujur. Target: kena deskriptor band **"Excellent" (90–100)** verbatim di kedua bagian.

### 12.1 Part A — Mantle General (50 pts)

| Dimensi | Pts | Bagaimana Bingocle meraihnya | Estimasi |
|---|---|---|---|
| **Technical** | 15 | AI × on-chain end-to-end di Mantle: STT+LLM oracle menulis state ke kontrak; 7 kontrak terintegrasi; arsitektur agent + merkle commitment + dispute window | 11–13 |
| **Ecosystem fit** | 10 | Deploy & settle di Mantle; MNT/USDC sebagai aset game; AA/gasless; ERC-8004 agent identity; membawa audiens event Web2 on-chain | 8–9 |
| **Business potential** | 10 | Revenue: platform fee (2–5% pool), paket B2B organizer, sponsored word slot; GTM jelas dari event Web3 & komunitas Mantle | 7–8 |
| **Innovation** | 10 | Kategori baru: **AI speech oracle untuk prediction market konsumen** — belum ada padanan; bukan fork protokol | 9–10 |
| **UX** | 5 | Social login, gasless, channel-native (email+Telegram), format bingo yang semua orang paham | 4–5 |

*Target "Excellent":* "Breakthrough technical depth; seamless Mantle integration; production-ready with a clear and complete business logic loop." → loop submit→buy→validate→settle→claim harus jalan end-to-end di testnet, verified di Explorer.

### 12.2 Part B — Animoca: Consumer & Viral DApps (50 pts)

| Dimensi | Pts | Bagaimana Bingocle meraihnya | Estimasi |
|---|---|---|---|
| **Bazaar publish quality** | 12 | Capability dipublish ke Minds Bazaar: nama publik, ID publik, activation tanpa friksi; `/agent-guide` lengkap & akurat agar Mind mana pun bisa find/equip/invoke | 9–11 |
| **Channel-native UX** | 10 | Telegram Mini App + bot + flow email: join, main, menang tanpa meninggalkan chat — tanpa terminal, tanpa onboarding teknis, tanpa konteks builder eksternal | 8–9 |
| **Build-process transparency** | 10 | Seluruh percakapan build (thread email/Telegram user↔Mind, ide → Capability jadi) disertakan, menunjukkan pemecahan masalah iteratif asli | 7–9 |
| **Track-specific (Path A *atau* B)** | 13 | **Utama: Path A** — percakapan build menunjukkan masalah konsumen nyata (audiens pasif) di-refine & dipecahkan lewat interaksi Mind, Capability output alaminya. **Hedge: Path B** — `/agent-guide` direkayasa agar Mind user lain bisa equip & operasikan tanpa konteks (juri tes ini) | 9–11 |
| **Execution & demo quality** | 5 | Capability live di Bazaar; demo video ≥2 menit menunjukkan **Mind milik user berbeda** equip & main end-to-end; web app + kontrak live dengan URL publik | 4–5 |

*Target "Excellent" (Animoca):* "Capability is live on Bazaar, fully self-documenting via /agent-guide, and independently operable by any Mind; build conversation shows genuine iterative problem-solving; demo is compelling end-to-end."

> **Pilihan Path:** Deklarasikan **Path A (Consumer Capability)** sebagai utama — cerita build kuat. Tapi *rekayasa Path B juga*: `/agent-guide` antipeluru yang membuat Mind orang asing bisa menjalankan game melindungi slot 13-pt jika juri menguji reproducibility.

**Estimasi total: ~76–90 / 100** → band "Good" sampai "Excellent". Dua tuas terbesar: (1) artefak percakapan-build ditangkap & asli, dan (2) demo membuktikan Mind *berbeda* bisa menjalankannya.

### 12.3 Checklist Top-20 Deployment Award ($1.000)

- ✅ Smart contract di Mantle Testnet/Mainnet, **verified di Mantle Explorer**
- ✅ Fungsi AI callable on-chain: `OracleRegistry.commitValidation()` ditulis oleh AI agent
- ✅ Frontend publik (Vercel) — bukan localhost
- ✅ Alamat deployment dicantumkan di submission
- ✅ Demo video ≥ 2 menit (walkthrough use case inti)
- ✅ Repo GitHub open-source + README (setup, arsitektur, alamat kontrak)

### 12.4 Best UI/UX ($3.000) & 12.5 Community Voting ($8.500) — sekunder

Visual playful-tapi-clean; flow 3 langkah (submit → buy → watch); **AI Interaction Design** (kutipan transkrip + "kenapa AI yakin"); free-play tanpa wallet. Untuk Community Voting: share-card viral loop, demo yang dipahami non-teknis dalam 15 detik, dan game yang *bisa dimainkan komunitas selama masa voting*.

---

## 13. Model Bisnis

1. **Platform fee** — 2–5% dari reward pool setiap event berbayar.
2. **B2B event package** — organizer membayar untuk white-label + dukungan oracle (audio setup, kurasi premium).
3. **Sponsored words** — brand mensponsori kata/slot di card untuk event besar (native advertising playful).
4. **Lanjutan** — reward pool ditempatkan di aset yield-bearing Mantle (mETH) selama event; yield menambah prize pool.

---

## 14. Scope MVP & Sprint 5 Hari (deadline 15 Juni, 15:59)

> **Realita: ~5 hari dari 10 Juni.** Part B (50 pts) sepenuhnya di Minds Capability, jadi MVP **dimulai dari Capability** dan memperlakukan chain sebagai tulang punggung yang dipanggilnya. Kirim vertical slice end-to-end tertipis; depth opsional.

### Wajib (core demo)

1. ✅ **Bingocle Capability di Minds Bazaar** — nama/ID publik, activation message, berjalan di **Telegram (email bila sempat)**, `/agent-guide` lengkap
2. ✅ **Percakapan build yang ditangkap** (thread user↔Mind) — *artefak yang dinilai; tangkap sekarang*
3. ✅ `EventFactory`, `WordMarket` (dengan Founder seed), `OracleRegistry`, `RewardVault` di **Mantle Sepolia** — verified di Explorer (`BingoCardNFT` opsional → bisa mapping untuk slice)
4. ✅ **AI Word Curator** (normalisasi + dedup + filter) + **AI Odds Engine** via Claude API
5. ✅ **AI Validation Oracle**: Whisper STT + LLM matching → commit on-chain — **demo dengan audio rehearsed/rekaman**, bukan live-only
6. ✅ Web app: join, submit, lihat card, buy (buy-only), live marking, claim
7. ✅ Frontend publik + demo video ≥2 menit (**menunjukkan Mind user berbeda equip Capability**) + README
8. ✅ ERC-8004 identity NFT untuk oracle agent

### Hari-per-hari (agresif; potong bila perlu)

| Hari | Fokus |
|---|---|
| **10–11 Jun** | Skeleton kontrak di Sepolia; skeleton Capability di Minds; **mulai tangkap build-chat** |
| **12 Jun** | Curator + Odds + Founder seed; jalur commit Oracle (Whisper+Claude); core web app |
| **13 Jun** | Wire Capability ↔ kontrak via Telegram; live marking; draf `/agent-guide` |
| **14 Jun** | Tes `/agent-guide` dengan Mind bersih (Path B); rekam demo oracle; share-card |
| **15 Jun (sebelum 15:59)** | Demo video (Mind *berbeda* equip); README; verify di Explorer; **submit X thread #MantleAIHackathon + BUIDL DoraHacks** |

### Kalau solo / waktu sangat mepet — thin slice
Capability + 3 kontrak (`EventFactory`, `WordMarket`, `OracleRegistry`) + demo oracle rekaman. Drop email (Telegram saja), drop `BingoCardNFT` (pakai mapping + render gambar), drop leaderboard. **Jangan pernah drop:** Capability terpublish, `/agent-guide`, percakapan build, dan demo "Mind berbeda" — itu separuh 50 poin.

### Di luar scope (roadmap)
Sell/exit & AMM pricing dinamis · multi-oracle consensus · yield-bearing pool (mETH) · mobile app native · oracle multibahasa.

---

## 15. Timeline & Hadiah

| Milestone | Tanggal |
|---|---|
| Phase I — ClawHack ($20k) | 15–30 April 2026 (tutup) |
| **Deadline submission Phase II — AI Awakening** | **15 Juni 2026, 15:59** *(konfirmasi timezone di DoraHacks)* |
| Demo Day (finalis, livestream) | **2–3 Juli 2026** |
| Awards ceremony | **10 Juli 2026** |

**Prize pool (Phase II, total $100k):** Grand Champion $9.000 · 6 Track Winner × $8.500 · 2 Community Voting × $8.500 · Best UI/UX $3.000 · Top-20 Deployment × $1.000. Plus ~$110k computing credits lintas provider.

**Metode submission:** post X thread tag **#MantleAIHackathon** dengan pitch + demo video + link GitHub + alamat kontrak Mantle, dan submit BUIDL di DoraHacks. *(Konfirmasi format pasti di halaman live — halaman `/detail` JS-gated dan tidak bisa di-fetch langsung; fakta ini dari laporan sekunder tentangnya.)*

---

## 16. Roadmap Pasca-Hackathon

| Fase | Target |
|---|---|
| **Q3 2026** | Mainnet launch; 10 event komunitas Mantle pertama; Telegram Mini App + email penuh |
| **Q4 2026** | B2B organizer dashboard; sponsored words; multi-oracle consensus |
| **Q1 2027** | SDK "Speech Oracle as a Service" — protokol lain memakai oracle Bingocle untuk market berbasis ucapan/event live |

Visi jangka panjang: **Bingocle menjadi infrastruktur speech-oracle pertama di Web3** — bingo adalah produk konsumen pertamanya, bukan yang terakhir.

---

## 17. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| **5 hari sangat mepet** | Thin vertical slice (§14); Capability + demo oracle rekaman dulu |
| **Terlalu banyak** (oracle penuh *dan* Capability rapi) | MVP Capability-first; chain = tulang punggung, bukan pertunjukan |
| **Part B = 50% dan kerja baru** tak terkait chain | Perlakukan Capability, `/agent-guide`, build-chat sebagai deliverable utama |
| **Demo oracle live rapuh** (STT salah, mic jelek) | Demo audio rehearsed/rekaman; threshold confidence + dispute window |
| **Tes reproducibility Path B gagal** | Latih `/agent-guide` dengan Mind bersih tanpa konteks builder |
| **Artefak percakapan-build terlupa** | Tangkap thread user↔Mind sejak hari pertama (hingga 10 pts) |
| **Optik "judi"** | Lead free-play mode; staked opsional |
| **Over-claim "AI on-chain"** | Sebut presisi: agent ERC-8004 commit verdict on-chain; inference off-chain |
| **Persepsi "Polymarket clone"** | Lead pitch dengan bingo + AI speech oracle + kata submisi komunitas (§4) |

---

## 18. Submission Checklist (DoraHacks)

- [ ] **Bingocle Capability live di Minds Bazaar** (nama publik, ID publik, activation message, `/agent-guide`)
- [ ] **Percakapan build disertakan** (thread email/Telegram, ide → Capability jadi)
- [ ] **Demo video ≥ 2 menit menunjukkan Mind user *berbeda*** equip & main end-to-end
- [ ] Repo GitHub publik: kontrak + agent + frontend, README (setup, arsitektur, alamat kontrak)
- [ ] Kontrak deployed & **verified** di Mantle Explorer (cantumkan semua alamat)
- [ ] Live demo URL (Vercel) — dapat diakses publik
- [ ] Pitch deck (masalah, solusi, demo, arsitektur, business model, roadmap)
- [ ] Nominasi track: **Consumer & Viral DApps**
- [ ] **X thread tag #MantleAIHackathon** dengan pitch + demo video + repo + alamat kontrak Mantle
- [ ] BUIDL ter-submit di DoraHacks sebelum **15 Juni, 15:59**
```
