# GymBros — Multi-tenant Gym Management SaaS

## Original Problem Statement
Plataforma para gestionar gimnasios. Cada dueño se registra (email + teléfono + contraseña). El admin global aprueba la suscripción. Los miembros se registran bajo un gym, responden un cuestionario y reciben dieta y rutina personalizadas. Las preguntas y la base de alimentos (Excel) las carga el admin. Las rutinas se ajustan a los aparatos del gym. PDF descargable de plan, descarga ZIP completa, exporte Excel de miembros, branding por gym (logo/colores/nombre), nivel mensual progresivo, registro de pagos (mensual/15 días/visita), verificación de membresía por email.

## Architecture
- **Backend**: FastAPI + Motor (MongoDB) + bcrypt + PyJWT + reportlab (PDF) + openpyxl (XLSX) + zipfile (ZIP)
- **Frontend**: React + react-router + Tailwind + shadcn-style + Bebas Neue/Manrope + lucide-react
- **Auth**: JWT Bearer (httpOnly cookie also set), bcrypt password hashing
- **Multi-tenant**: each gym has slug, branding (logo URL + 3 colors), equipment list, subscription status

## User Personas
- **Admin global**: gestiona todo (username `admin`, password `gymbros2026`)
- **Dueño de gym**: registra su gym, paga suscripción, gestiona miembros y pagos
- **Miembro**: se inscribe a un gym, responde cuestionario, recibe plan, descarga PDF

## Core Requirements (Static)
- 3 roles, JWT auth
- Subscription gating per gym
- Configurable questionnaire → auto diet + routine
- XLSX foods upload, routines CRUD, equipment per gym
- PDF plan generation
- Members XLSX export, full ZIP backup
- Per-gym branding + portal `/g/:slug`
- Public membership status check by email
- Admin can change own credentials

## Implemented (2026-02)
- ✅ JWT auth (login by username or email) — admin seeded on startup
- ✅ Owner registration (creates gym pending subscription)
- ✅ Member registration tied to gym
- ✅ Admin: subscription mgmt (active/suspended/pending + days), questions CRUD, foods XLSX upload, routines CRUD, members XLSX export, ZIP backup, change credentials
- ✅ Owner: branding, equipment, members list, payments (monthly/15days/visit)
- ✅ Member: questionnaire → plan generation (diet + routine), PDF download, level-up
- ✅ Public: membership-check by email, gym portal `/g/:slug`, gyms list
- ✅ Performance Pro design (Bebas Neue, Manrope, dark theme, red accent)
- ✅ Tested: 18/18 backend tests passed

## Backlog / P1
- Email/SMS notification when membership about to expire
- Auto monthly cron for level-up
- More foods upload modes (merge instead of replace)
- Rate limiting / brute-force lockout per auth playbook

## P2
- Mobile-optimized member view with daily check-ins
- Member progress photos / measurements
- Owner analytics dashboard with charts
