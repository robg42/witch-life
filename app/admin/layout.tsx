import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminContext } from "@/lib/admin";

/*
  Admin shell. Gates the entire /admin subtree by calling
  getAdminContext(); non-admins get a 404 — we don't acknowledge
  the surface exists. Admins see the sidebar and the page body.

  Visually we share the broadsheet vocabulary with the rest of the
  app but with denser numeric type. Numbers everywhere.
*/

export const dynamic = "force-dynamic";

const NAV: Array<{ href: string; label: string; description: string }> = [
  {
    href: "/admin",
    label: "Overview",
    description: "Counts, costs, errors",
  },
  {
    href: "/admin/users",
    label: "Users",
    description: "Per-user overrides",
  },
  {
    href: "/admin/flags",
    label: "Flags",
    description: "Global toggles",
  },
  {
    href: "/admin/api-calls",
    label: "API calls",
    description: "Anthropic log",
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
    <div className="min-h-screen">
      <header className="border-b border-[var(--c-rule)]">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between px-6 py-4">
          <div className="flex items-baseline gap-4">
            <Link
              href="/admin"
              className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--c-ink)]"
            >
              Witch Life · Admin
            </Link>
            <span className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.2em] text-[var(--c-ash)]">
              {admin.email}
            </span>
          </div>
          <Link
            href="/"
            className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.2em] text-[var(--c-vermilion)] hover:underline"
          >
            ← Back to the leaf
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[14rem_1fr]">
        <nav className="space-y-1 border-r border-[var(--c-rule)]/40 pr-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group block border-b border-[var(--c-rule)]/20 py-3 transition-colors hover:bg-[var(--c-paper-3)]"
            >
              <div className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--c-ink)] group-hover:text-[var(--c-vermilion)]">
                {item.label}
              </div>
              <div className="font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.18em] text-[var(--c-ash)]">
                {item.description}
              </div>
            </Link>
          ))}
        </nav>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
