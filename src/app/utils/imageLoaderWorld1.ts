export interface GameImages {
  playerIdle: HTMLImageElement;
  playerRight: HTMLImageElement;
  playerLeft: HTMLImageElement;
  player2Idle: HTMLImageElement;
  player2Right: HTMLImageElement;
  player2Left: HTMLImageElement;
  player3Idle: HTMLImageElement;
  player3Right: HTMLImageElement;
  player3Left: HTMLImageElement;
  player4Idle: HTMLImageElement;
  player4Right: HTMLImageElement;
  player4Left: HTMLImageElement;
  key: HTMLImageElement;
  door: HTMLImageElement;
  death: HTMLImageElement;
}

export class ImageLoader {
  private images: Partial<GameImages> = {};
  private loadedCount = 0;
  private totalImages = 15;

  async loadImages(imagePaths: {
    playerIdle: string;
    playerWalk1: string;
    playerWalk2: string;
    player2Idle: string;
    player2Walk1: string;
    player2Walk2: string;
    player3Idle: string;
    player3Right: string;
    player3Left: string;
    player4Idle: string;
    player4Right: string;
    player4Left: string;
    key: string;
    door: string;
    death: string;
  }): Promise<GameImages> {
    return new Promise((resolve) => {
      const checkAllLoaded = () => {
        this.loadedCount++;
        if (this.loadedCount === this.totalImages) {
          resolve(this.images as GameImages);
        }
      };

      const loadImage = (src: string, key: keyof GameImages) => {
        const img = new Image();
        img.onload = checkAllLoaded;
        img.onerror = () => {
          console.error(`Failed to load image: ${key}`);
          checkAllLoaded();
        };
        img.src = src;
        this.images[key] = img;
      };

      loadImage(imagePaths.playerIdle, "playerIdle");
      loadImage(imagePaths.playerWalk1, "playerRight");
      loadImage(imagePaths.playerWalk2, "playerLeft");
      loadImage(imagePaths.player2Idle, "player2Idle");
      loadImage(imagePaths.player2Walk1, "player2Right");
      loadImage(imagePaths.player2Walk2, "player2Left");
      loadImage(imagePaths.player3Idle, "player3Idle");
      loadImage(imagePaths.player3Right, "player3Right");
      loadImage(imagePaths.player3Left, "player3Left");
      loadImage(imagePaths.player4Idle, "player4Idle");
      loadImage(imagePaths.player4Right, "player4Right");
      loadImage(imagePaths.player4Left, "player4Left");
      loadImage(imagePaths.key, "key");
      loadImage(imagePaths.door, "door");
      loadImage(imagePaths.death, "death");
    });
  }

  getImages(): GameImages | null {
    return this.loadedCount === this.totalImages ? (this.images as GameImages) : null;
  }
}