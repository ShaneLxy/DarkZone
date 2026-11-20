// Pure gameplay code: no browser or engine dependencies.
import type { ApartmentFloor, DoorSpec, DormKey, EnemySpawn, LevelDefinition } from './Levels';
import { DORM_LEVEL } from './Levels';
import { ageSound, consumeTactical, footstepSoundProfile, GRENADE_BLAST_LIFE, hearSoundThroughGeometry, isShopMine, makeSoundEvent, newTacticalLoadout, resolveTactical, SOUND_PROFILES, stepTactical, tacticalPoint, TACTICAL_DEFINITIONS, type SoundEvent, type TacticalKind, type TacticalLoadout } from './Tactical';
import type { TacticalThrow } from './Tactical';
import { GEAR, grantRandomMod, readArmory, type Armory, type ConsumableId } from './Shop';
import { configuredHero, installedMods, MAX_WEAPON_PARTS, type Attachment } from './WeaponMods';
import { readDailyMissions, recordExploration, type DailyState } from './DailyMissions';
import { readCheckIn, type CheckInState } from './CheckIn';
import { addCaseKeys, CLEAR_CASE_KEYS, readCaseState, type CaseState } from './LootCases';
import { ENGINEER_ID, GHOST_ID, HERO_IDS, HEROINE_ID, heroes, type HeroId } from './Heroes';
import { DormTutorial, sanitizeTutorial, type TutorialStep } from './Tutorial';
import { sanitizeIds, recordClue } from './ClueReader';
import { readAchievementProgress, recordAchievementKills, type AchievementProgress } from './Achievements';
import { OPERATION_AIR_COOLDOWN, OPERATION_AIR_DURATION, OPERATION_AIR_PODS, OPERATION_AIR_RANGE, OPERATION_AIR_VISION, OPERATION_APPROACH_RADIUS, OPERATION_BOARD_RADIUS, OPERATION_BOSS_NAME, OPERATION_DEPARTURE_SECONDS, OPERATION_COMMAND_RADIUS, OPERATION_ENEMY_CAP, OPERATION_EXTRACT_RADIUS, OPERATION_GRENADE_FUSE, OPERATION_GRENADE_RANGE, OPERATION_HOLD, OPERATION_INJECTION_DURATION, OPERATION_MG, OPERATION_PICKUP_READY, OPERATION_ROPE_FOOT, OPERATION_WEST_DOOR_RADIUS, operationBoardingEnd } from './Operation';
import { operationExtractionAt } from './OperationArt';
import { readSurvivalCheckpoint, survivalSearchTuning, SURVIVAL_FIELD_AREAS, SURVIVAL_ITEMS, SURVIVAL_MAP_IDS, type SurvivalCheckpoint, type SurvivalMapId, type SurvivalRun } from './Survival';
import { CONVOY_ARRIVAL, CONVOY_BOARD, CONVOY_LEAVE, CONVOY_NOTICE, convoyVehicles, EVAC_FUEL_SECONDS, EVAC_PART_IDS, EVAC_PART_WINDOWS, EVAC_VEHICLES, newTimedSurvival, SURVIVAL_DEADLINE, type EvacRoute, type EvacVehicle, type SurvivalVariant } from './SurvivalTimed';
import { SENTRY_HP, SENTRY_RANGE, SURVIVAL_DOOR_REACH, SURVIVAL_DOORS, SURVIVAL_GEAR, SURVIVAL_GUNS, SURVIVAL_PARTS, SurvivalBag, isSurvivalGun, isSurvivalSupply, survivalBagCols, survivalBagRows, survivalRandom, survivalWeapons, type GearKind, type GearStack, type SurvivalCrate, type SurvivalDoorKind, type SurvivalDoorPlan, type SurvivalFieldDrop, type SurvivalGearSave, type SurvivalMine, type SurvivalRecipe, type SurvivalRestock, type SurvivalSentry } from './SurvivalGear';
import { harborPoint } from './SurvivalHarbor';
import type { SurvivalStair } from './SurvivalInteriors';

export { DORM_LEVEL };
export { ENGINEER_ID, GHOST_ID, HERO_IDS, HEROINE_ID, heroes, type HeroId };
export type Point = { x: number; y: number };
type SurvivalSearchOrder = {
  stair: SurvivalStair; upper: boolean; evidence: number; expires: number; points: readonly Point[];
  next: number; investigateUntil?: number; returning?: boolean;
};
type SurvivalStairPassage = { enemy: Enemy; down: boolean; phase: 'flight' | 'exit'; starts: number; left?: boolean };
type ApartmentPhase = 'outside' | 'entry-talk' | 'training' | 'stairs' | 'generator' | 'return' | 'shutter' | 'hold' | 'lift' | 'note'
  | 'gear' | 'rally' | 'escape-talk' | 'escape' | 'car-prep' | 'car-hold' | 'car-ready' | 'driving';
type ApartmentStation = ApartmentFloor['stations'][number]['id'] | 'revive' | 'car';
type ApartmentRun = { phase: ApartmentPhase; kits: number; timer: number; traps: (Point & { charge: number; flash: number; entrance?: boolean })[]; queue: EnemySpawn[]; wave: number; engineer?: Ally; route: number; shocked: Set<number>; generatorWork?: number; entryOpen: boolean; tankArrived: boolean; spawnCursor: number; outdoorDialogueEnd: number;
  armed: boolean; following: boolean; navigation?: { goal: Point; point: Point; time: number }; drive?: Point & { angle: number; target: number; speed: number } };
type GarageSnapshot = Pick<Battle, 'doors' | 'loot' | 'enemies' | 'bloodStains' | 'visited' | 'discovered' | 'alerted' | 'cleared'> & {
  explored: Uint8Array; traps: ApartmentRun['traps'];
};
type BruteCharge = { phase: 'windup' | 'dash' | 'recover'; time: number; angle: number };
export type Rect = Point & { w: number; h: number; kind?: string; angle?: number };
export const TAU = Math.PI * 2;
export const APARTMENT_LINE_SECONDS = 3.5;
const GENERATOR_WORK_TIME = 3;
export const GRENADE_LIGHT_RADIUS = 245;
export const GRENADE_LIGHT_TIME = 0.42;
export const BRUTE_WINDUP = 0.78;
export const BRUTE_DASH_TIME = 0.58;
const bruteChargeTravel = (time: number) => 130 * time + 240 / BRUTE_DASH_TIME * time ** 2;
export const ROLL_DURATION = 0.30;
export const ROLL_SPEED = 440;
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export const rooms: Rect[] = [
  { x: 80, y: 80, w: 760, h: 600, kind: '接待区' },
  { x: 840, y: 80, w: 700, h: 600, kind: '办公区' },
  { x: 840, y: 680, w: 700, h: 600, kind: '医疗区' },
  { x: 1540, y: 680, w: 760, h: 600, kind: '隔离区' },
];
export const walls: Rect[] = [
  { x: 80, y: 80, w: 760, h: 18 }, { x: 80, y: 662, w: 760, h: 18 },
  { x: 80, y: 80, w: 18, h: 600 },
  { x: 822, y: 80, w: 18, h: 250 }, { x: 822, y: 450, w: 18, h: 230 },
  { x: 840, y: 80, w: 700, h: 18 },
  { x: 840, y: 662, w: 270, h: 18 }, { x: 1240, y: 662, w: 300, h: 18 },
  { x: 1522, y: 80, w: 18, h: 600 },
  { x: 840, y: 680, w: 18, h: 600 }, { x: 840, y: 1262, w: 700, h: 18 },
  { x: 1522, y: 680, w: 18, h: 240 }, { x: 1522, y: 1050, w: 18, h: 230 },
  { x: 1540, y: 680, w: 760, h: 18 }, { x: 1540, y: 1262, w: 760, h: 18 },
  { x: 2282, y: 680, w: 18, h: 600 },
  // Jamb rebates seal the closed leaf without trapping its square tip during rotation.
  { x: 822, y: 330, w: 18, h: 2, kind: 'jamb' }, { x: 822, y: 448, w: 18, h: 2, kind: 'jamb' },
  { x: 1110, y: 662, w: 2, h: 18, kind: 'jamb' }, { x: 1238, y: 662, w: 2, h: 18, kind: 'jamb' },
  { x: 1522, y: 920, w: 18, h: 2, kind: 'jamb' }, { x: 1522, y: 1048, w: 18, h: 2, kind: 'jamb' },
];
export const furniture: Rect[] = [
  { x: 150, y: 560, w: 210, h: 65, kind: 'sofa' },
  { x: 560, y: 520, w: 190, h: 65, kind: 'cabinet' },
  { x: 460, y: 280, w: 145, h: 82, kind: 'desk' },
  { x: 160, y: 150, w: 85, h: 75, kind: 'crate' },
  { x: 940, y: 210, w: 160, h: 85, kind: 'desk' },
  { x: 1260, y: 420, w: 155, h: 85, kind: 'desk' },
  { x: 970, y: 550, w: 90, h: 65, kind: 'cabinet' },
  { x: 1350, y: 145, w: 110, h: 65, kind: 'sofa' },
  { x: 910, y: 820, w: 160, h: 78, kind: 'bed' },
  { x: 1290, y: 1090, w: 160, h: 78, kind: 'bed' },
  { x: 920, y: 1120, w: 90, h: 80, kind: 'cabinet' },
  { x: 1250, y: 760, w: 150, h: 70, kind: 'cabinet' },
  { x: 1660, y: 800, w: 110, h: 100, kind: 'crate' },
  { x: 2040, y: 1030, w: 120, h: 100, kind: 'crate' },
  { x: 1700, y: 1150, w: 165, h: 65, kind: 'cabinet' },
];
export const obstacles = [...walls, ...furniture];
export type Door = DoorSpec & { id: number; thickness: number; angle: number; target: number; openAngle: number; hp: number; maxHp: number; destroyed: boolean; hit: number; blocked: number; locked: boolean; fortification?: SurvivalDoorKind };
export function createDoors(specs?: DoorSpec[]): Door[] {
  return (specs || [
    { x: 831, y: 332, length: 116, baseAngle: Math.PI / 2, material: 'wood' as const, name: '接待区木门', rooms: [0, 1] as const },
    { x: 1112, y: 671, length: 126, baseAngle: 0, material: 'steel' as const, name: '医疗区钢门', rooms: [1, 2] as const },
    { x: 1531, y: 922, length: 126, baseAngle: Math.PI / 2, material: 'wood' as const, name: '隔离区木门', rooms: [2, 3] as const },
  ] as DoorSpec[]).map((d, id) => ({ ...d, id, thickness: 12, angle: d.baseAngle, target: d.baseAngle, openAngle: d.baseAngle - Math.PI / 2, hp: 100, maxHp: 100, destroyed: false, hit: 0, blocked: 0, locked: !!d.key }));
}
export function doorShape(d: Door, angle = d.angle, hingeClearance = 0): Rect {
  return { x: d.x + Math.sin(angle) * d.thickness / 2 + Math.cos(angle) * hingeClearance, y: d.y - Math.cos(angle) * d.thickness / 2 + Math.sin(angle) * hingeClearance, w: d.length - hingeClearance, h: d.thickness, angle, kind: 'door:' + d.id };
}
export function rectCorners(r: Rect): Point[] {
  const c = Math.cos(r.angle || 0), s = Math.sin(r.angle || 0);
  return [[0, 0], [r.w, 0], [r.w, r.h], [0, r.h]].map(([x, y]) => ({ x: r.x + x * c - y * s, y: r.y + x * s + y * c }));
}
export function closestOnRect(p: Point, r: Rect): Point {
  const c = Math.cos(r.angle || 0), s = Math.sin(r.angle || 0), dx = p.x - r.x, dy = p.y - r.y;
  const x = clamp(dx * c + dy * s, 0, r.w), y = clamp(-dx * s + dy * c, 0, r.h);
  return { x: r.x + x * c - y * s, y: r.y + x * s + y * c };
}
export function rectIntersects(a: Rect, b: Rect): boolean {
  const aa = rectCorners(a), bb = rectCorners(b);
  for (const r of [a, b]) for (const angle of [r.angle || 0, (r.angle || 0) + Math.PI / 2]) {
    const x = Math.cos(angle), y = Math.sin(angle);
    const av = aa.map(p => p.x * x + p.y * y), bv = bb.map(p => p.x * x + p.y * y);
    if (Math.max(...av) <= Math.min(...bv) + 0.05 || Math.max(...bv) <= Math.min(...av) + 0.05) return false;
  }
  return true;
}
export const roomAt = (p: Point, spaces = rooms) => spaces.findIndex(r => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
export function circleRect(p: Point, radius: number, r: Rect): boolean {
  if (!r.angle) return Math.hypot(p.x - clamp(p.x, r.x, r.x + r.w), p.y - clamp(p.y, r.y, r.y + r.h)) < radius;
  return dist(p, closestOnRect(p, r)) < radius;
}
const HARBOR_BUCKET_SIZE = 192;
type RectBuckets = Map<number, Rect[]>;
const harborBlockIndex = new WeakMap<Rect[], RectBuckets[]>();
const harborBucketKey = (x: number, y: number) => x * 4096 + y;
function bucketHarborRects(blocks: Rect[]): RectBuckets {
  const result: RectBuckets = new Map();
  for (const block of blocks) {
    const corners = rectCorners(block);
    const left = Math.floor(Math.min(...corners.map(p => p.x)) / HARBOR_BUCKET_SIZE);
    const right = Math.floor(Math.max(...corners.map(p => p.x)) / HARBOR_BUCKET_SIZE);
    const bottom = Math.floor(Math.min(...corners.map(p => p.y)) / HARBOR_BUCKET_SIZE);
    const top = Math.floor(Math.max(...corners.map(p => p.y)) / HARBOR_BUCKET_SIZE);
    for (let x = left; x <= right; x++) for (let y = bottom; y <= top; y++) {
      const key = harborBucketKey(x, y), cell = result.get(key);
      if (cell) cell.push(block);
      else result.set(key, [block]);
    }
  }
  return result;
}
function nearbyRects(blocks: Rect[], ax: number, ay: number, bx: number, by: number) {
  const indexes = harborBlockIndex.get(blocks);
  if (!indexes || !Number.isFinite(bx) || !Number.isFinite(by)) return blocks;
  const left = Math.floor(Math.min(ax, bx) / HARBOR_BUCKET_SIZE);
  const right = Math.floor(Math.max(ax, bx) / HARBOR_BUCKET_SIZE);
  const bottom = Math.floor(Math.min(ay, by) / HARBOR_BUCKET_SIZE);
  const top = Math.floor(Math.max(ay, by) / HARBOR_BUCKET_SIZE);
  if ((right - left + 1) * (top - bottom + 1) > 200) return blocks;
  const found: Rect[] = [];
  for (let x = left; x <= right; x++) for (let y = bottom; y <= top; y++) {
    const key = harborBucketKey(x, y);
    for (const index of indexes) {
      const cell = index.get(key);
      if (cell) for (const block of cell) found.push(block);
    }
  }
  return found;
}
export function walkable(p: Point, radius = 16, blocks = obstacles, spaces = rooms): boolean {
  return roomAt(p, spaces) >= 0 && !nearbyRects(blocks, p.x - radius, p.y - radius, p.x + radius, p.y + radius)
    .some(r => circleRect(p, radius, r));
}
// Distance to the first intersection of a finite ray and an axis-aligned rectangle.
export function rayRect(p: Point, dx: number, dy: number, r: Rect, max: number): number {
  if (r.angle) {
    const c = Math.cos(r.angle), s = Math.sin(r.angle), px = p.x - r.x, py = p.y - r.y;
    return rayRect({ x: px * c + py * s, y: -px * s + py * c }, dx * c + dy * s, -dx * s + dy * c, { x: 0, y: 0, w: r.w, h: r.h }, max);
  }
  let lo = 0, hi = max;
  if (Math.abs(dx) < 1e-8) {
    if (p.x < r.x || p.x > r.x + r.w) return max;
  } else {
    const near = (r.x - p.x) / dx, far = (r.x + r.w - p.x) / dx;
    lo = Math.max(lo, Math.min(near, far)); hi = Math.min(hi, Math.max(near, far));
    if (hi < lo) return max;
  }
  if (Math.abs(dy) < 1e-8) {
    if (p.y < r.y || p.y > r.y + r.h) return max;
  } else {
    const near = (r.y - p.y) / dy, far = (r.y + r.h - p.y) / dy;
    lo = Math.max(lo, Math.min(near, far)); hi = Math.min(hi, Math.max(near, far));
    if (hi < lo) return max;
  }
  return lo <= max && hi >= 0 ? Math.max(0, lo) : max;
}
export function rayDistance(p: Point, angle: number, max: number, blocks = obstacles): number {
  const dx = Math.cos(angle), dy = Math.sin(angle);
  let length = max;
  for (const r of nearbyRects(blocks, p.x, p.y, p.x + dx * max, p.y + dy * max)) {
    length = Math.min(length, rayRect(p, dx, dy, r, length));
  }
  return length;
}
export function lineClear(a: Point, b: Point, blocks = obstacles): boolean {
  const d = dist(a, b);
  return rayDistance(a, Math.atan2(b.y - a.y, b.x - a.x), d, blocks) >= d - 0.01;
}
export const DEFAULT_VISION_RANGE = 530;
export const peripheralRange = (visionRange = DEFAULT_VISION_RANGE) => visionRange * 140 / DEFAULT_VISION_RANGE;
export function sightRange(angle: number, facing: number, visionRange = DEFAULT_VISION_RANGE): number {
  const d = Math.abs(angleDiff(angle, facing));
  // Wide cone with a short, occluded peripheral circle; no wall penetration.
  return (d < 0.94 ? 530 : d < 1.04 ? 140 + (1.04 - d) * 3900 : 140) * visionRange / DEFAULT_VISION_RANGE;
}
export function visible(origin: Point, facing: number, target: Point, blocks = obstacles, visionRange = DEFAULT_VISION_RANGE): boolean {
  return dist(origin, target) <= sightRange(Math.atan2(target.y - origin.y, target.x - origin.x), facing, visionRange) && lineClear(origin, target, blocks);
}
export function visibilityPolygon(origin: Point, facing: number, blocks = obstacles, visionRange = DEFAULT_VISION_RANGE, panoramic = false): Point[] {
  return castSight(origin, facing, blocks, visionRange, angle => panoramic ? visionRange : sightRange(angle, facing, visionRange));
}
export function grenadeLightPolygon(origin: Point, blocks: Rect[]): Point[] {
  return castSight(origin, 0, blocks, GRENADE_LIGHT_RADIUS, () => GRENADE_LIGHT_RADIUS);
}
function castSight(origin: Point, facing: number, blocks: Rect[], range: number, distanceAt: (angle: number) => number): Point[] {
  const angles: number[] = [];
  // Rotate regular samples with the cone; world-fixed samples make its rounded
  // range boundary change tessellation as the player turns.
  for (let i = 0; i < 160; i++) angles.push(angleDiff(facing - Math.PI + i * TAU / 160, 0));
  for (const r of blocks) for (const { x, y } of rectCorners(r)) {
    if (Math.hypot(x - origin.x, y - origin.y) > range + 30) continue;
    const a = Math.atan2(y - origin.y, x - origin.x);
    angles.push(a - 0.0002, a, a + 0.0002);
  }
  angles.sort((a, b) => a - b);
  return angles.map(a => { const d = rayDistance(origin, a, distanceAt(a), blocks); return { x: origin.x + Math.cos(a) * d, y: origin.y + Math.sin(a) * d }; });
}
// Only door artwork uses this tiny surface allowance. Actors and projectiles
// always keep the strict polygon, so making the occluder visible reveals no enemy.
export function doorSurfacePolygon(origin: Point, facing: number, strict: Point[], doors: Door[], visionRange = DEFAULT_VISION_RANGE): Point[] {
  return strict.map(p => {
    const distance = dist(origin, p); if (distance < 0.001) return p;
    const dx = (p.x - origin.x) / distance, dy = (p.y - origin.y) / distance;
    const hitDoor = doors.some(d => !d.destroyed && Math.abs(rayRect(origin, dx, dy, doorShape(d), distance + 1) - distance) < 0.05);
    if (!hitDoor) return p;
    const length = Math.min(distance + 18, sightRange(Math.atan2(dy, dx), facing, visionRange));
    return { x: origin.x + dx * length, y: origin.y + dy * length };
  });
}
export type TrainingKind = 'level' | 'mobility' | 'attack';
export type Growth = { mobility: number; attack: number };
export type ProfileIdentity = { name: string; avatar: HeroId };
export type Profile = { survivalMaps: Partial<Record<SurvivalMapId, SurvivalCheckpoint>>; identity: ProfileIdentity; version: number; owned: Record<HeroId, boolean>; levels: Record<HeroId, number>; mobilityLevels: Record<HeroId, number>; attackLevels: Record<HeroId, number>; materials: number; coins: number; tickets: number; draws: number; victories: number; streetUnlocked: boolean; apartmentUnlocked: boolean; operationArchive?: boolean; sound: boolean; aimAssist: boolean; autoFire: boolean; daily: DailyState; checkIn: CheckInState; tacticalUnlocked: TacticalKind[]; achievements: string[]; achievementProgress: AchievementProgress; clues: string[]; tutorial: TutorialStep; tutorialSeen: boolean; tutorialCompleted: boolean; tutorialSkipped: boolean; tutorialDismissed: boolean; armory: Armory; cases: CaseState };
export const PROFILE_VERSION = 5;
export const PROFILE_NAME_LIMIT = 12;
const DEFAULT_PROFILE_NAME = '幸存者档案';
export function profileName(value: unknown) {
  if (typeof value !== 'string') return DEFAULT_PROFILE_NAME;
  const trimmed = value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '').trim();
  return Array.from(trimmed).slice(0, PROFILE_NAME_LIMIT).join('') || DEFAULT_PROFILE_NAME;
}
export const TRAINING_CAP = 10;
const trainingKeys = { level: 'levels', mobility: 'mobilityLevels', attack: 'attackLevels' } as const;
const trainingUnitCost = { level: 30, mobility: 40, attack: 40 };
const validLevel = (value: unknown) => Number.isInteger(value) ? clamp(value as number, 1, TRAINING_CAP) : 1;
export function heroStats(id: HeroId, level = 1, growth: Partial<Growth> = {}, h = configuredHero(id)) {
  const rank = validLevel(level);
  const attackRate = (1 + (validLevel(growth.attack) - 1) * 0.08) / h.interval;
  return { hp: h.hp + (rank - 1) * 6, damage: h.damage * (1 + (rank - 1) * 0.04), speed: h.speed * (1 + (validLevel(growth.mobility) - 1) * 0.05), attackRate, interval: 1 / attackRate, visionRange: h.visionRange, peripheralRange: peripheralRange(h.visionRange) };
}
export function heroRating(id: HeroId, stats: ReturnType<typeof heroStats>, h = configuredHero(id)) {
  const { reload, magazine, pellets } = h;
  const sustainedDamage = stats.damage * pellets * magazine / (magazine / stats.attackRate + reload);
  const survival = stats.hp / 175, offense = sustainedDamage / 170, mobility = stats.speed / 300, sight = stats.visionRange / 600;
  const footsteps = footstepSoundProfile(id).radius, gunfire = h.shotSound.radius;
  // Use the relative exposed area in open space, with gunfire weighted more heavily.
  const exposure = 0.3 * (footsteps / 200) ** 2 + 0.7 * (gunfire / SOUND_PROFILES.rifle.radius) ** 2;
  const noise = Math.round(clamp(exposure, 0, 1) * 100);
  return {
    power: Math.round(1000 * (0.28 * survival + 0.34 * offense + 0.23 * mobility + 0.15 * sight)),
    noise: { score: noise, footsteps, gunfire },
    axes: [survival, offense, 1 - noise / 100, sight, mobility].map(score => clamp(score, 0, 1)),
  };
}
export function profileGrowth(p: Profile, id: HeroId): Growth { return { mobility: p.mobilityLevels[id], attack: p.attackLevels[id] }; }
export function newProfile(): Profile {
  const ranks = { [HEROINE_ID]: 1, [GHOST_ID]: 1, [ENGINEER_ID]: 1 };
  return {
    identity: { name: DEFAULT_PROFILE_NAME, avatar: HEROINE_ID }, survivalMaps: {},
    version: PROFILE_VERSION, owned: { [HEROINE_ID]: true, [GHOST_ID]: false, [ENGINEER_ID]: false },
    levels: { ...ranks }, mobilityLevels: { ...ranks }, attackLevels: { ...ranks },
    materials: 80, coins: 0, tickets: 3, draws: 0, victories: 0, streetUnlocked: false, apartmentUnlocked: false, operationArchive: false,
    sound: true, aimAssist: true, autoFire: false, daily: readDailyMissions(), checkIn: readCheckIn(), cases: readCaseState(), tacticalUnlocked: [],
    tutorial: 'move', tutorialSeen: false, tutorialCompleted: false, tutorialSkipped: false, tutorialDismissed: false, achievements: [], achievementProgress: readAchievementProgress(undefined), clues: [], armory: readArmory(),
  };
}
export function readProfile(raw: string | null, onMigration?: () => void): Profile {
  const p = newProfile();
  try {
    const v = JSON.parse(raw || 'null');
    if (!v || ![1, 2, 3, 4, PROFILE_VERSION].includes(v.version)) return p;
    for (const key of ['materials', 'coins', 'tickets', 'draws', 'victories'] as const) if (Number.isSafeInteger(v[key]) && v[key] >= 0) p[key] = Math.min(v[key], 1000000);
    p.identity.name = profileName(v.identity?.name);
    if (HERO_IDS.includes(v.identity?.avatar)) p.identity.avatar = v.identity.avatar;
    p.streetUnlocked = typeof v.streetUnlocked === 'boolean' ? v.streetUnlocked : p.victories > 0;
    p.apartmentUnlocked = v.apartmentUnlocked === true;
    p.operationArchive = v.operationArchive === true;
    p.owned[GHOST_ID] = v.version >= 2 && v.owned?.[GHOST_ID] === true;
    p.owned[ENGINEER_ID] = v.version >= 4 && v.owned?.[ENGINEER_ID] === true;
    for (const key of Object.values(trainingKeys)) {
      for (const id of HERO_IDS) {
        if (id === ENGINEER_ID && v.version < 4) continue;
        if (key === 'levels' || v.version >= 3) p[key][id] = validLevel(v[key]?.[id]);
      }
    }
    // Legacy indexes 1 and 2 belonged to the retired recruits. A v4 save never refunds them again.
    if (v.version < 4) for (const id of [1, 2]) {
      if (v.owned?.[id] !== true) continue;
      p.tickets++;
      for (const kind of ['level', 'mobility', 'attack'] as const) {
        const rank = validLevel(kind === 'level' || v.version >= 3 ? v[trainingKeys[kind]]?.[id] : undefined);
        p.materials += trainingUnitCost[kind] * rank * (rank - 1) / 2;
      }
    }
    if (typeof v.sound === 'boolean') p.sound = v.sound;
    if (typeof v.aimAssist === 'boolean') p.aimAssist = v.aimAssist;
    if (typeof v.autoFire === 'boolean') p.autoFire = v.autoFire;
    p.daily = readDailyMissions(v.daily);
    p.checkIn = readCheckIn(v.checkIn);
    p.cases = readCaseState(v.cases);
    p.armory = readArmory(v.armory);
    let migratedSurvival = false;
    for (const id of SURVIVAL_MAP_IDS) {
      const rawCheckpoint = v.survivalMaps?.[id] ?? (id === 'harbor' ? v.survival : undefined);
      const checkpoint = readSurvivalCheckpoint(rawCheckpoint);
      if (checkpoint && rawCheckpoint?.version !== checkpoint.version) migratedSurvival = true;
      if (checkpoint && p.owned[checkpoint.hero]) p.survivalMaps[id] = checkpoint;
    }
    p.achievements = sanitizeIds(v.achievements);
    p.achievementProgress = readAchievementProgress(v.achievementProgress);
    p.clues = sanitizeIds(v.clues);
    const legacyTutorial = sanitizeTutorial(v.tutorial);
    const hasTutorialFlags = ['tutorialSeen', 'tutorialCompleted', 'tutorialSkipped', 'tutorialDismissed'].some(key => Object.prototype.hasOwnProperty.call(v, key));
    p.tutorial = legacyTutorial;
    p.tutorialSeen = hasTutorialFlags ? v.tutorialSeen === true : legacyTutorial !== 'move';
    p.tutorialCompleted = hasTutorialFlags && v.tutorialCompleted === true;
    p.tutorialSkipped = hasTutorialFlags && v.tutorialSkipped === true;
    p.tutorialDismissed = hasTutorialFlags ? v.tutorialDismissed === true : legacyTutorial === 'done';
    if (p.tutorialCompleted || p.tutorialSkipped || p.tutorialDismissed) p.tutorial = 'done';
    if (p.tutorial !== 'move') p.tutorialSeen = true;
    p.tacticalUnlocked = !Object.prototype.hasOwnProperty.call(v, 'tacticalUnlocked') ? ['grenade', 'flashbang'] :
      (['grenade', 'flashbang'] as TacticalKind[]).filter(kind => Array.isArray(v.tacticalUnlocked) && v.tacticalUnlocked.includes(kind));
    if (v.version === 4 && Array.isArray(v.armory?.weapons)) {
      // Historical prices are only used when migrating old purchases.
      const retired = { glock: 180, m4a1: 480, ak47: 520, mp5: 280, ump45: 320, m1014: 430 };
      for (const [id, price] of Object.entries(retired)) if (v.armory.weapons.includes(id)) p.coins += price;
    }
    if (v.version < PROFILE_VERSION || migratedSurvival || v.survival && p.survivalMaps.harbor) onMigration?.();
  } catch { /* A damaged local save must not prevent starting the prototype. */ }
  return p;
}
export function trainingCost(p: Profile, id: HeroId, kind: TrainingKind = 'level'): number | null {
  const key = trainingKeys[kind];
  if (!heroes[id] || !p.owned[id] || !key || p[key][id] >= TRAINING_CAP) return null;
  return p[key][id] * trainingUnitCost[kind];
}
export function upgrade(p: Profile, id: HeroId, kind: TrainingKind = 'level'): boolean {
  const cost = trainingCost(p, id, kind);
  if (cost === null) return false;
  if (p.materials < cost) return false;
  p.materials -= cost; p[trainingKeys[kind]][id]++; return true;
}
export function recruit(p: Profile): { id: HeroId; duplicate: boolean } | null {
  if (p.tickets < 1) return null;
  const id = GHOST_ID;
  const duplicate = p.owned[id];
  p.tickets--; p.draws++; p.owned[id] = true;
  if (duplicate) p.materials += 30;
  return { id, duplicate };
}
export type OperationPhase = 'brief' | 'landing' | 'line1' | 'line2' | 'line3' | 'breach' | 'leader-fight' | 'injection' | 'king-fight' | 'king-escape' | 'new-order' | 'complete' | 'retreat' | 'announcement' | 'hold' | 'pickup' | 'boarding' | 'strike' | 'debrief';
export type Enemy = Point & { id: number; room: number; type: 'walker' | 'spitter' | 'boss' | 'gunner'; appearance?: number; operationBoss?: 'leader' | 'king'; leaderBurst?: boolean; hp: number; maxHp: number; angle: number; cooldown: number; hit: number; windup: number; attackAngle: number; stun: number; paralysis?: number; charge?: BruteCharge; chargeCooldown?: number; lastSeen?: Point; combatMemory?: number; soundOnly?: boolean; hearingAlert?: boolean; investigate?: Point; investigateTime?: number; alarmInvestigation?: boolean; searchTime?: number; doorBlockId?: number; doorBlockCount?: number; forceOpen?: number; doorClearId?: number; doorClearTime?: number; doorClearPoint?: Point; knockback?: ForcedKnockback; lastHitShot?: number; attackAlly?: Ally; operationSector?: number; muzzle?: number;
  leaderTarget?: Player | Ally; leaderNextRecoil?: number; survivalPursuit?: boolean; survivalVariant?: SurvivalVariant;
  leaderMove?: { point: Point; remaining: number; stalled: number };
  leaderBlocked?: { point: Point; until: number }; };
type BruteGait = { phase: number; traveled: number; updated: number; planted: number; steps: number };
type OperationBoarder = Point & { id: number; angle: number; rally: Point };
type OperationExtraction = { pickupTime: number; boarding?: { time: number; actors: OperationBoarder[] } };
type OperationAirFlight = Point & {
  mode: 'inbound' | 'search' | 'align' | 'sweep' | 'outbound';
  from: Point; to: Point; heading: number; targetHeading: number;
  time: number; duration: number; onStation?: number; nextBurst: number; nextSearch: number; burst: number; contact?: Enemy; podFlash: [number, number];
};
export type Ally = Point & { id: number; slot: number; hp: number; maxHp: number; angle: number; cooldown: number; ammo: number; burst: number; hit: number; muzzle: number; retreat?: Point; rethink?: number; footstepTime?: number; knockback?: ForcedKnockback; grenades?: number; regrouping?: boolean;
  aimLock?: { id: number; remaining: number }; detour?: { point: Point; remaining: number }; blockedTime?: number; };
export type Bullet = Point & { vx: number; vy: number; life: number; damage: number; hostile: boolean; firearm?: boolean; airSupport?: boolean;
  traveled?: number; range?: number; push?: number; nearPush?: number; shot?: number; trainingAuto?: boolean; support?: boolean };
export type Particle = Point & { vx: number; vy: number; life: number; max: number; kind: string; owner?: number; size?: number; rotation?: number; spin?: number; z?: number; vz?: number; tint?: string };
export type BloodStain = Point & { radius: number; seed: number; angle?: number; drops?: number; outline?: Point[]; droplets?: (Point & { radius: number })[] };
export type ForcedKnockback = { start: Point; end: Point; elapsed: number; duration: number; doorId?: number; exiting?: boolean; keepsAim?: boolean };
type DamageImpact = { angle: number; distance: number; shot?: number; point?: Point; heavy?: boolean };
const FIREARM_BULLET_SPEED = 1000;
// Rifle, SMG, shotgun and suppressed pistol, in roster order.
const EXPLOSIVE_PUSH = { grenade: 70, 'proximity-mine': 84, flashbang: 0, 'shock-mine': 0, claymore: 85 };
export type Player = Point & { hp: number; maxHp: number; angle: number; ammo: number; reload: number; fire: number; dash: number; dashTime: number; dashX: number; dashY: number; invulnerable: number; hit: number; stun: number; knockback?: ForcedKnockback };
type Unit = Player | Enemy | Ally;
const unitRadius = (unit: Unit) => 'type' in unit && unit.type === 'boss' ? 25 : 'dashTime' in unit ? 16 : 15;
export function engineerMuzzle(point: Point, angle: number, scale = 1): Point {
  return { x: point.x + (Math.cos(angle) * 76 - Math.sin(angle) * 2) * scale,
    y: point.y + (Math.sin(angle) * 76 + Math.cos(angle) * 2) * scale };
}
const UNIT_CELL_SIZE = 64;
const STREET_ENEMY_LIMIT = 40;
const STREET_NEARBY_LIMIT = 28;
const STREET_SUPPORT_SIZE = 3;
export const ALLY_VISION_RANGE = 305;
const OPERATION_OUTDOOR_VISION_SCALE = 2;
const OPERATION_SPAWN_SIGHT_CAP = 620;
export const MINIMAP_CELL_SIZE = 40;
export type SupplyKind = 'bandage' | 'medkit' | 'drink';
export type Loot = Point & { id: number; kind: SupplyKind | 'ammo' | 'coins' | 'mod-cache'; taken: boolean };
export const SUPPLY_INFO: Record<SupplyKind, { name: string; description: string; duration: number }> = {
  bandage: { name: '绷带', description: '5秒内恢复25%生命', duration: 0.8 },
  medkit: { name: '医疗包', description: '快速恢复60%生命', duration: 1 },
  drink: { name: '能量饮料', description: '恢复10%生命，移速提升20%持续10秒', duration: 0.25 },
};
export type Controls = { x: number; y: number; angle: number; fire: boolean; autoFire?: boolean; sweeping?: boolean; aimActive?: boolean; manualHeld?: boolean };
export const FACILITY_LEVEL: LevelDefinition = {
  id: 'facility', title: '断电设施', rooms, walls, furniture, doors: createDoors(), spawn: { x: 320, y: 360 }, exit: { x: 2190, y: 1185 },
  hints: ['从东侧门前进 →', '从北侧门前进 ↑', '从东侧门前进 →', '前往撤离点'], spawns: [
    [0, 660, 390, 'walker'], [0, 700, 225, 'walker'], [0, 700, 625, 'spitter'],
    [1, 1160, 370, 'walker'], [1, 1400, 570, 'spitter'], [1, 1210, 160, 'walker'], [1, 1430, 300, 'walker'],
    [2, 1100, 1020, 'walker'], [2, 1430, 940, 'spitter'], [2, 1140, 1190, 'walker'], [2, 1180, 850, 'walker'],
    [3, 1960, 980, 'boss'], [3, 2180, 780, 'spitter'], [3, 2190, 1190, 'walker'],
  ],
};
export class Battle {
  doors = createDoors();
  blockers: Rect[] = [];
  visionBlockers: Rect[] = [];
  readonly bruteFootfalls: Point[] = [];
  private bruteGaits = new WeakMap<Enemy, BruteGait>();
  geometryRevision = 0;
  private gridDirty = true;
  private harborStaticIndex?: { movement: RectBuckets; sight: RectBuckets };
  private harborPlayerFlowCell = -1;
  private harborPlayerFlowRevision = -1;
  player: Player;
  hero: ReturnType<typeof configuredHero>;
  private readonly baseGun: ReturnType<typeof configuredHero>;
  private readonly workshopEnabled: boolean;
  private readonly supportGuns: Record<typeof GHOST_ID | typeof ENGINEER_ID, ReturnType<typeof configuredHero>>;
  workshopReward?: { parts: number; mods: Attachment[] };
  private modCaches = 0;
  readonly supplyLimit: number;
  private readonly protection: number;
  readonly stats: ReturnType<typeof heroStats>;
  enemies: Enemy[] = []; allies: Ally[] = []; bullets: Bullet[] = []; particles: Particle[] = []; deathFragments: Particle[] = [];
  bloodStains: BloodStain[] = [];
  reserveAmmo: number;
  supplies: Record<SupplyKind, number> = { bandage: 0, medkit: 0, drink: 0 };
  private purchased: Armory['counts'] = {};
  private spendPurchased?: (id: ConsumableId) => void;
  private purchasedTactical?: Armory['tactical'];
  loot: Loot[] = [];
  coins = 0;
  usingSupply?: { kind: SupplyKind; time: number };
  healingTime = 0;
  private bandageAlly?: number | null;
  readonly recoveryFx = new Map<Player | Ally, number>();
  speedTime = 0;
  bloodRevision = 0;
  private unitBuckets = new Map<number, Unit[]>();
  private unitBucketPool: Unit[][] = [];
  private unitsIndexed = false;
  private rollLanding?: Point;
  private streamTimes: number[] = [];
  private streamCursors: number[] = [];
  private supportCalled = false;
  private squadHeading = 0;
  readonly minimap = { columns: 0, rows: 0, explored: new Uint8Array(0), visible: new Uint8Array(0), revision: 0 };
  private minimapSight?: Point & { angle: number; geometry: number };
  private minimapGrenadeLights: Point[] = [];
  private minimapAllies: (Point & { angle: number })[] = [];
  private minimapVisible: number[] = [];
  private bulletPool: Bullet[] = [];
  // Room exploration, discovery, AI alert and combat completion are independent.
  visited: boolean[] = []; discovered: boolean[] = []; alerted: boolean[] = []; cleared: boolean[] = [];
  readonly keys = new Set<DormKey>();
  floorPending = false;
  apartment?: ApartmentRun;
  survival?: SurvivalRun;
  survivalActiveLimit = 86;
  survivalPickupBlocked?: { kind: GearKind; width: number; height: number };
  survivalConvoyAim = new Map<number, { angle: number; shotAt: number; trackingAt: number }>();
  survivalBag?: SurvivalBag;
  survivalCrates: SurvivalCrate[] = [];
  survivalField: SurvivalFieldDrop[] = [];
  survivalRestock?: SurvivalRestock;
  survivalDoorWork?: { id: number; replacement?: SurvivalDoorKind; left: number; duration: number; hp: number; start: Point };
  private survivalRestockTick = 0;
  private survivalGrenadeCooldown = 0;
  survivalSentries: SurvivalSentry[] = [];
  survivalMines: SurvivalMine[] = [];
  survivalSpecial?: NonNullable<SurvivalGearSave['special']>;
  survivalSpecialActive = false;
  survivalPlacement?: Point & { id: number; duration: number; left: number; angle: number };
  survivalScan = 0;
  private survivalBaseAmmo = 0;
  private survivalBaseReserve = 0;
  private survivalSupplyId?: number;
  private sentryWindups = new WeakMap<Enemy, SurvivalSentry>();
  private survivalStairTransit?: SurvivalStair;
  private survivalSearchOrders = new WeakMap<Enemy, SurvivalSearchOrder>();
  private survivalStairPassages = new Map<SurvivalStair, SurvivalStairPassage>();
  private survivalSweepTimes = new Map<SurvivalStair, number>();
  private survivalStairWarning = -Infinity;
  private playerSounds = new WeakSet<SoundEvent>();
  private garageSnapshot?: GarageSnapshot;
  exitHold = false;
  alarmTime: number | null = null;
  private alarmSource?: Point;
  private alarmPulse = 0;
  private streetSupplyTaken = false;
  private reinforcements: Array<{ delay: number; spawn: EnemySpawn }> = [];
  private enemySequence = 0;
  private previousRooms = 0;
  private previousClears = 0;
  kills = 0; elapsed = 0; status: 'playing' | 'won' | 'lost' = 'playing';
  revivalCharges = 1;
  private shotSequence = 0;
  events: string[] = []; rewardClaimed = false;
  lastHurtAngle = 0;
  private gridWidth = 0;
  private gridHeight = 0;
  private flow = new Int32Array(0);
  private grid = new Uint8Array(0);
  private flowQueue = new Int32Array(0);
  private soundFlows = new Map<number, Int32Array>();
  private soundFlowBudget = 4;
  private flowTime = 0;
  private perceptionTime = 0;
  tutorial?: DormTutorial;
  beginTutorial(step: TutorialStep) {
    if (step !== 'done' && this.stage.dorm?.number === 2) this.tutorial = new DormTutorial(step);
  }
  endTutorial() {
    if (!this.tutorial) return;
    this.tutorial = undefined;
    this.bullets = []; this.events = []; this.sounds = [];
    this.player.fire = this.player.reload = 0;
    this.player.ammo = this.hero.magazine;
  }
  private updateTutorial(dt: number, controls: Controls) {
    const t = this.tutorial!, p = this.player;
    // Freeze campaign time, AI, doors, discovery, sounds and room rewards. All
    // original enemies remain in this same Battle at their original positions.
    p.angle = controls.angle;
    p.fire = Math.max(0, p.fire - dt);
    if (p.reload > 0) { p.reload = Math.max(0, p.reload - dt); if (!p.reload) p.ammo = this.hero.magazine; }
    const before = { x: p.x, y: p.y }, len = Math.max(1, Math.hypot(controls.x, controls.y));
    this.move(p, controls.x / len * this.stats.speed * dt, controls.y / len * this.stats.speed * dt, 16);
    // A convex, furniture-free rectangle inside the actual starting bedroom.
    // This prevents wandering into sleeping enemies or losing the target.
    p.x = clamp(p.x, 280, 410); p.y = clamp(p.y, 220, 365);
    const activeAim = controls.aimActive === true && !controls.manualHeld && !controls.fire &&
      Math.abs(angleDiff(p.angle, Math.atan2(t.target.y - p.y, t.target.x - p.x))) < 0.16 &&
      visible(p, p.angle, t.target, this.blockers, this.stats.visionRange);
    t.observe(dist(before, p) > 0 && dist(p, t.moveGoal) < 18, activeAim);
    const auto = !!controls.autoFire;
    if (auto ? t.autoEnabled && !controls.sweeping && this.trainingRay() : controls.fire) this.shoot(auto);
    for (const b of this.bullets) {
      const speed = Math.hypot(b.vx, b.vy), travel = speed * dt;
      const wall = rayDistance(b, Math.atan2(b.vy, b.vx), travel, this.blockers);
      const dx = t.target.x - b.x, dy = t.target.y - b.y;
      const along = (dx * b.vx + dy * b.vy) / speed, side = dx * dx + dy * dy - along * along;
      const entry = side <= 18 * 18 && along + 18 >= 0 ? Math.max(0, along - Math.sqrt(Math.max(0, 18 * 18 - side))) : Infinity;
      if (entry < wall && visible(p, p.angle, t.target, this.blockers, this.stats.visionRange)) {
        t.hit(b.trainingAuto === true); b.life = 0;
      } else { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (wall < travel) b.life = 0; }
    }
    this.bullets = this.bullets.filter(b => b.life > 0);
    t.observe(false, false);
  }
  private trainingRay() {
    const t = this.tutorial!, p = this.player, a = Math.atan2(t.target.y - p.y, t.target.x - p.x);
    return visible(p, p.angle, t.target, this.blockers, this.stats.visionRange) &&
      Math.abs(angleDiff(a, p.angle)) < Math.asin(Math.min(1, 16 / Math.max(1, dist(p, t.target))));
  }
  tactical: TacticalLoadout = newTacticalLoadout();
  tacticalThrows: TacticalThrow[] = [];
  plantedMines: Array<Point & { kind: 'shock-mine' | 'claymore'; angle: number; delay: number }> = [];
  tacticalEffects: Array<Point & { kind: TacticalKind; life: number; max: number }> = [];
  get grenadeLights() {
    return this.tacticalEffects.filter(effect => effect.kind === 'grenade' && effect.max - effect.life < GRENADE_LIGHT_TIME &&
      lineClear(this.player, effect, this.visionBlockers));
  }
  sounds: SoundEvent[] = [];
  private footstepTime = 0;
  private idleWander = new WeakMap<Enemy, { origin: Point; room: number; rng: number; remaining: number; target?: Point }>();
  private doorForceCooldown = new Map<number, number>();
  private doorAttempts = new Map<number, Enemy>();
  private doorSoundTime = new Map<number, number>();
  emitSound(position: Point, type: keyof typeof SOUND_PROFILES, profile: { intensity: number; radius: number } = SOUND_PROFILES[type], fromPlayer = position === this.player) {
    // Bound simultaneous events even when several enemies interact in one frame.
    if (this.sounds.some(s => s.type === type && s.life > s.maxLife - 0.08 && dist(s.position, position) < 12)) return;
    const sound = makeSoundEvent(position, profile.intensity, type, profile.radius);
    if (fromPlayer && this.stage.survival) this.playerSounds.add(sound);
    this.sounds.push(sound);
    if (this.sounds.length > 48) this.sounds.splice(0, this.sounds.length - 48);
  }
  private emitDoorInteract(d: Door, success: boolean) {
    const now = this.elapsed, last = this.doorSoundTime.get(d.id) ?? -Infinity;
    if (now - last < 0.35) return;
    this.doorSoundTime.set(d.id, now);
    this.emitSound({ x: d.x + Math.cos(d.baseAngle) * d.length / 2, y: d.y + Math.sin(d.baseAngle) * d.length / 2 }, success ? 'door-open' : 'door-interact', SOUND_PROFILES['door-interact'], true);
    this.events.push('door-sound');
  }
  preparePurchasedItems(armory: Armory, spend: (id: ConsumableId) => void) {
    this.spendPurchased = spend;
    for (const kind of ['bandage', 'medkit', 'drink'] as const) {
      this.purchased[kind] = this.supplies[kind] = Math.min(this.supplyLimit, armory.counts[kind] ?? 0);
    }
    const revives = Math.min(2, armory.counts.adrenaline ?? 0);
    this.purchased.adrenaline = revives;
    this.revivalCharges += revives;
    const kind = armory.tactical, count = kind ? Math.min(2, armory.counts[kind] ?? 0) : 0;
    if (kind && count > 0) {
      this.purchased[kind] = count;
      this.purchasedTactical = kind;
      const remaining = this.tactical.selected === kind ? this.tactical.remaining + count : count;
      this.tactical = { selected: kind, remaining, cooldown: 0, capacity: remaining };
    }
  }
  private spendIfPurchased(kind: ConsumableId, available: number) {
    const count = this.purchased[kind] ?? 0;
    if (count <= 0 || available > count) return;
    this.purchased[kind] = count - 1;
    this.spendPurchased?.(kind);
  }
  grenadeAim(angle: number, range: number) {
    return tacticalPoint(this.player, angle, clamp(range, 0, 230), this.blockers,
      (p, a, d, blocks) => rayDistance(p, a, d, [...blocks]));
  }
  throwTactical(angle = this.player.angle, range = 150): boolean {
    if (this.tutorial || this.evacuationDrive || this.generatorProgress !== undefined) return false;
    if (this.status !== 'playing' || this.player.dashTime > 0 || this.player.hit > 0 || this.player.stun > 0 || this.player.knockback) return false;
    const kind = this.tactical.selected;
    if (!kind) return false;
    const mine = isShopMine(kind);
    const point = this.grenadeAim(mine ? this.player.angle : angle, mine ? 34 : kind === 'grenade' ? range : 150);
    if (mine && (!walkable(point, 11, this.blockers, this.rooms) || this.plantedMines.some(item => dist(item, point) < 34))) return false;
    const available = this.tactical.remaining;
    if (!consumeTactical(this.tactical)) return false;
    if (kind === this.purchasedTactical) this.spendIfPurchased(kind, available);
    if (mine) {
      this.plantedMines.push({ ...point, kind, angle: this.player.angle, delay: 0.45 });
      this.events.push('mine-set'); return true;
    }
    if (kind === 'grenade' && this.stage.operation) {
      this.tacticalThrows.push(this.makeOperationGrenade(this.player, angle, range));
      this.events.push('throw');
    } else this.queueTacticalThrow(point, kind, this.player);
    return true;
  }
  private queueTacticalThrow(point: Point, kind: TacticalKind, origin: Point) {
    this.tacticalThrows.push({ ...point, kind, delay: TACTICAL_DEFINITIONS[kind].delay, origin: { x: origin.x, y: origin.y } });
    this.events.push('throw');
  }
  private makeOperationGrenade(start: Point, angle: number, range: number): TacticalThrow {
    const speed = clamp(range, 0, OPERATION_GRENADE_RANGE) / OPERATION_GRENADE_FUSE;
    const origin = { x: start.x, y: start.y };
    return { ...origin, origin, angle, kind: 'grenade', delay: OPERATION_GRENADE_FUSE,
      flight: { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, bounces: 0, sinceBounce: 0 } };
  }
  operationGrenadePreview(angle: number, range: number, origin: Point = this.player) {
    const item = this.makeOperationGrenade(origin, angle, range);
    const bounces: Point[] = [];
    this.advanceOperationGrenade(item, item.delay, bounces);
    return { bounces, impact: { x: item.x, y: item.y } };
  }
  private advanceOperationGrenade(item: TacticalThrow, dt: number, preview?: Point[]) {
    const flight = item.flight!, radius = 4;
    let remaining = Math.min(dt, item.delay);
    item.delay = item.delay - dt > 1e-8 ? item.delay - dt : 0;
    // Sweep each segment so collisions are ordered even through a thin swung door.
    for (let i = 0; i < 6 && remaining > 0.00001; i++) {
      const speed = Math.hypot(flight.vx, flight.vy);
      if (speed < 33) {
        flight.vx = flight.vy = 0;
        return;
      }
      const dx = flight.vx / speed, dy = flight.vy / speed;
      let distance = remaining * speed, block: Rect | undefined;
      for (const wall of this.blockers) {
        const c = Math.cos(wall.angle ?? 0), s = Math.sin(wall.angle ?? 0);
        const padded = { ...wall, x: wall.x - radius * (c - s), y: wall.y - radius * (s + c),
          w: wall.w + radius * 2, h: wall.h + radius * 2 };
        const hit = rayRect(item, dx, dy, padded, distance);
        if (hit < distance) { distance = hit; block = padded; }
      }
      let actorHit = false;
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        const x = enemy.x - item.x, y = enemy.y - item.y, along = x * dx + y * dy;
        const side = x * dy - y * dx, clearance = unitRadius(enemy) + radius;
        if (Math.abs(side) > clearance) continue;
        const depth = Math.sqrt(clearance ** 2 - side ** 2);
        if (along + depth < 0) continue;
        const hit = Math.max(0, along - depth);
        if (hit < distance) { distance = hit; actorHit = true; }
      }
      item.x += dx * distance; item.y += dy * distance;
      const traveled = distance / speed;
      remaining -= traveled;
      flight.sinceBounce += traveled;
      if (actorHit) { item.delay = 0; return; }
      if (!block) return;
      const c = Math.cos(block.angle ?? 0), s = Math.sin(block.angle ?? 0);
      const x = (item.x - block.x) * c + (item.y - block.y) * s;
      const y = (item.y - block.y) * c - (item.x - block.x) * s;
      const localNormal = ([
        { edge: Math.abs(x), x: -1, y: 0 }, { edge: Math.abs(x - block.w), x: 1, y: 0 },
        { edge: Math.abs(y), x: 0, y: -1 }, { edge: Math.abs(y - block.h), x: 0, y: 1 },
      ]).reduce((best, face) => face.edge < best.edge ? face : best);
      const nx = localNormal.x * c - localNormal.y * s, ny = localNormal.x * s + localNormal.y * c;
      const normalVelocity = flight.vx * nx + flight.vy * ny;
      if (normalVelocity < 0) {
        flight.vx -= 2 * normalVelocity * nx;
        flight.vy -= 2 * normalVelocity * ny;
      }
      flight.vx *= 0.60; flight.vy *= 0.60;
      flight.bounces++; flight.sinceBounce = 0;
      if (preview) preview.push({ x: item.x, y: item.y });
      item.x += nx * 0.12; item.y += ny * 0.12;
    }
  }
  private updateTactical(dt: number) {
    stepTactical(this.tactical, dt);
    this.survivalGrenadeCooldown = Math.max(0, this.survivalGrenadeCooldown - dt);
    this.survivalMines = this.survivalMines.filter(mine => {
      const kind = mine.kind ?? 'proximity-mine';
      if (mine.fuse === undefined) {
        if (!this.enemies.some(enemy => enemy.hp > 0 && dist(enemy, mine) <= 43 && lineClear(mine, enemy, this.blockers))) return true;
        mine.fuse = TACTICAL_DEFINITIONS[kind].delay;
        if (dist(mine, this.player) < 520) this.events.push(kind === 'shock-mine' ? 'survival-shock-trigger' : 'survival-mine-trigger');
      } else mine.fuse -= dt;
      if (mine.fuse > 1e-6) return true;
      this.tacticalThrows.push({ x: mine.x, y: mine.y, kind, delay: 0, origin: mine });
      return false;
    });
    const inCone = (mine: Point & { angle: number }, point: Point) =>
      Math.abs(angleDiff(Math.atan2(point.y - mine.y, point.x - mine.x), mine.angle)) <= Math.PI / 4;
    this.plantedMines = this.plantedMines.filter(mine => {
      mine.delay = Math.max(0, mine.delay - dt);
      const target = mine.delay === 0 && this.enemies.some(e => e.hp > 0 && dist(e, mine) <= 58 &&
        (mine.kind !== 'claymore' || inCone(mine, e)) && lineClear(mine, e, this.blockers));
      if (!target) return true;
      this.tacticalThrows.push({ ...mine, origin: mine });
      return false;
    });
    for (const effect of this.tacticalEffects) effect.life -= dt;
    this.tacticalEffects = this.tacticalEffects.filter(effect => effect.life > 0);
    for (const item of this.tacticalThrows) {
      if (item.flight) this.advanceOperationGrenade(item, dt);
      else item.delay -= dt;
      if (item.delay > 0) continue;
      const definition = TACTICAL_DEFINITIONS[item.kind];
      const targets = item.kind === 'claymore' ? this.enemies.filter(e => inCone({ ...item, angle: item.angle! }, e)) : this.enemies;
      if (item.kind === 'shock-mine') {
        for (const enemy of targets) {
          if (dist(item, enemy) <= definition.radius && lineClear(item, enemy, this.blockers)) this.paralyze(enemy, definition.stun);
        }
      }
      resolveTactical(item.kind, item, targets, [], this.blockers, (a, b, blocks) => lineClear(a, b, [...blocks]), (e, damage) => {
        const angle = dist(item, e) > 0.01 ? Math.atan2(e.y - item.y, e.x - item.x) : this.player.angle;
        this.damageEnemy(e as Enemy, damage, { angle, distance: EXPLOSIVE_PUSH[item.kind], heavy: EXPLOSIVE_PUSH[item.kind] >= 52 });
      }, () => {});
      // Test the closest leaf surface with that leaf excluded; other doors and walls still shield it.
      if (definition.doorDamage > 0) for (const door of this.doors) {
        const surface = closestOnRect(item, doorShape(door));
        if (!door.destroyed && dist(item, surface) <= definition.radius && (item.kind !== 'claymore' || inCone({ ...item, angle: item.angle! }, surface)) && lineClear(item, surface, this.blockers.filter(r => r.kind !== 'door:' + door.id))) this.damageDoor(door, definition.doorDamage);
      }
      const blast = item.kind === 'grenade' || item.kind === 'proximity-mine';
      const lifetime = blast ? GRENADE_BLAST_LIFE : 0.55;
      this.tacticalEffects.push({ x: item.x, y: item.y, kind: item.kind, life: lifetime, max: lifetime });
      if (!blast) this.emit(item, 20, definition.damage > 0 ? 'spark' : 'wood');
      this.emitSound(item, 'explosion', { ...SOUND_PROFILES.explosion, intensity: definition.loudness });
      this.events.push(blast ? 'grenade-blast' : 'explosion');
    }
    this.tacticalThrows = this.tacticalThrows.filter(item => item.delay > 0);
  }
  get rooms() { return this.stage.rooms; }
  get apartmentShutter(): Rect | undefined {
    return this.stage.apartment?.part === 'defense' && (this.apartment?.phase === 'hold' || this.apartment?.phase === 'lift') ? { x: 1368, y: 460, w: 24, h: 160, kind: 'street-roadblock' } : undefined;
  }
  get obstacles() {
    const shutter = this.apartmentShutter;
    const glass = this.apartment?.entryOpen ? undefined : this.stage.apartment?.glass;
    const car = this.stage.apartment?.getaway?.car;
    const furniture = car && this.apartment?.drive ? this.stage.furniture.filter(item => item !== car) : this.stage.furniture;
    return [...this.stage.walls, ...furniture, ...(shutter ? [shutter] : []), ...(glass ? [glass] : [])];
  }
  get clearedTotal() { return this.previousClears + this.cleared.filter(Boolean).length; }
  get pickup() {
    const key = this.stage.dorm?.pickup;
    return key && !this.keys.has(key.id) ? key : undefined;
  }
  get streetSupply() { return this.streetSupplyTaken ? undefined : this.stage.street?.supply; }
  operationRun?: { ready: boolean; hold: number; wave: number; cursor: number; airSupport: boolean; airCooldown: number;
    sector: number; phaseTime: number; holdReported: boolean; air?: OperationAirFlight; extraction?: OperationExtraction;
    grenadeDelay: number;
    phase: OperationPhase; bossId: number; kingEscaped: boolean; survivors: number; announced: boolean; slam: number };
  operationRadioBusy = false;
  private minimapAirSight?: Point & { radius: number };
  operationMutationFlash?: Point & { life: number };
  private operationGuideAnchor?: { goal: Point; point: Point };
  get operationGoal() {
    const run = this.operationRun, stage = this.stage.operation;
    if (!run || !stage) return undefined;
    if (stage.part === 'defense') return run.extraction ? this.operationRopePoint : this.stage.exit;
    if (this.exitReady) return this.stage.exit;
    if (stage.part === 'city') return stage.encounters[run.sector + 1]?.center;
    return undefined;
  }
  get operationRopePoint(): Point {
    return { x: this.stage.exit.x + OPERATION_ROPE_FOOT.x, y: this.stage.exit.y + OPERATION_ROPE_FOOT.y };
  }
  get operationGuide() {
    const p = this.player, goal = this.operationGoal, plan = this.stage.operation, run = this.operationRun;
    if (!goal || !plan || !run) return undefined;
    const target = plan.encounters[run.sector + 1];
    if (plan.part === 'defense' && (run.phase === 'boarding' || run.phase === 'hold' && run.hold > 0)) return undefined;
    const radius = plan.part === 'defense' ? run.hold === 0 ? OPERATION_BOARD_RADIUS : OPERATION_EXTRACT_RADIUS :
      plan.part === 'compound' ? OPERATION_WEST_DOOR_RADIUS :
      target?.radius ?? OPERATION_COMMAND_RADIUS;
    const current = plan.encounters[run.sector];
    if (dist(p, goal) <= radius || current && dist(p, current.center) <= current.radius &&
        (run.phaseTime < 2.5 || this.enemies.some(enemy => enemy.hp > 0 && enemy.operationSector === run.sector &&
          dist(p, enemy) <= OPERATION_APPROACH_RADIUS))) {
      this.operationGuideAnchor = undefined;
      return undefined;
    }
    const anchor = this.operationGuideAnchor;
    if (anchor && dist(anchor.goal, goal) < 0.01 && dist(p, anchor.point) > 52 && this.clearWalkingLine(p, anchor.point)) return anchor.point;
    const point = this.soundWaypoint(p, goal, 5);
    this.operationGuideAnchor = point ? { goal, point } : undefined;
    return point;
  }
  get objective() {
    if (this.survival) {
      return this.elapsed >= CONVOY_LEAVE ? '车队已离场 · 最后追击' :
        this.survivalConvoyReady ? '车队已到工事南门 · 靠近上车撤离' :
          this.elapsed >= CONVOY_NOTICE ? '车队正在赶往工事 · 查看港区地图' : '搜集补给与撤离部件 · 可选黑鹰、快艇或装甲车队';
    }
    const operation = this.stage.operation, run = this.operationRun;
    if (operation && run) {
      if (operation.part === 'defense') {
        const goal = run.phase === 'boarding' ? '小队登机 · 准备撤离' :
        run.extraction ? run.extraction.pickupTime >= OPERATION_PICKUP_READY ? '靠近绳索 · 交互登机' : '接应黑鹰正在靠近登陆坪' :
          run.phase === 'hold' ? `等待接应 · ${Math.ceil(run.hold)} 秒` : '任选街道，回到西南海岸原降落点';
      return run.announced && !run.extraction ? goal + ' · 撤离后实施空袭' : goal;
      }
      const left = this.enemies.filter(e => e.hp > 0).length;
      if (operation.part === 'compound') {
        if (run.phase === 'leader-fight') return `压制${OPERATION_BOSS_NAME} · 注意他会攻击队友` + (left ? ` · 剩余 ${left}` : '');
        if (run.phase === 'injection') return `${OPERATION_BOSS_NAME}正在注射`;
        if (run.phase === 'king-fight') return `击退${OPERATION_BOSS_NAME} · 提防砸地与突进` + (left ? ` · 剩余 ${left}` : '');
        if (run.kingEscaped) return '沿来路返回，穿过大厅左侧的西门';
        return '搜查连体建筑并肃清指挥室守卫' + (left ? ` · 剩余 ${left}` : '');
      }
      return operation.encounters[run.sector + 1]?.objective ?? '前往东北指挥部入口';
    }
    if (this.apartment) return {
      outside: this.apartment.tankArrived ? '进入公寓门厅，甩开尸群' : '沿步道前往公寓', 'entry-talk': '与川叔会合',
      training: '前往右侧电梯厅门口布置麻痹陷阱',
      stairs: '从安全楼梯下到负一层，开启电梯备用电源',
      generator: '去负一楼应急配电室开启电梯备用电源', return: '沿停车场撤回一层安全楼梯', shutter: '去一楼维修间操作配电箱，接通卷帘门与电击区',
      hold: `电梯启动中 · ${Math.ceil(this.apartment.timer)} 秒`, lift: '与维川会合，乘电梯直达九层', note: '前往 904 调查家人留下的便条',
      gear: '等维川回 902 取散弹枪', rally: '到九楼电梯厅和维川会合', 'escape-talk': '与维川确认开车撤离的计划', escape: '和维川一起乘电梯下到负一楼',
      'car-prep': '在撤离车附近布置陷阱，到车旁确认准备就绪', 'car-hold': `保护接电中的维川 · ${Math.ceil(this.apartment.timer)} 秒`,
      'car-ready': '车已发动，回到车边上车', driving: '正驶向车库出口',
    }[this.apartment.phase];
    if (this.stage.street) {
      if (this.alarmTime === null) return '沿街向东，前往第一个路口';
      return this.player.y < this.stage.street.upperTurn.y - 170 ? '甩开尸群，沿主街向北' : '向东转入住宅街，继续回家';
    }
    if (this.stage.dorm?.number === 2) {
      if (this.pickup) return '沿长廊向东，去值班室找楼梯钥匙';
      return '返回中央楼梯间，下到一楼';
    }
    if (this.stage.dorm?.number === 1) return this.pickup ? '去东侧宿管室找大门钥匙' : '穿过中央门厅的铁门，撤离宿舍楼';
    return '';
  }
  get visionScale() {
    if (this.survival) return 1.3;
    return this.stage.operation ? this.stage.operation.part === 'compound' ? 1 : OPERATION_OUTDOOR_VISION_SCALE : 1;
  }
  get playerVisionRange() { return this.stats.visionRange * this.visionScale; }
  get allyVisionRange() { return ALLY_VISION_RANGE * this.visionScale; }
  get exitReady() {
    if (this.stage.operation) {
      const { part, encounters } = this.stage.operation;
      return part === 'city' ? this.operationRun?.sector === encounters.length - 1 :
        part === 'compound' && !!this.operationRun?.kingEscaped;
    }
    if (this.apartment) return this.apartment.phase === 'car-ready';
    if (this.stage.street) return this.alarmTime !== null;
    if (this.stage.dorm) return this.doors.some(d => d.key === this.stage.dorm!.pickup.id && !d.locked);
    return this.cleared.every(Boolean);
  }
  get apartmentGoal() {
    const plan = this.stage.apartment, run = this.apartment;
    if (!plan || !run) return undefined;
    if (run.phase === 'outside') return run.tankArrived ? plan.outdoor?.entry : undefined;
    if (run.phase === 'entry-talk') return undefined;
    if (run.phase === 'gear') return plan.gear;
    if (run.phase.startsWith('car-')) return plan.getaway?.interact;
    if (run.engineer?.hp === 0) return run.engineer;
    if (run.phase === 'training') return plan.training?.center;
    const id = run.phase === 'return' ? 'stairs' : ['rally', 'escape-talk', 'escape', 'hold'].includes(run.phase) ? 'lift' : run.phase;
    return plan.stations.find(station => station.id === id)?.point;
  }
  get engineerArmed() {
    return !!this.apartment?.armed;
  }
  get evacuationDrive() { return this.apartment?.drive; }
  get evacuationViewRadius() {
    if (this.operationRun?.phase === 'boarding') return 610;
    return this.evacuationDrive ? 470 : 0;
  }
  constructor(public heroId: HeroId = GHOST_ID, public level = 1, public stage: LevelDefinition = FACILITY_LEVEL, growth: Partial<Growth> = {}, armory?: Armory) {
    const kit = armory?.kits[heroId];
    const gun = (id: HeroId) => configuredHero(id, armory?.kits[id].weaponLevel, installedMods(id, armory?.kits[id], armory?.mods));
    this.baseGun = this.hero = gun(heroId);
    this.supportGuns = { [GHOST_ID]: gun(GHOST_ID), [ENGINEER_ID]: gun(ENGINEER_ID) };
    this.workshopEnabled = !!armory;
    this.protection = kit?.gear.reduce((total, piece) => total + GEAR[piece].protection, 0) ?? 0;
    this.supplyLimit = kit?.gear.includes('pack') ? 8 : 5;
    this.reserveAmmo = this.hero.magazine * this.hero.reserveMagazines;
    this.stats = heroStats(heroId, level, growth, this.hero);
    const hp = this.stats.hp;
    this.player = { x: 320, y: 360, hp, maxHp: hp, angle: 0.2, ammo: this.hero.magazine, reload: 0, fire: 0, dash: 0, dashTime: 0, dashX: 0, dashY: 0, invulnerable: 0, hit: 0, stun: 0 };
    this.setupFloor(stage);
    if (stage.operation) this.supplies.medkit = 1;
    if (stage.survival) {
      this.survival = { pool: { coins: 0, materials: 0 }, salvage: 0, parts: 0, timed: newTimedSurvival() };
      this.reserveAmmo = Math.max(this.reserveAmmo, this.hero.magazine * 6);
      this.supplies.bandage = 2;
      this.survivalBag = new SurvivalBag(survivalBagRows(heroId), survivalBagCols(heroId), true);
      this.survivalBag.give({ kind: 'bandage', count: 2 });
      this.prepareSurvivalCrates();
      for (let zone = 0; zone < SURVIVAL_FIELD_AREAS.length; zone++) this.placeSurvivalField(zone, zone, 1);
      for (const zone of [2, 3, 5]) {
        const candidates = SURVIVAL_FIELD_AREAS[zone].map(([x, y]) => harborPoint(x, y));
        const point = candidates.find(p => walkable(p, 18, this.blockers, this.rooms) &&
          !this.survivalField.some(drop => dist(drop, p) < 58));
        if (point) this.survivalField.push({ ...point, zone, id: 'fuel-' + zone, kind: 'evac-fuel', count: 1 });
      }
      this.revivalCharges = 0;
    }
  }
  get survivalAtRadio() {
    const radio = this.stage.survival?.radio;
    return !!radio && dist(this.player, radio) < 88 && lineClear(this.player, radio, this.blockers);
  }
  get survivalAtWorkbench() {
    const workbench = this.stage.survival?.workbench;
    return !!workbench && dist(this.player, workbench) < 75 && lineClear(this.player, workbench, this.blockers);
  }
  get survivalUpperFloor() {
    return this.harborUpperFloorAt(this.player);
  }
  private harborUpperFloorAt(point: Point) {
    const plan = this.stage.survival;
    if (!plan || point.x < this.rooms[plan.streetRoom].w) return undefined;
    return plan.stairs.find(stair => roomAt(point, [this.rooms[stair.upperRoom]]) >= 0);
  }
  get survivalFloorView() {
    const upstairs = this.survivalUpperFloor;
    const stair = this.survivalStairTransit ?? upstairs;
    if (!stair) return undefined;
    const { bounds } = stair;
    const blend = this.survivalStairTransit ? clamp((this.player.y - bounds.y) / bounds.h, 0, 1) : 1;
    return { stair, blend, upstairs: !!upstairs, moving: !!this.survivalStairTransit };
  }
  private advanceSurvivalStair(previous: Point) {
    const plan = this.stage.survival;
    if (!plan?.stairs.length) return;
    const p = this.player;
    const upstairs = this.survivalUpperFloor;
    const x = p.x - (upstairs?.offsetX ?? 0);
    const inLane = (bounds: Rect) => x > bounds.x + 15 && x < bounds.x + bounds.w - 15;
    const stair = this.survivalStairTransit ?? (upstairs ? [upstairs] : plan.stairs).find(link => {
      const { bounds } = link;
      const end = bounds.y + (upstairs ? bounds.h : 0);
      return inLane(bounds) && (upstairs ? previous.y >= end && p.y < end : previous.y <= end && p.y > end);
    });
    if (!stair) return;
    const { bounds, offsetX } = stair;
    const north = bounds.y + bounds.h;
    if (!inLane(bounds) || !upstairs && p.y <= bounds.y) {
      this.survivalStairTransit = undefined;
      return;
    }
    if (upstairs ? p.y >= north : p.y < north) {
      this.survivalStairTransit = upstairs ? undefined : stair;
      return;
    }
    const next = { x: p.x + (upstairs ? -offsetX : offsetX), y: p.y };
    const witnessed = { x: p.x, y: p.y };
    if (!this.transferSurvivalUnit(p, next)) {
      const from = this.unitKey(p.x, p.y);
      Object.assign(p, previous);
      this.moveUnitIndex(p, from);
      return;
    }
    p.dashTime = 0;
    this.rollLanding = undefined;
    this.survivalStairTransit = upstairs ? stair : undefined;
    this.reportSurvivalCrossing(stair, witnessed, !upstairs);
    this.flowTime = 0;
  }
  private transferSurvivalUnit(unit: Player | Enemy, next: Point) {
    const radius = unitRadius(unit);
    if (!walkable(next, radius, this.blockers, this.rooms) || !this.unitSpaceFree(next, radius, unit)) return false;
    const from = this.unitKey(unit.x, unit.y);
    Object.assign(unit, next, { knockback: undefined });
    this.moveUnitIndex(unit, from);
    return true;
  }
  private get survivalSearchProfile() {
    return survivalSearchTuning(this.elapsed);
  }
  private survivalStairLanding(stair: SurvivalStair, upper: boolean, clearance = 0) {
    const r = stair.bounds;
    return { x: r.x + r.w * .64 + (upper ? stair.offsetX : 0),
      y: upper ? r.y + r.h + clearance : r.y - clearance };
  }
  private seesSurvivalEvidence(e: Enemy, p: Point) {
    const tuning = this.survivalSearchProfile;
    return dist(e, p) <= 360 * this.visionScale * tuning.sight &&
      Math.abs(angleDiff(Math.atan2(p.y - e.y, p.x - e.x), e.angle)) <= Math.PI * tuning.cone &&
      lineClear(e, p, this.visionBlockers);
  }
  private assignSurvivalSearch(e: Enemy, stair: SurvivalStair, upper: boolean, evidence: number, points = stair.searchPoints[upper ? 1 : 0]) {
    const story = this.harborUpperFloorAt(e);
    if (story && story !== stair) return false;
    const tuning = this.survivalSearchProfile, current = this.survivalSearchOrders.get(e);
    if (current && current.expires > this.elapsed && current.evidence > evidence) return false;
    if (current && !current.returning && current.stair === stair && current.upper === upper && current.evidence === evidence) {
      current.expires = this.elapsed + tuning.search;
      return true;
    }
    const assigned = this.enemies.filter(other => other.hp > 0 && this.survivalSearchOrders.get(other)?.stair === stair);
    if (!assigned.includes(e) && assigned.length >= Math.max(2, tuning.scouts)) return false;
    if (e.survivalPursuit && !current) {
      const raid = this.enemies.filter(other => other.hp > 0 && other.survivalPursuit);
      const retasked = raid.filter(other => this.survivalSearchOrders.has(other)).length;
      if (retasked >= Math.max(1, Math.floor((raid.length - 1) / 2))) return false;
    }
    this.survivalSearchOrders.set(e, { stair, upper, evidence, expires: this.elapsed + tuning.search,
      points: points.slice(0, tuning.rooms), next: 0 });
    e.investigate = undefined;
    return true;
  }
  private reportSurvivalCrossing(stair: SurvivalStair, source: Point, upper: boolean) {
    const witnesses = this.enemies.filter(e => e.hp > 0 && e.type === 'walker' && this.seesSurvivalEvidence(e, source))
      .sort((a, b) => dist(a, source) - dist(b, source));
    for (const e of witnesses) this.assignSurvivalSearch(e, stair, upper, 2);
  }
  private perceiveSurvivalStairs() {
    const plan = this.stage.survival!, tuning = this.survivalSearchProfile;
    const sounds = this.sounds.filter(sound => this.playerSounds.has(sound));
    const walkers = this.enemies.filter(enemy => enemy.hp > 0 && enemy.type === 'walker');
    const raiders = this.enemies.filter(enemy => enemy.hp > 0 && enemy.survivalPursuit);
    for (const stair of plan.stairs) {
      for (const sound of sounds) {
        const evidenceRoom = roomAt(sound.position, [this.rooms[stair.lowerRoom], this.rooms[stair.upperRoom]]);
        if (evidenceRoom < 0) continue;
        const loud = sound.type === 'rifle' || sound.type === 'shotgun' || sound.type === 'explosion';
        if (!loud && sound.type !== 'suppressed' && tuning.hearing === 1) continue;
        const upper = evidenceRoom === 1, source = this.survivalStairLanding(stair, upper, 25);
        const exit = this.survivalStairLanding(stair, !upper, 25);
        const radius = sound.radius * tuning.hearing;
        const remaining = radius - dist(sound.position, source) - stair.bounds.h * (loud ? .65 : .3);
        if (remaining <= 0) continue;
        const occlusion = lineClear(sound.position, source, this.visionBlockers) ? 1 : .45;
        const volume = sound.intensity * (remaining / radius) * (loud ? .62 : .45) * occlusion;
        const points = [...stair.searchPoints[evidenceRoom]].sort((a, b) => dist(a, sound.position) - dist(b, sound.position));
        const candidates = walkers.filter(enemy => (roomAt(enemy, [this.rooms[stair.upperRoom]]) >= 0) !== upper &&
          dist(enemy, exit) <= Math.min(remaining, loud ? 410 : 140) &&
          volume * (1 - dist(enemy, exit) / remaining) * (lineClear(enemy, exit, this.visionBlockers) ? 1 : .33) >= tuning.threshold);
        candidates.sort((a, b) => dist(a, exit) - dist(b, exit));
        for (const enemy of candidates) this.assignSurvivalSearch(enemy, stair, upper, 1, points);
      }
      if (this.elapsed < 540 || tuning.scouts === 0 ||
          (this.survivalSweepTimes.get(stair) ?? 0) > this.elapsed) continue;
      const building = plan.buildings.find(site => site.stair === stair);
      const door = building?.entries[0];
      if (!door) continue;
      const entrance = { x: door.x + door.length / 2, y: door.y };
      const available = walkers.filter(e => !this.survivalSearchOrders.has(e) && dist(e, entrance) < tuning.sweepRange &&
        (e.combatMemory ?? 0) <= 0);
      available.sort((a, b) => dist(a, entrance) - dist(b, entrance));
      let raidSlots = Math.max(0, Math.floor((raiders.length - 1) / 3) - raiders.filter(e => this.survivalSearchOrders.has(e)).length);
      let sent = 0;
      for (const e of available) {
        if (sent >= tuning.scouts) break;
        if (e.survivalPursuit && raidSlots <= 0) continue;
        if (!this.assignSurvivalSearch(e, stair, true, 0)) continue;
        if (e.survivalPursuit) raidSlots--;
        sent++;
      }
      this.survivalSweepTimes.set(stair, this.elapsed + (sent > 0 ? tuning.interval : 2));
    }
  }
  private steerSurvivalSearch(e: Enemy, target: Point, speed: number, dt: number, direct = false) {
    const waypoint = direct ? target : this.soundWaypoint(e, target);
    if (!waypoint) return;
    const aim = Math.atan2(waypoint.y - e.y, waypoint.x - e.x);
    e.angle += clamp(angleDiff(aim, e.angle), -dt * 12, dt * 12);
    if (direct || !this.investigateDoor(e, waypoint, aim)) this.advanceUnit(e, waypoint, speed, dt);
  }
  private stepSurvivalStairPassage(e: Enemy, stair: SurvivalStair, pass: SurvivalStairPassage, dt: number) {
    const r = stair.bounds, north = r.y + r.h;
    if (pass.phase === 'exit') {
      const base = this.survivalStairLanding(stair, !pass.down, 44);
      const clear = { x: base.x + 50, y: base.y };
      const beyond = pass.down ? e.y <= base.y + 5 : e.y >= base.y - 5;
      this.steerSurvivalSearch(e, beyond ? clear : base, 103, dt, true);
      if (dist(e, clear) <= 14 || this.elapsed - pass.starts > 3 && beyond) this.survivalStairPassages.delete(stair);
      return true;
    }
    // A player meeting the climber on the flight uses normal combat and collision.
    if (e.windup > 0 || dist(e, this.player) < 67 && lineClear(e, this.player, this.blockers)) return false;
    const upper = e.x >= this.rooms[stair.upperRoom].x;
    const target = { x: r.x + r.w * (pass.left ? .35 : .64) + (upper ? stair.offsetX : 0),
      y: pass.down ? upper ? north - 2 : r.y - 4 : north + 3 };
    this.steerSurvivalSearch(e, target, 95, dt, true);
    if (upper ? e.y < north - .2 : !pass.down && e.y >= north) {
      const next = { x: e.x + (upper ? -stair.offsetX : stair.offsetX), y: e.y };
      if (this.transferSurvivalUnit(e, next)) {
        e.room = upper ? stair.lowerRoom : stair.upperRoom;
        if (!pass.down) { pass.phase = 'exit'; pass.starts = this.elapsed; }
      } else {
        // If the landing is occupied, walk across the end of the flight to the other lane.
        const opposite = { x: r.x + r.w * (pass.left ? .64 : .35) + (upper ? 0 : stair.offsetX), y: e.y };
        if (walkable(opposite, unitRadius(e), this.blockers, this.rooms) && this.unitSpaceFree(opposite, unitRadius(e), e)) {
          pass.left = !pass.left;
        }
      }
    } else if (pass.down && !upper && e.y < r.y) {
      e.room = stair.lowerRoom; pass.phase = 'exit'; pass.starts = this.elapsed;
    }
    return true;
  }
  private stepSurvivalSearch(e: Enemy, dt: number) {
    const order = this.survivalSearchOrders.get(e);
    if (!order) return false;
    const { stair, upper, points } = order;
    const passage = this.survivalStairPassages.get(stair);
    if (passage?.enemy === e) return this.stepSurvivalStairPassage(e, stair, passage, dt);
    const onUpper = roomAt(e, [this.rooms[stair.upperRoom]]) >= 0;
    if (e.windup > 0 || this.seesSurvivalEvidence(e, this.player)) {
      if (!order.returning) order.expires = Math.max(order.expires, this.elapsed + this.survivalSearchProfile.memory);
      return false;
    }
    e.cooldown = Math.max(0, e.cooldown - dt);
    const end = order.expires <= this.elapsed || order.next >= points.length && onUpper === upper;
    if (end) {
      if (onUpper && order.returning) { order.expires = this.elapsed + 17; return true; }
      if (onUpper && !order.returning) {
        this.survivalSearchOrders.set(e, { ...order, upper: false, returning: true, expires: this.elapsed + 17,
          points: [], next: 0 });
        return true;
      }
      this.survivalSearchOrders.delete(e);
      e.lastSeen = undefined; e.combatMemory = 0;
      return false;
    }
    if (onUpper !== upper) {
      const landing = this.survivalStairLanding(stair, onUpper, 28);
      const inFlight = Math.abs(e.x - landing.x) < 49 && e.y > stair.bounds.y &&
        e.y < stair.bounds.y + stair.bounds.h + 18;
      if (passage && passage.enemy.hp > 0 && this.enemies.includes(passage.enemy)) {
        // Followers stay to the side of either platform, leaving a route out.
        const wait = { x: landing.x + 84, y: landing.y + (onUpper ? 24 : 14) + (e.id % 2 ? 34 : 0) };
        if (dist(e, wait) > 18) this.steerSurvivalSearch(e, wait, 94, dt);
        return true;
      }
      if (dist(e, landing) <= 18 || inFlight) {
        this.survivalStairPassages.set(stair, { enemy: e, down: onUpper, phase: 'flight', starts: this.elapsed });
        const p = this.player;
        const playerUp = this.survivalUpperFloor === stair;
        const hearAt = this.survivalStairLanding(stair, playerUp, 0);
        if (dist(p, hearAt) < 340 && this.elapsed - this.survivalStairWarning > 5) {
          this.survivalStairWarning = this.elapsed;
          this.events.push('survival-stair-threat');
        }
      } else this.steerSurvivalSearch(e, landing, 104, dt);
      return true;
    }
    const point = points[order.next];
    if (dist(e, point) > 27) this.steerSurvivalSearch(e, point, 101, dt);
    else {
      order.investigateUntil ??= this.elapsed + .7;
      e.angle += dt * 2.25;
      if (this.elapsed >= order.investigateUntil) {
        order.next++;
        order.investigateUntil = undefined;
      }
    }
    return true;
  }
  survivalReturnPoint() {
    const run = this.survival, plan = this.stage.survival;
    if (!run || !plan || this.elapsed < CONVOY_NOTICE || this.elapsed >= CONVOY_LEAVE || this.survivalAtConvoy) return;
    const upstairs = this.survivalUpperFloor;
    const bounds = upstairs?.bounds;
    if (upstairs && bounds) return { x: bounds.x + upstairs.offsetX + bounds.w / 2, y: bounds.y + bounds.h - 12 };
    if (this.survivalStairTransit) {
      const flight = this.survivalStairTransit.bounds;
      return { x: flight.x + flight.w / 2, y: flight.y - 24 };
    }
    return this.soundWaypoint(this.player, CONVOY_BOARD, 4, 16);
  }
  get survivalOccupied() { return this.survivalBag?.used ?? 0; }
  survivalCount(kind: GearKind) { return this.survivalBag?.count(kind) ?? 0; }
  private updateBagCounts() {
    if (!this.survivalBag || !this.survival) return;
    for (const kind of SURVIVAL_ITEMS) {
      const count = this.survivalCount(kind);
      if (kind === 'mod-cache') this.survival.parts = count;
      else this.supplies[kind] = count;
    }
  }
  private prepareSurvivalCrates() {
    const plan = this.stage.survival!;
    const pick = survivalRandom(plan.seed ^ 0x6b52cc41);
    const guns = survivalWeapons(this.heroId);
    const points = (names: string[]) => plan.buildings.filter(site => names.includes(site.footprint.kind ?? ''))
      .flatMap(site => site.loot.filter(point => walkable(point, 22, this.blockers, this.rooms)));
    const groups: { kind: SurvivalCrate['kind']; sites: string[]; goods: GearStack[] }[] = [
      { kind: 'medical', sites: ['社区诊所', '红瓦独栋'], goods: [{ kind: 'medkit', count: 1 }, { kind: 'medical-stock', count: 2 }, { kind: 'scanner', count: 1 }] },
      { kind: 'medical', sites: ['诊所西侧住宅', '南街双坡顶住宅', '北巷灰顶住宅'], goods: [{ kind: 'drink', count: 1 }, { kind: 'medical-stock', count: 2 }, { kind: 'bandage', count: 1 }, { kind: 'door-wood', count: 3 }] },
      { kind: 'armory', sites: ['港区装卸仓库', '一号码头仓', '二号码头仓', '圆顶储运库'], goods: [{ kind: guns[pick(guns.length)], count: 1 }, { kind: 'special-ammo', count: 2 }, { kind: 'grenade', count: 1 }, { kind: 'tactical-module', count: 1 }] },
      { kind: 'armory', sites: ['街角市场', '路口商行', '红棚商铺'], goods: [{ kind: pick(3) === 0 ? guns[pick(guns.length)] : 'shock-mine', count: 1 }, { kind: 'special-ammo', count: 1 }, { kind: 'tactical-stock', count: 2 }] },
      { kind: 'engineering', sites: ['西厂检修库', '红砖维修厂', '西厂动力车间'], goods: [{ kind: SURVIVAL_PARTS[0], count: 1 }, { kind: 'mod-cache', count: 2 }, { kind: 'tactical-stock', count: 1 }, { kind: 'door-metal', count: 3 }, { kind: 'door-brace', count: 1 }] },
      { kind: 'engineering', sites: ['南街红顶住宅', '市场侧库', '路口商行'], goods: [{ kind: SURVIVAL_PARTS[1], count: 1 }, { kind: 'mine', count: 1 }, { kind: 'door-wood', count: 2 }] },
      { kind: 'engineering', sites: ['港区东备货库', '货场备件车间', '港区装卸仓库'], goods: [{ kind: SURVIVAL_PARTS[2], count: 1 }, { kind: 'mod-cache', count: 2 }, { kind: 'door-metal', count: 4 }, { kind: 'door-brace', count: 1 }] },
      { kind: 'engineering', sites: ['西侧杂货铺', '公路西侧住宅', '西街角住宅'], goods: [{ kind: SURVIVAL_PARTS[pick(3)], count: 1 }, { kind: 'scanner', count: 1 }] },
    ];
    groups.forEach(({ kind, sites, goods }, index) => {
      const spots = points(sites).filter(p => !this.survivalCrates.some(c => dist(c, p) < 72));
      const p = spots[pick(spots.length)];
      if (!p) return;
      this.survivalCrates.push({ x: p.x, y: p.y, id: 'supply-' + index, kind, opened: false, goods });
      const covered = this.loot.find(item => dist(item, p) < 1);
      if (covered) this.loot = this.loot.filter(item => item !== covered);
    });
  }
  nearbySurvivalCrate(id?: string) {
    const p = this.player;
    let best: SurvivalCrate | undefined, distance = 82;
    for (const crate of this.survivalCrates) {
      if (!crate.goods.length || id !== undefined && crate.id !== id) continue;
      const range = dist(p, crate);
      if (range < distance && lineClear(p, crate, this.blockers)) { best = crate; distance = range; }
    }
    return best;
  }
  openSurvivalCrate() {
    const crate = this.nearbySurvivalCrate();
    if (!crate || !this.canInteract()) return;
    crate.opened = true;
    return crate;
  }
  takeSurvivalCrate(id: string, index: number) {
    const crate = this.nearbySurvivalCrate(id), stack = crate?.goods[index];
    if (!this.canInteract() || !crate?.opened || !stack || !this.survivalBag) return false;
    const count = this.survivalBag.give(stack);
    if (!count) return false;
    if ((stack.count -= count) === 0) crate.goods.splice(index, 1);
    this.updateBagCounts();
    this.events.push('loot');
    return true;
  }
  dropSurvivalItem(id: number) {
    const bag = this.survivalBag, item = bag?.item(id);
    if (!bag || !item || !this.canInteract() || this.survivalPlacement?.id === id || this.survivalSupplyId === id) return false;
    const { kind, count, rounds } = item;
    const { x, y } = this.player;
    let i = this.survivalCrates.length;
    while (this.survivalCrates.some(crate => crate.id === 'drop-' + i)) i++;
    this.survivalCrates.push({ x, y, id: 'drop-' + i, kind: 'dropped', opened: true, goods: [{ kind, count, rounds }] });
    bag.take(id, count);
    this.updateBagCounts();
    return true;
  }
  craftSurvival(kind: SurvivalRecipe, preview = false) {
    if (!this.survivalAtWorkbench || !this.canInteract() || this.survivalPlacement || this.survivalDoorWork || this.usingSupply || !this.survivalBag) return 'location';
    const result = this.survivalBag.craft(kind, preview);
    if (result === 'ok' && !preview) this.updateBagCounts();
    return result;
  }
  private survivalDevicePoint(radius: number) {
    const p = this.player, range = radius === 22 ? 46 : 37;
    const point = { x: p.x + Math.cos(p.angle) * range, y: p.y + Math.sin(p.angle) * range };
    if (!this.survival || this.survivalStairTransit || !walkable(point, radius, this.blockers, this.rooms) ||
        !lineClear(p, point, this.blockers) || !this.unitSpaceFree(point, radius, p) ||
        this.survivalSentries.some(unit => unit.hp > 0 && dist(unit, point) < radius + 25) ||
        this.survivalMines.some(mine => dist(mine, point) < 32) ||
        this.stage.survival!.stairs.some(stair => circleRect(point, radius + 14, stair.bounds) ||
          circleRect(point, radius + 14, { ...stair.bounds, x: stair.bounds.x + stair.offsetX })) ||
        radius === 22 && this.doors.some(door => !door.destroyed && dist(door, point) < door.length + radius)) return;
    return point;
  }
  get survivalSentryPreview() { return this.survivalDevicePoint(22); }
  switchSurvivalWeapon() {
    const special = this.survivalSpecial;
    if (!special || !this.canSwitchSurvivalWeapon()) return false;
    if (this.survivalSpecialActive) {
      special.ammo = this.player.ammo; special.reserve = this.reserveAmmo;
      this.applySurvivalWeapon(false);
    } else {
      this.survivalBaseAmmo = this.player.ammo; this.survivalBaseReserve = this.reserveAmmo;
      this.applySurvivalWeapon(true);
    }
    return true;
  }
  canSwitchSurvivalWeapon() {
    return !!this.survivalSpecial && this.canInteract() && !this.survivalPlacement && !this.survivalDoorWork;
  }
  survivalWeaponReadout(special: boolean) {
    const active = this.survivalSpecialActive === special, slot = this.survivalSpecial;
    return { name: special && slot ? SURVIVAL_GUNS[slot.id].gun : this.baseGun.gun,
      ammo: active ? this.player.ammo : special ? slot?.ammo ?? 0 : this.survivalBaseAmmo,
      reserve: active ? this.reserveAmmo : special ? slot?.reserve ?? 0 : this.survivalBaseReserve };
  }
  private applySurvivalWeapon(selected: boolean) {
    const special = this.survivalSpecial;
    this.survivalSpecialActive = selected && !!special;
    if (this.survivalSpecialActive && special) {
      const gun = SURVIVAL_GUNS[special.id];
      const shotSound = this.heroId === HEROINE_ID ? SOUND_PROFILES.rifle : SOUND_PROFILES[this.baseGun.weapon];
      this.hero = { ...this.baseGun, ...gun, nearPush: 0, spreadFloor: gun.spread * .55, movingSpread: 0,
        laser: 0, quiet: false, shotSound };
      this.player.ammo = special.ammo; this.reserveAmmo = special.reserve;
    } else {
      this.hero = this.baseGun;
      this.player.ammo = this.survivalBaseAmmo; this.reserveAmmo = this.survivalBaseReserve;
    }
    this.player.reload = 0;
    this.player.fire = Math.max(this.player.fire, .22);
  }
  useSurvivalItem(id: number) {
    const bag = this.survivalBag, item = bag?.item(id);
    if (!bag || !item || !this.canInteract() || this.survivalPlacement || this.survivalDoorWork) return false;
    const { kind } = item;
    if (isSurvivalSupply(kind)) {
      if (!this.useSupply(kind)) return false;
      this.survivalSupplyId = id;
      return true;
    }
    if (kind === 'special-ammo') {
      const gun = this.survivalSpecial;
      if (!gun) return false;
      const rounds = SURVIVAL_GUNS[gun.id].magazine;
      if (this.survivalSpecialActive) this.reserveAmmo = Math.min(10000, this.reserveAmmo + rounds);
      else gun.reserve = Math.min(10000, gun.reserve + rounds);
    } else if (kind === 'scanner') {
      this.survivalScan = 8;
    } else if (kind === 'grenade') {
      if (this.survivalGrenadeCooldown > 0) return false;
      this.tacticalThrows.push(this.makeOperationGrenade(this.player, this.player.angle, 205));
      this.survivalGrenadeCooldown = TACTICAL_DEFINITIONS.grenade.cooldown;
      this.events.push('throw');
    } else if (kind === 'mine' || kind === 'shock-mine') {
      const point = this.survivalDevicePoint(11);
      if (!point) return false;
      this.survivalMines.push(kind === 'mine' ? point : { ...point, kind: 'shock-mine' });
      this.events.push('mine-set');
    } else if (kind === 'sentry') {
      const point = this.survivalSentryPreview;
      if (!point) return false;
      const duration = this.heroId === ENGINEER_ID ? 3 : 10;
      this.survivalPlacement = { ...point, id, duration, left: duration, angle: this.player.angle };
      return true;
    } else if (isSurvivalGun(kind)) {
      if (SURVIVAL_GUNS[kind].hero !== this.heroId) return false;
      const old = this.survivalSpecial;
      const wasActive = this.survivalSpecialActive;
      if (wasActive) this.switchSurvivalWeapon();
      const stack = { kind: old?.id, count: 1, rounds: old?.ammo };
      const index = bag.items.indexOf(item), quick = bag.quick.slice();
      bag.take(id);
      if (stack.kind && !bag.give({ ...stack, kind: stack.kind })) {
        bag.items.splice(index, 0, { ...item, count: 1 }); bag.quick = quick;
        if (wasActive) this.switchSurvivalWeapon();
        return false;
      }
      this.survivalSpecial = { id: kind, ammo: item.rounds ?? SURVIVAL_GUNS[kind].magazine, reserve: old?.reserve ?? 0 };
      this.switchSurvivalWeapon();
      return true;
    } else return false;
    bag.take(id);
    return true;
  }
  cancelSurvivalPlacement() { this.survivalPlacement = undefined; }
  private tickSurvivalPlacement(dt: number, controls: Controls) {
    const placement = this.survivalPlacement;
    if (!placement) return;
    if (Math.hypot(controls.x, controls.y) > .12 || this.player.dashTime > 0 || !this.canInteract()) {
      this.cancelSurvivalPlacement();
      return;
    }
    placement.left -= dt;
    if (placement.left > 0) return;
    if (walkable(placement, 22, this.blockers, this.rooms) && this.unitSpaceFree(placement, 22, this.player) &&
        this.survivalBag?.take(placement.id)) {
      this.survivalSentries.push({ x: placement.x, y: placement.y, angle: placement.angle,
        hp: SENTRY_HP, burst: 0, next: 0, muzzle: 0 });
      this.events.push('survival-sentry-placed');
    } else this.events.push('survival-sentry-blocked');
    this.cancelSurvivalPlacement();
  }
  private tickSurvivalSentries(dt: number) {
    for (const sentry of this.survivalSentries) {
      sentry.muzzle = Math.max(0, sentry.muzzle - dt);
      if (sentry.hp <= 0) continue;
      sentry.next -= dt;
      if (sentry.next > 0) continue;
      let target: Enemy | undefined, range = SENTRY_RANGE;
      for (const e of this.enemies) {
        const d = dist(e, sentry);
        if (e.hp > 0 && d < range && lineClear(sentry, e, this.blockers)) { range = d; target = e; }
      }
      if (!target) { sentry.next = .23; sentry.burst = 0; continue; }
      const angle = Math.atan2(target.y - sentry.y, target.x - sentry.x);
      sentry.angle = angle;
      sentry.muzzle = .075;
      sentry.next = ++sentry.burst % 5 === 0 ? .7 : .115;
      this.spawnBullet({ x: sentry.x, y: sentry.y, vx: Math.cos(angle) * FIREARM_BULLET_SPEED, vy: Math.sin(angle) * FIREARM_BULLET_SPEED,
        life: SENTRY_RANGE / FIREARM_BULLET_SPEED, damage: 11, hostile: false, firearm: true, push: 5 });
      if (sentry.burst % 5 === 1) {
        this.emitSound(sentry, 'rifle', SOUND_PROFILES.rifle);
        if (dist(sentry, this.player) < 580) this.events.push('survival-sentry-fire');
      }
    }
  }
  private attackSurvivalSentry(e: Enemy, dt: number) {
    if (!this.survivalSentries.length) return false;
    const playerDistance = dist(e, this.player);
    let range = playerDistance < 250 && lineClear(e, this.player, this.blockers) ? playerDistance : 250;
    let sentry = this.sentryWindups.get(e);
    if (sentry && (sentry.hp <= 0 || e.windup <= 0)) { this.sentryWindups.delete(e); sentry = undefined; }
    if (!sentry && e.windup > 0) return false;
    if (!sentry) for (const unit of this.survivalSentries) {
      const d = dist(unit, e);
      if (unit.hp > 0 && d < range && lineClear(e, unit, this.blockers)) { sentry = unit; range = d; }
    }
    if (!sentry) return false;
    e.cooldown = Math.max(0, e.cooldown - dt);
    e.angle = Math.atan2(sentry.y - e.y, sentry.x - e.x);
    const distance = dist(e, sentry), ranged = e.type === 'spitter', reach = ranged ? 210 : 48;
    if (this.sentryWindups.has(e)) {
      e.windup -= dt;
      if (e.windup > 0) return true;
      this.sentryWindups.delete(e);
      if (distance <= reach + 14 && lineClear(e, sentry, this.blockers)) {
        sentry.hp = Math.max(0, sentry.hp - (ranged ? 13 : 17));
        this.emit(sentry, 5, 'spark');
        if (sentry.hp === 0) this.events.push('survival-sentry-lost');
      }
    } else if (distance > reach) this.advanceUnit(e, sentry, 103, dt);
    else if (e.cooldown <= 0) {
      e.windup = ranged ? .47 : .28; e.cooldown = .87;
      this.sentryWindups.set(e, sentry);
    }
    return true;
  }
  survivalCheckpoint(): SurvivalCheckpoint | undefined {
    const run = this.survival, plan = this.stage.survival;
    if (!run || !plan || this.status !== 'playing') return;
    const bag = this.survivalBag!;
    const gear: SurvivalGearSave = {
      bagLayout: 2, items: bag.items, quick: bag.quick, crates: this.survivalCrates,
      sentries: this.survivalSentries.filter(sentry => sentry.hp > 0), mines: this.survivalMines,
      special: this.survivalSpecialActive && this.survivalSpecial
        ? { ...this.survivalSpecial, ammo: this.player.ammo, reserve: this.reserveAmmo } : this.survivalSpecial,
      selected: this.survivalSpecialActive, baseAmmo: this.survivalSpecialActive ? this.survivalBaseAmmo : this.player.ammo,
      baseReserve: this.survivalSpecialActive ? this.survivalBaseReserve : this.reserveAmmo,
      scan: this.survivalScan,
      field: this.survivalField, restock: this.survivalRestock,
    };
    const { x, y, hp, angle, ammo } = this.player;
    const timed = { released: run.timed.released, convoyNotice: run.timed.convoyNotice,
      rewardedMinutes: run.timed.rewardedMinutes, lastDrop: run.timed.lastDrop, helicopter: { ...run.timed.helicopter }, boat: { ...run.timed.boat } };
    return { version: 2, layout: plan.layout, seed: plan.seed, hero: this.heroId, pool: { ...run.pool },
      elapsed: this.elapsed, kills: this.kills, salvage: run.salvage, parts: run.parts, position: { x, y, hp, angle, ammo },
      reserve: this.reserveAmmo, supplies: { ...this.supplies }, taken: this.loot.filter(item => item.taken).map(item => item.id),
      doors: this.doors.map(({ hp, angle, destroyed, fortification }) => ({ hp, angle, destroyed,
        ...(fortification ? { fortification } : {}) })),
      enemies: this.enemies.filter(e => e.hp > 0).map(({ x, y, room, type, hp, angle, survivalVariant }) => (
        { x, y, room, type, hp, angle, ...(survivalVariant ? { survivalVariant } : {}) })),
      gear: JSON.parse(JSON.stringify(gear)) as SurvivalGearSave, timed };
  }
  restoreSurvival(save: SurvivalCheckpoint) {
    const run = this.survival;
    if (!run) return;
    Object.assign(run, { pool: { ...save.pool }, salvage: save.salvage, parts: save.parts });
    Object.assign(run.timed, save.timed, { helicopter: { ...save.timed.helicopter }, boat: { ...save.timed.boat } });
    this.elapsed = save.elapsed; this.kills = save.kills;
    this.reserveAmmo = save.reserve; this.supplies = { ...save.supplies };
    const relocated = save.layout !== this.stage.survival?.layout;
    this.loot.forEach(item => { item.taken = (!relocated || item.id < 3) && save.taken.includes(item.id); });
    const { hp, angle, ammo } = save.position;
    Object.assign(this.player, { hp: Math.min(hp, this.player.maxHp), angle, ammo: Math.min(ammo, this.hero.magazine) });
    const bag = this.survivalBag!, gear = relocated ? undefined : save.gear;
    if (gear) {
      const restored = JSON.parse(JSON.stringify(gear)) as SurvivalGearSave;
      this.survivalCrates = restored.crates; this.survivalSentries = restored.sentries; this.survivalMines = restored.mines;
      const overflow = bag.restore(restored.items, restored.quick);
      if (overflow.length) {
        const { x, y } = this.stage.spawn;
        for (const { id, kind, count, rounds } of overflow) this.survivalCrates.push({
          x: x + 60, y, id: 'migration-' + id, kind: 'dropped', opened: true, goods: [{ kind, count, rounds }],
        });
      }
      this.survivalField = restored.field ?? this.survivalField;
      this.survivalRestock = restored.restock;
      this.survivalSpecial = restored.special;
      this.survivalBaseAmmo = Math.min(this.baseGun.magazine, restored.baseAmmo);
      this.survivalBaseReserve = restored.baseReserve;
      this.applySurvivalWeapon(restored.selected);
      this.survivalScan = restored.scan;
    } else {
      bag.items = []; bag.quick = [null, null, null];
      for (const kind of SURVIVAL_ITEMS) {
        let left = kind === 'mod-cache' ? save.parts : save.supplies[kind];
        while (left > 0) {
          const count = bag.give({ kind, count: left });
          if (!count) {
            const { x, y } = this.stage.spawn, cap = SURVIVAL_GEAR[kind][3];
            this.survivalCrates.push({ x: x + 65, y, id: 'legacy-' + kind + '-' + left, kind: 'dropped', opened: true,
              goods: [{ kind, count: Math.min(cap, left) }] });
            left -= cap;
          } else left -= count;
        }
      }
    }
    this.updateBagCounts();
    this.doors.forEach((d, i) => {
      const previous = save.doors[i];
      if (!previous || relocated && i >= 2) return;
      const angle = relocated ? d.baseAngle : previous.angle;
      if (previous.fortification) this.setSurvivalDoorKind(d, previous.fortification);
      Object.assign(d, { hp: clamp(previous.hp, 0, d.maxHp), angle, target: angle, destroyed: previous.destroyed });
    });
    this.syncGeometry();
    if (relocated) { this.updateMinimap(); return; }
    this.enemies = [];
    const safePoint = (position: Point, radius: number, mover?: Player) => {
      const open = (point: Point) => walkable(point, radius, this.blockers, this.rooms) && this.unitSpaceFree(point, radius, mover);
      if (open(position)) return position;
      // An older run may have saved an actor where a new partition now stands.
      for (const distance of [24, 48, 72, 96, 120]) for (let i = 0; i < 16; i++) {
        const angle = i * TAU / 16;
        const point = { x: position.x + Math.cos(angle) * distance, y: position.y + Math.sin(angle) * distance };
        if (open(point)) return point;
      }
      return undefined;
    };
    const position = safePoint(save.position, 16, this.player);
    if (position) { this.player.x = position.x; this.player.y = position.y; }
    const plan = this.stage.survival!;
    const upstairs = this.survivalUpperFloor;
    this.survivalStairTransit = (upstairs ? [upstairs] : plan.stairs).find(({ bounds }) =>
      roomAt({ x: this.player.x - (upstairs?.offsetX ?? 0), y: this.player.y }, [bounds]) >= 0);
    for (const state of save.enemies) {
      const point = safePoint(state, 16);
      if (!point) continue;
      const savedRoom = this.rooms[state.room];
      const oldBedroom = savedRoom && plan.stairs.some(stair => stair.upperRoom === state.room) && roomAt(point, [savedRoom]) < 0;
      const room = point === state && save.doors.length === this.doors.length && savedRoom && !oldBedroom ? state.room : roomAt(point, this.rooms);
      const enemy = this.spawnEnemy([room, point.x, point.y, state.type]);
      this.tuneTimedEnemy(enemy, state.survivalVariant);
      enemy.hp = Math.min(state.hp, enemy.maxHp); enemy.angle = state.angle;
    }
    this.updateMinimap();
  }
  private setSurvivalDoorKind(door: Door, kind: SurvivalDoorKind) {
    const { hp, material } = SURVIVAL_DOORS[kind];
    Object.assign(door, { fortification: kind, maxHp: hp, material });
  }
  private survivalDoorDistance(door: Door, reach = SURVIVAL_DOOR_REACH) {
    const p = this.player;
    let best = Infinity;
    // A player standing at a wide opening can still close its swung-away leaf.
    const angles = !door.destroyed && Math.abs(door.angle - door.baseAngle) > .01 ? [door.angle, door.baseAngle] : [door.baseAngle];
    for (const angle of angles) {
      const surface = closestOnRect(p, doorShape(door, angle)), distance = dist(p, surface);
      if (distance >= best || distance >= reach) continue;
      const blockers = nearbyRects(this.blockers, p.x, p.y, surface.x, surface.y).filter(rect => rect.kind !== 'door:' + door.id);
      if (lineClear(p, surface, blockers)) best = distance;
    }
    return best;
  }
  nearbySurvivalDoor(id?: number) {
    if (!this.survival || this.survivalStairTransit) return undefined;
    if (id !== undefined) {
      const door = this.doors[id];
      return door?.fortification && Number.isFinite(this.survivalDoorDistance(door)) ? door : undefined;
    }
    let nearest: Door | undefined, best = Infinity;
    for (const door of this.doors) {
      const distance = this.survivalDoorDistance(door);
      if (distance < best) { nearest = door; best = distance; }
    }
    return nearest;
  }
  survivalDoorPlan(id: number, replacement?: SurvivalDoorKind): SurvivalDoorPlan | undefined {
    const door = this.doors[id], bag = this.survivalBag;
    if (!this.survival || !bag || !door?.fortification) return;
    const kind = replacement ?? door.fortification, spec = SURVIVAL_DOORS[kind];
    if (!spec) return;
    const cost = replacement ? spec.install : spec.repair;
    const seconds = spec.seconds * (replacement ? 1.6 : 1) * (this.heroId === ENGINEER_ID ? .65 : 1);
    const gain = replacement ? spec.hp : Math.max(0, Math.min(door.maxHp - door.hp, Math.floor(spec.hp * .25)));
    const plan = { kind, cost, seconds, gain };
    let reason: string | undefined;
    if (!this.nearbySurvivalDoor(id)) reason = '请靠近门位';
    else if (!this.canInteract() || this.usingSupply || this.survivalPlacement) reason = '当前动作无法施工';
    else if (replacement && !door.destroyed && replacement === door.fortification) reason = '此门已是该门型';
    else if (!replacement && door.destroyed) reason = '门板已毁，请选择门型重装';
    else if (!replacement && gain <= 0) reason = '耐久已满';
    else if (replacement && this.survivalDoorwayOccupied(door)) reason = '门洞已被占用';
    else if (!bag.canPay(cost)) reason = '材料不足';
    return reason ? { ...plan, reason } : plan;
  }
  private survivalDoorwayOccupied(door: Door) {
    const closed = doorShape(door, door.baseAngle);
    return [this.player, ...this.enemies, ...this.allies].some(unit => unit.hp > 0 && circleRect(unit, unitRadius(unit), closed)) ||
      this.survivalSentries.some(sentry => sentry.hp > 0 && circleRect(sentry, 22, closed)) ||
      this.doors.some(other => other !== door && !other.destroyed && rectIntersects(closed, doorShape(other)));
  }
  startSurvivalDoorWork(id: number, replacement?: SurvivalDoorKind) {
    if (this.survivalDoorWork) return false;
    const plan = this.survivalDoorPlan(id, replacement);
    if (!plan || plan.reason || this.player.hit > 0) return false;
    const { x, y, hp } = this.player;
    this.player.reload = 0;
    this.survivalDoorWork = { id, replacement, duration: plan.seconds, left: plan.seconds, hp, start: { x, y } };
    return true;
  }
  cancelSurvivalDoorWork() {
    if (!this.survivalDoorWork) return;
    this.survivalDoorWork = undefined;
    this.events.push('survival-door-work-cancel');
  }
  private tickSurvivalDoorWork(dt: number, controls: Controls) {
    const work = this.survivalDoorWork;
    if (!work) return;
    const p = this.player;
    if (Math.hypot(controls.x, controls.y) > .12 || dist(p, work.start) > 6 || p.hp < work.hp || p.hit > 0 || !this.canInteract() ||
        (!work.replacement && this.doors[work.id].destroyed)) {
      this.cancelSurvivalDoorWork();
      return;
    }
    work.left -= dt;
    if (work.left > 1e-6) return;
    const plan = this.survivalDoorPlan(work.id, work.replacement);
    if (!plan || plan.reason || !this.survivalBag?.pay(plan.cost)) { this.cancelSurvivalDoorWork(); return; }
    const door = this.doors[work.id];
    if (work.replacement) {
      this.setSurvivalDoorKind(door, work.replacement);
      Object.assign(door, { hp: door.maxHp, angle: door.baseAngle, target: door.baseAngle, destroyed: false, blocked: 0, hit: 0 });
      this.doorAttempts.delete(door.id);
      this.syncGeometry();
    } else door.hp = Math.min(door.maxHp, door.hp + plan.gain);
    this.updateBagCounts();
    this.survivalDoorWork = undefined;
    this.events.push(work.replacement ? 'survival-door-installed' : 'survival-door-repaired');
  }
  depositSurvivalSalvage() {
    const run = this.survival;
    if (!run?.salvage || !this.survivalAtRadio || !this.canInteract()) return false;
    run.pool.coins += run.salvage; run.salvage = 0;
    return true;
  }
  get survivalConvoyReady() {
    return !!this.survival?.timed && this.elapsed >= CONVOY_ARRIVAL && this.elapsed < CONVOY_LEAVE;
  }
  survivalVehicleAtPlayer() {
    if (!this.survival?.timed || this.survivalUpperFloor) return undefined;
    return (['helicopter', 'boat'] as const).find(id => {
      const point = EVAC_VEHICLES[id].access;
      return dist(this.player, point) < 110 && lineClear(this.player, point, this.blockers);
    });
  }
  survivalVehicleStatus(id: EvacVehicle) {
    const state = this.survival?.timed?.[id];
    const fuel = state?.fuelStart === undefined ? undefined : Math.max(0, EVAC_FUEL_SECONDS - (this.elapsed - state.fuelStart));
    return { installed: state?.installed ?? 0, fuel, ready: fuel === 0 };
  }
  fitSurvivalPart(id: EvacVehicle, index: number) {
    const state = this.survival?.timed?.[id], part = EVAC_VEHICLES[id].parts[index];
    if (!state || !part || this.survivalVehicleAtPlayer() !== id || !this.canInteract() || state.installed & (1 << index) ||
        !this.survivalBag?.pay([[part, 1]])) return false;
    state.installed |= 1 << index;
    return true;
  }
  beginSurvivalFuel(id: EvacVehicle) {
    const run = this.survival?.timed, state = run?.[id];
    if (!state || !run || state.installed !== 31 || state.fuelStart !== undefined || this.survivalVehicleAtPlayer() !== id ||
        !this.canInteract() || !this.survivalBag?.pay([['evac-fuel', 1]])) return false;
    state.fuelStart = this.elapsed;
    run.nextPressure = this.elapsed;
    this.emitSound(EVAC_VEHICLES[id].access, 'explosion', { intensity: 1, radius: 1650 });
    this.events.push('survival-fuel-start');
    return true;
  }
  boardSurvival(route: EvacRoute) {
    const run = this.survival, timed = run?.timed;
    if (!run || !timed || !this.canInteract() || this.elapsed >= CONVOY_LEAVE) return false;
    if (route === 'convoy' ? !this.survivalAtConvoy :
      this.survivalVehicleAtPlayer() !== route || !this.survivalVehicleStatus(route).ready) return false;
    timed.route = route;
    run.pool.coins += run.salvage; run.salvage = 0;
    run.outcome = 'extracted'; this.status = 'won';
    this.events.push('survival-boarded');
    return true;
  }
  get survivalAtConvoy() {
    return this.survivalConvoyReady && !this.survivalUpperFloor && dist(this.player, CONVOY_BOARD) < 112 &&
      lineClear(this.player, CONVOY_BOARD, this.blockers);
  }
  private tuneTimedEnemy(enemy: Enemy, variant?: SurvivalVariant) {
    enemy.survivalVariant = variant;
    const extra = Math.min(34, Math.floor(this.elapsed / 60) * 2);
    enemy.hp = enemy.maxHp = variant === 'overrun' ? 440 : variant === 'breaker' ? 152 + extra :
      variant === 'runner' ? 51 + extra : enemy.maxHp + extra;
  }
  private stepTimedSurvival(dt: number) {
    const run = this.survival!, timed = run.timed!, now = this.elapsed, plan = this.stage.survival!;
    if (now >= SURVIVAL_DEADLINE) { run.outcome = 'fallen'; this.status = 'lost'; return; }
    if (now >= CONVOY_NOTICE && !timed.convoyNotice) {
      timed.convoyNotice = true; this.events.push('survival-convoy-radio');
    }
    const minute = Math.min(23, Math.floor(now / 60));
    if (minute > timed.rewardedMinutes) {
      run.pool.coins += (minute - timed.rewardedMinutes) * 12;
      run.pool.materials += (minute - timed.rewardedMinutes) * 4;
      timed.rewardedMinutes = minute;
      if (minute % 2 === 0) this.startSurvivalRestock(minute);
      this.events.push('survival-timed-checkpoint');
    }
    this.stepSurvivalRestock(dt);
    if (minute >= 4 && minute % 4 === 0 && timed.lastDrop !== minute) {
      const point = this.survivalAirdropPoint(minute + 2);
      if (point) {
        const guns = survivalWeapons(this.heroId);
        this.survivalCrates.push({ ...point, id: 'timed-air-' + minute, kind: 'airdrop', opened: false, goods: [
          { kind: guns[(plan.seed + minute) % guns.length], count: 1 }, { kind: 'special-ammo', count: 3 },
          { kind: 'evac-fuel', count: 1 }, { kind: SURVIVAL_PARTS[minute % 3], count: 1 }, { kind: 'mine', count: 1 },
        ] });
        this.events.push('survival-airdrop');
      }
      timed.lastDrop = minute;
    }
    this.stepTimedConvoy();
    if (now < timed.nextPressure) return;
    timed.nextPressure = now + (now >= CONVOY_LEAVE ? .72 : now >= 900 ? 2.1 : now >= 540 ? 3.1 : now >= 240 ? 4.8 : 8);
    const stock = SURVIVAL_FIELD_AREAS.flatMap((sites, zone) => sites.map(([x, y]) => ({ ...harborPoint(x, y), zone })));
    EVAC_PART_IDS.forEach((kind, index) => {
      if (timed.released & (1 << index)) return;
      const pick = survivalRandom(plan.seed ^ Math.imul(index + 1, 77431));
      const [early, late] = EVAC_PART_WINDOWS[index % 5];
      if (now < early + pick(late - early + 1)) return;
      const start = pick(stock.length);
      const point = stock.slice(start).concat(stock.slice(0, start)).find(p => !this.sees(p) &&
        walkable(p, 18, this.blockers, this.rooms) && !this.survivalField.some(item => dist(item, p) < 55));
      if (!point) return;
      timed.released |= 1 << index;
      this.survivalField.push({ ...point, id: 'evac-' + kind, kind, count: 1 });
      this.events.push('survival-part-found');
    });
    const upper = this.survivalUpperFloor;
    const p = { x: this.player.x - (upper?.offsetX ?? 0), y: this.player.y };
    const fuel = (['helicopter', 'boat'] as const).filter(id => (this.survivalVehicleStatus(id).fuel ?? 0) > 0)
      .sort((a, b) => dist(p, EVAC_VEHICLES[a].access) - dist(p, EVAC_VEHICLES[b].access))[0];
    const destination = fuel ? EVAC_VEHICLES[fuel].access : p;
    const closeToObjective = (e: Point) => dist(e, this.player) < 1450 || dist(e, destination) < 1060 ||
      this.survivalSentries.some(s => s.hp > 0 && dist(s, e) < 460) || this.survivalMines.some(m => dist(m, e) < 105);
    const limit = Math.min(this.survivalActiveLimit, now >= CONVOY_LEAVE ? 92 : now >= 900 ? 92 : now >= 540 ? 56 : now >= 240 ? 35 : 20);
    const living = this.enemies.filter(e => e.hp > 0);
    if (living.length >= limit * .65 && now >= 110) {
      const dormant = living.filter(e => !closeToObjective(e) && !this.sees(e) && e.hp === e.maxHp).slice(0, now >= 900 ? 8 : 3);
      for (const e of dormant) e.hp = 0;
    }
    let count = this.enemies.filter(e => e.hp > 0).length;
    const nearSpawns = stock.filter(s => dist(s, destination) <= 1200);
    const pick = survivalRandom(plan.seed ^ Math.imul(Math.floor(now * 10), 7949));
    const ring = Array.from({ length: 28 }, (_, i) => {
      const angle = (i + pick(24) / 24) * 2.399963;
      const r = (fuel ? 335 : 410) + pick(400);
      return { x: destination.x + Math.cos(angle) * r, y: destination.y + Math.sin(angle) * r };
    });
    timed.groups = timed.groups.filter(group => group.expires > now && group.count > 0);
    if (timed.groups.length < 5) {
      const anchor = (nearSpawns.length ? nearSpawns : stock)[pick(nearSpawns.length || stock.length)];
      timed.groups.push({ point: { x: anchor.x, y: anchor.y }, count: fuel ? 9 : now >= 900 ? 10 : now >= 540 ? 6 : now >= 240 ? 4 : 2, expires: now + 42 });
    }
    const batch = now >= CONVOY_LEAVE ? 10 : fuel ? 8 : now >= 900 ? 8 : now >= 540 ? 5 : now >= 240 ? 3 : 1;
    let added = 0;
    for (const group of timed.groups) {
      const delta = dist(group.point, destination);
      if (delta > 760) {
        const next = { x: group.point.x + (destination.x - group.point.x) * .23, y: group.point.y + (destination.y - group.point.y) * .23 };
        if (walkable(next, 16, this.blockers, this.rooms)) group.point = next;
      }
      for (const point of [group.point, ...ring, ...nearSpawns]) {
        if (!group.count || added >= batch || count >= limit) break;
        const indoor = plan.buildings.some(site => circleRect(point, 15, site.footprint));
        if (indoor || dist(point, destination) > 1150 || !this.canSpawn(point, 270)) continue;
        const ticket = pick(12), variant = now >= CONVOY_LEAVE && ticket < 8 ? 'overrun' :
          now >= 540 && ticket === 0 ? 'breaker' : now >= 240 && ticket < 4 ? 'runner' : undefined;
        const enemy = this.spawnEnemy([plan.streetRoom, point.x, point.y, now >= 240 && ticket === 4 ? 'spitter' : 'walker']);
        this.tuneTimedEnemy(enemy, variant);
        if (fuel || now >= CONVOY_LEAVE || now >= 900 && ticket < 8) enemy.survivalPursuit = true;
        else if (now >= 240) {
          enemy.investigate = ring[pick(ring.length)];
          enemy.investigateTime = 9;
        }
        group.count--; count++; added++;
      }
    }
  }
  private stepTimedConvoy() {
    const timed = this.survival!.timed!, now = this.elapsed;
    if (now < CONVOY_NOTICE || now > CONVOY_LEAVE + 18 || now < timed.nextConvoyFire) return;
    timed.nextConvoyFire = now + .19;
    for (const vehicle of convoyVehicles(now)) {
      if (!vehicle.visible || dist(vehicle, this.player) > 1250) continue;
      if (now < CONVOY_ARRIVAL || now >= CONVOY_LEAVE) for (const e of this.enemies) {
        if (e.hp > 0 && dist(vehicle, e) < 52 && lineClear(vehicle, e, this.blockers)) {
          this.damageEnemy(e, 110, { angle: vehicle.angle, distance: 77, heavy: true }, false);
        }
      }
      const target = this.enemies.filter(enemy => enemy.hp > 0 && dist(vehicle, enemy) < (vehicle.kind === 'tank' ? 385 : 265) &&
        lineClear(vehicle, enemy, this.blockers)).sort((a, b) => dist(a, vehicle) - dist(b, vehicle))[0];
      if (!target) continue;
      const angle = Math.atan2(target.y - vehicle.y, target.x - vehicle.x), tank = vehicle.kind === 'tank';
      const last = this.survivalConvoyAim.get(vehicle.index);
      const previous = last && now - last.trackingAt < 1.4 ? last.angle : vehicle.angle;
      const turn = tank ? .49 : .77;
      const aim = { angle: previous + clamp(angleDiff(angle, previous), -turn, turn), shotAt: last?.shotAt ?? -Infinity, trackingAt: now };
      this.survivalConvoyAim.set(vehicle.index, aim);
      if (Math.abs(angleDiff(angle, aim.angle)) < .19 && now - aim.shotAt >= (tank ? 2.45 : .36)) {
        aim.shotAt = now;
        if (tank) {
          for (const e of this.enemies) if (e.hp > 0 && dist(target, e) < 93 && lineClear(target, e, this.blockers)) {
            this.damageEnemy(e, 75, { angle, distance: 58, heavy: true }, false);
          }
          this.emit(target, 13, 'air-dust');
        } else this.damageEnemy(target, 26, { angle, distance: 13 }, false);
      }
    }
  }
  private startSurvivalRestock(cycle: number) {
    if (this.survivalRestock?.cycle === cycle) return;
    const seed = this.stage.survival!.seed;
    const rare = 2 + (cycle + seed) % 2;
    const rotation = [1, 4, 5, 6];
    const district = rotation[(cycle + seed % rotation.length) % rotation.length];
    this.survivalRestock = {
      cycle, zones: [0, district, rare],
      pending: [0, district, district, district, rare, rare, rare].map((zone, slot) => ({ zone, slot })),
    };
    this.stepSurvivalRestock(1);
    this.events.push('survival-restock');
  }
  private stepSurvivalRestock(dt: number) {
    const restock = this.survivalRestock;
    if (!restock?.pending.length) return;
    this.survivalRestockTick -= dt;
    if (this.survivalRestockTick > 0) return;
    this.survivalRestockTick = 1;
    for (const entry of restock.pending.slice()) {
      if (this.placeSurvivalField(entry.zone, entry.slot, restock.cycle)) {
        restock.pending.splice(restock.pending.indexOf(entry), 1);
      }
    }
  }
  private placeSurvivalField(zone: number, slot: number, cycle: number) {
    const seed = this.stage.survival!.seed;
    const pick = survivalRandom(seed ^ Math.imul(cycle, 0x2fbec711) ^ Math.imul(zone * 7 + slot + 1, 11731));
    const area: readonly (readonly [number, number])[] = SURVIVAL_FIELD_AREAS[zone];
    const id = 'field-' + cycle + '-' + zone + '-' + slot;
    if (this.survivalField.some(drop => drop.id === id)) return true;
    const safe = (point: Point) => cycle === 1 || dist(point, this.player) > 210 && !this.sees(point);
    if (cycle > 1 && zone === 0 && cycle % 2 === 0) {
      const ammo = this.loot.find(item => item.id === 0 && item.taken && safe(item));
      if (ammo) { ammo.taken = false; return true; }
    }
    const table: readonly GearKind[] = zone === 0 ? ['medical-stock', 'door-wood']
      : zone === 2 || zone === 3 ? ['tactical-stock', 'mod-cache', 'door-metal', 'door-metal']
        : ['medical-stock', 'medical-stock', 'tactical-stock', 'mod-cache', 'door-wood', 'door-wood'];
    const premium = cycle > 1 && slot === 4;
    const rare: readonly GearKind[] = ['tactical-module', 'door-brace', 'shock-mine', 'grenade', 'mine', 'door-brace'];
    let kind = premium ? rare[pick(rare.length)] : table[pick(table.length)];
    if (cycle === 1 && zone === 0) kind = 'door-wood';
    if (cycle === 1 && zone === 2) kind = 'shock-mine';
    if (cycle === 1 && zone === 3) kind = 'grenade';
    const count = premium || ['grenade', 'shock-mine'].includes(kind) ? 1 : 1 + pick(2);
    if (premium) {
      const crate = this.survivalCrates.find(c => !c.goods.length && (c.kind === 'armory' || c.kind === 'engineering') &&
        c.x < 548 * 6 && (zone === 3 ? c.y < (1024 - 724) * 6 : c.y > (1024 - 724) * 6) && safe(c));
      if (crate) { crate.goods = [{ kind, count }]; crate.opened = false; return true; }
    }
    const rotation = pick(area.length);
    for (const [x, y] of area.slice(rotation).concat(area.slice(0, rotation))) {
      const point = harborPoint(x, y);
      if (!safe(point) || !walkable(point, 18, this.blockers, this.rooms) ||
          this.survivalField.some(drop => dist(drop, point) < 55) ||
          this.survivalCrates.some(crate => dist(crate, point) < 52) ||
          this.loot.some(item => !item.taken && dist(item, point) < 44) ||
          this.enemies.some(e => e.hp > 0 && dist(e, point) < 36)) continue;
      this.survivalField.push({ ...point, id, zone, kind, count });
      return true;
    }
    return false;
  }
  private survivalAirdropPoint(cycle: number) {
    const pick = survivalRandom(this.stage.survival!.seed ^ Math.imul(cycle, 0x2fbec711));
    const targets = [[720, 684], [290, 680], [1375, 690], [585, 161], [1151, 696]] as const;
    const rotation = pick(targets.length);
    if (cycle !== 6 && pick(4) === 0) return;
    return targets.slice(rotation).concat(targets.slice(0, rotation)).map(([x, y]) => harborPoint(x, y))
      .find(point => walkable(point, 22, this.blockers, this.rooms) &&
        !this.survivalCrates.some(crate => crate.kind === 'airdrop' && crate.goods.length && dist(crate, point) < 70));
  }
  private setupFloor(stage: LevelDefinition) {
    this.stage = stage;
    this.harborStaticIndex = undefined;
    this.harborPlayerFlowCell = -1;
    this.harborPlayerFlowRevision = -1;
    this.survivalStairTransit = undefined;
    this.survivalSearchOrders = new WeakMap();
    this.survivalStairPassages.clear();
    this.survivalSweepTimes.clear();
    this.survivalStairWarning = -Infinity;
    this.unitsIndexed = false;
    if (stage.apartment) this.setupApartment(stage.apartment);
    this.gridWidth = Math.ceil(Math.max(...stage.rooms.map(r => r.x + r.w)) / 32);
    this.gridHeight = Math.ceil(Math.max(...stage.rooms.map(r => r.y + r.h)) / 32);
    const cells = this.gridWidth * this.gridHeight;
    this.grid = new Uint8Array(cells);
    this.flow = new Int32Array(cells).fill(-1);
    this.flowQueue = new Int32Array(cells);
    this.soundFlows.clear();
    const columns = Math.ceil(Math.max(...stage.rooms.map(r => r.x + r.w)) / MINIMAP_CELL_SIZE);
    const rows = Math.ceil(Math.max(...stage.rooms.map(r => r.y + r.h)) / MINIMAP_CELL_SIZE);
    Object.assign(this.minimap, { columns, rows, explored: new Uint8Array(columns * rows), visible: new Uint8Array(columns * rows), revision: this.minimap.revision + 1 });
    this.minimapSight = undefined;
    this.minimapAllies = [];
    this.minimapVisible.length = 0;
    this.rollLanding = undefined;
    const facing = stage.apartment?.part === 'arrival' || stage.dorm?.number === 1 ? -Math.PI / 2 : 0.2;
    Object.assign(this.player, stage.spawn, { angle: facing, dashTime: 0, knockback: undefined });
    const operation = stage.operation;
    if (operation) {
      const previous = this.allies, previousRun = this.operationRun;
      const angle = operation.part === 'defense' ? Math.PI : operation.part === 'city' ? Math.PI / 12 : 0;
      this.player.angle = this.squadHeading = angle;
      const phase: OperationPhase = operation.part === 'city' ? 'landing' : operation.part === 'compound' ? 'leader-fight' : 'retreat';
      this.operationRun = { ready: false, hold: OPERATION_HOLD, wave: 4, cursor: 0,
        airSupport: operation.part !== 'compound', airCooldown: previousRun?.air ? OPERATION_AIR_COOLDOWN : previousRun?.airCooldown ?? 0,
        grenadeDelay: previousRun?.grenadeDelay ?? 0, sector: -1, phaseTime: 0, holdReported: false, phase,
        bossId: -1, kingEscaped: false, survivors: previousRun?.survivors ?? operation.allies.length,
        announced: false, slam: -2.5 };
      this.minimapAirSight = undefined;
      this.operationMutationFlash = undefined;
      if (!previousRun) this.tactical = newTacticalLoadout('grenade');
      this.operationRadioBusy = false;
      this.operationGuideAnchor = undefined;
      this.allies = operation.allies.flatMap((point, slot) => {
        const carried = previousRun && previous.find(ally => ally.id === -1 - slot);
        if (operation.part === 'defense' && previousRun && (!carried || carried.hp <= 0)) return [];
        return [this.makeOperationAlly(point, slot, angle, carried?.hp, carried?.grenades)];
      });
    }
    this.doors = createDoors(stage.doors);
    if (stage.survival) for (const door of this.doors) this.setSurvivalDoorKind(door, door.material === 'steel' ? 'reinforced' : 'wood');
    const spawnRoom = roomAt(stage.spawn, stage.rooms);
    this.visited = stage.rooms.map((_, i) => i === spawnRoom);
    this.discovered = [...this.visited]; this.alerted = [...this.visited]; this.cleared = stage.rooms.map(() => false);
    this.enemies = [];
    for (const spawn of stage.spawns) this.spawnEnemy(spawn);
    if (operation?.part === 'city') operation.encounters.forEach((encounter, sector) => {
      for (const spawn of encounter.enemies) this.spawnEnemy(spawn).operationSector = sector;
    });
    this.syncGeometry();
    this.placeLoot();
    this.updateMinimap();
  }
  private makeOperationAlly(point: Point, slot: number, angle: number, hp = 110, grenades = 1): Ally {
    return { ...point, grenades, id: -1 - slot, slot, hp, maxHp: 110, angle, cooldown: 0.4, ammo: 18, burst: 0, hit: 0, muzzle: 0 };
  }
  private setupApartment(plan: ApartmentFloor) {
    const phase = { arrival: 'outside', garage: 'generator', defense: 'shutter', home: 'note' }[plan.part] as ApartmentPhase;
    const traps = plan.outdoor?.traps.map(point => ({ ...point, charge: 1, flash: 0, entrance: true })) ?? [];
    const run: ApartmentRun = { phase, kits: this.apartment?.kits ?? 0, armed: this.engineerArmed, following: false,
      timer: 0, traps, queue: [], wave: 0, route: 0, shocked: new Set(), entryOpen: false, tankArrived: false, spawnCursor: 0, outdoorDialogueEnd: APARTMENT_LINE_SECONDS };
    if (plan.engineer) run.engineer = { ...plan.engineer.spawn, id: -50, slot: 0, hp: 120, maxHp: 120, angle: 0, cooldown: 0, ammo: 0, burst: 0, hit: 0, muzzle: 0 };
    this.apartment = run;
    this.allies = run.engineer ? [run.engineer] : [];
  }
  private apartmentEngineerReady() {
    const engineer = this.apartment?.engineer;
    const exit = this.stage.exit;
    return !!engineer && engineer.hp > 0 && dist(engineer, exit) < 135 && roomAt(engineer, this.rooms) === roomAt(exit, this.rooms) && lineClear(engineer, exit, this.blockers);
  }
  private nearbyApartmentStation() {
    const run = this.apartment, plan = this.stage.apartment, p = this.player;
    if (!run || !plan) return undefined;
    const near = (point: Point, range: number) => dist(p, point) <= range && lineClear(p, point, this.blockers);
    const option = (station: ApartmentStation, verb: string, name: string) => ({ id: 'apartment' as const, station, verb, name });
    if (run.engineer?.hp === 0 && near(run.engineer, 77)) return option('revive', '扶起', '维川 · 受伤倒地');
    if (plan.getaway && (run.phase === 'car-prep' || run.phase === 'car-ready')) {
      const surface = closestOnRect(p, plan.getaway.car);
      if (dist(p, surface) <= 64 && lineClear(p, surface, this.blockers.filter(block => block !== plan.getaway!.car))) {
        return option('car', run.phase === 'car-prep' ? '就绪' : '上车', run.phase === 'car-prep' ? '撤离车 · 准备就绪' : '撤离车 · 上车');
      }
    }
    for (const station of plan.stations) {
      if (!near(station.point, 76)) continue;
      if (station.id === 'stairs' && (run.phase === 'stairs' || run.phase === 'return')) return option('stairs', '换层', run.phase === 'stairs' ? '安全楼梯 · 下到负一层' : '安全楼梯 · 返回一层');
      if (station.id === 'generator' && run.phase === 'generator' && this.generatorProgress === undefined) return option('generator', '供电', '应急发电机 · 启动');
      if (station.id === 'shutter' && run.phase === 'shutter') return option('shutter', '合闸', '维修间配电箱 · 接通卷帘门与电击区');
      if (station.id === 'lift' && (run.phase === 'lift' || run.phase === 'escape')) return option('lift', '电梯', this.apartmentEngineerReady() ? run.phase === 'lift' ? '直达九层' : '乘电梯下到负一楼' : '等待维川抵达电梯');
      if (station.id === 'note' && run.phase === 'note') return option('note', '调查', '查看家人留下的便条');
    }
    return undefined;
  }
  private useApartmentStation(station: ApartmentStation) {
    const run = this.apartment!, plan = this.stage.apartment!;
    switch (station) {
      case 'revive': run.engineer!.hp = 75; run.engineer!.hit = 0; return true;
      case 'generator':
        if (this.player.hit > 0 || this.player.stun > 0 || this.player.reload > 0 || this.usingSupply) return false;
        run.generatorWork = 0;
        return true;
      case 'shutter':
        if (!run.engineer?.hp) { this.events.push('engineer-down'); return false; }
        run.phase = 'hold'; run.timer = 14; this.syncGeometry(); this.emitSound(this.player, 'alarm'); this.events.push('apartment-shutter'); break;
      case 'note':
        run.phase = 'gear'; run.navigation = undefined; this.events.push('apartment-note'); return true;
      case 'car': return this.useGetawayCar();
      case 'lift':
        if (!this.apartmentEngineerReady()) { this.events.push('engineer-wait'); return false; }
        this.floorPending = true; this.events.push('descend'); return true;
      case 'stairs': this.floorPending = true; this.events.push('descend'); return true;
    }
    run.queue = plan.reinforcements?.slice() ?? []; run.wave = 0.5;
    return true;
  }
  get generatorProgress() {
    const work = this.apartment?.generatorWork;
    return work === undefined ? undefined : clamp(work / GENERATOR_WORK_TIME, 0, 1);
  }
  private cancelGeneratorWork() {
    if (this.apartment?.generatorWork === undefined) return;
    this.apartment.generatorWork = undefined;
    this.events.push('apartment-generator-cancel');
  }
  private stepGenerator(dt: number) {
    const run = this.apartment;
    if (run?.generatorWork === undefined) return;
    run.generatorWork += dt;
    if (run.generatorWork + 1e-6 < GENERATOR_WORK_TIME) return;
    run.generatorWork = undefined;
    run.phase = 'return';
    this.emitSound(this.player, 'alarm');
    this.events.push('apartment-generator');
    run.queue = this.stage.apartment?.reinforcements?.slice() ?? [];
    run.wave = 0.5;
  }
  placeApartmentTrap() {
    const run = this.apartment, plan = this.stage.apartment, p = this.player;
    if (!run || !plan || run.kits <= 0 || this.status !== 'playing' || this.floorPending || this.generatorProgress !== undefined || p.dashTime > 0 || p.knockback || p.stun > 0) return false;
    const training = run.phase === 'training';
    if (training && (!plan.training || dist(p, plan.training.center) > plan.training.radius)) return false;
    const evacuation = run.phase === 'car-prep' && plan.getaway;
    if (run.phase === 'outside' || run.phase === 'entry-talk' || run.phase === 'driving' || run.phase === 'car-ready' || run.phase === 'car-hold') return false;
    if (evacuation && (roomAt(p, this.rooms) !== 0 || dist(p, evacuation.route[0]) > evacuation.trapRadius)) return false;
    if (!walkable(p, 24, this.blockers, this.rooms) || run.traps.some(trap => dist(trap, p) < (evacuation ? 36 : 70)) ||
        plan.stations.some(station => dist(station.point, p) < 58)) return false;
    const trap = { x: p.x, y: p.y, charge: 1, flash: 0, entrance: !!evacuation };
    run.kits--; run.traps.push(trap);
    if (training) {
      run.phase = 'stairs';
      this.events.push('apartment-training');
    }
    return true;
  }
  private stepApartmentOutside(dt: number, run: ApartmentRun, outdoor: NonNullable<ApartmentFloor['outdoor']>) {
    if (!run.timer) this.events.push('apartment-outside');
    run.timer += dt;
    const { entry, room, spawns } = outdoor, p = this.player;
    if (run.timer + 1e-6 >= 3 && !run.tankArrived) {
      const intercept = { x: p.x, y: Math.max(entry.y + 55, p.y - 145) };
      const approachCost = (point: Point) => dist(intercept, point) + Math.max(0, point.y - p.y) * 1.3;
      const spot = spawns.filter(point => this.canSpawn(point, 195, 26)).sort((a, b) => approachCost(a) - approachCost(b))[0];
      if (spot) {
        this.spawnEnemy([room, spot.x, spot.y, 'boss']);
        run.tankArrived = true;
        run.outdoorDialogueEnd = Math.max(run.outdoorDialogueEnd, run.timer) + 2 * APARTMENT_LINE_SECONDS;
        this.events.push('apartment-tank');
      }
    }
    if (!run.entryOpen && run.tankArrived && dist(p, entry) <= 137) {
      run.entryOpen = true;
      this.syncGeometry();
      this.events.push('apartment-entry-open');
    }
    if (run.entryOpen && p.y < entry.y - 27 && Math.abs(p.x - entry.x) < 133) {
      run.entryOpen = false;
      run.phase = 'entry-talk';
      run.kits++;
      run.timer = Math.min(0, run.timer - run.outdoorDialogueEnd);
      this.syncGeometry();
      this.events.push('apartment-entry');
      return;
    }
    if ((run.wave -= dt) > 0) return;
    run.wave = 0.7;
    if (this.enemies.filter(e => e.room === room && e.type === 'walker' && e.hp > 0).length >= 10) return;
    for (let offset = 0; offset < spawns.length; offset++) {
      const index = (run.spawnCursor + offset) % spawns.length, spot = spawns[index];
      if (!this.canSpawn(spot, 210)) continue;
      this.spawnEnemy([room, spot.x, spot.y, 'walker', this.enemySequence % 4]);
      run.spawnCursor = (index + 1) % spawns.length;
      break;
    }
  }
  private paralyze(e: Enemy, duration: number) {
    if (e.hp <= 0) return;
    const time = e.type === 'boss' ? duration / 2 : duration;
    e.paralysis = Math.max(e.paralysis ?? 0, time);
    e.stun = Math.max(e.stun, time);
    e.windup = 0;
    e.charge = undefined;
    e.chargeCooldown = 1.3;
  }
  private useGetawayCar() {
    const run = this.apartment!, plan = this.stage.apartment!.getaway!;
    if (run.phase === 'car-prep') {
      if (!run.engineer?.hp || dist(run.engineer, plan.engineer) > 45) { this.events.push('engineer-car-wait'); return false; }
      run.navigation = undefined;
      run.phase = 'car-hold';
      run.timer = 20;
      run.wave = 0;
      run.spawnCursor = 0;
      this.emitSound(plan.route[0], 'alarm');
      this.events.push('apartment-car-alarm');
      return true;
    }
    if (run.phase !== 'car-ready' || !run.engineer?.hp) return false;
    const [car, target] = plan.route;
    run.phase = 'driving';
    run.drive = { ...car, target: 1, angle: Math.atan2(target.y - car.y, target.x - car.x), speed: 0 };
    this.cancelSupply();
    this.player.dashTime = 0;
    this.player.knockback = undefined;
    this.bullets.length = 0;
    Object.assign(this.player, car, { angle: run.drive.angle });
    this.syncGeometry();
    this.events.push('apartment-car-drive');
    return true;
  }
  private stepCarDefense(dt: number, run: ApartmentRun, plan: NonNullable<ApartmentFloor['getaway']>) {
    run.timer = Math.max(0, run.timer - dt);
    if (run.timer <= 0.00001) {
      run.phase = 'car-ready';
      this.events.push('apartment-car-ready');
      return;
    }
    run.wave -= dt;
    if (run.wave > 0) return;
    run.wave = 0.65;
    let alive = this.enemies.filter(enemy => enemy.hp > 0).length;
    for (let offset = 0, spawned = 0; offset < plan.waves.length && alive < 24 && spawned < 2; offset++) {
      const entry = plan.waves[(run.spawnCursor + offset) % plan.waves.length];
      if (entry[3] === 'boss' && (run.timer > 13 || this.enemies.some(enemy => enemy.hp > 0 && enemy.type === 'boss'))) continue;
      if (!this.canSpawn({ x: entry[1], y: entry[2] }, 230, entry[3] === 'boss' ? 25 : 16)) continue;
      this.spawnEnemy(entry);
      alive++; spawned++;
    }
    run.spawnCursor = (run.spawnCursor + 3) % plan.waves.length;
  }
  private stepEvacuationDrive(dt: number) {
    const drive = this.apartment!.drive!, route = this.stage.apartment!.getaway!.route;
    const destination = route[drive.target], distance = dist(drive, destination);
    drive.speed = Math.min(385, drive.speed + 255 * dt);
    const step = Math.min(distance, drive.speed * dt);
    if (distance > 0) drive.angle = Math.atan2(destination.y - drive.y, destination.x - drive.x);
    const dx = Math.cos(drive.angle), dy = Math.sin(drive.angle);
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const x = enemy.x - drive.x, y = enemy.y - drive.y;
      const ahead = x * dx + y * dy, side = -x * dy + y * dx;
      const radius = unitRadius(enemy);
      if (step <= 0 || ahead < -48 - radius || ahead > 77 + radius + step || Math.abs(side) > 54 + radius) continue;
      this.damageEnemy(enemy, Math.max(enemy.hp, 1), { angle: drive.angle, distance: 88, heavy: true });
    }
    drive.x += dx * step; drive.y += dy * step;
    Object.assign(this.player, { x: drive.x, y: drive.y, angle: drive.angle });
    if (step >= distance && ++drive.target === route.length) {
      this.status = 'won';
      this.events.push('win');
    }
    this.updateParticles(dt);
  }
  private stepEvacuationPursuit(dt: number, target: Point, stop: number, radius: number, pace = 1) {
    this.soundFlowBudget = 2;
    // The squad is already aboard or following the boarding animation.
    this.indexUnits(false);
    this.updateDoors(dt);
    for (const e of this.enemies) {
      if (e.hp <= 0 || dist(e, this.player) > radius + 180) continue;
      e.hit = Math.max(0, e.hit - dt);
      e.muzzle = Math.max(0, (e.muzzle || 0) - dt);
      e.cooldown = Math.max(0, e.cooldown - dt);
      e.windup = 0;
      e.charge = undefined;
      if (e.knockback) { this.updateKnockback(e, dt, unitRadius(e)); continue; }
      const immobilized = e.stun > 0 || (e.paralysis ?? 0) > 0;
      e.stun = Math.max(0, e.stun - dt);
      if (e.paralysis) e.paralysis = Math.max(0, e.paralysis - dt);
      const distance = dist(e, target);
      if (immobilized || distance > radius || pace <= 0) continue;
      const point = distance <= stop ? target : this.soundWaypoint(e, target, 2, unitRadius(e));
      if (!point) continue;
      const angle = Math.atan2(point.y - e.y, point.x - e.x);
      e.angle += clamp(angleDiff(angle, e.angle), -dt * 9, dt * 9);
      if (distance <= stop || this.investigateDoor(e, point, angle)) continue;
      const speed = (e.type === 'boss' ? 150 : 124 + e.id % 5 * 13) * pace;
      if (e.type === 'boss' && this.apartment) this.advanceBrute(e, point, speed, dt);
      else this.advanceUnit(e, point, speed, dt);
    }
    this.unitsIndexed = false;
  }
  private stepHomeEscape(dt: number, run: ApartmentRun, plan: ApartmentFloor) {
    const engineer = run.engineer!, lift = this.stage.exit;
    if (run.phase === 'gear' && plan.gear && engineer.hp > 0 && dist(engineer, plan.gear) < 27) {
      run.armed = true;
      run.phase = 'rally';
      run.navigation = undefined;
      this.events.push('apartment-gear');
    }
    if (run.phase === 'rally' && this.apartmentEngineerReady() && dist(this.player, lift) < 120 && roomAt(this.player, this.rooms) === roomAt(lift, this.rooms)) {
      run.phase = 'escape-talk';
      run.timer = 3 * APARTMENT_LINE_SECONDS;
      this.events.push('apartment-escape-talk');
    } else if (run.phase === 'escape-talk' && (run.timer -= dt) <= 0.00001) {
      run.phase = 'escape';
      run.kits += 3;
      if (this.tactical.selected !== 'grenade') {
        this.tactical = newTacticalLoadout('grenade');
        this.tactical.remaining = 0;
      }
      this.tactical.remaining += 3;
      this.tactical.capacity = Math.max(this.tactical.remaining, 3);
      this.events.push('apartment-escape-supplies');
    }
  }
  private stepApartment(dt: number) {
    const run = this.apartment!, plan = this.stage.apartment!;
    if (plan.part === 'home') this.stepHomeEscape(dt, run, plan);
    if (run.phase === 'car-hold' && plan.getaway) this.stepCarDefense(dt, run, plan.getaway);
    if (run.phase === 'outside' && plan.outdoor) this.stepApartmentOutside(dt, run, plan.outdoor);
    else if (run.phase === 'entry-talk' && (run.timer += dt) >= 5 * APARTMENT_LINE_SECONDS) {
      run.phase = 'training';
      this.events.push('apartment-trap-lesson');
    }
    if (run.phase === 'hold' && run.engineer?.hp) {
      run.timer = Math.max(0, run.timer - dt);
      if (!run.timer) { run.phase = 'lift'; this.events.push('apartment-lift'); }
    }
    if (run.queue.length && (run.wave -= dt) <= 0) {
      const index = run.queue.findIndex(entry => this.canSpawn({ x: entry[1], y: entry[2] }, 185, entry[3] === 'boss' ? 25 : 16));
      if (index >= 0) this.spawnEnemy(run.queue.splice(index, 1)[0]);
      run.wave = index < 0 ? 0.35 : 0.65;
    }
    for (const trap of run.traps) {
      trap.flash = Math.max(0, trap.flash - dt);
      const enemy = trap.charge && this.enemies.find(unit => unit.hp > 0 && dist(unit, trap) < 49 && lineClear(trap, unit, this.blockers));
      if (!enemy) continue;
      trap.charge = 0; trap.flash = 0.55;
      if (trap.entrance) {
        for (const unit of this.enemies) if (unit.hp > 0 && dist(unit, trap) <= 94 && lineClear(trap, unit, this.blockers)) this.paralyze(unit, 2.4);
      } else {
        this.damageEnemy(enemy, 35); this.paralyze(enemy, 2.4);
      }
      this.emitSound(trap, 'door-interact'); this.events.push('apartment-shock');
    }
    if (run.phase === 'hold' && run.engineer?.hp && plan.shock && run.timer < 13 && run.timer > 4) {
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0 || run.shocked.has(enemy.id) || roomAt(enemy, [plan.shock]) < 0) continue;
        run.shocked.add(enemy.id); this.damageEnemy(enemy, 45); this.paralyze(enemy, 2.2);
      }
    }
    const engineer = run.engineer;
    if (!engineer || engineer.hp <= 0) return;
    engineer.hit = Math.max(0, engineer.hit - dt);
    engineer.cooldown = Math.max(0, engineer.cooldown - dt);
    engineer.muzzle = Math.max(0, engineer.muzzle - dt);
    if (engineer.knockback) { this.updateKnockback(engineer, dt, 15); return; }
    if (this.engineerArmed && run.phase !== 'car-hold' && this.fireEngineerShotgun(engineer)) return;
    this.stepEngineerMovement(dt, run, plan, engineer);
  }
  private stepEngineerMovement(dt: number, run: ApartmentRun, plan: ApartmentFloor, engineer: Ally) {
    const player = this.player;
    let goal: Point | undefined;
    if (run.phase === 'note') {
      const close = dist(engineer, player);
      run.following = close > (run.following ? 79 : 115);
      if (run.following) goal = player;
    } else if (run.phase === 'gear') goal = plan.gear;
    else if (run.phase === 'rally' || run.phase === 'escape-talk' || run.phase === 'escape') {
      goal = { x: this.stage.exit.x + 82, y: this.stage.exit.y };
    } else if (run.phase.startsWith('car-')) goal = plan.getaway?.engineer;
    else if (run.phase === 'entry-talk') goal = { x: 958, y: 930 };
    else if (run.phase === 'stairs' || run.phase === 'lift') {
      goal = plan.engineer?.route[run.route];
      if (goal && dist(engineer, goal) < 19) { run.route++; run.navigation = undefined; return; }
    }
    if (!goal || dist(engineer, goal) < 17) { run.navigation = undefined; return; }
    if (run.navigation) run.navigation.time -= dt;
    if (!run.navigation || run.navigation.time <= 0 || dist(run.navigation.point, engineer) < 10 || dist(run.navigation.goal, goal) > 52) {
      const point = this.soundWaypoint(engineer, goal);
      run.navigation = point ? { goal: { ...goal }, point: { ...point }, time: 0.46 } : undefined;
    }
    const target = run.navigation?.point;
    if (!target || dist(engineer, target) < 2) return;
    const angle = Math.atan2(target.y - engineer.y, target.x - engineer.x);
    if (this.investigateDoor(engineer, target, angle)) return;
    const before = { x: engineer.x, y: engineer.y };
    this.advanceUnit(engineer, target, 151, dt);
    if (dist(before, engineer) >= 0.4) {
      const desired = Math.atan2(engineer.y - before.y, engineer.x - before.x);
      engineer.angle += clamp(angleDiff(desired, engineer.angle), -5.5 * dt, 5.5 * dt);
    }
  }
  private fireEngineerShotgun(engineer: Ally) {
    if (engineer.muzzle > 0) return true;
    if (engineer.cooldown > 0) return false;
    let range = 220;
    let target: Enemy | undefined;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const distance = dist(engineer, enemy);
      if (distance < range && lineClear(engineer, enemy, this.blockers)) { target = enemy; range = distance; }
    }
    if (!target) return false;
    const aim = engineer.angle = Math.atan2(target.y - engineer.y, target.x - engineer.x);
    const gun = this.supportGuns[ENGINEER_ID], base = heroes[ENGINEER_ID];
    if (engineer.ammo <= 0) engineer.ammo = gun.magazine;
    for (const spread of [-0.17, -0.085, 0, 0.085, 0.17]) {
      const angle = aim + spread * gun.spread / base.spread;
      this.spawnBullet({ x: engineer.x, y: engineer.y, vx: Math.cos(angle) * 850, vy: Math.sin(angle) * 850,
        life: 0.27, damage: 9 * gun.damage / base.damage, hostile: false, push: 18 * (1 + (range < 160 ? gun.nearPush : 0)), support: true });
    }
    engineer.muzzle = 0.09;
    engineer.cooldown = --engineer.ammo <= 0 ? Math.max(1.4, gun.reload) : 1.4;
    this.emitSound(engineer, 'shotgun', gun.shotSound);
    this.events.push('support-shot');
    return true;
  }
  private placeLoot() {
    this.loot = [];
    if (this.stage.survival) { this.loot = this.stage.survival.loot.map(item => ({ ...item })); return; }
    if (this.stage.operation) {
      this.loot = this.stage.operation.drops.map(([point, kind], id) => ({ ...point, kind, id, taken: false }));
      return;
    }
    if (!this.stage.dorm && !this.stage.street && !this.stage.apartment) return;
    const preferred = this.stage.apartment?.part === 'garage' ? [0, 2, 4, 5, 4, 3]
      : this.stage.apartment?.part === 'home' ? [2, 3, 4, 7, 8, 11]
      : this.stage.apartment ? [1, 0, 2, 2, 3, 1]
      : this.stage.street ? [6, 11, 7, 10, 12, 3, 13, 8, 9, 12, 13]
      : this.stage.dorm?.number === 2 ? [1, 2, 5, 3, 4, 7, 2] : [5, 9, 4, 6, 8, 9, 1];
    const kinds: Loot['kind'][] = ['ammo', 'bandage', 'medkit', 'drink', 'coins', 'ammo', 'coins', 'ammo', 'bandage', 'drink', 'medkit'];
    if (this.workshopEnabled) kinds.push('mod-cache');
    let seed = (this.stage.dorm?.seed ?? this.stage.floorDetails?.seed ?? 1) >>> 0;
    for (let i = 0; i < kinds.length; i++) {
      const r = this.rooms[kinds[i] === 'mod-cache' ? preferred[3] : preferred[i]];
      if (!r) continue;
      const candidates: Point[] = [];
      for (let y = r.y + 55; y < r.y + r.h - 45; y += 58) for (let x = r.x + 55; x < r.x + r.w - 45; x += 58) {
        const point = { x, y };
        if (walkable(point, 20, this.blockers, this.rooms) && dist(point, this.player) > 75 &&
          !this.enemies.some(e => dist(e, point) < 60) && !this.loot.some(item => dist(item, point) < 70) &&
          (!this.pickup || dist(point, this.pickup) > 80) && (!this.stage.street?.supply || dist(point, this.stage.street.supply) > 70)) candidates.push(point);
      }
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      if (candidates.length && kinds[i]) this.loot.push({ ...candidates[seed % candidates.length], id: i, kind: kinds[i], taken: false });
    }
  }
  useSupply(kind: SupplyKind) {
    if (this.evacuationDrive || this.generatorProgress !== undefined || this.survivalDoorWork) return false;
    const p = this.player;
    if (this.status !== 'playing' || this.tutorial || this.floorPending || this.usingSupply || p.dashTime > 0 || p.knockback || p.stun > 0 || this.supplies[kind] <= 0 || kind !== 'drink' && p.hp >= p.maxHp) return false;
    this.usingSupply = { kind, time: SUPPLY_INFO[kind].duration };
    this.events.push('supply-start');
    return true;
  }
  private cancelSupply() {
    if (!this.usingSupply) return;
    this.usingSupply = undefined;
    this.survivalSupplyId = undefined;
    this.events.push('supply-cancel');
  }
  private restoreHealth(unit: Player | Ally, amount: number) {
    if (unit.hp <= 0) return 0;
    const healed = Math.min(Math.max(0, unit.maxHp - unit.hp), amount);
    if (healed <= 0) return 0;
    unit.hp += healed;
    this.recoveryFx.set(unit, 0.84);
    return healed;
  }
  private restorePlayerHealth(amount: number, bandage = false) {
    const actual = this.restoreHealth(this.player, amount);
    if (actual <= 0 || !this.stage.operation) return;
    let id = bandage ? this.bandageAlly : undefined;
    if (id === undefined) {
      const injured = this.allies.filter(ally => ally.hp > 0 && ally.hp < ally.maxHp);
      id = injured[Math.floor(Math.random() * injured.length)]?.id ?? null;
      if (bandage) this.bandageAlly = id;
    }
    const ally = this.allies.find(unit => unit.id === id);
    if (ally) this.restoreHealth(ally, actual * 0.5);
  }
  private stepSupplies(dt: number) {
    const p = this.player;
    for (const [unit, time] of this.recoveryFx) {
      if (unit.hp <= 0 || time <= dt) this.recoveryFx.delete(unit);
      else this.recoveryFx.set(unit, time - dt);
    }
    const healing = Math.min(dt, this.healingTime);
    if (healing > 0) { this.restorePlayerHealth(p.maxHp * 0.25 / 5 * healing, true); this.healingTime -= healing; }
    this.speedTime = Math.max(0, this.speedTime - dt);
    if (!this.usingSupply) return;
    this.usingSupply.time -= dt;
    if (this.usingSupply.time > 0) return;
    const kind = this.usingSupply.kind;
    this.spendIfPurchased(kind, this.supplies[kind]);
    const bag = this.survivalBag;
    if (bag) {
      const item = bag.item(this.survivalSupplyId) ?? bag.items.find(entry => entry.kind === kind);
      if (item) bag.take(item.id);
      this.updateBagCounts();
      this.survivalSupplyId = undefined;
    } else this.supplies[kind]--;
    this.usingSupply = undefined;
    if (kind === 'bandage') { this.healingTime = 5; this.bandageAlly = undefined; }
    if (kind === 'medkit') this.restorePlayerHealth(p.maxHp * 0.6);
    if (kind === 'drink') { this.restorePlayerHealth(p.maxHp * 0.1); this.speedTime = 10; }
    this.events.push('supply-used');
  }
  private spawnEnemy([room, x, y, type, appearance]: EnemySpawn) {
    const id = this.enemySequence++, hp = type === 'boss' ? 650 : type === 'spitter' ? 52 :
      type === 'gunner' ? appearance === OPERATION_MG ? 84 : 48 : 66;
    const angle = type === 'gunner' ? Math.PI : 0;
    const operationBoss = this.stage.operation?.part === 'compound' && type === 'boss' ? 'leader' as const : undefined;
    const variant = appearance ?? (type === 'gunner' && this.stage.operation ? id % 3 : undefined);
    const enemy: Enemy = { id, room, x, y, type, appearance: variant, operationBoss, hp, maxHp: hp, angle, cooldown: operationBoss ? 0.18 : 1 + id % 3 * 0.3, hit: 0, windup: 0, attackAngle: 0, stun: 0, doorBlockCount: 0 };
    const vacant = this.stage.street || this.stage.survival || this.stage.operation?.part === 'defense' || this.stage.apartment?.outdoor ? this.enemies.findIndex(e => e.hp <= 0) : -1;
    if (vacant >= 0) this.enemies[vacant] = enemy;
    else this.enemies.push(enemy);
    if (this.unitsIndexed) this.indexUnit(enemy);
    return enemy;
  }
  descend(stage: LevelDefinition): boolean {
    const apartment = this.stage.apartment;
    const next = apartment && ({ arrival: 'garage', garage: 'defense', defense: 'home', home: 'garage' } as const)[apartment.part];
    const returning = apartment?.part === 'home';
    const target = stage.apartment;
    const valid = apartment ? !!target && target.part === next && target.seed === apartment.seed &&
      (!returning || this.apartment?.phase === 'escape' && !!target.getaway)
      : stage.dorm?.number === 1 && stage.dorm.seed === this.stage.dorm?.seed;
    if (!this.floorPending || this.status !== 'playing' || !valid) return false;
    const snapshot = returning ? this.garageSnapshot : undefined;
    this.previousRooms += this.countVisited() - (snapshot ? snapshot.visited.filter((seen, i) => seen && i !== roomAt(stage.spawn, stage.rooms)).length : 0);
    this.previousClears = this.clearedTotal - (snapshot?.cleared.filter(Boolean).length ?? 0);
    if (apartment?.part === 'garage' && this.apartment?.phase === 'return') {
      const { doors, loot, enemies, bloodStains, visited, discovered, alerted, cleared } = this;
      this.garageSnapshot = { doors, loot, enemies, bloodStains, visited, discovered, alerted, cleared,
        explored: this.minimap.explored, traps: this.apartment.traps };
    }
    this.changeFloor(stage);
    if (returning) this.returnToGarage(snapshot);
    return true;
  }
  private changeFloor(stage: LevelDefinition) {
    this.bullets = []; this.particles = []; this.bloodStains = []; this.deathFragments = [];
    this.tacticalThrows = []; this.tacticalEffects = []; this.plantedMines = []; this.sounds = []; this.events = [];
    this.recoveryFx.clear();
    this.doorForceCooldown.clear(); this.doorAttempts.clear(); this.doorSoundTime.clear();
    this.flowTime = 0; this.perceptionTime = 0; this.footstepTime = 0;
    this.floorPending = false;
    this.setupFloor(stage);
  }
  advanceOperation(stage: LevelDefinition): boolean {
    const part = this.stage.operation?.part;
    const next = part === 'city' ? 'compound' : part === 'compound' ? 'defense' : undefined;
    if (!next || stage.operation?.part !== next || !this.operationRun?.ready || this.status !== 'playing') return false;
    this.previousRooms += this.countVisited();
    this.previousClears = this.clearedTotal;
    this.changeFloor(stage);
    Object.assign(this.player, { reload: 0, fire: 0, stun: 0, hit: 0, invulnerable: 0 });
    this.usingSupply = undefined;
    if (next === 'defense') {
      this.player.hp = this.player.maxHp;
      this.player.ammo = this.hero.magazine;
      this.reserveAmmo = this.hero.magazine * this.hero.reserveMagazines;
      this.healingTime = this.speedTime = 0;
      this.supplies = { bandage: 0, medkit: 1, drink: 0 };
    }
    return true;
  }
  private operationAirTarget(origin: Point) {
    const targets = this.enemies.filter(enemy => enemy.hp > 0 && dist(origin, enemy) <= OPERATION_AIR_VISION && this.operationAirExposed(enemy) &&
      (this.sees(enemy, 32) || this.allies.some(ally => ally.hp > 0 && dist(ally, enemy) < 460 && lineClear(ally, enemy, this.blockers))));
    let best: Enemy | undefined, score = -Infinity;
    for (const enemy of targets) {
      if ([this.player, ...this.allies].some(unit => unit.hp > 0 && dist(enemy, unit) < 85)) continue;
      const value = 105 * targets.filter(other => dist(enemy, other) <= 122).length - 0.36 * dist(origin, enemy);
      if (value > score) { best = enemy; score = value; }
    }
    return best;
  }
  useOperationSupport() {
    const run = this.operationRun;
    if (!run?.airSupport || run.air || run.airCooldown > 0 || this.stage.operation?.interiors.some(room => roomAt(this.player, [room]) >= 0) ||
        run.phase === 'landing' || run.phase === 'boarding' || run.ready || this.status !== 'playing' || this.player.hp <= 0) return false;
    const from = { x: this.player.x - 960, y: this.player.y + 142 };
    const to = { x: this.player.x - 55, y: this.player.y + 86 };
    const heading = Math.atan2(to.y - from.y, to.x - from.x);
    run.air = { ...from, mode: 'inbound', from, to, time: 0, duration: 3.35, heading, targetHeading: heading,
      nextBurst: 0, nextSearch: 0, burst: 0, podFlash: [0, 0] };
    this.events.push('operation-air-request');
    return true;
  }
  private fireOperationAir(air: OperationAirFlight) {
    const dx = Math.cos(air.heading), dy = Math.sin(air.heading);
    const sweep = clamp(air.time / air.duration, 0, 1);
    const burst = air.burst++;
    const { side: spacing, forward, flashTime } = OPERATION_AIR_PODS;
    const aimed = air.contact && air.contact.hp > 0 && burst % 2 === 0 ?
      Math.max(0, (air.contact.x - air.x) * dx + (air.contact.y - air.y) * dy - forward + 20) : 0;
    const limit = Math.min(OPERATION_AIR_RANGE, Math.max(aimed, 292 + sweep * 246 + (burst % 3) * 18));
    let fired = false;
    for (const [index, side] of [-1, 1].entries()) {
      const from = { x: air.x + dx * forward + dy * side * spacing, y: air.y + dy * forward - dx * side * spacing };
      const path = rayDistance(from, air.heading, limit, this.blockers);
      if (path <= 4) continue;
      const inLane = (point: Point) => {
        const x = point.x - from.x, y = point.y - from.y, along = x * dx + y * dy;
        return along >= -32 && along <= path + 32 && Math.abs(y * dx - x * dy) <= 34;
      };
      if ([this.player, ...this.allies].some(unit => unit.hp > 0 && inLane(unit) && lineClear(from, unit, this.blockers))) continue;
      air.podFlash[index] = flashTime;
      fired = true;
      const speed = 1840;
      this.spawnBullet({ ...from, vx: dx * speed, vy: dy * speed, life: limit / speed,
        damage: 11, hostile: false, firearm: true, support: true, push: 0, airSupport: true });
      for (let i = 0; i < 4; i++) {
        const drift = 76 + Math.random() * 82, fall = 0.28 + Math.random() * 0.27;
        this.particles.push({ x: from.x - dx * 12, y: from.y - dy * 12,
          vx: dx * (i * 24 - 67) + dy * side * drift, vy: dy * (i * 24 - 67) - dx * side * drift,
          life: fall, max: fall, kind: 'air-case', z: 22 + i * 3, vz: 30 + i * 10, rotation: Math.random() * TAU,
          spin: side * (10 + i * 5) });
      }
    }
    if (fired) {
      this.events.push('operation-air-burst');
      this.emitSound(air, 'rifle');
    }
  }
  private stepOperationAir(dt: number) {
    const run = this.operationRun!;
    run.grenadeDelay = Math.max(0, run.grenadeDelay - dt);
    run.airCooldown = Math.max(0, run.airCooldown - dt);
    const air = run.air;
    if (!air) return;
    air.podFlash[0] = Math.max(0, air.podFlash[0] - dt);
    air.podFlash[1] = Math.max(0, air.podFlash[1] - dt);
    if (air.onStation !== undefined && air.mode !== 'outbound' && (air.onStation = Math.min(OPERATION_AIR_DURATION, air.onStation + dt)) >= OPERATION_AIR_DURATION) {
      this.exitOperationAir(air, Math.cos(air.heading) > -0.15 ? 1 : -1);
    }
    air.time = Math.min(air.duration, air.time + dt);
    const t = air.time / air.duration;
    const eased = t * t * (3 - 2 * t);
    const travel = air.mode === 'outbound' ? t ** 2 : air.mode === 'sweep' ? eased * 0.68 + t * 0.32 : eased;
    air.x = air.from.x + (air.to.x - air.from.x) * travel;
    air.y = air.from.y + (air.to.y - air.from.y) * travel;
    air.heading += clamp(angleDiff(air.targetHeading, air.heading), -dt * 2.65, dt * 2.65);
    if (air.mode === 'sweep') {
      air.nextBurst -= dt;
      if (air.nextBurst <= 0 && Math.abs(angleDiff(air.targetHeading, air.heading)) < 0.12) {
        this.fireOperationAir(air);
        air.nextBurst += 0.095;
      }
    }
    if ((air.mode === 'search' && t >= 0.16) || air.mode === 'sweep') {
      air.nextSearch -= dt;
      if (air.nextSearch <= 0) {
        air.nextSearch = 0.24;
        const target = this.operationAirTarget(air);
        const course = target ? Math.atan2(target.y - air.y, target.x - air.x) : air.heading;
        if (target && (air.mode === 'search' || Math.abs(angleDiff(course, air.heading)) >= 0.24)) {
          this.engageOperationAir(air, target);
          return;
        }
        if (!target && air.mode === 'sweep') air.time = air.duration;
      }
    }
    if (air.time < air.duration) return;
    if (air.mode === 'outbound') {
      run.air = undefined;
      run.airCooldown = OPERATION_AIR_COOLDOWN;
      return;
    }
    air.onStation ??= 0;
    const from = { x: air.x, y: air.y };
    const target = this.operationAirTarget(air);
    if (!target) {
      const east = Math.max(...this.rooms.map(room => room.x + room.w)) - 130;
      const x = Math.min(east, air.x + 480);
      const y = x <= air.x + 50 ? (air.y < this.player.y + 90 ? this.player.y + 420 : this.player.y - 350) :
        air.y + clamp(this.player.y - air.y, -108, 108);
      const to = { x, y: clamp(y, 95, Math.max(...this.rooms.map(room => room.y + room.h)) - 95) };
      Object.assign(air, { mode: 'search', from, to, time: 0, duration: 3.65, nextSearch: 0.12,
        targetHeading: Math.atan2(to.y - from.y, to.x - from.x) });
      return;
    }
    this.engageOperationAir(air, target);
  }
  private engageOperationAir(air: OperationAirFlight, target: Enemy) {
    const from = { x: air.x, y: air.y }, distance = dist(from, target);
    const heading = Math.atan2(target.y - from.y, target.x - from.x);
    const dx = Math.cos(heading), dy = Math.sin(heading);
    const { side, forward } = OPERATION_AIR_PODS;
    const hasLane = (point: Point) => [-1, 1].some(sign => {
      const nose = Math.min(forward, Math.max(0, dist(point, target) - 8));
      return lineClear({ x: point.x + dx * nose + dy * sign * side, y: point.y + dy * nose - dx * sign * side },
        { x: target.x + dy * sign * side, y: target.y - dx * sign * side }, this.blockers);
    });
    if (distance > OPERATION_AIR_RANGE || Math.abs(angleDiff(heading, air.heading)) >= 0.18 || !hasLane(from)) {
      let to = from;
      if (distance > OPERATION_AIR_RANGE) {
        const advance = distance - OPERATION_AIR_RANGE + 26;
        to = { x: from.x + dx * advance, y: from.y + dy * advance };
      } else if (!hasLane(from)) {
        const options = [110, -110, 170, -170].map(offset => ({ x: from.x - dy * offset, y: from.y + dx * offset }));
        to = options.find(point => roomAt(point, this.rooms) >= 0 && dist(point, target) <= OPERATION_AIR_RANGE && hasLane(point)) ?? from;
      }
      Object.assign(air, { mode: 'align', from, to, time: 0,
        duration: Math.max(0.35, Math.abs(angleDiff(heading, air.heading)) / 2.5, dist(from, to) / 240),
        targetHeading: heading, nextSearch: 0.16 });
      return;
    }
    const advance = clamp((distance - 115) * 0.63, 0, 230);
    Object.assign(air, { mode: 'sweep', from, to: { x: from.x + dx * advance, y: from.y + dy * advance }, contact: target,
      time: 0, duration: 2.18, targetHeading: heading, nextBurst: 0.035, nextSearch: 0.24, burst: 0 });
  }
  private exitOperationAir(air: OperationAirFlight, sign: -1 | 1) {
    const from = { x: air.x, y: air.y }, edge = this.player.x + sign * 1060;
    const to = { x: sign > 0 ? Math.max(edge, air.x + 500) : Math.min(edge, air.x - 500), y: air.y + 140 };
    air.onStation ??= 0;
    Object.assign(air, { from, to, time: 0, duration: clamp(dist(from, to) / 640, 1.2, 3.25),
      mode: 'outbound', targetHeading: Math.atan2(to.y - from.y, to.x - from.x) });
  }
  private stepOperation(dt: number) {
    const plan = this.stage.operation, run = this.operationRun;
    if (!plan || !run || run.ready) return;
    run.phaseTime = this.operationRadioBusy && run.phase !== 'injection' ? 0 : run.phaseTime + dt;
    this.stepOperationAir(dt);
    if (plan.part === 'compound') {
      if (this.operationMutationFlash && (this.operationMutationFlash.life -= dt) <= 0) this.operationMutationFlash = undefined;
      if (run.phase === 'injection' && run.phaseTime >= OPERATION_INJECTION_DURATION) this.completeOperationInjection();
      if (!run.kingEscaped) {
        const leader = this.enemies.find(e => e.operationBoss === 'leader');
        if (leader && leader.hp <= 0 && run.phase === 'leader-fight') this.resolveOperationBoss(leader);
      }
      const king = this.enemies.find(e => e.operationBoss === 'king' && e.hp > 0);
      if (king) this.stepKingSlam(king, dt);
      if (run.kingEscaped && run.phase === 'king-escape') run.phase = 'new-order';
    }
    const quiet = !this.operationRadioBusy && run.phaseTime >= 1.5;
    if (plan.part === 'city') {
      const p = this.player;
      const entering = dist(p, this.stage.exit) <= OPERATION_COMMAND_RADIUS;
      const sector = entering ? plan.encounters.length - 1 : plan.encounters.reduce((latest, encounter, index) =>
        dist(p, encounter.center) <= encounter.radius || this.enemies.some(enemy => enemy.operationSector === index &&
          enemy.hp > 0 && dist(p, enemy) <= OPERATION_APPROACH_RADIUS && lineClear(p, enemy, this.blockers)) ? index : latest, -1);
      if (sector > run.sector) {
        run.sector = sector;
        run.phase = (['line1', 'line2', 'line3'] as const)[sector];
        run.phaseTime = 0;
        this.events.push(['operation-first-contact', 'operation-market', 'operation-emplacement'][sector]);
      }
      if (this.exitReady && entering) {
        run.phase = 'breach';
        run.ready = !this.operationRadioBusy && run.phaseTime >= 0.35;
      }
      return;
    }
    if (plan.part === 'compound') {
      run.ready = this.exitReady && dist(this.player, this.stage.exit) <= OPERATION_WEST_DOOR_RADIUS;
      if (run.ready) run.phase = 'complete';
      return;
    }
    const distance = dist(this.player, this.stage.exit);
    if (run.phase === 'retreat' && distance <= OPERATION_EXTRACT_RADIUS) run.phase = 'hold';
    if (run.phase === 'hold' && run.hold > 0) {
      run.hold = Math.max(0, run.hold - dt);
      if (run.hold === 0) {
        run.phase = 'pickup';
        run.extraction = { pickupTime: 0 };
        this.events.push('operation-board');
      }
    }
    if (quiet && !run.announced && (run.phaseTime >= 5 || run.phase === 'hold')) {
      run.announced = true;
      run.phaseTime = 0;
      this.events.push('operation-announcement');
    } else if (quiet && run.announced && run.phase === 'hold' && !run.holdReported) {
      run.holdReported = true;
      this.events.push('operation-hold');
    }
    if (run.extraction) {
      const before = run.extraction.pickupTime;
      run.extraction.pickupTime += dt;
      if (before < OPERATION_PICKUP_READY && run.extraction.pickupTime >= OPERATION_PICKUP_READY) {
        this.events.push('operation-rope-ready');
      }
    }
    run.wave -= dt;
    if (run.wave > 0 || this.enemies.filter(e => e.hp > 0).length >= OPERATION_ENEMY_CAP) return;
    const holding = run.phase === 'hold' || run.phase === 'pickup', lz = this.stage.exit;
    const sector = holding && run.hold >= 10 ? run.cursor % 3 : -1;
    const inSector = (point: Point) => sector < 0 ||
      (sector === 0 ? point.x - lz.x > 420 : sector === 1 ? point.y - lz.y < -180 : point.y - lz.y > 180);
    for (let i = 0; i < plan.reinforcements.length; i++) {
      const spawn = plan.reinforcements[(run.cursor + i) % plan.reinforcements.length];
      if (!inSector(spawn) || dist(spawn, this.player) > 1100 || !this.canSpawn(spawn, 285, 16, OPERATION_SPAWN_SIGHT_CAP)) continue;
      run.cursor += i + 1;
      this.spawnEnemy([0, spawn.x, spawn.y, 'walker', run.cursor % 4]);
      run.wave = holding ? run.hold < 10 ? 0.3 : 0.45 : 0.8;
      return;
    }
    run.cursor++;
    run.wave = 0.25;
  }
  private returnToGarage(snapshot?: GarageSnapshot) {
    const run = this.apartment!, plan = this.stage.apartment!.getaway!;
    if (snapshot) {
      const { explored, traps, ...floor } = snapshot;
      Object.assign(this, floor);
      this.minimap.explored.set(explored);
      run.traps = traps;
      this.bloodRevision++;
    }
    this.garageSnapshot = undefined;
    run.phase = 'car-prep';
    const ally = { ...plan.arrival, x: plan.arrival.x + 69, id: -50, slot: 0, hp: 120, maxHp: 120, angle: -Math.PI / 2,
      cooldown: 0, ammo: 0, burst: 0, hit: 0, muzzle: 0 };
    run.engineer = ally;
    this.allies = [ally];
    Object.assign(this.player, plan.arrival, { angle: -Math.PI / 2 });
    this.visited[roomAt(plan.arrival, this.rooms)] = true;
    this.minimapSight = undefined;
    this.syncGeometry();
    this.updateMinimap();
  }
  private countVisited() {
    const spawnRoom = roomAt(this.stage.spawn, this.rooms);
    return this.visited.filter((v, i) => v && i !== spawnRoom).length;
  }
  get operationAirSight() {
    const air = this.operationRun?.air;
    if (!air || air.onStation === undefined) return undefined;
    const intensity = air.mode === 'outbound' ? clamp(1 - air.time / air.duration, 0, 1) :
      clamp(air.onStation / 0.26, 0, 1);
    return intensity > 0 ? { x: air.x, y: air.y, radius: OPERATION_AIR_VISION * Math.sqrt(intensity), intensity } : undefined;
  }
  private operationAirExposed(point: Point) {
    const plan = this.stage.operation;
    return !!plan && roomAt(point, this.rooms) >= 0 &&
      !plan.interiors.some(room => circleRect(point, 0.1, room)) &&
      !this.stage.walls.some(wall => wall.kind === 'op-roof' && circleRect(point, 0.1, wall));
  }
  operationAirSees(point: Point, sight = this.operationAirSight) {
    return !!sight && dist(sight, point) <= sight.radius && this.operationAirExposed(point);
  }
  sees(point: Point, extraRange = 0) {
    const p = this.player;
    const evacuationView = this.evacuationViewRadius;
    if (evacuationView) return dist(p, point) <= evacuationView + extraRange && lineClear(p, point, this.visionBlockers);
    return this.operationAirSees(point) || (p.hp > 0 && visible(p, p.angle, point, this.visionBlockers, this.playerVisionRange + extraRange)) ||
      this.allies.some(ally => ally.hp > 0 && visible(ally, ally.angle, point, this.visionBlockers, this.allyVisionRange + extraRange)) ||
      this.grenadeLights.some(light => dist(light, point) <= GRENADE_LIGHT_RADIUS && lineClear(light, point, this.visionBlockers));
  }
  private updateMinimap() {
    const p = this.player, old = this.minimapSight, allies = this.allies.filter(ally => ally.hp > 0);
    const lights = this.grenadeLights, air = this.operationAirSight, oldAir = this.minimapAirSight;
    const unchanged = (a: Point & { angle: number }, b: Point & { angle: number }) =>
      dist(a, b) < (this.stage.survival ? 14 : 6) && Math.abs(angleDiff(a.angle, b.angle)) < (this.stage.survival ? .065 : .04);
    const airUnchanged = air && oldAir ? dist(air, oldAir) < 10 && Math.abs(air.radius - oldAir.radius) < 10 : !air && !oldAir;
    if (old && old.geometry === this.geometryRevision && unchanged(old, p) && airUnchanged &&
      allies.length === this.minimapAllies.length && allies.every((ally, i) => unchanged(ally, this.minimapAllies[i])) &&
      lights.length === this.minimapGrenadeLights.length && lights.every((light, i) => light === this.minimapGrenadeLights[i])) return;
    this.minimapSight = { x: p.x, y: p.y, angle: p.angle, geometry: this.geometryRevision };
    this.minimapAllies = allies.map(({ x, y, angle }) => ({ x, y, angle }));
    this.minimapGrenadeLights = lights;
    this.minimapAirSight = air;
    const map = this.minimap, size = MINIMAP_CELL_SIZE;
    for (const index of this.minimapVisible) map.visible[index] = 0;
    this.minimapVisible.length = 0;
    for (const unit of [...(p.hp > 0 ? [p] : []), ...allies, ...lights]) {
      const range = 'angle' in unit ? unit === p ? this.playerVisionRange : this.allyVisionRange : GRENADE_LIGHT_RADIUS;
      for (let y = Math.max(0, Math.floor((unit.y - range) / size)); y < Math.min(map.rows, Math.ceil((unit.y + range) / size)); y++) {
        for (let x = Math.max(0, Math.floor((unit.x - range) / size)); x < Math.min(map.columns, Math.ceil((unit.x + range) / size)); x++) {
          const index = y * map.columns + x;
          if (map.visible[index]) continue;
          const point = { x: (x + 0.5) * size, y: (y + 0.5) * size };
          if (roomAt(point, this.rooms) < 0 || ('angle' in unit ? !visible(unit, unit.angle, point, this.visionBlockers, range) :
            dist(unit, point) > range || !lineClear(unit, point, this.visionBlockers))) continue;
          map.visible[index] = map.explored[index] = 1;
          this.minimapVisible.push(index);
        }
      }
    }
    if (air) for (let y = Math.max(0, Math.floor((air.y - air.radius) / size)); y < Math.min(map.rows, Math.ceil((air.y + air.radius) / size)); y++) {
      for (let x = Math.max(0, Math.floor((air.x - air.radius) / size)); x < Math.min(map.columns, Math.ceil((air.x + air.radius) / size)); x++) {
        const index = y * map.columns + x;
        if (map.visible[index] || !this.operationAirSees({ x: (x + 0.5) * size, y: (y + 0.5) * size }, air)) continue;
        map.visible[index] = map.explored[index] = 1;
        this.minimapVisible.push(index);
      }
    }
    map.revision++;
  }
  private canSpawn(point: Point, minDistance: number, radius = 16, sightCap = Infinity) {
    const p = this.player;
    const seen = (p.hp > 0 && visible(p, p.angle, point, this.visionBlockers, Math.min(this.playerVisionRange, sightCap) + radius)) ||
      this.allies.some(ally => ally.hp > 0 && visible(ally, ally.angle, point, this.visionBlockers, Math.min(this.allyVisionRange, sightCap) + radius)) ||
      this.grenadeLights.some(light => dist(light, point) <= GRENADE_LIGHT_RADIUS && lineClear(light, point, this.visionBlockers));
    return dist(p, point) >= minDistance && !seen && !this.operationAirSees(point) &&
      walkable(point, radius, this.blockers, this.rooms) && this.unitSpaceFree(point, radius);
  }
  private spawnBullet(spec: Bullet) {
    const bullet = this.bulletPool.pop();
    const initial = { firearm: undefined, push: undefined, nearPush: undefined, shot: undefined,
      trainingAuto: undefined, support: undefined, airSupport: undefined, traveled: 0, range: spec.life * Math.hypot(spec.vx, spec.vy) };
    this.bullets.push(Object.assign(bullet ?? {}, initial, spec));
  }
  private updateAlarm(dt: number) {
    const street = this.stage.street;
    const p = this.player;
    if (this.alarmTime === null) {
      const door = this.doors.find(d => d.alarm);
      if (street ? roomAt(p, [street.trigger]) < 0 : !door || !door.destroyed && Math.abs(door.angle - door.baseAngle) < 0.55) return;
      this.alarmTime = 0;
      this.alarmPulse = 1.35;
      this.alarmSource = street?.alarm ?? { x: door!.x + Math.cos(door!.baseAngle) * door!.length / 2, y: door!.y + Math.sin(door!.baseAngle) * door!.length / 2 };
      const waves = street?.waves ?? this.stage.dorm?.alarmWaves ?? [];
      this.reinforcements = waves.flatMap(wave => wave.entries.map(spawn => ({ delay: wave.delay, spawn })));
      if (street) {
        this.streamTimes = [4.6, 5.8, 7];
        this.streamCursors = [0, 0, 0];
      }
      this.gridDirty = true;
      this.emitSound(this.alarmSource, 'alarm');
      this.events.push(street ? 'street-alarm' : 'alarm');
    }
    this.alarmTime += dt;
    const source = this.alarmSource!;
    if (this.alarmTime >= this.alarmPulse && this.alarmTime <= 10.8) {
      this.alarmPulse += 1.35;
      this.emitSound(source, 'alarm');
      if (street && dist(p, source) < SOUND_PROFILES.alarm.radius) this.events.push('street-alarm-pulse');
    }
    const activeLimit = street ? STREET_NEARBY_LIMIT : 8;
    let alive = this.enemies.filter(e => e.hp > 0).length;
    let active = this.enemies.filter(e => e.hp > 0 && (street ? dist(e, p) < 850 : this.alerted[e.room] || e.alarmInvestigation)).length;
    this.reinforcements = this.reinforcements.filter(({ delay, spawn }) => {
      if (this.alarmTime! < delay || active >= activeLimit || street && alive >= STREET_ENEMY_LIMIT) return true;
      const [, x, y] = spawn, point = { x, y };
      if (!this.canSpawn(point, street ? 215 : 330, 17)) return true;
      const enemy = this.spawnEnemy(spawn);
      if (!street) this.investigateSound(enemy, source, 'alarm', dist(enemy, source), true);
      active++;
      alive++;
      this.events.push('reinforcement');
      return false;
    });
    if (!street) return;
    for (const [index, entries] of street.streams.entries()) {
      if (this.alarmTime < this.streamTimes[index]) continue;
      const cursor = this.streamCursors[index]++;
      this.streamTimes[index] = this.alarmTime + 3.3 + (cursor * 7 + index * 3) % 8 * 0.21;
      if (alive >= STREET_ENEMY_LIMIT || active >= activeLimit) continue;
      for (let offset = 0; offset < entries.length; offset++) {
        const spawn = entries[(cursor + offset) % entries.length];
        if (!this.canSpawn({ x: spawn[1], y: spawn[2] }, 245, 17)) continue;
        this.spawnEnemy(spawn);
        alive++; active++;
        this.events.push('reinforcement');
        break;
      }
    }
  }
  private syncGeometry() {
    const fixed = this.obstacles;
    const moving = this.doors.filter(d => !d.destroyed).map(d => doorShape(d));
    this.blockers = fixed.concat(moving);
    const apartmentGlass = this.stage.apartment?.glass;
    this.visionBlockers = this.stage.survival ? this.blockers.filter(blocker => blocker.kind !== 'survival-window' && blocker.kind !== 'harbor-water')
      : apartmentGlass ? this.blockers.filter(blocker => blocker !== apartmentGlass) : this.blockers;
    if (this.stage.survival) {
      this.harborStaticIndex ??= { movement: bucketHarborRects(fixed),
        sight: bucketHarborRects(fixed.filter(r => r.kind !== 'survival-window' && r.kind !== 'harbor-water')) };
      const leafIndex = bucketHarborRects(moving);
      harborBlockIndex.set(this.blockers, [this.harborStaticIndex.movement, leafIndex]);
      harborBlockIndex.set(this.visionBlockers, [this.harborStaticIndex.sight, leafIndex]);
    }
    this.geometryRevision++; this.gridDirty = true;
    this.soundFlows.clear();
    this.flowTime = Math.min(this.flowTime, 0.12);
  }
  private alertRoom(room: number) {
    if (room < 0 || room >= this.rooms.length) return;
    this.discovered[room] = true;
    if (this.alerted[room]) return;
    this.alerted[room] = true;
    let living = false;
    for (const e of this.enemies) if (e.room === room && e.hp > 0) { e.cooldown = Math.max(e.cooldown, 0.35); living = true; }
    if (living) this.events.push('alert');
  }
  private alertDoorRooms(door: Door) { for (const room of door.rooms) this.alertRoom(room); }
  private investigateSound(e: Enemy, source: Point, kind: string, distance: number, nearby: boolean) {
    const alarm = kind === 'alarm';
    e.soundOnly = true;
    e.hearingAlert = nearby;
    e.alarmInvestigation = alarm;
    e.investigate = { ...source };
    e.investigateTime = alarm ? Math.max(9, distance / 65 + 6)
      : kind === 'rifle' && (distance > 360 || !lineClear(e, source, this.blockers)) ? distance / 62 + 5 : nearby ? 4 : 1.6;
    e.searchTime = 0;
    e.cooldown = Math.max(e.cooldown, 0.35);
  }
  private perceive() {
    if (this.stage.street && this.alarmTime !== null) return;
    const tuning = this.survival ? this.survivalSearchProfile : undefined;
    const p = this.player, detectionRange = 360 * this.visionScale * (tuning?.sight ?? 1);
    if (this.stage.survival?.stairs.length) this.perceiveSurvivalStairs();
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const distance = dist(e, p);
      if (this.stage.operation && distance > Math.max(850, this.playerVisionRange * 1.1)) continue;
      if (distance <= Math.max(detectionRange, this.playerVisionRange) && lineClear(e, p, this.stage.survival ? this.visionBlockers : this.blockers)) {
        if (distance <= sightRange(Math.atan2(e.y - p.y, e.x - p.x), p.angle, this.playerVisionRange)) this.discovered[e.room] = true;
        if (distance <= detectionRange && Math.abs(angleDiff(Math.atan2(p.y - e.y, p.x - e.x), e.angle)) <= Math.PI * (tuning?.cone ?? .32)) { e.investigate = undefined; e.hearingAlert = false; e.alarmInvestigation = false; e.lastSeen = { x: p.x, y: p.y }; e.combatMemory = tuning?.memory ?? 3; e.soundOnly = false; this.alertRoom(e.room); continue; }
      }
      // Room alert is shared history, not a grant to ignore a sound snapshot.
      // An enemy that has actually seen the player retains a short pursuit memory.
      if ((e.combatMemory || 0) > 0) continue;
      const heard = this.sounds.filter(sound => {
        if (e.investigate && (sound.type === 'door-break' || sound.type !== 'alarm' && sound.intensity < 0.7)) return false;
        return true;
      }).map(sound => hearSoundThroughGeometry(e, tuning && tuning.hearing > 1 ? { ...sound, radius: sound.radius * tuning.hearing } : sound,
        this.blockers, rayRect, id => this.doors[id]?.material))
        .filter(sound => sound && sound.effectiveIntensity >= (tuning?.threshold ?? .08)).sort((a, b) => b!.effectiveIntensity - a!.effectiveIntensity)[0];
      if (heard) this.investigateSound(e, heard.position, heard.type, heard.distance, heard.distance <= 220 && heard.effectiveIntensity >= 0.32);
    }
  }
  /** Visible clues are discoverable in the strict cone; interaction adds the short reach check. */
  visibleClues() {
    if (this.tutorial || this.floorPending || this.status !== 'playing') return [];
    return (this.stage.clues ?? []).filter(clue => visible(this.player, this.player.angle, clue.surface, this.blockers, this.stats.visionRange));
  }
  nearbyClue() {
    return this.visibleClues().filter(clue => dist(this.player, clue.surface) <= clue.radius)
      .sort((a, b) => dist(this.player, a.surface) - dist(this.player, b.surface))[0];
  }
  investigateClue(profile: Profile) {
    const clue = this.nearbyClue();
    if (!clue) return undefined;
    const result = recordClue(profile.achievements, profile.clues, clue.id);
    profile.achievements = result.achievements; profile.clues = result.clues;
    return { clue, first: result.first };
  }
  nearbyDoor(p: Point = this.player, reach = 94): Door | undefined {
    let nearest: Door | undefined, best = reach;
    for (const d of this.doors) {
      if (d.destroyed) continue;
      if (this.survival && p === this.player) {
        const distance = this.survivalDoorDistance(d, best);
        if (distance < best) { nearest = d; best = distance; }
        continue;
      }
      const q = closestOnRect(p, doorShape(d)), distance = dist(p, q);
      if (distance < best && lineClear(p, q, this.blockers.filter(r => r.kind !== 'door:' + d.id))) { nearest = d; best = distance; }
    }
    return nearest;
  }
  private openDoor(d: Door, actor: Point) {
    if (this.survival?.timed && actor !== this.player && (d.fortification === 'reinforced' || d.fortification === 'isolation')) return;
    const side = Math.cos(d.baseAngle) * (actor.y - d.y) - Math.sin(d.baseAngle) * (actor.x - d.x);
    d.openAngle = d.baseAngle + (side >= 0 ? -1 : 1) * Math.PI / 2;
    d.target = d.openAngle;
    // Opening reveals the room, but never broadcasts the player's position.
    for (const room of d.rooms) this.discovered[room] = true;
    if (actor !== this.player) this.emitSound({ x: d.x + Math.cos(d.baseAngle) * d.length / 2, y: d.y + Math.sin(d.baseAngle) * d.length / 2 }, 'door-open');
    if (actor === this.player) this.requestDoorClear(d);
  }
  private requestDoorClear(d: Door) {
    const sweep = Array.from({ length: 49 }, (_, i) => doorShape(d, d.angle + (d.target - d.angle) * i / 48));
    const source = { x: d.x + Math.cos(d.baseAngle) * d.length / 2, y: d.y + Math.sin(d.baseAngle) * d.length / 2 };
    const sound = makeSoundEvent(source, SOUND_PROFILES['door-interact'].intensity, 'door-interact', SOUND_PROFILES['door-interact'].radius);
    for (const e of this.enemies) {
      const r = e.type === 'boss' ? 26 : 16;
      if (e.hp <= 0 || e.forceOpen || e.doorClearTime !== undefined || !sweep.some(s => circleRect(e, r + 5, s))) continue;
      const heard = hearSoundThroughGeometry(e, sound, this.blockers, rayRect, id => this.doors[id]?.material);
      if (!heard || heard.effectiveIntensity < 0.015) continue;
      // Plan an entire collision-safe path, preferring a short retreat/side step
      // that clears the whole requested sweep, not a step towards the sound.
      let best: Point | undefined, bestScore = Infinity;
      for (const length of [36, 60, 90, 125]) for (let i = 0; i < 24; i++) {
        const a = i * TAU / 24, end = { x: e.x + Math.cos(a) * length, y: e.y + Math.sin(a) * length };
        if (sweep.some(s => circleRect(end, r + 7, s))) continue;
        const steps = Math.ceil(length / 3);
        if (!Array.from({ length: steps }, (_, j) => ({ x: e.x + (end.x - e.x) * (j + 1) / steps, y: e.y + (end.y - e.y) * (j + 1) / steps })).every(q =>
          walkable(q, r, this.blockers, this.rooms) && dist(q, this.player) > r + 17 && !this.enemies.some(other => other !== e && other.hp > 0 && dist(q, other) < r + (other.type === 'boss' ? 26 : 16)))) continue;
        const score = length - Math.min(30, dist(end, source) - dist(e, source));
        if (score < bestScore) { bestScore = score; best = end; }
      }
      e.doorClearId = d.id; e.doorClearTime = 1.5; e.doorClearPoint = best;
      e.windup = 0;
    }
  }
  private stepDoorClear(e: Enemy, dt: number): boolean {
    if (e.doorClearTime === undefined) return false;
    e.doorClearTime -= dt;
    if (e.doorClearTime <= 0) {
      e.doorClearTime = undefined; e.doorClearId = undefined; e.doorClearPoint = undefined;
      return false;
    }
    const q = e.doorClearPoint;
    if (q && dist(e, q) > 1) {
      const length = dist(e, q), step = Math.min(length, 105 * dt);
      e.angle = Math.atan2(q.y - e.y, q.x - e.x);
      this.move(e, (q.x - e.x) / length * step, (q.y - e.y) / length * step, e.type === 'boss' ? 26 : 16);
    }
    e.windup = 0;
    return true;
  }
  nearbyObjective() {
    const p = this.player;
    if (this.survivalAtConvoy) return { id: 'survival-board' as const, name: '装甲车队' };
    const vehicle = this.survivalVehicleAtPlayer();
    if (vehicle) return { id: 'survival-vehicle' as const, vehicle, name: EVAC_VEHICLES[vehicle].name };
    if (this.survivalAtRadio) return { id: 'survival-radio' as const, name: '工事电台' };
    if (this.survivalAtWorkbench) return { id: 'survival-workbench' as const, name: '工事工作台' };
    const extraction = this.operationRun?.extraction;
    if (this.operationRun?.phase === 'pickup' && extraction && extraction.pickupTime >= OPERATION_PICKUP_READY &&
        dist(p, this.operationRopePoint) <= OPERATION_BOARD_RADIUS && lineClear(p, this.operationRopePoint, this.blockers)) {
      return { id: 'operation-board' as const, name: '抓住绳索登机' };
    }
    const apartment = this.nearbyApartmentStation();
    if (apartment) return apartment;
    if (this.stage.dorm?.number === 2 && this.doors.some(d => d.key === 'stairs' && !d.locked) && dist(p, this.stage.exit) < 78 && lineClear(p, this.stage.exit, this.blockers)) return { id: 'descend' as const, name: '前往一楼' };
    return undefined;
  }
  nearbyPickup() {
    const p = this.player, key = this.pickup;
    if (key && dist(p, key) < 72 && lineClear(p, key, this.blockers)) return key;
    const field = this.survivalField.find(item => dist(p, item) < 58 && lineClear(p, item, this.blockers) && this.sees(item));
    if (field) return { id: 'survival-loot' as const, field, name: SURVIVAL_GEAR[field.kind][0] + ' · 拾取' };
    const item = this.loot.find(item => !item.taken && dist(p, item) < 58 && lineClear(p, item, this.blockers) && this.sees(item));
    if (item) return { id: 'loot' as const, item, name: item.kind === 'ammo' ? '弹药 · 拾取' : item.kind === 'coins' ? this.survival ? '战利品 · 拾取' : '金币 · 拾取' : item.kind === 'mod-cache' ? this.survival ? '维修件 · 拾取' : '配件箱 · 拾取' : SUPPLY_INFO[item.kind].name + ' · 拾取' };
    const supply = this.streetSupply;
    if (supply && dist(p, supply) < 58 && lineClear(p, supply, this.blockers)) return { id: 'street-supply' as const, name: `${supply.name} · 恢复 35 生命` };
    return undefined;
  }
  private canInteract() {
    const p = this.player;
    return !this.tutorial && !this.evacuationDrive && this.status === 'playing' && !this.floorPending &&
      this.generatorProgress === undefined && !p.knockback && p.dashTime <= 0 && p.stun <= 0;
  }
  interact(): boolean {
    if (!this.canInteract() || this.survivalDoorWork) return false;
    const target = this.nearbyObjective();
    if (!target) return this.interactDoor();
    if (target.id === 'survival-board') return this.boardSurvival('convoy');
    if (target.id === 'survival-vehicle') return this.survivalVehicleStatus(target.vehicle).ready ? this.boardSurvival(target.vehicle) : true;
    if (target.id === 'survival-radio' || target.id === 'survival-workbench') return true;
    if (target.id === 'apartment') return this.useApartmentStation(target.station);
    if (target.id === 'operation-board') { this.beginOperationBoarding(); return true; }
    this.floorPending = true;
    this.events.push('descend');
    return true;
  }
  private beginOperationBoarding() {
    const run = this.operationRun!, rope = this.operationRopePoint;
    const group = [...this.allies.filter(unit => unit.hp > 0).sort((a, b) => dist(a, rope) - dist(b, rope)), this.player];
    const actors = group.map((unit, index): OperationBoarder => {
      const point = unit === this.player ? { x: rope.x + 32, y: rope.y - 36 } :
        { x: rope.x + 54 + index * 35, y: rope.y + (index % 2 ? 39 : -22) };
      const rally = walkable(point, 16, this.blockers, this.rooms) && lineClear(point, rope, this.blockers) ? point : rope;
      const start = dist(unit, rope) < 275 && lineClear(unit, rally, this.blockers) ? unit : rally;
      return { id: 'id' in unit ? unit.id : 0, x: start.x, y: start.y, angle: unit.angle, rally };
    });
    run.phase = 'boarding';
    run.extraction!.boarding = { time: 0, actors };
    if (run.air && run.air.mode !== 'outbound') this.exitOperationAir(run.air, 1);
    this.bullets.length = 0;
    this.tacticalThrows.length = 0;
    this.events.push('operation-boarding');
  }
  collectPickup(): boolean {
    this.survivalPickupBlocked = undefined;
    if (!this.canInteract() || this.survivalPlacement) return false;
    const target = this.nearbyPickup();
    if (!target) return false;
    if (target.id === 'survival-loot') {
      const count = this.survivalBag?.give(target.field);
      if (!count) { this.reportSurvivalPickupSpace(target.field.kind); return false; }
      if ((target.field.count -= count) === 0) this.survivalField = this.survivalField.filter(item => item !== target.field);
      this.updateBagCounts();
      this.events.push('loot');
      return true;
    }
    if (target.id === 'loot') {
      const item = target.item;
      const run = this.survival;
      if (run && item.kind !== 'ammo' && item.kind !== 'coins') {
        if (!this.survivalBag?.give({ kind: item.kind, count: 1 })) { this.reportSurvivalPickupSpace(item.kind); return false; }
        this.updateBagCounts();
      }
      if (run && item.kind === 'coins') run.salvage += 20;
      else if (item.kind === 'ammo' && this.survivalSpecialActive) this.survivalBaseReserve += this.baseGun.magazine * 2;
      else if (item.kind === 'ammo') this.reserveAmmo += this.hero.magazine * (run ? 2 : 1);
      else if (item.kind === 'coins') this.coins += 20;
      else if (!run && item.kind === 'mod-cache') { this.modCaches++; this.events.push('mod-cache'); }
      else if (!run && item.kind !== 'mod-cache') {
        if (this.supplies[item.kind] >= this.supplyLimit) { this.events.push('supply-full'); return false; }
        this.supplies[item.kind]++;
      }
      item.taken = true;
      this.events.push('loot');
      return true;
    }
    if (target.id === 'street-supply') {
      if (this.player.hp >= this.player.maxHp) return false;
      this.restorePlayerHealth(35);
      this.streetSupplyTaken = true;
      this.events.push('street-supply');
      return true;
    }
    this.keys.add(target.id); this.events.push('key-pickup');
    return true;
  }
  private reportSurvivalPickupSpace(kind: GearKind) {
    const [width, height] = this.survivalBag!.size(kind, false);
    this.survivalPickupBlocked = { kind, width, height };
    this.events.push('supply-full');
  }
  interactDoor(): boolean {
    if (this.status !== 'playing' || this.player.knockback || this.survivalDoorWork) return false;
    const d = this.nearbyDoor() ?? this.doors.filter(door => !door.destroyed).map(door => ({ door, distance: dist(this.player, closestOnRect(this.player, doorShape(door))) })).filter(item => item.distance < 94).sort((a, b) => a.distance - b.distance)[0]?.door;
    if (!d) return false;
    if (!this.nearbyDoor(this.player, 94)) {
      this.emitDoorInteract(d, false);
      if (d.blocked <= 0) { d.blocked = 0.7; this.events.push('door-geometry-blocked'); }
      return false;
    }
    if (d.locked && d.key) {
      if (!this.keys.has(d.key)) { this.emitDoorInteract(d, false); this.events.push(d.key === 'stairs' ? 'stairs-locked' : 'exit-locked'); return false; }
      d.locked = false; this.gridDirty = true;
      this.events.push('unlock');
    }
    const closing = Math.abs(d.target - d.baseAngle) >= 0.01;
    const side = Math.cos(d.baseAngle) * (this.player.y - d.y) - Math.sin(d.baseAngle) * (this.player.x - d.x);
    const target = closing ? d.baseAngle : d.baseAngle + (side >= 0 ? -1 : 1) * Math.PI / 2;
    const obstacles = this.obstacles.filter(r => r.kind !== 'jamb' && circleRect(d, d.length + 24, r));
    const adjacentDoors = this.doors.filter(other => other !== d && !other.destroyed && dist(d, other) < d.length + other.length + 24);
    const hardBlocked = Array.from({ length: 65 }, (_, i) => doorShape(d, d.angle + (target - d.angle) * i / 64, 18)).some(shape =>
      obstacles.some(r => rectIntersects(shape, r)) || adjacentDoors.some(other => rectIntersects(shape, doorShape(other))));
    if (hardBlocked || !this.nearbyDoor(this.player, 94)) {
      this.emitDoorInteract(d, false);
      if (d.blocked <= 0) { d.blocked = 0.7; this.events.push('door-geometry-blocked'); }
      return false;
    }
    this.emitDoorInteract(d, true);
    if (!closing) this.openDoor(d, this.player);
    else { d.target = d.baseAngle; this.requestDoorClear(d); }
    this.events.push('door-use'); return true;
  }
  damageDoor(d: Door, damage: number): boolean {
    if (d.destroyed) return false;
    d.hit = 0.12;
    if (d.material === 'steel' && !d.fortification) { this.emit(d, 3, 'spark'); return false; }
    d.hp = Math.max(0, d.hp - Math.max(0, damage));
    if (d.hp <= 0) {
      d.destroyed = true;
      this.emit({ x: d.x + Math.cos(d.angle) * d.length / 2, y: d.y + Math.sin(d.angle) * d.length / 2 }, 18,
        d.fortification && d.fortification !== 'wood' ? 'spark' : 'wood');
      this.events.push('door-break'); this.syncGeometry(); this.alertDoorRooms(d); this.emitSound(d, 'door-break');
    }
    return true;
  }
  private updateDoors(dt: number) {
    let changed = false;
    for (const d of this.doors) {
      d.hit = Math.max(0, d.hit - dt); d.blocked = Math.max(0, d.blocked - dt);
      // Hold only the impacting leaf until its planned exit completes. Other
      // doors retain full actor collision, including the moving player.
      if (d.destroyed || this.player.knockback?.doorId === d.id || Math.abs(d.target - d.angle) < 0.001) continue;
      const change = clamp(d.target - d.angle, -dt * 3.4, dt * 3.4), steps = Math.max(1, Math.ceil(Math.abs(change) / 0.025));
      const obstacles = this.obstacles.filter(r => r.kind !== 'jamb' && circleRect(d, d.length + 24, r));
      const adjacentDoors = this.doors.filter(other => other !== d && !other.destroyed && dist(d, other) < d.length + other.length + 24);
      for (let i = 0; i < steps; i++) {
        const next = d.angle + change / steps, shape = doorShape(d, next);
        const attempting = this.doorAttempts.get(d.id);
        const k = this.player.knockback;
        // Reserve the remaining exit corridor against other moving leaves too;
        // otherwise a door could enter it after planning and strand the player.
        const reservedExit = k?.doorId !== undefined && Array.from({ length: 29 }, (_, j) => ({ x: this.player.x + (k.end.x - this.player.x) * j / 28, y: this.player.y + (k.end.y - this.player.y) * j / 28 })).some(q => circleRect(q, 18, shape));
        const blockedByActor = this.player.hp > 0 && (circleRect(this.player, 17, shape) || !!reservedExit) ||
          this.enemies.some(e => e !== attempting && e.hp > 0 && circleRect(e, e.type === 'boss' ? 26 : 16, shape)) ||
          this.allies.some(ally => ally.hp > 0 && circleRect(ally, 15, shape));
        const blockedBySelf = !!attempting && circleRect(attempting, attempting.type === 'boss' ? 26 : 16, shape);
        // The first 18px are the hinge recess; permit contact there with the jamb.
        const blockedByWall = obstacles.some(r => rectIntersects(doorShape(d, next, 18), r));
        const blockedByDoor = adjacentDoors.some(other => rectIntersects(shape, doorShape(other)));
        if (blockedByActor || blockedBySelf || blockedByWall || blockedByDoor) {
          if (attempting) {
            this.doorAttempts.delete(d.id);
            const hardSweep = Array.from({ length: 65 }, (_, j) => doorShape(d, d.angle + (d.target - d.angle) * j / 64, 18)).some(s =>
              obstacles.some(r => rectIntersects(s, r)) || adjacentDoors.some(other => rectIntersects(s, doorShape(other))));
            if (blockedByActor && !blockedBySelf && !blockedByWall && !blockedByDoor && !hardSweep) {
              attempting.doorBlockCount = attempting.doorBlockId === d.id ? (attempting.doorBlockCount || 0) + 1 : 1;
              attempting.doorBlockId = d.id;
              if (attempting.doorBlockCount >= 3 && !this.doorForceCooldown.has(d.id)) { attempting.forceOpen = 0.45; this.events.push('door-warning'); }
            } else { attempting.doorBlockCount = 0; attempting.doorBlockId = undefined; }
          }
          const closing = Math.abs(d.target - d.baseAngle) < 0.01;
          if (!attempting && blockedByActor && !blockedByWall && !blockedByDoor) this.requestDoorClear(d);
          const yielding = !attempting && !blockedByWall && !blockedByDoor && this.enemies.some(e => e.hp > 0 && e.doorClearId === d.id && e.doorClearPoint && (e.doorClearTime || 0) > 0);
          if (!yielding) d.target = closing ? d.openAngle : d.angle;
          if (d.blocked <= 0) { d.blocked = 0.7; this.events.push('door-blocked'); }
          break;
        }
        d.angle = next; changed = true;
      }
    }
    if (changed) this.syncGeometry();
  }
  private unitKey(x: number, y: number) {
    return Math.floor(x / UNIT_CELL_SIZE) + Math.floor(y / UNIT_CELL_SIZE) * 4096;
  }
  private indexUnit(unit: Unit) {
    const key = this.unitKey(unit.x, unit.y);
    let bucket = this.unitBuckets.get(key);
    if (!bucket) {
      bucket = this.unitBucketPool.pop() ?? [];
      this.unitBuckets.set(key, bucket);
    }
    bucket.push(unit);
  }
  private indexUnits(includeSquad = true) {
    for (const bucket of this.unitBuckets.values()) {
      bucket.length = 0;
      this.unitBucketPool.push(bucket);
    }
    this.unitBuckets.clear();
    if (includeSquad && this.player.hp > 0) this.indexUnit(this.player);
    for (const unit of this.enemies) if (unit.hp > 0) this.indexUnit(unit);
    if (includeSquad) for (const unit of this.allies) if (unit.hp > 0) this.indexUnit(unit);
    this.unitsIndexed = true;
  }
  private moveUnitIndex(unit: Unit, from: number) {
    if (!this.unitsIndexed || from === this.unitKey(unit.x, unit.y)) return;
    const bucket = this.unitBuckets.get(from);
    const i = bucket?.indexOf(unit) ?? -1;
    if (i >= 0) bucket!.splice(i, 1);
    this.indexUnit(unit);
  }
  private unitSpaceFree(point: Point, radius: number, mover?: Unit, allowLeaving = false, pushing?: Unit) {
    const open = (unit: Unit) => {
      if (unit === mover || unit === pushing || unit.hp <= 0) return true;
      const center = unit === this.player && this.player.dashTime > 0 ? this.rollLanding : unit;
      if (!center) return true;
      const min = radius + unitRadius(unit);
      const dx = center.x - point.x, dy = center.y - point.y;
      if (dx * dx + dy * dy >= min * min - 0.001) return true;
      return !!mover && allowLeaving && dist(point, center) > dist(mover, center);
    };
    if (!this.unitsIndexed) return [this.player, ...this.enemies, ...this.allies].every(open);
    const reach = radius + 25;
    for (let y = Math.floor((point.y - reach) / UNIT_CELL_SIZE); y <= Math.floor((point.y + reach) / UNIT_CELL_SIZE); y++) {
      for (let x = Math.floor((point.x - reach) / UNIT_CELL_SIZE); x <= Math.floor((point.x + reach) / UNIT_CELL_SIZE); x++) {
        const bucket = this.unitBuckets.get(x + y * 4096);
        if (bucket && !bucket.every(open)) return false;
      }
    }
    // While rolling, the player can pass through units but keeps a free landing point.
    return mover === this.player || this.player.dashTime <= 0 || open(this.player);
  }
  private yieldToLargeUnit(mover: Unit, point: Point, radius: number) {
    if (radius < 24) return false;
    const occupants = this.unitsIndexed ? new Set<Unit>() : new Set<Unit>([this.player, ...this.enemies, ...this.allies]);
    const reach = radius + 25;
    if (this.unitsIndexed) {
      for (let y = Math.floor((point.y - reach) / UNIT_CELL_SIZE); y <= Math.floor((point.y + reach) / UNIT_CELL_SIZE); y++) {
        for (let x = Math.floor((point.x - reach) / UNIT_CELL_SIZE); x <= Math.floor((point.x + reach) / UNIT_CELL_SIZE); x++) {
          for (const unit of this.unitBuckets.get(x + y * 4096) ?? []) occupants.add(unit);
        }
      }
      if (this.player.dashTime > 0) occupants.add(this.player);
    }
    const displacements: { unit: Unit; next: Point }[] = [];
    for (const unit of occupants) {
      if (unit === mover || unit.hp <= 0) continue;
      const otherRadius = unitRadius(unit), separation = radius + otherRadius;
      const center = unit === this.player && this.player.dashTime > 0 ? this.rollLanding : unit;
      if (!center || dist(point, center) >= separation || dist(point, center) > dist(mover, center)) continue;
      if (otherRadius * 1.4 > radius || unit.knockback || center !== unit) return false;
      const away = Math.atan2(unit.y - point.y, unit.x - point.x);
      const gap = separation - dist(point, unit);
      let next: Point | undefined;
      for (const turn of [0, 0.65, -0.65]) {
        const distance = (gap + 0.65) / Math.cos(turn);
        const dx = Math.cos(away + turn) * distance, dy = Math.sin(away + turn) * distance;
        const candidate = { x: unit.x + dx, y: unit.y + dy };
        if (displacements.some(push => dist(push.next, candidate) < otherRadius + unitRadius(push.unit))) continue;
        const samples = Math.ceil(distance / 3);
        let clear = true;
        for (let i = 1; i <= samples; i++) {
          const sample = { x: unit.x + dx * i / samples, y: unit.y + dy * i / samples };
          if (!this.insideOutdoorBoundary(unit, sample, otherRadius) || !walkable(sample, otherRadius, this.blockers, this.rooms) ||
              !this.unitSpaceFree(sample, otherRadius, unit, true, mover)) { clear = false; break; }
        }
        if (clear) { next = candidate; break; }
      }
      if (!next) return false;
      displacements.push({ unit, next });
    }
    if (!displacements.length) return false;
    for (const { unit, next } of displacements) {
      const from = this.unitKey(unit.x, unit.y);
      Object.assign(unit, next);
      this.moveUnitIndex(unit, from);
    }
    return true;
  }
  private move(p: Unit, dx: number, dy: number, radius: number, rolling = false) {
    // Substeps stop fast dodge movement passing through thin walls.
    if (Math.abs(dx) + Math.abs(dy) < 0.0001) return;
    const from = this.unitKey(p.x, p.y);
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 8));
    for (let i = 0; i < steps; i++) {
      for (const [x, y] of [[dx / steps, 0], [0, dy / steps]]) {
        const point = { x: p.x + x, y: p.y + y };
        if (this.insideOutdoorBoundary(p, point, radius) && walkable(point, radius, this.blockers, this.rooms) &&
            (rolling || this.tutorial || this.unitSpaceFree(point, radius, p, true) || this.yieldToLargeUnit(p, point, radius))) Object.assign(p, point);
      }
      if (rolling && this.unitSpaceFree(p, radius, p)) this.rollLanding = { x: p.x, y: p.y };
    }
    this.moveUnitIndex(p, from);
  }
  private insideOutdoorBoundary(unit: Unit, point: Point, radius: number) {
    if ('type' in unit) {
      const safe = this.stage.apartment?.safeRoom;
      if (safe !== undefined && circleRect(point, radius, this.rooms[safe])) return false;
    }
    const outdoor = this.stage.apartment?.outdoor;
    return !outdoor || !('type' in unit) || unit.room !== outdoor.room || point.y >= outdoor.entry.y + radius + 9;
  }
  private advanceUnit(unit: Enemy | Ally, target: Point, speed: number, dt: number) {
    const length = dist(unit, target);
    if (length < 0.1) return;
    const startX = unit.x, startY = unit.y, step = Math.min(length, speed * dt);
    const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
    const radius = unitRadius(unit);
    this.move(unit, Math.cos(angle) * step, Math.sin(angle) * step, radius);
    if (Math.hypot(unit.x - startX, unit.y - startY) >= step * 0.35) return;
    for (const side of unit.id % 2 ? [1, -1] : [-1, 1]) {
      const turn = angle + side * Math.PI / 3;
      this.move(unit, Math.cos(turn) * step, Math.sin(turn) * step, radius);
      if (Math.hypot(unit.x - startX, unit.y - startY) >= step * 0.35) break;
    }
  }
  private finishRoll() {
    const p = this.player, radius = unitRadius(p);
    if (!this.unitSpaceFree(p, radius, p)) {
      const from = this.unitKey(p.x, p.y);
      let safe: Point | undefined;
      for (const distance of [12, 24, 36]) {
        for (const turn of [0, 1, -1, 2, -2, Math.PI]) {
          const angle = Math.atan2(p.dashY, p.dashX) + turn;
          const point = { x: p.x + Math.cos(angle) * distance, y: p.y + Math.sin(angle) * distance };
          if (this.unitSpaceFree(point, radius, p) && [0.25, 0.5, 0.75, 1].every(t =>
            walkable({ x: p.x + (point.x - p.x) * t, y: p.y + (point.y - p.y) * t }, radius, this.blockers, this.rooms))) { safe = point; break; }
        }
        if (safe) break;
      }
      if (safe ?? this.rollLanding) Object.assign(p, safe ?? this.rollLanding);
      this.moveUnitIndex(p, from);
    }
    this.rollLanding = undefined;
  }
  private pushFromHit(actor: Unit, { angle, distance }: DamageImpact) {
    if (distance <= 0 || 'operationBoss' in actor && actor.operationBoss === 'king') return;
    const humanLeader = 'type' in actor && actor.operationBoss === 'leader' ? actor : undefined;
    const keepsAim = !!humanLeader && distance < 52;
    if (humanLeader && keepsAim && (actor.knockback || (humanLeader.leaderNextRecoil ?? 0) > this.elapsed)) return;
    const strength = keepsAim ? Math.min(7, distance * 0.18) : 'type' in actor && actor.type === 'boss' ? distance * 0.55 : distance;
    const previous = actor.knockback;
    if (previous && (previous.doorId !== undefined || strength <= dist(previous.start, previous.end) + 0.01)) return;
    if (humanLeader) {
      if (keepsAim) humanLeader.leaderNextRecoil = this.elapsed + 0.42;
      else { humanLeader.windup = 0; humanLeader.leaderBurst = false; humanLeader.leaderTarget = undefined; }
    }
    actor.knockback = {
      keepsAim, start: { x: actor.x, y: actor.y },
      end: { x: actor.x + Math.cos(angle) * strength, y: actor.y + Math.sin(angle) * strength },
      elapsed: 0, duration: clamp(0.09 + strength * 0.002, 0.11, 0.25),
    };
  }
  private updateKnockback(p: Unit, dt: number, radius: number) {
    const k = p.knockback;
    if (!k) return;
    const elapsed = Math.min(k.duration, k.elapsed + dt);
    const progress = 1 - (1 - elapsed / k.duration) ** 2;
    const next = { x: k.start.x + (k.end.x - k.start.x) * progress, y: k.start.y + (k.end.y - k.start.y) * progress };
    const steps = Math.max(1, Math.ceil(dist(p, next) / 2));
    const from = { x: p.x, y: p.y };
    for (let i = 1; i <= steps; i++) {
      const q = { x: from.x + (next.x - from.x) * i / steps, y: from.y + (next.y - from.y) * i / steps };
      const leaf = k.doorId === undefined ? undefined : this.doors[k.doorId];
      const overlap = !!leaf && !leaf.destroyed && circleRect(q, radius, doorShape(leaf));
      // Exception is scoped to this preplanned segment and initial leaf exit.
      // Once clear, the triggering door becomes solid again; never ignore walls.
      const solid = k.exiting ? this.blockers.filter(r => r.kind !== 'door:' + k.doorId) : this.blockers;
      if (!this.insideOutdoorBoundary(p, q, radius) || !walkable(q, radius, solid, this.rooms) || !this.unitSpaceFree(q, radius, p, true)) {
        if (k.doorId === undefined) p.knockback = undefined;
        return;
      }
      const key = this.unitKey(p.x, p.y);
      Object.assign(p, q);
      this.moveUnitIndex(p, key);
      if (!overlap) k.exiting = false;
    }
    k.elapsed = elapsed;
    if (elapsed >= k.duration - 1e-9) p.knockback = undefined;
  }
  reload() { const p = this.player; if (this.status === 'playing' && !this.evacuationDrive && !this.survivalDoorWork && this.generatorProgress === undefined && !p.knockback && (this.reserveAmmo > 0 || this.tutorial) && p.ammo < this.hero.magazine && p.reload <= 0) { p.reload = this.hero.reload; this.events.push('reload'); } }
  dodge(x: number, y: number) {
    if (this.evacuationDrive) return false;
    const p = this.player;
    if (this.tutorial || this.status !== 'playing' || p.knockback || p.dash > 0 || p.stun > 0) return;
    this.cancelSupply();
    this.cancelGeneratorWork();
    const len = Math.hypot(x, y);
    p.dashX = len > 0.1 ? x / len : Math.cos(p.angle); p.dashY = len > 0.1 ? y / len : Math.sin(p.angle);
    this.rollLanding = { x: p.x, y: p.y };
    p.dash = 2.4; p.dashTime = ROLL_DURATION; p.invulnerable = 0.28; this.events.push('dash');
  }
  private emit(p: Point, n: number, kind: string, owner?: number) {
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, speed = 35 + Math.random() * 130; this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 0.2 + Math.random() * 0.3, max: 0.5, kind, owner }); }
  }
  private shedBlood(p: Unit, impact?: DamageImpact) {
    const active = this.particles.reduce((total, particle) => total + Number(particle.kind === 'hit-blood' || particle.kind === 'hit-fabric'), 0);
    const heavy = impact?.heavy ?? (impact?.distance ?? 0) >= 52;
    const angle = impact?.angle ?? p.angle + Math.PI;
    const contact = impact?.point ?? p;
    const blood = heavy ? 7 : 4, count = blood + (heavy ? 5 : 3);
    const owner = 'id' in p ? p.id : undefined;
    for (let i = 0; i < Math.min(count, 96 - active); i++) {
      const direction = angle + (i / (count - 1) - 0.5) * (heavy ? 1.75 : 1.05) + (Math.random() - 0.5) * 0.16;
      const dx = Math.cos(direction), dy = Math.sin(direction);
      const size = (i < blood ? 2.4 : 1.6) + Math.random() * (heavy ? 2.8 : 1.8);
      const speed = (heavy ? 220 : 162) + Math.random() * 102, life = .23 + Math.random() * .16;
      this.particles.push({ x: contact.x, y: contact.y, vx: dx * speed, vy: dy * speed,
        life, max: life, kind: i < blood ? 'hit-blood' : 'hit-fabric', owner, size,
        rotation: Math.random() * TAU });
    }
  }
  private operationInjecting(enemy: Enemy) {
    return this.operationRun?.phase === 'injection' && this.operationRun.bossId === enemy.id;
  }
  private resolveOperationBoss(e: Enemy) {
    const run = this.operationRun;
    if (!run || run.kingEscaped || run.phase === 'complete' || run.phase === 'king-escape' || run.phase === 'new-order') return;
    e.hp = 0; e.hit = e.windup = 0; e.knockback = undefined; e.charge = undefined;
    if (e.operationBoss === 'leader') {
      if (run.phase !== 'leader-fight') return;
      run.bossId = e.id;
      run.phase = 'injection';
      run.phaseTime = 0;
      this.events.push('operation-injection');
    } else {
      run.kingEscaped = true;
      run.phase = 'king-escape';
      this.events.push('operation-king-escape');
    }
  }
  completeOperationInjection() {
    const run = this.operationRun;
    if (run?.phase !== 'injection') return false;
    const leader = this.enemies.find(e => e.id === run.bossId && e.operationBoss === 'leader');
    if (!leader) return false;
    for (const ally of this.allies) if (ally.hp > 0) this.hurtAlly(ally, 24, { angle: 0, distance: 0 });
    run.survivors = this.allies.filter(ally => ally.hp > 0).length;
    const king = this.spawnEnemy([leader.room, leader.x, leader.y, 'boss']);
    king.operationBoss = 'king';
    king.hp = king.maxHp = 1100;
    king.angle = leader.angle;
    run.bossId = king.id;
    run.phase = 'king-fight';
    run.phaseTime = 0;
    run.slam = -2.5;
    this.operationMutationFlash = { x: leader.x, y: leader.y, life: 0.24 };
    return true;
  }
  private stepKingSlam(king: Enemy, dt: number) {
    const run = this.operationRun;
    if (!run) return;
    if (run.slam > 0) {
      const before = run.slam;
      run.slam += dt;
      if (before < 0.55 && run.slam >= 0.55) {
        const impact = { angle: Math.atan2(this.player.y - king.y, this.player.x - king.x), distance: 96 };
        for (const unit of [this.player, ...this.allies]) {
          if (unit.hp <= 0 || dist(king, unit) > 190 || !lineClear(king, unit, this.blockers)) continue;
          if (unit === this.player) this.hurt(38, impact);
          else this.hurtAlly(unit as Ally, 38, impact);
        }
        this.bruteFootfalls.push({ x: king.x, y: king.y });
        this.events.push('operation-slam');
      }
      if (run.slam >= 0.78) run.slam = -4.2;
    } else {
      run.slam = Math.min(0, run.slam + dt);
      if (run.slam === 0 && !king.charge && dist(king, this.player) < 310 && lineClear(king, this.player, this.blockers)) run.slam = 0.0001;
    }
  }
  private damageEnemy(e: Enemy, damage: number, impact?: DamageImpact, playerKill = true) {
    if (e.hp <= 0 || damage <= 0) return;
    this.alertRoom(e.room);
    if (!e.lastSeen) {
      const source = playerKill ? this.player : this.allies.find(ally => ally.hp > 0) ?? this.player;
      this.investigateSound(e, source, 'hit', dist(e, source), true);
    }
    e.hp = Math.max(0, e.hp - damage); e.hit = 0.12; this.events.push('hit');
    if (e.hp <= 0) {
      if (e.operationBoss) { this.resolveOperationBoss(e); return; }
      if (playerKill) {
        this.kills++;
        if (this.survival?.timed) {
          this.survival.pool.coins += e.survivalVariant === 'breaker' ? 4 : 1;
          if (e.survivalVariant === 'breaker' || this.kills % 6 === 0) this.survival.pool.materials++;
        }
      }
      e.hit = e.windup = 0; e.knockback = undefined;
      this.emitDeath(e, impact);
      this.events.push('kill');
    } else if (impact?.shot === undefined || impact.shot !== e.lastHitShot) {
      e.lastHitShot = impact?.shot;
      this.shedBlood(e, impact);
      if (impact) this.pushFromHit(e, impact);
    }
  }
  private emitDeath(unit: Enemy | Ally, impact?: DamageImpact) {
    this.particles = this.particles.filter(f => f.owner !== unit.id);
    const seed = (Math.random() * 0x7fffffff) | 0;
    let state = seed;
    const rand = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    const ally = 'slot' in unit, large = 'type' in unit && unit.type === 'boss';
    const heavy = impact?.heavy ?? (impact?.distance ?? 0) >= 52;
    const tint = ally ? '#536b5d' : '#67604b';
    const angle = impact?.angle ?? unit.angle + Math.PI;
    if (!heavy) {
      this.deathFragments.push({ x: unit.x, y: unit.y, vx: Math.cos(angle) * 28, vy: Math.sin(angle) * 28,
        life: .26, max: .26, kind: 'fall', size: large ? 17 : 13, rotation: unit.angle, spin: 3.2, tint });
    }
    const count = (large ? 15 : 11) + (heavy ? 6 : 0);
    for (let i = 0; i < count; i++) {
      const a = i < count * .65 ? angle + (rand() - .5) * (heavy ? 2.5 : 1.9) : rand() * TAU;
      const speed = (heavy ? 145 : 80) + rand() * (heavy ? 210 : 135);
      const life = .86 + rand() * (heavy ? .62 : .43);
      const kind = i % 4 === 0 ? 'blood' : i % 4 === 1 ? 'gear' : 'body';
      const size = kind === 'blood' ? 2 + rand() * 2.5 : (heavy || large ? 5.2 : 3.8) + rand() * 4.5;
      this.deathFragments.push({ x: unit.x, y: unit.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        life, max: life, kind, size, rotation: rand() * TAU, spin: (rand() - .5) * 16,
        z: 4, vz: (heavy ? 125 : 91) + rand() * 84, tint });
    }
    if (this.deathFragments.length > 128) this.deathFragments.splice(0, this.deathFragments.length - 128);
    const stain: BloodStain = { x: unit.x, y: unit.y, radius: (large ? 35 : 23) * (0.88 + rand() * 0.24), seed: seed >>> 0, angle: rand() * TAU, drops: 3 + Math.floor(rand() * 5), outline: [], droplets: [] };
    let shapeState = stain.seed;
    const shapeRand = () => { shapeState = (Math.imul(shapeState, 1664525) + 1013904223) >>> 0; return shapeState / 4294967296; };
    const c = Math.cos(stain.angle!), s = Math.sin(stain.angle!);
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * TAU, r = stain.radius * (0.68 + shapeRand() * 0.38), x = Math.cos(a) * r, y = Math.sin(a) * r * 0.77;
      const dx = x * c - y * s, dy = x * s + y * c, d = Math.hypot(dx, dy), length = Math.max(0, rayDistance(stain, Math.atan2(dy, dx), d, this.blockers) - 1);
      stain.outline!.push({ x: stain.x + dx / d * length, y: stain.y + dy / d * length });
    }
    for (let i = 0; i < stain.drops!; i++) {
      const a = shapeRand() * TAU, d = stain.radius * (1.15 + shapeRand() * 0.9), radius = 1.3 + shapeRand() * 2.4;
      const q = { x: stain.x + Math.cos(a) * d, y: stain.y + Math.sin(a) * d * 0.8 }, distance = dist(stain, q);
      if (walkable(q, radius, this.blockers, this.rooms) && rayDistance(stain, Math.atan2(q.y - stain.y, q.x - stain.x), distance, this.blockers) >= distance) stain.droplets!.push({ ...q, radius });
    }
    this.addBloodStain(stain);
  }
  private addBloodStain(stain: BloodStain) {
    this.bloodStains.push(stain);
    if (this.stage.street && this.bloodStains.length > 96) this.bloodStains.shift();
    this.bloodRevision++;
  }
  private hurtAlly(ally: Ally, damage: number, impact: DamageImpact) {
    if (ally.hp <= 0) return;
    ally.hp = Math.max(0, ally.hp - damage);
    ally.hit = 0.12;
    if (ally.hp <= 0) {
      ally.knockback = undefined;
      if (ally === this.apartment?.engineer) { this.events.push('engineer-down'); return; }
      this.emitDeath(ally, impact);
    } else {
      this.shedBlood(ally, impact);
      this.pushFromHit(ally, impact);
    }
  }
  private hurt(damage: number, impact: DamageImpact = { angle: this.player.angle + Math.PI, distance: 27 }) {
    const p = this.player;
    if (this.status !== 'playing' || damage <= 0 || p.invulnerable > 0 || p.hp <= 0) return;
    this.cancelSupply();
    this.cancelGeneratorWork();
    const fort = this.stage.survival && roomAt(p, [this.stage.survival.fort]) >= 0 && this.doors.slice(0, 2).some(d => !d.destroyed);
    p.hp = Math.max(0, p.hp - damage * (1 - this.protection) * (fort ? .75 : 1)); p.invulnerable = 0.65; p.hit = 0.22; this.events.push('hurt');
    this.lastHurtAngle = impact.angle;
    this.shedBlood(p, impact);
    if (!p.hp) {
      this.status = 'lost'; p.hit = p.dashTime = 0; p.knockback = undefined;
      this.addBloodStain({ x: p.x, y: p.y, radius: 25, seed: 7919 });
    } else {
      if (p.dashTime > 0) { p.dashTime = 0; this.finishRoll(); }
      this.pushFromHit(p, impact);
    }
  }
  revivePlayer(): boolean {
    const p = this.player;
    if (this.status !== 'lost' || p.hp > 0 || this.rewardClaimed || this.revivalCharges <= 0) return false;
    this.spendIfPurchased('adrenaline', this.revivalCharges);
    this.revivalCharges--;
    this.status = 'playing';
    p.hp = Math.ceil(p.maxHp * 0.30);
    p.invulnerable = 1.5; p.hit = p.stun = 0; p.knockback = undefined;
    return true;
  }
  // Current keys/unlocks are instantaneous. Future held unlock/deploy sets this
  // reason while active; it must not be cancelled by either firing mode.
  shootingBlockedReason = '';
  shootBlockReason(): string {
    const p = this.player;
    return this.status !== 'playing' || p.hp <= 0 ? '非战斗状态' : this.floorPending ? '换层中' : this.survivalPlacement ? '安装哨械枪' :
      this.survivalDoorWork ? '门位施工中' : this.shootingBlockedReason ||
      (this.generatorProgress !== undefined ? '操作中' : p.knockback ? '击退中' : p.stun > 0 ? '硬直中' : p.dashTime > 0 ? '翻滚中' : p.reload > 0 ? '换弹中' : '');
  }
  canShoot(): boolean { return !this.shootBlockReason() && this.player.fire <= 0 && this.player.ammo > 0; }
  aimCandidates() {
    const p = this.player;
    return this.enemies.filter(e => e.hp > 0 && this.sees(e) && lineClear(p, e, this.blockers))
      .map(e => ({ id: e.id, angle: Math.atan2(e.y - p.y, e.x - p.x) }));
  }
  autoFireTarget(): Enemy | undefined {
    const p = this.player, dx = Math.cos(p.angle), dy = Math.sin(p.angle);
    let nearest = rayDistance(p, p.angle, this.hero.range, this.blockers), target: Enemy | undefined;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const x = e.x - p.x, y = e.y - p.y, along = x * dx + y * dy, r = e.type === 'boss' ? 29 : 18;
      const side2 = x * x + y * y - along * along;
      if (side2 > r * r || along + r < 0) continue;
      const entry = Math.max(0, along - Math.sqrt(Math.max(0, r * r - side2)));
      if (entry < nearest) { nearest = entry; target = e; }
    }
    return target && this.sees(target) && lineClear(p, target, this.blockers) ? target : undefined;
  }
  private shoot(trainingAuto = false, moving = false) {
    const p = this.player, h = this.hero;
    if (this.shootBlockReason()) return;
    if (p.ammo <= 0) { if (this.reserveAmmo <= 0 && !this.tutorial) this.events.push('ammo-empty'); else this.reload(); return; }
    if (!this.canShoot()) return;
    p.ammo--; p.fire = this.stats.interval * h.interval / this.baseGun.interval; this.events.push('shoot');
    if (!this.tutorial) this.emitSound(p, this.survivalSpecialActive && this.heroId === HEROINE_ID ? 'rifle' : h.weapon, h.shotSound);
    const shot = ++this.shotSequence;
    const spread = Math.max(h.spreadFloor, h.spread * (moving ? 1 - h.movingSpread : 1));
    for (let i = 0; i < h.pellets; i++) {
      const a = p.angle + (Math.random() - 0.5) * spread * 2;
      // Spawn at the player; continuous ray collision includes the whole barrel segment.
      this.spawnBullet({ x: p.x, y: p.y, vx: Math.cos(a) * FIREARM_BULLET_SPEED, vy: Math.sin(a) * FIREARM_BULLET_SPEED,
        life: h.range / FIREARM_BULLET_SPEED, damage: this.stats.damage * h.damage / this.baseGun.damage,
        hostile: false, push: h.bulletPush, nearPush: h.nearPush, shot, trainingAuto });
    }
    // Start on the consuming shot, not on a later fire request.
    if (p.ammo === 0) this.reload();
  }
  private buildFlow() {
    if (this.stage.survival) {
      const cell = this.gridCell(this.player);
      if (cell === this.harborPlayerFlowCell && this.geometryRevision === this.harborPlayerFlowRevision) return;
      this.harborPlayerFlowCell = cell;
      this.harborPlayerFlowRevision = this.geometryRevision;
    }
    this.flowTo(this.player, this.flow);
  }
  private gridCell(p: Point) {
    const x = clamp(Math.floor(p.x / 32), 0, this.gridWidth - 1);
    const y = clamp(Math.floor(p.y / 32), 0, this.gridHeight - 1);
    return y * this.gridWidth + x;
  }
  private cellPoint(cell: number): Point {
    return { x: (cell % this.gridWidth) * 32 + 16, y: Math.floor(cell / this.gridWidth) * 32 + 16 };
  }
  private adjacentCells(cell: number) {
    const width = this.gridWidth, x = cell % width;
    return [x > 0 ? cell - 1 : -1, x < width - 1 ? cell + 1 : -1, cell - width, cell + width];
  }
  private rasterHarborNavigation(navigation: Rect[]) {
    // The coast is part of the terrain. Start with the rectangular art extent,
    // then stamp blocked cells in each obstacle's neighborhood.
    const width = this.gridWidth, height = this.gridHeight, radius = 18;
    const plan = this.stage.survival!;
    this.grid.fill(0);
    for (const r of [this.rooms[plan.streetRoom], ...plan.stairs.map(stair => this.rooms[stair.upperRoom])]) {
      const left = Math.max(0, Math.ceil((r.x - 16) / 32));
      const right = Math.min(width, Math.floor((r.x + r.w - 16) / 32) + 1);
      const bottom = Math.max(0, Math.ceil((r.y - 16) / 32));
      const top = Math.min(height, Math.floor((r.y + r.h - 16) / 32) + 1);
      for (let y = bottom; y < top; y++) this.grid.fill(1, y * width + left, y * width + right);
    }
    for (const obstacle of navigation) {
      const corners = rectCorners(obstacle);
      const startX = Math.max(0, Math.floor((Math.min(...corners.map(p => p.x)) - radius) / 32));
      const endX = Math.min(width - 1, Math.floor((Math.max(...corners.map(p => p.x)) + radius) / 32));
      const startY = Math.max(0, Math.floor((Math.min(...corners.map(p => p.y)) - radius) / 32));
      const endY = Math.min(height - 1, Math.floor((Math.max(...corners.map(p => p.y)) + radius) / 32));
      for (let y = startY; y <= endY; y++) for (let x = startX; x <= endX; x++) {
        const index = y * width + x;
        if (this.grid[index] && circleRect(this.cellPoint(index), radius, obstacle)) this.grid[index] = 0;
      }
    }
  }
  private flowTo(point: Point, flow: Int32Array) {
    if (this.gridDirty) {
      // Closed usable doors are planned as passages: the AI opens/breaks them on approach.
      // Swung leaves remain real obstacles, including while fully open.
      const navigation = [...this.obstacles, ...this.doors.filter(d => !d.destroyed && (d.locked || d.alarm && this.alarmTime === null || Math.abs(d.angle - d.baseAngle) > 0.25)).map(d => doorShape(d))];
      if (this.stage.survival) this.rasterHarborNavigation(navigation);
      else for (let i = 0; i < this.grid.length; i++) this.grid[i] = walkable(this.cellPoint(i), 18, navigation, this.rooms) ? 1 : 0;
      this.soundFlows.clear();
      this.gridDirty = false;
    }
    flow.fill(-1);
    let start = this.gridCell(point);
    if (!this.grid[start]) {
      const cell = start, cx = cell % this.gridWidth, cy = Math.floor(cell / this.gridWidth);
      let best = Infinity;
      for (let y = Math.max(0, cy - 3); y <= Math.min(this.gridHeight - 1, cy + 3); y++) {
        for (let x = Math.max(0, cx - 3); x <= Math.min(this.gridWidth - 1, cx + 3); x++) {
          const next = y * this.gridWidth + x;
          if (!this.grid[next]) continue;
          const target = this.cellPoint(next), distance = dist(point, target);
          if (distance < best && (roomAt(point, this.rooms) === roomAt(target, this.rooms) || lineClear(point, target, this.blockers))) { start = next; best = distance; }
        }
      }
    }
    const queue = this.flowQueue, width = this.gridWidth;
    let head = 0, tail = 0; queue[tail++] = start; flow[start] = 0;
    while (head < tail) {
      const idx = queue[head++];
      const col = idx % width, cost = flow[idx] + 1;
      const left = idx - 1, right = idx + 1, below = idx - width, above = idx + width;
      if (col > 0 && this.grid[left] && flow[left] < 0) { flow[left] = cost; queue[tail++] = left; }
      if (col < width - 1 && this.grid[right] && flow[right] < 0) { flow[right] = cost; queue[tail++] = right; }
      if (this.grid[below] && flow[below] < 0) { flow[below] = cost; queue[tail++] = below; }
      if (this.grid[above] && flow[above] < 0) { flow[above] = cost; queue[tail++] = above; }
    }
  }
  private flowStep(p: Point, field: Int32Array) {
    const cell = this.gridCell(p);
    let best = field[cell] > 0 ? field[cell] : Infinity, next = -1;
    for (const neighbor of this.adjacentCells(cell)) {
      const cost = field[neighbor];
      if (cost >= 0 && cost < best) { best = cost; next = neighbor; }
    }
    return next >= 0 ? this.cellPoint(next) : undefined;
  }
  private clearWalkingLine(start: Point, end: Point, radius = 15) {
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const dx = -Math.sin(angle) * radius, dy = Math.cos(angle) * radius;
    return [0, -1, 1].every(side =>
      lineClear({ x: start.x + side * dx, y: start.y + side * dy },
        { x: end.x + side * dx, y: end.y + side * dy }, this.blockers));
  }
  private soundWaypoint(e: Point, source: Point, lookAhead = 0, radius = 15) {
    if (this.clearWalkingLine(e, source, radius)) return source;
    const cell = this.gridCell(source);
    let flow = this.soundFlows.get(cell);
    if (!flow) {
      if (this.soundFlowBudget <= 0) return undefined;
      this.soundFlowBudget--;
      if (this.soundFlows.size >= 16) {
        const oldest = this.soundFlows.keys().next().value!;
        flow = this.soundFlows.get(oldest)!;
        this.soundFlows.delete(oldest);
      } else flow = new Int32Array(this.grid.length);
      this.flowTo(source, flow);
      this.soundFlows.set(cell, flow);
    }
    if (flow[this.gridCell(e)] === 0) return source;
    let waypoint = this.flowStep(e, flow);
    for (let i = 0; waypoint && i < lookAhead; i++) {
      const next = this.flowStep(waypoint, flow);
      if (!next || !this.clearWalkingLine(e, next, radius)) break;
      waypoint = next;
    }
    return waypoint;
  }
  private investigateDoor(e: Enemy | Ally, target: Point, angle: number) {
    const door = this.nearbyDoor(e, 61);
    const reach = dist(e, target) + 8;
    if (!door || door.locked || door.alarm && this.alarmTime === null ||
        rayRect(e, Math.cos(angle), Math.sin(angle), doorShape(door), reach) >= reach) return false;
    const safeRoom = this.stage.apartment?.safeRoom;
    if ('type' in e && safeRoom !== undefined && door.rooms.includes(safeRoom)) return true;
    if (Math.abs(door.target - door.angle) > 0.01) return true;
    if (e.cooldown > 0) return true;
    if ('type' in e && (door.fortification && door.material === 'steel')) {
      this.damageDoor(door, e.survivalVariant === 'breaker' ? 53 : e.survivalVariant === 'overrun' ? 65 : 16);
      if (!door.destroyed) this.emitSound(door, 'door-break');
      e.cooldown = 1.1;
      return true;
    } else if (door.material === 'wood' && door.blocked > 0 && 'type' in e) {
      this.damageDoor(door, e.type === 'boss' ? 60 : 25);
      if (!door.destroyed) this.emitSound(door, 'door-break');
    } else { if ('type' in e) this.doorAttempts.set(door.id, e); this.openDoor(door, e); }
    e.cooldown = 0.65;
    return true;
  }
  private chooseRetreat(ally: Ally, threats: Enemy[]) {
    const nearest = threats[0];
    const away = Math.atan2(ally.y - nearest.y, ally.x - nearest.x);
    const safety = (point: Point) => Math.min(...threats.map(enemy => dist(point, enemy)));
    let best: Point | undefined, score = safety(ally);
    for (const turn of [0, 0.52, -0.52, 1.05, -1.05, 1.57, -1.57, 2.35, -2.35]) {
      const angle = away + turn, dx = Math.cos(angle), dy = Math.sin(angle);
      for (const distance of [92, 48]) {
        const point = { x: ally.x + dx * distance, y: ally.y + dy * distance };
        const value = safety(point) - Math.max(0, dist(point, this.player) - 250) * 0.16;
        if (value <= score || !this.unitSpaceFree(point, 15, ally)) continue;
        let clear = true;
        for (let step = 12; step <= distance + 11; step += 12) {
          const at = Math.min(distance, step), sample = { x: ally.x + dx * at, y: ally.y + dy * at };
          if (!walkable(sample, 15, this.blockers, this.rooms) || !this.unitSpaceFree(sample, 15, ally)) { clear = false; break; }
        }
        if (clear) { best = point; score = value; }
      }
    }
    return best;
  }
  private squadReform = 0;
  private squadSlots(holding: boolean) {
    if (!this.stage.operation) return [
      { back: 85, side: -76, guard: -1 }, { back: 85, side: 76, guard: 1 },
      { back: 142, side: 0, guard: Math.PI },
    ];
    if (holding) return [
      { back: 44, side: -82, guard: -1.25 }, { back: 44, side: 82, guard: 1.25 }, { back: 125, side: 0, guard: Math.PI },
    ];
    if (this.stage.operation.part === 'compound') return [
      { back: 58, side: -32, guard: -0.5 }, { back: 106, side: 32, guard: 0.5 }, { back: 156, side: -24, guard: Math.PI },
    ];
    return [
      { back: 66, side: -82, guard: -0.6 }, { back: 92, side: 82, guard: 0.6 }, { back: 156, side: 0, guard: Math.PI },
    ];
  }
  private operationPassage() {
    const p = this.player;
    for (const door of this.doors) {
      if (door.destroyed) continue;
      const dx = Math.cos(door.baseAngle), dy = Math.sin(door.baseAngle);
      const mid = { x: door.x + dx * door.length / 2, y: door.y + dy * door.length / 2 };
      if (dist(p, mid) > 135) continue;
      const side = (point: Point) => dx * (point.y - mid.y) - dy * (point.x - mid.x);
      return { mid, side, nx: -dy, ny: dx, clearance: Math.abs(side(p)), open: Math.abs(door.angle - door.baseAngle) > 1.4 };
    }
    return undefined;
  }
  private operationAllyDetour(ally: Ally, target: Point) {
    const aim = Math.atan2(target.y - ally.y, target.x - ally.x), side = ally.slot % 2 ? -1 : 1;
    for (const turn of [0.85 * side, -0.85 * side, 1.5 * side, -1.5 * side, 2.2 * side, -2.2 * side, Math.PI]) {
      const angle = aim + turn;
      for (const stride of [82, 53]) {
        const point = { x: ally.x + Math.cos(angle) * stride, y: ally.y + Math.sin(angle) * stride };
        if (walkable(point, 15, this.blockers, this.rooms) && this.clearWalkingLine(ally, point) &&
            [0.38, 0.7, 1].every(fraction => this.unitSpaceFree({
              x: ally.x + (point.x - ally.x) * fraction, y: ally.y + (point.y - ally.y) * fraction,
            }, 15, ally, true))) return { point, remaining: 1.1 };
      }
    }
    return undefined;
  }
  private updateSupport(dt: number, dx: number, dy: number) {
    const support = this.stage.street?.support;
    if (!support && !this.stage.operation) return;
    const p = this.player;
    if (support && !this.supportCalled && roomAt(p, [support.trigger]) >= 0) this.supportCalled = true;
    if (support && !this.supportCalled) return;
    if (support && this.allies.length < STREET_SUPPORT_SIZE) {
      for (const point of support.entries) {
        if (!this.canSpawn(point, Math.max(340, this.stats.visionRange + 32))) continue;
        const slot = this.allies.length;
        const ally = { ...point, id: -1 - slot, slot, hp: 110, maxHp: 110, angle: Math.PI, cooldown: 0.3 + slot * 0.13, ammo: 18, burst: 0, hit: 0, muzzle: 0 };
        this.allies.push(ally);
        this.indexUnit(ally);
        if (slot === 0) this.events.push('support-called');
        if (this.allies.length === STREET_SUPPORT_SIZE) break;
      }
    }
    const operation = this.stage.operation;
    if (Math.hypot(dx, dy) > 0.1) {
      const heading = Math.atan2(dy, dx);
      this.squadHeading = operation ? this.squadHeading + clamp(angleDiff(heading, this.squadHeading), -dt * 6, dt * 6) : heading;
    }
    const cos = Math.cos(this.squadHeading), sin = Math.sin(this.squadHeading);
    const holding = operation?.part === 'defense' && this.operationRun?.phase === 'hold';
    const slots = this.squadSlots(holding);
    const slotPoint = (index: number): Point => {
      const slot = slots[index % slots.length];
      return { x: p.x - cos * slot.back - sin * slot.side, y: p.y - sin * slot.back + cos * slot.side };
    };
    this.squadReform = Math.max(0, this.squadReform - dt);
    const live = this.allies.filter(ally => ally.hp > 0);
    if (!operation && this.squadReform === 0 && live.length > 1) {
      this.squadReform = 0.4;
      const free = live.map((_, i) => i);
      for (const ally of live) {
        let best = free[0], cost = Infinity;
        for (const index of free) {
          const value = dist(ally, slotPoint(index)) + (index === ally.slot ? 0 : 45);
          if (value < cost) { cost = value; best = index; }
        }
        ally.slot = best;
        free.splice(free.indexOf(best), 1);
      }
    }
    const passage = operation && this.operationPassage();
    const escort = passage ? live : [];
    const sight = this.allyVisionRange;
    for (const ally of this.allies) {
      if (ally.hp <= 0) continue;
      ally.hit = Math.max(0, ally.hit - dt);
      ally.muzzle = Math.max(0, ally.muzzle - dt);
      ally.cooldown -= dt;
      if (ally.knockback) { this.updateKnockback(ally, dt, 15); continue; }
      const threats: Enemy[] = [], visibleEnemies: Array<{ target: Enemy; distance: number }> = [];
      let nearest = Infinity;
      for (const e of this.enemies) {
        const distance = dist(ally, e);
        if (e.hp <= 0 || distance >= sight || !lineClear(ally, e, this.blockers)) continue;
        if (distance < 154) threats.push(e);
        if (distance < nearest) nearest = distance;
        visibleEnemies.push({ target: e, distance });
      }
      visibleEnemies.sort((a, b) => a.distance - b.distance);
      const lanes = Math.min(3, visibleEnemies.length);
      let enemy = lanes ? visibleEnemies[ally.slot % lanes].target : undefined;
      if (operation) {
        const lock = ally.aimLock;
        const held = lock && lock.remaining > 0 && visibleEnemies.find(item => item.target.id === lock.id);
        if (held) { enemy = held.target; lock.remaining -= dt; }
        else ally.aimLock = enemy ? { id: enemy.id, remaining: 0.42 } : undefined;
      }
      let reported: Enemy | undefined, reportedDistance = sight * 1.4;
      if (!enemy) for (const e of this.enemies) {
        if (e.hp <= 0 || !e.lastSeen) continue;
        const distance = dist(ally, e);
        if (distance < reportedDistance && dist(e, p) < 720) { reported = e; reportedDistance = distance; }
      }
      const melee = threats.filter(e => e.type !== 'gunner').sort((a, b) => dist(ally, a) - dist(ally, b))[0];
      const retreating = !!melee && dist(ally, melee) < (ally.retreat ? 145 : 112);
      ally.rethink = Math.max(0, (ally.rethink ?? 0) - dt);
      if (retreating && (ally.rethink === 0 || ally.retreat && dist(ally, ally.retreat) < 12)) {
        threats.sort((a, b) => dist(ally, a) - dist(ally, b));
        ally.retreat = this.chooseRetreat(ally, threats);
        ally.rethink = 0.20;
      } else if (!retreating) { ally.retreat = undefined; ally.rethink = 0; }
      const slot = slots[ally.slot % slots.length];
      let anchor = slotPoint(ally.slot);
      const squadDistance = dist(ally, p);
      if (operation) ally.regrouping = squadDistance > (ally.regrouping ? 112 : enemy || reported ? 255 : 185);
      const following = operation ? !!ally.regrouping : squadDistance > (enemy || reported ? 300 : 175);
      const standingAhead = !operation && !following && !holding && slot.back >= 0 && (ally.x - p.x) * cos + (ally.y - p.y) * sin > 0 && dist(ally, p) < 86;
      const atPassage = passage && dist(ally, passage.mid) < 175 ? passage : undefined;
      const crossing = !!atPassage && atPassage.side(ally) * atPassage.side(p) < 0;
      const clearingPassage = atPassage && !crossing && atPassage.open && atPassage.clearance >= 42 &&
        Math.abs(atPassage.side(ally)) < 55;
      if (atPassage?.open && atPassage.clearance >= 42) {
        const side = Math.sign(atPassage.side(p));
        const shift = Math.max(0, 72 - side * atPassage.side(anchor)) * side;
        anchor = { x: anchor.x + atPassage.nx * shift, y: anchor.y + atPassage.ny * shift };
      }
      const waitForPassage = atPassage && (!atPassage.open || atPassage.clearance < 42 || crossing &&
        escort.some(member => member !== ally && (atPassage.side(member) * atPassage.side(p) < 0
          ? dist(member, atPassage.mid) + (member.slot > ally.slot ? 2 : 0) < dist(ally, atPassage.mid)
          : Math.abs(atPassage.side(member)) < 39 && dist(member, atPassage.mid) < 64)));
      let target: Point = anchor;
      if (atPassage && clearingPassage) {
        const step = Math.sign(atPassage.side(p)) * 72 - atPassage.side(ally);
        target = { x: ally.x + atPassage.nx * step, y: ally.y + atPassage.ny * step };
      }
      else if (crossing || !walkable(anchor, 15, this.blockers, this.rooms) || !lineClear(ally, anchor, this.blockers)) {
        target = lineClear(ally, p, this.blockers) ? p : this.flowStep(ally, this.flow) ?? p;
      }
      if (reported && !enemy && !atPassage) {
        const angle = Math.atan2(reported.y - ally.y, reported.x - ally.x), side = ally.slot % 2 ? 1 : -1;
        const peek = { x: ally.x + Math.cos(angle) * 60 - Math.sin(angle) * side * 70,
          y: ally.y + Math.sin(angle) * 60 + Math.cos(angle) * side * 70 };
        if (walkable(peek, 15, this.blockers, this.rooms)) target = peek;
      }
      if (standingAhead && !atPassage) target = { x: ally.x - sin * (slot.side < 0 ? -70 : 70), y: ally.y + cos * (slot.side < 0 ? -70 : 70) };
      let pushX = 0, pushY = 0;
      for (const other of live) {
        if (other === ally) continue;
        const distance = dist(ally, other);
        if (distance >= 46) continue;
        const ux = distance > 0.5 ? (ally.x - other.x) / distance : Math.cos((ally.slot - other.slot) * 2.399);
        const uy = distance > 0.5 ? (ally.y - other.y) / distance : Math.sin((ally.slot - other.slot) * 2.399);
        pushX += ux * (46 - distance);
        pushY += uy * (46 - distance);
      }
      if ((pushX || pushY) && !retreating && !atPassage) {
        const separated = { x: target.x + pushX * 0.9, y: target.y + pushY * 0.9 };
        if (walkable(separated, 15, this.blockers, this.rooms)) target = separated;
      }
      if (ally.detour) {
        const detour = ally.detour;
        detour.remaining -= dt;
        if (atPassage || retreating || detour.remaining <= 0 || dist(ally, detour.point) < 12 ||
            !this.clearWalkingLine(ally, detour.point)) ally.detour = undefined;
        else target = detour.point;
      }
      const yieldSpace = !!operation && Math.hypot(pushX, pushY) > 15;
      if (yieldSpace && !atPassage && !following && !ally.detour) {
        const clear = { x: ally.x + pushX * 1.6, y: ally.y + pushY * 1.6 };
        if (walkable(clear, 15, this.blockers, this.rooms)) target = clear;
      }
      const aim = Math.atan2(target.y - ally.y, target.x - ally.x);
      const beforeMove = { x: ally.x, y: ally.y };
      ally.footstepTime = Math.max(0, (ally.footstepTime ?? 0) - dt);
      const steady = !!enemy && nearest < 280 && !following;
      if (atPassage && waitForPassage) {
        const distance = dist(ally, atPassage.mid);
        if (distance > 1 && distance < 75) {
          const step = (90 - distance) / distance;
          this.advanceUnit(ally, { x: ally.x + (ally.x - atPassage.mid.x) * step, y: ally.y + (ally.y - atPassage.mid.y) * step }, 104, dt);
        }
      } else if (retreating && !crossing && !clearingPassage) {
        if (ally.retreat) this.advanceUnit(ally, ally.retreat, 176, dt);
      } else if ((!steady || crossing || clearingPassage || ally.detour) && (following || crossing || clearingPassage || ally.detour ||
          standingAhead || yieldSpace && dist(ally, target) > 19 || !operation && target !== p && dist(ally, target) > 32)) {
        if (!operation) ally.angle = aim;
        if (!this.investigateDoor(ally, target, aim)) {
          const speed = following ? 212 : 128;
          this.advanceUnit(ally, target, speed, dt);
          if (operation && !atPassage && !ally.detour) {
            ally.blockedTime = dist(beforeMove, ally) < speed * dt * 0.23 ? (ally.blockedTime ?? 0) + dt : 0;
            if (ally.blockedTime >= 0.38) {
              ally.detour = this.operationAllyDetour(ally, target);
              ally.blockedTime = 0;
            }
          }
        }
      } else if (!operation && !enemy && !reported && dist(ally, anchor) < 40) ally.angle = this.squadHeading + slot.guard;
      const moved = dist(beforeMove, ally), tracked = enemy ?? reported;
      if (ally.footstepTime <= 0 && moved > 0.5) { this.emitSound(ally, 'footstep', footstepSoundProfile(0)); ally.footstepTime = 0.55; }
      if (operation) {
        const facing = tracked ? Math.atan2(tracked.y - ally.y, tracked.x - ally.x) :
          moved > 0.65 ? Math.atan2(ally.y - beforeMove.y, ally.x - beforeMove.x) :
          dist(ally, anchor) < 40 ? this.squadHeading + slot.guard : ally.angle;
        ally.angle += clamp(angleDiff(facing, ally.angle), -dt * 5.4, dt * 5.4);
      } else if (tracked) ally.angle = Math.atan2(tracked.y - ally.y, tracked.x - ally.x);
      if (operation && !atPassage && ally.grenades && this.tryOperationAllyGrenade(ally, enemy, reported)) continue;
      if (!enemy || ally.cooldown > 0) continue;
      if (operation && Math.abs(angleDiff(Math.atan2(enemy.y - ally.y, enemy.x - ally.x), ally.angle)) > 0.23) continue;
      const gun = this.supportGuns[GHOST_ID], base = heroes[GHOST_ID];
      if (ally.ammo <= 0) ally.ammo = 18 + gun.magazine - base.magazine;
      if (!lineClear(ally, enemy, this.blockers)) continue;
      const angle = operation ? ally.angle : Math.atan2(enemy.y - ally.y, enemy.x - ally.x);
      const spread = ((ally.ammo + ally.slot) % 3 - 1) * 0.024 * gun.spread / base.spread;
      this.spawnBullet({ x: ally.x, y: ally.y, vx: Math.cos(angle + spread) * 1000, vy: Math.sin(angle + spread) * 1000, life: 0.39, damage: 13 * gun.damage / base.damage, hostile: false, push: 11, support: true });
      ally.muzzle = 0.09;
      ally.ammo--;
      ally.burst = (ally.burst + 1) % 3;
      ally.cooldown = ally.ammo <= 0 ? 1.4 * gun.reload / base.reload : ally.burst === 0 ? 0.66 + ally.slot * 0.04 : 0.15;
      this.emitSound(ally, 'rifle', gun.shotSound);
      this.events.push(gun.quiet ? 'support-shot-suppressed' : 'support-shot');
    }
  }
  private tryOperationAllyGrenade(ally: Ally, enemy?: Enemy, reported?: Enemy) {
    const run = this.operationRun!, target = enemy ?? reported;
    if (!target || target.hp <= 0 || run.grenadeDelay > 0 || run.phase === 'landing' ||
        dist(ally, target) > OPERATION_GRENADE_RANGE || dist(ally, target) < 132 || !lineClear(ally, target, this.blockers)) return false;
    const radius = TACTICAL_DEFINITIONS.grenade.radius;
    const nearby = this.enemies.filter(other => other.hp > 0 && dist(other, target) < radius && lineClear(target, other, this.blockers));
    if (nearby.length < 2 && !target.operationBoss && !(target.type === 'gunner' && !lineClear(this.player, target, this.blockers))) return false;
    const angle = Math.atan2(target.y - ally.y, target.x - ally.x);
    const range = dist(ally, target);
    const { impact } = this.operationGrenadePreview(angle, range, ally);
    if (dist(impact, target) >= radius ||
        [this.player, ...this.allies].some(unit => unit.hp > 0 && dist(unit, impact) < radius + 34)) return false;
    ally.grenades!--;
    ally.cooldown = Math.max(ally.cooldown, 0.35);
    run.grenadeDelay = 3.2;
    this.tacticalThrows.push(this.makeOperationGrenade(ally, angle, range));
    this.events.push('throw');
    return true;
  }
  private wanderIdle(e: Enemy, dt: number) {
    if (e.type === 'boss') return;
    let state = this.idleWander.get(e);
    if (!state) {
      state = { origin: { x: e.x, y: e.y }, room: roomAt(e, this.rooms), rng: ((e.id + 1) * 2654435761 ^ (this.stage.floorDetails?.seed ?? 0)) >>> 0, remaining: 0.8 + e.id % 5 * 0.4 };
      this.idleWander.set(e, state);
    }
    const random = () => { state!.rng = (Math.imul(state!.rng, 1664525) + 1013904223) >>> 0; return state!.rng / 4294967296; };
    state.remaining -= dt;
    if (state.target) {
      const distance = dist(e, state.target), step = Math.min(distance, 22 * dt);
      if (distance > 2 && state.remaining > 0) {
        const angle = Math.atan2(state.target.y - e.y, state.target.x - e.x);
        const next = { x: e.x + Math.cos(angle) * step, y: e.y + Math.sin(angle) * step };
        if (roomAt(next, this.rooms) === state.room && dist(next, state.origin) <= 80 && walkable(next, unitRadius(e), this.blockers, this.rooms) && lineClear(e, next, this.blockers)) {
          const before = { x: e.x, y: e.y }; e.angle = angle;
          this.move(e, next.x - e.x, next.y - e.y, unitRadius(e));
          if (dist(e, before) > step * 0.25) return;
        }
      }
      state.target = undefined; state.remaining = 1 + random() * 2.5;
      return;
    }
    if (state.remaining > 0) return;
    state.remaining = 1.2 + random() * 2.5;
    if (random() < 0.35) return;
    for (let i = 0; i < 5; i++) {
      const angle = random() * TAU, length = 25 + random() * 30;
      const point = { x: e.x + Math.cos(angle) * length, y: e.y + Math.sin(angle) * length };
      if (dist(point, state.origin) <= 80 && roomAt(point, this.rooms) === state.room && walkable(point, unitRadius(e), this.blockers, this.rooms) && lineClear(e, point, this.blockers)) {
        state.target = point; state.remaining = length / 22 + 0.2; break;
      }
    }
  }
  bruteChargePreview(e: Enemy) {
    const angle = e.charge?.angle ?? e.angle;
    const dx = Math.cos(angle), dy = Math.sin(angle), radius = unitRadius(e);
    const travel = bruteChargeTravel(BRUTE_DASH_TIME);
    let reach = 0;
    for (let distance = 5; distance <= travel + 5; distance += 5) {
      const step = Math.min(distance, travel);
      const next = { x: e.x + dx * step, y: e.y + dy * step };
      if (!this.insideOutdoorBoundary(e, next, radius) || !walkable(next, radius, this.blockers, this.rooms)) break;
      reach = step;
    }
    const length = Math.min(reach + radius, ...[-radius, 0, radius].map(side =>
      rayDistance({ x: e.x - dy * side, y: e.y + dx * side }, angle, reach + radius, this.blockers)));
    return { radius, length };
  }
  private stepBruteCharge(e: Enemy, dt: number) {
    const p = this.player, charge = e.charge;
    if (!charge) {
      e.chargeCooldown = Math.max(0, (e.chargeCooldown ?? 0) - dt);
      const distance = dist(e, p);
      if (e.chargeCooldown || e.windup > 0 || distance < 95 || distance > 285 || !lineClear(e, p, this.blockers)) return false;
      e.angle = Math.atan2(p.y - e.y, p.x - e.x);
      e.charge = { phase: 'windup', time: 0, angle: e.angle };
      return true;
    }
    const recover = () => { charge.phase = 'recover'; charge.time = 0; };
    const previous = charge.time;
    charge.time += dt;
    e.angle = charge.angle;
    switch (charge.phase) {
      case 'windup':
        if (charge.time < 0.41) charge.angle = Math.atan2(p.y - e.y, p.x - e.x);
        if (charge.time >= BRUTE_WINDUP) { charge.phase = 'dash'; charge.time = 0; }
        break;
      case 'dash': {
        const endTime = Math.min(charge.time, BRUTE_DASH_TIME);
        const length = bruteChargeTravel(endTime) - bruteChargeTravel(previous);
        const dx = Math.cos(charge.angle), dy = Math.sin(charge.angle), radius = unitRadius(e);
        // Advance in short segments so fast charges still respect cover and unit collision.
        const count = Math.max(1, Math.ceil(length / 5));
        for (let i = 0; i < count; i++) {
          const next = { x: e.x + dx * length / count, y: e.y + dy * length / count };
          if (!this.insideOutdoorBoundary(e, next, radius) || !walkable(next, radius, this.blockers, this.rooms)) { recover(); return true; }
          if (dist(next, p) <= radius + unitRadius(p) && p.dashTime <= 0 && lineClear(e, p, this.blockers)) {
            this.hurt(42, { angle: charge.angle, distance: 128 });
            recover();
            return true;
          }
          const from = { x: e.x, y: e.y };
          this.move(e, next.x - e.x, next.y - e.y, radius);
          if (dist(from, e) < length / count * 0.35) break;
        }
        if (charge.time >= BRUTE_DASH_TIME) recover();
        break;
      }
      case 'recover':
        if (charge.time >= 0.85) { e.charge = undefined; e.chargeCooldown = 3.1; }
        break;
    }
    return true;
  }
  private stepOperationGunner(e: Enemy, dt: number) {
    const player = this.player;
    if (dist(e, player) > 850) return;
    const emplacement = e.appearance === OPERATION_MG;
    const range = emplacement ? 520 : 390;
    const aimAt = (p: Point) => Math.atan2(p.y - e.y, p.x - e.x);
    const inArc = (p: Point) => !emplacement || Math.abs(angleDiff(aimAt(p), Math.PI)) <= 0.95;
    const canSee = (unit: Unit, limit: number) => dist(e, unit) <= limit && inArc(unit) && lineClear(e, unit, this.blockers);
    e.cooldown = Math.max(0, e.cooldown - dt);
    if (e.windup > 0) {
      e.windup -= dt;
      if (e.windup > 0) return;
      const target = e.attackAlly ?? player;
      if (target.hp <= 0 || !canSee(target, range + 25)) return;
      const angles = emplacement ? [-0.10, -0.03, 0.035, 0.10] : [-0.057, 0.057];
      for (const spread of angles) {
        const a = e.attackAngle + spread;
        this.spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * FIREARM_BULLET_SPEED, vy: Math.sin(a) * FIREARM_BULLET_SPEED,
          hostile: true, firearm: true, life: (range + 40) / FIREARM_BULLET_SPEED, damage: emplacement ? 9 : 7, push: emplacement ? 20 : 12 });
      }
      e.muzzle = 0.08;
      if (!this.events.includes('operation-hostile-shot')) this.events.push('operation-hostile-shot');
      this.emitSound(e, 'rifle');
      return;
    }
    let target: Player | Ally | undefined;
    let nearest = range + 175;
    for (const unit of [player, ...this.allies]) {
      if (unit.hp <= 0 || !canSee(unit, nearest)) continue;
      target = unit; nearest = dist(e, unit);
    }
    if (target) {
      e.angle = aimAt(target);
      e.lastSeen = { x: target.x, y: target.y };
      e.combatMemory = 7;
      e.investigate = undefined;
      if (nearest <= range && e.cooldown <= 0) {
        e.attackAngle = e.angle;
        e.attackAlly = 'slot' in target ? target : undefined;
        e.windup = emplacement ? 0.68 : 0.28;
        e.cooldown = (emplacement ? 1.28 : 0.85) + e.id % 4 * 0.1;
      } else if (!emplacement && nearest > range * 0.76) {
        this.advanceUnit(e, target, 110, dt);
      }
      return;
    }
    if (emplacement) { e.angle = Math.PI; return; }
    const source = (e.combatMemory || 0) > 0 ? e.lastSeen : e.investigate;
    if (!source || dist(e, source) < 25) return;
    if (source === e.investigate) {
      e.investigateTime = (e.investigateTime || 0) - dt;
      if (e.investigateTime <= 0) { e.investigate = undefined; return; }
    }
    const waypoint = this.soundWaypoint(e, source);
    if (!waypoint) return;
    e.angle = aimAt(waypoint);
    if (!this.investigateDoor(e, waypoint, e.angle)) this.advanceUnit(e, waypoint, 118, dt);
  }
  private moveChapelLeader(e: Enemy, dt: number, target: Player | Ally, chapel: NonNullable<NonNullable<LevelDefinition['operation']>['chapel']>) {
    if (e.knockback) return;
    const inside = (point: Point) => roomAt(point, [chapel.bounds]) >= 0;
    if (e.leaderMove && ((e.leaderMove.remaining -= dt) <= 0 || dist(e, e.leaderMove.point) <= 26)) e.leaderMove = undefined;
    if (!e.leaderMove) {
      const avoided = e.leaderBlocked && e.leaderBlocked.until > this.elapsed ? e.leaderBlocked.point : undefined;
      const choices = chapel.positions.filter(point => point !== avoided && dist(e, point) > 65 && dist(target, point) > 92 &&
        walkable(point, 25, this.blockers, this.rooms) && this.unitSpaceFree(point, 25, e)).map(point => {
        const distance = dist(target, point), canFire = distance < 460 && lineClear(point, target, this.blockers);
        const cost = Math.abs(distance - 245) * 0.4 + dist(e, point) * 0.34 + (canFire ? 0 : 230) +
          (this.clearWalkingLine(e, point, 24) ? 0 : 138);
        return { point, cost };
      }).sort((a, b) => a.cost - b.cost);
      const choice = choices.find(({ point }) => {
        const step = this.soundWaypoint(e, point, 2, 24);
        return step && inside(step) && this.clearWalkingLine(e, step, 23);
      });
      if (choice) e.leaderMove = { point: choice.point, remaining: 1.45, stalled: 0 };
    }
    const move = e.leaderMove;
    if (!move) return;
    const step = this.soundWaypoint(e, move.point, 2, 24);
    const before = { x: e.x, y: e.y };
    if (step && inside(step)) this.advanceUnit(e, step, 186, dt);
    const moved = dist(e, before);
    if (moved > 0.8) {
      move.stalled = 0;
      return Math.atan2(e.y - before.y, e.x - before.x);
    }
    move.stalled += dt;
    if (move.stalled > 0.24) {
      e.leaderBlocked = { point: move.point, until: this.elapsed + 0.95 };
      e.leaderMove = undefined;
    }
    return undefined;
  }
  private stepChapelLeader(e: Enemy, dt: number, chapel: NonNullable<NonNullable<LevelDefinition['operation']>['chapel']>) {
    const room = chapel.bounds, range = 460;
    const sight = (unit: Player | Ally) => dist(e, unit) <= range && lineClear(e, unit, this.blockers);
    const candidates = [this.player, ...this.allies].filter(unit => unit.hp > 0 &&
      (roomAt(unit, [room]) >= 0 || unit.x >= room.x - 155 && unit.x < room.x && sight(unit)))
      .sort((a, b) => dist(e, a) - dist(e, b));
    const held = e.leaderTarget;
    const target = e.windup > 0 && held && candidates.includes(held) && sight(held) ? held : candidates.find(sight);
    if (!candidates.length) { e.windup = 0; e.leaderTarget = undefined; e.leaderMove = undefined; return; }
    e.cooldown = Math.max(0, e.cooldown - dt);
    if (!target || target !== held && e.windup > 0) {
      e.windup = 0; e.leaderTarget = undefined; e.leaderBurst = false;
    }
    if (target && e.windup <= 0 && e.cooldown <= 0) {
      e.leaderTarget = target; e.leaderBurst = true; e.windup = 0.16;
    }
    const move = !target || e.windup <= 0 && e.cooldown > 0.13 ?
      this.moveChapelLeader(e, dt, target ?? candidates[0], chapel) : undefined;
    const aim = target ? Math.atan2(target.y - e.y, target.x - e.x) : undefined;
    const turn = aim ?? move ?? e.angle;
    e.angle += clamp(angleDiff(turn, e.angle), -dt * 12, dt * 12);
    if (!target || aim === undefined || e.windup <= 0) return;
    e.attackAngle = aim;
    e.windup = Math.max(0.001, e.windup - dt);
    if (e.windup > 0.001 || Math.abs(angleDiff(aim, e.angle)) > 0.24 || !sight(target)) return;
    const shot = aim + (e.leaderBurst ? -0.016 : 0.018);
    this.spawnBullet({ x: e.x, y: e.y, vx: Math.cos(shot) * FIREARM_BULLET_SPEED, vy: Math.sin(shot) * FIREARM_BULLET_SPEED,
      hostile: true, firearm: true, life: range / FIREARM_BULLET_SPEED, damage: 20, push: 37 });
    e.muzzle = 0.08;
    this.events.push('operation-hostile-shot');
    this.emitSound(e, 'rifle');
    if (e.leaderBurst) { e.leaderBurst = false; e.windup = 0.12; }
    else { e.windup = 0; e.cooldown = 0.66; e.leaderTarget = undefined; }
  }
  private enemyStep(e: Enemy, dt: number) {
    if (e.hp <= 0) return;
    e.hit = Math.max(0, e.hit - dt);
    if (e.muzzle) e.muzzle = Math.max(0, e.muzzle - dt);
    if (e.paralysis) e.paralysis = Math.max(0, e.paralysis - dt);
    const stunned = e.stun > 0;
    if (stunned) e.stun = Math.max(0, e.stun - dt);
    if (e.knockback) {
      const keepsAim = e.knockback.keepsAim;
      this.updateKnockback(e, dt, e.type === 'boss' ? 26 : 16);
      if (!keepsAim) { e.windup = 0; return; }
    }
    if (stunned && e.operationBoss !== 'king') { e.windup = 0; return; }
    if (e.combatMemory !== undefined) e.combatMemory = Math.max(0, e.combatMemory - dt);
    if (this.stepDoorClear(e, dt)) return;
    if (this.stepSurvivalSearch(e, dt)) return;
    if (this.survival && this.attackSurvivalSentry(e, dt)) return;
    if (e.type === 'gunner' && this.stage.operation) { this.stepOperationGunner(e, dt); return; }
    const chapel = this.stage.operation?.chapel;
    if (e.operationBoss === 'leader' && chapel) { this.stepChapelLeader(e, dt, chapel); return; }
    if (e.operationBoss === 'king' && chapel &&
        ![this.player, ...this.allies].some(unit => unit.hp > 0 && roomAt(unit, [chapel.bounds]) >= 0)) {
      e.charge = undefined; e.windup = 0; return;
    }
    if (e.operationBoss === 'king' && (this.operationRun!.slam > 0 || this.stepBruteCharge(e, dt))) return;
    const apartment = this.apartment;
    const outdoor = this.stage.apartment?.outdoor;
    const outside = outdoor && outdoor.room === e.room;
    if (outside && apartment?.phase !== 'outside') {
      e.charge = undefined; e.windup = 0;
      if (e.type === 'boss') {
        const target = { x: outdoor.entry.x + (e.id % 2 ? 185 : -185) * Math.sin(this.elapsed * 0.35), y: outdoor.entry.y + 95 };
        if (dist(e, target) > 15) { e.angle = Math.atan2(target.y - e.y, target.x - e.x); this.advanceBrute(e, target, 67, dt); }
      } else this.wanderIdle(e, dt);
      return;
    }
    if (outside && e.type === 'boss' && this.stepBruteCharge(e, dt)) return;
    const activeOutside = outside && (e.type === 'boss' || dist(e, this.player) < 300);
    const searching = this.survivalSearchOrders.has(e);
    const pursuing = activeOutside || searching || !!e.survivalPursuit || !!e.operationBoss || this.stage.operation?.part === 'defense' || !!this.stage.street && this.alarmTime !== null || !!apartment && ['return', 'hold', 'lift', 'car-hold', 'car-ready'].includes(apartment.phase);
    const melee = e.type === 'walker' || e.type === 'boss' && !!apartment;
    let ally: Ally | undefined;
    const playerDistance = dist(e, this.player);

    let distanceToTarget = 360;
    if (this.allies.length && playerDistance < 360 && lineClear(e, this.player, this.blockers)) distanceToTarget = playerDistance;
    const carDefense = apartment?.phase === 'car-hold' || apartment?.phase === 'car-ready';
    for (const unit of carDefense ? [] : this.allies) {
      const distance = dist(e, unit);
      if (unit.hp > 0 && distance < distanceToTarget && (pursuing || Math.abs(angleDiff(Math.atan2(unit.y - e.y, unit.x - e.x), e.angle)) <= Math.PI * 0.32) && lineClear(e, unit, this.blockers)) { ally = unit; distanceToTarget = distance; }
    }
    if (!pursuing && !ally && !e.forceOpen && e.windup <= 0 && (e.investigate || e.soundOnly || !e.lastSeen)) {
      if (!e.investigate) { this.wanderIdle(e, dt); return; }
      this.idleWander.delete(e);
      e.cooldown = Math.max(0, e.cooldown - dt);
      e.investigateTime = Math.max(0, (e.investigateTime || 0) - dt);
      if (dist(e, e.investigate) < 28 || e.investigateTime <= 0) {
        e.searchTime = (e.searchTime || 0) + dt; e.angle += dt * 1.8;
        if (e.searchTime > 0.8) { e.investigate = undefined; e.hearingAlert = false; e.alarmInvestigation = false; e.windup = 0; }
        return;
      }
      const target = this.soundWaypoint(e, e.investigate);
      if (!target) return;
      const a = Math.atan2(target.y - e.y, target.x - e.x);
      if (this.investigateDoor(e, target, a)) return;
      const speed = this.stage.street && e.alarmInvestigation ? 108 : 70;
      e.angle = a;
      if (e.type === 'boss' && apartment) this.advanceBrute(e, target, speed, dt);
      else this.advanceUnit(e, target, speed, dt);
      return;
    }
    this.idleWander.delete(e);
    const p = e.windup > 0 ? e.attackAlly ?? this.player : ally ?? this.player;
    const d = dist(e, p), clear = lineClear(e, p, this.blockers);
    const tuning = this.survival ? this.survivalSearchProfile : undefined;
    if (!pursuing && !ally && (!clear || d > 360 * (tuning ? this.visionScale * tuning.sight : 1) || Math.abs(angleDiff(Math.atan2(p.y - e.y, p.x - e.x), e.angle)) > Math.PI * (tuning?.cone ?? .32)) && e.windup <= 0 && !e.forceOpen) {
      if ((e.combatMemory || 0) <= 0 || dist(e, e.lastSeen!) < 28) { e.lastSeen = undefined; return; }
      this.investigateSound(e, e.lastSeen!, 'last-seen', dist(e, e.lastSeen!), true);
      return;
    }
    e.cooldown -= dt; e.angle = Math.atan2(p.y - e.y, p.x - e.x);
    if (e.windup > 0) {
      e.windup -= dt;
      if (e.windup <= 0) {
        if (melee) {
          if (dist(e, p) < (e.type === 'boss' ? 84 : 64) && lineClear(e, p, this.blockers)) {
            const impact = { angle: e.angle, distance: e.type === 'boss' ? 55 : 32 };
            const damage = e.survivalVariant === 'overrun' ? 35 : e.survivalVariant === 'breaker' ? 24 : e.type === 'boss' ? 28 : 17;
            if ('slot' in p) this.hurtAlly(p, damage, impact);
            else this.hurt(damage, impact);
          }
        }
        else for (let i = 0; i < (e.type === 'boss' && e.operationBoss !== 'leader' ? 9 : 1); i++) {
          const a = e.attackAngle + (e.type === 'boss' && e.operationBoss !== 'leader' ? (i - 4) * 0.16 : 0);
          const firearm = e.type === 'gunner' || e.operationBoss === 'leader';
          if (firearm) e.muzzle = 0.08;
          const speed = firearm ? FIREARM_BULLET_SPEED : 240;
          this.spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, hostile: true, firearm,
            life: firearm ? 430 / speed : 3.5, damage: e.type === 'boss' ? 23 : e.type === 'gunner' ? 12 : 16, push: e.type === 'boss' ? 37 : 26 });
        }
      }
      return;
    }
    const range = e.type === 'walker' ? 48 : e.type === 'boss' ? apartment ? 72 : 390 : 310;
    if (!pursuing && !clear && e.cooldown <= 0) {
      const door = this.nearbyDoor(e, e.type === 'boss' ? 75 : 54);
      if (door && !door.rooms.some(room => room === this.stage.apartment?.safeRoom) &&
          !door.locked && (!door.alarm || this.alarmTime !== null) && rayRect(e, Math.cos(e.angle), Math.sin(e.angle), doorShape(door), d) < d && Math.abs(door.angle - door.baseAngle) < 1.5 && !e.forceOpen) {
        if (door.fortification && door.material === 'steel') {
          this.damageDoor(door, e.survivalVariant === 'breaker' ? 53 : e.survivalVariant === 'overrun' ? 65 : e.type === 'boss' ? 42 : 16);
          this.emitSound(door, 'door-break');
          e.cooldown = 1.1;
        } else if (door.material === 'wood' && e.type !== 'spitter' && !this.survival?.timed) {
          // Try the normal swing first when a unit occupies its sweep. Only a
          // real actor-blocked swing counts; otherwise retain ordinary smashing.
          const side = Math.cos(door.baseAngle) * (e.y - door.y) - Math.sin(door.baseAngle) * (e.x - door.x);
          const target = door.baseAngle + (side >= 0 ? -1 : 1) * Math.PI / 2;
          const actorBlocked = Array.from({ length: 33 }, (_, i) => doorShape(door, door.angle + (target - door.angle) * i / 32)).some(shape =>
            circleRect(this.player, 17, shape) || this.enemies.some(unit => unit !== e && unit.hp > 0 && circleRect(unit, unit.type === 'boss' ? 26 : 16, shape)));
          if (actorBlocked && Math.abs(door.target - door.angle) < 0.01) { this.doorAttempts.set(door.id, e); this.openDoor(door, e); }
          else if (!actorBlocked) { this.damageDoor(door, e.type === 'boss' ? 60 : 25); this.emitSound(door, 'door-break'); }
          e.cooldown = 0.9;
        }
        else if (Math.abs(door.target - door.angle) < 0.01) {
          this.doorAttempts.set(door.id, e); this.openDoor(door, e); e.cooldown = 0.8;
        }
      }
    }
    if (!clear && e.forceOpen && e.forceOpen > 0) {
      e.forceOpen -= dt;
      if (e.forceOpen <= 0 && e.doorBlockId !== undefined && !this.doorForceCooldown.has(e.doorBlockId)) {
        const d = this.doors[e.doorBlockId]; this.openDoor(d, e);
        const before = d.angle, swept: Rect[] = [];
        for (let i = 0; i <= 64; i++) swept.push(doorShape(d, before + (d.target - before) * i / 64, 18));
        const hardBlocked = d.destroyed || swept.some(shape => this.obstacles.some(r => r.kind !== 'jamb' && rectIntersects(shape, r)) || this.doors.some(other => other !== d && !other.destroyed && rectIntersects(shape, doorShape(other))));
        this.doorForceCooldown.set(d.id, 3.5); e.doorBlockCount = 0; e.forceOpen = 0;
        if (hardBlocked || this.player.knockback) { d.target = before; return; }
        const normal = d.baseAngle + Math.PI / 2, finalShape = doorShape(d, d.target);
        const solid = this.blockers.filter(r => r.kind !== 'door:' + d.id);
        const plans: Array<{ actor: Unit; point: Point }> = [];
        for (const actor of [this.player, ...this.enemies.filter(x => x.hp > 0), ...this.allies.filter(x => x.hp > 0)]) {
          const radius = actor === this.player ? 17 : unitRadius(actor);
          if (dist(actor, closestOnRect(actor, doorShape(d, d.baseAngle))) > 76 && !circleRect(actor, radius, finalShape)) continue;
          const side = (actor.x - d.x) * Math.cos(normal) + (actor.y - d.y) * Math.sin(normal), sign = side >= 0 ? 1 : -1;
          const strength = actor === this.player ? 54 : (actor as Enemy).type === 'boss' ? 28 : 48;
          let safe: Point | undefined;
          // Plan before committing: every 4px of displacement must be clear of
          // thin walls/other doors, and the endpoint must clear the opened leaf.
          for (const turn of [0, 0.5, -0.5, 1, -1, Math.PI / 2, -Math.PI / 2]) {
            const a = normal + (sign < 0 ? Math.PI : 0) + turn;
            const end = { x: actor.x + Math.cos(a) * strength, y: actor.y + Math.sin(a) * strength };
            const steps = Math.ceil(strength / 4);
            let exiting = circleRect(actor, radius, finalShape);
            if (!circleRect(end, radius + 1, finalShape) && plans.every(plan => dist(plan.point, end) >= radius + unitRadius(plan.actor)) &&
              Array.from({ length: steps }, (_, i) => ({ x: actor.x + (end.x - actor.x) * (i + 1) / steps, y: actor.y + (end.y - actor.y) * (i + 1) / steps })).every(p => {
              const overlap = circleRect(p, radius, finalShape);
              if (actor === this.player && !exiting && overlap) return false;
              if (!overlap) exiting = false;
              return walkable(p, radius, solid, this.rooms) && this.unitSpaceFree(p, radius, actor, true);
            })) { safe = end; break; }
          }
          if (!safe) { d.target = before; return; }
          plans.push({ actor, point: safe });
        }
        d.angle = d.target; this.syncGeometry();
        for (const { actor, point } of plans) {
          if (actor === this.player) {
            const angle = Math.atan2(point.y - actor.y, point.x - actor.x);
            this.hurt(12, { angle, distance: 0 }); this.player.dashTime = 0;
            if (this.player.hp > 0) this.player.knockback = { start: { x: actor.x, y: actor.y }, end: point, elapsed: 0, duration: 0.3, doorId: d.id, exiting: circleRect(actor, 17, finalShape) };
          } else {
            const angle = Math.atan2(point.y - actor.y, point.x - actor.x);
            const from = this.unitKey(actor.x, actor.y);
            Object.assign(actor, point); actor.knockback = undefined;
            this.moveUnitIndex(actor, from);
            if (actor === e) continue;
            if ('slot' in actor) this.hurtAlly(actor, 28, { angle, distance: 0 });
            else if ('type' in actor) {
              this.damageEnemy(actor, actor.type === 'boss' ? 14 : 28, { angle, distance: 0 });
              actor.stun = Math.max(actor.stun, actor.type === 'boss' ? 0.22 : 0.48);
            }
          }
        }
        this.emitSound(d, 'door-open'); this.syncGeometry(); this.events.push('door-forced');
      }
    }
    if (d < range && clear && e.cooldown <= 0) { e.windup = e.type === 'walker' ? 0.38 : 0.7; e.attackAngle = e.angle; e.attackAlly = ally; e.cooldown = e.type === 'boss' ? 2.3 : e.type === 'walker' ? 1.1 : 2.4; return; }
    if (d < (e.type === 'walker' ? this.stage.street ? 40 : 35 : range * 0.85) && clear) return;
    let tx = p.x, ty = p.y;
    if (pursuing && !ally) {
      const sideX = -Math.sin(e.angle) * 15, sideY = Math.cos(e.angle) * 15;
      const corridorClear = clear && [-1, 1].every(side => lineClear(
        { x: e.x + side * sideX, y: e.y + side * sideY },
        { x: p.x + side * sideX, y: p.y + side * sideY }, this.blockers));
      if (!corridorClear) {
        const target = this.flowStep(e, this.flow) ?? (clear ? p : undefined);
        if (!target) return;
        tx = target.x; ty = target.y;
        if (!e.forceOpen && this.investigateDoor(e, target, Math.atan2(ty - e.y, tx - e.x))) return;
      }
    } else if (!clear) {
      const target = this.flowStep(e, this.flow);
      if (!target) return;
      tx = target.x; ty = target.y;
    }
    const speed = e.type === 'boss' ? apartment ? 108 : 55 : e.type === 'spitter' ? 70 : activeOutside ? 98 : pursuing ? 113 : 86;
    if (e.type === 'boss' && apartment) this.advanceBrute(e, { x: tx, y: ty }, speed, dt);
    else {
      const pace = e.survivalVariant === 'overrun' ? 2 : e.survivalVariant === 'runner' ? 1.57 :
        e.survivalVariant === 'breaker' ? .9 : this.survival?.timed ? 1 + Math.min(.23, this.elapsed / 4500) : 1;
      this.advanceUnit(e, { x: tx, y: ty }, speed * pace, dt);
    }
  }
  private bruteGait(e: Enemy) {
    let gait = this.bruteGaits.get(e);
    if (!gait) {
      gait = { phase: 0, traveled: 0, updated: -1, planted: -1, steps: 0 };
      this.bruteGaits.set(e, gait);
    }
    return gait;
  }
  bruteStepPose(e: Enemy) {
    const gait = this.bruteGaits.get(e);
    if (!gait || this.elapsed - gait.updated > 0.15) return { compression: 0, lean: 0 };
    const compression = clamp(1 - (this.elapsed - gait.planted) / 0.19, 0, 1) ** 2;
    const lean = Math.sin(clamp(gait.phase / 0.43, 0, 1) * Math.PI) * (gait.steps % 2 ? -1 : 1);
    return { compression, lean };
  }
  private advanceBrute(e: Enemy, target: Point, speed: number, dt: number) {
    const gait = this.bruteGait(e);
    if (this.elapsed - gait.updated > 0.15) { gait.phase = 0; gait.traveled = 0; }
    gait.updated = this.elapsed;
    const before = gait.phase;
    gait.phase += dt;
    if (before < 0.43) {
      const from = { x: e.x, y: e.y };
      this.advanceUnit(e, target, speed * (before < 0.12 ? 0.62 : 1.85), Math.min(dt, 0.43 - before));
      gait.traveled += dist(e, from);
      if (gait.phase >= 0.43 && gait.traveled >= 12) {
        gait.planted = this.elapsed;
        gait.steps++;
        this.bruteFootfalls.push({ x: e.x, y: e.y });
      }
    }
    if (gait.phase >= 0.62) { gait.phase -= 0.62; gait.traveled = 0; }
  }
  private updateDeathFragments(dt: number) {
    for (const f of this.deathFragments) {
      const next = { x: f.x + f.vx * dt, y: f.y + f.vy * dt };
      const radius = f.size || 3;
      const blocked = !walkable(next, radius, this.blockers, this.rooms) || !lineClear(f, next, this.blockers);
      if (!blocked) { f.x = next.x; f.y = next.y; } else { f.vx *= -0.18; f.vy *= -0.18; }
      if (f.kind !== 'fall' && ((f.z ?? 0) > 0 || (f.vz ?? 0) !== 0)) {
        const vertical = (f.vz ?? 0) - 560 * dt;
        f.z = Math.max(0, (f.z ?? 0) + vertical * dt);
        f.vz = f.z > 0 ? vertical : vertical < -82 && f.kind !== 'blood' ? -vertical * .25 : 0;
        if (f.z === 0) { f.vx *= .46; f.vy *= .46; f.spin = f.vz ? (f.spin || 0) * .35 : 0; }
      }
      const drag = Math.exp(-((f.z ?? 0) > 0 ? 4 : 13) * dt);
      f.vx *= drag; f.vy *= drag; f.life -= dt;
      if (f.rotation !== undefined) f.rotation += (f.spin || 0) * dt;
    }
    this.deathFragments = this.deathFragments.filter(f => f.life > 0);
  }
  private updateParticles(dt: number) {
    for (const f of this.particles) {
      const next = { x: f.x + f.vx * dt, y: f.y + f.vy * dt };
      if ((f.kind === 'hit-blood' || f.kind === 'hit-fabric') && !lineClear(f, next, this.blockers)) f.vx = f.vy = 0;
      else Object.assign(f, next);
      const drag = Math.exp(-6.3 * dt);
      f.vx *= drag; f.vy *= drag; f.life -= dt;
      if (f.kind === 'air-case') {
        f.vz = (f.vz ?? 0) - 460 * dt;
        f.z = Math.max(0, (f.z ?? 0) + f.vz * dt);
        if (f.z > 0) f.rotation = (f.rotation ?? 0) + (f.spin ?? 0) * dt;
      }
    }
    this.particles = this.particles.filter(f => f.life > 0);
    this.updateDeathFragments(dt);
  }
  update(dt: number, controls: Controls) {
    this.bruteFootfalls.length = 0;
    const run = this.operationRun, extraction = run?.extraction;
    if (run?.phase === 'boarding' && extraction?.boarding) {
      dt = clamp(dt, 0, 0.05);
      this.elapsed += dt;
      extraction.pickupTime += dt;
      this.stepOperationAir(dt);
      extraction.boarding.time += dt;
      const departure = extraction.boarding.time - operationBoardingEnd(extraction.boarding.actors.length);
      const rope = this.operationRopePoint;
      if (departure <= 0) this.stepEvacuationPursuit(dt, rope, 61, 610);
      else {
        const craft = operationExtractionAt(extraction.pickupTime, departure);
        const shadow = { x: rope.x + craft.x, y: rope.y + Math.min(80, departure * 54) };
        this.stepEvacuationPursuit(dt, shadow, 75, 660, clamp((1.95 - departure) / .85, 0, 1));
      }
      this.updateParticles(dt);
      if (departure >= OPERATION_DEPARTURE_SECONDS) {
        run.phase = 'strike';
        run.ready = true;
      }
      return;
    }
    dt = clamp(dt, 0, 0.05);
    if (this.status !== 'playing') { this.updateParticles(dt); return; }
    if (this.tutorial) { this.updateTutorial(dt, controls); this.updateMinimap(); return; }
    if (this.floorPending) return;
    this.elapsed += dt;
    if (this.evacuationDrive) {
      this.stepEvacuationPursuit(dt, this.evacuationDrive, 91, 595);
      this.stepEvacuationDrive(dt);
      return;
    }
    this.stepSupplies(dt);
    this.soundFlowBudget = 4;
    for (const sound of this.sounds) ageSound(sound, dt);
    this.sounds = this.sounds.filter(sound => sound.life > 0);
    this.updateTactical(dt);
    for (const [id, value] of this.doorForceCooldown) { const next = value - dt; if (next <= 0) this.doorForceCooldown.delete(id); else this.doorForceCooldown.set(id, next); }
    this.footstepTime -= dt;
    const rolling = this.player.dashTime > 0;
    const previousPosition = { x: this.player.x, y: this.player.y };
    const p = this.player;
    const forced = !!p.knockback;
    if (forced || p.stun > 0 || Math.hypot(controls.x, controls.y) > 0.12) this.cancelGeneratorWork();
    if (!forced) p.angle = controls.angle;
    this.indexUnits();
    this.updateDoors(dt);
    this.updateAlarm(dt);
    for (const e of this.enemies) if ((e.forceOpen || 0) > 0 && e.doorBlockId !== undefined) this.doors[e.doorBlockId].hit = Math.sin(this.elapsed * 55) > 0 ? 0.12 : 0;

    for (const key of ['fire', 'dash', 'invulnerable', 'hit', 'stun'] as const) p[key] = Math.max(0, p[key] - dt);
    if (p.reload > 0) { p.reload -= dt; if (p.reload <= 0) { const rounds = Math.min(this.hero.magazine - p.ammo, this.reserveAmmo); p.ammo += rounds; this.reserveAmmo -= rounds; p.reload = 0; } }
    const moveLen = Math.max(1, Math.hypot(controls.x, controls.y));
    if (forced) this.updateKnockback(p, dt, 17);
    else if (p.dashTime > 0) {
      const rollDt = Math.min(p.dashTime, dt);
      this.move(p, p.dashX * ROLL_SPEED * rollDt, p.dashY * ROLL_SPEED * rollDt, 16, true);
      p.dashTime = p.dashTime - dt < 0.00001 ? 0 : p.dashTime - dt;
      if (!p.dashTime) this.finishRoll();
    }
    else if (p.stun <= 0 && this.generatorProgress === undefined) {
      const speed = this.stats.speed * (this.speedTime > 0 ? 1.2 : 1) * (p.reload > 0 ? 1 + this.hero.reloadSpeed : 1)
        * (this.survivalStairTransit ? .68 : 1);
      this.move(p, controls.x / moveLen * speed * dt, controls.y / moveLen * speed * dt, 16);
    }
    this.advanceSurvivalStair(previousPosition);
    if (this.survival) {
      this.tickSurvivalDoorWork(dt, controls);
      this.survivalScan = Math.max(0, this.survivalScan - dt);
      this.tickSurvivalPlacement(dt, controls);
      this.tickSurvivalSentries(dt);
    }
    if (!forced && this.footstepTime <= 0 && dist(previousPosition, p) > 0.5) { this.emitSound(p, rolling ? 'roll' : 'footstep', rolling ? SOUND_PROFILES.roll : footstepSoundProfile(this.heroId)); this.footstepTime = rolling ? 0.35 : 0.55; }
    if (!forced && (controls.autoFire ? !controls.sweeping && !!this.autoFireTarget() : controls.fire)) this.shoot(false, dist(previousPosition, p) > 0.4);
    const room = roomAt(p, this.rooms);
    if (room >= 0 && !this.visited[room]) { this.visited[room] = true; this.alertRoom(room); this.events.push('room'); }
    this.perceptionTime -= dt;
    if (this.perceptionTime <= 0) { this.perceive(); this.perceptionTime = 0.2; }
    this.flowTime -= dt; if (this.flowTime <= 0) { this.buildFlow(); this.flowTime = 0.4; }
    this.updateSupport(dt, controls.x, controls.y);
    if (this.apartment) this.stepApartment(dt);
    for (const e of this.enemies) {
      if (this.survival && !e.knockback && !this.survivalSearchOrders.has(e) && dist(e, p) > 1550 &&
          !this.survivalMines.some(m => dist(m, e) < 154) &&
          !this.survivalSentries.some(s => s.hp > 0 && dist(s, e) < 550) &&
          (!this.survivalUpperFloor || dist(e, { x: p.x - this.survivalUpperFloor.offsetX, y: p.y }) > 1050)) continue;
      this.enemyStep(e, dt);
      if (p.hp <= 0) break;
    }
    for (const b of this.bullets) {
      if (p.hp <= 0) break;
      const speed = Math.hypot(b.vx, b.vy), travel = speed * Math.min(dt, b.life), angle = Math.atan2(b.vy, b.vx);
      let wall = travel, hitBlock: Rect | undefined;
      for (const r of nearbyRects(this.blockers, b.x, b.y, b.x + b.vx / speed * travel, b.y + b.vy / speed * travel)) {
        const hit = rayRect(b, b.vx / speed, b.vy / speed, r, wall);
        if (hit < wall) { wall = hit; hitBlock = r; }
      }
      let nearest = wall, target: Unit | null = null;
      const targets = b.hostile ? [p, ...this.allies] : this.enemies;
      for (const t of targets) {
        if (t.hp <= 0 && !('type' in t && this.operationInjecting(t))) continue;
        const dx = t.x - b.x, dy = t.y - b.y, along = (dx * b.vx + dy * b.vy) / speed;
        const r = b.airSupport ? 32 : t === p ? 16 : (t as Enemy).type === 'boss' ? 29 : 18;
        const side2 = dx * dx + dy * dy - along * along;
        if (side2 > r * r || along + r < 0) continue;
        const entry = Math.max(0, along - Math.sqrt(Math.max(0, r * r - side2)));
        if (entry < nearest) { nearest = entry; target = t; }
      }
      const range = b.range ?? ((b.traveled ?? 0) + b.life * speed);
      b.traveled = (b.traveled ?? 0) + nearest;
      b.x += Math.cos(angle) * nearest; b.y += Math.sin(angle) * nearest; b.life -= dt;
      if (target) {
        const push = b.push ?? (b.hostile ? 26 : this.hero.bulletPush);
        const near = b.traveled <= 160 ? b.nearPush ?? 0 : 0;
        const fade = !b.hostile || b.firearm ? clamp((b.traveled / Math.max(1, range) - 0.22) / 0.56, 0, 1) : 0;
        const impact: DamageImpact = { angle, distance: push * (1 + near) * (1 - fade * fade * (3 - 2 * fade)),
          shot: b.shot, point: { x: b.x, y: b.y }, heavy: b.airSupport || push * (1 + near) >= 52 };
        if ('type' in target) {
          if (this.operationInjecting(target)) this.emit(b, 5, 'spark');
          else this.damageEnemy(target, b.damage, impact, !b.support);
        }
        else if ('slot' in target) this.hurtAlly(target, b.damage, impact);
        else this.hurt(b.damage, impact);
        b.life = 0;
      }
      else if (wall < travel) {
        b.life = 0;
        const door = hitBlock?.kind?.startsWith('door:') ? this.doors[Number(hitBlock.kind.slice(5))] : undefined;
        if (door && !b.support) this.damageDoor(door, b.damage);
        if (!b.airSupport) this.emit(b, 3, door?.material === 'wood' ? 'wood' : 'spark');
      }
      if (b.airSupport && b.life <= 0 && roomAt(b, this.rooms) >= 0) {
        this.emit(b, 4, 'air-dust');
        this.emit(b, 3, 'air-chip');
      }
    }
    let live = 0;
    for (const bullet of this.bullets) {
      if (bullet.life > 0) this.bullets[live++] = bullet;
      else if (this.bulletPool.length < 96) this.bulletPool.push(bullet);
    }
    this.bullets.length = live;
    this.updateParticles(dt);
    this.unitsIndexed = false;
    this.stepGenerator(dt);
    this.updateMinimap();
    if (p.hp <= 0) return;
    if (this.survival) { this.stepTimedSurvival(dt); return; }
    for (let i = 0; i < this.rooms.length; i++) if (this.discovered[i] && !this.cleared[i] &&
        (!this.stage.operation || this.exitReady) &&
        (!(this.stage.dorm || this.stage.street || this.stage.apartment) || this.enemies.some(e => e.room === i)) &&
        !this.enemies.some(e => e.room === i && e.hp > 0)) {
      this.cleared[i] = true; this.restorePlayerHealth(20); this.events.push('clear');
    }
    if (this.stage.operation) this.stepOperation(dt);
    else if (this.status === 'playing' && !this.exitHold && !this.apartment && this.stage.dorm?.number !== 2 && this.exitReady && dist(p, this.stage.exit) < 65) { this.status = 'won'; this.events.push('win'); }
  }
  claimReward(profile: Profile): { materials: number; tickets: number; coins: number; keys: number } | null {
    if (this.status === 'playing' || this.rewardClaimed) return null;
    this.rewardClaimed = true;
    recordAchievementKills(profile, this.kills);
    const won = this.status === 'won';
    const reward = { materials: (won ? 60 : 10) + this.kills * 3, tickets: won ? 2 : 1, coins: this.coins, keys: won ? addCaseKeys(profile.cases, CLEAR_CASE_KEYS) : 0 };
    profile.materials += reward.materials; profile.tickets += reward.tickets;
    profile.coins += reward.coins;
    if (this.workshopEnabled) {
      const parts = Math.min(MAX_WEAPON_PARTS - profile.armory.parts, this.modCaches * 2 + (this.status === 'won' ? 3 : 0));
      const rolls = this.modCaches + (this.status === 'won' ? 1 : 0), mods: Attachment[] = [];
      profile.armory.parts += parts;
      for (let i = 0; i < rolls; i++) {
        const mod = grantRandomMod(profile.armory, this.heroId, this.status === 'won' && i === rolls - 1);
        if (mod) mods.push(mod);
      }
      this.workshopReward = { parts, mods };
    }
    if (this.status === 'won') profile.victories++;
    if (this.status === 'won' && (this.stage.dorm?.number === 1 || this.stage.id === DORM_LEVEL.id)) profile.streetUnlocked = true;
    if (this.status === 'won' && this.stage.street) profile.apartmentUnlocked = true;
    if (this.status === 'won' && this.stage.apartment?.part === 'garage' && this.apartment?.drive) profile.owned[ENGINEER_ID] = true;
    if (this.stage.id === DORM_LEVEL.id || this.stage.dorm) {
      recordExploration(profile, {
        rooms: this.previousRooms + this.countVisited(),
        kills: this.kills,
        clears: this.clearedTotal,
        extracts: this.status === 'won' ? 1 : 0,
      });
    }
    return reward;
  }
}
