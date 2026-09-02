import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getParentPortal } from "@/lib/auth";
import { Users, DollarSign, AlertCircle, CheckCircle2, Clock, CreditCard } from "lucide-react";

export const Route = createFileRoute("/parent")({
  component: ParentPortal,
});

type Child = {
  id: number; firstName: string; lastName: string;
  dateOfBirth: string | null; gender: string | null; status: string; currentClassId: number | null;
};
type Fee = {
  id: number; studentId: number; amount: string;
  dueDate: string | null; status: string; razorpayOrderId: string | null;
};
type PortalData = {
  user: { firstName: string | null; lastName: string | null; email: string };
  children: Child[];
  fees: Fee[];
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

function ParentPortal() {
  const getPortalFn = useServerFn(getParentPortal);
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeChild, setActiveChild] = useState<number>(0);

  useEffect(() => {
    getPortalFn()
      .then((d) => setData(d as PortalData))
      .catch((e) => setError(e?.message ?? "Failed to load portal"))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="space-y-7">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
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
          {/* Child profile card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-violet-600" />
            <div className="p-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl font-extrabold text-blue-600 shrink-0">
                  {child.firstName[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-extrabold text-slate-900">{child.firstName} {child.lastName}</h2>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_BADGE[child.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {child.status}
                    </span>
                  </div>
                  <div className="flex gap-6 mt-2 text-sm text-slate-500 flex-wrap">
                    {child.dateOfBirth && <span>DOB: <span className="font-medium text-slate-700">{child.dateOfBirth}</span></span>}
                    {child.gender && <span>Gender: <span className="font-medium text-slate-700 capitalize">{child.gender.replace("_"," ")}</span></span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

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

          {/* Fee list */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
              <div className="w-1 h-5 bg-blue-600 rounded-full" />
              <h2 className="text-sm font-bold text-slate-800">Fee invoices</h2>
            </div>
            {!childFees.length ? (
              <p className="px-6 py-10 text-sm text-slate-400 text-center">No invoices for this child yet.</p>
            ) : (
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
                  {childFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 text-slate-500 font-medium">#{fee.id}</td>
                      <td className="px-5 py-4 font-bold text-slate-900">₹{parseFloat(fee.amount).toLocaleString("en-IN")}</td>
                      <td className="px-5 py-4 text-slate-500">{fee.dueDate ?? "—"}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${FEE_BADGE[fee.status] ?? "bg-slate-100 text-slate-600"}`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {["sent","overdue"].includes(fee.status) ? (
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition">
                            <CreditCard className="w-3.5 h-3.5" />
                            Pay now
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
