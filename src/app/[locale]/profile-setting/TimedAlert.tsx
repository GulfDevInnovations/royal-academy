"use client";

import { useEffect, useState } from "react";

type TimedAlertProps = {
  message: string;
  tone?: "success" | "error";
  duration?: number;
};

export default function TimedAlert({
  message,
  tone = "error",
  duration = 3000,
}: TimedAlertProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  const styles =
    tone === "success"
      ? {
          color: "#86efac",
          background: "transparent",
          border: "1px solid rgba(134,239,172,0.20)",
        }
      : {
          color: "#fca5a5",
          background: "transparent",
          border: "1px solid rgba(248,113,113,0.20)",
        };

  return (
    <p className="mb-4 rounded-xl px-4 py-3 text-sm liquid-glass" style={styles}>
      {message}
    </p>
  );
}
