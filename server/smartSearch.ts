/**
 * Smart search utilities for extracting player names from natural language queries
 */

/**
 * Normalize Arabic text by removing diacritics and normalizing characters
 */
export function normalizeArabic(text: string): string {
  return text
    // Remove Arabic diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // Normalize Alef variations
    .replace(/[إأآا]/g, "ا")
    // Normalize Taa Marbuta
    .replace(/ة/g, "ه")
    // Normalize Yaa
    .replace(/ى/g, "ي")
    .trim()
    .toLowerCase();
}

/**
 * Normalize English/Latin text
 */
export function normalizeEnglish(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/**
 * Extract potential player names from a natural language query
 * Supports both Arabic and English
 */
export function extractNames(query: string): string[] {
  // Remove attached Arabic conjunctions (و، ل، ك، ب) before processing
  let normalized = query.trim()
    // Remove standalone conjunctions first
    .replace(/(^|\s)[ولكب]($|\s)/g, '$1 $2')
    // Then remove attached ones (without word boundary)
    .replace(/و([\u0600-\u06FFa-zA-Z]+)/g, ' $1')  // وسعود → سعود
    .replace(/ل([\u0600-\u06FFa-zA-Z]+)/g, ' $1')  // لسعود → سعود
    .replace(/ك([\u0600-\u06FFa-zA-Z]+)/g, ' $1')  // كسعود → سعود
    .replace(/ب([\u0600-\u06FFa-zA-Z]+)/g, ' $1')  // بسعود → سعود
    .replace(/\s+/g, ' ')  // Clean up multiple spaces
    .trim();
  
  // Common Arabic stop words to filter out
  const arabicStopWords = [
    "صور", "صوره", "البوم", "ألبوم", "الالبوم", "اريد", "ابي", "ابغى",
    "عندك", "فيه", "موجود", "اعطني", "ورني", "شوف", "ابحث", "بحث",
    "عن", "من", "في", "على", "الى", "مع", "و", "او", "لكن", "هل",
    "ما", "لا", "نعم", "اي", "كل", "بعض", "هذا", "ذلك", "هنا", "هناك"
  ];
  
  // Common English stop words
  const englishStopWords = [
    "photos", "photo", "album", "pictures", "picture", "images", "image",
    "show", "find", "search", "get", "give", "want", "need", "have",
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "from", "by", "is", "are", "was", "were", "be", "been",
    "l", "k", "b"  // Single letter artifacts
  ];
  
  // Split by common separators
  const words = normalized.split(/[\s,،.؛;:!؟?]+/).filter(w => w.length > 0);
  
  const names: string[] = [];
  
  for (const word of words) {
    // Skip if it's a stop word
    const normalizedWord = normalizeArabic(word);
    const normalizedEnglish = normalizeEnglish(word);
    
    if (arabicStopWords.some(sw => normalizeArabic(sw) === normalizedWord)) {
      continue;
    }
    
    if (englishStopWords.some(sw => sw === normalizedEnglish)) {
      continue;
    }
    
    // If word is at least 2 characters and not a stop word, consider it a name
    if (word.length >= 2) {
      names.push(word);
    }
  }
  
  // If no names extracted, return the original query as a single name
  if (names.length === 0) {
    return [normalized];
  }
  
  return names;
}

/**
 * Check if text matches query (with normalization)
 */
export function textMatches(text: string, query: string): boolean {
  const normalizedText = normalizeArabic(text) + " " + normalizeEnglish(text);
  const normalizedQuery = normalizeArabic(query) + " " + normalizeEnglish(query);
  
  return normalizedText.includes(normalizedQuery);
}
