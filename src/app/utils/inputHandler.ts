/**
 * Player input state
 */
export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
}

/**
 * Keys that should have default browser behavior prevented
 */
const PREVENT_DEFAULT_KEYS = [
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  " ",
  "w",
  "a",
  "s",
  "d",
];

/**
 * Create keyboard event handlers
 */
export const createKeyboardHandlers = (
  keysPressed: Set<string>
) => {
  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    keysPressed.add(key);

    if (PREVENT_DEFAULT_KEYS.includes(key)) {
      event.preventDefault();
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    keysPressed.delete(event.key.toLowerCase());
  };

  return { handleKeyDown, handleKeyUp };
};

/**
 * Convert pressed keys to game input (World 2 style)
 */
export const getPlayerInput = (keysPressed: Set<string>): PlayerInput => {
  return {
    left: keysPressed.has("a") || keysPressed.has("arrowleft"),
    right: keysPressed.has("d") || keysPressed.has("arrowright"),
    jump:
      keysPressed.has("w") ||
      keysPressed.has("arrowup") ||
      keysPressed.has(" "),
  };
};

/**
 * Check if left movement keys are pressed
 */
export const isLeftPressed = (keysPressed: Set<string>): boolean => {
  return keysPressed.has("a") || keysPressed.has("arrowleft");
};

/**
 * Check if right movement keys are pressed
 */
export const isRightPressed = (keysPressed: Set<string>): boolean => {
  return keysPressed.has("d") || keysPressed.has("arrowright");
};

/**
 * Check if jump keys are pressed
 */
export const isJumpPressed = (keysPressed: Set<string>): boolean => {
  return keysPressed.has("w") || keysPressed.has("arrowup") || keysPressed.has(" ");
};