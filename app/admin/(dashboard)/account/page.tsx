import { PasswordForm } from "@/components/admin/PasswordForm";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { user } = await requireAdmin();
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-line pb-6">
        <h1 className="font-display text-4xl font-semibold text-cream">Change password</h1>
        <p className="text-mist">Signed in as {user.email}.</p>
      </header>
      <div className="card p-5 sm:p-8">
        <PasswordForm />
      </div>
    </div>
  );
}
