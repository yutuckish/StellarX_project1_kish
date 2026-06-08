import { Asset, Horizon, Networks, rpc } from '@stellar/stellar-sdk';

export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC ?? 'https://soroban-testnet.stellar.org';

export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';

export const USDC_ISSUER =
  process.env.NEXT_PUBLIC_USDC_ISSUER ??
  'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

export const CANTEEN_MERCHANT_ADDRESS =
  process.env.NEXT_PUBLIC_CANTEEN_MERCHANT_ADDRESS ?? USDC_ISSUER;

export const DEMO_FREIGHTER_WALLET_ADDRESS =
  process.env.NEXT_PUBLIC_DEMO_FREIGHTER_WALLET_ADDRESS ?? '';

export const CANTEEN_MERCHANT_NAME = 'Main Canteen Merchant';

export const rpcServer = new rpc.Server(RPC_URL);
export const horizonServer = new Horizon.Server(HORIZON_URL);

export const XLM = Asset.native();
export const USDC = new Asset('USDC', USDC_ISSUER);

export async function fundTestnetAccount(publicKey: string): Promise<void> {
  const response = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`,
  );

  if (!response.ok && response.status !== 400) {
    throw new Error('Friendbot funding failed. Try again in a moment.');
  }
}
