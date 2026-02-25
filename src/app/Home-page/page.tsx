"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";

export default function Page() {
  const router = useRouter();
  const [backgroundReady, setBackgroundReady] = useState(false);

  useEffect(() => {
    let loaded = 0;
    const total = 2;
    const onAssetDone = () => {
      loaded += 1;
      if (loaded >= total) setBackgroundReady(true);
    };

    const bg = new window.Image();
    const overlay = new window.Image();

    bg.onload = onAssetDone;
    bg.onerror = onAssetDone;
    overlay.onload = onAssetDone;
    overlay.onerror = onAssetDone;

    bg.src = "/ariinzurag.png";
    overlay.src = "/Toon-friends.png";
  }, []);

  const handleMoreButton = () => {
    router.push("/Home-page/Multiplayer/Host");
  };
  const goMulti = () => {
    router.push("/Home-page/Multiplayer/Join");
  };
  const goSettings = () => {
    router.push("/Home-page/Player");
  };
  return (
    <>
      {!backgroundReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="loader-shell">
            <div className="loader-text">
              LOADING
              <span className="loader-dots" aria-hidden="true">
                ...
              </span>
            </div>
            <div className="loader-sub">PREPARING ADVENTURE</div>
          </div>
        </div>
      )}

      {/* Background */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat -z-10 transition-opacity duration-300 ${
          backgroundReady ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: "url('/ariinzurag.png')" }}
      />

      <div
        className={`absolute inset-0 bg-black/10 z-0 transition-opacity duration-300 ${
          backgroundReady ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Overlay (энэ нь бүүдгэр болгодог) */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-120 p-0 transition-opacity duration-300 ${
          backgroundReady ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: `url("/Toon-friends.png")` }}
      />
      <div className="relative center flexrelative z-10 min-h-screen flex flex-col items-center justify-start pt-124 gap-4.75 pr-30">
        <button
          className="transition active:translate-y-1"
          onClick={handleMoreButton}
        >
          <NextImage
            src="/Create-room.png"
            alt="hello"
            width={440}
            height={108}
          />
        </button>
        <button onClick={goMulti} className="transition active:translate-y-1">
          <NextImage
            src="/Open-room.png"
            alt="hello"
            width={440}
            height={108}
          />
        </button>
        <button
          onClick={goSettings}
          className="transition active:translate-y-1"
        >
          <NextImage src="/Settings.png" alt="hello" width={440} height={108} />
        </button>
      </div>
      <style jsx>{`
        .loader-shell {
          position: relative;
          padding: 28px 34px;
          background: transparent;
          image-rendering: pixelated;
          overflow: hidden;
        }

        .loader-shell::after {
          content: "";
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0,
            transparent 4px,
            rgba(255, 255, 255, 0.04) 5px
          );
          animation: scanlines 1.1s linear infinite;
          pointer-events: none;
        }

        .loader-text {
          font-family: "Joystix", monospace;
          font-size: clamp(28px, 4.2vw, 52px);
          letter-spacing: 0.12em;
          color: #fff6d1;
          text-shadow:
            0 0 8px rgba(255, 240, 160, 0.85),
            4px 4px 0 #000;
          animation: pulseGlow 1.2s steps(2, end) infinite;
        }

        .loader-dots {
          display: inline-block;
          width: 3ch;
          animation: dots 1s steps(4, end) infinite;
        }

        .loader-sub {
          margin-top: 12px;
          font-family: "Joystix", monospace;
          font-size: clamp(10px, 1.6vw, 14px);
          letter-spacing: 0.14em;
          color: #ffdd8a;
          animation: blinkText 0.9s steps(2, end) infinite;
        }

        @keyframes pulseGlow {
          0%,
          100% {
            transform: translateY(0);
            filter: brightness(1);
          }
          50% {
            transform: translateY(-1px);
            filter: brightness(1.2);
          }
        }

        @keyframes dots {
          0% {
            width: 0ch;
          }
          100% {
            width: 3ch;
          }
        }

        @keyframes blinkText {
          50% {
            opacity: 0.35;
          }
        }

        @keyframes scanlines {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(5px);
          }
        }
      `}</style>
    </>
  );
}
//asdasd
