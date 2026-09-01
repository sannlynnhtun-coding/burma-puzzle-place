# Puzzle Place

Puzzle Place is a guest-only, Deal or No Deal style game. Players may enter an optional display name, choose from the available game events, and replay without creating an account. Names and results are never persisted.

## Stack

- React 18, TypeScript, Vite, React Router, and Tailwind CSS
- Static JSON game and prize data bundled by Vite

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the Vite development server:

   ```bash
   npm run dev
   ```

No environment variables, database, account, or API server are required.

## Static catalog

The event catalog is stored in:

- `src/data/game-events.json`
- `src/data/prize-pool.json`

These files contain the 12 supplied events with at least five linked prize rows and all 100 of those prizes. Events without a playable prize pool are excluded. The application validates event linkage, unique IDs, numeric values, and normalized sort order before presenting the game selector.

## Vercel deployment

Deploy the repository as a Vite project. `vercel.json` configures SPA deep-link fallback for `/play`; no storage integration or environment variables are needed.

The previous external Supabase project is not modified or migrated.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
