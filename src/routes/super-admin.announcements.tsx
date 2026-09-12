import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listAllAnnouncements, createAnnouncement, toggleAnnouncement, deleteAnnouncement,
} from "@/lib/auth";
import {
  Megaphone, Plus, Trash2, Eye, EyeOff, AlertCircle, CheckCircle2,
  Info, AlertTriangle, Loader2, X,
} from "lucide-react";
import { fmtDate } from "@/lib/utils";
import { ConfirmDialog } from "@/components/confirm-dialog";

export const Route = createFileRoute("/super-admin/announcements")({
  component: AnnouncementsPage,
});

type AnnType = "info" | "warning" | "success" | "critical";
type TargetRole = "all" | "school_admin" | "location_admin" | "teacher" | "accountant";

type Announcement = {
  id: number;
  title: string;
  body: string;
  type: AnnType;
  targetRole: TargetRole;
  isActive: number;
  expiresAt: Date | null;
  createdAt: Date | null;
};

const TYPE_CONFIG: Record<AnnType, { label: string; icon: React.ReactNode; badge: string; border: string; bg: string }> = {
  info:     { label: "Info",     icon: <Info className="w-4 h-4" />,          badge: "bg-blue-50 text-blue-700 border-blue-200",    border: "border-l-blue-500",    bg: "bg-blue-50"    },
  warning:  { label: "Warning",  icon: <AlertTriangle className="w-4 h-4" />, badge: "bg-amber-50 text-amber-700 border-amber-200", border: "border-l-amber-500",   bg: "bg-amber-50"   },
  success:  { label: "Success",  icon: <CheckCircle2 className="w-4 h-4" />,  badge: "bg-emerald-50 text-emerald-700 border-emerald-200", border: "border-l-emerald-500", bg: "bg-emerald-50" },
  critical: { label: "Critical", icon: <AlertCircle className="w-4 h-4" />,   badge: "bg-red-50 text-red-700 border-red-200",       border: "border-l-red-500",     bg: "bg-red-50"     },
};

const ROLE_LABELS: Record<TargetRole, string> = {
  all:             "All Users",
  school_admin:    "School Admins",
  location_admin:  "Branch Admins",
  teacher:         "Teachers",
  accountant:      "Accountants",
};

function ComposeModal({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const createFn = useServerFn(createAnnouncement);
  const [title, setTitle]           = useState("");
  const [body, setBody]             = useState("");
  const [type, setType]             = useState<AnnType>("info");
  const [targetRole, setTargetRole] = useState<TargetRole>("school_admin");
  const [expiresAt, setExpiresAt]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  const submit = async () => {
    if (!title.trim() || !body.trim()) { setError("Title and message are required."); return; }
    setSaving(true); setError("");
    try {
      await createFn({
        data: {
          title, body, type, targetRole,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        },
      });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create");
      setSaving(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-bold text-slate-900">New Announcement</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Title *</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled maintenance on 5th Sept"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Message *</label>
            <textarea
              value={body} onChange={(e) => setBody(e.target.value)} rows={3}
              placeholder="Full announcement text shown to users…"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as AnnType)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
              >
                {(["info", "warning", "success", "critical"] as AnnType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Target Audience</label>
              <select value={targetRole} onChange={(e) => setTargetRole(e.target.value as TargetRole)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
              >
                <option value="school_admin">School Admins</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Expires at <span className="font-normal text-slate-400">(optional — leave blank to never expire)</span>
            </label>
            <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
          </div>

          {/* Live preview */}
          {(title || body) && (
            <div className={`border-l-4 rounded-xl p-4 ${TYPE_CONFIG[type].border} ${TYPE_CONFIG[type].bg}`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Preview</p>
              <p className="text-sm font-bold text-slate-800">{title || "—"}</p>
              {body && <p className="text-xs text-slate-600 mt-1">{body}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold transition shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
            {saving ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementsPage() {
  const listFn   = useServerFn(listAllAnnouncements);
  const toggleFn = useServerFn(toggleAnnouncement);
  const deleteFn = useServerFn(deleteAnnouncement);

  const [items, setItems]   = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [toggling, setToggling] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [composing, setComposing] = useState(false);

  const load = () => {
    setLoading(true);
    listFn()
      .then((d) => setItems(d as Announcement[]))
      .catch((e: any) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleToggle = async (item: Announcement) => {
    const next = item.isActive === 1 ? 0 : 1;
    setToggling(item.id);
    try {
      await toggleFn({ data: { id: item.id, isActive: next } });
      setItems((prev) => prev.map((a) => a.id === item.id ? { ...a, isActive: next } : a));
    } catch (e: any) { setError(e?.message ?? "Failed"); }
    finally { setToggling(null); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteFn({ data: { id: confirmDelete.id } });
      setItems((prev) => prev.filter((a) => a.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (e: any) { setError(e?.message ?? "Failed to delete"); }
    finally { setDeleting(false); }
  };

  const active   = items.filter((a) => a.isActive === 1);
  const inactive = items.filter((a) => a.isActive === 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-500 mt-0.5">Broadcast notices to school admins and staff</p>
        </div>
        <button
          onClick={() => setComposing(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {/* Compose modal */}
      {composing && (
        <ComposeModal onCreated={load} onClose={() => setComposing(false)} />
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="flex gap-4 flex-wrap">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
            <p className="text-2xl font-extrabold text-emerald-700">{active.length}</p>
            <p className="text-xs font-semibold text-emerald-600 mt-0.5">Active</p>
          </div>
          <div className="bg-slate-100 border border-slate-200 rounded-xl px-5 py-3">
            <p className="text-2xl font-extrabold text-slate-500">{inactive.length}</p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Inactive</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-3">
            <p className="text-2xl font-extrabold text-slate-800">{items.length}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Total</p>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
          <Megaphone className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p className="text-sm text-slate-400">No announcements yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const cfg = TYPE_CONFIG[item.type];
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${cfg.border} shadow-sm overflow-hidden ${item.isActive === 0 ? "opacity-60" : ""}`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`mt-0.5 shrink-0 ${cfg.badge.includes("blue") ? "text-blue-500" : cfg.badge.includes("amber") ? "text-amber-500" : cfg.badge.includes("emerald") ? "text-emerald-500" : "text-red-500"}`}>
                        {cfg.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-bold text-slate-900">{item.title}</span>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${cfg.badge}`}>{cfg.label}</span>
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            {ROLE_LABELS[item.targetRole]}
                          </span>
                          {item.isActive === 1 ? (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Live</span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-400 border border-slate-200">Inactive</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{item.body}</p>
                        <div className="flex gap-3 mt-2 text-xs text-slate-400">
                          <span>Created {fmtDate(item.createdAt ? String(item.createdAt) : null)}</span>
                          {item.expiresAt && <span>· Expires {fmtDate(String(item.expiresAt))}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggle(item)}
                        disabled={toggling === item.id}
                        title={item.isActive === 1 ? "Deactivate" : "Activate"}
                        className={`p-2 rounded-xl border transition ${
                          item.isActive === 1
                            ? "bg-slate-50 text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
                            : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {toggling === item.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : item.isActive === 1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                        }
                      </button>
                      <button
                        onClick={() => setConfirmDelete(item)}
                        className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Announcement"
        message={`Delete "${confirmDelete?.title}"? This will remove it for all users immediately.`}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
