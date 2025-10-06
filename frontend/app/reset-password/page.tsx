"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell, Field, Spinner, inputClass } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    router.replace("/studio");
  }

  return (
    <AuthShell>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">Choose a new password</h1>
      <p className="mt-2 text-white/55">Make it strong — at least 8 characters.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="New password">
          <input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Confirm password">
          <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
        </Field>
        {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-cyan py-3 font-semibold text-ink hover:bg-white disabled:opacity-70">
          {loading && <Spinner />}
          Update password
        </button>
      </form>
    </AuthShell>
  );
}
