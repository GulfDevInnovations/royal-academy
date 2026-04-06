"use client";

/**
 * LayoutToggle — floating preview toggle for the project manager.
 * To remove: delete this file and remove <LayoutToggle> from HomeWrapper.tsx,
 * then delete the import line. Nothing else needs to change.
 */

const STORAGE_KEY = "home_layout_version";

interface Props {
  version: "v1" | "v2";
  onChange: (v: "v1" | "v2") => void;
}

export default function LayoutToggle({ version, onChange }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 0,
        background: "rgba(10, 8, 5, 0.72)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(196,168,120,0.28)",
        borderRadius: 999,
        padding: "4px",
        boxShadow:
          "0 4px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(196,168,120,0.12)",
      }}
    >
      {/* Classic (V1) */}
      <button
        onClick={() => onChange("v1")}
        style={{
          padding: "5px 16px",
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          fontSize: "10px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontFamily: "var(--font-text)",
          transition: "all 0.25s ease",
          background:
            version === "v1"
              ? "linear-gradient(135deg, rgba(196,168,120,0.95), rgba(160,130,85,0.95))"
              : "transparent",
          color: version === "v1" ? "#0a0805" : "rgba(196,168,120,0.55)",
          boxShadow:
            version === "v1" ? "0 2px 8px rgba(196,168,120,0.3)" : "none",
          fontWeight: version === "v1" ? "600" : "400",
        }}
      >
        Version1
      </button>

      {/* New (V2) */}
      <button
        onClick={() => onChange("v2")}
        style={{
          padding: "5px 16px",
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          fontSize: "10px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontFamily: "var(--font-text)",
          transition: "all 0.25s ease",
          background:
            version === "v2"
              ? "linear-gradient(135deg, rgba(196,168,120,0.95), rgba(160,130,85,0.95))"
              : "transparent",
          color: version === "v2" ? "#0a0805" : "rgba(196,168,120,0.55)",
          boxShadow:
            version === "v2" ? "0 2px 8px rgba(196,168,120,0.3)" : "none",
          fontWeight: version === "v2" ? "600" : "400",
        }}
      >
        Version2
      </button>
    </div>
  );
}

export { STORAGE_KEY };
