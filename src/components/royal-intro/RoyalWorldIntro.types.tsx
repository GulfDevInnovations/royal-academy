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
  subclasses: { label: string; href: string; image?: string }[];
  image: string;
}

export const SECTIONS: Section[] = [
  {
    id: "ballet",
    label: "Ballet",
    subclasses: [
      { label: "Baby Ballet", href: "/baby-ballet", image: "/images/babyballet.png" },
      { label: "RAD Ballet", href: "/rad-ballet", image: "/images/ballet.png" },
      { label: "Open Ballet", href: "/open-ballet", image: "/images/ballet-hero.jpg" },
    ],
    image: "/images/HeroSection/balletGold.png",
  },
  {
    id: "dance-wellness",
    label: "Dance & Wellness",
    subclasses: [
      { label: "Hip Hop", href: "/contemporary-dance", image: "/images/hiphop01.png" },
      { label: "Aerial Hoop", href: "/yoga-movement", image: "/images/contemporarydance.png" },
      { label: "Zumba", href: "/Zumba", image: "/images/jazzdance.png" },
      { label: "Salsa", href: "/Salsa", image: "/images/jazzdance01.png" },
      { label: "Yoga", href: "/Yoga", image: "/images/movement01.png" },
      { label: "Breath & Balance", href: "/Breath", image: "/images/movement02.png" },
      { label: "Wellness & Mindful Movement", href: "/Wellness", image: "/images/movement03.png" },
      { label: "Mindfulness", href: "/Mindfulness", image: "/images/movement04.png" },
      { label: "Gymnastics for kids", href: "/Gymnastics", image: "/images/babygymnastics.png" },
      { label: "Body Flexibility", href: "/Flexibility", image: "/images/movement05.png" },
      { label: "Stretch & conditioning", href: "/Stretch", image: "/images/movement06.png" },
      { label: "Posture & Mobility", href: "/Posture", image: "/images/movement07.png" },
      { label: "Timeless Movement", href: "/Timeless", image: "/images/movement08.png" },
      { label: "Movement Retreats", href: "/Movement", image: "/images/movement09.png" },
    ],
    image: "/images/HeroSection/dance&wellnessGold.png",
  },
  {
    id: "music",
    label: "Music",
    subclasses: [
      { label: "Piano-Academic Learning", href: "/piano-academic", image: "/images/piano.jpg" },
      { label: "Piano-Ear Learning", href: "/piano-Ear-learning", image: "/images/piano.jpg" },
      { label: "Piano-Freelance", href: "/vocal-training", image: "/images/piano.jpg" },
      { label: "Guitar", href: "/guitar", image: "/images/guitar.png" },
      { label: "Violin", href: "/violin", image: "/images/violin.png" },
      { label: "Oud", href: "/oud", image: "/images/oud.png" },
      { label: "Drums", href: "/drums", image: "/images/drums.png" },
      { label: "Handpan", href: "/handpan", image: "/images/music-hero.jpg" },
      { label: "Percussion", href: "/percussion", image: "/images/drums.png" },
      { label: "Darbuka", href: "/darbuka", image: "/images/durbuka.png" },
      { label: "Bass", href: "/bass", image: "/images/bass.png" },
      { label: "Vocal", href: "/vocal", image: "/images/music-hero.jpg" },
      { label: "Theory", href: "/theory", image: "/images/stave.png" },
      { label: "Sight Reading", href: "/sight-Reading", image: "/images/stave.png" },
      { label: "Solfège", href: "/solfège", image: "/images/stave.png" },
      { label: "Music Awakening", href: "/music-awakening", image: "/images/musicawakening.png" },
    ],
    image: "/images/HeroSection/musicGold.png",
  },
  {
    id: "art",
    label: "Art",
    subclasses: [
      { label: "Drawing I Basic to Advance", href: "/drawing-painting", image: "/images/drawingsample.png" },
      { label: "Shading & Color Techniques", href: "/sculpture", image: "/images/shadingsmaple.png" },
      { label: "Portrait & Caricature", href: "/digital-art", image: "/images/portrait&caricaturesample.png" },
      { label: "Mandala Dotting art", href: "/Mandala", image: "/images/mandala&dottingartsample.png" },
      { label: "Colored Pencil Drawing", href: "/Colored", image: "/images/coloredpencildrawingsample.png" },
      { label: "Calligraphy", href: "/Calligraphy", image: "/images/calligraphysample.png" },
      { label: "Acrylic", href: "/Acrylic", image: "/images/acrylicsample.png" },
      { label: "Oil painting", href: "/Oil", image: "/images/oilpaintingsample.png" },
      { label: "WaterColor", href: "/WaterColor", image: "/images/watercolorsample.png" },
      { label: "Mixed Media", href: "/Mixed", image: "/images/mixedmediasample.png" },
      { label: "Arts & Crafts(kids)", href: "/Arts", image: "/images/arts&crafts.png" },
      { label: "Drawing I Basic to Advance(kids)", href: "/Drawing", image: "/images/animationdrawing.png" },
      { label: "Shading & Color Techniques(kids)", href: "/Shading", image: "/images/shadingsmaple.png" },
      { label: "Portrait & Caricature(kids)", href: "/Portrait", image: "/images/portrait&caricaturesample.png" },
      { label: "Animation Drawing(kids)", href: "/Animation", image: "/images/animationdrawing.png" },
      { label: "Paper Art(kids)", href: "/Paper", image: "/images/paperartsample.png" },
      { label: "Collage(kids)", href: "/Collage", image: "/images/collagesample.png" },
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
