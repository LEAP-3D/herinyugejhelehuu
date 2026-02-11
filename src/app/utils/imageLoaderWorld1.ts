// app/utils/imageLoaderWorld1.ts

export interface GameImages {
  player1Idle: HTMLImageElement;
  player1Right: HTMLImageElement;
  player1Left: HTMLImageElement;
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
  private totalImages = 15; // 4 player * 3 images + key + door + death = 15

  async loadImages(imagePaths: Record<keyof GameImages, string>): Promise<GameImages> {
    return new Promise((resolve) => {
      this.loadedCount = 0; // Дахин дуудагдах үед тоолуурыг тэглэх
      
      const checkAllLoaded = () => {
        this.loadedCount++;
        if (this.loadedCount === this.totalImages) {
          resolve(this.images as GameImages);
        }
      };

      Object.entries(imagePaths).forEach(([key, src]) => {
        const img = new Image();
        img.onload = checkAllLoaded;
        img.onerror = () => {
          console.error(`Failed to load image: ${key} at ${src}`);
          checkAllLoaded(); // Нэг зураг алдаа гарсан ч тоглоом гацахгүй үргэлжилнэ
        };
        img.src = src;
        this.images[key as keyof GameImages] = img;
      });
    });
  }

  getImages(): GameImages | null {
    return this.loadedCount === this.totalImages ? (this.images as GameImages) : null;
  }
}

/**
 * Тоглогчийн мэдээлэл дээр үндэслэн зөв зургийг сонгох функц
 */
export const getPlayerImage = (
  images: GameImages,
  playerId: number,
  animFrame: number, // 0 бол Idle, бусад үед алхаж буй
  facingRight: boolean,
): HTMLImageElement | null => {
  const pKey = `player${playerId}`;
  
  if (animFrame === 0) {
    return images[`${pKey}Idle` as keyof GameImages] || null;
  }
  
  const direction = facingRight ? "Right" : "Left";
  const finalKey = `${pKey}${direction}` as keyof GameImages;
  
  return images[finalKey] || null;
};