"use client";

import Page from "./HomePage/page";
import { useRouter } from "next/navigation";
import Image from "next/image";
export default function HomeMenu() {
  const router = useRouter();
  const handleMoreButton = () => {
    router.push("/HomePage/single_player");
  };
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <Page />

      {/* Foreground content */}
      <div className="relative center flexrelative z-10 min-h-screen flex flex-col items-center justify-start pt-124 gap-4.75 pr-40">
        <button
          className="transition active:translate-y-1"
          onClick={handleMoreButton}
        >
          <Image
            src="/PLAY BIUTTON2.png"
            alt="hello"
            width={440}
            height={108}
          />
        </button>
        <button className="transition active:translate-y-1">
          <Image
            src="/PLAY BIUTTON3.png"
            alt="hello"
            width={440}
            height={108}
          />
        </button>
        <button className="transition active:translate-y-1">
          <Image
            src="/PLAY BIUTTON4.png"
            alt="hello"
            width={440}
            height={108}
          />
        </button>
      </div>
    </main>
  );
}
