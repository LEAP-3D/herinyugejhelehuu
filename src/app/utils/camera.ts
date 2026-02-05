interface Camera {
  x: number;
  y: number;
}

interface Player {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

/**
 * Updates camera position to follow a single player smoothly
 */
export const updateCamera = (
  camera: Camera,
  player: Player,
  canvasWidth: number,
  smoothing: number = 0.1
): Camera => {
  const playerWidth = player.width || 45;
  const targetCameraX = player.x - canvasWidth / 2 + playerWidth / 2;
  const newX = camera.x + (targetCameraX - camera.x) * smoothing;

  return {
    x: Math.max(0, newX),
    y: camera.y,
  };
};

/**
 * Updates camera position to follow average position of all players
 * This creates a smooth camera that keeps all players in view
 */
export const updateCameraMultiplayer = (
  camera: Camera,
  players: Map<number, Player> | Player[],
  canvasWidth: number,
  playerWidth: number = 45,
  smoothing: number = 0.1
): Camera => {
  const playerArray = Array.isArray(players) ? players : Array.from(players.values());
  
  if (playerArray.length === 0) return camera;

  // Calculate average X position of all players
  const avgX = playerArray.reduce((sum, p) => sum + p.x, 0) / playerArray.length;

  const targetCameraX = avgX - canvasWidth / 2 + playerWidth / 2;
  const newX = camera.x + (targetCameraX - camera.x) * smoothing;

  return {
    x: Math.max(0, newX),
    y: camera.y,
  };
};

export type { Camera };