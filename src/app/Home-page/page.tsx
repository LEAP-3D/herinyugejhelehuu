"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";

export default function Page() {
  const router = useRouter();
  const [backgroundReady, setBackgroundReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const total = 2;
    const onAssetDone = () => {
      if (cancelled) return;
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

    return () => {
      cancelled = true;
      bg.onload = null;
      bg.onerror = null;
      overlay.onload = null;
      overlay.onerror = null;
    };
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
          <div className="home-loader-shell">
            <div className="home-loader-text">
              LOADING
              <span className="home-loader-dots" aria-hidden>
                {"..."}
              </span>
            </div>
            <div className="home-loader-sub">PREPARING ADVENTURE</div>
          </div>
        </div>
      )}

      {/* Background */}
      <div
        className={`fixed inset-0 bg-cover bg-center bg-no-repeat -z-10 transition-opacity duration-300 ${
          backgroundReady ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: "url('/ariinzurag.png')" }}
      />

      <div
        className={`fixed inset-0 bg-black/10 z-0 transition-opacity duration-300 ${
          backgroundReady ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-cover bg-center bg-no-repeat z-0 transition-opacity duration-300 ${
          backgroundReady ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: `url("/Toon-friends.png")` }}
      />

      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-start gap-4 px-4 pt-24 md:pt-32">
        <button
          className="transition active:translate-y-1"
          onClick={handleMoreButton}
        >
          <NextImage
            src="/Create-room.png"
            alt="Create room"
            width={440}
            height={108}
            className="h-auto w-[260px] max-w-full md:w-[440px]"
          />
        </button>
        <button onClick={goMulti} className="transition active:translate-y-1">
          <NextImage
            src="/joinroom.png"
            alt="Join room"
            width={440}
            height={108}
            className="h-auto w-[260px] max-w-full md:w-[440px]"
          />
        </button>
        <button
          onClick={goSettings}
          className="transition active:translate-y-1"
        >
          <NextImage
            src="/Settings.png"
            alt="Settings"
            width={440}
            height={108}
            className="h-auto w-[260px] max-w-full md:w-[440px]"
          />
        </button>
      </div>
    </>
  );
}
