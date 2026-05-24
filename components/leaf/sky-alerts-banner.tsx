import { hasFeature } from "@/lib/feature-flags-server";
import { todaySkyAlerts } from "@/lib/sky-alerts";

/*
  Sky-alerts banner. Renders a small bar of one-line notes about
  the loud things in the sky today (lunar event, retrograde, eclipse
  season, equinox). Hidden if the feature flag is off or if today
  has nothing loud to say.

  Server component: the sky is computed on the server and never
  shipped to the client unless the flag is on.
*/

export async function SkyAlertsBanner() {
  if (!(await hasFeature("sky-alerts"))) return null;
  const alerts = todaySkyAlerts();
  if (alerts.length === 0) return null;

  return (
    <section
      aria-label="Sky alerts"
      className="mb-6 border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40"
    >
      <header className="border-b border-[var(--c-rule)]/40 px-4 py-2 font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.22em] text-[var(--c-ash)]">
        Today the sky is loud
      </header>
      <ul className="divide-y divide-[var(--c-rule)]/30">
        {alerts.map((a) => (
          <li
            key={a.id}
            className={
              "px-4 py-3 " +
              (a.intensity === "loud"
                ? "border-l-2 border-l-[var(--c-vermilion)]"
                : "border-l-2 border-l-transparent")
            }
          >
            <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--c-ink)]">
              {a.title}
            </h3>
            <p className="mt-1 font-[family-name:var(--font-serif)] text-sm text-[var(--c-ink)]/85">
              {a.detail}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
