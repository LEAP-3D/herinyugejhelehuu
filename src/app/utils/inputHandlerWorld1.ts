// inputHandlerWorld1.ts - Гарын удирдлага - ЗАСВАРЛАСАН

export class InputHandler {
  private keyPressed: Set<string> = new Set();

  constructor() {
    // Constructor дотор юу ч хийхгүй
  }

  handleKeyDown = (e: KeyboardEvent): void => {
    this.keyPressed.add(e.key.toLowerCase());

    // Prevent default arrow key scrolling
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
    const left = this.isKeyPressed("a") || this.isKeyPressed("arrowleft");
    const right = this.isKeyPressed("d") || this.isKeyPressed("arrowright");
    const jump =
      this.isKeyPressed("w") ||
      this.isKeyPressed("arrowup") ||
      this.isKeyPressed(" ");

    return { left, right, jump };
  }

  // Legacy methods - backward compatibility
  init(): void {
    // Хуучин код-д init() дуудсан байж болох учраас
    // Хоосон функц үлдээнэ
  }

  cleanup(): void {
    // Хуучин код-д cleanup() дуудсан байж болох учраас
    this.clear();
  }

  // Бүх дарагдсан товчлууруудыг цэвэрлэх
  clear(): void {
    this.keyPressed.clear();
  }
}
