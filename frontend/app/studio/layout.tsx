"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Client-side guard: the site is a static export, so there is no server to check the session.
// Real protection lives in Supabase Row Level Security; this only keeps signed-out users out of the UI.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (user) setReady(true);
        else router.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      });
  }, [router]);

  return ready ? <>{children}</> : null;
}
