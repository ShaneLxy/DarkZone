type Crop = readonly [number, number, number, number];
export type CampaignImage = 'satellite-map' | 'harbor-selection' | 'map-frame' | 'radio-panel' | 'departure-brief' | 'liaison' | 'profile-panel' | 'profile-shell' | 'profile-banner' | 'hero-frame' | 'achievement-shell' | 'plate' | 'plate-active' | 'track' | 'fill' |
  'badge-combat' | 'badge-chapter' | 'badge-equipment' | 'badge-growth' | 'badge-collection' |
  'chapter-card' | 'chapter-1' | 'chapter-2' | 'chapter-3' | 'chapter-4' | 'chapter-5' | 'chapter-6' |
  'hero-card' | 'hero-active' | 'lock' | 'team' | 'rating-filled' | 'rating-empty';
type Asset = { file: string; image: CampaignImage } | { file: string; crops: Partial<Record<CampaignImage, Crop>> };
const CHAPTER_CARD_CROP = [1058, 154, 661, 202] as const;
export const CAMPAIGN_ART: readonly Asset[] = [
  { file: 'satellite-map', image: 'satellite-map' },
  { file: 'harbor-selection-v2', image: 'harbor-selection' },
  { file: 'tanSuo', image: 'map-frame' },
  { file: 'field-panels', crops: { 'radio-panel': [0, 0, 1024, 135], 'profile-panel': [0, 152, 900, 360] } },
  { file: 'departure-brief-v1', image: 'departure-brief' },
  { file: 'account-shell', image: 'profile-shell' },
  { file: 'account-dusk', image: 'profile-banner' },
  { file: 'selectHero', image: 'hero-frame' },
  { file: 'chapter-4', image: 'chapter-4' },
  { file: 'chapter-5', image: 'chapter-5' },
  { file: 'chapter-6', image: 'chapter-6' },
  { file: 'achievement-shell', image: 'achievement-shell' },
  { file: 'atlas', crops: {
    plate: [70, 36, 620, 166], 'plate-active': [760, 18, 655, 196],
    track: [1483, 84, 613, 69], fill: [96, 296, 588, 78],
    'badge-combat': [952, 221, 262, 231], 'badge-chapter': [1656, 221, 263, 231],
    'badge-equipment': [249, 456, 265, 243], 'badge-growth': [954, 456, 265, 243],
    'badge-collection': [1657, 455, 266, 245],
  } },
  { file: 'missions', crops: {
    'chapter-card': CHAPTER_CARD_CROP,
    'chapter-1': [46, 516, 536, 306], 'chapter-2': [623, 516, 529, 306], 'chapter-3': [1191, 516, 544, 306],
  } },
  { file: 'hero-ui', crops: {
    'hero-card': [108, 37, 345, 500], 'hero-active': [585, 37, 367, 500], lock: [1135, 151, 254, 323],
    team: [90, 645, 373, 252], 'rating-filled': [587, 705, 364, 154], 'rating-empty': [1085, 705, 365, 154],
  } },
];

export function chapterCardWindow(x: number, y: number, width: number, height: number) {
  const [, , cardWidth, cardHeight] = CHAPTER_CARD_CROP;
  // Slight overlap under the opaque border covers the antialiased edge of the cutout.
  const left = 29, top = 32, w = 209, h = 137;
  return { x: x + ((left + w / 2) / cardWidth - 0.5) * width,
    y: y + (0.5 - (top + h / 2) / cardHeight) * height, w: w * width / cardWidth, h: h * height / cardHeight };
}

// Bottom-left origin, normalized to the satellite artwork.
export const CAMPAIGN_LOCATIONS = {
  1: { x: .103, y: .795 }, 2: { x: .206, y: .752 }, 3: { x: .315, y: .706 },
  4: { x: .812, y: .323 }, 5: { x: .74, y: .601 }, 6: { x: .315, y: .706 },
} as const;

export function satelliteFraming(width: number, height: number, focusX: number, focusY: number, zoom: number, aspect = width / height) {
  const w = Math.max(width, height * aspect) * zoom, h = Math.max(height, width / aspect) * zoom;
  return { w, h, left: Math.min(0, Math.max(width - w, width / 2 - focusX * w)),
    bottom: Math.min(0, Math.max(height - h, height / 2 - focusY * h)) };
}
