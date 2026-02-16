import {
  Player,
  Platform,
  MovingPlatform,
  FallingPlatform,
  Cloud,
  GRAVITY,
  JUMP_FORCE,
  MOVE_SPEED,
} from "@/app/utils/typesWorld1";
import { InputHandler } from "@/app/utils/inputHandlerWorld1";

export class PhysicsEngine {
  private inputHandler: InputHandler;
  private animTimer = 0;

  constructor(inputHandler: InputHandler) {
    this.inputHandler = inputHandler;
  }

  checkCollision(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number },
  ): boolean {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  checkPlayerStacking(player: Player, otherPlayer: Player): boolean {
    if (player.dead || otherPlayer.dead) return false;

    const feetY = player.y + player.height;
    const headY = otherPlayer.y;

    const verticalCheck =
      feetY >= headY - 5 && feetY <= headY + 15 && player.vy >= 0;

    const horizontalOverlap =
      player.x + player.width > otherPlayer.x + 10 &&
      player.x < otherPlayer.x + otherPlayer.width - 10;

    return verticalCheck && horizontalOverlap;
  }

  updateClouds(clouds: Cloud[]): void {
    clouds.forEach((cloud) => {
      cloud.x += cloud.speed;
      if (cloud.x > 3500) {
        cloud.x = -cloud.width;
      }
    });
  }

  updateMovingPlatforms(movingPlatforms: MovingPlatform[]): void {
    movingPlatforms.forEach((mp) => {
      mp.x += mp.speed * mp.direction;
      if (mp.x <= mp.startX || mp.x + mp.width >= mp.endX + mp.width) {
        mp.direction *= -1;
      }
    });
  }

  updateFallingPlatforms(fallingPlatforms: FallingPlatform[]): void {
    fallingPlatforms.forEach((fp) => {
      if (fp.falling) {
        fp.fallTimer++;
        if (fp.fallTimer > 30) {
          fp.y += 8;
        }
      }
    });
  }

  updatePlayer(
    player: Player,
    playerIndex: number,
    players: Player[],
    platforms: Platform[],
    movingPlatforms: MovingPlatform[],
    fallingPlatforms: FallingPlatform[],
    canvasHeight: number,
  ): void {
    if (player.dead) return;

    // Player controls
    this.handlePlayerInput(player);

    // Apply gravity and movement
    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    // Update animation
    if (player.vx !== 0) {
      if (this.animTimer % 8 === 0) {
        player.animFrame = player.animFrame === 1 ? 2 : 1;
      }
    } else {
      player.animFrame = 0;
    }

    player.onGround = false;
    player.standingOnPlayer = null;

    // Check player stacking
    players.forEach((otherPlayer, otherIndex) => {
      if (playerIndex === otherIndex || otherPlayer.dead) return;

      if (this.checkPlayerStacking(player, otherPlayer)) {
        player.y = otherPlayer.y - player.height;
        player.vy = 0;
        player.onGround = true;
        const stackedOnId = Number(otherPlayer.id);
        player.standingOnPlayer = Number.isFinite(stackedOnId)
          ? stackedOnId
          : null;

        if (otherPlayer.vx !== 0 && player.vx === 0) {
          player.x += otherPlayer.vx * 0.8;
        }
      }
    });

    // Handle player-to-player collisions
    this.handlePlayerCollisions(player, playerIndex, players);

    // Handle platform collisions
    this.handlePlatformCollisions(
      player,
      platforms,
      movingPlatforms,
      fallingPlatforms,
      canvasHeight,
    );

    // Prevent going off left edge
    if (player.x < 0) {
      player.x = 0;
    }
  }

  private handlePlayerInput(player: Player): void {
    // 1. Get the abstract movement states for THIS specific player
    const moveLeft = this.inputHandler.isKeyPressed("Left");
    const moveRight = this.inputHandler.isKeyPressed("Right");
    const jump = this.inputHandler.isKeyPressed("Jump");

    // 2. Handle Horizontal Movement
    if (moveLeft) {
      player.vx = -MOVE_SPEED;
      player.facingRight = false;
    } else if (moveRight) {
      player.vx = MOVE_SPEED;
      player.facingRight = true;
    } else {
      player.vx = 0;
    }

    // 3. Handle Jumping
    if (jump && player.onGround) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
    }
  }

  private handlePlayerCollisions(
    player: Player,
    playerIndex: number,
    players: Player[],
  ): void {
    players.forEach((otherPlayer, otherIndex) => {
      if (playerIndex === otherIndex || otherPlayer.dead) return;
      if (
        player.standingOnPlayer === otherPlayer.id ||
        otherPlayer.standingOnPlayer === player.id
      )
        return;

      if (this.checkCollision(player, otherPlayer)) {
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
              otherPlayer.vx = Math.max(
                otherPlayer.vx - pushForce,
                -MOVE_SPEED,
              );
            }
          }
        }
      }
    });
  }

  private handlePlatformCollisions(
    player: Player,
    platforms: Platform[],
    movingPlatforms: MovingPlatform[],
    fallingPlatforms: FallingPlatform[],
    canvasHeight: number,
  ): void {
    const allPlatforms: Platform[] = [
      ...platforms,
      ...movingPlatforms,
      ...fallingPlatforms.filter((fp) => fp.y < canvasHeight),
    ];

    allPlatforms.forEach((platform) => {
      if (this.checkCollision(player, platform)) {
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

            const fallingPlatform = fallingPlatforms.find(
              (fp) =>
                fp.x === platform.x &&
                fp.originalY === (platform as FallingPlatform).originalY,
            );
            if (fallingPlatform && !fallingPlatform.falling) {
              fallingPlatform.falling = true;
            }
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
  }

  incrementAnimTimer(): void {
    this.animTimer++;
  }

  getAnimTimer(): number {
    return this.animTimer;
  }
}
