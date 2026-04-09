// src/components/admin/ui.tsx
// ─────────────────────────────────────────────────────────────
// Shared dark-theme primitives for the admin panel.
// Import from this file to keep every page visually consistent.
// ─────────────────────────────────────────────────────────────

import { ReactNode } from "react";

// ── Design tokens ────────────────────────────────────────────
export const adminColors = {
  bg: "#13161f", // page background
  surface: "#1a1d27", // card / panel background
  border: "rgba(255,255,255,0.07)",
  textPrimary: "rgba(255,255,255,0.85)",
  textSecondary: "rgba(255,255,255,0.40)",
  textMuted: "rgba(255,255,255,0.20)",
  accent: "#f59e0b", // amber — primary action colour
  accentHover: "#d97706",
  blueText: "#5190f5", // for reminders
  redText: "#ff2929", // for warnings/errors
  purpleText: "#9029ff", // for highlights
  pinkText: "#e84f8a", // for highlights
} as const;

// ── Card ─────────────────────────────────────────────────────
interface CardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}
export function AdminCard({ children, className = "", noPadding }: CardProps) {
  return (
    <div
      className={`rounded-xl border ${noPadding ? "" : "p-5"} ${className}`}
      style={{
        background: adminColors.surface,
        borderColor: adminColors.border,
      }}
    >
      {children}
    </div>
  );
}

// ── Page header ──────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}
export function AdminPageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1
          className="text-xl font-semibold tracking-tight"
          style={{ color: adminColors.textPrimary }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-l mt-0.5" style={{ color: adminColors.textMuted }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ── Primary button ───────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
}
export function AdminButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-150 disabled:opacity-40";

  const sizes = {
    sm: "px-3 py-1.5 text-l",
    md: "px-4 py-2 text-xl",
  };

  const variants = {
    primary: {
      background: adminColors.accent,
      color: "#000",
    },
    ghost: {
      background: "rgba(255,255,255,0.05)",
      color: adminColors.textSecondary,
    },
    danger: {
      background: "rgba(248,113,113,0.12)",
      color: "#f87171",
    },
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${className}`}
      style={variants[variant]}
      onMouseEnter={(e) => {
        if (variant === "primary")
          (e.currentTarget as HTMLButtonElement).style.background =
            adminColors.accentHover;
        if (variant === "ghost")
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(255,255,255,0.09)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          variants[variant].background;
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// ── Badge ────────────────────────────────────────────────────
type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";
const badgeStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" },
  success: { bg: "rgba(52,211,153,0.12)", color: "#34d399" },
  warning: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  danger: { bg: "rgba(248,113,113,0.12)", color: "#f87171" },
  info: { bg: "rgba(96,165,250,0.12)", color: "#60a5fa" },
};
export function AdminBadge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: BadgeVariant;
}) {
  const s = badgeStyles[variant];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-l font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {children}
    </span>
  );
}

// ── Table shell ──────────────────────────────────────────────
export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xl border-collapse">{children}</table>
    </div>
  );
}
export function AdminThead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr style={{ borderBottom: `1px solid ${adminColors.border}` }}>
        {children}
      </tr>
    </thead>
  );
}
export function AdminTh({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-[16px] font-semibold uppercase tracking-wider ${className}`}
      style={{ color: adminColors.textMuted }}
    >
      {children}
    </th>
  );
}
export function AdminTbody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}
export function AdminTr({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <tr
      className={`transition-colors duration-100 ${onClick ? "cursor-pointer" : ""}`}
      style={{ borderBottom: `1px solid ${adminColors.border}` }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background =
          "rgba(255,255,255,0.02)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background =
          "transparent";
      }}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}
export function AdminTd({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-3 ${className}`}
      style={{ color: adminColors.textSecondary }}
    >
      {children}
    </td>
  );
}

// ── Input ─────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}
export function AdminInput({
  label,
  error,
  helperText, // ← destructure so it never reaches ...props
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          className="block text-l font-medium"
          style={{ color: adminColors.textSecondary }}
        >
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 rounded-lg text-xl border
          bg-white/4 text-white/80 placeholder-white/20
          focus:outline-none focus:border-amber-500/50 focus:bg-white/6
          transition-all duration-150 ${className}`}
        style={{ borderColor: error ? "#f87171" : adminColors.border }}
        {...props}
      />
      {error && (
        <p className="text-l" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-l" style={{ color: adminColors.textMuted }}>
          {helperText}
        </p>
      )}
    </div>
  );
}

// ── Select ─────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}
export function AdminSelect({
  label,
  error,
  className = "",
  children,
  ...props
}: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          className="block text-l font-medium"
          style={{ color: adminColors.textSecondary }}
        >
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-3 py-2 rounded-lg text-l border
          bg-white/[0.04] text-white/80
          focus:outline-none focus:border-amber-500/50
          transition-all duration-150 ${className}
        `}
        style={{ borderColor: error ? "#f87171" : adminColors.border }}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-l" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Textarea ─────────────────────────────────────────────────
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export function AdminTextarea({
  label,
  error,
  className = "",
  ...props
}: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          className="block text-l font-medium"
          style={{ color: adminColors.textSecondary }}
        >
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-3 py-2 rounded-lg text-xl border
          bg-white/[0.04] text-white/80 placeholder-white/20
          focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06]
          transition-all duration-150 resize-none ${className}
        `}
        style={{ borderColor: error ? "#f87171" : adminColors.border }}
        rows={3}
        {...props}
      />
      {error && (
        <p className="text-l" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p
        className="text-xl font-medium"
        style={{ color: adminColors.textSecondary }}
      >
        {title}
      </p>
      {description && (
        <p className="text-l mt-1" style={{ color: adminColors.textMuted }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
