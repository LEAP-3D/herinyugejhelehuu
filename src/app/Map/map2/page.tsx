// World2.tsx - Үндсэн тоглоомын компонент (Multiplayer) - ЗАСВАРЛАСАН
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

// Зургуудын импорт
import playerIdleImg from "@/app/assets/Finn.png";
import playerWalkImg from "@/app/assets/Finn-right.png";
import playerWalk2Img from "@/app/assets/Finn-left.png";
import player2IdleImg from "@/app/assets/Iceking.png";
import player2WalkImg from "@/app/assets/Iceking-right.png";
import player2Walk2Img from "@/app/assets/Ice-king-left.png";
import player3IdleImg from "@/app/assets/Jakeidle.png";
import player3WalkImg from "@/app/assets/Jake-right.png";
import player3Walk2Img from "@/app/assets/Jake-left.png";
import player4IdleImg from "@/app/assets/BMOidle.png";
import player4WalkImg from "@/app/assets/BMO-right.png";
import player4Walk2Img from "@/app/assets/BMO-left.png";
import keyImg from "@/app/assets/Keys.png";
import doorImg from "@/app/assets/Door.png";
import deathImg from "@/app/assets/Death.png";
import dangerButtonImg from "@/app/assets/Button.png";

// Модулиудын импорт
import {
  Player,
  Platform,
  DangerButton,
  Cloud,
  Key,
  Door,
  Camera,
  createPlatforms,
  createDangerButtons,
  createClouds,
} from "@/app/utils/gameDataWorld2";
import { ImageLoader } from "@/app/utils/imageLoaderWorld2";
import { InputHandler } from "@/app/utils/inputHandlerWorld2";
import { updateCamera } from "@/app/utils/cameraWorld2";
import {
  renderBackground,
  renderStars,
  renderMoon,
  renderClouds,
  renderGround,
  renderPlatforms,
  renderDangerButtons,
  renderDoor,
  renderKey,
  renderPlayers,
  renderHUD,
  renderControls,
  renderDeathScreen,
  updateClouds,
} from "@/app/utils/renderWorld2";
import {
  checkDangerButtonCollision,
  checkFallOffScreen,
} from "@/app/utils/physicsWorld2";
import {
  createGameSfxController,
  type GameSfxController,
} from "@/app/utils/gameSfx";

// Socket.IO types
interface GameState {
  players: { [key: string]: Player };
  keyCollected: boolean;
  playersAtDoor: number[];
  gameStatus: "waiting" | "playing" | "won" | "dead";
}

interface JoinDeniedPayload {
  message: string;
}

interface JoinSuccessPayload {
  roomCode: string;
  playerId: string | number;
  playerIndex?: number;
}
interface GameImages {
  [key: string]: HTMLImageElement;
}

const World2 = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameImages = useRef<GameImages | null>(null);
  const localPlayerSlotRef = useRef(1);
  const joinRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joinRetryCountRef = useRef(0);
  const rejoinAfterCreateRef = useRef(false);
  const playerNameByIdRef = useRef<Record<string, string>>({});

  // Socket state
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const recreateTriedRef = useRef(false);

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    players: {},
    keyCollected: false,
    playersAtDoor: [],
    gameStatus: "waiting",
  });
  const [hasKey, setHasKey] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 700 });
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [localDeath, setLocalDeath] = useState(false);
  const gameStateRef = useRef(gameState);
  const hasKeyRef = useRef(hasKey);
  const canvasSizeRef = useRef(canvasSize);
  const localDeathRef = useRef(localDeath);
  const sfxRef = useRef<GameSfxController | null>(null);
  const prevLocalPlayerRef = useRef<{ onGround: boolean } | null>(null);
  const prevShouldShowDeathRef = useRef(false);

  const animTimer = useRef(0);
  const winTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputHandler = useRef<InputHandler>(new InputHandler());
  const imageLoader = useRef(new ImageLoader());

  const groundY = canvasSize.height - 80;

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    hasKeyRef.current = hasKey;
  }, [hasKey]);

  useEffect(() => {
    canvasSizeRef.current = canvasSize;
  }, [canvasSize]);

  useEffect(() => {
    localDeathRef.current = localDeath;
  }, [localDeath]);

  useEffect(() => {
    sfxRef.current = createGameSfxController();
    return () => {
      sfxRef.current?.cleanup();
      sfxRef.current = null;
    };
  }, []);

  // Game objects
  const platformsRef = useRef<Platform[]>(createPlatforms(groundY));
  const dangerButtonsRef = useRef<DangerButton[]>(createDangerButtons(groundY));
  const cloudsRef = useRef<Cloud[]>(createClouds());
  const keyRef = useRef<Key>({
    x: 2400,
    y: groundY - 100,
    width: 40,
    height: 40,
    collected: false,
  });
  const doorRef = useRef<Door>({
    x: 4400,
    y: groundY - 120,
    width: 80,
    height: 120,
  });
  const cameraRef = useRef<Camera>({ x: 0, y: 0 });

  const nextLevelRoute = "/Home-page/Multiplayer";

  /**
   * ✅ WINDOW RESIZE
   */
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setCanvasSize({ width, height });
      const nextGroundY = height - 80;
      platformsRef.current = createPlatforms(nextGroundY);
      dangerButtonsRef.current = createDangerButtons(nextGroundY);
      keyRef.current = {
        ...keyRef.current,
        x: 2400,
        y: nextGroundY - 100,
      };
      doorRef.current = {
        ...doorRef.current,
        x: 4400,
        y: nextGroundY - 120,
      };
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /**
   * ✅ LOAD IMAGES
   */
  /**
   * ✅ LOAD IMAGES - FINAL FIX
   */
  useEffect(() => {
    const loader = new ImageLoader();

    loader
      .loadImages({
        // Player 1
        player1Idle: playerIdleImg.src,
        player1Right: playerWalkImg.src,
        player1Left: playerWalk2Img.src,

        // Player 2
        player2Idle: player2IdleImg.src,
        player2Right: player2WalkImg.src,
        player2Left: player2Walk2Img.src,

        // Player 3
        player3Idle: player3IdleImg.src,
        player3Right: player3WalkImg.src,
        player3Left: player3Walk2Img.src,

        // Player 4
        player4Idle: player4IdleImg.src,
        player4Right: player4WalkImg.src,
        player4Left: player4Walk2Img.src,

        // Others
        key: keyImg.src,
        door: doorImg.src,
        death: deathImg.src,
        dangerButton: dangerButtonImg.src,
      })
      .then((images) => {
        // Төрлийг нь локал интерфейс рүү хөрвүүлж онооно
        if (gameImages) {
          gameImages.current = images as unknown as GameImages;
        }
        setImagesLoaded(true);
        console.log("✅ Бүх зураг амжилттай ачаалагдлаа");
      })
      .catch((error) => {
        console.error("❌ Зураг ачаалахад алдаа гарлаа:", error);
      });
  }, []);
  /**
   * ✅ SOCKET CONNECTION
   */
  useEffect(() => {
    const SERVER_URL =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";
    const maxReconnectAttempts = 5;
    const maxJoinRetryAttempts = 8;
    const reconnectAttempts = { current: 0 };

    const rc = localStorage.getItem("roomCode")?.trim();
    const pid = localStorage.getItem("playerId")?.trim();
    const playerName = localStorage.getItem("playerName")?.trim();
    const isHost = localStorage.getItem("isHost") === "true";
    const maxPlayers = Number(localStorage.getItem("maxPlayers") ?? 2);

    if (!rc || !pid) {
      console.warn("⚠️ Missing room code or player ID");
      router.push("/Home-page/Multiplayer");
      return;
    }

    setRoomCode(rc);

    console.log("Attempting to connect to:", SERVER_URL);
    console.log("Room Code:", rc, "| Player ID:", pid);

    const s = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      withCredentials: true,
      autoConnect: true,
      forceNew: true,
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
      const mergedPlayers = Object.fromEntries(
        Object.entries(state.players ?? {}).map(([playerKey, playerValue]) => [
          playerKey,
          {
            ...playerValue,
            name:
              (typeof playerValue?.name === "string" && playerValue.name) ||
              playerNameByIdRef.current[playerKey] ||
              null,
          },
        ]),
      );

      console.log("📥 Received game state:", {
        playerCount: Object.keys(mergedPlayers).length,
        players: mergedPlayers,
        status: state.gameStatus,
      });

      setGameState({
        ...state,
        players: mergedPlayers,
      });
      setConnectionError("");
      setHasKey(state.keyCollected);

      if (winTimerRef.current) {
        clearTimeout(winTimerRef.current);
        winTimerRef.current = null;
      }

      if (state.gameStatus === "won") {
        winTimerRef.current = setTimeout(() => {
          router.push(nextLevelRoute);
        }, 3000);
      }
    };

    const onRoomState = (state?: {
      players?: Record<string, { name?: string | null }>;
    }) => {
      if (state?.players) {
        Object.entries(state.players).forEach(([playerKey, playerState]) => {
          if (typeof playerState?.name === "string" && playerState.name.trim()) {
            playerNameByIdRef.current[playerKey] = playerState.name.trim();
          }
        });
      }

      // Avoid join loops. Re-join only once after host-side room recreation.
      joinRetryCountRef.current = 0;
      if (joinRetryTimerRef.current) {
        clearTimeout(joinRetryTimerRef.current);
        joinRetryTimerRef.current = null;
      }
      if (recreateTriedRef.current && !rejoinAfterCreateRef.current) {
        rejoinAfterCreateRef.current = true;
        s.emit("joinRoom", { roomCode: rc, playerId: pid, name: playerName });
      }
    };

    s.on("connect", () => {
      console.log("✅ Connected to server with ID:", s.id);
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionError("");
      reconnectAttempts.current = 0;
      joinRetryCountRef.current = 0;

      console.log("📤 Emitting joinRoom:", {
        roomCode: rc,
        playerId: pid,
        name: playerName,
      });
      s.emit("joinRoom", { roomCode: rc, playerId: pid, name: playerName });
    });

    s.on("connect_error", (error: Error) => {
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

    s.on("disconnect", (reason: string) => {
      console.log("🔌 Disconnected:", reason);
      resetClientState();
      if (reason === "io server disconnect") {
        s.connect();
      }
    });

    s.on("reconnect_attempt", (attemptNumber: number) => {
      setIsReconnecting(true);
      setConnectionError(
        `Reconnecting... (${attemptNumber}/${maxReconnectAttempts})`,
      );
    });

    s.on("reconnect", (attemptNumber: number) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setIsReconnecting(false);
      setConnectionError("");
      reconnectAttempts.current = 0;
      joinRetryCountRef.current = 0;
      s.emit("joinRoom", { roomCode: rc, playerId: pid, name: playerName });
    });

    s.on("reconnect_failed", () => {
      console.error("❌ Reconnection failed");
      setIsReconnecting(false);
      setConnectionError(`Failed to reconnect`);

      setTimeout(() => {
        if (confirm("Серверт холбогдож чадсангүй. Lobby руу буцах уу?")) {
          router.push("/Home-page/Multiplayer");
        }
      }, 1000);
    });

    s.on("error", (error: Error) => {
      console.error("❌ Socket error:", error);
    });

    s.on("gameState", onState);
    s.on("roomState", onRoomState);

    s.on("joinDenied", (data: JoinDeniedPayload | string) => {
      const message =
        typeof data === "string"
          ? data
          : (data?.message ?? "Өрөөнд нэвтрэх боломжгүй");

      const shouldRecoverAsHost =
        isHost &&
        !recreateTriedRef.current &&
        /room not found/i.test(message) &&
        Boolean(rc) &&
        Boolean(pid);

      if (shouldRecoverAsHost) {
        recreateTriedRef.current = true;
        rejoinAfterCreateRef.current = false;
        s.emit("createRoom", {
          roomCode: rc,
          maxPlayers: Number.isFinite(maxPlayers) ? maxPlayers : 2,
          hostId: pid,
          playerName,
        });
        return;
      }

      if (/room not found/i.test(message)) {
        if (joinRetryCountRef.current < maxJoinRetryAttempts) {
          joinRetryCountRef.current += 1;
          setConnectionError(
            `Room syncing... retrying (${joinRetryCountRef.current}/${maxJoinRetryAttempts})`,
          );
          if (joinRetryTimerRef.current) clearTimeout(joinRetryTimerRef.current);
          joinRetryTimerRef.current = setTimeout(() => {
            s.emit("joinRoom", { roomCode: rc, playerId: pid, name: playerName });
          }, 600);
          return;
        }

        setConnectionError("Room not found. Returning to lobby...");
        setTimeout(() => router.push("/Home-page/Lobby/Join-Lobby"), 900);
        return;
      }

      console.error("❌ Join denied:", message);
      setConnectionError(message);
      setTimeout(() => router.push("/Home-page/Lobby/Join-Lobby"), 900);
    });

    s.on("joinSuccess", (data: JoinSuccessPayload) => {
      console.log("✅ Successfully joined room:", data);
      const numericId = Number(data?.playerIndex ?? data?.playerId);
      if (Number.isFinite(numericId) && numericId >= 1 && numericId <= 4) {
        localPlayerSlotRef.current = numericId;
      }
      joinRetryCountRef.current = 0;
      if (joinRetryTimerRef.current) {
        clearTimeout(joinRetryTimerRef.current);
        joinRetryTimerRef.current = null;
      }
      setConnectionError("");
    });

    return () => {
      if (winTimerRef.current) {
        clearTimeout(winTimerRef.current);
      }
      if (joinRetryTimerRef.current) {
        clearTimeout(joinRetryTimerRef.current);
        joinRetryTimerRef.current = null;
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
      s.off("joinSuccess");
      s.disconnect();
    };
  }, [router, nextLevelRoute]);

  /**
   * ✅ INPUT HANDLER - ЗАСВАРЛАСАН
   */
  useEffect(() => {
    const handler = inputHandler.current;
    let rafId: number | null = null;
    let tickId: ReturnType<typeof setInterval> | null = null;

    // Серверт input илгээх функц
    const sendInputToServer = () => {
      if (!socketRef.current || !isConnected) return;

      const pid = localStorage.getItem("playerId");
      if (!pid) return;

      const playerInput = handler.getUniversalInput();
      const playerSlot = localPlayerSlotRef.current;
      const roomCode = localStorage.getItem("roomCode");
      const inputPayload = {
        playerId: pid,
        playerIndex: playerSlot,
        roomCode,
        keys: playerInput,
        input: playerInput,
        timestamp: Date.now(),
      };

      // Send continuously so backend physics/collision updates every tick.
      socketRef.current.emit("playerInput", inputPayload);
    };

    // RequestAnimationFrame ашиглан debounce хийх
    const scheduleUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(sendInputToServer);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // InputHandler-д товчлуур дарагдсан гэдгийг мэдэгдэх
      handler.handleKeyDown(e);

      // Серверт илгээхийг товлох
      scheduleUpdate();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // InputHandler-д товчлуур суллагдсан гэдгийг мэдэгдэх
      handler.handleKeyUp(e);

      // Серверт илгээхийг товлох
      scheduleUpdate();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    tickId = setInterval(sendInputToServer, 1000 / 30);

    return () => {
      // Cleanup
      if (rafId) cancelAnimationFrame(rafId);
      if (tickId) clearInterval(tickId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      handler.clear(); // Бүх товчлуурыг цэвэрлэх
    };
  }, [isConnected]);

  /**
   * ✅ GAME LOOP (RENDERING ONLY)
   */
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const images = imageLoader.current.getImages();
    if (!canvas || !images) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;
    const currentCanvasSize = canvasSizeRef.current;
    const players = Object.values(state.players);
    const platforms = platformsRef.current;
    const dangerButtons = dangerButtonsRef.current;
    const clouds = cloudsRef.current;
    const key = keyRef.current;
    const door = doorRef.current;
    const camera = cameraRef.current;

    animTimer.current++;

    // Update clouds
    updateClouds(clouds);

    // Update camera (follow all players)
    if (players.length > 0) {
      updateCamera(camera, players, currentCanvasSize.width);
    }

    // Update key collected state
    key.collected = state.keyCollected;

    const localPlayerId = localStorage.getItem("playerId")?.trim();
    const localPlayer = localPlayerId
      ? state.players[localPlayerId]
      : undefined;
    const previousLocal = prevLocalPlayerRef.current;
    const jumpPressed = inputHandler.current.getUniversalInput().jump;
    const startedJump = !!(
      localPlayer &&
      previousLocal &&
      previousLocal.onGround &&
      !localPlayer.onGround &&
      localPlayer.vy < -0.5 &&
      jumpPressed &&
      !localPlayer.dead
    );
    if (startedJump) {
      sfxRef.current?.playJump();
    }

    const isDeadByWorldRules = localPlayer
      ? localPlayer.dead ||
        checkDangerButtonCollision(localPlayer, dangerButtons) ||
        checkFallOffScreen(localPlayer, currentCanvasSize.height)
      : false;
    const shouldShowDeath = state.gameStatus === "dead" || isDeadByWorldRules;
    if (shouldShowDeath && !prevShouldShowDeathRef.current) {
      sfxRef.current?.playDeath();
    }
    prevShouldShowDeathRef.current = shouldShowDeath;

    if (isDeadByWorldRules && !localDeathRef.current) {
      localDeathRef.current = true;
      setLocalDeath(true);
    }
    prevLocalPlayerRef.current = localPlayer
      ? { onGround: localPlayer.onGround }
      : null;

    // === RENDERING ===

    // Background
    renderBackground(ctx, currentCanvasSize.width, currentCanvasSize.height);

    // Stars
    renderStars(ctx, animTimer.current);

    // Moon
    renderMoon(ctx, currentCanvasSize.width);

    // Clouds (with parallax)
    renderClouds(ctx, clouds, camera);

    // World objects (with camera)
    renderGround(ctx, currentCanvasSize.height, camera);
    renderPlatforms(ctx, platforms, camera);
    renderDangerButtons(ctx, dangerButtons, images, camera);
    renderDoor(ctx, door, images, camera);
    renderKey(ctx, key, images, animTimer.current, camera);
    renderPlayers(ctx, players, images, camera);

    // UI (no camera transform)
    renderHUD(ctx, hasKeyRef.current, state.playersAtDoor.length);
    renderControls(ctx, currentCanvasSize.height);

    // Death screen
    if (shouldShowDeath) {
      renderDeathScreen(
        ctx,
        currentCanvasSize.width,
        currentCanvasSize.height,
        images,
      );
    }
  }, []);

  useEffect(() => {
    if (gameState.gameStatus !== "dead") {
      setLocalDeath(false);
    }
  }, [gameState.gameStatus]);

  /**
   * ✅ GAME LOOP INTERVAL
   */
  useEffect(() => {
    if (!imagesLoaded) return;

    let rafId = 0;
    const loop = () => {
      gameLoop();
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [gameLoop, imagesLoaded]);

  // Loading screen
  if (!imagesLoaded) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-linear-to-b from-slate-800 to-slate-900">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-4">
            Loading World 2...
          </div>
          <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-red-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Connection error screen
  if (connectionError && !isConnected) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-linear-to-b from-slate-800 to-slate-900">
        <div className="text-center">
          <div className="text-4xl font-bold text-red-500 mb-4">
            ❌ Connection Error
          </div>
          <div className="text-white text-xl mb-4">{connectionError}</div>
          <button
            onClick={() => router.push("/Home-page/Multiplayer")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen overflow-hidden bg-slate-900"
    >
      {/* Room Code display */}
      {roomCode && (
        <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold z-10">
          Room: {roomCode}
        </div>
      )}

      {/* Connection status */}
      {isReconnecting && (
        <div className="absolute top-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold z-10">
          🔄 Reconnecting...
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="block"
      />

      {gameState.gameStatus === "won" && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/80">
          <h2 className="text-6xl font-bold text-yellow-400 mb-6">
            Thanks for playing.
          </h2>
          <p className="text-white text-2xl mb-8">
            Stay tuned further development.
          </p>
          <p className="text-white text-lg">See you in the next update.</p>
        </div>
      )}
    </div>
  );
};

export default World2;
