import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const emptySlot = { slotNumber: "", floor: "", status: "AVAILABLE", assignedTo: "", vehicleNumber: "" };
const emptyVehicle = { ownerName: "", ownerEmail: "", vehicleNumber: "", model: "", type: "CAR" };
const emptyVisitor = { visitorName: "", phone: "", vehicleNumber: "", hostName: "", purpose: "", status: "EXPECTED" };
const emptyUser = { name: "", email: "", phone: "", flatNumber: "", role: "RESIDENT", password: "" };

export default function Dashboard() {
  const nav = useNavigate();
  const [tab, setTab] = useState("overview");
  const [slots, setSlots] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [users, setUsers] = useState([]);
  const [slot, setSlot] = useState(emptySlot);
  const [vehicle, setVehicle] = useState(emptyVehicle);
  const [visitor, setVisitor] = useState(emptyVisitor);
  const [user, setUser] = useState(emptyUser);
  const [editingUser, setEditingUser] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2800);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, v, x, u] = await Promise.all([
        api.get("/api/admin/parking/slots"),
        api.get("/api/admin/parking/vehicles"),
        api.get("/api/admin/parking/visitors"),
        api.get("/api/admin/users")
      ]);
      setSlots(s.data); setVehicles(v.data); setVisitors(x.data); setUsers(u.data);
    } catch {
      notify("Could not load management data.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const stats = useMemo(() => ({
    total: slots.length,
    available: slots.filter(s => s.status === "AVAILABLE").length,
    occupied: slots.filter(s => s.status === "OCCUPIED").length,
    visitors: visitors.filter(v => v.status === "EXPECTED").length,
    residents: users.filter(u => u.role === "RESIDENT").length
  }), [slots, visitors, users]);

  async function saveSlot(e) {
    e.preventDefault();
    try {
      if (editingSlot) await api.put(`/api/admin/parking/slots/${editingSlot}`, slot);
      else await api.post("/api/admin/parking/slots", slot);
      setSlot(emptySlot); setEditingSlot(null); await load();
      notify(editingSlot ? "Parking slot updated." : "Parking slot created.");
    } catch (e) { notify(e.response?.data || "Unable to save slot."); }
  }

  async function saveVehicle(e) {
    e.preventDefault();
    try {
      if (editingVehicle) await api.put(`/api/admin/parking/vehicles/${editingVehicle}`, vehicle);
      else await api.post("/api/admin/parking/vehicles", vehicle);
      setVehicle(emptyVehicle); setEditingVehicle(null); await load(); notify(editingVehicle ? "Vehicle updated." : "Vehicle registered.");
    } catch (e) { notify(e.response?.data || "Unable to register vehicle."); }
  }

  async function saveVisitor(e) {
    e.preventDefault();
    try {
      await api.post("/api/admin/parking/visitors", visitor);
      setVisitor(emptyVisitor); await load(); notify("Visitor request recorded for Security.");
    } catch (e) { notify(e.response?.data || "Unable to record visitor."); }
  }

  async function saveUser(e) {
    e.preventDefault();
    try {
      if (editingUser) await api.put(`/api/admin/users/${editingUser}`, {name:user.name, phone:user.phone, flatNumber:user.flatNumber, role:user.role, password:user.password || undefined});
      else await api.post("/api/admin/users", user);
      const createdRole = user.role;
      setUser(emptyUser); setEditingUser(null); await load(); notify(editingUser ? "User updated." : `${createdRole} account created. Give the user the temporary password you entered.`);
    } catch (e) { notify(e.response?.data || "Unable to create account."); }
  }

  async function remove(path, label) {
    if (!confirm(`Delete this ${label}? This action cannot be undone.`)) return;
    try { await api.delete(path); await load(); notify(`${label} deleted.`); }
    catch (e) { notify(e.response?.data || `Unable to delete ${label}.`); }
  }

  async function visitorAction(id, action) {
    try {
      await api.put(`/api/admin/parking/visitors/${id}/${action}`, {});
      await load(); notify(action === "entry" ? "Visitor marked as entered." : "Visitor marked as exited.");
    } catch (e) { notify(e.response?.data || "Unable to update visitor status."); }
  }

  function startEdit(s) {
    setEditingSlot(s.id);
    setSlot({ slotNumber: s.slotNumber, floor: s.floor, status: s.status, assignedTo: s.assignedTo || "", vehicleNumber: s.vehicleNumber || "" });
    setTab("slots");
  }

  function editUser(u) {
    setEditingUser(u.id);
    setUser({name:u.name, email:u.email, phone:u.phone || "", flatNumber:u.flatNumber || "", role:u.role, password:""});
    setTab("users");
  }

  function editVehicle(v) {
    setEditingVehicle(v.id);
    setVehicle({ownerName:v.ownerName || "", ownerEmail:v.ownerEmail || "", vehicleNumber:v.vehicleNumber || "", model:v.model || "", type:v.type || "CAR"});
    setTab("vehicles");
  }

  function logout() { sessionStorage.clear(); nav("/", { replace: true }); }

  const navItems = [
    ["overview", "Overview", "▦"],
    ["slots", "Parking slots", "P"],
    ["visitors", "Visitors", "V"],
    ["vehicles", "Vehicles", "C"],
    ["users", "Users & access", "U"]
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-area"><div className="app-mark small">P</div><div><strong>ParkGuard</strong><small>Community control center</small></div></div>
        <div className="top-actions"><span className="role-pill">ADMIN</span><span className="admin-email">{sessionStorage.getItem("email")}</span><button className="logout" onClick={logout}>Sign out</button></div>
      </header>

      <aside className="sidebar">
        <div className="side-label">MANAGEMENT</div>
        {navItems.map(([id, label, icon]) =>
          <button key={id} className={tab === id ? "side-item active" : "side-item"} onClick={() => setTab(id)}>
            <span className="side-icon">{icon}</span>{label}
          </button>
        )}
        <div className="security-box">
          <strong>Security policy</strong>
          <p>Only administrators can create, edit or delete stored information.</p>
        </div>
      </aside>

      <main className="content">
        {toast && <div className="toast">{toast}</div>}
        {loading && <div className="loading-line" />}

        {tab === "overview" && <Overview stats={stats} slots={slots} visitors={visitors} setTab={setTab} />}
        {tab === "slots" && <Slots slots={slots} slot={slot} setSlot={setSlot} saveSlot={saveSlot} editingSlot={editingSlot} setEditingSlot={setEditingSlot} startEdit={startEdit} remove={remove} />}
        {tab === "visitors" && <Visitors visitors={visitors} visitor={visitor} setVisitor={setVisitor} saveVisitor={saveVisitor} visitorAction={visitorAction} remove={remove} />}
        {tab === "vehicles" && <Vehicles vehicles={vehicles} vehicle={vehicle} setVehicle={setVehicle} saveVehicle={saveVehicle} editingVehicle={editingVehicle} editVehicle={editVehicle} setEditingVehicle={setEditingVehicle} remove={remove} />}
        {tab === "users" && <Users users={users} user={user} setUser={setUser} saveUser={saveUser} editingUser={editingUser} editUser={editUser} setEditingUser={setEditingUser} remove={remove} />}
      </main>
    </div>
  );
}

function PageTitle({ eyebrow, title, description, action }) {
  return <div className="page-title"><div><div className="eyebrow dark">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function Overview({ stats, slots, visitors, setTab }) {
  return <>
    <PageTitle eyebrow="COMMAND CENTER" title="Parking overview" description="Live operational view of your apartment parking and visitor activity."
      action={<button className="primary" onClick={() => setTab("slots")}>Manage slots</button>} />
    <div className="stat-grid">
      <Stat title="Total slots" value={stats.total} hint="Configured parking bays" />
      <Stat title="Available" value={stats.available} hint="Ready for assignment" good />
      <Stat title="Occupied" value={stats.occupied} hint="Currently assigned / in use" />
      <Stat title="Expected visitors" value={stats.visitors} hint="Awaiting Security verification" warn />
      <Stat title="Residents" value={stats.residents} hint="Registered households" />
    </div>

    <div className="two-col">
      <section className="panel"><div className="panel-head"><div><h3>Parking status</h3><p>Current slot occupancy</p></div><button className="link-btn" onClick={() => setTab("slots")}>View all →</button></div>
        <SlotMini slots={slots.slice(0, 8)} />
      </section>
      <section className="panel"><div className="panel-head"><div><h3>Visitor watch</h3><p>People Security should verify</p></div><button className="link-btn" onClick={() => setTab("visitors")}>Open log →</button></div>
        {visitors.filter(v => v.status === "EXPECTED").slice(0, 5).map(v =>
          <div className="visitor-row" key={v.id}><div className="avatar">{v.visitorName?.[0] || "V"}</div><div><strong>{v.visitorName}</strong><small>{v.hostName} · {v.vehicleNumber || "Walk-in"}</small></div><span className="status expected">EXPECTED</span></div>
        )}
        {!visitors.some(v => v.status === "EXPECTED") && <Empty text="No expected visitors." />}
      </section>
    </div>
  </>;
}

function Stat({ title, value, hint, good, warn }) {
  return <div className="stat-card"><span>{title}</span><b>{value}</b><small className={good ? "good" : warn ? "warn" : ""}>{hint}</small></div>;
}

function Slots({ slots, slot, setSlot, saveSlot, editingSlot, setEditingSlot, startEdit, remove }) {
  return <>
    <PageTitle eyebrow="PARKING INVENTORY" title="Parking slots" description="Create, assign and maintain every parking bay." />
    <section className="panel">
      <div className="panel-head"><div><h3>{editingSlot ? "Edit parking slot" : "Add parking slot"}</h3><p>Only Admin can change slot information.</p></div></div>
      <form className="form-grid" onSubmit={saveSlot}>
        <Field label="Slot number"><input required placeholder="A-101" value={slot.slotNumber} onChange={e=>setSlot({...slot,slotNumber:e.target.value})}/></Field>
        <Field label="Floor"><input required placeholder="Basement 1" value={slot.floor} onChange={e=>setSlot({...slot,floor:e.target.value})}/></Field>
        <Field label="Status"><select value={slot.status} onChange={e=>setSlot({...slot,status:e.target.value})}><option>AVAILABLE</option><option>OCCUPIED</option><option>RESERVED</option></select></Field>
        <Field label="Assigned resident"><input placeholder="Flat / resident name" value={slot.assignedTo} onChange={e=>setSlot({...slot,assignedTo:e.target.value})}/></Field>
        <Field label="Vehicle number"><input placeholder="TS 09 AB 1234" value={slot.vehicleNumber} onChange={e=>setSlot({...slot,vehicleNumber:e.target.value})}/></Field>
        <div className="form-actions"><button className="primary">{editingSlot ? "Save changes" : "Create slot"}</button>{editingSlot && <button type="button" className="secondary" onClick={()=>{setEditingSlot(null);setSlot(emptySlot)}}>Cancel</button>}</div>
      </form>
    </section>
    <section className="panel"><Table title="All parking slots" count={slots.length}>
      <table><thead><tr><th>Slot</th><th>Floor</th><th>Assigned resident</th><th>Vehicle</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{slots.map(s=><tr key={s.id}><td><strong>{s.slotNumber}</strong></td><td>{s.floor}</td><td>{s.assignedTo || "Unassigned"}</td><td>{s.vehicleNumber || "—"}</td><td><Status value={s.status}/></td><td><button className="table-btn" onClick={()=>startEdit(s)}>Edit</button><button className="table-btn danger-text" onClick={()=>remove(`/api/admin/parking/slots/${s.id}`,"slot")}>Delete</button></td></tr>)}</tbody></table>
      {slots.length===0 && <Empty text="No parking slots configured yet."/>}
    </Table></section>
  </>;
}

function Visitors({ visitors, visitor, setVisitor, saveVisitor, visitorAction, remove }) {
  return <>
    <PageTitle eyebrow="SECURITY OPERATIONS" title="Visitor management" description="Record approved visitor details and track entry / exit for Security." />
    <section className="panel"><div className="panel-head"><div><h3>Record visitor request</h3><p>Resident requests are stored only after Admin records them.</p></div></div>
      <form className="form-grid" onSubmit={saveVisitor}>
        <Field label="Visitor name"><input required value={visitor.visitorName} onChange={e=>setVisitor({...visitor,visitorName:e.target.value})}/></Field>
        <Field label="Phone"><input value={visitor.phone} onChange={e=>setVisitor({...visitor,phone:e.target.value})}/></Field>
        <Field label="Vehicle number"><input value={visitor.vehicleNumber} onChange={e=>setVisitor({...visitor,vehicleNumber:e.target.value})}/></Field>
        <Field label="Resident / flat"><input required value={visitor.hostName} onChange={e=>setVisitor({...visitor,hostName:e.target.value})}/></Field>
        <Field label="Purpose"><input required value={visitor.purpose} onChange={e=>setVisitor({...visitor,purpose:e.target.value})}/></Field>
        <div className="form-actions"><button className="primary">Record & notify Security</button></div>
      </form>
    </section>
    <section className="panel"><Table title="Visitor verification queue" count={visitors.length}>
      <table><thead><tr><th>Visitor</th><th>Resident</th><th>Vehicle</th><th>Purpose</th><th>Status</th><th>Security action</th></tr></thead>
      <tbody>{visitors.map(v=><tr key={v.id}><td><strong>{v.visitorName}</strong><small>{v.phone || "No phone"}</small></td><td>{v.hostName}</td><td>{v.vehicleNumber || "Walk-in"}</td><td>{v.purpose}</td><td><Status value={v.status}/></td><td>{v.status==="EXPECTED" && <button className="table-btn" onClick={()=>visitorAction(v.id,"entry")}>Verify entry</button>}{v.status==="ENTERED" && <button className="table-btn" onClick={()=>visitorAction(v.id,"exit")}>Mark exit</button>}<button className="table-btn danger-text" onClick={()=>remove(`/api/admin/parking/visitors/${v.id}`,"visitor")}>Delete</button></td></tr>)}</tbody></table>
      {visitors.length===0 && <Empty text="No visitor records."/>}
    </Table></section>
  </>;
}

function Vehicles({ vehicles, vehicle, setVehicle, saveVehicle, editingVehicle, editVehicle, setEditingVehicle, remove }) {
  return <>
    <PageTitle eyebrow="VEHICLE REGISTER" title="Resident vehicles" description="Keep the vehicle register aligned with assigned parking slots." />
    <section className="panel"><div className="panel-head"><div><h3>{editingVehicle ? "Edit vehicle" : "Register vehicle"}</h3><p>Only Admin can add or modify vehicle records.</p></div></div>
      <form className="form-grid" onSubmit={saveVehicle}>
        <Field label="Owner name"><input required value={vehicle.ownerName} onChange={e=>setVehicle({...vehicle,ownerName:e.target.value})}/></Field>
        <Field label="Owner email"><input type="email" value={vehicle.ownerEmail} onChange={e=>setVehicle({...vehicle,ownerEmail:e.target.value})}/></Field>
        <Field label="Vehicle number"><input required value={vehicle.vehicleNumber} onChange={e=>setVehicle({...vehicle,vehicleNumber:e.target.value})}/></Field>
        <Field label="Model"><input value={vehicle.model} onChange={e=>setVehicle({...vehicle,model:e.target.value})}/></Field>
        <Field label="Type"><select value={vehicle.type} onChange={e=>setVehicle({...vehicle,type:e.target.value})}><option>CAR</option><option>BIKE</option><option>SCOOTER</option><option>OTHER</option></select></Field>
        <div className="form-actions"><button className="primary">{editingVehicle ? "Save vehicle" : "Register vehicle"}</button>{editingVehicle && <button type="button" className="secondary" onClick={()=>{setEditingVehicle(null);setVehicle(emptyVehicle)}}>Cancel</button>}</div>
      </form>
    </section>
    <section className="panel"><Table title="Vehicle register" count={vehicles.length}><table><thead><tr><th>Owner</th><th>Vehicle</th><th>Model</th><th>Type</th><th>Actions</th></tr></thead><tbody>{vehicles.map(v=><tr key={v.id}><td>{v.ownerName}<small>{v.ownerEmail}</small></td><td><strong>{v.vehicleNumber}</strong></td><td>{v.model || "—"}</td><td>{v.type}</td><td><button className="table-btn" onClick={()=>editVehicle(v)}>Edit</button><button className="table-btn danger-text" onClick={()=>remove(`/api/admin/parking/vehicles/${v.id}`,"vehicle")}>Delete</button></td></tr>)}</tbody></table>{vehicles.length===0&&<Empty text="No vehicles registered."/>}</Table></section>
  </>;
}

function Users({ users, user, setUser, saveUser, editingUser, editUser, setEditingUser, remove }) {
  return <>
    <PageTitle eyebrow="ACCESS CONTROL" title="Users & access" description="Admin-only provisioning for residents and security staff." />
    <section className="panel"><div className="panel-head"><div><h3>{editingUser ? "Edit user" : "Create resident / security account"}</h3><p>Enter a password and share it securely with the user. To reset an existing account, edit it and enter a new password. Passwords cannot be viewed after saving.</p></div></div>
      <form className="form-grid" onSubmit={saveUser}>
        <Field label="Full name"><input required value={user.name} onChange={e=>setUser({...user,name:e.target.value})}/></Field>
        <Field label="Email"><input required type="email" value={user.email} onChange={e=>setUser({...user,email:e.target.value})}/></Field>
        <Field label="Phone"><input value={user.phone} onChange={e=>setUser({...user,phone:e.target.value})}/></Field>
        <Field label="Flat number"><input value={user.flatNumber} onChange={e=>setUser({...user,flatNumber:e.target.value})}/></Field>
        <Field label="Role"><select value={user.role} onChange={e=>setUser({...user,role:e.target.value})}><option>RESIDENT</option><option>SECURITY</option></select></Field>
        <Field label={editingUser ? "New password (optional)" : "Password"}><input required={!editingUser} minLength={12} maxLength={128} type="password" autoComplete="new-password" placeholder={editingUser ? "Leave blank to keep the current password" : "At least 12 characters"} value={user.password} onChange={e=>setUser({...user,password:e.target.value})}/></Field>
        <div className="form-actions"><button className="primary">{editingUser ? "Save user" : "Create account"}</button>{editingUser && <button type="button" className="secondary" onClick={()=>{setEditingUser(null);setUser(emptyUser)}}>Cancel</button>}</div>
      </form>
    </section>
    <section className="panel"><Table title="Registered users" count={users.length}><table><thead><tr><th>Name</th><th>Email</th><th>Flat</th><th>Role</th><th>Actions</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td><strong>{u.name}</strong></td><td>{u.email}</td><td>{u.flatNumber || "—"}</td><td><span className="role-pill">{u.role}</span></td><td>{u.role!=="ADMIN" && <><button className="table-btn" onClick={()=>editUser(u)}>Edit</button><button className="table-btn danger-text" onClick={()=>remove(`/api/admin/users/${u.id}`,"user")}>Delete</button></>}</td></tr>)}</tbody></table></Table></section>
  </>;
}

function Field({label, children}) { return <label className="field"><span>{label}</span>{children}</label>; }
function Table({title,count,children}) { return <><div className="panel-head"><div><h3>{title}</h3><p>{count} record{count===1?"":"s"}</p></div></div>{children}</>; }
function Status({value}) { return <span className={`status ${String(value).toLowerCase()}`}>{value}</span>; }
function SlotMini({slots}) { return <div className="slot-mini">{slots.map(s=><div className="slot-card" key={s.id}><div><strong>{s.slotNumber}</strong><small>{s.floor} · {s.assignedTo || "Unassigned"}</small></div><Status value={s.status}/></div>)}</div>; }
function Empty({text}) { return <div className="empty">{text}</div>; }
