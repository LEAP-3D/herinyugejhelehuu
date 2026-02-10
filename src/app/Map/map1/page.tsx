import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

import playerIdleImg from "@/app/assets/Finn.png";
import playerWalk1Img from "@/app/assets/Finn-right.png";
import playerWalk2Img from "@/app/assets/Finn-left.png";
import player2IdleImg from "@/app/assets/Iceking.png";
import player2Walk1Img from "@/app/assets/Iceking-right.png";
import player2Walk2Img from "@/app/assets/Ice-king-left.png";
import player3IdleImg from "@/app/assets/JakeidIe.png";
import player3RightImg from "@/app/assets/Jake-right.png";
import player3LeftImg from "@/app/assets/Jake-left.png";
import player4IdleImg from "@/app/assets/BMOidle.png";
import player4RightImg from "@/app/assets/BMO-right.png";
import player4LeftImg from "@/app/assets/BMO-left.png";
import doorImg from "@/app/assets/Door.png";
import deathImg from "@/app/assets/Death.png";
import keyImg from "@/app/assets/Keys.png"
import {
  GameState,
  JoinDeniedPayload,
  JoinSuccessPayload,
} from "@/app/utils/typesWorld1";
import { CameraController } from "@/app/utils/cameraWorld1";
import { GameData } from "@/app/utils/gameDataWorld1";
import { ImageLoader, GameImages } from "@/app/utils/imageLoaderWorld1";
import { InputHandler } from "@/app/utils/inputHandlerWorld1";
import  {PhysicsEngine}  from "@/app/utils/physicsWorld1";
import { Renderer } from "@/app/utils/renderWorld1";

const World1Multiplayer = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Multiplayer state
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);  
  const [connectionError, setConnectionError] = useState("");
  const [roomCode, setRoomCode] = useState("");
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

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const winTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deathTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameImages = useRef<GameImages | null>(null);


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

  // Helper: Get next world
  const getNextWorld = () => {
    const currentWorld = 1;
    const maxWorlds = 3;
    return currentWorld < maxWorlds ? currentWorld + 1 : null;
  };

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


    console.log("🔌 Attempting to connect to:", SERVER_URL);
    console.log("📝 Room Code:", rc, "| Player ID:", pid);

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
        `Reconnecting... (${attemptNumber}/${maxReconnectAttempts})`
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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setCanvasSize({ width, height });
      gameData.current = new GameData(height);
      if (renderer.current) {
        renderer.current.updateCanvasSize(
          width,
          height,
          gameData.current.getGroundY()
        );
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load images
  useEffect(() => {
    const loader = new ImageLoader();
    loader
      .loadImages({
        playerIdle: playerIdleImg,
        playerWalk1: playerWalk1Img,
        playerWalk2: playerWalk2Img,
        player2Idle: player2IdleImg,
        player2Walk1: player2Walk1Img,
        player2Walk2: player2Walk2Img,
        player3Idle: player3IdleImg,
        player3Right: player3RightImg,
        player3Left: player3LeftImg,
        player4Idle: player4IdleImg,
        player4Right: player4RightImg,
        player4Left: player4LeftImg,
        key: keyImg,
        door: doorImg,
        death: deathImg,
      })
      .then((images: GameImages) => {
        gameImages.current = images;
        setImagesLoaded(true);
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
      groundY
    );
  }, [canvasSize, groundY, imagesLoaded]);

  // Initialize input handler
  useEffect(() => {
    const handler = inputHandler.current;
    handler.init();
    return () => {
      handler.cleanup();
    };
  }, []);
  /**
   * ✅ RENDER LOOP
   */
  const gameLoop = useCallback(() => {
    if (!renderer.current || !gameImages.current) return;

    const players = Object.values(gameState.players);
    const platforms = platformsRef.current;
    const movingPlatforms = movingPlatformsRef.current;
    const fallingPlatforms = fallingPlatformsRef.current;
    const clouds = cloudsRef.current;
    const key = keyRef.current;
    const door = doorRef.current;

    // Update key collected state
    key.collected = gameState.keyCollected;

    // Update local animations
    physicsEngine.current.incrementAnimTimer();
    physicsEngine.current.updateClouds(clouds);
    physicsEngine.current.updateMovingPlatforms(movingPlatforms);
    physicsEngine.current.updateFallingPlatforms(fallingPlatforms);

    // Update camera to follow players
    if (players.length > 0) {
      cameraController.current.updateCamera(players, canvasSize.width);
    }

    // Render everything
    const camera = cameraController.current.getCamera();
    renderer.current.renderBackground();
    renderer.current.renderSun();
    renderer.current.renderClouds(clouds, camera);
    renderer.current.renderGround(camera);
    renderer.current.renderPlatforms(platforms, camera);
    renderer.current.renderMovingPlatforms(movingPlatforms, camera);
    renderer.current.renderFallingPlatforms(fallingPlatforms, camera);
    renderer.current.renderDoor(door, key.collected, gameImages.current, camera);
    renderer.current.renderKey(
      key,
      physicsEngine.current.getAnimTimer(),
      gameImages.current,
      camera
    );
    renderer.current.renderPlayers(players, gameImages.current, camera);
    renderer.current.renderHUD(hasKey, gameState.playersAtDoor.length);
    renderer.current.renderControls();

    if (gameState.gameStatus === "dead") {
      renderer.current.renderDeathScreen(gameImages.current);
    }
  }, [gameState, canvasSize, hasKey]);

  // Game loop
  useEffect(() => {
    if (!imagesLoaded) return;

    const interval = setInterval(gameLoop, 1000 / 60);
    return () => clearInterval(interval);
  }, [gameLoop, imagesLoaded]);

  // Cleanup death timer
 useEffect(() => {
  return () => {
    if (deathTimer.current) {
      clearTimeout(deathTimer.current);
      deathTimer.current = null; 
    }
  };
}, []);
  /**
   * ✅ LOADING SCREEN
   */
  if (!imagesLoaded) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-blue-400 to-blue-200">
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
   * ✅ CONNECTION ERROR SCREEN
   */
  if (connectionError && !isConnected) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-red-400 to-red-200">
        <div className="text-center bg-white/90 p-8 rounded-xl shadow-2xl max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Connection Error
          </h2>
          <p className="text-gray-700 mb-6">{connectionError}</p>
          <button
            onClick={() => router.push("/Home-page/Multiplayer/Lobby")}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-all"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  /**
   * ✅ WAITING FOR PLAYERS
   */
  if (gameState.gameStatus === "waiting") {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-blue-400 to-blue-200">
        <div className="text-center bg-white/90 p-8 rounded-xl shadow-2xl">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Waiting for players...
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            Room Code: <span className="font-bold">{roomCode}</span>
          </p>
          <p className="text-lg text-gray-600">
            Players: {Object.keys(gameState.players).length} / 4
          </p>
        </div>
      </div>
    );
  }
  /**
   * ✅ GAME CANVAS
   */
  return (
    <div ref={containerRef} className="w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="block"
      />

      {/* Connection Status */}
      {isReconnecting && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-6 py-3 rounded-full shadow-lg">
          🔄 Reconnecting...
        </div>
      )}

      {/* Win Screen */}
      {gameState.gameStatus === "won" && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/70">
          <h2 className="text-6xl font-bold text-yellow-400 mb-6">
            🎉 All 4 Players Won!
          </h2>
          <p className="text-white text-2xl mb-8">Epic teamwork!</p>
          <p className="text-white text-lg">Moving to next world...</p>
        </div>
      )}
    </div>
  );
};

export default World1Multiplayer;