import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Megaphone } from "lucide-react";
import { listSchoolAnnouncements } from "@/lib/auth";
import { fmtDateTime } from "@/lib/utils";

export const Route = createFileRoute("/teacher/announcements")({
  component: TeacherAnnouncementsPage,
});

const TARGET_LABELS: Record<string, string> = {
  all: "All",
  parents: "Parents",
  staff: "Staff",
  location_admin: "Branch Admins",
  teacher: "Teachers",
};

function TeacherAnnouncementsPage() {
  const listFn = useServerFn(listSchoolAnnouncements);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listFn({ data: {} })
      .then((d) => setItems(d as any[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-none space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-4">School Announcements</h2>
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-8">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No announcements</p>
        ) : (
          <div className="space-y-2">
            {items.map((a) => (
              <div key={a.id} className="p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <Megaphone className="w-4 h-4 text-pink-500" />
                  <p className="text-sm font-bold text-slate-900">{a.title}</p>
                </div>
                <p className="text-xs text-slate-500 mb-1">{a.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{fmtDateTime(a.createdAt)}</p>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{TARGET_LABELS[a.target] ?? a.target}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
