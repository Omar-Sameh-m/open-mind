class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isAvailable: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.isAvailable = true;
    }
  }

  public getAvailable(): boolean {
    return this.isAvailable;
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public speak(
    text: string,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): void {
    if (!this.synth || !this.isAvailable) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      callbacks?.onError?.(new Error('SpeechSynthesis not supported'));
      return;
    }

    // Cancel ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick a natural English voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Aaron')))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      callbacks?.onError?.(e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public isSpeaking(): boolean {
    return !!this.synth && this.synth.speaking;
  }
}

export const speechService = new SpeechService();
