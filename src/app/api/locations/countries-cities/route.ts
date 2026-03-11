import { NextResponse } from "next/server";

type CountriesNowResponse = {
  error?: boolean;
  data?: Array<{
    country?: string;
    cities?: string[];
  }>;
};

type CountryCity = {
  country: string;
  cities: string[];
};

let cache: CountryCity[] | null = null;
let cachedAt = 0;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DATASET_URL = "https://countriesnow.space/api/v0.1/countries";

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

function getMajorCitiesOverride(country: string): string[] | null {
  const key = country.trim().toLowerCase();
  const alias = COUNTRY_ALIASES[key];
  const resolved = alias ?? key;
  return MAJOR_CITIES_BY_COUNTRY[resolved] ?? null;
}

function normalizeDataset(items: CountriesNowResponse["data"]): CountryCity[] {
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
      if (curated) {
        return { country, cities: [...new Set(curated)] };
      }
      return {
        country,
        cities: [...cities].sort((a, b) => a.localeCompare(b)),
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
    const response = await fetch(DATASET_URL, {
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch countries and cities." },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as CountriesNowResponse;
    const normalized = normalizeDataset(payload.data);

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
