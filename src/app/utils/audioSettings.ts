export type AudioSettings = {
  muted: boolean;
  volume: number;
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  muted: false,
  volume: 100,
};

const STORAGE_KEY = "audioSettings";
export const AUDIO_SETTINGS_EVENT = "audio-settings-changed";

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export const getAudioSettings = (): AudioSettings => {
  if (typeof window === "undefined") return DEFAULT_AUDIO_SETTINGS;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_AUDIO_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return {
      muted: Boolean(parsed.muted),
      volume: clamp(
        typeof parsed.volume === "number"
          ? parsed.volume
          : DEFAULT_AUDIO_SETTINGS.volume,
      ),
    };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
};

export const saveAudioSettings = (settings: AudioSettings): AudioSettings => {
  const normalized: AudioSettings = {
    muted: Boolean(settings.muted),
    volume: clamp(settings.volume),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(
      new CustomEvent<AudioSettings>(AUDIO_SETTINGS_EVENT, {
        detail: normalized,
      }),
    );
  }

  return normalized;
};
