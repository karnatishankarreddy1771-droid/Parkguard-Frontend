import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import PortalDashboard from "./PortalDashboard";

function ProtectedRoute({ role, children }) {
  const token = sessionStorage.getItem("token");
  if (!token || sessionStorage.getItem("role") !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute role="ADMIN"><Dashboard /></ProtectedRoute>} />
        <Route path="/resident" element={<ProtectedRoute role="RESIDENT"><PortalDashboard role="RESIDENT" /></ProtectedRoute>} />
        <Route path="/security" element={<ProtectedRoute role="SECURITY"><PortalDashboard role="SECURITY" /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
