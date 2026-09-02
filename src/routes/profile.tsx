import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getSession, changePassword } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  const getSessionFn = useServerFn(getSession);
  const changePasswordFn = useServerFn(changePassword);
  const [user, setUser] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getSessionFn().then((u) => setUser(u as any));
  }, [getSessionFn]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      await changePasswordFn({ data: { currentPassword, newPassword } });
      setMessage("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to change password");
    }
  };

  if (!user) {
    return <p className="p-8 text-sm text-slate-500">Loading profile...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Profile</h1>

      <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">User details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Name</p>
            <p className="font-medium">
              {user.firstName} {user.lastName}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-slate-500">Role</p>
            <p className="font-medium capitalize">{user.role}</p>
          </div>
          <div>
            <p className="text-slate-500">Status</p>
            <p className="font-medium capitalize">{user.status}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Change password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2 rounded-lg border border-[var(--color-border)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 rounded-lg border border-[var(--color-border)]"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 rounded-lg border border-[var(--color-border)]"
              required
              minLength={8}
            />
          </div>
          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
          <button
            type="submit"
            className="py-2 px-4 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90"
          >
            Change password
          </button>
        </form>
      </div>
    </div>
  );
}
