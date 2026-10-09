import { createContext, useContext } from "react";

export const SoundContext = createContext(true);

export function useSoundEnabled(): boolean {
  return useContext(SoundContext);
}
