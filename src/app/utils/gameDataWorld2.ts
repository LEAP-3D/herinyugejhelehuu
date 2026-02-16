// gameData.ts - Тоглоомын бүх өгөгдөл, тогтмолууд

export interface Player {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  animFrame: number;
  facingRight: boolean;
  color: string;
  dead: boolean;
  standingOnPlayer: number | null;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Key {
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
}

export interface Door {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DangerButton {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Cloud {
  x: number;
  y: number;
  width: number;
  speed: number;
}

export interface Camera {
  x: number;
  y: number;
}

// Тоглоомын тогтмолууд
export const GRAVITY = 0.6;
export const JUMP_FORCE = -14;
export const MOVE_SPEED = 5;
export const PLAYER_WIDTH = 35;
export const PLAYER_HEIGHT = 45;
export const DEATH_FREEZE_TIME = 1500;

// Анхны тоглогчдын өгөгдөл
export const createInitialPlayers = (groundY: number): Player[] => [
  {
    id: 1,
    x: 50,
    y: groundY - 500,
    vx: 0,
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    onGround: false,
    animFrame: 0,
    facingRight: true,
    color: "#4A90D9",
    dead: false,
    standingOnPlayer: null,
  },
  {
    id: 2,
    x: 100,
    y: groundY - 500,
    vx: 0,
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    onGround: false,
    animFrame: 0,
    facingRight: true,
    color: "#D94A4A",
    dead: false,
    standingOnPlayer: null,
  },
  {
    id: 3,
    x: 150,
    y: groundY - 500,
    vx: 0,
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    onGround: false,
    animFrame: 0,
    facingRight: true,
    color: "#4ADB4A",
    dead: false,
    standingOnPlayer: null,
  },
  {
    id: 4,
    x: 200,
    y: groundY - 500,
    vx: 0,
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    onGround: false,
    animFrame: 0,
    facingRight: true,
    color: "#DBA44A",
    dead: false,
    standingOnPlayer: null,
  },
];

// Platforms
export const createPlatforms = (groundY: number): Platform[] => [
  { x: 0, y: groundY + 40, width: 8200, height: 20 },
];

// Аюултай товчнууд
export const createDangerButtons = (groundY: number): DangerButton[] => [
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

// Үүлнүүд
export const createClouds = (): Cloud[] => [
  { x: 100, y: 50, width: 120, speed: 0.3 },
  { x: 500, y: 80, width: 90, speed: 0.2 },
  { x: 900, y: 40, width: 150, speed: 0.4 },
  { x: 1300, y: 70, width: 100, speed: 0.25 },
  { x: 1700, y: 50, width: 130, speed: 0.35 },
  { x: 2100, y: 90, width: 110, speed: 0.2 },
  { x: 2500, y: 60, width: 140, speed: 0.3 },
  { x: 2900, y: 45, width: 100, speed: 0.25 },
  { x: 3300, y: 75, width: 120, speed: 0.35 },
  { x: 3700, y: 55, width: 110, speed: 0.28 },
  { x: 4100, y: 65, width: 130, speed: 0.32 },
  { x: 4500, y: 50, width: 100, speed: 0.22 },
];

// Түлхүүр
export const createKey = (groundY: number): Key => ({
  x: 3740,
  y: groundY - 280,
  width: 40,
  height: 40,
  collected: false,
});

// Хаалга
export const createDoor = (groundY: number): Door => ({
  x: 4520,
  y: groundY - 75,
  width: 55,
  height: 75,
});

// Одны байршил
export const starPositions = [
  { x: 100, y: 50, size: 2 },
  { x: 250, y: 100, size: 1.5 },
  { x: 400, y: 30, size: 2.5 },
  { x: 600, y: 80, size: 1 },
  { x: 800, y: 120, size: 2 },
  { x: 950, y: 40, size: 1.5 },
  { x: 1100, y: 90, size: 2 },
  { x: 200, y: 150, size: 1 },
];
