// ============================================
// WORLD 1 RENDERING (Day Sky)
// ============================================
interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}
/**
 * Draw sky background with day gradient (World 1)
 */
export const drawBackgroundWorld1 = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#87CEEB");
  gradient.addColorStop(0.5, "#B0E2FF");
  gradient.addColorStop(1, "#E0F4FF");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

/**
 * Draw ground (World 1 - Green grass)
 */
export const drawGroundWorld1 = (
  ctx: CanvasRenderingContext2D,
  groundY: number,
) => {
  ctx.fillStyle = "#90EE90";
  ctx.fillRect(-100, groundY, 5000, 100);
};
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
