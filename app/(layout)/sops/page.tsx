/**
 * SOP Library Page Route
 *
 * Thin route page — renders the SOP Library checklist component.
 */

import { SopPage } from '@/features/sops';

export const metadata = {
  title: 'SOP Library | Meridian OS',
};

export default function SopsRoute() {
  return <SopPage />;
}
