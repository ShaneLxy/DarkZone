import { Battle } from './Core';

/** Only guide a nearby exit once its actual prerequisites can be fulfilled. */
export function exitGuideAngle(b: Battle, maxDistance = 650): number | undefined {
  if (b.status !== 'playing' || b.player.hp <= 0 || b.tutorial || b.floorPending) return undefined;
  if (b.survival) {
    const point = b.survivalReturnPoint();
    if (!point || Math.hypot(point.x - b.player.x, point.y - b.player.y) < 5) return undefined;
    return Math.atan2(point.y - b.player.y, point.x - b.player.x);
  }
  if (b.retrieval) {
    const point = b.retrievalGuide;
    return point && Math.hypot(point.x - b.player.x, point.y - b.player.y) > 22
      ? Math.atan2(point.y - b.player.y, point.x - b.player.x) : undefined;
  }
  const entrance = b.frontierGuide ?? b.operationGoal ?? (b.apartment?.phase === 'outside' || b.apartment?.phase === 'car-ready' ? b.apartmentGoal : undefined);
  const ready = b.stage.dorm ? b.keys.has(b.stage.dorm.pickup.id) || b.exitReady : b.exitReady;
  if (!ready && !entrance) return undefined;
  const goal = b.operationGoal ? b.operationGuide : entrance ?? b.stage.exit;
  if (!goal) return undefined;
  const dx = goal.x - b.player.x, dy = goal.y - b.player.y, distance = Math.hypot(dx, dy);
  return distance > (b.stage.operation ? 5 : 20) && (entrance || distance <= maxDistance) ? Math.atan2(dy, dx) : undefined;
}
