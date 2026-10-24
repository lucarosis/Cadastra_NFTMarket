# Decisions — Stage 0

Answers to the questions in the Feasibility Analysis and Implementation Plan (21 September 2026),
section 3. Later stages are built against what is recorded here; change an answer here first.

| # | Question | Working assumption | Decision | Decided by / date |
| --- | --- | --- | --- | --- |
| Q1 | Does "Tezer" mean Tezos (XTZ, "tez")? | Yes — Tezos. Avoid the word "Tezer" in public copy (an unrelated BNB Smart Chain token uses it and is flagged as a likely honeypot). | **Yes — Tezos (XTZ)** | Product owner · 22 September 2026 |
| Q2 | Is Terra Ledger issuing its own token, or promoting tez? | Promoting tez only | **Yes — promoting tez only** | Product owner · 22 September 2026 |
| Q3 | What goes "at the far right"? | The Connect Wallet button, right-most in the header on every page | **Yes**, plus: WalletConnect required for login, and a wallet balance of ~US$100 required to register | Product owner · 22 September 2026 |
| Q4 | Do sales staff sign in with a wallet? | No — staff keep email login with 2FA at /staff | **Yes — staff keep email login + 2FA** | Product owner · 22 September 2026 |
| Q5 | Are real-estate NFTs collectibles or claims on real property? | Collectibles and architecture art at launch; property-backed only after legal approval | **Real estate is purchasable**, not collectibles-only: holders with sufficient tokens can buy property | Product owner · 22 September 2026 |
| Q6 | Must the 100+ works be minted on-chain at launch? | Listed at launch; minted at first sale (lazy minting) | **Yes — lazy minting at first sale** | Product owner · 22 September 2026 |
| Q7 | How is "unique" counted for the 100+ works? | 100+ distinct pieces; a generative series counts as one | **Yes — 100+ distinct pieces**; a generative series counts as one | Product owner · 22 September 2026 |
| Q8 | Which markets launch first? | To be decided | **Multiple countries; no preparation needed yet** | Product owner · 22 September 2026 |
| D1 | Artwork visibility on-chain (plan section 4.6) | Option B — public watermarked preview; full artwork to the token holder only | **Pending** | Product owner · 22 September 2026 |

## Stage 0 actions outside the codebase

| Action | Owner | Status |
| --- | --- | --- |
| Make `Sakura-tech55/TerraNFT_Marketplace` private | Repository owner | _pending approval_ |
| Remove the 16 committed images from git history (rewrite + force-push) | Repository owner | _optional — placeholders are Unsplash images_ |
| Set `SESSION_SECRET` in every deployed environment | Whoever deploys | _pending_ |
| Send the legal review brief (plan step 0.3) | Product owner | _pending_ |

## Follow-ups raised by the answers

| Ref | Item | Status |
| --- | --- | --- |
| D2 | **Wallet-balance gate at registration — $50, all cryptocurrencies, any network.** Confirmed 24 September 2026: connection proceeds once the wallet's holdings are worth more than US$50. WalletConnect imposes no such requirement; this is a Terra Ledger rule. See D4 for what "any network" can mean in practice. | **Confirmed — threshold US$50** |
| D3 | **Wallet standard.** WalletConnect v2 reaches Kukai; Temple (the most common Tezos wallet) uses the native Beacon / octez.connect standard. Recommendation: support both, Beacon first. | Awaiting confirmation — needed for Stage 3 |
| R-LEGAL | **Real-estate purchase (Q5).** Tokens that convey an interest in real property are treated as securities in most markets, which changes registration, disclosure and who may buy. Counsel must confirm the structure before property-backed tokens are sold. | Blocking for property-backed sales only; collectible and architecture works are unaffected |

| D4 | **"All cryptocurrencies, any network" — scope.** A Tezos connection reveals only a Tezos address; an EVM connection reveals one address that is valid across all EVM chains. Balances on chains whose address we never receive cannot be read at all. Practical reading: value the holdings we can see (Tezos plus the major EVM chains) and count the total against the $50 threshold. Needs confirmation of the chain list and the data provider. | Awaiting confirmation — Stage 3 |
| D5 | **Members-only marketplace.** Nothing but the landing page is visible before sign-in. Kept public: `/`, `/login`, `/register`, `/tezos` (a visitor needs it to get a wallet) and `/review/<token>` (designers have no account). Trade-off accepted: market pages are not indexed by search engines and shared links show no preview. | **Decided** · Product owner · 9 October 2026 |
| D6 | **Watermark text** is the site name, "Terra Ledger", taken from `APP_NAME`. | **Decided** · Product owner · 9 October 2026 |
| D7 | **Creator portraits.** The ten editorial creators stay (famous artists, not affiliated). Each portrait must show that creator: imported only with a licence, a credit and the name of the person who confirmed it; never for Pak or XCOPY, who are anonymous. | **Decided** · Product owner · 9 October 2026 — photos to be supplied |
| D3a | WalletConnect is wired through Beacon and switches on with `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`. Needs a project ID from cloud.reown.com. | Built · awaiting project ID |
| D8 | **Catalogue sources.** Works found online come only from public-domain / CC0 collections (The Met Open Access), with source and licence on every work; NFTs owned by others are never listed. The website's own assets are included as published. | **Decided** · 9 October 2026 |
| D9 | **Website images are Unsplash stock.** The six artworks and six properties on terraledger.org use Unsplash photos. Before sale, replace them with the actual artworks and property photographs. | **Open** · product owner |
| D10 | **Creator photos** supplied by the product owner (rights secured): Pak and XCOPY are shown as avatars (artwork), not portraits. Beeple and Larva Labs are 92 px — replace with larger files. Larva Labs and Yuga Labs show one person each: name who in the caption. | **Open** · product owner |
| D11 | **Wallet connection switched off.** Wallet sign-in, WalletConnect and the $50 balance rule (D2) are removed; only the Connect wallet button stays, as "coming soon". Accounts are email and password, open to anyone, and every page opens once signed in. Wallet connection and on-chain purchases are for the blockchain engineer. Supersedes D2 and D3 for now. | **Decided** · Product owner · 9 October 2026 |
| D12 | **Artists:** 5 on the landing page; all 10 on /creators as an automatic slideshow, with smaller photos. | **Decided** · Product owner · 9 October 2026 |
| D13 | **Marketplace name: Cadastra** ("Cadastra by Terra Ledger"). Terra Ledger remains the company: ©, legal notices and the image watermark (D6). The member pass is the Cadastra Pass. | **Decided** · Product owner · 9 October 2026 |
| P1 | **Git is handled by the product owner.** Claude does not commit, stage or push; each stage is left as working-tree changes for review. | Standing instruction · 24 September 2026 |
