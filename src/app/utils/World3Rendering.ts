interface PushBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
// WORLD 3 RENDERING (Night Sky with Clouds)
//  Draw night sky background with stars, moon and clouds (World 3)

export const drawBackgroundWorld3 = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  animTimer: number,
  cameraX: number = 0,
) => {
  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#1a1a2e");
  gradient.addColorStop(0.3, "#16213e");
  gradient.addColorStop(0.6, "#1f4068");
  gradient.addColorStop(1, "#162447");
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
    { x: 1050, y: 110, size: 1.8 },
    { x: 350, y: 70, size: 2.2 },
  ];

  starPositions.forEach((star, index) => {
    const twinkle = Math.sin(animTimer * 0.05 + index) * 0.5 + 0.5;
    ctx.globalAlpha = twinkle * 0.8 + 0.2;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // Moon
  ctx.save();
  const moonX = width - 120;
  const moonY = 70;
  const moonRadius = 35;

  const moonGlow = ctx.createRadialGradient(
    moonX,
    moonY,
    moonRadius * 0.5,
    moonX,
    moonY,
    moonRadius * 2,
  );
  moonGlow.addColorStop(0, "rgba(255, 255, 220, 0.3)");
  moonGlow.addColorStop(1, "rgba(255, 255, 220, 0)");
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius * 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f5f5dc";
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Clouds
  const cloudCount = 13;
  ctx.save();
  ctx.translate(-cameraX * 0.3, 0);
  for (let i = 0; i < cloudCount; i++) {
    const cloudX = i * 500 + ((animTimer * 0.3 + i * 100) % 7000);
    const cloudY = 50 + (i % 3) * 30;
    const cloudWidth = 100 + (i % 4) * 30;

    ctx.fillStyle = "rgba(40, 50, 80, 0.4)";
    ctx.beginPath();
    ctx.arc(cloudX, cloudY, cloudWidth * 0.25, 0, Math.PI * 2);
    ctx.arc(
      cloudX + cloudWidth * 0.2,
      cloudY - 10,
      cloudWidth * 0.2,
      0,
      Math.PI * 2,
    );
    ctx.arc(
      cloudX + cloudWidth * 0.4,
      cloudY,
      cloudWidth * 0.3,
      0,
      Math.PI * 2,
    );
    ctx.arc(
      cloudX + cloudWidth * 0.6,
      cloudY - 5,
      cloudWidth * 0.2,
      0,
      Math.PI * 2,
    );
    ctx.arc(
      cloudX + cloudWidth * 0.75,
      cloudY + 5,
      cloudWidth * 0.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
};

/**
 * Draw ground (World 3 - Dark ground)
 */
export const drawGroundWorld3 = (
  ctx: CanvasRenderingContext2D,
  height: number,
) => {
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(-100, height - 60, 7000, 100);
};

/**
 * Draw boxes (World 3)
 */
export const drawBoxes = (
  ctx: CanvasRenderingContext2D,
  boxes: PushBox[],
  boxImage: HTMLImageElement | null,
) => {
  boxes.forEach((box) => {
    if (boxImage && boxImage.complete) {
      ctx.drawImage(boxImage, box.x, box.y, box.width, box.height);
    } else {
      const boxGrad = ctx.createLinearGradient(
        box.x,
        box.y,
        box.x,
        box.y + box.height,
      );
      boxGrad.addColorStop(0, "#A0826D");
      boxGrad.addColorStop(1, "#7A5C45");
      ctx.fillStyle = boxGrad;
      ctx.fillRect(box.x, box.y, box.width, box.height);

      ctx.strokeStyle = "#5D4037";
      ctx.lineWidth = 2;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.strokeStyle = "#6D4C41";
      ctx.beginPath();
      ctx.moveTo(box.x, box.y);
      ctx.lineTo(box.x + box.width, box.y + box.height);
      ctx.moveTo(box.x + box.width, box.y);
      ctx.lineTo(box.x, box.y + box.height);
      ctx.stroke();
    }
  });
};

/**
 * Draw UI overlay (World 3 style)
 */
export const drawUIWorld3 = (
  ctx: CanvasRenderingContext2D,
  playerCount: number,
  keyCollected: boolean,
  isConnected: boolean,
  canvasHeight: number,
  playersAtDoor: number,
  boxCount: number,
) => {
  // UI Panel
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(12, 12, 300, 95);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.strokeRect(12, 12, 300, 95);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "left";
  ctx.fillText("WORLD 3: TEAMWORK", 22, 35);

  ctx.font = "16px Arial";
  ctx.fillText(`🔑 Key: ${keyCollected ? "✅" : "🔒"}`, 22, 58);
  ctx.fillText(`🚪 At Door: ${playersAtDoor}/${playerCount}`, 140, 58);
  ctx.fillText(`📦 Boxes: ${boxCount}`, 240, 58);

  ctx.fillStyle = "#FCD34D";
  ctx.font = "12px Arial";
  ctx.fillText("Push boxes & stack players to reach the key!", 22, 80);
  ctx.fillStyle = "#DC2626";
  ctx.fillText("⚠️ Avoid red buttons!", 22, 96);

  // Connection status
  ctx.fillStyle = isConnected ? "#4CAF50" : "#F44336";
  ctx.beginPath();
  ctx.arc(290, 22, 8, 0, Math.PI * 2);
  ctx.fill();

  // Controls panel
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(12, canvasHeight - 70, 520, 58);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.strokeRect(12, canvasHeight - 70, 520, 58);

  ctx.font = "bold 11px Arial";
  const controls = [
    { label: "P1", keys: "WASD", color: "#4A90D9" },
    { label: "P2", keys: "Arrows", color: "#D94A4A" },
    { label: "P3", keys: "I J K L", color: "#4AD94A" },
    { label: "P4", keys: "8 4 5 6", color: "#D9D94A" },
  ];

  controls.forEach((ctrl, i) => {
    const x = 22 + i * 125;
    ctx.fillStyle = ctrl.color;
    ctx.fillText(ctrl.label, x, canvasHeight - 50);
    ctx.fillStyle = "#fff";
    ctx.font = "10px Arial";
    ctx.fillText(ctrl.keys, x + 25, canvasHeight - 50);
    ctx.font = "bold 11px Arial";
  });

  ctx.fillStyle = "#9CA3AF";
  ctx.font = "10px Arial";
  ctx.fillText(
    "Tip: Push boxes to create stairs! Stand on boxes & teammates!",
    22,
    canvasHeight - 25,
  );
};

