"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { LOCATIONS, type Country, type City } from "@/lib/data/locations";

// ─── Search helpers ───────────────────────────────────────────────────────────

function normalize(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

// Common aliases users might type → canonical country name
const COUNTRY_ALIASES: Record<string, string> = {
  usa: "United States",
  us: "United States",
  america: "United States",
  أمريكا: "United States",
  امريكا: "United States",
  "الولايات المتحدة": "United States",
  "united states of america": "United States",
  uk: "United Kingdom",
  "المملكة المتحدة": "United Kingdom",
  بريطانيا: "United Kingdom",
  انجلترا: "United Kingdom",
  إنجلترا: "United Kingdom",
  england: "United Kingdom",
  uae: "United Arab Emirates",
  emirates: "United Arab Emirates",
  الامارات: "United Arab Emirates",
  الإمارات: "United Arab Emirates",
  عمان: "Oman",
  ايران: "Iran",
};

// Build a lookup: normalize(alias or name) → Country
const COUNTRY_LOOKUP = new Map<string, Country>();
for (const country of LOCATIONS) {
  COUNTRY_LOOKUP.set(normalize(country.name), country);
  if (country.nameAr) COUNTRY_LOOKUP.set(normalize(country.nameAr), country);
}
for (const [alias, canonical] of Object.entries(COUNTRY_ALIASES)) {
  const country = LOCATIONS.find((c) => c.name === canonical);
  if (country) COUNTRY_LOOKUP.set(normalize(alias), country);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  locale: "en" | "ar";
  countryLabel: string;
  cityLabel: string;
  districtLabel: string;
  countryPlaceholder: string;
  cityPlaceholder: string;
  districtPlaceholder: string;
  noResultsText: string;
  selectCountryFirstText: string;
  initialCountry?: string;
  initialCity?: string;
  initialDistrict?: string;
  inputClassName: string;
  inputStyle: CSSProperties;
};

type SelectOption = { value: string; label: string };

type SearchableSelectProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  options: SelectOption[];
  placeholder: string;
  disabled?: boolean;
  noResultsText: string;
  inputClassName: string;
  inputStyle: CSSProperties;
  onChange: (value: string) => void;
};

// ─── SearchableSelect ─────────────────────────────────────────────────────────

function SearchableSelect({
  id,
  name,
  label,
  value,
  options,
  placeholder,
  disabled = false,
  noResultsText,
  inputClassName,
  inputStyle,
  onChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  // Clear query when value is reset externally
  useEffect(() => {
    if (!value) setQuery("");
  }, [value]);

  // What to show in the visible input: active query while typing,
  // otherwise the label of the currently selected value
  const displayValue =
    query ||
    (value ? (options.find((o) => o.value === value)?.label ?? value) : "");

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return options;
    return options.filter(
      (o) => normalize(o.value).includes(q) || normalize(o.label).includes(q),
    );
  }, [options, query]);

  return (
    <label htmlFor={id} className="block">
      <span className="text-sm">{label}</span>
      <div ref={wrapperRef} className="relative">
        {/* Hidden input carries the canonical English value for form submission */}
        <input type="hidden" name={name} value={value} />
        <input
          id={id}
          name={`${name}Display`}
          className={`${inputClassName} placeholder:text-[#4b304499]`}
          style={{
            ...inputStyle,
            unicodeBidi: "plaintext",
            textAlign: "start",
            letterSpacing: "normal",
          }}
          value={displayValue}
          placeholder={placeholder}
          dir="auto"
          autoComplete="new-password"
          data-lpignore="true"
          disabled={disabled}
          onFocus={() => {
            if (!disabled) {
              setQuery("");
              setOpen(true);
            }
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
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
            {filtered.length === 0 ? (
              <p
                className="px-3 py-2 text-xs"
                style={{ color: "rgba(75,48,68,0.72)" }}
              >
                {noResultsText}
              </p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-[#4b30441a]"
                  style={{
                    color: "#4b3044",
                    fontFamily: "Tahoma, Arial, 'Noto Sans Arabic', sans-serif",
                  }}
                  dir="auto"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(option.value);
                    setQuery("");
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
    </label>
  );
}

// ─── CountryCityFields ────────────────────────────────────────────────────────

export default function CountryCityFields({
  locale,
  countryLabel,
  cityLabel,
  districtLabel,
  countryPlaceholder,
  cityPlaceholder,
  districtPlaceholder,
  noResultsText,
  selectCountryFirstText,
  initialCountry = "Oman",
  initialCity = "",
  initialDistrict = "",
  inputClassName,
  inputStyle,
}: Props) {
  const isAr = locale === "ar";

  // ── State ──────────────────────────────────────────────────────────────────
  const [country, setCountry] = useState<Country | null>(() => {
    const raw = initialCountry.trim();
    if (!raw) return LOCATIONS[0]; // default → Oman (first in list)
    return COUNTRY_LOOKUP.get(normalize(raw)) ?? LOCATIONS[0];
  });

  const [city, setCity] = useState<City | null>(() => {
    if (!initialCity.trim() || !country) return null;
    return (
      country.cities.find(
        (c) => normalize(c.name) === normalize(initialCity),
      ) ?? null
    );
  });

  const [district, setDistrict] = useState(initialDistrict);

  // ── Derived option lists ───────────────────────────────────────────────────

  const countryOptions = useMemo<SelectOption[]>(
    () =>
      LOCATIONS.map((c) => ({
        value: c.name,
        label: isAr && c.nameAr ? c.nameAr : c.name,
      })),
    [isAr],
  );

  const cityOptions = useMemo<SelectOption[]>(() => {
    if (!country) return [];
    return country.cities.map((c) => ({
      value: c.name,
      label: isAr && c.nameAr ? c.nameAr : c.name,
    }));
  }, [country, isAr]);

  // District dropdown appears only when the selected city has districts defined.
  // No special-casing needed — it's driven purely by the data in locations.ts.
  const districtOptions = useMemo<SelectOption[]>(() => {
    if (!city?.districts?.length) return [];
    return city.districts.map((d) => ({
      value: d.name,
      label: isAr && d.nameAr ? d.nameAr : d.name,
    }));
  }, [city, isAr]);

  const showDistrict = districtOptions.length > 0;

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleCountryChange(name: string) {
    setCountry(COUNTRY_LOOKUP.get(normalize(name)) ?? null);
    setCity(null);
    setDistrict("");
  }

  function handleCityChange(name: string) {
    setCity(country?.cities.find((c) => c.name === name) ?? null);
    setDistrict("");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <SearchableSelect
        id="country"
        name="country"
        label={countryLabel}
        value={country?.name ?? ""}
        options={countryOptions}
        placeholder={countryPlaceholder}
        noResultsText={noResultsText}
        inputClassName={inputClassName}
        inputStyle={inputStyle}
        onChange={handleCountryChange}
      />

      <SearchableSelect
        id="city"
        name="city"
        label={cityLabel}
        value={city?.name ?? ""}
        options={cityOptions}
        placeholder={country ? cityPlaceholder : selectCountryFirstText}
        disabled={!country}
        noResultsText={noResultsText}
        inputClassName={inputClassName}
        inputStyle={inputStyle}
        onChange={handleCityChange}
      />

      {showDistrict && (
        <SearchableSelect
          id="district"
          name="address"
          label={districtLabel}
          value={district}
          options={districtOptions}
          placeholder={districtPlaceholder}
          noResultsText={noResultsText}
          inputClassName={inputClassName}
          inputStyle={inputStyle}
          onChange={setDistrict}
        />
      )}
    </>
  );
}
