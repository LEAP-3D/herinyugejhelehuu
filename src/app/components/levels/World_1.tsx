import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Position {
  x: number;
  y: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PlayerState {
  position: Position;
  velocity: { x: number; y: number };
  isGrounded: boolean;
  facingRight: boolean;
  isMoving: boolean;
}

interface GameState {
  player1: PlayerState;
  player2: PlayerState;
  hasKey: boolean;
  gameWon: boolean;
  cameraX: number;
  bothAtDoor: boolean;
}

// ✅ Platform хоорондын X зай (ОЙРТУУЛСАН)
const X_SPACING = 1.12; // 1.05~1.20

// GAME CONSTANTS
const BASE_LEVEL_WIDTH = 2100; // ✅ хоосон space багасгасан
const LEVEL_WIDTH = BASE_LEVEL_WIDTH * X_SPACING;

const PLAYER_SIZE = 48;
const GRAVITY = 0.5;
const JUMP_FORCE = -10;
const MOVE_SPEED = 4;

const PLAYER1_IDLE = "/images/player1-idle.png";
const PLAYER1_LEFT = "/images/player1-left.png";
const PLAYER1_RIGHT = "/images/player1-right.png";
const PLAYER2_IDLE = "/images/player2-idle.png";
const PLAYER2_LEFT = "/images/player2-left.png";
const PLAYER2_RIGHT = "/images/player2-right.png";
const KEY_IMAGE = "/images/ey.png";
const DOOR_IMAGE = "/images/door.png";
const DOOR_OPEN_IMAGE = "/images/door-open.png";

// Pixel Sun + Cloud (BACKGROUND)
const PixelSun = ({ scale }: { scale: number }) => (
  <div
    className="absolute"
    style={{
      left: 120 * scale,
      top: 60 * scale,
      width: 48 * scale,
      height: 48 * scale,
      background: "#FFD93D",
      boxShadow: `0 0 0 ${4 * scale}px #F4A300`,
      imageRendering: "pixelated",
    }}
  />
);

const PixelCloud = ({
  x,
  y,
  scale,
  speed = 18,
}: {
  x: number;
  y: number;
  scale: number;
  speed?: number;
}) => (
  <motion.div
    className="absolute"
    style={{
      left: x * scale,
      top: y * scale,
      width: 80 * scale,
      height: 24 * scale,
      background: "#FFFFFF",
      boxShadow: `
        ${12 * scale}px 0 0 #FFFFFF,
        ${24 * scale}px 0 0 #FFFFFF,
        ${8 * scale}px ${8 * scale}px 0 #FFFFFF,
        ${20 * scale}px ${8 * scale}px 0 #FFFFFF
      `,
      imageRendering: "pixelated",
      opacity: 0.95,
    }}
    animate={{ x: [0, 40 * scale, 0] }}
    transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
  />
);

// =====================
// ✅ LEVEL PLATFORMS
// =====================
const BASE_PLATFORMS: Platform[] = [
  // --- Ground pieces ---
  { x: 0, y: 320, width: 320, height: 80 },
  { x: 360, y: 320, width: 260, height: 80 },
  { x: 660, y: 320, width: 260, height: 80 },
  { x: 960, y: 320, width: 260, height: 80 },
  { x: 1260, y: 320, width: 260, height: 80 },
  { x: 1560, y: 320, width: 300, height: 80 },
  { x: 1900, y: 320, width: 280, height: 80 },

  // --- Step-up / climb ---
  { x: 260, y: 250, width: 120, height: 48 },
  { x: 460, y: 200, width: 120, height: 48 },
  { x: 640, y: 150, width: 140, height: 48 },

  // --- Mid air platforms ---
  { x: 900, y: 240, width: 140, height: 48 },
  { x: 1120, y: 190, width: 120, height: 48 },
  { x: 1320, y: 140, width: 120, height: 48 },

  // --- Drop down section ---
  { x: 1480, y: 210, width: 140, height: 48 },
  { x: 1660, y: 260, width: 160, height: 48 },

  // --- Final climb to door ---
  { x: 1760, y: 220, width: 120, height: 48 },
  { x: 1920, y: 170, width: 140, height: 48 },
  { x: 2080, y: 120, width: 140, height: 48 },

  // --- Door landing platform ---
  { x: 2080, y: 320, width: 200, height: 80 },
];

// ✅ collision + render хоёул үүнийг хэрэглэнэ
const platforms: Platform[] = BASE_PLATFORMS.map((p) => ({
  ...p,
  x: p.x * X_SPACING,
}));

// =====================
// ✅ KEY / DOOR
// =====================
const BASE_KEY_POSITION = { x: 980, y: 115 };
const BASE_DOOR_POSITION = { x: 1480, y: 62 };

const KEY_POSITION = {
  x: BASE_KEY_POSITION.x * X_SPACING,
  y: BASE_KEY_POSITION.y,
};

const DOOR_POSITION = {
  x: BASE_DOOR_POSITION.x * X_SPACING,
  y: BASE_DOOR_POSITION.y,
};

const PixelKey = ({ collected }: { collected: boolean }) => {
  if (collected) return null;
  return (
    <motion.div
      className="absolute"
      style={{ left: KEY_POSITION.x, top: KEY_POSITION.y }}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <Image
        src={KEY_IMAGE}
        alt="Key"
        width={32}
        height={32}
        className="object-contain"
        style={{ imageRendering: "pixelated" }}
        unoptimized
      />
    </motion.div>
  );
};

const PixelDoor = ({ unlocked }: { unlocked: boolean }) => (
  <motion.div
    className="absolute"
    style={{ left: DOOR_POSITION.x, top: DOOR_POSITION.y }}
    animate={{ scale: unlocked ? [1, 1.05, 1] : 1 }}
    transition={{
      duration: 0.3,
      repeat: unlocked ? Infinity : 0,
      repeatDelay: 2,
    }}
  >
    <Image
      src={unlocked ? DOOR_OPEN_IMAGE : DOOR_IMAGE}
      alt={unlocked ? "Open Door" : "Locked Door"}
      width={40}
      height={48}
      className="object-contain"
      style={{ imageRendering: "pixelated" }}
      unoptimized
    />
  </motion.div>
);

const PixelPlayer = ({
  x,
  y,
  facingRight,
  isGrounded,
  isMoving,
  color,
}: {
  x: number;
  y: number;
  facingRight: boolean;
  isGrounded: boolean;
  isMoving: boolean;
  color: "pink" | "blue";
}) => {
  const getPlayerSprite = () => {
    if (color === "pink") {
      if (!isMoving) return PLAYER1_IDLE;
      return facingRight ? PLAYER1_RIGHT : PLAYER1_LEFT;
    } else {
      if (!isMoving) return PLAYER2_IDLE;
      return facingRight ? PLAYER2_RIGHT : PLAYER2_LEFT;
    }
  };

  return (
    <motion.div
      className="absolute"
      style={{
        left: Math.floor(x),
        top: Math.floor(y),
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
      }}
      animate={{ scaleY: isGrounded ? 1 : 0.9 }}
      transition={{ duration: 0.1 }}
    >
      <Image
        src={getPlayerSprite()}
        alt={`Player ${color}`}
        fill
        className="object-contain"
        style={{ imageRendering: "pixelated" }}
        unoptimized
      />
    </motion.div>
  );
};

export default function PicoParkGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 960, height: 540 });

  const initialGameState: GameState = {
    player1: {
      position: { x: 20, y: 260 },
      velocity: { x: 0, y: 0 },
      isGrounded: false,
      facingRight: true,
      isMoving: false,
    },
    player2: {
      position: { x: 90, y: 260 },
      velocity: { x: 0, y: 0 },
      isGrounded: false,
      facingRight: true,
      isMoving: false,
    },
    hasKey: false,
    gameWon: false,
    cameraX: 0,
    bothAtDoor: false,
  };

  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const keysPressed = useRef<Set<string>>(new Set());
  const gameLoopRef = useRef<number | null>(null);

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspectRatio = 16 / 9;
      let newWidth = width;
      let newHeight = width / aspectRatio;

      if (newHeight > height) {
        newHeight = height;
        newWidth = height * aspectRatio;
      }

      setViewportSize({ width: newWidth, height: newHeight });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // ✅ FIX: Axis-separated collision (газарт наалдахгүй bug засагдана)
  const updatePlayer = useCallback(
    (
      player: PlayerState,
      leftKey: boolean,
      rightKey: boolean,
      jumpKey: boolean,
      scale: number,
      viewportHeight: number,
    ): PlayerState => {
      let vx = 0;
      let vy = player.velocity.y + GRAVITY * scale;

      let facingRight = player.facingRight;
      let isMoving = false;

      // INPUT
      if (leftKey) {
        vx = -MOVE_SPEED * scale;
        facingRight = false;
        isMoving = true;
      } else if (rightKey) {
        vx = MOVE_SPEED * scale;
        facingRight = true;
        isMoving = true;
      }

      // Jump
      if (jumpKey && player.isGrounded) {
        vy = JUMP_FORCE * scale;
      }

      const size = PLAYER_SIZE * scale;
      const EPS = 0.5;
      const levelWidth = LEVEL_WIDTH * scale;

      let x = player.position.x;
      let y = player.position.y;

      // -----------------------
      // ✅ 1) MOVE X → RESOLVE X
      // -----------------------
      x += vx;

      // clamp
      x = Math.max(0, Math.min(levelWidth - size, x));

      // resolve X collision (Y overlap-г жаахан нарийсгана → газар дээр түлхэгдэхгүй)
      for (const p of platforms) {
        const px = p.x * scale;
        const py = p.y * scale;
        const pw = p.width * scale;
        const ph = p.height * scale;

        const yTop = y + 2 * scale;
        const yBot = y + size - 2 * scale;

        const overlapX = x < px + pw && x + size > px;
        const overlapY = yBot > py && yTop < py + ph;

        if (overlapX && overlapY) {
          if (vx > 0) x = px - size - EPS;
          else if (vx < 0) x = px + pw + EPS;
          vx = 0;
        }
      }

      // -----------------------
      // ✅ 2) MOVE Y → RESOLVE Y
      // -----------------------
      y += vy;

      // fall reset
      if (y > viewportHeight + 50) {
        return {
          position: { x: 20 * scale, y: 260 * scale },
          velocity: { x: 0, y: 0 },
          isGrounded: false,
          facingRight: true,
          isMoving: false,
        };
      }

      let grounded = false;

      for (const p of platforms) {
        const px = p.x * scale;
        const py = p.y * scale;
        const pw = p.width * scale;
        const ph = p.height * scale;

        const overlapX = x < px + pw && x + size > px;
        const overlapY = y < py + ph && y + size > py;

        if (overlapX && overlapY) {
          if (vy > 0) {
            y = py - size - EPS;
            vy = 0;
            grounded = true;
          } else if (vy < 0) {
            y = py + ph + EPS;
            vy = 0;
          }
        }
      }

      return {
        position: { x, y },
        velocity: { x: vx, y: vy },
        isGrounded: grounded,
        facingRight,
        isMoving,
      };
    },
    [],
  );

  const gameLoop = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameWon) return prev;

      const scale = viewportSize.height / 400;
      const viewportWidth = viewportSize.width;
      const viewportHeight = viewportSize.height;

      const p1Left = keysPressed.current.has("arrowleft");
      const p1Right = keysPressed.current.has("arrowright");
      const p1Jump = keysPressed.current.has("arrowup");

      const p2Left = keysPressed.current.has("a");
      const p2Right = keysPressed.current.has("d");
      const p2Jump = keysPressed.current.has("w");

      const newPlayer1 = updatePlayer(
        prev.player1,
        p1Left,
        p1Right,
        p1Jump,
        scale,
        viewportHeight,
      );
      const newPlayer2 = updatePlayer(
        prev.player2,
        p2Left,
        p2Right,
        p2Jump,
        scale,
        viewportHeight,
      );

      let finalPlayer1 = newPlayer1;
      let finalPlayer2 = newPlayer2;

      // ===================================================
      // ✅ TETHER (чангалсан) — 2 тоглогч хэт холдохгүй
      // ===================================================
      const playerSize = PLAYER_SIZE * scale;

      const MAX_GAP = playerSize * 8;
      const SOFT_ZONE = MAX_GAP * 0.65;
      const EPS_CLAMP = 0.25 * scale;

      const p1x0 = finalPlayer1.position.x;
      const p2x0 = finalPlayer2.position.x;
      const gap0 = Math.abs(p1x0 - p2x0);

      if (gap0 > SOFT_ZONE) {
        const leaderIsP1 = p1x0 > p2x0;
        const t = Math.min(
          1,
          (gap0 - SOFT_ZONE) / Math.max(1, MAX_GAP - SOFT_ZONE),
        );
        const speedFactor = 1 - t;

        if (leaderIsP1) {
          finalPlayer1 = {
            ...finalPlayer1,
            velocity: {
              ...finalPlayer1.velocity,
              x: finalPlayer1.velocity.x * speedFactor,
            },
          };
        } else {
          finalPlayer2 = {
            ...finalPlayer2,
            velocity: {
              ...finalPlayer2.velocity,
              x: finalPlayer2.velocity.x * speedFactor,
            },
          };
        }
      }

      const p1x1 = finalPlayer1.position.x;
      const p2x1 = finalPlayer2.position.x;
      const gap1 = Math.abs(p1x1 - p2x1);

      if (gap1 > MAX_GAP) {
        if (p1x1 > p2x1) {
          finalPlayer1 = {
            ...finalPlayer1,
            position: {
              ...finalPlayer1.position,
              x: p2x1 + MAX_GAP - EPS_CLAMP,
            },
            velocity: {
              ...finalPlayer1.velocity,
              x: Math.min(0, finalPlayer1.velocity.x),
            },
          };
        } else {
          finalPlayer2 = {
            ...finalPlayer2,
            position: {
              ...finalPlayer2.position,
              x: p1x1 + MAX_GAP - EPS_CLAMP,
            },
            velocity: {
              ...finalPlayer2.velocity,
              x: Math.min(0, finalPlayer2.velocity.x),
            },
          };
        }
      }

      // ✅ KEY
      let hasKey = prev.hasKey;
      const keyX = KEY_POSITION.x * scale;
      const keyY = KEY_POSITION.y * scale;

      if (!hasKey) {
        const p1KeyDist = Math.hypot(
          finalPlayer1.position.x + playerSize / 2 - keyX - 16 * scale,
          finalPlayer1.position.y + playerSize / 2 - keyY - 16 * scale,
        );
        const p2KeyDist = Math.hypot(
          finalPlayer2.position.x + playerSize / 2 - keyX - 16 * scale,
          finalPlayer2.position.y + playerSize / 2 - keyY - 16 * scale,
        );
        if (p1KeyDist < 24 * scale || p2KeyDist < 24 * scale) hasKey = true;
      }

      // ✅ DOOR
      let gameWon: boolean = prev.gameWon;
      let bothAtDoor: boolean = false;

      const doorX = DOOR_POSITION.x * scale;
      const doorY = DOOR_POSITION.y * scale;

      if (hasKey) {
        const p1DoorDist = Math.hypot(
          finalPlayer1.position.x + playerSize / 2 - doorX - 20 * scale,
          finalPlayer1.position.y + playerSize / 2 - doorY - 24 * scale,
        );
        const p2DoorDist = Math.hypot(
          finalPlayer2.position.x + playerSize / 2 - doorX - 20 * scale,
          finalPlayer2.position.y + playerSize / 2 - doorY - 24 * scale,
        );

        const p1AtDoor = p1DoorDist < 40 * scale;
        const p2AtDoor = p2DoorDist < 40 * scale;
        bothAtDoor = p1AtDoor && p2AtDoor;

        if (bothAtDoor) gameWon = true;
      }

      // ✅ CAMERA (midpoint)
      const midX = (finalPlayer1.position.x + finalPlayer2.position.x) / 2;
      let newCameraX = midX - viewportWidth / 2 + playerSize / 2;

      const levelWidth = LEVEL_WIDTH * scale;
      newCameraX = Math.max(
        0,
        Math.min(levelWidth - viewportWidth, newCameraX),
      );

      return {
        player1: finalPlayer1,
        player2: finalPlayer2,
        hasKey,
        gameWon,
        cameraX: newCameraX,
        bothAtDoor,
      };
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [updatePlayer, viewportSize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameLoop]);

  const resetGame = () => {
    const scale = viewportSize.height / 400;
    setGameState({
      player1: {
        ...initialGameState.player1,
        position: { x: 20 * scale, y: 260 * scale },
      },
      player2: {
        ...initialGameState.player2,
        position: { x: 90 * scale, y: 260 * scale },
      },
      hasKey: false,
      gameWon: false,
      cameraX: 0,
      bothAtDoor: false,
    });
  };

  const scale = viewportSize.height / 400;

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden"
    >
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <span className="text-white font-bold text-sm tracking-widest">
          LEVEL 1
        </span>
      </div>

      <div
        className="relative overflow-hidden"
        style={{
          width: viewportSize.width,
          height: viewportSize.height,
          background:
            "linear-gradient(to bottom, #87CEEB 0%, #98D8E8 30%, #B0E0E6 60%, #E0F6FF 100%)",
          imageRendering: "pixelated",
        }}
      >
        {/* SKY */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <PixelSun scale={scale} />
          <PixelCloud x={260} y={70} scale={scale} speed={22} />
          <PixelCloud x={520} y={110} scale={scale} speed={28} />
          <PixelCloud x={820} y={80} scale={scale} speed={34} />
        </div>

        {/* WORLD */}
        <div
          className="absolute z-10"
          style={{
            transform: `translateX(-${gameState.cameraX}px)`,
            width: LEVEL_WIDTH * scale,
            height: viewportSize.height,
          }}
        >
          {/* PLATFORMS */}
          {platforms.map((platform, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                left: platform.x * scale,
                top: platform.y * scale,
                width: platform.width * scale,
                height: platform.height * scale,
                background: "#3B2B1B",
                boxShadow: `
                  inset 0 ${-6 * scale}px 0 0 #6EEB83,
                  inset 0 ${-10 * scale}px 0 0 #3FAF5B,
                  inset 0 ${-14 * scale}px 0 0 #2B7D3F,
                  inset 0 0 0 ${2 * scale}px #1D140C
                `,
                imageRendering: "pixelated",
              }}
            />
          ))}

          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <PixelKey collected={gameState.hasKey} />
          </div>

          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <PixelDoor unlocked={gameState.hasKey} />
          </div>

          <PixelPlayer
            x={gameState.player1.position.x}
            y={gameState.player1.position.y}
            facingRight={gameState.player1.facingRight}
            isGrounded={gameState.player1.isGrounded}
            isMoving={gameState.player1.isMoving}
            color="pink"
          />

          <PixelPlayer
            x={gameState.player2.position.x}
            y={gameState.player2.position.y}
            facingRight={gameState.player2.facingRight}
            isGrounded={gameState.player2.isGrounded}
            isMoving={gameState.player2.isMoving}
            color="blue"
          />
        </div>

        {gameState.hasKey && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-2">
              <Image
                src={KEY_IMAGE}
                alt="Key"
                width={16}
                height={16}
                className="object-contain"
                style={{ imageRendering: "pixelated" }}
                unoptimized
              />
              <span className="text-yellow-400 font-bold text-sm">×1</span>
            </div>
          </div>
        )}

        <AnimatePresence>
          {gameState.gameWon && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="text-center"
              >
                <h2 className="text-4xl font-bold text-white mb-8">CLEAR!</h2>
                <button
                  onClick={resetGame}
                  className="bg-pink-500 hover:brightness-110 text-white font-bold text-sm py-4 px-8 transition-all rounded"
                >
                  RETRY
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-12 text-gray-600 font-bold text-[10px] tracking-wide">
        <div>P1: ← → ↑</div>
        <div>P2: A D W</div>
      </div>
    </div>
  );
}
