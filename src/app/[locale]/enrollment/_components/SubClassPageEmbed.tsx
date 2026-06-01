'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Strip everything except a-z 0-9 and lowercase — used to build registry keys
// from DB names like "Yoga & Wellness" → "yogawellness", "Drums and Percussion" → "drumsandpercussion"
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Registry maps "{normalizedClassName}/{normalizedSubClassName}" → page component.
// Add an entry here whenever a new custom subclass page is created under /classes/.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Record<string, ComponentType<any>> = {
  // ── Art (shared landing page + individual subclass pages) ─────────────────
  'art': dynamic(
    () => import('../../classes/art/page'),
    { ssr: false },
  ),
  'art/drawing': dynamic(
    () => import('../../classes/art/drawing/page'),
    { ssr: false },
  ),
  'art/artsandcrafts': dynamic(
    () => import('../../classes/art/arts-and-crafts/page'),
    { ssr: false },
  ),
  'art/visualartsworkshops': dynamic(
    () => import('../../classes/art/visual-arts-workshops/page'),
    { ssr: false },
  ),

  // ── Music ──────────────────────────────────────────────────────────────────
  'music/piano': dynamic(
    () => import('../../classes/music/piano/page'),
    { ssr: false },
  ),
  // "Piano - Academy learning" DB alias
  'music/pianoacademylearning': dynamic(
    () => import('../../classes/music/piano/page'),
    { ssr: false },
  ),
  'music/guitar': dynamic(
    () => import('../../classes/music/guitar/page'),
    { ssr: false },
  ),
  'music/drumsandpercussion': dynamic(
    () => import('../../classes/music/drumsandpercussion/page'),
    { ssr: false },
  ),
  // "Drums" DB alias
  'music/drums': dynamic(
    () => import('../../classes/music/drumsandpercussion/page'),
    { ssr: false },
  ),
  'music/bass': dynamic(
    () => import('../../classes/music/bass/page'),
    { ssr: false },
  ),
  // "Bass Guitar" DB alias
  'music/bassguitar': dynamic(
    () => import('../../classes/music/bass/page'),
    { ssr: false },
  ),
  'music/handpan': dynamic(
    () => import('../../classes/music/handpan/page'),
    { ssr: false },
  ),
  // "Hangdrum" DB alias
  'music/hangdrum': dynamic(
    () => import('../../classes/music/handpan/page'),
    { ssr: false },
  ),
  'music/musicawakening': dynamic(
    () => import('../../classes/music/musicawakening/page'),
    { ssr: false },
  ),
  'music/theory': dynamic(
    () => import('../../classes/music/theory/page'),
    { ssr: false },
  ),

  // ── Ballet ─────────────────────────────────────────────────────────────────
  'ballet/radballet': dynamic(
    () => import('../../classes/ballet/rad-ballet/page'),
    { ssr: false },
  ),
  // "Ballet - RAD" DB alias
  'ballet/balletrad': dynamic(
    () => import('../../classes/ballet/rad-ballet/page'),
    { ssr: false },
  ),
  'ballet/openballet': dynamic(
    () => import('../../classes/ballet/open-ballet/page'),
    { ssr: false },
  ),
  // "Ballet Open class 6to10 Yrs" DB alias
  'ballet/balletopenclass6to10yrs': dynamic(
    () => import('../../classes/ballet/open-ballet/page'),
    { ssr: false },
  ),
  'ballet/babyballet': dynamic(
    () => import('../../classes/ballet/baby-ballet/page'),
    { ssr: false },
  ),
  'ballet/contemporarydance': dynamic(
    () => import('../../classes/ballet/contemporary-dance/page'),
    { ssr: false },
  ),
  'ballet/hiphop': dynamic(
    () => import('../../classes/ballet/hip-hop/page'),
    { ssr: false },
  ),
  'ballet/jazz': dynamic(
    () => import('../../classes/ballet/jazz/page'),
    { ssr: false },
  ),
  'ballet/otherdancestyles': dynamic(
    () => import('../../classes/ballet/other-dance-styles/page'),
    { ssr: false },
  ),
  'ballet/aerialhoop': dynamic(
    () => import('../../classes/ballet/aerial-hoop/page'),
    { ssr: false },
  ),
  'ballet/zumba': dynamic(
    () => import('../../classes/ballet/zumba/page'),
    { ssr: false },
  ),
  'ballet/kidsgymnastics': dynamic(
    () => import('../../classes/ballet/kids-gymnastics/page'),
    { ssr: false },
  ),
  // "Gymnastics" DB alias
  'ballet/gymnastics': dynamic(
    () => import('../../classes/ballet/kids-gymnastics/page'),
    { ssr: false },
  ),

  // ── Yoga & Wellness ────────────────────────────────────────────────────────
  'yogawellness/yoga': dynamic(
    () => import('../../classes/yoga-wellness/yoga/page'),
    { ssr: false },
  ),
  'yogawellness/theartofpilates': dynamic(
    () => import('../../classes/yoga-wellness/pilates/page'),
    { ssr: false },
  ),
  'yogawellness/pilates': dynamic(
    () => import('../../classes/yoga-wellness/pilates/page'),
    { ssr: false },
  ),
  'yogawellness/bodyflexibility': dynamic(
    () => import('../../classes/yoga-wellness/body-flexibility/page'),
    { ssr: false },
  ),
  'yogawellness/stretching': dynamic(
    () => import('../../classes/yoga-wellness/stretching/page'),
    { ssr: false },
  ),
  'yogawellness/stretchingmobility': dynamic(
    () => import('../../classes/yoga-wellness/stretching/page'),
    { ssr: false },
  ),

  // "Dance & Wellness" DB aliases (kept for backward compatibility if DB name hasn't updated)
  'dancewellness/yoga': dynamic(
    () => import('../../classes/yoga-wellness/yoga/page'),
    { ssr: false },
  ),
  'dancewellness/theartofpilates': dynamic(
    () => import('../../classes/yoga-wellness/pilates/page'),
    { ssr: false },
  ),
  'dancewellness/pilates': dynamic(
    () => import('../../classes/yoga-wellness/pilates/page'),
    { ssr: false },
  ),
  'dancewellness/bodyflexibility': dynamic(
    () => import('../../classes/yoga-wellness/body-flexibility/page'),
    { ssr: false },
  ),
  'dancewellness/stretchingmobility': dynamic(
    () => import('../../classes/yoga-wellness/stretching/page'),
    { ssr: false },
  ),
  // Former dance styles now under Ballet — aliases so old DB entries still resolve
  'dancewellness/contemporarydance': dynamic(
    () => import('../../classes/ballet/contemporary-dance/page'),
    { ssr: false },
  ),
  'dancewellness/hiphop': dynamic(
    () => import('../../classes/ballet/hip-hop/page'),
    { ssr: false },
  ),
  'dancewellness/aerialhoop': dynamic(
    () => import('../../classes/ballet/aerial-hoop/page'),
    { ssr: false },
  ),
  'dancewellness/zumba': dynamic(
    () => import('../../classes/ballet/zumba/page'),
    { ssr: false },
  ),
  'dancewellness/gymnastics': dynamic(
    () => import('../../classes/ballet/kids-gymnastics/page'),
    { ssr: false },
  ),

  // ── Packages ───────────────────────────────────────────────────────────────
  'packages/futurestarspackage': dynamic(
    () => import('../../classes/packages/future-stars/page'),
    { ssr: false },
  ),
  // "Future Stars" short DB alias
  'packages/futurestars': dynamic(
    () => import('../../classes/packages/future-stars/page'),
    { ssr: false },
  ),
};

export function SubClassPageEmbed({
  className,
  subClassName,
}: {
  className: string;
  subClassName: string;
}) {
  const normalizedClass = normalize(className);
  const key = `${normalizedClass}/${normalize(subClassName)}`;
  const Component = REGISTRY[key] ?? REGISTRY[normalizedClass];
  if (!Component) return null;
  return <Component />;
}
