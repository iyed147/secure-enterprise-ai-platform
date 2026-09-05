import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
          <span className="font-bold text-slate-900">Secure Enterprise AI</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/contact" className="text-sm text-slate-600 hover:text-primary transition-colors">
            Contact us
          </Link>
          <Link to="/login" className="text-sm text-slate-600 hover:text-primary transition-colors">
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover transition-colors"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}