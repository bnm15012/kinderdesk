import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, Wallet, Search } from "lucide-react";
import { manageExpense, listExpenses, deleteExpense } from "@/lib/auth";
import { useTenant } from "@/lib/tenant";
import { useToast } from "@/lib/toast";

export const Route = createFileRoute("/expenses")({
  component: ExpensesPage,
});

type Expense = { id: number; category: string; description: string | null; amount: string; expenseDate: string | null };

const CATEGORIES = ["salary", "electricity", "rent", "supplies", "transport", "maintenance", "other"];
const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition";
const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function ExpensesPage() {
  const { tenant } = useTenant();
  const toast = useToast();
  const manageExpenseFn = useServerFn(manageExpense);
  const listExpensesFn = useServerFn(listExpenses);
  const deleteExpenseFn = useServerFn(deleteExpense);

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<{ id?: number; category: string; description: string; amount: string; expenseDate: string } | null>(null);

  const filteredExpenses = expenses.filter((e) => {
    const q = search.toLowerCase();
    return (e.category ?? "").toLowerCase().includes(q)
      || (e.description ?? "").toLowerCase().includes(q)
      || (e.amount ?? "").includes(q)
      || (e.expenseDate ?? "").includes(q);
  });

  const load = async () => {
    if (!tenant) return;
    const e = await listExpensesFn({ data: { schoolId: tenant.schoolId, locationId: tenant.locationId, from, to } }) as Expense[];
    setExpenses(e);
  };

  useEffect(() => {
    if (!tenant) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  if (!tenant) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
        <button onClick={() => setForm({ category: CATEGORIES[0], description: "", amount: "", expenseDate: today })} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg"><Plus className="w-4 h-4" /> Add Expense</button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls + " bg-white"} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls + " bg-white"} />
        </div>
        <button onClick={load} className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl"><Wallet className="w-4 h-4 inline-block mr-1.5" /> View</button>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className={inputCls + " bg-white pl-9 w-full"} placeholder="Search by category, description, amount, date" />
          </div>
        </div>
      </div>

      {/* Expenses list */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {form && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls + " bg-white"}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} className={inputCls + " bg-white"} />
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} placeholder="Amount" />
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} placeholder="Description" />
            </div>
            <div className="flex gap-2">
              <button onClick={async () => {
                await manageExpenseFn({ data: { id: form.id, schoolId: tenant.schoolId, locationId: tenant.locationId, category: form.category as any, amount: form.amount, description: form.description, expenseDate: form.expenseDate } });
                setForm(null);
                await load();
                toast("Saved", "success");
              }} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg">Save</button>
              <button onClick={() => setForm(null)} className="px-3 py-1.5 text-slate-600 text-xs font-semibold">Cancel</button>
            </div>
          </div>
        )}

        <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-50"><tr><th className="text-left px-4 py-2">Category</th><th className="text-left px-4 py-2">Description</th><th className="text-left px-4 py-2">Date</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filteredExpenses.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2 capitalize">{e.category}</td>
                <td className="px-4 py-2 text-slate-500">{e.description || "—"}</td>
                <td className="px-4 py-2 text-slate-500">{e.expenseDate ?? "—"}</td>
                <td className="px-4 py-2 text-right">{money(parseFloat(e.amount))}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => setForm({ id: e.id, category: e.category, description: e.description ?? "", amount: String(e.amount), expenseDate: e.expenseDate ?? today })} className="p-1.5 text-slate-500 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={async () => { await deleteExpenseFn({ data: { id: e.id, schoolId: tenant.schoolId, locationId: tenant.locationId } }); await load(); }} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
            {filteredExpenses.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">{search ? "No matching expenses" : "No expenses in this period"}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
