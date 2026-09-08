import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2, Wallet, Search } from "lucide-react";
import { manageExpense, listExpenses, deleteExpense } from "@/lib/auth";
import { useTenant } from "@/lib/tenant";
import { useToast } from "@/lib/toast";
import { usePagination } from "@/lib/usePagination";
import { Pagination } from "@/components/pagination";

export const Route = createFileRoute("/expenses")({
  component: ExpensesPage,
});

type Expense = { id: number; category: string; description: string | null; amount: string; expenseDate: string | null };

const CATEGORIES = ["salary", "electricity", "rent", "supplies", "transport", "maintenance", "other"];
const PAGE_SIZE = 12;
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

  const filteredExpenses = useMemo(() => {
    const q = search.toLowerCase();
    return expenses.filter((e) =>
      (e.category ?? "").toLowerCase().includes(q)
      || (e.description ?? "").toLowerCase().includes(q)
      || (e.amount ?? "").includes(q)
      || (e.expenseDate ?? "").includes(q)
    );
  }, [expenses, search]);

  const { pageItems, currentPage, setCurrentPage, totalPages } = usePagination(filteredExpenses, PAGE_SIZE);

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
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row flex-wrap items-end sm:items-end gap-4">
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls + " bg-white h-10"} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls + " bg-white h-10"} />
          </div>
          <button onClick={load} className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl"><Wallet className="w-4 h-4 inline-block mr-1.5" /> View</button>
        </div>
        <div className="w-full sm:flex-1 sm:min-w-[260px]">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className={inputCls + " bg-white pl-9 h-10 w-full"} placeholder="Search by category, description, amount, date" />
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

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr><th className="text-left px-4 py-2.5 font-semibold text-slate-700 w-16">S.No</th><th className="text-left px-4 py-2.5 font-semibold text-slate-700">Category</th><th className="text-left px-4 py-2.5 font-semibold text-slate-700">Description</th><th className="text-left px-4 py-2.5 font-semibold text-slate-700">Date</th><th className="px-4 py-2.5 text-right font-semibold text-slate-700">Amount</th><th className="px-4 py-2.5 text-right font-semibold text-slate-700">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.map((e, i) => (
                <tr key={e.id} className="hover:bg-slate-50 even:bg-white">
                  <td className="px-4 py-2.5 text-slate-500 w-16">{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-2.5 capitalize">{e.category}</td>
                  <td className="px-4 py-2.5 text-slate-500">{e.description || "—"}</td>
                  <td className="px-4 py-2.5 text-slate-500">{e.expenseDate ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-800">{money(parseFloat(e.amount))}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => setForm({ id: e.id, category: e.category, description: e.description ?? "", amount: String(e.amount), expenseDate: e.expenseDate ?? today })} className="p-1.5 text-slate-500 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={async () => { await deleteExpenseFn({ data: { id: e.id, schoolId: tenant.schoolId, locationId: tenant.locationId } }); await load(); }} className="p-1.5 text-slate-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">{search ? "No matching expenses" : "No expenses found"}</td></tr>}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredExpenses.length}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
}
