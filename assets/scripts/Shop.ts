import { HERO_IDS, type HeroId } from './Heroes';
import type { TacticalKind } from './Tactical';
import { fitsWeapon, MAX_WEAPON_PARTS, MOD_IDS, MOD_STORAGE_CAP, MODS, modUpgradeCost, readAttachment, salvageValue, SLOT_NAMES, WEAPON_SLOTS, weaponLevel, weaponUpgradeCost, type Attachment, type ModId, type Quality, type WeaponBuild, type WeaponSlot } from './WeaponMods';

export const GEAR = {
  vest: { title: '战术防弹背心', category: '防弹衣', price: 300, description: '装备后受到的生命伤害降低 20%。', protection: 0.2 },
  helmet: { title: '防弹战术头盔', category: '头盔', price: 210, description: '装备后受到的生命伤害降低 8%，可与防弹背心叠加。', protection: 0.08 },
  pack: { title: '战术背包', category: '背包', price: 240, description: '每种医疗和增益补给的战斗携带上限从 5 提高到 8。', protection: 0 },
} as const;
export type GearId = keyof typeof GEAR;
export const CONSUMABLES = {
  grenade: { title: '手雷', category: '投掷物', price: 45, description: '投掷后爆炸，造成范围伤害。' },
  flashbang: { title: '震撼弹', category: '投掷物', price: 33, description: '投掷后短暂击晕范围内的敌人。' },
  'shock-mine': { title: '麻痹地雷', category: '陷阱', price: 55, description: '布置在前方，敌人接近时触发并麻痹周围目标。' },
  claymore: { title: '阔剑地雷', category: '陷阱', price: 62, description: '布置在前方，正面敌人接近时触发扇形爆炸。' },
  adrenaline: { title: '强心剂', category: '医疗', price: 85, description: '倒地时提供一次额外的复苏机会。' },
  medkit: { title: '医疗包', category: '医疗', price: 50, description: '使用完成后恢复 60% 最大生命。' },
  bandage: { title: '绷带', category: '医疗', price: 23, description: '使用完成后在 5 秒内恢复 25% 最大生命。' },
  drink: { title: '能量饮料', category: '增益', price: 30, description: '恢复 10% 最大生命，移动速度提高 20%，持续 10 秒。' },
} as const;
export type ConsumableId = keyof typeof CONSUMABLES;
type ShopTactical = Extract<ConsumableId, TacticalKind>;
export const SHOP_TACTICALS: readonly ShopTactical[] = ['grenade', 'flashbang', 'shock-mine', 'claymore'];
export type ProductId = ModId | GearId | ConsumableId | 'parts';
export type ShopCategory = 'mod' | 'gear' | 'item';
export type OperatorKit = WeaponBuild & { gear: GearId[] };
export type Armory = {
  gear: GearId[]; counts: Partial<Record<ConsumableId, number>>; kits: Record<HeroId, OperatorKit>;
  tactical: ShopTactical | null; parts: number; mods: Attachment[]; nextSerial: number;
};
type Wallet = { coins: number; owned: Record<HeroId, boolean>; armory: Armory };
export type Product = { id: ProductId; group: ShopCategory; title: string; category: string; price: number; description: string };
export const GEAR_IDS = Object.keys(GEAR) as GearId[];
const ITEM_IDS = Object.keys(CONSUMABLES) as ConsumableId[];
export const PRODUCTS: readonly Product[] = [
  ...MOD_IDS.map(id => ({
    id, group: 'mod' as const, title: MODS[id].title, category: SLOT_NAMES[MODS[id].slot],
    price: 45, description: '购买后随机生成一件所选品质的配件。',
  })),
  { id: 'parts', group: 'mod', title: '改装零件 ×5', category: '材料', price: 60, description: '用于升级固定武器和配件。' },
  ...GEAR_IDS.map(id => ({ id, group: 'gear' as const, ...GEAR[id] })),
  ...ITEM_IDS.map(id => ({ id, group: 'item' as const, ...CONSUMABLES[id] })),
];
export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map(product => [product.id, product])) as Record<ProductId, Product>;
export const MAX_STOCK = 99;

export function readArmory(raw?: Partial<Armory>): Armory {
  const gear = GEAR_IDS.filter(id => Array.isArray(raw?.gear) && raw.gear.includes(id));
  const counts: Armory['counts'] = {};
  for (const id of ITEM_IDS) {
    const count = raw?.counts?.[id];
    if (Number.isSafeInteger(count) && count! > 0) counts[id] = Math.min(count!, MAX_STOCK);
  }
  const mods: Attachment[] = [], known = new Set<number>();
  if (Array.isArray(raw?.mods)) for (const entry of raw.mods.slice(0, MOD_STORAGE_CAP)) {
    const mod = readAttachment(entry);
    if (mod && !known.has(mod.serial)) { mods.push(mod); known.add(mod.serial); }
  }
  const nextSerial = Math.max(Number.isSafeInteger(raw?.nextSerial) ? raw!.nextSerial! : 1, Math.max(0, ...mods.map(mod => mod.serial)) + 1);
  const assigned = new Set<number>(), kits = {} as Armory['kits'];
  for (const id of HERO_IDS) {
    const kit = raw?.kits?.[id], slots: OperatorKit['slots'] = {};
    for (const slot of WEAPON_SLOTS[id]) {
      const mod = mods.find(entry => entry.serial === kit?.slots?.[slot]);
      if (mod && !assigned.has(mod.serial) && MODS[mod.kind].slot === slot && fitsWeapon(id, mod.kind)) {
        slots[slot] = mod.serial; assigned.add(mod.serial);
      }
    }
    kits[id] = { weaponLevel: weaponLevel(kit?.weaponLevel), slots,
      gear: gear.filter(piece => Array.isArray(kit?.gear) && kit.gear.includes(piece)) };
  }
  const tactical = raw?.tactical && SHOP_TACTICALS.includes(raw.tactical) ? raw.tactical : null;
  const parts = Number.isSafeInteger(raw?.parts) ? Math.max(0, Math.min(MAX_WEAPON_PARTS, raw!.parts!)) : 0;
  return { gear, counts, kits, tactical, parts, mods, nextSerial };
}
export function ownedProduct(armory: Armory, product: Product) {
  if (product.id === 'parts') return armory.parts;
  if (product.group === 'mod') return armory.mods.filter(mod => mod.kind === product.id).length;
  if (product.group === 'gear') return Number(armory.gear.includes(product.id as GearId));
  return armory.counts[product.id as ConsumableId] ?? 0;
}
export const productPrice = (product: Product, quality: Quality) =>
  product.group === 'mod' && product.id !== 'parts' ? product.price + 38 * quality + 14 * quality * quality : product.price;
export function canStock(armory: Armory, product: Product) {
  if (product.id === 'parts') return armory.parts <= MAX_WEAPON_PARTS - 5;
  if (product.group === 'mod') return armory.mods.length < MOD_STORAGE_CAP;
  return ownedProduct(armory, product) < (product.group === 'item' ? MAX_STOCK : 1);
}
export function grantRandomMod(armory: Armory, heroId: HeroId, victory: boolean) {
  const possible = MOD_IDS.filter(kind => fitsWeapon(heroId, kind));
  const sample = Math.random();
  const quality = victory ? sample > 0.96 ? 3 : sample > 0.8 ? 2 : sample > 0.45 ? 1 : 0 : sample > 0.83 ? 1 : 0;
  if (armory.mods.length >= MOD_STORAGE_CAP || armory.nextSerial >= Number.MAX_SAFE_INTEGER) return;
  return createMod(armory, possible[Math.floor(Math.random() * possible.length)], quality);
}
export function createMod(armory: Armory, kind: ModId, quality: Quality, roll = Math.floor(Math.random() * 1000)) {
  const mod: Attachment = { serial: armory.nextSerial++, kind, quality, roll, level: 1 };
  armory.mods.push(mod);
  return mod;
}
export function buyProduct(wallet: Wallet, productId: ProductId, quality: Quality = 0) {
  const product = PRODUCT_BY_ID[productId];
  if (!product || !canStock(wallet.armory, product)) return false;
  const price = productPrice(product, quality);
  if (wallet.coins < price) return false;
  const armory = wallet.armory;
  if (product.id === 'parts') armory.parts += 5;
  else if (product.group === 'mod') {
    if (armory.nextSerial >= Number.MAX_SAFE_INTEGER) return false;
    createMod(armory, product.id as ModId, quality);
  } else if (product.group === 'gear') armory.gear.push(product.id as GearId);
  else armory.counts[product.id as ConsumableId] = ownedProduct(armory, product) + 1;
  wallet.coins -= price;
  return true;
}
export function modOwner(armory: Armory, serial: number) {
  return HERO_IDS.find(id => Object.values(armory.kits[id].slots).includes(serial));
}
export function workshopMods(armory: Armory, id: HeroId, slot: WeaponSlot) {
  const installed = armory.kits[id].slots[slot];
  return armory.mods.filter(mod => MODS[mod.kind].slot === slot && fitsWeapon(id, mod.kind) &&
    (mod.serial === installed || modOwner(armory, mod.serial) === undefined));
}
export function installMod(wallet: Wallet, id: HeroId, slot: WeaponSlot, serial?: number) {
  if (!wallet.owned[id] || !WEAPON_SLOTS[id].includes(slot)) return false;
  const slots = wallet.armory.kits[id].slots;
  if (serial === undefined) { delete slots[slot]; return true; }
  const mod = wallet.armory.mods.find(item => item.serial === serial);
  if (!mod || MODS[mod.kind].slot !== slot || !fitsWeapon(id, mod.kind) || modOwner(wallet.armory, serial) !== undefined) return false;
  slots[slot] = serial;
  return true;
}
function pay(wallet: Wallet, cost: { coins: number; parts: number } | undefined) {
  if (!cost || wallet.coins < cost.coins || wallet.armory.parts < cost.parts) return false;
  wallet.coins -= cost.coins; wallet.armory.parts -= cost.parts;
  return true;
}
export function upgradeWeapon(wallet: Wallet, id: HeroId) {
  const kit = wallet.armory.kits[id];
  if (!wallet.owned[id] || !pay(wallet, weaponUpgradeCost(kit.weaponLevel))) return false;
  kit.weaponLevel++;
  return true;
}
export function upgradeMod(wallet: Wallet, serial: number) {
  const mod = wallet.armory.mods.find(item => item.serial === serial);
  if (!mod || !pay(wallet, modUpgradeCost(mod))) return false;
  mod.level++;
  return true;
}
export function salvageMod(armory: Armory, serial: number) {
  const index = armory.mods.findIndex(item => item.serial === serial);
  if (index < 0 || modOwner(armory, serial) !== undefined) return false;
  const parts = salvageValue(armory.mods[index]);
  if (armory.parts > MAX_WEAPON_PARTS - parts) return false;
  armory.parts += parts; armory.mods.splice(index, 1);
  return true;
}
export function toggleGear(wallet: Wallet, id: HeroId, gear: GearId) {
  if (!wallet.owned[id] || !wallet.armory.gear.includes(gear)) return false;
  const kit = wallet.armory.kits[id];
  kit.gear = kit.gear.includes(gear) ? kit.gear.filter(piece => piece !== gear) : [...kit.gear, gear];
  return true;
}
