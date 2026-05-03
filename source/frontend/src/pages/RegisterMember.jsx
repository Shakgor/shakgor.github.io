import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, formatApiError } from "../lib/api";
import Navbar from "../components/Navbar";

export default function RegisterMember() {
  const { setSession } = useAuth();
  const nav = useNavigate();
  const [gyms, setGyms] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", gym_id: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/public/gyms").then(({ data }) => setGyms(data)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/register-member", form);
      setSession(data.token, data.user);
      nav("/member");
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail));
    } finally { setLoading(false); }
  };

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div data-testid="register-member-page">
      <Navbar />
      <div className="max-w-md mx-auto p-6 mt-12">
        <h1 className="font-display text-5xl mb-2">Registro Miembro</h1>
        <p className="text-white/50 mb-6 text-sm">Únete al gimnasio de tu preferencia.</p>
        <form onSubmit={submit} className="gb-card p-6 space-y-4" data-testid="member-register-form">
          <div>
            <label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">Gimnasio</label>
            <select className="gb-input" value={form.gym_id} onChange={f("gym_id")} required data-testid="member-field-gym">
              <option value="">— Selecciona un gimnasio —</option>
              {gyms.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            {gyms.length === 0 && <p className="text-xs text-white/40 mt-2">No hay gimnasios activos. El admin debe activar la suscripción de un gym primero.</p>}
          </div>
          <Input label="Nombre completo" v={form.name} on={f("name")} t="name" />
          <Input label="Email" type="email" v={form.email} on={f("email")} t="email" />
          <Input label="Teléfono" v={form.phone} on={f("phone")} t="phone" />
          <Input label="Contraseña" type="password" v={form.password} on={f("password")} t="password" />
          {err && <div className="text-sm" style={{ color: "var(--gb-primary)" }} data-testid="register-member-error">{err}</div>}
          <button className="gb-btn w-full" disabled={loading} data-testid="member-register-submit">
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>
          <Link to="/login" className="block text-center text-sm text-white/60">¿Ya tienes cuenta? Ingresa</Link>
        </form>
      </div>
    </div>
  );
}

function Input({ label, v, on, type = "text", t }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">{label}</label>
      <input type={type} className="gb-input" value={v} onChange={on} required data-testid={`member-field-${t}`} />
    </div>
  );
}
