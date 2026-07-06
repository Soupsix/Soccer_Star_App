/**
 * Normalizes event types to standard enum strings.
 */
export function normalizeEventType(
  rawType: string
): 'Goal' | 'Own Goal' | 'Yellow Card' | 'Red Card' | 'Penalty' | 'Missed Penalty' | 'VAR' | 'Substitution' {
  const type = rawType.toLowerCase().replace(/_/g, ' ').trim();

  if (type.includes('own goal') || type === 'og') {
    return 'Own Goal';
  }
  if (type.includes('miss') || type.includes('missed penalty')) {
    return 'Missed Penalty';
  }
  if (type.includes('penalty') || type === 'pen') {
    return 'Penalty';
  }
  if (type.includes('goal') || type === 'g') {
    return 'Goal';
  }
  if (type.includes('yellow') || type === 'yc') {
    return 'Yellow Card';
  }
  if (type.includes('red') || type === 'rc') {
    return 'Red Card';
  }
  if (type.includes('var') || type.includes('review')) {
    return 'VAR';
  }
  if (type.includes('sub') || type.includes('substitution')) {
    return 'Substitution';
  }

  return 'Goal'; // Fallback default
}

/**
 * Normalizes string keys for document IDs (lowercase, replace spaces/special chars with underscores).
 */
export function generateNaturalId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalize accent marks
    .replace(/[\u0300-\u036f]/g, '') // Strip accents
    .replace(/[^a-z0-9\s-]/g, '') // Strip symbols
    .replace(/[\s-]+/g, '_'); // Convert spaces to underscores
}
