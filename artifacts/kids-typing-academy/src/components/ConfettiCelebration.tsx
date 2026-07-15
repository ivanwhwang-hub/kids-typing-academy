import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface Props {
  active: boolean;
}

export function ConfettiCelebration({ active }: Props) {
  useEffect(() => {
    if (!active) return;

    const colors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { x: 0.5, y: 0.55 },
      colors,
      startVelocity: 40,
      gravity: 0.9,
      scalar: 1.1,
    });

    const t1 = setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { x: 0.2, y: 0.6 },
        colors,
        startVelocity: 30,
        angle: 70,
      });
    }, 200);

    const t2 = setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { x: 0.8, y: 0.6 },
        colors,
        startVelocity: 30,
        angle: 110,
      });
    }, 350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return null;
}
