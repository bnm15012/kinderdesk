import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, X, Pencil, Trash2, Megaphone } from "lucide-react";
import { manageSchoolAnnouncement, listSchoolAnnouncements, deleteSchoolAnnouncement } from "@/lib/auth";
import { fmtDateTime } from "@/lib/utils";
import { useToast } from "@/lib/toast";

export const Route = createFileRoute("/announcements")({
  component: AnnouncementsPage,
});

type Announcement = { id: number; title: string; message: string | null; target: string; createdAt: any; scope: "school" | "global" };

const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition";

function AnnouncementsPage() {
  const toast = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annForm, setAnnForm] = useState<{ id?: number; title: string; message: string; target: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const listFn = useServerFn(listSchoolAnnouncements);
  const manageFn = useServerFn(manageSchoolAnnouncement);
  const deleteFn = useServerFn(deleteSchoolAnnouncement);

  useEffect(() => {
    setLoading(true);
    listFn({ data: {} })
      .then((d) => setAnnouncements(d as Announcement[]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-none space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">School Announcements</h2>
          <button onClick={() => setAnnForm({ title: "", message: "", target: "all" })} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {annForm && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
            <input value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} className={inputCls} placeholder="Title" />
            <textarea value={annForm.message} onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })} className={inputCls} rows={3} placeholder="Message" />
            <select value={annForm.target} onChange={(e) => setAnnForm({ ...annForm, target: e.target.value })} className={inputCls + " bg-white"}>
              <option value="all">All</option>
              <option value="parents">Parents</option>
              <option value="staff">Staff</option>
            </select>
            <div className="flex gap-2">
              <button onClick={async () => {
                if (!annForm.title) return;
                await manageFn({ data: { id: annForm.id, title: annForm.title, message: annForm.message, target: annForm.target as any } });
                setAnnForm(null);
                const d = await listFn({ data: {} });
                setAnnouncements(d as Announcement[]);
                toast("Saved", "success");
              }} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg">Save</button>
              <button onClick={() => setAnnForm(null)} className="px-3 py-1.5 text-slate-600 text-xs font-semibold">Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-400 text-center py-8">Loading…</p>
        ) : (
          <div className="space-y-2">
            {announcements.map((a) => (
              <div key={`${a.scope}-${a.id}`} className="p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-slate-800">{a.title}</p>
                  {a.scope === "school" && (
                    <div className="flex gap-1">
                      <button onClick={() => setAnnForm({ id: a.id, title: a.title, message: a.message ?? "", target: a.target })} className="p-1 text-slate-500 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { await deleteFn({ data: { id: a.id } }); setAnnouncements((p) => p.filter((x) => x.id !== a.id)); }} className="p-1 text-slate-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-1">{a.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{fmtDateTime(a.createdAt)}</p>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{a.target}{a.scope === "global" ? " (global)" : ""}</span>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No announcements</p>}
          </div>
        )}
      </div>
    </div>
  );
}
