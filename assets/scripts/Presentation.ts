import { clamp, closestOnRect, DEFAULT_VISION_RANGE, dist, lineClear, peripheralRange, Point, Rect, rectCorners, ROLL_DURATION, sightRange, TAU } from './Core';
import type { FaultyDoorLamp } from './Levels';
import { ENGINEER_ID, HEROINE_ID, type HeroId } from './Heroes';

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const DARK_BRIGHTNESS = 0.27;
export const DARK_SATURATION = 0.10;
export const FEATHER_PIXELS = 96;
export const OCCLUSION_FEATHER_PIXELS = 12;
export const DOOR_LAMP_RADIUS = 48;
export class PlayerHealthDisplay {
  fill = 1;
  trail = 1;
  private target = 1;
  private hold = 0;

  reset(ratio: number) {
    this.fill = this.trail = this.target = clamp(ratio, 0, 1);
    this.hold = 0;
  }

  step(ratio: number, dt: number) {
    ratio = clamp(ratio, 0, 1);
    if (ratio < this.target) {
      this.trail = Math.max(this.trail, this.fill);
      this.hold = 0.16;
    } else if (ratio > this.target) {
      this.trail = this.fill;
      this.hold = 0;
    }
    this.target = ratio;
    this.fill = this.approach(this.fill, ratio, dt, ratio > this.fill ? 7 : 26);
    this.hold = Math.max(0, this.hold - dt);
    if (this.hold === 0) this.trail = Math.max(this.fill, this.approach(this.trail, ratio, dt, 6));
  }

  private approach(value: number, target: number, dt: number, rate: number) {
    if (Math.abs(value - target) < 0.002) return target;
    return target + (value - target) * Math.exp(-dt * rate);
  }
}

const smoothstep = (a: number, b: number, v: number) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
export function doorLampFlicker(lamp: FaultyDoorLamp, time: number) {
  const t = (time + lamp.phase) % lamp.period;
  const pulse = (start: number, length: number) => smoothstep(start, start + 0.045, t) * (1 - smoothstep(start + length - 0.055, start + length, t));
  return Math.max(0.48 * pulse(0.08, 0.15), 0.88 * pulse(0.34, 0.21), 0.64 * pulse(0.65, 0.37));
}
type FeatherView = { origin: Point; peripheralRadius: number };
/** Keep a short-range actor's nearby floor bright while retaining broad range feathering. */
function localFeather(feather: number, nearRadius: number, distanceSquared: number) {
  const nearWidth = Math.min(feather, nearRadius * 0.6), transition = Math.max(1, nearRadius * 1.4);
  return nearWidth + (feather - nearWidth) * smoothstep(0, transition * transition, distanceSquared);
}

/** A reusable, low-resolution field. R = continuous inward feather; G = strict;
 * B = visible opaque furniture/door/wall tops; A = local door lamp reach.
 * No canvas/DOM dependency, so H5 and mini games use the same data.
 * Row zero is the bottom of the logical view and is sampled with that convention.
 */
export class VisibilityField {
  readonly pixels: Uint8Array;
  private inside: Uint8Array;
  private distance: Float32Array;
  private crossings: number[] = [];
  private hasEnvelope = false;
  private envelopeFeather = FEATHER_PIXELS;
  private featherView?: FeatherView;
  constructor(public width = 320, public height = 180) {
    this.pixels = new Uint8Array(width * height * 4);
    this.inside = new Uint8Array(width * height);
    this.distance = new Float32Array(width * height);
  }
  private rasterizeDistance(polygon: Point[]) {
    const w = this.width, h = this.height, sx = VIEW_WIDTH / w, sy = VIEW_HEIGHT / h;
    this.inside.fill(0);
    for (let y = 0; y < h; y++) {
      const scanY = (y + 0.5) * sy, xs = this.crossings; xs.length = 0;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[j], b = polygon[i];
        if ((a.y > scanY) !== (b.y > scanY)) xs.push(a.x + (scanY - a.y) * (b.x - a.x) / (b.y - a.y));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const start = Math.max(0, Math.ceil(xs[i] / sx - 0.5)), end = Math.min(w - 1, Math.floor(xs[i + 1] / sx - 0.5));
        if (end >= start) this.inside.fill(1, y * w + start, y * w + end + 1);
      }
    }
    const d = this.distance, diagonal = Math.SQRT2;
    d.fill(10000);
    // Seed real segment distances, not binary cell centres. A translated/rotated
    // edge then moves continuously through a cell instead of jumping by 4px.
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[j], b = polygon[i], dx = b.x - a.x, dy = b.y - a.y, length2 = dx * dx + dy * dy;
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx) / sx, Math.abs(dy) / sy)));
      for (let n = 0; n <= steps; n++) {
        const cx = Math.floor((a.x + dx * n / steps) / sx), cy = Math.floor((a.y + dy * n / steps) / sy);
        for (let y = Math.max(0, cy - 1); y <= Math.min(h - 1, cy + 1); y++) for (let x = Math.max(0, cx - 1); x <= Math.min(w - 1, cx + 1); x++) {
          const cell = y * w + x; if (!this.inside[cell]) continue;
          const px = (x + 0.5) * sx - a.x, py = (y + 0.5) * sy - a.y;
          const t = length2 ? clamp((px * dx + py * dy) / length2, 0, 1) : 0;
          d[cell] = Math.min(d[cell], Math.hypot(px - t * dx, py - t * dy) / Math.min(sx, sy));
        }
      }
    }
    // Two-pass chamfer distance. Viewport borders are not treated as shadows:
    // a lit area extending off-screen must stay lit at the edge of the screen.
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!this.inside[i]) continue;
      if (x > 0) d[i] = Math.min(d[i], d[i - 1] + 1);
      if (y > 0) { d[i] = Math.min(d[i], d[i - w] + 1); if (x > 0) d[i] = Math.min(d[i], d[i - w - 1] + diagonal); if (x + 1 < w) d[i] = Math.min(d[i], d[i - w + 1] + diagonal); }
    }
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x; if (!this.inside[i]) continue;
      if (x + 1 < w) d[i] = Math.min(d[i], d[i + 1] + 1);
      if (y + 1 < h) { d[i] = Math.min(d[i], d[i + w] + 1); if (x > 0) d[i] = Math.min(d[i], d[i + w - 1] + diagonal); if (x + 1 < w) d[i] = Math.min(d[i], d[i + w + 1] + diagonal); }
    }
  }
  private envelopeAt(cell: number, sx: number, sy: number) {
    if (!this.inside[cell]) return 0;
    let feather = this.envelopeFeather;
    if (this.featherView) {
      const dx = (cell % this.width + 0.5) * sx - this.featherView.origin.x, dy = (Math.floor(cell / this.width) + 0.5) * sy - this.featherView.origin.y;
      feather = localFeather(feather, this.featherView.peripheralRadius, dx * dx + dy * dy);
    }
    return smoothstep(0, Math.max(1, feather), Math.max(0, this.distance[cell]) * Math.min(sx, sy));
  }
  build(polygon: Point[], feather = FEATHER_PIXELS, unobstructedCone?: Point[], view?: FeatherView) {
    this.hasEnvelope = !!unobstructedCone; this.envelopeFeather = feather; this.featherView = view;
    this.rasterizeDistance(polygon);
    const pixelSize = Math.min(VIEW_WIDTH / this.width, VIEW_HEIGHT / this.height);
    for (let i = 0; i < this.distance.length; i++) {
      this.pixels[i * 4] = this.inside[i] ? Math.round(smoothstep(0, unobstructedCone ? OCCLUSION_FEATHER_PIXELS : feather, Math.max(0, this.distance[i]) * pixelSize) * 255) : 0;
      this.pixels[i * 4 + 1] = this.inside[i] ? 255 : 0;
      this.pixels[i * 4 + 2] = 0; this.pixels[i * 4 + 3] = 0;
    }
    // Broad feather at the view/range edge, small penumbra at actual cover.
    // A 60px inward feather around every prop used to create a dark ambient ring.
    if (unobstructedCone) {
      this.rasterizeDistance(unobstructedCone);
      const sx = VIEW_WIDTH / this.width, sy = VIEW_HEIGHT / this.height;
      for (let i = 0; i < this.distance.length; i++) this.pixels[i * 4] = Math.round(this.pixels[i * 4] * this.envelopeAt(i, sx, sy));
    }
    return this.pixels;
  }
  addSurfaces(surfaces: LightingSurface[]) {
    const sx = VIEW_WIDTH / this.width, sy = VIEW_HEIGHT / this.height;
    for (const { polygon, brightness } of surfaces) {
      if (brightness <= 0 || polygon.length !== 4) continue;
      const minX = Math.max(0, Math.floor(Math.min(...polygon.map(p => p.x)) / sx));
      const maxX = Math.min(this.width - 1, Math.ceil(Math.max(...polygon.map(p => p.x)) / sx));
      const minY = Math.max(0, Math.floor(Math.min(...polygon.map(p => p.y)) / sy));
      const maxY = Math.min(this.height - 1, Math.ceil(Math.max(...polygon.map(p => p.y)) / sy));
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const px = (x + 0.5) * sx, py = (y + 0.5) * sy;
        const contained = polygon.every((a, i) => { const b = polygon[(i + 1) % 4]; return (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x) >= -0.001; });
        if (contained) {
          const cell = y * this.width + x, index = cell * 4 + 2;
          const envelope = this.hasEnvelope ? this.envelopeAt(cell, sx, sy) : 1;
          this.pixels[index] = Math.max(this.pixels[index], Math.round(brightness * envelope * 255));
        }
      }
    }
    return this.pixels;
  }
  mergeLight(other: VisibilityField, intensity = 1) {
    const source = other.pixels, target = this.pixels;
    for (let i = 0; i < target.length; i += 4) {
      target[i] = Math.max(target[i], Math.round(source[i] * intensity));
      target[i + 1] = Math.max(target[i + 1], source[i + 1]);
      target[i + 2] = Math.max(target[i + 2], Math.round(source[i + 2] * intensity));
    }
  }
  addAerialSight(origin: Point, radius: number, intensity: number) {
    const sx = VIEW_WIDTH / this.width, sy = VIEW_HEIGHT / this.height;
    const minX = Math.max(0, Math.floor((origin.x - radius) / sx));
    const maxX = Math.min(this.width - 1, Math.ceil((origin.x + radius) / sx));
    const minY = Math.max(0, Math.floor((origin.y - radius) / sy));
    const maxY = Math.min(this.height - 1, Math.ceil((origin.y + radius) / sy));
    const radius2 = radius * radius;
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const dx = (x + 0.5) * sx - origin.x, dy = (y + 0.5) * sy - origin.y;
      const distance2 = dx * dx + dy * dy;
      if (distance2 >= radius2) continue;
      const light = smoothstep(0, FEATHER_PIXELS, radius - Math.sqrt(distance2)) * intensity;
      const index = (y * this.width + x) * 4;
      this.pixels[index] = Math.max(this.pixels[index], Math.round(light * 255));
      this.pixels[index + 1] = 255;
    }
  }
  addDoorLamp(lamp: Point, viewer: Point, blocks: Rect[]) {
    // A local light remains on the viewer's side of solid cover and carries no actor visibility.
    if (dist(lamp, viewer) > 310 || !lineClear(viewer, lamp, blocks)) return;
    const screenX = lamp.x - viewer.x + VIEW_WIDTH / 2, screenY = lamp.y - viewer.y + VIEW_HEIGHT / 2;
    const sx = VIEW_WIDTH / this.width, sy = VIEW_HEIGHT / this.height;
    const minX = Math.max(0, Math.floor((screenX - DOOR_LAMP_RADIUS) / sx));
    const minY = Math.max(0, Math.floor((screenY - DOOR_LAMP_RADIUS) / sy));
    const maxX = Math.min(this.width - 1, Math.floor((screenX + DOOR_LAMP_RADIUS) / sx));
    const maxY = Math.min(this.height - 1, Math.floor((screenY + DOOR_LAMP_RADIUS) / sy));
    const localBlocks = blocks.filter(r => dist(lamp, closestOnRect(lamp, r)) <= DOOR_LAMP_RADIUS);
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const dx = (x + 0.5) * sx - screenX, dy = (y + 0.5) * sy - screenY;
      if (dx * dx + dy * dy <= DOOR_LAMP_RADIUS ** 2 && lineClear(lamp, { x: lamp.x + dx, y: lamp.y + dy }, localBlocks)) {
        this.pixels[(y * this.width + x) * 4 + 3] = 255;
      }
    }
  }
  sample(x: number, y: number, strict = false): number {
    if (x < 0 || x >= VIEW_WIDTH || y < 0 || y >= VIEW_HEIGHT) return 0;
    const gx = x / VIEW_WIDTH * this.width - 0.5, gy = y / VIEW_HEIGHT * this.height - 0.5;
    const at = (ix: number, iy: number) => this.pixels[(clamp(iy, 0, this.height - 1) * this.width + clamp(ix, 0, this.width - 1)) * 4 + (strict ? 1 : 0)] / 255;
    if (strict) return at(Math.floor(gx + 0.5), Math.floor(gy + 0.5));
    const ix = Math.floor(gx), iy = Math.floor(gy), tx = gx - ix, ty = gy - iy;
    return at(ix, iy) * (1 - tx) * (1 - ty) + at(ix + 1, iy) * tx * (1 - ty) + at(ix, iy + 1) * (1 - tx) * ty + at(ix + 1, iy + 1) * tx * ty;
  }
}

export type LightingSurface = { polygon: Point[]; brightness: number };
/** Treat the visible top of an opaque prop as artwork, not as space behind it.
 * Test against every OTHER blocker, so an intervening wall/closed door still wins.
 */
export function visibleSurfaces(origin: Point, facing: number, blocks: Rect[], visionRange = DEFAULT_VISION_RANGE): LightingSurface[] {
  const surfaces: LightingSurface[] = [];
  for (const block of blocks) {
    if (dist(origin, closestOnRect(origin, block)) > visionRange + 10) continue;
    const corners = rectCorners(block), center = { x: corners.reduce((n, p) => n + p.x, 0) / 4, y: corners.reduce((n, p) => n + p.y, 0) / 4 };
    const samples = [closestOnRect(origin, block), center, ...corners, ...corners.map((p, i) => ({ x: (p.x + corners[(i + 1) % 4].x) / 2, y: (p.y + corners[(i + 1) % 4].y) / 2 }))];
    const others = blocks.filter(r => r !== block);
    let brightness = 0;
    for (const sample of samples) {
      // Keep samples inside the top, away from corner-touching adjacent geometry.
      const q = { x: sample.x * 0.99 + center.x * 0.01, y: sample.y * 0.99 + center.y * 0.01 };
      const range = sightRange(Math.atan2(q.y - origin.y, q.x - origin.x), facing, visionRange), distance = dist(origin, q);
      const exposure = smoothstep(0, localFeather(FEATHER_PIXELS, peripheralRange(visionRange), distance * distance), range - distance);
      if (exposure > brightness && lineClear(origin, q, others)) brightness = exposure;
      if (brightness >= 1) break;
    }
    if (brightness > 0) surfaces.push({ polygon: corners, brightness });
  }
  return surfaces;
}

export type FootPose = { leftFoot: number; rightFoot: number };
export type ActorPose = FootPose & { scale: number; rollFrame: number; angle: number; offsetX: number; offsetY: number };
type MotionActor = Point & { angle: number; hp: number; dashTime?: number; dashX?: number; dashY?: number };
const restPose = (): ActorPose => ({ scale: 1, leftFoot: 0, rightFoot: 0, rollFrame: -1, angle: 0, offsetX: 0, offsetY: 0 });
/** Shared by players and enemies. Only real travel advances the walking cycle. */
export class ActorMotion {
  pose = restPose();
  private phase = 0; private weight = 0;
  private previous?: Point;
  private recoilTime = 0; private recoilDuration = 0.1; private recoilKick = 0; private recoilTurn = 0; private shots = 0;
  reset(p: Point) { this.previous = { ...p }; this.phase = this.weight = this.shots = this.recoilTime = 0; this.pose = restPose(); }
  suspend() { this.recoilTime = 0; this.pose.offsetX = this.pose.offsetY = this.pose.leftFoot = this.pose.rightFoot = 0; }
  shoot(p: MotionActor, heroId: HeroId) {
    if (p.hp <= 0 || (p.dashTime || 0) > 0) return;
    this.recoilDuration = heroId === ENGINEER_ID ? 0.13 : 0.105;
    this.recoilTime = this.recoilDuration;
    this.recoilKick = heroId === ENGINEER_ID ? 2.3 : heroId === HEROINE_ID ? 1 : 1.8;
    this.recoilTurn = (heroId === ENGINEER_ID ? 1.8 : heroId === HEROINE_ID ? 0.8 : 1.2) * Math.PI / 180 * (++this.shots % 2 ? 1 : -1);
    this.applyRecoil(p);
  }
  private applyRecoil(p: MotionActor) {
    const strength = (this.recoilTime / this.recoilDuration) ** 2;
    this.pose.offsetX = strength ? -Math.cos(p.angle) * this.recoilKick * strength : 0;
    this.pose.offsetY = strength ? -Math.sin(p.angle) * this.recoilKick * strength : 0;
    this.pose.angle = p.angle + this.recoilTurn * strength;
  }
  step(dt: number, p: MotionActor, active = true) {
    const distance = this.previous ? dist(p, this.previous) : 0; this.previous = { x: p.x, y: p.y };
    const rolling = (p.dashTime || 0) > 0 && p.hp > 0;
    const moving = active && distance > 0.05 && !rolling && p.hp > 0;
    this.weight += ((moving ? 1 : 0) - this.weight) * (1 - Math.exp(-dt * 22));
    if (moving) this.phase += distance / 96 * TAU;
    const progress = clamp(1 - (p.dashTime || 0) / ROLL_DURATION, 0, 1);
    this.pose.rollFrame = rolling ? progress < 0.25 ? 0 : progress < 0.72 ? 1 : 2 : -1;
    // The withdrawing foot is hidden under the torso, never dragged behind it.
    const stride = Math.sin(this.phase);
    this.pose.leftFoot = moving ? Math.max(0, stride) * this.weight : 0;
    this.pose.rightFoot = moving ? Math.max(0, -stride) * this.weight : 0;
    this.pose.scale = rolling ? 1 - Math.sin(progress * Math.PI) * 0.06 : 1 + (-0.035 * (0.5 - 0.5 * Math.cos(this.phase)) + 0.012 * Math.max(0, Math.sin(this.phase))) * this.weight;
    this.recoilTime = Math.max(0, this.recoilTime - dt);
    if (!active || rolling || p.hp <= 0) this.recoilTime = 0;
    this.applyRecoil(p);
    if (rolling) this.pose.angle = Math.atan2(p.dashY || 0, p.dashX || 0);
  }
}

export type WeaponMount = { muzzle: Point; eject: Point; angle: number };
// Measured from the existing 1254px operator sprite: 82px size, anchor(.36,.5),
// barrel tip at approximately (1235,627). Procedural weapons use their own tip.
export function weaponMount(p: Point & { angle: number }, scale: number, raster: boolean, heroId: HeroId = 0, pose?: ActorPose): WeaponMount {
  const angle = pose?.angle ?? p.angle, c = Math.cos(angle), s = Math.sin(angle);
  const point = (x: number, y: number): Point => ({ x: p.x + (pose?.offsetX || 0) + (x * c - y * s) * scale, y: p.y + (pose?.offsetY || 0) + (x * s + y * c) * scale });
  return { muzzle: raster ? heroId === HEROINE_ID ? point(51, 1) : point(51.25, 0) : point(41, -12), eject: raster ? heroId === HEROINE_ID ? point(33, -2) : point(23, -2) : point(22, -12), angle };
}
export type SmokePuff = Point & { vx: number; vy: number; life: number; max: number; radius: number };
export type Casing = Point & { vx: number; vy: number; z: number; vz: number; angle: number; spin: number; life: number; bounces: number; shell: boolean };
export class WeaponEffects {
  smoke: SmokePuff[] = []; casings: Casing[] = [];
  flash = 0; shotCount = 0; heroId: HeroId = 0;
  private flashTime = 0;
  shoot(mount: WeaponMount, heroId: HeroId) {
    this.heroId = heroId; this.shotCount++; this.flashTime = 0.045; this.flash = 1;
    const c = Math.cos(mount.angle), s = Math.sin(mount.angle);
    const variation = this.shotCount % 3;
    for (let i = 0; i < 3; i++) this.smoke.push({ ...mount.muzzle, vx: c * (28 + i * 14) - s * (i - 1) * 9, vy: s * (28 + i * 14) + c * (i - 1) * 9, life: 0.24 + i * 0.055, max: 0.24 + i * 0.055, radius: 2 + i * 0.8 });
    this.casings.push({ ...mount.eject, vx: s * (76 + variation * 13) - c * 22, vy: -c * (76 + variation * 13) - s * 22, z: 3, vz: 95 + variation * 9, angle: mount.angle, spin: 13 + variation * 3, life: 1.65, bounces: 0, shell: heroId === ENGINEER_ID });
    if (this.smoke.length > 24) this.smoke.splice(0, this.smoke.length - 24);
    if (this.casings.length > 32) this.casings.splice(0, this.casings.length - 32);
  }
  step(dt: number, blocks: Rect[]) {
    this.flashTime = Math.max(0, this.flashTime - dt); this.flash = this.flashTime / 0.045;
    for (const f of this.smoke) {
      const next = { x: f.x + f.vx * dt, y: f.y + f.vy * dt };
      if (lineClear(f, next, blocks)) { f.x = next.x; f.y = next.y; } else f.life = 0;
      f.vx *= Math.exp(-dt * 5); f.vy *= Math.exp(-dt * 5); f.life -= dt;
    }
    for (const f of this.casings) {
      const next = { x: f.x + f.vx * dt, y: f.y + f.vy * dt };
      if (lineClear(f, next, blocks)) { f.x = next.x; f.y = next.y; } else { f.vx *= -0.25; f.vy *= -0.25; }
      f.vz -= 540 * dt; f.z += f.vz * dt; f.angle += f.spin * dt; f.life -= dt;
      if (f.z < 0) { f.z = 0; if (f.bounces++ === 0) { f.vz = Math.abs(f.vz) * 0.32; f.vx *= 0.45; f.vy *= 0.45; f.spin *= 0.4; } else { f.vz = 0; f.vx *= Math.exp(-dt * 28); f.vy *= Math.exp(-dt * 28); f.spin *= Math.exp(-dt * 28); } }
    }
    this.smoke = this.smoke.filter(f => f.life > 0); this.casings = this.casings.filter(f => f.life > 0);
  }
  clear() { this.smoke = []; this.casings = []; this.flashTime = this.flash = 0; }
}

/** Pure visual state: none of these offsets/timers mutate the combat simulation. */
export class CombatFeedback {
  x = 0; y = 0;
  private vx = 0; private vy = 0;
  private hitTime = 0; private muzzleTime = 0; private shotCount = 0;
  private hitDuration = 0.18;
  private clock = 0; private alarm = false; private active = false;
  hit = 0; lowHealth = 0; muzzle = 0; healthSeverity = 0;
  private impulse(x: number, y: number) {
    this.x += x; this.y += y;
    const magnitude = Math.hypot(this.x, this.y);
    if (magnitude > 7) { this.x *= 7 / magnitude; this.y *= 7 / magnitude; }
  }
  shoot(angle: number, heroId: HeroId) {
    const amplitude = heroId === HEROINE_ID ? 1.15 : heroId === ENGINEER_ID ? 5.7 : 3.2;
    const sideways = ++this.shotCount % 2 ? 0.22 : -0.22;
    this.impulse(-Math.cos(angle) * amplitude - Math.sin(angle) * sideways, -Math.sin(angle) * amplitude + Math.cos(angle) * sideways);
    this.muzzleTime = 0.065;
  }
  heavyFootfall(source: Point, listener: Point) {
    const distance = dist(source, listener);
    const strength = 6.2 * (1 - clamp((distance - 65) / 690, 0, 1)) ** 1.6;
    if (strength <= 0) return;
    const angle = Math.atan2(listener.y - source.y, listener.x - source.x);
    this.impulse(Math.cos(angle) * strength * 0.65, Math.sin(angle) * strength * 0.65 - strength * 0.55);
  }
  explosion(source: Point, listener: Point, obstructed: boolean, scale = 1) {
    const strength = 7 * scale * (1 - clamp(dist(source, listener) / (520 * scale), 0, 1)) * (obstructed ? 0.42 : 1);
    const angle = Math.atan2(listener.y - source.y, listener.x - source.x);
    this.impulse(Math.cos(angle) * strength, Math.sin(angle) * strength - strength * 0.3);
  }
  hurt(hpRatio = 1, angle?: number) {
    this.hitDuration = 0.18 + 0.24 * clamp(1 - hpRatio, 0, 1) ** 2;
    this.hitTime = this.hitDuration;
    if (angle === undefined) this.impulse(this.shotCount % 2 ? -3.5 : 3.5, 2.6);
    else this.impulse(Math.cos(angle) * 3.9, Math.sin(angle) * 3.9);
  }
  step(dt: number, hpRatio: number, active: boolean) {
    this.active = active;
    if (!active) { this.suspend(); return; }
    const elapsed = clamp(dt, 0, 0.05);
    const count = Math.max(1, Math.ceil(elapsed * 120)), step = elapsed / count;
    for (let i = 0; i < count; i++) {
      this.vx += (-900 * this.x - 50 * this.vx) * step;
      this.vy += (-900 * this.y - 50 * this.vy) * step;
      this.x += this.vx * step; this.y += this.vy * step;
    }
    this.hitTime = Math.max(0, this.hitTime - elapsed); this.muzzleTime = Math.max(0, this.muzzleTime - elapsed); this.clock += elapsed;
    if (hpRatio <= 0 || hpRatio >= 0.30) this.alarm = false;
    else if (hpRatio <= 0.25) this.alarm = true;
    this.healthSeverity = clamp(1 - hpRatio / 0.30, 0, 1);
    const phase = this.clock % 1.5;
    const pulseLength = 0.53 + 0.55 * this.healthSeverity;
    this.lowHealth = this.alarm && phase < pulseLength
      ? Math.sin(phase / pulseLength * Math.PI) ** 2 * (0.68 + 0.31 * this.healthSeverity) : 0;
    this.hit = (this.hitTime / this.hitDuration) ** 1.4;
    this.muzzle = (this.muzzleTime / 0.065) ** 1.4;
  }
  suspend() { this.active = false; this.x = this.y = this.vx = this.vy = this.hitTime = this.muzzleTime = this.hit = this.lowHealth = this.muzzle = this.healthSeverity = 0; }
  reset() { this.suspend(); this.clock = 0; this.alarm = false; this.shotCount = 0; }
}
