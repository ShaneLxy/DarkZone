// Reusable first-pass tactical item and sound-domain primitives.
// No Cocos/browser dependency: Core and Blackout can consume these without coupling UI to rules.
import { heroes, type HeroId } from './Heroes';

export type Point = { x: number; y: number };
export type Blocker = { x: number; y: number; w: number; h: number; angle?: number; kind?: string };
export type TacticalKind = 'grenade' | 'flashbang' | 'proximity-mine' | 'shock-mine' | 'claymore';

export type TacticalDefinition = {
  kind: TacticalKind;
  title: string;
  maxUses: number;
  delay: number;
  radius: number;
  cooldown: number;
  damage: number;
  doorDamage: number;
  stun: number;
  bossStunScale: number;
  loudness: number;
};

export const TACTICAL_DEFINITIONS: Readonly<Record<TacticalKind, TacticalDefinition>> = {
  grenade: { kind: 'grenade', title: '手雷', maxUses: 2, delay: 0.32, radius: 92, cooldown: 1.15, damage: 48, doorDamage: 85, stun: 0, bossStunScale: 0, loudness: 1 },
  flashbang: { kind: 'flashbang', title: '震撼弹', maxUses: 2, delay: 0.26, radius: 118, cooldown: 1.15, damage: 0, doorDamage: 0, stun: 0.85, bossStunScale: 0.35, loudness: 1 },
  // Data-only for the next version. It is intentionally not in the selectable list.
  'proximity-mine': { kind: 'proximity-mine', title: '感应地雷', maxUses: 2, delay: 0, radius: 100, cooldown: 1.4, damage: 70, doorDamage: 100, stun: 0, bossStunScale: 0, loudness: 0.8 },
  'shock-mine': { kind: 'shock-mine', title: '麻痹地雷', maxUses: 2, delay: 0, radius: 95, cooldown: 1.4, damage: 0, doorDamage: 0, stun: 2.4, bossStunScale: 0.5, loudness: 0.35 },
  claymore: { kind: 'claymore', title: '阔剑地雷', maxUses: 2, delay: 0, radius: 140, cooldown: 1.4, damage: 80, doorDamage: 70, stun: 0, bossStunScale: 0, loudness: 1 },
};

export const SELECTABLE_TACTICALS: readonly TacticalKind[] = ['grenade', 'flashbang'];
export function isShopMine(kind: TacticalKind | null): kind is 'shock-mine' | 'claymore' {
  return kind === 'shock-mine' || kind === 'claymore';
}

export const GRENADE_BLAST_LIFE = 1.05;
const GRENADE_AIR_TIME = 0.205;
const GRENADE_BOUNCE_TIME = 0.078;
export function grenadePose(remaining: number) {
  const elapsed = Math.max(0, TACTICAL_DEFINITIONS.grenade.delay - remaining);
  if (elapsed < GRENADE_AIR_TIME) {
    const t = elapsed / GRENADE_AIR_TIME;
    return { travel: 0.83 * t, height: 120 * t * (1 - t), spin: t * 430 };
  }
  const t = Math.min(1, (elapsed - GRENADE_AIR_TIME) / GRENADE_BOUNCE_TIME);
  return { travel: 0.83 + 0.17 * (1 - (1 - t) ** 2), height: 29 * t * (1 - t), spin: 430 + t * 142 };
}

export type TacticalLoadout = { selected: TacticalKind | null; remaining: number; cooldown: number; capacity?: number };
export function newTacticalLoadout(selected: TacticalKind | null = null): TacticalLoadout {
  const valid = selected && SELECTABLE_TACTICALS.includes(selected) ? selected : null;
  return { selected: valid, remaining: valid ? TACTICAL_DEFINITIONS[valid].maxUses : 0, cooldown: 0 };
}
export function selectTactical(kind: TacticalKind): TacticalLoadout | null {
  if (!SELECTABLE_TACTICALS.includes(kind)) return null;
  return newTacticalLoadout(kind);
}
export function resetTactical(loadout: TacticalLoadout) {
  loadout.remaining = loadout.selected ? TACTICAL_DEFINITIONS[loadout.selected].maxUses : 0;
  loadout.cooldown = 0;
}
export function canUseTactical(loadout: TacticalLoadout) {
  return !!loadout.selected && loadout.remaining > 0 && loadout.cooldown <= 0;
}
export function consumeTactical(loadout: TacticalLoadout) {
  if (!canUseTactical(loadout)) return false;
  loadout.remaining--;
  loadout.cooldown = TACTICAL_DEFINITIONS[loadout.selected!].cooldown;
  return true;
}
export function stepTactical(loadout: TacticalLoadout, dt: number) {
  loadout.cooldown = Math.max(0, loadout.cooldown - Math.max(0, dt));
}

export type TacticalTarget = Point & { type?: 'walker' | 'spitter' | 'boss' | 'gunner'; hp: number; windup?: number; hit?: number; stun?: number };
export type TacticalDoor = Point & { material: 'wood' | 'steel'; hp: number; destroyed?: boolean };
export type TacticalImpact = { kind: TacticalKind; point: Point; affectedEnemies: number; enemyDamage: number; doorDamage: number; blocked: boolean };

export function tacticalPoint(origin: Point, facing: number, distance: number, blockers: readonly Blocker[], rayDistance: (origin: Point, angle: number, max: number, blockers: readonly Blocker[]) => number): Point {
  const safe = Math.max(0, rayDistance(origin, facing, Math.max(0, distance), blockers) - 3);
  return { x: origin.x + Math.cos(facing) * safe, y: origin.y + Math.sin(facing) * safe };
}

export function resolveTactical(
  kind: TacticalKind,
  point: Point,
  enemies: TacticalTarget[],
  doors: TacticalDoor[],
  blockers: readonly Blocker[],
  lineClear: (a: Point, b: Point, blockers: readonly Blocker[]) => boolean,
  damageEnemy: (enemy: TacticalTarget, damage: number) => void,
  damageDoor: (door: TacticalDoor, damage: number) => void,
): TacticalImpact {
  const def = TACTICAL_DEFINITIONS[kind];
  let affectedEnemies = 0;
  let enemyDamage = 0;
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || Math.hypot(enemy.x - point.x, enemy.y - point.y) > def.radius || !lineClear(point, enemy, blockers)) continue;
    affectedEnemies++;
    if (def.damage > 0) { damageEnemy(enemy, def.damage); enemyDamage += def.damage; }
    else if (kind === 'flashbang') {
      const stun = enemy.type === 'boss' ? def.stun * def.bossStunScale : def.stun;
      enemy.stun = Math.max(enemy.stun || 0, stun);
      if ((enemy.windup || 0) > 0) enemy.windup = 0;
    }
    enemy.hit = 0.12;
  }
  let doorDamage = 0;
  if (def.doorDamage > 0) for (const door of doors) {
    if (door.destroyed || Math.hypot(door.x - point.x, door.y - point.y) > def.radius || !lineClear(point, door, blockers)) continue;
    const damage = door.material === 'wood' ? def.doorDamage : Math.floor(def.doorDamage * 0.35);
    damageDoor(door, damage); doorDamage += damage;
  }
  return { kind, point, affectedEnemies, enemyDamage, doorDamage, blocked: false };
}

export type SoundEvent = { position: Point; intensity: number; type: string; radius: number; life: number; maxLife: number };
export type HeardSound = SoundEvent & { effectiveIntensity: number; distance: number };
export function makeSoundEvent(position: Point, intensity: number, type: string, radius: number, life = 0.45): SoundEvent {
  return { position: { ...position }, intensity: Math.max(0, intensity), type, radius: Math.max(0, radius), life: Math.max(0, life), maxLife: Math.max(0, life) };
}
export function soundAttenuation(distance: number, blocked: boolean, range = 720) {
  const distanceFactor = Math.max(0, 1 - Math.max(0, distance) / range);
  return distanceFactor * (blocked ? 0.38 : 1);
}
export function hearSound(listener: Point, sound: SoundEvent, blocked: boolean): HeardSound | null {
  const distance = Math.hypot(listener.x - sound.position.x, listener.y - sound.position.y);
  if (distance > sound.radius || sound.life <= 0) return null;
  const effectiveIntensity = sound.intensity * soundAttenuation(distance, blocked, Math.max(720, sound.radius));
  return effectiveIntensity > 0 ? { ...sound, distance, effectiveIntensity } : null;
}
export function ageSound(sound: SoundEvent, dt: number) { sound.life = Math.max(0, sound.life - Math.max(0, dt)); }

// Loud sources can be heard through walls. Door leaves and furniture reduce the
// strength independently of whether there is a walkable route to the source.
export function hearSoundThroughGeometry(
  listener: Point,
  sound: SoundEvent,
  blockers: readonly Blocker[],
  rayRect: (origin: Point, dx: number, dy: number, rect: Blocker, max: number) => number,
  doorMaterial: (id: number) => 'wood' | 'steel' | undefined,
): HeardSound | null {
  const heard = hearSound(listener, sound, false);
  if (!heard) return null;
  const length = heard.distance;
  if (length <= 0.001) return heard;
  const dx = (listener.x - sound.position.x) / length, dy = (listener.y - sound.position.y) / length;
  const alarm = sound.type === 'alarm';
  let factor = 1;
  for (const rect of blockers) {
    if (rayRect(sound.position, dx, dy, rect, length) >= length - 0.01) continue;
    if (rect.kind?.startsWith('door:')) {
      const steel = doorMaterial(Number(rect.kind.slice(5))) === 'steel';
      factor *= alarm ? (steel ? 0.48 : 0.78) : (steel ? 0.16 : 0.38);
    } else if (!rect.kind || rect.kind === 'jamb' || rect.kind === 'street-roadblock') {
      if (!alarm && sound.type !== 'rifle') return null;
      factor *= alarm ? 0.57 : 0.33;
    } else factor *= alarm ? 0.85 : 0.65;
  }
  heard.effectiveIntensity *= factor;
  return heard.effectiveIntensity > 0 ? heard : null;
}

export const SOUND_PROFILES = {
  suppressed: { intensity: 0.42, radius: 190 },
  rifle: { intensity: 1, radius: 1100 },
  shotgun: { intensity: 1, radius: 650 },
  'door-interact': { intensity: 0.32, radius: 180 },
  'door-open': { intensity: 0.55, radius: 250 },
  'door-break': { intensity: 1, radius: 590 },
  explosion: { intensity: 1, radius: 680 },
  alarm: { intensity: 1, radius: 1760 },
  footstep: { intensity: 0.25, radius: 105 },
  roll: { intensity: 0.5, radius: 190 },
} as const;
// Characters wear different footwear and equipment; values are game units.
export function footstepSoundProfile(heroId: HeroId) {
  return { intensity: 0.25, radius: heroes[heroId].footstepRadius };
}
export function weaponSoundProfile(heroId: HeroId) {
  return SOUND_PROFILES[heroes[heroId].weapon];
}
