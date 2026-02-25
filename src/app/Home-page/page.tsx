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
          <div className="font-joystix text-sm tracking-wider text-white">
            Loading...
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
    </>
  );
}
//asdasd
