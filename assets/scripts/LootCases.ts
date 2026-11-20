import { CONSUMABLES, createMod, MAX_STOCK, type Armory, type ConsumableId } from './Shop';
import { MAX_WEAPON_PARTS, MOD_IDS, MOD_STORAGE_CAP, MODS, readAttachment, type Attachment, type ModId, type Quality } from './WeaponMods';

export const STARTER_KEYS = 3, DAILY_CASE_KEYS = 1, CLEAR_CASE_KEYS = 2;
const MAX_KEYS = 9999;
const MAX_FUNDS = 1000000;
const POOL_WEIGHT = 10000;
export const CASES = {
  tactical: { name: '战术配件箱', lines: ['可开出四种品质的武器配件', '以及用于升级的改装零件。'] },
  basic: { name: '基础补给箱', lines: ['可开出金币、培养材料、战斗', '道具和普通品质武器配件。'] },
} as const;
export type CaseId = keyof typeof CASES;
export const CASE_IDS = Object.keys(CASES) as CaseId[];
export type DrawCount = 1 | 10;
export type CasePrize = { id: string; title: string; weight: number } & (
  { type: 'mod'; item: ModId; quality: Quality } |
  { type: 'item'; item: ConsumableId; amount: number } |
  { type: 'coins' | 'materials' | 'parts'; amount: number }
);
export type CaseReward = { id: string; mod?: Attachment };
export type CaseOpening = { caseId: CaseId; rewards: CaseReward[] };
export type CaseState = { keys: number; pending?: CaseOpening };
type CaseWallet = { cases: CaseState; armory: Armory; coins: number; materials: number };

const accessory = (item: ModId, quality: Quality, weight: number): CasePrize =>
  ({ id: `${item}-${quality}`, title: MODS[item].title, type: 'mod', item, quality, weight });
const item = (id: ConsumableId, amount: number, weight: number): CasePrize =>
  ({ id, title: CONSUMABLES[id].title, type: 'item', item: id, amount, weight });
export const CASE_POOLS: Record<CaseId, readonly CasePrize[]> = {
  tactical: [
    ...([0, 1, 2, 3] as const).flatMap(quality => MOD_IDS.map(id => accessory(id, quality, [270, 170, 85, 25][quality]))),
    { id: 'parts', title: '改装零件', type: 'parts', amount: 5, weight: 1200 },
  ],
  basic: [
    { id: 'coins', title: '金币', type: 'coins', amount: 45, weight: 3300 },
    { id: 'materials', title: '培养材料', type: 'materials', amount: 25, weight: 1900 },
    { id: 'parts', title: '改装零件', type: 'parts', amount: 3, weight: 1200 },
    item('bandage', 2, 700), item('medkit', 1, 500), item('drink', 1, 400), item('grenade', 1, 500),
    item('flashbang', 1, 400), item('shock-mine', 1, 150), item('claymore', 1, 100), item('adrenaline', 1, 50),
    ...MOD_IDS.map(id => accessory(id, 0, 50)),
  ],
};
export function casePrize(caseId: CaseId, id: string) {
  return CASE_POOLS[caseId].find(prize => prize.id === id);
}
export function readCaseState(raw?: Partial<CaseState> | null): CaseState {
  const keys = Number.isSafeInteger(raw?.keys) ? Math.max(0, Math.min(raw!.keys!, MAX_KEYS)) : STARTER_KEYS;
  const pending = raw?.pending;
  if (!pending || !CASE_IDS.includes(pending.caseId) || !Array.isArray(pending.rewards) || ![1, 10].includes(pending.rewards.length)) return { keys };
  const rewards: CaseReward[] = [];
  for (const entry of pending.rewards) {
    const prize = casePrize(pending.caseId, entry?.id);
    if (!prize) return { keys };
    if (prize.type !== 'mod') { rewards.push({ id: prize.id }); continue; }
    const mod = readAttachment(entry.mod ?? null);
    if (!mod || mod.kind !== prize.item || mod.quality !== prize.quality || mod.level !== 1) return { keys };
    rewards.push({ id: prize.id, mod });
  }
  return { keys, pending: { caseId: pending.caseId, rewards } };
}
export function addCaseKeys(state: CaseState, amount: number) {
  const earned = Math.min(amount, MAX_KEYS - state.keys);
  state.keys += earned;
  return earned;
}
export function sampleCasePrize(id: CaseId, random: () => number = Math.random) {
  let weight = Math.floor(random() * POOL_WEIGHT);
  const pool = CASE_POOLS[id];
  for (const prize of pool) {
    weight -= prize.weight;
    if (weight < 0) return prize;
  }
  return pool[pool.length - 1];
}

type CaseFailure = 'pending' | 'keys' | 'mods' | 'stock';
export function prepareCaseOpening<T extends CaseWallet>(wallet: T, id: CaseId, count: DrawCount, random: () => number = Math.random):
  { profile: T; opening: CaseOpening } | { reason: CaseFailure } {
  const { armory, cases } = wallet;
  if (cases.pending) return { reason: 'pending' };
  if (cases.keys < count) return { reason: 'keys' };
  if (armory.mods.length + count > MOD_STORAGE_CAP || armory.nextSerial > Number.MAX_SAFE_INTEGER - count) return { reason: 'mods' };
  for (const prize of CASE_POOLS[id]) {
    if (prize.type === 'mod') continue;
    const amount = count * prize.amount;
    if (prize.type === 'item' ? (armory.counts[prize.item] ?? 0) + amount > MAX_STOCK :
      prize.type === 'parts' ? armory.parts + amount > MAX_WEAPON_PARTS : wallet[prize.type] + amount > MAX_FUNDS) return { reason: 'stock' };
  }
  const nextArmory: Armory = { ...armory, counts: { ...armory.counts }, mods: [...armory.mods] };
  const opening: CaseOpening = { caseId: id, rewards: [] };
  const profile: T = { ...wallet, armory: nextArmory, cases: { keys: cases.keys - count, pending: opening } };
  for (let i = 0; i < count; i++) {
    const prize = sampleCasePrize(id, random);
    const reward: CaseReward = { id: prize.id };
    if (prize.type === 'mod') reward.mod = createMod(nextArmory, prize.item, prize.quality, Math.floor(random() * 1000));
    else if (prize.type === 'item') nextArmory.counts[prize.item] = (nextArmory.counts[prize.item] ?? 0) + prize.amount;
    else if (prize.type === 'parts') nextArmory.parts += prize.amount;
    else profile[prize.type] += prize.amount;
    opening.rewards.push(reward);
  }
  return { profile, opening };
}

const ACCEL = 0.72, CRUISE = 1.16, DECEL = 2.25;
export const CASE_ROLL_TIME = ACCEL + CRUISE + DECEL;
export function caseRollProgress(seconds: number, entryRate = 0) {
  if (seconds <= 0) return 0;
  if (seconds >= CASE_ROLL_TIME) return 1;
  // Integrate eased velocity, keeping the idle velocity at the moment opening starts.
  const peak = (1 - entryRate * ACCEL / 2) / (ACCEL / 2 + CRUISE + DECEL / 2);
  const integral = (t: number) => t ** 3 * (1 - t / 2);
  if (seconds < ACCEL) return entryRate * seconds + (peak - entryRate) * ACCEL * integral(seconds / ACCEL);
  const brake = seconds - ACCEL - CRUISE;
  if (brake <= 0) return (peak + entryRate) * ACCEL / 2 + peak * (seconds - ACCEL);
  return 1 - peak * DECEL * integral((DECEL - brake) / DECEL);
}
