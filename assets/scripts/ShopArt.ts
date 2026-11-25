import type { ProductId } from './Shop';

type Crop = [number, number, number, number];
type ShopComponent = 'background' | 'button' | 'selected' | 'card' | 'purchase' | 'mod-icon' | 'gear-icon' | 'item-icon' | 'coin' |
  'workshop-panel' | 'workshop-button' | 'workshop-active' | 'fixed-usp' | 'fixed-ar' | 'fixed-shotgun' | `socket-${0 | 1 | 2 | 3}`;
export type ShopImage = ShopComponent | ProductId;
type Atlas = { file: string; folder?: 'survival' } & ({ image: ShopImage } | { crops: Partial<Record<ShopImage, Crop>> });
export const SHOP_ART: readonly Atlas[] = [
  { file: 'background', image: 'background' },
  { file: 'ui', crops: {
    button: [25, 127, 434, 154], selected: [494, 120, 461, 169], card: [979, 64, 454, 278],
    purchase: [30, 470, 428, 147],
    'gear-icon': [537, 718, 377, 356], 'item-icon': [1020, 756, 374, 296],
  } },
  { file: 'catalog', crops: {
    vest: [85, 7, 210, 225], helmet: [437, 6, 231, 224], pack: [796, 7, 222, 224], grenade: [1198, 6, 157, 224],
    flashbang: [137, 232, 125, 211], 'shock-mine': [415, 240, 260, 201], adrenaline: [1232, 232, 66, 209],
    medkit: [51, 446, 277, 220], bandage: [399, 451, 295, 215], drink: [840, 443, 119, 223], coin: [1161, 448, 214, 218],
  } },
  { file: 'tactical-fire-v1', folder: 'survival', crops: { molotov: [8, 8, 240, 240] } },
  { file: 'gear-parts-v2', folder: 'survival', crops: { 'proximity-mine': [487, 481, 280, 288] } },
  { file: 'fixed-weapons', crops: { 'fixed-usp': [0, 0, 340, 173], 'fixed-ar': [345, 0, 372, 162], 'fixed-shotgun': [722, 0, 360, 107] } },
  { file: 'workshop', image: 'workshop-panel' },
  { file: 'workshop-controls', crops: {
    'socket-0': [74, 73, 405, 394], 'socket-1': [565, 73, 405, 394], 'socket-2': [1059, 73, 404, 394],
    'socket-3': [74, 551, 405, 396], 'workshop-button': [550, 660, 433, 183], 'workshop-active': [1044, 660, 433, 183],
  } },
  { file: 'mods', crops: {
    suppressor: [22, 60, 289, 224], compensator: [335, 58, 277, 222], redDot: [649, 24, 272, 275], reflex: [962, 60, 276, 227],
    extended: [80, 321, 146, 305], quick: [374, 361, 179, 262], grip: [677, 328, 196, 296], reloadGrip: [1013, 320, 199, 303],
    choke: [12, 685, 288, 212], tube: [315, 682, 311, 211], laser: [640, 667, 282, 235], flashlight: [944, 658, 309, 243],
    loader: [315, 682, 311, 211], loadHarness: [12, 983, 288, 251], impactPad: [366, 940, 176, 307],
    parts: [626, 973, 293, 260], stabilizer: [955, 984, 289, 233], 'mod-icon': [626, 973, 293, 260],
  } },
];
