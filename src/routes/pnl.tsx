import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, Download, Printer, FileText, TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

import { getPnl } from "@/lib/auth";
import { useTenant } from "@/lib/tenant";
import { useToast } from "@/lib/toast";

export const Route = createFileRoute("/pnl")({
  component: PnLPage,
});

type Income = { id: number; studentName: string; method: string; feeName: string | null; amount: string; paidAt: string | null };
type Expense = { id: number; category: string; description: string | null; amount: string; expenseDate: string | null };
type Location = { name: string; address: string | null; city: string | null; state: string | null; pincode: string | null };
type School = { name: string; logoUrl: string | null };

type PnL = {
  from: string;
  to: string;
  income: number;
  expenses: number;
  net: number;
  location: Location;
  school: School;
  incomeList: Income[];
  expenseList: Expense[];
};

const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition";
const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const toneStyles: Record<string, { bg: string; icon: string; text: string }> = {
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", text: "text-emerald-700" },
  rose: { bg: "bg-rose-50", icon: "text-rose-600", text: "text-rose-700" },
  blue: { bg: "bg-blue-50", icon: "text-blue-600", text: "text-blue-700" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", text: "text-amber-700" },
};

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: React.ElementType; tone: string }) {
  const t = toneStyles[tone];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold ${t.text} mt-1`}>{money(value)}</p>
      </div>
      <div className={`w-12 h-12 rounded-full ${t.bg} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${t.icon}`} />
      </div>
    </div>
  );
}

const fmtDate = (d: string | null | Date) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

function PnLPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  const getPnlFn = useServerFn(getPnl);

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);

  const [pnl, setPnl] = useState<PnL | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  const loadData = async () => {
    if (!tenant) return;
    setLoading(true);
    setPnl(null);
    try {
      const p = await getPnlFn({ data: { schoolId: tenant.schoolId, locationId: tenant.locationId, from, to } }) as PnL;
      setPnl(p);
    } catch (err: any) {
      toast(err?.message ?? "Failed to load report", "error");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!reportRef.current) return;
    try {
      const dataUrl = await toPng(reportRef.current, { pixelRatio: 2, backgroundColor: "#ffffff", style: { width: "794px", maxWidth: "794px", overflow: "hidden", boxSizing: "border-box" } });
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (img.naturalHeight / img.naturalWidth) * imgWidth;

      let y = 0;
      while (y < imgHeight) {
        pdf.addImage(dataUrl, "PNG", 0, -y, imgWidth, imgHeight);
        if (y + pageHeight < imgHeight) pdf.addPage();
        y += pageHeight;
      }
      pdf.save(`pnl-${from}-to-${to}.pdf`);
    } catch (err: any) {
      toast(err?.message ?? "PDF download failed", "error");
    }
  };

  const printPdf = () => {
    const originalTitle = document.title;
    document.title = `pnl-${from}-to-${to}`;
    window.print();
    document.title = originalTitle;
  };

  const generatedOn = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const cityLine = (loc?: Location) => [loc?.city, loc?.state, loc?.pincode].filter(Boolean).join(", ") || null;

  if (!tenant) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="w-full max-w-none h-full space-y-5 print:space-y-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-container { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>

      <div className="flex items-center justify-between no-print">
        <h1 className="text-2xl font-bold text-slate-900">Profit & Loss</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <SummaryCard label="Total Income" value={pnl?.income ?? 0} icon={TrendingUp} tone="emerald" />
        <SummaryCard label="Total Expense" value={pnl?.expenses ?? 0} icon={TrendingDown} tone="rose" />
        <SummaryCard label="Net P&L" value={pnl?.net ?? 0} icon={(pnl?.net ?? 0) >= 0 ? TrendingUp : TrendingDown} tone={(pnl?.net ?? 0) >= 0 ? "blue" : "amber"} />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 items-start no-print">
        {/* Filters */}
        <div className="w-full lg:w-72 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 shrink-0 lg:sticky lg:top-5">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${inputCls} pl-10`} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">To</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${inputCls} pl-10`} />
              </div>
            </div>
          </div>
          <button onClick={loadData} disabled={loading} className="w-full h-10 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer mt-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {loading ? "Loading..." : "Generate Report"}
          </button>
          <div className="grid grid-cols-1 gap-3">
            <button onClick={downloadPdf} className="flex items-center justify-center gap-1.5 h-10 px-3 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition cursor-pointer">
              <Download className="w-4 h-4" /> Download
            </button>
            <button onClick={printPdf} className="flex items-center justify-center gap-1.5 h-10 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition cursor-pointer">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* Report preview */}
        <div className="flex-1 w-full h-[calc(100vh-200px)] overflow-auto">
          <div ref={reportRef} className="report-pdf print-container w-full min-w-0 shadow-lg rounded-none p-4 text-sm">
              <style>{`
                .report-pdf { background-color: #ffffff !important; color: #0f172a !important; }
                .report-pdf * { color: #0f172a !important; background-color: transparent !important; border-color: #e2e8f0 !important; }
                .report-pdf .text-slate-900 { color: #0f172a !important; }
                .report-pdf .text-slate-800 { color: #1e293b !important; }
                .report-pdf .text-slate-700 { color: #334155 !important; }
                .report-pdf .text-slate-600 { color: #475569 !important; }
                .report-pdf .text-slate-500 { color: #64748b !important; }
                .report-pdf .text-slate-400 { color: #94a3b8 !important; }
                .report-pdf .text-emerald-700 { color: #047857 !important; }
                .report-pdf .text-emerald-800 { color: #166534 !important; }
                .report-pdf .text-rose-700 { color: #be123c !important; }
                .report-pdf .text-rose-800 { color: #9f1239 !important; }
                .report-pdf .text-blue-700 { color: #1d4ed8 !important; }
                .report-pdf .text-blue-800 { color: #1e40af !important; }
                .report-pdf .text-amber-700 { color: #b45309 !important; }
                .report-pdf .text-amber-800 { color: #92400e !important; }
                .report-pdf .bg-white { background-color: #ffffff !important; }
                .report-pdf .report-header { background-color: #ffffff !important; border-bottom: 2px solid #2563eb !important; }
                .report-pdf .report-logo { background-color: #f1f5f9 !important; border: 1px solid #e2e8f0 !important; color: #64748b !important; }
                .report-pdf .report-logo-img { background-color: transparent !important; }
                .report-pdf .report-title { color: #1e40af !important; }
                .report-pdf .report-muted { color: #64748b !important; }
                .report-pdf .report-card-income { background-color: #f0fdf4 !important; border: 1px solid #bbf7d0 !important; }
                .report-pdf .report-card-expense { background-color: #fff1f2 !important; border: 1px solid #fecdd3 !important; }
                .report-pdf .report-card-net { background-color: #eff6ff !important; border: 1px solid #bfdbfe !important; }
                .report-pdf .report-card-net-neg { background-color: #fffbeb !important; border: 1px solid #fde68a !important; }
                .report-pdf .report-table { background-color: #ffffff !important; border: 1px solid #e2e8f0 !important; border-collapse: collapse !important; table-layout: fixed !important; width: 100% !important; }
                .report-pdf .report-thead { background-color: #f8fafc !important; }
                .report-pdf .report-table th, .report-pdf .report-table td { border: 1px solid #e2e8f0 !important; padding: 6px !important; white-space: normal !important; overflow-wrap: break-word !important; font-size: 10px !important; }
                .report-pdf .report-total { background-color: #f8fafc !important; }
              `}</style>

              {/* Header */}
              <div className="report-header flex items-start justify-between pb-4 mb-5">
                <div className="flex items-start gap-4">
                  {pnl?.school?.logoUrl ? (
                    <div className="report-logo-img w-20 h-20 rounded-xl overflow-hidden">
                      <img src={pnl.school.logoUrl} alt="" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="report-logo w-20 h-20 rounded-xl flex flex-col items-center justify-center text-xs font-semibold">LOGO</div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{pnl?.school?.name ?? tenant.schoolName}</h2>
                    <p className="text-xs report-muted mt-0.5">{pnl ? `${pnl.from} to ${pnl.to}` : `${from} to ${to}`}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-slate-900">{pnl?.location?.name ?? tenant.locationName}</p>
                  {pnl?.location?.address && <p className="text-xs report-muted mt-0.5">{pnl.location.address}</p>}
                  {cityLine(pnl?.location) && <p className="text-xs report-muted">{cityLine(pnl.location)}</p>}
                  <p className="text-xs report-muted mt-1">Generated on: {generatedOn}</p>
                </div>
              </div>

              {loading ? (
                <p className="text-slate-400 text-center py-20 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading report...
                </p>
              ) : !pnl ? (
                <p className="text-slate-400 text-center py-20">Select a date range and click Generate Report</p>
              ) : (
                <div className="space-y-5">
                  {/* Summary cards */}
                  <div className="flex">
                    <div className="w-1/3 report-card-income p-3 rounded-xl">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1">Total Income</p>
                      <p className="text-lg font-bold text-emerald-800">{money(pnl.income)}</p>
                    </div>
                    <div className="w-1/3 report-card-expense p-3 rounded-xl">
                      <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 mb-1">Total Expense</p>
                      <p className="text-lg font-bold text-rose-800">{money(pnl.expenses)}</p>
                    </div>
                    <div className={`w-1/3 p-3 rounded-xl ${pnl.net >= 0 ? "report-card-net" : "report-card-net-neg"}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${pnl.net >= 0 ? "text-blue-700" : "text-amber-700"}`}>Net P&L</p>
                      <p className={`text-lg font-bold ${pnl.net >= 0 ? "text-blue-800" : "text-amber-800"}`}>{money(pnl.net)}</p>
                    </div>
                  </div>

                  {/* Income */}
                  <section>
                    <h3 className="text-base font-bold text-slate-900 mb-1.5">Income</h3>
                    <table className="report-table w-full text-sm">
                      <thead className="report-thead">
                        <tr>
                          <th className="text-left w-10">No.</th>
                          <th className="text-left w-32">Student</th>
                          <th className="text-left w-24">Payment Mode</th>
                          <th className="text-left w-20">Fee</th>
                          <th className="text-left w-20">Date</th>
                          <th className="text-right w-24">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pnl.incomeList.length === 0 ? (
                          <tr><td colSpan={6} className="px-3 py-4 text-center text-slate-400">No income in this period</td></tr>
                        ) : (
                          pnl.incomeList.map((income, i) => (
                            <tr key={income.id}>
                              <td className="text-slate-500">{i + 1}</td>
                              <td className="font-medium text-slate-900">{income.studentName}</td>
                              <td className="text-slate-600 capitalize">{income.method.replace(/_/g, " ")}</td>
                              <td className="text-slate-500">{income.feeName ?? "—"}</td>
                              <td className="text-slate-500">{fmtDate(income.paidAt)}</td>
                              <td className="text-right font-medium text-slate-900">{money(parseFloat(income.amount))}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </section>

                  {/* Expenses */}
                  <section>
                    <h3 className="text-base font-bold text-slate-900 mb-1.5">Expenses</h3>
                    <table className="report-table w-full text-sm">
                      <thead className="report-thead">
                        <tr>
                          <th className="text-left w-10">No.</th>
                          <th className="text-left w-20">Category</th>
                          <th className="text-left w-1/2">Description</th>
                          <th className="text-left w-20">Date</th>
                          <th className="text-right w-24">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pnl.expenseList.length === 0 ? (
                          <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-400">No expenses in this period</td></tr>
                        ) : (
                          pnl.expenseList.map((e, i) => (
                            <tr key={e.id}>
                              <td className="text-slate-500">{i + 1}</td>
                              <td className="font-medium text-slate-900 capitalize">{e.category}</td>
                              <td className="text-slate-500">{e.description || "—"}</td>
                              <td className="text-slate-500">{fmtDate(e.expenseDate)}</td>
                              <td className="text-right font-medium text-slate-900">{money(parseFloat(e.amount))}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </section>

                  {/* Footer summary */}
                  <section className="w-80 ml-auto">
                    <table className="report-table w-full text-sm">
                      <tbody>
                        <tr>
                          <td className="text-slate-600">Total Income</td>
                          <td className="text-right font-semibold text-emerald-700">{money(pnl.income)}</td>
                        </tr>
                        <tr>
                          <td className="text-slate-600">Total Expense</td>
                          <td className="text-right font-semibold text-rose-700">{money(pnl.expenses)}</td>
                        </tr>
                        <tr className="report-total font-semibold">
                          <td className="text-slate-900">Net P&L</td>
                          <td className={`text-right font-bold ${pnl.net >= 0 ? "text-blue-700" : "text-amber-700"}`}>{money(pnl.net)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </section>
                </div>
              )}

              {/* PDF footer */}
              <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
                This is a computer-generated report. For queries, contact {tenant.schoolName}.
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
