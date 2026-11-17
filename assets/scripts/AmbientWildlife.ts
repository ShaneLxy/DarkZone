import { clamp, dist, roomAt, visible, walkable } from './Core';
import type { Battle, Point } from './Core';
import type { LevelDefinition } from './Levels';

type WallRoute = { start: Point; end: Point; bow: Point; length: number };
type Run = { route: WallRoute; kind: AmbientAnimal['kind']; duration: number; elapsed: number };
export type AmbientAnimal = Point & { kind: 'rat' | 'roach'; angle: number; elapsed: number; opacity: number };

const BODY_CLEARANCE = 9;
const sample = (route: WallRoute, t: number) => {
  const dx = route.end.x - route.start.x, dy = route.end.y - route.start.y;
  const arc = 4 * t * (1 - t), tangent = 4 - 8 * t;
  return {
    x: route.start.x + dx * t + route.bow.x * arc,
    y: route.start.y + dy * t + route.bow.y * arc,
    angle: Math.atan2(dy + route.bow.y * tangent, dx + route.bow.x * tangent),
  };
};

function wallRoutes(stage: LevelDefinition): WallRoute[] {
  const solids = [...stage.walls, ...stage.furniture];
  const routes: WallRoute[] = [];
  for (const wall of stage.walls) {
    if (wall.angle) continue;
    const horizontal = wall.w >= wall.h, length = horizontal ? wall.w : wall.h;
    const sections = Math.ceil(length / 162);
    const span = length / sections, runLength = Math.min(118, span - 22);
    if (runLength < 68) continue;
    for (let i = 0; i < sections; i++) for (const side of [-1, 1]) {
      const along = i * span + (span - runLength) / 2;
      const across = side < 0 ? -BODY_CLEARANCE - 4 : (horizontal ? wall.h : wall.w) + BODY_CLEARANCE + 4;
      const point = (offset: number) => horizontal ?
        { x: wall.x + along + offset, y: wall.y + across } :
        { x: wall.x + across, y: wall.y + along + offset };
      const route = { start: point(0), end: point(runLength), bow: horizontal ? { x: 0, y: side * 27 } : { x: side * 27, y: 0 }, length: runLength };
      const room = roomAt(route.start, stage.rooms);
      if (room < 0) continue;
      const samples = Array.from({ length: 13 }, (_, j) => sample(route, j / 12));
      if (samples.every(p => roomAt(p, stage.rooms) === room && walkable(p, BODY_CLEARANCE, solids, stage.rooms) &&
        !stage.doors.some(d => dist(p, { x: d.x + Math.cos(d.baseAngle) * d.length / 2, y: d.y + Math.sin(d.baseAngle) * d.length / 2 }) < 55))) {
        routes.push(route);
      }
    }
  }
  return routes;
}

export class AmbientWildlife {
  private stage?: LevelDefinition;
  private routes: WallRoute[] = [];
  private seed = 0;
  private cooldown = 0;
  private run?: Run;

  private random() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  private reset(stage: LevelDefinition) {
    this.stage = stage;
    this.run = undefined;
    this.seed = stage.ambientWildlifeSeed ?? 0;
    this.routes = stage.ambientWildlifeSeed === undefined ? [] : wallRoutes(stage);
    this.cooldown = 9 + this.random() * 8;
  }

  step(dt: number, battle: Battle): AmbientAnimal | undefined {
    const { stage, player, blockers } = battle;
    if (this.stage !== stage) this.reset(stage);
    if (!this.routes.length) return;
    if (this.run) {
      const run = this.run;
      run.elapsed += dt;
      const t = run.elapsed / run.duration, p = sample(run.route, clamp(t, 0, 1));
      if (t >= 1 || !walkable(p, BODY_CLEARANCE, blockers, stage.rooms)) { this.run = undefined; return; }
      const fade = clamp(Math.min(t / 0.19, (1 - t) / 0.21), 0, 1);
      return { ...p, kind: run.kind, elapsed: run.elapsed, opacity: fade * fade * (3 - 2 * fade) };
    }

    this.cooldown -= dt;
    if (this.cooldown > 0) return;
    this.cooldown = 4 + this.random() * 4;
    // Leave short moments of nearby combat to the player and enemy feedback.
    if (player.fire > 0 || player.hit > 0 || battle.enemies.some(e => e.hp > 0 && dist(e, player) < 105)) return;
    const sight = battle.stats.visionRange;
    const routes = this.routes.filter(route => {
      const mid = sample(route, 0.5), distance = dist(mid, player);
      return distance >= 82 && distance <= Math.min(290, sight * 0.8) && visible(player, player.angle, mid, blockers, sight) &&
        Array.from({ length: 13 }, (_, i) => sample(route, i / 12)).every(p => walkable(p, BODY_CLEARANCE, blockers, stage.rooms));
    });
    if (!routes.length) return;
    const candidate = routes[Math.floor(this.random() * routes.length)];
    const route = this.random() < 0.5 ? candidate : { ...candidate, start: candidate.end, end: candidate.start };
    const kind = this.random() < 0.56 ? 'rat' : 'roach';
    const speed = kind === 'rat' ? 165 + this.random() * 38 : 104 + this.random() * 29;
    this.run = { route, kind, duration: (route.length + 15) / speed, elapsed: 0 };
    this.cooldown = 20 + this.random() * 15;
    return;
  }
}
