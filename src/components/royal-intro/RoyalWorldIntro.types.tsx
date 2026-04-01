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
      {
        label: "Baby Ballet",
        href: "/classes/ballet/baby-ballet",
        image: "/images/babyballet.png",
      },
      {
        label: "RAD Ballet",
        href: "/classes/ballet/rad-ballet",
        image: "/images/ballet.png",
      },
      {
        label: "Open Ballet",
        href: "/classes/ballet/open-ballet",
        image: "/images/ballet-hero.jpg",
      },
    ],
    image: "/images/HeroSection/balletGold.png",
  },
  {
    id: "dance-wellness",
    label: "Dance & Wellness",
    subclasses: [
      {
        label: "Hip Hop",
        href: "/classes/dance/contemporary-dance",
        image: "/images/hiphop01.png",
      },
      {
        label: "Aerial Hoop",
        href: "/classes/dance/aerial-hoop",
        image: "/images/contemporarydance.png",
      },
      {
        label: "Zumba",
        href: "/classes/dance/zumba",
        image: "/images/jazzdance.png",
      },
      {
        label: "Salsa",
        href: "/classes/dance/salsa",
        image: "/images/jazzdance01.png",
      },
      {
        label: "Yoga",
        href: "/classes/dance",
        image: "/images/movement01.png",
      },
      {
        label: "Breath & Balance",
        href: "/classes/dance",
        image: "/images/movement02.png",
      },
      {
        label: "Wellness & Mindful Movement",
        href: "/classes/dance",
        image: "/images/movement03.png",
      },
      {
        label: "Mindfulness",
        href: "/classes/dance",
        image: "/images/movement04.png",
      },
      {
        label: "Gymnastics for kids",
        href: "/classes/dance/kids-movements",
        image: "/images/babygymnastics.png",
      },
      {
        label: "Body Flexibility",
        href: "/classes/dance/body&flexibility",
        image: "/images/movement05.png",
      },
      {
        label: "Stretch & conditioning",
        href: "/classes/dance",
        image: "/images/movement06.png",
      },
      {
        label: "Posture & Mobility",
        href: "/classes/dance",
        image: "/images/movement07.png",
      },
      {
        label: "Timeless Movement",
        href: "/classes/dance",
        image: "/images/movement08.png",
      },
      {
        label: "Movement Retreats",
        href: "/classes/dance",
        image: "/images/movement09.png",
      },
    ],
    image: "/images/HeroSection/dance&wellnessGold.png",
  },
  {
    id: "music",
    label: "Music",
    subclasses: [
      {
        label: "Piano-Academic Learning",
        href: "/classes/music/piano",
        image: "/images/piano.jpg",
      },
      {
        label: "Piano-Ear Learning",
        href: "/classes/music/piano",
        image: "/images/piano.jpg",
      },
      {
        label: "Piano-Freelance",
        href: "/classes/music/piano",
        image: "/images/piano.jpg",
      },
      {
        label: "Guitar",
        href: "/classes/music/guitar",
        image: "/images/guitar.png",
      },
      {
        label: "Violin",
        href: "/classes/music/violin",
        image: "/images/violin.png",
      },
      { label: "Oud", href: "/classes/music/oud", image: "/images/oud.png" },
      {
        label: "Drums",
        href: "/classes/music/drumsandpercussion",
        image: "/images/drums.png",
      },
      {
        label: "Handpan",
        href: "/classes/music/handpan",
        image: "/images/music-hero.jpg",
      },
      {
        label: "Percussion",
        href: "/classes/music/drumsandpercussion",
        image: "/images/drums.png",
      },
      {
        label: "Darbuka",
        href: "/classes/music/durbuka",
        image: "/images/durbuka.png",
      },
      { label: "Bass", href: "/classes/music/bass", image: "/images/bass.png" },
      {
        label: "Vocal",
        href: "/classes/music/vocal",
        image: "/images/music-hero.jpg",
      },
      {
        label: "Theory",
        href: "/classes/music/theory",
        image: "/images/stave.png",
      },
      {
        label: "Sight Reading",
        href: "/classes/music/sightreading",
        image: "/images/stave.png",
      },
      {
        label: "Solfège",
        href: "/classes/music/solfege",
        image: "/images/stave.png",
      },
      {
        label: "Music Awakening",
        href: "/classes/music/musicawakening",
        image: "/images/musicawakening.png",
      },
    ],
    image: "/images/HeroSection/musicGold.png",
  },
  {
    id: "art",
    label: "Art",
    subclasses: [
      {
        label: "Drawing I Basic to Advance",
        href: "/classes/art",
        image: "/images/drawingsample.png",
      },
      {
        label: "Shading & Color Techniques",
        href: "/classes/art",
        image: "/images/shadingsmaple.png",
      },
      {
        label: "Portrait & Caricature",
        href: "/classes/art",
        image: "/images/portrait&caricaturesample.png",
      },
      {
        label: "Mandala Dotting art",
        href: "/classes/art",
        image: "/images/mandala&dottingartsample.png",
      },
      {
        label: "Colored Pencil Drawing",
        href: "/classes/art",
        image: "/images/coloredpencildrawingsample.png",
      },
      {
        label: "Calligraphy",
        href: "/classes/art",
        image: "/images/calligraphysample.png",
      },
      {
        label: "Acrylic",
        href: "/classes/art",
        image: "/images/acrylicsample.png",
      },
      {
        label: "Oil painting",
        href: "/classes/art",
        image: "/images/oilpaintingsample.png",
      },
      {
        label: "WaterColor",
        href: "/classes/art",
        image: "/images/watercolorsample.png",
      },
      {
        label: "Mixed Media",
        href: "/classes/art",
        image: "/images/mixedmediasample.png",
      },
      {
        label: "Arts & Crafts(kids)",
        href: "/classes/art",
        image: "/images/arts&crafts.png",
      },
      {
        label: "Drawing I Basic to Advance(kids)",
        href: "/classes/art",
        image: "/images/animationdrawing.png",
      },
      {
        label: "Shading & Color Techniques(kids)",
        href: "/classes/art",
        image: "/images/shadingsmaple.png",
      },
      {
        label: "Portrait & Caricature(kids)",
        href: "/classes/art",
        image: "/images/portrait&caricaturesample.png",
      },
      {
        label: "Animation Drawing(kids)",
        href: "/classes/art",
        image: "/images/animationdrawing.png",
      },
      {
        label: "Paper Art(kids)",
        href: "/classes/art",
        image: "/images/paperartsample.png",
      },
      {
        label: "Collage(kids)",
        href: "/classes/art",
        image: "/images/collagesample.png",
      },
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
