import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { X, User, Lock, Mail, Shield, MapPin, CheckCircle2 } from "lucide-react";
import { getSession, updateProfile, changePassword } from "@/lib/auth";
import { useTenant } from "@/lib/tenant";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition placeholder:text-slate-400";
const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5";

export function ProfileDialog({ open, onClose, defaultTab = "profile" }: { open: boolean; onClose: () => void; defaultTab?: "profile" | "security" }) {
  const { tenant } = useTenant();
  const getSessionFn = useServerFn(getSession);
  const updateFn = useServerFn(updateProfile);
  const changeFn = useServerFn(changePassword);

  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<"profile" | "security">("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!open) return;
    setTab(defaultTab);
    setMessage("");
    setError("");
    setNewPassword("");
    setConfirmPassword("");
    getSessionFn()
      .then((u: any) => {
        setUser(u);
        setFirstName(u?.firstName ?? "");
        setLastName(u?.lastName ?? "");
        setPhone(u?.phone ?? "");
      })
      .catch(() => setError("Failed to load profile"));
  }, [open, getSessionFn]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await updateFn({ data: { firstName, lastName, phone } });
      const u = await getSessionFn();
      setUser(u as any);
      setMessage("Profile updated successfully.");
    } catch (err: any) {
      setError(err?.message ?? "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await changeFn({ data: { currentPassword: "", newPassword } });
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password changed successfully.");
    } catch (err: any) {
      setError(err?.message ?? "Password change failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const initials = user?.firstName
    ? user.firstName[0].toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user?.email ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* ── Gradient header ── */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-5 pt-6 pb-5 sm:px-8 sm:pt-8 sm:pb-6">
          {/* Dot texture */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }}
          />
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative z-10 flex items-center gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white leading-tight">{displayName || "Account"}</h2>
              <p className="text-blue-200 text-sm mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] font-semibold bg-white/15 text-white px-2.5 py-0.5 rounded-full capitalize">
                  {user?.role?.replace("_", " ") ?? "—"}
                </span>
                <span className="text-[11px] font-semibold bg-emerald-400/20 text-emerald-200 px-2.5 py-0.5 rounded-full capitalize">
                  {user?.status ?? "active"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Gradient pill tabs ── */}
          <div className="relative z-10 flex gap-2 mt-6">
            <button
              onClick={() => { setTab("profile"); setMessage(""); setError(""); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition ${
                tab === "profile"
                  ? "bg-white text-blue-700 shadow-md"
                  : "bg-white/15 text-white/80 hover:bg-white/25 hover:text-white"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Profile
            </button>
            <button
              onClick={() => { setTab("security"); setMessage(""); setError(""); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition ${
                tab === "security"
                  ? "bg-white text-blue-700 shadow-md"
                  : "bg-white/15 text-white/80 hover:bg-white/25 hover:text-white"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Change password
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-5 py-5 sm:px-8 sm:py-6">
          {message && (
            <div className="flex items-center gap-2.5 mb-5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {message}
            </div>
          )}
          {error && (
            <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl">
              {error}
            </div>
          )}

          {tab === "profile" ? (
            <form id="profile-form" onSubmit={handleProfileSave} className="space-y-5">
              {/* Editable fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>First name</label>
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} placeholder="First name" />
                </div>
                <div>
                  <label className={labelCls}>Last name</label>
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} placeholder="Last name" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+91 98765 43210" />
              </div>

              {/* Read-only info cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {[
                  { icon: Mail, label: "Email", value: user?.email ?? "—" },
                  { icon: Shield, label: "Role", value: user?.role?.replace("_", " ") ?? "—", capitalize: true },
                  { icon: CheckCircle2, label: "Status", value: user?.status ?? "—", capitalize: true },
                  { icon: MapPin, label: "Branch", value: `${tenant.schoolName} — ${tenant.locationName}` },
                ].map(({ icon: Icon, label, value, capitalize }) => (
                  <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-3">
                    <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                      <p className={`text-sm font-semibold text-slate-800 leading-snug mt-0.5 break-words ${capitalize ? "capitalize" : ""}`}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-sm shadow-blue-200"
                >
                  {loading ? "Saving…" : "Save profile"}
                </button>
              </div>
            </form>

          ) : (
            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label className={labelCls}>New password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className={inputCls} placeholder="Min. 8 characters" />
              </div>
              <div>
                <label className={labelCls}>Confirm new password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputCls} placeholder="Repeat new password" />
              </div>
              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-sm shadow-blue-200"
                >
                  {loading ? "Saving…" : "Change password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
