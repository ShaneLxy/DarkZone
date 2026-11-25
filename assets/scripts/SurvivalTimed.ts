import type { Point } from './Core';
import { harborPoint } from './SurvivalHarbor';
import { isSurvivalGun, type SurvivalGun } from './SurvivalGear';

export const PAGER_AVAILABLE = 34 * 60;
export const CONVOY_DELAY = 3 * 60;
export const BLOOD_MOON = 20 * 60;
export const SURVIVAL_ACTIVE_HUNT = BLOOD_MOON + 6 * 60;
export const SURVIVAL_AIR_DURATION = 30;
export const EVAC_FUEL_SECONDS = 52;
export const EVAC_BOAT_WIDTH = 155 * 1.3;
export const CONVOY_SCALE = 2;
export const CONVOY_AIR_OFFSET = 165;
export const convoyBody = (kind: 'carrier' | 'tank') => kind === 'tank'
  ? { halfLength: 179, halfWidth: 91 } : { halfLength: 146, halfWidth: 77 };

const HORDE_ROUTE = [1, 5, 6, 4, 3, 2, 0] as const;
export function survivalHordeWindow(seed: number, elapsed: number) {
  if (elapsed < BLOOD_MOON) return undefined;
  const period = 75, activeSeconds = 42;
  const since = elapsed - BLOOD_MOON;
  const index = Math.floor(since / period);
  const phase = since % period;
  const active = phase < activeSeconds;
  const region = HORDE_ROUTE[((seed >>> 0) + index + (active ? 0 : 1)) % HORDE_ROUTE.length];
  return { region, active, seconds: (active ? activeSeconds : period) - phase };
}

export const EVAC_VEHICLES = {
  helicopter: { name: '工事黑鹰', parts: ['air-key', 'air-controls', 'air-battery', 'air-avionics', 'air-coupler'],
    point: harborPoint(1045, 327), access: harborPoint(1062, 336) },
  boat: { name: '港口快艇', parts: ['boat-key', 'boat-battery', 'boat-steering', 'boat-start', 'boat-fuel'],
    point: harborPoint(219, 1014), access: harborPoint(219, 1000) },
} as const;
export type EvacVehicle = keyof typeof EVAC_VEHICLES;
export type EvacRoute = EvacVehicle | 'convoy';
export const EVAC_ROUTE_NAME: Record<EvacRoute, string> = { helicopter: '黑鹰直升机', boat: '港口快艇', convoy: '装甲车队' };
export const EVAC_PART_IDS = [...EVAC_VEHICLES.helicopter.parts, ...EVAC_VEHICLES.boat.parts] as const;
export const EVAC_PART_WINDOWS = [[120, 240], [300, 480], [540, 720], [780, 1000], [1080, 1380]] as const;
export type SurvivalVariant = 'runner' | 'breaker' | 'overrun';
type VehicleProgress = { installed: number; fuelStart?: number };
export type TimedSurvivalSave = {
  released: number; pagerNotice?: boolean; convoyRequestedAt?: number; processedMinute: number; lastDrop: number;
  helicopter: VehicleProgress; boat: VehicleProgress;
  spawnedWeapons?: SurvivalGun[];
  bloodMoonNotice?: boolean;
  airQueue?: number;
  airRemaining?: number;
  lastTankMinute?: number;
};
export type TimedSurvivalRun = TimedSurvivalSave & {
  nextPressure: number; nextSupplies: number; nextConvoyFire: number; nextPagerSearch: number;
  spawnedWeapons: SurvivalGun[];
  route?: EvacRoute;
};

export const newTimedSurvival = (): TimedSurvivalRun => ({
  released: 0, processedMinute: 0, lastDrop: 0, helicopter: { installed: 0 }, boat: { installed: 0 },
  nextPressure: 27, nextSupplies: 0, nextConvoyFire: 0, nextPagerSearch: PAGER_AVAILABLE, spawnedWeapons: [],
});

export function readTimedSurvival(value: unknown, elapsed: number): TimedSurvivalSave | undefined {
  const s = value as (TimedSurvivalSave & { rewardedMinutes?: number; convoyNotice?: boolean }) | undefined;
  const integer = (n: number, max: number) => Number.isInteger(n) && n >= 0 && n <= max;
  const vehicle = (v: VehicleProgress) => !!v && integer(v.installed, 31) &&
    (v.fuelStart === undefined || v.installed === 31 && Number.isFinite(v.fuelStart) && v.fuelStart >= 0 && v.fuelStart <= elapsed);
  const minute = Math.floor(elapsed / 60);
  if (!s || !integer(s.released, 1023) || !integer(s.processedMinute ?? s.rewardedMinutes ?? -1, minute) || !integer(s.lastDrop, minute) ||
      !vehicle(s.helicopter) || !vehicle(s.boat) || s.pagerNotice !== undefined && typeof s.pagerNotice !== 'boolean' ||
      s.convoyRequestedAt !== undefined && (!Number.isFinite(s.convoyRequestedAt) ||
        s.convoyRequestedAt < PAGER_AVAILABLE || s.convoyRequestedAt > elapsed)) return;
  if ((s.helicopter.installed & s.released) !== s.helicopter.installed ||
      (((s.boat.installed << 5) & s.released) !== s.boat.installed << 5)) return;
  if (s.spawnedWeapons !== undefined && (!Array.isArray(s.spawnedWeapons) || s.spawnedWeapons.length > 2 ||
      !s.spawnedWeapons.every(isSurvivalGun) || new Set(s.spawnedWeapons).size !== s.spawnedWeapons.length)) return;
  if (s.bloodMoonNotice !== undefined && typeof s.bloodMoonNotice !== 'boolean' ||
      s.airQueue !== undefined && !integer(s.airQueue, 512) ||
      s.lastTankMinute !== undefined && !integer(s.lastTankMinute, Math.floor(elapsed / 60)) ||
      s.airRemaining !== undefined && (!Number.isFinite(s.airRemaining) || s.airRemaining <= 0 || s.airRemaining > SURVIVAL_AIR_DURATION)) return;
  // Legacy automatic convoy announcements do not count as a player call.
  const { rewardedMinutes, convoyNotice, ...clock } = s;
  return { ...clock, processedMinute: s.processedMinute ?? rewardedMinutes!, bloodMoonNotice: elapsed >= BLOOD_MOON && s.bloodMoonNotice,
    pagerNotice: elapsed >= PAGER_AVAILABLE && s.pagerNotice };
}

// Match the perimeter arterial and main street in the harbor road artwork.
const CONVOY_IN = [[56, 55], [49, 103], [33, 215], [29, 429], [29, 582], [56, 645], [115, 679],
  [202, 686], [343, 683], [425, 682], [517, 685], [520, 638], [518, 538], [525, 478], [559, 443],
  [636, 435], [730, 435], [810, 435], [866, 435], [904, 429], [946, 418], [994, 418], [1058, 419]] as const;
const route = (points: readonly (readonly [number, number])[]) => {
  const positions = points.map(([x, y]) => harborPoint(x, y));
  const lengths = positions.map((p, i) => i ? Math.hypot(p.x - positions[i - 1].x, p.y - positions[i - 1].y) : 0);
  return { positions, lengths, length: lengths.reduce((sum, length) => sum + length, 0) };
};
const inbound = route(CONVOY_IN);
function along(path: typeof inbound, distance: number) {
  let i = 1;
  while (distance > path.lengths[i] && i < path.lengths.length - 1) distance -= path.lengths[i++];
  const from = path.positions[i - 1], to = path.positions[i], t = distance / path.lengths[i];
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, angle };
}
export const CONVOY_BOARD = harborPoint(1058, 419);
export const convoyAirPosition = (vehicle: Point & { angle: number }) => ({
  x: vehicle.x - Math.sin(vehicle.angle) * CONVOY_AIR_OFFSET,
  y: vehicle.y + Math.cos(vehicle.angle) * CONVOY_AIR_OFFSET,
});
export function convoyVehicles(timeSinceCall: number) {
  if (timeSinceCall < 0) return [];
  const advance = inbound.length * Math.min(1, timeSinceCall / CONVOY_DELAY);
  return Array.from({ length: 5 }, (_, index) => {
    const offset = index * 350;
    const distance = advance - offset;
    const pose = along(inbound, Math.max(0, distance));
    return { ...pose, index, kind: (index === 1 || index === 3 ? 'tank' : 'carrier') as 'tank' | 'carrier',
      visible: distance >= 0 };
  });
}
