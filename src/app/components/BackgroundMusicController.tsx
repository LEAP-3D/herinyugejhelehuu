"use client";

import { useEffect } from "react";
import {
  AUDIO_SETTINGS_EVENT,
  getAudioSettings,
  type AudioSettings,
} from "@/app/utils/audioSettings";

type MusicState = {
  audio: HTMLAudioElement | null;
  trackIndex: number;
  started: boolean;
  userUnlocked: boolean;
  initialized: boolean;
};

const tracks = [
  "/audio/background1.mp3",
  "/audio/background2.mp3",
  "/audio/background3.mp3",
  "/audio/background4.mp3",
  "/audio/background5.mp3",
  "/audio/background6.mp3",
  "/audio/background7.mp3",
];

const state: MusicState = {
  audio: null,
  trackIndex: 0,
  started: false,
  userUnlocked: false,
  initialized: false,
};

const applyVolume = (audio: HTMLAudioElement, settings: AudioSettings) => {
  audio.volume = settings.muted ? 0 : settings.volume / 100;
};

const playCurrentTrack = () => {
  if (!state.audio) return;
  state.audio.src = tracks[state.trackIndex];
  state.audio.load();
  void state.audio.play().catch(() => {
    // Ignore autoplay-related errors until user interaction unlocks audio.
  });
};

const playNextTrack = () => {
  state.trackIndex = (state.trackIndex + 1) % tracks.length;
  playCurrentTrack();
};

const setupMusic = () => {
  if (state.initialized) return;
  state.initialized = true;

  state.audio = new Audio(tracks[0]);
  state.audio.preload = "auto";
  state.audio.loop = false;
  applyVolume(state.audio, getAudioSettings());

  state.audio.addEventListener("ended", playNextTrack);
  state.audio.addEventListener("error", playNextTrack);
};

const unlockAndPlay = () => {
  setupMusic();
  if (!state.audio) return;
  state.userUnlocked = true;
  if (state.started) return;
  state.started = true;
  void state.audio.play().catch(() => {
    state.started = false;
  });
};

const autoStartOnOpen = () => {
  setupMusic();
  if (!state.audio || state.started) return;
  state.started = true;
  void state.audio.play().catch(() => {
    // Browser autoplay policy may block this. Keep fallback listeners active.
    state.started = false;
  });
};

export default function BackgroundMusicController() {
  useEffect(() => {
    setupMusic();
    if (!state.audio) return;

    const onSettingsChanged = (
      event: Event | CustomEvent<AudioSettings> | StorageEvent,
    ) => {
      if (!state.audio) return;

      if ("detail" in event && event.detail) {
        applyVolume(state.audio, event.detail);
        return;
      }

      applyVolume(state.audio, getAudioSettings());
    };

    const onUserAction = () => {
      unlockAndPlay();
    };
    const onSettingsEvent = (event: Event) => {
      onSettingsChanged(event);
    };

    const watchdogId = window.setInterval(() => {
      if (!state.audio || !state.userUnlocked) return;
      if (document.hidden) return;
      if (!state.audio.paused || state.audio.ended) return;
      void state.audio.play().catch(() => {});
    }, 4000);

    const startEvents = ["click", "keydown", "touchstart"] as const;
    startEvents.forEach((name) => {
      window.addEventListener(name, onUserAction);
    });
    window.addEventListener(AUDIO_SETTINGS_EVENT, onSettingsEvent);
    window.addEventListener("storage", onSettingsChanged);

    applyVolume(state.audio, getAudioSettings());
    autoStartOnOpen();

    return () => {
      startEvents.forEach((name) => {
        window.removeEventListener(name, onUserAction);
      });
      window.removeEventListener(AUDIO_SETTINGS_EVENT, onSettingsEvent);
      window.removeEventListener("storage", onSettingsChanged);
      window.clearInterval(watchdogId);
    };
  }, []);

  return null;
}
//aksjdaskldjld
