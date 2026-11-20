import type { Point, Rect } from './Core';
import type { SurvivalBuildingKind } from './SurvivalInteriors';

// Coordinates follow the approved 1536 × 1024 ImageGen sheet, north at the top.
export const HARBOR_ART_WIDTH = 1536;
export const HARBOR_ART_HEIGHT = 1024;
export const HARBOR_SCALE = 6;
export const SURVIVAL_LAYOUT = 'harbor-v2';
export const harborPoint = (x: number, y: number): Point => ({ x: x * HARBOR_SCALE, y: (HARBOR_ART_HEIGHT - y) * HARBOR_SCALE });
export const harborRect = (kind: string, x: number, y: number, w: number, h: number): Rect => ({
  ...harborPoint(x, y + h), kind, w: w * HARBOR_SCALE, h: h * HARBOR_SCALE,
});

export const HARBOR_CHUNK_SIZE = 128;
export const HARBOR_OVERVIEW_MARGIN = 128;
export type HarborChunk = Rect & { kind: string };
export const harborDistanceToChunk = (p: Point, r: HarborChunk) => [
  Math.max(r.x - p.x, p.x - r.x - r.w, 0), Math.max(r.y - p.y, p.y - r.y - r.h, 0),
] as const;
export const HARBOR_CHUNKS = Array.from({ length: 96 }, (_, index) => {
  const col = index % 12, row = Math.floor(index / 12);
  const id = `${String.fromCharCode(65 + col)}${row + 1}`;
  return { ...harborRect(id, col * HARBOR_CHUNK_SIZE, row * HARBOR_CHUNK_SIZE, HARBOR_CHUNK_SIZE, HARBOR_CHUNK_SIZE), kind: id };
});
// Order and dimensions match the packed ImageGen roof sheet.
export const HARBOR_ROOFS = ['clay', 'slate', 'clinic', 'green', 'shop', 'metal', 'awning'] as const;
export const HARBOR_REGIONAL_ROOFS = ['factory', 'rust', 'vault', 'dock', 'blue', 'terracotta'] as const;
type Roof = typeof HARBOR_ROOFS[number] | typeof HARBOR_REGIONAL_ROOFS[number];
const featuredRoofs: Readonly<Record<string, Roof>> = {
  '菜园住宅': 'clay', '北巷红顶住宅': 'clay', '公路东侧住宅': 'clay', '弯道蓝顶住宅': 'slate',
  '东坡住宅': 'slate', '十字路口住宅': 'slate', '诊所西侧住宅': 'green', '市场侧库': 'green',
  '工事车库': 'metal', '红棚商铺': 'awning', '街角市场': 'awning',
  '西厂动力车间': 'rust', '西厂检修库': 'factory', '红砖维修厂': 'rust', '西厂钣金车间': 'blue',
  '货场备件车间': 'dock', '港区装卸仓库': 'factory', '一号码头仓': 'rust', '二号码头仓': 'factory',
  '圆顶储运库': 'vault', '港区东备货库': 'dock',
  '山脚红瓦住宅': 'terracotta', '路口绿瓦住宅': 'green', '弯道红顶住宅': 'terracotta',
  '北巷灰顶住宅': 'blue', '南街红顶住宅': 'terracotta', '南街沿坡住宅': 'clay',
  '南街东端住宅': 'green', '南街双坡顶住宅': 'terracotta', '东街棕顶住宅': 'clay',
  '红瓦独栋': 'terracotta', '西侧杂货铺': 'awning',
};
const defaultRoofs: Record<SurvivalBuildingKind, Roof> = {
  house: 'slate', utility: 'green', clinic: 'clinic', shop: 'shop', warehouse: 'metal',
};
export const harborBuildingRoof = (bounds: Rect, kind: SurvivalBuildingKind): Roof =>
  featuredRoofs[bounds.kind ?? ''] ?? defaultRoofs[kind];

export const HARBOR_UPPER_BUILDINGS = new Set([
  '十字路口住宅', '社区诊所', '北巷灰顶住宅', '北巷红顶住宅', '东街大宅', '公路东侧住宅',
  '南街沿坡住宅', '南街双坡顶住宅', '西侧杂货铺', '路口商行', '街角市场',
]);

type BuildingSite = readonly [name: string, kind: SurvivalBuildingKind, x: number, y: number, w: number, h: number, entranceX?: number, side?: 'north' | 'south' | 'east'];
export const HARBOR_BUILDINGS: readonly BuildingSite[] = [
  ['菜园住宅', 'house', 689, 316, 97, 78, 753],
  ['社区诊所', 'clinic', 873, 453, 126, 86, 945],
  ['港区装卸仓库', 'warehouse', 396, 809, 151, 117, 470],
  ['工事车库', 'utility', 1026, 181, 108, 83, 1068],
  ['工事工具房', 'utility', 942, 189, 64, 50, 967],
  ['北坡小屋', 'house', 613, 70, 75, 65, 652],
  ['山脚红瓦住宅', 'house', 1131, 58, 89, 62, 1176],
  ['路口绿瓦住宅', 'house', 1274, 83, 88, 65, 1326],
  ['上坡储物间', 'utility', 831, 171, 30, 31, 846, 'north'],
  ['北巷灰顶住宅', 'house', 500, 205, 93, 69, 547],
  ['石阶住宅', 'house', 628, 213, 84, 67, 670],
  ['北巷红顶住宅', 'house', 757, 205, 101, 76, 807],
  ['北巷工具棚', 'utility', 623, 185, 34, 25, 640, 'north'],
  ['公路西侧住宅', 'house', 563, 338, 81, 65, 608],
  ['公路东侧住宅', 'house', 805, 322, 75, 69, 846],
  ['弯道蓝顶住宅', 'house', 1252, 252, 71, 67, 1288],
  ['弯道红顶住宅', 'house', 1344, 269, 85, 70, 1397],
  ['东坡住宅', 'house', 1256, 350, 85, 64, 1298],
  ['十字路口住宅', 'house', 1119, 451, 97, 66, 1174, 'north'],
  ['东街大宅', 'house', 1293, 468, 96, 90, 1340],
  ['东街灰顶住宅', 'house', 1282, 583, 66, 74, 1318],
  ['东街棕顶住宅', 'house', 1366, 590, 62, 57, 1395],
  ['红瓦独栋', 'house', 585, 469, 72, 61, 620],
  ['诊所西侧住宅', 'house', 683, 464, 89, 75, 728, 'north'],
  ['诊所西侧工具间', 'utility', 776, 466, 33, 32, 795],
  ['西街角住宅', 'house', 556, 564, 65, 78, 593],
  ['西侧杂货铺', 'shop', 658, 554, 88, 110, 693],
  ['街边食品店', 'shop', 747, 575, 66, 87, 775],
  ['红棚商铺', 'shop', 822, 570, 81, 95, 862],
  ['路口商行', 'shop', 909, 566, 120, 94, 963],
  ['街角市场', 'shop', 1096, 526, 103, 142, 1158],
  ['市场侧库', 'utility', 1201, 545, 44, 77, 1228],
  ['南街西端住宅', 'house', 747, 735, 83, 78, 792],
  ['南街红顶住宅', 'house', 874, 739, 87, 68, 918],
  ['南街沿坡住宅', 'house', 1015, 738, 91, 72, 1066],
  ['南街小屋', 'house', 1160, 752, 65, 70, 1191],
  ['南街双坡顶住宅', 'house', 1235, 730, 83, 93, 1277],
  ['南街东端住宅', 'house', 1344, 744, 72, 62, 1380],
  ['西厂动力车间', 'warehouse', 80, 248, 180, 127, 161, 'north'],
  ['西厂检修库', 'warehouse', 84, 392, 152, 111, undefined, 'east'],
  ['红砖维修厂', 'warehouse', 301, 344, 137, 109, 357],
  ['西厂钣金车间', 'warehouse', 79, 516, 117, 93, 136],
  ['货场备件车间', 'warehouse', 327, 492, 112, 84, 386],
  ['一号码头仓', 'warehouse', 53, 734, 138, 112, 114],
  ['二号码头仓', 'warehouse', 197, 768, 101, 94, 245],
  ['圆顶储运库', 'warehouse', 303, 801, 84, 103, 340],
  ['港区东备货库', 'warehouse', 549, 851, 108, 109, 590],
];

// [y, left bank, right bank] in the approved plan. The packer reads these
// survey points and the same rectangles used to cut out bridges and piers.
export const HARBOR_CREEK = [
  [0, 207, 228], [41, 217, 237], [86, 228, 249], [122, 242, 267], [154, 259, 282],
  [185, 274, 302], [216, 296, 317], [234, 316, 343], [247, 339, 369], [259, 366, 397],
  [277, 394, 425], [298, 415, 441], [331, 431, 455], [369, 444, 472], [402, 456, 483],
  [438, 467, 490], [480, 465, 488], [517, 458, 482], [558, 449, 475], [594, 442, 468],
  [628, 433, 460], [660, 416, 447], [684, 400, 434], [712, 396, 424], [734, 404, 436],
  [752, 423, 451], [774, 438, 461], [786, 453, 453],
] as const;
// Trace the playable land clockwise. The southwest section follows the original pier approaches.
export const HARBOR_SHORE = [
  [14, 84], [29, 44], [61, 27], [139, 25], [209, 17], [230, 13], [324, 28], [480, 19],
  [650, 28], [818, 23], [960, 17], [1084, 24], [1245, 18], [1402, 30], [1483, 20],
  [1515, 38], [1525, 120], [1512, 239], [1524, 338], [1517, 457], [1529, 569],
  [1518, 662], [1526, 775], [1516, 893], [1523, 962], [1506, 991], [1445, 997],
  [1337, 982], [1221, 1000], [1126, 988], [1014, 1002], [898, 998], [807, 984],
  [711, 993], [591, 989], [497, 1006], [441, 1019], [332, 978], [251, 953], [173, 923], [91, 884], [14, 850],
  [10, 784], [21, 699], [12, 608], [8, 507], [12, 410], [7, 303], [14, 205],
] as const;
export const HARBOR_PIERS = [[83, 870, 29, 93], [206, 929, 25, 79]] as const;
export const HARBOR_BRIDGES = [[262, 178, 51, 18], [367, 661, 99, 52]] as const;
export const HARBOR_MAP_REGIONS = [
  ['工事', 1043, 334], ['北坡', 702, 105], ['工业区', 218, 490], ['码头', 352, 889],
  ['商业街', 968, 588], ['东侧住宅', 1358, 481], ['南侧住宅', 1110, 778],
] as const;
export const HARBOR_FIXED_PROPS = [
  ['crates', 19, 759, 33, 77], ['containers', 189, 712, 128, 36], ['containers', 480, 747, 76, 40],
  ['containers', 574, 752, 88, 43], ['wagon', 239, 597, 89, 30], ['tanks', 280, 276, 61, 66],
  ['crane', 210, 519, 57, 40], ['ledge', 291, 67, 88, 41], ['ledge', 395, 38, 68, 42],
  ['ledge', 466, 27, 110, 41], ['ledge', 719, 48, 74, 42], ['ledge', 801, 60, 101, 37],
  ['ledge', 947, 14, 124, 44], ['rocks', 1410, 931, 56, 48], ['rocks', 1163, 915, 77, 47],
] as const;

export function harborTerrainBlockers(): Rect[] {
  const water: Rect[] = [];
  type Gap = readonly [number, number, number, number];
  const addWater = (left: number, right: number, y: number, h: number, gaps: readonly Gap[]) => {
    for (const [x, top, w, depth] of gaps) {
      if (y >= top + depth || y + h <= top || x >= right || x + w <= left) continue;
      if (x > left) water.push(harborRect('harbor-water', left, y, x - left, h));
      left = Math.max(left, x + w);
    }
    if (right > left) water.push(harborRect('harbor-water', left, y, right - left, h));
  };
  const rows = (from: number, to: number, gaps: readonly Gap[]) => {
    const samples = Array.from({ length: Math.ceil((to - from) / 8) + 1 }, (_, i) => Math.min(from + i * 8, to));
    return Array.from(new Set(samples.concat(gaps.flatMap(([, y, , h]) => [y, y + h])))).sort((a, b) => a - b);
  };
  const creekRows = rows(0, 786, HARBOR_BRIDGES);
  for (let i = 1; i < creekRows.length; i++) {
    const y = creekRows[i - 1], h = creekRows[i] - y, middle = y + h / 2;
    const end = HARBOR_CREEK.findIndex(([next]) => next > middle);
    const [top, west, east] = HARBOR_CREEK[end - 1], [bottom, left, right] = HARBOR_CREEK[end];
    const t = (middle - top) / (bottom - top);
    addWater(west + (left - west) * t, east + (right - east) * t, y, h, HARBOR_BRIDGES);
  }
  const shoreRows = rows(0, HARBOR_ART_HEIGHT, HARBOR_PIERS);
  for (let i = 1; i < shoreRows.length; i++) {
    const y = shoreRows[i - 1], h = shoreRows[i] - y, middle = y + h / 2;
    const crossings: number[] = [];
    for (let j = 0; j < HARBOR_SHORE.length; j++) {
      const [x0, y0] = HARBOR_SHORE[j], [x1, y1] = HARBOR_SHORE[(j + 1) % HARBOR_SHORE.length];
      if ((y0 > middle) !== (y1 > middle)) crossings.push(x0 + (x1 - x0) * (middle - y0) / (y1 - y0));
    }
    crossings.sort((a, b) => a - b);
    let left = 0;
    for (let j = 0; j < crossings.length; j += 2) {
      addWater(left, crossings[j], y, h, HARBOR_PIERS);
      left = crossings[j + 1];
    }
    addWater(left, HARBOR_ART_WIDTH, y, h, HARBOR_PIERS);
  }
  return [...water, ...HARBOR_FIXED_PROPS.map(([, x, y, w, h]) => harborRect('harbor-obstacle', x, y, w, h))];
}
