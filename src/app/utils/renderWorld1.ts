import {
  Player,
  Platform,
  MovingPlatform,
  FallingPlatform,
  Cloud,
  Key,
  Door,
  Camera,
} from "@/app/utils/typesWorld1";
import { GameImages } from "@/app/utils/imageLoaderWorld1";

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvasWidth: number;
  private canvasHeight: number;
  private groundY: number;

  constructor(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    groundY: number,
  ) {
    this.ctx = ctx;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.groundY = groundY;
  }

  updateCanvasSize(width: number, height: number, groundY: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.groundY = groundY;
  }

  renderBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(0.5, "#B0E2FF");
    gradient.addColorStop(1, "#E0F4FF");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  renderSun(): void {
    this.ctx.save();
    this.ctx.fillStyle = "#FFD700";
    this.ctx.shadowColor = "#FFA500";
    this.ctx.shadowBlur = 50;
    this.ctx.beginPath();
    this.ctx.arc(this.canvasWidth - 100, 100, 60, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    this.ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
    this.ctx.lineWidth = 4;
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 * Math.PI) / 180;
      this.ctx.beginPath();
      this.ctx.moveTo(
        this.canvasWidth - 100 + Math.cos(angle) * 70,
        100 + Math.sin(angle) * 70,
      );
      this.ctx.lineTo(
        this.canvasWidth - 100 + Math.cos(angle) * 110,
        100 + Math.sin(angle) * 110,
      );
      this.ctx.stroke();
    }
  }

  renderClouds(clouds: Cloud[], camera: Camera): void {
    this.ctx.save();
    this.ctx.translate(-camera.x * 0.3, 0);
    clouds.forEach((cloud) => {
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      this.ctx.beginPath();
      this.ctx.arc(cloud.x, cloud.y, cloud.width * 0.25, 0, Math.PI * 2);
      this.ctx.arc(
        cloud.x + cloud.width * 0.2,
        cloud.y - 10,
        cloud.width * 0.2,
        0,
        Math.PI * 2,
      );
      this.ctx.arc(
        cloud.x + cloud.width * 0.4,
        cloud.y,
        cloud.width * 0.3,
        0,
        Math.PI * 2,
      );
      this.ctx.arc(
        cloud.x + cloud.width * 0.6,
        cloud.y - 5,
        cloud.width * 0.2,
        0,
        Math.PI * 2,
      );
      this.ctx.arc(
        cloud.x + cloud.width * 0.75,
        cloud.y + 5,
        cloud.width * 0.2,
        0,
        Math.PI * 2,
      );
      this.ctx.fill();
    });
    this.ctx.restore();
  }

  renderGround(camera: Camera): void {
    this.ctx.save();
    this.ctx.translate(-camera.x, 0);
    this.ctx.fillStyle = "#90EE90";
    const groundTop = this.groundY + 40;
    const groundHeight = Math.max(100, this.canvasHeight - groundTop + 100);
    this.ctx.fillRect(-100, groundTop, 6000, groundHeight);
    this.ctx.restore();
  }

  renderPlatforms(platforms: Platform[], camera: Camera): void {
    this.ctx.save();
    this.ctx.translate(-camera.x, 0);
    platforms.forEach((platform) => {
      this.ctx.fillStyle = "#228B22";
      this.ctx.fillRect(platform.x, platform.y, platform.width, 8);
      this.ctx.fillStyle = "#8B4513";
      this.ctx.fillRect(
        platform.x,
        platform.y + 8,
        platform.width,
        platform.height - 8,
      );
    });
    this.ctx.restore();
  }

  renderMovingPlatforms(
    movingPlatforms: MovingPlatform[],
    camera: Camera,
  ): void {
    this.ctx.save();
    this.ctx.translate(-camera.x, 0);
    movingPlatforms.forEach((platform) => {
      this.ctx.fillStyle = "#DAA520";
      this.ctx.fillRect(
        platform.x,
        platform.y,
        platform.width,
        platform.height,
      );
      this.ctx.fillStyle = "#FFD700";
      this.ctx.fillRect(platform.x, platform.y, platform.width, 5);
    });
    this.ctx.restore();
  }

  renderFallingPlatforms(
    fallingPlatforms: FallingPlatform[],
    camera: Camera,
  ): void {
    this.ctx.save();
    this.ctx.translate(-camera.x, 0);
    fallingPlatforms.forEach((platform) => {
      if (platform.y < this.canvasHeight) {
        this.ctx.fillStyle = platform.falling ? "#A0522D" : "#CD853F";
        this.ctx.fillRect(
          platform.x,
          platform.y,
          platform.width,
          platform.height,
        );
        this.ctx.strokeStyle = "#654321";
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(platform.x + 10, platform.y);
        this.ctx.lineTo(platform.x + 15, platform.y + platform.height);
        this.ctx.moveTo(platform.x + 30, platform.y);
        this.ctx.lineTo(platform.x + 25, platform.y + platform.height);
        this.ctx.stroke();
      }
    });
    this.ctx.restore();
  }

  renderDoor(
    door: Door,
    keyCollected: boolean,
    images: GameImages,
    camera: Camera,
  ): void {
    this.ctx.save();
    this.ctx.translate(-camera.x, 0);
    if (images.door && images.door.complete) {
      this.ctx.drawImage(images.door, door.x, door.y, door.width, door.height);
      if (!keyCollected) {
        this.ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
        this.ctx.fillRect(door.x, door.y, door.width, door.height);
      }
    }
    this.ctx.restore();
  }

  renderKey(
    key: Key,
    animTimer: number,
    images: GameImages,
    camera: Camera,
  ): void {
    if (!key.collected && images.key && images.key.complete) {
      this.ctx.save();
      this.ctx.translate(-camera.x, 0);
      const bobOffset = Math.sin(animTimer * 0.1) * 5;
      this.ctx.drawImage(
        images.key,
        key.x,
        key.y + bobOffset,
        key.width,
        key.height,
      );
      this.ctx.restore();
    }
  }

  renderPlayers(players: Player[], images: GameImages, camera: Camera): void {
    this.ctx.save();
    this.ctx.translate(-camera.x, 0);

    players.forEach((player) => {
      if (player.dead) return;

      let playerImage: HTMLImageElement | null = null;
      const playerId = Number(player.id);
      const hero = typeof player.hero === "string" ? player.hero : "";

      if (hero === "finn") {
        playerImage =
          player.animFrame === 0
            ? images.player1Idle
            : player.facingRight
              ? images.player1Right
              : images.player1Left;
      } else if (hero === "ice") {
        playerImage =
          player.animFrame === 0
            ? images.player2Idle
            : player.facingRight
              ? images.player2Right
              : images.player2Left;
      } else if (hero === "jake") {
        playerImage =
          player.animFrame === 0
            ? images.player3Idle
            : player.facingRight
              ? images.player3Right
              : images.player3Left;
      } else if (hero === "bmo") {
        playerImage =
          player.animFrame === 0
            ? images.player4Idle
            : player.facingRight
              ? images.player4Right
              : images.player4Left;
      } else if (playerId === 1) {
        if (player.animFrame === 0) {
          playerImage = images.player1Idle;
        } else {
          playerImage = player.facingRight
            ? images.player1Right
            : images.player1Left;
        }
      } else if (playerId === 2) {
        if (player.animFrame === 0) {
          playerImage = images.player2Idle;
        } else {
          playerImage = player.facingRight
            ? images.player2Right
            : images.player2Left;
        }
      } else if (playerId === 3) {
        if (player.animFrame === 0) {
          playerImage = images.player3Idle;
        } else {
          playerImage = player.facingRight
            ? images.player3Right
            : images.player3Left;
        }
      } else if (playerId === 4) {
        if (player.animFrame === 0) {
          playerImage = images.player4Idle;
        } else {
          playerImage = player.facingRight
            ? images.player4Right
            : images.player4Left;
        }
      }

      if (playerImage && playerImage.complete) {
        this.ctx.save();
        this.ctx.shadowColor = player.color;
        this.ctx.shadowBlur = 8;
        this.ctx.drawImage(
          playerImage,
          player.x,
          player.y,
          player.width,
          player.height,
        );
        this.ctx.restore();

        this.ctx.fillStyle = player.color;
        this.ctx.font = "bold 14px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText(
          `P${playerId || "?"}`,
          player.x + player.width / 2,
          player.y - 10,
        );
      } else {
        // Fallback draw so players remain visible even if id typing/image lookup fails.
        this.ctx.fillStyle = player.color || "#ff4d4f";
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "bold 14px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText(
          `P${playerId || "?"}`,
          player.x + player.width / 2,
          player.y - 10,
        );
      }
    });

    this.ctx.restore();
  }

  renderTethers(players: Player[], camera: Camera, maxDistance = 320): void {
    // Keep tether mechanics in physics/game state, but make visuals fully invisible.
    void players;
    void camera;
    void maxDistance;
    return;
  }

  renderHUD(hasKey: boolean, playersAtDoorCount: number): void {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    this.ctx.fillRect(15, 15, 180, 50);
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "bold 20px Arial";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`Key: ${hasKey ? "✅" : ""}`, 25, 45);
    this.ctx.fillText(`Door: ${playersAtDoorCount}/4`, 100, 45);
  }

  renderControls(): void {
    this.ctx.font = "12px Arial";
    this.ctx.fillStyle = "rgba(0,0,0,0.6)";
    this.ctx.fillRect(15, this.canvasHeight - 70, 550, 60);
    this.ctx.fillStyle = "#4A90D9";
    this.ctx.fillText("P1: WASD", 25, this.canvasHeight - 47);
    this.ctx.fillStyle = "#D94A4A";
    this.ctx.fillText("P2: Arrows", 25, this.canvasHeight - 27);
    this.ctx.fillStyle = "#F1C40F";
    this.ctx.fillText("P3: TFGH", 130, this.canvasHeight - 47);
    this.ctx.fillStyle = "#2ECC71";
    this.ctx.fillText("P4: IJKL", 130, this.canvasHeight - 27);
    this.ctx.fillStyle = "#fff";
    this.ctx.fillText(
      "| Stack on each other like Pico Park!",
      230,
      this.canvasHeight - 37,
    );
  }

  renderDeathScreen(images: GameImages): void {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    if (images.death && images.death.complete) {
      const imgSize = 150;
      this.ctx.drawImage(
        images.death,
        this.canvasWidth / 2 - imgSize / 2,
        this.canvasHeight / 2 - imgSize / 2 - 30,
        imgSize,
        imgSize,
      );
    }

    this.ctx.fillStyle = "#ff4444";
    this.ctx.font = "bold 48px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "YOU DIED! Maybe skill issue?",
      this.canvasWidth / 2,
      this.canvasHeight / 2 + 100,
    );
    this.ctx.font = "24px Arial";
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillText(
      "Respawning...",
      this.canvasWidth / 2,
      this.canvasHeight / 2 + 140,
    );
    this.ctx.textAlign = "left";
  }
}
