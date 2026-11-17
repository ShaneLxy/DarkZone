import { dailyKey } from './DailyMissions';

export const CHECK_IN_REWARD_NAMES = { coins: '金币', materials: '培养材料', tickets: '招募券' } as const;
type RewardKind = keyof typeof CHECK_IN_REWARD_NAMES;
type Reward = Partial<Record<RewardKind, number>>;

export const CHECK_IN_DAYS: readonly Reward[] = [
  { coins: 60 }, { materials: 30 }, { coins: 80 }, { materials: 35 }, { coins: 100 }, { materials: 40 }, { tickets: 1 },
  { coins: 120 }, { materials: 45 }, { coins: 140 }, { materials: 50 }, { coins: 160 }, { materials: 60 }, { tickets: 2 },
];
export const CHECK_IN_CHESTS = [
  { day: 3, icon: 'chest-olive', reward: { coins: 100, materials: 25 } },
  { day: 7, icon: 'chest-blue', reward: { materials: 50, tickets: 1 } },
  { day: 10, icon: 'chest-purple', reward: { coins: 160, materials: 70 } },
  { day: 14, icon: 'chest-gold', reward: { materials: 100, tickets: 2 } },
] as const;

export type CheckInState = { count: number; lastDay: string; chests: number[] };
type CheckInWallet = Record<RewardKind, number> & { checkIn: CheckInState };

export function readCheckIn(raw?: unknown): CheckInState {
  const state: CheckInState = { count: 0, lastDay: '', chests: [] };
  if (!raw || typeof raw !== 'object') return state;
  const { count, lastDay, chests } = raw as Partial<CheckInState>;
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > CHECK_IN_DAYS.length ||
      typeof lastDay !== 'string' || !/^\d{4}-\d{1,2}-\d{1,2}$/.test(lastDay)) return state;
  state.count = count;
  state.lastDay = lastDay;
  if (Array.isArray(chests)) state.chests = CHECK_IN_CHESTS.filter(chest => chest.day <= count && chests.includes(chest.day)).map(chest => chest.day);
  return state;
}

export function checkInStatus(state: CheckInState, now = new Date()) {
  const day = dailyKey(now);
  const nextDay = day !== state.lastDay;
  const rollover = nextDay && state.count === CHECK_IN_DAYS.length;
  const daily = nextDay ? rollover ? 1 : state.count + 1 : undefined;
  const chests = CHECK_IN_CHESTS.filter(chest => chest.day <= state.count && !state.chests.includes(chest.day));
  return { day, daily, chests, rollover };
}

function grant(wallet: CheckInWallet, reward: Reward) {
  for (const kind of ['coins', 'materials', 'tickets'] as const) wallet[kind] += reward[kind] ?? 0;
}

export function refreshCheckIn(wallet: CheckInWallet, now = new Date()): Reward | undefined {
  const status = checkInStatus(wallet.checkIn, now);
  if (!status.rollover) return;
  const reward: Reward = {};
  for (const chest of status.chests) {
    const contents: Reward = chest.reward;
    for (const kind of ['coins', 'materials', 'tickets'] as const) {
      if (contents[kind]) reward[kind] = (reward[kind] ?? 0) + contents[kind];
    }
  }
  grant(wallet, reward);
  wallet.checkIn = readCheckIn();
  return reward;
}

export function claimCheckInDay(wallet: CheckInWallet, day: number, now = new Date()): Reward | undefined {
  const status = checkInStatus(wallet.checkIn, now);
  if (status.rollover || day !== status.daily) return;
  const reward = CHECK_IN_DAYS[day - 1];
  grant(wallet, reward);
  wallet.checkIn.count = day;
  wallet.checkIn.lastDay = status.day;
  return reward;
}

export function claimCheckInChest(wallet: CheckInWallet, day: number, now = new Date()): Reward | undefined {
  const status = checkInStatus(wallet.checkIn, now);
  if (status.rollover) return;
  const chest = status.chests.find(chest => chest.day === day);
  if (!chest) return;
  grant(wallet, chest.reward);
  wallet.checkIn.chests.push(day);
  return chest.reward;
}

export function checkInRewardText(reward: Reward) {
  return (['coins', 'materials', 'tickets'] as const)
    .filter(kind => reward[kind])
    .map(kind => `${CHECK_IN_REWARD_NAMES[kind]} ×${reward[kind]}`)
    .join('  ·  ');
}
