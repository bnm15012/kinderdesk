import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Mail, Phone, Calendar, BookOpen, X, Plus, AlertCircle,
  CheckCircle2, DollarSign, ShieldCheck, Upload, ExternalLink, Loader2,
  ChevronDown, ChevronUp, Trash2,
} from "lucide-react";
import {
  listStaff, updateStaffMember, archiveStaff, assignStaffToClass,
  removeStaffFromClass, listClassesForSchool, listPayrollRecords,
  addPayrollRecord, markPayrollPaid, uploadBgVerificationDoc, sendInvite,
} from "@/lib/auth";
import { useTenant } from "@/lib/tenant";
import { useToast } from "@/lib/toast";

export const Route = createFileRoute("/staff/$staffId")({
  component: StaffDetailPage,
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

type ClassOption = { id: number; name: string; ageGroup: string };

// ── Style constants ────────────────────────────────────────────────────────

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

// ── StaffForm ──────────────────────────────────────────────────────────────

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
      {error && (
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

// ── InviteModal ────────────────────────────────────────────────────────────

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
                  {loading ? "Sending…" : "Send invite"}
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

function StaffDetailPage() {
  const { staffId } = Route.useParams();
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const toast = useToast();

  const listFn         = useServerFn(listStaff);
  const listClassesFn  = useServerFn(listClassesForSchool);
  const updateFn       = useServerFn(updateStaffMember);
  const archiveFn      = useServerFn(archiveStaff);
  const assignFn       = useServerFn(assignStaffToClass);
  const removeFn       = useServerFn(removeStaffFromClass);
  const listPayrollFn  = useServerFn(listPayrollRecords);
  const addPayrollFn   = useServerFn(addPayrollRecord);
  const markPaidFn     = useServerFn(markPayrollPaid);
  const uploadBgFn     = useServerFn(uploadBgVerificationDoc);

  // Page-level loading / not-found state
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Staff member state
  const [member, setMember] = useState<StaffRow | null>(null);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  // Edit-details card state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Archive / terminate state
  const [archiving, setArchiving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  // Class assignment state
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [classAssigning, setClassAssigning] = useState(false);
  const [selectedClassToAdd, setSelectedClassToAdd] = useState("");

  // Payroll state (open by default)
  const [payrollOpen, setPayrollOpen] = useState(true);
  const [payroll, setPayroll] = useState<PayrollRow[]>([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollError, setPayrollError] = useState("");
  const [addingPayroll, setAddingPayroll] = useState(false);
  const [payrollForm, setPayrollForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    basicSalary: "",
    deductions: "0", bonus: "0", notes: "",
  });
  const setPF = (k: string, v: string) => setPayrollForm((p) => ({ ...p, [k]: v }));
  const [payrollSaving, setPayrollSaving] = useState(false);
  const [markingPaid, setMarkingPaid] = useState<number | null>(null);

  // Background check state (open by default)
  const [bgOpen, setBgOpen] = useState(true);
  const [bgDocUrl, setBgDocUrl] = useState<string | null>(null);
  const [bgUploading, setBgUploading] = useState(false);
  const [bgError, setBgError] = useState("");

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);

  // ── Load staff member & classes ──────────────────────────────────────────

  useEffect(() => {
    const id = parseInt(staffId);
    setPageLoading(true);
    Promise.all([
      listFn({ data: { schoolId: tenant.schoolId, locationId: tenant.locationId } }),
      listClassesFn({ data: { schoolId: tenant.schoolId, locationId: tenant.locationId } }),
    ])
      .then(([staffList, classList]) => {
        const found = (staffList as StaffRow[]).find((s) => s.id === id);
        if (!found) { setNotFound(true); return; }
        setMember(found);
        setAssignedClasses(found.classes ?? []);
        setBgDocUrl(found.backgroundCheckDocUrl ?? null);
        setPayrollForm((p) => ({ ...p, basicSalary: found.salary ?? "" }));
        setClasses((classList as any[]).map((c) => ({ id: c.id, name: c.name, ageGroup: c.ageGroup })));
      })
      .catch(() => setNotFound(true))
      .finally(() => setPageLoading(false));
  }, [staffId, tenant.schoolId, tenant.locationId]);

  // ── Load payroll when section opened ────────────────────────────────────

  useEffect(() => {
    if (!payrollOpen || !member) return;
    setPayrollLoading(true); setPayrollError("");
    listPayrollFn({ data: { staffId: member.id } })
      .then((r) => setPayroll(r as PayrollRow[]))
      .catch((e: any) => setPayrollError(e?.message ?? "Failed to load"))
      .finally(() => setPayrollLoading(false));
  }, [payrollOpen, member?.id]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const submit = async (f: any) => {
    if (!member) return;
    setSaving(true); setSaveError("");
    try {
      await updateFn({ data: {
        staffId: member.id,
        firstName: f.firstName, lastName: f.lastName,
        email: f.email || "", phone: f.phone || undefined,
        role: f.role, joinDate: f.joinDate || undefined,
        salary: f.salary || undefined,
        status: f.status,
        backgroundCheckStatus: f.backgroundCheckStatus,
      }});
      setMember((prev) => prev ? { ...prev, ...f } : prev);
      toast("Staff member updated", "success");
    } catch (err: any) { setSaveError(err?.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  const doArchive = async () => {
    if (!member) return;
    setArchiving(true);
    try {
      await archiveFn({ data: { staffId: member.id } });
      toast("Staff member terminated", "success");
      navigate({ to: "/staff" });
    } catch { setArchiving(false); }
  };

  const submitPayroll = async () => {
    if (!member) return;
    setPayrollSaving(true); setPayrollError("");
    try {
      const result = await addPayrollFn({ data: {
        staffId: member.id,
        month: payrollForm.month,
        basicSalary: payrollForm.basicSalary || "0",
        deductions: payrollForm.deductions || "0",
        bonus: payrollForm.bonus || "0",
        notes: payrollForm.notes || undefined,
      }});
      const net = parseFloat((result as any).netSalary ?? "0");
      setPayroll((p) => [{
        id: (result as any).id, month: payrollForm.month,
        basicSalary: payrollForm.basicSalary || "0",
        deductions: payrollForm.deductions || "0",
        bonus: payrollForm.bonus || "0",
        netSalary: net.toFixed(2),
        status: "pending", paidAt: null, notes: payrollForm.notes || null,
      }, ...p]);
      setAddingPayroll(false);
    } catch (e: any) { setPayrollError(e?.message ?? "Failed to save"); }
    finally { setPayrollSaving(false); }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="space-y-5">
        <div className="h-6 w-32 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-40 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 space-y-4">
            <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
          <div className="col-span-2 space-y-4">
            <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !member) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate({ to: "/staff" })} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Staff
        </button>
        <div className="text-center py-20">
          <p className="text-slate-400 text-lg">Staff member not found.</p>
        </div>
      </div>
    );
  }

  const initials = `${member.firstName[0]}${member.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-5">

      {/* Back button */}
      <button
        onClick={() => navigate({ to: "/staff" })}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Staff
      </button>

      {/* Gradient header banner */}
      <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl px-8 pt-8 pb-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 border-2 border-white/30 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">{member.firstName} {member.lastName}</h1>
              <p className="text-blue-100 text-sm capitalize mt-0.5">{member.role}</p>
            </div>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold rounded-xl transition"
          >
            <Mail className="w-4 h-4" /> Invite
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${ROLE_BADGE[member.role] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>{member.role}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${STATUS_BADGE[member.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>{member.status.replace("_", " ")}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${BG_BADGE[member.backgroundCheckStatus] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
            BG: {member.backgroundCheckStatus.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Quick info bar */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 flex flex-wrap gap-6 text-sm text-slate-500">
        {member.phone && (
          <span className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400" />{member.phone}
          </span>
        )}
        {member.email && (
          <span className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />{member.email}
          </span>
        )}
        {member.joinDate && (
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />Joined {member.joinDate}
          </span>
        )}
        {assignedClasses.length > 0 && (
          <span className="flex items-center gap-2 text-blue-600 font-medium">
            <BookOpen className="w-4 h-4" />{assignedClasses.join(", ")}
          </span>
        )}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-5 gap-6 items-start">

        {/* LEFT column (~60%) */}
        <div className="col-span-3 space-y-5">

          {/* Edit details card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Edit details</p>
            <StaffForm
              initial={member}
              onSubmit={submit}
              onCancel={() => navigate({ to: "/staff" })}
              saving={saving}
              error={saveError}
              submitLabel="Save Changes"
            />
          </div>

          {/* Class assignments card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-bold text-slate-700">Class assignments</p>
            </div>
            {assignedClasses.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-3">
                {assignedClasses.map((cls, idx) => {
                  const clsObj = classes.find((c) => c.name === cls);
                  return (
                    <span key={idx} className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                      {cls}
                      {clsObj && (
                        <button onClick={async () => {
                          try {
                            await removeFn({ data: { staffId: member.id, classId: clsObj.id } });
                            setAssignedClasses((p) => p.filter((_, i) => i !== idx));
                          } catch { /* silent */ }
                        }} className="ml-0.5 hover:text-red-500 transition">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-3">No classes assigned yet.</p>
            )}
            <div className="flex gap-2">
              <select
                value={selectedClassToAdd}
                onChange={(e) => setSelectedClassToAdd(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-sm transition"
              >
                <option value="">Select a class to assign…</option>
                {classes.filter((c) => !assignedClasses.includes(c.name)).map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name} ({c.ageGroup})</option>
                ))}
              </select>
              <button
                disabled={!selectedClassToAdd || classAssigning}
                onClick={async () => {
                  if (!selectedClassToAdd) return;
                  setClassAssigning(true);
                  try {
                    await assignFn({ data: { schoolId: tenant.schoolId, locationId: tenant.locationId, staffId: member.id, classId: parseInt(selectedClassToAdd) } });
                    const cls = classes.find((c) => c.id === parseInt(selectedClassToAdd));
                    if (cls) setAssignedClasses((p) => [...p, cls.name]);
                    setSelectedClassToAdd("");
                  } finally { setClassAssigning(false); }
                }}
                className="px-3 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl transition"
              >
                {classAssigning ? "…" : "Assign"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT column (~40%) */}
        <div className="col-span-2 space-y-5">

          {/* Payroll card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setPayrollOpen((o) => !o)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-slate-700">Payroll</span>
                {payroll.filter((r) => r.status === "pending").length > 0 && (
                  <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {payroll.filter((r) => r.status === "pending").length} pending
                  </span>
                )}
              </div>
              {payrollOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {payrollOpen && (
              <div className="border-t border-slate-100 p-5 space-y-4">
                {payrollError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {payrollError}
                  </div>
                )}

                {addingPayroll ? (
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">New payslip</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Month</label>
                        <input type="month" value={payrollForm.month} onChange={(e) => setPF("month", e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Basic salary (₹)</label>
                        <input type="number" value={payrollForm.basicSalary} onChange={(e) => setPF("basicSalary", e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Deductions (₹)</label>
                        <input type="number" value={payrollForm.deductions} onChange={(e) => setPF("deductions", e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Bonus (₹)</label>
                        <input type="number" value={payrollForm.bonus} onChange={(e) => setPF("bonus", e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
                      <input type="text" value={payrollForm.notes} onChange={(e) => setPF("notes", e.target.value)}
                        placeholder="Optional note…"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-500" />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-slate-500">
                        Net: <span className="font-bold text-slate-800">
                          ₹{(parseFloat(payrollForm.basicSalary || "0") - parseFloat(payrollForm.deductions || "0") + parseFloat(payrollForm.bonus || "0")).toLocaleString("en-IN")}
                        </span>
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setAddingPayroll(false)} className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition">Cancel</button>
                        <button onClick={submitPayroll} disabled={payrollSaving}
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition">
                          {payrollSaving ? "Saving…" : "Save payslip"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingPayroll(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition">
                    <Plus className="w-3.5 h-3.5" /> Add payslip
                  </button>
                )}

                {payrollLoading ? (
                  <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}</div>
                ) : payroll.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No payroll records yet.</p>
                ) : (
                  <div className="space-y-2">
                    {payroll.map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{p.month}</p>
                          <p className="text-xs text-slate-400">
                            Basic ₹{parseFloat(p.basicSalary).toLocaleString("en-IN")}
                            {parseFloat(p.deductions) > 0 && ` · -₹${parseFloat(p.deductions).toLocaleString("en-IN")}`}
                            {parseFloat(p.bonus) > 0 && ` · +₹${parseFloat(p.bonus).toLocaleString("en-IN")}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">₹{parseFloat(p.netSalary).toLocaleString("en-IN")}</p>
                          {p.status === "paid" ? (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Paid</span>
                          ) : (
                            <button
                              onClick={async () => {
                                setMarkingPaid(p.id);
                                try {
                                  await markPaidFn({ data: { payrollId: p.id } });
                                  setPayroll((prev) => prev.map((r) => r.id === p.id ? { ...r, status: "paid", paidAt: new Date() } : r));
                                } catch { /* silent */ }
                                finally { setMarkingPaid(null); }
                              }}
                              disabled={markingPaid === p.id}
                              className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition disabled:opacity-60"
                            >
                              {markingPaid === p.id ? "…" : "Mark paid"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Background Verification card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setBgOpen((o) => !o)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-bold text-slate-700">Background Verification</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                  member.backgroundCheckStatus === "verified"    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                  member.backgroundCheckStatus === "rejected"    ? "bg-red-50 text-red-700 border border-red-200" :
                  member.backgroundCheckStatus === "in_progress" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                  member.backgroundCheckStatus === "expired"     ? "bg-orange-50 text-orange-700 border border-orange-200" :
                  "bg-slate-100 text-slate-500 border border-slate-200"
                }`}>{member.backgroundCheckStatus.replace("_", " ")}</span>
              </div>
              {bgOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {bgOpen && (
              <div className="border-t border-slate-100 p-5 space-y-3">
                {bgError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {bgError}
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  Upload the background check report (PDF, JPG, PNG · max 10MB).
                  Uploading will set status to <strong>In progress</strong>.
                </p>

                <div className="flex flex-wrap gap-2 items-center">
                  <label className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border cursor-pointer transition ${bgUploading ? "opacity-50 pointer-events-none" : "bg-white border-slate-200 hover:border-violet-400 hover:bg-violet-50 text-slate-600 hover:text-violet-700"}`}>
                    {bgUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {bgUploading ? "Uploading…" : bgDocUrl ? "Replace document" : "Upload document"}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setBgUploading(true); setBgError("");
                        try {
                          const reader = new FileReader();
                          const dataUrl = await new Promise<string>((res, rej) => {
                            reader.onload = () => res(reader.result as string);
                            reader.onerror = rej;
                            reader.readAsDataURL(file);
                          });
                          const result = await uploadBgFn({ data: { staffId: member.id, fileDataUrl: dataUrl, fileName: file.name } });
                          setBgDocUrl((result as any).publicUrl);
                        } catch (err: any) { setBgError(err?.message ?? "Upload failed"); }
                        finally { setBgUploading(false); e.target.value = ""; }
                      }}
                    />
                  </label>

                  {bgDocUrl && (
                    <a href={bgDocUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition">
                      <ExternalLink className="w-3.5 h-3.5" /> View document
                    </a>
                  )}
                </div>

                {bgDocUrl && (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Document on file
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terminate section — full width, red border card */}
      {member.status !== "terminated" && (
        <div className="bg-white rounded-2xl border border-red-100 p-6">
          <p className="text-sm font-semibold text-slate-700 mb-1">Terminate staff member</p>
          <p className="text-xs text-slate-400 mb-4">Marks them as terminated. Data is preserved.</p>
          {confirmArchive ? (
            <div className="flex gap-2">
              <button
                onClick={doArchive}
                disabled={archiving}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-60"
              >
                {archiving ? "Terminating…" : "Yes, terminate"}
              </button>
              <button
                onClick={() => setConfirmArchive(false)}
                className="px-4 py-2 text-xs font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmArchive(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Terminate
            </button>
          )}
        </div>
      )}

      {/* Invite modal */}
      {inviteOpen && (
        <InviteModal
          initial={{ firstName: member.firstName, lastName: member.lastName, email: member.email }}
          locationId={tenant.locationId}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </div>
  );
}
