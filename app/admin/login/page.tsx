import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminContext } from "@/lib/auth";
import { signOut } from "../actions";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  not_authorized: "This account isn't set up as an admin. Ask the site owner to add it, or sign in with a different account.",
  link_expired: "That link has expired or was already used. Please request a new one.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ctx = configured ? await getAdminContext() : null;
  if (ctx?.isAdmin) redirect("/admin");
  const notice = error && Object.prototype.hasOwnProperty.call(MESSAGES, error) ? MESSAGES[error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="dimples pointer-events-none fixed inset-0 opacity-25" aria-hidden="true" />
      <div className="card relative w-full max-w-md p-7 sm:p-10">
        <p className="eyebrow mb-3">Website admin</p>
        <h1 className="mb-8 font-display text-4xl font-semibold text-cream">Sign in</h1>

        {!configured && (
          <p className="mb-6 rounded-[3px] border border-danger/60 bg-danger/10 px-4 py-3 text-sm text-danger">
            The database isn&apos;t connected yet. Add your Supabase keys to the environment variables (see README).
          </p>
        )}

        {notice && (
          <p className="mb-6 rounded-[3px] border border-gold/50 bg-forest px-4 py-3 text-sm text-cream">{notice}</p>
        )}

        {ctx && !ctx.isAdmin ? (
          <div className="flex flex-col gap-4">
            <p className="text-mist">
              Signed in as <span className="text-cream">{ctx.user.email}</span>, which doesn&apos;t have admin access.
            </p>
            <form action={signOut}>
              <button type="submit" className="btn btn-outline w-full">
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <LoginForm />
        )}
      </div>
    </main>
  );
}
