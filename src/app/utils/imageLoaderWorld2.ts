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
  dangerButton: HTMLImageElement; // Энийг тооцохоо мартсан байсан
}

export class ImageLoader {
  private images: Partial<GameImages> = {};
  private loadedCount = 0;

  async loadImages(
    imagePaths: Record<keyof GameImages, string>,
  ): Promise<GameImages> {
    // Зургийн нийт тоог автоматаар тодорхойлох (алдаа гарах магадлалыг багасгана)
    const keys = Object.keys(imagePaths) as (keyof GameImages)[];
    const totalToLoad = keys.length;

    return new Promise((resolve) => {
      this.loadedCount = 0;
      this.images = {}; // Хуучин зургуудыг цэвэрлэх

      if (totalToLoad === 0) {
        resolve(this.images as GameImages);
        return;
      }

      keys.forEach((key) => {
        const img = new Image();

        img.onload = () => {
          this.images[key] = img;
          this.loadedCount++;
          if (this.loadedCount === totalToLoad) {
            resolve(this.images as GameImages);
          }
        };

        img.onerror = () => {
          console.error(`Failed to load image: ${key} at ${imagePaths[key]}`);
          // Алдаа гарсан ч тоолуурыг ахиулж, тоглоомыг гацаахгүй байх
          this.loadedCount++;
          if (this.loadedCount === totalToLoad) {
            resolve(this.images as GameImages);
          }
        };

        img.src = imagePaths[key];
      });
    });
  }

  getImages(): GameImages | null {
    // Partial-аас GameImages руу хөрвүүлэхдээ бүх зураг байгаа эсэхийг шалгах
    return Object.keys(this.images).length > 0
      ? (this.images as GameImages)
      : null;
  }
}

/**
 * Тоглогчийн мэдээлэл дээр үндэслэн зөв зургийг сонгох функц
 */
export const getPlayerImage = (
  images: GameImages,
  playerId: number,
  animFrame: number,
  facingRight: boolean,
): HTMLImageElement | null => {
  const pKey = `player${playerId}`;

  if (animFrame === 0) {
    const idleKey = `${pKey}Idle` as keyof GameImages;
    return images[idleKey] || null;
  }

  const direction = facingRight ? "Right" : "Left";
  const finalKey = `${pKey}${direction}` as keyof GameImages;

  return images[finalKey] || null;
};
