import { createContext, useCallback, useContext, useState, memo } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

let idCounter = 0;

const ToastItem = memo(function ToastItem({ toast, onDismiss }) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-[fadeIn_0.15s_ease-out] ${
        toast.type === "success"
          ? "bg-emerald-600 text-white"
          : toast.type === "error"
          ? "bg-red-600 text-white"
          : "bg-gray-900 dark:bg-gray-700 text-white"
      }`}
    >
      {toast.type === "success" && <CheckCircle2 size={18} className="flex-shrink-0" />}
      {toast.type === "error" && <XCircle size={18} className="flex-shrink-0" />}
      {toast.type === "info" && <Info size={18} className="flex-shrink-0" />}
      <span className="flex-1">{toast.message}</span>
      <button 
        onClick={() => onDismiss(toast.id)} 
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss toast"
      >
        <X size={15} />
      </button>
    </div>
  );
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 3500);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-80 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          {toasts.map((t) => (
            <ToastItem key={`toast-${t.id}`} toast={t} onDismiss={dismissToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}