/**
 * Advanced smart search utilities with fuzzy matching and intelligent normalization
 */

/**
 * Normalize Arabic text - comprehensive version
 */
export function normalizeArabic(text: string): string {
  return text
    // Remove Arabic diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, "")
    // Normalize Alef variations
    .replace(/[إأآٱا]/g, "ا")
    // Normalize Taa Marbuta
    .replace(/ة/g, "ه")
    // Normalize Yaa
    .replace(/[ىي]/g, "ي")
    // Normalize Hamza
    .replace(/[ؤئء]/g, "")
    // Remove Tatweel
    .replace(/ـ/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Normalize English/Latin text
 */
export function normalizeEnglish(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Remove Arabic conjunctions (attached and standalone)
 */
export function removeConjunctions(text: string): string {
  return text
    // Remove standalone conjunctions
    .replace(/(^|\s)[ولكبف](\s|$)/g, ' ')
    // Remove attached conjunctions at word start
    .replace(/\s([ولكبف])([\u0600-\u06FFa-zA-Z])/g, ' $2')
    .replace(/^([ولكبف])([\u0600-\u06FFa-zA-Z])/g, '$2')
    // Clean up spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract search terms from query
 */
export function extractSearchTerms(query: string): string[] {
  // Remove conjunctions first
  const cleaned = removeConjunctions(query);
  
  // Common stop words (Arabic and English)
  const stopWords = new Set([
    // Arabic
    "صور", "صوره", "صوره", "البوم", "ألبوم", "الالبوم", "اريد", "ابي", "ابغى", "ابغا",
    "عندك", "فيه", "موجود", "اعطني", "ورني", "شوف", "ابحث", "بحث",
    "عن", "من", "في", "على", "الى", "إلى", "مع", "او", "لكن", "هل",
    "ما", "لا", "نعم", "اي", "كل", "بعض", "هذا", "ذلك", "هنا", "هناك",
    "ال", "لل", "بال", "كال", "فال",
    // English
    "photos", "photo", "album", "pictures", "picture", "images", "image",
    "show", "find", "search", "get", "give", "want", "need", "have",
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "from", "by", "is", "are", "was", "were", "be", "been",
    "me", "my", "i", "you", "he", "she", "it", "we", "they"
  ]);
  
  // Split by various separators
  const words = cleaned
    .split(/[\s,،.؛;:!؟?()[\]{}]+/)
    .filter(w => w.length > 0);
  
  const terms: string[] = [];
  
  for (const word of words) {
    // Normalize to check against stop words
    const normalized = normalizeArabic(word).toLowerCase();
    const normalizedEn = normalizeEnglish(word).toLowerCase();
    
    // Skip stop words
    if (stopWords.has(normalized) || stopWords.has(normalizedEn)) {
      continue;
    }
    
    // Keep words with at least 2 characters
    if (word.length >= 2) {
      terms.push(word);
    }
  }
  
  // If no terms extracted, use original query
  if (terms.length === 0) {
    return [cleaned.trim()];
  }
  
  return terms;
}

/**
 * Calculate similarity score between two strings (0-1)
 * Uses Levenshtein distance for fuzzy matching
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  // Check for exact substring match
  if (longer.includes(shorter)) return 0.9;
  
  // Check for partial match
  const longerWords = longer.split(/\s+/);
  const shorterWords = shorter.split(/\s+/);
  
  for (const shortWord of shorterWords) {
    for (const longWord of longerWords) {
      if (longWord.includes(shortWord) || shortWord.includes(longWord)) {
        return 0.8;
      }
    }
  }
  
  // Levenshtein distance
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Check if search term matches text with fuzzy matching
 */
export function fuzzyMatch(searchTerm: string, text: string, threshold: number = 0.6): boolean {
  const normalizedSearch = normalizeArabic(searchTerm) + " " + normalizeEnglish(searchTerm);
  const normalizedText = normalizeArabic(text) + " " + normalizeEnglish(text);
  
  // Exact match
  if (normalizedText.includes(normalizedSearch.trim())) {
    return true;
  }
  
  // Check each word in text
  const textWords = normalizedText.split(/\s+/);
  const searchWords = normalizedSearch.trim().split(/\s+/);
  
  for (const searchWord of searchWords) {
    if (searchWord.length < 2) continue;
    
    for (const textWord of textWords) {
      if (textWord.length < 2) continue;
      
      // Substring match
      if (textWord.includes(searchWord) || searchWord.includes(textWord)) {
        return true;
      }
      
      // Fuzzy match
      const similarity = calculateSimilarity(searchWord, textWord);
      if (similarity >= threshold) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Score a player against search terms (0-100)
 */
export function scorePlayer(player: any, searchTerms: string[]): number {
  let score = 0;
  
  // Parse keywords
  let keywordsArray: string[] = [];
  try {
    const parsed = player.keywords ? JSON.parse(player.keywords) : [];
    keywordsArray = Array.isArray(parsed) ? parsed : [];
  } catch {
    keywordsArray = [];
  }
  
  // Build searchable fields with weights
  const fields = [
    { text: player.nameArabic || '', weight: 10 },
    { text: player.nameEnglish || '', weight: 10 },
    { text: player.teamName || '', weight: 5 },
    { text: player.alternativeNames || '', weight: 8 },
    ...keywordsArray.map(kw => ({ text: kw, weight: 7 }))
  ];
  
  for (const term of searchTerms) {
    for (const field of fields) {
      if (fuzzyMatch(term, field.text, 0.7)) {
        score += field.weight;
      }
    }
  }
  
  return score;
}
