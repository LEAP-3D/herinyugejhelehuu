// camera.ts - Камерын удирдлага

import { Player, Camera, PLAYER_WIDTH } from "@/app/utils/gameDataWorld2";

// Re-export Camera type
export type { Camera } from "@/app/utils/gameDataWorld2";

export const updateCamera = (
  camera: Camera,
  players: Player[],
  canvasWidth: number,
): void => {
  // Бүх тоглогчдын дундаж байрлал
  const avgX = players.reduce((sum, p) => sum + p.x, 0) / players.length;

  // Камер дагаж явах зорилтот байрлал
  const targetCameraX = avgX - canvasWidth / 2 + PLAYER_WIDTH / 2;

  // Зөөлөн дагаж явах
  camera.x += (targetCameraX - camera.x) * 0.1;

  // Камер зүүн талаас давж гарахгүй байх
  if (camera.x < 0) camera.x = 0;
};

export const applyCameraTransform = (
  ctx: CanvasRenderingContext2D,
  camera: Camera,
): void => {
  ctx.translate(-camera.x, 0);
};

export const applyCameraTransformParallax = (
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  parallaxFactor: number = 0.3,
): void => {
  ctx.translate(-camera.x * parallaxFactor, 0);
};
