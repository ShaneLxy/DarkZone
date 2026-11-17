export const GHOST_ID = 0;
export const HEROINE_ID = 3;
export const ENGINEER_ID = 4;

export const HERO_IDS = [HEROINE_ID, GHOST_ID, ENGINEER_ID] as const;
export type HeroId = typeof HERO_IDS[number];

type Hero = {
  name: string; role: string; gun: string; weapon: 'rifle' | 'shotgun' | 'suppressed';
  color: string; hp: number; speed: number; damage: number; interval: number;
  magazine: number; pellets: number; spread: number; reload: number; visionRange: number;
  bulletPush: number; reserveMagazines: number; footstepRadius: number;
};

export const heroes: Readonly<Record<HeroId, Hero>> = {
  [GHOST_ID]: {
    name: '幽灵', role: '突击手', gun: 'AR-16 突击步枪', weapon: 'rifle', color: '#9bb9af',
    hp: 110, speed: 205, damage: 21, interval: 0.14, magazine: 24, pellets: 1, spread: 0.035, reload: 1.25, visionRange: 530,
    bulletPush: 26, reserveMagazines: 11, footstepRadius: 175,
  },
  [HEROINE_ID]: {
    name: '凛', role: '幸存者', gun: 'USP 消音手枪', weapon: 'suppressed', color: '#9da7cd',
    hp: 100, speed: 150, damage: 26, interval: 0.48, magazine: 12, pellets: 1, spread: 0.018, reload: 1.15, visionRange: 265,
    bulletPush: 10, reserveMagazines: 4, footstepRadius: 80,
  },
  [ENGINEER_ID]: {
    name: '维川', role: '工程师', gun: '泵动式霰弹枪', weapon: 'shotgun', color: '#d6ae85',
    hp: 120, speed: 175, damage: 15, interval: 0.62, magazine: 7, pellets: 6, spread: 0.24, reload: 1.65, visionRange: 420,
    bulletPush: 46, reserveMagazines: 4, footstepRadius: 190,
  },
};
