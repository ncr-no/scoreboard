import { AppSounds } from '@/types/sounds';
import { useEffect, useState } from 'react';

// Use basePath-aware paths for GitHub Pages deployment
const getAssetPath = (path: string) => {
  const basePath = process.env.NODE_ENV === 'production' ? '/ctf-scoreboard' : '';
  return `${basePath}${path}`;
};

const SUCCESS_SOUND = getAssetPath('/sounds/success.mp3');
const ERROR_SOUND = getAssetPath('/sounds/error.mp3');
const FIRST_BLOOD_SOUND = getAssetPath('/sounds/firstblood.mp3');

export function useAppSounds(): AppSounds {
  const [isClient, setIsClient] = useState(false);
  const [sounds, setSounds] = useState<AppSounds>({
    playSuccess: () => {},
    playError: () => {},
    playFirstBlood: () => {},
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Use the Web Audio API directly for client-side sound playback
    const createAudioPlayer = (src: string, volume = 1.0) => {
      return () => {
        const audio = new Audio(src);
        audio.volume = volume;
        audio.play().catch((error) => {
          console.warn('Audio playback failed:', error);
        });
      };
    };

    setSounds({
      playSuccess: createAudioPlayer(SUCCESS_SOUND),
      playError: createAudioPlayer(ERROR_SOUND),
      playFirstBlood: createAudioPlayer(FIRST_BLOOD_SOUND, 0.8),
    });
  }, [isClient]);

  return sounds;
}