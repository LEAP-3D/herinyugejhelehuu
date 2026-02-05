interface PlayerImages {
  idle: HTMLImageElement | null;
  right: HTMLImageElement | null;
  left: HTMLImageElement | null;
}
export interface GameImages {
  player1: PlayerImages;
  player2: PlayerImages;
  player3: PlayerImages;
  player4: PlayerImages;
  key: HTMLImageElement | null;
  door: HTMLImageElement | null;
  death: HTMLImageElement | null;
  dangerButton?: HTMLImageElement | null; // Optional for World 2
  box?: HTMLImageElement | null; // Optional for World 3
}
//  * Helper function to get image source from string or object
const getImageSrc = (img: string | { src: string }): string => {
  return typeof img === "string" ? img : img.src;
};
//  * Load a single image and return a promise
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error("Failed to load image:", src);
      reject(new Error(`Failed to load: ${src}`));
    };
    img.src = src;
  });
};
//  * Load all game images asynchronously (World 1 - without danger button)
export const loadAllImagesWorld1 = async (
  player1IdleImg: string | { src: string },
  player1RightImg: string | { src: string },
  player1LeftImg: string | { src: string },
  player2IdleImg: string | { src: string },
  player2RightImg: string | { src: string },
  player2LeftImg: string | { src: string },
  player3IdleImg: string | { src: string },
  player3RightImg: string | { src: string },
  player3LeftImg: string | { src: string },
  player4IdleImg: string | { src: string },
  player4RightImg: string | { src: string },
  player4LeftImg: string | { src: string },
  keyImg: string | { src: string },
  doorImg: string | { src: string },
  deathImg: string | { src: string },
): Promise<GameImages> => {
  try {
    const [
      p1Idle,
      p1Right,
      p1Left,
      p2Idle,
      p2Right,
      p2Left,
      p3Idle,
      p3Right,
      p3Left,
      p4Idle,
      p4Right,
      p4Left,
      key,
      door,
      death,
    ] = await Promise.all([
      loadImage(getImageSrc(player1IdleImg)),
      loadImage(getImageSrc(player1RightImg)),
      loadImage(getImageSrc(player1LeftImg)),
      loadImage(getImageSrc(player2IdleImg)),
      loadImage(getImageSrc(player2RightImg)),
      loadImage(getImageSrc(player2LeftImg)),
      loadImage(getImageSrc(player3IdleImg)),
      loadImage(getImageSrc(player3RightImg)),
      loadImage(getImageSrc(player3LeftImg)),
      loadImage(getImageSrc(player4IdleImg)),
      loadImage(getImageSrc(player4RightImg)),
      loadImage(getImageSrc(player4LeftImg)),
      loadImage(getImageSrc(keyImg)),
      loadImage(getImageSrc(doorImg)),
      loadImage(getImageSrc(deathImg)),
    ]);

    return {
      player1: { idle: p1Idle, right: p1Right, left: p1Left },
      player2: { idle: p2Idle, right: p2Right, left: p2Left },
      player3: { idle: p3Idle, right: p3Right, left: p3Left },
      player4: { idle: p4Idle, right: p4Right, left: p4Left },
      key,
      door,
      death,
    };
  } catch (error) {
    console.error("Error loading images:", error);
    throw error;
  }
};
//  * Load all game images asynchronously (World 2 - with danger button)
export const loadAllImagesWorld2 = async (
  player1IdleImg: string | { src: string },
  player1RightImg: string | { src: string },
  player1LeftImg: string | { src: string },
  player2IdleImg: string | { src: string },
  player2RightImg: string | { src: string },
  player2LeftImg: string | { src: string },
  player3IdleImg: string | { src: string },
  player3RightImg: string | { src: string },
  player3LeftImg: string | { src: string },
  player4IdleImg: string | { src: string },
  player4RightImg: string | { src: string },
  player4LeftImg: string | { src: string },
  keyImg: string | { src: string },
  doorImg: string | { src: string },
  deathImg: string | { src: string },
  dangerButtonImg: string | { src: string },
): Promise<GameImages> => {
  try {
    const [
      p1Idle,
      p1Right,
      p1Left,
      p2Idle,
      p2Right,
      p2Left,
      p3Idle,
      p3Right,
      p3Left,
      p4Idle,
      p4Right,
      p4Left,
      key,
      door,
      death,
      dangerButton,
    ] = await Promise.all([
      loadImage(getImageSrc(player1IdleImg)),
      loadImage(getImageSrc(player1RightImg)),
      loadImage(getImageSrc(player1LeftImg)),
      loadImage(getImageSrc(player2IdleImg)),
      loadImage(getImageSrc(player2RightImg)),
      loadImage(getImageSrc(player2LeftImg)),
      loadImage(getImageSrc(player3IdleImg)),
      loadImage(getImageSrc(player3RightImg)),
      loadImage(getImageSrc(player3LeftImg)),
      loadImage(getImageSrc(player4IdleImg)),
      loadImage(getImageSrc(player4RightImg)),
      loadImage(getImageSrc(player4LeftImg)),
      loadImage(getImageSrc(keyImg)),
      loadImage(getImageSrc(doorImg)),
      loadImage(getImageSrc(deathImg)),
      loadImage(getImageSrc(dangerButtonImg)),
    ]);

    return {
      player1: { idle: p1Idle, right: p1Right, left: p1Left },
      player2: { idle: p2Idle, right: p2Right, left: p2Left },
      player3: { idle: p3Idle, right: p3Right, left: p3Left },
      player4: { idle: p4Idle, right: p4Right, left: p4Left },
      key,
      door,
      death,
      dangerButton,
    };
  } catch (error) {
    console.error("Error loading images:", error);
    throw error;
  }
};
//  * Load all game images asynchronously (World 3 - with danger button and box)
export const loadAllImagesWorld3 = async (
  player1IdleImg: string | { src: string },
  player1RightImg: string | { src: string },
  player1LeftImg: string | { src: string },
  player2IdleImg: string | { src: string },
  player2RightImg: string | { src: string },
  player2LeftImg: string | { src: string },
  player3IdleImg: string | { src: string },
  player3RightImg: string | { src: string },
  player3LeftImg: string | { src: string },
  player4IdleImg: string | { src: string },
  player4RightImg: string | { src: string },
  player4LeftImg: string | { src: string },
  keyImg: string | { src: string },
  doorImg: string | { src: string },
  deathImg: string | { src: string },
  dangerButtonImg: string | { src: string },
  boxImg: string | { src: string },
): Promise<GameImages> => {
  try {
    const [
      p1Idle,
      p1Right,
      p1Left,
      p2Idle,
      p2Right,
      p2Left,
      p3Idle,
      p3Right,
      p3Left,
      p4Idle,
      p4Right,
      p4Left,
      key,
      door,
      death,
      dangerButton,
      box,
    ] = await Promise.all([
      loadImage(getImageSrc(player1IdleImg)),
      loadImage(getImageSrc(player1RightImg)),
      loadImage(getImageSrc(player1LeftImg)),
      loadImage(getImageSrc(player2IdleImg)),
      loadImage(getImageSrc(player2RightImg)),
      loadImage(getImageSrc(player2LeftImg)),
      loadImage(getImageSrc(player3IdleImg)),
      loadImage(getImageSrc(player3RightImg)),
      loadImage(getImageSrc(player3LeftImg)),
      loadImage(getImageSrc(player4IdleImg)),
      loadImage(getImageSrc(player4RightImg)),
      loadImage(getImageSrc(player4LeftImg)),
      loadImage(getImageSrc(keyImg)),
      loadImage(getImageSrc(doorImg)),
      loadImage(getImageSrc(deathImg)),
      loadImage(getImageSrc(dangerButtonImg)),
      loadImage(getImageSrc(boxImg)),
    ]);

    return {
      player1: { idle: p1Idle, right: p1Right, left: p1Left },
      player2: { idle: p2Idle, right: p2Right, left: p2Left },
      player3: { idle: p3Idle, right: p3Right, left: p3Left },
      player4: { idle: p4Idle, right: p4Right, left: p4Left },
      key,
      door,
      death,
      dangerButton,
      box,
    };
  } catch (error) {
    console.error("Error loading images:", error);
    throw error;
  }
};
//  * Get the appropriate sprite for a player based on their state
export const getPlayerSprite = (
  images: GameImages,
  playerId: number,
  animFrame: number,
  facingRight: boolean,
): HTMLImageElement | null => {
  let playerImages: PlayerImages | null = null;
  switch (playerId) {
    case 1:
      playerImages = images.player1;
      break;
    case 2:
      playerImages = images.player2;
      break;
    case 3:
      playerImages = images.player3;
      break;
    case 4:
      playerImages = images.player4;
      break;
    default:
      return null;
  }
  if (!playerImages) return null;
  if (animFrame === 0) {
    return playerImages.idle;
  }
  return facingRight ? playerImages.right : playerImages.left;
};
