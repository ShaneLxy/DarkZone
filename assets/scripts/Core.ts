// Pure gameplay code: no browser or engine dependencies.
import type { ApartmentFloor, DoorSpec, DormKey, EnemySpawn, LevelDefinition } from './Levels';
import { DORM_LEVEL } from './Levels';
import { ageSound, consumeTactical, footstepSoundProfile, GRENADE_BLAST_LIFE, hearSoundThroughGeometry, isShopMine, makeSoundEvent, newTacticalLoadout, resolveTactical, SOUND_PROFILES, stepTactical, tacticalPoint, TACTICAL_DEFINITIONS, type SoundEvent, type TacticalKind, type TacticalLoadout } from './Tactical';
import { GEAR, grantRandomMod, readArmory, type Armory, type ConsumableId } from './Shop';
import { configuredHero, installedMods, MAX_WEAPON_PARTS, type Attachment } from './WeaponMods';
import { readDailyMissions, recordExploration, type DailyState } from './DailyMissions';
import { readCheckIn, type CheckInState } from './CheckIn';
import { addCaseKeys, CLEAR_CASE_KEYS, readCaseState, type CaseState } from './LootCases';
import { ENGINEER_ID, GHOST_ID, HERO_IDS, HEROINE_ID, heroes, type HeroId } from './Heroes';
import { DormTutorial, sanitizeTutorial, type TutorialStep } from './Tutorial';
import { sanitizeIds, recordClue } from './ClueReader';
import { readAchievementProgress, recordAchievementKills, type AchievementProgress } from './Achievements';
import { OPERATION_ENEMY_CAP, OPERATION_HOLD, OPERATION_MG } from './Operation';
export { DORM_LEVEL };
export { ENGINEER_ID, GHOST_ID, HERO_IDS, HEROINE_ID, heroes, type HeroId };
export type Point = { x: number; y: number };
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
export type Door = DoorSpec & { id: number; thickness: number; angle: number; target: number; openAngle: number; hp: number; maxHp: number; destroyed: boolean; hit: number; blocked: number; locked: boolean };
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
export function walkable(p: Point, radius = 16, blocks = obstacles, spaces = rooms): boolean {
  return roomAt(p, spaces) >= 0 && !blocks.some(r => circleRect(p, radius, r));
}
// Distance to the first intersection of a finite ray and an axis-aligned rectangle.
export function rayRect(p: Point, dx: number, dy: number, r: Rect, max: number): number {
  if (r.angle) {
    const c = Math.cos(r.angle), s = Math.sin(r.angle), px = p.x - r.x, py = p.y - r.y;
    return rayRect({ x: px * c + py * s, y: -px * s + py * c }, dx * c + dy * s, -dx * s + dy * c, { x: 0, y: 0, w: r.w, h: r.h }, max);
  }
  let lo = 0, hi = max;
  for (const [s, d, a, b] of [[p.x, dx, r.x, r.x + r.w], [p.y, dy, r.y, r.y + r.h]]) {
    if (Math.abs(d) < 1e-8) { if (s < a || s > b) return max; }
    else { const t1 = (a - s) / d, t2 = (b - s) / d; lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2)); if (hi < lo) return max; }
  }
  return lo <= max && hi >= 0 ? Math.max(0, lo) : max;
}
export function rayDistance(p: Point, angle: number, max: number, blocks = obstacles): number {
  const dx = Math.cos(angle), dy = Math.sin(angle);
  let length = max;
  for (const r of blocks) length = Math.min(length, rayRect(p, dx, dy, r, length));
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
export function visibilityPolygon(origin: Point, facing: number, blocks = obstacles, visionRange = DEFAULT_VISION_RANGE): Point[] {
  return castSight(origin, facing, blocks, visionRange, angle => sightRange(angle, facing, visionRange));
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
export type Profile = { version: number; owned: Record<HeroId, boolean>; levels: Record<HeroId, number>; mobilityLevels: Record<HeroId, number>; attackLevels: Record<HeroId, number>; materials: number; coins: number; tickets: number; draws: number; victories: number; streetUnlocked: boolean; apartmentUnlocked: boolean; operationArchive?: boolean; sound: boolean; aimAssist: boolean; autoFire: boolean; daily: DailyState; checkIn: CheckInState; tacticalUnlocked: TacticalKind[]; achievements: string[]; achievementProgress: AchievementProgress; clues: string[]; tutorial: TutorialStep; tutorialSeen: boolean; tutorialCompleted: boolean; tutorialSkipped: boolean; tutorialDismissed: boolean; armory: Armory; cases: CaseState };
export const PROFILE_VERSION = 5;
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
    if (v.version < PROFILE_VERSION) onMigration?.();
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
export type OperationPhase = 'brief' | 'landing' | 'line1' | 'line2' | 'line3' | 'breach' | 'leader-fight' | 'injection' | 'king-fight' | 'king-escape' | 'new-order' | 'complete' | 'retreat' | 'announcement' | 'hold' | 'strike' | 'debrief';
export type Enemy = Point & { id: number; room: number; type: 'walker' | 'spitter' | 'boss' | 'gunner'; appearance?: number; operationBoss?: 'leader' | 'king'; hp: number; maxHp: number; angle: number; cooldown: number; hit: number; windup: number; attackAngle: number; stun: number; paralysis?: number; charge?: BruteCharge; chargeCooldown?: number; lastSeen?: Point; combatMemory?: number; soundOnly?: boolean; hearingAlert?: boolean; investigate?: Point; investigateTime?: number; alarmInvestigation?: boolean; searchTime?: number; doorBlockId?: number; doorBlockCount?: number; forceOpen?: number; doorClearId?: number; doorClearTime?: number; doorClearPoint?: Point; knockback?: ForcedKnockback; lastHitShot?: number; attackAlly?: Ally };
type BruteGait = { phase: number; traveled: number; updated: number; planted: number; steps: number };
export type Ally = Point & { id: number; slot: number; hp: number; maxHp: number; angle: number; cooldown: number; ammo: number; burst: number; hit: number; muzzle: number; retreat?: Point; rethink?: number; footstepTime?: number; knockback?: ForcedKnockback };
export type Bullet = Point & { vx: number; vy: number; life: number; damage: number; hostile: boolean; push?: number; nearPush?: number; shot?: number; trainingAuto?: boolean; support?: boolean };
export type Particle = Point & { vx: number; vy: number; life: number; max: number; kind: string; owner?: number; size?: number; rotation?: number; spin?: number; z?: number; vz?: number };
export type BloodStain = Point & { radius: number; seed: number; angle?: number; drops?: number; outline?: Point[]; droplets?: (Point & { radius: number })[] };
export type ForcedKnockback = { start: Point; end: Point; elapsed: number; duration: number; doorId?: number; exiting?: boolean };
type DamageImpact = { angle: number; distance: number; shot?: number };
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
  player: Player;
  hero: ReturnType<typeof configuredHero>;
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
  tacticalThrows: Array<Point & { kind: TacticalKind; delay: number; origin: Point; angle?: number }> = [];
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
  emitSound(position: Point, type: keyof typeof SOUND_PROFILES, profile: { intensity: number; radius: number } = SOUND_PROFILES[type]) {
    // Bound simultaneous events even when several enemies interact in one frame.
    if (this.sounds.some(s => s.type === type && s.life > s.maxLife - 0.08 && dist(s.position, position) < 12)) return;
    this.sounds.push(makeSoundEvent(position, profile.intensity, type, profile.radius));
    if (this.sounds.length > 48) this.sounds.splice(0, this.sounds.length - 48);
  }
  private emitDoorInteract(d: Door, success: boolean) {
    const now = this.elapsed, last = this.doorSoundTime.get(d.id) ?? -Infinity;
    if (now - last < 0.35) return;
    this.doorSoundTime.set(d.id, now);
    this.emitSound({ x: d.x + Math.cos(d.baseAngle) * d.length / 2, y: d.y + Math.sin(d.baseAngle) * d.length / 2 }, success ? 'door-open' : 'door-interact', SOUND_PROFILES['door-interact']);
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
  throwTactical(): boolean {
    if (this.tutorial || this.evacuationDrive || this.generatorProgress !== undefined) return false;
    if (this.status !== 'playing' || this.player.dashTime > 0 || this.player.hit > 0 || this.player.stun > 0 || this.player.knockback) return false;
    const kind = this.tactical.selected!;
    const mine = isShopMine(kind);
    const point = tacticalPoint(this.player, this.player.angle, mine ? 34 : 150, this.blockers, (p, a, d, blocks) => rayDistance(p, a, d, [...blocks]));
    if (mine && (!walkable(point, 11, this.blockers, this.rooms) || this.plantedMines.some(item => dist(item, point) < 34))) return false;
    const available = this.tactical.remaining;
    if (!consumeTactical(this.tactical)) return false;
    if (kind === this.purchasedTactical) this.spendIfPurchased(kind, available);
    if (mine) {
      this.plantedMines.push({ ...point, kind, angle: this.player.angle, delay: 0.45 });
      this.events.push('mine-set'); return true;
    }
    this.tacticalThrows.push({ ...point, kind, delay: TACTICAL_DEFINITIONS[kind].delay, origin: { x: this.player.x, y: this.player.y } });
    this.events.push('throw'); return true;
  }
  private updateTactical(dt: number) {
    stepTactical(this.tactical, dt);
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
      item.delay -= dt;
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
        this.damageEnemy(e as Enemy, damage, { angle, distance: EXPLOSIVE_PUSH[item.kind] });
      }, () => {});
      // Test the closest leaf surface with that leaf excluded; other doors and walls still shield it.
      if (definition.doorDamage > 0) for (const door of this.doors) {
        const surface = closestOnRect(item, doorShape(door));
        if (!door.destroyed && dist(item, surface) <= definition.radius && (item.kind !== 'claymore' || inCone({ ...item, angle: item.angle! }, surface)) && lineClear(item, surface, this.blockers.filter(r => r.kind !== 'door:' + door.id))) this.damageDoor(door, definition.doorDamage);
      }
      const lifetime = item.kind === 'grenade' ? GRENADE_BLAST_LIFE : 0.55;
      this.tacticalEffects.push({ x: item.x, y: item.y, kind: item.kind, life: lifetime, max: lifetime });
      if (item.kind !== 'grenade') this.emit(item, 20, definition.damage > 0 ? 'spark' : 'wood');
      this.emitSound(item, 'explosion', { ...SOUND_PROFILES.explosion, intensity: definition.loudness });
      this.events.push(item.kind === 'grenade' ? 'grenade-blast' : 'explosion');
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
  operationRun?: { ready: boolean; waypoint: number; hold: number; wave: number; cursor: number; airSupport: boolean;
    sector: number; reinforcements: number; strike?: Point & { time: number };
    phase: OperationPhase; bossId: number; kingEscaped: boolean; survivors: number; announced: boolean; slam: number };
  get operationGoal() {
    const run = this.operationRun, stage = this.stage.operation;
    return run && stage && (stage.part === 'defense' || this.exitReady) ? stage.route[Math.min(run.waypoint, stage.route.length - 1)] : undefined;
  }
  get objective() {
    const operation = this.stage.operation, run = this.operationRun;
    if (operation && run) {
      if (operation.part === 'defense') {
        const goal = run.waypoint < operation.route.length ? '沿主街向西，撤往海岸登陆点' : `守住登陆点 · ${Math.ceil(run.hold)} 秒`;
        return run.announced ? goal + ' · 核打击窗口 1 小时' : goal;
      }
      const left = this.enemies.filter(e => e.hp > 0).length;
      if (operation.part === 'compound') {
        if (run.phase === 'leader-fight') return '压制「阀」首领 · 注意他会攻击队友' + (left ? ` · 剩余 ${left}` : '');
        if (run.phase === 'king-fight') return '击败丧尸王 · 提防砸地与突进' + (left ? ` · 剩余 ${left}` : '');
        if (run.kingEscaped) return '任务更新：撤回登陆区 · 前往指挥室出口';
        return '搜查连体建筑并肃清指挥室守卫' + (left ? ` · 剩余 ${left}` : '');
      }
      if (left) return ['离开登陆区，夺下街口阵地', '穿过市集，留意侧翼增援', '拔除重火力点，推进至指挥部'][run.sector] + ` · 剩余 ${left}`;
      return '前往街区东侧的指挥部';
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
    return this.stage.operation ? this.stage.operation.part === 'compound' ? 1 : OPERATION_OUTDOOR_VISION_SCALE : 1;
  }
  get playerVisionRange() { return this.stats.visionRange * this.visionScale; }
  get allyVisionRange() { return ALLY_VISION_RANGE * this.visionScale; }
  get exitReady() {
    if (this.stage.operation) return this.stage.operation.part !== 'defense' && !this.enemies.some(e => e.hp > 0);
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
  constructor(public heroId: HeroId = GHOST_ID, public level = 1, public stage: LevelDefinition = FACILITY_LEVEL, growth: Partial<Growth> = {}, armory?: Armory) {
    const kit = armory?.kits[heroId];
    const gun = (id: HeroId) => configuredHero(id, armory?.kits[id].weaponLevel, installedMods(id, armory?.kits[id], armory?.mods));
    this.hero = gun(heroId);
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
  }
  private setupFloor(stage: LevelDefinition) {
    this.stage = stage;
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
      const angle = operation.part === 'defense' ? Math.PI : 0;
      this.player.angle = this.squadHeading = angle;
      const phase: OperationPhase = operation.part === 'city' ? 'landing' : operation.part === 'compound' ? 'leader-fight' : 'retreat';
      this.operationRun = { ready: false, waypoint: 0, hold: OPERATION_HOLD, wave: 3, cursor: 0,
        airSupport: operation.part === 'city', sector: 0, reinforcements: 0, phase,
        bossId: -1, kingEscaped: false, survivors: previousRun?.survivors ?? operation.allies.length,
        announced: false, slam: -2.5 };
      const defenseRoster = operation.part === 'defense' ? previous.filter(ally => ally.hp > 0).slice(0, 2) : undefined;
      const roster: Array<Point & { hp?: number }> = defenseRoster ?? operation.allies;
      this.allies = roster.map((point, slot) => {
        const surviving = operation.part === 'compound' ? previous[slot] : undefined;
        const hp = defenseRoster ? point.hp ?? 110 : surviving?.hp ?? 110;
        return { ...point, id: -1 - slot, slot, hp, maxHp: 110, angle, cooldown: 0.4, ammo: 18, burst: 0, hit: 0, muzzle: 0 };
      });
    }
    this.doors = createDoors(stage.doors);
    const spawnRoom = roomAt(stage.spawn, stage.rooms);
    this.visited = stage.rooms.map((_, i) => i === spawnRoom);
    this.discovered = [...this.visited]; this.alerted = [...this.visited]; this.cleared = stage.rooms.map(() => false);
    this.enemies = [];
    for (const spawn of stage.spawns) this.spawnEnemy(spawn);
    this.syncGeometry();
    this.placeLoot();
    this.updateMinimap();
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
      if (ahead < -70 - radius || ahead > 77 + radius + step || Math.abs(side) > 54 + radius) continue;
      this.damageEnemy(enemy, Math.max(enemy.hp, 1), { angle: drive.angle, distance: 88 });
    }
    drive.x += dx * step; drive.y += dy * step;
    Object.assign(this.player, { x: drive.x, y: drive.y, angle: drive.angle });
    if (step >= distance && ++drive.target === route.length) {
      this.status = 'won';
      this.events.push('win');
    }
    this.updateParticles(dt);
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
    if (this.stage.operation) {
      const drops: Array<[number, number, Loot['kind']]> = this.stage.operation.part === 'compound' ?
        [[495, 936, 'ammo'], [1300, 1260, 'medkit'], [1540, 675, 'ammo'], [2280, 1325, 'ammo'], [2815, 1230, 'bandage']] :
        this.stage.operation.part === 'city' ?
          [[730, 695, 'ammo'], [1283, 995, 'medkit'], [1560, 1155, 'ammo'], [2180, 1185, 'bandage'],
            [2622, 1000, 'ammo'], [3180, 595, 'ammo'], [3575, 1155, 'medkit'], [3730, 888, 'coins']] :
          [[2750, 685, 'ammo'], [2105, 1170, 'ammo'], [1475, 1235, 'medkit'], [950, 650, 'ammo']];
      this.loot = drops.map(([x, y, kind], id) => ({ x, y, kind, id, taken: false }));
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
    if (this.evacuationDrive || this.generatorProgress !== undefined) return false;
    const p = this.player;
    if (this.status !== 'playing' || this.tutorial || this.floorPending || this.usingSupply || p.dashTime > 0 || p.knockback || p.stun > 0 || this.supplies[kind] <= 0 || kind !== 'drink' && p.hp >= p.maxHp) return false;
    this.usingSupply = { kind, time: SUPPLY_INFO[kind].duration };
    this.events.push('supply-start');
    return true;
  }
  private cancelSupply() {
    if (!this.usingSupply) return;
    this.usingSupply = undefined;
    this.events.push('supply-cancel');
  }
  private stepSupplies(dt: number) {
    const p = this.player;
    const healing = Math.min(dt, this.healingTime);
    if (healing > 0) { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.25 / 5 * healing); this.healingTime -= healing; }
    this.speedTime = Math.max(0, this.speedTime - dt);
    if (!this.usingSupply) return;
    this.usingSupply.time -= dt;
    if (this.usingSupply.time > 0) return;
    const kind = this.usingSupply.kind;
    this.spendIfPurchased(kind, this.supplies[kind]);
    this.supplies[kind]--;
    this.usingSupply = undefined;
    if (kind === 'bandage') this.healingTime = 5;
    if (kind === 'medkit') p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.6);
    if (kind === 'drink') { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.1); this.speedTime = 10; }
    this.events.push('supply-used');
  }
  private spawnEnemy([room, x, y, type, appearance]: EnemySpawn) {
    const id = this.enemySequence++, hp = type === 'boss' ? 650 : type === 'spitter' ? 52 :
      type === 'gunner' ? appearance === OPERATION_MG ? 84 : 48 : 66;
    const angle = type === 'gunner' ? Math.PI : 0;
    const operationBoss = this.stage.operation?.part === 'compound' && type === 'boss' ? 'leader' as const : undefined;
    const enemy: Enemy = { id, room, x, y, type, appearance, operationBoss, hp, maxHp: hp, angle, cooldown: 1 + id % 3 * 0.3, hit: 0, windup: 0, attackAngle: 0, stun: 0, doorBlockCount: 0 };
    const vacant = this.stage.street || this.stage.operation?.part === 'defense' || this.stage.apartment?.outdoor ? this.enemies.findIndex(e => e.hp <= 0) : -1;
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
  useOperationSupport() {
    const run = this.operationRun;
    if (!run?.airSupport || this.status !== 'playing' || this.player.hp <= 0) return false;
    const p = this.player;
    const range = rayDistance(p, p.angle, 315, this.blockers) - 12;
    if (range < 60) return false;
    run.airSupport = false;
    run.strike = { x: p.x + Math.cos(p.angle) * range, y: p.y + Math.sin(p.angle) * range, time: 0.8 };
    this.events.push('operation-air-request');
    return true;
  }
  private stepOperation(dt: number) {
    const plan = this.stage.operation, run = this.operationRun;
    if (!plan || !run || run.ready) return;
    if (run.strike && (run.strike.time -= dt) <= 0) {
      const impact = run.strike;
      run.strike = undefined;
      for (const e of this.enemies) if (e.hp > 0 && dist(impact, e) <= 180 && lineClear(impact, e, this.blockers)) {
        this.damageEnemy(e, 95, { angle: Math.atan2(e.y - impact.y, e.x - impact.x), distance: 80 });
      }
      this.tacticalEffects.push({ ...impact, kind: 'grenade', life: GRENADE_BLAST_LIFE, max: GRENADE_BLAST_LIFE });
      this.events.push('grenade-blast');
    }
    if (plan.part === 'compound') {
      if (!run.kingEscaped) {
        const leader = this.enemies.find(e => e.operationBoss === 'leader');
        if (leader && leader.hp <= 0 && run.phase === 'leader-fight') this.resolveOperationBoss(leader);
      }
      const king = this.enemies.find(e => e.operationBoss === 'king' && e.hp > 0);
      if (king) this.stepKingSlam(king, dt);
      if (run.kingEscaped && run.phase === 'king-escape') run.phase = 'new-order';
    }
    if (plan.part !== 'defense') {
      if (plan.part === 'city') {
        const sector = this.player.x >= 2680 ? 2 : this.player.x >= 1500 ? 1 : 0;
        if (!run.ready && sector > run.sector && !this.exitReady) {
          run.sector = sector; run.reinforcements = 4; run.wave = 0.7;
          this.events.push(sector === 1 ? 'operation-market' : 'operation-emplacement');
        }
        run.phase = this.exitReady ? 'breach' : (['line1', 'line2', 'line3'] as OperationPhase[])[sector];
        if (run.reinforcements > 0 && (run.wave -= dt) <= 0 &&
          this.enemies.filter(e => e.hp > 0 && dist(e, this.player) < 610).length < OPERATION_ENEMY_CAP) {
          const spawn = plan.reinforcements.find(p => dist(p, this.player) < 630 && this.canSpawn(p, 360, 16, OPERATION_SPAWN_SIGHT_CAP));
          if (spawn) { this.spawnEnemy([0, spawn.x, spawn.y, 'gunner']); run.reinforcements--; }
          run.wave = spawn ? 1.4 : 0.45;
        }
      }
      run.ready = this.exitReady && dist(this.player, this.stage.exit) < 85 &&
        (plan.part !== 'compound' || run.kingEscaped);
      if (run.ready && plan.part === 'compound') run.phase = 'complete';
      return;
    }
    const waypoint = plan.route[run.waypoint];
    if (waypoint && dist(this.player, waypoint) < 110) {
      run.waypoint++;
      if (run.waypoint === plan.route.length) this.events.push('operation-hold');
    }
    if (!run.announced && run.waypoint >= 3) {
      run.announced = true; run.phase = 'announcement';
      this.events.push('operation-announcement');
    }
    if (!waypoint && dist(this.player, this.stage.exit) < 215) run.hold = Math.max(0, run.hold - dt);
    run.ready = run.hold === 0;
    run.phase = run.ready ? 'strike' : !waypoint ? 'hold' : run.phase;
    run.wave -= dt;
    if (run.wave > 0 || this.enemies.filter(e => e.hp > 0).length >= OPERATION_ENEMY_CAP || run.ready) return;
    const holding = run.waypoint === plan.route.length, lz = this.stage.exit;
    const sector = holding && run.hold >= 10 ? run.cursor % 3 : -1;
    const inSector = (point: Point) => sector < 0 ||
      (sector === 0 ? point.x - lz.x > 420 : sector === 1 ? point.y - lz.y < -180 : point.y - lz.y > 180);
    for (let i = 0; i < plan.reinforcements.length; i++) {
      const spawn = plan.reinforcements[(run.cursor + i) % plan.reinforcements.length];
      if (!inSector(spawn) || dist(spawn, this.player) > 920 || !this.canSpawn(spawn, 285, 16, OPERATION_SPAWN_SIGHT_CAP)) continue;
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
  sees(point: Point, extraRange = 0) {
    const p = this.player;
    return (p.hp > 0 && visible(p, p.angle, point, this.visionBlockers, this.playerVisionRange + extraRange)) ||
      this.allies.some(ally => ally.hp > 0 && visible(ally, ally.angle, point, this.visionBlockers, this.allyVisionRange + extraRange)) ||
      this.grenadeLights.some(light => dist(light, point) <= GRENADE_LIGHT_RADIUS && lineClear(light, point, this.visionBlockers));
  }
  private updateMinimap() {
    const p = this.player, old = this.minimapSight, allies = this.allies.filter(ally => ally.hp > 0);
    const lights = this.grenadeLights;
    const unchanged = (a: Point & { angle: number }, b: Point & { angle: number }) => dist(a, b) < 6 && Math.abs(angleDiff(a.angle, b.angle)) < 0.04;
    if (old && old.geometry === this.geometryRevision && unchanged(old, p) &&
      allies.length === this.minimapAllies.length && allies.every((ally, i) => unchanged(ally, this.minimapAllies[i])) &&
      lights.length === this.minimapGrenadeLights.length && lights.every((light, i) => light === this.minimapGrenadeLights[i])) return;
    this.minimapSight = { x: p.x, y: p.y, angle: p.angle, geometry: this.geometryRevision };
    this.minimapAllies = allies.map(({ x, y, angle }) => ({ x, y, angle }));
    this.minimapGrenadeLights = lights;
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
    map.revision++;
  }
  private canSpawn(point: Point, minDistance: number, radius = 16, sightCap = Infinity) {
    const p = this.player;
    const seen = (p.hp > 0 && visible(p, p.angle, point, this.visionBlockers, Math.min(this.playerVisionRange, sightCap) + radius)) ||
      this.allies.some(ally => ally.hp > 0 && visible(ally, ally.angle, point, this.visionBlockers, Math.min(this.allyVisionRange, sightCap) + radius)) ||
      this.grenadeLights.some(light => dist(light, point) <= GRENADE_LIGHT_RADIUS && lineClear(light, point, this.visionBlockers));
    return dist(p, point) >= minDistance && !seen &&
      walkable(point, radius, this.blockers, this.rooms) && this.unitSpaceFree(point, radius);
  }
  private spawnBullet(spec: Bullet) {
    const bullet = this.bulletPool.pop();
    if (!bullet) this.bullets.push(spec);
    else this.bullets.push(Object.assign(bullet, { push: undefined, nearPush: undefined, shot: undefined, trainingAuto: undefined, support: undefined }, spec));
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
    this.blockers = [...this.obstacles, ...this.doors.filter(d => !d.destroyed).map(d => doorShape(d))];
    this.visionBlockers = this.stage.apartment?.glass ? this.blockers.filter(blocker => blocker !== this.stage.apartment?.glass) : this.blockers;
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
    const p = this.player, detectionRange = 360 * this.visionScale;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      const distance = dist(e, p);
      if (this.stage.operation && distance > Math.max(850, this.playerVisionRange * 1.1)) continue;
      if (distance <= Math.max(detectionRange, this.playerVisionRange) && lineClear(e, p, this.blockers)) {
        if (distance <= sightRange(Math.atan2(e.y - p.y, e.x - p.x), p.angle, this.playerVisionRange)) this.discovered[e.room] = true;
        if (distance <= detectionRange && Math.abs(angleDiff(Math.atan2(p.y - e.y, p.x - e.x), e.angle)) <= Math.PI * 0.32) { e.investigate = undefined; e.hearingAlert = false; e.alarmInvestigation = false; e.lastSeen = { x: p.x, y: p.y }; e.combatMemory = 3; e.soundOnly = false; this.alertRoom(e.room); continue; }
      }
      // Room alert is shared history, not a grant to ignore a sound snapshot.
      // An enemy that has actually seen the player retains a short pursuit memory.
      if ((e.combatMemory || 0) > 0) continue;
      const heard = this.sounds.filter(sound => {
        if (e.investigate && (sound.type === 'door-break' || sound.type !== 'alarm' && sound.intensity < 0.7)) return false;
        return true;
      }).map(sound => hearSoundThroughGeometry(e, sound, this.blockers, rayRect, id => this.doors[id]?.material))
        .filter(sound => sound && sound.effectiveIntensity >= 0.08).sort((a, b) => b!.effectiveIntensity - a!.effectiveIntensity)[0];
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
      const q = closestOnRect(p, doorShape(d)), distance = dist(p, q);
      if (distance < best && lineClear(p, q, this.blockers.filter(r => r.kind !== 'door:' + d.id))) { nearest = d; best = distance; }
    }
    return nearest;
  }
  private openDoor(d: Door, actor: Point) {
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
    const apartment = this.nearbyApartmentStation();
    if (apartment) return apartment;
    if (this.stage.dorm?.number === 2 && this.doors.some(d => d.key === 'stairs' && !d.locked) && dist(p, this.stage.exit) < 78 && lineClear(p, this.stage.exit, this.blockers)) return { id: 'descend' as const, name: '前往一楼' };
    return undefined;
  }
  nearbyPickup() {
    const p = this.player, key = this.pickup;
    if (key && dist(p, key) < 72 && lineClear(p, key, this.blockers)) return key;
    const item = this.loot.find(item => !item.taken && dist(p, item) < 58 && lineClear(p, item, this.blockers) && this.sees(item));
    if (item) return { id: 'loot' as const, item, name: item.kind === 'ammo' ? '弹药 · 拾取' : item.kind === 'coins' ? '金币 · 拾取' : item.kind === 'mod-cache' ? '配件箱 · 拾取' : SUPPLY_INFO[item.kind].name + ' · 拾取' };
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
    if (!this.canInteract()) return false;
    const target = this.nearbyObjective();
    if (!target) return this.interactDoor();
    if (target.id === 'apartment') return this.useApartmentStation(target.station);
    this.floorPending = true;
    this.events.push('descend');
    return true;
  }
  collectPickup(): boolean {
    if (!this.canInteract()) return false;
    const target = this.nearbyPickup();
    if (!target) return false;
    if (target.id === 'loot') {
      const item = target.item;
      if (item.kind === 'ammo') this.reserveAmmo += this.hero.magazine;
      else if (item.kind === 'coins') this.coins += 20;
      else if (item.kind === 'mod-cache') { this.modCaches++; this.events.push('mod-cache'); }
      else {
        if (this.supplies[item.kind] >= this.supplyLimit) { this.events.push('supply-full'); return false; }
        this.supplies[item.kind]++;
      }
      item.taken = true;
      this.events.push('loot');
      return true;
    }
    if (target.id === 'street-supply') {
      if (this.player.hp >= this.player.maxHp) return false;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
      this.streetSupplyTaken = true;
      this.events.push('street-supply');
      return true;
    }
    this.keys.add(target.id); this.events.push('key-pickup');
    return true;
  }
  interactDoor(): boolean {
    if (this.status !== 'playing' || this.player.knockback) return false;
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
    const hardBlocked = Array.from({ length: 65 }, (_, i) => doorShape(d, d.angle + (target - d.angle) * i / 64, 18)).some(shape =>
      this.obstacles.some(r => r.kind !== 'jamb' && rectIntersects(shape, r)) || this.doors.some(other => other !== d && !other.destroyed && rectIntersects(shape, doorShape(other))));
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
    if (d.material === 'steel') { this.emit(d, 3, 'spark'); return false; }
    d.hp = Math.max(0, d.hp - Math.max(0, damage));
    if (d.hp <= 0) {
      d.destroyed = true; this.emit({ x: d.x + Math.cos(d.angle) * d.length / 2, y: d.y + Math.sin(d.angle) * d.length / 2 }, 18, 'wood');
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
        const blockedByWall = this.obstacles.some(r => r.kind !== 'jamb' && rectIntersects(doorShape(d, next, 18), r));
        const blockedByDoor = this.doors.some(other => other !== d && !other.destroyed && rectIntersects(shape, doorShape(other)));
        if (blockedByActor || blockedBySelf || blockedByWall || blockedByDoor) {
          if (attempting) {
            this.doorAttempts.delete(d.id);
            const hardSweep = Array.from({ length: 65 }, (_, j) => doorShape(d, d.angle + (d.target - d.angle) * j / 64, 18)).some(s => this.obstacles.some(r => r.kind !== 'jamb' && rectIntersects(s, r)) || this.doors.some(other => other !== d && !other.destroyed && rectIntersects(s, doorShape(other))));
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
  private indexUnits() {
    for (const bucket of this.unitBuckets.values()) {
      bucket.length = 0;
      this.unitBucketPool.push(bucket);
    }
    this.unitBuckets.clear();
    if (this.player.hp > 0) this.indexUnit(this.player);
    for (const unit of [...this.enemies, ...this.allies]) if (unit.hp > 0) this.indexUnit(unit);
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
    if (distance <= 0) return;
    const strength = 'type' in actor && actor.type === 'boss' ? distance * 0.55 : distance;
    const previous = actor.knockback;
    if (previous && (previous.doorId !== undefined || strength <= dist(previous.start, previous.end) + 0.01)) return;
    actor.knockback = {
      start: { x: actor.x, y: actor.y },
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
  reload() { const p = this.player; if (this.status === 'playing' && !this.evacuationDrive && this.generatorProgress === undefined && !p.knockback && (this.reserveAmmo > 0 || this.tutorial) && p.ammo < this.hero.magazine && p.reload <= 0) { p.reload = this.hero.reload; this.events.push('reload'); } }
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
  private shedBlood(p: Unit) {
    const count = this.particles.reduce((total, particle) => total + Number(particle.kind === 'hit-blood'), 0);
    const rear = p.angle + Math.PI;
    const owner = 'id' in p ? p.id : undefined;
    const radius = 'type' in p && p.type === 'boss' ? 37 : 27;
    for (let i = 0; i < Math.min(4, 64 - count); i++) {
      const direction = rear + (i - 1.5) * 0.34 + (Math.random() - 0.5) * 0.12;
      const dx = Math.cos(direction), dy = Math.sin(direction);
      const size = 2.6 + Math.random() * 1.1;
      const offset = Math.max(0, rayDistance(p, direction, radius + size, this.blockers) - size);
      const speed = 125 + Math.random() * 55, life = 0.43 + Math.random() * 0.13;
      this.particles.push({ x: p.x + dx * offset, y: p.y + dy * offset, vx: dx * speed, vy: dy * speed,
        life, max: life, kind: 'hit-blood', owner, size });
    }
  }
  private resolveOperationBoss(e: Enemy) {
    const run = this.operationRun;
    if (!run || run.kingEscaped || run.phase === 'complete' || run.phase === 'king-escape' || run.phase === 'new-order') return;
    e.hp = 0; e.hit = e.windup = 0; e.knockback = undefined; e.charge = undefined;
    if (e.operationBoss === 'leader') {
      const keep = Math.min(this.allies.filter(ally => ally.hp > 0).length, 2);
      run.survivors = keep;
      let kept = 0;
      for (const ally of this.allies) {
        if (ally.hp <= 0) continue;
        if (kept < keep) { kept++; continue; }
        this.hurtAlly(ally, ally.hp, { angle: 0, distance: 0 });
      }
      run.phase = 'injection';
      this.events.push('operation-injection');
      const king = this.spawnEnemy([0, e.x, e.y, 'boss']);
      king.operationBoss = 'king';
      king.hp = king.maxHp = 1100;
      king.x = e.x; king.y = e.y;
      run.bossId = king.id;
      run.phase = 'king-fight';
      run.slam = -2.5;
    } else {
      run.kingEscaped = true;
      run.phase = 'king-escape';
      this.events.push('operation-king-escape');
    }
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
      if (run.slam === 0 && dist(king, this.player) < 430) run.slam = 0.0001;
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
      if (playerKill) this.kills++;
      e.hit = e.windup = 0; e.knockback = undefined;
      this.particles = this.particles.filter(f => f.owner !== e.id);
      {
        const seed = (Math.random() * 0x7fffffff) | 0; let state = seed;
        const rand = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
        const count = e.type === 'boss' ? 16 : 10;
        const impulseX = impact ? Math.cos(impact.angle) * impact.distance : 0;
        const impulseY = impact ? Math.sin(impact.angle) * impact.distance : 0;
        for (let i = 0; i < count; i++) {
          const a = impact && i % 3 === 0 ? impact.angle + (rand() - 0.5) * 1.1 : rand() * TAU;
          const speed = 58 + rand() * (e.type === 'boss' ? 145 : 105);
          this.deathFragments.push({ x: e.x, y: e.y, vx: Math.cos(a) * speed + impulseX, vy: Math.sin(a) * speed + impulseY, life: 0.28 + rand() * 0.34, max: 0.62, kind: i % 3 === 0 ? 'blood' : 'body', size: (e.type === 'boss' ? 4 : 3) + rand() * 4, rotation: rand() * TAU, spin: (rand() - 0.5) * 12, z: 2, vz: 45 + rand() * 55 });
        }
        if (this.deathFragments.length > 128) this.deathFragments.splice(0, this.deathFragments.length - 128);
        const stain: BloodStain = { x: e.x, y: e.y, radius: (e.type === 'boss' ? 35 : 23) * (0.88 + rand() * 0.24), seed: seed >>> 0, angle: rand() * TAU, drops: 3 + Math.floor(rand() * 5), outline: [], droplets: [] };
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
      this.events.push('kill');
    } else if (impact?.shot === undefined || impact.shot !== e.lastHitShot) {
      e.lastHitShot = impact?.shot;
      this.shedBlood(e);
      if (impact) this.pushFromHit(e, impact);
    }
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
      this.addBloodStain({ x: ally.x, y: ally.y, radius: 24, seed: ally.id * 1013 });
    } else {
      this.shedBlood(ally);
      this.pushFromHit(ally, impact);
    }
  }
  private hurt(damage: number, impact: DamageImpact = { angle: this.player.angle + Math.PI, distance: 27 }) {
    const p = this.player;
    if (this.status !== 'playing' || damage <= 0 || p.invulnerable > 0 || p.hp <= 0) return;
    this.cancelSupply();
    this.cancelGeneratorWork();
    p.hp = Math.max(0, p.hp - damage * (1 - this.protection)); p.invulnerable = 0.65; p.hit = 0.22; this.events.push('hurt');
    this.shedBlood(p);
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
    return this.status !== 'playing' || p.hp <= 0 ? '非战斗状态' : this.floorPending ? '换层中' : this.shootingBlockedReason ||
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
    p.ammo--; p.fire = this.stats.interval; this.events.push('shoot');
    if (!this.tutorial) this.emitSound(p, h.weapon, h.shotSound);
    const shot = ++this.shotSequence;
    const spread = Math.max(h.spreadFloor, h.spread * (moving ? 1 - h.movingSpread : 1));
    for (let i = 0; i < h.pellets; i++) {
      const a = p.angle + (Math.random() - 0.5) * spread * 2;
      // Spawn at the player; continuous ray collision includes the whole barrel segment.
      this.spawnBullet({ x: p.x, y: p.y, vx: Math.cos(a) * 1000, vy: Math.sin(a) * 1000, life: h.range / 1000, damage: this.stats.damage, hostile: false, push: h.bulletPush, nearPush: h.nearPush, shot, trainingAuto });
    }
    // Start on the consuming shot, not on a later fire request.
    if (p.ammo === 0) this.reload();
  }
  private buildFlow() { this.flowTo(this.player, this.flow); }
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
  private flowTo(point: Point, flow: Int32Array) {
    if (this.gridDirty) {
      // Closed usable doors are planned as passages: the AI opens/breaks them on approach.
      // Swung leaves remain real obstacles, including while fully open.
      const navigation = [...this.obstacles, ...this.doors.filter(d => !d.destroyed && (d.locked || d.alarm && this.alarmTime === null || Math.abs(d.angle - d.baseAngle) > 0.25)).map(d => doorShape(d))];
      for (let i = 0; i < this.grid.length; i++) this.grid[i] = walkable(this.cellPoint(i), 18, navigation, this.rooms) ? 1 : 0;
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
    const queue = this.flowQueue;
    let head = 0, tail = 0; queue[tail++] = start; flow[start] = 0;
    while (head < tail) {
      const idx = queue[head++];
      for (const next of this.adjacentCells(idx)) {
        if (this.grid[next] && flow[next] < 0) { flow[next] = flow[idx] + 1; queue[tail++] = next; }
      }
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
  private soundWaypoint(e: Enemy | Ally, source: Point) {
    const angle = Math.atan2(source.y - e.y, source.x - e.x);
    const dx = -Math.sin(angle) * 15, dy = Math.cos(angle) * 15;
    if (lineClear(e, source, this.blockers) && [-1, 1].every(side => lineClear({ x: e.x + side * dx, y: e.y + side * dy }, { x: source.x + side * dx, y: source.y + side * dy }, this.blockers))) return source;
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
    return this.flowStep(e, flow);
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
    if (door.material === 'wood' && door.blocked > 0 && 'type' in e) {
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
    if (holding) return Array.from({ length: 8 }, (_, i) => {
      const angle = (-100 + i * 200 / 7) * Math.PI / 180, radius = i % 2 ? 150 : 100;
      return { back: -Math.cos(angle) * radius, side: Math.sin(angle) * radius, guard: angle };
    });
    if (this.stage.operation?.part === 'compound') return Array.from({ length: 8 }, (_, i) =>
      ({ back: 30 + i * 75, side: i % 2 ? -45 : 45, guard: i % 2 ? -0.5 : 0.5 }));
    return [
      { back: -40, side: 0, guard: 0 },
      { back: 60, side: -115, guard: -0.6 }, { back: 60, side: 115, guard: 0.6 },
      { back: 165, side: -165, guard: -0.8 }, { back: 165, side: 165, guard: 0.8 },
      { back: 265, side: -95, guard: -1 }, { back: 265, side: 95, guard: 1 },
      { back: 345, side: 0, guard: Math.PI },
    ];
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
    if (Math.hypot(dx, dy) > 0.1) this.squadHeading = Math.atan2(dy, dx);
    const cos = Math.cos(this.squadHeading), sin = Math.sin(this.squadHeading);
    const operation = this.stage.operation;
    const holding = operation?.part === 'defense' && !!this.operationRun && this.operationRun.waypoint >= operation.route.length;
    const slots = this.squadSlots(holding);
    const slotPoint = (index: number): Point => {
      const slot = slots[index % slots.length];
      return { x: p.x - cos * slot.back - sin * slot.side, y: p.y - sin * slot.back + cos * slot.side };
    };
    this.squadReform = Math.max(0, this.squadReform - dt);
    const live = this.allies.filter(ally => ally.hp > 0);
    if (this.squadReform === 0 && live.length > 1) {
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
      const enemy = lanes ? visibleEnemies[ally.slot % lanes].target : undefined;
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
      const anchor = slotPoint(ally.slot);
      const following = dist(ally, p) > (enemy || reported ? 300 : 175);
      const standingAhead = !following && !holding && slot.back >= 0 && (ally.x - p.x) * cos + (ally.y - p.y) * sin > 0 && dist(ally, p) < 86;
      let target: Point = anchor;
      if (!walkable(anchor, 15, this.blockers, this.rooms) || !lineClear(ally, anchor, this.blockers)) {
        target = lineClear(ally, p, this.blockers) ? p : this.flowStep(ally, this.flow) ?? p;
      }
      if (reported && !enemy) {
        const angle = Math.atan2(reported.y - ally.y, reported.x - ally.x), side = ally.slot % 2 ? 1 : -1;
        const peek = { x: ally.x + Math.cos(angle) * 60 - Math.sin(angle) * side * 70,
          y: ally.y + Math.sin(angle) * 60 + Math.cos(angle) * side * 70 };
        if (walkable(peek, 15, this.blockers, this.rooms)) target = peek;
      }
      if (standingAhead) target = { x: ally.x - sin * (slot.side < 0 ? -70 : 70), y: ally.y + cos * (slot.side < 0 ? -70 : 70) };
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
      if ((pushX || pushY) && !retreating) {
        const separated = { x: target.x + pushX * 0.9, y: target.y + pushY * 0.9 };
        if (walkable(separated, 15, this.blockers, this.rooms)) target = separated;
      }
      const aim = Math.atan2(target.y - ally.y, target.x - ally.x);
      const beforeMove = { x: ally.x, y: ally.y };
      ally.footstepTime = Math.max(0, (ally.footstepTime ?? 0) - dt);
      const steady = !!enemy && nearest < 280 && !following;
      if (retreating) {
        if (ally.retreat) this.advanceUnit(ally, ally.retreat, 176, dt);
      } else if (!steady && (following || standingAhead || target !== p && dist(ally, target) > 32)) {
        ally.angle = aim;
        if (!this.investigateDoor(ally, target, aim)) this.advanceUnit(ally, target, following ? 212 : 128, dt);
      } else if (!enemy && !reported && dist(ally, anchor) < 40) ally.angle = this.squadHeading + slot.guard;
      if (ally.footstepTime <= 0 && dist(beforeMove, ally) > 0.5) { this.emitSound(ally, 'footstep', footstepSoundProfile(0)); ally.footstepTime = 0.55; }
      if (enemy) ally.angle = Math.atan2(enemy.y - ally.y, enemy.x - ally.x);
      else if (reported) ally.angle = Math.atan2(reported.y - ally.y, reported.x - ally.x);
      if (!enemy || ally.cooldown > 0) continue;
      const gun = this.supportGuns[GHOST_ID], base = heroes[GHOST_ID];
      if (ally.ammo <= 0) ally.ammo = 18 + gun.magazine - base.magazine;
      if (!lineClear(ally, enemy, this.blockers)) continue;
      const angle = ally.angle = Math.atan2(enemy.y - ally.y, enemy.x - ally.x);
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
        this.spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * 740, vy: Math.sin(a) * 740, hostile: true,
          life: (range + 40) / 740, damage: emplacement ? 9 : 7, push: emplacement ? 20 : 12 });
      }
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
  private enemyStep(e: Enemy, dt: number) {
    if (e.hp <= 0) return;
    e.hit = Math.max(0, e.hit - dt);
    if (e.paralysis) e.paralysis = Math.max(0, e.paralysis - dt);
    const stunned = e.stun > 0;
    if (stunned) e.stun = Math.max(0, e.stun - dt);
    if (e.knockback) { this.updateKnockback(e, dt, e.type === 'boss' ? 26 : 16); e.windup = 0; return; }
    if (stunned) { e.windup = 0; return; }
    if (e.combatMemory !== undefined) e.combatMemory = Math.max(0, e.combatMemory - dt);
    if (this.stepDoorClear(e, dt)) return;
    if (e.type === 'gunner' && this.stage.operation) { this.stepOperationGunner(e, dt); return; }
    if (e.operationBoss === 'king' && this.stepBruteCharge(e, dt)) return;
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
    const pursuing = activeOutside || !!e.operationBoss || this.stage.operation?.part === 'defense' || !!this.stage.street && this.alarmTime !== null || !!apartment && ['return', 'hold', 'lift', 'car-hold', 'car-ready'].includes(apartment.phase);
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
    if (!pursuing && !ally && (!clear || d > 360 || Math.abs(angleDiff(Math.atan2(p.y - e.y, p.x - e.x), e.angle)) > Math.PI * 0.32) && e.windup <= 0 && !e.forceOpen) {
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
            const damage = e.type === 'boss' ? 28 : 17;
            if ('slot' in p) this.hurtAlly(p, damage, impact);
            else this.hurt(damage, impact);
          }
        }
        else for (let i = 0; i < (e.type === 'boss' && e.operationBoss !== 'leader' ? 9 : 1); i++) {
          const a = e.attackAngle + (e.type === 'boss' && e.operationBoss !== 'leader' ? (i - 4) * 0.16 : 0);
          const speed = e.type === 'gunner' ? 610 : 240;
          this.spawnBullet({ x: e.x, y: e.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, hostile: true, life: e.type === 'gunner' ? 0.64 : 3.5, damage: e.type === 'boss' ? 23 : e.type === 'gunner' ? 12 : 16, push: e.type === 'boss' ? 37 : 26 });
        }
      }
      return;
    }
    const range = e.type === 'walker' ? 48 : e.type === 'boss' ? apartment ? 72 : 390 : 310;
    if (!pursuing && !clear && e.cooldown <= 0) {
      const door = this.nearbyDoor(e, e.type === 'boss' ? 75 : 54);
      if (door && !door.rooms.some(room => room === this.stage.apartment?.safeRoom) &&
          !door.locked && (!door.alarm || this.alarmTime !== null) && rayRect(e, Math.cos(e.angle), Math.sin(e.angle), doorShape(door), d) < d && Math.abs(door.angle - door.baseAngle) < 1.5 && !e.forceOpen) {
        if (door.material === 'wood' && e.type !== 'spitter') {
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
    else this.advanceUnit(e, { x: tx, y: ty }, speed, dt);
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
      f.vz = (f.vz || 0) - 430 * dt; f.z = Math.max(0, (f.z || 0) + f.vz * dt);
      if (f.z === 0) { f.vz = 0; f.spin = 0; }
      const drag = Math.exp(-(f.z === 0 ? 18 : 4) * dt);
      f.vx *= drag; f.vy *= drag; f.life -= dt;
      if (f.rotation !== undefined) f.rotation += (f.spin || 0) * dt;
    }
    this.deathFragments = this.deathFragments.filter(f => f.life > 0);
  }
  private updateParticles(dt: number) {
    for (const f of this.particles) {
      const next = { x: f.x + f.vx * dt, y: f.y + f.vy * dt };
      if (f.kind === 'hit-blood' && !lineClear(f, next, this.blockers)) f.vx = f.vy = 0;
      else Object.assign(f, next);
      const drag = Math.exp(-6.3 * dt);
      f.vx *= drag; f.vy *= drag; f.life -= dt;
    }
    this.particles = this.particles.filter(f => f.life > 0);
    this.updateDeathFragments(dt);
  }
  update(dt: number, controls: Controls) {
    this.bruteFootfalls.length = 0;
    dt = clamp(dt, 0, 0.05);
    if (this.status !== 'playing') { this.updateParticles(dt); return; }
    if (this.tutorial) { this.updateTutorial(dt, controls); this.updateMinimap(); return; }
    if (this.floorPending) return;
    this.elapsed += dt;
    if (this.evacuationDrive) { this.stepEvacuationDrive(dt); return; }
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
      const speed = this.stats.speed * (this.speedTime > 0 ? 1.2 : 1) * (p.reload > 0 ? 1 + this.hero.reloadSpeed : 1);
      this.move(p, controls.x / moveLen * speed * dt, controls.y / moveLen * speed * dt, 16);
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
      this.enemyStep(e, dt);
      if (p.hp <= 0) break;
    }
    for (const b of this.bullets) {
      if (p.hp <= 0) break;
      const speed = Math.hypot(b.vx, b.vy), travel = speed * dt, angle = Math.atan2(b.vy, b.vx);
      let wall = travel, hitBlock: Rect | undefined;
      for (const r of this.blockers) { const hit = rayRect(b, b.vx / speed, b.vy / speed, r, wall); if (hit < wall) { wall = hit; hitBlock = r; } }
      let nearest = wall, target: Unit | null = null;
      const targets = b.hostile ? [p, ...this.allies] : this.enemies;
      for (const t of targets) {
        if (t.hp <= 0) continue;
        const dx = t.x - b.x, dy = t.y - b.y, along = (dx * b.vx + dy * b.vy) / speed;
        const r = t === p ? 16 : (t as Enemy).type === 'boss' ? 29 : 18;
        const side2 = dx * dx + dy * dy - along * along;
        if (side2 > r * r || along + r < 0) continue;
        const entry = Math.max(0, along - Math.sqrt(Math.max(0, r * r - side2)));
        if (entry < nearest) { nearest = entry; target = t; }
      }
      b.x += Math.cos(angle) * nearest; b.y += Math.sin(angle) * nearest; b.life -= dt;
      if (target) {
        const push = b.push ?? (b.hostile ? 26 : this.hero.bulletPush);
        const near = b.nearPush && (this.hero.range / speed - b.life - dt) * speed + nearest <= 160;
        const impact = { angle, distance: near ? push * (1 + b.nearPush!) : push, shot: b.shot };
        if ('type' in target) this.damageEnemy(target, b.damage, impact, !b.support);
        else if ('slot' in target) this.hurtAlly(target, b.damage, impact);
        else this.hurt(b.damage, impact);
        b.life = 0;
      }
      else if (wall < travel) {
        b.life = 0;
        const door = hitBlock?.kind?.startsWith('door:') ? this.doors[Number(hitBlock.kind.slice(5))] : undefined;
        if (door && !b.support) this.damageDoor(door, b.damage);
        this.emit(b, 3, door?.material === 'wood' ? 'wood' : 'spark');
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
    for (let i = 0; i < this.rooms.length; i++) if (this.discovered[i] && !this.cleared[i] && (!(this.stage.dorm || this.stage.street || this.stage.apartment) || this.enemies.some(e => e.room === i)) && !this.enemies.some(e => e.room === i && e.hp > 0)) { this.cleared[i] = true; if (p.hp > 0) p.hp = Math.min(p.maxHp, p.hp + 20); this.events.push('clear'); }
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
