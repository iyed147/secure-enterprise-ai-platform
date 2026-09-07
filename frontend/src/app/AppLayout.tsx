import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { clearToken, getToken } from "../lib/auth";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = !!getToken();

  const onLogout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.avif" alt="Vaultmind" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-bold text-slate-900 tracking-tight">Vaultmind</span>
          </Link>

          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={onLogout}
                className="text-sm font-semibold text-slate-600 hover:text-danger transition-colors"
              >
                Logout
              </button>
            ) : (
              location.pathname !== "/register" && (
                <Link
                  to="/register"
                  className="text-sm font-semibold bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-hover hover:-translate-y-0.5 shadow-md transition-all"
                >
                  Sign up
                </Link>
              )
            )}
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}