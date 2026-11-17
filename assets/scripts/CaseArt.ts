import type { CaseId } from './LootCases';
import type { Quality } from './WeaponMods';

type Crop = [number, number, number, number];
export type CaseImage = 'background' | 'tray' | 'key' | 'title' | 'pointer' | 'button-dark' | 'button-gold' |
  `card-${Quality}` | `${CaseId}-${'open' | 'closed'}`;
type Asset = { file: string; image: CaseImage } | { file: string; crops: Partial<Record<CaseImage, Crop>> };

export const CASE_ART: readonly Asset[] = [
  { file: 'background', image: 'background' },
  { file: 'crates', crops: {
    'tactical-closed': [64, 32, 646, 446], 'tactical-open': [825, 32, 646, 446],
    'basic-closed': [64, 529, 646, 449], 'basic-open': [825, 529, 646, 449],
  } },
  { file: 'controls', crops: {
    'card-0': [26, 44, 447, 312], 'card-1': [500, 44, 447, 312], 'card-2': [974, 44, 447, 312],
    'card-3': [26, 398, 447, 312],
    'button-dark': [506, 477, 434, 141], 'button-gold': [965, 464, 472, 157],
    key: [114, 767, 294, 279], pointer: [680, 738, 86, 328], title: [974, 832, 449, 133],
  } },
  { file: 'panel', crops: { tray: [25, 166, 1486, 690] } },
];
