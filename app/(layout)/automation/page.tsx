/**
 * Automation Center Page Route
 *
 * Thin route page — renders the Automation Page component.
 */

import { AutomationPage } from '@/features/automation/components/AutomationPage';

export const metadata = {
  title: 'Automation Center | Meridian OS',
};

export default function AutomationRoute() {
  return <AutomationPage />;
}
