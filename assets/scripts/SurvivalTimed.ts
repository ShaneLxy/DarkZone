import type { Point } from './Core';
import { harborPoint } from './SurvivalHarbor';
import { isSurvivalGun, type SurvivalGun } from './SurvivalGear';

export const CONVOY_NOTICE = 34 * 60;
export const CONVOY_ARRIVAL = 36 * 60;
export const CONVOY_LEAVE = 39 * 60;
export const SURVIVAL_DEADLINE = 40 * 60;
export const BLOOD_MOON = 20 * 60;
export const SURVIVAL_ESCALATION = BLOOD_MOON + 4 * 60;
export const SURVIVAL_ACTIVE_HUNT = BLOOD_MOON + 6 * 60;
export const SURVIVAL_HIGH_PRESSURE = BLOOD_MOON + 10 * 60;
export const SURVIVAL_AIR_DURATION = 30;
export const EVAC_FUEL_SECONDS = 52;
export const EVAC_BOAT_WIDTH = 155 * 1.3;

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
  released: number; convoyNotice: boolean; rewardedMinutes: number; lastDrop: number;
  helicopter: VehicleProgress; boat: VehicleProgress;
  spawnedWeapons?: SurvivalGun[];
  bloodMoonNotice?: boolean;
  airQueue?: number;
  airRemaining?: number;
};
export type TimedSurvivalRun = TimedSurvivalSave & {
  nextPressure: number; nextSupplies: number; nextConvoyFire: number; groups: { point: Point; count: number; expires: number }[];
  spawnedWeapons: SurvivalGun[];
  route?: EvacRoute;
};

export const newTimedSurvival = (): TimedSurvivalRun => ({
  released: 0, convoyNotice: false, rewardedMinutes: 0, lastDrop: 0, helicopter: { installed: 0 }, boat: { installed: 0 },
  nextPressure: 27, nextSupplies: 0, nextConvoyFire: 0, groups: [], spawnedWeapons: [],
});

export function readTimedSurvival(value: unknown, elapsed: number): TimedSurvivalSave | undefined {
  const s = value as TimedSurvivalSave | undefined;
  const integer = (n: number, max: number) => Number.isInteger(n) && n >= 0 && n <= max;
  const vehicle = (v: VehicleProgress) => !!v && integer(v.installed, 31) &&
    (v.fuelStart === undefined || v.installed === 31 && Number.isFinite(v.fuelStart) && v.fuelStart >= 0 && v.fuelStart <= elapsed);
  if (!s || !integer(s.released, 1023) || !integer(s.rewardedMinutes, SURVIVAL_DEADLINE / 60) || !integer(s.lastDrop, SURVIVAL_DEADLINE / 60) ||
      typeof s.convoyNotice !== 'boolean' || !vehicle(s.helicopter) || !vehicle(s.boat)) return;
  if ((s.helicopter.installed & s.released) !== s.helicopter.installed ||
      (((s.boat.installed << 5) & s.released) !== s.boat.installed << 5)) return;
  if (s.spawnedWeapons !== undefined && (!Array.isArray(s.spawnedWeapons) || s.spawnedWeapons.length > 2 ||
      !s.spawnedWeapons.every(isSurvivalGun) || new Set(s.spawnedWeapons).size !== s.spawnedWeapons.length)) return;
  if (s.bloodMoonNotice !== undefined && typeof s.bloodMoonNotice !== 'boolean' ||
      s.airQueue !== undefined && !integer(s.airQueue, 512) ||
      s.airRemaining !== undefined && (!Number.isFinite(s.airRemaining) || s.airRemaining <= 0 || s.airRemaining > SURVIVAL_AIR_DURATION)) return;
  // A checkpoint from the shorter run may already have shown these notices.
  return { ...s, bloodMoonNotice: elapsed >= BLOOD_MOON && s.bloodMoonNotice, convoyNotice: elapsed >= CONVOY_NOTICE && s.convoyNotice };
}

// Match the perimeter arterial and main street in the harbor road artwork.
const CONVOY_IN = [[56, 55], [49, 103], [33, 215], [29, 429], [29, 582], [56, 645], [115, 679],
  [202, 686], [343, 683], [425, 682], [517, 685], [520, 638], [518, 538], [525, 478], [559, 443],
  [636, 435], [730, 435], [810, 435], [866, 435], [904, 429], [946, 418], [994, 418], [1058, 419]] as const;
const CONVOY_OUT = [[1058, 419], [1120, 419], [1165, 414], [1185, 396], [1189, 362], [1189, 325], [1189, 283],
  [1193, 252], [1210, 232], [1240, 221], [1280, 219], [1333, 220], [1395, 207], [1425, 170], [1448, 85], [1470, 49], [1549, 51]] as const;
const route = (points: readonly (readonly [number, number])[]) => {
  const positions = points.map(([x, y]) => harborPoint(x, y));
  const lengths = positions.map((p, i) => i ? Math.hypot(p.x - positions[i - 1].x, p.y - positions[i - 1].y) : 0);
  return { positions, lengths, length: lengths.reduce((sum, length) => sum + length, 0) };
};
const inbound = route(CONVOY_IN), outbound = route(CONVOY_OUT);
function along(path: typeof inbound, distance: number) {
  let i = 1;
  while (distance > path.lengths[i] && i < path.lengths.length - 1) distance -= path.lengths[i++];
  const from = path.positions[i - 1], to = path.positions[i], t = distance / path.lengths[i];
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, angle };
}
export const CONVOY_BOARD = harborPoint(1058, 419);
export function convoyVehicles(time: number) {
  if (time < CONVOY_NOTICE || time > CONVOY_LEAVE + 18) return [];
  const departing = time >= CONVOY_LEAVE;
  const advance = departing ? (time - CONVOY_LEAVE) * (outbound.length + 700) / 18 :
    inbound.length * Math.min(1, (time - CONVOY_NOTICE) / (CONVOY_ARRIVAL - CONVOY_NOTICE));
  return Array.from({ length: 5 }, (_, index) => {
    const offset = index * 156;
    const distance = advance - offset;
    const pose = departing && distance >= 0 ? along(outbound, distance) : along(inbound, Math.max(0, departing ? inbound.length + distance : distance));
    return { ...pose, index, kind: (index === 1 || index === 3 ? 'tank' : 'carrier') as 'tank' | 'carrier',
      visible: departing || distance >= 0 };
  });
}
