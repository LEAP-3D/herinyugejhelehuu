/**
 * Physics constants shared across all worlds
 */
export const PHYSICS = {
  GRAVITY: 0.6,
  JUMP_FORCE: -9,
  MOVE_SPEED: 4,
} as const;

/**
 * Player dimensions
 */
export const PLAYER_DIMENSIONS = {
  WIDTH: 35,
  HEIGHT: 55,
} as const;

/**
 * Game timing constants
 */
export const TIMING = {
  DEATH_FREEZE_TIME: 1500,
  FPS: 60,
  SERVER_UPDATE_RATE: 3,
} as const;

/**
 * Player colors for different player IDs
 */
export const PLAYER_COLORS = [
  "#4A90D9",
  "#D94A4A",
  "#4AD94A",
  "#D9D94A",
] as const;

/**
 * Max players allowed in a room
 */
export const MAX_PLAYERS = 4;

/**
 * World objects (WORLD 1)
 * ⚠️ This structure MATCHES how it is used in the game code
 */
export const GAME_OBJECTS_WORLD1 = {
  // Ground
  groundY: 420,
  GROUND_OFFSET: 40,

  // Platforms
  platforms: [
    { x: 0, y: 420, width: 1200, height: 40 },
    { x: 200, y: 330, width: 140, height: 20 },
    { x: 420, y: 260, width: 140, height: 20 },
    { x: 650, y: 300, width: 160, height: 20 },
  ],

  // Collectible key
  KEY: {
    x: 560,
    y: 240,
    width: 48,
    height: 60,
    yOffset: 0,
  },

  // Exit door
  DOOR: {
    x: 1080,
    y: 360,
    width: 48,
    height: 60,
    yOffset: 0,
  },

  // Danger buttons
  dangerButtons: [{ x: 520, y: 400, width: 30, height: 20 }],
} as const;

/**
 * Check collision between two rectangular objects (AABB)
 */
export const checkCollision = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number },
): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

/**
 * Check if player is standing on a platform
 */
export const isOnPlatform = (
  player: { x: number; y: number; width: number; height: number; vy: number },
  platform: { x: number; y: number; width: number; height: number },
): boolean => {
  return (
    player.vy >= 0 &&
    player.y + player.height <= platform.y + 10 &&
    player.y + player.height >= platform.y - 5 &&
    player.x + player.width > platform.x &&
    player.x < platform.x + platform.width
  );
};

/**
 * Apply platform collision to player
 */
export const applyPlatformCollision = (
  player: { y: number; height: number; vy: number; onGround: boolean },
  platformY: number,
): void => {
  player.y = platformY - player.height;
  player.vy = 0;
  player.onGround = true;
};

/**
 * Check if player hit a danger button
 */
export const checkDangerButtonCollision = (
  player: { x: number; y: number; width: number; height: number },
  buttons: Array<{ x: number; y: number; width: number; height: number }>,
): boolean => {
  return buttons.some((button) => checkCollision(player, button));
};

/**
 * Calculate player spawn position based on player ID
 */
export const getSpawnPosition = (playerId: number, groundY: number) => ({
  x: 50 + playerId * 80,
  y: groundY - PLAYER_DIMENSIONS.HEIGHT,
});

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Linear interpolation between two values
 */
export const lerp = (start: number, end: number, amount: number): number => {
  return start + (end - start) * amount;
};

/**
 * Check if point is inside rectangle
 */
export const pointInRect = (
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number },
): boolean => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
};
