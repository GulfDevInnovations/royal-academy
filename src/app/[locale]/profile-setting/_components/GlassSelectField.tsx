"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type SelectOption = {
  value: string;
  label: string;
  aliases?: string[];
};

type GlassSelectFieldProps = {
  id: string;
  name: string;
  value: string;
  options: SelectOption[];
  placeholder: string;
  noResultsText: string;
  inputClassName: string;
  inputStyle: CSSProperties;
  disabled?: boolean;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
};

export default function GlassSelectField({
  id,
  name,
  value,
  options,
  placeholder,
  noResultsText,
  inputClassName,
  inputStyle,
  disabled = false,
  ariaInvalid,
  ariaDescribedBy,
}: GlassSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const hiddenRef = useRef<HTMLInputElement | null>(null);

  const labelByValue = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of options) {
      if (option.value !== "") {
        map.set(option.value, option.label);
      }
    }
    return map;
  }, [options]);

  useEffect(() => {
    setSelectedValue(value);
    setQuery(labelByValue.get(value) ?? "");
  }, [labelByValue, value]);

  useEffect(() => {
    const hidden = hiddenRef.current;
    if (!hidden) return;
    hidden.dispatchEvent(new Event("input", { bubbles: true }));
    hidden.dispatchEvent(new Event("change", { bubbles: true }));
  }, [selectedValue]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery(labelByValue.get(selectedValue) ?? "");
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [labelByValue, selectedValue]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => {
      if (option.label.toLowerCase().includes(q)) return true;
      return (option.aliases ?? []).some((alias) =>
        alias.toLowerCase().includes(q),
      );
    });
  }, [options, query]);

  const displayId = `${id}Display`;

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={hiddenRef}
        id={id}
        name={name}
        type="hidden"
        value={selectedValue}
        readOnly
      />
      <input
        id={displayId}
        name={`${name}Display`}
        className={`${inputClassName} placeholder:text-[#4b304499]`}
        style={{
          ...inputStyle,
          fontFamily: "Tahoma, Arial, 'Noto Sans Arabic', sans-serif",
        }}
        value={query}
        placeholder={placeholder}
        autoComplete="new-password"
        data-lpignore="true"
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          if (next.trim().length === 0) {
            setSelectedValue("");
          }
          if (!disabled) setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            setQuery(labelByValue.get(selectedValue) ?? "");
          }
        }}
      />

      {open && !disabled && (
        <div
          className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl p-1"
          style={{
            background:
              "linear-gradient(135deg, rgba(228,208,181,0.82) 0%, rgba(228,208,181,0.76) 50%, rgba(228,208,181,0.8) 100%)",
            backdropFilter: "blur(14px) saturate(1.1)",
            WebkitBackdropFilter: "blur(14px) saturate(1.1)",
            border: "1px solid rgba(75,48,68,0.28)",
            boxShadow:
              "0 16px 38px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.2)",
          }}
        >
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-2 text-xs" style={{ color: "rgba(75,48,68,0.72)" }}>
              {noResultsText}
            </p>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value || "__empty__"}
                type="button"
                className="w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-[#4b30441a]"
                style={{
                  color: "#4b3044",
                  fontFamily: "Tahoma, Arial, 'Noto Sans Arabic', sans-serif",
                }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSelectedValue(option.value);
                  setQuery(option.label);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
