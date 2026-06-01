"use client";

import { useState } from "react";

interface Props {
  unread: number;
  open: boolean;
  onToggle: (v: boolean) => void;
}

export default function NotificationBell({ unread, open, onToggle }: Props) {
  const [shaking, setShaking] = useState(false);

  const handleClick = () => {
    setShaking(true);
    onToggle(!open);
    setTimeout(() => setShaking(false), 500);
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Notifications"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes bell-shake {
          0%   { transform: rotate(0deg); }
          15%  { transform: rotate(-28deg); }
          35%  { transform: rotate(22deg); }
          55%  { transform: rotate(-16deg); }
          70%  { transform: rotate(10deg); }
          82%  { transform: rotate(-6deg); }
          91%  { transform: rotate(3deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transformOrigin: "50% 0%",
          animation: shaking ? "bell-shake 0.5s ease" : "none",
        }}
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 && (
        <span
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            background: "#592c41",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
            lineHeight: 1,
          }}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}
