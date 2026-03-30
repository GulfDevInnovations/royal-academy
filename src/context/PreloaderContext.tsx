"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

type PreloaderCtx = {
  isDone: boolean;
  markDone: () => void;
};

const Ctx = createContext<PreloaderCtx>({ isDone: false, markDone: () => {} });

export function usePreloader() {
  return useContext(Ctx);
}

const SESSION_KEY = "ra_preloaded";

export function PreloaderProvider({ children }: { children: React.ReactNode }) {
  // Always start as false on server — client will correct on mount
  const [isDone, setIsDone] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    // On mount, check if already seen this session
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      doneRef.current = true;
      setIsDone(true);
    }
  }, []);

  const markDone = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    sessionStorage.setItem(SESSION_KEY, "1");
    setIsDone(true);
  }, []);

  return <Ctx.Provider value={{ isDone, markDone }}>{children}</Ctx.Provider>;
}
