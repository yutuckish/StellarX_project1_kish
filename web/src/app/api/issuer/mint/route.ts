import { NextResponse } from 'next/server';
import { Asset, BASE_FEE, Keypair, Operation, TransactionBuilder } from '@stellar/stellar-sdk';
import { NETWORK_PASSPHRASE, USDC_ISSUER, horizonServer } from '@/lib/stellar';

type RequestBody = {
  to: string;
  amount: string;
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ISSUER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Server not configured: missing ISSUER_API_KEY' }, { status: 500 });
    }

    const provided = req.headers.get('x-api-key');

    if (provided !== apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as RequestBody;

    if (!body?.to || !body?.amount) {
      return NextResponse.json({ error: 'Missing `to` or `amount` in request body' }, { status: 400 });
    }

    const issuerSecret = process.env.USDC_ISSUER_SECRET;

    if (!issuerSecret) {
      return NextResponse.json({ error: 'Server not configured: missing USDC_ISSUER_SECRET' }, { status: 500 });
    }

    const issuer = Keypair.fromSecret(issuerSecret);
    const account = await horizonServer.loadAccount(issuer.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: body.to,
          asset: new Asset('USDC', USDC_ISSUER),
          amount: Number.parseFloat(body.amount).toFixed(2),
        }),
      )
      .setTimeout(60)
      .build();

    tx.sign(issuer);

    const submitResult = await horizonServer.submitTransaction(tx);

    return NextResponse.json({ hash: submitResult.hash, ledger: submitResult.ledger });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
