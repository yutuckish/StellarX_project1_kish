import { USDC_ISSUER, horizonServer } from './stellar';

export interface BalanceSnapshot {
  xlmBalance: string;
  usdcBalance: string;
  accountExists: boolean;
  hasUsdcTrustline: boolean;
}

function formatBalance(value: string): string {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
}

export async function fetchBalances(address: string): Promise<BalanceSnapshot> {
  try {
    const account = await horizonServer.loadAccount(address);

    let xlmBalance = '0.00';
    let usdcBalance = '0.00';
    let hasUsdcTrustline = false;

    for (const balance of account.balances) {
      if (balance.asset_type === 'native') {
        xlmBalance = formatBalance(balance.balance);
        continue;
      }

      const isUsdcTrustline =
        (balance.asset_type === 'credit_alphanum4' ||
          balance.asset_type === 'credit_alphanum12') &&
        balance.asset_code === 'USDC' &&
        balance.asset_issuer === USDC_ISSUER;

      if (isUsdcTrustline) {
        hasUsdcTrustline = true;
        usdcBalance = formatBalance(balance.balance);
      }
    }

    return {
      xlmBalance,
      usdcBalance,
      accountExists: true,
      hasUsdcTrustline,
    };
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;

    if (status === 404 || (error as { name?: string })?.name === 'NotFoundError') {
      return {
        xlmBalance: '0.00',
        usdcBalance: '0.00',
        accountExists: false,
        hasUsdcTrustline: false,
      };
    }

    throw error;
  }
}
