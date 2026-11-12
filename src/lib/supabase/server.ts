import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";
import type { Database } from "./database.types";

export async function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");

  const cookieStore = await cookies();

  return createServerClient<Database>(
    config.url,
    config.publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.includes(
                "Cookies can only be modified in a Server Action or Route Handler",
              )
            ) {
              return;
            }
            throw error;
          }
        },
      },
    },
  );
}
