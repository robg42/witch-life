"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-clay">
          The oracle has stumbled
        </p>
        <p className="oracle-body mt-4 text-wax/90">
          Something didn&rsquo;t come through cleanly. Try again in a moment —
          if it keeps happening, the sky may need to settle.
        </p>
        {error.digest && (
          <p className="mt-4 font-sans text-[10px] uppercase tracking-[0.2em] text-ash/80">
            ref · {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 font-sans text-xs uppercase tracking-[0.25em] border border-clay bg-clay px-6 py-3 text-parchment transition-base hover:bg-clay/85"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
