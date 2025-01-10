const K_FACTOR = 32;
const SCALE = 400;
const BASE_EXPONENT = 10;

export const getNextPlayerElo = (
  playerOneRating: number,
  playerTwoRating: number,
  gameResult: 0 | 1
) => {
  const myChanceToWin =
    1 /
    (1 + Math.pow(BASE_EXPONENT, (playerTwoRating - playerOneRating) / SCALE));

  const ratingDelta = Math.round(K_FACTOR * (gameResult - myChanceToWin));

  const newRating = playerOneRating + ratingDelta;

  return {
    newRating,
    ratingDelta,
  };
};
