import { CompatSound as AudioSound } from './audioCompat';

let activeSound: AudioSound | null = null;
let activeOwnerId: string | null = null;
let activeOnStop: (() => void) | null = null;

export class GlobalAudioController {
  static async play(sound: AudioSound, ownerId: string, onStop: () => void) {
    if (activeSound && activeSound !== sound) {
      try {
        await activeSound.pauseAsync();
        await activeSound.unloadAsync();
        if (activeOnStop) activeOnStop();
      } catch (e) {
        console.warn('[GlobalAudioController] Error stopping previous sound:', e);
      }
    }
    activeSound = sound;
    activeOwnerId = ownerId;
    activeOnStop = onStop;
  }

  static async pause(ownerId: string) {
    if (activeOwnerId !== ownerId || !activeSound) return;
    try {
      await activeSound.pauseAsync();
    } catch (e) {
      console.warn('[GlobalAudioController] Error pausing sound:', e);
    }
  }

  static async stop(ownerId?: string) {
    if (ownerId && activeOwnerId !== ownerId) {
      return;
    }
    if (activeSound) {
      try {
        await activeSound.pauseAsync();
        await activeSound.unloadAsync();
      } catch (e) {
        console.warn('[GlobalAudioController] Error stopping sound:', e);
      }
    }
    if (activeOnStop) activeOnStop();
    activeSound = null;
    activeOwnerId = null;
    activeOnStop = null;
  }

  static getActiveOwnerId() {
    return activeOwnerId;
  }
}
