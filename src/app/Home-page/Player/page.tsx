"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_AUDIO_SETTINGS,
  getAudioSettings,
  saveAudioSettings,
  type AudioSettings,
} from "@/app/utils/audioSettings";

function PixelMuteIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 16 16"
      role="img"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <rect x="1" y="6" width="3" height="4" fill="#0b0b0f" />
      <rect x="4" y="5" width="2" height="6" fill="#0b0b0f" />
      <rect x="6" y="4" width="2" height="8" fill="#0b0b0f" />
      {!muted && (
        <>
          <rect x="10" y="5" width="1" height="2" fill="#0b0b0f" />
          <rect x="11" y="4" width="1" height="4" fill="#0b0b0f" />
          <rect x="10" y="9" width="1" height="2" fill="#0b0b0f" />
          <rect x="11" y="8" width="1" height="4" fill="#0b0b0f" />
        </>
      )}
      {muted && (
        <>
          <rect x="10" y="4" width="1" height="1" fill="#0b0b0f" />
          <rect x="11" y="5" width="1" height="1" fill="#0b0b0f" />
          <rect x="12" y="6" width="1" height="1" fill="#0b0b0f" />
          <rect x="13" y="7" width="1" height="1" fill="#0b0b0f" />
          <rect x="12" y="8" width="1" height="1" fill="#0b0b0f" />
          <rect x="11" y="9" width="1" height="1" fill="#0b0b0f" />
          <rect x="10" y="10" width="1" height="1" fill="#0b0b0f" />
          <rect x="13" y="4" width="1" height="1" fill="#0b0b0f" />
          <rect x="12" y="5" width="1" height="1" fill="#0b0b0f" />
          <rect x="11" y="6" width="1" height="1" fill="#0b0b0f" />
          <rect x="10" y="7" width="1" height="1" fill="#0b0b0f" />
          <rect x="11" y="8" width="1" height="1" fill="#0b0b0f" />
          <rect x="12" y="9" width="1" height="1" fill="#0b0b0f" />
          <rect x="13" y="10" width="1" height="1" fill="#0b0b0f" />
        </>
      )}
    </svg>
  );
}

export default function PlayerSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);

  useEffect(() => {
    const loaded = getAudioSettings();
    setSettings(loaded);
  }, []);

  const setMuted = (muted: boolean) => {
    setSettings((prev) => saveAudioSettings({ ...prev, muted }));
  };

  const setVolume = (volume: number) => {
    setSettings((prev) => saveAudioSettings({ ...prev, volume }));
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/ariinzurag.png')" }}
      />
      <div className="absolute inset-0 bg-black/45" />

      <section className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-xl border-4 border-black bg-[#2a2f5c] p-6 text-white shadow-[8px_8px_0_#000]">
          <h1
            style={{ fontFamily: "Joystix" }}
            className="text-3xl tracking-wider mb-6 text-[#f6f7ff]"
          >
            SETTINGS
          </h1>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-2 border-black bg-[#4d5bb7] px-4 py-3">
              <span
                style={{ fontFamily: "Joystix" }}
                className="text-sm text-[#f6f7ff]"
              >
                SOUND
              </span>
              <button
                type="button"
                aria-label={settings.muted ? "Unmute" : "Mute"}
                title={settings.muted ? "Unmute" : "Mute"}
                onClick={() => setMuted(!settings.muted)}
                className={`h-12 w-12 border-2 border-black text-2xl leading-none flex items-center justify-center transition ${
                  settings.muted
                    ? "bg-[#ef5a6f] hover:bg-[#ff6d81]"
                    : "bg-[#49c98d] hover:bg-[#5adf9f]"
                }`}
              >
                <PixelMuteIcon muted={settings.muted} />
              </button>
            </div>

            <label className="block border-2 border-black bg-[#4d5bb7] px-4 py-3">
              <div className="mb-3 flex items-center justify-between">
                <span
                  style={{ fontFamily: "Joystix" }}
                  className="text-sm text-[#f6f7ff]"
                >
                  VOLUME
                </span>
                <span
                  style={{ fontFamily: "Joystix" }}
                  className="text-xs text-[#f6f7ff]"
                >
                  {settings.volume}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={settings.volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-[#83e7ff]"
              />
            </label>
          </div>

          <div className="mt-8 flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setSettings(saveAudioSettings(DEFAULT_AUDIO_SETTINGS))}
              className="px-4 py-2 border-2 border-black bg-[#ffcc5b] text-black hover:bg-[#ffd878] font-semibold transition"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => router.push("/Home-page")}
              className="px-4 py-2 border-2 border-black bg-[#7aa4ff] text-black hover:bg-[#8eb3ff] font-semibold transition"
            >
              Back
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
