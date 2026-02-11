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
  playerId: string;
}
interface GameImages {
  [key: string]: HTMLImageElement;
}

const World2 = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameImages = useRef<GameImages | null>(null);

  // Socket state
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [roomCode, setRoomCode] = useState("");

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

  const animTimer = useRef(0);
  const winTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputHandler = useRef<InputHandler>(new InputHandler());
  const imageLoader = useRef(new ImageLoader());

  const groundY = canvasSize.height - 80;

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

  // Get next world helper
  const getNextWorld = () => {
    const currentWorld = 2;
    const totalWorlds = 3;
    return currentWorld < totalWorlds ? currentWorld + 1 : null;
  };

  /**
   * ✅ WINDOW RESIZE
   */
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setCanvasSize({ width, height });
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
    const reconnectAttempts = { current: 0 };

    const rc = localStorage.getItem("roomCode")?.trim();
    const pid = localStorage.getItem("playerId")?.trim();

    if (!rc || !pid) {
      console.warn("⚠️ Missing room code or player ID");
      router.push("/Home-page/Multiplayer/Lobby");
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
      console.log("📥 Received game state:", {
        playerCount: Object.keys(state.players).length,
        players: state.players,
        status: state.gameStatus,
      });

      setGameState(state);
      setConnectionError("");
      setHasKey(state.keyCollected);

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
      console.log("✅ Connected to server with ID:", s.id);
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionError("");
      reconnectAttempts.current = 0;

      console.log("📤 Emitting joinRoom:", { roomCode: rc, playerId: pid });
      s.emit("joinRoom", { roomCode: rc, playerId: pid });
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

    s.on("joinDenied", (data: JoinDeniedPayload) => {
      console.error("❌ Join denied:", data.message);
      alert(data.message || "Өрөөнд нэвтрэх боломжгүй");
      router.push("/Home-page/Multiplayer/Lobby");
    });

    s.on("joinSuccess", (data: JoinSuccessPayload) => {
      console.log("✅ Successfully joined room:", data);
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
      s.off("joinSuccess");
      s.disconnect();
    };
  }, [router]);

  /**
   * ✅ INPUT HANDLER - ЗАСВАРЛАСАН
   */
  useEffect(() => {
    const handler = inputHandler.current;

    // Сүүлд илгээсэн input-ыг хадгалах (давхардал илгээхгүй байхын тулд)
    let lastSentInput = { left: false, right: false, jump: false };
    let rafId: number | null = null;

    // Серверт input илгээх функц
    const sendInputToServer = () => {
      if (!socketRef.current || !isConnected) return;

      const pid = localStorage.getItem("playerId");
      if (!pid) return;

      const playerInput = handler.getPlayerInput(parseInt(pid));

      // Зөвхөн өөрчлөлт байвал илгээх (bandwidth хэмнэх)
      if (JSON.stringify(playerInput) !== JSON.stringify(lastSentInput)) {
        socketRef.current.emit("playerMove", {
          playerId: pid,
          input: playerInput,
        });
        lastSentInput = { ...playerInput };
      }
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

    return () => {
      // Cleanup
      if (rafId) cancelAnimationFrame(rafId);
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

    const players = Object.values(gameState.players);
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
      updateCamera(camera, players, canvasSize.width);
    }

    // Update key collected state
    key.collected = gameState.keyCollected;

    // === RENDERING ===

    // Background
    renderBackground(ctx, canvasSize.width, canvasSize.height);

    // Stars
    renderStars(ctx, animTimer.current);

    // Moon
    renderMoon(ctx, canvasSize.width);

    // Clouds (with parallax)
    renderClouds(ctx, clouds, camera);

    // World objects (with camera)
    renderGround(ctx, canvasSize.height, camera);
    renderPlatforms(ctx, platforms, camera);
    renderDangerButtons(ctx, dangerButtons, images, camera);
    renderDoor(ctx, door, images, camera);
    renderKey(ctx, key, images, animTimer.current, camera);
    renderPlayers(ctx, players, images, camera);

    // UI (no camera transform)
    renderHUD(ctx, hasKey, gameState.playersAtDoor.length);
    renderControls(ctx, canvasSize.height);

    // Death screen
    if (gameState.gameStatus === "dead") {
      renderDeathScreen(ctx, canvasSize.width, canvasSize.height, images);
    }
  }, [gameState, hasKey, canvasSize]);

  /**
   * ✅ GAME LOOP INTERVAL
   */
  useEffect(() => {
    if (!imagesLoaded) return;

    const interval = setInterval(gameLoop, 1000 / 60);
    return () => clearInterval(interval);
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
            onClick={() => router.push("/Home-page/Multiplayer/Lobby")}
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
            🎉 Level Complete!
          </h2>
          <p className="text-white text-2xl mb-8">
            All 4 players avoided the deadly buttons!
          </p>
          <p className="text-white text-lg">Moving to next world...</p>
        </div>
      )}
    </div>
  );
};

export default World2;
