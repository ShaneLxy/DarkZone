import { circleRect, dist } from './Core';
import type { LevelDefinition } from './Levels';

export const FLOOR_DETAIL_ATLAS = 'common/environment/floor-details-v1/spriteFrame';

// Crop rectangles are in atlas pixels, followed by the range of in-game sizes.
export const FLOOR_DETAIL_ART = {
  pool: { crop: [29, 88, 366, 273], size: [73, 119], alpha: 214 },
  trail: { crop: [446, 51, 378, 332], size: [99, 154], alpha: 207 },
  drops: { crop: [900, 106, 291, 214], size: [58, 94], alpha: 203 },
  scuffs: { crop: [38, 450, 350, 346], size: [92, 139], alpha: 166 },
  chips: { crop: [456, 478, 347, 300], size: [64, 103], alpha: 183 },
  clothes: { crop: [856, 470, 365, 332], size: [58, 91], alpha: 238 },
  paper: { crop: [45, 888, 333, 319], size: [51, 84], alpha: 229 },
  files: { crop: [439, 892, 345, 340], size: [49, 70], alpha: 234 },
  litter: { crop: [865, 903, 352, 285], size: [56, 87], alpha: 221 },
} as const;

export type FloorDetailKind = keyof typeof FLOOR_DETAIL_ART;
const themes = {
  passage: ['scuffs', 'trail', 'paper', 'chips', 'drops', 'litter', 'scuffs', 'pool', 'chips', 'paper', 'scuffs', 'drops', 'litter'],
  quiet: ['clothes', 'paper', 'scuffs', 'chips', 'clothes', 'litter'],
  bedroom: ['clothes', 'scuffs', 'paper', 'drops', 'litter', 'clothes', 'chips', 'pool'],
  office: ['files', 'paper', 'scuffs', 'pool', 'paper', 'drops', 'files', 'litter'],
  service: ['litter', 'chips', 'scuffs', 'trail', 'litter', 'drops', 'chips', 'clothes'],
} as const satisfies Record<string, readonly FloorDetailKind[]>;

export type FloorDetailPlan = {
  seed: number;
  themes: readonly (keyof typeof themes)[];
  reserved?: readonly { x: number; y: number }[];
};

export type FloorDetail = { kind: FloorDetailKind; x: number; y: number; w: number; h: number; angle: number };

export function scatterFloorDetails(stage: LevelDefinition): FloorDetail[] {
  const plan = stage.floorDetails;
  if (!plan) return [];
  const reserved = [stage.spawn, stage.exit, ...(plan.reserved ?? [])];
  const solids = [...stage.walls, ...stage.furniture];
  const details: FloorDetail[] = [];
  for (const [i, room] of stage.rooms.entries()) {
    const theme = themes[plan.themes[i]];
    if (!theme) continue;
    let state = plan.seed ^ Math.imul(i + 1, 0x9e3779b9);
    const random = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const offset = Math.floor(random() * theme.length);
    const horizontal = room.w >= room.h;
    const count = Math.min(38, Math.ceil(room.w * room.h / 14500));
    for (let slot = 0; slot < count; slot++) {
      const kind = theme[(slot + offset) % theme.length], art = FLOOR_DETAIL_ART[kind];
      const scale = (art.size[0] + (art.size[1] - art.size[0]) * random()) / Math.max(art.crop[2], art.crop[3]);
      const w = art.crop[2] * scale, h = art.crop[3] * scale;
      const radius = Math.hypot(w, h) / 2;
      const inset = radius + 7;
      if (room.w <= inset * 2 || room.h <= inset * 2) continue;
      for (let attempt = 0; attempt < 16; attempt++) {
        // Spread along the room's long axis. Prefer side lanes for loose objects.
        const along = attempt < 6 ? (slot + random()) / count : random();
        const across = kind === 'trail' || kind === 'scuffs' || kind === 'pool' ? random() :
          (random() < 0.5 ? 0 : 0.7) + random() * 0.3;
        const detail: FloorDetail = {
          kind, w, h,
          x: room.x + inset + (room.w - 2 * inset) * (horizontal ? along : across),
          y: room.y + inset + (room.h - 2 * inset) * (horizontal ? across : along),
          angle: kind === 'trail' || kind === 'scuffs' ? (horizontal ? -39 : 51) + (random() - 0.5) * 62 : random() * 360,
        };
        if (reserved.some(p => dist(p, detail) < 35 + radius)) continue;
        if (stage.doors.some(d => dist(d, detail) < d.length + 9 + radius)) continue;
        if (solids.some(r => circleRect(detail, radius + 3, r))) continue;
        if (details.some(p => dist(p, detail) < (Math.hypot(p.w, p.h) / 2 + radius) * 0.65)) continue;
        details.push(detail);
        break;
      }
    }
  }
  return details;
}
