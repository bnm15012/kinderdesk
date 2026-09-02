import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, X, AlertCircle } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastCtx = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastCtx | null>(null);

let _id = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Portal – fixed top-right */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast: t, onClose }: { toast: Toast; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const cfg = {
    success: { bg: "bg-emerald-600", icon: <CheckCircle2 className="w-4 h-4 shrink-0" /> },
    error:   { bg: "bg-red-600",     icon: <XCircle      className="w-4 h-4 shrink-0" /> },
    info:    { bg: "bg-blue-600",    icon: <AlertCircle  className="w-4 h-4 shrink-0" /> },
  }[t.type];

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl transition-all duration-300 min-w-[240px] max-w-sm ${cfg.bg} ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
    >
      {cfg.icon}
      <span className="flex-1 leading-snug">{t.message}</span>
      <button
        onClick={onClose}
        className="ml-1 p-0.5 rounded hover:bg-white/20 transition"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
