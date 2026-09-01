export const MAX_DISPLAY_NAME_LENGTH = 40;

export function normalizeDisplayName(value: string): string {
  const normalized = value.trim().replace(/\s+/gu, ' ');
  return normalized.slice(0, MAX_DISPLAY_NAME_LENGTH) || 'Guest';
}
