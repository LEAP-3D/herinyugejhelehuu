// render.ts - Дэлгэцэнд зурах логик

import {
  Player,
  Platform,
  DangerButton,
  Cloud,
  Key,
  Door,
  starPositions,
} from "@/app/utils/gameDataWorld2";
import { GameImages, getPlayerImage } from "@/app/utils/imageLoaderWorld2";
import {
  Camera,
  applyCameraTransform,
  applyCameraTransformParallax,
} from "@/app/utils/cameraWorld2";

export const renderBackground = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
): void => {
  // Gradient арын дэвсгэр
  const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  gradient.addColorStop(0, "#0a0e27");
  gradient.addColorStop(0.5, "#1a1d3a");
  gradient.addColorStop(1, "#0f1129");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
};

export const renderStars = (
  ctx: CanvasRenderingContext2D,
  animTimer: number,
): void => {
  ctx.save();
  ctx.fillStyle = "#ffffff";

  starPositions.forEach((star, index) => {
    const twinkle = Math.sin(animTimer * 0.05 + index) * 0.5 + 0.5;
    ctx.globalAlpha = twinkle * 0.8 + 0.2;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
};

export const renderMoon = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
): void => {
  ctx.save();
  const moonX = canvasWidth - 150;
  const moonY = 80;
  const moonRadius = 40;

  // Сарны гэрэл
  const moonGlow = ctx.createRadialGradient(
    moonX,
    moonY,
    moonRadius * 0.5,
    moonX,
    moonY,
    moonRadius * 2,
  );
  moonGlow.addColorStop(0, "rgba(255, 255, 200, 0.3)");
  moonGlow.addColorStop(1, "rgba(255, 255, 200, 0)");
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius * 2, 0, Math.PI * 2);
  ctx.fill();

  // Сар
  ctx.fillStyle = "#f4f1de";
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const renderClouds = (
  ctx: CanvasRenderingContext2D,
  clouds: Cloud[],
  camera: Camera,
): void => {
  ctx.save();
  applyCameraTransformParallax(ctx, camera, 0.3);

  clouds.forEach((cloud) => {
    ctx.fillStyle = "rgba(30, 30, 50, 0.3)";
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.width * 0.25, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
};

export const renderGround = (
  ctx: CanvasRenderingContext2D,
  canvasHeight: number,
  camera: Camera,
): void => {
  ctx.save();
  applyCameraTransform(ctx, camera);

  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(-100, canvasHeight - 60, 5000, 100);

  ctx.restore();
};

export const renderPlatforms = (
  ctx: CanvasRenderingContext2D,
  platforms: Platform[],
  camera: Camera,
): void => {
  ctx.save();
  applyCameraTransform(ctx, camera);

  platforms.forEach((platform) => {
    ctx.fillStyle = "#5D6D7E";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    ctx.fillStyle = "#85929E";
    ctx.fillRect(platform.x, platform.y, platform.width, 4);
  });

  ctx.restore();
};

export const renderDangerButtons = (
  ctx: CanvasRenderingContext2D,
  dangerButtons: DangerButton[],
  images: GameImages,
  camera: Camera,
): void => {
  ctx.save();
  applyCameraTransform(ctx, camera);

  dangerButtons.forEach((button) => {
    if (images.dangerButton && images.dangerButton.naturalWidth > 0) {
      ctx.drawImage(
        images.dangerButton,
        button.x,
        button.y,
        button.width,
        button.height,
      );
    } else {
      // Fallback
      ctx.fillStyle = "#E74C3C";
      ctx.beginPath();
      ctx.arc(
        button.x + button.width / 2,
        button.y + button.height / 2,
        button.width / 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  });

  ctx.restore();
};

export const renderDoor = (
  ctx: CanvasRenderingContext2D,
  door: Door,
  images: GameImages,
  camera: Camera,
): void => {
  ctx.save();
  applyCameraTransform(ctx, camera);

  if (images.door && images.door.naturalWidth > 0) {
    ctx.drawImage(images.door, door.x, door.y, door.width, door.height);
  }

  ctx.restore();
};

export const renderKey = (
  ctx: CanvasRenderingContext2D,
  key: Key,
  images: GameImages,
  animTimer: number,
  camera: Camera,
): void => {
  if (!key.collected && images.key && images.key.naturalWidth > 0) {
    ctx.save();
    applyCameraTransform(ctx, camera);

    const bobOffset = Math.sin(animTimer * 0.1) * 5;
    ctx.drawImage(images.key, key.x, key.y + bobOffset, key.width, key.height);

    ctx.restore();
  }
};

export const renderPlayers = (
  ctx: CanvasRenderingContext2D,
  players: Player[],
  images: GameImages,
  camera: Camera,
): void => {
  ctx.save();
  applyCameraTransform(ctx, camera);

  players.forEach((player) => {
    if (player.dead) return;

    const playerImage = getPlayerImage(
      images,
      player.id,
      player.animFrame,
      player.facingRight,
    );

    if (playerImage && playerImage.naturalWidth > 0) {
      ctx.drawImage(
        playerImage,
        player.x,
        player.y,
        player.width,
        player.height,
      );
    } else {
      // Fallback - өнгөт дөрвөлжин
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // Тоглогчийн дугаар
    ctx.fillStyle = player.color;
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`P${player.id}`, player.x + player.width / 2, player.y - 10);
  });

  ctx.restore();
};

export const renderHUD = (
  ctx: CanvasRenderingContext2D,
  hasKey: boolean,
  playersAtDoor: number,
): void => {
  // Мэдээлэл хайрцаг
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(15, 15, 200, 70);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "left";
  ctx.fillText("WORLD 2: BUTTON DEATH", 25, 38);
  ctx.font = "bold 20px Arial";
  ctx.fillText(`Key: ${hasKey ? "✅" : "🔒"}`, 25, 65);
  ctx.fillText(`Door: ${playersAtDoor}/4`, 110, 65);

  // Анхааруулга
  ctx.fillStyle = "#E74C3C";
  ctx.font = "bold 14px Arial";
  ctx.fillText("⚠️ DON'T TOUCH THE BUTTONS!", 25, 105);
};

export const renderControls = (
  ctx: CanvasRenderingContext2D,
  canvasHeight: number,
): void => {
  ctx.font = "12px Arial";
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(15, canvasHeight - 75, 450, 65);

  ctx.fillStyle = "#4A90D9";
  ctx.fillText("P1: WASD", 25, canvasHeight - 52);
  ctx.fillStyle = "#D94A4A";
  ctx.fillText("P2: Arrow Keys", 25, canvasHeight - 32);
  ctx.fillStyle = "#4ADB4A";
  ctx.fillText("P3: TFGH", 25, canvasHeight - 12);
  ctx.fillStyle = "#DBA44A";
  ctx.fillText("P4: IJKL", 150, canvasHeight - 52);
};

export const renderDeathScreen = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  images: GameImages,
): void => {
  // Бараан арын дэвсгэр
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Үхлийн зураг
  if (images.death && images.death.naturalWidth > 0) {
    const imgSize = 150;
    ctx.drawImage(
      images.death,
      canvasWidth / 2 - imgSize / 2,
      canvasHeight / 2 - imgSize / 2 - 30,
      imgSize,
      imgSize,
    );
  }

  // Текст
  ctx.fillStyle = "#E74C3C";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("BUTTON PRESSED! 💀", canvasWidth / 2, canvasHeight / 2 + 100);
};

export const updateClouds = (clouds: Cloud[]): void => {
  clouds.forEach((cloud) => {
    cloud.x += cloud.speed;
    if (cloud.x > 5000) {
      cloud.x = -cloud.width;
    }
  });
};
