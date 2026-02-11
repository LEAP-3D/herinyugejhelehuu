// physics.ts - Физикийн тооцоолол, мөргөлдөөн шалгах

import {
  Player,
  Platform,
  DangerButton,
  Key,
  Door,
  GRAVITY,
  JUMP_FORCE,
  MOVE_SPEED,
} from "@/app/utils/gameDataWorld2";
import { InputHandler } from "@/app/utils/inputHandlerWorld2";

// Мөргөлдөөн шалгах
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

// Тоглогчид давхцаж байгаа эсэх
export const checkPlayerStacking = (
  player: Player,
  otherPlayer: Player,
): boolean => {
  if (player.dead || otherPlayer.dead) return false;

  const feetY = player.y + player.height;
  const headY = otherPlayer.y;

  const verticalCheck =
    feetY >= headY - 5 && feetY <= headY + 15 && player.vy >= 0;

  const horizontalOverlap =
    player.x + player.width > otherPlayer.x + 10 &&
    player.x < otherPlayer.x + otherPlayer.width - 10;

  return verticalCheck && horizontalOverlap;
};

// Тоглогчийн хөдөлгөөн шинэчлэх
export const updatePlayerMovement = (
  player: Player,
  input: InputHandler,
  animTimer: number,
): void => {
  if (player.dead) return;

  const playerInput = input.getPlayerInput(player.id);

  // Хөдөлгөөн
  if (playerInput.left) {
    player.vx = -MOVE_SPEED;
    player.facingRight = false;
  } else if (playerInput.right) {
    player.vx = MOVE_SPEED;
    player.facingRight = true;
  } else {
    player.vx = 0;
  }

  // Үсрэх
  if (playerInput.jump && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }

  // Таталцал
  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;

  // Анимаци
  if (player.vx !== 0) {
    if (animTimer % 8 === 0) {
      player.animFrame = player.animFrame === 1 ? 2 : 1;
    }
  } else {
    player.animFrame = 0;
  }

  player.onGround = false;
  player.standingOnPlayer = null;
};

// Тоглогчид хоорондын харилцан үйлчлэл
export const handlePlayerCollisions = (
  player: Player,
  players: Player[],
  playerIndex: number,
): void => {
  // Тоглогчид дээр зогсох
  players.forEach((otherPlayer, otherIndex) => {
    if (playerIndex === otherIndex || otherPlayer.dead) return;

    if (checkPlayerStacking(player, otherPlayer)) {
      player.y = otherPlayer.y - player.height;
      player.vy = 0;
      player.onGround = true;
      player.standingOnPlayer = otherPlayer.id;

      if (otherPlayer.vx !== 0 && player.vx === 0) {
        player.x += otherPlayer.vx * 0.8;
      }
    }
  });

  // Хажуугаас мөргөлдөх
  players.forEach((otherPlayer, otherIndex) => {
    if (playerIndex === otherIndex || otherPlayer.dead) return;
    if (
      player.standingOnPlayer === otherPlayer.id ||
      otherPlayer.standingOnPlayer === player.id
    )
      return;

    if (checkCollision(player, otherPlayer)) {
      const overlapLeft = player.x + player.width - otherPlayer.x;
      const overlapRight = otherPlayer.x + otherPlayer.width - player.x;
      const overlapTop = player.y + player.height - otherPlayer.y;
      const overlapBottom = otherPlayer.y + otherPlayer.height - player.y;

      const minOverlapX = Math.min(overlapLeft, overlapRight);
      const minOverlapY = Math.min(overlapTop, overlapBottom);

      if (minOverlapX < minOverlapY) {
        const pushForce = 0.2;

        if (overlapLeft < overlapRight) {
          const separation = minOverlapX / 2 + 0.5;
          player.x -= separation;
          otherPlayer.x += separation;

          if (player.vx > 0) {
            otherPlayer.vx = Math.min(otherPlayer.vx + pushForce, MOVE_SPEED);
          }
        } else {
          const separation = minOverlapX / 2 + 0.5;
          player.x += separation;
          otherPlayer.x -= separation;

          if (player.vx < 0) {
            otherPlayer.vx = Math.max(otherPlayer.vx - pushForce, -MOVE_SPEED);
          }
        }
      }
    }
  });
};

// Platform мөргөлдөөн
export const handlePlatformCollisions = (
  player: Player,
  platforms: Platform[],
): void => {
  platforms.forEach((platform) => {
    if (checkCollision(player, platform)) {
      const overlapLeft = player.x + player.width - platform.x;
      const overlapRight = platform.x + platform.width - player.x;
      const overlapTop = player.y + player.height - platform.y;
      const overlapBottom = platform.y + platform.height - player.y;

      const minOverlapX = Math.min(overlapLeft, overlapRight);
      const minOverlapY = Math.min(overlapTop, overlapBottom);

      if (minOverlapY < minOverlapX) {
        if (overlapTop < overlapBottom && player.vy > 0) {
          player.y = platform.y - player.height;
          player.vy = 0;
          player.onGround = true;
        } else if (overlapBottom < overlapTop && player.vy < 0) {
          player.y = platform.y + platform.height;
          player.vy = 0;
        }
      } else {
        if (overlapLeft < overlapRight) {
          player.x = platform.x - player.width;
        } else {
          player.x = platform.x + platform.width;
        }
        player.vx = 0;
      }
    }
  });
};

// Аюултай товч мөргөлдөөн шалгах
export const checkDangerButtonCollision = (
  player: Player,
  dangerButtons: DangerButton[],
): boolean => {
  return dangerButtons.some((button) => checkCollision(player, button));
};

// Түлхүүр авах
export const checkKeyCollection = (player: Player, key: Key): boolean => {
  if (!key.collected && checkCollision(player, key)) {
    key.collected = true;
    return true;
  }
  return false;
};

// Хаалганд хүрсэн эсэх
export const checkDoorReached = (
  player: Player,
  door: Door,
  hasKey: boolean,
): boolean => {
  return hasKey && checkCollision(player, door);
};

// Унасан эсэх шалгах
export const checkFallOffScreen = (
  player: Player,
  screenHeight: number,
): boolean => {
  return player.y > screenHeight + 50;
};

// Хязгаарлалт (газрын зүүн тал)
export const applyBoundaries = (player: Player): void => {
  if (player.x < 0) {
    player.x = 0;
  }
};
