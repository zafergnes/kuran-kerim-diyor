let activeAudio: HTMLAudioElement | null = null;
let activeOwnerId: string | null = null;
let activeOnStop: (() => void) | null = null;

export class GlobalAudioController {
  static play(audio: HTMLAudioElement, ownerId: string, onStop: () => void) {
    if (activeAudio) {
      try {
        if (activeOwnerId !== ownerId) {
          if (activeOnStop) activeOnStop();
        }
        activeAudio.pause();
      } catch (e) {
        console.warn('[GlobalAudioController] Error pausing previous audio:', e);
      }
    }
    activeAudio = audio;
    activeOwnerId = ownerId;
    activeOnStop = onStop;
  }

  static stop(ownerId?: string) {
    if (ownerId && activeOwnerId !== ownerId) {
      return;
    }
    if (activeAudio) {
      try {
        activeAudio.pause();
      } catch (e) {
        console.warn('[GlobalAudioController] Error pausing audio:', e);
      }
    }
    if (activeOnStop) activeOnStop();
    activeAudio = null;
    activeOwnerId = null;
    activeOnStop = null;
  }

  static getActiveOwnerId() {
    return activeOwnerId;
  }
}
