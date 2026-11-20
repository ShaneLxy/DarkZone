import type { Point } from './Core';
import { harborPoint } from './SurvivalHarbor';

export const CONVOY_NOTICE = 18 * 60;
export const CONVOY_ARRIVAL = 20 * 60;
export const CONVOY_LEAVE = 23 * 60;
export const SURVIVAL_DEADLINE = 24 * 60;
export const EVAC_FUEL_SECONDS = 52;

export const EVAC_VEHICLES = {
  helicopter: { name: '工事黑鹰', parts: ['air-key', 'air-controls', 'air-battery', 'air-avionics', 'air-coupler'],
    point: harborPoint(1090, 281), access: harborPoint(1088, 296) },
  boat: { name: '港口快艇', parts: ['boat-key', 'boat-battery', 'boat-steering', 'boat-start', 'boat-fuel'],
    point: harborPoint(219, 1012), access: harborPoint(219, 1000) },
} as const;
export type EvacVehicle = keyof typeof EVAC_VEHICLES;
export type EvacRoute = EvacVehicle | 'convoy';
export const EVAC_ROUTE_NAME: Record<EvacRoute, string> = { helicopter: '黑鹰直升机', boat: '港口快艇', convoy: '装甲车队' };
export const EVAC_PART_IDS = [...EVAC_VEHICLES.helicopter.parts, ...EVAC_VEHICLES.boat.parts] as const;
export const EVAC_PART_WINDOWS = [[120, 220], [240, 350], [360, 510], [540, 690], [720, 870]] as const;
export type SurvivalVariant = 'runner' | 'breaker' | 'overrun';
type VehicleProgress = { installed: number; fuelStart?: number };
export type TimedSurvivalSave = {
  released: number; convoyNotice: boolean; rewardedMinutes: number; lastDrop: number;
  helicopter: VehicleProgress; boat: VehicleProgress;
};
export type TimedSurvivalRun = TimedSurvivalSave & {
  nextPressure: number; nextConvoyFire: number; groups: { point: Point; count: number; expires: number }[];
  route?: EvacRoute;
};

export const newTimedSurvival = (): TimedSurvivalRun => ({
  released: 0, convoyNotice: false, rewardedMinutes: 0, lastDrop: 0, helicopter: { installed: 0 }, boat: { installed: 0 },
  nextPressure: 12, nextConvoyFire: 0, groups: [],
});

export function readTimedSurvival(value: unknown, elapsed: number): TimedSurvivalSave | undefined {
  const s = value as TimedSurvivalSave | undefined;
  const integer = (n: number, max: number) => Number.isInteger(n) && n >= 0 && n <= max;
  const vehicle = (v: VehicleProgress) => !!v && integer(v.installed, 31) &&
    (v.fuelStart === undefined || v.installed === 31 && Number.isFinite(v.fuelStart) && v.fuelStart >= 0 && v.fuelStart <= elapsed);
  if (!s || !integer(s.released, 1023) || !integer(s.rewardedMinutes, 24) || !integer(s.lastDrop, 24) ||
      typeof s.convoyNotice !== 'boolean' || !vehicle(s.helicopter) || !vehicle(s.boat)) return;
  if ((s.helicopter.installed & s.released) !== s.helicopter.installed ||
      (((s.boat.installed << 5) & s.released) !== s.boat.installed << 5)) return;
  return s;
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
