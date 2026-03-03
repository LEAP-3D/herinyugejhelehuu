"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

import playerIdleImg from "@/app/assets/Finn.png";
import playerWalk1Img from "@/app/assets/Finn-right.png";
import playerWalk2Img from "@/app/assets/Finn-left.png";
import player2IdleImg from "@/app/assets/Iceking.png";
import player2Walk1Img from "@/app/assets/Iceking-right.png";
import player2Walk2Img from "@/app/assets/Ice-king-left.png";
import player3IdleImg from "@/app/assets/Jakeidle.png";
import player3RightImg from "@/app/assets/Jake-right.png";
import player3LeftImg from "@/app/assets/Jake-left.png";
import player4IdleImg from "@/app/assets/BMOidle.png";
import player4RightImg from "@/app/assets/BMO-right.png";
import player4LeftImg from "@/app/assets/BMO-left.png";
import doorImg from "@/app/assets/Door.png";
import deathImg from "@/app/assets/Death.png";
import keyImg from "@/app/assets/Keys.png";

import {
  Door,
  FallingPlatform,
  GameState,
  JoinDeniedPayload,
  JoinSuccessPayload,
  Key,
  MovingPlatform,
} from "@/app/utils/typesWorld1";
import { CameraController } from "@/app/utils/cameraWorld1";
import { GameData } from "@/app/utils/gameDataWorld1";
import { ImageLoader, GameImages } from "@/app/utils/imageLoaderWorld1";
import { InputHandler } from "@/app/utils/inputHandlerWorld1";
import { PhysicsEngine } from "@/app/utils/physicsWorld1";
import { Renderer } from "@/app/utils/renderWorld1";
import {
  createGameSfxController,
  type GameSfxController,
} from "@/app/utils/gameSfx";

const World1Multiplayer = () => {
interface GameStatePayload extends GameState {
    movingPlatforms?: MovingPlatform[];
    fallingPlatforms?: FallingPlatform[];
    key?: Key;
    door?: Door;
  }

  interface BufferedSnapshot {
    receivedAt: number;
    players: Record<string, GameState["players"][string]>;
  }

  const INTERPOLATION_DELAY_MS = 70;
  const MAX_SNAPSHOT_BUFFER = 40;

  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Multiplayer state
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [gameState, setGameState] = useState<GameState>({
    players: {},
    keyCollected: false,
    playersAtDoor: [],
    gameStatus: "waiting",
  });

  // Local game state
  const [hasKey, setHasKey] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 700 });
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [localDeath, setLocalDeath] = useState(false);
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);
  const gameStateRef = useRef(gameState);
  const hasKeyRef = useRef(hasKey);
  const canvasSizeRef = useRef(canvasSize);
  const localDeathRef = useRef(localDeath);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const winTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deathTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameImages = useRef<GameImages | null>(null);
  const recreateTriedRef = useRef(false);
  const rejoinAfterCreateRef = useRef(false);
  const localPlayerSlotRef = useRef(1);
  const joinRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joinRetryCountRef = useRef(0);
  const playerHeroByIdRef = useRef<Record<string, string>>({});
  const playerNameByIdRef = useRef<Record<string, string>>({});
  const sfxRef = useRef<GameSfxController | null>(null);
  const prevLocalPlayerRef = useRef<{ onGround: boolean } | null>(null);
  const prevShouldShowDeathRef = useRef(false);
  const smoothedPlayersRef = useRef<Record<string, GameState["players"][string]>>(
    {},
  );
  const snapshotBufferRef = useRef<BufferedSnapshot[]>([]);

  // Game systems
  const cameraController = useRef(new CameraController());
  const gameData = useRef(new GameData(canvasSize.height));
  const inputHandler = useRef(new InputHandler());
  const physicsEngine = useRef(new PhysicsEngine(inputHandler.current));
  const renderer = useRef<Renderer | null>(null);

  // Game objects
  const platformsRef = useRef(gameData.current.getPlatforms());
  const movingPlatformsRef = useRef(gameData.current.getMovingPlatforms());
  const fallingPlatformsRef = useRef(gameData.current.getFallingPlatforms());
  const cloudsRef = useRef(gameData.current.getClouds());
  const keyRef = useRef(gameData.current.getKey());
  const doorRef = useRef(gameData.current.getDoor());

  const groundY = gameData.current.getGroundY();

  const nextLevelRoute = "/Map/map2";
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
      snapshotBufferRef.current = [];
      setGameState({
        players: {},
        keyCollected: false,
        playersAtDoor: [],
        gameStatus: "waiting",
      });
    };

    const onState = (state: GameStatePayload) => {
      const mergedPlayers = Object.fromEntries(
        Object.entries(state.players ?? {}).map(([playerKey, playerValue]) => [
          playerKey,
          {
            ...playerValue,
            hero:
              playerValue?.hero ?? playerHeroByIdRef.current[playerKey] ?? null,
            name:
              (typeof playerValue?.name === "string" && playerValue.name) ||
              playerNameByIdRef.current[playerKey] ||
              null,
          },
        ]),
      );

      snapshotBufferRef.current.push({
        receivedAt: performance.now(),
        players: Object.fromEntries(
          Object.entries(mergedPlayers).map(([playerKey, playerValue]) => [
            playerKey,
            { ...playerValue },
          ]),
        ),
      });
      if (snapshotBufferRef.current.length > MAX_SNAPSHOT_BUFFER) {
        snapshotBufferRef.current.shift();
      }

      setGameState({
        ...state,
        players: mergedPlayers,
      });
      setConnectionError("");
      setHasKey(state.keyCollected);

      if (Array.isArray(state.movingPlatforms)) {
        movingPlatformsRef.current = state.movingPlatforms.map((platform) => ({
          ...platform,
        }));
      }
      if (Array.isArray(state.fallingPlatforms)) {
        fallingPlatformsRef.current = state.fallingPlatforms.map((platform) => ({
          ...platform,
        }));
      }
      if (state.key) {
        keyRef.current = {
          ...keyRef.current,
          ...state.key,
          collected: state.keyCollected,
        };
      }
      if (state.door) {
        doorRef.current = {
          ...doorRef.current,
          ...state.door,
        };
      }

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
      players?: Record<string, { hero?: string | null; name?: string | null }>;
    }) => {
      // Avoid join loops. Re-join only once after host-side room recreation.
      if (state?.players) {
        const nextHeroes: Record<string, string> = {};
        Object.entries(state.players).forEach(([playerKey, playerState]) => {
          if (typeof playerState?.hero === "string" && playerState.hero) {
            nextHeroes[playerKey] = playerState.hero;
          }
          if (typeof playerState?.name === "string" && playerState.name.trim()) {
            playerNameByIdRef.current[playerKey] = playerState.name.trim();
          }
        });
        if (Object.keys(nextHeroes).length > 0) {
          playerHeroByIdRef.current = {
            ...playerHeroByIdRef.current,
            ...nextHeroes,
          };
        }
      }

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
          level: "map1",
          world: 1,
        });
        return;
      }

      if (/room not found/i.test(message)) {
        if (joinRetryCountRef.current < maxJoinRetryAttempts) {
          joinRetryCountRef.current += 1;
          setConnectionError(
            `Room syncing... retrying (${joinRetryCountRef.current}/${maxJoinRetryAttempts})`,
          );
          if (joinRetryTimerRef.current)
            clearTimeout(joinRetryTimerRef.current);
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
      snapshotBufferRef.current = [];
      smoothedPlayersRef.current = {};
      s.disconnect();
    };
  }, [router, nextLevelRoute]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setCanvasSize({ width, height });
      gameData.current = new GameData(height);
      platformsRef.current = gameData.current.getPlatforms();
      movingPlatformsRef.current = gameData.current.getMovingPlatforms();
      fallingPlatformsRef.current = gameData.current.getFallingPlatforms();
      cloudsRef.current = gameData.current.getClouds();
      keyRef.current = gameData.current.getKey();
      doorRef.current = gameData.current.getDoor();
      if (renderer.current) {
        renderer.current.updateCanvasSize(
          width,
          height,
          gameData.current.getGroundY(),
        );
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load images - Simplified approach with proper typing
  useEffect(() => {
    const loader = new ImageLoader();

    loader
      .loadImages({
        player1Idle: playerIdleImg.src,
        player1Right: playerWalk1Img.src,
        player1Left: playerWalk2Img.src,
        player2Idle: player2IdleImg.src,
        player2Right: player2Walk1Img.src,
        player2Left: player2Walk2Img.src,
        player3Idle: player3IdleImg.src,
        player3Right: player3RightImg.src,
        player3Left: player3LeftImg.src,
        player4Idle: player4IdleImg.src,
        player4Right: player4RightImg.src,
        player4Left: player4LeftImg.src,
        key: keyImg.src,
        door: doorImg.src,
        death: deathImg.src,
      })
      .then((images: GameImages) => {
        gameImages.current = images;
        setImagesLoaded(true);
        console.log("✅ Бүх зураг амжилттай ачаалагдлаа");
      })
      .catch((error) => {
        console.error("❌ Зураг ачаалахад алдаа гарлаа:", error);
      });
  }, []);

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current || !imagesLoaded) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    renderer.current = new Renderer(
      ctx,
      canvasSize.width,
      canvasSize.height,
      groundY,
    );
  }, [canvasSize, groundY, imagesLoaded]);

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
        canvasHeight: canvasSizeRef.current.height,
        viewportHeight: window.innerHeight,
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
      handler.handleKeyDown(e);
      scheduleUpdate();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Escape") return;
      handler.handleKeyUp(e);
      scheduleUpdate();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    tickId = setInterval(sendInputToServer, 1000 / 50);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (tickId) clearInterval(tickId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);

      if (typeof handler.clear === "function") {
        handler.clear();
      } else if (typeof handler.cleanup === "function") {
        handler.cleanup();
      }
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
      canvasHeight: canvasSizeRef.current.height,
      viewportHeight: window.innerHeight,
      keys: { left: false, right: false, jump: false },
      input: { left: false, right: false, jump: false },
      timestamp: Date.now(),
    });
  }, [isPauseMenuOpen, isConnected]);

  /**
   * ✅ RENDER LOOP
   */
  const gameLoop = useCallback(() => {
    if (!renderer.current || !gameImages.current) return;

    const state = gameStateRef.current;
    const currentCanvasSize = canvasSizeRef.current;
    const localPlayerId = localStorage.getItem("playerId")?.trim() ?? "";
    const snapshotBuffer = snapshotBufferRef.current;
    const renderTimestamp = performance.now() - INTERPOLATION_DELAY_MS;
    while (
      snapshotBuffer.length >= 2 &&
      snapshotBuffer[1].receivedAt <= renderTimestamp
    ) {
      snapshotBuffer.shift();
    }

    let bufferedPlayers: Record<string, GameState["players"][string]> = {};
    if (snapshotBuffer.length >= 2) {
      const older = snapshotBuffer[0];
      const newer = snapshotBuffer[1];
      const windowMs = Math.max(1, newer.receivedAt - older.receivedAt);
      const t = Math.max(
        0,
        Math.min(1, (renderTimestamp - older.receivedAt) / windowMs),
      );
      const ids = new Set([
        ...Object.keys(older.players),
        ...Object.keys(newer.players),
      ]);

      ids.forEach((playerKey) => {
        const from = older.players[playerKey];
        const to = newer.players[playerKey];
        if (from && to) {
          bufferedPlayers[playerKey] = {
            ...to,
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
            vx: from.vx + (to.vx - from.vx) * t,
            vy: from.vy + (to.vy - from.vy) * t,
          };
          return;
        }
        if (to) bufferedPlayers[playerKey] = { ...to };
        else if (from) bufferedPlayers[playerKey] = { ...from };
      });
    } else if (snapshotBuffer.length === 1) {
      bufferedPlayers = Object.fromEntries(
        Object.entries(snapshotBuffer[0].players).map(([playerKey, playerValue]) => [
          playerKey,
          { ...playerValue },
        ]),
      );
    } else {
      bufferedPlayers = Object.fromEntries(
        Object.entries(state.players ?? {}).map(([playerKey, playerValue]) => [
          playerKey,
          { ...playerValue },
        ]),
      );
    }

    // Local player-г delay хийхгүй.
    if (localPlayerId && state.players?.[localPlayerId]) {
      bufferedPlayers[localPlayerId] = { ...state.players[localPlayerId] };
    }

    const smoothedPlayers = smoothedPlayersRef.current;
    const REMOTE_LERP = 0.45;
    const SNAP_DISTANCE = 120;
    const livePlayerIds = new Set<string>();

    Object.entries(bufferedPlayers).forEach(([playerKey, playerValue]) => {
      livePlayerIds.add(playerKey);
      if (playerKey === localPlayerId) {
        smoothedPlayers[playerKey] = { ...playerValue };
        return;
      }

      const previous = smoothedPlayers[playerKey];
      if (!previous) {
        smoothedPlayers[playerKey] = { ...playerValue };
        return;
      }

      const dx = playerValue.x - previous.x;
      const dy = playerValue.y - previous.y;
      const shouldSnap =
        Math.abs(dx) > SNAP_DISTANCE || Math.abs(dy) > SNAP_DISTANCE;

      smoothedPlayers[playerKey] = {
        ...playerValue,
        x: shouldSnap ? playerValue.x : previous.x + dx * REMOTE_LERP,
        y: shouldSnap ? playerValue.y : previous.y + dy * REMOTE_LERP,
      };
    });

    Object.keys(smoothedPlayers).forEach((playerKey) => {
      if (!livePlayerIds.has(playerKey)) {
        delete smoothedPlayers[playerKey];
      }
    });

    const players = Object.values(smoothedPlayers);
    const platforms = platformsRef.current;
    const movingPlatforms = movingPlatformsRef.current;
    const fallingPlatforms = fallingPlatformsRef.current;
    const clouds = cloudsRef.current;
    const key = keyRef.current;
    const door = doorRef.current;

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

    const isDeadByWorldRules = localPlayer
      ? localPlayer.dead || localPlayer.y > currentCanvasSize.height + 50
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

    physicsEngine.current.incrementAnimTimer();
    physicsEngine.current.updateClouds(clouds);

    if (players.length > 0) {
      cameraController.current.updateCamera(players, currentCanvasSize.width);
    }

    const camera = cameraController.current.getCamera();
    renderer.current.renderBackground();
    renderer.current.renderSun();
    renderer.current.renderClouds(clouds, camera);
    renderer.current.renderGround(camera);
    renderer.current.renderPlatforms(platforms, camera);
    renderer.current.renderMovingPlatforms(movingPlatforms, camera);
    renderer.current.renderFallingPlatforms(fallingPlatforms, camera);
    renderer.current.renderDoor(
      door,
      key.collected,
      gameImages.current,
      camera,
    );
    renderer.current.renderKey(
      key,
      physicsEngine.current.getAnimTimer(),
      gameImages.current,
      camera,
    );

    renderer.current.renderPlayers(players, gameImages.current, camera);
    renderer.current.renderHUD(hasKeyRef.current, state.playersAtDoor.length);
    renderer.current.renderControls();
    if (shouldShowDeath) {
      renderer.current.renderDeathScreen(gameImages.current);
    }
  }, []);

  useEffect(() => {
    if (gameState.gameStatus !== "dead") {
      setLocalDeath(false);
    }
  }, [gameState.gameStatus]);

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

  useEffect(() => {
    return () => {
      if (deathTimer.current) {
        clearTimeout(deathTimer.current);
        deathTimer.current = null;
      }
    };
  }, []);

  /**
   * ✅ LOADING SCREEN - FIXED TAILWIND CLASS
   */
  if (!imagesLoaded) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-linear-to-b from-blue-400 to-blue-200">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-4">Loading...</div>
          <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ✅ CONNECTION ERROR SCREEN - FIXED TAILWIND CLASS
   */
  if (connectionError && !isConnected) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-linear-to-b from-red-400 to-red-200">
        <div className="text-center bg-white/90 p-8 rounded-xl shadow-2xl max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Connection Error
          </h2>
          <p className="text-gray-700 mb-6">{connectionError}</p>
          <button
            onClick={() => router.push("/Home-page/Multiplayer")}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-all"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }
  return (
    <div ref={containerRef} className="w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="block"
      />

      {isReconnecting && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-6 py-3 rounded-full shadow-lg">
          🔄 Reconnecting...
        </div>
      )}

      {gameState.gameStatus === "won" && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/70">
          <h2 className="text-6xl font-bold text-yellow-400 mb-6">
            🎉 All 4 Players Won!
          </h2>
          <p className="text-white text-2xl mb-8">Epic teamwork!</p>
          <p className="text-white text-lg">Moving to next world...</p>
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

export default World1Multiplayer;
