import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkoutPrefs {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  setSoundEnabled: (value: boolean) => void;
  setVibrationEnabled: (value: boolean) => void;
}

/** Avisos al terminar el descanso; se guardan en localStorage. */
export const useWorkoutPrefs = create<WorkoutPrefs>()(
  persist(
    (set) => ({
      soundEnabled: true,
      vibrationEnabled: true,
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setVibrationEnabled: (vibrationEnabled) => set({ vibrationEnabled }),
    }),
    {
      name: 'gym-routine:workout-prefs',
      partialize: ({ soundEnabled, vibrationEnabled }) => ({ soundEnabled, vibrationEnabled }),
    },
  ),
);
