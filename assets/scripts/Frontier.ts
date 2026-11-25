import type { Point, Rect } from './Core';
import type { DoorSpec, EnemySpawn, LevelDefinition } from './Levels';
import type { SurvivalCrate } from './SurvivalGear';

export const FRONTIER_HOLD = 46;
export const FRONTIER_LIMIT = 42;
export const FRONTIER_BREACH = 7.2;
export const FRONTIER_CUT_END = 11.2;
export const FRONTIER_OPENING_STEP = 1 / 45;
export type FrontierPhase = 'retreat' | 'search' | 'trial' | 'ready' | 'hold' | 'secured' | 'escort';
export type FrontierStage = {
  workbench: Rect; junction: Point; rear: Point; allies: Point[]; lanes: Point[][];
  approach: Point[]; trial: Point; trialLanes: Point[]; defenseSpots: Point[];
  caches: SurvivalCrate[]; ammo: Point; scenery: Rect[]; roads: Rect[]; porches: Rect[];
};

export const FRONTIER_DEFENSE = [
  { kind: 'frontier-wire', x: 552, y: -44, w: 126, h: 26 },
  { kind: 'frontier-wire', x: 552, y: 82, w: 126, h: 26 },
  { kind: 'frontier-wire', x: 552, y: 217, w: 126, h: 26 },
  { kind: 'frontier-wire', x: 552, y: 343, w: 126, h: 26, breaks: true },
  { kind: 'frontier-wire', x: 552, y: 465, w: 126, h: 26, breaks: true },
  { kind: 'frontier-wire', x: 552, y: 590, w: 126, h: 26 },
  { kind: 'frontier-wire', x: 552, y: 713, w: 126, h: 26 },
  ...[36, 190, 350, 510, 650].map(y => ({ kind: 'frontier-hedgehog', x: 598, y, w: 95, h: 52, breaks: y === 350 })),
  ...[[647, 105, 186], [647, 260, 104], [647, 512, 116], [647, 633, 148], [793, 53, 129], [777, 671, 124]]
    .map(([x, y, w]) => ({ kind: 'frontier-sandbags', x, y, w, h: 35 })),
] satisfies (Rect & { kind: string; breaks?: boolean })[];

export const FRONTIER_ARMOR = [
  { kind: 'frontier-opening-tank', x: 864, y: 126, w: 181, h: 96, cadence: 2.5, firstShot: 1.52, angle: -.04 },
  { kind: 'frontier-opening-tank', x: 883, y: 564, w: 188, h: 99, cadence: 2.63, firstShot: 2.27, angle: .03 },
  { kind: 'frontier-opening-carrier', x: 792, y: 315, w: 148, h: 80, cadence: .68, firstShot: 1.18, angle: .04 },
  { kind: 'frontier-opening-carrier', x: 956, y: 405, w: 153, h: 83, cadence: .82, firstShot: 1.65, angle: -.035 },
] as const;

export const FRONTIER_TROOPS: readonly Point[] = [
  { x: 681, y: 66 }, { x: 710, y: 115 }, { x: 683, y: 167 }, { x: 707, y: 220 },
  { x: 684, y: 269 }, { x: 685, y: 316 }, { x: 692, y: 384 }, { x: 712, y: 446 },
  { x: 679, y: 496 }, { x: 705, y: 545 }, { x: 677, y: 603 }, { x: 711, y: 665 },
];

export function frontierWithdraw(post: Point, index: number, elapsed: number) {
  const lane = (post.y < 272 ? 220 : post.y < 490 ? 478 : 664) + (index % 3 - 1) * 9;
  const across = lane - post.y, speed = 144 + index % 3 * 12;
  const moving = Math.max(0, elapsed - (index % 4) * .125);
  const turn = Math.abs(across) / speed;
  return { x: post.x + Math.max(0, moving - turn) * speed, y: post.y + Math.sign(across) * Math.min(Math.abs(across), moving * speed),
    angle: moving === 0 ? Math.PI : moving < turn ? Math.sign(across) * Math.PI / 2 : 0, moving: moving > 0 };
}

export function createFrontierOpening(): LevelDefinition {
  const lanes = [3, 61, 115, 171, 216, 271, 324, 374, 419, 474, 528, 579, 627, 679];
  let seed = 0x520fa11;
  const draw = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const spawns: EnemySpawn[] = Array.from({ length: 224 }, (_, i) => {
    const wave = Math.floor(i / lanes.length), lane = i % lanes.length;
    const x = 297 - wave * 62 + (draw() - .5) * 48 + Math.sin(lane * 2.3 + wave) * 17;
    const y = lanes[lane] + (draw() - .5) * 41 + Math.sin(wave * 1.5 + lane) * 12;
    return [0, x, y, i % 31 === 4 ? 'boss' : i % 19 === 8 ? 'spitter' : 'walker', i % 4];
  });
  const furniture = FRONTIER_DEFENSE.map(part => ({
    kind: 'breaks' in part && part.breaks ? 'frontier-breach' : part.kind,
    x: part.x - part.h / 2, y: part.y - part.w / 2, w: part.h, h: part.w,
  }));
  return { id: 'frontier-opening', title: '前线阵地', rooms: [{ x: -1050, y: -80, w: 2550, h: 880 }], furniture,
    walls: [], doors: [], spawns, hints: [], spawn: { x: 1000, y: 360 }, exit: { x: 1400, y: 360 } };
}

export function createFrontierLevel(): LevelDefinition {
  const rooms: Rect[] = [], walls: Rect[] = [], doors: DoorSpec[] = [];
  const townRoom = 4;
  const town: Rect = { x: 0, y: 0, w: 3750, h: 1530, kind: '风沙镇' };
  const house = (kind: string, x: number, y: number, w: number, h: number, south?: number, north?: number) => {
    const i = rooms.length, thickness = 16, length = 122, reveal = 10;
    rooms.push({ kind, x, y, w, h });
    walls.push({ x, y, w: thickness, h }, { x: x + w - thickness, y, w: thickness, h });
    for (const [edge, hinge] of [[y, south], [y + h, north]] as const) {
      const wy = edge - (edge === y ? 0 : thickness);
      if (hinge === undefined) { walls.push({ x, y: wy, w, h: thickness }); continue; }
      const far = hinge + length + reveal;
      walls.push({ x, y: wy, w: hinge - reveal - x, h: thickness }, { x: far, y: wy, w: x + w - far, h: thickness });
      doors.push({ x: hinge, y: wy + thickness / 2, length, baseAngle: 0, material: 'wood',
        name: kind + (edge === (i === 0 || i === 3 ? y + h : y) ? '临街门' : '后门'), rooms: [i, townRoom] });
    }
  };
  house('镇口维修铺', 1670, 218, 408, 271, 1790, 1859);
  house('杂货店', 457, 643, 366, 263, 575, 650);
  house('加油站', 2270, 715, 298, 258, 2340, 2360);
  house('货运站', 2140, 248, 408, 224, 2250, 2320);
  rooms.push(town);

  const wreck = (kind: string, x: number, y: number, w: number, h: number, angle: number): Rect => ({
    kind, x: x - (w * Math.cos(angle) - h * Math.sin(angle)) / 2,
    y: y - (w * Math.sin(angle) + h * Math.cos(angle)) / 2, w, h, angle,
  });
  const workbench = { kind: 'survival-craft-bench', x: 1695, y: 328, w: 82, h: 51 };
  const furniture: Rect[] = [
    workbench,
    { kind: 'frontier-crates', x: 1996, y: 244, w: 62, h: 52 },
    { kind: 'frontier-shelf', x: 482, y: 853, w: 131, h: 34 },
    { kind: 'frontier-shelf', x: 478, y: 712, w: 34, h: 107 },
    { kind: 'frontier-shelf', x: 2167, y: 253, w: 32, h: 161 },
    { kind: 'frontier-crates', x: 2484, y: 406, w: 45, h: 43 },
    { kind: 'frontier-crates', x: 2504, y: 906, w: 45, h: 41 },
    { kind: 'frontier-town-pumps', x: 2157, y: 644, w: 132, h: 54 },
    { kind: 'frontier-water-tank', x: 2038, y: 816, w: 99, h: 99 },
    { kind: 'frontier-sandbags', x: 2719, y: 486, w: 99, h: 26 },
    { kind: 'frontier-sandbags', x: 2780, y: 669, w: 90, h: 25 },
    { kind: 'frontier-roof-rust', x: 55, y: 228, w: 598, h: 196 },
    { kind: 'frontier-roof-olive', x: 64, y: 664, w: 341, h: 220 },
    { kind: 'frontier-roof-pale', x: 381, y: 1090, w: 320, h: 220 },
    { kind: 'frontier-roof-olive', x: 901, y: 185, w: 480, h: 772 },
    { kind: 'frontier-roof-rust', x: 1625, y: 730, w: 375, h: 738 },
    { kind: 'frontier-roof-pale', x: 2034, y: 1100, w: 471, h: 248 },
    { kind: 'frontier-roof-olive', x: 2920, y: 212, w: 376, h: 259 },
    { kind: 'frontier-roof-rust', x: 2990, y: 720, w: 352, h: 324 },
    { kind: 'frontier-roof-pale', x: 3359, y: 104, w: 301, h: 351 },
    wreck('frontier-wreck-pickup', 71, 551, 192, 70, 1.5),
    wreck('frontier-wreck-wagon', 595, 489, 178, 66, -.23),
    wreck('frontier-wreck-pickup', 1094, 1144, 178, 65, .16),
    wreck('frontier-wreck-wagon', 1501, 800, 155, 61, 1.73),
    wreck('frontier-wreck-pickup', 3196, 654, 175, 66, .15),
    wreck('frontier-wreck-wagon', 3658, 571, 195, 77, 1.52),
  ];
  for (const [x, y, w, h] of [
    [37, 78, 3650, 22], [37, 100, 22, 372], [37, 645, 22, 830],
    [37, 1475, 3650, 22], [3687, 100, 22, 400], [3687, 659, 22, 838],
    [1050, 94, 22, 108], [1790, 1440, 22, 51], [264, 916, 22, 219],
  ]) {
    const span = Math.max(w, h), count = Math.ceil(span / 154);
    for (let i = 0; i < count; i++) {
      const a = i / count, b = (i + 1) / count;
      furniture.push({ kind: 'frontier-wire', x: x + (w > h ? w * a : 0), y: y + (w > h ? 0 : h * a),
        w: w > h ? w * (b - a) : w, h: w > h ? h : h * (b - a) });
    }
  }
  const scenery: Rect[] = [[125, 182], [446, 923], [1395, 1210], [1605, 470], [2167, 911], [2620, 1288], [2840, 270], [3460, 879]]
    .map(([x, y]) => ({ kind: 'frontier-cactus', x, y, w: 52, h: 60 }));
  const roads = [
    { x: -640, y: 469, w: 1515, h: 174 },
    { x: 733, y: 643, w: 168, h: 496 },
    { x: 726, y: 976, w: 833, h: 173 },
    { x: 1382, y: 488, w: 200, h: 499 },
    { x: 1530, y: 488, w: 2860, h: 186 },
    { x: 2585, y: 99, w: 178, h: 1375 },
    { x: 425, y: 916, w: 466, h: 57 },
    { x: 1625, y: 116, w: 1170, h: 78 },
  ];
  const porches = [
    { x: 60, y: 429, w: 606, h: 28 }, { x: 69, y: 637, w: 755, h: 22 },
    { x: 1664, y: 476, w: 892, h: 21 }, { x: 2252, y: 696, w: 318, h: 26 },
  ];
  const cache = (id: string, x: number, y: number, goods: SurvivalCrate['goods']): SurvivalCrate =>
    ({ id, x, y, kind: 'engineering', goods, opened: false });
  const caches = [
    cache('frontier-shop', 1979, 363, [
      { kind: 'sentry-base', count: 1 }, { kind: 'sentry-bracket', count: 1 }, { kind: 'sentry-barrel', count: 1 },
      { kind: 'door-metal', count: 2 },
    ]),
    cache('frontier-grocery', 722, 776, [{ kind: 'tactical-module', count: 2 }, { kind: 'bandage', count: 2 }, { kind: 'grenade', count: 1 }]),
    cache('frontier-fuel', 2473, 852, [
      { kind: 'sentry-base', count: 1 }, { kind: 'sentry-barrel', count: 1 },
      { kind: 'mod-cache', count: 5 }, { kind: 'tactical-stock', count: 5 },
    ]),
    cache('frontier-freight', 2438, 318, [
      { kind: 'sentry-bracket', count: 1 }, { kind: 'tactical-module', count: 3 },
      { kind: 'door-metal', count: 4 },
    ]),
  ];
  const clusters = [[734, 577, 10], [550, 987, 8], [1200, 1056, 12], [1495, 701, 4], [2160, 604, 9]];
  const spawns: EnemySpawn[] = clusters.flatMap(([x, y, count], cluster) => Array.from({ length: count }, (_, i): EnemySpawn =>
    [townRoom, x + (i % 4 - 1.5) * 43, y + (Math.floor(i / 4) - 1) * 38 + i % 2 * 9,
      i === 3 && cluster % 2 === 0 ? 'spitter' : 'walker', i % 4]));
  return { id: 'frontier-town', title: '风沙防线', rooms, walls, furniture, doors, spawns, hints: [],
    spawn: { x: 188, y: 558 }, exit: { x: 3500, y: 569 }, frontier: {
      workbench, trial: { x: 1860, y: 635 }, junction: { x: 2816, y: 580 }, rear: { x: 3130, y: 580 },
      approach: [{ x: 850, y: 579 }, { x: 855, y: 1054 }, { x: 1445, y: 1047 }, { x: 1431, y: 579 }, { x: 1870, y: 552 }],
      defenseSpots: [{ x: 2718, y: 547 }, { x: 2775, y: 629 }],
      trialLanes: Array.from({ length: 16 }, (_, i) => ({ x: 1426 + i % 4 * 36, y: 716 + Math.floor(i / 4) * 43 })),
      allies: [{ x: 152, y: 510 }, { x: 126, y: 560 }, { x: 158, y: 607 }], caches, scenery, roads, porches,
      ammo: { x: 2387, y: 309 },
      lanes: [
        Array.from({ length: 16 }, (_, i) => ({ x: 2609 + i % 4 * 37, y: 1050 + Math.floor(i / 4) * 58 })),
        Array.from({ length: 16 }, (_, i) => ({ x: 2607 + i % 4 * 37, y: 135 + Math.floor(i / 4) * 52 })),
      ],
    } };
}
