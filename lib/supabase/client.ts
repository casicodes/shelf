import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Only validate in browser to avoid build-time errors
  // During build/SSR, env vars might not be available, but that's okay
  // since this is a browser-only client
  if (typeof window !== "undefined" && (!url || !anonKey)) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  // If env vars are missing during build/SSR, use placeholders
  // This client won't be used until browser hydration anyway
  return createBrowserClient(
    url || "https://placeholder.supabase.co",
    anonKey || "placeholder-key"
  );
}

