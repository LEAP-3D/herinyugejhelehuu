"use client";

import Image from "next/image";
import { useState } from "react";

type Hero = "finn" | "jake" | "ice" | "bmo";

export default function Single_player() {
  const [selected, setSelected] = useState<Hero>("jake");

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

    return (
      <button
        type="button"
        onClick={() => setSelected(id)}
        className="flex flex-col items-center"
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
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 pointer-events-none"
        style={{ backgroundImage: `url("/image 12 (4).png")` }}
      />

      {/* Foreground content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center pt-[190px] justify-start gap-6">
        <p
          style={{ fontFamily: "Joystix" }}
          className="text-white font-joystix text-[64px] font-normal leading-normal"
        >
          Choose your hero.
        </p>

        {/* HERO ROW */}
        <div className="flex flex-row pt-[123px] gap-[70px]">
          <div className="pr-[40px]">
            <HeroCard id="finn" img="/hero1.png" label="FINN" />
          </div>

          <HeroCard id="jake" img="/hero2.png" label="JAKE" />

          <HeroCard id="ice" img="/hero3.png" label="ICE KING" />

          <HeroCard id="bmo" img="/hero4.png" label="BMO" />
        </div>

        {/* Play button */}
        <button
          type="button"
          className="flex pt-[129px] transition active:translate-y-1"
        >
          <Image src="/PLAY BIUTTON6.png" alt="Play" width={265} height={69} />
        </button>

        {/* Debug (optional) */}
        {/* <div className="text-white">Selected: {selected}</div> */}
      </div>
    </main>
  );
}
