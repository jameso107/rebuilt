# Rebuilt Scouting App

A scouting app for FIRST Robotics teams. Runs as a web app and can be installed on iPhone (or any device) as a Progressive Web App (PWA).

## Features

- **Simple sign-in**: First name + last initial only
- **Match setup**: Enter 6 robot numbers (3 red, 3 blue), 1–5 digits each
- **Whole alliance mode**: Rank 3 robots best→worst for accuracy, volume, defense, awareness, speed, autonomous
- **Individual robot mode**: Tickers for cross bump, cross tunnel, passing cycles; press-and-hold to record shooting time and scoring cycles (with average cycle time)
- **Comments** on every scout
- **Database**: Supabase (optional) or localStorage fallback
- **Admin dashboard**: Visualizations, rankings, and individual team stats (password: `107107`)
- **The Blue Alliance integration**: Begin Event (Michigan events), event team restriction, match numbers (QXX), OPR, climb data, and team photos in team focus tab

## Quick Start (Web)

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Build for Production

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, GitHub Pages, etc.).

## iPhone Setup (Add to Home Screen)

1. **Deploy the app** to a public URL (e.g. Vercel, Netlify, or your own server).
2. Open Safari on your iPhone and go to your app URL.
3. Tap the **Share** button (square with arrow).
4. Scroll down and tap **Add to Home Screen**.
5. Name it (e.g. "Scouting") and tap **Add**.

The app will open in standalone mode (no browser UI) and work like a native app. It works offline after the first load.

## The Blue Alliance (TBA) Setup

1. Get an API key from [thebluealliance.com/account](https://www.thebluealliance.com/account) → Read API Keys.
2. Add to `.env`:
   ```
   VITE_TBA_API_KEY=your-tba-api-key
   ```

With TBA configured:
- **Begin Event** in Admin fetches Michigan (FIM) events; selecting one restricts match setup to that event's teams and clears local scout data.
- **Match number** (e.g. Q12) on match setup links scouts to TBA match data.
- **Team focus tab** shows OPR, climb info from TBA matches, and team avatar when available.

## Database Setup (Supabase)

Without Supabase, data is stored in the browser’s localStorage (per device). For team-wide data:

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run `supabase-schema.sql`.
3. Copy `.env.example` to `.env` and add your project URL and anon key:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. Rebuild and redeploy.

## Project Structure

```
src/
├── context/AppContext.tsx   # User & match state
├── lib/db.ts               # Data submission (Supabase / localStorage)
├── pages/
│   ├── SignIn.tsx          # First name, last initial
│   ├── MatchSetup.tsx      # 6 robots, alliance/robot selection
│   ├── AllianceScout.tsx   # Whole alliance rankings
│   └── RobotScout.tsx      # Individual robot tickers + hold-to-shoot
└── App.tsx                 # Routing
```

## Data Format

**Alliance scout** (whole alliance):

- `type: 'alliance'`
- `rankings`: For each category, `[best, middle, worst]` robot numbers
- `comments`

**Robot scout** (individual robot):

- `type: 'robot'`
- `crossBump`, `crossTunnel`, `passingCycles`: counts
- `shootingSessions`: `[{ startTime, endTime }]` for each hold
- `scoringCycleCount`, `averageCycleTimeMs`
- `comments`
