import type { GameDefinition } from "./types";
import Snake from "./snake";
import ClickRush from "./click-rush";
import Reaction from "./reaction";
import Memory from "./memory";
import GuessNumber from "./guess-number";
import Pong from "./pong";
import SpaceDodge from "./space-dodge";
import Runner from "./runner";
import Quiz from "./quiz";
import Minesweeper from "./minesweeper";
import TicTacToe from "./tic-tac-toe";
import Simon from "./simon";
import WhackAMole from "./whack-a-mole";

/**
 * Game registry — add a new game by appending one entry here.
 * Nothing else in the app needs to change: grid, routes, ranking and
 * score saving all read from this list.
 */
export const GAMES: GameDefinition[] = [
  {
    id: "snake",
    slug: "snake",
    name: "Snake",
    icon: "🐍",
    description: "Come, crece y no choques contra ti mismo ni contra los muros.",
    category: "Arcade",
    scoreLabel: "Mejor puntuación",
    instructions: [
      "Dirige la serpiente hacia la comida verde.",
      "Cada comida suma 10 puntos y alarga la serpiente.",
      "Si chocas con un muro o contigo mismo, la partida termina.",
    ],
    controls: ["Flechas o W A S D", "Botones en pantalla en móvil"],
    Component: Snake,
  },
  {
    id: "click-rush",
    slug: "click-rush",
    name: "Click Rush",
    icon: "⚡",
    description: "Haz todos los clics que puedas en 10 segundos.",
    category: "Reflejos",
    scoreLabel: "Récord de clics",
    instructions: [
      "Pulsa 'Comenzar' y aparecerá el botón gigante.",
      "Haz tantos clics como puedas antes de que acabe el tiempo.",
      "Al final se guarda tu récord de clics.",
    ],
    controls: ["Ratón o toque en pantalla"],
    Component: ClickRush,
  },
  {
    id: "reaction",
    slug: "reaction",
    name: "Reaction Test",
    icon: "🎯",
    description: "Mide tu tiempo de reacción en milisegundos.",
    category: "Reflejos",
    lowerIsBetter: true,
    scoreLabel: "Mejor tiempo",
    scoreUnit: "ms",
    instructions: [
      "Pulsa para comenzar y espera la señal verde.",
      "Cuando aparezca, pulsa lo más rápido posible.",
      "Si pulsas antes de la señal, el intento no cuenta.",
    ],
    controls: ["Clic o toque en la zona grande"],
    Component: Reaction,
  },
  {
    id: "memory",
    slug: "memory",
    name: "Memory",
    icon: "🧠",
    description: "Encuentra todas las parejas con el menor número de movimientos.",
    category: "Puzzle",
    scoreLabel: "Mejor puntuación",
    instructions: [
      "Destapa dos cartas por turno.",
      "Si coinciden se quedan descubiertas.",
      "Cuantos menos movimientos necesites, más puntos ganas.",
    ],
    controls: ["Clic o toque sobre las cartas"],
    Component: Memory,
  },
  {
    id: "guess-number",
    slug: "adivina-el-numero",
    name: "Adivina el número",
    icon: "🔢",
    description: "Encuentra el número secreto entre 1 y 100.",
    category: "Cerebro",
    scoreLabel: "Mejor puntuación",
    instructions: [
      "Escribe un número entre 1 y 100.",
      "Te diré si el secreto es más alto o más bajo.",
      "Cuantos menos intentos uses, más puntos consigues.",
    ],
    controls: ["Teclado numérico"],
    Component: GuessNumber,
  },
  {
    id: "pong",
    slug: "pong",
    name: "Pong",
    icon: "🏓",
    description: "El clásico duelo de palas contra el ordenador. Gana quien llegue a 5.",
    category: "Clásicos",
    scoreLabel: "Mejor puntuación",
    instructions: [
      "Mueve tu pala para devolver la pelota.",
      "El primero que llegue a 5 puntos gana la partida.",
      "Cada punto tuyo suma 20 puntos de puntuación.",
    ],
    controls: ["↑ / ↓ o W / S", "Arrastra el dedo en móvil"],
    Component: Pong,
  },
  {
    id: "space-dodge",
    slug: "space-dodge",
    name: "Space Dodge",
    icon: "🚀",
    description: "Esquiva meteoritos con tu nave. La dificultad no deja de subir.",
    category: "Arcade",
    scoreLabel: "Mejor puntuación",
    instructions: [
      "Mueve la nave de lado a lado.",
      "Cada meteorito esquivado suma 5 puntos.",
      "La velocidad y la cantidad aumentan con el tiempo.",
    ],
    controls: ["← / → o A / D", "Arrastra el dedo en móvil"],
    Component: SpaceDodge,
  },
  {
    id: "runner",
    slug: "runner",
    name: "Runner",
    icon: "🏃",
    description: "Corre, salta obstáculos y aguanta lo máximo posible.",
    category: "Arcade",
    scoreLabel: "Mejor distancia",
    instructions: [
      "Tu personaje corre solo y cada vez más rápido.",
      "Salta para esquivar los obstáculos.",
      "Cada obstáculo superado suma 10 puntos.",
    ],
    controls: ["Espacio, ↑ o toque en pantalla"],
    Component: Runner,
  },
  {
    id: "quiz",
    slug: "quiz",
    name: "Quiz",
    icon: "❓",
    description: "Ocho preguntas de varias categorías con cuatro respuestas.",
    category: "Cerebro",
    scoreLabel: "Mejor puntuación",
    instructions: [
      "Responde 8 preguntas de categorías variadas.",
      "Verás en verde la respuesta correcta tras cada elección.",
      "Cada acierto suma 25 puntos.",
    ],
    controls: ["Clic o toque en la respuesta"],
    Component: Quiz,
  },
  {
    id: "minesweeper",
    slug: "minesweeper",
    name: "Minesweeper",
    icon: "💣",
    description: "Despeja el tablero de 9x9 sin pisar ninguna de las 10 minas.",
    category: "Puzzle",
    scoreLabel: "Mejor puntuación",
    instructions: [
      "Abre casillas para descubrir cuántas minas hay alrededor.",
      "Marca las minas con banderas.",
      "Ganas al abrir todas las casillas seguras.",
    ],
    controls: ["Clic para abrir", "Clic derecho o botón de bandera para marcar"],
    Component: Minesweeper,
  },
  {
    id: "tic-tac-toe",
    slug: "tres-en-raya",
    name: "Tres en raya",
    icon: "❌",
    description: "Tres en raya contra una CPU que no perdona despistes.",
    category: "Clásicos",
    scoreLabel: "Mejor puntuación",
    instructions: [
      "Juegas con las X y empiezas tú.",
      "Consigue tres en línea antes que la CPU.",
      "Victoria: 100 puntos. Empate: 40 puntos.",
    ],
    controls: ["Clic o toque en el tablero"],
    Component: TicTacToe,
  },
  {
    id: "simon",
    slug: "simon",
    name: "Simon",
    icon: "🎵",
    description: "Repite la secuencia de colores, que crece en cada nivel.",
    category: "Cerebro",
    scoreLabel: "Mejor puntuación",
    instructions: [
      "Observa la secuencia de colores iluminados.",
      "Repítela en el mismo orden.",
      "Cada nivel superado suma 15 puntos.",
    ],
    controls: ["Clic o toque en los paneles"],
    Component: Simon,
  },
  {
    id: "whack-a-mole",
    slug: "topos",
    name: "Caza topos",
    icon: "🐹",
    description: "Atrapa todos los topos que puedas en 30 segundos.",
    category: "Reflejos",
    scoreLabel: "Mejor puntuación",
    instructions: [
      "Los topos aparecen en agujeros al azar.",
      "Toca el topo antes de que desaparezca.",
      "Cada topo atrapado suma 5 puntos.",
    ],
    controls: ["Clic o toque en los agujeros"],
    Component: WhackAMole,
  },
];

export const CATEGORIES = [...new Set(GAMES.map((g) => g.category))];

export function findGame(slug: string) {
  return GAMES.find((g) => g.slug === slug);
}

export function gameById(id: string) {
  return GAMES.find((g) => g.id === id);
}
