import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);

export type Generation = {
  id: string;
  model: string;
  stack: string;
  label: string;
  code: string;
  duration_ms: number | null;
  created_at: string;
};
