import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/auth/login", form);
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("role", data.role);
      sessionStorage.setItem("userId", data.id);
      sessionStorage.setItem("email", data.email);
      const destination = { ADMIN: "/admin", RESIDENT: "/resident", SECURITY: "/security" }[data.role];
      nav(destination || "/", { replace: true });
    } catch {
      setError("Invalid email or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-visual">
        <div className="visual-overlay">
          <span className="eyebrow">SMART COMMUNITY PARKING</span>
          <h1>Secure parking,<br />without the guesswork.</h1>
          <p>Manage residents, assigned slots, vehicles and visitor verification from one secure control room.</p>
          <div className="feature-row">
            <span>✓ Slot assignment</span><span>✓ Visitor verification</span><span>✓ Security audit</span>
          </div>
        </div>
      </div>

      <div className="login-panel">
        <div className="login-card">
          <div className="app-mark">P</div>
          <div className="eyebrow dark">COMMUNITY PORTAL</div>
          <h2>Welcome back</h2>
          <p className="muted">Sign in with your Admin, Resident, or Security account.</p>

          <form onSubmit={submit}>
            <label>Email</label>
            <input name="email" type="email" autoComplete="username" placeholder="you@example.com"
              value={form.email} onChange={change} required />

            <label>Password</label>
            <input name="password" type="password" autoComplete="current-password" placeholder="Enter admin password"
              value={form.password} onChange={change} required />

            {error && <div className="error-box">{error}</div>}
            <button className="primary wide" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}</button>
          </form>

          <div className="login-note">
            <strong>Role-based access</strong>
            <span>Admin creates Resident and Security accounts. Each role gets a separate read-only dashboard.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
