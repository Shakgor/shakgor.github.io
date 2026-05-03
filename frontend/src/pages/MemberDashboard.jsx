import { useEffect, useState } from "react";
import { api, formatApiError, API } from "../lib/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { Download, ArrowUp } from "lucide-react";

export default function MemberDashboard() {
  const { user, refresh } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [plan, setPlan] = useState(null);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/public/questions").then(({ data }) => setQuestions(data));
    api.get("/member/plan").then(({ data }) => setPlan(data)).catch(() => {});
  }, []);

  if (!user || user.role !== "member") return <div className="p-10" data-testid="member-forbidden">Acceso restringido.</div>;

  const submit = async () => {
    setErr(""); setSubmitting(true);
    try {
      const payload = { answers: questions.map(q => ({ question_id: q.id, option_index: parseInt(answers[q.id] ?? -1, 10) })).filter(a => a.option_index >= 0) };
      const { data } = await api.post("/member/questionnaire", payload);
      setPlan(data); await refresh();
    } catch (e) { setErr(formatApiError(e.response?.data?.detail)); }
    finally { setSubmitting(false); }
  };

  const downloadPdf = () => {
    const token = localStorage.getItem("gb_token");
    fetch(`${API}/member/plan/pdf`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(b => { const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "plan.pdf"; a.click(); URL.revokeObjectURL(u); });
  };

  const levelUp = async () => { await api.post("/member/level-up"); const { data } = await api.get("/member/plan"); setPlan(data); await refresh(); };

  return (
    <div data-testid="member-dashboard">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Bienvenido</p>
        <h1 className="font-display text-5xl mb-6">{user.name}</h1>
        <div className="flex gap-2 mb-8">
          <span className="gb-badge">Nivel: {user.level || "beginner"}</span>
          <span className="gb-badge muted">{user.email}</span>
        </div>

        {!plan && (
          <div className="gb-card p-6 mb-6" data-testid="questionnaire">
            <h2 className="font-display text-3xl mb-1">Cuestionario</h2>
            <p className="text-white/50 mb-5 text-sm">Responde para que generemos tu plan personalizado.</p>
            {questions.map((q, idx) => (
              <div key={q.id} className="mb-5" data-testid={`question-${idx}`}>
                <p className="font-medium mb-2">{idx + 1}. {q.text}</p>
                <div className="space-y-2">
                  {q.options.map((o, i) => (
                    <label key={i} className="flex items-center gap-3 p-3 gb-card cursor-pointer hover:border-white/30">
                      <input type="radio" name={q.id} value={i} checked={String(answers[q.id]) === String(i)}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} data-testid={`q-${idx}-opt-${i}`}/>
                      <span>{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {err && <div className="text-sm mb-3" style={{ color: "var(--gb-primary)" }}>{err}</div>}
            <button className="gb-btn" disabled={submitting} onClick={submit} data-testid="submit-questionnaire">
              {submitting ? "Generando..." : "Generar Mi Plan"}
            </button>
          </div>
        )}

        {plan && (
          <>
            <div className="flex flex-wrap gap-3 mb-6">
              <button className="gb-btn" onClick={downloadPdf} data-testid="download-plan-pdf"><Download size={14}/> Descargar PDF</button>
              <button className="gb-btn gb-btn-outline" onClick={levelUp} data-testid="level-up-btn"><ArrowUp size={14}/> Subir nivel (mensual)</button>
              <button className="gb-btn gb-btn-ghost" onClick={() => setPlan(null)} data-testid="redo-questionnaire">Rehacer cuestionario</button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="gb-card p-6" data-testid="plan-diet">
                <h2 className="font-display text-3xl mb-1">Dieta</h2>
                <p className="text-white/60 text-sm mb-4">Objetivo: <strong>{plan.calorie_target} kcal/día</strong></p>
                {Object.entries(plan.diet?.meals || {}).map(([meal, items]) => (
                  <div key={meal} className="mb-4">
                    <p className="text-xs uppercase tracking-widest text-white/50 mb-2">{meal}</p>
                    {items.length === 0 ? <p className="text-white/40 text-sm">Sin alimentos asignados</p> :
                      <ul className="text-sm space-y-1">{items.map((i, k) => <li key={k}>• {i.name} — {i.amount} {i.unit} ({i.calories} kcal)</li>)}</ul>}
                  </div>
                ))}
              </div>

              <div className="gb-card p-6" data-testid="plan-routine">
                <h2 className="font-display text-3xl mb-1">Rutina</h2>
                {plan.routine ? (
                  <>
                    <p className="text-white/60 text-sm mb-4"><strong>{plan.routine.name}</strong> · {plan.routine.level}</p>
                    <ul className="text-sm space-y-2">
                      {plan.routine.exercises?.map((e, i) => (
                        <li key={i} className="border-l-2 pl-3" style={{ borderColor: "var(--gb-primary)" }}>
                          <strong>{e.name}</strong> — {e.sets} × {e.reps}
                          {e.equipment && <span className="text-white/40 text-xs ml-2">({e.equipment})</span>}
                          {e.notes && <p className="text-white/50 text-xs mt-1">{e.notes}</p>}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : <p className="text-white/40">No hay rutina disponible. Pide al admin que cargue rutinas.</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
