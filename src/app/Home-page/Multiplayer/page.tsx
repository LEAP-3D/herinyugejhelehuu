"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function MultiPlayer() {
  const router = useRouter();
  const host = () => {
    router.push("/Home-page/Multiplayer/Host");
  };
  const join = () => {
    router.push("/Home-page/Multiplayer/Join");
  };

  return (
    <>
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url("/image 12 (4).png")` }}
      />

      <div className="absolute inset-0 bg-black/10 z-0" />

      {/* Overlay (энэ нь бүүдгэр болгодог) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-120"
        style={{ backgroundImage: `url("/MacBook Pro 14_ - 2 (4).png")` }}
      />
      <div className="relative center flexrelative z-10 min-h-screen flex flex-col items-center justify-start pt-124 gap-4.75 pr-40">
        <button onClick={host} className="transition active:translate-y-1">
          <Image
            src="/PLAY BIUTTON2.png"
            alt="hello"
            width={440}
            height={108}
          />
        </button>
        <button onClick={join} className="transition active:translate-y-1">
          <Image
            src="/PLAY BIUTTON3.png"
            alt="hello"
            width={440}
            height={108}
          />
        </button>
      </div>
    </>
  );
}
