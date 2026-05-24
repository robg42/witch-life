import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminContext } from "@/lib/admin";

/*
  SYSCON — station administration. The admin tree of Witch Life
  was previously a broadsheet pastiche; in the Foreshore product
  it is reframed as the system console for the station network.

  Visually we wear the same brass + ivory + dark-housing chrome as
  the operator console at /, with the addition of a stencilled
  SYSCON banner. The legacy admin tables and stat cards continue
  to work because [data-foreshore] remaps the broadsheet tokens
  to Foreshore equivalents (see globals.css).

  Access gating is unchanged: getAdminContext() checks
  users.is_admin; non-admins get a 404. The admin email shows in
  the header for situational awareness.
*/

export const dynamic = "force-dynamic";

const NAV: Array<{
  href: string;
  label: string;
  description: string;
  symbol: string;
}> = [
  {
    href: "/admin",
    label: "OVERVIEW",
    description: "counts · costs · faults",
    symbol: "◐",
  },
  {
    href: "/admin/users",
    label: "OPERATORS",
    description: "per-station overrides",
    symbol: "◯",
  },
  {
    href: "/admin/flags",
    label: "FLAGS",
    description: "network-wide toggles",
    symbol: "▱",
  },
  {
    href: "/admin/api-calls",
    label: "API LOG",
    description: "anthropic call log",
    symbol: "▭",
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminContext();
  if (!admin) notFound();

  return (
    <div data-foreshore data-crt="amber" className="min-h-screen fs-housing">
      <header className="border-b border-[var(--fs-rule-strong)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-3 px-6 py-3">
          <div className="flex items-baseline gap-4">
            <Link
              href="/admin"
              className="fs-stencil-strong text-[var(--fs-brass-glint)] hover:text-[var(--fs-ivory)]"
            >
              SYSCON · STATION NETWORK
            </Link>
            <span className="fs-engraved">{admin.email.toUpperCase()}</span>
          </div>
          <Link
            href="/"
            className="fs-mono text-[0.65rem] uppercase tracking-[0.2em] text-[var(--fs-brass)] hover:text-[var(--fs-brass-glint)]"
          >
            ← BACK TO STATION
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6 md:grid-cols-[15rem_1fr] md:gap-8 md:py-8">
        <nav className="space-y-px border-r border-[var(--fs-rule)] pr-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-baseline gap-3 border-b border-[var(--fs-rule)]/40 px-2 py-3 transition-colors hover:bg-[var(--fs-housing-2)]"
            >
              <span
                aria-hidden
                className="fs-mono text-base text-[var(--fs-brass-dim)] group-hover:text-[var(--fs-brass-glint)]"
              >
                {item.symbol}
              </span>
              <span className="flex-1">
                <span className="block fs-mono text-sm font-medium tracking-[0.18em] text-[var(--fs-ivory)] group-hover:text-[var(--fs-brass-glint)]">
                  {item.label}
                </span>
                <span className="block fs-engraved mt-1">
                  {item.description}
                </span>
              </span>
            </Link>
          ))}
        </nav>

        <main className="min-w-0">{children}</main>
      </div>

      <footer className="border-t border-[var(--fs-rule-strong)] px-6 py-2 text-center">
        <p className="fs-engraved">
          STATION 28 · NETWORK ADMINISTRATION · ACCESS LOGGED
        </p>
      </footer>
    </div>
  );
}
