'use client';

import dynamic from 'next/dynamic';

const Globe = dynamic(
  () => import('@/shared/components/magic-ui/Globe').then((m) => m.Globe),
  { ssr: false },
);

export function ClientGlobe() {
  return <Globe />;
}
