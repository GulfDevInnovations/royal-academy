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
  countryAr?: string;
  cities: string[];
  cityArMap?: Record<string, string>;
};

type ApiResponse = {
  data?: CountryCity[];
  error?: string;
};

const INITIAL_COUNTRY_ALIASES: Record<string, string> = {
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
  "iran, islamic republic of": "Iran",
  ايران: "Iran",
  إيران: "Iran",
  عمان: "Oman",
};

function normalizeInitialCountry(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const mapped = INITIAL_COUNTRY_ALIASES[normalizeSearchText(trimmed)];
  return mapped ?? trimmed;
}

function normalizeSearchText(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

type CountryCityFieldsProps = {
  locale: "en" | "ar";
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
  optionLabelByValue?: Record<string, string>;
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
  optionLabelByValue,
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
    const query = normalizeSearchText(value);
    if (!query) return options.slice(0, 120);

    const hasExactMatch = options.some((option) => {
      const normalizedOption = normalizeSearchText(option);
      const normalizedLabel = normalizeSearchText(
        optionLabelByValue?.[option] ?? option,
      );
      if (normalizedOption === query || normalizedLabel === query) return true;
      const aliases = searchAliasesByOption?.[option] ?? [];
      return aliases.some((alias) => normalizeSearchText(alias) === query);
    });

    // When input already equals a selected option (e.g. default Oman),
    // keep the full list visible on open instead of collapsing to one row.
    if (hasExactMatch) return options.slice(0, 120);

    const matched = options
      .filter((option) => {
        if (normalizeSearchText(option).includes(query)) return true;
        const label = optionLabelByValue?.[option] ?? option;
        if (normalizeSearchText(label).includes(query)) return true;
        const aliases = searchAliasesByOption?.[option] ?? [];
        return aliases.some((alias) =>
          normalizeSearchText(alias).includes(query),
        );
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
  }, [optionLabelByValue, options, pinFirstOption, searchAliasesByOption, value]);

  return (
    <label htmlFor={id} className="block">
      <span className="text-sm">{label}</span>
      <div ref={wrapperRef} className="relative">
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
          value={value}
          placeholder={placeholder}
          dir="auto"
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
                  style={{
                    color: "#4b3044",
                    fontFamily: "Tahoma, Arial, 'Noto Sans Arabic', sans-serif",
                  }}
                  dir="auto"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  {optionLabelByValue?.[option] ?? option}
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
  locale,
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
    const map = new Map<
      string,
      { cities: string[]; cityArMap?: Record<string, string> }
    >();
    for (const item of items) {
      map.set(normalizeSearchText(item.country), {
        cities: item.cities,
        cityArMap: item.cityArMap,
      });
    }
    return map;
  }, [items]);

  const countryKey = normalizeSearchText(country);
  const selectedCountryData = cityLookup.get(countryKey);
  const cityOptions = useMemo(
    () => selectedCountryData?.cities ?? [],
    [selectedCountryData],
  );
  const isKnownCountry = Boolean(selectedCountryData);
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
        map[option] = [
          "USA",
          "US",
          "America",
          "United States of America",
          "أمريكا",
          "امريكا",
          "الولايات المتحدة",
        ];
      } else if (option === "United Kingdom") {
        map[option] = [
          "UK",
          "Britain",
          "Great Britain",
          "England",
          "المملكة المتحدة",
          "بريطانيا",
          "إنجلترا",
          "انجلترا",
        ];
      } else if (option === "United Arab Emirates") {
        map[option] = ["UAE", "Emirates", "الإمارات", "الامارات"];
      } else if (option === "Iran") {
        map[option] = ["Iran, Islamic Republic of", "إيران", "ايران"];
      } else if (option === "Oman") {
        map[option] = ["عمان"];
      } else {
        map[option] = [];
      }
    }
    return map;
  }, [countryOptions]);

  const aliasToCanonical = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of countryOptions) {
      map.set(normalizeSearchText(option), option);
      for (const alias of countryAliasMap[option] ?? []) {
        map.set(normalizeSearchText(alias), option);
      }
    }
    return map;
  }, [countryAliasMap, countryOptions]);

  const countryLabelMap = useMemo(() => {
    if (locale !== "ar") return {};
    const map: Record<string, string> = {};
    for (const item of items) {
      if (item.countryAr) {
        map[item.country] = item.countryAr;
      }
    }
    return map;
  }, [items, locale]);

  const cityLabelMap = useMemo(() => {
    if (locale !== "ar") return {};
    return selectedCountryData?.cityArMap ?? {};
  }, [locale, selectedCountryData]);

  const cityAliasMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    if (locale !== "ar") return map;

    if (countryKey === "oman") {
      map["Muscat"] = ["مسقط"];
      map["Salalah"] = ["صلالة"];
      map["Sohar"] = ["صحار"];
      map["Nizwa"] = ["نزوى"];
      map["Sur"] = ["صور"];
      map["Buraimi"] = ["البريمي"];
      map["Ibri"] = ["عبري"];
    }

    if (countryKey === "iran") {
      map["Tehran"] = ["طهران"];
      map["Shiraz"] = ["شيراز"];
      map["Mashhad"] = ["مشهد"];
      map["Isfahan"] = ["أصفهان", "اصفهان"];
      map["Tabriz"] = ["تبريز"];
    }

    return map;
  }, [countryKey, locale]);

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
        optionLabelByValue={countryLabelMap}
        placeholder={countryPlaceholder}
        noResultsText={noResultsText}
        inputClassName={inputClassName}
        inputStyle={inputStyle}
        searchAliasesByOption={countryAliasMap}
        normalizeValue={(raw) => {
          const key = normalizeSearchText(raw);
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
        optionLabelByValue={cityLabelMap}
        placeholder={isCityDisabled ? selectCountryFirstText : cityPlaceholder}
        disabled={isCityDisabled}
        noResultsText={noResultsText}
        inputClassName={inputClassName}
        inputStyle={inputStyle}
        searchAliasesByOption={cityAliasMap}
        onChange={setCity}
      />
    </>
  );
}
