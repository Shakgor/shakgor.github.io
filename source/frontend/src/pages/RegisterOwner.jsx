import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, formatApiError } from "../lib/api";
import Navbar from "../components/Navbar";

export default function RegisterOwner() {
  const { setSession } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", gym_name: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/register-owner", form);
      setSession(data.token, data.user);
      nav("/owner");
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail));
    } finally { setLoading(false); }
  };

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div data-testid="register-owner-page">
      <Navbar />
      <div className="max-w-md mx-auto p-6 mt-12">
        <h1 className="font-display text-5xl mb-2">Registrar Gym</h1>
        <p className="text-white/50 mb-6 text-sm">Tu acceso quedará pendiente hasta que el admin active tu suscripción.</p>
        <form onSubmit={submit} className="gb-card p-6 space-y-4" data-testid="owner-register-form">
          <Field label="Nombre del propietario" v={form.name} on={f("name")} t="name" />
          <Field label="Nombre del gimnasio" v={form.gym_name} on={f("gym_name")} t="gym-name" />
          <Field label="Email" type="email" v={form.email} on={f("email")} t="email" />
          <Field label="Teléfono" v={form.phone} on={f("phone")} t="phone" />
          <Field label="Contraseña" type="password" v={form.password} on={f("password")} t="password" />
          {err && <div className="text-sm" style={{ color: "var(--gb-primary)" }} data-testid="register-owner-error">{err}</div>}
          <button className="gb-btn w-full" disabled={loading} data-testid="owner-register-submit">
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>
          <Link to="/login" className="block text-center text-sm text-white/60">¿Ya tienes cuenta? Ingresa</Link>
        </form>
      </div>
    </div>
  );
}

function Field({ label, v, on, type = "text", t }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-white/50 mb-2 block">{label}</label>
      <input type={type} className="gb-input" value={v} onChange={on} required data-testid={`owner-field-${t}`} />
    </div>
  );
}
