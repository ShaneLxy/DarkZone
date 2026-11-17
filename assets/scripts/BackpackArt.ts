import type { Quality } from './WeaponMods';
import type { BackpackFilter } from './Backpack';

export type BackpackImage = 'shell' | 'home-tile' | 'filter' | 'filter-active' | 'action' | 'selected' | 'close' |
  'banner-icon' | 'capacity-icon' | 'detail' | `slot-${Quality}` | `icon-${BackpackFilter}`;
type Crop = [number, number, number, number];
type Asset = { file: string; image: BackpackImage } | { file: string; crops: Partial<Record<BackpackImage, Crop>> };
export const BACKPACK_ART: readonly Asset[] = [
  { file: 'shell', image: 'shell' },
  { file: 'home-tile', image: 'home-tile' },
  { file: 'controls', crops: {
    filter: [22, 113, 393, 133], 'filter-active': [428, 108, 413, 151], action: [848, 113, 396, 139],
    'slot-0': [50, 364, 354, 352], 'slot-1': [455, 365, 356, 352], 'slot-2': [863, 365, 357, 352],
    'slot-3': [47, 787, 360, 361], selected: [432, 763, 399, 405], close: [885, 815, 317, 304],
  } },
  { file: 'icons', crops: {
    'banner-icon': [53, 39, 352, 386], 'icon-all': [528, 107, 271, 273],
    'icon-consumable': [967, 103, 272, 274], 'icon-attachment': [1386, 108, 333, 257],
    'icon-equipment': [76, 500, 301, 329], 'icon-material': [500, 506, 329, 326],
    'capacity-icon': [975, 533, 269, 271], detail: [1344, 557, 418, 218],
  } },
];
