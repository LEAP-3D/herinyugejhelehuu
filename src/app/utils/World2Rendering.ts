interface DangerButton {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}
export const drawBackgroundWorld2 = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  animTimer: number,
) => {
  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#0a0e27");
  gradient.addColorStop(0.5, "#1a1d3a");
  gradient.addColorStop(1, "#0f1129");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Stars
  ctx.save();
  ctx.fillStyle = "#ffffff";
  const starPositions = [
    { x: 100, y: 50, size: 2 },
    { x: 250, y: 100, size: 1.5 },
    { x: 400, y: 30, size: 2.5 },
    { x: 600, y: 80, size: 1 },
    { x: 800, y: 120, size: 2 },
    { x: 950, y: 40, size: 1.5 },
    { x: 1100, y: 90, size: 2 },
    { x: 200, y: 150, size: 1 },
    { x: 500, y: 140, size: 2.5 },
    { x: 700, y: 60, size: 1.5 },
    { x: 900, y: 110, size: 2 },
    { x: 1050, y: 70, size: 1 },
  ];

  starPositions.forEach((star, index) => {
    const twinkle = Math.sin(animTimer * 0.05 + index) * 0.5 + 0.5;
    ctx.globalAlpha = twinkle * 0.8 + 0.2;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = twinkle * 0.3;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // Moon
  ctx.save();
  const moonX = width - 150;
  const moonY = 80;
  const moonRadius = 40;

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

  ctx.fillStyle = "#f4f1de";
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(220, 220, 200, 0.4)";
  ctx.beginPath();
  ctx.arc(moonX - 10, moonY - 8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(moonX + 12, moonY + 5, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

/**
 * Draw ground (World 2 - Dark ground)
 */
export const drawGroundWorld2 = (
  ctx: CanvasRenderingContext2D,
  height: number,
) => {
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(-100, height - 60, 5000, 100);
};

/**
 * Draw platforms (World 2 - Metallic style)
 */
export const drawPlatforms = (
  ctx: CanvasRenderingContext2D,
  platforms: Platform[],
) => {
  platforms.forEach((platform) => {
    ctx.fillStyle = "#5D6D7E";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

    ctx.fillStyle = "#85929E";
    ctx.fillRect(platform.x, platform.y, platform.width, 4);

    ctx.fillStyle = "#2C3E50";
    for (
      let i = platform.x + 10;
      i < platform.x + platform.width - 10;
      i += 20
    ) {
      ctx.beginPath();
      ctx.arc(i, platform.y + 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
};

/**
 * Draw danger buttons with pulsing effect (World 2)
 */
export const drawDangerButtons = (
  ctx: CanvasRenderingContext2D,
  buttons: DangerButton[],
  animTimer: number,
  dangerButtonImage: HTMLImageElement | null,
) => {
  buttons.forEach((button) => {
    if (dangerButtonImage && dangerButtonImage.complete) {
      ctx.drawImage(
        dangerButtonImage,
        button.x,
        button.y,
        button.width,
        button.height,
      );
    } else {
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

    const pulse = Math.sin(animTimer * 0.1) * 0.3 + 0.7;
    ctx.save();
    ctx.globalAlpha = pulse * 0.3;
    ctx.fillStyle = "#E74C3C";
    ctx.beginPath();
    ctx.arc(
      button.x + button.width / 2,
      button.y + button.height / 2,
      button.width / 2 + 10,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  });
};
