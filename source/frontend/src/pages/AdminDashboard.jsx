import { useEffect, useState } from "react";
import { api, formatApiError, API } from "../lib/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { Trash2, Plus, Upload, Download, RefreshCw, Database, FileSpreadsheet, FileArchive } from "lucide-react";

const TABS = ["Gyms", "Preguntas", "Alimentos", "Rutinas", "Ajustes"];

export default function AdminDashboard() {
  const { user, refresh } = useAuth();
  const [tab, setTab] = useState("Gyms");
  if (!user || user.role !== "admin") return <div className="p-10" data-testid="admin-forbidden">Acceso restringido.</div>;

  return (
    <div data-testid="admin-dashboard">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Panel Administrativo</p>
            <h1 className="font-display text-5xl">Command Center</h1>
          </div>
          <span className="gb-badge success" data-testid="admin-greeting">Hola, {user.username || user.name}</span>
        </div>
        <div className="border-b border-white/10 mb-6 flex gap-1 overflow-x-auto" data-testid="admin-tabs">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              data-testid={`admin-tab-${t.toLowerCase()}`}
              className={`px-5 py-3 text-sm uppercase tracking-widest font-bold transition-colors border-b-2 ${tab === t ? "text-white" : "text-white/40 border-transparent hover:text-white/80"}`}
              style={tab === t ? { borderColor: "var(--gb-primary)" } : {}}>{t}</button>
          ))}
        </div>
        {tab === "Gyms" && <GymsTab />}
        {tab === "Preguntas" && <QuestionsTab />}
        {tab === "Alimentos" && <FoodsTab />}
        {tab === "Rutinas" && <RoutinesTab />}
        {tab === "Ajustes" && <SettingsTab onUpdate={refresh} />}
      </div>
    </div>
  );
}

// --- Gyms Tab ---
function GymsTab() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/admin/owners"); setOwners(data); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (gymId, status, days = 30) => {
    await api.post(`/admin/gyms/${gymId}/subscription`, { status, days });
    load();
  };

  return (
    <div data-testid="admin-gyms-tab">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-3xl">Dueños y Suscripciones</h2>
        <button className="gb-btn gb-btn-outline" onClick={load} data-testid="gyms-refresh"><RefreshCw size={14}/> Refrescar</button>
      </div>
      <div className="gb-card overflow-x-auto" data-testid="owners-table">
        {loading ? <p className="p-6 text-white/60">Cargando...</p> :
          <table className="gb-table">
            <thead><tr><th>Dueño</th><th>Email</th><th>Tel</th><th>Gym</th><th>Estado</th><th>Vence</th><th></th></tr></thead>
            <tbody>
              {owners.map(o => (
                <tr key={o.id} data-testid={`owner-row-${o.id}`}>
                  <td>{o.name}</td><td>{o.email}</td><td>{o.phone}</td>
                  <td>{o.gym?.name}</td>
                  <td><span className={`gb-badge ${o.gym?.subscription_status === "active" ? "success" : o.gym?.subscription_status === "suspended" ? "error" : "warning"}`}>{o.gym?.subscription_status}</span></td>
                  <td>{o.gym?.subscription_expires_at ? new Date(o.gym.subscription_expires_at).toLocaleDateString() : "-"}</td>
                  <td className="space-x-1 whitespace-nowrap">
                    <button className="gb-btn" onClick={() => setStatus(o.gym.id, "active", 30)} data-testid={`activate-${o.gym?.id}`}>Activar 30d</button>
                    <button className="gb-btn gb-btn-outline" onClick={() => setStatus(o.gym.id, "suspended")}>Suspender</button>
                  </td>
                </tr>
              ))}
              {owners.length === 0 && <tr><td colSpan="7" className="text-center text-white/40 py-8">Sin dueños registrados</td></tr>}
            </tbody>
          </table>}
      </div>
    </div>
  );
}

// --- Questions Tab ---
function QuestionsTab() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const blank = () => ({ text: "", type: "single", order: list.length + 1, affects: "general", options: [{ label: "", tags: [], calorie_modifier: 0, level: "" }] });

  const load = async () => { const { data } = await api.get("/admin/questions"); setList(data); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = { ...editing, options: editing.options.map(o => ({ ...o, tags: typeof o.tags === "string" ? o.tags.split(",").map(s => s.trim()).filter(Boolean) : (o.tags || []), calorie_modifier: parseInt(o.calorie_modifier || 0, 10) })) };
    if (editing.id) await api.put(`/admin/questions/${editing.id}`, payload);
    else await api.post("/admin/questions", payload);
    setEditing(null); load();
  };

  const del = async (id) => { if (window.confirm("Eliminar?")) { await api.delete(`/admin/questions/${id}`); load(); } };

  return (
    <div data-testid="admin-questions-tab">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-3xl">Preguntas del Cuestionario</h2>
        <button className="gb-btn" onClick={() => setEditing(blank())} data-testid="add-question-btn"><Plus size={14}/> Nueva</button>
      </div>
      <div className="space-y-3">
        {list.map(q => (
          <div key={q.id} className="gb-card p-4 flex justify-between items-start gap-4" data-testid={`question-${q.id}`}>
            <div className="flex-1">
              <div className="flex gap-2 items-center mb-1"><span className="gb-badge muted">#{q.order}</span><span className="gb-badge muted">{q.affects}</span><span className="gb-badge muted">{q.type}</span></div>
              <p className="font-medium">{q.text}</p>
              <ul className="mt-2 text-sm text-white/60 space-y-1">
                {q.options?.map((o, i) => <li key={i}>• {o.label} <span className="text-xs text-white/40">[{(o.tags||[]).join(",")}] cal{o.calorie_modifier > 0 ? "+" : ""}{o.calorie_modifier} {o.level && `· ${o.level}`}</span></li>)}
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <button className="gb-btn gb-btn-outline" onClick={() => setEditing({ ...q, options: q.options.map(o => ({ ...o, tags: (o.tags || []).join(",") })) })} data-testid={`edit-question-${q.id}`}>Editar</button>
              <button className="gb-btn gb-btn-outline" onClick={() => del(q.id)} data-testid={`delete-question-${q.id}`}><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50" data-testid="question-editor">
          <div className="gb-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-3xl mb-4">{editing.id ? "Editar" : "Nueva"} Pregunta</h3>
            <label className="text-xs uppercase tracking-widest text-white/50 mb-1 block">Texto</label>
            <input className="gb-input mb-3" value={editing.text} onChange={e => setEditing({ ...editing, text: e.target.value })} data-testid="q-edit-text"/>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs uppercase tracking-widest text-white/50 mb-1 block">Orden</label>
                <input type="number" className="gb-input" value={editing.order} onChange={e => setEditing({ ...editing, order: parseInt(e.target.value, 10) })}/>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-white/50 mb-1 block">Afecta</label>
                <select className="gb-input" value={editing.affects} onChange={e => setEditing({ ...editing, affects: e.target.value })}>
                  <option>general</option><option>diet</option><option>routine</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-white/50 mb-1 block">Tipo</label>
                <select className="gb-input" value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value })}>
                  <option value="single">single</option>
                </select>
              </div>
            </div>
            <p className="text-xs uppercase tracking-widest text-white/50 mb-2">Opciones</p>
            {editing.options.map((o, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                <input className="gb-input col-span-4" placeholder="Etiqueta" value={o.label} onChange={e => updateOpt(editing, setEditing, i, "label", e.target.value)} />
                <input className="gb-input col-span-3" placeholder="tags (coma)" value={o.tags} onChange={e => updateOpt(editing, setEditing, i, "tags", e.target.value)} />
                <input type="number" className="gb-input col-span-2" placeholder="cal +/-" value={o.calorie_modifier} onChange={e => updateOpt(editing, setEditing, i, "calorie_modifier", e.target.value)} />
                <select className="gb-input col-span-2" value={o.level || ""} onChange={e => updateOpt(editing, setEditing, i, "level", e.target.value)}>
                  <option value="">level…</option><option value="beginner">beginner</option><option value="intermediate">intermediate</option><option value="advanced">advanced</option>
                </select>
                <button className="gb-btn gb-btn-outline col-span-1" onClick={() => setEditing({ ...editing, options: editing.options.filter((_, j) => j !== i) })}><Trash2 size={12}/></button>
              </div>
            ))}
            <button className="gb-btn gb-btn-outline mt-2" onClick={() => setEditing({ ...editing, options: [...editing.options, { label: "", tags: "", calorie_modifier: 0, level: "" }] })}><Plus size={12}/> Opción</button>
            <div className="flex gap-2 mt-6">
              <button className="gb-btn" onClick={save} data-testid="q-edit-save">Guardar</button>
              <button className="gb-btn gb-btn-outline" onClick={() => setEditing(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function updateOpt(editing, setEditing, i, k, v) {
  const opts = editing.options.slice(); opts[i] = { ...opts[i], [k]: v };
  setEditing({ ...editing, options: opts });
}

// --- Foods Tab ---
function FoodsTab() {
  const [foods, setFoods] = useState([]);
  const [msg, setMsg] = useState("");
  const load = async () => { const { data } = await api.get("/admin/foods"); setFoods(data); };
  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    setMsg("");
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    try {
      const { data } = await api.post("/admin/foods/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMsg(`Importados: ${data.count} alimentos`); load();
    } catch (e) { setMsg(formatApiError(e.response?.data?.detail, "Error al subir")); }
  };

  const clear = async () => { if (window.confirm("Borrar todos los alimentos?")) { await api.delete("/admin/foods"); load(); } };

  return (
    <div data-testid="admin-foods-tab">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="font-display text-3xl">Base de Alimentos (Excel)</h2>
        <div className="flex gap-2">
          <label className="gb-btn cursor-pointer"><Upload size={14}/> Subir XLSX
            <input type="file" accept=".xlsx" onChange={upload} className="hidden" data-testid="foods-upload-input"/></label>
          <button className="gb-btn gb-btn-outline" onClick={clear} data-testid="foods-clear">Vaciar</button>
        </div>
      </div>
      <p className="text-sm text-white/50 mb-3">Columnas requeridas: <code>name, calories, amount, unit</code>. Opcionales: <code>tags</code> (separadas por coma), <code>meal_type</code> (breakfast/lunch/dinner/snack/any).</p>
      {msg && <div className="gb-card p-3 mb-3 text-sm" data-testid="foods-msg">{msg}</div>}
      <div className="gb-card overflow-x-auto">
        <table className="gb-table" data-testid="foods-table">
          <thead><tr><th>Nombre</th><th>Calorías</th><th>Cantidad</th><th>Unidad</th><th>Tags</th><th>Comida</th></tr></thead>
          <tbody>
            {foods.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.calories}</td><td>{f.amount}</td><td>{f.unit}</td><td>{(f.tags || []).join(", ")}</td><td>{f.meal_type}</td></tr>)}
            {foods.length === 0 && <tr><td colSpan="6" className="text-center text-white/40 py-8">Sin alimentos. Sube un .xlsx</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Routines Tab ---
function RoutinesTab() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const blank = () => ({ name: "", level: "beginner", goal_tags: "", required_equipment: "", exercises: [{ name: "", sets: 3, reps: "10-12", equipment: "", notes: "" }] });
  const load = async () => { const { data } = await api.get("/admin/routines"); setList(data); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = {
      name: editing.name, level: editing.level,
      goal_tags: typeof editing.goal_tags === "string" ? editing.goal_tags.split(",").map(s => s.trim()).filter(Boolean) : editing.goal_tags,
      required_equipment: typeof editing.required_equipment === "string" ? editing.required_equipment.split(",").map(s => s.trim()).filter(Boolean) : editing.required_equipment,
      exercises: editing.exercises.map(e => ({ ...e, sets: parseInt(e.sets, 10) || 3 })),
    };
    await api.post("/admin/routines", payload);
    setEditing(null); load();
  };

  const del = async (id) => { if (window.confirm("Eliminar?")) { await api.delete(`/admin/routines/${id}`); load(); } };

  return (
    <div data-testid="admin-routines-tab">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-3xl">Rutinas</h2>
        <button className="gb-btn" onClick={() => setEditing(blank())} data-testid="add-routine-btn"><Plus size={14}/> Nueva</button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {list.map(r => (
          <div key={r.id} className="gb-card p-4" data-testid={`routine-${r.id}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-display text-2xl">{r.name}</h3>
              <button className="gb-btn gb-btn-outline" onClick={() => del(r.id)}><Trash2 size={12}/></button>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="gb-badge muted">{r.level}</span>
              {(r.goal_tags || []).map(t => <span key={t} className="gb-badge">{t}</span>)}
            </div>
            <p className="text-xs text-white/50 mb-2">Equipo: {(r.required_equipment || []).join(", ") || "Cualquier"}</p>
            <ul className="text-sm text-white/70 space-y-1">{r.exercises?.map((e, i) => <li key={i}>• {e.name} — {e.sets}×{e.reps} {e.equipment && `(${e.equipment})`}</li>)}</ul>
          </div>
        ))}
        {list.length === 0 && <p className="text-white/40">Sin rutinas. Crea una.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50" data-testid="routine-editor">
          <div className="gb-card p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-3xl mb-4">Nueva Rutina</h3>
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div><label className="text-xs uppercase tracking-widest text-white/50 mb-1 block">Nombre</label>
                <input className="gb-input" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} data-testid="r-edit-name"/></div>
              <div><label className="text-xs uppercase tracking-widest text-white/50 mb-1 block">Nivel</label>
                <select className="gb-input" value={editing.level} onChange={e => setEditing({ ...editing, level: e.target.value })}>
                  <option value="beginner">Principiante</option><option value="intermediate">Intermedio</option><option value="advanced">Avanzado</option>
                </select></div>
              <div><label className="text-xs uppercase tracking-widest text-white/50 mb-1 block">Goal tags (coma)</label>
                <input className="gb-input" value={editing.goal_tags} onChange={e => setEditing({ ...editing, goal_tags: e.target.value })}/></div>
              <div><label className="text-xs uppercase tracking-widest text-white/50 mb-1 block">Equipo requerido (coma)</label>
                <input className="gb-input" value={editing.required_equipment} onChange={e => setEditing({ ...editing, required_equipment: e.target.value })}/></div>
            </div>
            <p className="text-xs uppercase tracking-widest text-white/50 mb-2">Ejercicios</p>
            {editing.exercises.map((ex, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                <input className="gb-input col-span-4" placeholder="Ejercicio" value={ex.name} onChange={e => updateEx(editing, setEditing, i, "name", e.target.value)}/>
                <input type="number" className="gb-input col-span-1" placeholder="Sets" value={ex.sets} onChange={e => updateEx(editing, setEditing, i, "sets", e.target.value)}/>
                <input className="gb-input col-span-2" placeholder="Reps" value={ex.reps} onChange={e => updateEx(editing, setEditing, i, "reps", e.target.value)}/>
                <input className="gb-input col-span-2" placeholder="Equipo" value={ex.equipment} onChange={e => updateEx(editing, setEditing, i, "equipment", e.target.value)}/>
                <input className="gb-input col-span-2" placeholder="Notas" value={ex.notes} onChange={e => updateEx(editing, setEditing, i, "notes", e.target.value)}/>
                <button className="gb-btn gb-btn-outline col-span-1" onClick={() => setEditing({ ...editing, exercises: editing.exercises.filter((_, j) => j !== i) })}><Trash2 size={12}/></button>
              </div>
            ))}
            <button className="gb-btn gb-btn-outline mt-2" onClick={() => setEditing({ ...editing, exercises: [...editing.exercises, { name: "", sets: 3, reps: "10-12", equipment: "", notes: "" }] })}><Plus size={12}/> Ejercicio</button>
            <div className="flex gap-2 mt-6">
              <button className="gb-btn" onClick={save} data-testid="r-edit-save">Guardar</button>
              <button className="gb-btn gb-btn-outline" onClick={() => setEditing(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function updateEx(editing, setEditing, i, k, v) {
  const list = editing.exercises.slice(); list[i] = { ...list[i], [k]: v };
  setEditing({ ...editing, exercises: list });
}

// --- Settings Tab ---
function SettingsTab({ onUpdate }) {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.username || "admin");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const save = async () => {
    setMsg("");
    try {
      await api.post("/auth/change-credentials", { new_username: username, new_password: password || undefined });
      setMsg("Credenciales actualizadas");
      setPassword("");
      onUpdate?.();
    } catch (e) { setMsg(formatApiError(e.response?.data?.detail)); }
  };

  const downloadFile = (path, filename) => {
    const token = localStorage.getItem("gb_token");
    fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(b => {
        const url = URL.createObjectURL(b);
        const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6" data-testid="admin-settings-tab">
      <div className="gb-card p-6">
        <h3 className="font-display text-3xl mb-4">Credenciales</h3>
        <label className="text-xs uppercase tracking-widest text-white/50 mb-1 block">Usuario</label>
        <input className="gb-input mb-3" value={username} onChange={e => setUsername(e.target.value)} data-testid="settings-username"/>
        <label className="text-xs uppercase tracking-widest text-white/50 mb-1 block">Nueva contraseña</label>
        <input type="password" className="gb-input mb-4" value={password} onChange={e => setPassword(e.target.value)} placeholder="(dejar vacío para no cambiar)" data-testid="settings-password"/>
        <button className="gb-btn" onClick={save} data-testid="settings-save">Guardar</button>
        {msg && <p className="mt-3 text-sm" data-testid="settings-msg">{msg}</p>}
      </div>
      <div className="gb-card p-6">
        <h3 className="font-display text-3xl mb-4">Exportes & Backups</h3>
        <p className="text-sm text-white/60 mb-4">Descarga datos completos para respaldos o auditorías.</p>
        <div className="flex flex-col gap-3">
          <button className="gb-btn" onClick={() => downloadFile("/admin/export/members", "members.xlsx")} data-testid="export-members-xlsx">
            <FileSpreadsheet size={14}/> Miembros (XLSX)
          </button>
          <button className="gb-btn gb-btn-outline" onClick={() => downloadFile("/admin/backup/zip", "gymbros_backup.zip")} data-testid="export-zip-backup">
            <FileArchive size={14}/> Backup completo (ZIP)
          </button>
        </div>
      </div>
    </div>
  );
}
