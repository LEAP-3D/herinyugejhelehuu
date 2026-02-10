"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { isRoomState } from "@/types/room";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

export default function JoinPage() {
  const router = useRouter();

  const [roomCode, setRoomCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const join = () => {
    setErr("");

    const clean = roomCode.replace("#", "").trim();
    if (!clean) {
      setErr("Room code оруулна уу");
      return;
    }

    setLoading(true);

    const playerId = crypto.randomUUID();
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    // 👉 join request
    socket.emit("joinRoom", { roomCode: clean, playerId });

    // ❌ join амжилтгүй
    socket.on("joinDenied", (e: { message?: string }) => {
      setErr(e?.message ?? "Join denied");
      setLoading(false);
      socket.disconnect();
    });

    // ✅ join амжилттай (roomState ирвэл)
    socket.on("roomState", (data: unknown) => {
      if (!isRoomState(data)) return;

      // localStorage хадгална
      localStorage.setItem("roomCode", clean);
      localStorage.setItem("playerId", playerId);
      localStorage.setItem("isHost", "false");

      socket.disconnect();
      router.push("/Home-page/Lobby/Host-Lobby");
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: `url("/ariinzurag.png")` }}
      />

      <div className="relative z-10 w-255 max-w-[92vw] aspect-video flex flex-col items-center justify-center">
        <h1 className="text-white text-5xl tracking-widest drop-shadow">
          JOIN ROOM
        </h1>

        <div className="mt-8 flex flex-col items-center gap-4">
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="Room code (ж: 734554)"
            className="w-[320px] px-4 py-3 rounded-md text-lg outline-none"
            disabled={loading}
          />

          {err && <div className="text-red-300">{err}</div>}

          <button
            onClick={join}
            disabled={loading}
            className="px-10 py-3 rounded-md bg-green-500 text-white text-xl disabled:opacity-60"
          >
            {loading ? "JOINING..." : "JOIN"}
          </button>

          <div className="text-white/70 text-sm">
            Host-ийн өгсөн code-оор Lobby руу орно.
          </div>
        </div>
      </div>
    </div>
  );
}
