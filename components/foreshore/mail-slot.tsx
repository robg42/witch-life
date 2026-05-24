"use client";

/*
  Mail slot — a thin brass slot at the foot of the CRT housing.
  When a letter is waiting (read=false), the small LED inside the
  slot pulses softly. Clicking opens the letter inside the CRT
  (the CRT swaps from phosphor mode to paper mode).

  The slot is the ONLY visual element that interrupts the otherwise
  monolithic phosphor surface. That contrast is intentional: the
  slot is the Foreshore's only foothold in the station.
*/

export function MailSlot({
  pulsing,
  onOpen,
  disabled,
}: {
  pulsing: boolean;
  onOpen: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled || !pulsing}
      aria-label={
        pulsing ? "Open the waiting letter" : "Mail slot — empty"
      }
      className={
        "group relative flex w-full items-center gap-3 border-y border-[var(--fs-rule-strong)] fs-brass-plate px-4 py-2 transition-colors " +
        (pulsing
          ? "cursor-pointer hover:brightness-105"
          : "cursor-default opacity-65")
      }
    >
      {/* The slot itself — a darker recessed strip with an LED. */}
      <span
        className="relative flex h-3 flex-1 items-center"
        aria-hidden
      >
        <span
          className="block h-2 w-full"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)",
            borderRadius: 0,
            boxShadow:
              "inset 0 2px 3px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.18)",
          }}
        />
        {/* The LED itself, positioned near the left of the slot. */}
        <span
          className={"fs-led absolute left-2 " + (pulsing ? "fs-led--pulse" : "")}
          style={{
            opacity: pulsing ? undefined : 0.18,
          }}
        />
      </span>
      <span className="fs-mono text-[0.65rem] font-medium uppercase tracking-[0.22em] text-[#2a1f12]">
        {pulsing ? "▸ LETTER WAITING" : "MAIL SLOT — EMPTY"}
      </span>
    </button>
  );
}
