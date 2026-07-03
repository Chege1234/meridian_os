/**
 * Campaigns List Page Route
 *
 * Thin route page — renders the Campaigns list page feature component.
 */

import { CampaignsPage } from '@/features/campaigns';

export const metadata = {
  title: 'Campaigns | Meridian OS',
};

export default function CampaignsRoute() {
  return <CampaignsPage />;
}
