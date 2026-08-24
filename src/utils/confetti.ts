import confetti from "canvas-confetti";

export function fireConfetti() {
  // Fire from both sides for a celebration burst
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.1, y: 0.5 },
    colors: ["#fbbf24", "#f472b6", "#60a5fa", "#34d399", "#a78bfa", "#fb923c"],
  });
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.9, y: 0.5 },
    colors: ["#fbbf24", "#f472b6", "#60a5fa", "#34d399", "#a78bfa", "#fb923c"],
  });
  // Small burst in the center
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 120,
      origin: { x: 0.5, y: 0.4 },
    });
  }, 150);
}
