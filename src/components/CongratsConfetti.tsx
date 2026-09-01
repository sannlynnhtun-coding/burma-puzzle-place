import { useMemo, type CSSProperties } from 'react';

type ConfettiPiece = {
  left: string;
  delay: string;
  duration: string;
  rotate: string;
  color: string;
};

const COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#a855f7', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
];

function createPieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => {
    const left = `${Math.random() * 100}%`;
    const delay = `${Math.random() * 0.8}s`;
    const duration = `${1.2 + Math.random() * 0.9}s`;
    const rotate = `${Math.random() * 360}deg`;
    const color = COLORS[i % COLORS.length];
    return { left, delay, duration, rotate, color };
  });
}

export default function CongratsConfetti({ pieces = 28 }: { pieces?: number }) {
  const confetti = useMemo(() => createPieces(pieces), [pieces]);

  return (
    <div className="confetti-container" aria-hidden="true">
      {confetti.map((p, idx) => (
        <span
          key={idx}
          className="confetti-piece"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            ['--confetti-rotate']: p.rotate,
            backgroundColor: p.color,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}


