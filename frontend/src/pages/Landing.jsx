import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ShieldCheck, Activity, Salad, Dumbbell, BarChart3, Download } from "lucide-react";

const HERO = "https://images.unsplash.com/photo-1603665409265-bdc00027c217?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwzfHxneW0lMjB3b3Jrb3V0JTIwZGFya3xlbnwwfHx8fDE3Nzc2ODUwMjR8MA&ixlib=rb-4.1.0&q=85";
const FEATURE_WORKOUT = "https://images.unsplash.com/photo-1561570121-c8219daec12b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjB3b3Jrb3V0JTIwZGFya3xlbnwwfHx8fDE3Nzc2ODUwMjR8MA&ixlib=rb-4.1.0&q=85";
const FEATURE_DIET = "https://images.unsplash.com/photo-1609915437515-9d0f0166b537?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwzfHxoZWFsdGh5JTIwbWVhbCUyMHByZXB8ZW58MHx8fHwxNzc3Nzc1NjM3fDA&ixlib=rb-4.1.0&q=85";

export default function Landing() {
  return (
    <div className="min-h-screen" data-testid="landing-page">
      <Navbar />
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO} alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-28 md:py-40">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-6" data-testid="hero-eyebrow">
            Plataforma SaaS · Multi-gym · Performance Pro
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-8xl leading-[0.9] mb-6 max-w-4xl">
            Gestiona tu <span style={{ color: "var(--gb-primary)" }}>gimnasio</span> como un atleta de élite.
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mb-10">
            Suscripciones, miembros, rutinas auto-generadas, dietas personalizadas desde tu base de datos
            de alimentos en Excel y branding completo por gym. Todo bajo un solo panel táctico.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register/owner" className="gb-btn" data-testid="cta-register-owner">
              Registrar mi Gym
            </Link>
            <Link to="/membership-check" className="gb-btn gb-btn-outline" data-testid="cta-check-membership">
              Verificar membresía
            </Link>
            <Link to="/login" className="gb-btn gb-btn-ghost" data-testid="cta-login">
              Ingresar →
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-6 tactical-grid-bg">
        <Feature icon={ShieldCheck} title="Control de Suscripciones" desc="El admin global aprueba o suspende dueños de gym según pago." />
        <Feature icon={Activity} title="Cuestionario Inteligente" desc="Preguntas configurables que generan automáticamente dieta y rutina." />
        <Feature icon={Salad} title="Base de Alimentos en Excel" desc="Sube un .xlsx; los miembros nunca ven la hoja, solo su plan." />
        <Feature icon={Dumbbell} title="Rutinas por Equipamiento" desc="Las rutinas se ajustan a los aparatos disponibles en tu gym." />
        <Feature icon={BarChart3} title="Niveles Mensuales" desc="Cada mes el plan se adapta al nivel del miembro: principiante → avanzado." />
        <Feature icon={Download} title="Exportes & Backups" desc="Descarga miembros en Excel, planes en PDF, respaldo completo en ZIP." />
      </section>

      {/* SPLIT BANNER */}
      <section className="grid md:grid-cols-2">
        <div className="relative min-h-[400px]">
          <img src={FEATURE_WORKOUT} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="relative p-10 md:p-14 flex flex-col justify-end h-full">
            <h3 className="font-display text-4xl md:text-5xl mb-3">Rutinas Adaptativas</h3>
            <p className="text-white/70 max-w-md">Asigna rutinas previamente cargadas que se filtran automáticamente por nivel, equipamiento y objetivo.</p>
          </div>
        </div>
        <div className="relative min-h-[400px]">
          <img src={FEATURE_DIET} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="relative p-10 md:p-14 flex flex-col justify-end h-full">
            <h3 className="font-display text-4xl md:text-5xl mb-3">Dietas a Medida</h3>
            <p className="text-white/70 max-w-md">Calorías objetivo calculadas a partir de las respuestas del miembro y combinadas con tus alimentos.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 mt-10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/50">© {new Date().getFullYear()} GymBros · Performance Pro Edition</p>
          <Link to="/login" className="text-sm text-white/60 hover:text-white" data-testid="footer-admin-login">
            Admin / Owner login
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="gb-card p-6" data-testid={`feature-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <div className="h-10 w-10 mb-4 flex items-center justify-center" style={{ background: "var(--gb-primary)" }}>
        <Icon size={18} className="text-white" />
      </div>
      <h3 className="font-display text-2xl mb-2">{title}</h3>
      <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
