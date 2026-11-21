import type { Door, Enemy, Loot, Point, Rect, SupplyKind } from './Core';
import type { HeroId } from './Heroes';
import { HERO_IDS } from './Heroes';
import type { DoorSpec, EnemySpawn, LevelDefinition } from './Levels';
import { HARBOR_ART_HEIGHT, HARBOR_ART_WIDTH, HARBOR_BUILDINGS, HARBOR_SCALE, HARBOR_UPPER_BUILDINGS, SURVIVAL_LAYOUT, harborPoint, harborRect, harborTerrainBlockers } from './SurvivalHarbor';
import { addSurvivalUpperFloor, placeSurvivalBuilding, type SurvivalBuilding, type SurvivalStair } from './SurvivalInteriors';
import { readSurvivalGear, SurvivalBag, SURVIVAL_DOOR_KINDS, SURVIVAL_GEAR, SURVIVAL_GUNS, survivalBagCols, survivalBagRows, survivalRandom, type SurvivalGearSave } from './SurvivalGear';
import { BLOOD_MOON, EVAC_VEHICLES, newTimedSurvival, readTimedSurvival, SURVIVAL_ACTIVE_HUNT, type TimedSurvivalRun, type TimedSurvivalSave } from './SurvivalTimed';

export const SURVIVAL_MAP_IDS = ['harbor'] as const;
export type SurvivalMapId = typeof SURVIVAL_MAP_IDS[number];
export const SURVIVAL_ITEMS = ['bandage', 'medkit', 'drink', 'mod-cache'] as const;
export type SurvivalOutcome = 'fallen' | 'extracted';
export type SurvivalPool = { coins: number; materials: number };
type CheckpointEnemy = Pick<Enemy, 'room' | 'x' | 'y' | 'type' | 'hp' | 'angle' | 'survivalVariant'>;
type CheckpointDoor = Pick<Door, 'hp' | 'angle' | 'destroyed' | 'fortification'>;
export type SurvivalCheckpoint = {
  layout?: typeof SURVIVAL_LAYOUT;
  version: 2; seed: number; hero: HeroId; elapsed: number; kills: number;
  pool: SurvivalPool; salvage: number; parts: number; position: Point & { hp: number; angle: number; ammo: number };
  reserve: number; supplies: Record<SupplyKind, number>; taken: number[]; doors: CheckpointDoor[];
  enemies: CheckpointEnemy[];
  gear?: SurvivalGearSave;
  timed: TimedSurvivalSave;
};
export type SurvivalRun = {
  pool: SurvivalPool; salvage: number; parts: number; outcome?: SurvivalOutcome; timed: TimedSurvivalRun;
};
export type SurvivalStage = {
  mapId: SurvivalMapId; layout: typeof SURVIVAL_LAYOUT;
  seed: number; fort: Rect; radio: Point; workbench: Point; loot: Loot[];
  buildings: SurvivalBuilding[]; streetRoom: number; stairs: SurvivalStair[];
};

const SURVIVAL_SEARCH_TIERS = [
  { sight: 1, cone: .32, hearing: 1, threshold: .08, memory: 3, search: 13, rooms: 1, scouts: 0, interval: 0, sweepRange: 0 },
  { sight: 1.12, cone: .35, hearing: 1.15, threshold: .061, memory: 4.5, search: 19, rooms: 2, scouts: 0, interval: 0, sweepRange: 0 },
  { sight: 1.24, cone: .38, hearing: 1.30, threshold: .048, memory: 6, search: 28, rooms: 2, scouts: 2, interval: 16, sweepRange: 840 },
  { sight: 1.38, cone: .42, hearing: 1.48, threshold: .038, memory: 8, search: 38, rooms: 3, scouts: 3, interval: 11, sweepRange: 1060 },
] as const;
export const survivalSearchTuning = (elapsed: number) => SURVIVAL_SEARCH_TIERS[
  elapsed < BLOOD_MOON / 2 ? 0 : elapsed < BLOOD_MOON ? 1 : elapsed < SURVIVAL_ACTIVE_HUNT ? 2 : 3];

export function survivalPayout(pool: SurvivalPool, outcome: SurvivalOutcome) {
  const rate = outcome === 'fallen' ? .5 : 1;
  return { coins: Math.floor(pool.coins * rate), materials: Math.floor(pool.materials * rate), tickets: 0, keys: 0 };
}

export function readSurvivalCheckpoint(input: unknown): SurvivalCheckpoint | undefined {
  if (!input || typeof input !== 'object') return;
  const data = input as Omit<SurvivalCheckpoint, 'version' | 'timed'> & { version: number; timed?: TimedSurvivalSave };
  const supplyCap = (kind: typeof SURVIVAL_ITEMS[number]) => Math.max(36, survivalBagRows(data.hero) * survivalBagCols(data.hero) * SURVIVAL_GEAR[kind][3]);
  const integer = (n: unknown, max: number) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max;
  const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n);
  const point = (p: Point | undefined) => !!p && finite(p.x) && finite(p.y);
  if (![1, 2].includes(data.version) || data.layout !== undefined && data.layout !== SURVIVAL_LAYOUT ||
      !integer(data.seed, 0xffffffff) || !HERO_IDS.includes(data.hero) ||
      !finite(data.elapsed) || data.elapsed < 0 || !integer(data.kills, 10000) ||
      !data.pool || !integer(data.pool.coins, 1000000) || !integer(data.pool.materials, 1000000) ||
      !integer(data.salvage, 1000000) || !integer(data.parts, supplyCap('mod-cache')) ||
      !point(data.position) || !finite(data.position.hp) || data.position.hp <= 0 || !finite(data.position.angle) ||
      !integer(data.position.ammo, 1000) || !integer(data.reserve, 100000) ||
      !data.supplies || !(['bandage', 'medkit', 'drink'] as const).every(kind => integer(data.supplies[kind], supplyCap(kind))) ||
      !Array.isArray(data.taken) || data.taken.length > 512 || !data.taken.every(id => integer(id, 512)) ||
      !Array.isArray(data.doors) || data.doors.length < 6 || data.doors.length > 128 ||
      !data.doors.every(d => d && finite(d.angle) && finite(d.hp) && typeof d.destroyed === 'boolean' &&
        (d.fortification === undefined || SURVIVAL_DOOR_KINDS.includes(d.fortification))) ||
      !Array.isArray(data.enemies) || data.enemies.length > 100 ||
      !data.enemies.every(e => point(e) && integer(e.room, 128) && ['walker', 'spitter'].includes(e.type) && finite(e.angle) && finite(e.hp) && e.hp > 0)) return;
  const timed = data.timed ? readTimedSurvival(data.timed, data.elapsed) : undefined;
  if (data.version === 2 && !timed || timed?.spawnedWeapons?.some(id => SURVIVAL_GUNS[id].hero !== data.hero) ||
      data.enemies.some(e => e.survivalVariant && !['runner', 'breaker', 'overrun'].includes(e.survivalVariant))) return;
  let gear = readSurvivalGear(data.gear, data.hero, !!timed);
  if (timed && data.gear && !gear) return;
  if (data.version === 1 && !timed && gear) {
    const bag = new SurvivalBag(survivalBagRows(data.hero), survivalBagCols(data.hero), true);
    const overflow = bag.restore(gear.items, gear.quick);
    gear = { ...gear, bagLayout: 2, items: bag.items, quick: bag.quick, restock: undefined };
    if (overflow.length) gear.crates = [...gear.crates, ...overflow.map(({ id, kind, count, rounds }) => ({
      x: data.position.x, y: data.position.y, id: 'migration-' + id, kind: 'dropped' as const, opened: true,
      goods: [{ kind, count, rounds }],
    }))];
  }
  const { seed, hero, layout, kills, pool, salvage, parts, position, reserve, supplies, taken, doors, enemies } = data;
  const reset = newTimedSurvival();
  return { version: 2, seed, hero, layout, elapsed: timed ? data.elapsed : 0, kills, pool, salvage, parts, position,
    reserve, supplies, taken, doors, enemies, gear, timed: timed ?? { released: reset.released, convoyNotice: false,
      rewardedMinutes: 0, lastDrop: 0, helicopter: reset.helicopter, boat: reset.boat } };
}

export function createSurvivalLevel(seed: number): LevelDefinition {
  const scatter = survivalRandom(seed ^ 0x2817f2a9);
  let state = seed >>> 0;
  const choose = <T,>(values: readonly T[]) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return values[Math.floor(state / 4294967296 * values.length)];
  };
  const fort = harborRect('养护站工事', 927, 267, 228, 125);
  const street = harborRect('港区街道', 0, 0, HARBOR_ART_WIDTH, HARBOR_ART_HEIGHT);
  const rooms = [fort], spawns: EnemySpawn[] = [];
  const sites = HARBOR_BUILDINGS.map(([name, kind, x, y, w, h, entrance, side = 'south'], index) => {
    const footprint = harborRect(name, x, y, w, h);
    const firstRoom = rooms.length;
    const building = placeSurvivalBuilding(kind, footprint, firstRoom, () => choose([-8, 0, 8]),
      (entrance ?? x + w / 2) * HARBOR_SCALE, side, index === 2);
    rooms.push(...building.rooms);
    return { building, firstRoom };
  });
  const streetRoom = rooms.length;
  rooms.push(street);
  const columns: Rect[][] = [];
  const stairs: SurvivalStair[] = [];
  // Reserve the sample's original upstairs coordinates. Keep other roofs above
  // their original world y; separated simulation columns let them share a grid.
  for (const name of HARBOR_UPPER_BUILDINGS) {
    const site = sites.find(({ building }) => building.footprint.kind === name);
    if (!site) continue;
    const { building, firstRoom } = site, f = building.footprint;
    let col = columns.findIndex(ranges => ranges.every(other => f.y >= other.y + other.h + 256 || f.y + f.h + 256 <= other.y));
    if (col < 0) { col = columns.length; columns.push([]); }
    columns[col].push(f);
    const upperRoom = building.kind === 'shop' ? rooms.length : firstRoom + building.rooms.length - 1;
    addSurvivalUpperFloor(building, firstRoom, upperRoom, street.w + 1536 + col * 968);
    const story = building.stair!;
    const last = building.rooms.length - 1;
    building.rooms.forEach((r, i) => { rooms[i === last ? upperRoom : firstRoom + i] = r; });
    stairs.push(story);
  }
  const buildings = sites.map(({ building }, index) => {
    const name = building.footprint.kind;
    if (building.residents.length && index !== 3 && index !== 4 && (index === 1 || scatter(4) === 0) &&
        spawns.length < 16) {
      const rotation = scatter(building.residents.length);
      const residents = building.residents.slice(rotation).concat(building.residents.slice(0, rotation));
      for (const resident of residents.slice(0, index === 1 ? 2 : 1)) {
        const room = rooms.findIndex(r => r !== street && resident.x >= r.x && resident.x <= r.x + r.w &&
          resident.y >= r.y && resident.y <= r.y + r.h);
        if (room >= 0) spawns.push([room, resident.x, resident.y, 'walker']);
      }
    }
    return building;
  });
  const walls: Rect[] = [
    ...harborTerrainBlockers(),
    harborRect('harbor-obstacle', 923, 249, 4, 28), harborRect('harbor-obstacle', 923, 318, 4, 62),
    harborRect('harbor-obstacle', 923, 385, 105, 4), harborRect('harbor-obstacle', 1068, 385, 87, 4),
    harborRect('harbor-obstacle', 1150, 249, 8, 126),
    harborRect('harbor-obstacle', 1007, 183, 16, 9), harborRect('harbor-obstacle', 1134, 182, 23, 10),
    ...buildings.flatMap(building => building.walls),
  ];
  const fortDoors: DoorSpec[] = [
    { ...harborPoint(1030, 387), length: 216, baseAngle: 0, material: 'wood', name: '工事南门', rooms: [0, streetRoom] },
    { ...harborPoint(925, 316), length: 222, baseAngle: Math.PI / 2, material: 'wood', name: '工事西门', rooms: [0, streetRoom] },
  ];
  // The original campaign used the first two IDs to store fort gate durability.
  const doors: DoorSpec[] = [...fortDoors, ...buildings.flatMap(building =>
    building.entries.map(({ inside, ...entry }): DoorSpec => ({ ...entry, rooms: [inside, streetRoom] }))),
    ...buildings.flatMap(building => building.kind === 'shop' ? [] : building.interiorDoors),
    ...buildings.flatMap(building => building.kind === 'shop' ? building.interiorDoors : [])];
  const blackhawk = EVAC_VEHICLES.helicopter.point;
  const furniture = [
    { kind: 'harbor-obstacle', x: blackhawk.x - 27, y: blackhawk.y - 73, w: 54, h: 146 },
    harborRect('survival-radio-harbor', 1107, 312, 34, 24),
    harborRect('survival-craft-bench', 970, 278, 28, 13),
    harborRect('survival-forklift', 268, 454, 34, 24),
    harborRect('harbor-obstacle', 945, 317, 62, 37), harborRect('harbor-obstacle', 1101, 340, 32, 16),
    ...buildings.flatMap(building => building.furniture),
  ];
  const interiors = buildings.flatMap(b => b.rooms.filter(r => r.x < street.w && r.w > 70 && r.h > 70));
  const candidates = interiors.flatMap(r => [0.26, 0.5, 0.74].map(rx => ({ x: r.x + r.w * rx, y: r.y + r.h * .5 }))
    .filter(p => ![...walls, ...furniture].some(s => p.x > s.x - 25 && p.x < s.x + s.w + 25 && p.y > s.y - 25 && p.y < s.y + s.h + 25)));
  const spawn = candidates.length ? choose(candidates) : harborPoint(1043, 334), radio = harborPoint(1092, 325);
  const loot: Loot[] = [];
  const add = (kind: Loot['kind'], x: number, y: number) => loot.push({ id: loot.length, kind, x, y, taken: false });
  for (const [kind, x, y] of [['ammo', 1008, 294], ['medkit', 949, 295], ['mod-cache', 1082, 354]] as const) {
    const spot = harborPoint(x, y);
    add(kind, spot.x, spot.y);
  }
  for (const building of buildings) for (const { kind, x, y } of building.loot) add(kind, x, y);
  add('ammo', spawn.x, spawn.y);
  for (let i = spawns.length - 1; i >= 0; i--) if (Math.hypot(spawns[i][1] - spawn.x, spawns[i][2] - spawn.y) < 200) spawns.splice(i, 1);
  // Leave a few lone ground patrols across the harbor, plus the preplaced indoor residents.
  const patrolOffset = scatter(SURVIVAL_PATROL_POINTS.length);
  for (let index = 0; index < SURVIVAL_PATROL_POINTS.length; index += 3) {
    const district = SURVIVAL_PATROL_POINTS[(patrolOffset + index) % SURVIVAL_PATROL_POINTS.length];
    const [x, y] = district[scatter(district.length)], spot = harborPoint(x, y);
    spawns.push([streetRoom, spot.x, spot.y, 'walker']);
  }
  return { id: 'survival-harbor', title: '生存模式 · 港区工事', rooms, walls, furniture, doors, spawn, exit: radio,
    spawns, hints: [], survival: { mapId: 'harbor', layout: SURVIVAL_LAYOUT, seed: seed >>> 0, fort, radio, workbench: harborPoint(984, 299), loot, buildings, streetRoom,
      stairs } };
}

// Region ordering matches the harbor map legend. Points are on accessible routes.
export const SURVIVAL_FIELD_AREAS = [
  [[1017, 312], [1058, 348], [1095, 368], [1074, 295], [1027, 362], [1008, 285], [1090, 305]],
  [[575, 153], [615, 153], [664, 146], [706, 155], [754, 143], [796, 155], [840, 147], [874, 174]],
  [[267, 435], [303, 432], [319, 464], [291, 484], [315, 565], [262, 643], [319, 638], [192, 656]],
  [[351, 707], [382, 754], [398, 784], [444, 790], [477, 795], [525, 796], [576, 817], [634, 823]],
  [[1010, 551], [1052, 555], [1052, 598], [1054, 644], [1074, 684], [903, 691], [780, 680], [662, 683]],
  [[1245, 432], [1282, 442], [1401, 445], [1445, 467], [1449, 528], [1257, 564], [1275, 667], [1449, 677]],
  [[835, 720], [983, 723], [990, 832], [1050, 859], [1120, 827], [1202, 850], [1283, 862], [1380, 854]],
] as const;

export const SURVIVAL_PATROL_POINTS = [
  [[910, 435], [836, 441], [960, 426]], [[1054, 559], [1026, 551], [1081, 573]],
  [[370, 675], [352, 702], [331, 689]], [[474, 795], [448, 793], [511, 794]],
  [[679, 309], [716, 298], [644, 312]], [[1310, 447], [1414, 443], [1454, 490]],
] as const;
