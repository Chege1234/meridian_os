/**
 * Knowledge Base Page Route
 *
 * Thin route page — renders the Knowledge Base features component.
 */

import { KbPage } from '@/features/knowledge-base';

export const metadata = {
  title: 'Knowledge Base | Meridian OS',
};

export default function KnowledgeBaseRoute() {
  return <KbPage />;
}
