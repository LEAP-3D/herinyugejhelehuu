import { Player, Camera, PLAYER_WIDTH } from "@/app/utils/typesWorld1";

export class CameraController {
  private camera: Camera = { x: 0, y: 0 };

  getCamera(): Camera {
    return this.camera;
  }

  updateCamera(players: Player[], canvasWidth: number): void {
    const avgX = players.reduce((sum, p) => sum + p.x, 0) / players.length;
    const targetCameraX = avgX - canvasWidth / 2 + PLAYER_WIDTH / 2;
    this.camera.x += (targetCameraX - this.camera.x) * 0.1;
    if (this.camera.x < 0) this.camera.x = 0;
  }

  reset(): void {
    this.camera = { x: 0, y: 0 };
  }
}