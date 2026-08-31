import { Link, Outlet, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../lib/auth";

export default function AppLayout() {
  const navigate = useNavigate();
  const isAuthenticated = !!getToken();

  const onLogout = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <strong>Secure Enterprise AI</strong>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link to="/dashboard">Dashboard</Link>
          {isAuthenticated ? (
            <button onClick={onLogout}>Logout</button>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}