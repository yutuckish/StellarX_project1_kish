# ByteBite — The School Canteen Digital Wallet

Connect a student or parent Freighter wallet, review a digital allowance balance, and send quick XLM lunch payments to the canteen merchant on Stellar testnet.

## Problem
Many school canteens still use cash or paper vouchers, making daily reconciliation slow, error-prone, and opaque for parents and school staff. ByteBite provides a lightweight digital payment flow for micro‑payments (lunches, snacks, small supplies), improving transparency, reducing loss/theft risk, and making allowance tracking easy — especially useful for pilot programs in Philippine schools.

## How It Works
1. User opens the web app and connects their Freighter wallet.  
2. If needed, the developer/demo uses Friendbot to top up the wallet on testnet.  
3. The user enters a lunch amount and taps Pay.  
4. The app builds an XLM payment transaction and prompts the user to sign via Freighter.  
5. After submission the app polls the RPC/Horizon endpoint until finality and displays a concise receipt.

## How It Uses Stellar
- Native XLM payments for instant, low-fee micro-payments.  
- Horizon for account lookups and balance reads.  
- Soroban RPC available for optional contract interactions (this repo includes a small `savings-goal` scaffold as an optional track).  
- Freighter (dynamic import) for client-side signing (`signTransaction()` -> `signedTxXdr`).  
- Friendbot for funding demo wallets on testnet.  
- Finality polling via `rpcServer.getTransaction(hash)` (1s interval, up to 60s).

Why Stellar: predictable, low-cost micro-payments with mature client tooling (Freighter + Horizon + Soroban) make it a natural fit for everyday, low-value school payments.

## Track
Track 2 — Financial Inclusion & Everyday Payments

## Tech Stack
- Framework: Next.js (App Router) + React + TypeScript  
- Stellar SDK: `@stellar/stellar-sdk` v14.x (Horizon + rpc)  
- Wallet: `@stellar/freighter-api` v6 (dynamic import)  
- UI: Tailwind CSS v4  
- Network: testnet (default for demo)

## Setup & Run
1. Clone the repo and install dependencies:
```bash
git clone <your-repo-url>
cd <your-project>
cd web
npm install