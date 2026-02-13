import { Player, Camera, PLAYER_WIDTH } from "@/app/utils/typesWorld1";

export class CameraController {
  private camera: Camera = { x: 0, y: 0 };
  private readonly worldWidth = 6000;
  private readonly deadZoneRatio = 0.18;

  getCamera(): Camera {
    return this.camera;
  }

  updateCamera(players: Player[], canvasWidth: number): void {
    if (players.length === 0) return;

    const clampedMaxCameraX = Math.max(0, this.worldWidth - canvasWidth);
    const deadZone = canvasWidth * this.deadZoneRatio;

    const minX = Math.min(...players.map((p) => p.x));
    const maxX = Math.max(...players.map((p) => p.x));
    const centerX = (minX + maxX) / 2 + PLAYER_WIDTH / 2;

    let targetCameraX = this.camera.x;

    if (players.length === 1) {
      const p = players[0];
      const playerCenterX = p.x + PLAYER_WIDTH / 2;
      const leftBound = this.camera.x + deadZone;
      const rightBound = this.camera.x + canvasWidth - deadZone;

      if (playerCenterX < leftBound) {
        targetCameraX = playerCenterX - deadZone;
      } else if (playerCenterX > rightBound) {
        targetCameraX = playerCenterX - (canvasWidth - deadZone);
      }
    } else {
      // Multiplayer tether camera: keep the whole team centered in view.
      targetCameraX = centerX - canvasWidth / 2;
    }

    targetCameraX = Math.max(0, Math.min(targetCameraX, clampedMaxCameraX));
    this.camera.x += (targetCameraX - this.camera.x) * 0.12;
    this.camera.x = Math.max(0, Math.min(this.camera.x, clampedMaxCameraX));
  }

  reset(): void {
    this.camera = { x: 0, y: 0 };
  }
}
