# School Canteen Digital Wallet

A minimal demo that lets students or parents pay for school canteen purchases using XLM on Stellar testnet.

## Problem
Many small school canteens in the Philippines still rely on cash or paper vouchers. This creates friction, limits transparency, and makes tracking student allowances hard for parents and canteen operators. The School Canteen Digital Wallet demonstrates a low-friction digital payment flow for micro-payments using the Stellar network that can be integrated into school workflows or expanded into allowance management and reporting.

Who has this problem? Students, parents, school canteen staff, and administrators in schools where cash management is inconvenient or insecure.

Why it matters (Philippines relevance): Schools and parents in the Philippines increasingly use digital tools, but many projects focus on remittance or large-value transfers. Micro-payments for everyday needs (school lunches, photocopy credits) are an underserved space where Stellar's low-fee, fast payments can provide immediate practical benefits.

## How It Works
1. A student or parent connects their Freighter wallet to the web app.
2. The wallet can be funded on testnet using Friendbot (development/demo only).
3. The user enters a lunch amount and hits Pay.
4. The app builds an XLM payment transaction, the user signs via Freighter, and the transaction is submitted to Stellar testnet.
5. The app polls for finality and displays a receipt with ledger and transaction hash.

This repo contains a minimal UI for the above flow plus optional supporting utilities (balance fetch, Friendbot funding helper).

## How It Uses Stellar
- Payments: native XLM payments are used to keep the flow simple and avoid trustline setup for demo participants.
- Horizon RPC: account lookups and balance reads use Horizon.
- Soroban RPC: the repo includes a small Soroban contract scaffold (savings-goal) as an optional track — not required for the XLM payment demo.

Why Stellar: Stellar provides instant, low-fee payments with mature tooling (Horizon, Freighter) and simple asset management when needed. For micro-payments in local contexts, its low fees and predictable finality are ideal compared to slower or costlier alternatives.

## Track
Fullstack payments (StellarX Philippines track)

## Tech Stack
- Framework: Next.js (App Router) + React + TypeScript
- Stellar SDK: @stellar/stellar-sdk v14.x (Horizon + rpc namespaces)
- Wallet: @stellar/freighter-api v6 (dynamic import for SSR safety)
- UI: Tailwind CSS v4
- Network: testnet (default for demo)

## Setup & Run
Follow these steps to run the demo locally.

```bash
git clone [your repo]
cd [your project]
cd web
npm install
# environment variables you may set in web/.env.local (defaults provided):
#   NEXT_PUBLIC_SOROBAN_RPC=https://soroban-testnet.stellar.org
#   NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
#   NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
#   NEXT_PUBLIC_CANTEEN_MERCHANT_ADDRESS= (merchant public key)
#   NEXT_PUBLIC_DEMO_FREIGHTER_WALLET_ADDRESS= (demo wallet public key)
npm run dev

# Open http://localhost:3000 (or the port Next reports) and connect Freighter.
```

To build a production bundle:

```bash
cd web
npm run build
```

## Network Details
- Network: testnet
- RPC URL: https://soroban-testnet.stellar.org
- Horizon URL: https://horizon-testnet.stellar.org
- Contract IDs: none required for XLM demo (optional: `contracts/savings-goal` for Soroban track)
- Asset issuers: optional USDC issuer present in the repo for extended demos: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`

## Team
- [Your Name] — @[github-username]

## License
MIT

