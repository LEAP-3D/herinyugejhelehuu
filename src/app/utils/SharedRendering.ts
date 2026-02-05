interface Player {
  id: number;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  animFrame: number;
  facingRight: boolean;
  color: string;
  dead: boolean;
}
interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface DangerButton {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface KeyItem {
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
}
interface Door {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface PushBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
export const drawDoor = (
  ctx: CanvasRenderingContext2D,
  door: Door,
  doorImage: HTMLImageElement | null,
  keyCollected: boolean,
) => {
  if (doorImage?.complete) {
    ctx.drawImage(doorImage, door.x, door.y, door.width, door.height);
    if (!keyCollected) {
      ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
      ctx.fillRect(door.x, door.y, door.width, door.height);
    }
  }
};
//Draw the key with bobbing animation
export const drawKey = (
  ctx: CanvasRenderingContext2D,
  key: KeyItem,
  keyImage: HTMLImageElement | null,
  animTimer: number,
) => {
  if (!key.collected && keyImage?.complete) {
    const bobOffset = Math.sin(animTimer * 0.1) * 5;
    ctx.drawImage(keyImage, key.x, key.y + bobOffset, key.width, key.height);
    // Glow effect
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#F1C40F";
    ctx.beginPath();
    ctx.arc(
      key.x + key.width / 2,
      key.y + key.height / 2 + bobOffset,
      30,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }
};
//  * Draw a single player
export const drawPlayer = (
  ctx: CanvasRenderingContext2D,
  player: Player,
  playerImage: HTMLImageElement | null,
  isMyPlayer: boolean = false,
) => {
  if (player.dead) return;
  // Draw player sprite or fallback to colored rectangle
  if (playerImage && playerImage.complete) {
    ctx.save();
    // Highlight effect
    if (isMyPlayer) {
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 15;
    } else {
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 8;
    }
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    ctx.restore();
  } else {
    // Fallback if image not loaded
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }
  // Player name/label
  ctx.fillStyle = isMyPlayer ? "#FFD700" : "#fff";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  const label = player.name || `P${player.id}`;
  ctx.strokeText(label, player.x + player.width / 2, player.y - 10);
  ctx.fillText(label, player.x + player.width / 2, player.y - 10);
};
//  * Draw UI overlay (World 1 style)
export const drawUIWorld1 = (
  ctx: CanvasRenderingContext2D,
  hasKey: boolean,
  playersAtDoor: number,
  connectedPlayers: number,
) => {
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(15, 15, 250, 110);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Key: ${hasKey ? "✅" : ""}`, 25, 45);
  ctx.fillText(`Door: ${playersAtDoor}/${connectedPlayers}`, 25, 75);
  ctx.fillText(`Players: ${connectedPlayers}/4`, 25, 105);
};
//  * Draw UI overlay (World 2 style)
export const drawUIWorld2 = (
  ctx: CanvasRenderingContext2D,
  playerCount: number,
  keyCollected: boolean,
  isConnected: boolean,
  canvasHeight: number,
) => {
  // Info panel
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(15, 15, 250, 90);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "left";
  ctx.fillText("WORLD 2: MULTIPLAYER", 25, 38);
  ctx.font = "bold 18px Arial";
  ctx.fillText(`Players: ${playerCount}`, 25, 65);
  ctx.fillText(`Key: ${keyCollected ? "✅" : ""}`, 25, 88);

  // Connection status
  ctx.fillStyle = isConnected ? "#4CAF50" : "#F44336";
  ctx.beginPath();
  ctx.arc(235, 25, 8, 0, Math.PI * 2);
  ctx.fill();

  // Controls
  ctx.font = "14px Arial";
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(15, canvasHeight - 55, 300, 45);
  ctx.fillStyle = "#fff";
  ctx.fillText("Controls: WASD or Arrow Keys", 25, canvasHeight - 32);
};
//  * Draw waiting screen overlay
export const drawWaitingScreen = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  playerCount: number,
) => {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Waiting for players...", width / 2, height / 2);
  ctx.font = "20px Arial";
  ctx.fillText(
    `${playerCount} player(s) connected`,
    width / 2,
    height / 2 + 40,
  );
};
//  * Draw victory screen overlay
export const drawWinScreen = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) => {
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("🎉 Victory! 🎉", width / 2, height / 2);
  ctx.font = "24px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("All players reached the door!", width / 2, height / 2 + 50);
};
//  * Draw death screen overlay
export const drawDeathScreen = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  deathImage: HTMLImageElement | null,
) => {
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, width, height);
  if (deathImage && deathImage.complete) {
    const imgSize = 150;
    ctx.drawImage(
      deathImage,
      width / 2 - imgSize / 2,
      height / 2 - imgSize / 2 - 30,
      imgSize,
      imgSize,
    );
  }
  ctx.fillStyle = "#E74C3C";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER! MAYBE SKILL ISSUE? 💀", width / 2, height / 2 + 100);
  ctx.font = "24px Arial";
  ctx.fillStyle = "#ffffff";
};
export type { Player, Platform, DangerButton, KeyItem, Door, PushBox };
