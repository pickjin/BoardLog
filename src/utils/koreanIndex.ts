/**
 * Korean initial consonant (초성) and Alphabet indexing helpers
 * for Library & Book Catalog lookup
 */

const CHO_SUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

export const KOREAN_INDEX_KEYS = [
  'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
  'A-Z', '0-9', '#'
];

/**
 * Returns the primary index key for a given game title.
 */
export function getGameIndexKey(title: string): string {
  if (!title || title.trim().length === 0) return '#';
  const clean = title.trim();
  const char = clean[0];
  const code = char.charCodeAt(0);

  // Korean Hangul Syllables: 44032 (0xAC00) ~ 55203 (0xD7A3)
  if (code >= 44032 && code <= 55203) {
    const choIndex = Math.floor((code - 44032) / 588);
    const cho = CHO_SUNG[choIndex] || '#';
    if (cho === 'ㄲ') return 'ㄱ';
    if (cho === 'ㄸ') return 'ㄷ';
    if (cho === 'ㅃ') return 'ㅂ';
    if (cho === 'ㅆ') return 'ㅅ';
    if (cho === 'ㅉ') return 'ㅈ';
    return cho;
  }

  // Direct Hangul Consonants: 12593 (0x3131) ~ 12622
  if (code >= 12593 && code <= 12622) {
    if (char === 'ㄲ') return 'ㄱ';
    if (char === 'ㄸ') return 'ㄷ';
    if (char === 'ㅃ') return 'ㅂ';
    if (char === 'ㅆ') return 'ㅅ';
    if (char === 'ㅉ') return 'ㅈ';
    return char;
  }

  // English letters
  if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
    return 'A-Z';
  }

  // Digits
  if (code >= 48 && code <= 57) {
    return '0-9';
  }

  return '#';
}
