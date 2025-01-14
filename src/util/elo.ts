const K_FACTOR = 32;
const SCALE = 400;
const BASE_EXPONENT = 10;

export interface EloDiff {
  newRating: number;
  delta: number;
}

export const getNextPlayerElo = (
  player: number,
  opponent: number,
  gameResult: 0 | 1
): EloDiff => {
  const playerChanceToWin =
    1 / (1 + Math.pow(BASE_EXPONENT, (opponent - player) / SCALE));

  const delta = Math.round(K_FACTOR * (gameResult - playerChanceToWin));

  const newRating = player + delta;

  return {
    newRating,
    delta,
  };
};
