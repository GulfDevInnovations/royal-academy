"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type CountryCity = {
  country: string;
  cities: string[];
};

type ApiResponse = {
  data?: CountryCity[];
  error?: string;
};

const INITIAL_COUNTRY_ALIASES: Record<string, string> = {
  usa: "United States",
  us: "United States",
  "united states of america": "United States",
  uk: "United Kingdom",
  "iran, islamic republic of": "Iran",
};

function normalizeInitialCountry(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const mapped = INITIAL_COUNTRY_ALIASES[trimmed.toLowerCase()];
  return mapped ?? trimmed;
}

type CountryCityFieldsProps = {
  countryLabel: string;
  cityLabel: string;
  countryPlaceholder: string;
  cityPlaceholder: string;
  noResultsText: string;
  selectCountryFirstText: string;
  loadingText: string;
  loadErrorText: string;
  initialCountry: string;
  initialCity: string;
  inputClassName: string;
  inputStyle: CSSProperties;
};

type SearchableSelectProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  pinFirstOption?: string;
  noResultsText: string;
  inputClassName: string;
  inputStyle: CSSProperties;
  searchAliasesByOption?: Record<string, string[]>;
  normalizeValue?: (raw: string) => string;
  onChange: (nextValue: string) => void;
};

function SearchableSelect({
  id,
  name,
  label,
  value,
  options,
  placeholder,
  disabled = false,
  pinFirstOption,
  noResultsText,
  inputClassName,
  inputStyle,
  searchAliasesByOption,
  normalizeValue,
  onChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  const filteredOptions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return options.slice(0, 120);
    const matched = options
      .filter((option) => {
        if (option.toLowerCase().includes(query)) return true;
        const aliases = searchAliasesByOption?.[option] ?? [];
        return aliases.some((alias) => alias.toLowerCase().includes(query));
      })
      .slice(0, 120);

    if (!pinFirstOption) return matched;

    const index = matched.findIndex(
      (option) => option.toLowerCase() === pinFirstOption.toLowerCase(),
    );
    if (index <= 0) return matched;

    const pinned = matched[index];
    const withoutPinned = matched.filter((_, i) => i !== index);
    return [pinned, ...withoutPinned];
  }, [options, pinFirstOption, searchAliasesByOption, value]);

  return (
    <label htmlFor={id} className="block">
      <span className="text-sm">{label}</span>
      <div ref={wrapperRef} className="relative">
        <input type="hidden" name={name} value={value} />
        <input
          id={id}
          name={`${name}Display`}
          className={`${inputClassName} placeholder:text-[#4b304499]`}
          style={inputStyle}
          value={value}
          placeholder={placeholder}
          autoComplete="new-password"
          data-lpignore="true"
          disabled={disabled}
          onFocus={() => {
            if (!disabled) setOpen(true);
          }}
          onChange={(event) => {
            const raw = event.target.value;
            const normalized = normalizeValue ? normalizeValue(raw) : raw;
            onChange(normalized);
            if (!disabled) setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
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
                  key={option}
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-[#4b30441a]"
                  style={{ color: "#4b3044" }}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  {option}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </label>
  );
}

export default function CountryCityFields({
  countryLabel,
  cityLabel,
  countryPlaceholder,
  cityPlaceholder,
  noResultsText,
  selectCountryFirstText,
  loadingText,
  loadErrorText,
  initialCountry,
  initialCity,
  inputClassName,
  inputStyle,
}: CountryCityFieldsProps) {
  const [country, setCountry] = useState(() => {
    const normalized = normalizeInitialCountry(initialCountry);
    if (!normalized || normalized.toLowerCase() === "america") {
      return "Oman";
    }
    return normalized;
  });
  const [city, setCity] = useState(initialCity);
  const [items, setItems] = useState<CountryCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDataset() {
      try {
        setLoading(true);
        setLoadError(false);

        const response = await fetch("/api/locations/countries-cities", {
          method: "GET",
          cache: "force-cache",
        });

        const payload = (await response.json()) as ApiResponse;
        if (!response.ok || !payload.data) {
          throw new Error(payload.error || "Failed to load locations.");
        }

        if (!active) return;
        setItems(payload.data);
      } catch {
        if (!active) return;
        setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDataset();

    return () => {
      active = false;
    };
  }, []);

  const cityLookup = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const item of items) {
      map.set(item.country.toLowerCase(), item.cities);
    }
    return map;
  }, [items]);

  const countryKey = country.trim().toLowerCase();
  const cityOptions = useMemo(
    () => cityLookup.get(countryKey) ?? [],
    [cityLookup, countryKey],
  );
  const isKnownCountry = cityLookup.has(countryKey);
  const isCityDisabled = !country || !isKnownCountry;
  const countryOptions = useMemo(() => items.map((item) => item.country), [items]);
  const countryOptionsWithOmanPinned = useMemo(() => {
    const options = [...countryOptions];
    const index = options.findIndex(
      (option) => option.toLowerCase() === "oman",
    );
    if (index <= 0) return options;

    const [oman] = options.splice(index, 1);
    return [oman, ...options];
  }, [countryOptions]);

  const countryAliasMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const option of countryOptions) {
      if (option === "United States") {
        map[option] = ["USA", "US", "America", "United States of America"];
      } else if (option === "United Kingdom") {
        map[option] = ["UK", "Britain", "Great Britain", "England"];
      } else if (option === "United Arab Emirates") {
        map[option] = ["UAE", "Emirates"];
      } else if (option === "Iran") {
        map[option] = ["Iran, Islamic Republic of"];
      } else {
        map[option] = [];
      }
    }
    return map;
  }, [countryOptions]);

  const aliasToCanonical = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of countryOptions) {
      map.set(option.toLowerCase(), option);
      for (const alias of countryAliasMap[option] ?? []) {
        map.set(alias.toLowerCase(), option);
      }
    }
    return map;
  }, [countryAliasMap, countryOptions]);

  useEffect(() => {
    if (isCityDisabled) {
      if (city) setCity("");
      return;
    }
  }, [city, isCityDisabled]);

  return (
    <>
      <SearchableSelect
        id="country"
        name="country"
        label={countryLabel}
        value={country}
        options={countryOptionsWithOmanPinned}
        placeholder={countryPlaceholder}
        noResultsText={noResultsText}
        inputClassName={inputClassName}
        inputStyle={inputStyle}
        searchAliasesByOption={countryAliasMap}
        normalizeValue={(raw) => {
          const key = raw.trim().toLowerCase();
          return aliasToCanonical.get(key) ?? raw;
        }}
        pinFirstOption="Oman"
        onChange={setCountry}
      />
      {loading && (
        <p className="mt-1 text-xs" style={{ color: "rgba(228,208,181,0.65)" }}>
          {loadingText}
        </p>
      )}
      {loadError && (
        <p className="mt-1 text-xs" style={{ color: "#f87171" }}>
          {loadErrorText}
        </p>
      )}

      <SearchableSelect
        id="city"
        name="city"
        label={cityLabel}
        value={city}
        options={cityOptions}
        placeholder={isCityDisabled ? selectCountryFirstText : cityPlaceholder}
        disabled={isCityDisabled}
        noResultsText={noResultsText}
        inputClassName={inputClassName}
        inputStyle={inputStyle}
        onChange={setCity}
      />
    </>
  );
}
