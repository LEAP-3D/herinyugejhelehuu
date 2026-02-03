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
  players: Record<string, PlayerState>;
};

export default function LobbyPage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const [selected, setSelected] = useState<Hero>("jake");
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [meReady, setMeReady] = useState(false);
  const [err, setErr] = useState("");

  const roomCode =
    typeof window !== "undefined" ? localStorage.getItem("roomCode") : null;
  const playerId =
    typeof window !== "undefined" ? localStorage.getItem("playerId") : null;
  const maxPlayers =
    typeof window !== "undefined" ? localStorage.getItem("maxPlayers") : null;

  const isHost =
    typeof window !== "undefined"
      ? localStorage.getItem("isHost") === "true"
      : false;

  // ✅ taken heroes list
  const takenHeroes = useMemo(() => {
    const set = new Set<Hero>();
    if (!roomState) return set;
    Object.values(roomState.players).forEach((p) => {
      if (p.hero) set.add(p.hero);
    });
    return set;
  }, [roomState]);

  useEffect(() => {
    if (!roomCode || !playerId) return;

    const socket = io("http://localhost:4000");
    socketRef.current = socket;

    socket.emit("joinRoom", {
      roomCode,
      playerId,
      maxPlayers: Number(maxPlayers ?? 4),
    });

    socket.on("roomState", (state: RoomState) => {
      setRoomState(state);

      // ✅ өөрийн ready-г sync (чиний кодонд энэ дутаж байсан)
      const me = state.players[playerId];
      if (me) setMeReady(Boolean(me.ready));

      // ✅ өөрийн hero-г sync (сэргээх үед selected зөв болох)
      if (me?.hero) setSelected(me.hero);
    });

    // ✅ startGame сонсоод map руу шилжинэ
    socket.on("startGame", () => {
      router.push("/test-map");
    });

    socket.on("heroDenied", (e: any) => setErr(e?.message ?? "Hero taken"));
    socket.on("readyDenied", (e: any) =>
      setErr(e?.message ?? "Choose hero first"),
    );

    return () => {
      socket.off("roomState");
      socket.off("startGame");
      socket.off("heroDenied");
      socket.off("readyDenied");
      socket.disconnect();
    };
  }, [roomCode, playerId, maxPlayers, router]);

  const selectHero = (id: Hero) => {
    setErr("");
    setSelected(id);
    socketRef.current?.emit("selectHero", { hero: id });
  };

  const setReady = (ready: boolean) => {
    setErr("");
    socketRef.current?.emit("setReady", { ready });
  };

  // ✅ Host READY дарвал шууд start хүсэлт явуулна
  const hostStartNow = () => {
    setErr("");
    socketRef.current?.emit("startGameNow"); // ✅ шинэ event
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
    const isTakenBySomeone = takenHeroes.has(id);

    const meHero = roomState?.players?.[playerId ?? ""]?.hero;
    const disabled = isTakenBySomeone && meHero !== id;

    return (
      <button
        type="button"
        onClick={() => !disabled && selectHero(id)}
        disabled={disabled}
        className={`flex flex-col items-center ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
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
          Room: #{roomCode} • Players:{" "}
          {roomState ? Object.keys(roomState.players).length : 0}/
          {roomState?.maxPlayers ?? "?"}
          {isHost ? " • HOST" : ""}
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
          onClick={() => (isHost ? hostStartNow() : setReady(!meReady))}
          className="flex pt-[129px] transition active:translate-y-1"
        >
          <Image src="/PLAY BIUTTON6.png" alt="Ready" width={265} height={69} />
        </button>

        <div className="text-white/70 text-sm">
          {isHost
            ? "HOST: Press READY to start map"
            : meReady
              ? "✅ Ready! Waiting host..."
              : "Press READY after choosing hero"}
        </div>
      </div>
    </main>
  );
}
