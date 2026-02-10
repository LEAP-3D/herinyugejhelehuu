"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";

// Import images
import player1IdleImg from "@/app/assets/Finn.png";
import player1RightImg from "@/app/assets/Finn-right.png";
import player1LeftImg from "@/app/assets/Finn-left.png";
import player2IdleImg from "@/app/assets/Iceking.png";
import player2RightImg from "@/app/assets/Iceking-right.png";
import player2LeftImg from "@/app/assets/Ice-king-left.png";
import player3IdleImg from "@/app/assets/Jakeidle.png";
import player3RightImg from "@/app/assets/Jake-right.png";
import player3LeftImg from "@/app/assets/Jake-left.png";
import player4IdleImg from "@/app/assets/BMOidle.png";
import player4RightImg from "@/app/assets/BMO-right.png";
import player4LeftImg from "@/app/assets/BMO-left.png";
import keyImg from "@/app/assets/Keys.png";
import doorImg from "@/app/assets/Door.png";
import deathImg from "@/app/assets/Death.png";
import dangerButtonImg from "@/app/assets/Button.png";

// Import utilities
import { updateCamera, type Camera } from "@/app/utils/camera";
import {
  createPlatformsWorld2,
  createDangerButtonsWorld2,
  GAME_CONSTANTS,
} from "@/app/utils/gameData";
import {
  loadAllImagesWorld2 as loadAllImages,
  getPlayerSprite,
  type GameImages,
} from "@/app/utils/imageLoader";
import {
  createKeyboardHandlers,
  getPlayerInput,
} from "@/app/utils/inputHandler";

import {
  drawKey,
  drawDoor,
  drawUIWorld2 as drawUI,
  drawWaitingScreen,
  drawWinScreen,
  drawDeathScreen,
} from "@/app/utils/SharedRendering";
import {
  drawBackgroundWorld2 as drawBackground,
  drawGroundWorld2 as drawGround,
  drawPlatforms,
  drawDangerButtons,
} from "@/app/utils/World2Rendering";

import { canAccessWorld, getNextWorld } from "@/app/utils/Progresstracker";

interface Player {
  id: string;
  playerId: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  animFrame: number;
  facingRight: boolean;
  color: string;
  dead: boolean;
  standingOnPlayer: string | null;
}

interface GameState {
  players: Record<string, Player>;
  keyCollected: boolean;
  playersAtDoor: string[];
  gameStatus: "waiting" | "playing" | "won" | "dead";
}

const MultiPlayerWorld2 = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const winTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ State
  const [playerId, setPlayerId] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [gameState, setGameState] = useState<GameState>({
    players: {},
    keyCollected: false,
    playersAtDoor: [],
    gameStatus: "waiting",
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 700 });
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [gameImages, setGameImages] = useState<GameImages | null>(null);

  const keysPressed = useRef<Set<string>>(new Set());
  const animTimer = useRef(0);
  const cameraRef = useRef<Camera>({ x: 0, y: 0 });

  const groundY = canvasSize.height - GAME_CONSTANTS.GROUND_OFFSET;
  const platformsRef = useRef(createPlatformsWorld2(groundY));
  const dangerButtonsRef = useRef(createDangerButtonsWorld2(groundY));

  // ✅ Access check (World 2)
  useEffect(() => {
    if (!canAccessWorld(2)) {
      alert("Та эхлээд өмнөх world-оо дуусгана уу!");
      router.push("/");
    }
  }, [router]);

  // ✅ Load images
  useEffect(() => {
    loadAllImages(
      player1IdleImg,
      player1RightImg,
      player1LeftImg,
      player2IdleImg,
      player2RightImg,
      player2LeftImg,
      player3IdleImg,
      player3RightImg,
      player3LeftImg,
      player4IdleImg,
      player4RightImg,
      player4LeftImg,
      keyImg,
      doorImg,
      deathImg,
      dangerButtonImg,
    )
      .then((images: GameImages) => {
        setGameImages(images);
        setImagesLoaded(true);
      })
      .catch((error: Error) => {
        console.error("❌ Failed to load images:", error);
        alert("Зураг ачаалахад алдаа гарлаа. Дахин оролдоно уу.");
      });
  }, []);

  /**
   * ✅ SOCKET CONNECTION (IMPROVED)
   */
  useEffect(() => {
    const SERVER_URL =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

    const rc = localStorage.getItem("roomCode")?.trim();
    const pid = localStorage.getItem("playerId")?.trim();

    if (!rc || !pid) {
      router.push("/Home-page/Multiplayer/Lobby");
      return;
    }

    setRoomCode(rc);
    setPlayerId(pid);

    const s = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      withCredentials: true,
    });

    socketRef.current = s;

    const resetClientState = () => {
      setIsConnected(false);
      setIsReconnecting(false);
      setGameState({
        players: {},
        keyCollected: false,
        playersAtDoor: [],
        gameStatus: "waiting",
      });
    };

    const onState = (state: GameState) => {
      setGameState(state);

      // ✅ Clear existing timer
      if (winTimerRef.current) {
        clearTimeout(winTimerRef.current);
        winTimerRef.current = null;
      }

      // ✅ Handle win condition
      if (state.gameStatus === "won") {
        winTimerRef.current = setTimeout(() => {
          const nextWorld = getNextWorld();
          if (nextWorld) {
            router.push(`/multiplayer/world${nextWorld}`);
          } else {
            router.push("/");
          }
        }, 3000);
      }
    };

    // ✅ Socket event handlers
    s.on("connect", () => {
      console.log("✅ Connected to server");
      setIsConnected(true);
      setIsReconnecting(false);
      s.emit("joinRoom", { roomCode: rc, playerId: pid });
    });

    s.on("connect_error", (e) => {
      console.error("❌ Connection error:", e?.message);
    });

    s.on("disconnect", (reason) => {
      console.log("🔌 Disconnected:", reason);
      resetClientState();
    });

    s.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
      setIsReconnecting(true);
    });

    s.on("reconnect", (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setIsReconnecting(false);
      s.emit("joinRoom", { roomCode: rc, playerId: pid });
    });

    s.on("reconnect_failed", () => {
      console.error("❌ Reconnection failed");
      setIsReconnecting(false);
      alert("Серверт холбогдож чадсангүй. Дахин оролдоно уу.");
      router.push("/Home-page/Multiplayer/Lobby");
    });

    s.on("gameState", onState);
    s.on("roomState", onState);

    s.on("joinDenied", (data) => {
      console.warn("❌ Join denied:", data);
      alert(
        "Өрөөнд нэвтрэх боломжгүй. Өрөө дүүрсэн эсвэл тоглоом эхэлсэн байна.",
      );
      router.push("/Home-page/Multiplayer/Lobby");
    });

    // ✅ Cleanup
    return () => {
      if (winTimerRef.current) {
        clearTimeout(winTimerRef.current);
        winTimerRef.current = null;
      }

      s.off("connect");
      s.off("connect_error");
      s.off("disconnect");
      s.off("reconnect_attempt");
      s.off("reconnect");
      s.off("reconnect_failed");
      s.off("gameState", onState);
      s.off("roomState", onState);
      s.off("joinDenied");
      s.disconnect();
      socketRef.current = null;
    };
  }, [router]);

  // ✅ Resize handler
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Send input to server
  useEffect(() => {
    const s = socketRef.current;
    if (!s || !s.connected || !roomCode) return;

    const interval = setInterval(() => {
      const input = getPlayerInput(keysPressed.current);
      s.emit("playerInput", input);
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [roomCode]);

  // ✅ Keyboard handling
  useEffect(() => {
    const { handleKeyDown, handleKeyUp } = createKeyboardHandlers(
      keysPressed.current,
    );

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // ✅ Game rendering loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameImages) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    animTimer.current++;

    const players = Object.values(gameState.players);
    const platforms = platformsRef.current;
    const dangerButtons = dangerButtonsRef.current;

    // Camera follow
    if (playerId && gameState.players[playerId]) {
      const myPlayer = gameState.players[playerId];
      cameraRef.current = updateCamera(
        cameraRef.current,
        myPlayer,
        canvasSize.width,
      );
    }

    drawBackground(ctx, canvasSize.width, canvasSize.height, animTimer.current);

    ctx.save();
    ctx.translate(-cameraRef.current.x, 0);

    drawGround(ctx, canvasSize.height);
    drawPlatforms(ctx, platforms);

    // Draw danger buttons
    if (gameImages.dangerButton) {
      drawDangerButtons(
        ctx,
        dangerButtons,
        animTimer.current,
        gameImages.dangerButton,
      );
    }

    if (!gameState.keyCollected && gameImages.key) {
      const keyX = GAME_CONSTANTS.KEY_POSITION.x;
      const keyY = groundY + GAME_CONSTANTS.KEY_POSITION.y;
      const keyItem = {
        x: keyX,
        y: keyY,
        width: 40,
        height: 40,
        collected: false,
      };
      drawKey(ctx, keyItem, gameImages.key, animTimer.current);
    }

    if (gameImages.door) {
      const doorX = GAME_CONSTANTS.DOOR_POSITION.x;
      const doorY = groundY + GAME_CONSTANTS.DOOR_POSITION.y;
      const doorObject = { x: doorX, y: doorY, width: 60, height: 80 };
      drawDoor(ctx, doorObject, gameImages.door, gameState.keyCollected);
    }

    players.forEach((p) => {
      if (p.dead) return;

      const img = getPlayerSprite(
        gameImages,
        p.playerId,
        p.animFrame,
        p.facingRight,
      );

      if (!img || !img.complete) return;

      ctx.save();
      if (p.id === playerId) {
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 15;
      } else {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
      }

      ctx.drawImage(img, p.x, p.y, p.width, p.height);
      ctx.restore();

      ctx.fillStyle = p.id === playerId ? "#FFD700" : p.color;
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`P${p.playerId}`, p.x + p.width / 2, p.y - 10);
    });

    ctx.restore();

    drawUI(
      ctx,
      players.length,
      gameState.keyCollected,
      isConnected,
      canvasSize.height,
    );

    if (gameState.gameStatus === "waiting") {
      drawWaitingScreen(
        ctx,
        canvasSize.width,
        canvasSize.height,
        players.length,
      );
    } else if (gameState.gameStatus === "won") {
      drawWinScreen(ctx, canvasSize.width, canvasSize.height);
    } else if (gameState.gameStatus === "dead") {
      drawDeathScreen(
        ctx,
        canvasSize.width,
        canvasSize.height,
        gameImages.death,
      );
    }
  }, [gameState, playerId, canvasSize, isConnected, groundY, gameImages]);

  useEffect(() => {
    if (!imagesLoaded) return;
    const interval = setInterval(gameLoop, 1000 / 60);
    return () => clearInterval(interval);
  }, [gameLoop, imagesLoaded]);

  // ✅ Loading screen
  if (!imagesLoaded) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-linear-to-b from-slate-800 to-slate-900">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-4">
            Loading World 2...
          </div>
          <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Connecting screen
  if (!isConnected) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-linear-to-b from-slate-800 to-slate-900">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-4">
            {isReconnecting ? "Reconnecting..." : "Connecting to server..."}
          </div>
          <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Game screen
  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-900">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="block"
      />

      {roomCode && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-black/80 px-6 py-3 rounded-lg">
          <p className="text-white text-lg">
            Room: <span className="font-bold text-yellow-400">{roomCode}</span>
          </p>
        </div>
      )}

      {/* ✅ Reconnecting indicator */}
      {isReconnecting && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white px-6 py-3 rounded-lg animate-pulse">
          🔄 Reconnecting...
        </div>
      )}

      <button
        onClick={() => router.push("/Home-page/Multiplayer/Lobby")}
        className="fixed top-4 right-4 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all"
      >
        Exit
      </button>
    </div>
  );
};

export default MultiPlayerWorld2;
