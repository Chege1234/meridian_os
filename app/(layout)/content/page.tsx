/**
 * Content Studio List Page Route
 *
 * Thin route page — renders the Content Studio list page feature component.
 */

import { ContentListPage } from '@/features/content-studio';

export const metadata = {
  title: 'Content Studio | Meridian OS',
};

export default function ContentRoute() {
  return <ContentListPage />;
}
