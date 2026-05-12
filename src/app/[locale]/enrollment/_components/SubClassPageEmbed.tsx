'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Strip everything except a-z 0-9 and lowercase — used to build registry keys
// from DB names like "Dance & Wellness" → "dancewellness", "Drums and Percussion" → "drumsandpercussion"
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Registry maps "{normalizedClassName}/{normalizedSubClassName}" → page component.
// Add an entry here whenever a new custom subclass page is created under /classes/.
const REGISTRY: Record<string, ComponentType> = {
  // ── Music ──────────────────────────────────────────────────────────────────
  'music/handpan': dynamic(
    () => import('../../classes/music/handpan/page'),
    { ssr: false },
  ),
  'music/piano': dynamic(
    () => import('../../classes/music/piano/page'),
    { ssr: false },
  ),
  'music/guitar': dynamic(
    () => import('../../classes/music/guitar/page'),
    { ssr: false },
  ),
  'music/bass': dynamic(
    () => import('../../classes/music/bass/page'),
    { ssr: false },
  ),
  'music/drumsandpercussion': dynamic(
    () => import('../../classes/music/drumsandpercussion/page'),
    { ssr: false },
  ),
  'music/durbuka': dynamic(
    () => import('../../classes/music/durbuka/page'),
    { ssr: false },
  ),
  'music/oud': dynamic(
    () => import('../../classes/music/oud/page'),
    { ssr: false },
  ),
  'music/violin': dynamic(
    () => import('../../classes/music/violin/page'),
    { ssr: false },
  ),
  'music/vocal': dynamic(
    () => import('../../classes/music/vocal/page'),
    { ssr: false },
  ),
  'music/solfege': dynamic(
    () => import('../../classes/music/solfege/page'),
    { ssr: false },
  ),
  'music/theory': dynamic(
    () => import('../../classes/music/theory/page'),
    { ssr: false },
  ),
  'music/sightreading': dynamic(
    () => import('../../classes/music/sightreading/page'),
    { ssr: false },
  ),
  'music/musicawakening': dynamic(
    () => import('../../classes/music/musicawakening/page'),
    { ssr: false },
  ),

  // ── Dance & Wellness (DB class name "Dance & Wellness" → "dancewellness") ──
  'dancewellness/salsa': dynamic(
    () => import('../../classes/dance/salsa/page'),
    { ssr: false },
  ),
  'dancewellness/zumba': dynamic(
    () => import('../../classes/dance/zumba/page'),
    { ssr: false },
  ),
  'dancewellness/aerialhoop': dynamic(
    () => import('../../classes/dance/aerial-hoop/page'),
    { ssr: false },
  ),
  'dancewellness/bodyflexibility': dynamic(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — & in folder name is valid on disk but TS may warn
    () => import('../../classes/dance/body&flexibility/page'),
    { ssr: false },
  ),
  'dancewellness/contemporarydance': dynamic(
    () => import('../../classes/dance/contemporary-dance/page'),
    { ssr: false },
  ),
  'dancewellness/kidsmovements': dynamic(
    () => import('../../classes/dance/kids-movements/page'),
    { ssr: false },
  ),

  // ── Ballet ──────────────────────────────────────────────────────────────────
  'ballet/babyballet': dynamic(
    () => import('../../classes/ballet/baby-ballet/page'),
    { ssr: false },
  ),
  'ballet/openballet': dynamic(
    () => import('../../classes/ballet/open-ballet/page'),
    { ssr: false },
  ),
  'ballet/radballet': dynamic(
    () => import('../../classes/ballet/rad-ballet/page'),
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
  const key = `${normalize(className)}/${normalize(subClassName)}`;
  const Component = REGISTRY[key];
  if (!Component) return null;
  return <Component />;
}
