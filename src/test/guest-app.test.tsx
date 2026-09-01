import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { GuestSessionProvider } from '../contexts/GuestSessionContext';
import { MAX_DISPLAY_NAME_LENGTH, normalizeDisplayName } from '../lib/guestName';
import AppRoutes from '../routes';

function renderApp(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <GuestSessionProvider>
        <AppRoutes />
      </GuestSessionProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('guest session', () => {
  it('normalizes names and enforces the 40-character limit', () => {
    expect(normalizeDisplayName('   ')).toBe('Guest');
    expect(normalizeDisplayName('  Ada   Lovelace  ')).toBe('Ada Lovelace');
    expect(normalizeDisplayName('x'.repeat(80))).toHaveLength(MAX_DISPLAY_NAME_LENGTH);
  });

  it('redirects a fresh game URL to the start screen', async () => {
    renderApp('/play/2b4ae830-a20a-4f61-b991-3d510c2032a3');
    expect(await screen.findByRole('button', { name: /start playing/i })).toBeInTheDocument();
  });

  it('lets the guest choose a game event', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderApp();

    const gameCard = screen.getByRole('button', { name: 'Choose မဟာသင်္ကြန် ငွေသားဆုမဲကြီး' });
    fireEvent.click(gameCard);
    expect(gameCard).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /start playing/i }));

    expect(await screen.findByRole('heading', { name: 'မဟာသင်္ကြန် ငွေသားဆုမဲကြီး' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Case 6' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Case 7' })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('starts as Guest without writing browser storage', async () => {
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: /start playing/i }));

    expect(await screen.findByText((_, element) => element?.textContent === 'Playing as Guest')).toBeInTheDocument();
    expect(storageSpy).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('completes and replays a named game without saving a result', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('scrollTo', vi.fn());
    renderApp();

    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: '  Ada   Lovelace  ' } });
    fireEvent.click(screen.getByRole('button', { name: /start playing/i }));
    expect(await screen.findByText((_, element) => element?.textContent === 'Playing as Ada Lovelace')).toBeInTheDocument();

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Case 1' }));
    expect(screen.getByRole('heading', { name: /^your case$/i })).toBeInTheDocument();
    expect(screen.getByText('Case 01')).toBeInTheDocument();
    expect(screen.getByText(/prize stays hidden until the final choice/i)).toBeInTheDocument();
    expect(screen.getByText('Yours')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Case 2' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    expect(screen.getByRole('heading', { name: /opened case #2/i })).toBeInTheDocument();
    expect(screen.getByText(/your case 01 is still kept safe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/is gone$/i)).toBeInTheDocument();
    expect(screen.getByText('19 still in play')).toBeInTheDocument();

    for (let caseNumber = 3; caseNumber <= 19; caseNumber += 1) {
      fireEvent.click(screen.getByRole('button', { name: `Case ${caseNumber}` }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(450);
      });
    }

    fireEvent.click(screen.getByRole('button', { name: 'Keep Case 1' }));
    expect(screen.getByText('Congratulations, Ada Lovelace!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose another game/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /full prize deck/i })).not.toBeInTheDocument();
    expect(document.querySelector('.winner-page')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /play again/i }));
    expect(screen.getByText('Pick one case to keep.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
