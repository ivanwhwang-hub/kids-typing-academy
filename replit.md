# Kids Typing Academy

A browser-based typing tutor for kids aged 6–12. Teaches typing from zero keyboard knowledge up to 70–90 WPM expert level. All data stored in localStorage — no backend, no accounts, works fully offline after first load.

## Run & Operate

- `pnpm --filter @workspace/kids-typing-academy run dev` — run the typing app (port set by env)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000, unused by typing app)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui components
- Routing: wouter
- Charts: recharts
- Animation: framer-motion
- Storage: localStorage only (no backend)
- Font: Nunito (Google Fonts)

## Where things live

- `artifacts/kids-typing-academy/src/pages/` — all page components (Home, Profile, Lesson, Assessment, Admin)
- `artifacts/kids-typing-academy/src/lib/types.ts` — TypeScript interfaces (Profile, Badge, etc.)
- `artifacts/kids-typing-academy/src/lib/storage.ts` — localStorage read/write helpers
- `artifacts/kids-typing-academy/src/lib/content.ts` — all lesson and assessment text content
- `artifacts/kids-typing-academy/src/lib/badges.ts` — badge definitions and award logic
- `artifacts/kids-typing-academy/src/components/VirtualKeyboard.tsx` — finger-color-coded keyboard

## Architecture decisions

- **100% localStorage** — No backend or database. All profiles, progress, and custom words live in the browser. Zero hosting cost.
- **Frontend-only artifact** — No OpenAPI/codegen needed. The `@workspace/api-client-react` import is NOT used.
- **5-level progression** — Each level locked behind an assessment with explicit accuracy + WPM thresholds.
- **Confetti via CSS keyframes** — Celebration animation is pure CSS, no external library.

## Product

- Profile picker: kids tap their avatar to enter
- Lesson screen: character-by-character typing with color-coded virtual keyboard showing which finger to use
- Assessment: 60-second timed test with pass/fail and specific feedback
- Badges: 12 milestone badges earned through practice and level completions
- Parent Panel (`/admin`): manage profiles, add custom word lists, view all progress
- Progress chart: WPM and accuracy over time via recharts

## Level Requirements

| Level | Name | Accuracy | WPM |
|-------|------|----------|-----|
| 1 | Home Row Hero | 80% | none |
| 2 | Key Explorer | 80% | 10 |
| 3 | Word Builder | 85% | 25 |
| 4 | Speed Racer | 90% | 45 |
| 5 | Expert Mode | 92% | 70 |

## User preferences

- Zero cost — no paid hosting or services
- Works offline after first load
- PC and Mac compatible (standard US keyboard layout)
- Code stored on GitHub for cross-device access
- All progress saved locally in the browser

## Gotchas

- The app uses `import.meta.env.BASE_URL` as the wouter router base — do not hardcode paths
- Google Fonts `@import url(...)` MUST be the first line of `index.css` — before `@import "tailwindcss"`
- Do NOT import `@workspace/api-client-react` — this app has no API
- localStorage key for profiles: `kta-data`, for custom words: `kta-custom-words`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
