import { useSettingsStore } from '../store/settingsStore';
import { AppState, AppStateStatus } from 'react-native';

export type SoundType = 'start' | 'break' | 'cycle' | 'completed';

class SoundService {
  private chimePlayer: any = null;

  private isLoaded = false;
  private audioAvailable = true;
  private initPromise: Promise<void> | null = null;
  private appStateSubscription: any = null;
  private activePlayPromise: Promise<void> | null = null;

  constructor() {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && !this.isLoaded && this.audioAvailable) {
      this.init();
    }
  };

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        console.log('[SoundService] Initializing sound service...');
        if (!this.audioAvailable) {
          console.log('[SoundService] Audio marked as unavailable. Skipping init.');
          return;
        }

        const { createAudioPlayer, setAudioModeAsync } = require('expo-audio');
        
        if (setAudioModeAsync) {
          await setAudioModeAsync({
            playsInSilentMode: true,
            interruptionMode: 'mixWithOthers',
            shouldPlayInBackground: true,
          });
        }

        // Load one premium chime for all events
        this.chimePlayer = createAudioPlayer(require('../../assets/audio/chime.wav'));

        this.isLoaded = true;
        console.log('[SoundService] Premium chime loaded successfully.');
      } catch (error) {
        console.error('[SoundService] Failed to load expo-audio or initialize players. Audio will be disabled.', error);
        this.audioAvailable = false;
      }
    })();

    return this.initPromise;
  }

  private async playWithRetry(player: any, type: SoundType, retryCount = 1): Promise<void> {
    try {
      console.log(`[SoundService] Attempting playback for: ${type}`);
      
      // Ensure we start from the beginning
      await player.seekTo(0);
      
      return new Promise<void>((resolve, reject) => {
        let subscription: any = null;
        let timeout: any = null;
        
        const cleanup = () => {
          if (subscription) subscription.remove();
          if (timeout) clearTimeout(timeout);
        };

        if (typeof player.addListener === 'function') {
          subscription = player.addListener('playbackStatusUpdate', (status: any) => {
            if (status.error) {
              cleanup();
              reject(new Error(status.error));
            } else if (status.didJustFinish) {
              console.log(`[SoundService] Playback finished for: ${type}`);
              cleanup();
              player.seekTo(0).then(() => {
                console.log(`[SoundService] Sound reset for: ${type}`);
                resolve();
              }).catch((err: any) => {
                console.warn(`[SoundService] Failed to reset sound ${type}:`, err);
                resolve();
              });
            }
          });
        }

        // Safety timeout in case events fail
        timeout = setTimeout(() => {
          console.log(`[SoundService] Playback timed out (fallback resolve) for: ${type}`);
          cleanup();
          player.seekTo(0).catch(() => {});
          resolve();
        }, 1500);

        player.play();
        console.log(`[SoundService] Playback started for: ${type}`);
      });
    } catch (error) {
      if (retryCount > 0) {
        console.warn(`[SoundService] Playback failed for ${type}. Retrying...`, error);
        return this.playWithRetry(player, type, retryCount - 1);
      }
      console.error(`[SoundService] Playback failed for ${type} after retries:`, error);
      throw error;
    }
  }

  private async _playInternal(type: SoundType): Promise<void> {
    // Exact requested events: Start button, Focus complete -> Break, Final cycle complete, and Break -> Focus ('cycle')
    if (type !== 'start' && type !== 'break' && type !== 'completed' && type !== 'cycle') {
      console.log(`[SoundService] Sound requested for '${type}', but not in allowed events. Skipping.`);
      return;
    }

    if (type === 'completed' || type === 'break' || type === 'cycle') {
       console.log(`[SoundService] Timer completed. Triggering sound: ${type}`);
    }

    const settings = useSettingsStore.getState().settings;
    if (!settings.timerSoundEnabled) {
      console.log(`[SoundService] Sound disabled in settings. Skipping ${type}.`);
      return;
    }

    if (!this.isLoaded) {
      await this.init();
    }

    if (!this.audioAvailable) return;

    const player = this.chimePlayer;
    if (!player) return;

    try {
      player.volume = settings.soundVolume ?? 0.5;
      await this.playWithRetry(player, type);
    } catch (error) {
      console.error(`[SoundService] Final failure to play ${type}:`, error);
    }
  }

  async play(type: SoundType) {
    if (!this.audioAvailable) return;

    // Prevent overlapping sounds by awaiting any currently playing sound
    if (this.activePlayPromise) {
      try {
        await this.activePlayPromise;
      } catch (e) {}
    }

    const promise = this._playInternal(type);
    this.activePlayPromise = promise;
    
    try {
      await promise;
    } finally {
      if (this.activePlayPromise === promise) {
        this.activePlayPromise = null;
      }
    }
  }

  async stopAll() {
    if (!this.audioAvailable || !this.isLoaded) return;
    try {
      if (this.chimePlayer) {
        this.chimePlayer.pause();
        await this.chimePlayer.seekTo(0);
      }
    } catch (error) {
      console.warn('[SoundService] Failed to stop sounds:', error);
    }
  }

  async cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    if (!this.audioAvailable) return;
    this.isLoaded = false;
    
    if (this.chimePlayer) {
      try {
        this.chimePlayer.remove();
      } catch (error) {
        console.warn(`[SoundService] Failed to remove chimePlayer:`, error);
      }
      this.chimePlayer = null;
    }
  }
}

export const soundService = new SoundService();
