"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { Loader2, Users, Hash, Gamepad2, ArrowRight } from "lucide-react";
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
  const [bgLoaded, setBgLoaded] = useState(false);
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

  useEffect(() => {
    const img = new Image();
    img.src = "/ariinzurag.png";
    const markReady = () => setBgLoaded(true);
    img.onload = markReady;
    img.onerror = markReady;
  }, []);

  const createRoom = useCallback(async () => {
    setErr("");
    setLoading(true);
    setRoomCodeUi("");
    setRoomState(null);
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
      socket.removeAllListeners();
      socket.disconnect();
    };

    socket.on("connect", () => {
      console.log("✅ socket connected:", socket.id);
      socket.emit("createRoom", { roomCode, maxPlayers: players, hostId });
    });

    socket.on("connect_error", (e) => {
      console.error("connect_error", e);
      fail(`Холболт амжилтгүй: ${e.message}`);
    });

    socket.on("createDenied", (reason: string) => {
      if (
        reason?.toLowerCase().includes("exist") ||
        reason?.toLowerCase().includes("taken")
      ) {
        console.warn("Room code давхцлаа, дахин оролдож байна...");
        socket.removeAllListeners();
        socket.disconnect();
        createResolvedRef.current = false;
        const newCode = genRoomCode();
        localStorage.setItem("roomCode", newCode);
        socket.emit("createRoom", {
          roomCode: newCode,
          maxPlayers: players,
          hostId,
        });
        return;
      }
      fail(`Өрөө үүсгэж чадсангүй: ${reason}`);
    });

    socket.on("roomState", (data: unknown) => {
      console.log("📦 roomState:", data);
      if (!isRoomState(data)) {
        console.error("roomState буруу формат:", data);
        return;
      }

      if (createResolvedRef.current) return;
      createResolvedRef.current = true;
      if (createTimerRef.current) clearTimeout(createTimerRef.current);

      localStorage.setItem("roomState", JSON.stringify(data));
      setRoomState(data);
      setRoomCodeUi(localStorage.getItem("roomCode") ?? "");
      setLoading(false);
    });

    createTimerRef.current = setTimeout(() => {
      fail("Холболт хэтэрсэн. Дахин оролдоно уу.");
    }, 12000);
  }, [players]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* ✅ ariinzurag.png background */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-300 ${
          bgLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: `url("/ariinzurag.png")` }}
      />
      <div className="absolute inset-0 bg-black/40" />
      {!bgLoaded && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
          <div className="flex items-center gap-3 text-white/90">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-display text-sm tracking-wider">
              LOADING BACKGROUND...
            </span>
          </div>
        </div>
      )}

      {/* Flip card styles */}
      <style>{`
        .flip-card { perspective: 600px; }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.4s cubic-bezier(.4,0,.2,1);
        }
        .flip-card:hover .flip-card-inner,
        .flip-card.selected .flip-card-inner {
          transform: rotateY(180deg);
        }
        .flip-card-front, .flip-card-back {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.75rem;
          font-weight: 700;
          font-size: 1.125rem;
          letter-spacing: 0.1em;
        }
        .flip-card-front {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.3);
          color: rgba(255,255,255,0.7);
        }
        .flip-card.selected .flip-card-front {
          background: rgba(255,255,255,0.2);
          border-color: rgba(255,255,255,0.8);
          color: white;
        }
        .flip-card-back {
          background: white;
          border: 1px solid white;
          color: black;
          transform: rotateY(180deg);
        }
      `}</style>

      {/* Main card */}
      <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-white/20 bg-black/50 p-8 backdrop-blur-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
            <Gamepad2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-wider text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            HOST ROOM
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Шинэ өрөө үүсгэж тоглоомоо эхлүүлнэ
          </p>
        </div>

        {/* Player count */}
        <div className="mb-6">
          <label className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-white/60">
            <Users className="h-4 w-4" />
            Тоглогчийн тоо
          </label>
          <div className="flex justify-center gap-4">
            {([2, 3, 4] as PCount[]).map((n) => (
              <button
                key={n}
                type="button"
                disabled={loading}
                onClick={() => !loading && setPlayers(n)}
                className={`flip-card cursor-pointer select-none disabled:pointer-events-none ${
                  players === n ? "selected" : ""
                }`}
                style={{ width: 80, height: 64 }}
              >
                <div className="flip-card-inner">
                  <div className="flip-card-front">{n}P</div>
                  <div className="flip-card-back">{n}P</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Room code display — shown after socket confirms */}
        {roomCodeUi && (
          <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-4 text-center">
            <div className="mb-1 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-widest text-white/50">
              <Hash className="h-3 w-3" />
              Room Code
            </div>
            <div className="font-display text-4xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              {roomCodeUi}
            </div>
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/15 py-3 font-display text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-white/25"
              onClick={() => router.push("/Home-page/Lobby/Join-Lobby")}
            >
              LOBBY РУУ ОРОХ
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Error */}
        {err && (
          <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/20 px-4 py-3 text-center text-sm text-red-200">
            {err}
          </div>
        )}

        {/* Create button — hide after room created */}
        {!roomCodeUi && (
          <button
            type="button"
            disabled={loading}
            onClick={createRoom}
            className="w-full rounded-xl border border-white/40 bg-white/10 py-4 font-display text-sm font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-white/20 hover:border-white/60 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                ҮҮСГЭЖ БАЙНА...
              </span>
            ) : (
              "ҮҮСГЭХ"
            )}
          </button>
        )}

        <p className="mt-4 text-center text-xs text-white/40">
          Үүсгэсний дараа Lobby руу орно. Room code-оо найздаа явуулна.
        </p>

        {/* Debug: player count */}
        {roomState && (
          <p className="mt-2 text-center text-xs text-white/25">
            тоглогчид: {Object.keys(roomState.players ?? {}).length}/
            {roomState.maxPlayers}
          </p>
        )}
      </div>
    </div>
  );
}
