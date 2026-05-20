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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Record<string, ComponentType<any>> = {
  // ── Art (one shared page for all art subclasses) ───────────────────────────
  'art': dynamic(
    () => import('../../classes/art/page'),
    { ssr: false },
  ),

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
  'ballet/preprimaryballet': dynamic(
    () => import('../../classes/ballet/pre-primary-ballet/page'),
    { ssr: false },
  ),
  // "Open Ballet" generic + "Ballet Open class 6to10 Yrs"
  'ballet/openballet': dynamic(
    () => import('../../classes/ballet/open-ballet/page'),
    { ssr: false },
  ),
  'ballet/balletopenclass6to10yrs': dynamic(
    () => import('../../classes/ballet/open-ballet/page'),
    { ssr: false },
  ),
  'ballet/balletopenclass10to15yrs': dynamic(
    () => import('../../classes/ballet/open-ballet-10-15/page'),
    { ssr: false },
  ),
  'ballet/balletopenclass15': dynamic(
    () => import('../../classes/ballet/open-ballet-15plus/page'),
    { ssr: false },
  ),
  // "RAD Ballet" (existing key) + "Ballet - RAD" (DB alias)
  'ballet/radballet': dynamic(
    () => import('../../classes/ballet/rad-ballet/page'),
    { ssr: false },
  ),
  'ballet/balletrad': dynamic(
    () => import('../../classes/ballet/rad-ballet/page'),
    { ssr: false },
  ),
  'ballet/balletprivatelesson': dynamic(
    () => import('../../classes/ballet/ballet-private/page'),
    { ssr: false },
  ),

  // ── Dance & Wellness — new subclasses ─────────────────────────────────────
  'dancewellness/gymnastics': dynamic(
    () => import('../../classes/dance/gymnastics/page'),
    { ssr: false },
  ),
  'dancewellness/hiphop': dynamic(
    () => import('../../classes/dance/hip-hop/page'),
    { ssr: false },
  ),
  'dancewellness/therapeutichealingflow': dynamic(
    () => import('../../classes/dance/therapeutic-healing-flow/page'),
    { ssr: false },
  ),
  'dancewellness/stretchingmobility': dynamic(
    () => import('../../classes/dance/stretching-mobility/page'),
    { ssr: false },
  ),
  'dancewellness/alignediyengarinspiredhathayoga': dynamic(
    () => import('../../classes/dance/iyengar-yoga/page'),
    { ssr: false },
  ),
  'dancewellness/theartofpilates': dynamic(
    () => import('../../classes/dance/pilates/page'),
    { ssr: false },
  ),
  'dancewellness/restorativeyoganervoussystembalance': dynamic(
    () => import('../../classes/dance/restorative-yoga/page'),
    { ssr: false },
  ),
  'dancewellness/taichi': dynamic(
    () => import('../../classes/dance/tai-chi/page'),
    { ssr: false },
  ),

  // ── Music — new subclasses + DB-name aliases ───────────────────────────────
  // "Piano - Academy learning" alias for the main piano page
  'music/pianoacademylearning': dynamic(
    () => import('../../classes/music/piano/page'),
    { ssr: false },
  ),
  'music/pianofreelance': dynamic(
    () => import('../../classes/music/piano-freelance/page'),
    { ssr: false },
  ),
  'music/pianoearleaning': dynamic(
    () => import('../../classes/music/piano-ear/page'),
    { ssr: false },
  ),
  // "Drums" alias for drumsandpercussion page
  'music/drums': dynamic(
    () => import('../../classes/music/drumsandpercussion/page'),
    { ssr: false },
  ),
  // "Bass Guitar" alias for bass page
  'music/bassguitar': dynamic(
    () => import('../../classes/music/bass/page'),
    { ssr: false },
  ),
  'music/electronicguitar': dynamic(
    () => import('../../classes/music/electronic-guitar/page'),
    { ssr: false },
  ),
  'music/ukulele': dynamic(
    () => import('../../classes/music/ukulele/page'),
    { ssr: false },
  ),
  'music/songwriting': dynamic(
    () => import('../../classes/music/songwriting/page'),
    { ssr: false },
  ),
  // "Darbuka" alias for durbuka page
  'music/darbuka': dynamic(
    () => import('../../classes/music/durbuka/page'),
    { ssr: false },
  ),
  // "Hangdrum" alias for handpan page
  'music/hangdrum': dynamic(
    () => import('../../classes/music/handpan/page'),
    { ssr: false },
  ),
  'music/accordion': dynamic(
    () => import('../../classes/music/accordion/page'),
    { ssr: false },
  ),

  // ── Packages ──────────────────────────────────────────────────────────────
  'packages/wellnessflex8': dynamic(
    () => import('../../classes/packages/wellness-flex-8/page'),
    { ssr: false },
  ),
  'packages/wellnessflex12': dynamic(
    () => import('../../classes/packages/wellness-flex-12/page'),
    { ssr: false },
  ),
  'packages/wellnessflex16': dynamic(
    () => import('../../classes/packages/wellness-flex-16/page'),
    { ssr: false },
  ),
  'packages/ayoungachieverspackage': dynamic(
    () => import('../../classes/packages/young-achievers/page'),
    { ssr: false },
  ),
  'packages/futurestarspackage': dynamic(
    () => import('../../classes/packages/future-stars/page'),
    { ssr: false },
  ),
  'packages/openingoffer': dynamic(
    () => import('../../classes/packages/opening-offer/page'),
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
