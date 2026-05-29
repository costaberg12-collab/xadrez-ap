import { Audio } from 'expo-av';

let sounds = {};
let enabled = true;

export async function initSounds() {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  } catch (e) {
    console.warn('Audio init failed', e);
  }
}

export function setSoundEnabled(value) {
  enabled = value;
}

export async function playSound(type) {
  if (!enabled) return;
  try {
    const url = SOUNDS[type];
    if (!url) return;
    const { sound } = await Audio.Sound.createAsync(url, { shouldPlay: true, volume: 0.6 });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch (e) {
    // Silently fail if audio not available
  }
}

const SOUNDS = {
  move: null,
  capture: null,
  check: null,
  gameOver: null,
  tick: null,
  alert: null,
};
