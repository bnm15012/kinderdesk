import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { resetPassword } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const resetFn = useServerFn(resetPassword);
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await resetFn({ data: { token, password } });
      navigate({ to: "/login" });
    } catch (err: any) {
      setError(err?.message ?? "Reset failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 px-4">
      <div className="w-full max-w-md p-8 bg-white/95 rounded-2xl border border-white/10 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Set new password</h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Reset token</label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full p-2 rounded-lg border border-[var(--color-border)] text-sm"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded-lg border border-[var(--color-border)]"
              required
            />
          </div>
          {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
          <button type="submit" className="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90">
            Reset password
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-[var(--color-muted-foreground)]">
          <Link to="/login" className="text-[var(--color-primary)] hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
