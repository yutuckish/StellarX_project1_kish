import { NETWORK_PASSPHRASE } from './stellar';

const TIMEOUT_MS = 3000;

type FreighterConnectedState = {
  isConnected: boolean;
};

function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), TIMEOUT_MS);
    }),
  ]);
}

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string' && error.trim()) {
    return new Error(error);
  }

  return new Error(fallback);
}

export async function connectFreighter(): Promise<string> {
  const freighter = await import('@stellar/freighter-api');
  const connected = await withTimeout(
    freighter.isConnected(),
    { isConnected: false } satisfies FreighterConnectedState,
  );

  if (!connected.isConnected) {
    throw new Error('Freighter is not available. Install the wallet extension first.');
  }

  const access = await freighter.requestAccess();

  if (access.error) {
    throw normalizeError(access.error, 'Freighter connection was rejected.');
  }

  if (!access.address) {
    throw new Error('Freighter did not return an address.');
  }

  return access.address;
}

export async function signTransactionWithFreighter(
  xdr: string,
  address: string,
): Promise<string> {
  const freighter = await import('@stellar/freighter-api');
  const signed = await freighter.signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address,
  });

  if ('error' in signed && signed.error) {
    throw normalizeError(signed.error, 'Freighter rejected the signature request.');
  }

  if (!('signedTxXdr' in signed) || !signed.signedTxXdr) {
    throw new Error('Freighter did not return a signed transaction.');
  }

  return signed.signedTxXdr;
}