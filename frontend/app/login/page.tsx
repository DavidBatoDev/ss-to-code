"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell, Field, Spinner, inputClass } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "forgot";
type Sent = { kind: "confirm" | "magic" | "reset"; email: string } | null;

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}
const STRENGTH = [
  { label: "Too weak", color: "bg-rose-400" },
  { label: "Weak", color: "bg-rose-400" },
  { label: "Fair", color: "bg-amber-300" },
  { label: "Good", color: "bg-cyan" },
  { label: "Strong", color: "bg-lime" },
];

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/studio";
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState<null | "password" | "magic">(null);
  const [error, setError] = useState<string | null>(params.get("error") ? "That link is invalid or has expired. Please try again." : null);
  const [sent, setSent] = useState<Sent>(null);
  const supabase = useMemo(() => createClient(), []);
  // Already signed in: skip the login page (used to be done by middleware before the static export).
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/studio");
    });
  }, [supabase, router, next]);
  const score = strength(password);
  const callback = (to: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(to)}`;

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("password");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
        router.refresh();
      } else if (mode === "signup") {
        if (score < 2) throw new Error("Please choose a stronger password (8+ characters, mix letters and numbers).");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callback(next), data: { display_name: name || undefined } },
        });
        if (error) throw error;
        if (data.session) {
          router.replace(next);
          router.refresh();
        } else setSent({ kind: "confirm", email });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback("/reset-password") });
        if (error) throw error;
        setSent({ kind: "reset", email });
      }
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg === "Invalid login credentials" ? "Incorrect email or password." : msg);
    } finally {
      setLoading(null);
    }
  }

  async function magicLink() {
    if (!email) return setError("Enter your email first and we'll send you a sign-in link.");
    setError(null);
    setLoading("magic");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callback(next), shouldCreateUser: false } });
    setLoading(null);
    if (error) setError(error.message);
    else setSent({ kind: "magic", email });
  }

  if (sent) {
    const copy = {
      confirm: ["Confirm your email", "Click the link we sent to activate your account and open the studio."],
      magic: ["Check your inbox", "We sent you a one-tap sign-in link. It expires in 1 hour."],
      reset: ["Reset link sent", "Follow the link in the email to choose a new password."],
    }[sent.kind];
    return (
      <div className="text-center">
        <MailIllustration />
        <h1 className="font-display mt-6 text-3xl font-extrabold text-white">{copy[0]}</h1>
        <p className="mt-2 text-white/55">
          {copy[1]}
          <br />
          Sent to <span className="font-semibold text-white">{sent.email}</span>
        </p>
        <div className="mt-8 grid gap-3">
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-cyan py-3 font-semibold text-ink transition hover:bg-white"
          >
            Open Gmail
          </a>
          <button
            onClick={() => {
              setSent(null);
              switchMode("signin");
            }}
            className="rounded-full border border-white/15 py-3 font-semibold text-white/80 transition hover:border-cyan"
          >
            Back to sign in
          </button>
        </div>
        <p className="mt-6 text-xs text-white/40">Didn&apos;t get it? Check spam, or wait a minute and try again.</p>
      </div>
    );
  }

  const titles: Record<Mode, [string, string]> = {
    signin: ["Welcome back", "Sign in to continue to your studio."],
    signup: ["Create your account", "Start turning screenshots into code — free."],
    forgot: ["Forgot your password?", "Enter your email and we'll send you a reset link."],
  };

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">{titles[mode][0]}</h1>
      <p className="mt-2 text-white/55">{titles[mode][1]}</p>

      {mode !== "forgot" && (
        <div className="mt-8 grid grid-cols-2 rounded-full bg-white/5 p-1 text-sm ring-1 ring-white/10">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`rounded-full py-2 font-semibold transition ${mode === m ? "bg-white text-ink shadow" : "text-white/55 hover:text-white"}`}
            >
              {m === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate={false}>
        {mode === "signup" && (
          <Field label="Full name">
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Ada Lovelace" className={inputClass} />
          </Field>
        )}

        <Field label="Email">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className={inputClass}
          />
        </Field>

        {mode !== "forgot" && (
          <Field
            label="Password"
            hint={
              mode === "signin" && (
                <button type="button" onClick={() => switchMode("forgot")} className="text-xs font-semibold text-cyan hover:underline">
                  Forgot password?
                </button>
              )
            }
          >
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                required
                minLength={mode === "signup" ? 8 : 6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                className={`${inputClass} pr-16`}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1 text-xs font-semibold text-white/50 hover:bg-white/10 hover:text-white"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
            {mode === "signup" && password && (
              <div className="mt-2 flex items-center gap-3">
                <div className="grid flex-1 grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`h-1.5 rounded-full transition ${i < score ? STRENGTH[score].color : "bg-white/10"}`} />
                  ))}
                </div>
                <span className="w-16 text-right text-xs text-white/55">{STRENGTH[score].label}</span>
              </div>
            )}
          </Field>
        )}

        {error && (
          <div role="alert" className="flex gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 animate-pop">
            <span className="font-bold text-rose-400">!</span>
            {error}
          </div>
        )}

        <button
          disabled={!!loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-cyan py-3 font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-white disabled:translate-y-0 disabled:opacity-70"
        >
          {loading === "password" && <Spinner />}
          {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </button>

        {mode === "signin" && (
          <>
            <div className="flex items-center gap-3 text-xs text-white/35">
              <span className="h-px flex-1 bg-white/10" />
              OR
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <button
              type="button"
              onClick={magicLink}
              disabled={!!loading}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 py-3 font-semibold text-white transition hover:border-cyan hover:bg-white/5 disabled:opacity-70"
            >
              {loading === "magic" ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <span>✉</span>}
              Email me a sign-in link
            </button>
          </>
        )}
      </form>

      <p className="mt-8 text-center text-sm text-white/55">
        {mode === "signin" ? (
          <>
            New to Pixel2Code?{" "}
            <button onClick={() => switchMode("signup")} className="font-semibold text-cyan hover:underline">
              Create an account
            </button>
          </>
        ) : (
          <>
            {mode === "signup" ? "Already have an account? " : "Remembered it? "}
            <button onClick={() => switchMode("signin")} className="font-semibold text-cyan hover:underline">
              Sign in
            </button>
          </>
        )}
      </p>

      {mode === "signup" && (
        <p className="mt-4 text-center text-xs text-white/35">
          By creating an account you agree to our <Link href="/" className="underline hover:text-white/60">Terms</Link> and{" "}
          <Link href="/" className="underline hover:text-white/60">Privacy Policy</Link>.
        </p>
      )}
    </>
  );
}

function MailIllustration() {
  return (
    <svg viewBox="0 0 160 120" className="mx-auto h-32 w-40" fill="none">
      <ellipse cx="80" cy="110" rx="46" ry="6" fill="#0d2a30" />
      <g className="animate-float">
        <rect x="30" y="30" width="100" height="66" rx="10" fill="#0f2f35" stroke="#42b9bb" strokeWidth="2.5" />
        <path d="M32 34 L80 70 L128 34" stroke="#75d8ee" strokeWidth="2.5" strokeLinejoin="round" className="dash-draw" />
      </g>
      <g className="animate-bounce" style={{ transformOrigin: "128px 30px" }}>
        <circle cx="128" cy="30" r="13" fill="#b6d37f" />
        <path d="M122 30 l4 4 8-8" stroke="#071b1f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M20 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#75d8ee" className="animate-pulse" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense>
        <AuthForm />
      </Suspense>
    </AuthShell>
  );
}
