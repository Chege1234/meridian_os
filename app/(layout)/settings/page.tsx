/**
 * Settings Page Route
 *
 * Thin route page — renders the settings feature component.
 */

import { SettingsPage } from '@/features/settings';

export const metadata = {
  title: 'Settings',
};

export default function SettingsRoute() {
  return <SettingsPage />;
}
