export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}) {
  if (totalPages <= 1) return null;
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalItems);

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-slate-500">Showing {start}–{end} of {totalItems} records</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50">Prev</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onPageChange(p)} className={`w-9 h-9 text-sm font-semibold rounded-lg ${currentPage === p ? "bg-blue-600 text-white" : "border border-slate-200 hover:bg-slate-50"}`}>{p}</button>
        ))}
        <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50">Next</button>
      </div>
    </div>
  );
}
