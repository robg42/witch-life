"use client";

/*
  Global error boundary. Any uncaught exception in a server or client
  component lands here. We keep the page on-brand rather than showing
  Next.js' default crash screen.
*/
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-earth px-6">
      <div className="max-w-md text-center">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-ochre">
          The oracle has stumbled
        </p>
        <p className="oracle-body mt-4 text-parchment/90">
          Something didn&rsquo;t come through cleanly. Try again in a moment —
          if it keeps happening, the sky may need to settle.
        </p>
        {error.digest && (
          <p className="mt-4 font-sans text-[10px] uppercase tracking-[0.2em] text-ash">
            ref · {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 font-sans text-xs uppercase tracking-[0.25em] border border-moss bg-moss/20 px-6 py-3 text-parchment transition-base hover:bg-moss/40"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
