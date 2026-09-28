import type { ComponentType } from "react";

export type SoundTone = "click" | "score" | "win" | "lose" | "tick";

export type GameFinishPayload = {
  /** Points earned this run (or the measured value for time based games). */
  score: number;
  won?: boolean;
  timeMs?: number | null;
};

export type GameProps = {
  /** Call when a run ends. Saves the session + best score. */
  finish: (payload: GameFinishPayload) => void;
  /** Optional sound effects, respects the global sound switch. */
  play: (tone: SoundTone) => void;
};

export type GameCategory = "Arcade" | "Reflejos" | "Puzzle" | "Cerebro" | "Clásicos";

export type GameDefinition = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  category: GameCategory;
  /** Lower results win (reaction times, move counters). */
  lowerIsBetter?: boolean;
  scoreLabel: string;
  scoreUnit?: string;
  instructions: string[];
  controls: string[];
  Component: ComponentType<GameProps>;
};
