import type { Point, SupplyKind } from './Core';
import { ENGINEER_ID, GHOST_ID, HEROINE_ID, type HeroId } from './Heroes';

export const SURVIVAL_GUNS = {
  tec9: { hero: HEROINE_ID, gun: 'TEC-9', damage: 15, interval: .15, magazine: 20, reload: 1.28, pellets: 1, spread: .065, bulletPush: 10, range: 395 },
  eagle: { hero: HEROINE_ID, gun: '沙鹰', damage: 51, interval: .63, magazine: 7, reload: 1.52, pellets: 1, spread: .028, bulletPush: 48, range: 560 },
  semishot: { hero: ENGINEER_ID, gun: '半自动霰弹枪', damage: 12, interval: .32, magazine: 8, reload: 1.65, pellets: 6, spread: .24, bulletPush: 37, range: 385 },
  doubleshot: { hero: ENGINEER_ID, gun: '双管霰弹枪', damage: 21, interval: .2, magazine: 2, reload: 1.95, pellets: 8, spread: .29, bulletPush: 60, range: 330 },
  rapid: { hero: GHOST_ID, gun: '高速步枪', damage: 18, interval: .09, magazine: 28, reload: 1.17, pellets: 1, spread: .047, bulletPush: 19, range: 630 },
  drum: { hero: GHOST_ID, gun: '大弹匣步枪', damage: 21, interval: .17, magazine: 64, reload: 2.45, pellets: 1, spread: .039, bulletPush: 26, range: 690 },
} as const;
export type SurvivalGun = keyof typeof SURVIVAL_GUNS;
export const survivalWeapons = (hero: HeroId) => (Object.keys(SURVIVAL_GUNS) as SurvivalGun[]).filter(id => SURVIVAL_GUNS[id].hero === hero);

export const SURVIVAL_PARTS = ['sentry-barrel', 'sentry-bracket', 'sentry-base'] as const;
export const survivalBagRows = (hero: HeroId) => hero === HEROINE_ID ? 6 : hero === ENGINEER_ID ? 8 : 9;
export const survivalBagCols = (hero: HeroId) => hero === HEROINE_ID ? 7 : survivalBagRows(hero);
export const SURVIVAL_GEAR = {
  bandage: ['绷带', 1, 1, 3], medkit: ['医疗包', 1, 2, 2], drink: ['能量饮料', 1, 1, 3],
  'mod-cache': ['零部件', 1, 1, 6], grenade: ['手雷', 1, 1, 3],
  'shock-mine': ['麻痹地雷', 2, 2, 2], mine: ['感应地雷', 2, 2, 2], scanner: ['侦察终端', 1, 1, 2],
  'medical-stock': ['医疗耗材', 1, 1, 6], 'tactical-stock': ['战术耗材', 1, 1, 6], 'tactical-module': ['战术模块', 1, 1, 3],
  'door-wood': ['木板', 1, 2, 5], 'door-metal': ['金属板', 2, 1, 6], 'door-brace': ['加固组件', 2, 1, 3],
  'sentry-barrel': ['哨械枪头部', 3, 4, 1], 'sentry-bracket': ['哨械枪支架', 2, 5, 1], 'sentry-base': ['哨械枪底座', 2, 1, 1],
  sentry: ['哨械枪', 4, 4, 1], 'special-ammo': ['特种弹药', 1, 1, 4],
  tec9: ['TEC-9', 2, 1, 1], eagle: ['沙鹰', 2, 1, 1], semishot: ['半自动霰弹枪', 3, 2, 1],
  doubleshot: ['双管霰弹枪', 3, 1, 1], rapid: ['高速步枪', 3, 2, 1], drum: ['大弹匣步枪', 3, 2, 1],
  'air-key': ['启动钥匙', 1, 2, 1], 'air-controls': ['操纵组件', 2, 2, 1],
  'air-battery': ['航空蓄电池', 2, 2, 1], 'air-avionics': ['航电控制盒', 2, 2, 1], 'air-coupler': ['加油接口模块', 1, 3, 1],
  'boat-key': ['船钥匙', 1, 2, 1], 'boat-battery': ['船用电瓶', 2, 2, 1],
  'boat-steering': ['转向组件', 2, 2, 1], 'boat-start': ['启动控制盒', 2, 2, 1], 'boat-fuel': ['供油模块', 1, 3, 1],
  'evac-fuel': ['撤离燃油', 2, 3, 1],
} as const;
export type GearKind = keyof typeof SURVIVAL_GEAR;
type MaterialCost = readonly (readonly [GearKind, number])[];
type SurvivalDoorDefinition = { title: string; hp: number; seconds: number; material: 'wood' | 'steel'; repair: MaterialCost; install: MaterialCost };
export const SURVIVAL_DOORS = {
  wood: { title: '木门', hp: 100, seconds: 3, material: 'wood', repair: [['door-wood', 1]],
    install: [['door-wood', 3], ['mod-cache', 1]] },
  plated: { title: '包铁门', hp: 175, seconds: 4, material: 'wood', repair: [['door-wood', 1], ['door-metal', 1]],
    install: [['door-wood', 2], ['door-metal', 3], ['mod-cache', 2]] },
  reinforced: { title: '加固钢门', hp: 275, seconds: 5, material: 'steel', repair: [['door-metal', 2], ['mod-cache', 1]],
    install: [['door-metal', 5], ['mod-cache', 3], ['door-brace', 1]] },
  isolation: { title: '重型隔离门', hp: 420, seconds: 6, material: 'steel', repair: [['door-metal', 3], ['mod-cache', 2]],
    install: [['door-metal', 8], ['mod-cache', 4], ['door-brace', 2]] },
} as const satisfies Record<string, SurvivalDoorDefinition>;
export type SurvivalDoorKind = keyof typeof SURVIVAL_DOORS;
export const SURVIVAL_DOOR_KINDS = Object.keys(SURVIVAL_DOORS) as SurvivalDoorKind[];
export type SurvivalDoorPlan = { kind: SurvivalDoorKind; cost: MaterialCost; seconds: number; gain: number; reason?: string };
export const SURVIVAL_DOOR_REACH = 94;
export type GearStack = { kind: GearKind; count: number; rounds?: number };
export type BagItem = GearStack & { id: number; col: number; row: number; rotated: boolean };
export type SurvivalCrate = Point & { id: string; kind: 'medical' | 'armory' | 'engineering' | 'airdrop' | 'dropped'; opened: boolean; goods: GearStack[] };
export type SurvivalSentry = Point & { angle: number; hp: number; burst: number; next: number; muzzle: number };
export type SurvivalMine = Point & { kind?: 'proximity-mine' | 'shock-mine'; fuse?: number };
export type SurvivalFieldDrop = Point & GearStack & { id: string; zone: number };
export type SurvivalRestock = { cycle: number; zones: number[]; pending: { zone: number; slot: number }[] };
export type SurvivalGearSave = {
  bagLayout?: 2;
  items: BagItem[]; quick: (number | null)[]; crates: SurvivalCrate[]; sentries: SurvivalSentry[]; mines: SurvivalMine[];
  special?: { id: SurvivalGun; ammo: number; reserve: number }; selected: boolean; baseAmmo: number; baseReserve: number;
  scan: number; field?: SurvivalFieldDrop[]; restock?: SurvivalRestock;
};

export const SURVIVAL_RECIPES = {
  grenade: [['tactical-stock', 4]],
  'shock-mine': [['mod-cache', 2], ['tactical-stock', 2], ['tactical-module', 1]],
  mine: [['tactical-stock', 3], ['tactical-module', 2]],
  bandage: [['medical-stock', 2]],
  medkit: [['medical-stock', 6]],
  sentry: [['sentry-barrel', 1], ['sentry-bracket', 1], ['sentry-base', 1]],
} as const satisfies Partial<Record<GearKind, readonly (readonly [GearKind, number])[]>>;
export type SurvivalRecipe = keyof typeof SURVIVAL_RECIPES;
export const SURVIVAL_RECIPE_IDS = Object.keys(SURVIVAL_RECIPES) as SurvivalRecipe[];
export const SURVIVAL_DESCRIPTIONS = {
  bandage: '一段时间内持续恢复生命。', medkit: '使用完成后恢复大量生命。', drink: '短暂提速，并恢复少量生命。',
  'mod-cache': '修复工事挡板，也可用作制作材料。', grenade: '投出后产生范围爆炸，掩体会挡住冲击。',
  'shock-mine': '敌人踩近后释放电脉冲，暂时麻痹附近敌人。', mine: '敌人触发后倒数一秒，随后范围爆炸。',
  scanner: '短时间在小地图标出附近敌人。', 'special-ammo': '为当前携带的特殊武器补充一匣备弹。',
  'medical-stock': '本局制作绷带和医疗包的材料。', 'tactical-stock': '本局制作手雷与地雷的消耗材料。',
  'tactical-module': '本局制作感应地雷与麻痹地雷的稀有材料。',
  'door-wood': '在门位修补木门和包铁门，也可用于换装。', 'door-metal': '修补和换装金属门所需的板材。',
  'door-brace': '重装和升级加固钢门、重型隔离门所需的组件。',
  'sentry-barrel': '携带回工事工作台，用于组装哨械枪。', 'sentry-bracket': '哨械枪的支撑组件，可旋转收纳。',
  'sentry-base': '哨械枪的底座组件，带回工事工作台组装。', sentry: '安装后自动攻击射程内的敌人，可被敌人摧毁。',
  tec9: '近距离快速连发的本局手枪。', eagle: '单发伤害和击退较强的本局手枪。',
  semishot: '连续清理近距离敌人的本局霰弹枪。', doubleshot: '双发爆发强，之后需要换弹。',
  rapid: '射速突出，单发伤害略低。', drum: '64 发大弹匣，射速略低，可长时间压制。',
  'air-key': '可在工事黑鹰的检查面板中装入。', 'air-controls': '可在工事黑鹰的检查面板中装入。',
  'air-battery': '可在工事黑鹰的检查面板中装入。', 'air-avionics': '可在工事黑鹰的检查面板中装入。',
  'air-coupler': '可在工事黑鹰的检查面板中装入。', 'boat-key': '可在港口快艇的检查面板中装入。',
  'boat-battery': '可在港口快艇的检查面板中装入。', 'boat-steering': '可在港口快艇的检查面板中装入。',
  'boat-start': '可在港口快艇的检查面板中装入。', 'boat-fuel': '可在港口快艇的检查面板中装入。',
  'evac-fuel': '零件齐全后，可用于给黑鹰或快艇加油。',
} satisfies Record<GearKind, string>;

export const SENTRY_HP = 150;
export const SENTRY_RANGE = 425;
export const isSurvivalGun = (kind: GearKind): kind is SurvivalGun => Object.prototype.hasOwnProperty.call(SURVIVAL_GUNS, kind);
export const isSurvivalSupply = (kind: GearKind): kind is SupplyKind => kind === 'bandage' || kind === 'medkit' || kind === 'drink';
export const canUseSurvivalGear = (kind: GearKind) => isSurvivalGun(kind) || isSurvivalSupply(kind) ||
  ['mine', 'shock-mine', 'grenade', 'scanner', 'sentry', 'special-ammo'].includes(kind);
const TIMED_FOOTPRINTS: Partial<Record<GearKind, readonly [number, number]>> = {
  bandage: [1, 2], drink: [1, 2], medkit: [2, 2], scanner: [2, 2],
  'medical-stock': [1, 2], 'tactical-stock': [1, 2], 'mod-cache': [1, 3], 'special-ammo': [1, 3],
  'tactical-module': [1, 3], 'door-wood': [1, 3], 'door-metal': [2, 2], 'door-brace': [2, 2],
  grenade: [2, 2], mine: [2, 3], 'shock-mine': [2, 3], sentry: [4, 5], 'sentry-base': [2, 2],
  tec9: [2, 2], eagle: [2, 2], semishot: [2, 3], doubleshot: [2, 3], rapid: [2, 4], drum: [2, 4],
};
export function bagSize(kind: GearKind, rotated: boolean, timed = false) {
  const [, width, height] = SURVIVAL_GEAR[kind];
  const [w, h] = timed && TIMED_FOOTPRINTS[kind] || [width, height];
  return rotated ? [h, w] as const : [w, h] as const;
}

export class SurvivalBag {
  items: BagItem[] = [];
  quick: (number | null)[] = [null, null, null];
  constructor(readonly rows: number, readonly columns: number, readonly timed = false) {}
  size(kind: GearKind, rotated: boolean) { return bagSize(kind, rotated, this.timed); }
  item(id: number | null | undefined) { return this.items.find(item => item.id === id); }
  covering(col: number, row: number) {
    return this.items.find(item => {
      const [w, h] = this.size(item.kind, item.rotated);
      return col >= item.col && col < item.col + w && row >= item.row && row < item.row + h;
    });
  }
  get used() { return this.items.reduce((n, item) => { const [w, h] = this.size(item.kind, item.rotated); return n + w * h; }, 0); }
  count(kind: GearKind) { return this.items.reduce((n, item) => n + (item.kind === kind ? item.count : 0), 0); }
  fits(kind: GearKind, col: number, row: number, rotated: boolean, ignore?: number) {
    const [w, h] = this.size(kind, rotated);
    if (col < 0 || row < 0 || col + w > this.columns || row + h > this.rows) return false;
    for (let y = row; y < row + h; y++) for (let x = col; x < col + w; x++) {
      const item = this.covering(x, y);
      if (item && item.id !== ignore) return false;
    }
    return true;
  }
  move(id: number, col: number, row: number, rotated?: boolean) {
    const item = this.item(id);
    if (!item || !this.fits(item.kind, col, row, rotated ?? item.rotated, id)) return false;
    Object.assign(item, { col, row, rotated: rotated ?? item.rotated });
    return true;
  }
  give(stack: GearStack): number {
    const cap = SURVIVAL_GEAR[stack.kind][3];
    const existing = stack.rounds === undefined ? this.items.find(item => item.kind === stack.kind && item.count < cap) : undefined;
    if (existing) {
      const n = Math.min(cap - existing.count, stack.count);
      existing.count += n;
      return n;
    }
    const position = this.freePosition(stack.kind);
    if (position) {
      const count = Math.min(cap, stack.count);
      const id = 1 + this.items.reduce((n, item) => Math.max(n, item.id), 0);
      this.items.push({ kind: stack.kind, ...(stack.rounds === undefined ? {} : { rounds: stack.rounds }), count, id, ...position });
      const quick = this.quick.indexOf(null);
      if (quick >= 0 && (isSurvivalSupply(stack.kind) || ['mine', 'shock-mine', 'grenade', 'scanner'].includes(stack.kind)) &&
          !this.quick.some(bound => this.item(bound)?.kind === stack.kind)) this.quick[quick] = id;
      return count;
    }
    return 0;
  }
  private freePosition(kind: GearKind) {
    for (const rotated of [false, true]) for (let row = 0; row < this.rows; row++) for (let col = 0; col < this.columns; col++) {
      if (this.fits(kind, col, row, rotated)) return { col, row, rotated };
    }
    return undefined;
  }
  restore(items: BagItem[], quick: (number | null)[]) {
    const overflow: BagItem[] = [];
    this.items = [];
    for (const item of items) {
      const position = this.fits(item.kind, item.col, item.row, item.rotated) ? item : this.freePosition(item.kind);
      if (position) this.items.push({ ...item, col: position.col, row: position.row, rotated: position.rotated });
      else overflow.push(item);
    }
    this.quick = quick.map(id => this.item(id) ? id : null);
    return overflow;
  }
  take(id: number, amount = 1) {
    const item = this.item(id);
    if (!item || amount < 1 || amount > item.count) return false;
    if ((item.count -= amount) === 0) {
      this.items = this.items.filter(entry => entry !== item);
      this.quick = this.quick.map(bound => bound === id ? null : bound);
    }
    return true;
  }
  split(id: number) {
    const item = this.item(id);
    if (!item || item.count < 2) return false;
    const amount = Math.floor(item.count / 2), cap = SURVIVAL_GEAR[item.kind][3];
    const others = this.items.filter(other => other.kind === item.kind).map(other => [other, other.count] as const);
    for (const [other] of others) other.count = cap;
    const placed = this.give({ kind: item.kind, count: amount });
    for (const [other, count] of others) other.count = count;
    if (!placed) return false;
    item.count -= placed;
    return true;
  }
  craft(kind: SurvivalRecipe, preview = false): 'ok' | 'materials' | 'space' {
    const plan = new SurvivalBag(this.rows, this.columns, this.timed);
    plan.items = this.items.map(item => ({ ...item }));
    plan.quick = this.quick.slice();
    if (!plan.pay(SURVIVAL_RECIPES[kind])) return 'materials';
    if (plan.give({ kind, count: 1 }) !== 1) return 'space';
    if (!preview) { this.items = plan.items; this.quick = plan.quick; }
    return 'ok';
  }
  canPay(cost: MaterialCost) { return cost.every(([kind, count]) => this.count(kind) >= count); }
  pay(cost: MaterialCost) {
    if (!this.canPay(cost)) return false;
    for (const [material, count] of cost) {
      let left = count;
      for (const item of this.items.filter(item => item.kind === material)) {
        const used = Math.min(item.count, left);
        this.take(item.id, used);
        left -= used;
        if (left === 0) break;
      }
    }
    return true;
  }
}

export function survivalRandom(seed: number) {
  let state = seed >>> 0;
  return (length: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return Math.floor(state / 4294967296 * length);
  };
}

export function readSurvivalGear(raw: unknown, hero: HeroId, timed = false): SurvivalGearSave | undefined {
  if (!raw || typeof raw !== 'object') return;
  const g = { ...raw } as SurvivalGearSave;
  if (!timed) g.restock = undefined;
  const bag = new SurvivalBag(survivalBagRows(hero), survivalBagCols(hero), timed);
  const legacy = g.bagLayout === undefined;
  const int = (n: number, limit: number) => Number.isInteger(n) && n >= 0 && n <= limit;
  const finite = (n: number, limit: number) => Number.isFinite(n) && n >= 0 && n <= limit;
  const point = (p: Point) => !!p && finite(p.x, 30000) && finite(p.y, 6200);
  const stack = (s: GearStack) => !!s && Object.prototype.hasOwnProperty.call(SURVIVAL_GEAR, s.kind) &&
    int(s.count, SURVIVAL_GEAR[s.kind][3]) && s.count > 0 && (!isSurvivalGun(s.kind) || SURVIVAL_GUNS[s.kind].hero === hero) &&
    (s.rounds === undefined || isSurvivalGun(s.kind) && int(s.rounds, SURVIVAL_GUNS[s.kind].magazine));
  if ((!legacy && g.bagLayout !== 2) || !Array.isArray(g.items) || g.items.length > bag.rows * bag.columns) return;
  for (const i of g.items) {
    if (!stack(i) || !int(i.id, 1e6) || !i.id || bag.item(i.id) || !int(i.col, bag.columns - 1) || !int(i.row, bag.rows - 1) ||
        typeof i.rotated !== 'boolean' || !legacy && !bag.fits(i.kind, i.col, i.row, i.rotated)) return;
    bag.items.push(i);
  }
  if (!Array.isArray(g.quick) || g.quick.length !== 3 || !g.quick.every(id => id === null || !!bag.item(id)) ||
      !Array.isArray(g.crates) || !g.crates.every(c => point(c) && typeof c.id === 'string' && c.id.length < 80 &&
        ['medical', 'armory', 'engineering', 'airdrop', 'dropped'].includes(c.kind) && typeof c.opened === 'boolean' &&
        Array.isArray(c.goods) && c.goods.length <= 6 && c.goods.every(stack)) ||
      !Array.isArray(g.mines) || !g.mines.every(m => point(m) && (m.fuse === undefined || finite(m.fuse, 1)) &&
        (m.kind === undefined || m.kind === 'proximity-mine' || m.kind === 'shock-mine')) ||
      !Array.isArray(g.sentries) || !g.sentries.every(s => point(s) && Number.isFinite(s.angle) && finite(s.hp, SENTRY_HP)) ||
      typeof g.selected !== 'boolean' || !int(g.baseAmmo, 1000) || !int(g.baseReserve, 100000) ||
      !finite(g.scan, 10)) return;
  if (g.field !== undefined && (!Array.isArray(g.field) || g.field.length > 128 ||
      !g.field.every(item => point(item) && stack(item) && typeof item.id === 'string' && int(item.zone, 6)))) return;
  if (g.restock && (!int(g.restock.cycle, 40) || !Array.isArray(g.restock.zones) || g.restock.zones.length > 3 ||
      !g.restock.zones.every(zone => int(zone, 6)) || !Array.isArray(g.restock.pending) || g.restock.pending.length > 8 ||
      !g.restock.pending.every(item => item && int(item.zone, 6) && int(item.slot, 6)))) return;
  if (g.special && (!survivalWeapons(hero).includes(g.special.id) || !int(g.special.ammo, SURVIVAL_GUNS[g.special.id].magazine) ||
      !int(g.special.reserve, 10000))) return;
  return g.selected && !g.special ? undefined : g;
}
