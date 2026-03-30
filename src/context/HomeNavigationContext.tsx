"use client";
import { createContext, useContext, useState, useCallback } from "react";

type HomeNavContextType = {
  requestedFloor: number | null;
  navigateToFloor: (floor: number) => void;
  clearRequest: () => void;
};

const HomeNavContext = createContext<HomeNavContextType>({
  requestedFloor: null,
  navigateToFloor: () => {},
  clearRequest: () => {},
});

export function HomeNavProvider({ children }: { children: React.ReactNode }) {
  const [requestedFloor, setRequestedFloor] = useState<number | null>(null);

  const navigateToFloor = useCallback((floor: number) => {
    setRequestedFloor(floor);
  }, []);

  const clearRequest = useCallback(() => {
    setRequestedFloor(null);
  }, []);

  return (
    <HomeNavContext.Provider
      value={{ requestedFloor, navigateToFloor, clearRequest }}
    >
      {children}
    </HomeNavContext.Provider>
  );
}

export const useHomeNav = () => useContext(HomeNavContext);

// Floor map — single source of truth
export const NAV_FLOOR_MAP: Record<string, number> = {
  "/": 0,
  // "/teachers": 2,
  // "/classes": 1, // adjust to whichever floor "classes" lives on
  "/about": 2,
};
