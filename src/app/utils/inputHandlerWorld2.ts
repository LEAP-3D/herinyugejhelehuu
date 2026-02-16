// inputHandlerWorld2.ts - Засварласан хувилбар

export class InputHandler {
  private keyPressed: Set<string> = new Set();

  constructor() {
    // Constructor дотор юу ч хийхгүй, зөвхөн state удирдана
  }

  handleKeyDown = (e: KeyboardEvent): void => {
    this.keyPressed.add(e.key.toLowerCase());

    // Prevent default scrolling
    if (
      ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", " "].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  handleKeyUp = (e: KeyboardEvent): void => {
    this.keyPressed.delete(e.key.toLowerCase());
  };

  isKeyPressed(key: string): boolean {
    return this.keyPressed.has(key.toLowerCase());
  }

  // Тоглогчдын удирдлага
  getPlayerInput(playerId: number): {
    left: boolean;
    right: boolean;
    jump: boolean;
  } {
    switch (playerId) {
      case 1: // WASD
        return {
          left: this.isKeyPressed("a"),
          right: this.isKeyPressed("d"),
          jump: this.isKeyPressed("w"),
        };
      case 2: // Arrow keys
        return {
          left: this.isKeyPressed("arrowleft"),
          right: this.isKeyPressed("arrowright"),
          jump: this.isKeyPressed("arrowup"),
        };
      case 3: // TFGH
        return {
          left: this.isKeyPressed("f"),
          right: this.isKeyPressed("h"),
          jump: this.isKeyPressed("t"),
        };
      case 4: // IJKL
        return {
          left: this.isKeyPressed("j"),
          right: this.isKeyPressed("l"),
          jump: this.isKeyPressed("i"),
        };
      default:
        return { left: false, right: false, jump: false };
    }
  }

  // Single local player input that works regardless of assigned slot.
  getUniversalInput(): {
    left: boolean;
    right: boolean;
    jump: boolean;
  } {
    const left =
      this.isKeyPressed("a") ||
      this.isKeyPressed("arrowleft") ||
      this.isKeyPressed("f") ||
      this.isKeyPressed("j");
    const right =
      this.isKeyPressed("d") ||
      this.isKeyPressed("arrowright") ||
      this.isKeyPressed("h") ||
      this.isKeyPressed("l");
    const jump =
      this.isKeyPressed("w") ||
      this.isKeyPressed("arrowup") ||
      this.isKeyPressed("t") ||
      this.isKeyPressed("i") ||
      this.isKeyPressed(" ");

    return { left, right, jump };
  }

  // Clear all pressed keys
  clear(): void {
    this.keyPressed.clear();
  }
}
