import {
  AudioPlayer,
  AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';

/** Small compatibility surface for the old expo-av call sites. */
export type CompatStatus = {
  isLoaded: boolean;
  durationMillis: number;
  positionMillis: number;
  isPlaying: boolean;
  didJustFinish: boolean;
};

export class CompatSound {
  constructor(readonly player: AudioPlayer) {}

  private status(status: AudioStatus = this.player.currentStatus): CompatStatus {
    return {
      isLoaded: status.isLoaded,
      durationMillis: status.duration * 1000,
      positionMillis: status.currentTime * 1000,
      isPlaying: status.playing,
      didJustFinish: status.didJustFinish,
    };
  }

  async getStatusAsync(): Promise<CompatStatus> {
    return this.status();
  }

  async setPositionAsync(milliseconds: number): Promise<void> {
    await this.player.seekTo(Math.max(0, milliseconds) / 1000);
  }

  async playAsync(): Promise<void> {
    this.player.play();
  }

  async stopAsync(): Promise<void> {
    this.player.pause();
  }

  async unloadAsync(): Promise<void> {
    this.player.remove();
  }

  setOnPlaybackStatusUpdate(callback: ((status: CompatStatus) => void) | null): void {
    this.player.removeAllListeners('playbackStatusUpdate');
    if (callback) {
      this.player.addListener('playbackStatusUpdate', status => callback(this.status(status)));
    }
  }
}

export const Audio = {
  setAudioModeAsync,
  Sound: {
    async createAsync(source: { uri: string }, options: { shouldPlay?: boolean } = {}) {
      const sound = new CompatSound(createAudioPlayer(source.uri, { updateInterval: 250 }));
      if (options.shouldPlay) await sound.playAsync();
      return { sound };
    },
  },
};
