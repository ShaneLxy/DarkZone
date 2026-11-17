import { addCaseKeys, DAILY_CASE_KEYS, type CaseState } from './LootCases';

export const DAILY_MISSIONS = [
  { id: 'rooms', title: '勘察宿舍', description: '累计进入 2 个走廊以外的区域', icon: 'compass', goal: 2, activity: 20, materials: 20 },
  { id: 'kills', title: '击退威胁', description: '在探索中累计击败 6 个敌人', icon: 'skull', goal: 6, activity: 20, materials: 25 },
  { id: 'clears', title: '清理区域', description: '在探索中累计清理 2 个区域', icon: 'ammo', goal: 2, activity: 30, materials: 30 },
  { id: 'extracts', title: '安全撤离', description: '从静默宿舍的一楼大门撤离 1 次', icon: 'compass', goal: 1, activity: 30, materials: 40 },
] as const;

export const DAILY_MILESTONES = [
  { points: 20, materials: 15, tickets: 0 },
  { points: 40, materials: 0, tickets: 1 },
  { points: 70, materials: 30, tickets: 0 },
  { points: 100, materials: 0, tickets: 1 },
] as const;

type MissionId = typeof DAILY_MISSIONS[number]['id'];
type Progress = Record<MissionId, number>;
export type DailyState = { day: string; progress: Progress; claimed: MissionId[]; milestones: number[] };
type MissionWallet = { daily: DailyState; materials: number; tickets: number; cases?: CaseState };

export function dailyKey(now: Date) {
  const date = new Date(now);
  if (date.getHours() < 5) date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function readDailyMissions(raw?: unknown, now = new Date()): DailyState {
  const state: DailyState = { day: dailyKey(now), progress: { rooms: 0, kills: 0, clears: 0, extracts: 0 }, claimed: [], milestones: [] };
  if (!raw || typeof raw !== 'object') return state;
  const saved = raw as Partial<DailyState>;
  if (saved.day !== state.day) return state;
  for (const task of DAILY_MISSIONS) {
    const count = saved.progress?.[task.id];
    if (typeof count === 'number' && Number.isSafeInteger(count) && count >= 0) state.progress[task.id] = Math.min(count, task.goal);
    if (state.progress[task.id] >= task.goal && Array.isArray(saved.claimed) && saved.claimed.includes(task.id)) state.claimed.push(task.id);
  }
  const activity = dailyActivity(state);
  if (Array.isArray(saved.milestones)) {
    const claimed = saved.milestones;
    state.milestones = DAILY_MILESTONES.filter(reward => activity >= reward.points && claimed.includes(reward.points)).map(reward => reward.points);
  }
  return state;
}

export function refreshDailyMissions(profile: MissionWallet, now = new Date()) {
  if (profile.daily.day === dailyKey(now)) return false;
  profile.daily = readDailyMissions(undefined, now);
  return true;
}

export function recordExploration(profile: MissionWallet, progress: Progress, now = new Date()) {
  refreshDailyMissions(profile, now);
  for (const task of DAILY_MISSIONS) {
    profile.daily.progress[task.id] = Math.min(task.goal, profile.daily.progress[task.id] + progress[task.id]);
  }
}

export function dailyActivity(state: DailyState) {
  return DAILY_MISSIONS.reduce((total, task) => total + (state.claimed.includes(task.id) ? task.activity : 0), 0);
}

export function claimDailyMission(profile: MissionWallet, id: MissionId, now = new Date()) {
  refreshDailyMissions(profile, now);
  const task = DAILY_MISSIONS.find(task => task.id === id);
  if (!task || profile.daily.progress[id] < task.goal || profile.daily.claimed.includes(id)) return false;
  profile.daily.claimed.push(id);
  profile.materials += task.materials;
  if (profile.cases) addCaseKeys(profile.cases, DAILY_CASE_KEYS);
  return true;
}

export function claimDailyMilestone(profile: MissionWallet, points: number, now = new Date()) {
  refreshDailyMissions(profile, now);
  const reward = DAILY_MILESTONES.find(reward => reward.points === points);
  if (!reward || dailyActivity(profile.daily) < points || profile.daily.milestones.includes(points)) return false;
  profile.daily.milestones.push(points);
  profile.materials += reward.materials;
  profile.tickets += reward.tickets;
  return true;
}
