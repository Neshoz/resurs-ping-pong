export const getNextPlayerElo = (
  myRating: number,
  opponentRating: number,
  gameResult: 0 | 1
) => {
  const myChanceToWin =
    1 / (1 + Math.pow(10, (opponentRating - myRating) / 400));

  const ratingDelta = Math.round(32 * (gameResult - myChanceToWin));

  const newRating = myRating + ratingDelta;

  return {
    newRating,
    ratingDelta,
  };
};
