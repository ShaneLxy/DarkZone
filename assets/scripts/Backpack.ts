import type { Profile } from './Core';
import { HERO_IDS, heroes } from './Heroes';
import { CONSUMABLES, GEAR, modOwner, normalizeSortie, type ConsumableId, type GearId } from './Shop';
import { fitsWeapon, MODS, modDescription, QUALITY_NAMES, SLOT_NAMES, type Attachment } from './WeaponMods';

export const BACKPACK_FILTERS = {
  all: '全部', consumable: '消耗品', attachment: '武器配件', equipment: '装备', material: '材料',
} as const;
export type BackpackFilter = keyof typeof BACKPACK_FILTERS;
type ResourceId = 'coins' | 'materials' | 'tickets' | 'parts' | 'keys';
export type BackpackItem =
  | { key: string; type: 'consumable'; id: ConsumableId; name: string; amount: number }
  | { key: string; type: 'attachment'; mod: Attachment; name: string }
  | { key: string; type: 'equipment'; id: GearId; name: string }
  | { key: string; type: 'material'; id: ResourceId; name: string; amount: number };

const RESOURCES = {
  coins: { name: '金币', description: '在商城购买配件、装备和道具，也可用于武器改装。', source: '在行动中收集，或通过签到、补给开箱获得。' },
  materials: { name: '培养材料', description: '在角色页面提升角色等级及属性。', source: '通过行动结算、每日任务、签到和补给开箱获得。' },
  parts: { name: '改装零件', description: '在武器改装中升级固定武器和配件。', source: '通过商城、探索、补给开箱或分解配件获得。' },
  tickets: { name: '招募券', description: '在招募界面招募特勤。', source: '通过行动结算、每日任务活跃奖励和签到获得。' },
  keys: { name: '开箱钥匙', description: '在商城的补给开箱中使用，每开一次消耗一把。', source: '通关探索关卡或领取已完成的每日任务获得。' },
} as const;

export function backpackItems(profile: Profile): BackpackItem[] {
  const { armory } = profile;
  const items: BackpackItem[] = [];
  for (const id of Object.keys(CONSUMABLES) as ConsumableId[]) {
    const amount = armory.counts[id] ?? 0;
    if (amount > 0) items.push({ key: id, type: 'consumable', id, name: CONSUMABLES[id].title, amount });
  }
  for (const mod of armory.mods) items.push({ key: `mod-${mod.serial}`, type: 'attachment', mod, name: MODS[mod.kind].title });
  for (const id of armory.gear) items.push({ key: id, type: 'equipment', id, name: GEAR[id].title });
  const amounts = { coins: profile.coins, materials: profile.materials, tickets: profile.tickets, parts: armory.parts, keys: profile.cases.keys };
  for (const id of Object.keys(RESOURCES) as ResourceId[]) {
    if (amounts[id] > 0) items.push({ key: id, type: 'material', id, name: RESOURCES[id].name, amount: amounts[id] });
  }
  return items;
}

export function backpackDetails(profile: Profile, item: BackpackItem) {
  const { armory } = profile;
  if (item.type === 'attachment') {
    const { mod } = item, owner = modOwner(armory, mod.serial);
    const fits = HERO_IDS.filter(id => fitsWeapon(id, mod.kind));
    const hero = owner ?? fits.find(id => profile.owned[id]) ?? fits[0];
    const characters = fits.map(id => heroes[id].name + (profile.owned[id] ? '' : '（未解锁）')).join('、');
    return {
      meta: `${QUALITY_NAMES[mod.quality]} · Lv.${mod.level} · ${SLOT_NAMES[MODS[mod.kind].slot]}`,
      description: modDescription(mod).replace(' · ', '\n'),
      notes: [`适用角色  ${characters}`, owner === undefined ? '当前未安装' : `已安装于 ${heroes[owner].name}`],
      hero,
      action: 'workshop' as const,
    };
  }
  if (item.type === 'equipment') {
    const equipped = HERO_IDS.filter(id => armory.kits[id].gear.includes(item.id));
    return {
      meta: `类型  ${GEAR[item.id].category}`,
      description: GEAR[item.id].description,
      notes: [equipped.length ? '已装备于 ' + equipped.map(id => heroes[id].name).join('、') : '当前未装备'],
      hero: equipped.find(id => profile.owned[id]) ?? HERO_IDS.find(id => profile.owned[id]) ?? HERO_IDS[0],
      action: 'equipment' as const,
    };
  }
  if (item.type === 'consumable') {
    const info = CONSUMABLES[item.id];
    const selected = Object.values(normalizeSortie(armory.sortie, armory.counts)).find(entry => entry.id === item.id);
    const carry = item.id === 'adrenaline' ? '探索倒地时可使用' : selected ? `探索出战已选 ×${selected.count}` : '可在探索模式的出战页面选带';
    return { meta: `类型  ${info.category}`, description: info.description, notes: [carry],
      action: item.id === 'adrenaline' ? undefined : 'carry' as const };
  }
  const resource = RESOURCES[item.id];
  return { meta: '类型  资源', description: resource.description, notes: [resource.source], action: undefined };
}
