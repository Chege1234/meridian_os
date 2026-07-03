/**
 * Campaign Detail Route
 *
 * Thin route page — extracts parameter and renders Campaign detail feature component.
 */

import { CampaignDetailPage } from '@/features/campaigns';

export const metadata = {
  title: 'Campaign Details | Meridian OS',
};

interface CampaignDetailRouteProps {
  params: Promise<{ campaignId: string }>;
}

export default async function CampaignDetailRoute({
  params,
}: CampaignDetailRouteProps) {
  const { campaignId } = await params;
  return <CampaignDetailPage campaignId={campaignId} />;
}
