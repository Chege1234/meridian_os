/**
 * Analytics Dashboard Route
 *
 * Thin route page — renders the Operations Analytics dashboard feature component.
 */

import AnalyticsDashboard from '@/features/analytics/components/AnalyticsDashboard';

export const metadata = {
  title: 'Analytics | Meridian OS',
};

export default function AnalyticsRoute() {
  return <AnalyticsDashboard />;
}
