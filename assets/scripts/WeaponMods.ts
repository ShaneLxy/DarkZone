import { ENGINEER_ID, GHOST_ID, HEROINE_ID, heroes, type HeroId } from './Heroes';
import { SOUND_PROFILES } from './Tactical';

export const SLOT_NAMES = { muzzle: '枪口', sight: '瞄准器', magazine: '弹匣', tube: '弹仓', grip: '握把', tactical: '战术配件' } as const;
export type WeaponSlot = keyof typeof SLOT_NAMES;
export const WEAPON_SLOTS: Record<HeroId, readonly WeaponSlot[]> = {
  [HEROINE_ID]: ['sight', 'magazine', 'grip', 'tactical'],
  [GHOST_ID]: ['muzzle', 'sight', 'magazine', 'grip'],
  [ENGINEER_ID]: ['muzzle', 'tube', 'grip', 'tactical'],
};
export const WEAPON_TYPES = { suppressed: '手枪', rifle: '突击步枪', shotgun: '霰弹枪' } as const;
export const QUALITY_NAMES = ['普通', '稀有', '精良', '完美'] as const;
export const QUALITY_COLORS = ['#e0d8c7', '#84bcff', '#d2a0ff', '#ffd07e'] as const;
export const WEAPON_LEVEL_CAP = 10, MOD_LEVEL_CAP = 5, MOD_STORAGE_CAP = 120;

type ModEffect = 'noise' | 'spread' | 'magazine' | 'reload' | 'moving' | 'vision' | 'push' | 'reloadMove' | 'laser';
type ModDefinition = { title: string; slot: WeaponSlot; effect: ModEffect; heroes?: readonly HeroId[] };
export const MODS = {
  suppressor: { title: '消音器', slot: 'muzzle', effect: 'noise', heroes: [GHOST_ID] },
  compensator: { title: '枪口补偿器', slot: 'muzzle', effect: 'spread', heroes: [GHOST_ID] },
  redDot: { title: '红点瞄准器', slot: 'sight', effect: 'spread' },
  reflex: { title: '反射式瞄准器', slot: 'sight', effect: 'laser' },
  extended: { title: '扩容弹匣', slot: 'magazine', effect: 'magazine' },
  quick: { title: '快速弹匣', slot: 'magazine', effect: 'reload' },
  grip: { title: '防滑握把', slot: 'grip', effect: 'spread' },
  reloadGrip: { title: '快装握把', slot: 'grip', effect: 'reload' },
  choke: { title: '霰弹枪收束器', slot: 'muzzle', effect: 'spread', heroes: [ENGINEER_ID] },
  tube: { title: '弹仓扩容件', slot: 'tube', effect: 'magazine' },
  loader: { title: '管式快装器', slot: 'tube', effect: 'reload' },
  laser: { title: '激光指示器', slot: 'tactical', effect: 'laser', heroes: [HEROINE_ID] },
  flashlight: { title: '战术手电', slot: 'tactical', effect: 'vision' },
  stabilizer: { title: '移动稳定模块', slot: 'tactical', effect: 'moving', heroes: [HEROINE_ID] },
  impactPad: { title: '近距击退模块', slot: 'tactical', effect: 'push', heroes: [ENGINEER_ID] },
  loadHarness: { title: '快装携行架', slot: 'tactical', effect: 'reloadMove', heroes: [ENGINEER_ID] },
} satisfies Record<string, ModDefinition>;
export type ModId = keyof typeof MODS;
export type Quality = 0 | 1 | 2 | 3;
export type Attachment = { serial: number; kind: ModId; quality: Quality; roll: number; level: number };
export type WeaponBuild = { weaponLevel: number; slots: Partial<Record<WeaponSlot, number>> };
export const MOD_IDS = Object.keys(MODS) as ModId[];
export const MAX_WEAPON_PARTS = 99999;
export function fitsWeapon(id: HeroId, kind: ModId) {
  const mod: ModDefinition = MODS[kind];
  return WEAPON_SLOTS[id].includes(mod.slot) && (!mod.heroes || mod.heroes.includes(id));
}
const ranges: Record<ModEffect, readonly [number, number][]> = {
  noise: [[8, 12], [13, 17], [18, 22], [23, 27]],
  spread: [[4, 6], [7, 9], [10, 12], [13, 15]],
  magazine: [[1, 2], [3, 4], [5, 6], [7, 8]],
  reload: [[3, 5], [6, 8], [9, 11], [12, 14]],
  moving: [[5, 8], [9, 12], [13, 16], [17, 20]],
  vision: [[12, 18], [19, 25], [26, 32], [33, 39]],
  laser: [[80, 95], [96, 111], [112, 127], [128, 143]],
  push: [[4, 6], [7, 9], [10, 12], [13, 15]],
  reloadMove: [[4, 5], [6, 7], [8, 9], [10, 11]],
};
export function modRange(kind: ModId, quality: Quality): readonly [number, number] {
  const range = ranges[MODS[kind].effect][quality];
  if (MODS[kind].slot === 'tube') {
    if (MODS[kind].effect === 'magazine') return [[1, 1], [2, 2], [3, 3], [4, 4]][quality] as [number, number];
  }
  return range;
}
export function modValue(mod: Attachment, level = mod.level) {
  const [min, max] = modRange(mod.kind, mod.quality);
  const base = min + Math.min(max - min, Math.floor(mod.roll / 1000 * (max - min + 1)));
  const effect = MODS[mod.kind].effect;
  return base + (level - 1) * (effect === 'laser' ? 7 : effect === 'vision' ? 3 : 1);
}
export function modText(kind: ModId, n: string | number) {
  const labels: Record<ModEffect, string> = {
    noise: `枪声范围 −${n}%`, spread: `弹道散布 −${n}%`, magazine: `容量 +${n} 发`,
    reload: `换弹时间 −${n}%`, moving: `移动时散布 −${n}%`, vision: `视野距离 +${n}`,
    laser: `瞄准线长度 ${n}`, push: `近距离击退 +${n}%`, reloadMove: `装填时移速 +${n}%`,
  };
  return labels[MODS[kind].effect];
}
export const tubeReload = (mod: Attachment) => 1 + Math.floor(mod.roll / 250) + mod.quality * 2;
export function modDescription(mod: Attachment, level = mod.level) {
  return modText(mod.kind, modValue(mod, level)) + (mod.kind === 'tube' ? ` · 换弹 −${tubeReload(mod)}%` : '');
}
const boundedLevel = (level: unknown, cap: number) => typeof level === 'number' && Number.isInteger(level) ? Math.max(1, Math.min(cap, level)) : 1;
export const weaponLevel = (value: unknown) => boundedLevel(value, WEAPON_LEVEL_CAP);
export function readAttachment(value: Partial<Attachment> | null): Attachment | undefined {
  if (!value || !MOD_IDS.includes(value.kind!) || ![0, 1, 2, 3].includes(value.quality!) ||
    !Number.isSafeInteger(value.serial) || value.serial! <= 0 || value.serial! >= Number.MAX_SAFE_INTEGER ||
    !Number.isInteger(value.roll) || value.roll! < 0 || value.roll! >= 1000) return;
  return { serial: value.serial!, kind: value.kind!, quality: value.quality!, roll: value.roll!, level: boundedLevel(value.level, MOD_LEVEL_CAP) };
}
export function installedMods(id: HeroId, build?: WeaponBuild, inventory: readonly Attachment[] = []) {
  return WEAPON_SLOTS[id].flatMap(slot => {
    const mod = inventory.find(item => item.serial === build?.slots[slot]);
    return mod && MODS[mod.kind].slot === slot && fitsWeapon(id, mod.kind) ? [mod] : [];
  });
}
export function configuredHero(id: HeroId, rank = 1, mods: readonly Attachment[] = []) {
  const base = heroes[id], progression = weaponLevel(rank) - 1;
  const totals: Record<ModEffect, number> = { noise: 0, spread: 0, magazine: 0, reload: 0, moving: 0, vision: 0, push: 0, reloadMove: 0, laser: 0 };
  for (const mod of mods) {
    totals[MODS[mod.kind].effect] += modValue(mod);
    if (mod.kind === 'tube') totals.reload += tubeReload(mod);
  }
  if (totals.laser > 0) totals.spread += 3;
  const noise = SOUND_PROFILES[base.weapon], spreadFloor = base.spread * (id === ENGINEER_ID ? 0.63 : 0.5);
  return { ...base, range: 700, damage: base.damage * (1 + progression * 0.035),
    spread: Math.max(spreadFloor, base.spread * (1 - progression * 0.026) * (1 - totals.spread / 100)),
    spreadFloor, movingSpread: totals.moving / 100, reloadSpeed: totals.reloadMove / 100, laser: totals.laser,
    nearPush: totals.push / 100, magazine: base.magazine + totals.magazine, quiet: base.weapon === 'suppressed' || totals.noise > 0,
    reload: base.reload * (1 - Math.min(0.35, totals.reload / 100)), visionRange: base.visionRange + totals.vision,
    shotSound: { radius: Math.round(noise.radius * (1 - totals.noise / 100)), intensity: noise.intensity * (1 - totals.noise / 100) },
  };
}
type Cost = { coins: number; parts: number };
export const weaponUpgradeCost = (rank: number): Cost | undefined =>
  rank < WEAPON_LEVEL_CAP ? { coins: 35 + rank * 15, parts: 2 + rank } : undefined;
export const modUpgradeCost = (mod: Attachment): Cost | undefined =>
  mod.level < MOD_LEVEL_CAP ? { coins: 15 + mod.level * 9 + mod.quality * 6, parts: mod.level + 1 } : undefined;
export const salvageValue = (mod: Attachment) => 1 + mod.quality + (mod.level - 1) * 2;
