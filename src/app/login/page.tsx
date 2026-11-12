import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!getSupabaseConfig()) redirect("/triage");
  const { error } = await searchParams;

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-gradient-to-b from-primary/10 to-transparent"
      />
      <LoginForm hasCallbackError={Boolean(error)} />
    </main>
  );
}
