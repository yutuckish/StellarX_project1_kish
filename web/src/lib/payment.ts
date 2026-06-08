import { Asset, BASE_FEE, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { NETWORK_PASSPHRASE, horizonServer, rpcServer } from './stellar';

const POLL_INTERVAL_MS = 1000;

export interface PaymentReceipt {
  hash: string;
  ledger: number;
}

export async function buildXlmPaymentXdr(
  sender: string,
  destination: string,
  amount: string,
): Promise<string> {
  const parsedAmount = Number.parseFloat(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Enter a valid XLM amount.');
  }

  const account = await horizonServer.loadAccount(sender);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount: parsedAmount.toFixed(7),
      }),
    )
    .setTimeout(60)
    .build();

  return transaction.toXDR();
}

export async function submitSignedPaymentXdr(signedXdr: string): Promise<string> {
  const transaction = TransactionBuilder.fromXDR(
    signedXdr,
    NETWORK_PASSPHRASE,
  );
  const response = await rpcServer.sendTransaction(transaction);

  if (response.status === 'ERROR') {
    throw new Error('Payment submission was rejected by the network.');
  }

  if (!response.hash) {
    throw new Error('The network did not return a transaction hash.');
  }

  return response.hash;
}

export async function waitForPaymentConfirmation(
  hash: string,
  timeoutMs = 60_000,
): Promise<PaymentReceipt> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await rpcServer.getTransaction(hash);

    if (result.status === 'SUCCESS') {
      return {
        hash,
        ledger: Number(result.ledger ?? 0),
      };
    }

    if (result.status === 'FAILED') {
      throw new Error('The payment failed on-chain.');
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error('The payment was not confirmed within 60 seconds.');
}
