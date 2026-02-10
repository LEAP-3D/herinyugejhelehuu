import { PlayerKeys } from "@/app/utils/typesWorld1";

export class InputHandler {
  private localPlayerId: number | null = null;

  private playerKeys: Record<number, PlayerKeys> = {
    1: { left: false, right: false, jump: false },
    2: { left: false, right: false, jump: false },
    3: { left: false, right: false, jump: false },
    4: { left: false, right: false, jump: false },
  };

  private keyMap: Record<
    string,
    { id: number; action: keyof PlayerKeys }
  > = {
    a: { id: 1, action: "left" }, A: { id: 1, action: "left" },
    d: { id: 1, action: "right" }, D: { id: 1, action: "right" },
    w: { id: 1, action: "jump" }, W: { id: 1, action: "jump" },

    ArrowLeft: { id: 2, action: "left" },
    ArrowRight: { id: 2, action: "right" },
    ArrowUp: { id: 2, action: "jump" },

    j: { id: 3, action: "left" }, J: { id: 3, action: "left" },
    l: { id: 3, action: "right" }, L: { id: 3, action: "right" },
    i: { id: 3, action: "jump" }, I: { id: 3, action: "jump" },

    "4": { id: 4, action: "left" },
    "6": { id: 4, action: "right" },
    "8": { id: 4, action: "jump" },
  };

  setLocalPlayer(playerId: number) {
    this.localPlayerId = playerId;
  }

  // ✅ Энэ функцийг нэмлээ: Screenshot дээр чинь дуудаж байгаа функц
  public isKeyPressed(playerId: number, action: keyof PlayerKeys): boolean {
    return this.playerKeys[playerId]?.[action] ?? false;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const binding = this.keyMap[e.key];
    if (!binding) return;
    if (this.localPlayerId !== binding.id) return;

    this.playerKeys[binding.id][binding.action] = true;
    e.preventDefault();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const binding = this.keyMap[e.key];
    if (!binding) return;
    if (this.localPlayerId !== binding.id) return;

    this.playerKeys[binding.id][binding.action] = false;
    e.preventDefault();
  };

  init() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  cleanup() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  getKeys() {
    return structuredClone(this.playerKeys);
  }

  getPlayerKeys(playerId: number): PlayerKeys {
    return {
      left: this.playerKeys[playerId]?.left ?? false,
      right: this.playerKeys[playerId]?.right ?? false,
      jump: this.playerKeys[playerId]?.jump ?? false,
    };
  }
}