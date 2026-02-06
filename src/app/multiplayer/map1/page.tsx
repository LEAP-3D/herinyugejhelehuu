"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";

type GameStatus = "waiting" | "playing" | "won" | "dead";

interface Player {
  id: string;
  playerId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  facingRight: boolean;
  animFrame: number;
  color: string;
  dead: boolean;
}

interface GameState {
  players: Record<string, Player>;
  keyCollected: boolean;
  playersAtDoor: string[];
  gameStatus: GameStatus;
}

const SERVER_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export default function MultiPlayerWorld1() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string>("");
  const [playerId, setPlayerId] = useState<string>("");

  const [gameState, setGameState] = useState<GameState>({
    players: {},
    keyCollected: false,
    playersAtDoor: [],
    gameStatus: "waiting",
  });

  // ✅ Lobby-ийн мэдээллээр map дээр join хийнэ
  useEffect(() => {
    const rc = localStorage.getItem("roomCode");
    const pid = localStorage.getItem("playerId");

    if (!rc || !pid) {
      router.push("/Home-page/Multiplayer/Lobby");
      return;
    }

    setRoomCode(rc);
    setPlayerId(pid);

    socketRef.current = io(SERVER_URL, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      setConnected(true);
      socketRef.current?.emit("joinRoom", { roomCode: rc, playerId: pid });
    });

    socketRef.current.on("disconnect", () => setConnected(false));

    socketRef.current.on("joinDenied", () => {
      router.push("/Home-page/Multiplayer/Lobby");
    });

    socketRef.current.on("gameState", (state: GameState) => {
      setGameState(state);
    });

    return () => {
      socketRef.current?.off("connect");
      socketRef.current?.off("disconnect");
      socketRef.current?.off("joinDenied");
      socketRef.current?.off("gameState");
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [router]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#2b3640";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("MULTIPLAYER MAP", canvas.width / 2, 60);

    ctx.font = "16px Arial";
    ctx.fillText(
      `Room: #${roomCode} | Connected: ${connected ? "YES" : "NO"} | Players: ${Object.keys(gameState.players).length}`,
      canvas.width / 2,
      95,
    );

    for (const p of Object.values(gameState.players)) {
      ctx.fillStyle = p.id === playerId ? "#FFD700" : "#ffffff";
      ctx.fillRect(p.x, p.y, p.width, p.height);

      ctx.fillStyle = "#000";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`P${p.playerId}`, p.x + p.width / 2, p.y - 6);
    }

    if (gameState.gameStatus === "waiting") {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "Waiting for players...",
        canvas.width / 2,
        canvas.height / 2,
      );
    }
  }, [connected, roomCode, playerId, gameState]);

  useEffect(() => {
    const onResize = () => {
      const c = canvasRef.current;
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const t = setInterval(draw, 1000 / 60);
    return () => clearInterval(t);
  }, [draw]);

  return (
    <div className="w-screen h-screen overflow-hidden">
      <canvas ref={canvasRef} className="block" />

      <button
        onClick={() => router.push("/Home-page/Multiplayer/Lobby")}
        className="fixed top-4 right-4 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg"
      >
        Exit
      </button>
    </div>
  );
}
