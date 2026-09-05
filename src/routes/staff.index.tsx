import { createFileRoute, useNavigate } from "@tanstack/react-router";
// This is the index route for /staff — the list page.
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  X, Plus, Search, Mail, ArrowRight, CheckCircle2, AlertCircle,
  ChevronRight, Briefcase, Pencil, Trash2,
} from "lucide-react";
import { listStaff, addStaffMember, archiveStaff, sendInvite } from "@/lib/auth";
import { useTenant } from "@/lib/tenant";
import { useToast } from "@/lib/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PlanLimitDialog, parsePlanLimitError } from "@/components/plan-limit-dialog";

export const Route = createFileRoute("/staff/")({
  component: Staff,
});

// ── Types ──────────────────────────────────────────────────────────────────

type StaffRow = {
  id: number; firstName: string; lastName: string;
  email: string | null; phone: string | null;
  role: string; joinDate: string | null; salary: string | null;
  status: string; backgroundCheckStatus: string; backgroundCheckDocUrl: string | null;
  classes: string[];
};

type PayrollRow = {
  id: number; month: string; basicSalary: string; deductions: string;
  bonus: string; netSalary: string; status: string; paidAt: Date | null; notes: string | null;
};

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition";

const ROLE_BADGE: Record<string, string> = {
  teacher:   "bg-blue-50 text-blue-700 border-blue-200",
  assistant: "bg-sky-50 text-sky-700 border-sky-200",
  admin:     "bg-violet-50 text-violet-700 border-violet-200",
  principal: "bg-amber-50 text-amber-700 border-amber-200",
  support:   "bg-slate-100 text-slate-600 border-slate-200",
};
const BG_BADGE: Record<string, string> = {
  verified:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:     "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-sky-50 text-sky-700 border-sky-200",
  rejected:    "bg-red-50 text-red-700 border-red-200",
  expired:     "bg-slate-100 text-slate-500 border-slate-200",
};
const STATUS_BADGE: Record<string, string> = {
  active:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive:   "bg-slate-100 text-slate-500 border-slate-200",
  terminated: "bg-red-50 text-red-700 border-red-200",
  on_leave:   "bg-orange-50 text-orange-700 border-orange-200",
};

// ── Shared Staff Form ──────────────────────────────────────────────────────

function StaffForm({ initial, onSubmit, onCancel, saving, error, submitLabel }: {
  initial?: Partial<StaffRow>;
  onSubmit: (d: any) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
  submitLabel: string;
}) {
  const [f, setF] = useState({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    role: (initial?.role ?? "teacher") as any,
    joinDate: initial?.joinDate ?? "",
    salary: initial?.salary ?? "",
    status: (initial?.status ?? "active") as any,
    backgroundCheckStatus: (initial?.backgroundCheckStatus ?? "pending") as any,
  });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">First name *</label>
          <input value={f.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Neha" className={inputCls} required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Last name</label>
          <input value={f.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Gupta" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
          <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="neha@school.com" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone</label>
          <input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="98765 43210" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role</label>
          <select value={f.role} onChange={(e) => set("role", e.target.value)} className={`${inputCls} bg-white`}>
            <option value="teacher">Teacher</option>
            <option value="assistant">Assistant</option>
            <option value="admin">Admin</option>
            <option value="principal">Principal</option>
            <option value="support">Support</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Join date</label>
          <input type="date" value={f.joinDate ?? ""} onChange={(e) => set("joinDate", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Salary (₹)</label>
          <input type="number" value={f.salary ?? ""} onChange={(e) => set("salary", e.target.value)} placeholder="25000" className={inputCls} />
        </div>
        {initial?.id && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
              <select value={f.status} onChange={(e) => set("status", e.target.value)} className={`${inputCls} bg-white`}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Background check</label>
              <select value={f.backgroundCheckStatus} onChange={(e) => set("backgroundCheckStatus", e.target.value)} className={`${inputCls} bg-white`}>
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </>
        )}
      </div>
      {error && !parsePlanLimitError(error) && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition">Cancel</button>
        <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold transition">
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ── Add Staff Modal ────────────────────────────────────────────────────────

function AddStaffModal({ onClose, onSaved, schoolId, locationId }: {
  onClose: () => void; onSaved: () => void; schoolId: number; locationId: number;
}) {
  const addFn = useServerFn(addStaffMember);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (f: any) => {
    setSaving(true); setError("");
    try {
      await addFn({ data: { schoolId, locationId, firstName: f.firstName, lastName: f.lastName, email: f.email || undefined, phone: f.phone || undefined, role: f.role, joinDate: f.joinDate || undefined, salary: f.salary || undefined } });
      onSaved();
    } catch (err: any) { setError(err?.message ?? "Failed"); }
    finally { setSaving(false); }
  };
  return (
    <>
      {error && parsePlanLimitError(error) && (
        <PlanLimitDialog error={error} onClose={() => setError("")} />
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
            <h2 className="text-lg font-bold text-slate-900">Add Staff Member</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6">
            <StaffForm onSubmit={submit} onCancel={onClose} saving={saving} error={error} submitLabel="Save Staff" />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Invite Modal ───────────────────────────────────────────────────────────

function InviteModal({ initial, locationId, onClose }: {
  initial?: { firstName: string; lastName: string; email: string | null };
  locationId: number; onClose: () => void;
}) {
  const sendInviteFn = useServerFn(sendInvite);
  const [f, setF] = useState({
    firstName: initial?.firstName ?? "", lastName: initial?.lastName ?? "",
    email: initial?.email ?? "",
    role: "teacher" as "teacher" | "staff" | "accountant" | "location_admin" | "parent",
  });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [token, setToken] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await sendInviteFn({ data: { email: f.email, firstName: f.firstName, lastName: f.lastName, staffRole: f.role, locationId } }) as any;
      setToken(res.inviteToken); setDone(true);
    } catch (err: any) { setError(err?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900">Invite Staff / Teacher</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          {done ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Invite created!</h3>
              <p className="text-sm text-slate-500 mb-4">In production this would be emailed. Share this link for testing:</p>
              {token && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-4">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Dev — Invite link</p>
                  <p className="text-xs font-mono text-amber-800 break-all leading-relaxed">
                    {typeof window !== "undefined" ? window.location.origin : ""}/invite?token={token}
                  </p>
                </div>
              )}
              <button onClick={onClose} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition">Done</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4 text-sm">
              <p className="text-sm text-slate-500">The invitee will receive a link to set their password and access KinderDesk with the role you assign.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">First name</label>
                  <input value={f.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Neha" className={inputCls} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Last name</label>
                  <input value={f.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Gupta" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email address *</label>
                <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="neha@school.com" className={inputCls} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role to assign</label>
                <select value={f.role} onChange={(e) => set("role", e.target.value as any)} className={`${inputCls} bg-white`}>
                  <option value="teacher">Teacher</option>
                  <option value="staff">Staff</option>
                  <option value="accountant">Accountant</option>
                  <option value="location_admin">Location Admin</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
              {error && <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition">Cancel</button>
                <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold transition">
                  {loading ? "Sending…" : <><span>Send invite</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

function Staff() {
  const { tenant } = useTenant();
  const toast = useToast();
  const navigate = useNavigate();
  const listFn = useServerFn(listStaff);
  const archiveFn = useServerFn(archiveStaff);

  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<StaffRow | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmStaff, setConfirmStaff] = useState<StaffRow | null>(null);

  const load = () => {
    setLoading(true);
    listFn({ data: { schoolId: tenant.schoolId, locationId: tenant.locationId } })
      .then((s) => setRows(s as StaffRow[]))
      .catch((e) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [tenant.schoolId, tenant.locationId]);

  const handleDelete = (s: StaffRow, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmStaff(s);
  };

  const doDelete = async () => {
    if (!confirmStaff) return;
    const s = confirmStaff;
    setConfirmStaff(null);
    setDeletingId(s.id);
    try {
      await archiveFn({ data: { staffId: s.id } });
      setRows((prev) => prev.map((r) => r.id === s.id ? { ...r, status: "terminated" } : r));
      toast(`${s.firstName} ${s.lastName} terminated`, "success");
    } catch (err: any) {
      toast(err?.message ?? "Failed to terminate staff member", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = rows.filter((s) => {
    const q = search.toLowerCase();
    return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q) ||
      s.classes.join(" ").toLowerCase().includes(q);
  });

  const openInvite = (member?: StaffRow) => { setInviteTarget(member ?? null); setInviteOpen(true); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff & Teachers</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? "Loading…" : `${rows.filter(r => r.status === "active").length} active staff member${rows.filter(r => r.status === "active").length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openInvite()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-sm font-semibold rounded-xl transition shadow-sm">
            <Mail className="w-4 h-4" /> Invite
          </button>
          <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search by name, role or class…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition" />
      </div>

      {error && <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-sm"><AlertCircle className="w-5 h-5 shrink-0" />{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-5 py-3.5">Name</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Classes</th>
              <th className="px-5 py-3.5">Phone</th>
              <th className="px-5 py-3.5">BG Check</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((__, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>)}</tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center">
                  <Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                  <p className="text-slate-400 text-sm">{rows.length === 0 ? "No staff yet. Add your first member!" : "No staff match your search."}</p>
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} onClick={() => navigate({ to: "/staff/$staffId", params: { staffId: String(s.id) } })} className="hover:bg-blue-50/40 transition cursor-pointer group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                        {s.firstName[0]}{s.lastName?.[0] ?? ""}
                      </div>
                      <span className="font-semibold text-slate-900 group-hover:text-blue-700 transition">{s.firstName} {s.lastName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize border ${ROLE_BADGE[s.role] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>{s.role}</span>
                  </td>
                  <td className="px-5 py-4">
                    {s.classes.length ? (
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">{s.classes.join(", ")}</span>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-4 text-slate-500">{s.phone ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize border ${BG_BADGE[s.backgroundCheckStatus] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
                      {s.backgroundCheckStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize border ${STATUS_BADGE[s.status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
                      {s.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate({ to: "/staff/$staffId", params: { staffId: String(s.id) } }); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(s, e)}
                        disabled={deletingId === s.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40"
                        title="Terminate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition ml-1" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {addOpen && <AddStaffModal onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); load(); toast("Staff member added", "success"); }} schoolId={tenant.schoolId} locationId={tenant.locationId} />}
      {inviteOpen && (
        <InviteModal
          initial={inviteTarget ? { firstName: inviteTarget.firstName, lastName: inviteTarget.lastName, email: inviteTarget.email } : undefined}
          locationId={tenant.locationId}
          onClose={() => { setInviteOpen(false); setInviteTarget(null); }}
        />
      )}

      <ConfirmDialog
        open={confirmStaff !== null}
        title="Terminate staff member?"
        message={confirmStaff ? `"${confirmStaff.firstName} ${confirmStaff.lastName}" will be marked as terminated. You can reactivate them later by editing their status.` : ""}
        confirmLabel="Terminate"
        onConfirm={doDelete}
        onCancel={() => setConfirmStaff(null)}
      />
    </div>
  );
}
