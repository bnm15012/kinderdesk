import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { DollarSign, TrendingUp, TrendingDown, Download } from "lucide-react";
import { getPnl } from "@/lib/auth";
import { useTenant } from "@/lib/tenant";

export const Route = createFileRoute("/pnl")({
  component: PnLPage,
});

type Expense = { id: number; category: string; description: string | null; amount: string; expenseDate: string | null };

type PnL = {
  from: string;
  to: string;
  income: number;
  expenses: number;
  net: number;
  expenseList: Expense[];
};

const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition";
const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function PnLPage() {
  const { tenant } = useTenant();
  const reportRef = useRef<HTMLDivElement>(null);

  const getPnlFn = useServerFn(getPnl);

  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);

  const [pnl, setPnl] = useState<PnL | null>(null);

  useEffect(() => {
    if (!tenant) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  const loadData = async () => {
    if (!tenant) return;
    const p = await getPnlFn({ data: { schoolId: tenant.schoolId, locationId: tenant.locationId, from, to } }) as PnL;
    setPnl(p);
  };

  const printPdf = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const html = `
      <html><head><title>P&L Report</title>
      <style>
        body { font-family: sans-serif; padding: 40px; color: #1e293b; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        .meta { color: #64748b; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
        th { background: #f1f5f9; }
        .summary { margin-top: 24px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .total { font-weight: bold; font-size: 16px; }
      </style></head>
      <body>
        <h1>Profit & Loss Report</h1>
        <div class="meta">${pnl ? `${pnl.from} to ${pnl.to}` : ""}</div>
        ${reportRef.current ? reportRef.current.innerHTML : ""}
      </body></html>
    `;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.print();
  };

  if (!tenant) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Profit & Loss</h1>
        <button onClick={printPdf} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg"><Download className="w-4 h-4" /> Download PDF</button>
      </div>

      {/* Date filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls + " bg-white"} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls + " bg-white"} />
        </div>
        <button onClick={loadData} className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl"><TrendingUp className="w-4 h-4 inline-block mr-1.5" /> View Report</button>
      </div>

      {/* P&L Report */}
      <div ref={reportRef} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-2">P&L Statement</h2>
        <p className="text-sm text-slate-500 mb-6">{from} to {to}</p>

        {pnl && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-emerald-600" /><span className="text-xs font-semibold text-emerald-700 uppercase">Income</span></div>
                <p className="text-xl font-bold text-emerald-800">{money(pnl.income)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-rose-600" /><span className="text-xs font-semibold text-rose-700 uppercase">Expenses</span></div>
                <p className="text-xl font-bold text-rose-800">{money(pnl.expenses)}</p>
              </div>
              <div className={`p-4 rounded-2xl border ${pnl.net >= 0 ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"}`}>
                <div className="flex items-center gap-2 mb-1"><DollarSign className={`w-4 h-4 ${pnl.net >= 0 ? "text-blue-600" : "text-amber-600"}`} /><span className={`text-xs font-semibold uppercase ${pnl.net >= 0 ? "text-blue-700" : "text-amber-700"}`}>Net P&L</span></div>
                <p className={`text-xl font-bold ${pnl.net >= 0 ? "text-blue-800" : "text-amber-800"}`}>{money(pnl.net)}</p>
              </div>
            </div>

            <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden mt-4">
              <thead className="bg-slate-50"><tr><th className="text-left px-4 py-2">Category</th><th className="text-left px-4 py-2">Description</th><th className="px-4 py-2 text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {pnl.expenseList.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-2 capitalize">{e.category}</td>
                    <td className="px-4 py-2 text-slate-500">{e.description || "—"}</td>
                    <td className="px-4 py-2 text-right">{money(parseFloat(e.amount))}</td>
                  </tr>
                ))}
                {pnl.expenseList.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">No expenses in this period</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
