"use client";

import { createContext, useContext, useState } from "react";

interface NavbarStateValue {
  navSolid: boolean;
  setNavSolid: (v: boolean) => void;
}

export const NavbarStateContext = createContext<NavbarStateValue>({
  navSolid: false,
  setNavSolid: () => {},
});

export function NavbarStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navSolid, setNavSolid] = useState(false);
  return (
    <NavbarStateContext.Provider value={{ navSolid, setNavSolid }}>
      {children}
    </NavbarStateContext.Provider>
  );
}

export function useNavbarState() {
  return useContext(NavbarStateContext);
}
