import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getParentPortal, updateChildPersonal, updateParentContact, getCurriculumActivities, createRazorpayOrder, verifyRazorpayPayment, getStudentAttendanceSummary, listReportCards, listHomework, listSchoolAnnouncements } from "@/lib/auth";
import { Users, DollarSign, AlertCircle, CheckCircle2, Clock, CreditCard, BookOpen, Calendar, X, Image, Loader2, BarChart2, GraduationCap, ExternalLink, Clipboard, Megaphone } from "lucide-react";
import { fmtDateTime } from "@/lib/utils";

export const Route = createFileRoute("/parent")({
  component: ParentPortal,
  validateSearch: (search: any) => ({ tab: search?.tab }),
});

type Child = {
  id: number; firstName: string; lastName: string;
  dateOfBirth: string | null; gender: string | null; bloodGroup: string | null; status: string; currentClassId: number | null; className: string | null;
};
type Fee = {
  id: number; studentId: number; amount: string;
  dueDate: string | null; status: string; razorpayOrderId: string | null;
  paidAt: string | null; paidMethod: string | null;
};
type ParentContact = {
  id: number; studentId: number; name: string; relation: string; phone: string | null; address: string | null;
};
type EmergencyContact = {
  id: number; studentId: number; name: string; relation: string; phone: string;
};
type PortalData = {
  user: { firstName: string | null; lastName: string | null; email: string };
  children: Child[];
  fees: Fee[];
  parentContacts: ParentContact[];
  emergencyContacts: EmergencyContact[];
};
type Activity = {
  id: number; classId: number; className: string; title: string;
  description: string | null; activityDate: Date | string; photoUrl: string | null;
  createdAt: Date | string | null; uploaderName: string;
};

const STATUS_BADGE: Record<string, string> = {
  enrolled:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  applied:    "bg-blue-50 text-blue-700 border-blue-200",
  waitlisted: "bg-amber-50 text-amber-700 border-amber-200",
  withdrawn:  "bg-slate-100 text-slate-500 border-slate-200",
};
const FEE_BADGE: Record<string, string> = {
  paid:    "bg-emerald-50 text-emerald-700",
  overdue: "bg-red-50 text-red-700",
  sent:    "bg-blue-50 text-blue-700",
  draft:   "bg-slate-100 text-slate-600",
};

function ProfileItem({ label, value, capitalize, upper }: { label: string; value: string | null; capitalize?: boolean; upper?: boolean }) {
  if (!value) return (
    <div>
      <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="block font-semibold text-slate-900">—</span>
    </div>
  );
  let display = value;
  if (capitalize) display = display.charAt(0).toUpperCase() + display.slice(1);
  if (upper) display = display.toUpperCase();
  return (
    <div>
      <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="block font-semibold text-slate-900">{display}</span>
    </div>
  );
}

// Load Razorpay checkout.js script
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function ParentPortal() {
  const getPortalFn         = useServerFn(getParentPortal);
  const updateChildFn       = useServerFn(updateChildPersonal);
  const updateParentFn      = useServerFn(updateParentContact);
  const getActivitiesFn     = useServerFn(getCurriculumActivities);
  const createOrderFn       = useServerFn(createRazorpayOrder);
  const verifyFn            = useServerFn(verifyRazorpayPayment);
  const getAttendanceFn     = useServerFn(getStudentAttendanceSummary);
  const listReportCardsFn   = useServerFn(listReportCards);
  const listHomeworkFn      = useServerFn(listHomework);
  const listAnnouncementsFn = useServerFn(listSchoolAnnouncements);

  const { tab } = useSearch({ from: "/parent" }) as { tab?: "profile" | "fees" | "academics" | "report" | "homework" | "activities" | "announcements" };
  const navigate = useNavigate();
  const activeTab = tab ?? "profile";

  const [data, setData]         = useState<PortalData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [activeChild, setActiveChild] = useState<number>(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payError, setPayError] = useState<string>("");
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [editForm, setEditForm] = useState<{ bloodGroup: string; gender: string; dateOfBirth: string }>({ bloodGroup: "", gender: "", dateOfBirth: "" });

  // Academic profile state
  const [attendanceSummary, setAttendanceSummary] = useState<any[]>([]);
  const [reportCardsList, setReportCardsList] = useState<any[]>([]);
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [announcementsList, setAnnouncementsList] = useState<any[]>([]);
  const [academicLoading, setAcademicLoading] = useState(false);

  // Default to the profile tab in the URL if none is set
  useEffect(() => {
    if (!tab) navigate({ to: "/parent", search: { tab: "profile" }, replace: true });
  }, [tab, navigate]);

  const handlePayNow = async (fee: Fee) => {
    setPayingId(fee.id); setPayError("");
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay. Check your internet connection.");

      const order = await createOrderFn({ data: { invoiceId: fee.id } }) as { orderId: string; amount: number; keyId: string };

      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: "INR",
          order_id: order.orderId,
          name: "School Fee Payment",
          description: `Invoice #${fee.id}`,
          prefill: { email: data?.user.email ?? "" },
          theme: { color: "#6366f1" },
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            try {
              await verifyFn({ data: {
                invoiceId: fee.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }});
              // Update local state
              setData((prev) => prev ? {
                ...prev,
                fees: prev.fees.map((f) => f.id === fee.id ? { ...f, status: "paid", paidAt: new Date().toISOString(), paidMethod: "razorpay" } : f),
              } : prev);
              resolve();
            } catch (err: any) { reject(err); }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        rzp.open();
      });
    } catch (err: any) {
      if (err?.message !== "Payment cancelled") {
        setPayError(err?.message ?? "Payment failed. Please try again.");
      }
    } finally {
      setPayingId(null);
    }
  };

  const handleSavePersonal = async () => {
    if (!child) return;
    setSaving(true); setError("");
    try {
      const payload: any = { studentId: child.id };
      if (editForm.gender) payload.gender = editForm.gender;
      if (editForm.bloodGroup) payload.bloodGroup = editForm.bloodGroup;
      if (editForm.dateOfBirth) payload.dateOfBirth = editForm.dateOfBirth;
      await updateChildFn({ data: payload });
      const refreshed = await getPortalFn() as PortalData;
      setData(refreshed);
      setEditing(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    Promise.all([
      getPortalFn().then((d) => setData(d as PortalData)),
      getActivitiesFn({ data: {} }).then((a) => setActivities(a as Activity[])).catch(() => {}),
    ])
      .catch((e) => setError(e?.message ?? "Failed to load portal"))
      .finally(() => setLoading(false));
  }, []);

  // Load academic data whenever active child changes
  useEffect(() => {
    if (!data?.children[activeChild]?.id) return;
    const childId = data.children[activeChild].id;
    setAcademicLoading(true);
    setAttendanceSummary([]); setReportCardsList([]); setHomeworkList([]); setAnnouncementsList([]);
    Promise.all([
      getAttendanceFn({ data: { studentId: childId } }).then((d) => setAttendanceSummary(d as any[])).catch(() => {}),
      listReportCardsFn({ data: { studentId: childId } }).then((d) => setReportCardsList(d as any[])).catch(() => {}),
      listHomeworkFn({ data: { studentId: childId } }).then((d) => setHomeworkList(d as any[])).catch(() => {}),
      listAnnouncementsFn({ data: { target: "parents" } }).then((d) => setAnnouncementsList(d as any[])).catch(() => {}),
    ]).finally(() => setAcademicLoading(false));
  }, [activeChild, data?.children.length]);

  if (loading) return (
    <div className="space-y-4">
      {[1,2].map(i => <div key={i} className="bg-white rounded-2xl border border-slate-200 h-32 animate-pulse" />)}
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-sm">
      <AlertCircle className="w-5 h-5 shrink-0" /> {error}
    </div>
  );

  const child = data?.children[activeChild];
  const childFees = data?.fees.filter((f) => f.studentId === child?.id) ?? [];
  const totalDue = childFees
    .filter((f) => ["sent","overdue"].includes(f.status))
    .reduce((a, f) => a + parseFloat(f.amount), 0);
  const pendingFees = childFees.filter((f) => ["sent","overdue"].includes(f.status));
  const paidFees = childFees.filter((f) => f.status === "paid");

  return (
    <div className="space-y-4 md:space-y-7">

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Welcome, {data?.user.firstName ?? "Parent"}!
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Your child's school portal</p>
      </div>

      {/* No children */}
      {!data?.children.length && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">No children linked yet</h3>
          <p className="text-sm text-slate-400">Contact your school admin to link your child to this account.</p>
        </div>
      )}

      {/* Child selector tabs (if multiple children) */}
      {(data?.children.length ?? 0) > 1 && (
        <div className="flex gap-2 flex-wrap">
          {data!.children.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveChild(i)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                i === activeChild
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              {c.firstName} {c.lastName}
            </button>
          ))}
        </div>
      )}

      {child && (
        <>
          {activeTab === "profile" && (<>
          {/* Child full profile card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-violet-600" />
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-xl sm:text-2xl font-extrabold text-blue-600 shrink-0">
                  {child.firstName[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-extrabold text-slate-900">{child.firstName} {child.lastName}</h2>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_BADGE[child.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {child.status}
                    </span>
                  </div>
                  {editing ? (
                    <div className="flex flex-col sm:flex-row gap-3 mt-3">
                      <input type="date" value={editForm.dateOfBirth} onChange={(e) => setEditForm((f) => ({ ...f, dateOfBirth: e.target.value }))} className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm" />
                      <select value={editForm.gender} onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))} className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm">
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                      <input type="text" placeholder="Blood group" value={editForm.bloodGroup} onChange={(e) => setEditForm((f) => ({ ...f, bloodGroup: e.target.value }))} className="px-2 py-1.5 rounded-lg border border-slate-200 text-sm w-28" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-sm">
                      <ProfileItem label="Date of birth" value={child.dateOfBirth} />
                      <ProfileItem label="Gender" value={child.gender ? child.gender.replace("_", " ") : null} capitalize />
                      <ProfileItem label="Blood group" value={child.bloodGroup} upper />
                      <ProfileItem label="Class" value={child.className} />
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {editing ? (
                    <div className="flex gap-2">
                      <button onClick={handleSavePersonal} disabled={saving} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition">{saving ? "Saving..." : "Save"}</button>
                      <button onClick={() => setEditing(false)} disabled={saving} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditForm({ bloodGroup: child.bloodGroup ?? "", gender: child.gender ?? "", dateOfBirth: child.dateOfBirth ?? "" }); setEditing(true); }} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition">Edit</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Parent / Guardian contacts */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-violet-50 text-violet-700">
              <Users className="w-4 h-4" />
              <h3 className="text-sm font-bold">Parents / Guardians</h3>
            </div>
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.parentContacts.filter((p) => p.studentId === child.id).length === 0 ? (
                <p className="text-sm text-slate-400 col-span-2">No parent contacts on record.</p>
              ) : data.parentContacts.filter((p) => p.studentId === child.id).map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{p.name}</span>
                    <span className="text-xs text-slate-500 capitalize">({p.relation})</span>
                  </div>
                  {p.phone ? <div className="text-sm text-slate-600"><span className="text-slate-400 text-xs uppercase tracking-wide">Phone</span> <span className="block font-medium">{p.phone}</span></div> : null}
                  {p.address ? <div className="text-sm text-slate-600"><span className="text-slate-400 text-xs uppercase tracking-wide">Address</span> <span className="block font-medium">{p.address}</span></div> : null}
                </div>
              ))}
            </div>
          </div>

          {/* Emergency contacts */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-rose-50 text-rose-700">
              <AlertCircle className="w-4 h-4" />
              <h3 className="text-sm font-bold">Emergency Contacts</h3>
            </div>
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.emergencyContacts.filter((e) => e.studentId === child.id).length === 0 ? (
                <p className="text-sm text-slate-400 col-span-2">No emergency contacts on record.</p>
              ) : data.emergencyContacts.filter((e) => e.studentId === child.id).map((e) => (
                <div key={e.id} className="rounded-xl border border-slate-200 p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{e.name}</span>
                    <span className="text-xs text-slate-500 capitalize">({e.relation})</span>
                  </div>
                  <div className="text-sm text-slate-600"><span className="text-slate-400 text-xs uppercase tracking-wide">Phone</span> <span className="block font-medium">{e.phone}</span></div>
                </div>
              ))}
            </div>
          </div>
          </>)}

          {activeTab === "fees" && (<>
          {/* Fee summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total due",     value: `₹${totalDue.toLocaleString("en-IN")}`, icon: DollarSign, color: totalDue > 0 ? "text-red-600" : "text-emerald-600", bg: totalDue > 0 ? "bg-red-50" : "bg-emerald-50", stripe: totalDue > 0 ? "from-red-500 to-rose-500" : "from-emerald-500 to-teal-500" },
              { label: "Pending invoices", value: childFees.filter(f=>["sent","overdue"].includes(f.status)).length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", stripe: "from-amber-400 to-orange-500" },
              { label: "Total invoices",   value: childFees.length,                                                 icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50", stripe: "from-blue-500 to-blue-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className={`h-1.5 bg-gradient-to-r ${s.stripe}`} />
                <div className="p-5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pay error banner */}
          {payError && (
            <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" /> {payError}
              <button onClick={() => setPayError("")} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Pending invoices */}
          {pendingFees.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />
              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                <div className="w-1 h-5 bg-red-500 rounded-full" />
                <h2 className="text-sm font-bold text-slate-800">Pending Payments</h2>
                <span className="ml-auto text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">{pendingFees.length} due</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Invoice</th>
                      <th className="px-5 py-3.5">Amount</th>
                      <th className="px-5 py-3.5">Due date</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingFees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-4 text-slate-500 font-medium">#{fee.id}</td>
                        <td className="px-5 py-4 font-bold text-slate-900">₹{parseFloat(fee.amount).toLocaleString("en-IN")}</td>
                        <td className="px-5 py-4 text-slate-500">
                          {fee.dueDate ?? "—"}
                          {fee.status === "overdue" && <span className="ml-1 text-xs text-red-500 font-semibold">(overdue)</span>}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${FEE_BADGE[fee.status] ?? "bg-slate-100 text-slate-600"}`}>
                            {fee.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handlePayNow(fee)}
                            disabled={payingId === fee.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-lg transition"
                          >
                            {payingId === fee.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                            {payingId === fee.id ? "Processing…" : "Pay online"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 flex items-center gap-2">
                <span>💡 You can also pay in cash at the school reception — staff will mark it as paid.</span>
              </div>
            </div>
          )}

          {/* Paid invoices */}
          {paidFees.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-slate-800">Payment History</h2>
                <span className="ml-auto text-xs text-slate-400">{paidFees.length} paid</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Invoice</th>
                      <th className="px-5 py-3.5">Amount</th>
                      <th className="px-5 py-3.5">Paid on</th>
                      <th className="px-5 py-3.5">Method</th>
                      <th className="px-5 py-3.5">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paidFees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-4 text-slate-500 font-medium">#{fee.id}</td>
                        <td className="px-5 py-4 font-bold text-emerald-700">₹{parseFloat(fee.amount).toLocaleString("en-IN")}</td>
                        <td className="px-5 py-4 text-slate-500">
                          {fee.paidAt ? new Date(fee.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className="capitalize text-slate-600 text-xs font-medium">{fee.paidMethod?.replace("_", " ") ?? "—"}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Paid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No invoices at all */}
          {childFees.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm text-slate-400">No invoices for this child yet.</p>
            </div>
          )}

          </>)}

          {activeTab === "academics" && (<>
          {/* Academic Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
              <div className="w-1 h-5 bg-blue-600 rounded-full" />
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">Academic Profile</h2>
            </div>
            {academicLoading ? (
              <div className="p-6 space-y-3">{[1,2].map(i=><div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse"/>)}</div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Attendance Summary */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart2 className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-bold text-slate-700">Attendance</h3>
                  </div>
                  {attendanceSummary.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No attendance data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {attendanceSummary.slice(0, 6).map((m: any) => {
                        const pct = m.pct as number;
                        const barColor = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
                        const badgeColor = pct >= 75 ? "bg-emerald-50 text-emerald-700" : pct >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
                        return (
                          <div key={m.monthKey}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-700">{m.label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">{m.present}P · {m.absent}A</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{pct}%</span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full">
                              <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Report Cards */}
                <div className="border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-4 h-4 text-violet-500" />
                    <h3 className="text-sm font-bold text-slate-700">Report Cards</h3>
                  </div>
                  {reportCardsList.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No report cards uploaded yet</p>
                  ) : (() => {
                    // Group by academic year descending
                    const byYear = new Map<string, any[]>();
                    for (const rc of reportCardsList) {
                      const yr = rc.academicYear ?? "Unknown";
                      if (!byYear.has(yr)) byYear.set(yr, []);
                      byYear.get(yr)!.push(rc);
                    }
                    const years = [...byYear.keys()].sort((a, b) => b.localeCompare(a));
                    return (
                      <div className="space-y-4">
                        {years.map((year) => (
                          <div key={year}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-full">{year}</span>
                            </div>
                            <div className="space-y-2 border-l-2 border-violet-100 ml-2 pl-1">
                              {byYear.get(year)!.map((rc: any) => (
                                <div key={rc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 ml-2">
                                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                                    <GraduationCap className="w-4 h-4 text-violet-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800">{rc.term}</p>
                                    {rc.className && <p className="text-xs text-slate-400">{rc.className}</p>}
                                  </div>
                                  {rc.publicUrl && (
                                    <a href={rc.publicUrl} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition shrink-0">
                                      <ExternalLink className="w-3 h-3" /> Download
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          </>)}

          {activeTab === "homework" && (<>
          {/* Homework */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
              <div className="w-1 h-5 bg-amber-600 rounded-full" />
              <Clipboard className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-800">Homework</h2>
            </div>
            {homeworkList.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">No homework assigned</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {homeworkList.map((h: any) => (
                  <div key={h.id} className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Clipboard className="w-4 h-4 text-amber-500" />
                      <h3 className="font-semibold text-slate-900 text-sm">{h.title}</h3>
                    </div>
                    {h.description && <p className="text-xs text-slate-500 mb-2">{h.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {h.subjectName && <span>{h.subjectName}</span>}
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {new Date(h.dueDate).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          </>)}

          {activeTab === "announcements" && (<>
          {/* Announcements */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
              <div className="w-1 h-5 bg-pink-600 rounded-full" />
              <Megaphone className="w-4 h-4 text-pink-600" />
              <h2 className="text-sm font-bold text-slate-800">Announcements</h2>
            </div>
            {announcementsList.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">No announcements</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {announcementsList.map((a: any) => (
                  <div key={a.id} className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Megaphone className="w-4 h-4 text-pink-500" />
                      <h3 className="font-semibold text-slate-900 text-sm">{a.title}</h3>
                    </div>
                    {a.message && <p className="text-xs text-slate-500">{a.message}</p>}
                    <p className="text-[10px] text-slate-400 mt-1">{fmtDateTime(a.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div></>)}

          {activeTab === "activities" && (<>
          {/* Curriculum Activity Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
              <div className="w-1 h-5 bg-violet-600 rounded-full" />
              <BookOpen className="w-4 h-4 text-violet-600" />
              <h2 className="text-sm font-bold text-slate-800">Classroom Activities</h2>
              {activities.length > 0 && (
                <span className="ml-auto text-xs text-slate-400">{activities.length} activities</span>
              )}
            </div>
            {!activities.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 text-violet-300" />
                </div>
                <p className="text-sm text-slate-500 font-medium">No activities posted yet</p>
                <p className="text-xs text-slate-400 mt-1">Your child's teacher will post classroom activities here</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activities.map((act) => (
                  <div key={act.id} className="flex gap-4 p-5 hover:bg-slate-50 transition">
                    {/* Photo thumbnail */}
                    <div
                      className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 ${act.photoUrl ? "cursor-pointer" : ""}`}
                      onClick={() => act.photoUrl && setLightbox(act.photoUrl)}
                    >
                      {act.photoUrl ? (
                        <img src={act.photoUrl} alt={act.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
                          <Image className="w-7 h-7 text-violet-300" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1">{act.title}</h3>
                      {act.description && <p className="text-xs text-slate-500 line-clamp-2 mb-2">{act.description}</p>}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <BookOpen className="w-3 h-3" /> {act.className}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(act.activityDate as string).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span className="text-xs text-slate-400">by {act.uploaderName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div></>)}
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition">
            <X className="w-5 h-5" />
          </button>
          <img src={lightbox} alt="Activity" className="max-w-full max-h-full rounded-xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
