"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { isRoomState } from "@/types/room";
import type { RoomState } from "@/types/room";

type PCount = 2 | 3 | 4;
const SOCKET_URL = "http://localhost:4000";

function genRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function HostPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<PCount>(2);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [roomCodeUi, setRoomCodeUi] = useState("");
  const [, setRoom] = useState<RoomState | null>(null);

  const createRoom = async () => {
    setErr("");
    setLoading(true);

    try {
      const roomCode = genRoomCode();
      const hostId = crypto.randomUUID();

      // localStorage хадгална
      localStorage.setItem("roomCode", roomCode);
      localStorage.setItem("playerId", hostId);
      localStorage.setItem("maxPlayers", String(players));
      localStorage.setItem("isHost", "true");

      // ✅ socket-оор room үүсгэнэ
      const socket = io(SOCKET_URL);
      socket.emit("createRoom", {
        roomCode,
        maxPlayers: players,
        hostId,
      });

      // createDenied ирэх магадлалтай (code давхцвал)
      socket.on("roomState", (data: unknown) => {
        if (isRoomState(data)) setRoom(data as RoomState);
      });
      // roomState ирмэгц lobby руу орно
      socket.once("roomState", () => {
        // ✅ disconnect хийхгүй
        setRoomCodeUi(`#${roomCode}`);
        router.push("/Home-page/Multiplayer/Lobby");
      });
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  };

  const pillClass = (active: boolean) =>
    `px-6 py-2 text-white text-xl tracking-widest ${
      active ? "opacity-100" : "opacity-60"
    }`;

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-black">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{ backgroundImage: `url("/image 12 (4).png")` }}
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
      </div>
    </div>
  );
}
