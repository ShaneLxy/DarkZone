import type { Profile } from './Core';
import { CLUE_SPECS } from './ClueReader';
import { ENGINEER_ID, HERO_IDS } from './Heroes';
import { addCaseKeys } from './LootCases';

export const ACHIEVEMENT_CATEGORIES = {
  all: '全部成就', combat: '战斗成就', chapter: '关卡成就', equipment: '装备成就', growth: '成长成就', collection: '收集成就',
} as const;
export type AchievementCategory = keyof typeof ACHIEVEMENT_CATEGORIES;
type Category = Exclude<AchievementCategory, 'all'>;
type Reward = { kind: 'coins' | 'materials' | 'keys'; amount: number };
export type Achievement = {
  id: string; category: Category; name: string; description: string; target: number; points: number; reward: Reward;
  progress: (profile: Profile) => number; clue?: boolean;
};
const coins = (amount: number): Reward => ({ kind: 'coins', amount });
const materials = (amount: number): Reward => ({ kind: 'materials', amount });
const keys = (amount: number): Reward => ({ kind: 'keys', amount });
export const ACHIEVEMENT_REWARDS = { coins: '金币', materials: '培养材料', keys: '开箱钥匙' } as const;
const achievement = (id: string, category: Category, name: string, description: string, target: number, points: number,
  reward: Reward, progress: Achievement['progress']): Achievement => ({ id, category, name, description, target, points, reward, progress });

export const ACHIEVEMENTS: readonly Achievement[] = [
  achievement('clear-dorm', 'chapter', '走出宿舍', '通关探索第一章「静默宿舍」', 1, 40, keys(1), p => Number(p.streetUnlocked)),
  achievement('clear-street', 'chapter', '穿越街区', '通关探索第二章「归途」', 1, 55, keys(1), p => Number(p.apartmentUnlocked)),
  achievement('clear-apartment', 'chapter', '重返归途', '通关探索第三章「归巢」', 1, 70, keys(2), p => Number(p.owned[ENGINEER_ID])),
  achievement('kills-10', 'combat', '初试锋芒', '在已结算的行动中累计击败 10 只感染体', 10, 30, coins(60), p => p.achievementProgress.kills),
  achievement('kills-50', 'combat', '清剿行动', '在已结算的行动中累计击败 50 只感染体', 50, 45, coins(120), p => p.achievementProgress.kills),
  achievement('kills-150', 'combat', '尸潮克星', '在已结算的行动中累计击败 150 只感染体', 150, 60, keys(2), p => p.achievementProgress.kills),
  achievement('protective-gear', 'equipment', '有备而来', '持有 1 件防具或战术背包', 1, 25, materials(25), p => p.armory.gear.length),
  achievement('three-mods', 'equipment', '改装准备', '同时持有 3 件武器配件', 3, 35, coins(80), p => p.armory.mods.length),
  achievement('twelve-mods', 'equipment', '配件收藏家', '同时持有 12 件武器配件', 12, 55, keys(2), p => p.armory.mods.length),
  achievement('level-3', 'growth', '初见成长', '任一角色达到 3 级', 3, 25, materials(30), p => Math.max(...HERO_IDS.map(id => p.levels[id]))),
  achievement('level-5', 'growth', '训练有素', '任一角色达到 5 级', 5, 40, materials(55), p => Math.max(...HERO_IDS.map(id => p.levels[id]))),
  achievement('operators-3', 'growth', '幸存者集结', '解锁 3 名角色', 3, 45, keys(1), p => HERO_IDS.filter(id => p.owned[id]).length),
  ...CLUE_SPECS.map(clue => ({
    ...achievement(clue.id, 'collection', clue.title,
      clue.kind === 'computer' ? '调查宿舍楼一层的终端' : '调查宿舍楼二层的纸质线索', 1, 20, materials(15),
      p => Number(p.clues.includes(clue.id) || p.achievements.includes(clue.achievement))),
    clue: true,
  })),
];

export const ACHIEVEMENT_LEVELS = [
  { level: 2, points: 90, rewards: [coins(90), materials(30)] },
  { level: 3, points: 210, rewards: [keys(2), materials(55)] },
  { level: 4, points: 370, rewards: [keys(3), coins(200)] },
  { level: 5, points: 540, rewards: [keys(4), materials(100), coins(300)] },
] as const;
const MAX_KILLS = 1000000;
export type AchievementProgress = { kills: number; claimed: string[]; levels: number[] };
export function readAchievementProgress(raw: unknown): AchievementProgress {
  const saved = raw && typeof raw === 'object' ? raw as Partial<AchievementProgress> : {};
  const kills = Number.isSafeInteger(saved.kills) ? Math.max(0, Math.min(MAX_KILLS, saved.kills!)) : 0;
  return {
    kills,
    claimed: ACHIEVEMENTS.filter(a => Array.isArray(saved.claimed) && saved.claimed.includes(a.id)).map(a => a.id),
    levels: ACHIEVEMENT_LEVELS.filter(a => Array.isArray(saved.levels) && saved.levels.includes(a.level)).map(a => a.level),
  };
}
export function achievementState(profile: Profile, entry: Achievement) {
  const claimed = profile.achievementProgress.claimed.includes(entry.id);
  const progress = claimed ? entry.target : Math.min(entry.target, entry.progress(profile));
  return { claimed, progress, complete: progress >= entry.target };
}
export function achievementScore(profile: Profile) {
  const points = ACHIEVEMENTS.reduce((sum, entry) => sum + (profile.achievementProgress.claimed.includes(entry.id) ? entry.points : 0), 0);
  const reached = ACHIEVEMENT_LEVELS.filter(level => points >= level.points);
  return { points, level: reached.length + 1, next: ACHIEVEMENT_LEVELS[reached.length],
    rewardLevel: reached.find(level => !profile.achievementProgress.levels.includes(level.level)) ?? ACHIEVEMENT_LEVELS[reached.length] };
}
function grant(profile: Profile, rewards: readonly Reward[]) {
  const next = { ...profile, cases: { ...profile.cases } };
  for (const reward of rewards) {
    if (reward.kind === 'keys') addCaseKeys(next.cases, reward.amount);
    else next[reward.kind] += reward.amount;
  }
  return next;
}
export function claimAchievement(profile: Profile, id: string) {
  const entry = ACHIEVEMENTS.find(item => item.id === id);
  if (!entry) return;
  const state = achievementState(profile, entry);
  if (!state.complete || state.claimed) return;
  const next = grant(profile, [entry.reward]);
  next.achievementProgress = { ...profile.achievementProgress, claimed: [...profile.achievementProgress.claimed, id] };
  return next;
}
export function claimAchievementLevel(profile: Profile, level: number) {
  const entry = ACHIEVEMENT_LEVELS.find(item => item.level === level);
  if (!entry || achievementScore(profile).points < entry.points || profile.achievementProgress.levels.includes(level)) return;
  const next = grant(profile, entry.rewards);
  next.achievementProgress = { ...profile.achievementProgress, levels: [...profile.achievementProgress.levels, level] };
  return next;
}
export function recordAchievementKills(profile: Profile, kills: number) {
  profile.achievementProgress.kills = Math.min(MAX_KILLS, profile.achievementProgress.kills + kills);
}
