import { useEffect } from "react";

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, toast.duration ?? 3000);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  return <div className={`toast ${toast.kind || ""}`}>{toast.message}</div>;
}
