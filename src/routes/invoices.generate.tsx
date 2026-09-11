import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateStudentInvoice, listStudents } from "@/lib/auth";
import { useTenant } from "@/lib/tenant";
import { Calendar, FileText } from "lucide-react";

export const Route = createFileRoute("/invoices/generate")({
  component: GenerateInvoice,
});

const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition";

function monthValue(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function GenerateInvoice() {
  const { tenant } = useTenant();
  const listStudentsFn = useServerFn(listStudents);
  const generateInvoiceFn = useServerFn(generateStudentInvoice);
  const [students, setStudents] = useState<{ id: number; firstName: string; lastName: string }[]>([]);
  const [studentId, setStudentId] = useState<number | "">("");
  const [month, setMonth] = useState(monthValue());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    listStudentsFn({ data: { schoolId: tenant.schoolId, locationId: tenant.locationId } })
      .then((s: any[]) => setStudents(s.map((x: any) => ({ id: x.id, firstName: x.firstName, lastName: x.lastName }))));
  }, [tenant]);

  const onGenerate = async () => {
    if (!tenant || !studentId || !month) return;
    setLoading(true);
    try {
      const { invoiceId } = await generateInvoiceFn({
        data: { schoolId: tenant.schoolId, locationId: tenant.locationId, studentId: Number(studentId), month },
      }) as any;
      window.open(`/invoice-print?invoiceId=${invoiceId}`, "_blank");
    } finally {
      setLoading(false);
    }
  };

  if (!tenant) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3"><FileText className="w-6 h-6 text-blue-600" /> Generate Monthly Invoice</h1>
        <p className="text-sm text-slate-500">Create a month-level fee invoice for a student. If one already exists for this student and month, the existing one is returned unchanged.</p>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Student</label>
          <select className={inputCls + " bg-white"} value={studentId} onChange={(e) => setStudentId(Number(e.target.value))}>
            <option value="">Select student</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
          </select>
          {students.length === 0 && <p className="text-xs text-slate-500 mt-1.5">No students found. Add a student in <strong>Admissions</strong> first.</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Month</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="month" className={inputCls + " bg-white pl-10"} value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={loading || !studentId}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition"
        >
          {loading ? "Generating…" : "Generate Invoice"}
        </button>

        <Link to="/fees" className="block text-center text-sm text-slate-500 hover:text-blue-600">Back to Fees</Link>
      </div>
    </div>
  );
}
