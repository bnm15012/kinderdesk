import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAllPayments } from "@/lib/auth";
import { fmtDate } from "@/lib/utils";
import {
  AlertCircle,
  Calendar,
  Inbox,
  IndianRupee,
  RotateCcw,
  Search,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/super-admin/payments")({
  component: PaymentsAdmin,
});

type Payment = {
  id: number;
  amount: number;
  currency: string | null;
  status: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  paidAt: Date | string | null;
  failureReason: string | null;
  createdAt: Date | string | null;
  schoolId: number;
  schoolName: string | null;
  schoolEmail: string | null;
};

const STATUS_BADGE: Record<string, string> = {
  captured: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-600",
  refunded: "bg-slate-100 text-slate-500",
};

const STAT_META: Record<
  string,
  { label: string; stripe: string; bg: string; text: string; icon: LucideIcon }
> = {
  totalCaptured: {
    label: "Total Captured",
    stripe: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: IndianRupee,
  },
  thisMonth: {
    label: "This Month",
    stripe: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: Calendar,
  },
  failed: {
    label: "Failed",
    stripe: "from-red-500 to-rose-500",
    bg: "bg-red-50",
    text: "text-red-600",
    icon: XCircle,
  },
  refunded: {
    label: "Refunded",
    stripe: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: RotateCcw,
  },
};

function fmtCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function truncateId(id: string | null) {
  if (!id) return "—";
  return id.slice(0, 16);
}

function PaymentsAdmin() {
  const listFn = useServerFn(getAllPayments);
  const [items, setItems] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    listFn()
      .then((res: any) => setItems(res as Payment[]))
      .catch((e) => setError(e?.message ?? "Failed to load payments"))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const captured = items.filter((p) => p.status === "captured");
    const totalCaptured = captured.reduce((sum, p) => sum + p.amount, 0);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const thisMonth = captured
      .filter((p) => p.paidAt && new Date(p.paidAt) >= cutoff)
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalCaptured,
      thisMonth,
      failed: items.filter((p) => p.status === "failed").length,
      refunded: items.filter((p) => p.status === "refunded").length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((p) => {
      const statusOk = statusFilter === "all" || p.status === statusFilter;
      const searchOk =
        !term ||
        (p.schoolName ?? "").toLowerCase().includes(term) ||
        (p.schoolEmail ?? "").toLowerCase().includes(term);
      return statusOk && searchOk;
    });
  }, [items, statusFilter, search]);

  if (loading) {
    return (
      <div className="space-y-7">
        <div>
          <div className="w-40 h-7 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="w-72 h-4 bg-slate-200 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 h-28 animate-pulse"
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="w-32 h-4 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-6 py-4 flex gap-4 items-center">
                <div className="w-1/5 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="w-1/6 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="w-1/6 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="w-1/6 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="w-1/6 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="w-1/6 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="w-1/6 h-4 bg-slate-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Payments</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          All subscription payment transactions
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(stats).map(([key, value]) => {
          const meta = STAT_META[key];
          const Icon = meta.icon;
          const displayValue =
            key === "totalCaptured" || key === "thisMonth"
              ? fmtCurrency(value as number)
              : value;
          return (
            <div
              key={key}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className={`h-1.5 bg-gradient-to-r ${meta.stripe}`} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg}`}
                  >
                    <Icon className={`w-5 h-5 ${meta.text}`} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 leading-none mb-1">
                  {displayValue}
                </div>
                <div className="text-xs text-slate-500 font-medium">{meta.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-blue-600 rounded-full" />
            <h2 className="text-sm font-bold text-slate-800">All Payments</h2>
            <span className="text-xs text-slate-400">({filtered.length})</span>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition bg-white"
            >
              <option value="all">All statuses</option>
              <option value="captured">Captured</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by school..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition w-56"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Inbox className="w-10 h-10 mb-3 text-slate-300" />
            <p className="text-sm">No payments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">School</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Razorpay Order ID</th>
                  <th className="px-5 py-3.5">Razorpay Payment ID</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Failure Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {p.schoolName ?? "—"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {p.schoolEmail ?? "—"}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700">
                      {fmtCurrency(p.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                          STATUS_BADGE[p.status ?? ""] ??
                          "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {p.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">
                      {truncateId(p.razorpayOrderId)}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">
                      {truncateId(p.razorpayPaymentId)}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {p.status === "captured"
                        ? fmtDate(p.paidAt)
                        : fmtDate(p.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {p.status === "failed" ? (
                        <span className="text-red-600">
                          {p.failureReason ?? "—"}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
