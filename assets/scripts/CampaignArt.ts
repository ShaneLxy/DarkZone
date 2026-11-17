type Crop = readonly [number, number, number, number];
export type CampaignImage = 'map' | 'map-frame' | 'hero-frame' | 'achievement-shell' | 'plate' | 'plate-active' | 'track' | 'fill' |
  'badge-combat' | 'badge-chapter' | 'badge-equipment' | 'badge-growth' | 'badge-collection' |
  'pin' | 'pin-locked' | 'chapter-card' | 'chapter-1' | 'chapter-2' | 'chapter-3' | 'chapter-4' |
  'hero-card' | 'hero-active' | 'lock' | 'team' | 'rating-filled' | 'rating-empty';
type Asset = { file: string; image: CampaignImage } | { file: string; crops: Partial<Record<CampaignImage, Crop>> };
export const CAMPAIGN_ART: readonly Asset[] = [
  { file: 'tanSuo', image: 'map-frame' },
  { file: 'selectHero', image: 'hero-frame' },
  { file: 'map', image: 'map' },
  { file: 'chapter-4', image: 'chapter-4' },
  { file: 'achievement-shell', image: 'achievement-shell' },
  { file: 'atlas', crops: {
    plate: [70, 36, 620, 166], 'plate-active': [760, 18, 655, 196],
    track: [1483, 84, 613, 69], fill: [96, 296, 588, 78],
    'badge-combat': [952, 221, 262, 231], 'badge-chapter': [1656, 221, 263, 231],
    'badge-equipment': [249, 456, 265, 243], 'badge-growth': [954, 456, 265, 243],
    'badge-collection': [1657, 455, 266, 245],
  } },
  { file: 'missions', crops: {
    pin: [83, 41, 381, 424], 'pin-locked': [622, 41, 339, 424], 'chapter-card': [1058, 154, 661, 202],
    'chapter-1': [46, 516, 536, 306], 'chapter-2': [623, 516, 529, 306], 'chapter-3': [1191, 516, 544, 306],
  } },
  { file: 'hero-ui', crops: {
    'hero-card': [108, 37, 345, 500], 'hero-active': [585, 37, 367, 500], lock: [1135, 151, 254, 323],
    team: [90, 645, 373, 252], 'rating-filled': [587, 705, 364, 154], 'rating-empty': [1085, 705, 365, 154],
  } },
];
