"use client";
import { useEffect, useRef, useState, useMemo } from "react";

// ✅ Түр одоохондоо 1 hero-н sprite байна гэж бодоод
// Дараа нь finn/jake/ice/bmo тус тусын component-оо энд оруулна.
import PlayerIdle from "@/app/test-player/player1";
import PlayerRun from "@/app/test-player/player2";

type Hero = "finn" | "jake" | "ice" | "bmo";

const WORLD_W = 900;
const WORLD_H = 600;

const PLATFORMS = [
  { x: 0, y: 504, w: 300, h: 96 },
  { x: 450, y: 504, w: 450, h: 96 },
  { x: 400, y: 350, w: 200, h: 20 },
];

const PLAYER_SIZE = { w: 56, h: 72 };
const VIEW_W = 900;

export default function PicoGame() {
  // ✅ lobby дээрээс ирсэн hero-г уншина
  const myHero = useMemo<Hero>(() => {
    if (typeof window === "undefined") return "jake";
    const h = localStorage.getItem("myHero");
    if (h === "finn" || h === "jake" || h === "ice" || h === "bmo") return h;
    return "jake";
  }, []);

  const player = useRef({
    x: 100,
    y: 300,
    vx: 0,
    vy: 0,
    spawnX: 100,
    spawnY: 300,
  });

  const keys = useRef<{ [key: string]: boolean }>({});

  const [pos, setPos] = useState({ x: 100, y: 300 });
  const [cameraX, setCameraX] = useState(0);
  const [isFacingRight, setIsFacingRight] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [isDead, setIsDead] = useState(false);

  const facingRef = useRef(true);
  const deadRef = useRef(false);

  useEffect(() => {
    facingRef.current = isFacingRight;
  }, [isFacingRight]);

  useEffect(() => {
    deadRef.current = isDead;
  }, [isDead]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const onKeyUp = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const clamp = (v: number, a: number, b: number) =>
      Math.max(a, Math.min(b, v));

    let rafId = 0;

    const gameLoop = () => {
      const p = player.current;

      if (deadRef.current) {
        rafId = requestAnimationFrame(gameLoop);
        return;
      }

      const right = keys.current["ArrowRight"];
      const left = keys.current["ArrowLeft"];

      if (right && !left) {
        p.vx += 1.0;
        if (!facingRef.current) {
          facingRef.current = true;
          setIsFacingRight(true);
        }
      } else if (left && !right) {
        p.vx -= 1.0;
        if (facingRef.current) {
          facingRef.current = false;
          setIsFacingRight(false);
        }
      }

      p.vx *= 0.85;
      p.vy += 0.6;

      const nextX = p.x + p.vx;
      let nextY = p.y + p.vy;

      let onGround = false;
      const EPS = 5;

      for (const plat of PLATFORMS) {
        const overlapsX =
          nextX + PLAYER_SIZE.w > plat.x && nextX < plat.x + plat.w;

        const prevBottom = p.y + PLAYER_SIZE.h;
        const nextBottom = nextY + PLAYER_SIZE.h;

        if (
          overlapsX &&
          p.vy >= 0 &&
          prevBottom <= plat.y + EPS &&
          nextBottom >= plat.y
        ) {
          nextY = plat.y - PLAYER_SIZE.h;
          p.vy = 0;
          onGround = true;
        }
      }

      if ((keys.current["Space"] || keys.current["ArrowUp"]) && onGround) {
        p.vy = -14;
      }

      p.x = nextX;
      p.y = nextY;

      const movingNow = Math.abs(p.vx) > 0.4;
      setIsMoving(movingNow);

      if (p.y > WORLD_H + 200) {
        setIsDead(true);
        deadRef.current = true;

        setTimeout(() => {
          p.x = p.spawnX;
          p.y = p.spawnY;
          p.vx = 0;
          p.vy = 0;
          setIsDead(false);
          deadRef.current = false;
        }, 900);

        rafId = requestAnimationFrame(gameLoop);
        return;
      }

      if (p.x < 0) p.x = 0;
      if (p.x > WORLD_W - PLAYER_SIZE.w) p.x = WORLD_W - PLAYER_SIZE.w;

      const playerCenterX = p.x + PLAYER_SIZE.w / 2;
      const desiredCameraX = playerCenterX - VIEW_W / 2;
      const maxCamX = Math.max(0, WORLD_W - VIEW_W);
      const camX = clamp(desiredCameraX, 0, maxCamX);
      setCameraX((prev) => prev + (camX - prev) * 0.15);

      setPos({ x: p.x, y: p.y });

      rafId = requestAnimationFrame(gameLoop);
    };

    rafId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // ✅ Одоохондоо hero харуулах текст л нэмлээ (дараа нь sprite солих)
  const Sprite = isDead ? PlayerIdle : isMoving ? PlayerRun : PlayerIdle;

  return (
    <main className="flex h-screen w-full items-center justify-center bg-indigo-50 p-4 font-mono">
      <div className="relative w-255 h-155 bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-slate-900">
        {/* ✅ debug hero */}
        <div className="absolute top-3 left-4 z-50 text-black/70 text-sm">
          Hero: {myHero}
        </div>

        <div
          className="absolute left-0 top-0"
          style={{
            width: WORLD_W,
            height: WORLD_H,
            transform: `translate3d(${-cameraX}px, 0px, 0)`,
            willChange: "transform",
          }}
        >
          <div
            className="absolute z-10 w-14 h-18"
            style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
          >
            <Sprite
              className={`w-full h-full transition-transform duration-150 ${
                !isFacingRight ? "-scale-x-100" : ""
              }`}
            />
          </div>

          {PLATFORMS.map((plat, index) => (
            <div
              key={index}
              className="absolute bg-slate-900"
              style={{
                left: plat.x,
                top: plat.y,
                width: plat.w,
                height: plat.h,
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
