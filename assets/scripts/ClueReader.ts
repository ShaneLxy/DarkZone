/** Fixed narrative clue catalog and pure profile/reader state helpers. */
export const CLUE_SPECS = [
  { id: 'letter_alarm', stageId: 'campus-dorm-2f', title: '没寄出的信', kind: 'letter' as const, asset: 'clues/paper', x: 145, y: 222, radius: 68, achievement: 'letter_alarm', pages: ['凛：\n昨晚走廊的警报又响了。\n大家都说是测试，可值班表上没有这一项。\n如果今晚再听见三下敲门，\n先别开灯。'] },
  { id: 'letter_wall', stageId: 'campus-dorm-2f', title: '折角的纸片', kind: 'letter' as const, asset: 'clues/paper', x: 570, y: 222, radius: 68, achievement: 'letter_wall', pages: ['不知道是谁在墙后敲。\n每晚都是同一个位置，\n停一会儿，又从更远的地方响起。\n我把名字写下来了，\n可名单上好像少了一个人。'] },
  { id: 'warden_log', stageId: 'campus-dorm-1f', title: '宿管室终端', kind: 'computer' as const, asset: 'clues/pc', x: 2008, y: 193, radius: 70, achievement: 'warden_log', pages: ['9月12日  23:40\n西侧警报再次触发。\n测试声称已取消，\n但控制台仍收到回传。', '9月13日  02:10\n墙内有三次敲击。\n巡查记录写着“设备震动”，\n值班人员没有签名。', '9月14日  05:20\n名单人数对不上。\n先封存纸本，\n等白天再核对。'] },
] as const;
export type ClueId = typeof CLUE_SPECS[number]['id'];
export type ClueSpec = typeof CLUE_SPECS[number];
export type ReaderState = { clueId: ClueId; page: number; open: boolean };
export const EMPTY_READER: ReaderState = { clueId: 'letter_alarm', page: 0, open: false };
const validIds = new Set<string>(CLUE_SPECS.map(c => c.id));
export function sanitizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((id): id is string => typeof id === 'string' && validIds.has(id))));
}
export function recordClue(achievements: unknown, clues: unknown, id: string) {
  const found = sanitizeIds(clues), earned = sanitizeIds(achievements);
  if (!validIds.has(id)) return { clues: found, achievements: earned, first: false };
  const first = !found.includes(id);
  if (first) found.push(id);
  const achievement = CLUE_SPECS.find(c => c.id === id)!.achievement;
  if (first && !earned.includes(achievement)) earned.push(achievement);
  return { clues: found, achievements: earned, first };
}
export function openReader(id: string): ReaderState {
  const clue = CLUE_SPECS.find(c => c.id === id);
  return clue ? { clueId: clue.id, page: 0, open: true } : { ...EMPTY_READER };
}
export function turnReader(state: ReaderState, delta: number): ReaderState {
  if (!state.open) return state;
  const clue = CLUE_SPECS.find(c => c.id === state.clueId)!;
  return { ...state, page: Math.max(0, Math.min(clue.pages.length - 1, state.page + Math.sign(delta))) };
}
export function closeReader(state: ReaderState): ReaderState { return { ...state, open: false }; }
