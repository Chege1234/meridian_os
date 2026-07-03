/**
 * AI Agents Page Route
 *
 * Thin route page — renders the AI Agents Page component.
 */

import { AgentsPage } from '@/features/agents/components/AgentsPage';

export const metadata = {
  title: 'AI Agents | Meridian OS',
};

export default function AgentsRoute() {
  return <AgentsPage />;
}
