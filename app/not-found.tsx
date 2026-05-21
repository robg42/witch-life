import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-clay">
          Not here
        </p>
        <p className="oracle-body mt-4 text-ink/90">
          That page does not exist. The oracle has not written it yet, or you
          followed a link that has fallen out of fashion.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block font-sans text-xs uppercase tracking-[0.25em] border border-clay bg-clay px-6 py-3 text-parchment transition-base hover:bg-clay/85"
        >
          Return
        </Link>
      </div>
    </main>
  );
}
