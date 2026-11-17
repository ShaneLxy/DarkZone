import type { Point, Rect } from './Core';
import type { DoorSpec, EnemySpawn, LevelDefinition } from './Levels';

export type OperationPart = 'city' | 'compound' | 'defense';
export type OperationStage = {
  part: OperationPart;
  allies: Point[];
  route: Point[];
  reinforcements: Point[];
  interiors: Rect[];
  scenery: Rect[];
};

export const OPERATION_WIDTH = 3840;
export const OPERATION_HEIGHT = 1920;
export const OPERATION_HOLD = 14;
export const OPERATION_LEADER = { x: 3480, y: 1220 };
export const OPERATION_MG = 3;
export const OPERATION_ENEMY_CAP = 24;
const point = (x: number, y: number): Point => ({ x, y });
const rect = (x: number, y: number, w: number, h: number, kind?: string): Rect => ({ x, y, w, h, kind });
const gunner = ([x, y, appearance]: number[]): EnemySpawn => [0, x, y, 'gunner', appearance];
const zombie = ([x, y]: number[]): EnemySpawn => [0, x, y, 'walker'];

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
      if (opening.name) doors.push({ x: horizontal ? opening.start : axis, y: horizontal ? axis : opening.start,
        baseAngle: horizontal ? 0 : Math.PI / 2, length, name: opening.name, rooms: [0, 0], material: 'wood' });
    }
    cap(current, end);
  }
}

const cityFireteams = [
  [1035, 552], [1070, 670], [1150, 680], [1205, 448], [1300, 520], [1305, 695], [1345, 795],
  [1422, 968], [1510, 1075], [1280, 865], [1180, 840], [1350, 610],
  [1640, 1100], [1660, 1325], [1780, 1210], [1960, 1220], [2010, 1290], [2085, 1100],
  [2155, 1382], [2270, 1205], [2310, 1405], [2235, 1000], [2122, 1310],
  [2390, 925], [2340, 710], [2470, 635], [2540, 811], [2535, 541], [2610, 682], [2700, 582],
  [2760, 735], [2845, 600], [2880, 714], [2875, 900], [2450, 1050],
  [2990, 661, OPERATION_MG], [3080, 560], [3100, 780], [3175, 648], [3235, 570], [3310, 725],
  [3370, 809, OPERATION_MG], [3430, 636], [3485, 712], [3520, 860], [3580, 667], [3630, 802], [3490, 550],
];
const rearSquad = [point(530, 650), point(525, 780), point(470, 610), point(467, 838), point(410, 684),
  point(408, 770), point(357, 640), point(358, 810)];

export function operationLevel(part: OperationPart): LevelDefinition {
  const inside = part === 'compound', defense = part === 'defense';
  const spawn = inside ? point(410, 925) : defense ? point(3640, 750) : point(630, 720);
  const exit = inside ? point(3360, 1220) : defense ? point(580, 720) : point(3690, 742);
  const walls = [
    rect(0, 0, OPERATION_WIDTH, 28), rect(0, OPERATION_HEIGHT - 28, OPERATION_WIDTH, 28),
    rect(0, 0, 28, OPERATION_HEIGHT), rect(OPERATION_WIDTH - 28, 0, 28, OPERATION_HEIGHT),
  ];
  const doors: DoorSpec[] = [], interiors: Rect[] = [], scenery: Rect[] = [];
  const room = (shape: Rect, ...openings: Opening[]) => {
    interiors.push(shape);
    buildRoom(shape, openings, walls, doors);
  };
  const furniture = inside ? [
    rect(655, 940, 150, 65, 'op-console'), rect(835, 815, 78, 58, 'op-crates'),
    rect(1245, 515, 155, 82, 'op-console'), rect(1570, 545, 134, 66, 'op-barrels'),
    rect(1210, 1360, 145, 72, 'op-console'), rect(1475, 1270, 80, 60, 'op-shelf'),
    rect(1950, 1470, 195, 76, 'op-console'), rect(2200, 1110, 120, 69, 'op-sandbags'),
    rect(1920, 565, 140, 75, 'op-barrels'), rect(2350, 490, 140, 70, 'op-shelf'),
    rect(2530, 1140, 128, 65, 'op-crates'), rect(2710, 860, 105, 55, 'op-console'),
    rect(3250, 1370, 180, 79, 'op-console'), rect(3450, 1060, 160, 62, 'op-console'),
  ] : [
    rect(1000, 455, 152, 48, 'op-sandbags'), rect(1060, 742, 128, 62, 'op-barrels'),
    rect(1395, 608, 100, 160, 'op-pickup'), rect(1340, 998, 130, 58, 'op-shelf'),
    rect(1605, 1195, 127, 83, 'op-stall'), rect(1720, 1070, 115, 86, 'op-stall'),
    rect(2000, 1140, 85, 53, 'op-sandbags'), rect(2180, 1240, 130, 78, 'op-stall'),
    rect(2420, 1140, 128, 65, 'op-barrels'), rect(2480, 910, 82, 145, 'op-pickup'),
    rect(2340, 565, 70, 119, 'op-barrels'), rect(2580, 436, 150, 49, 'op-sandbags'),
    rect(3070, 625, 38, 76, 'op-sandbags'), rect(3445, 772, 38, 76, 'op-sandbags'),
    rect(3155, 502, 126, 48, 'op-sandbags'), rect(3180, 709, 72, 121, 'op-pickup'),
    rect(3435, 901, 78, 75, 'op-crates'), rect(3598, 531, 134, 55, 'op-sandbags'),
    rect(2525, 1040, 100, 75, 'op-shelf'), rect(2673, 1010, 97, 58, 'op-cot'),
    rect(3500, 1023, 116, 74, 'op-cot'), rect(3612, 1160, 115, 67, 'op-shelf'),
  ];
  if (inside) {
    room(rect(300, 720, 830, 400, '安保大厅'), { side: 'east', start: 819 }, { side: 'east', start: 963 });
    walls.push(rect(1100, 729, 24, 96), rect(1100, 1085, 24, 115));
    room(rect(1129, 410, 679, 426, '仓库与维修区'), { side: 'north', start: 1166, name: '仓库门' }, { side: 'east', start: 636 });
    room(rect(1129, 1040, 679, 447, '指挥办公室'), { side: 'south', start: 1190, name: '办公室门' }, { side: 'east', start: 1290 });
    room(rect(1808, 385, 677, 440, '后勤通道'), { side: 'west', start: 636 }, { side: 'east', start: 670, name: '后勤门' });
    room(rect(1808, 1040, 677, 520, '通信室'), { side: 'west', start: 1290 }, { side: 'east', start: 1190, name: '通信室门' });
    walls.push(rect(1796, 825, 24, 215), rect(2473, 795, 24, 245));
    room(rect(2485, 540, 595, 870, '内院与档案走廊'), { side: 'west', start: 670 }, { side: 'west', start: 1190 },
      { side: 'east', start: 1140, name: '指挥室门' });
    walls.push(rect(2640, 1005, 440, 24));
    room(rect(3080, 990, 575, 510, '首领指挥室'), { side: 'west', start: 1140 });
  } else {
    const blocks = [
      rect(770, 32, 300, 340), rect(820, 860, 395, 755), rect(1212, 32, 515, 350),
      rect(1560, 428, 440, 550), rect(1925, 1440, 415, 438), rect(2350, 1420, 505, 440),
      rect(2070, 45, 575, 430), rect(2855, 35, 590, 424), rect(2855, 925, 540, 821),
    ];
    for (const r of blocks) { walls.push({ ...r, kind: 'op-roof' }); scenery.push({ ...r, kind: 'op-roof' }); }
    scenery.push(rect(2910, 620, 145, 112, 'op-machinegun'), rect(3290, 766, 145, 112, 'op-machinegun'));
    room(rect(1215, 824, 330, 304, '杂货铺'), { side: 'south', start: 1268, name: '杂货铺门' }, { side: 'east', start: 855 });
    room(rect(2495, 842, 295, 298, '市集仓库'), { side: 'south', start: 2550, name: '仓库侧门' }, { side: 'east', start: 928 });
    room(rect(3430, 980, 335, 290, '民宅'), { side: 'south', start: 3455 }, { side: 'east', start: 1008, name: '民宅后门' });
    walls.push(rect(910, 375, 25, 147), rect(910, 775, 25, 88), rect(1795, 975, 25, 136), rect(1795, 1380, 25, 505),
      rect(2820, 32, 24, 485), rect(2820, 840, 24, 580));
  }
  const allies = inside ? [point(335, 880), point(340, 1000), point(460, 858), point(467, 1012)] : defense ?
    [point(3690, 683), point(3715, 810), point(3650, 848), point(3740, 747), point(3600, 872), point(3545, 730)] : rearSquad;
  const route = defense ? [point(2940, 670), point(2710, 690), point(2370, 840), point(2175, 1140), point(1835, 1250),
    point(1500, 1160), point(1250, 740), point(945, 643), exit] : [exit];
  const reinforcements = [[3740, 660], [3638, 1078], [3060, 870], [2778, 782], [1848, 1510], [2040, 1080],
    [1800, 1250], [1560, 1430], [1260, 730], [1130, 673], [865, 733], [405, 1200], [410, 336]].map(([x, y]) => point(x, y));
  return {
    id: 'operation-' + part,
    title: inside ? '断翼行动 · 「阀」指挥部' : defense ? '断翼行动 · 海岸撤离' : '断翼行动 · 北非沿岸',
    rooms: [rect(0, 0, OPERATION_WIDTH, OPERATION_HEIGHT, inside ? '指挥部' : '滨海城区')],
    walls, furniture, doors, spawn, exit, hints: [],
    spawns: inside ? [
      [904, 1000], [985, 870], [1045, 957], [926, 760], [1245, 710], [1443, 565], [1450, 725], [1630, 704], [1720, 750],
      [1250, 1180], [1370, 1230], [1575, 1350], [1705, 1205], [1915, 1360], [2020, 1290], [2390, 1300],
      [1930, 730], [2070, 671], [2230, 735], [2410, 757], [2580, 1370], [2800, 1310], [2925, 1170],
      [3150, 1290], [3260, 1165], [3325, 1310], [3520, 1305], [3540, 1150],
    ].map(gunner) : defense ? [[3210, 665], [3180, 604], [2870, 675], [2730, 770], [2600, 720], [2290, 1090],
      [2195, 1160], [2010, 1350], [1788, 1225], [1450, 1190], [1200, 690], [760, 610]].map(zombie) : cityFireteams.map(gunner),
    operation: { part, allies, route, reinforcements, interiors, scenery },
  };
}
