import type { Enemy, Point, Rect } from './Core';
import type { FloorDetailPlan } from './FloorDetails';
import type { OperationStage } from './Operation';
import type { SurvivalStage } from './Survival';

export type DormKey = 'stairs' | 'exit';
export type DoorSpec = Point & { length: number; baseAngle: number; material: 'wood' | 'steel'; name: string; rooms: readonly [number, number]; key?: DormKey; alarm?: boolean };
export type EnemySpawn = [room: number, x: number, y: number, type: Enemy['type'], appearance?: number];
export type StreetSurface = Rect & { kind: 'asphalt' | 'pavement' | 'shop-tile' | 'alley'; lanes?: 'x' | 'y' };
export type StreetPlan = {
  surfaces: StreetSurface[];
  roofs: Rect[];
  crossings: (Rect & { lanes: 'x' | 'y' })[];
  lamps: Point[];
  facade: Point;
  trigger: Rect;
  upperTurn: Point;
  alarm: Point;
  supply: Point & { name: string };
  waves: { delay: number; entries: EnemySpawn[] }[];
  streams: EnemySpawn[][];
  support: { trigger: Rect; entries: Point[] };
  gates: { kind: 'school' | 'community'; x: number; y: number; w: number; h: number }[];
};
export type FaultyDoorLamp = Point & { door: number; period: number; phase: number };
export type ApartmentFloor = {
  part: 'arrival' | 'garage' | 'defense' | 'home';
  seed: number;
  floors: ('lobby' | 'garage' | 'hall' | 'flat' | 'parking' | 'utility' | 'residential' | 'timber')[];
  stations: { id: 'stairs' | 'generator' | 'shutter' | 'lift' | 'note'; point: Point }[];
  props: { art: 'generator' | 'lift' | 'shutter'; point: Point; w: number; h: number }[];
  decals?: { art: string; point: Point; w: number; h: number; angle?: number; label?: string }[];
  engineer?: { spawn: Point; panel?: Point; route: Point[] };
  gear?: Point;
  safeRoom?: number;
  getaway?: { car: Rect; interact: Point; engineer: Point; arrival: Point; trapRadius: number; route: Point[]; waves: EnemySpawn[] };
  training?: { center: Point; radius: number };
  reinforcements?: EnemySpawn[];
  shock?: Rect;
  glass?: Rect;
  outdoor?: { room: number; entry: Point; traps: Point[]; spawns: Point[] };
};
export type ClueSpec = { id: 'letter_alarm' | 'letter_wall' | 'warden_log'; x: number; y: number; surface: Point; radius: number; furnitureIndex: number };
export type DormFloor = {
  number: 1 | 2; seed: number;
  pickup: Point & { id: DormKey; name: string };
  alarmWaves?: { delay: number; entries: EnemySpawn[] }[];
};
export type LevelDefinition = {
  id: string; title: string; rooms: Rect[]; walls: Rect[]; furniture: Rect[]; doors: DoorSpec[];
  spawn: Point; exit: Point; hints: string[]; spawns: EnemySpawn[]; dorm?: DormFloor; floorDetails?: FloorDetailPlan;
  clues?: ClueSpec[];
  ambientWildlifeSeed?: number;
  faultyDoorLamp?: FaultyDoorLamp;
  stairFlight?: Rect & { direction: 'up' | 'down' };
  street?: StreetPlan;
  apartment?: ApartmentFloor;
  operation?: OperationStage;
  survival?: SurvivalStage;
  frontier?: import('./Frontier').FrontierStage;
  retrieval?: import('./Retrieval').RetrievalPart;
};

type Join = { horizontal: boolean; axis: number; from: number; to: number };
const room = (kind: string, x: number, y: number, w: number, h: number): Rect => ({ kind, x, y, w, h });
const horizontal = (y: number, from: number, to: number): Join => ({ horizontal: true, axis: y, from, to });
const vertical = (x: number, from: number, to: number): Join => ({ horizontal: false, axis: x, from, to });
const door = (name: string, y: number, x: number, rooms: DoorSpec['rooms'], options: Pick<DoorSpec, 'key' | 'alarm'> = {}): DoorSpec =>
  ({ name, x, y, length: 112, baseAngle: 0, rooms, material: options.key ? 'steel' : 'wood', ...options });

/** Cut the same shared wall for both adjoining room rectangles. */
export function connectedWalls(rooms: Rect[], doors: Pick<DoorSpec, 'x' | 'y' | 'length' | 'baseAngle'>[], joins: Join[] = []): Rect[] {
  const openings = [...joins, ...doors.map(d => d.baseAngle === Math.PI / 2
    ? vertical(d.x, d.y - 2, d.y + d.length + 2) : horizontal(d.y, d.x - 2, d.x + d.length + 2))];
  const edges = rooms.flatMap(r => [
    horizontal(r.y, r.x, r.x + r.w), horizontal(r.y + r.h, r.x, r.x + r.w),
    vertical(r.x, r.y, r.y + r.h), vertical(r.x + r.w, r.y, r.y + r.h),
  ]);
  const walls: Rect[] = [];
  for (const isHorizontal of [true, false]) {
    const side = edges.filter(e => e.horizontal === isHorizontal);
    for (const axis of new Set(side.map(e => e.axis))) {
      const segments = side.filter(e => e.axis === axis);
      const gaps = openings.filter(e => e.axis === axis && e.horizontal === isHorizontal);
      const ends = Array.from(new Set([...segments, ...gaps].flatMap(e => [e.from, e.to]))).sort((a, b) => a - b);
      for (let i = 1; i < ends.length; i++) {
        const from = ends[i - 1], to = ends[i], mid = (from + to) / 2;
        if (!segments.some(e => e.from < mid && e.to > mid) || gaps.some(e => e.from < mid && e.to > mid)) continue;
        walls.push(isHorizontal ? { x: from, y: axis - 9, w: to - from, h: 18 } : { x: axis - 9, y: from, w: 18, h: to - from });
      }
    }
  }
  return walls;
}

export function createApartmentRun(seed: number): LevelDefinition[] {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const station = (id: ApartmentFloor['stations'][number]['id'], x: number, y: number) => ({ id, point: { x, y } });
  const prop = (art: ApartmentFloor['props'][number]['art'], x: number, y: number, w: number, h: number) => ({ art, point: { x, y }, w, h });
  const make = (title: string, apartment: Omit<ApartmentFloor, 'seed'>, rooms: Rect[], doors: DoorSpec[], joins: Join[], furniture: Rect[], spawns: EnemySpawn[], spawn: Point, exit: Point): LevelDefinition => ({
    id: `apartment-${apartment.part}`, title, apartment: { ...apartment, seed }, rooms, doors, walls: connectedWalls(rooms, doors, joins), furniture, spawns, spawn, exit, hints: [],
    floorDetails: { seed, themes: rooms.map(() => 'passage'), reserved: [...apartment.stations.map(s => s.point), ...(apartment.training ? [apartment.training.center] : [])] },
  });
  const lobby = [
    room('中央大堂', 565, 460, 880, 490), room('东侧消防通道', 1445, 460, 675, 230),
    room('维修间', 1760, 230, 360, 230), room('安全楼梯', 1850, 690, 270, 240),
    room('直达电梯', 1470, 950, 170, 153), room('室外步道', 350, 1120, 1320, 860),
    room('居民活动室', 240, 500, 325, 300), room('会客室', 970, 215, 360, 245),
    room('双电梯厅', 1445, 690, 380, 260), room('入户门厅', 870, 950, 270, 170),
    room('公共等候区', 565, 230, 405, 230), room('停用电梯', 1660, 950, 145, 153),
  ];
  const lobbyDoors = [door('维修间门', 460, 1865, [1, 2]), door('会客室门', 460, 1060, [0, 7])];
  const lobbyJoins = [vertical(1445, 476, 673), vertical(1445, 714, 919), vertical(565, 556, 747),
    horizontal(460, 584, 949), horizontal(690, 1480, 1795), horizontal(690, 1880, 2095), horizontal(950, 1485, 1625),
    horizontal(950, 895, 1115), horizontal(1120, 893, 1117)];
  const lobbyFurniture = [
    room('apartment-reception', 600, 824, 226, 83), room('locker', 582, 786, 39, 104),
    room('apartment-pingpong', 294, 648, 97, 134), room('locker', 256, 524, 115, 46),
    room('apartment-meeting', 1125, 250, 181, 115), room('apartment-planter', 980, 610, 188, 61),
    room('apartment-planter', 1400, 847, 35, 78), room('lobby-sofa', 603, 250, 149, 60),
    room('lobby-sofa', 790, 252, 145, 60), room('desk', 696, 344, 120, 60),
    room('locker', 2028, 260, 55, 104), room('desk', 1790, 260, 130, 55),
    room('generator', 1933, 245, 82, 70),
    room('apartment-planter', 510, 1345, 243, 76), room('apartment-planter', 1255, 1345, 243, 76),
    room('apartment-planter', 690, 1595, 148, 76), room('apartment-planter', 1173, 1595, 148, 76),
  ];
  const glass = room('glass-entry', 893, 1112, 224, 16);
  const lobbyProps = [prop('lift', 1555, 1024, 164, 146), prop('lift', 1732, 1024, 140, 146)];
  const engineer = { spawn: { x: 756, y: 728 }, panel: { x: 1918, y: 570 }, route: [{ x: 835, y: 640 }, { x: 1410, y: 588 }, { x: 1918, y: 570 }] };
  const liftRoute = [{ x: 1555, y: 603 }, { x: 1555, y: 837 }, { x: 1555, y: 1030 }];
  const lobbyFloorArt: ApartmentFloor['floors'] = ['lobby', 'hall', 'hall', 'hall', 'hall', 'garage', 'flat', 'flat', 'lobby', 'lobby', 'flat', 'hall'];
  const arrival = make('归巢 · 一层', {
    part: 'arrival', floors: lobbyFloorArt, engineer, props: lobbyProps, glass,
    outdoor: {
      room: 5, entry: { x: 1005, y: 1120 },
      traps: [{ x: 900, y: 1228 }, { x: 1108, y: 1228 }, { x: 1005, y: 1170 }],
      spawns: [
        { x: 418, y: 1895 }, { x: 1589, y: 1895 }, { x: 435, y: 1220 }, { x: 1580, y: 1220 },
        { x: 480, y: 1480 }, { x: 1540, y: 1480 }, { x: 775, y: 1890 }, { x: 1225, y: 1890 },
        { x: 770, y: 1255 }, { x: 1240, y: 1255 }, { x: 810, y: 1510 }, { x: 1200, y: 1510 },
        { x: 790, y: 1165 }, { x: 1220, y: 1165 },
      ],
    },
    stations: [station('stairs', 1988, 817)],
    training: { center: { x: 1515, y: 795 }, radius: 58 },
  }, lobby, lobbyDoors, lobbyJoins, lobbyFurniture, [
    [5, 660, 1205, 'walker', 0], [5, 1345, 1215, 'walker', 2],
    [5, 560, 1515, 'walker', 1], [5, 1455, 1515, 'walker', 3],
    [5, 825, 1390, 'walker', 1], [5, 1185, 1380, 'walker', 2],
    [5, 605, 1740, 'walker', 3], [5, 1405, 1740, 'walker', 0],
    [5, 445, 1590, 'walker', 2], [5, 1560, 1590, 'walker', 1],
  ], { x: 1006, y: 1760 }, { x: 1988, y: 817 });
  arrival.stairFlight = { x: 1928, y: 768, w: 120, h: 130, direction: 'down' };
  const garageRooms = [
    room('负一层停车场', 180, 365, 2280, 840), room('安全楼梯', 180, 1205, 270, 255),
    room('B1 电梯厅', 450, 1205, 365, 255), room('应急配电室', 1980, 110, 480, 255),
    room('工具间', 1115, 110, 400, 255), room('设备间', 1535, 110, 425, 255),
    room('汽车出口坡道', 180, 45, 345, 320),
  ];
  const garageDoors = [door('配电室门', 365, 2190, [0, 3]), door('工具间门', 365, 1260, [0, 4]), door('设备间门', 365, 1685, [0, 5])];
  const getawayCar = room('getaway-car', 264, 755, 116, 155);
  const getaway = {
    car: getawayCar, interact: { x: 224, y: 840 }, engineer: { x: 409, y: 845 }, arrival: { x: 625, y: 1325 },
    trapRadius: 285, route: [{ x: 322, y: 832.5 }, { x: 322, y: 620 }, { x: 322, y: 381 }, { x: 322, y: -85 }],
    waves: [[6, 243, 161, 'walker', 0], [6, 404, 191, 'walker', 3],
      [0, 674, 726, 'walker', 1], [0, 857, 727, 'walker', 2], [0, 1040, 724, 'walker', 0],
      [0, 540, 1095, 'walker', 3], [0, 960, 1100, 'walker', 1], [0, 614, 412, 'walker', 2],
      [0, 940, 417, 'walker', 0], [0, 1150, 1072, 'boss']] as EnemySpawn[],
  };
  const garageFurniture = [
    room('garage-generator', 2202, 125, 144, 70), getawayCar,
    room('garage-shelf', 1140, 130, 315, 59), room('garage-shelf', 1564, 128, 287, 59),
    room('garage-shelf', 2004, 130, 53, 151),
  ];
  const parking: NonNullable<ApartmentFloor['decals']> = [];
  for (const [row, y] of [558, 884].entries()) {
    for (const [group, start] of [546, 1190, 1834].entries()) {
      for (let bay = 0; bay < 4; bay++) {
        const x = start + bay * 117;
        parking.push({ art: 'parking-bay', point: { x, y }, w: 115, h: 182, angle: row * 180,
          label: `${row ? 'B' : 'A'}-${String(group * 4 + bay + 1).padStart(2, '0')}` });
        garageFurniture.push(room('garage-stop', x - 36, y + (row ? -75 : 61), 72, 12));
        if (bay !== (group + row) % 4 && (bay === (group + row + 2) % 4 || random() < 0.53)) {
          const car = random() < 0.53 ? 'garage-sedan' : 'garage-suv';
          garageFurniture.push(room(row ? car + '-reverse' : car, x - 35, y - 58, 70, 116));
        }
      }
      for (const x of [start - 109, start + 460]) garageFurniture.push(room('garage-column', x - 22, y - 22, 44, 44));
    }
  }
  for (const [x, y, angle] of [[322, 670, -90], [745, 725, 0], [1420, 725, 0], [2080, 725, 0], [2360, 1045, 90], [322, 246, -90]]) {
    parking.push({ art: 'parking-arrow', point: { x, y }, w: 72, h: 30, angle });
  }
  for (const x of [730, 1280, 1830]) parking.push({ art: 'parking-stripe', point: { x, y: 1037 }, w: 465, h: 6 });
  parking.push({ art: 'parking-grate', point: { x: 340, y: 401 }, w: 250, h: 16 },
    { art: 'parking-warning', point: { x: 2246, y: 390 }, w: 130, h: 16 },
    { art: 'parking-b1', point: { x: 1080, y: 1090 }, w: 104, h: 64 });
  const garageStairs = { x: 315, y: 1322 }, generator = { x: 2278, y: 238 };
  const garage = make('归巢 · 负一层', {
    part: 'garage', floors: ['parking', 'residential', 'residential', 'utility', 'utility', 'utility', 'parking'],
    props: [prop('lift', 540, 1391, 132, 106), prop('lift', 713, 1391, 132, 106)],
    decals: parking, getaway, stations: [station('generator', generator.x, generator.y), station('stairs', garageStairs.x, garageStairs.y)],
    reinforcements: [[0, 1900, 1030, 'walker', 0], [0, 1680, 722, 'walker', 3], [0, 1320, 1070, 'walker', 1],
      [6, 342, 231, 'walker', 3], [0, 985, 731, 'walker', 1], [0, 2360, 720, 'boss']],
  }, garageRooms, garageDoors,
  [horizontal(1205, 220, 410), horizontal(1205, 485, 780), horizontal(365, 211, 493), horizontal(45, 218, 484)], garageFurniture,
  [[0, 635, 727, 'walker', 0], [0, 1100, 1053, 'walker', 2], [0, 1620, 734, 'walker', 3],
    [0, 1915, 1095, 'walker', 0], [4, 1380, 240, 'walker', 1], [5, 1824, 240, 'walker', 2]],
  garageStairs, garageStairs);
  garage.stairFlight = { x: 243, y: 1256, w: 144, h: 156, direction: 'up' };
  garage.faultyDoorLamp = { x: 2246, y: 385, door: 0, period: 10.9, phase: 2.1 };
  const defense = make('归巢 · 一层电梯防守', {
    part: 'defense', floors: lobbyFloorArt, props: [...lobbyProps, prop('shutter', 1380, 540, 24, 160)],
    engineer: { spawn: engineer.panel, panel: engineer.panel, route: liftRoute },
    stations: [station('shutter', 1974, 355), station('lift', 1555, 1030)], shock: room('电击区', 1280, 638, 135, 200),
    reinforcements: [[5, 978, 1250, 'boss'], [5, 834, 1201, 'walker', 0], [5, 1188, 1185, 'walker', 3], [6, 446, 631, 'walker', 1], [10, 876, 360, 'walker', 2], [0, 723, 535, 'walker', 3]],
  }, lobby, lobbyDoors, lobbyJoins, lobbyFurniture, [[0, 1130, 790, 'walker', 0]], { x: 1988, y: 817 }, { x: 1555, y: 1030 });
  defense.stairFlight = arrival.stairFlight;
  const homeRooms = [
    room('九层住宅长廊', 220, 620, 2170, 230), room('9F 电梯厅', 985, 850, 410, 314),
    room('901 · 邻居家', 220, 850, 382, 340), room('902 · 维川家', 602, 850, 383, 340),
    room('903 · 邻居家', 1395, 850, 356, 340), room('904 · 凛家', 1751, 850, 447, 340),
    room('消防楼梯间', 2198, 850, 192, 340), room('908 · 邻居家', 220, 290, 480, 330),
    room('907 · 邻居家', 700, 290, 480, 330), room('906 · 邻居家', 1180, 290, 490, 330),
    room('905 · 邻居家', 1670, 290, 495, 330), room('设备间', 2165, 386, 225, 234),
  ];
  const homeDoors = [
    door('901 入户门', 850, 351, [0, 2]), door('902 维川家房门', 850, 736, [0, 3]),
    door('903 入户门', 850, 1515, [0, 4]), door('904 凛家房门', 850, 1925, [0, 5]),
    door('908 入户门', 620, 427, [0, 7]), door('907 入户门', 620, 888, [0, 8]),
    door('906 入户门', 620, 1371, [0, 9]), door('905 入户门', 620, 1867, [0, 10]),
    door('设备间门', 620, 2225, [0, 11]),
  ];
  const homeFurniture = [
    room('apartment-planter', 603, 648, 136, 44), room('apartment-planter', 1509, 648, 122, 44),
    room('garage-shelf', 2202, 407, 150, 40),
  ];
  for (const index of [2, 3, 4, 5, 7, 8, 9, 10]) {
    const r = homeRooms[index], north = r.y === 850;
    const front = north ? r.y + 29 : r.y + r.h - 102;
    const back = north ? r.y + r.h - 113 : r.y + 24;
    const compact = index === 2 || index === 4;
    homeFurniture.push(
      room('home-living', r.x + 23, back, 137, 88),
      room('home-bed', r.x + r.w - 149, back, 125, 83),
      room('home-kitchen', r.x + 22, front, compact ? 80 : 95, 38),
      room('home-bath', r.x + r.w - 78, front, 55, 74),
      room('home-dining', index === 5 ? r.x + r.w - 121 : r.x + 22, r.y + 125, compact ? 72 : 87, 67),
    );
  }
  homeFurniture.push(room('lobby-desk', 1777, 1046, 109, 31));
  const lift = { x: 1180, y: 1020 }, note = { x: 1830, y: 1011 };
  const home = make('归巢 · 九层', {
    part: 'home', floors: ['residential', 'residential', 'timber', 'timber', 'timber', 'timber',
      'utility', 'timber', 'timber', 'timber', 'timber', 'utility'], props: [prop('lift', 1090, 1093, 142, 125), prop('lift', 1280, 1093, 142, 125)],
    gear: { x: 816, y: 1020 }, safeRoom: 5,
    engineer: { spawn: { x: 1272, y: 1020 }, route: [] }, stations: [station('note', note.x, note.y), station('lift', lift.x, lift.y)],
    reinforcements: [[0, 720, 762, 'walker', 0], [0, 1590, 746, 'walker', 1], [0, 2190, 748, 'walker', 3], [3, 814, 1060, 'walker', 2], [9, 1420, 400, 'walker', 1]],
  }, homeRooms, homeDoors, [horizontal(850, 1010, 1370), horizontal(850, 2220, 2368)], homeFurniture,
  [[0, 768, 750, 'walker', 1], [0, 1665 + Math.floor(random() * 56), 757, 'walker', 2],
    [2, 449, 1021, 'walker', 3], [4, 1571, 1033, 'walker', 0]],
  lift, lift);
  home.stairFlight = { x: 2231, y: 995, w: 125, h: 166, direction: 'down' };
  home.walls.push(
    room('partition', 1954, 1097, 13, 89), room('partition', 2099, 853, 13, 91),
    room('partition', 785, 1090, 13, 97), room('partition', 891, 853, 13, 90),
  );
  return [arrival, garage, defense, home];
}

export function createStreet(seed: number): LevelDefinition {
  let state = seed >>> 0;
  const pick = <T>(choices: readonly T[]): T => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return choices[Math.floor(state / 4294967296 * choices.length)];
  };
  const rooms = [
    room('学校出口', 64, 420, 456, 480),
    room('公交站', 520, 420, 960, 480),
    room('车辆警报路口', 1480, 420, 640, 480),
    room('北向长街', 1600, 900, 520, 960),
    room('住宅街转角', 1600, 1860, 640, 480),
    room('东侧住宅街', 2240, 1860, 2010, 480),
    room('便利店', 736, 900, 464, 320),
    room('便利店后巷', 1200, 900, 400, 320),
    room('东侧封锁线', 2120, 420, 1230, 480),
    room('南侧施工巷', 1580, -430, 400, 850),
    room('废弃车库', 1100, 1370, 500, 370),
    room('校外岗亭', 1080, 176, 376, 244),
    room('街角杂货店', 2570, 2340, 440, 330),
    room('住宅街药店', 3210, 1540, 480, 320),
  ];
  const doors = [door('便利店门', 900, 773, [1, 6]), door('岗亭木门', 420, 1273, [1, 11]),
    door('杂货店门', 2340, 2720, [5, 12]), door('药店门', 1860, 3370, [5, 13])];
  const walls = connectedWalls(rooms, doors, [
    vertical(64, 485, 835), vertical(520, 465, 855), vertical(1480, 465, 855), vertical(2120, 465, 855),
    horizontal(900, 1664, 2056), horizontal(1860, 1664, 2056), vertical(2240, 1910, 2290),
    vertical(1200, 985, 1140), horizontal(900, 1280, 1440), vertical(1600, 1420, 1690),
    horizontal(420, 1600, 1960), vertical(3350, 451, 869), horizontal(-430, 1601, 1959),
    horizontal(2340, 1640, 2070), vertical(4250, 1890, 2310),
  ]);
  const furniture = [
    room('street-bus', 660, 556, 275, 96), room('street-shelter', 550, 789, 154, 57),
    room('street-hatchback', 1030, pick([477, 496, 514]), 139, 67), room('street-wreck', 1180, pick([745, 768]), 148, 70),
    room('street-hatchback', 1730, 555, 147, 75), room('street-barrier', 1940, 765, 109, 31),
    room('street-wreck', 1992, 1070, 75, 154), room('street-hatchback', 1658, 1530, 74, 145),
    room('street-barrier', 1930, 1738, 125, 30), room('street-wreck', 2010, 1980, 155, 75),
    room('street-bus', 2490, 1945, 286, 102), room('street-hatchback', 2835, pick([2165, 2195]), 145, 70),
    room('street-wreck', 3160, 2032, 160, 77), room('street-shelter', 3490, 2233, 166, 57),
    room('street-hatchback', 3650, 1930, 135, 68), room('street-barrier', 3800, 2180, 106, 31),
    room('street-counter', 748, 1110, 163, 74), room('street-shelf', 990, 1120, 140, 39),
    room('street-shelf', 960, 930, 140, 39), room('street-bin', 1240, 1110, 98, 66),
    room('street-wreck', 2410, 570, 155, 77), room('street-bin', 2640, 748, 95, 65),
    room('street-bin', 1855, 250, 95, 64), room('street-wreck', 1200, 1610, 155, 75),
    room('street-bin', 1130, 1400, 98, 66),
    room('street-counter', 1100, 198, 165, 65), room('street-shelf', 1120, 365, 112, 35),
    room('street-roadblock', 3310, 443, 45, 434), room('street-roadblock', 1593, -434, 374, 42),
    room('street-roadblock', 1630, 2304, 450, 42),
    room('gate-post', 4012, 1868, 44, 78), room('gate-post', 4012, 2262, 44, 70),
    room('street-counter', 2590, 2590, 150, 55), room('street-shelf', 2860, 2605, 120, 36),
    room('street-shelf', 2830, 2370, 120, 35), room('street-bin', 2910, 2450, 75, 55),
    room('street-counter', 3230, 1560, 155, 55), room('street-shelf', 3510, 1560, 125, 38),
    room('street-shelf', 3480, 1800, 125, 35), room('street-bin', 3560, 1680, 75, 60),
  ];
  const walker = (zone: number, x: number, y: number): EnemySpawn =>
    [zone, x + pick([-10, 0, 10]), y + pick([-8, 0, 8]), 'walker', pick([0, 1, 2, 3])];
  const asphalt = (x: number, y: number, w: number, h: number, lanes?: 'x' | 'y'): StreetSurface => ({ x, y, w, h, kind: 'asphalt', lanes });
  const surfaces: StreetSurface[] = [
    { x: -650, y: 420, w: 714, h: 480, kind: 'pavement' },
    asphalt(-650, 485, 715, 350, 'x'),
    ...rooms.map((r, i): StreetSurface => ({ ...r, kind: i === 6 || i === 11 || i >= 12 ? 'shop-tile' : i === 7 || i === 10 ? 'alley' : 'pavement' })),
    ...[room('pavement', 3350, 420, 720, 480), room('pavement', 1580, -1060, 400, 630),
      room('pavement', 1600, 2340, 520, 560), room('pavement', 4070, 1860, 780, 480)].map((r): StreetSurface => ({ ...r, kind: 'pavement' })),
    asphalt(65, 485, 1535, 350, 'x'), asphalt(1600, 485, 520, 350), asphalt(2120, 485, 1950, 350, 'x'),
    asphalt(1630, -1060, 300, 1545, 'y'), asphalt(1664, 835, 392, 1085, 'y'),
    asphalt(1664, 1920, 576, 350), asphalt(2240, 1920, 2610, 350, 'x'), asphalt(1664, 2270, 392, 630, 'y'),
  ];
  const stage: LevelDefinition = {
    id: 'street-home', title: '第二章 · 归途', rooms, walls, furniture, doors,
    spawn: { x: 188, y: 662 }, exit: { x: 4120, y: 2120 }, hints: [],
    spawns: [
      walker(1, 579, 528), walker(1, 990, 750), walker(1, 1360, 780),
      walker(2, 1640, 770), walker(2, 1990, 541), walker(3, 1965, 1030), walker(3, 1730, 1300),
      walker(3, 1900, 1600), walker(4, 2185, 2200), walker(5, 2450, 2170), walker(5, 2830, 2000),
      walker(5, 3040, 2200), walker(5, 3435, 2010), walker(5, 3730, 2170),
      walker(6, 860, 1040), walker(6, 1080, 1052), walker(7, 1410, 1080),
      walker(8, 2550, 718), walker(9, 1640, 244), walker(10, 1400, 1490), walker(11, 1190, 308),
      walker(3, 1715, 1000), walker(3, 1815, 1050), walker(3, 1890, 1155), walker(3, 1750, 1245),
      walker(3, 1960, 1280), walker(3, 1845, 1360), walker(3, 1790, 1470),
      walker(12, 2800, 2500), walker(13, 3430, 1700),
    ],
    floorDetails: { seed: seed ^ 0x572be193, themes: ['passage', 'passage', 'passage', 'passage', 'passage', 'passage', 'office', 'service', 'passage', 'service', 'service', 'office', 'office', 'office'] },
    ambientWildlifeSeed: seed ^ 0x349df5b8,
    street: {
      surfaces, trigger: room('alarm', 1536, 420, 584, 480), alarm: { x: 1800, y: 649 },
      gates: [
        { kind: 'school', x: 64, y: 660, w: 700, h: 1200 },
        { kind: 'community', x: 4035, y: 2100, w: 800, h: 1000 },
      ],
      upperTurn: { x: 1850, y: 2030 }, facade: { x: 1035, y: 907 },
      supply: pick([{ x: 1510, y: 1112, name: '后巷急救包' }, { x: 1264, y: 1500, name: '车库急救包' }]),
      roofs: [room('roof', 80, 160, 420, 240), room('roof', 540, 210, 390, 190), room('roof', 960, 100, 515, 68),
        room('roof', 90, 925, 420, 230), room('roof', 2080, 120, 310, 280), room('roof', 2440, 160, 340, 240),
        room('roof', 2180, 955, 420, 390), room('roof', 2220, 1395, 340, 405), room('roof', 1110, 1790, 450, 320),
        room('roof', 2630, 1515, 535, 320), room('roof', 3730, 1540, 200, 295),
        room('roof', 2230, 2380, 300, 320), room('roof', 3060, 2400, 225, 318), room('roof', 3360, 2380, 570, 360)],
      crossings: [
        { x: 1515, y: 510, w: 58, h: 300, lanes: 'x' }, { x: 2110, y: 510, w: 58, h: 300, lanes: 'x' },
        { x: 1668, y: 855, w: 380, h: 52, lanes: 'y' }, { x: 1668, y: 1872, w: 380, h: 52, lanes: 'y' },
        { x: 2270, y: 1944, w: 57, h: 302, lanes: 'x' },
      ],
      lamps: [{ x: 225, y: 875 }, { x: 653, y: 862 }, { x: 1420, y: 862 }, { x: 2020, y: 849 },
        { x: 2055, y: 1360 }, { x: 2055, y: 1833 }, { x: 2350, y: 2290 }, { x: 3020, y: 2280 }, { x: 3860, y: 2270 }],
      waves: [
        { delay: 0.9, entries: [walker(9, 1700, 187), walker(8, 2470, 528), walker(3, 1740, 1125), walker(1, 1110, 620)] },
        { delay: 2.4, entries: [walker(9, 1795, 234), walker(8, 2600, 657), walker(3, 1835, 1210), walker(7, 1428, 1160), walker(1, 1160, 708)] },
        { delay: 4.2, entries: [walker(9, 1885, 198), walker(8, 2660, 558), walker(3, 1930, 1140), walker(7, 1510, 1050), walker(6, 940, 1050), walker(6, 1137, 1028)] },
        { delay: 6.8, entries: [walker(10, 1300, 1550), walker(10, 1435, 1650), walker(10, 1490, 1460), walker(8, 2690, 650), walker(9, 1710, 305), walker(7, 1510, 1155)] },
      ],
      streams: [
        [walker(1, 723, 511), walker(1, 965, 595), walker(11, 1380, 285)],
        [walker(9, 1665, 195), walker(9, 1800, 192), walker(9, 1910, 207)],
        [walker(8, 2520, 519), walker(8, 2690, 650), walker(8, 2635, 695)],
      ],
      support: {
        trigger: room('support', 1600, 1870, 720, 470),
        entries: [
          { x: 2990, y: 2070 }, { x: 3028, y: 2134 }, { x: 3060, y: 2010 }, { x: 3100, y: 2180 },
          { x: 3140, y: 1965 }, { x: 3310, y: 2185 }, { x: 3410, y: 2120 }, { x: 3520, y: 2005 },
          { x: 3620, y: 2130 }, { x: 3690, y: 2080 }, { x: 3765, y: 2160 }, { x: 3890, y: 2030 },
        ],
      },
    },
  };
  const shift = (point: Point) => { if (point.x > 520) point.x += 640; point.y += 600; };
  const stretch = (rect: Rect) => {
    if (rect.x <= 520 && rect.x + rect.w > 520 && rect.w >= rect.h) rect.w += 640;
    else if (rect.x > 520) rect.x += 640;
    rect.y += 600;
  };
  for (const r of [...stage.rooms, ...stage.walls, ...stage.furniture, ...stage.street!.surfaces, ...stage.street!.roofs, ...stage.street!.crossings]) stretch(r);
  for (const d of stage.doors) shift(d);
  for (const p of [stage.spawn, stage.exit, stage.street!.alarm, stage.street!.supply, stage.street!.upperTurn, stage.street!.facade, ...stage.street!.lamps, ...stage.street!.support.entries]) shift(p);
  stretch(stage.street!.trigger); stretch(stage.street!.support.trigger);
  for (const gate of stage.street!.gates) shift(gate);
  const spawns = [...stage.spawns, ...stage.street!.waves.flatMap(w => w.entries), ...stage.street!.streams.flat()];
  for (const spawn of spawns) { if (spawn[1] > 520) spawn[1] += 640; spawn[2] += 600; }
  // Populate the newly extended western stretch before the bus stop.
  stage.spawns.push([1, 850, 1315, 'walker', pick([0, 1, 2, 3])], [1, 1045, 1190, 'walker', pick([0, 1, 2, 3])]);
  stage.furniture.push(room('street-hatchback', 780, 1095, 132, 65), room('street-barrier', 1010, 1385, 100, 31));
  return stage;
}

export function createDormRun(seed: number): readonly [LevelDefinition, LevelDefinition] {
  seed >>>= 0;
  let state = seed;
  const pick = <T>(choices: readonly T[]): T => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return choices[Math.floor(state / 4294967296 * choices.length)];
  };
  const walker = (zone: number, points: readonly Point[], appearance = pick([0, 1, 2, 3])): EnemySpawn => {
    const { x, y } = pick(points);
    return [zone, x, y, 'walker', appearance];
  };
  const bunk = (x: number, y: number, shift: number): Rect[] => [
    room('dorm-bed', x + 10, y + 10, 166, 80), room('dorm-bed', x + 246, y + 10, 166, 80),
    room('study-desk', x + 10, y + 114 + shift, 72, 132), room('dorm-locker', x + 350, y + 116, 62, 122),
  ];
  const upperRooms = [
    room('二楼长廊', 96, 420, 2400, 220), room('凛的寝室', 96, 96, 422, 324),
    room('202 寝室', 518, 96, 422, 324), room('203 寝室', 1588, 96, 422, 324),
    room('二楼值班室', 2010, 96, 486, 324), room('公共自习室', 348, 640, 608, 352),
    room('中央楼梯间', 1096, 640, 360, 352), room('盥洗室', 1712, 640, 528, 352),
  ];
  const upperDoors = [
    door('凛的寝室木门', 420, 251, [1, 0]), door('202 寝室木门', 420, 672, [2, 0]),
    door('203 寝室木门', 420, 1744, [3, 0]), door('二楼值班室木门', 420, 2172, [4, 0]),
    door('自习室木门', 640, 580, [0, 5]), door('楼梯间铁门', 640, 1216, [0, 6], { key: 'stairs' }),
    door('盥洗室木门', 640, 1944, [0, 7]),
  ];
  const stairKey = pick([{ x: 2390, y: 228 }, { x: 2116, y: 195 }, { x: 2308, y: 200 }]);
  const upper: LevelDefinition = {
    id: 'campus-dorm-2f', title: DORM_LEVEL.title, rooms: upperRooms, doors: upperDoors, walls: connectedWalls(upperRooms, upperDoors),
    spawn: { x: 306, y: 240 }, exit: { x: 1274, y: 806 }, hints: [],
    stairFlight: { x: 1210, y: 817, w: 128, h: 165, direction: 'down' },
    // Surface points lie just outside the desk so strict rays remain unobstructed;
    // the nearby anchor is a safe standing position for deterministic tests.
    clues: [
      { id: 'letter_alarm', x: 195, y: 280, surface: { x: 179, y: 280 }, radius: 68, furnitureIndex: 2 },
      { id: 'letter_wall', x: 617, y: 280, surface: { x: 601, y: 280 }, radius: 68, furnitureIndex: 6 },
    ],
    ambientWildlifeSeed: seed ^ 0x31cde8fa,
    dorm: { number: 2, seed, pickup: { ...stairKey, id: 'stairs', name: '楼梯钥匙' } },
    floorDetails: {
      seed: seed ^ 0x906f335d, reserved: [stairKey],
      themes: ['passage', 'quiet', 'bedroom', 'bedroom', 'office', 'office', 'passage', 'service'],
    },
    furniture: [
      ...bunk(96, 96, 0), ...bunk(518, 96, pick([0, 40])), ...bunk(1588, 96, pick([0, 40])),
      room('study-desk', 2030, 106, 152, 60), room('dorm-locker', 2328, 106, 156, 62),
      room('desk', 2414, 252, 72, 113), room('sofa', 106, 552, 98, 78),
      room('dorm-locker', 355, 873, 67, 108), room('study-desk', 468, 894, 146, 86),
      room('study-desk', 690, 894, 146, 86), room('dorm-locker', 886, 746, 59, 120),
      room('locker', pick([956, 1008]), 430, 180, 53), room('sofa', pick([1456, 1546]), 571, 122, 60),
      room('washer', 1722, 883, 140, 98), room('washer', 1881, 883, 140, 98),
      room('locker', 2148, 755, 81, 119),
    ],
    spawns: [
      walker(0, [{ x: 758, y: 530 }, { x: 858, y: 572 }], 0),
      walker(0, [{ x: 1390, y: 518 }, { x: 1510, y: 511 }], 1),
      walker(0, [{ x: 2028, y: 540 }, { x: 2134, y: 577 }], 2),
      walker(2, [{ x: 766, y: 268 }, { x: 729, y: 310 }]),
      walker(3, [{ x: 1845, y: 260 }, { x: 1800, y: 305 }]),
      walker(4, [{ x: 2360, y: 289 }, { x: 2092, y: 258 }], 3),
      walker(5, [{ x: 490, y: 819 }, { x: 795, y: 793 }]),
      walker(7, [{ x: 1831, y: 798 }, { x: 2048, y: 844 }]),
    ],
  };
  const lowerRooms = [
    room('一楼门厅', 976, 420, 600, 300), room('西侧走廊', 96, 480, 880, 200),
    room('东侧走廊', 1576, 480, 920, 200), room('楼梯间', 1096, 720, 360, 280),
    room('宿管室', 1920, 196, 450, 284), room('洗衣房', 320, 680, 320, 368),
    room('西侧勤务通道', 640, 680, 208, 368), room('后侧勤务通道', 640, 1048, 1360, 182),
    room('东侧勤务通道', 1792, 680, 208, 368), room('储物间', 2000, 680, 392, 368),
    room('宿舍楼出口', 1152, 180, 256, 240),
  ];
  const lowerDoors = [
    door('宿管室木门', 480, 2072, [2, 4], { alarm: true }),
    door('洗衣房木门', 680, 423, [1, 5]), door('储物间木门', 680, 2204, [2, 9]),
    door('宿舍楼铁门', 420, 1216, [10, 0], { key: 'exit' }),
  ];
  const exitKey = pick([{ x: 2286, y: 311 }, { x: 2028, y: 292 }, { x: 2200, y: 275 }]);
  const lower: LevelDefinition = {
    id: 'campus-dorm-1f', title: DORM_LEVEL.title, rooms: lowerRooms, doors: lowerDoors,
    walls: connectedWalls(lowerRooms, lowerDoors, [
      vertical(976, 480, 680), vertical(1576, 480, 680), horizontal(720, 1160, 1392),
      horizontal(680, 640, 848), horizontal(680, 1792, 2000),
      horizontal(1048, 640, 848), horizontal(1048, 1792, 2000),
    ]),
    spawn: { x: 1274, y: 807 }, exit: { x: 1274, y: 272 }, hints: [],
    stairFlight: { x: 1210, y: 819, w: 128, h: 165, direction: 'up' },
    clues: [{ id: 'warden_log', x: 2008, y: 290, surface: { x: 2008, y: 262 }, radius: 70, furnitureIndex: 4 }],
    ambientWildlifeSeed: seed ^ 0x5a42e917,
    floorDetails: {
      seed: seed ^ 0x1936da81, reserved: [exitKey],
      themes: ['passage', 'passage', 'passage', 'passage', 'office', 'service', 'service', 'service', 'service', 'service', 'passage'],
    },
    dorm: {
      number: 1, seed, pickup: { ...exitKey, id: 'exit', name: '大门钥匙' },
      alarmWaves: [
        { delay: 2.6, entries: [walker(2, [{ x: 2444, y: 552 }, { x: 2417, y: 606 }]), walker(8, [{ x: 1892, y: 991 }, { x: 1860, y: 952 }]), walker(8, [{ x: 1954, y: 1005 }, { x: 1935, y: 930 }])] },
        { delay: 7.5, entries: [walker(1, [{ x: 180, y: 568 }, { x: 220, y: 602 }]), walker(1, [{ x: 285, y: 560 }, { x: 305, y: 614 }]), walker(6, [{ x: 752, y: 951 }, { x: 708, y: 930 }])] },
      ],
    },
    furniture: [
      room('desk', 987, 636, 138, 72), room('sofa', 1430, 622, 134, 87),
      room('locker', 115, 490, 168, 50), room('sofa', 773, 493, 145, 57),
      room('study-desk', 1931, 206, 158, 55), room('dorm-locker', 2222, 206, 137, 58),
      room('desk', 2296, 347, 64, 92), room('washer', 331, 936, 163, 100),
      room('washer', 521, 936, 108, 100), room('dorm-locker', 332, 784, 64, 117),
      room('crate', 2011, 868 + pick([0, 36]), 115, 118), room('crate', 2240, 943, 139, 94),
    ],
    spawns: [
      walker(1, [{ x: 500, y: 589 }, { x: 556, y: 566 }], 1),
      walker(2, [{ x: 1765, y: 569 }, { x: 1850, y: 610 }], 0),
      walker(4, [{ x: 2217, y: 366 }, { x: 2000, y: 372 }], 3),
      walker(5, [{ x: 507, y: 853 }, { x: 448, y: 837 }], 2),
      walker(9, [{ x: 2188, y: 881 }, { x: 2276, y: 839 }]),
    ],
  };
  // Choose after the gameplay layout so lighting never advances its random sequence.
  const lampFloors = pick(['upper', 'upper', 'upper', 'lower', 'both', 'both'] as const);
  for (const stage of [upper, lower]) {
    const floor = stage === upper ? 'upper' : 'lower';
    if (lampFloors !== floor && lampFloors !== 'both') continue;
    const choices = stage.doors.map((d, index) => ({ d, index })).filter(({ d }) => !d.key && !d.alarm);
    const { d, index } = pick(choices);
    const corridor = stage.rooms[d.rooms.find(i => stage.rooms[i].w >= 800)!];
    const side = corridor.y + corridor.h / 2 > d.y ? 1 : -1;
    stage.faultyDoorLamp = { x: d.x + d.length / 2, y: d.y + side * 16, door: index, period: pick([8.7, 10.9, 13.3, 15.8]), phase: pick([0.6, 2.1, 3.7, 5.2]) };
  }
  return [upper, lower];
}

/** A full connected dorm floor; artwork and simulation consume these same footprints. */
export const DORM_LEVEL: LevelDefinition = {
  id: 'campus-dorm', title: '第一章 · 静默宿舍',
  rooms: [
    { x: 80, y: 80, w: 2140, h: 280, kind: '宿舍走廊' },
    { x: 80, y: 360, w: 700, h: 760, kind: '101 寝室' },
    { x: 780, y: 360, w: 700, h: 760, kind: '102 寝室' },
    { x: 1480, y: 360, w: 740, h: 760, kind: '洗衣房 / 楼梯间' },
  ],
  walls: [
    { x: 80, y: 80, w: 2140, h: 18 }, { x: 80, y: 80, w: 18, h: 1040 },
    { x: 2202, y: 80, w: 18, h: 1040 }, { x: 80, y: 1102, w: 2140, h: 18 },
    { x: 762, y: 360, w: 18, h: 760 }, { x: 1462, y: 360, w: 18, h: 760 },
    { x: 80, y: 342, w: 330, h: 18 }, { x: 540, y: 342, w: 570, h: 18 },
    { x: 1240, y: 342, w: 600, h: 18 }, { x: 1970, y: 342, w: 250, h: 18 },
    ...[412, 1112, 1842].flatMap(x => [{ x: x - 2, y: 342, w: 2, h: 18, kind: 'jamb' }, { x: x + 126, y: 342, w: 2, h: 18, kind: 'jamb' }]),
  ],
  furniture: [
    { x: 155, y: 660, w: 185, h: 90, kind: 'dorm-bed' }, { x: 505, y: 660, w: 185, h: 90, kind: 'dorm-bed' },
    { x: 155, y: 970, w: 185, h: 90, kind: 'dorm-bed' }, { x: 505, y: 970, w: 185, h: 90, kind: 'dorm-bed' },
    { x: 155, y: 545, w: 150, h: 84, kind: 'study-desk' }, { x: 540, y: 545, w: 150, h: 84, kind: 'study-desk' },
    { x: 155, y: 420, w: 150, h: 68, kind: 'dorm-locker' }, { x: 555, y: 420, w: 140, h: 68, kind: 'dorm-locker' },
    { x: 855, y: 660, w: 185, h: 90, kind: 'dorm-bed' }, { x: 1205, y: 660, w: 185, h: 90, kind: 'dorm-bed' },
    { x: 855, y: 970, w: 185, h: 90, kind: 'dorm-bed' }, { x: 1205, y: 970, w: 185, h: 90, kind: 'dorm-bed' },
    { x: 855, y: 545, w: 150, h: 84, kind: 'study-desk' }, { x: 1240, y: 545, w: 150, h: 84, kind: 'study-desk' },
    { x: 855, y: 420, w: 150, h: 68, kind: 'dorm-locker' }, { x: 1255, y: 420, w: 140, h: 68, kind: 'dorm-locker' },
    { x: 1570, y: 500, w: 190, h: 92, kind: 'washer' }, { x: 1960, y: 500, w: 190, h: 92, kind: 'washer' },
    { x: 1570, y: 820, w: 155, h: 70, kind: 'dorm-locker' }, { x: 1960, y: 780, w: 155, h: 70, kind: 'dorm-locker' },
  ],
  doors: [
    { x: 412, y: 351, length: 126, baseAngle: 0, material: 'wood', name: '101 寝室木门', rooms: [0, 1] },
    { x: 1112, y: 351, length: 126, baseAngle: 0, material: 'wood', name: '102 寝室木门', rooms: [0, 2] },
    { x: 1842, y: 351, length: 126, baseAngle: 0, material: 'steel', name: '楼梯间防火门', rooms: [0, 3] },
  ],
  spawn: { x: 260, y: 220 }, exit: { x: 2110, y: 1015 },
  hints: ['靠近北侧房门，搜索 101 与 102 寝室', '返回走廊，继续搜索 102 寝室', '返回走廊，进入东侧洗衣房', '前往东北角楼梯撤离'],
  spawns: [
    [0, 800, 210, 'walker'], [0, 1360, 210, 'walker'],
    [1, 435, 600, 'walker'], [1, 435, 870, 'spitter'], [1, 690, 850, 'walker'],
    [2, 1135, 610, 'walker'], [2, 1135, 880, 'spitter'], [2, 1390, 850, 'walker'],
    [3, 1840, 790, 'boss'], [3, 2110, 680, 'spitter'], [3, 1600, 1015, 'walker'],
  ],
};
