'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { fetchBalances, type BalanceSnapshot } from '@/lib/balances';
import { signTransactionWithFreighter } from '@/lib/freighter';
import { buildXlmPaymentXdr, submitSignedPaymentXdr, waitForPaymentConfirmation } from '@/lib/payment';
import {
  CANTEEN_MERCHANT_ADDRESS,
  CANTEEN_MERCHANT_NAME,
  DEMO_FREIGHTER_WALLET_ADDRESS,
} from '@/lib/stellar';

type PaymentPhase =
  | 'idle'
  | 'preparing'
  | 'signing'
  | 'submitting'
  | 'confirming'
  | 'confirmed'
  | 'error';

type Receipt = {
  hash: string;
  ledger: number;
  amount: string;
  merchant: string;
};

const PAYMENT_PHASE_LABEL: Record<PaymentPhase, string> = {
  idle: 'Ready to pay',
  preparing: 'Preparing transaction…',
  signing: 'Waiting for Freighter…',
  submitting: 'Submitting to Stellar…',
  confirming: 'Confirming on-chain…',
  confirmed: 'Payment confirmed',
  error: 'Payment failed',
};

function formatMerchant(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

function buildMockQrMatrix(seed: string): boolean[][] {
  const size = 21;
  const matrix = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const hash = seed.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);

  const paintFinderPattern = (startRow: number, startColumn: number) => {
    for (let row = 0; row < 7; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        const isBorder = row === 0 || row === 6 || column === 0 || column === 6;
        const isCenter = row >= 2 && row <= 4 && column >= 2 && column <= 4;
        matrix[startRow + row][startColumn + column] = isBorder || isCenter;
      }
    }
  };

  paintFinderPattern(0, 0);
  paintFinderPattern(0, size - 7);
  paintFinderPattern(size - 7, 0);

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const inFinderPattern =
        (row < 7 && column < 7) ||
        (row < 7 && column >= size - 7) ||
        (row >= size - 7 && column < 7);

      if (inFinderPattern) {
        continue;
      }

      const sourceIndex = (row * size + column + hash) % seed.length;
      const sourceValue = seed.charCodeAt(sourceIndex);
      matrix[row][column] = (sourceValue + row + column + hash) % 2 === 0;
    }
  }

  return matrix;
}

const QR_MATRIX = buildMockQrMatrix(CANTEEN_MERCHANT_ADDRESS);

export default function Home() {
  const { publicKey, connecting, error: walletError, connect, disconnect } =
    useWallet();
  const [balances, setBalances] = useState<BalanceSnapshot | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [amount, setAmount] = useState('1.00');
  const [paymentPhase, setPaymentPhase] = useState<PaymentPhase>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setBalances(null);
      setBalancesError(null);
      setBalancesLoading(false);
      return;
    }

    let isActive = true;
    setBalancesLoading(true);
    setBalancesError(null);

    fetchBalances(publicKey)
      .then((snapshot) => {
        if (isActive) {
          setBalances(snapshot);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setBalancesError(
            error instanceof Error ? error.message : 'Failed to load balances.',
          );
          setBalances(null);
        }
      })
      .finally(() => {
        if (isActive) {
          setBalancesLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [publicKey, refreshCount]);

  const refreshBalances = () => {
    setRefreshCount((current) => current + 1);
  };

  // XLM payments do not require trustlines; ensure balance check before submit.

  const handlePayment = async () => {
    if (!publicKey) {
      return;
    }

    setPaymentError(null);
    setReceipt(null);
    setPaymentPhase('preparing');

    try {
      // Basic XLM balance check
      if (balances) {
        const available = Number.parseFloat(balances.xlmBalance || '0');
        const parsed = Number.parseFloat(amount);
        if (!Number.isFinite(parsed) || parsed <= 0) throw new Error('Enter a valid XLM amount.');
        if (available < parsed) throw new Error(`Insufficient XLM balance. Available: ${available.toFixed(7)}.`);
      }

      const xdr = await buildXlmPaymentXdr(publicKey, CANTEEN_MERCHANT_ADDRESS, amount);

      setPaymentPhase('signing');
      const signedXdr = await signTransactionWithFreighter(xdr, publicKey);

      setPaymentPhase('submitting');
      const hash = await submitSignedPaymentXdr(signedXdr);

      setPaymentPhase('confirming');
      const confirmation = await waitForPaymentConfirmation(hash);

      setReceipt({
        hash: confirmation.hash,
        ledger: confirmation.ledger,
        amount: Number.parseFloat(amount).toFixed(2),
        merchant: CANTEEN_MERCHANT_ADDRESS,
      });
      setPaymentPhase('confirmed');
      refreshBalances();
    } catch (error: unknown) {
      setPaymentPhase('error');
      setPaymentError(
        error instanceof Error ? error.message : 'The canteen payment failed.',
      );
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.88),rgba(247,240,227,0.9))] p-6 shadow-[0_24px_80px_rgba(28,37,56,0.12)] backdrop-blur md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-600">
                Testnet school lunch demo
              </div>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  ByteBite: The school canteen digital wallet
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Connect a student or parent Freighter wallet, review the digital
                  allowance balance, and send an XLM lunch payment to the canteen
                  merchant on Stellar testnet.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-slate-50 shadow-lg shadow-slate-900/15">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Connection
              </p>
              {publicKey ? (
                <div className="mt-3 space-y-4">
                  <div>
                    <p className="text-sm text-slate-300">Connected wallet</p>
                    <p className="mt-1 break-all font-mono text-sm text-white">
                      {publicKey}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={disconnect}
                      className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
                    >
                      Disconnect
                    </button>
                    <button
                      type="button"
                      onClick={refreshBalances}
                      className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                    >
                      Refresh balance
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-4">
                  <p className="text-sm leading-6 text-slate-300">
                      Connect Freighter to use the payment terminal.
                    </p>
                    {DEMO_FREIGHTER_WALLET_ADDRESS && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                        Demo wallet
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-300">
                        {DEMO_FREIGHTER_WALLET_ADDRESS}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={connect}
                    disabled={connecting}
                    className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {connecting ? 'Connecting…' : 'Connect Freighter'}
                  </button>
                </div>
              )}
              {walletError && (
                <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                  {walletError}
                </p>
              )}
              
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(28,37,56,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Balance dashboard
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Student allowance
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Stellar testnet
              </span>
            </div>

            {!publicKey ? (
                <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                Once Freighter is connected, this panel shows the student wallet XLM balance.
              </p>
            ) : balancesLoading ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            ) : balancesError ? (
              <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                {balancesError}
              </p>
            ) : balances ? (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      XLM balance
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">
                      {balances.xlmBalance}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Other assets
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">
                      {balances.usdcBalance}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {balances.accountExists ? (
                    balances.hasUsdcTrustline ? (
                      <span>
                        The wallet is ready to receive and spend USDC on testnet.
                      </span>
                    ) : (
                      <span>
                        This wallet does not yet show a USDC trustline on-chain. The
                        payment flow works once the allowance account can hold USDC.
                      </span>
                    )
                  ) : (
                    <span>
                      The connected wallet does not exist on testnet yet. Fund it
                      before trying the lunch payment.
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-slate-50 shadow-[0_18px_50px_rgba(28,37,56,0.15)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Canteen payment terminal
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Pay for lunch in XLM
                </h2>
              </div>
              <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
                Main Canteen Merchant Address
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
              <div className="rounded-[1.5rem] border border-slate-800 bg-white p-4">
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: 'repeat(21, minmax(0, 1fr))',
                  }}
                  aria-hidden="true"
                >
                  {QR_MATRIX.flatMap((row, rowIndex) =>
                    row.map((filled, columnIndex) => (
                      <span
                        key={`${rowIndex}-${columnIndex}`}
                        className={filled ? 'aspect-square rounded-[2px] bg-slate-950' : 'aspect-square rounded-[2px] bg-transparent'}
                      />
                    )),
                  )}
                </div>
                <p className="mt-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                  Demo QR code
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Merchant
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {CANTEEN_MERCHANT_NAME}
                  </p>
                  <p className="mt-1 break-all font-mono text-sm text-slate-300">
                    {CANTEEN_MERCHANT_ADDRESS}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {formatMerchant(CANTEEN_MERCHANT_ADDRESS)}
                  </p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">
                    Lunch amount (XLM)
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.0000001"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="1.00"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </label>

                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={
                    !publicKey ||
                    paymentPhase === 'preparing' ||
                    paymentPhase === 'signing' ||
                    paymentPhase === 'submitting' ||
                    paymentPhase === 'confirming'
                  }
                  className="w-full rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Pay Canteen
                </button>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm leading-6 text-slate-300">
                  <p className="font-medium text-slate-100">Lifecycle</p>
                  <p className="mt-1">{PAYMENT_PHASE_LABEL[paymentPhase]}</p>
                </div>
              </div>
            </div>

            {paymentError && (
              <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                {paymentError}
              </p>
            )}
          </article>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(28,37,56,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                On-chain receipt
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Payment confirmation
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {PAYMENT_PHASE_LABEL[paymentPhase]}
            </span>
          </div>

          {receipt ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Status
                </p>
                <p className="mt-3 text-2xl font-semibold text-emerald-900">
                  Payment confirmed
                </p>
                <p className="mt-2 text-sm text-emerald-800">
                  Lunch paid successfully on Stellar testnet.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:col-span-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Amount
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {receipt.amount} XLM
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Ledger
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      #{receipt.ledger}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Transaction hash
                    </p>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${receipt.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block break-all font-mono text-sm text-slate-800 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-800"
                    >
                      {receipt.hash}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              The receipt will appear here after the payment is signed, submitted,
              and confirmed on-chain.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
