"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";

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
import { updateCamera, Camera } from "@/app/utils/camera";
import { createPlatforms, GAME_CONSTANTS } from "@/app/utils/gameData";
import {
  loadAllImagesWorld2 as loadAllImages,
  getPlayerSprite,
  GameImages,
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
  drawBackgroundWorld1 as drawBackground,
  drawGroundWorld1 as drawGround,
  drawPlatforms,
} from "@/app/utils/World1Rendering";

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

const MultiPlayerWorld1 = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [gameState, setGameState] = useState<GameState>({
    players: {},
    keyCollected: false,
    playersAtDoor: [],
    gameStatus: "waiting",
  });
  const [roomId, setRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 700 });
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [gameImages, setGameImages] = useState<GameImages | null>(null);

  const keysPressed = useRef<Set<string>>(new Set());
  const animTimer = useRef(0);
  const cameraRef = useRef<Camera>({ x: 0, y: 0 });

  const groundY = canvasSize.height - GAME_CONSTANTS.GROUND_OFFSET;
  const platformsRef = useRef(createPlatforms(groundY));

  // ✅ NEW: Check if player can access World 2
  useEffect(() => {
    if (!canAccessWorld(2)) {
      alert("Та эхлээд World 1-ийг дуусгана уу!");
      navigate("/maps/world1");
    }
  }, [navigate]);

  // Load images
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
        console.error("Failed to load images:", error);
      });
  }, []);

  // Socket.IO connection
  useEffect(() => {
    const SERVER_URL =
      process.env.REACT_APP_SERVER_URL || "http://localhost:3001";

    const newSocket = io(SERVER_URL, {
      transports: ["websocket"],
      reconnection: true,
    });

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
      setPlayerId(newSocket.id || "");
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    newSocket.on("gameState", (state: GameState) => {
      setGameState(state);

      // ✅ NEW: Check if game was won and save progress
      if (state.gameStatus === "won") {
        // Navigate to next world after delay
        setTimeout(() => {
          const nextWorld = getNextWorld();
          if (nextWorld) {
            navigate(`/maps/world${nextWorld}`);
          } else {
            navigate("/"); // All worlds completed
          }
        }, 3000);
      }
    });

    newSocket.on(
      "playerJoined",
      (data: { playerId: string; playerCount: number }) => {
        console.log("Player joined:", data);
      },
    );

    newSocket.on(
      "playerLeft",
      (data: { playerId: string; playerCount: number }) => {
        console.log("Player left:", data);
      },
    );

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [navigate]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Send input to server
  useEffect(() => {
    if (!socket || !isConnected) return;

    const sendInput = () => {
      const input = getPlayerInput(keysPressed.current);
      socket.emit("playerInput", input);
    };

    const interval = setInterval(sendInput, 1000 / 60);
    return () => clearInterval(interval);
  }, [socket, isConnected]);

  // Keyboard handling
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

  // Game rendering loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameImages) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    animTimer.current++;

    const players = Object.values(gameState.players);
    const platforms = platformsRef.current;

    // Camera follow
    if (playerId && gameState.players[playerId]) {
      const myPlayer = gameState.players[playerId];
      cameraRef.current = updateCamera(
        cameraRef.current,
        myPlayer,
        canvasSize.width,
      );
    }

    // Draw background
    drawBackground(ctx, canvasSize.width, canvasSize.height);

    ctx.save();
    ctx.translate(-cameraRef.current.x, 0);

    // Draw ground and platforms
    drawGround(ctx, canvasSize.height);
    drawPlatforms(ctx, platforms);
    // Only draw danger buttons if image is loaded

    // Draw key - FIXED: Pass KeyItem object
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

    // Draw door - FIXED: Pass Door object
    if (gameImages.door) {
      const doorX = GAME_CONSTANTS.DOOR_POSITION.x;
      const doorY = groundY + GAME_CONSTANTS.DOOR_POSITION.y;
      const doorObject = {
        x: doorX,
        y: doorY,
        width: 60,
        height: 80,
      };
      drawDoor(ctx, doorObject, gameImages.door, gameState.keyCollected);
    }

    // Draw players
    players.forEach((player) => {
      if (player.dead) return;

      const playerImage = getPlayerSprite(
        gameImages,
        player.playerId,
        player.animFrame,
        player.facingRight,
      );

      if (playerImage && playerImage.complete) {
        ctx.save();

        // Highlight current player
        if (player.id === playerId) {
          ctx.shadowColor = "#FFD700";
          ctx.shadowBlur = 15;
        } else {
          ctx.shadowColor = player.color;
          ctx.shadowBlur = 8;
        }

        ctx.drawImage(
          playerImage,
          player.x,
          player.y,
          player.width,
          player.height,
        );
        ctx.restore();

        ctx.fillStyle = player.id === playerId ? "#FFD700" : player.color;
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          `P${player.playerId}`,
          player.x + player.width / 2,
          player.y - 10,
        );
      }
    });

    ctx.restore();

    // Draw UI
    drawUI(
      ctx,
      players.length,
      gameState.keyCollected,
      isConnected,
      canvasSize.height,
    );

    // Overlay screens
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

  // Room management functions
  const createRoom = () => {
    if (socket) {
      socket.emit("createRoom");
      socket.once("roomCreated", (data: { roomId: string }) => {
        setRoomId(data.roomId);
      });
    }
  };

  const joinRoom = () => {
    if (socket && roomId) {
      socket.emit("joinRoom", { roomId });
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit("leaveRoom");
      setRoomId("");
      setGameState({
        players: {},
        keyCollected: false,
        playersAtDoor: [],
        gameStatus: "waiting",
      });
    }
  };

  // Loading screen
  if (!imagesLoaded) {
    return (
      <div
        className="w-screen h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: "url('таны-зургийн-url-энд.jpg')" }}
      >
        {/* Зураг дээрх текстийг тод харагдуулахын тулд бага зэрэг бараан overlay нэмж болно */}
        <div className="absolute inset-0 bg-black/30"></div>

        <div className="text-center z-10">
          <div className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
            Loading World 2...
          </div>
          <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
            <div className="h-full bg-blue-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Connecting screen
  if (!isConnected) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-linear-to-b from-slate-800 to-slate-900">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-4">
            Connecting to server...
          </div>
          <div className="w-48 h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Room creation/joining screen
  if (gameState.gameStatus === "waiting" && !roomId) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-linear-to-b from-slate-800 to-slate-900">
        <h1 className="text-5xl font-bold text-white mb-8">
          🌙 World 2: Multiplayer
        </h1>
        <div className="flex flex-col gap-4">
          <button
            onClick={createRoom}
            className="px-10 py-5 bg-green-600 hover:bg-green-500 text-white font-bold text-2xl rounded-xl transition-all hover:scale-105 shadow-lg"
          >
            🎮 Create Room
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              className="px-4 py-3 text-xl rounded-lg text-black"
            />
            <button
              onClick={joinRoom}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl rounded-lg transition-all"
            >
              Join
            </button>
          </div>

          <button
            onClick={() => navigate("/")}
            className="px-10 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold text-xl rounded-xl transition-all"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-900">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="block"
      />

      {roomId && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-black/80 px-6 py-3 rounded-lg">
          <p className="text-white text-lg">
            Room ID: <span className="font-bold text-yellow-400">{roomId}</span>
          </p>
        </div>
      )}

      <button
        onClick={leaveRoom}
        className="fixed top-4 right-4 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all"
      >
        Leave Room
      </button>
    </div>
  );
};

export default MultiPlayerWorld1;
