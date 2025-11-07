export interface Player {
  id: string;
  name: string;
  aliases: string[];
  albumUrl: string;
  cover: string;
  keywords: string[];
  dateAdded?: string;
}

// Arabic text normalization
const arabicMap: Record<string, string> = {
  'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ى': 'ي', 'ة': 'ه',
  'ؤ': 'و', 'ئ': 'ي', 'ٱ': 'ا', 'ٰ': '', 'ـ': ''
};

export function normalizeArabic(str: string = ''): string {
  return str
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '') // Remove diacritics
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ـ/g, '')
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

export function normalizeLatin(str: string = ''): string {
  return str
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function normalize(str: string = ''): string {
  const arabic = normalizeArabic(str);
  const latin = normalizeLatin(str);
  return arabic || latin;
}

// Extract player names from natural language query
export function extractPlayerNames(query: string, catalog: Player[]): Player[] {
  const q = query.trim();
  if (!q) return [];

  const normQ = normalize(q);

  // Collect all aliases with their normalized forms
  const allAliases: Array<{ player: Player; normAlias: string }> = [];
  for (const player of catalog) {
    for (const alias of player.aliases) {
      allAliases.push({ player, normAlias: normalize(alias) });
    }
  }

  // Find matches
  const found = new Set<string>();
  for (const { player, normAlias } of allAliases) {
    if (normQ.includes(normAlias)) {
      found.add(player.id);
    }
  }

  return catalog.filter(p => found.has(p.id));
}

// Default player catalog
export const defaultPlayers: Player[] = [
  {
    id: 'p1',
    name: 'مهند',
    aliases: ['مهند', 'mohannad', 'muhanad', 'اللاعب 1', 'Muhanad'],
    albumUrl: 'https://example.com/albums/mohanad',
    cover: 'https://picsum.photos/id/237/800/500',
    keywords: ['مهاجم', '#9', 'team falcons'],
    dateAdded: new Date().toISOString()
  },
  {
    id: 'p2',
    name: 'فارس',
    aliases: ['فارس', 'fares', 'faris', 'اللاعب 2', 'Faris'],
    albumUrl: 'https://example.com/albums/faris',
    cover: 'https://picsum.photos/id/1062/800/500',
    keywords: ['mid', 'playmaker'],
    dateAdded: new Date().toISOString()
  },
  {
    id: 'p3',
    name: 'ناصر',
    aliases: ['ناصر', 'nasser', 'alnasser', 'اللاعب 3', 'Nasser'],
    albumUrl: 'https://example.com/albums/nasser',
    cover: 'https://picsum.photos/id/1027/800/500',
    keywords: ['GK', 'حارس'],
    dateAdded: new Date().toISOString()
  }
];

// Local storage key
const STORAGE_KEY = 'player-archive-data';

// Load players from localStorage
export function loadPlayers(): Player[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading players:', error);
  }
  return defaultPlayers;
}

// Save players to localStorage
export function savePlayers(players: Player[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  } catch (error) {
    console.error('Error saving players:', error);
  }
}

// Export players as JSON
export function exportPlayersJSON(players: Player[]): string {
  return JSON.stringify(players, null, 2);
}

// Import players from JSON
export function importPlayersJSON(jsonString: string): Player[] {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }
  throw new Error('Invalid JSON format');
}

// Sort options
export type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc';

export function sortPlayers(players: Player[], sortBy: SortOption): Player[] {
  const sorted = [...players];
  
  switch (sortBy) {
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name, 'ar'));
    case 'date-asc':
      return sorted.sort((a, b) => 
        (a.dateAdded || '').localeCompare(b.dateAdded || '')
      );
    case 'date-desc':
      return sorted.sort((a, b) => 
        (b.dateAdded || '').localeCompare(a.dateAdded || '')
      );
    default:
      return sorted;
  }
}

// Filter by keyword
export function filterByKeyword(players: Player[], keyword: string): Player[] {
  if (!keyword.trim()) return players;
  
  const normKeyword = normalize(keyword);
  return players.filter(player => 
    player.keywords.some(kw => normalize(kw).includes(normKeyword))
  );
}
