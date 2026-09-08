import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getActiveAnnouncements, dismissAnnouncement } from "@/lib/auth";
import { X, Info, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

type AnnType = "info" | "warning" | "success" | "critical";

type Announcement = {
  id: number;
  title: string;
  body: string;
  type: AnnType | null;
};

const TYPE_STYLE: Record<AnnType, { bg: string; border: string; icon: React.ReactNode; text: string; btn: string }> = {
  info:     { bg: "bg-blue-50",    border: "border-blue-200",   icon: <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />,          text: "text-blue-800",    btn: "hover:bg-blue-100 text-blue-500" },
  warning:  { bg: "bg-amber-50",   border: "border-amber-200",  icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />, text: "text-amber-800",   btn: "hover:bg-amber-100 text-amber-500" },
  success:  { bg: "bg-emerald-50", border: "border-emerald-200",icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,text: "text-emerald-800", btn: "hover:bg-emerald-100 text-emerald-500" },
  critical: { bg: "bg-red-50",     border: "border-red-200",    icon: <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />,     text: "text-red-800",     btn: "hover:bg-red-100 text-red-500" },
};

export function AnnouncementBanner() {
  const getAnnouncementsFn = useServerFn(getActiveAnnouncements);
  const dismissFn          = useServerFn(dismissAnnouncement);

  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    getAnnouncementsFn()
      .then((d) => setItems((d as any[]).map((a: any) => ({
        id: a.id, title: a.title, body: a.body, type: a.type,
      }))))
      .catch(() => {});
  }, []);

  const dismiss = async (id: number) => {
    setItems((prev) => prev.filter((a) => a.id !== id));
    try { await dismissFn({ data: { announcementId: id } }); } catch (e: any) { console.error("Failed to dismiss announcement:", e?.message ?? e); }
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-1.5 px-6 pt-4">
      {items.map((ann) => {
        const style = TYPE_STYLE[ann.type ?? "info"];
        return (
          <div
            key={ann.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${style.bg} ${style.border}`}
          >
            {style.icon}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${style.text}`}>{ann.title}</p>
              <p className={`text-xs mt-0.5 ${style.text} opacity-80`}>{ann.body}</p>
            </div>
            <button
              onClick={() => dismiss(ann.id)}
              className={`p-1 rounded-lg transition ${style.btn} shrink-0`}
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
