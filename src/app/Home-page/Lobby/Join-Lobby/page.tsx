"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";

type Hero = "finn" | "jake" | "ice" | "bmo";
type PlayerState = { hero: Hero | null; ready: boolean; name?: string };
type RoomState = {
  roomCode: string;
  maxPlayers: number;
  players: Record<string, PlayerState>;
};
type GameStateEvent = {
  gameStatus?: "waiting" | "playing" | "won" | "dead" | string;
};

type SocketErr = { message?: string };

const SOCKET_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  "http://localhost:4000";

export default function LobbyPage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  const [selected, setSelected] = useState<Hero>("jake");
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [meReady, setMeReady] = useState(false);
  const [err, setErr] = useState("");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const playerNameRef = useRef("");
  const [isHost, setIsHost] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const recreateTriedRef = useRef(false);

  const getErrMessage = useCallback((e: unknown, fallback: string) => {
    if (typeof e === "string") return e;
    if (e && typeof e === "object" && "message" in e) {
      const msg = (e as SocketErr).message;
      if (typeof msg === "string" && msg.trim()) return msg;
    }
    return fallback;
  }, []);

  const takenHeroes = useMemo(() => {
    const set = new Set<Hero>();
    if (!roomState) return set;
    Object.values(roomState.players).forEach((p) => {
      if (p.hero) set.add(p.hero);
    });
    return set;
  }, [roomState]);

  const heroDisplayNames = useMemo(() => {
    const labels: Record<Hero, string> = {
      finn: "FINN",
      jake: "JAKE",
      ice: "ICE KING",
      bmo: "BMO",
    };

    if (!roomState) return labels;

    Object.values(roomState.players).forEach((player) => {
      if (!player.hero) return;
      const name = player.name?.trim();
      if (name) labels[player.hero] = name.slice(0, 14);
    });

    const myLocalName = playerName.trim();
    if (myLocalName) {
      labels[selected] = myLocalName.slice(0, 14);
    }

    return labels;
  }, [roomState, playerName, selected]);

  useEffect(() => {
    setRoomCode(localStorage.getItem("roomCode"));
    setPlayerId(localStorage.getItem("playerId"));
    setPlayerName(localStorage.getItem("playerName") ?? "");
    setIsHost(localStorage.getItem("isHost") === "true");
    recreateTriedRef.current = false;
    setHydrated(true);
  }, []);

  useEffect(() => {
    playerNameRef.current = playerName;
  }, [playerName]);

  useEffect(() => {
    if (!hydrated) return;
    if (!roomCode || !playerId) {
      setErr("Room info missing. Please create or join room again.");
      router.push("/Home-page/Multiplayer");
      return;
    }

    // ✅ socket local variable ашиглахгүй (lint алдаа гарахгүй)
    socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });

    const onConnect = () => {
      const cleanName = playerNameRef.current.trim().slice(0, 20);
      socketRef.current?.emit("joinRoom", {
        roomCode,
        playerId,
        name: cleanName || undefined,
      });
      if (cleanName) {
        socketRef.current?.emit("setPlayerName", {
          roomCode,
          playerId,
          name: cleanName,
        });
      }
    };

    const onRoomState = (state: RoomState) => {
      const meFromServer = state.players[playerId];
      const cleanName = playerNameRef.current.trim().slice(0, 20);
      const mergedState =
        meFromServer && cleanName && !meFromServer.name?.trim()
          ? {
              ...state,
              players: {
                ...state.players,
                [playerId]: {
                  ...meFromServer,
                  name: cleanName,
                },
              },
            }
          : state;

      setRoomState(mergedState);

      const me = mergedState.players[playerId];
      if (me) setMeReady(Boolean(me.ready));
      if (me?.hero) setSelected(me.hero);
    };

    const onStartGame = () => {
      router.push("/Map/map1");
    };

    const onGameState = (state: GameStateEvent) => {
      if (state?.gameStatus === "playing") {
        router.push("/Map/map1");
      }
    };

    const onHeroDenied = (e: unknown) => {
      setErr(getErrMessage(e, "Hero taken"));
    };

    const onReadyDenied = (e: unknown) => {
      setErr(getErrMessage(e, "Choose hero first"));
    };

    const onCreateDenied = (e: unknown) => {
      setErr(getErrMessage(e, "Unable to create room"));
    };

    const onJoinDenied = (e: unknown) => {
      const message = getErrMessage(e, "Unable to join room");
      const shouldRecoverAsHost =
        isHost &&
        !recreateTriedRef.current &&
        /room not found/i.test(message) &&
        Boolean(roomCode) &&
        Boolean(playerId);

      if (shouldRecoverAsHost) {
        recreateTriedRef.current = true;
        const maxPlayers = Number(localStorage.getItem("maxPlayers") ?? 2);
        socketRef.current?.emit("createRoom", {
          roomCode,
          maxPlayers: Number.isFinite(maxPlayers) ? maxPlayers : 2,
          hostId: playerId,
        });
        return;
      }

      setErr(message);
    };

    const onConnectError = (e: unknown) => {
      setErr(getErrMessage(e, "Socket connection failed"));
    };

    socketRef.current.on("connect", onConnect);
    socketRef.current.on("roomState", onRoomState);
    socketRef.current.on("startGame", onStartGame);
    socketRef.current.on("gameState", onGameState);
    socketRef.current.on("heroDenied", onHeroDenied);
    socketRef.current.on("readyDenied", onReadyDenied);
    socketRef.current.on("createDenied", onCreateDenied);
    socketRef.current.on("joinDenied", onJoinDenied);
    socketRef.current.on("connect_error", onConnectError);

    return () => {
      socketRef.current?.off("connect", onConnect);
      socketRef.current?.off("roomState", onRoomState);
      socketRef.current?.off("startGame", onStartGame);
      socketRef.current?.off("gameState", onGameState);
      socketRef.current?.off("heroDenied", onHeroDenied);
      socketRef.current?.off("readyDenied", onReadyDenied);
      socketRef.current?.off("createDenied", onCreateDenied);
      socketRef.current?.off("joinDenied", onJoinDenied);
      socketRef.current?.off("connect_error", onConnectError);
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [hydrated, roomCode, playerId, isHost, router, getErrMessage]);

  useEffect(() => {
    const cleanName = playerName.trim().slice(0, 20);
    localStorage.setItem("playerName", cleanName);
    if (cleanName && socketRef.current) {
      socketRef.current.emit("setPlayerName", {
        roomCode,
        playerId,
        name: cleanName,
      });
    }
  }, [playerName, roomCode, playerId]);

  const selectHero = (id: Hero) => {
    setErr("");
    setSelected(id);
    socketRef.current?.emit("selectHero", { roomCode, playerId, hero: id });
  };

  const setReady = (ready: boolean) => {
    setErr("");

    const meHero = roomState?.players?.[playerId ?? ""]?.hero;
    if (ready && !meHero) {
      // Re-send selected hero first to avoid backend race where hero is not yet recorded.
      socketRef.current?.emit("selectHero", {
        roomCode,
        playerId,
        hero: selected,
      });
      setTimeout(() => {
        socketRef.current?.emit("setReady", { roomCode, playerId, ready });
      }, 120);
      return;
    }

    socketRef.current?.emit("setReady", { roomCode, playerId, ready });
  };

  const hostStartNow = () => {
    setErr("");
    socketRef.current?.emit("setReady", { roomCode, playerId, ready: true });
    socketRef.current?.emit("startGameNow");
    socketRef.current?.emit("startGame");
  };

  const HeroCard = ({
    id,
    img,
    heroLabel,
    displayName,
  }: {
    id: Hero;
    img: string;
    heroLabel: string;
    displayName: string;
  }) => {
    const isSelected = selected === id;
    const isTakenBySomeone = takenHeroes.has(id);

    return (
      <button
        type="button"
        onClick={() => selectHero(id)}
        className="flex flex-col items-center"
      >
        <div
          className={`relative w-37.5 h-37.5 ${
            isSelected ? "outline-[6px] outline-lime-400" : ""
          }`}
        >
          <Image src={img} alt={heroLabel} fill className="object-contain" />
          {isSelected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lime-400 font-joystix text-[20px]">
                SELECTED
              </span>
            </div>
          )}
          {isTakenBySomeone && !isSelected && (
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
          {displayName}
        </div>
      </button>
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 pointer-events-none"
        style={{ backgroundImage: `url("/ariinzurag.png")` }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center pt-47.5 justify-start gap-6">
        <p
          style={{ fontFamily: "Joystix" }}
          className="text-white font-joystix text-[64px] font-normal leading-normal"
        >
          Choose your hero.
        </p>

        <div className="text-white/80">
          Room: #{roomCode ?? "..."} • Players:{" "}
          {roomState ? Object.keys(roomState.players).length : 0}/
          {roomState?.maxPlayers ?? "?"}
          {isHost ? " • HOST" : ""}
        </div>

        <input
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Your display name"
          className="w-[320px] px-4 py-2 rounded-md text-black outline-none"
          maxLength={20}
        />

        {err && <div className="text-red-300">{err}</div>}

        <div className="flex flex-row pt-30.75 gap-17.5">
          <div className="pr-10">
            <HeroCard
              id="finn"
              img="/Finn.png"
              heroLabel="FINN"
              displayName={heroDisplayNames.finn}
            />
          </div>
          <HeroCard
            id="jake"
            img="/Jake.png"
            heroLabel="JAKE"
            displayName={heroDisplayNames.jake}
          />
          <HeroCard
            id="ice"
            img="/Ice-king.png"
            heroLabel="ICE KING"
            displayName={heroDisplayNames.ice}
          />
          <HeroCard
            id="bmo"
            img="/Bmo.png"
            heroLabel="BMO"
            displayName={heroDisplayNames.bmo}
          />
        </div>

        <button
          type="button"
          onClick={() => (isHost ? hostStartNow() : setReady(!meReady))}
          className="flex pt-32.25 transition active:translate-y-1"
        >
          <Image src="/Ready.png" alt="Ready" width={265} height={69} />
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
