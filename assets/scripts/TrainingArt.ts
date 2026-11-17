import { ENGINEER_ID, GHOST_ID, HEROINE_ID } from './Heroes';

const PLATES = {
  plate: [19, 69, 587, 270],
  active: [620, 124, 622, 181],
  tab: [0, 513, 630, 183],
  frame: [715, 416, 424, 376],
  'frame-selected': [93, 812, 430, 390],
  header: [573, 924, 676, 171],
} as const;
const ICONS = {
  people: [6, 54, 432, 356],
  health: [486, 72, 360, 333],
  damage: [926, 55, 370, 354],
  movement: [1334, 89, 434, 274],
  fire: [5, 588, 430, 145],
  sight: [463, 523, 401, 274],
  materials: [894, 484, 425, 360],
  lock: [1395, 468, 309, 367],
} as const;

// The position is the center X, bottom Y and height on the supplied panel.
export const TRAINING_PROFILES = {
  [HEROINE_ID]: { key: 'lin', position: [466, 890, 718] },
  [GHOST_ID]: { key: 'ghost', position: [460, 888, 710] },
  [ENGINEER_ID]: { key: 'weichuan', position: [458, 927, 858] },
} as const;

type ProfileImage = `${(typeof TRAINING_PROFILES)[keyof typeof TRAINING_PROFILES]['key']}-${'art' | 'face'}`;
export type TrainingImage = 'background' | 'panel' | keyof typeof PLATES | keyof typeof ICONS | ProfileImage;
type TrainingAsset = { file: string; key: TrainingImage } | {
  file: string;
  crops: Readonly<Partial<Record<TrainingImage, readonly [number, number, number, number]>>>;
};

export const TRAINING_ART: readonly TrainingAsset[] = [
  { file: 'background', key: 'background' },
  { file: 'panel', key: 'panel' },
  { file: 'plates', crops: PLATES },
  { file: 'icons', crops: ICONS },
  { file: 'lin-art', key: 'lin-art' },
  { file: 'lin-face', key: 'lin-face' },
  { file: 'ghost-art', key: 'ghost-art' },
  { file: 'ghost-face', key: 'ghost-face' },
  { file: 'weichuan-art', key: 'weichuan-art' },
  { file: 'weichuan-face', key: 'weichuan-face' },
];
