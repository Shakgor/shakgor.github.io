import { useState } from "react";
import { api, formatApiError } from "../lib/api";
import Navbar from "../components/Navbar";

export default function MembershipCheck() {
  const [email, setEmail] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const check = async (e) => {
    e.preventDefault();
    setErr(""); setData(null); setLoading(true);
    try {
      const { data } = await api.get("/public/membership-check", { params: { email } });
      setData(data);
    } catch (e) {
      setErr(formatApiError(e.response?.data?.detail, "No encontrado"));
    } finally { setLoading(false); }
  };

  return (
    <div data-testid="membership-check-page">
      <Navbar />
      <div className="max-w-xl mx-auto p-6 mt-12">
        <h1 className="font-display text-5xl mb-2">Verificar Membresía</h1>
        <p className="text-white/50 mb-6 text-sm">Ingresa el correo registrado para conocer el estado.</p>
        <form onSubmit={check} className="gb-card p-6 flex gap-3" data-testid="membership-check-form">
          <input type="email" className="gb-input" placeholder="email@gym.com" value={email}
            onChange={(e) => setEmail(e.target.value)} required data-testid="membership-check-email" />
          <button className="gb-btn" disabled={loading} data-testid="membership-check-submit">
            {loading ? "..." : "Verificar"}
          </button>
        </form>
        {err && <div className="mt-4 gb-card p-4" data-testid="membership-check-error" style={{ borderColor: "var(--gb-primary)" }}>{err}</div>}
        {data && (
          <div className="mt-6 gb-card p-6" data-testid="membership-check-result">
            <p className="text-xs uppercase tracking-widest text-white/50">Resultado</p>
            <h2 className="font-display text-3xl mt-2">{data.name}</h2>
            <p className="text-white/60 text-sm mb-4">{data.email} · {data.gym}</p>
            <div className="flex flex-wrap gap-3 mb-4">
              <span className={`gb-badge ${data.membership.status === "active" ? "success" : data.membership.status === "expired" ? "error" : "warning"}`} data-testid="membership-status-badge">
                {data.membership.status === "active" ? "Activa" : data.membership.status === "expired" ? "Vencida" : "Sin pagos"}
              </span>
              <span className="gb-badge muted">Nivel: {data.level}</span>
            </div>
            {data.membership.expires_at && (
              <p className="text-sm text-white/70">Vence: <strong>{new Date(data.membership.expires_at).toLocaleString()}</strong></p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
