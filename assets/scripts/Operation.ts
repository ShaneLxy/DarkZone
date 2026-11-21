import type { Loot, Point, Rect } from './Core';
import type { DoorSpec, EnemySpawn, LevelDefinition } from './Levels';

export type OperationPart = 'city' | 'compound' | 'defense';
export type OperationEncounter = { center: Point; radius: number; enemies: EnemySpawn[]; objective: string };
export type OperationStage = {
  part: OperationPart;
  allies: Point[];
  encounters: OperationEncounter[];
  roads: Point[][];
  reinforcements: Point[];
  interiors: Rect[];
  scenery: Rect[];
  chapel?: { bounds: Rect; approach: Rect; passage: Point; positions: Point[]; runner: Rect };
  drops: Array<[Point, Loot['kind']]>;
};

export const OPERATION_WIDTH = 5600;
export const OPERATION_HEIGHT = 3000;
export const OPERATION_HOLD = 14;
export const OPERATION_BOSS_NAME = '里姆雷特';
export const OPERATION_AIR_DURATION = 20;
export const OPERATION_AIR_COOLDOWN = 120;
export const OPERATION_AIR_VISION = 920;
export const OPERATION_AIR_RANGE = 520;
export const OPERATION_AIR_CANNON = { interval: .0625, speed: 2200, radius: 57, damage: 16 } as const;
export const OPERATION_GRENADE_RANGE = 340;
export const OPERATION_GRENADE_FUSE = 0.5;
export const OPERATION_INJECTION_DURATION = 1.6;
export const OPERATION_AIR_PODS = { side: 30, forward: 43, flashTime: 0.085 };
export const OPERATION_EXTRACT_RADIUS = 170;
export const OPERATION_BOARD_RADIUS = 88;
export const OPERATION_PICKUP_READY = 3.45;
export const OPERATION_BOARD_GATHER = 1.15;
export const OPERATION_BOARD_SLOT = 0.82;
export const OPERATION_DEPARTURE_SECONDS = 2.5;
export const OPERATION_ROPE_FOOT = { x: 86, y: -36 };
export const operationBoardingEnd = (count: number) => OPERATION_BOARD_GATHER + count * OPERATION_BOARD_SLOT;
export const OPERATION_WEST_DOOR_RADIUS = 70;
export const OPERATION_LEADER = { x: 3626, y: 1240 };
export const OPERATION_MG = 3;
export const OPERATION_ENEMY_CAP = 24;
const point = (x: number, y: number) => ({ x, y });
const rect = (x: number, y: number, w: number, h: number, kind?: string): Rect => ({ x, y, w, h, kind });
const gunner = ([x, y, appearance]: number[]): EnemySpawn => [0, x, y, 'gunner', appearance];

type Opening = { side: 'north' | 'south' | 'east' | 'west'; start: number; name?: string };
function buildRoom(shape: Rect, openings: Opening[], walls: Rect[], doors: DoorSpec[]) {
  const thickness = 24, length = 116;
  for (const side of ['north', 'south', 'east', 'west'] as const) {
    const horizontal = side === 'north' || side === 'south';
    const axis = horizontal ? shape.y + (side === 'north' ? shape.h : 0) : shape.x + (side === 'east' ? shape.w : 0);
    let current = horizontal ? shape.x : shape.y;
    const end = current + (horizontal ? shape.w : shape.h);
    const cap = (from: number, to: number) => {
      if (to <= from) return;
      walls.push(horizontal ? rect(from, axis - thickness / 2, to - from, thickness) :
        rect(axis - thickness / 2, from, thickness, to - from));
    };
    for (const opening of openings.filter(o => o.side === side).sort((a, b) => a.start - b.start)) {
      cap(current, opening.start);
      current = opening.start + length;
      // Leave the latch end clear of the fixed wall throughout the swing.
      if (opening.name) doors.push({ x: horizontal ? opening.start : axis, y: horizontal ? axis : opening.start,
        baseAngle: horizontal ? 0 : Math.PI / 2, length: length - 4, name: opening.name, rooms: [0, 0], material: 'wood' });
    }
    cap(current, end);
  }
}


// The district shares the same plan on the way in and on the way out.
// Map coordinates match chapter4-layout-draft.svg before its diagonal rotation.
const districtAngle = Math.PI / 12;
function districtPoint(x: number, y: number): Point {
  const dx = x - 556, dy = y - 300, cos = Math.cos(districtAngle), sin = Math.sin(districtAngle);
  return { x: Math.round((547 + dx * cos + dy * sin) * 5), y: Math.round((300 + dx * sin - dy * cos) * 5) };
}
const route = (...coordinates: [number, number][]) => coordinates.map(([x, y]) => districtPoint(x, y));
function footprint(x: number, y: number, w: number, h: number, kind: string): Rect {
  return { ...districtPoint(x, y + h), w: w * 5, h: h * 5, angle: districtAngle, kind };
}
const cityGunners = (positions: [number, number, number?][]) => positions.map(([x, y, appearance]) => {
  const p = districtPoint(x, y);
  return [0, p.x, p.y, 'gunner', appearance] as EnemySpawn;
});
const mainStreet = route([237, 350], [309, 360], [309, 288], [400, 288], [400, 361],
  [422, 361], [492, 345], [548, 345], [563, 367], [637, 367], [637, 337],
  [758, 337], [758, 390], [835, 390], [835, 329], [961, 329]);
const northStreet = route([482, 339], [513, 246], [565, 214], [751, 214], [834, 279], [834, 329]);
const freightStreet = route([483, 364], [523, 481], [691, 481], [772, 439], [835, 439], [888, 391], [956, 391], [969, 337]);
export const OPERATION_LZ = districtPoint(237, 350);
export const OPERATION_EXTRACT = OPERATION_LZ;
export const OPERATION_AIRCRAFT = OPERATION_LZ;
export const OPERATION_APPROACH_RADIUS = 460;
export const OPERATION_COMMAND_RADIUS = 175;
const commandEntry = districtPoint(961, 329);
const cityEncounters: OperationEncounter[] = [
  { center: districtPoint(424, 360), radius: 350, objective: '穿过沿岸步行道，前往旧城街口',
    enemies: cityGunners([[462, 342], [482, 368], [508, 327], [523, 351], [500, 386], [517, 375]]) },
  { center: districtPoint(578, 365), radius: 345, objective: '通过旧城街口，进入市集',
    enemies: cityGunners([[613, 363], [645, 326], [652, 351], [694, 341], [722, 343], [710, 281], [649, 271], [631, 385]]) },
  { center: districtPoint(818, 387), radius: 365, objective: '穿过市集，推进到指挥部外侧',
    enemies: cityGunners([[840, 345, OPERATION_MG], [882, 326, OPERATION_MG], [873, 371], [909, 333],
      [856, 308], [893, 390], [925, 383], [940, 319]]) },
];
function districtLevel(part: 'city' | 'defense'): LevelDefinition {
  const defense = part === 'defense';
  const walls = [
    rect(0, 0, OPERATION_WIDTH, 28), rect(0, OPERATION_HEIGHT - 28, OPERATION_WIDTH, 28),
    rect(0, 0, 715, OPERATION_HEIGHT, 'op-sea'), rect(OPERATION_WIDTH - 28, 0, 28, OPERATION_HEIGHT),
  ];
  const scenery: Rect[] = [];
  const solid = (shape: Rect) => {
    scenery.push(shape);
    walls.push({ ...shape, kind: 'op-roof' });
  };
  for (const [x, y, w, h] of [
    [325, 208, 70, 38], [337, 315, 38, 69], [325, 416, 74, 43], [433, 245, 50, 54], [420, 408, 59, 49],
    [483, 155, 49, 32], [541, 150, 49, 32], [601, 150, 49, 32], [701, 151, 49, 32], [761, 155, 49, 32],
    [534, 244, 49, 32], [592, 242, 49, 32], [704, 240, 49, 32], [764, 282, 49, 27], [846, 235, 49, 32],
    [785, 313, 23, 50], [977, 278, 84, 103], [1032, 423, 33, 32],
  ]) solid(footprint(x, y, w, h, 'op-coast-home'));
  for (const [x, y, w, h] of [
    [573, 279, 46, 76], [660, 352, 72, 54], [541, 520, 113, 56], [666, 514, 103, 62],
    [777, 478, 91, 57], [547, 422, 74, 27], [947, 424, 74, 28],
  ]) solid(footprint(x, y, w, h, 'op-coast-warehouse'));
  // Close the shallow seams between adjoining roofs, especially behind the market hall.
  for (const [x, y, w, h] of [
    [532, 157, 9, 23], [590, 157, 11, 23], [750, 158, 11, 21],
    [583, 247, 9, 23], [573, 273, 46, 8],
  ]) solid(footprint(x, y, w, h, 'op-wall-mid'));
  for (const [x, y, w, h] of [
    [908, 228, 177, 5], [1080, 233, 5, 244], [908, 477, 177, 5],
    [908, 233, 5, 74], [908, 348, 5, 27], [908, 407, 5, 70], [341, 383, 32, 35],
  ]) solid(footprint(x, y, w, h, 'op-wall-mid'));
  const furniture = [
    footprint(354, 260, 20, 10, 'op-coast-cargo'), footprint(448, 309, 20, 10, 'op-coast-cargo'),
    footprint(687, 288, 30, 21, 'op-coast-stall'), footprint(623, 397, 21, 16, 'op-coast-stall'),
    footprint(567, 456, 20, 10, 'op-coast-cargo'), footprint(749, 479, 17, 10, 'op-coast-cargo'),
    footprint(920, 267, 26, 15, 'op-coast-cargo'), footprint(981, 406, 18, 12, 'op-coast-cargo'),
  ];
  const drops: OperationStage['drops'] = [
    [districtPoint(285, 345), 'ammo'], [districtPoint(389, 313), 'medkit'], [districtPoint(521, 352), 'ammo'],
    [districtPoint(602, 381), 'bandage'], [districtPoint(679, 328), 'ammo'], [districtPoint(806, 405), 'medkit'],
    [districtPoint(936, 322), 'ammo'], [districtPoint(222, 381), 'ammo'],
  ];
  const reinforcements = route([938, 293], [927, 403], [868, 408], [867, 276], [782, 215],
    [711, 279], [689, 477], [537, 491], [505, 279], [478, 394], [398, 395], [334, 266],
    [305, 361], [286, 409], [197, 365], [265, 517], [334, 469], [225, 299]);
  return {
    id: 'operation-' + part,
    title: defense ? '断翼行动 · 海岸撤离' : '断翼行动 · 沿岸作战区',
    rooms: [rect(0, 0, OPERATION_WIDTH, OPERATION_HEIGHT, '滨海城区')],
    walls, furniture, doors: [], spawn: defense ? commandEntry : districtPoint(270, 350), exit: defense ? OPERATION_EXTRACT : commandEntry, hints: [],
    spawns: [],
    operation: { part, allies: defense ? route([950, 312], [954, 347], [971, 316]) : route([259, 362], [264, 332], [282, 369]),
      encounters: defense ? [] : cityEncounters, roads: [mainStreet, northStreet, freightStreet],
      reinforcements, interiors: [], scenery, drops },
  };
}

export function operationLevel(part: OperationPart): LevelDefinition {
  if (part !== 'compound') return districtLevel(part);
  const width = 3840, height = 1920;
  const walls = [
    rect(0, 0, width, 28), rect(0, height - 28, width, 28),
    rect(0, 0, 28, height), rect(width - 28, 0, 28, height),
  ];
  const doors: DoorSpec[] = [], interiors: Rect[] = [];
  const room = (shape: Rect, ...openings: Opening[]) => {
    interiors.push(shape);
    buildRoom(shape, openings, walls, doors);
  };
  const chapel = {
    bounds: rect(3080, 890, 665, 700, '旧教堂 · 指挥大厅'),
    approach: rect(2485, 1029, 595, 381),
    passage: point(3080, 1198),
    positions: [point(3200, 955), point(3460, 955), point(3628, 1010), point(3480, 1235),
      point(3625, 1450), point(3470, 1526), point(3194, 1526), point(3250, 1235)],
    runner: rect(3130, 1175, 530, 130, 'op-chapel-runner'),
  };
  const furniture = [
    rect(650, 974, 166, 80, 'op-office-counter'), rect(540, 777, 125, 43, 'op-office-bench'),
    rect(816, 1008, 34, 34, 'op-office-stool'),
    rect(1245, 515, 155, 82, 'op-office-tools'), rect(1570, 545, 134, 55, 'op-office-cabinet'),
    rect(1210, 1360, 145, 80, 'op-office-desk'), rect(1475, 1295, 94, 42, 'op-office-cabinet'),
    rect(1520, 1400, 156, 47, 'op-office-board'), rect(1515, 1080, 128, 46, 'op-office-bench'),
    rect(1900, 1450, 176, 76, 'op-office-desk'), rect(2200, 1110, 130, 54, 'op-office-cabinet'),
    rect(1915, 546, 142, 69, 'op-office-tools'), rect(2340, 476, 113, 62, 'op-office-cabinet'),
    rect(2630, 1060, 128, 55, 'op-office-cabinet'), rect(2720, 860, 105, 49, 'op-office-bench'),
    ...[3210, 3320, 3430].flatMap(x => [1020, 1370].map(y => rect(x, y, 44, 92, 'op-chapel-pew'))),
    rect(3520, 1105, 45, 45, 'op-chapel-column'), rect(3520, 1330, 45, 45, 'op-chapel-column'),
    rect(3672, 1160, 48, 160, 'op-chapel-altar'),
  ];
  room(rect(300, 720, 830, 400, '安保大厅'), { side: 'west', start: 865, name: '西侧入口' },
    { side: 'east', start: 819 }, { side: 'east', start: 963 });
  walls.push(rect(1100, 729, 24, 96), rect(1100, 1085, 24, 115));
  room(rect(1129, 410, 679, 426, '仓库与维修区'), { side: 'north', start: 1166, name: '仓库门' }, { side: 'east', start: 636 });
  room(rect(1129, 1040, 679, 447, '指挥办公室'), { side: 'south', start: 1346, name: '办公室门' }, { side: 'east', start: 1290 });
  room(rect(1808, 385, 677, 440, '后勤通道'), { side: 'west', start: 636 }, { side: 'east', start: 670, name: '后勤门' });
  room(rect(1808, 1040, 677, 520, '通信室'), { side: 'west', start: 1290 }, { side: 'east', start: 1190, name: '通信室门' });
  walls.push(rect(1796, 825, 24, 215), rect(2473, 795, 24, 245));
  room(rect(2485, 540, 595, 870, '内院与档案走廊'), { side: 'west', start: 670 }, { side: 'west', start: 1190 },
    { side: 'east', start: 1140, name: '指挥室门' });
  walls.push(rect(2640, 1005, 440, 24));
  room(chapel.bounds, { side: 'west', start: 1140 });
  return {
    id: 'operation-compound', title: '断翼行动 · 「阀」指挥部',
    rooms: [rect(0, 0, width, height, '指挥部')],
    walls, furniture, doors, spawn: point(410, 925), exit: point(221, 923), hints: [],
    spawns: [...[
      [904, 1000], [985, 870], [1045, 957], [926, 760], [1245, 710], [1443, 565], [1450, 725], [1630, 704], [1720, 750],
      [1250, 1180], [1370, 1230], [1575, 1362], [1705, 1205], [1915, 1360], [2020, 1290], [2390, 1300],
      [1930, 730], [2070, 671], [2230, 735], [2410, 757], [2580, 1370], [2800, 1310], [2925, 1170],
      [3150, 1290], [3260, 1165], [3325, 1310], [3520, 1305], [3540, 1170],
    ].map(gunner), [0, OPERATION_LEADER.x, OPERATION_LEADER.y, 'boss']],
    operation: {
      part, allies: [point(390, 822), point(472, 1030), point(489, 845)], encounters: [], roads: [], reinforcements: [],
      interiors, scenery: [], chapel, drops: [
        [point(495, 936), 'ammo'], [point(1300, 1260), 'medkit'], [point(1540, 675), 'ammo'],
        [point(2280, 1325), 'ammo'], [point(2815, 1230), 'bandage'],
      ],
    },
  };
}
