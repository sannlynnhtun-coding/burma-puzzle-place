# Puzzle Place

Puzzle Place is a guest-only, Deal or No Deal-style browser game. A player chooses an event, keeps one hidden case, eliminates the remaining cases, and makes a final keep-or-switch decision to reveal their prize.

The application is fully client-side. Game content comes from static JSON files bundled with the app, while the guest name, selected event, and round progress live only in React state. There is no account system, API server, database, or persistent browser storage, so refreshing the page starts a new guest session.

## Overview

- The start page lists every playable event and its number of prize cases.
- An optional display name is normalized for the current session; a blank name becomes `Guest`.
- Each event has its own MMK cash prizes and non-cash joke prizes.
- Prize-to-case assignments are shuffled at the start of every round and replay.
- Protected play routes only open for the event selected in the active guest session.
- Players can replay the same event or return to the collection after a result.

## Gameplay workflow

1. **Choose a game** — Select an event, optionally enter a display name, and start the session.
2. **Pick a case** — Reserve one shuffled case. Its prize stays hidden while the other cases are opened.
3. **Eliminate cases** — Open unreserved cases one at a time. Revealed prizes are marked as gone in the prize deck.
4. **Make the final choice** — When two cases remain, keep the original case or switch to the other unopened case.
5. **Reveal the result** — The winning case and the unchosen case are shown together. The player may replay with a fresh shuffle or choose another event.

## Application flow

```text
Static JSON catalog
        |
        v
Catalog validation and event options
        |
        v
Start page -> in-memory guest session -> /play/:eventId
                                           |
                                           v
                         pick -> eliminate -> keep/switch -> result
                                           |
                              replay or choose another game
```

## Stack

- React 18, TypeScript, Vite, React Router, and Tailwind CSS
- Vitest, Testing Library, and jsdom for automated tests
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

## Development workflow

1. Update the relevant components, game logic, or static catalog data.
2. Add or adjust tests under `src/test` when behavior changes.
3. Run the verification commands below.
4. Build the production bundle and preview it locally when validating routing or deployment behavior:

   ```bash
   npm run build
   npm run preview
   ```

## Static catalog

The event catalog is stored in:

- `src/data/game-events.json`
- `src/data/prize-pool.json`

These files contain the 12 supplied events with at least five linked prize rows and all 100 of those prizes. The application builds one catalog per event and validates required game metadata, MMK currency, minimum prize count, unique prize IDs, numeric values, prize kinds, and normalized sort order before presenting the game selector.

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
