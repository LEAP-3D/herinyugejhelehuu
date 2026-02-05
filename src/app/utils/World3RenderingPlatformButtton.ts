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
export const drawDangerButtons = (
  ctx: CanvasRenderingContext2D,
  buttons: DangerButton[],
  animTimer: number,
  dangerButtonImage: HTMLImageElement | null,
) => {
  buttons.forEach((button) => {
    if (dangerButtonImage && dangerButtonImage.complete) {
      ctx.drawImage(
        dangerButtonImage,
        button.x,
        button.y,
        button.width,
        button.height,
      );
    } else {
      ctx.fillStyle = "#E74C3C";
      ctx.beginPath();
      ctx.arc(
        button.x + button.width / 2,
        button.y + button.height / 2,
        button.width / 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    const pulse = Math.sin(animTimer * 0.1) * 0.3 + 0.7;
    ctx.save();
    ctx.globalAlpha = pulse * 0.3;
    ctx.fillStyle = "#E74C3C";
    ctx.beginPath();
    ctx.arc(
      button.x + button.width / 2,
      button.y + button.height / 2,
      button.width / 2 + 10,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  });
};

export const drawPlatforms = (
  ctx: CanvasRenderingContext2D,
  platforms: Platform[],
) => {
  platforms.forEach((platform) => {
    ctx.fillStyle = "#5D6D7E";
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

    ctx.fillStyle = "#85929E";
    ctx.fillRect(platform.x, platform.y, platform.width, 4);

    ctx.fillStyle = "#2C3E50";
    for (
      let i = platform.x + 10;
      i < platform.x + platform.width - 10;
      i += 20
    ) {
      ctx.beginPath();
      ctx.arc(i, platform.y + 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
};
