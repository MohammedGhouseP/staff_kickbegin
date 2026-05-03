export function Sidebar({ me, page, setPage, navItems, onLogout, open, setOpen, children }) {
  return (
    <>
      <div className={`sb-ov ${open ? "op" : ""}`} onClick={() => setOpen(false)} />
      <div className={`sb ${open ? "op" : ""}`}>
        <button className="sb-x" onClick={() => setOpen(false)}>✕</button>
        <div>
          <div className="sb-logo">TASKFLOW</div>
          <div className="sb-app">
            {me.role === "owner" ? "Owner Portal" : me.role === "admin" ? "Admin Portal" : "My Tasks"}
          </div>
          {navItems.length > 0 && <div className="ns">Navigation</div>}
          {navItems.map((n) => (
            <button
              key={n.id}
              className={`ni ${page === n.id ? "ac" : ""}`}
              onClick={() => { setPage(n.id); setOpen(false); }}
            >
              <span className="ni-ic">{n.icon}</span>{n.label}
            </button>
          ))}
          {children}
        </div>
        <div className="sb-bot">
          <div className="up">
            <div className="av" style={{ background: me.color || "#6c8ef5" }}>{me.name[0]}</div>
            <div className="ui">
              <div className="un">{me.name}</div>
              <div className="ur">{me.role}</div>
            </div>
            <button className="lob" title="Sign out" onClick={onLogout}>⏻</button>
          </div>
        </div>
      </div>
    </>
  );
}
