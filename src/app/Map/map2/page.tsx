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
import boxImg from "@/app/assets/box.png";

// Import utilities
import { updateCamera, type Camera } from "@/app/utils/camera";
import {
  createPlatformsWorld3,
  createDangerButtonsWorld3,
  GAME_CONSTANTS,
} from "@/app/utils/gameDataWorld1";
import {
  loadAllImagesWorld3 as loadAllImages,
  getPlayerSprite,
  type GameImages,
} from "@/app/utils/imageLoaderWorld1";
import {
  createKeyboardHandlers,
  getPlayerInput,
} from "@/app/utils/inputHandlerWorld1";
import {
  drawKey,
  drawDoor,
  drawWaitingScreen,
  drawWinScreen,
  drawDeathScreen,
} from "@/app/utils/SharedRendering";
import {
  drawUIWorld3 as drawUI,
  drawBackgroundWorld3 as drawBackground,
  drawBoxes,
} from "@/app/utils/World3Rendering";
import {
  drawPlatforms,
  drawDangerButtons,
} from "@/app/utils/World3RenderingPlatformButtton";

import { canAccessWorld, getNextWorld } from "@/app/utils/Progresstracker";

const drawGroundWorld3 = (ctx: CanvasRenderingContext2D, height: number) => {
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(-100, height - 60, 7000, 100);
};

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

interface PushBox {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
}

interface GameState {
  players: Record<string, Player>;
  boxes: PushBox[];
  keyCollected: boolean;
  playersAtDoor: string[];
  gameStatus: "waiting" | "playing" | "won" | "dead";
}

const MultiPlayerWorld3 = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const winTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [playerId, setPlayerId] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [gameState, setGameState] = useState<GameState>({
    players: {},
    boxes: [],
    keyCollected: false,
    playersAtDoor: [],
    gameStatus: "waiting",
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string>("");
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 700 });
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [gameImages, setGameImages] = useState<GameImages | null>(null);

  const keysPressed = useRef<Set<string>>(new Set());
  const animTimer = useRef(0);
  const cameraRef = useRef<Camera>({ x: 0, y: 0 });

  const groundY = canvasSize.height - GAME_CONSTANTS.GROUND_OFFSET;
  const platformsRef = useRef(createPlatformsWorld3(groundY));
  const dangerButtonsRef = useRef(createDangerButtonsWorld3(groundY));

  // ✅ Access check (World 3)
  useEffect(() => {
    if (!canAccessWorld(3)) {
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
      boxImg,
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
   * ✅ SOCKET CONNECTION (FIXED)
   */
  useEffect(() => {
    const SERVER_URL =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
    const maxReconnectAttempts = 5;
    const reconnectAttempts = { current: 0 };

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
      reconnectionAttempts: maxReconnectAttempts,
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
        boxes: [],
        keyCollected: false,
        playersAtDoor: [],
        gameStatus: "waiting",
      });
    };

    const onState = (state: GameState) => {
      setGameState(state);
      setConnectionError("");

      if (winTimerRef.current) {
        clearTimeout(winTimerRef.current);
        winTimerRef.current = null;
      }

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

    s.on("connect", () => {
      console.log("✅ Connected to server");
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionError("");
      reconnectAttempts.current = 0;
      s.emit("joinRoom", { roomCode: rc, playerId: pid });
    });

    s.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
      reconnectAttempts.current++;

      let userMessage = "Unable to connect to server";
      if (error.message?.includes("xhr poll error")) {
        userMessage = `Backend server not responding on ${SERVER_URL}`;
      } else if (error.message?.includes("websocket error")) {
        userMessage = "WebSocket connection failed - Check CORS";
      } else if (error.message?.includes("timeout")) {
        userMessage = "Connection timeout";
      }

      if (reconnectAttempts.current <= maxReconnectAttempts) {
        userMessage += ` (${reconnectAttempts.current}/${maxReconnectAttempts})`;
      }
      setConnectionError(userMessage);
    });

    s.on("disconnect", (reason) => {
      console.log("🔌 Disconnected:", reason);
      resetClientState();
      if (reason === "io server disconnect") {
        s.connect();
      }
    });

    s.on("reconnect_attempt", (attemptNumber) => {
      setIsReconnecting(true);
      setConnectionError(
        `Reconnecting... (${attemptNumber}/${maxReconnectAttempts})`,
      );
    });

    s.on("reconnect", (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setIsReconnecting(false);
      setConnectionError("");
      reconnectAttempts.current = 0;
      s.emit("joinRoom", { roomCode: rc, playerId: pid });
    });

    s.on("reconnect_failed", () => {
      console.error("❌ Reconnection failed");
      setIsReconnecting(false);
      setConnectionError(`Failed to reconnect`);

      setTimeout(() => {
        if (confirm("Серверт холбогдож чадсангүй. Lobby руу буцах уу?")) {
          router.push("/Home-page/Multiplayer/Lobby");
        }
      }, 1000);
    });

    s.on("error", (error: Error) => {
      console.error("❌ Socket error:", error);
    });

    s.on("gameState", onState);
    s.on("roomState", onState);

    s.on("joinDenied", (data: { message?: string }) => {
      alert(data.message || "Өрөөнд нэвтрэх боломжгүй");
      console.log(data.message);
      // router.push("/Home-page/Multiplayer/Lobby");
    });

    return () => {
      if (winTimerRef.current) {
        clearTimeout(winTimerRef.current);
      }
      s.off("connect");
      s.off("connect_error");
      s.off("disconnect");
      s.off("reconnect_attempt");
      s.off("reconnect");
      s.off("reconnect_failed");
      s.off("error");
      s.off("gameState");
      s.off("roomState");
      s.off("joinDenied");
      s.disconnect();
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
    if (!s?.connected || !roomCode) return;

    const interval = setInterval(() => {
      if (s.connected) {
        const input = getPlayerInput(keysPressed.current);
        s.emit("playerInput", input);
      }
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [roomCode, isConnected]);

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
    const boxes = gameState.boxes;

    if (playerId && gameState.players[playerId]) {
      const myPlayer = gameState.players[playerId];
      cameraRef.current = updateCamera(
        cameraRef.current,
        myPlayer,
        canvasSize.width,
      );
    }

    drawBackground(
      ctx,
      canvasSize.width,
      canvasSize.height,
      animTimer.current,
      cameraRef.current.x,
    );

    ctx.save();
    ctx.translate(-cameraRef.current.x, 0);

    drawGroundWorld3(ctx, canvasSize.height);
    drawPlatforms(ctx, platforms);

    if (gameImages.dangerButton) {
      drawDangerButtons(
        ctx,
        dangerButtons,
        animTimer.current,
        gameImages.dangerButton,
      );
    }

    if (gameImages.box) {
      drawBoxes(ctx, boxes, gameImages.box);
    }

    if (!gameState.keyCollected && gameImages.key) {
      const keyX = GAME_CONSTANTS.KEY_POSITION_WORLD3.x;
      const keyY = groundY + GAME_CONSTANTS.KEY_POSITION_WORLD3.y;
      const keyItem = {
        x: keyX,
        y: keyY,
        width: 30,
        height: 40,
        collected: false,
      };
      drawKey(ctx, keyItem, gameImages.key, animTimer.current);
    }

    if (gameImages.door) {
      const doorX = GAME_CONSTANTS.DOOR_POSITION_WORLD3.x;
      const doorY = groundY + GAME_CONSTANTS.DOOR_POSITION_WORLD3.y;
      const doorObject = {
        x: doorX,
        y: doorY,
        width: 55,
        height: 75,
      };
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
      gameState.playersAtDoor.length,
      boxes.length,
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
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-4">
            Loading World 3...
          </div>
          <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 animate-pulse w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Connecting screen
  if (!isConnected) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="text-center max-w-md px-4">
          <div className="text-4xl font-bold text-white mb-4">
            {isReconnecting ? "🔄 Reconnecting..." : "🔌 Connecting..."}
          </div>

          <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden mx-auto mb-4">
            <div className="h-full bg-yellow-500 animate-pulse w-full"></div>
          </div>

          {connectionError && (
            <div className="mt-4 p-4 bg-red-600/20 border border-red-500 rounded-lg">
              <p className="text-white text-sm mb-3">{connectionError}</p>
              <p className="text-gray-400 text-xs mb-3">
                Backend:{" "}
                {process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"}
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded transition-all"
                >
                  Retry
                </button>
                <button
                  onClick={() => router.push("/Home-page/Multiplayer/Lobby")}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-all"
                >
                  Exit
                </button>
              </div>
            </div>
          )}
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
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-black/80 px-6 py-3 rounded-lg">
          <p className="text-white text-lg">
            Room: <span className="font-bold text-yellow-400">{roomCode}</span>
          </p>
        </div>
      )}
      <div className="fixed top-4 left-4 flex items-center gap-2 bg-black/80 px-3 py-1 rounded text-xs">
        <div
          className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
        ></div>
        <span className="text-white">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {isReconnecting && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-4 py-2 rounded text-sm">
          🔄 Reconnecting...
        </div>
      )}
      <button
        onClick={() => router.push("/Home-page/Multiplayer/Lobby")}
        className="fixed top-4 right-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-all"
      >
        Exit
      </button>
    </div>
  );
};
export default MultiPlayerWorld3;
