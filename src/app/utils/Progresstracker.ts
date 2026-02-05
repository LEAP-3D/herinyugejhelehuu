/**
 * Get current game progress
 * Returns 0 if no progress saved
 */
export const getProgress = (): number => {
  if (typeof window !== "undefined") {
    return parseInt(localStorage.getItem("gameProgress") || "0");
  }
  return 0;
};

/**
 * Check if a world can be accessed based on progress
 * World 1 is always accessible
 */
export const canAccessWorld = (worldNumber: number): boolean => {
  const progress = getProgress();
  return worldNumber <= progress + 1;
};

/**
 * Reset all progress
 */
export const resetProgress = (ground?: { y: number }): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("gameProgress");
    if (ground) {
      ground.y = -300;
    }
  }
};

/**
 * Get next world number
 * Returns null if already completed all worlds
 */
export const getNextWorld = (): number | null => {
  const progress = getProgress();
  if (progress >= 3) return null; // All worlds completed
  return progress + 1;
};
