// Maps Printful/apparel color names to a representative hex so the product page
// can render real color swatches even when a Color row has no stored hex
// (Printful sync doesn't always provide one).

const COLOR_HEX: Record<string, string> = {
  black: '#1a1a1a',
  white: '#ffffff',
  navy: '#1f2937',
  'navy blue': '#1f2937',
  red: '#d32f2f',
  cardinal: '#8c1d2c',
  maroon: '#6d1f2a',
  burgundy: '#6d1f2a',
  'dark grey': '#4b4b4b',
  'dark gray': '#4b4b4b',
  'dark heather': '#434343',
  'sport grey': '#b7b7b7',
  'sport gray': '#b7b7b7',
  'heather grey': '#b0b0b0',
  'heather gray': '#b0b0b0',
  grey: '#9ca3af',
  gray: '#9ca3af',
  silver: '#c0c0c0',
  ash: '#c9c9c9',
  charcoal: '#36454f',
  asphalt: '#434b4d',
  'true royal': '#2a4ba0',
  royal: '#2a4ba0',
  'royal blue': '#2a4ba0',
  'steel blue': '#4682b4',
  indigo: '#3f51b5',
  'team purple': '#4b2e83',
  purple: '#7e3ff2',
  violet: '#7c3aed',
  lavender: '#c3b1e1',
  berry: '#9c2a66',
  kelly: '#2e8b57',
  'kelly green': '#2e8b57',
  green: '#2e7d32',
  'forest green': '#1b4332',
  'military green': '#4b5320',
  olive: '#808000',
  mint: '#b7e4c7',
  gold: '#f5b301',
  daisy: '#f6d743',
  yellow: '#f4d03f',
  orange: '#e8701a',
  coral: '#ff7f50',
  pink: '#f48fb1',
  'light pink': '#f8c1cf',
  'hot pink': '#e0218a',
  'light blue': '#add8e6',
  'carolina blue': '#4b9cd3',
  'columbia blue': '#9bddff',
  aqua: '#5bc0be',
  teal: '#008080',
  'deep teal': '#2b5f6b',
  turquoise: '#40e0d0',
  slate: '#5a6b7b',
  brown: '#7b4b2a',
  sand: '#d9c7a3',
  natural: '#efe6d0',
  cream: '#f3ead3',
};

// Known base words to catch colors not listed explicitly (e.g. "Heather Deep
// Teal" → teal). Ordered so more specific words win.
const BASE_WORDS: { word: string; hex: string }[] = [
  { word: 'black', hex: '#1a1a1a' },
  { word: 'white', hex: '#ffffff' },
  { word: 'navy', hex: '#1f2937' },
  { word: 'royal', hex: '#2a4ba0' },
  { word: 'columbia', hex: '#9bddff' },
  { word: 'carolina', hex: '#4b9cd3' },
  { word: 'teal', hex: '#008080' },
  { word: 'aqua', hex: '#5bc0be' },
  { word: 'turquoise', hex: '#40e0d0' },
  { word: 'blue', hex: '#2563eb' },
  { word: 'cardinal', hex: '#8c1d2c' },
  { word: 'maroon', hex: '#6d1f2a' },
  { word: 'burgundy', hex: '#6d1f2a' },
  { word: 'red', hex: '#d32f2f' },
  { word: 'berry', hex: '#9c2a66' },
  { word: 'purple', hex: '#7e3ff2' },
  { word: 'violet', hex: '#7c3aed' },
  { word: 'lavender', hex: '#c3b1e1' },
  { word: 'pink', hex: '#f48fb1' },
  { word: 'kelly', hex: '#2e8b57' },
  { word: 'forest', hex: '#1b4332' },
  { word: 'olive', hex: '#808000' },
  { word: 'mint', hex: '#b7e4c7' },
  { word: 'green', hex: '#2e7d32' },
  { word: 'gold', hex: '#f5b301' },
  { word: 'yellow', hex: '#f4d03f' },
  { word: 'orange', hex: '#e8701a' },
  { word: 'coral', hex: '#ff7f50' },
  { word: 'brown', hex: '#7b4b2a' },
  { word: 'sand', hex: '#d9c7a3' },
  { word: 'natural', hex: '#efe6d0' },
  { word: 'cream', hex: '#f3ead3' },
  { word: 'charcoal', hex: '#36454f' },
  { word: 'asphalt', hex: '#434b4d' },
  { word: 'slate', hex: '#5a6b7b' },
  { word: 'silver', hex: '#c0c0c0' },
  { word: 'grey', hex: '#9ca3af' },
  { word: 'gray', hex: '#9ca3af' },
];

export function colorNameToHex(name?: string | null): string {
  if (!name) return '#9ca3af';
  let key = name.trim().toLowerCase();

  if (COLOR_HEX[key]) return COLOR_HEX[key];

  // Drop qualifiers like "heather", "solid", "vintage" and retry an exact match.
  key = key
    .replace(/\b(heather|solid|vintage|classic|premium|tri-?blend)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (COLOR_HEX[key]) return COLOR_HEX[key];

  // Fall back to any known base word contained in the name.
  for (const { word, hex } of BASE_WORDS) {
    if (key.includes(word)) return hex;
  }

  return '#9ca3af';
}
