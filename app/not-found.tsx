import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-earth px-6">
      <div className="max-w-md text-center">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-ochre">
          Not here
        </p>
        <p className="oracle-body mt-4 text-parchment/90">
          That page does not exist. The oracle has not written it yet, or you
          followed a link that has fallen out of fashion.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block font-sans text-xs uppercase tracking-[0.25em] border border-moss bg-moss/20 px-6 py-3 text-parchment transition-base hover:bg-moss/40"
        >
          Return
        </Link>
      </div>
    </main>
  );
}
