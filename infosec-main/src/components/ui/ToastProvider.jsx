import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { ToastContext } from "./toast-context";

const tones = {
  success: { icon: CheckCircle2, ring: "ring-emerald-200", iconColor: "text-emerald-600" },
  error: { icon: XCircle, ring: "ring-rose-200", iconColor: "text-rose-600" },
  warning: { icon: TriangleAlert, ring: "ring-amber-200", iconColor: "text-amber-600" },
  info: { icon: Info, ring: "ring-sky-200", iconColor: "text-sky-600" },
};

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, tone = "success" }) => {
      const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
      setToasts((current) => [...current, { id, title, description, tone }]);
      window.setTimeout(() => dismiss(id), 4500);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-60 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((item) => {
          const tone = tones[item.tone] ?? tones.info;
          const Icon = tone.icon;
          return (
            <div
              key={item.id}
              className={`animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-white p-3.5 shadow-lg ring-1 ${tone.ring}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.iconColor}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{item.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
