// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type ContentCard = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  mediaUrls: string[];
  videoUrls: string[];
  thumbnailUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  isExternal: boolean;
  badgeLabel: string | null;
  eventDate?: string | null;
  expireAt?: string | null;
  slug?: string;
};

export interface Props {
  upcoming: ContentCard[];
  news: ContentCard[];
  offers: ContentCard[];
  logoUrl?: string;
  backgroundImageUrl?: string;
  onScrollDown?: () => void;
  active?: boolean;
}

// ─────────────────────────────────────────────
// SECTIONS DATA
// ─────────────────────────────────────────────

export interface Section {
  id: string;
  label: string;
  subclasses: { label: string; href: string }[];
  image: string;
}

export const SECTIONS: Section[] = [
  {
    id: "ballet",
    label: "Ballet",
    subclasses: [
      { label: "Baby Ballet", href: "/baby-ballet" },
      { label: "RAD Ballet", href: "/rad-ballet" },
      { label: "Open Ballet", href: "/open-ballet" },
    ],
    image: "/images/HeroSection/balletGold.png",
  },
  {
    id: "dance-wellness",
    label: "Dance & Wellness",
    subclasses: [
      { label: "Hip Hop", href: "/contemporary-dance" },
      { label: "Aerial Hoop", href: "/yoga-movement" },
      { label: "Zumba", href: "/Zumba" },
      { label: "Salsa", href: "/Salsa" },
      { label: "Yoga", href: "/Yoga" },
      { label: "Breath & Balance", href: "/Breath" },
      { label: "Wellness & Mindful Movement", href: "/Wellness" },
      { label: "Mindfulness", href: "/Mindfulness" },
      { label: "Gymnastics for kids", href: "/Gymnastics" },
      { label: "Body Flexibility", href: "/Flexibility" },
      { label: "Stretch & conditioning", href: "/Stretch" },
      { label: "Posture & Mobility", href: "/Posture" },
      { label: "Timeless Movement", href: "/Timeless" },
      { label: "Movement Retreats", href: "/Movement" },
    ],
    image: "/images/HeroSection/dance&wellnessGold.png",
  },
  {
    id: "music",
    label: "Music",
    subclasses: [
      { label: "Piano-Academic Learning", href: "/piano-academic" },
      { label: "Piano-Ear Learning", href: "/piano-Ear-learning" },
      { label: "Piano-Freelance", href: "/vocal-training" },
      { label: "Guitar", href: "/guitar" },
      { label: "Violin", href: "/violin" },
      { label: "Oud", href: "/oud" },
      { label: "Drums", href: "/drums" },
      { label: "Handpan", href: "/handpan" },
      { label: "Percussion", href: "/percussion" },
      { label: "Darbuka", href: "/darbuka" },
      { label: "Bass", href: "/bass" },
      { label: "Vocal", href: "/vocal" },
      { label: "Theory", href: "/theory" },
      { label: "Sight Reading", href: "/sight-Reading" },
      { label: "Solfège", href: "/solfège" },
      { label: "Music Awakening", href: "/music-awakening" },
    ],
    image: "/images/HeroSection/musicGold.png",
  },
  {
    id: "art",
    label: "Art",
    subclasses: [
      { label: "Drawing I Basic to Advance", href: "/drawing-painting" },
      { label: "Shading & Color Techniques", href: "/sculpture" },
      { label: "Portrait & Caricature", href: "/digital-art" },
      { label: "Mandala Dotting art", href: "/Mandala" },
      { label: "Colored Pencil Drawing", href: "/Colored" },
      { label: "Calligraphy", href: "/Calligraphy" },
      { label: "Acrylic", href: "/Acrylic" },
      { label: "Oil painting", href: "/Oil" },
      { label: "WaterColor", href: "/WaterColor" },
      { label: "Mixed Media", href: "/Mixed" },
      { label: "Arts & Crafts(kids)", href: "/Arts" },
      { label: "Drawing I Basic to Advance(kids)", href: "/Drawing" },
      { label: "Shading & Color Techniques(kids)", href: "/Shading" },
      { label: "Portrait & Caricature(kids)", href: "/Portrait" },
      { label: "Animation Drawing(kids)", href: "/Animation" },
      { label: "Paper Art(kids)", href: "/Paper" },
      { label: "Collage(kids)", href: "/Collage" },
    ],
    image: "/images/HeroSection/artGold.png",
  },
];

// ─────────────────────────────────────────────
// EMPTY CARD FALLBACK
// ─────────────────────────────────────────────

export function emptyCard(id: string, message: string): ContentCard {
  return {
    id,
    title: message,
    subtitle: null,
    description: null,
    mediaUrls: [],
    videoUrls: [],
    thumbnailUrl: null,
    linkUrl: null,
    linkLabel: null,
    isExternal: false,
    badgeLabel: null,
    expireAt: null,
  };
}
