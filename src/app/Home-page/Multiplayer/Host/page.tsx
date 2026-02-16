"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { isRoomState } from "@/types/room";
import type { RoomState } from "@/types/room";

type PCount = 2 | 3 | 4;

function genRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function HostPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<PCount>(2);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [roomCodeUi, setRoomCodeUi] = useState("");

  const [roomState, setRoomState] = useState<RoomState | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const createTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createResolvedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (createTimerRef.current) clearTimeout(createTimerRef.current);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const createRoom = async () => {
    setErr("");
    setLoading(true);
    createResolvedRef.current = false;

    const roomCode = genRoomCode();
    const hostId = crypto.randomUUID();

    localStorage.setItem("roomCode", roomCode);
    localStorage.setItem("playerId", hostId);
    localStorage.setItem("maxPlayers", String(players));
    localStorage.setItem("isHost", "true");

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (createTimerRef.current) clearTimeout(createTimerRef.current);

    const SOCKET_URL =
      process.env.NEXT_PUBLIC_BACKEND_URL ??
      process.env.NEXT_PUBLIC_SOCKET_URL ??
      "http://localhost:4000";

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      timeout: 10000,
      reconnection: false,
      withCredentials: true,
    });

    socketRef.current = socket;

    const fail = (msg: string) => {
      if (createResolvedRef.current) return;
      createResolvedRef.current = true;
      if (createTimerRef.current) clearTimeout(createTimerRef.current);
      setErr(msg);
      setLoading(false);
      socket.disconnect();
    };

    socket.on("connect", () => {
      console.log("✅ socket connected:", socket.id);

      socket.emit("createRoom", {
        roomCode,
        maxPlayers: players,
        hostId,
      });
    });

    socket.on("connect_error", (e) => {
      console.error("connect_error", e);
      fail(e.message);
    });

    socket.on("createDenied", (reason: string) => {
      fail(`Create denied: ${reason}`);
    });

    socket.on("roomState", (data: unknown) => {
      console.log("📦 roomState:", data);
      if (!isRoomState(data)) return;

      if (createResolvedRef.current) return;
      createResolvedRef.current = true;
      if (createTimerRef.current) clearTimeout(createTimerRef.current);
      setRoomState(data);
      setRoomCodeUi(`#${roomCode}`);
      setLoading(false);
      router.push("/Home-page/Lobby/Join-Lobby");
    });

    createTimerRef.current = setTimeout(() => {
      fail("Connection timeout. Please try again.");
    }, 12000);
  };

  const pillClass = (active: boolean) =>
    `px-6 py-2 text-white text-xl tracking-widest ${
      active ? "opacity-100" : "opacity-60"
    }`;

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-black">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: `url("/ariinzurag.png")` }}
      />

      <div className="relative z-10 w-255 max-w-[92vw] aspect-video flex flex-col items-center justify-center">
        <h1 className="text-white text-5xl tracking-widest drop-shadow">
          HOST ROOM
        </h1>

        <div className="mt-6 flex gap-10">
          <button
            onClick={() => setPlayers(2)}
            className={pillClass(players === 2)}
          >
            2P
          </button>
          <button
            onClick={() => setPlayers(3)}
            className={pillClass(players === 3)}
          >
            3P
          </button>
          <button
            onClick={() => setPlayers(4)}
            className={pillClass(players === 4)}
          >
            4P
          </button>
        </div>

        {roomCodeUi && (
          <div className="mt-8 text-white text-2xl tracking-widest">
            {roomCodeUi}
          </div>
        )}

        {err && <div className="mt-3 text-red-300">{err}</div>}

        <button
          onClick={createRoom}
          disabled={loading}
          className="mt-10 px-10 py-3 rounded-md bg-blue-500 text-white text-xl disabled:opacity-60"
        >
          {loading ? "CREATING..." : "CREATE"}
        </button>

        <div className="mt-4 text-white/70 text-sm">
          Create дармагц Lobby руу орно. Room code-оо найздаа явуулна.
        </div>

        {/* optional: debug display (remove anytime) */}
        {roomState && (
          <div className="mt-3 text-white/60 text-xs">
            players: {Object.keys(roomState.players ?? {}).length}/
            {roomState.maxPlayers}
          </div>
        )}
      </div>
    </div>
  );
}
//jahsgdjhasgdjhagd
