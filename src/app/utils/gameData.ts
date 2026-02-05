interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DangerButton {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates all platforms for the level (World 1)
 */
export const createPlatforms = (groundY: number): Platform[] => [
  { x: 0, y: groundY + 40, width: 250, height: 20 },
  { x: 320, y: groundY + 40, width: 60, height: 20 },
  { x: 450, y: groundY + 40, width: 60, height: 20 },
  { x: 580, y: groundY + 40, width: 60, height: 20 },
  { x: 710, y: groundY + 40, width: 60, height: 20 },
  { x: 840, y: groundY + 40, width: 80, height: 20 },
  { x: 1100, y: groundY - 20, width: 100, height: 20 },
  { x: 1280, y: groundY - 50, width: 80, height: 20 },
  { x: 1440, y: groundY - 70, width: 80, height: 20 },
  { x: 1600, y: groundY - 50, width: 80, height: 20 },
  { x: 1760, y: groundY - 20, width: 100, height: 20 },
  { x: 2000, y: groundY + 20, width: 50, height: 20 },
  { x: 2120, y: groundY + 40, width: 50, height: 20 },
  { x: 2240, y: groundY + 20, width: 50, height: 20 },
  { x: 2360, y: groundY + 40, width: 50, height: 20 },
  { x: 2480, y: groundY + 20, width: 50, height: 20 },
  { x: 2600, y: groundY + 40, width: 50, height: 20 },
  { x: 2720, y: groundY + 40, width: 120, height: 20 },
  { x: 3020, y: groundY - 90, width: 100, height: 20 },
  { x: 3200, y: groundY - 90, width: 100, height: 20 },
  { x: 3380, y: groundY - 60, width: 80, height: 20 },
  { x: 3540, y: groundY - 30, width: 80, height: 20 },
  { x: 3700, y: groundY + 40, width: 60, height: 20 },
  { x: 3850, y: groundY + 15, width: 60, height: 20 },
  { x: 3990, y: groundY + 40, width: 60, height: 20 },
  { x: 4130, y: groundY + 15, width: 60, height: 20 },
  { x: 4270, y: groundY + 40, width: 60, height: 20 },
  { x: 4410, y: groundY + 40, width: 150, height: 20 },
  { x: 4760, y: groundY - 100, width: 120, height: 20 },
  { x: 4960, y: groundY - 80, width: 80, height: 20 },
  { x: 5120, y: groundY - 50, width: 80, height: 20 },
  { x: 5280, y: groundY - 20, width: 80, height: 20 },
  { x: 5440, y: groundY + 20, width: 100, height: 20 },
  { x: 5620, y: groundY + 40, width: 200, height: 20 },
];

/**
 * Creates all danger buttons for the level (World 2)
 */
export const createDangerButtonsWorld2 = (groundY: number): DangerButton[] => [
  { x: 300, y: groundY + 5, width: 40, height: 35 },
  { x: 530, y: groundY + 5, width: 40, height: 35 },
  { x: 770, y: groundY + 5, width: 40, height: 35 },
  { x: 1010, y: groundY + 5, width: 40, height: 35 },
  { x: 1250, y: groundY + 5, width: 40, height: 35 },
  { x: 1490, y: groundY + 5, width: 40, height: 35 },
  { x: 1830, y: groundY + 5, width: 40, height: 35 },
  { x: 2070, y: groundY + 5, width: 40, height: 35 },
  { x: 2310, y: groundY + 5, width: 40, height: 35 },
  { x: 2550, y: groundY + 5, width: 40, height: 35 },
  { x: 2790, y: groundY + 5, width: 40, height: 35 },
  { x: 3060, y: groundY + 5, width: 40, height: 35 },
  { x: 3300, y: groundY + 5, width: 40, height: 35 },
  { x: 3540, y: groundY + 5, width: 40, height: 35 },
  { x: 3780, y: groundY + 5, width: 40, height: 35 },
  { x: 4020, y: groundY + 5, width: 40, height: 35 },
  { x: 4260, y: groundY + 5, width: 40, height: 35 },
  { x: 4500, y: groundY + 5, width: 40, height: 35 },
  { x: 4740, y: groundY + 5, width: 40, height: 35 },
  { x: 4980, y: groundY + 5, width: 40, height: 35 },
  { x: 5220, y: groundY + 5, width: 40, height: 35 },
  { x: 5460, y: groundY + 5, width: 40, height: 35 },
  { x: 5730, y: groundY + 5, width: 40, height: 35 },
  { x: 5970, y: groundY + 5, width: 40, height: 35 },
  { x: 6210, y: groundY + 5, width: 40, height: 35 },
  { x: 6450, y: groundY + 5, width: 40, height: 35 },
  { x: 6690, y: groundY + 5, width: 40, height: 35 },
  { x: 6930, y: groundY + 5, width: 40, height: 35 },
  { x: 7170, y: groundY + 5, width: 40, height: 35 },
  { x: 7410, y: groundY + 5, width: 40, height: 35 },
  { x: 7890, y: groundY + 5, width: 40, height: 35 },
];

/**
 * Creates all platforms for the level (World 2)
 */
export const createPlatformsWorld2 = (groundY: number): Platform[] => [
  { x: 0, y: groundY + 40, width: 8200, height: 20 },
];

/**
 * Creates all platforms for World 3
 */
export const createPlatformsWorld3 = (groundY: number): Platform[] => [
  { x: 0, y: groundY, width: 400, height: 20 },
  { x: 480, y: groundY, width: 100, height: 20 },
  { x: 650, y: groundY, width: 100, height: 20 },
  { x: 820, y: groundY, width: 100, height: 20 },
  { x: 990, y: groundY, width: 120, height: 20 },
  { x: 1180, y: groundY, width: 150, height: 20 },
  { x: 1400, y: groundY, width: 120, height: 20 },
  { x: 1590, y: groundY, width: 100, height: 20 },
  { x: 1760, y: groundY, width: 100, height: 20 },
  { x: 1930, y: groundY, width: 150, height: 20 },
  { x: 2150, y: groundY, width: 200, height: 20 },
  { x: 2420, y: groundY, width: 150, height: 20 },
  { x: 2640, y: groundY, width: 100, height: 20 },
  { x: 2810, y: groundY, width: 100, height: 20 },
  { x: 2980, y: groundY, width: 150, height: 20 },
  { x: 3200, y: groundY, width: 80, height: 20 },
  { x: 3350, y: groundY, width: 80, height: 20 },
  { x: 3500, y: groundY, width: 80, height: 20 },
  { x: 3650, y: groundY, width: 80, height: 20 },
  { x: 3800, y: groundY, width: 80, height: 60 },
  { x: 3950, y: groundY, width: 150, height: 60 },
  { x: 4170, y: groundY, width: 250, height: 60 },
  { x: 4250, y: groundY, width: 150, height: 60 },
  { x: 4720, y: groundY, width: 100, height: 60 },
  { x: 4890, y: groundY, width: 100, height: 60 },
  { x: 5060, y: groundY, width: 100, height: 60 },
  { x: 5230, y: groundY, width: 150, height: 60 },
  { x: 5450, y: groundY, width: 80, height: 60 },
  { x: 5600, y: groundY, width: 80, height: 60 },
  { x: 5750, y: groundY, width: 80, height: 60 },
  { x: 5900, y: groundY, width: 80, height: 60 },
  { x: 6050, y: groundY, width: 300, height: 60 },
];

/**
 * Creates all danger buttons for World 3
 */
export const createDangerButtonsWorld3 = (groundY: number): DangerButton[] => [
  { x: 510, y: groundY - 35, width: 30, height: 30 },
  { x: 3220, y: groundY - 75, width: 30, height: 30 },
  { x: 3520, y: groundY - 75, width: 30, height: 30 },
  { x: 4250, y: groundY - 35, width: 30, height: 30 },
  { x: 5470, y: groundY - 65, width: 30, height: 30 },
  { x: 5770, y: groundY - 65, width: 30, height: 30 },
];

/**
 * Game object positions and sizes (relative to groundY)
 */
export const GAME_CONSTANTS = {
  KEY_POSITION: { x: 4800, y: -140 },
  DOOR_POSITION: { x: 5660, y: -35 },
  DOOR_SIZE: { width: 55, height: 75 },
  KEY_SIZE: { width: 30, height: 40 },
  GROUND_OFFSET: 30, // Height from bottom of canvas

  // World 3 specific constants
  KEY_POSITION_WORLD3: { x: 5540, y: -280 },
  DOOR_POSITION_WORLD3: { x: 7530, y: -35 },
};

export type { Platform, DangerButton };
