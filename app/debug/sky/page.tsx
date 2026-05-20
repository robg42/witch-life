import { notFound } from "next/navigation";
import {
  computeNatalChart,
  computeTransits,
  getSkyState,
} from "@/lib/astro";

/*
  Dev-only sky inspector.

  Accepts optional query parameters:
    ?date=YYYY-MM-DD          — defaults to "now"
    ?time=HH:MM               — UTC, defaults to current UTC time
    ?lat=...&lng=...          — used for season + (with birth params) rising
    ?birthDate=YYYY-MM-DD
    ?birthTime=HH:MM
    ?birthLat=...&birthLng=...

  404s in production so the route never leaks past dev.
*/

export const dynamic = "force-dynamic";

function parseDate(date?: string, time?: string): Date {
  if (!date) return new Date();
  const [h, m] = (time ?? "12:00").split(":").map(Number);
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, (mo ?? 1) - 1, d ?? 1, h ?? 12, m ?? 0, 0));
}

function parseNum(v?: string): number | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function DebugSkyPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const now = parseDate(searchParams.date, searchParams.time);
  const lat = parseNum(searchParams.lat);
  const sky = getSkyState(now, { lat });

  const birthDate = searchParams.birthDate
    ? parseDate(searchParams.birthDate, searchParams.birthTime)
    : null;
  const birthLat = parseNum(searchParams.birthLat);
  const birthLng = parseNum(searchParams.birthLng);

  const natal = birthDate
    ? computeNatalChart({
        date: birthDate,
        lat: birthLat,
        lng: birthLng,
      })
    : null;

  const transits = natal ? computeTransits(sky, natal) : null;

  return (
    <main className="min-h-screen bg-earth text-parchment p-8 font-sans text-sm">
      <header className="mb-8">
        <h1 className="display text-2xl text-ochre">Sky inspector</h1>
        <p className="text-ash mt-2">
          Dev only. Query: <code>?date=YYYY-MM-DD&time=HH:MM&lat=&lng=</code>{" "}
          and optionally <code>birthDate</code>, <code>birthTime</code>,{" "}
          <code>birthLat</code>, <code>birthLng</code>.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="display text-lg text-sage mb-2">Sky</h2>
        <pre className="bg-bark/40 hairline rounded p-4 overflow-x-auto text-parchment/90">
          {JSON.stringify(sky, null, 2)}
        </pre>
      </section>

      {natal && (
        <section className="mb-8">
          <h2 className="display text-lg text-sage mb-2">Natal chart</h2>
          <pre className="bg-bark/40 hairline rounded p-4 overflow-x-auto text-parchment/90">
            {JSON.stringify(natal, null, 2)}
          </pre>
        </section>
      )}

      {transits && (
        <section className="mb-8">
          <h2 className="display text-lg text-sage mb-2">Transits</h2>
          <pre className="bg-bark/40 hairline rounded p-4 overflow-x-auto text-parchment/90">
            {JSON.stringify(transits, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}
