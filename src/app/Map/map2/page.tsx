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
import {
  resolveSocketUrl,
  getConnectionErrorMessage,
  hasLocalhostSocketMisconfig,
} from "@/app/utils/socketUrl";

// Socket.IO types
interface GameState {
  players: { [key: string]: Player };
  keyCollected: boolean;
  playersAtDoor: number[];
  gameStatus: "waiting" | "playing" | "won" | "dead";
  key?: Omit<Key, "collected">;
  door?: Door;
  dangerButtons?: DangerButton[];
}

interface JoinDeniedPayload {
  message: string;
}

interface JoinSuccessPayload {
  roomCode: string;
  playerId: string | number;
  playerIndex?: number;
}
const World2 = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);
  const gameStateRef = useRef(gameState);
  const hasKeyRef = useRef(hasKey);
  const canvasSizeRef = useRef(canvasSize);
  const localDeathRef = useRef(localDeath);
  const sfxRef = useRef<GameSfxController | null>(null);
  const prevLocalPlayerRef = useRef<{ onGround: boolean } | null>(null);
  const prevShouldShowDeathRef = useRef(false);
  const smoothedPlayersRef = useRef<Record<string, Player>>({});

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
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.repeat) return;
      e.preventDefault();
      setIsPauseMenuOpen((prev) => !prev);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

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
    y: groundY - 160,
    width: 40,
    height: 40,
    collected: false,
  });
  const doorRef = useRef<Door>({
    x: 4400,
    y: groundY - 80,
    width: 80,
    height: 120,
  });
  const cameraRef = useRef<Camera>({ x: 0, y: 0 });

  const nextLevelRoute = "/Home-page/Multiplayer";
  const handleExitGame = useCallback(() => {
    socketRef.current?.disconnect();
    [
      "roomCode",
      "playerId",
      "isHost",
      "maxPlayers",
      "playerName",
      "selectedLevel",
    ].forEach((key) => localStorage.removeItem(key));
    setIsPauseMenuOpen(false);
    router.push("/");
  }, [router]);

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
        y: nextGroundY - 160,
      };
      doorRef.current = {
        ...doorRef.current,
        x: 4400,
        y: nextGroundY - 80,
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
    const loader = imageLoader.current;

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
      .then(() => {
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
    const SERVER_URL = resolveSocketUrl();
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

    if (hasLocalhostSocketMisconfig(SERVER_URL)) {
      setConnectionError(
        "Socket URL is pointing to localhost in production. Set NEXT_PUBLIC_BACKEND_URL.",
      );
      return;
    }

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
      smoothedPlayersRef.current = {};
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

      let userMessage = getConnectionErrorMessage(
        error.message || "Unable to connect to server",
        SERVER_URL,
      );

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
          level: "map2",
          world: 2,
          canvasHeight: canvasSizeRef.current.height,
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
      if (!socketRef.current || !isConnected || isPauseMenuOpen) return;

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
      if (e.key === "Escape") return;
      // InputHandler-д товчлуур дарагдсан гэдгийг мэдэгдэх
      handler.handleKeyDown(e);

      // Серверт илгээхийг товлох
      scheduleUpdate();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") return;
      // InputHandler-д товчлуур суллагдсан гэдгийг мэдэгдэх
      handler.handleKeyUp(e);

      // Серверт илгээхийг товлох
      scheduleUpdate();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    tickId = setInterval(sendInputToServer, 1000 / 20);

    return () => {
      // Cleanup
      if (rafId) cancelAnimationFrame(rafId);
      if (tickId) clearInterval(tickId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      handler.clear(); // Бүх товчлуурыг цэвэрлэх
    };
  }, [isConnected, isPauseMenuOpen]);

  useEffect(() => {
    if (!isPauseMenuOpen || !socketRef.current || !isConnected) return;

    const pid = localStorage.getItem("playerId");
    if (!pid) return;

    const roomCode = localStorage.getItem("roomCode");
    socketRef.current.emit("playerInput", {
      playerId: pid,
      playerIndex: localPlayerSlotRef.current,
      roomCode,
      keys: { left: false, right: false, jump: false },
      input: { left: false, right: false, jump: false },
      timestamp: Date.now(),
    });
  }, [isPauseMenuOpen, isConnected]);

  /**
   * ✅ GAME LOOP (RENDERING ONLY)
   */
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const images = imageLoader.current.getImages();
    if (!canvas || !images) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const state = gameStateRef.current;
    const currentCanvasSize = canvasSizeRef.current;
    const localPlayerId = localStorage.getItem("playerId")?.trim() ?? "";
    const serverPlayerEntries = Object.entries(state.players ?? {});
    const smoothedPlayers = smoothedPlayersRef.current;

    const LERP_PRESET: "tight" | "smooth" = "tight";
    const LIVE_LERP = LERP_PRESET === "tight" ? 0.28 : 0.18;
    const SNAP_DISTANCE = 120;

    const livePlayerIds = new Set<string>();
    for (const [playerKey, playerValue] of serverPlayerEntries) {
      livePlayerIds.add(playerKey);

      if (playerKey === localPlayerId) {
        smoothedPlayers[playerKey] = { ...playerValue };
        continue;
      }

      const previous = smoothedPlayers[playerKey];
      if (!previous) {
        smoothedPlayers[playerKey] = { ...playerValue };
        continue;
      }

      const dx = playerValue.x - previous.x;
      const dy = playerValue.y - previous.y;
      const shouldSnap = Math.abs(dx) > SNAP_DISTANCE || Math.abs(dy) > SNAP_DISTANCE;

      smoothedPlayers[playerKey] = {
        ...playerValue,
        x: shouldSnap ? playerValue.x : previous.x + dx * LIVE_LERP,
        y: shouldSnap ? playerValue.y : previous.y + dy * LIVE_LERP,
      };
    }

    Object.keys(smoothedPlayers).forEach((playerKey) => {
      if (!livePlayerIds.has(playerKey)) {
        delete smoothedPlayers[playerKey];
      }
    });

    const players = Object.values(smoothedPlayers);
    const syncedDangerButtons =
      Array.isArray(state.dangerButtons) && state.dangerButtons.length > 0
        ? state.dangerButtons
        : dangerButtonsRef.current;
    const dangerButtons = syncedDangerButtons;
    const clouds = cloudsRef.current;
    const key = state.key
      ? {
          ...keyRef.current,
          ...state.key,
          collected: state.keyCollected,
        }
      : keyRef.current;
    const door = state.door
      ? {
          ...doorRef.current,
          ...state.door,
        }
      : doorRef.current;
    const inferredGroundTop = door.y + door.height;
    const platforms = [
      {
        x: 0,
        y: inferredGroundTop,
        width: 8200,
        height: 20,
      },
    ];
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

    const hitDangerButton = localPlayer
      ? checkDangerButtonCollision(localPlayer, dangerButtons)
      : false;
    const fellOffScreen = localPlayer
      ? checkFallOffScreen(localPlayer, currentCanvasSize.height)
      : false;
    const isDeadByWorldRules = localPlayer
      ? localPlayer.dead || hitDangerButton || fellOffScreen
      : false;
    const shouldShowDeath = state.gameStatus === "dead" || isDeadByWorldRules;
    if (shouldShowDeath && !prevShouldShowDeathRef.current) {
      sfxRef.current?.playDeath(hitDangerButton ? "danger" : "normal");
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
    renderGround(ctx, currentCanvasSize.height, camera, inferredGroundTop);
    renderPlatforms(ctx, platforms, camera);
    renderDangerButtons(ctx, dangerButtons, images, camera);
    renderDoor(ctx, door, images, camera);
    renderKey(ctx, key, images, animTimer.current, camera);
    renderPlayers(ctx, players, images, camera);

    // UI (no camera transform)
    renderHUD(ctx, hasKeyRef.current, state.playersAtDoor.length);

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

      {isPauseMenuOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4">
          <div
            className="w-[min(94vw,560px)] border-4 border-[#f3e38d] bg-[#1d2438] p-6 shadow-[0_0_0_4px_#0f1320,8px_8px_0_0_#05070c]"
            style={{
              fontFamily:
                '"Press Start 2P","VT323","Courier New",monospace',
              imageRendering: "pixelated",
            }}
          >
            <div className="mb-5 border-2 border-[#0f1320] bg-[#11172a] p-3 text-center text-[10px] tracking-[0.22em] text-[#f8e98f] [text-shadow:2px_2px_0_#000]">
              GAME PAUSED
            </div>
            <h2 className="mb-8 text-center text-xl font-black tracking-[0.16em] text-[#7cf5ff] [text-shadow:3px_3px_0_#000]">
              PAUSE MENU
            </h2>
            <div className="space-y-4">
              <button
                onClick={() => setIsPauseMenuOpen(false)}
                className="w-full border-2 border-[#9fffff] bg-[#0f7b8f] px-4 py-3 text-center text-sm font-extrabold tracking-[0.16em] text-white shadow-[4px_4px_0_0_#053440] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_0_#053440]"
              >
                RESUME
              </button>
              <button
                onClick={() => router.push("/Home-page/Multiplayer")}
                className="w-full border-2 border-[#ffc0c0] bg-[#8f1f2f] px-4 py-3 text-center text-sm font-extrabold tracking-[0.16em] text-white shadow-[4px_4px_0_0_#4a0b15] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_0_#4a0b15]"
              >
                MAIN MENU
              </button>
              <button
                onClick={handleExitGame}
                className="w-full border-2 border-[#ffd6b0] bg-[#8b4c17] px-4 py-3 text-center text-sm font-extrabold tracking-[0.16em] text-white shadow-[4px_4px_0_0_#4b2507] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_0_#4b2507]"
              >
                EXIT GAME
              </button>
            </div>
            <p className="mt-6 text-center text-[10px] font-bold tracking-[0.12em] text-[#cbd5ff]">
              PRESS ESC TO CLOSE
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default World2;
