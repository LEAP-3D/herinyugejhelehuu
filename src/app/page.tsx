"use client";
import LEVEL_1 from "@/app/components/levels/World_1";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Page from "./Home-page/page";
export default function HomeMenu() {
  const router = useRouter();
  const handleMoreButton = () => {
    router.push("/Home-page/Player");
  };
  return (
    <div>
      <LEVEL_1 />
    </div>
  );
};

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
