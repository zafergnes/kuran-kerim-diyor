import { Audio } from 'expo-av';

let activeSound: Audio.Sound | null = null;
let activeOwnerId: string | null = null;
let activeOnStop: (() => void) | null = null;

export class GlobalAudioController {
  static async play(sound: Audio.Sound, ownerId: string, onStop: () => void) {
    if (activeSound) {
      try {
        if (activeOwnerId !== ownerId) {
          if (activeOnStop) activeOnStop();
        }
        await activeSound.stopAsync();
        await activeSound.unloadAsync();
      } catch (e) {
        console.warn('[GlobalAudioController] Error stopping previous sound:', e);
      }
    }
    activeSound = sound;
    activeOwnerId = ownerId;
    activeOnStop = onStop;
  }

  static async stop(ownerId?: string) {
    if (ownerId && activeOwnerId !== ownerId) {
      return;
    }
    if (activeSound) {
      try {
        await activeSound.stopAsync();
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
