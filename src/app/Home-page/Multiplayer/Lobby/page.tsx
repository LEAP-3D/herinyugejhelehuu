"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

type Hero = "finn" | "jake" | "ice" | "bmo";
type PlayerState = { hero: Hero | null; ready: boolean };

type RoomState = {
  roomCode: string;
  maxPlayers: number;
  hostId: string;
  started: boolean;
  players: Record<string, PlayerState>;
};

const SOCKET_URL = "http://localhost:4000";

export default function LobbyPage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  // ✅ localStorage-г SSR үед уншихгүй (hydration error-оос хамгаална)
  const [mounted, setMounted] = useState(false);
  const [roomCodeLS, setRoomCodeLS] = useState<string | null>(null);
  const [playerIdLS, setPlayerIdLS] = useState<string | null>(null);
  const [maxPlayersLS, setMaxPlayersLS] = useState<string | null>(null);
  const [isHostLS, setIsHostLS] = useState(false);

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [selected, setSelected] = useState<Hero>("jake");
  const [meReady, setMeReady] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setMounted(true);
    setRoomCodeLS(localStorage.getItem("roomCode"));
    setPlayerIdLS(localStorage.getItem("playerId"));
    setMaxPlayersLS(localStorage.getItem("maxPlayers"));
    setIsHostLS(localStorage.getItem("isHost") === "true");
  }, []);

  // taken heroes
  const takenHeroes = useMemo(() => {
    const set = new Set<Hero>();
    if (!roomState) return set;
    Object.values(roomState.players).forEach((p) => {
      if (p.hero) set.add(p.hero);
    });
    return set;
  }, [roomState]);

  useEffect(() => {
    if (!mounted) return;
    if (!roomCodeLS || !playerIdLS) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      // ✅ lobby орж ирмэгц joinRoom явуулна
      socket.emit("joinRoom", { roomCode: roomCodeLS, playerId: playerIdLS });
    });

    socket.on("roomState", (state: RoomState) => {
      setRoomState(state);

      const me = state.players[playerIdLS];
      if (me) {
        setMeReady(Boolean(me.ready));
        if (me.hero) setSelected(me.hero);
      }
    });

    socket.on("heroDenied", (e: any) => setErr(e?.message ?? "Hero taken"));
    socket.on("readyDenied", (e: any) =>
      setErr(e?.message ?? "Choose hero first"),
    );
    socket.on("joinDenied", (e: any) => setErr(e?.message ?? "Join denied"));
    socket.on("startDenied", (e: any) => setErr(e?.message ?? "Start denied"));

    socket.on("startGame", () => {
      router.push("/test-map");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [mounted, roomCodeLS, playerIdLS, router]);

  const selectHero = (id: Hero) => {
    setErr("");
    socketRef.current?.emit("selectHero", { hero: id });
  };

  const toggleReady = () => {
    setErr("");
    socketRef.current?.emit("setReady", { ready: !meReady });
  };

  const hostStart = () => {
    setErr("");
    socketRef.current?.emit("startGameNow");
  };

  const HeroCard = ({
    id,
    img,
    label,
  }: {
    id: Hero;
    img: string;
    label: string;
  }) => {
    const isSelected = selected === id;

    const myHero = roomState?.players?.[playerIdLS ?? ""]?.hero ?? null;
    const disabled = takenHeroes.has(id) && myHero !== id;

    return (
      <button
        type="button"
        onClick={() => !disabled && selectHero(id)}
        disabled={disabled}
        className={`flex flex-col items-center ${
          disabled ? "opacity-40 cursor-not-allowed" : ""
        }`}
      >
        <div
          className={`relative w-[150px] h-[150px] ${
            isSelected ? "outline outline-[6px] outline-lime-400" : ""
          }`}
        >
          <Image src={img} alt={label} fill className="object-contain" />

          {isSelected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lime-400 font-joystix text-[20px]">
                SELECTED
              </span>
            </div>
          )}

          {disabled && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-red-300 font-joystix text-[18px]">
                TAKEN
              </span>
            </div>
          )}
        </div>

        <div
          style={{ fontFamily: "Joystix" }}
          className="text-white text-center text-[46px] font-normal leading-normal"
        >
          {label}
        </div>
      </button>
    );
  };

  const playersCount = roomState ? Object.keys(roomState.players).length : 0;

  // ✅ SSR/CSR mismatch-оос зайлсхийх
  if (!mounted) return null;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 pointer-events-none"
        style={{ backgroundImage: `url("/image 12 (4).png")` }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center pt-[190px] justify-start gap-6">
        <p
          style={{ fontFamily: "Joystix" }}
          className="text-white font-joystix text-[64px] font-normal leading-normal"
        >
          Choose your hero.
        </p>

        <div className="text-white/80">
          Room: #{roomCodeLS ?? "?"} • Players: {playersCount}/
          {roomState?.maxPlayers ?? maxPlayersLS ?? "?"}
          {isHostLS ? " • HOST" : ""}
        </div>

        {err && <div className="text-red-300">{err}</div>}

        <div className="flex flex-row pt-[123px] gap-[70px]">
          <div className="pr-[40px]">
            <HeroCard id="finn" img="/hero1.png" label="FINN" />
          </div>
          <HeroCard id="jake" img="/hero2.png" label="JAKE" />
          <HeroCard id="ice" img="/hero3.png" label="ICE KING" />
          <HeroCard id="bmo" img="/hero4.png" label="BMO" />
        </div>

        {/* READY / START */}
        <button
          type="button"
          onClick={() => (isHostLS ? hostStart() : toggleReady())}
          className="flex pt-[129px] transition active:translate-y-1"
        >
          <Image src="/PLAY BIUTTON6.png" alt="Ready" width={265} height={69} />
        </button>

        <div className="text-white/70 text-sm">
          {isHostLS
            ? "HOST: Press to start (everyone must pick hero)"
            : meReady
              ? "✅ Ready! Waiting host..."
              : "Press READY after choosing hero"}
        </div>
      </div>
    </main>
  );
}
