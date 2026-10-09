import { createContext, useContext, type ReactNode } from "react";

export interface RoundCast {
  buddyId: string;
  hostId: string;
  equipped: string;
}

const RoundCastContext = createContext<RoundCast | null>(null);

export function RoundCastProvider({
  buddyId,
  hostId,
  equipped,
  children,
}: RoundCast & { children: ReactNode }) {
  return <RoundCastContext.Provider value={{ buddyId, hostId, equipped }}>{children}</RoundCastContext.Provider>;
}

export function useCast(): RoundCast | null {
  return useContext(RoundCastContext);
}
