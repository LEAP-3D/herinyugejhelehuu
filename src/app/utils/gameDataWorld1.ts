import {
  Platform,
  MovingPlatform,
  FallingPlatform,
  Cloud,
  Key,
  Door,
} from "@/app/utils/typesWorld1";

export class GameData {
  private groundY: number;

  constructor(_canvasHeight: number) {
    // Keep world coordinates fixed to backend physics world.
    // Backend uses baseY=620 and floor platforms at y=660 (= groundY + 40 here).
    void _canvasHeight;
    this.groundY = 620;
  }

  getPlatforms(): Platform[] {
    return [
      { x: 0, y: this.groundY + 40, width: 250, height: 20 },
      { x: 320, y: this.groundY + 40, width: 60, height: 20 },
      { x: 450, y: this.groundY + 40, width: 60, height: 20 },
      { x: 580, y: this.groundY + 40, width: 60, height: 20 },
      { x: 710, y: this.groundY + 40, width: 60, height: 20 },
      { x: 840, y: this.groundY + 40, width: 80, height: 20 },
      { x: 1100, y: this.groundY - 20, width: 100, height: 20 },
      { x: 1280, y: this.groundY - 50, width: 80, height: 20 },
      { x: 1440, y: this.groundY - 70, width: 80, height: 20 },
      { x: 1600, y: this.groundY - 50, width: 80, height: 20 },
      { x: 1760, y: this.groundY - 20, width: 100, height: 20 },
      { x: 2000, y: this.groundY + 20, width: 50, height: 20 },
      { x: 2120, y: this.groundY + 40, width: 50, height: 20 },
      { x: 2240, y: this.groundY + 20, width: 50, height: 20 },
      { x: 2360, y: this.groundY + 40, width: 50, height: 20 },
      { x: 2480, y: this.groundY + 20, width: 50, height: 20 },
      { x: 2600, y: this.groundY + 40, width: 50, height: 20 },
      { x: 2720, y: this.groundY + 40, width: 120, height: 20 },
      { x: 3020, y: this.groundY - 90, width: 100, height: 20 },
      { x: 3200, y: this.groundY - 90, width: 100, height: 20 },
      { x: 3380, y: this.groundY - 60, width: 80, height: 20 },
      { x: 3540, y: this.groundY - 30, width: 80, height: 20 },
      { x: 3700, y: this.groundY + 40, width: 60, height: 20 },
      { x: 3850, y: this.groundY + 15, width: 60, height: 20 },
      { x: 3990, y: this.groundY + 40, width: 60, height: 20 },
      { x: 4130, y: this.groundY + 15, width: 60, height: 20 },
      { x: 4270, y: this.groundY + 40, width: 60, height: 20 },
      { x: 4410, y: this.groundY + 40, width: 150, height: 20 },
      { x: 4760, y: this.groundY - 100, width: 120, height: 20 },
      { x: 4960, y: this.groundY - 80, width: 80, height: 20 },
      { x: 5120, y: this.groundY - 50, width: 80, height: 20 },
      { x: 5280, y: this.groundY - 20, width: 80, height: 20 },
      { x: 5440, y: this.groundY + 20, width: 100, height: 20 },
      { x: 5620, y: this.groundY + 40, width: 200, height: 20 },
    ];
  }

  getMovingPlatforms(): MovingPlatform[] {
    return [
      {
        x: 650,
        y: this.groundY - 250,
        width: 70,
        height: 20,
        startX: 605,
        endX: 720,
        speed: 2,
        direction: 1,
      },
      {
        x: 1120,
        y: this.groundY - 60,
        width: 60,
        height: 20,
        startX: 1045,
        endX: 1150,
        speed: 1.8,
        direction: 1,
      },
      {
        x: 1730,
        y: this.groundY - 240,
        width: 60,
        height: 20,
        startX: 1685,
        endX: 1790,
        speed: 2.5,
        direction: 1,
      },
      {
        x: 2410,
        y: this.groundY - 90,
        width: 60,
        height: 20,
        startX: 2355,
        endX: 2460,
        speed: 2,
        direction: 1,
      },
      {
        x: 2815,
        y: this.groundY - 275,
        width: 60,
        height: 20,
        startX: 2765,
        endX: 2865,
        speed: 1.8,
        direction: 1,
      },
    ];
  }

  getFallingPlatforms(): FallingPlatform[] {
    return [
      {
        x: 275,
        y: this.groundY - 50,
        width: 55,
        height: 20,
        falling: false,
        fallTimer: 0,
        originalY: this.groundY - 50,
      },
      {
        x: 1225,
        y: this.groundY - 15,
        width: 55,
        height: 20,
        falling: false,
        fallTimer: 0,
        originalY: this.groundY - 15,
      },
      {
        x: 2220,
        y: this.groundY - 205,
        width: 55,
        height: 20,
        falling: false,
        fallTimer: 0,
        originalY: this.groundY - 205,
      },
    ];
  }

  getClouds(): Cloud[] {
    return [
      { x: 100, y: 50, width: 120, speed: 0.3 },
      { x: 400, y: 80, width: 90, speed: 0.2 },
      { x: 700, y: 40, width: 150, speed: 0.4 },
      { x: 1000, y: 70, width: 100, speed: 0.25 },
      { x: 1400, y: 50, width: 130, speed: 0.35 },
      { x: 1800, y: 90, width: 110, speed: 0.2 },
      { x: 2200, y: 60, width: 140, speed: 0.3 },
      { x: 2600, y: 45, width: 100, speed: 0.25 },
      { x: 3000, y: 75, width: 120, speed: 0.35 },
    ];
  }

  getKey(): Key {
    return {
      x: 1950,
      y: this.groundY - 370,
      width: 40,
      height: 40,
      collected: false,
    };
  }

  getDoor(): Door {
    return {
      x: 3030,
      // Place door on the nearby high platform so it is reachable in multiplayer.
      y: this.groundY - 165,
      width: 55,
      height: 75,
    };
  }

  getGroundY(): number {
    return this.groundY;
  }
}
