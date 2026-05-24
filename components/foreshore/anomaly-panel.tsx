import type { SkyAlert } from "@/lib/sky-alerts";

/*
  Anomaly panel — opened from the AnomalyBadge. Renders the list of
  active sky alerts in station vocabulary, with the alarm-red border
  treatment. Each alert is also "loud" or "quiet" — quiet ones get
  a muted left rail.
*/

export function AnomalyPanel({
  alerts,
  onClose,
}: {
  alerts: SkyAlert[];
  onClose: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <p className="fs-stencil text-[var(--fs-alarm)]">
          ANOMALY · UNSCHEDULED TRANSMISSION
        </p>
        <button type="button" onClick={onClose} className="fs-switch">
          DISMISS
        </button>
      </div>

      <p className="fs-mono text-sm text-[var(--fs-phosphor-dim)] fs-phosphor max-w-2xl">
        {alerts.length === 1
          ? "ONE READING DEPARTS FROM NOMINAL."
          : `${alerts.length} READINGS DEPART FROM NOMINAL.`}
      </p>

      <ul className="space-y-3">
        {alerts.map((a) => (
          <li
            key={a.id}
            className={
              "border-l-2 px-4 py-3 " +
              (a.intensity === "loud"
                ? "border-[var(--fs-alarm)] bg-[var(--fs-alarm)]/8"
                : "border-[var(--fs-brass-dim)] bg-[var(--fs-housing-3)]")
            }
          >
            <h3
              className={
                "fs-mono text-base " +
                (a.intensity === "loud"
                  ? "text-[var(--fs-alarm)]"
                  : "text-[var(--fs-phosphor)] fs-phosphor")
              }
            >
              {a.title}
            </h3>
            <p className="mt-1 fs-mono text-sm text-[var(--fs-phosphor-dim)] fs-phosphor">
              {a.detail}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
