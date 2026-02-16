export interface Player {
  id: number | string;
  hero?: string | null;
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

export interface MovingPlatform extends Platform {
  startX: number;
  endX: number;
  speed: number;
  direction: number;
}

export interface FallingPlatform extends Platform {
  falling: boolean;
  fallTimer: number;
  originalY: number;
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

// ================= MULTIPLAYER =================

export interface JoinDeniedPayload {
  message: string;
}

export interface JoinSuccessPayload {
  roomCode: string;
  playerId: string | number;
  playerIndex?: number;
  playerCount?: number;
}

export interface GameState {
  players: Record<string, Player>;
  keyCollected: boolean;
  playersAtDoor: number[];
  gameStatus: "waiting" | "playing" | "won" | "dead";
}

export interface PlayerKeys {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export interface PlayerInput {
  playerId: number; // ✅ number
  keys: PlayerKeys;
  timestamp: number;
}

// ================= CONSTANTS =================

export const GRAVITY = 0.6;
export const JUMP_FORCE = -14;
export const MOVE_SPEED = 5;
export const PLAYER_WIDTH = 25;
export const PLAYER_HEIGHT = 35;
export const DEATH_FREEZE_TIME = 1500;

export interface GameImages {
  playerIdle: HTMLImageElement;
  playerWalk: HTMLImageElement;
  playerWalk2: HTMLImageElement;
  playerRight: HTMLImageElement; // Renderer-т хэрэгтэй
  playerLeft: HTMLImageElement; // Renderer-т хэрэгтэй

  player2Idle: HTMLImageElement;
  player2Right: HTMLImageElement;
  player2Left: HTMLImageElement;

  player3Idle: HTMLImageElement;
  player3Right: HTMLImageElement;
  player3Left: HTMLImageElement;

  player4Idle: HTMLImageElement;
  player4Right: HTMLImageElement;
  player4Left: HTMLImageElement;

  key: HTMLImageElement;
  door: HTMLImageElement;
  death: HTMLImageElement;
}
