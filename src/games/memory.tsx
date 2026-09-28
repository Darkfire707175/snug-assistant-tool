import { useEffect, useRef, useState } from "react";
import type { GameProps } from "./types";

const EMOJIS = ["🎮", "👾", "🚀", "🕹️", "🍄", "⚡", "🏆", "💎"];

type Card = { id: number; emoji: string; flipped: boolean; done: boolean };

function build(): Card[] {
  return [...EMOJIS, ...EMOJIS]
    .map((emoji, i) => ({ id: i, emoji, flipped: false, done: false, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ id, emoji, flipped, done }) => ({ id, emoji, flipped, done }));
}

export default function Memory({ finish, play }: GameProps) {
  const [cards, setCards] = useState<Card[]>(build);
  const [moves, setMoves] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const sent = useRef(false);
  const won = cards.length > 0 && cards.every((c) => c.done);

  useEffect(() => {
    if (picked.length !== 2) return;
    const [a, b] = picked;
    const cardA = cards.find((c) => c.id === a)!;
    const cardB = cards.find((c) => c.id === b)!;
    setMoves((m) => m + 1);
    if (cardA.emoji === cardB.emoji) {
      play("score");
      setCards((prev) => prev.map((c) => (c.id === a || c.id === b ? { ...c, done: true } : c)));
      setPicked([]);
    } else {
      const id = window.setTimeout(() => {
        setCards((prev) =>
          prev.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c)),
        );
        setPicked([]);
      }, 750);
      return () => window.clearTimeout(id);
    }
  }, [picked, cards, play]);

  useEffect(() => {
    if (won && !sent.current) {
      sent.current = true;
      play("win");
      finish({ score: Math.max(200 - moves * 5, 20), won: true });
    }
  }, [won, moves, finish, play]);

  const flip = (card: Card) => {
    if (card.flipped || card.done || picked.length === 2) return;
    play("click");
    setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, flipped: true } : c)));
    setPicked((p) => [...p, card.id]);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="font-display text-lg">
        Movimientos: <span className="text-gradient">{moves}</span>
      </p>
      <div className="grid w-full max-w-lg grid-cols-4 gap-3">
        {cards.map((card) => {
          const open = card.flipped || card.done;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => flip(card)}
              className={`flex aspect-square items-center justify-center rounded-xl border border-border text-3xl transition-all duration-300 ${
                open
                  ? `${card.done ? "bg-success/20" : "bg-surface-2"} scale-100`
                  : "bg-gradient-brand text-transparent hover:scale-105"
              }`}
            >
              {open ? card.emoji : "?"}
            </button>
          );
        })}
      </div>
      {won && (
        <div className="animate-pop panel px-8 py-5 text-center">
          <p className="font-display text-2xl text-gradient">¡Completado!</p>
          <p className="text-muted-foreground">Lo lograste en {moves} movimientos</p>
        </div>
      )}
    </div>
  );
}
