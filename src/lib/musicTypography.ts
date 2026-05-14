export const musicTypography = {
  title: "font-goudy text-[1.55rem] leading-tight sm:text-[1.85rem] lg:text-[2.1rem]",
  titleCompact:
    "font-goudy text-[1.3rem] leading-tight sm:text-[1.55rem] lg:text-[1.85rem]",

  captionCaps:
    "text-[11px] uppercase tracking-[0.18em] leading-5",
  metaCaps: "text-[11px] uppercase tracking-[0.16em]",

  body: "text-[14px] leading-6 sm:text-[15px] sm:leading-7",
  bodyLong: "text-[15px] leading-7 sm:text-[16px] sm:leading-8",

  helperCaps: "text-[11px] uppercase tracking-[0.22em]",
  ctaCaps: "text-[11px] font-medium uppercase tracking-[0.2em]",
  ctaCapsNarrow: "text-[11px] font-medium uppercase tracking-[0.12em]",

  arabicMicro: "text-[13px] leading-6",
  arabicCta: "text-[13px] font-medium leading-6",
} as const;

export function musicHelperTextClass(isArabic: boolean) {
  return isArabic ? musicTypography.arabicMicro : musicTypography.helperCaps;
}

export function musicCtaTextClass(
  isArabic: boolean,
  variant: "default" | "narrow" = "default",
) {
  if (isArabic) return musicTypography.arabicCta;
  return variant === "narrow"
    ? musicTypography.ctaCapsNarrow
    : musicTypography.ctaCaps;
}
