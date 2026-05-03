import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBrand } from "../context/BrandContext";
import { Dumbbell, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { brand } = useBrand();
  const nav = useNavigate();

  const handleLogout = async () => {
    await logout();
    nav("/");
  };

  const roleHome = user && user.role
    ? (user.role === "admin" ? "/admin" : user.role === "owner" ? "/owner" : "/member")
    : "/";

  return (
    <header className="border-b border-white/10 bg-black/80 backdrop-blur sticky top-0 z-40" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to={roleHome} className="flex items-center gap-3" data-testid="navbar-brand">
          {brand.logo_url ? (
            <img src={brand.logo_url} alt={brand.name} className="h-8 w-8 object-contain" />
          ) : (
            <div className="h-8 w-8 flex items-center justify-center" style={{ background: "var(--gb-primary)" }}>
              <Dumbbell size={16} className="text-white" />
            </div>
          )}
          <span className="font-display text-2xl tracking-tight" style={{ color: "var(--gb-primary)" }}>
            {brand.name || "GymBros"}
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          {!user || user === false ? (
            <>
              <Link to="/membership-check" className="gb-btn gb-btn-ghost" data-testid="nav-check-membership">Verificar membresía</Link>
              <Link to="/login" className="gb-btn gb-btn-outline" data-testid="nav-login">Ingresar</Link>
              <Link to="/register/owner" className="gb-btn" data-testid="nav-register-owner">Registrar Gym</Link>
            </>
          ) : (
            <>
              <span className="text-sm text-white/60 hidden md:inline" data-testid="navbar-user">
                {user.name} · <span className="uppercase tracking-widest text-xs">{user.role}</span>
              </span>
              <button onClick={handleLogout} className="gb-btn gb-btn-outline" data-testid="navbar-logout">
                <LogOut size={14} /> Salir
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
