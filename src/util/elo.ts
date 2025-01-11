const K_FACTOR = 32;
const SCALE = 400;
const BASE_EXPONENT = 10;

export interface EloDiff {
  newRating: number;
  delta: number;
}

export const getNextPlayerElo = (
  playerOneRating: number,
  playerTwoRating: number,
  gameResult: 0 | 1
): EloDiff => {
  const myChanceToWin =
    1 /
    (1 + Math.pow(BASE_EXPONENT, (playerTwoRating - playerOneRating) / SCALE));

  const delta = Math.round(K_FACTOR * (gameResult - myChanceToWin));

  const newRating = playerOneRating + delta;

  return {
    newRating,
    delta,
  };
};
