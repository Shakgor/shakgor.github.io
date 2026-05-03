import { useEffect, useState } from "react";
import { api, formatApiError } from "../lib/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useBrand } from "../context/BrandContext";
import { Plus, RefreshCw } from "lucide-react";

const TABS = ["Resumen", "Branding", "Equipamiento", "Miembros", "Pagos"];

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Resumen");
  const [gym, setGym] = useState(null);
  const { setBrand } = useBrand();
  const load = async () => { const { data } = await api.get("/owner/gym"); setGym(data); if (data) setBrand(data); };
  useEffect(() => { load(); }, []);

  if (!user || user.role !== "owner") return <div className="p-10" data-testid="owner-forbidden">Acceso restringido.</div>;

  return (
    <div data-testid="owner-dashboard">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Dueño · {gym?.name}</p>
            <h1 className="font-display text-5xl">Operations</h1>
          </div>
          {gym && (
            <span className={`gb-badge ${gym.subscription_status === "active" ? "success" : gym.subscription_status === "suspended" ? "error" : "warning"}`} data-testid="owner-sub-badge">
              {gym.subscription_status === "active" ? "Suscripción activa" : gym.subscription_status === "suspended" ? "Suspendida" : "Pendiente de admin"}
            </span>
          )}
        </div>
        {gym?.subscription_status !== "active" && (
          <div className="gb-card p-4 mb-6" style={{ borderColor: "var(--gb-primary)" }} data-testid="sub-warning">
            Tu suscripción no está activa. Algunas funciones (registro de miembros nuevos) están disponibles solo cuando el admin la active.
          </div>
        )}
        <div className="border-b border-white/10 mb-6 flex gap-1 overflow-x-auto" data-testid="owner-tabs">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              data-testid={`owner-tab-${t.toLowerCase()}`}
              className={`px-5 py-3 text-sm uppercase tracking-widest font-bold border-b-2 ${tab === t ? "text-white" : "text-white/40 border-transparent hover:text-white/80"}`}
              style={tab === t ? { borderColor: "var(--gb-primary)" } : {}}>{t}</button>
          ))}
        </div>
        {tab === "Resumen" && <SummaryTab gym={gym}/>}
        {tab === "Branding" && <BrandingTab gym={gym} reload={load}/>}
        {tab === "Equipamiento" && <EquipmentTab gym={gym} reload={load}/>}
        {tab === "Miembros" && <MembersTab/>}
        {tab === "Pagos" && <PaymentsTab/>}
      </div>
    </div>
  );
}

function SummaryTab({ gym }) {
  if (!gym) return null;
  const link = `${window.location.origin}/g/${gym.slug}`;
  return (
    <div className="grid md:grid-cols-3 gap-4" data-testid="owner-summary">
      <div className="gb-card p-6"><p className="text-xs uppercase tracking-widest text-white/50">Estado</p><h3 className="font-display text-3xl">{gym.subscription_status}</h3></div>
      <div className="gb-card p-6"><p className="text-xs uppercase tracking-widest text-white/50">Vence</p><h3 className="font-display text-3xl">{gym.subscription_expires_at ? new Date(gym.subscription_expires_at).toLocaleDateString() : "—"}</h3></div>
      <div className="gb-card p-6"><p className="text-xs uppercase tracking-widest text-white/50">Equipamiento</p><h3 className="font-display text-3xl">{(gym.equipment || []).length} ítems</h3></div>
      <div className="gb-card p-6 md:col-span-3">
        <p className="text-xs uppercase tracking-widest text-white/50 mb-2">Portal público de tu gym</p>
        <a href={link} className="text-lg" style={{ color: "var(--gb-primary)" }} data-testid="gym-public-link">{link}</a>
      </div>
    </div>
  );
}

function BrandingTab({ gym, reload }) {
  const [form, setForm] = useState({ name: "", logo_url: "", primary_color: "#FF3B30", secondary_color: "#007AFF", background_color: "#0A0A0A" });
  const [msg, setMsg] = useState("");
  useEffect(() => { if (gym) setForm({ name: gym.name, logo_url: gym.logo_url || "", primary_color: gym.primary_color, secondary_color: gym.secondary_color, background_color: gym.background_color }); }, [gym]);
  const save = async () => {
    setMsg("");
    try { await api.put("/owner/gym/branding", form); setMsg("Guardado"); reload(); }
    catch (e) { setMsg(formatApiError(e.response?.data?.detail)); }
  };
  return (
    <div className="grid md:grid-cols-2 gap-6" data-testid="branding-tab">
      <div className="gb-card p-6 space-y-3">
        <h3 className="font-display text-3xl">Identidad de la marca</h3>
        <Field label="Nombre del gym" v={form.name} on={v => setForm({ ...form, name: v })} t="brand-name"/>
        <Field label="URL del logo" v={form.logo_url} on={v => setForm({ ...form, logo_url: v })} t="brand-logo"/>
        <div className="grid grid-cols-3 gap-3">
          <ColorField label="Primario" v={form.primary_color} on={v => setForm({ ...form, primary_color: v })} t="brand-primary"/>
          <ColorField label="Secundario" v={form.secondary_color} on={v => setForm({ ...form, secondary_color: v })} t="brand-secondary"/>
          <ColorField label="Fondo" v={form.background_color} on={v => setForm({ ...form, background_color: v })} t="brand-bg"/>
        </div>
        <button className="gb-btn" onClick={save} data-testid="brand-save">Guardar</button>
        {msg && <p className="text-sm text-white/60" data-testid="brand-msg">{msg}</p>}
      </div>
      <div className="gb-card p-6">
        <p className="text-xs uppercase tracking-widest text-white/50 mb-3">Vista previa</p>
        <div className="rounded p-6 border border-white/10" style={{ background: form.background_color }}>
          <div className="flex items-center gap-3 mb-4">
            {form.logo_url ? <img src={form.logo_url} alt="" className="h-10 w-10 object-contain" /> : <div className="h-10 w-10" style={{ background: form.primary_color }}/>}
            <span className="font-display text-3xl" style={{ color: form.primary_color }}>{form.name || "GYM"}</span>
          </div>
          <button className="gb-btn" style={{ background: form.primary_color }}>Botón primario</button>
          <button className="gb-btn ml-2" style={{ background: form.secondary_color }}>Secundario</button>
        </div>
      </div>
    </div>
  );
}
function Field({ label, v, on, t }) {
  return (<div><label className="text-xs uppercase tracking-widest text-white/50 mb-1 block">{label}</label>
    <input className="gb-input" value={v || ""} onChange={e => on(e.target.value)} data-testid={t}/></div>);
}
function ColorField({ label, v, on, t }) {
  return (<div><label className="text-xs uppercase tracking-widest text-white/50 mb-1 block">{label}</label>
    <div className="flex gap-2"><input type="color" value={v} onChange={e => on(e.target.value)} className="h-10 w-12 bg-transparent border border-white/10" data-testid={t}/>
    <input className="gb-input" value={v} onChange={e => on(e.target.value)}/></div></div>);
}

function EquipmentTab({ gym, reload }) {
  const [items, setItems] = useState([]);
  const [val, setVal] = useState("");
  useEffect(() => { setItems(gym?.equipment || []); }, [gym]);
  const add = () => { if (val.trim()) { setItems([...items, val.trim()]); setVal(""); } };
  const remove = (i) => setItems(items.filter((_, j) => j !== i));
  const save = async () => { await api.put("/owner/gym/equipment", { items }); reload(); };
  return (
    <div className="gb-card p-6 max-w-xl" data-testid="equipment-tab">
      <h3 className="font-display text-3xl mb-3">Aparatos disponibles</h3>
      <div className="flex gap-2 mb-3">
        <input className="gb-input" value={val} onChange={e => setVal(e.target.value)} placeholder="ej: Mancuernas, Banco plano" data-testid="equip-input"/>
        <button className="gb-btn" onClick={add} data-testid="equip-add"><Plus size={14}/></button>
      </div>
      <ul className="space-y-1 mb-4">{items.map((it, i) => <li key={i} className="flex justify-between gb-card p-2 px-3"><span>{it}</span><button onClick={() => remove(i)} className="text-white/40 hover:text-white">×</button></li>)}</ul>
      <button className="gb-btn" onClick={save} data-testid="equip-save">Guardar</button>
    </div>
  );
}

function MembersTab() {
  const [list, setList] = useState([]);
  const load = async () => { const { data } = await api.get("/owner/members"); setList(data); };
  useEffect(() => { load(); }, []);
  return (
    <div data-testid="members-tab">
      <div className="flex justify-between items-center mb-3"><h3 className="font-display text-3xl">Miembros</h3>
        <button className="gb-btn gb-btn-outline" onClick={load}><RefreshCw size={14}/> Refrescar</button></div>
      <div className="gb-card overflow-x-auto">
        <table className="gb-table">
          <thead><tr><th>Nombre</th><th>Email</th><th>Tel</th><th>Nivel</th><th>Estado</th><th>Vence</th></tr></thead>
          <tbody>
            {list.map(m => (
              <tr key={m.id} data-testid={`owner-member-${m.id}`}>
                <td>{m.name}</td><td>{m.email}</td><td>{m.phone}</td><td>{m.level}</td>
                <td><span className={`gb-badge ${m.membership.status === "active" ? "success" : m.membership.status === "expired" ? "error" : "warning"}`}>{m.membership.status}</span></td>
                <td>{m.membership.expires_at ? new Date(m.membership.expires_at).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan="6" className="text-center text-white/40 py-8">Sin miembros</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsTab() {
  const [members, setMembers] = useState([]);
  const [pays, setPays] = useState([]);
  const [form, setForm] = useState({ member_id: "", plan_type: "monthly", amount: 0 });
  const [msg, setMsg] = useState("");
  const load = async () => {
    const m = await api.get("/owner/members"); setMembers(m.data);
    const p = await api.get("/owner/payments"); setPays(p.data);
  };
  useEffect(() => { load(); }, []);
  const submit = async (e) => {
    e.preventDefault(); setMsg("");
    try { await api.post("/owner/payments", { ...form, amount: parseFloat(form.amount) }); setMsg("Pago registrado"); load(); }
    catch (e) { setMsg(formatApiError(e.response?.data?.detail)); }
  };
  return (
    <div className="grid md:grid-cols-3 gap-4" data-testid="payments-tab">
      <form onSubmit={submit} className="gb-card p-6 space-y-3 md:col-span-1" data-testid="payment-form">
        <h3 className="font-display text-2xl">Registrar pago</h3>
        <select className="gb-input" value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })} required data-testid="pay-member">
          <option value="">— Miembro —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
        </select>
        <select className="gb-input" value={form.plan_type} onChange={e => setForm({ ...form, plan_type: e.target.value })} data-testid="pay-plan">
          <option value="monthly">Mensual (30 días)</option>
          <option value="15days">Quincenal (15 días)</option>
          <option value="visit">Por visita (1 día)</option>
        </select>
        <input type="number" step="0.01" className="gb-input" placeholder="Monto" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required data-testid="pay-amount"/>
        <button className="gb-btn w-full" data-testid="pay-submit">Registrar</button>
        {msg && <p className="text-sm text-white/60">{msg}</p>}
      </form>
      <div className="gb-card overflow-x-auto md:col-span-2">
        <table className="gb-table">
          <thead><tr><th>Miembro</th><th>Plan</th><th>Monto</th><th>Pago</th><th>Vence</th></tr></thead>
          <tbody>
            {pays.map(p => {
              const mem = members.find(m => m.id === p.member_id);
              return <tr key={p.id} data-testid={`payment-row-${p.id}`}>
                <td>{mem?.name || p.member_id}</td><td>{p.plan_type}</td><td>${p.amount.toFixed(2)}</td>
                <td>{new Date(p.paid_at).toLocaleDateString()}</td><td>{new Date(p.expires_at).toLocaleDateString()}</td>
              </tr>;
            })}
            {pays.length === 0 && <tr><td colSpan="5" className="text-center text-white/40 py-8">Sin pagos</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
