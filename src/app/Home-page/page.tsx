"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Page() {
  const router = useRouter();
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
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{ backgroundImage: "url('/ariinzurag.png')" }}
      />

      <div className="absolute inset-0 bg-black/10 z-0" />

      {/* Overlay (энэ нь бүүдгэр болгодог) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-120 p-0"
        style={{ backgroundImage: `url("/Toon-friends.png")` }}
      />
      <div className="relative center flexrelative z-10 min-h-screen flex flex-col items-center justify-start pt-124 gap-4.75 pr-30">
        <button
          className="transition active:translate-y-1"
          onClick={handleMoreButton}
        >
          <Image src="/Create-room.png" alt="hello" width={440} height={108} />
        </button>
        <button onClick={goMulti} className="transition active:translate-y-1">
          <Image src="/Open-room.png" alt="hello" width={440} height={108} />
        </button>
        <button
          onClick={goSettings}
          className="transition active:translate-y-1"
        >
          <Image src="/Settings.png" alt="hello" width={440} height={108} />
        </button>
      </div>
    </>
  );
}
