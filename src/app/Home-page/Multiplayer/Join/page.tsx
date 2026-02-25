"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { Loader2 } from "lucide-react";
import { isRoomState } from "@/types/room";
import {
  getConnectionErrorMessage,
  hasLocalhostSocketMisconfig,
  resolveSocketUrl,
} from "@/app/utils/socketUrl";

export default function JoinPage() {
  const router = useRouter();

  const [roomCode, setRoomCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/ariinzurag.png";
    const markReady = () => setBgLoaded(true);
    img.onload = markReady;
    img.onerror = markReady;
  }, []);

  const join = () => {
    setErr("");

    const clean = roomCode.replace("#", "").trim();
    const previousName = (localStorage.getItem("playerName") || "").trim();
    const cleanName = (previousName || "Player").slice(0, 20);
    if (!clean) {
      setErr("Room code оруулна уу");
      return;
    }

    setLoading(true);

    const playerId = crypto.randomUUID();
    const socketUrl = resolveSocketUrl();
    if (hasLocalhostSocketMisconfig(socketUrl)) {
      setErr("Backend URL localhost гэж тохирсон байна. Deploy env-ээ шалгана уу.");
      setLoading(false);
      return;
    }
    let resolved = false;
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      timeout: 10000,
      reconnection: false,
      withCredentials: true,
    });

    const finishWithError = (message: string) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(joinTimer);
      setErr(message);
      setLoading(false);
      socket.disconnect();
    };

    const joinTimer = setTimeout(() => {
      finishWithError("Connection timeout. Please try again.");
    }, 12000);

    socket.on("connect", () => {
      socket.emit("joinRoom", { roomCode: clean, playerId, name: cleanName });
    });

    socket.on("connect_error", (e: { message?: string }) => {
      const rawMessage = e?.message ?? "Socket connection failed";
      finishWithError(getConnectionErrorMessage(rawMessage, socketUrl));
    });

    // ❌ join амжилтгүй
    socket.on("joinDenied", (e: { message?: string }) => {
      finishWithError(e?.message ?? "Join denied");
    });

    // ✅ join амжилттай (roomState ирвэл)
    socket.on("roomState", (data: unknown) => {
      if (!isRoomState(data)) return;
      if (resolved) return;
      resolved = true;
      clearTimeout(joinTimer);

      // localStorage хадгална
      localStorage.setItem("roomCode", clean);
      localStorage.setItem("playerId", playerId);
      localStorage.setItem("isHost", "false");
      localStorage.setItem("maxPlayers", String(data.maxPlayers));
      localStorage.setItem("playerName", cleanName);

      socket.disconnect();
      router.push("/Home-page/Lobby/join-lobby");
    });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black">
      {!bgLoaded && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
          <div className="flex items-center gap-3 text-white/90">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm tracking-wider">LOADING BACKGROUND...</span>
          </div>
        </div>
      )}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-300 ${
          bgLoaded ? "opacity-70" : "opacity-0"
        }`}
        style={{ backgroundImage: `url("/ariinzurag.png")` }}
      />

      <div className="relative z-10 w-255 max-w-[92vw] aspect-video flex flex-col items-center justify-center">
        <h1 className="text-white text-5xl tracking-widest drop-shadow">
          JOIN ROOM
        </h1>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="pixel-frame w-[320px] bg-black/55 p-3">
            <div className="mb-2 text-[12px] tracking-[0.2em] text-[#f3e7c6] uppercase">
              Room Code
            </div>
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="734554"
              className="pixel-input w-full bg-[#161616] px-3 py-2 text-lg text-[#f3e7c6] outline-none"
              style={{
                letterSpacing: "0.25em",
                fontFamily: '"Courier New", monospace',
              }}
              disabled={loading}
            />
          </div>

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
      <style jsx>{`
        .pixel-frame {
          position: relative;
          border: 4px solid #f3e7c6;
          box-shadow:
            0 0 0 4px #2b2b2b,
            0 8px 0 rgba(0, 0, 0, 0.45);
          image-rendering: pixelated;
          clip-path: polygon(
            0 6px,
            6px 6px,
            6px 0,
            calc(100% - 6px) 0,
            calc(100% - 6px) 6px,
            100% 6px,
            100% calc(100% - 6px),
            calc(100% - 6px) calc(100% - 6px),
            calc(100% - 6px) 100%,
            6px 100%,
            6px calc(100% - 6px),
            0 calc(100% - 6px)
          );
        }

        .pixel-input {
          border: 3px solid #f3e7c6;
          box-shadow:
            inset 0 0 0 2px #0b0b0b,
            0 4px 0 rgba(0, 0, 0, 0.35);
          clip-path: polygon(
            0 4px,
            4px 4px,
            4px 0,
            calc(100% - 4px) 0,
            calc(100% - 4px) 4px,
            100% 4px,
            100% calc(100% - 4px),
            calc(100% - 4px) calc(100% - 4px),
            calc(100% - 4px) 100%,
            4px 100%,
            4px calc(100% - 4px),
            0 calc(100% - 4px)
          );
        }
      `}</style>
    </div>
  );
}
