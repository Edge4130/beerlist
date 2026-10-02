# BeerList (working title)

A personal BJCP-style beer scoresheet: score against style, log it, map where you drank it.

Rename the app in `src/config.js` and `index.html` (title).

## Run locally

1. `npm install`
2. Copy `.env.example` to `.env` and add your Supabase URL and anon key.
   Without a `.env`, the app runs in preview mode and saves entries in the browser only.
3. `npm run dev`

## Database

Run `supabase-schema.sql` once in the Supabase SQL Editor.

## Deploy

BeerList shares WingList's Supabase project (new `beer_pours` table, WingList's `ratings` untouched).

1. Supabase: open the WingList project, SQL Editor, run `supabase-schema.sql`.
2. GitHub: new repo `beerlist`, upload everything in this folder except `node_modules` and `.env`.
3. Vercel: Add New Project, import `beerlist`. Framework preset Vite. Add three env vars:
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (copy WingList's values; use the legacy
   eyJ... anon key, not the sb_publishable_ key), and `VITE_ADMIN_CODE` (passcode for edit/delete).
4. Deploy. Env changes need a redeploy with the build cache cleared.

## Files

- `src/data/bjcpStyles.js` BJCP 2021 style names, numbers, parameters, overall impressions
- `src/data/scoresheet.js` sections, rows, education tips, descriptor lists, flaws and causes, colors, scoring bands
- `src/components/Tip.jsx` the tap/hover education bubble
- `src/components/TagBox.jsx` optional descriptor tags
- `src/components/ScoreForm.jsx` the scoresheet
- `src/components/StylePicker.jsx` searchable style list (type 21, 21c, or a name)
- `src/components/FlawsDrawer.jsx` slide-over flaws panel
- `src/components/LogView.jsx` list with expandable score detail, edit, delete
- `src/components/MapView.jsx` Leaflet map of where you drank each beer
- `src/components/About.jsx` BJCP credit (required by BJCP's app terms)
- `src/lib/store.js` Supabase, or browser storage when no env is set

## BJCP

Style information is Copyright 2021, Beer Judge Certification Program, Inc., used with permission;
scoresheet format Copyright 2019, BJCP. BJCP's terms for apps require the in-app credit, a pointer
to www.bjcp.org, the current guidelines, the app staying free, and a permission request to the
BJCP Communication Director with screenshots.

Known gap: 21B Specialty IPA shows its variant list but not variant parameters.
