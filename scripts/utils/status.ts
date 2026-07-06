/**
 * Normalizes API match statuses to: 'Scheduled' | 'Live' | 'HT' | 'FT' | 'Postponed'
 */
export function normalizeMatchStatus(rawStatus: string): 'Scheduled' | 'Live' | 'HT' | 'FT' | 'Postponed' {
  const status = rawStatus.toLowerCase().trim();

  if (
    status === 'live' ||
    status === 'playing' ||
    status === 'active' ||
    status.includes('half') ||
    status.includes('min') ||
    status === '1h' ||
    status === '2h'
  ) {
    return 'Live';
  }

  if (status === 'ht' || status === 'half time' || status === 'halftime') {
    return 'HT';
  }

  if (
    status === 'ft' ||
    status === 'finished' ||
    status === 'full time' ||
    status === 'fulltime' ||
    status === 'completed'
  ) {
    return 'FT';
  }

  if (status === 'postponed' || status === 'cancelled' || status === 'suspended') {
    return 'Postponed';
  }

  return 'Scheduled';
}
