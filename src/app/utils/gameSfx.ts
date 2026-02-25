import {
  AUDIO_SETTINGS_EVENT,
  getAudioSettings,
  type AudioSettings,
} from "@/app/utils/audioSettings";

type ManagedSfx = {
  jump: HTMLAudioElement;
  death: HTMLAudioElement;
  deathLayer: HTMLAudioElement;
};

export type GameSfxController = {
  playJump: () => void;
  playDeath: () => void;
  cleanup: () => void;
};

const applyVolume = (sfx: ManagedSfx, settings: AudioSettings) => {
  const baseVolume = settings.muted ? 0 : settings.volume / 100;
  sfx.jump.volume = Math.min(1, baseVolume * 0.8);
  sfx.death.volume = Math.min(1, baseVolume * 1.5);
  sfx.deathLayer.volume = Math.min(1, baseVolume * 1.25);
};

const safePlay = (audio: HTMLAudioElement) => {
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // Ignore autoplay or decode errors. User interaction unlock can happen later.
  });
};

const primeAudio = (audio: HTMLAudioElement) => {
  const prevMuted = audio.muted;
  const prevVolume = audio.volume;
  audio.muted = true;
  audio.volume = 0;
  void audio.play().then(() => {
    audio.pause();
    audio.currentTime = 0;
    audio.muted = prevMuted;
    audio.volume = prevVolume;
  });
};

export const createGameSfxController = (): GameSfxController | null => {
  if (typeof window === "undefined") return null;

  const sfx: ManagedSfx = {
    jump: new Audio("/audio/jump.mp3"),
    death: new Audio("/audio/death.mp3"),
    deathLayer: new Audio("/audio/death.mp3"),
  };

  sfx.jump.preload = "auto";
  sfx.death.preload = "auto";
  sfx.deathLayer.preload = "auto";

  applyVolume(sfx, getAudioSettings());

  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    primeAudio(sfx.jump);
    primeAudio(sfx.death);
    primeAudio(sfx.deathLayer);
  };

  const onSettingsChanged = (
    event: Event | CustomEvent<AudioSettings> | StorageEvent,
  ) => {
    if ("detail" in event && event.detail) {
      applyVolume(sfx, event.detail);
      return;
    }
    applyVolume(sfx, getAudioSettings());
  };

  const onUserAction = () => {
    unlock();
  };
  const onSettingsEvent = (event: Event) => {
    onSettingsChanged(event);
  };

  const startEvents = ["click", "keydown", "touchstart"] as const;
  startEvents.forEach((name) => {
    window.addEventListener(name, onUserAction);
  });
  window.addEventListener(AUDIO_SETTINGS_EVENT, onSettingsEvent);
  window.addEventListener("storage", onSettingsChanged);

  return {
    playJump: () => {
      safePlay(sfx.jump);
    },
    playDeath: () => {
      safePlay(sfx.death);
      safePlay(sfx.deathLayer);
    },
    cleanup: () => {
      startEvents.forEach((name) => {
        window.removeEventListener(name, onUserAction);
      });
      window.removeEventListener(AUDIO_SETTINGS_EVENT, onSettingsEvent);
      window.removeEventListener("storage", onSettingsChanged);
      sfx.jump.pause();
      sfx.death.pause();
      sfx.deathLayer.pause();
    },
  };
};
