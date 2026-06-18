# ⚽ WC26 Family Predictor

FIFA World Cup 2026 family prediction game — built with Next.js, Supabase & Vercel.

---

## 🚀 Setup (do these in order)

### 1. Install dependencies
```bash
npm install
```

### 2. Get your API keys

**Supabase** (free):
1. Go to https://app.supabase.com → New project
2. After it spins up: Settings → API
3. Copy `Project URL` and `anon public` key
4. Copy `service_role` key (keep secret!)

**football-data.org** (free):
1. Go to https://www.football-data.org/client/register
2. Register → check email → copy your API key

### 3. Set up environment variables
```bash
cp .env.example .env.local
```
Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
FOOTBALL_DATA_API_KEY=your_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SYNC_SECRET=make_up_any_random_string_here
```

### 4. Run the Supabase migration
1. Open https://app.supabase.com → your project → SQL Editor
2. Click "New query"
3. Copy-paste the contents of `supabase/migrations/001_schema.sql`
4. Click "Run"

### 5. Configure Supabase Auth
1. Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL** to `http://localhost:3000`
3. Add to **Redirect URLs**: `http://localhost:3000/auth/callback`
4. Later for production, also add: `https://your-app.vercel.app/auth/callback`

### 6. Run locally
```bash
npm run dev
```
Open http://localhost:3000

### 7. Sync fixtures (first time)
Once running, open this in your browser:
```
http://localhost:3000/api/fixtures/sync?secret=YOUR_SYNC_SECRET
```
This pulls all WC2026 matches into your database.

---

## 📦 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo at vercel.com → Import Project.

**Add environment variables in Vercel:**
- Dashboard → your project → Settings → Environment Variables
- Add all variables from `.env.local`
- Change `NEXT_PUBLIC_SITE_URL` to your Vercel URL

**Enable cron jobs (auto-sync):**
- Update `vercel.json` — replace `REPLACE_WITH_YOUR_SYNC_SECRET` with your actual sync secret
- The cron runs every 5 minutes during the tournament to keep scores updated

---

## 🎮 How to play

1. **Sign up** — name + email, get a magic link
2. **Browse fixtures** — today, upcoming, live, results — all in BD time
3. **Predict** — pick a score before kickoff locks
4. **Banker** — mark one pick per matchday as your banker (2× points if correct)
5. **React** — emoji-react and trash talk your family's picks
6. **Leaderboard** — check who's winning

### Points
| Result | Points |
|---|---|
| Exact scoreline | 5 pts |
| Correct result/draw | 2 pts |
| Correct goal difference (bonus) | +1 pt |
| Banker correct | ×2 multiplier |

---

## 🏗️ Project structure

```
src/
  app/
    auth/           → Sign up + magic link callback
    fixtures/       → Match list with tabs (live/today/upcoming/results)
    predict/        → Prediction list + individual match prediction form
    leaderboard/    → Rankings, podium, stats
    bracket/        → Group standings + knockout tree
    profile/        → Personal stats, badges, history
    api/
      fixtures/sync → Sync from football-data.org API
  components/
    layout/         → AppShell (wrapper), BottomNav
    ui/             → MatchCard, Reactions, Comments
  lib/
    supabase/       → Browser + server clients
    football-api.ts → API wrapper + flag emojis
    time.ts         → BD timezone utilities
    points.ts       → Points calculation
  types/            → TypeScript interfaces
supabase/
  migrations/       → SQL schema (run in Supabase dashboard)
```

---

## 🕐 Bangladesh Time

All match times are automatically shown in BST (UTC+6 = Bangladesh Standard Time).
No manual conversion needed — the app handles it everywhere.

---

## ❓ FAQ

**Q: Magic link not arriving?**  
Check spam. Make sure Supabase Site URL + Redirect URLs are set correctly.

**Q: No fixtures showing?**  
Hit `/api/fixtures/sync?secret=YOUR_SECRET` to pull from the API.

**Q: Scores not updating?**  
The Vercel cron syncs every 5 min. Locally, hit the sync endpoint manually.

**Q: Can I use this for other tournaments?**  
Yes! Change `WC_ID` in `src/lib/football-api.ts` to any competition ID from football-data.org.
