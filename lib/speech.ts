export type Language = "vi" | "en";

class SpeechCoach {
  private currentLang: Language = "vi";
  private isMuted: boolean = false;
  private lastSpokenTime: number = 0;
  private minIntervalMs: number = 2200; // Tránh đọc đè lên nhau
  private currentAudio: HTMLAudioElement | null = null;
  private audioCache: Map<string, string> = new Map();

  public setLanguage(lang: Language) {
    this.currentLang = lang;
  }

  public getLanguage(): Language {
    return this.currentLang;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  public isVoiceMuted(): boolean {
    return this.isMuted;
  }

  public speak(
    textVi: string,
    textEn: string,
    options?: { force?: boolean; interval?: number }
  ) {
    if (this.isMuted || typeof window === "undefined") return;

    const now = Date.now();
    const interval = options?.interval ?? this.minIntervalMs;
    if (!options?.force && now - this.lastSpokenTime < interval) {
      return;
    }

    const text = this.currentLang === "vi" ? textVi : textEn;
    const langCode = this.currentLang === "vi" ? "vi" : "en";

    // Nếu force = true hoặc có câu nói trước đó, dừng câu cũ
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    this.lastSpokenTime = now;

    // Phát âm thanh qua API route Text-to-Speech (đảm bảo 100% nói tiếng Việt chuẩn trên mọi thiết bị)
    const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${langCode}`;
    const audio = new Audio(audioUrl);
    this.currentAudio = audio;

    audio.play().catch((err) => {
      // Nếu trình duyệt chặn autoplay trước khi tương tác, có thể fallback sang Web Speech API
      console.warn("Audio playback notice (requires user click first):", err);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        ut.lang = this.currentLang === "vi" ? "vi-VN" : "en-US";
        window.speechSynthesis.speak(ut);
      }
    });
  }

  public cancel() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speechCoach = new SpeechCoach();
