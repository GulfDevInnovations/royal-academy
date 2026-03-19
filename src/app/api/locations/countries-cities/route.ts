import { NextResponse } from "next/server";

type CountriesNowResponse = {
  error?: boolean;
  data?: Array<{
    country?: string;
    cities?: string[];
  }>;
};

type RestCountriesItem = {
  name?: {
    common?: string;
    official?: string;
  };
  altSpellings?: string[];
  translations?: {
    ara?: {
      common?: string;
      official?: string;
    };
    eng?: {
      common?: string;
      official?: string;
    };
  };
};

type CountryCity = {
  country: string;
  countryAr?: string;
  cities: string[];
  cityArMap?: Record<string, string>;
};

let cache: CountryCity[] | null = null;
let cachedAt = 0;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DATASET_URL = "https://countriesnow.space/api/v0.1/countries";
const REST_COUNTRIES_URL =
  "https://restcountries.com/v3.1/all?fields=name,translations,altSpellings";

const MAJOR_CITIES_BY_COUNTRY: Record<string, string[]> = {
  oman: ["Muscat", "Salalah", "Sohar", "Nizwa", "Sur", "Buraimi", "Ibri"],
  iran: [
    "Tehran",
    "Mashhad",
    "Isfahan",
    "Shiraz",
    "Tabriz",
    "Karaj",
    "Ahvaz",
    "Qom",
    "Kermanshah",
    "Rasht",
  ],
  "united arab emirates": [
    "Dubai",
    "Abu Dhabi",
    "Sharjah",
    "Ajman",
    "Ras Al Khaimah",
    "Fujairah",
    "Umm Al Quwain",
  ],
  "saudi arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar"],
  qatar: ["Doha", "Al Rayyan", "Al Wakrah", "Umm Salal", "Al Khor"],
  bahrain: ["Manama", "Riffa", "Muharraq", "Hamad Town", "A'ali"],
  kuwait: ["Kuwait City", "Hawalli", "Salmiya", "Farwaniya", "Jahra"],
  egypt: ["Cairo", "Alexandria", "Giza", "Mansoura", "Tanta", "Asyut"],
  turkey: ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Konya"],
  india: [
    "Mumbai",
    "Delhi",
    "Bengaluru",
    "Hyderabad",
    "Chennai",
    "Kolkata",
    "Pune",
    "Ahmedabad",
  ],
  pakistan: ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad"],
  "united states": [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "San Francisco",
    "Miami",
  ],
  "united kingdom": [
    "London",
    "Birmingham",
    "Manchester",
    "Glasgow",
    "Liverpool",
    "Leeds",
  ],
  canada: ["Toronto", "Montreal", "Vancouver", "Calgary", "Ottawa", "Edmonton"],
  australia: [
    "Sydney",
    "Melbourne",
    "Brisbane",
    "Perth",
    "Adelaide",
    "Canberra",
  ],
  germany: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart"],
  france: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes"],
  italy: ["Rome", "Milan", "Naples", "Turin", "Bologna", "Florence"],
  spain: ["Madrid", "Barcelona", "Valencia", "Seville", "Malaga", "Bilbao"],
  netherlands: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven"],
};

const COUNTRY_ALIASES: Record<string, string> = {
  "iran, islamic republic of": "iran",
  "uae": "united arab emirates",
  usa: "united states",
  "united states of america": "united states",
  uk: "united kingdom",
};

const CITY_ARABIC_LABELS: Record<string, Record<string, string>> = {
  oman: {
    Muscat: "مسقط",
    Salalah: "صلالة",
    Sohar: "صحار",
    Nizwa: "نزوى",
    Sur: "صور",
    Buraimi: "البريمي",
    Ibri: "عبري",
  },
  iran: {
    Tehran: "طهران",
    Mashhad: "مشهد",
    Isfahan: "أصفهان",
    Shiraz: "شيراز",
    Tabriz: "تبريز",
    Karaj: "كرج",
    Ahvaz: "الأهواز",
    Qom: "قم",
    Kermanshah: "كرمانشاه",
    Rasht: "رشت",
  },
};

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

function getMajorCitiesOverride(country: string): string[] | null {
  const key = country.trim().toLowerCase();
  const alias = COUNTRY_ALIASES[key];
  const resolved = alias ?? key;
  return MAJOR_CITIES_BY_COUNTRY[resolved] ?? null;
}

function getCityArabicMap(country: string): Record<string, string> | undefined {
  const key = country.trim().toLowerCase();
  const alias = COUNTRY_ALIASES[key];
  const resolved = alias ?? key;
  const mapping = CITY_ARABIC_LABELS[resolved];
  if (!mapping) return undefined;
  return mapping;
}

function buildCountryArabicMap(restItems: RestCountriesItem[]): Map<string, string> {
  const result = new Map<string, string>();

  for (const item of restItems) {
    const ar =
      item.translations?.ara?.common?.trim() ||
      item.translations?.ara?.official?.trim();
    if (!ar) continue;

    const candidates = [
      item.name?.common,
      item.name?.official,
      item.translations?.eng?.common,
      item.translations?.eng?.official,
      ...(item.altSpellings ?? []),
    ].filter((v): v is string => Boolean(v?.trim()));

    for (const candidate of candidates) {
      result.set(normalizeSearchText(candidate), ar);
    }
  }

  return result;
}

function normalizeDataset(
  items: CountriesNowResponse["data"],
  countryArabicMap: Map<string, string>,
): CountryCity[] {
  if (!items) return [];

  const merged = new Map<string, Set<string>>();

  for (const item of items) {
    const country = (item.country ?? "").trim();
    if (!country) continue;

    if (!merged.has(country)) {
      merged.set(country, new Set<string>());
    }

    for (const city of item.cities ?? []) {
      const name = city.trim();
      if (name) {
        merged.get(country)?.add(name);
      }
    }
  }

  return [...merged.entries()]
    .map(([country, cities]) => {
      const curated = getMajorCitiesOverride(country);
      const countryAr = countryArabicMap.get(normalizeSearchText(country));
      const cityArMap = getCityArabicMap(country);
      if (curated) {
        return {
          country,
          countryAr,
          cities: [...new Set(curated)],
          cityArMap,
        };
      }
      return {
        country,
        countryAr,
        cities: [...cities].sort((a, b) => a.localeCompare(b)),
        cityArMap,
      };
    })
    .sort((a, b) => {
      if (a.country === "Oman") return -1;
      if (b.country === "Oman") return 1;
      return a.country.localeCompare(b.country);
    });
}

export async function GET() {
  const now = Date.now();

  if (cache && now - cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({ data: cache });
  }

  try {
    const [countriesResponse, restResponse] = await Promise.all([
      fetch(DATASET_URL, {
        next: { revalidate: 60 * 60 * 24 },
      }),
      fetch(REST_COUNTRIES_URL, {
        next: { revalidate: 60 * 60 * 24 },
      }).catch(() => null),
    ]);

    if (!countriesResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch countries and cities." },
        { status: 502 },
      );
    }

    const payload = (await countriesResponse.json()) as CountriesNowResponse;
    const restPayload = restResponse?.ok
      ? ((await restResponse.json()) as RestCountriesItem[])
      : [];
    const countryArabicMap = buildCountryArabicMap(restPayload);
    const normalized = normalizeDataset(payload.data, countryArabicMap);

    if (normalized.length === 0) {
      return NextResponse.json(
        { error: "Countries and cities dataset is empty." },
        { status: 502 },
      );
    }

    cache = normalized;
    cachedAt = now;

    return NextResponse.json({ data: normalized });
  } catch {
    return NextResponse.json(
      { error: "Failed to load countries and cities." },
      { status: 502 },
    );
  }
}
