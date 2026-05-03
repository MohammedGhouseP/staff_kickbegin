export function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div className="mo" onClick={onClose}>
      <div className={`md ${wide ? "wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="mh">
            <div className="mti">{title}</div>
            <button className="mc" onClick={onClose}>×</button>
          </div>
        )}
        <div className="mb">
          {children}
          {footer && <div className="mf">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ icon, title, message, confirmLabel = "Confirm", confirmVariant = "bs", onConfirm, onCancel }) {
  return (
    <div className="mo" onClick={onCancel}>
      <div className="md" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
        <div className="mb lo-c">
          {icon && <div style={{ fontSize: 42, marginBottom: 12 }}>{icon}</div>}
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{title}</div>
          {message && <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>{message}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="bg2" onClick={onCancel}>Cancel</button>
            <button className={confirmVariant} onClick={onConfirm}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
