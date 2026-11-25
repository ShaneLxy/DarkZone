import type { Point, Rect } from './Core';
import { connectedWalls, createApartmentRun, type LevelDefinition } from './Levels';

export type RetrievalPart = 'lobby' | 'stairs' | 'home' | 'roof';
export type RetrievalPhase = 'arrive' | 'reception' | 'lift' | 'blackout' | 'escape' | 'climb' |
  'contact' | 'hold' | 'escort' | 'pad' | 'boarding';
export const RETRIEVAL_HOLD = 40;
export const RETRIEVAL_CAR = { x: 1050, y: 1640 };
export const RETRIEVAL_DESK = { x: 730, y: 785 };
export const RETRIEVAL_LIFT = { x: 1550, y: 876 };
export const RETRIEVAL_CHECK = { x: 1040, y: 880 };
export const RETRIEVAL_HOME = { x: 1910, y: 988 };
export const RETRIEVAL_HOME_DOOR = { x: 1980, y: 850 };
export const RETRIEVAL_PAD = { x: 765, y: 580 };
export const RETRIEVAL_STREET_TEAM = [{ x: 924, y: 1745 }, { x: 982, y: 1770 }, { x: 940, y: 1820 }];
export const RETRIEVAL_LANDINGS = [
  { x: 510, y: 325, floor: '2F' }, { x: 905, y: 540, floor: '5F' }, { x: 440, y: 780, floor: '8F' },
] as const;
export const RETRIEVAL_ROOF_BOARD = [
  { x: 674, y: 520 }, { x: 675, y: 552 }, { x: 689, y: 501 }, { x: 662, y: 575 }, { x: 644, y: 523 },
] as const;

export type RetrievalPerson = Point & {
  id: string; art: string; angle: number; hp: number; hit: number; down: number; pace: number;
  patrol?: Point; home: Point;
};
export type RetrievalRun = {
  part: RetrievalPart; phase: RetrievalPhase; time: number; wave: number; landing: number;
  people: RetrievalPerson[]; boarders: (Point & { angle: number; art: string })[];
};

const person = (id: string, art: string, home: Point, patrol?: Point, pace = 47): RetrievalPerson =>
  ({ id, art, ...home, home, patrol, pace, angle: 0, hp: 100, hit: 0, down: 0 });
export function retrievalPeople(part: RetrievalPart): RetrievalPerson[] {
  if (part === 'home') return [
    person('father', 'father', { x: 1910, y: 1051 }),
    person('mother', 'mother', { x: 1990, y: 1040 }),
  ];
  if (part === 'roof') return [
    person('father', 'father', { x: 354, y: 241 }),
    person('mother', 'mother', { x: 392, y: 236 }),
  ];
  if (part !== 'lobby') return [];
  return [
    person('receptionist', 'receptionist', { x: 761, y: 931 }, { x: 664, y: 936 }, 20),
    person('shopper', 'civilian-1', { x: 812, y: 1510 }, { x: 841, y: 1803 }),
    person('walker', 'civilian-2', { x: 1245, y: 1467 }, { x: 1485, y: 1467 }),
    person('neighbor', 'civilian-3', { x: 843, y: 1295 }),
    person('neighbor-2', 'civilian-2', { x: 880, y: 1285 }),
    person('tenant', 'civilian-3', { x: 1125, y: 740 }, { x: 1370, y: 766 }),
    person('guest', 'civilian-1', { x: 1017, y: 1001 }, { x: 1068, y: 1071 }),
    person('waiting', 'civilian-2', { x: 1630, y: 845 }),
  ];
}

const area = (kind: string, x: number, y: number, w: number, h: number): Rect => ({ kind, x, y, w, h });
export function createRetrievalLevels(seed: number): Record<RetrievalPart, LevelDefinition> {
  const [arrival, , , home] = createApartmentRun(seed);
  const lobby: LevelDefinition = {
    ...arrival, id: 'retrieval-lobby', title: '紧急接应 · 一楼', retrieval: 'lobby',
    spawn: { x: 948, y: 1600 }, spawns: [], floorDetails: undefined,
    stairFlight: { ...arrival.stairFlight!, direction: 'up' },
    apartment: { ...arrival.apartment!, engineer: undefined, glass: undefined, outdoor: undefined, training: undefined, stations: [] },
    furniture: [...arrival.furniture, area('retrieval-humvee', 1017, 1554, 66, 172)],
  };
  const stairsRooms = [
    area('2F 楼梯平台', 280, 200, 795, 176), area('东段消防梯', 875, 376, 200, 120),
    area('5F 楼梯平台', 280, 496, 795, 172), area('西段消防梯', 280, 668, 200, 105),
    area('8F—9F 楼梯平台', 280, 773, 795, 183),
    area('中层住户走廊', 1075, 496, 200, 172),
  ];
  const stairsDoor = { x: 1075, y: 525, length: 108, baseAngle: Math.PI / 2, material: 'wood' as const,
    name: '五层防火门', rooms: [2, 5] as const };
  const stairs: LevelDefinition = {
    id: 'retrieval-stairs', title: '紧急接应 · 消防楼梯', retrieval: 'stairs', rooms: stairsRooms,
    walls: connectedWalls(stairsRooms, [stairsDoor], [
      { horizontal: true, axis: 376, from: 890, to: 1059 }, { horizontal: true, axis: 496, from: 890, to: 1059 },
      { horizontal: true, axis: 668, from: 296, to: 463 }, { horizontal: true, axis: 773, from: 296, to: 463 },
    ]), doors: [stairsDoor], furniture: [], hints: [], spawn: { x: 392, y: 282 }, exit: { x: 979, y: 858 }, spawns: [],
    stairFlight: { x: 921, y: 375, w: 119, h: 123, direction: 'up' },
  };
  const roofRooms = [area('屋顶停机区', 245, 165, 875, 565)];
  const roof: LevelDefinition = {
    id: 'retrieval-roof', title: '紧急接应 · 楼顶', retrieval: 'roof',
    rooms: roofRooms, walls: connectedWalls(roofRooms, []), doors: [],
    furniture: [area('garage-generator', 944, 647, 117, 61), area('garage-generator', 284, 619, 96, 54),
      area('garage-column', 497, 333, 60, 60)],
    hints: [], spawn: { x: 335, y: 272 }, exit: { x: 675, y: 522 }, spawns: [],
    stairFlight: { x: 263, y: 173, w: 97, h: 109, direction: 'up' },
  };
  return { lobby, stairs, roof, home: {
    ...home, id: 'retrieval-home', title: '紧急接应 · 九楼', retrieval: 'home', spawns: [], floorDetails: undefined,
    spawn: { x: 2290, y: 997 }, exit: { x: 2315, y: 1034 },
    apartment: { ...home.apartment!, safeRoom: undefined, engineer: undefined, gear: undefined, stations: [] },
  } };
}
