import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../lib/api";
import Navbar from "../components/Navbar";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const u = await login(identifier, password);
      nav(u.role === "admin" ? "/admin" : u.role === "owner" ? "/owner" : "/member");
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail, "Credenciales inválidas"));
    } finally { setLoading(false); }
  };

  return (
    <div data-testid="login-page">
      <Navbar />
      <div className="max-w-md mx-auto p-6 mt-16">
        <h1 className="font-display text-5xl mb-2">Ingresar</h1>
        <p className="text-white/50 mb-8 text-sm">Admin · Dueño · Miembro</p>
        <form onSubmit={submit} className="gb-card p-6 space-y-4" data-testid="login-form">
          <div>
            <label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">Usuario o Email</label>
            <input className="gb-input" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
              required data-testid="login-identifier" autoComplete="username" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">Contraseña</label>
            <input type="password" className="gb-input" value={password} onChange={(e) => setPassword(e.target.value)}
              required data-testid="login-password" autoComplete="current-password" />
          </div>
          {err && <div className="text-sm" style={{ color: "var(--gb-primary)" }} data-testid="login-error">{err}</div>}
          <button className="gb-btn w-full" disabled={loading} data-testid="login-submit">
            {loading ? "Ingresando..." : "Entrar"}
          </button>
          <div className="flex justify-between text-sm pt-2">
            <Link to="/register/owner" className="text-white/60 hover:text-white" data-testid="link-register-owner">Soy dueño de gym</Link>
            <Link to="/register/member" className="text-white/60 hover:text-white" data-testid="link-register-member">Soy miembro</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
