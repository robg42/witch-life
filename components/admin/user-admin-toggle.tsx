"use client";

import { useState, useTransition } from "react";
import { setUserAdmin } from "@/app/admin/actions";

/*
  Single button to grant or revoke admin. Has a one-step confirm to
  prevent finger-trouble — admin grants are a security event.
*/

export function UserAdminToggle({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin: boolean;
}) {
  const [current, setCurrent] = useState(isAdmin);
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const apply = () => {
    setError(null);
    const next = !current;
    startTransition(async () => {
      try {
        await setUserAdmin({ userId, isAdmin: next });
        setCurrent(next);
        setArmed(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  return (
    <div className="flex items-center gap-3 border border-[var(--c-rule)] bg-[var(--c-paper-3)]/40 px-4 py-3">
      <div className="flex-1">
        <p className="font-[family-name:var(--font-serif)] text-sm text-[var(--c-ink)]">
          {current ? "This user IS an admin." : "This user is not an admin."}
        </p>
        {error && (
          <p className="mt-1 font-[family-name:var(--font-mono)] text-[0.6rem] text-[var(--c-vermilion)]">
            {error}
          </p>
        )}
      </div>
      {armed ? (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={apply}
            disabled={pending}
            className="border border-[var(--c-vermilion)] bg-[var(--c-vermilion)] px-3 py-1 font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.18em] text-[var(--c-paper)] hover:bg-[var(--c-rust)]"
          >
            {pending ? "Saving…" : current ? "Revoke admin" : "Grant admin"}
          </button>
          <button
            type="button"
            onClick={() => setArmed(false)}
            disabled={pending}
            className="border border-[var(--c-rule)] px-3 py-1 font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.18em] text-[var(--c-ash)] hover:text-[var(--c-ink)]"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="border border-[var(--c-rule)] px-3 py-1 font-[family-name:var(--font-mono)] text-[0.6rem] uppercase tracking-[0.18em] text-[var(--c-ink)] hover:bg-[var(--c-paper-3)]"
        >
          {current ? "Revoke admin…" : "Grant admin…"}
        </button>
      )}
    </div>
  );
}
