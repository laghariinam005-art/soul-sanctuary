# Soul Sanctuary Integrated Digital Platform for Research and Community Engagement

FastAPI + PostgreSQL backend, React (Vite) + Recharts frontend.
Modules: sign-up/login (JWT), surveys (from the PDF), dashboard, analytics, data, social media.

## 1. Prerequisites
- Python 3.11+, Node.js 18+ and PostgreSQL (pgAdmin). The `.env` already contains
  `DATABASE_URL=postgresql://postgres:1111@localhost:5432/postgres` (change it if your login differs).

## 2. Install
```bash
# backend
cd backend
python -m venv .venv && . .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```
```bash
# frontend (second terminal)
cd frontend
cp .env.example .env        # Windows: copy .env.example .env  (already included)
npm install
```

## 3. Run
```bash
cd backend  && uvicorn main:app --reload      # http://localhost:8000/docs
cd frontend && npm run dev                    # http://localhost:5173
```
On backend start you should see `Database connected`, `Tables ready (create_all).`, the admin seed line and
`Survey in DB: 2 sections, 25 questions (PDF: 2 sections, 25 questions)`.
With `SEED_DEMO_DATA=true` the first start also bulk-creates the demo data (takes several seconds).

## 4. Logins
- Admin: `admin@soulsanctuary.local` / `Admin@12345` (from `.env`; shown as "Alex Morgan").
- Demo users: `demoN@demo.local` / `DemoPass123`. Anyone can also register on the Login/Register page (18+).

## 5. Useful commands
- Remove all demo data: `cd backend && python seed.py --remove-demo`
- Turn demo data off: set `SEED_DEMO_DATA=false` in `.env`.
- Admin-only features: New Survey, Export Report (CSV), add projects, edit social stats, Meta sync.

## Decisions worth knowing
- **Survey Responses chart**: responses to the main questionnaire (first survey with questions), Jan 1 -> now split into 6 equal periods labelled Q1..Q6. Y axis is 0-80 and only grows if the data needs it.
- **Registration growth**: new users per month of the current year; "YTD" is the sum.
- **KPI deltas**: current month vs previous month (registrations, completed responses, entries from projects created that month). "N new" = surveys activated in the last 30 days.
- **Instagram card** follows the screenshot: header "Likes (+1.2k)", heart = Shares, bubble = Comments, people = Followers. Facebook shows likes and "Likes (+980)".
- **Registration is 18+** so the age groups (18-24, 25-34, 35-44, 45+) cover everyone.
- Only active surveys with questions can be taken; one submission per user per survey.
- The "View/Edit" links in the dashboard tables are display only (they are not clickable); use the top navigation.
- Meta sync needs `META_ACCESS_TOKEN` plus `META_FACEBOOK_PAGE_ID` / `META_INSTAGRAM_USER_ID`; without them the stored values are used.
- Demo seeding moves the PDF survey's created date 60 days back so the four named demo surveys are the latest rows in the dashboard table.

## Folder structure
`backend/` (main, database, model, schemas, auth, seed, route/*) and
`frontend/src/` (main.jsx, App.jsx, api.js, auth.jsx, utils.js, styles.css, pages/*, components/*).

## Frontend notes (React)
- Pages: Login/Register, Dashboard, Surveys, Data, Analytics, Social Media (same modules as before).
- Settings live in `frontend/.env` (`VITE_API_BASE_URL`, social profile links). Backend `CORS_ORIGINS` must include `http://localhost:5173`.
- The login now survives a page reload (token kept in the browser's localStorage); "Log out" clears it.
- Production build: `cd frontend && npm run build` (output in `frontend/dist`).
