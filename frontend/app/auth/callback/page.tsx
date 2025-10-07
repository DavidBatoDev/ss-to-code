"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Email confirmation / magic-link / reset links land here with ?code=...
// The site is static on S3, so the PKCE code is exchanged in the browser.
function Callback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    const next = params.get("next") ?? "/studio";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/studio";
    if (!code) return router.replace("/login?error=confirm");
    createClient()
      .auth.exchangeCodeForSession(code)
      .then(({ error }) => router.replace(error ? "/login?error=confirm" : safeNext));
  }, [params, router]);

  return <p className="p-10 text-center text-white/60">Signing you in…</p>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <Callback />
    </Suspense>
  );
}
