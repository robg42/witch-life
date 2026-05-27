import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { getSkyState } from "@/lib/astro";
import { CRTScreen } from "@/components/foreshore/crt-screen";

export const dynamic = "force-dynamic";

/*
  New operator enrollment — Station 28 access request terminal.

  The CRT walks through the three-step enrollment procedure;
  the right panel is the Clerk registration form.
*/
export default function SignUpPage() {
  const now = new Date();
  const sky = getSkyState(now);
  const mercury = sky.planets.mercury;
  const mercuryStatus = mercury.retrograde
    ? "RETROGRADE"
    : mercury.shadowPeriod
      ? "IN SHADOW"
      : "DIRECT";

  return (
    <main className="flex min-h-screen flex-col fs-housing" data-foreshore="">
      {/* Top brass rail */}
      <header className="border-b border-[var(--fs-rule-strong)] px-5 py-2 text-center">
        <h1 className="fs-stencil-strong">
          STATION 28 · REMOTE RECEIVING OUTPOST
        </h1>
      </header>

      {/* Body */}
      <div className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-8 md:px-10 md:py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr] md:gap-14">

          {/* Left: CRT enrollment procedure */}
          <section>
            <CRTScreen waveform>
              <div className="space-y-7">
                <p className="fs-stencil">NEW ENROLLMENT · ACCESS REQUEST</p>

                <p className="fs-mono text-base leading-[1.65] text-[var(--fs-phosphor)] fs-phosphor max-w-2xl">
                  TO PRIME A CHANNEL, THE STATION REQUIRES THREE PIECES OF
                  INFORMATION. ENROLLMENT TAKES UNDER TWO MINUTES. YOUR CHART
                  IS NEVER SHARED.
                </p>

                <div className="border-t border-[var(--fs-rule)] pt-6">
                  <p className="fs-stencil mb-4">ENROLLMENT PROCEDURE</p>
                  <ol className="space-y-3">
                    {[
                      {
                        num: "I",
                        label: "DATE OF ARRIVAL",
                        detail: "REQUIRED FOR CHART CAST · TIME + PLACE OPTIONAL",
                      },
                      {
                        num: "II",
                        label: "SEASON INTENTIONS",
                        detail: "SELECT 1–3 FROM MENU · SHAPES EACH TRANSMISSION",
                      },
                      {
                        num: "III",
                        label: "VOICE REGISTER",
                        detail: "FIELD · CIPHER · LONG-WAVE",
                      },
                    ].map(({ num, label, detail }) => (
                      <li key={num} className="flex gap-4 fs-mono text-sm">
                        <span className="text-[var(--fs-brass-glint)] fs-phosphor w-4 shrink-0 text-right">
                          {num}
                        </span>
                        <div>
                          <p className="text-[var(--fs-ivory)]">{label}</p>
                          <p className="text-[var(--fs-ivory-dim)] text-xs mt-0.5 tracking-[0.08em]">
                            {detail}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="border-t border-[var(--fs-rule)] pt-6">
                  <p className="fs-stencil mb-4">CURRENT ATMOSPHERICS</p>
                  <dl className="space-y-2">
                    {(
                      [
                        {
                          key: "MOON",
                          val: `${sky.moon.phaseSymbol} ${sky.moon.phaseName.toUpperCase()}`,
                          alarm: false,
                        },
                        {
                          key: "SUN",
                          val: `IN ${sky.sun.sign.toUpperCase()}`,
                          alarm: false,
                        },
                        {
                          key: "MERCURY",
                          val: mercuryStatus,
                          alarm: mercury.retrograde,
                        },
                        {
                          key: "DARK MOON",
                          val: `${Math.round(sky.moon.daysToNewMoon)}D`,
                          alarm: false,
                        },
                      ] as const
                    ).map(({ key, val, alarm }) => (
                      <div
                        key={key}
                        className="flex justify-between border-b border-[var(--fs-rule)] pb-1 fs-mono text-sm"
                      >
                        <dt className="text-[var(--fs-ivory-dim)]">{key}</dt>
                        <dd
                          className={
                            alarm
                              ? "fs-phosphor text-[var(--fs-alarm)]"
                              : "fs-phosphor text-[var(--fs-phosphor)]"
                          }
                        >
                          {val}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </CRTScreen>
          </section>

          {/* Right: new operator enrollment panel */}
          <aside>
            <div className="border border-[var(--fs-rule)] bg-[var(--fs-housing-2)] px-7 py-8">
              <p className="fs-engraved mb-5">NEW OPERATOR</p>

              <p className="fs-mono text-3xl tracking-[0.08em] text-[var(--fs-ivory)] mb-2">
                BEGIN
              </p>
              <p className="fs-mono text-xs leading-relaxed text-[var(--fs-ivory-dim)] mb-7 tracking-[0.1em]">
                SAVE YOUR CHART. BEGIN THE DAILY RITUAL.
                <br />
                AN ACCOUNT HOLDS YOUR CHART, YOUR LOG, YOUR TAPE.
              </p>

              <SignUp
                appearance={{
                  variables: {
                    colorPrimary: "#bfa46b",
                    colorBackground: "#131611",
                    colorInputBackground: "#1a1d17",
                    colorInputText: "#f0e7d2",
                    colorText: "#f0e7d2",
                    colorTextSecondary: "#b9b09d",
                    colorNeutral: "#b9b09d",
                    fontFamily: "var(--font-mono)",
                    borderRadius: "0px",
                  },
                  elements: {
                    rootBox: { backgroundColor: "transparent" },
                    card: {
                      backgroundColor: "transparent",
                      border: "none",
                      boxShadow: "none",
                      borderRadius: 0,
                      padding: 0,
                    },
                    header: { display: "none" },
                    formButtonPrimary: {
                      backgroundColor: "#bfa46b",
                      color: "#0b0e0b",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      border: "1px solid #e6d29a",
                      borderRadius: 0,
                    },
                    dividerLine: {
                      backgroundColor: "rgba(191, 164, 107, 0.32)",
                    },
                    dividerText: {
                      color: "#856e3f",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      fontSize: "0.6rem",
                    },
                    footerActionText: { color: "#b9b09d" },
                    footerActionLink: { color: "#e6d29a", fontWeight: 600 },
                    socialButtonsBlockButton: {
                      border: "1px solid rgba(191, 164, 107, 0.32)",
                      backgroundColor: "#1a1d17",
                      color: "#f0e7d2",
                      borderRadius: 0,
                    },
                    identityPreview: {
                      backgroundColor: "#1a1d17",
                      border: "1px solid rgba(191, 164, 107, 0.32)",
                    },
                    formFieldInput: {
                      backgroundColor: "#1a1d17",
                      border: "1px solid rgba(191, 164, 107, 0.32)",
                      color: "#f0e7d2",
                    },
                    formFieldLabel: {
                      color: "#b9b09d",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6rem",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                    },
                  },
                }}
              />

              <p className="mt-6 fs-mono text-[0.6rem] tracking-[0.18em] text-[var(--fs-ivory-dim)]">
                EXISTING OPERATOR?{" "}
                <Link
                  href="/sign-in"
                  className="text-[var(--fs-brass-glint)] underline underline-offset-2 hover:text-[var(--fs-brass)]"
                >
                  RE-ENTER HERE →
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Foot rail */}
      <footer className="border-t border-[var(--fs-rule-strong)] px-5 py-2 text-center">
        <p className="fs-engraved">
          WITCH LIFE · {now.getUTCFullYear()} · NO PREDICTION · ONLY ATTENTION
        </p>
      </footer>
    </main>
  );
}
