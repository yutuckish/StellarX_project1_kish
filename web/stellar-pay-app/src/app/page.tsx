export default function Home() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(247,240,227,0.92))] p-6 shadow-[0_24px_80px_rgba(28,37,56,0.12)] backdrop-blur md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-600">
                Testnet school lunch demo
              </div>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  School Canteen Digital Wallet
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Demo layout for the canteen wallet. Open the main `web` app for the
                  full Freighter and Stellar flow.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-slate-50 shadow-lg shadow-slate-900/15">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Connection
              </p>
              <div className="mt-3 space-y-4">
                <p className="text-sm leading-6 text-slate-300">
                  Connect Freighter in the main app to use the payment terminal.
                </p>
                <button
                  type="button"
                  className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                >
                  Connect Freighter
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(28,37,56,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Balance dashboard
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Student allowance
            </h2>
            <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              The main app shows live XLM and USDC balances after Freighter connects.
            </p>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-slate-50 shadow-[0_18px_50px_rgba(28,37,56,0.15)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Canteen payment terminal
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Pay for lunch in USDC
            </h2>
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm leading-6 text-slate-300">
              Full payment signing, submission, and finality polling live in the main app.
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(28,37,56,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            On-chain receipt
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Payment confirmation
          </h2>
          <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            This nested starter now mirrors the canteen styling so the design shows up
            even if the wrong folder is opened.
          </p>
        </section>
      </div>
    </main>
  );
}
