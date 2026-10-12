import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

function Status({ value }) {
  return <span className={`status ${String(value).toLowerCase()}`}>{value}</span>;
}

function Empty({ text }) {
  return <div className="empty">{text}</div>;
}

export default function PortalDashboard({ role }) {
  const nav = useNavigate();
  const [slots, setSlots] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const base = role === "SECURITY" ? "/api/security" : "/api/resident";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const contactPath = role === "SECURITY" ? "/admin-contact" : "/security-contact";
      const visitorPath = role === "SECURITY" ? "/visitors/expected" : "/visitors";
      const [slotResponse, visitorResponse, contactResponse] = await Promise.all([
        api.get(`${base}/slots`),
        api.get(`${base}${visitorPath}`),
        api.get(`${base}${contactPath}`),
      ]);
      setSlots(slotResponse.data);
      setVisitors(visitorResponse.data);
      setContact(contactResponse.data);
    } catch {
      setError("Could not load dashboard information. Please sign in again.");
    } finally {
      setLoading(false);
    }
  }, [base, role]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const counts = useMemo(() => ({
    total: slots.length,
    available: slots.filter((slot) => slot.status === "AVAILABLE").length,
    occupied: slots.filter((slot) => slot.status === "OCCUPIED").length,
  }), [slots]);

  function logout() {
    sessionStorage.clear();
    nav("/", { replace: true });
  }

  const title = role === "SECURITY" ? "Security dashboard" : "Resident dashboard";
  const label = role === "SECURITY" ? "Expected visitors" : "Visitor records";
  const contactLabel = role === "SECURITY" ? "Administrator contact" : "Security contact";

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-area"><div className="app-mark small">P</div><div><strong>ParkGuard</strong><small>{title}</small></div></div>
      <div className="top-actions"><span className="role-pill">{role}</span><span className="admin-email">{sessionStorage.getItem("email")}</span><button className="logout" onClick={logout}>Sign out</button></div>
    </header>
    <main className="content" style={{ marginLeft: 0 }}>
      <div className="page-title"><div><div className="eyebrow dark">READ-ONLY ACCESS</div><h1>{title}</h1><p>Parking availability and visitor information for your role.</p></div><button className="secondary" onClick={() => void load()}>Refresh</button></div>
      {loading && <div className="loading-line" />}
      {error && <div className="error-box">{error}</div>}
      <div className="stat-grid">
        <div className="stat-card"><span>Total slots</span><b>{counts.total}</b><small>Configured parking bays</small></div>
        <div className="stat-card"><span>Available</span><b>{counts.available}</b><small className="good">Ready to use</small></div>
        <div className="stat-card"><span>Occupied</span><b>{counts.occupied}</b><small>Currently in use</small></div>
        <div className="stat-card"><span>{label}</span><b>{visitors.length}</b><small>{role === "SECURITY" ? "Awaiting verification" : "Recorded by administration"}</small></div>
      </div>
      <div className="two-col">
        <section className="panel"><div className="panel-head"><div><h3>Parking availability</h3><p>Current status for every parking slot</p></div></div>
          {slots.length ? <div className="slot-mini">{slots.map((slot) => <div className="slot-card" key={slot.id}><div><strong>{slot.slotNumber}</strong><small>{slot.floor} · {slot.assignedTo || "Unassigned"}</small></div><Status value={slot.status} /></div>)}</div> : <Empty text="No parking slots are available to view." />}
        </section>
        <section className="panel"><div className="panel-head"><div><h3>{contactLabel}</h3><p>Contact details provided by administration</p></div></div>
          {contact?.name ? <div className="visitor-row"><div className="avatar">{contact.name[0]}</div><div><strong>{contact.name}</strong><small>{contact.email}{contact.phone ? ` · ${contact.phone}` : ""}</small></div></div> : <Empty text={`No ${contactLabel.toLowerCase()} has been assigned yet.`} />}
        </section>
      </div>
      <section className="panel"><div className="panel-head"><div><h3>{label}</h3><p>{role === "SECURITY" ? "Visitors who should be verified at entry." : "Visitor information recorded by the Admin."}</p></div></div>
        {visitors.length ? <table><thead><tr><th>Visitor</th><th>Host</th><th>Vehicle</th><th>Purpose</th><th>Status</th></tr></thead><tbody>{visitors.map((visitor) => <tr key={visitor.id}><td><strong>{visitor.visitorName}</strong><small>{visitor.phone || "No phone"}</small></td><td>{visitor.hostName}</td><td>{visitor.vehicleNumber || "Walk-in"}</td><td>{visitor.purpose}</td><td><Status value={visitor.status} /></td></tr>)}</tbody></table> : <Empty text="No visitor records to display." />}
      </section>
    </main>
  </div>;
}
