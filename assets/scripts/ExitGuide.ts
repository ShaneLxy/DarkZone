import { Battle } from './Core';

/** Only guide a nearby exit once its actual prerequisites can be fulfilled. */
export function exitGuideAngle(b: Battle, maxDistance = 650): number | undefined {
  if (b.status !== 'playing' || b.player.hp <= 0 || b.tutorial || b.floorPending) return undefined;
  const entrance = b.operationGoal ?? (b.apartment?.phase === 'outside' || b.apartment?.phase === 'car-ready' ? b.apartmentGoal : undefined);
  const ready = b.stage.dorm ? b.keys.has(b.stage.dorm.pickup.id) || b.exitReady : b.exitReady;
  if (!ready && !entrance) return undefined;
  const goal = entrance ?? b.stage.exit;
  const dx = goal.x - b.player.x, dy = goal.y - b.player.y, distance = Math.hypot(dx, dy);
  return distance > 20 && (entrance || distance <= maxDistance) ? Math.atan2(dy, dx) : undefined;
}
