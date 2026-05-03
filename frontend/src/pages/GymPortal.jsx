import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useBrand } from "../context/BrandContext";

export default function GymPortal() {
  const { slug } = useParams();
  const [gym, setGym] = useState(null);
  const [err, setErr] = useState("");
  const { setBrand } = useBrand();

  useEffect(() => {
    api.get(`/public/gym/${slug}`)
      .then(({ data }) => { setGym(data); setBrand(data); })
      .catch(() => setErr("Gimnasio no encontrado"));
  }, [slug, setBrand]);

  if (err) return <div className="p-12 text-center" data-testid="gym-portal-error">{err}</div>;
  if (!gym) return <div className="p-12 text-center text-white/40">Cargando...</div>;

  const isActive = gym.subscription_status === "active";
  return (
    <div className="min-h-screen" style={{ background: gym.background_color }} data-testid="gym-portal">
      <div className="max-w-4xl mx-auto p-6 py-20">
        <div className="flex items-center gap-4 mb-10">
          {gym.logo_url ? <img src={gym.logo_url} alt={gym.name} className="h-16 w-16 object-contain" /> : <div className="h-16 w-16" style={{ background: gym.primary_color }}/>}
          <h1 className="font-display text-6xl" style={{ color: gym.primary_color }}>{gym.name}</h1>
        </div>
        <p className="text-white/60 mb-8 max-w-xl">Bienvenido al portal de {gym.name}. Regístrate como miembro o verifica el estado de tu membresía.</p>
        {isActive ? (
          <div className="flex flex-wrap gap-3">
            <Link to="/register/member" className="gb-btn" style={{ background: gym.primary_color }} data-testid="portal-register">Registrarme</Link>
            <Link to="/membership-check" className="gb-btn gb-btn-outline" data-testid="portal-check">Verificar membresía</Link>
            <Link to="/login" className="gb-btn gb-btn-ghost" data-testid="portal-login">Ya soy miembro</Link>
          </div>
        ) : (
          <div className="gb-card p-4" style={{ borderColor: gym.primary_color }} data-testid="portal-suspended">
            Este gimnasio no tiene suscripción activa actualmente. Contacta al administrador.
          </div>
        )}
      </div>
    </div>
  );
}
