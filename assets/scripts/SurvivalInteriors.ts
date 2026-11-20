import type { Loot, Point, Rect } from './Core';
import { connectedWalls, type DoorSpec } from './Levels';

export type SurvivalBuildingKind = 'house' | 'clinic' | 'warehouse' | 'shop' | 'utility';
export type SurvivalStair = {
  bounds: Rect;
  offsetX: number;
  lowerRoom: number;
  upperRoom: number;
  searchPoints: readonly [Point[], Point[]];
};
export type SurvivalBuilding = {
  kind: SurvivalBuildingKind;
  footprint: Rect;
  rooms: Rect[];
  walls: Rect[];
  entries: (Omit<DoorSpec, 'rooms'> & { inside: number })[];
  interiorDoors: DoorSpec[];
  furniture: Rect[];
  loot: Omit<Loot, 'id' | 'taken'>[];
  residents: Point[];
  stair?: SurvivalStair;
};

type Layout = {
  rooms: Rect[];
  entries: { side: 'north' | 'south'; room: number; name: string }[];
  doors: { x: number; y: number; name: string; rooms: DoorSpec['rooms'] }[];
  windows: { x: number; y: number; width: number }[];
  furniture: Rect[];
  loot: ReadonlyArray<readonly [Loot['kind'], number, number]>;
  residents: Point[];
};

const rect = (kind: string, x: number, y: number, w: number, h: number): Rect => ({ kind, x, y, w, h });

const LAYOUTS: Record<SurvivalBuildingKind, Layout> = {
  house: {
    rooms: [rect('住宅起居室', 0, 0, 530, 244), rect('住宅卧室', 0, 244, 530, 181)],
    entries: [{ side: 'south', room: 0, name: '住宅前门' }],
    doors: [{ x: 302, y: 244, name: '卧室门', rooms: [0, 1] }],
    windows: [{ x: 77, y: 0, width: 71 }, { x: 175, y: 425, width: 82 }],
    furniture: [
      rect('survival-couch', 63, 136, 117, 55), rect('survival-kitchen', 21, 34, 130, 41),
      rect('survival-bed', 54, 284, 109, 100), rect('survival-pack', 442, 344, 54, 43),
      rect('survival-dining', 354, 377, 71, 35),
    ],
    loot: [['ammo', 254, 116], ['bandage', 100, 101], ['ammo', 452, 162], ['medkit', 207, 326],
      ['coins', 274, 364], ['mod-cache', 449, 300], ['drink', 224, 199]],
    residents: [{ x: 420, y: 130 }],
  },
  clinic: {
    rooms: [rect('诊所候诊区', 0, 0, 600, 165), rect('诊室', 0, 165, 600, 134), rect('药品库', 0, 299, 600, 131)],
    entries: [{ side: 'south', room: 0, name: '诊所入口门' }],
    doors: [
      { x: 378, y: 165, name: '诊室门', rooms: [0, 1] },
      { x: 93, y: 299, name: '药品库门', rooms: [1, 2] },
    ],
    windows: [{ x: 80, y: 0, width: 88 }, { x: 430, y: 0, width: 86 }],
    furniture: [
      rect('survival-couch', 64, 59, 105, 43), rect('survival-counter', 487, 58, 85, 34),
      rect('survival-exam', 240, 189, 106, 53), rect('survival-pharmacy', 332, 380, 214, 32),
      rect('survival-pack', 484, 205, 63, 48),
    ],
    loot: [['ammo', 192, 84], ['bandage', 346, 57], ['ammo', 522, 118], ['medkit', 175, 218],
      ['coins', 455, 208], ['mod-cache', 241, 358], ['drink', 480, 339]],
    residents: [{ x: 439, y: 204 }, { x: 240, y: 324 }],
  },
  warehouse: {
    rooms: [rect('物流仓库', 0, 0, 810, 630)],
    entries: [{ side: 'south', room: 0, name: '仓库南装卸门' }, { side: 'north', room: 0, name: '仓库北侧门' }],
    doors: [], windows: [],
    furniture: [
      rect('survival-rack', 88, 178, 186, 74), rect('survival-rack', 95, 361, 183, 76),
      rect('survival-rack', 552, 178, 174, 77), rect('survival-rack', 534, 361, 186, 78),
      rect('survival-crates', 113, 491, 128, 83), rect('survival-case', 651, 493, 84, 63),
    ],
    loot: [['ammo', 285, 103], ['bandage', 628, 77], ['ammo', 472, 260], ['medkit', 191, 288],
      ['coins', 615, 292], ['mod-cache', 456, 460], ['drink', 281, 517], ['coins', 519, 550]],
    residents: [{ x: 282, y: 327 }, { x: 506, y: 373 }],
  },
  shop: {
    rooms: [rect('街边商铺', 0, 0, 480, 420)],
    entries: [{ side: 'south', room: 0, name: '商铺入口门' }],
    doors: [], windows: [{ x: 35, y: 0, width: 93 }],
    furniture: [rect('survival-checkout', 314, 272, 124, 56), rect('survival-shelf', 50, 155, 130, 47),
      rect('survival-shelf', 50, 255, 134, 48)],
    loot: [['bandage', 238, 133], ['drink', 219, 262], ['ammo', 364, 176], ['coins', 285, 362]],
    residents: [{ x: 255, y: 242 }],
  },
  utility: {
    rooms: [rect('工具间', 0, 0, 260, 260)],
    entries: [{ side: 'south', room: 0, name: '维修门' }],
    doors: [], windows: [],
    furniture: [rect('survival-workbench', 21, 185, 106, 38)],
    loot: [['mod-cache', 186, 183], ['ammo', 76, 117]],
    residents: [],
  },
};

export function placeSurvivalBuilding(kind: SurvivalBuildingKind, footprint: Rect, firstRoom: number,
  lootOffset: () => number, doorCenter: number, side: 'north' | 'south' | 'east', through: boolean): SurvivalBuilding {
  const { x, y, w, h } = footprint, layout = LAYOUTS[kind];
  const sx = w / layout.rooms[0].w, sy = h / Math.max(...layout.rooms.map(room => room.y + room.h));
  const world = (point: Point): Point => ({ x: point.x * sx + x, y: point.y * sy + y });
  const worldRect = (r: Rect): Rect => ({ ...r, ...world(r), w: r.w * sx, h: r.h * sy });
  const rooms = layout.rooms.map(worldRect);
  if (rooms.length === 1) rooms[0].kind = footprint.kind;
  const length = Math.min(148, Math.max(80, w * .22));
  const entries = (through ? layout.entries : layout.entries.slice(0, 1)).map(entry => {
    const north = through ? entry.side === 'north' : side === 'north';
    const east = side === 'east';
    const roomIndex = north ? rooms.findIndex(room => Math.abs(room.y + room.h - y - h) < .5) : 0;
    return {
      x: east ? x + w : Math.max(x + 23, Math.min(x + w - length - 23, doorCenter - length / 2)),
      y: y + (east ? (h - length) / 2 : north ? h : 0), length, baseAngle: east ? Math.PI / 2 : 0,
      name: entry.name, material: 'wood' as const, inside: firstRoom + roomIndex,
    };
  });
  const interiorDoors: DoorSpec[] = layout.doors.map(door => ({
    ...door, ...world(door), length: Math.min(110, Math.max(80, 110 * sx)), baseAngle: 0, material: 'wood' as const,
    rooms: [firstRoom + door.rooms[0], firstRoom + door.rooms[1]] as const,
  }));
  const windows = layout.windows.map(window => ({ ...world(window), width: window.width * sx })).filter(window =>
    entries.every(entry => entry.y !== window.y || window.x + window.width + 12 < entry.x || window.x > entry.x + entry.length + 12));
  const walls = connectedWalls(rooms, [...entries, ...interiorDoors], windows.map(window =>
    ({ horizontal: true, axis: window.y, from: window.x, to: window.x + window.width })));
  walls.push(...windows.map(window => rect('survival-window', window.x, window.y - 7, window.width, 14)));
  const furniture = layout.furniture.filter(r =>
    !(side === 'north' && r.kind === 'survival-dining') && !(side === 'east' && r.x > layout.rooms[0].w * .6))
    .map(r => worldRect(side === 'north' && r.kind === 'survival-workbench' ? { ...r, y: 42 } : r));
  return {
    kind, footprint, rooms, walls, entries, interiorDoors, furniture,
    loot: layout.loot.map(([id, px, py]) => ({ kind: id, ...world({ x: px + lootOffset(), y: py }) })),
    residents: layout.residents.map(world),
  };
}

export function addSurvivalUpperFloor(building: SurvivalBuilding, firstRoom: number, upperRoom: number, upperX: number) {
  const { footprint: f, kind } = building;
  const clinic = kind === 'clinic', shop = kind === 'shop';
  const lower = rect(clinic ? '一楼候诊区' : shop ? '一楼店面' : '一楼起居室', f.x, f.y, f.w, clinic ? f.h * .62 : f.h);
  const upper = rect(clinic ? '二楼药库与办公间' : '二楼卧室与储物间', upperX, f.y, f.w, f.h);
  const offsetX = upper.x - lower.x;
  const stairs = rect('住宅楼梯', f.x + (f.kind === '西侧杂货铺' ? 20 : 37), f.y + 89, 118, 163);
  const north = stairs.y + stairs.h;
  const rails = [rect('stair-rail', stairs.x, stairs.y, 8, stairs.h),
    rect('stair-rail', stairs.x + stairs.w - 8, stairs.y, 8, stairs.h)];
  const cap = (x: number, y: number) => rect('stair-stop', x + 8, y, stairs.w - 16, 5);
  const upperWall = upper.x + upper.w - 156;
  const storageDepth = 149;
  const upperDoor: DoorSpec = { name: clinic ? '二楼药库门' : '二楼储物间门', x: upperWall + 35, y: upper.y + storageDepth, length: 88,
    baseAngle: 0, material: 'wood', rooms: [upperRoom, upperRoom] };
  const storage = [
    rect('卧室', upper.x, upper.y, upper.w - 156, upper.h),
    rect('储物间', upperWall, upper.y, 156, storageDepth),
    rect('二楼过道', upperWall, upper.y + storageDepth, 156, upper.h - storageDepth),
  ];
  const joins = [{ horizontal: false, axis: upperWall, from: upper.y + storageDepth, to: upper.y + upper.h }];
  const lowerWindow = { horizontal: true, axis: f.y, from: f.x + 200, to: f.x + 291 };
  const lowerWindows = building.entries.some(entry => entry.y === lowerWindow.axis &&
    entry.x <= lowerWindow.to + 14 && entry.x + entry.length >= lowerWindow.from - 14) ? [] : [lowerWindow];
  const groundRooms = [lower];
  const groundDoors: DoorSpec[] = [];
  if (clinic) {
    const exam = rect('一楼诊室', f.x, f.y + lower.h, f.w, f.h - lower.h);
    groundRooms.push(exam);
    groundDoors.push({ name: '诊室门', x: f.x + f.w * .65, y: exam.y, length: 105, baseAngle: 0,
      material: 'wood', rooms: [firstRoom, firstRoom + 1] });
  }
  building.entries = building.entries.map(entry => ({ ...entry, inside: firstRoom }));
  building.rooms = [...groundRooms, upper];
  building.interiorDoors = [...groundDoors, upperDoor]; // Keep existing interior-door slots where possible.
  building.walls = [
    ...connectedWalls(groundRooms, [...building.entries, ...groundDoors], lowerWindows),
    ...lowerWindows.map(w => rect('survival-window', w.from, w.axis - 7, w.to - w.from, 14)),
    ...connectedWalls(storage, [upperDoor], joins), ...rails, cap(stairs.x, north + 32),
    ...rails.map(rail => ({ ...rail, x: rail.x + offsetX })), cap(stairs.x + offsetX, stairs.y - 37),
  ];
  const prop = (area: Rect, name: string, x: number, y: number, w: number, h: number) =>
    rect(name, area.x + x * area.w / 582, area.y + y * f.h / 396, w, h);
  const frontsNorth = building.entries[0].y > f.y + f.h / 2;
  const living = [
    prop(f, shop ? 'survival-shelf' : 'survival-couch', clinic ? 164 : 245, clinic ? 105 : frontsNorth ? 47 : 171, 125, 57),
    prop(f, shop || clinic ? 'survival-checkout' : 'survival-kitchen', 405, clinic ? 64 : frontsNorth ? 35 : 220, 110, 44),
    prop(f, shop ? 'survival-shelf' : 'survival-dining', clinic ? 477 : frontsNorth ? 278 : 331,
      frontsNorth || clinic ? 168 : 314, 88, 65),
  ];
  if (clinic) living.push(prop(f, 'survival-exam', 215, 300, 110, 54), prop(f, 'survival-counter', 469, 333, 94, 39));
  building.furniture = [...living,
    prop(upper, clinic ? 'survival-dining' : 'survival-bed', 246, 255, 113, 102),
    rect(clinic ? 'survival-pharmacy' : 'survival-pack', upper.x + upper.w - 147, upper.y + 21, 38, 27),
    rect('survival-workbench', upper.x + upper.w - 102, upper.y + 22, 75, 28),
  ];
  // Keep the seven original item IDs and their order, with higher-value supplies upstairs.
  const position = (area: Rect, x: number, y: number) => ({ x: area.x + x * f.w / 582, y: f.y + y * f.h / 396 });
  const cache = { x: upper.x + upper.w - 80, y: upper.y + 84 };
  const points = shop ? [position(f, 230, 126), position(f, 470, 132), position(upper, 291, 205), cache] :
    [position(f, 230, 83 + (clinic ? 0 : 43)), position(f, 470, 134), position(f, 188, 310),
      position(upper, 291, 205), position(upper, 382, 196), cache, position(upper, 502, 301)];
  if (f.kind === '十字路口住宅') {
    points[2] = position(f, 210, 310);
    points[4] = position(upper, 467, 196);
    points[6] = position(upper, 382, 304);
  }
  building.loot = building.loot.map((item, i) => ({ ...item, ...points[i] }));
  building.stair = { bounds: stairs, offsetX, lowerRoom: firstRoom, upperRoom,
    searchPoints: [[{ x: f.x + 194, y: f.y + 126 }, position(f, 493, 143), position(f, 218, 281)],
      [{ x: stairs.x + offsetX + 118, y: north + 45 }, position(upper, 382, 205), cache]] };
  building.residents = clinic ? [position(f, 367, 280), position(upper, 374, 225)] : [position(upper, 374, 225)];
}
