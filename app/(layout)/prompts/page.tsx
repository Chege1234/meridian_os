/**
 * Prompt Library List Page Route
 *
 * Thin route page — renders the Prompt Library list page feature component.
 */

import { PromptListPage } from '@/features/prompt-library';

export const metadata = {
  title: 'Prompt Library | Meridian OS',
};

export default function PromptsRoute() {
  return <PromptListPage />;
}
