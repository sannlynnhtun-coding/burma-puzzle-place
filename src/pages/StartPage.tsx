import { useState, type FormEvent } from 'react';
import {
  Banknote,
  Briefcase,
  Check,
  Clapperboard,
  Dices,
  Flame,
  Gift,
  Heart,
  Lamp,
  Laugh,
  Play,
  Smartphone,
  Sparkles,
  UserRound,
  Utensils,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGuestSession } from '../contexts/GuestSessionContext';
import { getGameOptions } from '../lib/catalog';
import { getGameTheme } from '../lib/gameThemes';
import { MAX_DISPLAY_NAME_LENGTH } from '../lib/guestName';

const GAME_ICONS: readonly LucideIcon[] = [
  Briefcase,
  Utensils,
  Banknote,
  Wrench,
  Laugh,
  Clapperboard,
  Dices,
  Smartphone,
  Heart,
  Lamp,
  Flame,
  Gift,
];

export default function StartPage() {
  const navigate = useNavigate();
  const games = getGameOptions();
  const { displayName, selectedEventId, start } = useGuestSession();
  const [name, setName] = useState(displayName === 'Guest' ? '' : displayName);
  const [eventId, setEventId] = useState(
    games.some((game) => game.id === selectedEventId) ? selectedEventId! : games[0].id,
  );
  const selectedGame = games.find((game) => game.id === eventId)!;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    start(name, eventId);
    navigate(`/play/${eventId}`);
  };

  return (
    <main className="game-shell start-shell min-h-screen overflow-hidden px-3 py-5 text-white sm:px-6 sm:py-8">
      <div className="arcade-shape arcade-shape-left" aria-hidden="true" />
      <div className="arcade-shape arcade-shape-right" aria-hidden="true" />

      <form onSubmit={handleSubmit} className="start-form relative z-10 mx-auto max-w-[1480px] animate-fade-in">
        <header className="start-header flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="h-14 w-14 object-contain drop-shadow-[4px_4px_0_#02010b] sm:h-16 sm:w-16" />
            <div>
              <p className="arcade-logo text-xl font-black uppercase leading-none sm:text-2xl">Puzzle</p>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-white">Place</p>
            </div>
          </div>

          <div className="w-full sm:w-80">
            <label htmlFor="display-name" className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#AAB1D6]">
              <UserRound size={15} className="text-[#48EDA0]" />
              Display name <span className="font-semibold normal-case tracking-normal">(optional)</span>
            </label>
            <div className="relative">
              <input
                id="display-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={MAX_DISPLAY_NAME_LENGTH}
                autoComplete="off"
                placeholder="Guest"
                className="w-full rounded-xl border-2 border-[#4A5277] bg-[#0E0B28] px-4 py-3 pr-16 font-bold text-white outline-none placeholder:text-[#737A9C] focus:border-[#48EDA0] focus:ring-4 focus:ring-[#48EDA0]/15"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#737A9C]">{name.length}/{MAX_DISPLAY_NAME_LENGTH}</span>
            </div>
          </div>
        </header>

        <section className="start-hero pb-6 pt-8 text-center sm:pb-8 sm:pt-10">
          <div className="mb-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-[#48EDA0]">
            <Sparkles size={16} /> Guest arcade
          </div>
          <h1 className="arcade-title text-4xl font-black uppercase leading-[0.92] sm:text-6xl lg:text-7xl">
            Pick <span>Your</span> Game
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium text-[#BFC5E3] sm:text-base">
            Choose an event, pick your lucky case, then decide whether to keep it or switch.
          </p>
        </section>

        <fieldset className="min-w-0">
          <legend className="sr-only">Choose a game event</legend>
          <div className="start-game-grid grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
            {games.map((game, index) => {
              const Icon = GAME_ICONS[index] ?? Gift;
              const theme = getGameTheme(index);
              const selected = game.id === eventId;

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => setEventId(game.id)}
                  aria-label={`Choose ${game.title}`}
                  aria-describedby={`game-${game.id}-cases`}
                  aria-pressed={selected}
                  className="game-poster start-game-card group relative isolate flex aspect-[3/4] min-h-0 min-w-0 w-full flex-col overflow-hidden p-2.5 text-left text-[#09051B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D9FF43] focus-visible:ring-offset-4 focus-visible:ring-offset-[#08051D] sm:p-4"
                  style={{ backgroundColor: theme.background }}
                >
                  <div className="poster-noise" aria-hidden="true" />
                  <div className="relative z-10 flex items-start">
                    <span className="poster-number">{String(index + 1).padStart(2, '0')}</span>
                  </div>

                  <span id={`game-${game.id}-cases`} className="start-case-count">
                    {game.prizeCount} cases
                  </span>

                  <div className="start-card-stage relative z-10 grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
                    <div className="start-card-copy min-w-0 self-end">
                      <p className="text-[0.58rem] font-black uppercase tracking-[0.16em] opacity-70 sm:text-[0.65rem]">{theme.kicker}</p>
                      <h2 className="poster-title mt-1 line-clamp-3 text-sm font-black leading-tight sm:text-base">{game.title}</h2>
                    </div>

                    <div className="poster-art start-card-art relative flex min-h-0 items-center justify-center overflow-hidden" aria-hidden="true">
                      <span className="poster-orbit poster-orbit-one" />
                      <span className="poster-orbit poster-orbit-two" />
                      <div className="poster-icon start-card-icon" style={{ backgroundColor: theme.accent }}>
                        <Icon className="h-12 w-12 stroke-[2.8] sm:h-16 sm:w-16" />
                      </div>
                    </div>
                  </div>

                  {selected && (
                    <span className="absolute bottom-2 right-2 z-20 grid h-7 w-7 place-items-center rounded-full border-[3px] border-[#09051B] bg-[#D9FF43] shadow-[2px_2px_0_#09051B] sm:h-8 sm:w-8" aria-hidden="true">
                      <Check size={18} strokeWidth={4} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="start-actions mx-auto mt-8 max-w-3xl text-center sm:mt-10">
          <p className="mb-3 line-clamp-1 text-sm font-bold text-[#C6CBE5]">
            Selected: <span className="text-white">{selectedGame.title}</span>
          </p>
          <button type="submit" className="arcade-cta inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#48EDA0] px-8 py-4 text-base font-black uppercase tracking-wide text-[#09051B] sm:w-auto sm:min-w-[360px] sm:text-lg">
            <Play size={22} fill="currentColor" />
            Start playing
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-[#9DA5CB] sm:text-sm">
            <Gift size={16} /> No account needed. Your name and result are never saved.
          </p>
        </div>
      </form>
    </main>
  );
}
