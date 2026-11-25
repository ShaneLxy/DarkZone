import type { Point } from './Core';

export const ESCORT_STOP = 55;
export const ESCORT_TILE = 624;
export const ESCORT_VEHICLE_SCALE = 1.1;
export const ESCORT_GATE_HALF = 108;
export const ESCORT_ENEMY_CAP = 100;
export const ESCORT_EFFECT_CAP = 32;
export const ESCORT_AIR_IMPACT_CAP = 18;
export const ESCORT_AIR_IMPACT_LIFE = .54;
export const ESCORT_BUS = 1;
export const ESCORT_REAR = 2;
export const ESCORT_MUZZLE_TIME = .038;
export const ESCORT_MUZZLE_VARIANTS = 4;
export const ESCORT_CREW_ART = { width: 49, height: 47, anchorX: .36 };
export const ESCORT_CREW_BARREL = (1235 / 1254 - ESCORT_CREW_ART.anchorX) * ESCORT_CREW_ART.width;
export const ESCORT_VEHICLES = [
  { name: '首车悍马', art: 'escort-humvee', y: 149, length: 89, width: 49 },
  { name: '载民大巴', art: 'escort-bus', y: 6, length: 137, width: 59 },
  { name: '装甲运输车', art: 'escort-apc', y: -141, length: 94, width: 57 },
].map(vehicle => ({ ...vehicle, length: vehicle.length * ESCORT_VEHICLE_SCALE, width: vehicle.width * ESCORT_VEHICLE_SCALE }));
const LEAD_TURRET_OFFSET = -2 * ESCORT_VEHICLE_SCALE;
export const ESCORT_ORIGIN = { x: 0, y: ESCORT_VEHICLES[0].y + LEAD_TURRET_OFFSET };
export const ESCORT_TURRET_ANCHOR = .25;
export const ESCORT_TURRETS = [[30, 59], [25, 51]].map(([width, height]) => ({
  width: width * ESCORT_VEHICLE_SCALE,
  height: height * ESCORT_VEHICLE_SCALE,
  barrel: height * ESCORT_VEHICLE_SCALE * (1 - ESCORT_TURRET_ANCHOR - 8 / 477),
}));
const ROAD_SPEED = 95, ESCAPE_SPEED = 115, BRAKE_TIME = 6;
const CREW_WALK = 5, CLEAR_WORK = 5, WITHDRAW = 4.25, RESTART = 2.6;
const CLEAR_WORK_START = ESCORT_STOP + CREW_WALK;
const CLEAR_WORK_END = CLEAR_WORK_START + CLEAR_WORK;
const CREW_FALL_TIMES = [2.72, 3.28] as const;
export const ESCORT_AMBUSH_SIZE = 6;
export const ESCORT_RESUME = CLEAR_WORK_END + WITHDRAW + RESTART;
export const ESCORT_END = ESCORT_RESUME + 82.15;
const ROUND_SPEED = 1320, ROUND_CADENCE = 1 / 17, GUARD_CADENCE = .086;
const GUARD_RANGE = 305;
const WRECK_COAST = 2.25, ENEMY_CELL = 64;
const GATE_TRAVEL = 1.25;
const RAM_SPEED = 54, SIDE_CONTACT_SPEED = 24;
const ESCORT_VIEW_W = 1280, ESCORT_VIEW_H = 720;
const BUS_CONTACTS = [
  ...[-1, 1].flatMap(side => [-40, 0, 40].map(y => ({
    x: side * ESCORT_VEHICLES[ESCORT_BUS].width / 2, y: y * ESCORT_VEHICLE_SCALE, nx: side, ny: 0,
  }))),
  ...[-17, 17].map(x => ({ x: x * ESCORT_VEHICLE_SCALE, y: -ESCORT_VEHICLES[ESCORT_BUS].length / 2, nx: 0, ny: -1 })),
];
const cellKey = (x: number, y: number) => x + y * 4096;
const enemyCell = (enemy: Point) => cellKey(Math.floor(enemy.x / ENEMY_CELL), Math.floor(enemy.y / ENEMY_CELL));
const limit = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const ease = (value: number) => { const t = limit(value, 0, 1); return t * t * (3 - 2 * t); };
const difference = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const TURN_RATE = 2.35, TURN_ACCEL = 7.2;
const AIR_FIRE_CONE = Math.PI / 6, AIR_KEEP_FIRE_CONE = 41 * Math.PI / 180;
const AIR_SHOT_CADENCE = .036, AIR_DAMAGE_CADENCE = .108, AIR_AIM_REFRESH = .14;
const AIR_SPLASH_RADIUS = 76;
export const ESCORT_AIR_CRASH = 29.53;
const LEAP_AT = 27.2, GRAB_AT = 28, LAND_AT = 29.32;
export const ESCORT_SHOCK_SPEED = 535;
const ROADSIDE_CARS = [
  { at: 35, x: 192, angle: -23, explosive: false },
  { at: 42, x: -159, angle: 26, explosive: true },
  { at: ESCORT_RESUME + 14.15, x: 195, angle: -12, explosive: false },
] as const;
const escortHordeEscalation = (time: number) => ease((time - ESCORT_AIR_CRASH - .85) / 5.2);

function rampDistance(time: number, duration: number, speed: number) {
  return time < duration ? speed * time * time / (2 * duration) : speed * (time - duration / 2);
}

function escortRoadDistance(time: number, resumeAt: number) {
  const brake = ESCORT_STOP - BRAKE_TIME;
  if (time < brake) return rampDistance(Math.max(0, time), 5, ROAD_SPEED);
  const brakeElapsed = Math.min(BRAKE_TIME, time - brake);
  return rampDistance(brake, 5, ROAD_SPEED) + ROAD_SPEED * (brakeElapsed - brakeElapsed ** 2 / (2 * BRAKE_TIME)) +
    rampDistance(Math.max(0, time - resumeAt), 5, ESCAPE_SPEED);
}

const STOP_DISTANCE = escortRoadDistance(ESCORT_STOP, ESCORT_RESUME);
export const ESCORT_LOG = STOP_DISTANCE + 254;
const REFUGE_APPROACH = 320, REFUGE_ENTRY_BRAKE = 185, REFUGE_CRAWL = .7;
const REFUGE_BRAKE_OFFSET = 137, REFUGE_STOP_RUN = 105;
const REFUGE_ENTRY_TRAVEL = REFUGE_ENTRY_BRAKE * (1 + REFUGE_CRAWL) / 2;
const REFUGE_COAST_END = REFUGE_ENTRY_BRAKE + (REFUGE_APPROACH + REFUGE_BRAKE_OFFSET - REFUGE_ENTRY_TRAVEL) / REFUGE_CRAWL;
const REFUGE_STOP_INPUT = 2 * REFUGE_STOP_RUN / REFUGE_CRAWL;
export const ESCORT_GATE = escortRoadDistance(ESCORT_END, ESCORT_RESUME) + REFUGE_APPROACH - REFUGE_COAST_END - REFUGE_STOP_INPUT - 15;
export const ESCORT_CHECKPOINT = ESCORT_GATE - 2150;
const AIR_SUPPORT_START = ESCORT_GATE - 1690;

export function escortDistance(time: number, resumeAt = ESCORT_RESUME) {
  const road = escortRoadDistance(time, resumeAt);
  const approachStart = ESCORT_GATE - REFUGE_APPROACH, progress = road - approachStart;
  if (progress <= 0) return road;
  if (progress < REFUGE_ENTRY_BRAKE)
    return road - (1 - REFUGE_CRAWL) * progress ** 2 / (2 * REFUGE_ENTRY_BRAKE);
  if (progress < REFUGE_COAST_END)
    return approachStart + REFUGE_ENTRY_TRAVEL + (progress - REFUGE_ENTRY_BRAKE) * REFUGE_CRAWL;
  const brake = Math.min(1, (progress - REFUGE_COAST_END) / REFUGE_STOP_INPUT);
  return ESCORT_GATE + REFUGE_BRAKE_OFFSET + REFUGE_STOP_RUN * (1 - (1 - brake) ** 2);
}

export function escortShoulder(segment: number, side: number): Point {
  return { x: side * (310 + ((segment * 113 + side * 31) % 110 + 110) % 110),
    y: segment * ESCORT_TILE + 165 + ((segment * 131 + side * 63) % 260 + 260) % 260 };
}

export function escortShoulderVariant(segment: number, side: number) {
  return ((segment + (side > 0 ? 2 : 0)) % 3 + 3) % 3;
}

type VehicleContact = Point & { nx: number; ny: number };
type VehicleSwipe = { vehicle: number; contact: VehicleContact; began: number; landsAt: number; endsAt: number; landed?: boolean };
type VehicleHit = { contact: VehicleContact; at: number; heavy: boolean };
export type EscortEnemy = Point & { type: 'walker' | 'runner' | 'brute'; id: number; hp: number; angle: number; hit: number; attack: number;
  variant: number; push?: Point; steerAt?: number; busSlot?: number; passedGuards?: number; raidRear?: boolean; swipe?: VehicleSwipe; roadside?: number };
type EscortRound = Point & { vx: number; vy: number; left: number; damage: number; travelled: number; tracer: boolean; allied: boolean; airborne: boolean; hits: number[] };
type EscortImpact = Point & { angle: number; age: number; kind: 'dust' | 'metal' | 'hit' | 'burst'; size: number };
type AirImpact = Point & { angle: number; age: number; pavement: boolean; pattern: number };
type EscortFall = Point & Pick<EscortEnemy, 'type' | 'variant' | 'angle'> & { age: number; vx: number; vy: number; broken: boolean };
type CrewAmbusher = Point & Pick<EscortEnemy, 'type' | 'variant'>;
type VehiclePose = Point & { speed: number; angle: number; braking: boolean };
type CivilianVehicle = { hp: number; struck: number; threat?: Point & { range: number }; threatenedSince?: number; nextDamageAt?: number;
  wreck?: VehiclePose & { at: number; side: number } };
type AirPose = Point & { angle: number; visible: boolean; supporting: boolean; scale: number; height: number; grounded: boolean };
type AirGun = ReturnType<typeof escortAircraft>;
type RoadsideCar = Point & { angle: number; at: number; explosive: boolean; spawned: boolean; hitAt?: number; exploded: boolean };
type EscortBlast = Point & { at: number; radius: number; force: number; damage: number; reachedBus: boolean };

function escortAircraft(heading: number) {
  return { heading, turn: 0, nextShot: 0, shots: 0, firing: false, flashAt: -Infinity, pod: -1,
    nextTarget: 0, nextDamage: 0, target: undefined as Point | undefined, aim: undefined as Point | undefined };
}

export function escortContactPoint(pose: VehiclePose, contact: VehicleContact, distance = 0): Point {
  const yaw = pose.angle * Math.PI / 180, cos = Math.cos(yaw), sin = Math.sin(yaw);
  const x = contact.x + contact.nx * distance, y = contact.y + contact.ny * distance;
  return { x: pose.x + x * cos - y * sin, y: pose.y + x * sin + y * cos };
}

function vehicleContact(pose: VehiclePose, index: number, unit: Point): VehicleContact {
  const { width, length } = ESCORT_VEHICLES[index], w = width / 2, h = length / 2;
  const yaw = pose.angle * Math.PI / 180, cos = Math.cos(yaw), sin = Math.sin(yaw);
  const dx = unit.x - pose.x, dy = unit.y - pose.y;
  const x = dx * cos + dy * sin, y = -dx * sin + dy * cos;
  if (Math.abs(x) - w > Math.abs(y) - h) {
    const nx = Math.sign(x) || 1;
    return { x: nx * w, y: limit(y, -h, h), nx, ny: 0 };
  }
  const ny = Math.sign(y) || 1;
  return { x: limit(x, -w, w), y: ny * h, nx: 0, ny };
}

export class FrontierEscort {
  time = 0;
  distance = 0;
  enemies: EscortEnemy[] = [];
  rounds: EscortRound[] = [];
  impacts: EscortImpact[] = [];
  airImpacts: AirImpact[] = [];
  fallen: EscortFall[] = [];
  bus: CivilianVehicle = { hp: 100, struck: 0 };
  vehicleHits: (VehicleHit | undefined)[] = ESCORT_VEHICLES.map(() => undefined);
  outcome?: 'won' | 'lost';
  kills = 0;
  heading = Math.PI / 2;
  muzzle = 0;
  muzzleAngle = this.heading;
  muzzleVariant = -1;
  muzzleLength = 1;
  shotsFired = 0;
  readonly casingShots: { origin: Point; angle: number; source: 'rifle' | 'vehicle' | 'air'; side?: number }[] = [];
  rearMuzzle = 0;
  rearHeading = Math.PI / 2;
  rearShotsFired = 0;
  crewGuns = [0, 1].map(() => ({ nextShot: 0, shots: 0, burst: 0, angle: 0, flashAt: -Infinity }));
  private crewAmbush: CrewAmbusher[] = [];
  speed = 0;
  breachAt?: number;
  resumeAt?: number;
  gateOpenedAt?: number;
  gateClosingAt?: number;
  refugeSecuredAt?: number;
  airArrivalAt?: number;
  aircraft = [escortAircraft(.66), escortAircraft(Math.PI - .66)];
  openingAircraft = escortAircraft(.86);
  roadside: RoadsideCar[] = ROADSIDE_CARS.map(car => ({ ...car, y: escortDistance(car.at) + 100, spawned: false, exploded: false }));
  lastBlast?: EscortBlast;
  lastRoadsideHitAt = -Infinity;
  airGrab?: AirPose & { worldY: number };
  airCrashAt?: number;
  private crashPursuit = false;
  private busSlotOwners: (EscortEnemy | undefined)[] = Array(BUS_CONTACTS.length);
  private shot = 0;
  private guardShot = 0;
  private guardTarget?: EscortEnemy;
  private nextWave = 5.5;
  private nextId = 0;
  private wave = 0;
  private airImpactPattern = 0;
  private cover: (Point & { metal: boolean })[] = [];
  private segment = Infinity;
  private enemyCells = new Map<number, EscortEnemy[]>();
  private cellPool: EscortEnemy[][] = [];
  private roundCandidates: EscortEnemy[] = [];

  constructor(private readonly random = Math.random) {}

  get stopped() { return this.time >= ESCORT_STOP && this.time < (this.resumeAt ?? Infinity); }
  get opening() { return limit((this.time - CLEAR_WORK_START) / CLEAR_WORK, 0, 1); }
  get clearanceProgress() { return this.breachAt === undefined ? this.opening : limit((this.breachAt - this.time) / WITHDRAW, 0, 1); }
  get gateY() { return ESCORT_GATE - this.distance; }
  get gateOpen() {
    if (this.gateOpenedAt === undefined) return 0;
    if (this.gateClosingAt !== undefined) return 1 - ease((this.time - this.gateClosingAt) / GATE_TRAVEL);
    return ease((this.time - this.gateOpenedAt) / GATE_TRAVEL);
  }
  get refugePhase() {
    if (this.refugeSecuredAt !== undefined) return 'secure';
    if (this.gateClosingAt !== undefined) return 'closing';
    if (this.gateOpenedAt !== undefined) return 'entry';
    return this.airArrivalAt !== undefined ? 'support' : this.distance >= ESCORT_CHECKPOINT - 210 ? 'checkpoint' : 'road';
  }
  camera(viewHeight: number) {
    const close = ease((this.time - .55) / 2.3);
    const roadside = ease((this.time - ESCORT_STOP + 4) / 2.8) * (1 - ease((this.time - ESCORT_STOP - 2) / 3));
    const roadY = close * (70 - roadside * 24), roadScale = 1 + close * (.32 - roadside * .13);
    const gateShot = 1 - ease((this.gateY - 360) / 180), gateScale = 1.15;
    const gateCameraY = this.gateY - viewHeight / (6 * gateScale);
    return { x: 0, y: roadY + (gateCameraY - roadY) * gateShot, scale: roadScale + (gateScale - roadScale) * gateShot, shake: 1 - gateShot };
  }
  get visibleEnemies() {
    const camera = this.camera(ESCORT_VIEW_H);
    return this.enemies.reduce((count, enemy) => count + Number(enemy.hp > 0 &&
      Math.abs(enemy.x) * camera.scale < ESCORT_VIEW_W / 2 &&
      Math.abs(enemy.y - camera.y) * camera.scale < ESCORT_VIEW_H / 2), 0);
  }
  aircraftPose(index: number): AirPose {
    if (index === 2) return this.openingAirPose();
    const age = this.time - (this.airArrivalAt ?? Infinity), side = index ? 1 : -1;
    const arrival = ease((age - index * .28) / 2.85);
    const departure = ease((age - 14.1 - index * .38) / 4.1);
    const drift = Math.sin(this.time * .9 + index * 1.6) * 12 * arrival;
    return { x: side * (795 - arrival * 575 + departure * 475) + drift, y: -42 + arrival * (142 - index * 37) + departure * 330,
      angle: this.aircraft[index].heading * 180 / Math.PI - 90, scale: 1, height: 1, grounded: false,
      visible: age >= 0 && departure < 1, supporting: age > 1.4 + index * .35 && age < 15.4 && this.gateClosingAt === undefined };
  }
  aircraftMuzzle(index: number, pose = this.aircraftPose(index)): Point {
    return this.airMuzzle(pose, this.airGun(index).pod);
  }
  airGun(index: number) { return index === 2 ? this.openingAircraft : this.aircraft[index]; }

  private airMuzzle(pose: AirPose, pod: number): Point {
    const yaw = pose.angle * Math.PI / 180, x = pod * 30 * pose.scale, y = 45 * pose.scale;
    return { x: pose.x + x * Math.cos(yaw) - y * Math.sin(yaw), y: pose.y + x * Math.sin(yaw) + y * Math.cos(yaw) };
  }

  openingAirPose(time = this.time): AirPose {
    const grab = this.airGrab;
    if (!grab) {
      const arrival = ease((this.time - .35) / 2.75), drift = Math.sin(this.time * .83) * 13 * arrival;
      return { x: -575 + 355 * arrival + drift, y: -45 + 215 * arrival + Math.sin(this.time * .67) * 16,
        angle: this.openingAircraft.heading * 180 / Math.PI - 90, visible: this.time < GRAB_AT + .2, supporting: this.time > 1.65,
        scale: 1, height: 1, grounded: false };
    }
    const drop = limit((time - GRAB_AT) / (LAND_AT - GRAB_AT), 0, 1);
    const slide = 1 - (1 - limit((time - LAND_AT) / .52, 0, 1)) ** 2;
    const altitude = 1 - drop ** 1.8;
    return { x: grab.x - 44 * drop ** 1.35 - 42 * slide, y: grab.worldY - this.distance + drop * 89 + slide * 27,
      angle: grab.angle - 228 * drop ** 1.56 - 25 * slide, scale: .72 + .28 * altitude, height: altitude,
      visible: true, supporting: false, grounded: time >= LAND_AT };
  }

  airAmbushPose() {
    const age = this.time - LEAP_AT;
    if (age < -1.32 || this.time > LAND_AT + .31) return;
    const helicopter = this.aircraftPose(2), run = ease((age + 1.32) / 1.08);
    const leap = ease(age / (GRAB_AT - LEAP_AT));
    const slip = ease((this.time - GRAB_AT - .46) / .93);
    const x = -513 + run * 194 + (helicopter.x - 29 + 319) * leap - slip * 58;
    const y = 152 + (helicopter.y - 8 - 152) * leap - slip * 36;
    return { x, y, angle: -67 - 21 * leap + slip * 25, height: leap * (1 - slip), crouch: age < 0 ? 1 - ease(Math.abs(age) / .24) : 0 };
  }

  roadsidePose(index: number) {
    const car = this.roadside[index], age = this.time - (car.hitAt ?? Infinity);
    const skid = 1 - (1 - limit(age / .67, 0, 1)) ** 2, side = Math.sign(car.x);
    return { x: car.x + side * 75 * skid, y: car.y - this.distance - 41 * skid, angle: car.angle - side * 79 * skid, age };
  }

  blastFeedback(point: Point) {
    const blast = this.lastBlast;
    if (!blast) return { x: 0, y: 0, yaw: 0, shake: 0 };
    const dx = point.x - blast.x, dy = point.y + this.distance - blast.y, distance = Math.hypot(dx, dy);
    const age = this.time - blast.at - distance / ESCORT_SHOCK_SPEED;
    if (age < 0 || age > .74 || distance >= blast.radius) return { x: 0, y: 0, yaw: 0, shake: 0 };
    const force = blast.force * (1 - distance / blast.radius) * (1 - age / .74) ** 2;
    const sway = Math.cos(age * 23) * force;
    return { x: dx / Math.max(1, distance) * sway, y: dy / Math.max(1, distance) * sway * .58,
      yaw: Math.sign(dx) * sway * .64, shake: force * 1.27 };
  }
  get clearPhase() {
    if (this.time < ESCORT_STOP - BRAKE_TIME) return 'road';
    if (this.time < ESCORT_STOP) return 'braking';
    if (this.resumeAt !== undefined && this.time >= this.resumeAt) return 'outbound';
    if (this.breachAt !== undefined) return this.time < this.breachAt ? 'withdrawing' : 'cleared';
    return this.time < ESCORT_STOP + CREW_WALK ? 'dismount' : 'working';
  }

  vehiclePose(index: number): VehiclePose {
    const vehicle = ESCORT_VEHICLES[index], wreck = index === ESCORT_BUS ? this.bus.wreck : undefined;
    if (wreck) {
      const age = Math.max(0, this.time - wreck.at), coast = limit(age / WRECK_COAST, 0, 1);
      const skid = 1 - (1 - coast) ** 2.4;
      return { x: wreck.x + (wreck.side * 245 - wreck.x) * skid + Math.sin(age * 14) * 6 * (1 - coast) * coast,
        y: wreck.y - this.distance + (wreck.speed * 1.05 + 16) * skid,
        speed: wreck.speed * (1 - coast) ** 1.4,
        angle: wreck.angle - wreck.side * 32 * skid + Math.sin(age * 18) * 12 * (1 - coast) * coast,
        braking: false };
    }
    const lag = index * .34, clock = this.time - lag, resumeAt = this.resumeAt ?? Infinity;
    const travel = escortDistance(clock, resumeAt);
    const speed = (travel - escortDistance(clock - .05, resumeAt)) * 20;
    const compression = limit((lag * ROAD_SPEED - (this.distance - travel)) * .55, -index * 5, index * 15);
    const braking = clock >= ESCORT_STOP - BRAKE_TIME && clock < resumeAt;
    const stagger = ease((clock - ESCORT_STOP + 2.4) / 3.2) * (1 - ease((clock - resumeAt) / 4));
    const lane = [0, -23, 36][index];
    const y = vehicle.y + compression;
    let detour = 0;
    if (index === ESCORT_REAR && this.bus.wreck) {
      const disabled = this.vehiclePose(ESCORT_BUS);
      if (Math.abs(disabled.x) < 105)
        detour = -this.bus.wreck.side * 44 * (1 - ease((Math.abs(disabled.y - y) - 84) / 85));
    }
    return { x: lane * stagger + detour, y, speed, braking,
      angle: detour * .13 + lane * .22 * (stagger - ease((clock - ESCORT_STOP) / 3) * (1 - ease((clock - resumeAt) / 4))) };
  }
  get gunOrigin() {
    const car = this.vehiclePose(0);
    const offset = this.blastFeedback(car);
    return escortContactPoint({ ...car, x: car.x + offset.x, y: car.y + offset.y }, { x: 0, y: LEAD_TURRET_OFFSET, nx: 0, ny: 1 });
  }
  get rearGunOrigin() {
    const car = this.vehiclePose(ESCORT_REAR), offset = this.blastFeedback(car);
    return { x: car.x + offset.x, y: car.y + offset.y };
  }
  get gunKick() { return 42 * ESCORT_VEHICLE_SCALE * .035 * this.muzzle / ESCORT_MUZZLE_TIME; }
  crewPose(index: number) {
    const side = index ? 1 : -1, travel = this.time - ESCORT_STOP - index * .4;
    const approach = ease((travel - 1.1) / 3.6), out = ease(travel / 1.15);
    const retreatTime = this.breachAt === undefined ? -Infinity : this.time - (this.breachAt - WITHDRAW);
    const fallAge = retreatTime - CREW_FALL_TIMES[index];
    const back = ease(retreatTime / CREW_FALL_TIMES[index]);
    const working = this.clearPhase === 'working' && (this.opening < .5 ? 0 : 1) === index;
    const armed = out > .43 && fallAge < 0 && !working;
    const gun = this.crewGuns[index], aiming = armed && this.time - gun.flashAt < .32;
    const moving = fallAge < 0 && (travel >= 0 && travel < CREW_WALK || back > 0 && back < 1);
    const scaleX = .96 + (moving ? .04 * Math.sin(this.time * 18 + index) : 0);
    const y = 145 + 85 * approach - 55 * back - Math.max(0, this.distance - STOP_DISTANCE);
    return { x: side * (22 + 37 * out + 116 * approach - 69 * back),
      y, angle: fallAge >= 0 ? side * 112 : aiming ? gun.angle * 180 / Math.PI : working ? side * -15 : back > 0 ? side * 129 : side * -46,
      armed, fallAge, moving, scaleX,
      visible: travel >= 0 && y > -430 };
  }

  crewAmbushPose(index: number) {
    const member = this.crewAmbush[index];
    if (!member || this.breachAt === undefined) return;
    const team = index < 3 ? 0 : 1, slot = index % 3, side = team ? 1 : -1;
    const crew = this.crewPose(team), elapsed = this.time - this.breachAt + WITHDRAW;
    const delay = slot * .19, lunge = ease((crew.fallAge + .42) / .41) * (1 - ease((crew.fallAge - .09) / .35));
    const arrival = limit((elapsed - delay) / (CREW_FALL_TIMES[team] - .34 - delay), 0, 1);
    const scatter = ease((this.time - this.breachAt) / .48);
    const tx = crew.x + side * ([31, -14, 19][slot] - lunge * (slot === 0 ? 14 : 6));
    const ty = crew.y + [-8, -31, 27][slot] * (1 - lunge * .3);
    const x = member.x + (tx - member.x) * arrival + side * scatter * (44 + slot * 11);
    const y = member.y + (ty - member.y) * arrival + scatter * (slot - 1) * 41;
    return { x, y, angle: Math.atan2(crew.y - y, crew.x - x), type: member.type, variant: member.variant,
      gait: arrival > 0 && arrival < 1 ? Math.sin(this.time * 19 + index * 3) * .05 : lunge * .08,
      opacity: 1 - scatter };
  }

  step(dt: number, angle: number, firing: boolean) {
    if (!this.outcome) this.advance(dt, angle, firing);
  }

  stepArrival(dt: number) {
    if (this.outcome === 'won') this.advance(dt, this.heading, false);
  }

  private advance(dt: number, angle: number, firing: boolean) {
    if (dt <= 0) return;
    this.casingShots.length = 0;
    const travel = escortDistance(this.time += dt, this.resumeAt ?? Infinity);
    const scroll = travel - this.distance;
    this.distance = travel;
    this.speed = scroll / dt;
    this.updateCover();
    this.shot -= dt; this.guardShot -= dt;
    this.muzzle = Math.max(0, this.muzzle - dt);
    this.rearMuzzle = Math.max(0, this.rearMuzzle - dt);
    this.heading = angle;
    for (const impact of this.impacts) { impact.y -= scroll; impact.age += dt; }
    this.impacts = this.impacts.filter(impact => impact.age < (impact.kind === 'burst' ? .52 : .3));
    for (const impact of this.airImpacts) { impact.y -= scroll; impact.age += dt; }
    this.airImpacts = this.airImpacts.filter(impact => impact.age < ESCORT_AIR_IMPACT_LIFE);
    for (const fall of this.fallen) {
      fall.x += fall.vx * dt; fall.y += fall.vy * dt - scroll;
      fall.vx *= Math.max(0, 1 - dt * 4); fall.vy *= Math.max(0, 1 - dt * 4); fall.age += dt;
    }
    this.fallen = this.fallen.filter(fall => fall.age < 1.5 && fall.y > -440);
    if (this.breachAt === undefined && this.time >= CLEAR_WORK_END && this.bus.hp > 0) this.finishArming();
    if (this.breachAt !== undefined && this.time >= this.breachAt + .48) this.crewAmbush.length = 0;
    if (this.crewAmbush.length) for (let i = 0; i < CREW_FALL_TIMES.length; i++) {
      const pose = this.crewPose(i);
      if (pose.fallAge >= 0 && pose.fallAge < dt) this.impact(pose, i ? -2.6 : -.54, 'hit', .8);
    }
    if (this.bus.hp > 0 && this.time >= this.nextWave && this.gateY > 620) this.spawnWave();
    const bus = this.bus;
    bus.struck = Math.max(0, bus.struck - dt);
    bus.threat = undefined;
    for (const bucket of this.enemyCells.values()) { bucket.length = 0; this.cellPool.push(bucket); }
    this.enemyCells.clear();
    this.busSlotOwners.fill(undefined);
    for (const enemy of this.enemies) {
      enemy.y -= scroll;
      this.indexEnemy(enemy, enemyCell(enemy));
      if (enemy.hp > 0 && !enemy.push && enemy.busSlot !== undefined) this.busSlotOwners[enemy.busSlot] = enemy;
      else enemy.busSlot = undefined;
    }
    const lead = this.vehiclePose(0), transport = this.vehiclePose(ESCORT_BUS), rear = this.vehiclePose(ESCORT_REAR);
    const vehicles = [lead, transport, rear];
    this.stepRoadside(transport);
    this.stepRefuge(lead, rear);
    const outside = this.gateY < transport.y && this.gateY > -360;
    const pursuit = outside ? { ...transport, y: this.gateY - 46 } : transport;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      if (this.touchMovingVehicle(enemy, enemy.y + scroll, vehicles)) continue;
      const from = enemyCell(enemy);
      if (enemy.roadside !== undefined && !enemy.push) {
        this.rushRoadside(enemy, dt, from);
        continue;
      }
      const pursuitSprint = enemy.type === 'runner' && enemy.y < rear.y + 58 && rear.speed < 86;
      const speed = enemy.type === 'brute' ? 91 : enemy.type === 'runner' ? pursuitSprint ? 183 : 150 : 122;
      if (!enemy.push && (Math.abs(enemy.x) > 545 || enemy.y < -285 || enemy.y > 410)) {
        if ((enemy.steerAt ?? 0) <= this.time) {
          const target = enemy.raidRear && !outside ? rear : pursuit;
          enemy.angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
          enemy.steerAt = this.time + .14 + (enemy.id % 4) * .025;
        }
        this.positionEnemy(enemy, enemy.x + Math.cos(enemy.angle) * speed * dt, enemy.y + Math.sin(enemy.angle) * speed * dt, from);
        continue;
      }
      enemy.attack -= dt;
      enemy.hit = Math.max(0, enemy.hit - dt);
      if (enemy.push) {
        enemy.swipe = undefined;
        const oldY = enemy.y;
        this.moveEnemy(enemy, Math.atan2(enemy.push.y, enemy.push.x), Math.hypot(enemy.push.x, enemy.push.y) * dt, from);
        if (enemy.hit <= 0) enemy.push = undefined;
        this.touchMovingVehicle(enemy, oldY, vehicles);
        continue;
      }
      const range = Math.hypot(transport.x - enemy.x, transport.y - enemy.y);
      const protectedBus = this.gateClosingAt !== undefined || outside && enemy.y < this.gateY - 10;
      if (!protectedBus && !enemy.raidRear && bus.hp > 0 && range < 198 && range < (bus.threat?.range ?? Infinity)) {
        bus.threat = { x: enemy.x, y: enemy.y, range };
        bus.threatenedSince ??= this.time;
      }
      if (enemy.swipe) {
        if ((!protectedBus || enemy.swipe.vehicle !== ESCORT_BUS) && this.time < enemy.swipe.endsAt) {
          this.landVehicleSwipe(enemy, vehicles[enemy.swipe.vehicle]);
          continue;
        }
        enemy.swipe = undefined;
      }
      const logY = ESCORT_LOG - this.distance;
      const behindLog = (this.breachAt === undefined || this.time < this.breachAt) && enemy.y > logY - 2 && Math.abs(enemy.x) < 232;
      const target = behindLog ? { x: enemy.x < 0 ? -246 : 246, y: Math.max(enemy.y, logY + 19) } :
        protectedBus ? { x: limit(enemy.x, -126, 126), y: this.gateY - 43 } :
          enemy.raidRear ? this.raidArmoredVehicle(enemy, rear) :
          this.guardDetour(enemy, transport, vehicles) ?? this.busApproach(enemy, transport, range);
      if (enemy.swipe) continue;
      const remaining = Math.hypot(target.x - enemy.x, target.y - enemy.y);
      if (remaining < 1) continue;
      enemy.angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      const oldY = enemy.y;
      this.moveEnemy(enemy, enemy.angle, Math.min(remaining, speed * dt), from);
      this.touchMovingVehicle(enemy, oldY, vehicles);
    }
    if (!bus.threat) bus.threatenedSince = undefined;
    this.advanceRounds(dt, scroll);
    if (firing && this.shot <= 0 && this.gateClosingAt === undefined) {
      this.shot = Math.max(-dt, this.shot) + ROUND_CADENCE;
      this.muzzle = ESCORT_MUZZLE_TIME;
      this.muzzleAngle = angle + (this.random() - .5) * .067;
      const roll = this.random() * (this.muzzleVariant < 0 ? ESCORT_MUZZLE_VARIANTS : ESCORT_MUZZLE_VARIANTS - 1);
      const next = Math.floor(roll);
      this.muzzleVariant = this.muzzleVariant >= 0 && next >= this.muzzleVariant ? next + 1 : next;
      this.muzzleLength = .9 + (roll - next) * .24;
      this.fire(this.gunOrigin, this.muzzleAngle, 47, false, this.shotsFired++ % 3 === 0, ESCORT_TURRETS[0].barrel - this.gunKick);
    } else if (!firing) this.shot = Math.max(0, this.shot);
    if (this.gateClosingAt === undefined) {
      if (this.guardShot <= 0) this.coverFire();
      if (this.stopped) this.stepCrewFire();
      this.stepAirSupport(dt);
    }
    this.enemies = this.enemies.filter(enemy => enemy.hp > 0 && enemy.y > -610);
    if (bus.hp <= 0) {
      if (!bus.wreck || this.time - bus.wreck.at >= WRECK_COAST) this.outcome = 'lost';
    }
    else if (this.refugeSecuredAt !== undefined && this.speed < 1) this.outcome = 'won';
  }

  private stepRefuge(lead: VehiclePose, rear: VehiclePose) {
    if (this.bus.hp <= 0) return;
    if (this.airArrivalAt === undefined && this.distance >= AIR_SUPPORT_START) this.airArrivalAt = this.time;
    if (this.gateOpenedAt === undefined && this.gateY <= lead.y + ESCORT_VEHICLES[0].length / 2 + 179)
      this.gateOpenedAt = this.time;
    if (this.gateClosingAt === undefined && this.gateOpen >= 1 &&
        this.gateY < rear.y - ESCORT_VEHICLES[ESCORT_REAR].length / 2 - 18)
      this.gateClosingAt = this.time;
    if (this.gateClosingAt !== undefined && this.refugeSecuredAt === undefined && this.time >= this.gateClosingAt + GATE_TRAVEL)
      this.refugeSecuredAt = this.time;
  }

  private finishArming() {
    this.breachAt = CLEAR_WORK_END + WITHDRAW;
    this.resumeAt = ESCORT_RESUME;
    // The small scripted group trades places with nearby living enemies when the roadway is crowded.
    for (let i = 0; i < ESCORT_AMBUSH_SIZE; i++) {
      const side = i < 3 ? -1 : 1, slot = i % 3;
      let nearest = -1, score = Infinity;
      for (const [index, enemy] of this.enemies.entries()) {
        if (enemy.hp <= 0) continue;
        const cost = Math.hypot(enemy.x - side * (240 + slot * 34), enemy.y - (175 + slot * 36));
        if (cost < score) { score = cost; nearest = index; }
      }
      const atCapacity = this.enemies.length + this.crewAmbush.length >= ESCORT_ENEMY_CAP;
      if (nearest >= 0 && (score < 195 || atCapacity)) {
        const [enemy] = this.enemies.splice(nearest, 1);
        if (score < 195 || side * enemy.x > 0) {
          this.crewAmbush.push({ x: enemy.x, y: enemy.y, type: enemy.type, variant: enemy.variant });
          continue;
        }
      }
      this.crewAmbush.push({ x: side * (595 + slot * 12), y: 151 + slot * 64, type: 'runner', variant: i % 4 });
    }
  }

  private stepAirSupport(dt: number) {
    if (this.time < GRAB_AT) this.flyEscortAircraft(2, dt);
    if (this.time >= GRAB_AT && this.time < ESCORT_STOP) {
      if (!this.airGrab && this.time <= GRAB_AT + dt) {
        const pose = this.aircraftPose(2);
        this.airGrab = { ...pose, worldY: pose.y + this.distance };
        this.openingAircraft.firing = false;
      }
      if (this.airGrab && this.airCrashAt === undefined && this.time >= ESCORT_AIR_CRASH) {
        this.airCrashAt = this.time;
        this.detonate(this.aircraftPose(2), 510, 35, 0);
        this.nextWave = Math.max(this.nextWave, this.time + 1.18);
      }
      if (this.airCrashAt !== undefined && this.time - this.airCrashAt >= .62 && !this.crashPursuit) {
        this.crashPursuit = true;
        this.spawnCrashPursuit();
      }
    }
    if (this.airArrivalAt !== undefined) for (let i = 0; i < this.aircraft.length; i++) this.flyEscortAircraft(i, dt);
  }

  private flyEscortAircraft(index: number, dt: number) {
    const aircraft = this.airGun(index), pose = this.aircraftPose(index), side = index === 1 ? 1 : -1;
    if (!pose.visible) return;
    const target = pose.supporting ? this.airTarget(aircraft, pose, side, dt) : undefined;
    const cruise = index === 2 ? 1.15 : this.time - (this.airArrivalAt ?? 0) > 15.4 ? Math.PI / 2 + side * -.72 : Math.PI / 2 + side * .59;
    const wanted = target ? Math.atan2(target.y - pose.y, target.x - pose.x) : cruise;
    const previous = aircraft.heading;
    const delta = difference(wanted, aircraft.heading);
    const turn = Math.sign(delta) * Math.min(TURN_RATE, Math.sqrt(2 * TURN_ACCEL * Math.abs(delta)), Math.abs(delta) * 8);
    aircraft.turn += limit(turn - aircraft.turn, -TURN_ACCEL * dt, TURN_ACCEL * dt);
    aircraft.heading += aircraft.turn * dt;
    const cone = aircraft.firing ? AIR_KEEP_FIRE_CONE : AIR_FIRE_CONE;
    if (!target || Math.abs(difference(wanted, aircraft.heading)) > cone) {
      aircraft.firing = false;
      return;
    }
    aircraft.nextShot = aircraft.firing ? Math.max(aircraft.nextShot, this.time - Math.min(dt, .075)) : this.time;
    aircraft.firing = true;
    const pulseDamage = index === 2 ? 70 : 56;
    while (aircraft.nextShot <= this.time + 1e-6) {
      const at = aircraft.nextShot;
      const fraction = limit(1 + (at - this.time) / dt, 0, 1);
      const heading = previous + (aircraft.heading - previous) * fraction;
      const pod = aircraft.shots % 6 < 3 ? -1 : 1;
      const muzzle = this.airMuzzle({ ...pose, angle: heading * 180 / Math.PI - 90 }, pod);
      const along = (target.x - muzzle.x) * Math.cos(heading) + (target.y - muzzle.y) * Math.sin(heading);
      const range = limit(along + (aircraft.shots % 5 - 2) * 8, 86, 440);
      const pulse = at + 1e-6 >= aircraft.nextDamage;
      if (pulse) aircraft.nextDamage = at + AIR_DAMAGE_CADENCE;
      this.fire(muzzle, heading, pulse ? pulseDamage : 0, true, aircraft.shots % 4 !== 2, 0, range);
      if (aircraft.shots % 4 === 0) this.casingShots.push({
        origin: { x: muzzle.x - Math.cos(heading) * 30, y: muzzle.y - Math.sin(heading) * 30 },
        angle: heading, source: 'air', side: pod,
      });
      aircraft.pod = pod;
      aircraft.shots++;
      aircraft.flashAt = this.time;
      aircraft.nextShot += AIR_SHOT_CADENCE;
    }
  }

  private airTarget(aircraft: AirGun, origin: Point, side: number, dt: number) {
    if (this.time >= aircraft.nextTarget) {
      aircraft.nextTarget = this.time + AIR_AIM_REFRESH;
      aircraft.target = this.airTargetCluster(origin, side, aircraft.heading, aircraft.aim);
    }
    if (!aircraft.target) { aircraft.aim = undefined; return; }
    const aim = aircraft.aim ??= { ...aircraft.target };
    const weight = 1 - Math.exp(-dt * 8);
    aim.x += (aircraft.target.x - aim.x) * weight;
    aim.y += (aircraft.target.y - aim.y) * weight;
    return { x: aim.x, y: aim.y - this.distance };
  }

  private airTargetCluster(origin: Point, side: number, heading: number, previous?: Point) {
    let picked: EscortEnemy | undefined, score = Infinity;
    const bus = this.vehiclePose(ESCORT_BUS);
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || enemy.y < -155 || side * enemy.x < 42) continue;
      const dx = enemy.x - origin.x, dy = enemy.y - origin.y, distance = Math.hypot(dx, dy);
      if (distance < 72 || distance > 485) continue;
      const follow = previous ? Math.min(240, Math.hypot(enemy.x - previous.x, enemy.y + this.distance - previous.y)) * .24 : 0;
      const cost = Math.hypot(enemy.x - bus.x, enemy.y - bus.y) * .8 + distance * .28 +
        Math.abs(difference(Math.atan2(dy, dx), heading)) * 56 + follow;
      if (cost < score) { picked = enemy; score = cost; }
    }
    if (!picked) return;
    let x = 0, y = 0, total = 0;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || side * enemy.x < 42) continue;
      const distance = Math.hypot(enemy.x - picked.x, enemy.y - picked.y);
      if (distance > 115) continue;
      const weight = 1 - distance / 132;
      x += enemy.x * weight;
      y += enemy.y * weight;
      total += weight;
    }
    return { x: x / total, y: y / total + this.distance };
  }

  private spawnCrashPursuit() {
    const pose = this.aircraftPose(2);
    const count = Math.min(8, ESCORT_ENEMY_CAP - this.enemies.length);
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1, runner = i % 3 !== 1;
      const x = -470 - (i % 4) * 23, y = pose.y + side * (92 + i * 7);
      this.enemies.push({ x, y, type: runner ? 'runner' : 'walker', id: this.nextId++, hp: runner ? 38 : 68,
        angle: 0, hit: 0, attack: .85, variant: i % 4 });
    }
  }

  private stepRoadside(bus: VehiclePose) {
    this.roadside.forEach((car, i) => {
      const y = car.y - this.distance;
      if (!car.spawned && this.time >= car.at - 2.65 && this.time <= car.at - 1.85 && this.bus.hp > 0 &&
          this.enemies.length + this.crewAmbush.length < ESCORT_ENEMY_CAP) {
        car.spawned = true;
        const enemy: EscortEnemy = { x: Math.sign(car.x) * 503, y, id: this.nextId++, type: 'brute', hp: 225,
          angle: car.x > 0 ? Math.PI : 0, hit: 0, attack: .72, variant: i, roadside: i };
        this.enemies.push(enemy);
        this.indexEnemy(enemy, enemyCell(enemy));
      }
      if (!car.explosive || car.exploded || car.hitAt === undefined || this.time - car.hitAt < .66) return;
      car.exploded = true;
      this.detonate(this.roadsidePose(i), 445, 26, 9);
    });
    const blast = this.lastBlast;
    if (!blast || blast.reachedBus || !blast.damage || this.bus.hp <= 0) return;
    const distance = Math.hypot(bus.x - blast.x, bus.y + this.distance - blast.y);
    if (distance < blast.radius && this.time - blast.at >= distance / ESCORT_SHOCK_SPEED) {
      blast.reachedBus = true;
      this.damageBus(Math.max(1, Math.round(blast.damage * (1 - distance / blast.radius))), bus, blast.x);
    } else if (this.time - blast.at > blast.radius / ESCORT_SHOCK_SPEED) blast.reachedBus = true;
  }

  private rushRoadside(enemy: EscortEnemy, dt: number, cell: number) {
    const car = this.roadside[enemy.roadside!];
    const dx = car.x - enemy.x, dy = car.y - this.distance - enemy.y, distance = Math.hypot(dx, dy);
    if (car.hitAt !== undefined || enemy.y < -355) { enemy.roadside = undefined; return; }
    enemy.angle = Math.atan2(dy, dx);
    if (distance > 41) {
      const step = Math.min(distance - 40, 179 * dt);
      this.positionEnemy(enemy, enemy.x + dx / distance * step, enemy.y + dy / distance * step, cell);
      return;
    }
    car.hitAt = this.lastRoadsideHitAt = this.time;
    enemy.roadside = undefined;
    enemy.hit = .25;
    enemy.attack = .58;
    this.impact({ x: car.x, y: car.y - this.distance }, enemy.angle, 'metal', 1.4);
  }

  private detonate(point: Point, radius: number, force: number, damage: number) {
    this.lastBlast = { x: point.x, y: point.y + this.distance, at: this.time, radius, force, damage, reachedBus: false };
  }

  private stepCrewFire() {
    for (const [i, gun] of this.crewGuns.entries()) {
      const pose = this.crewPose(i);
      if (!pose.armed || !pose.visible || gun.nextShot > this.time) continue;
      const side = i ? 1 : -1;
      let target: Point | undefined, range = 322;
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0 || side * enemy.x < 38) continue;
        const distance = Math.hypot(enemy.x - pose.x, enemy.y - pose.y);
        if (distance >= range) continue;
        target = enemy;
        range = distance;
      }
      for (let j = i * 3; j < (i + 1) * 3; j++) {
        const ambusher = this.crewAmbushPose(j);
        if (!ambusher) continue;
        const distance = Math.hypot(ambusher.x - pose.x, ambusher.y - pose.y);
        if (distance >= range) continue;
        target = ambusher;
        range = distance;
      }
      if (!target) { gun.nextShot = this.time + .16; gun.burst = 0; continue; }
      gun.angle = Math.atan2(target.y - pose.y, target.x - pose.x) + (this.random() - .5) * .12;
      gun.flashAt = this.time;
      this.fire(pose, gun.angle, 18, true, gun.shots++ % 2 === 0, ESCORT_CREW_BARREL * pose.scaleX, undefined, 'rifle');
      gun.nextShot = this.time + (++gun.burst % 3 === 0 ? .64 : .18);
    }
  }

  private touchMovingVehicle(enemy: EscortEnemy, oldY: number, vehicles: readonly VehiclePose[]) {
    if (this.speed < SIDE_CONTACT_SPEED || Math.abs(enemy.x) > 108 || this.gateClosingAt !== undefined) return false;
    for (const [index, vehicle] of vehicles.entries()) {
      if (vehicle.speed < SIDE_CONTACT_SPEED) continue;
      const { width, length } = ESCORT_VEHICLES[index], halfWidth = width / 2, halfLength = length / 2;
      const dx = enemy.x - vehicle.x, dy = enemy.y - vehicle.y;
      if (Math.abs(dx) > halfWidth + 17 || Math.abs(dy) > halfLength + 15) continue;
      const yaw = vehicle.angle * Math.PI / 180, cos = Math.cos(yaw), sin = Math.sin(yaw);
      const x = dx * cos + dy * sin, y = -dx * sin + dy * cos;
      const beforeY = -dx * sin + (oldY - vehicle.y) * cos;
      const side = Math.sign(x) || (enemy.id % 2 === 0 ? -1 : 1);
      const bumper = vehicle.speed >= RAM_SPEED && beforeY >= halfLength - 2 &&
        y <= halfLength + 6 && y >= halfLength - 29 && Math.abs(x) <= halfWidth + 2;
      if (bumper) {
        enemy.hp = 0;
        this.fallEnemy(enemy, side * 170, 116, true);
        this.impact(enemy, Math.atan2(116, side * 170), 'burst', enemy.type === 'brute' ? 1.8 : 1.1);
        const heavy = enemy.type === 'brute', previous = this.vehicleHits[index];
        if (!previous || this.time - previous.at >= .22 || heavy && !previous.heavy)
          this.vehicleHits[index] = { at: this.time, contact: { x: limit(x, -halfWidth, halfWidth), y: halfLength, nx: 0, ny: 1 }, heavy };
        return true;
      }
      if (Math.abs(x) > halfWidth + 6 || Math.abs(y) >= halfLength - 2) continue;
      const contact = escortContactPoint(vehicle, { x: side * halfWidth, y, nx: side, ny: 0 }, 12);
      this.positionEnemy(enemy, contact.x, contact.y, enemyCell(enemy));
      enemy.swipe = undefined;
      enemy.hit = Math.max(enemy.hit, .17);
      enemy.push = { x: side * cos * 136, y: side * sin * 136 - 26 };
      this.impact(contact, Math.atan2(enemy.push.y, enemy.push.x), 'dust', .8);
      return true;
    }
    return false;
  }

  private raidArmoredVehicle(enemy: EscortEnemy, rear: VehiclePose) {
    const { width, length } = ESCORT_VEHICLES[ESCORT_REAR];
    const dx = enemy.x - rear.x, fromBehind = enemy.y < rear.y - length / 2 + 3 && Math.abs(dx) < width * .77;
    const side = Math.abs(dx) > 6 ? Math.sign(dx) : enemy.id % 2 === 0 ? -1 : 1;
    const contact = fromBehind ? { x: side * width * .29, y: -length / 2, nx: 0, ny: -1 } :
      { x: side * width / 2, y: (enemy.id % 3 - 1) * length * .33, nx: side, ny: 0 };
    const target = escortContactPoint(rear, contact, enemy.type === 'brute' ? 29 : 22);
    if (enemy.attack <= 0 && Math.hypot(target.x - enemy.x, target.y - enemy.y) < 13)
      this.beginVehicleSwipe(enemy, ESCORT_REAR, rear, contact);
    return target;
  }

  private guardDetour(enemy: EscortEnemy, bus: VehiclePose, vehicles: readonly VehiclePose[]): Point | undefined {
    const index = enemy.y > bus.y ? 0 : ESCORT_REAR, pose = vehicles[index];
    const { width, length } = ESCORT_VEHICLES[index], towardBus = index === 0 ? -1 : 1;
    const dx = enemy.x - pose.x, dy = enemy.y - pose.y;
    if (enemy.busSlot !== undefined || Math.abs(dx) > width / 2 + 55 ||
        dy * towardBus > length / 2 + 17 || dy * towardBus < -length / 2 - 51) return;
    const contact = vehicleContact(pose, index, enemy), point = escortContactPoint(pose, contact);
    const mark = 1 << index;
    if (!((enemy.passedGuards ?? 0) & mark)) {
      const gap = Math.hypot(point.x - enemy.x, point.y - enemy.y);
      const reach = enemy.type === 'brute' ? 31 : 23;
      if (gap < reach + 1) {
        enemy.passedGuards = (enemy.passedGuards ?? 0) | mark;
        this.beginVehicleSwipe(enemy, index, pose, contact);
        return enemy;
      }
      if (gap < reach + 14) return escortContactPoint(pose, contact, reach - 2);
    }
    const side = Math.abs(dx) > 5 ? Math.sign(dx) : enemy.id % 2 ? 1 : -1;
    const shoulder = width / 2 + (enemy.type === 'brute' ? 42 : 34);
    const beyond = pose.y + towardBus * (length / 2 + 22);
    return { x: pose.x + side * shoulder, y: Math.abs(dx) >= shoulder - 7 ? beyond : enemy.y };
  }

  private busApproach(enemy: EscortEnemy, pose: VehiclePose, range: number): Point {
    if (range > 170) return pose;
    const yaw = pose.angle * Math.PI / 180, dx = enemy.x - pose.x, dy = enemy.y - pose.y;
    const localX = dx * Math.cos(yaw) + dy * Math.sin(yaw), localY = -dx * Math.sin(yaw) + dy * Math.cos(yaw);
    const side = localY < -58 && Math.abs(localX) < 79 ? 0 : localX < 0 ? -1 : 1;
    const reach = enemy.type === 'brute' ? 27 : 19;
    let slot = enemy.busSlot, next = -1, distance = Infinity, queueDistance = Infinity;
    if (slot === undefined) {
      for (let i = 0; i < BUS_CONTACTS.length; i++) {
        const contact = BUS_CONTACTS[i];
        if (contact.nx !== side) continue;
        const cost = Math.hypot(contact.x + contact.nx * reach - localX, contact.y + contact.ny * reach - localY);
        if (!this.busSlotOwners[i] && range < 133 && (slot === undefined || cost < distance)) {
          slot = i;
          distance = cost;
        }
        if (cost < queueDistance) { next = i; queueDistance = cost; }
      }
      if (slot === undefined) return escortContactPoint(pose, BUS_CONTACTS[next], reach + 35 + (enemy.id % 3) * 16);
      enemy.busSlot = slot;
      this.busSlotOwners[slot] = enemy;
    }
    const contact = BUS_CONTACTS[slot], target = escortContactPoint(pose, contact, reach);
    if (this.bus.hp > 0 && enemy.attack <= 0 && this.time - (this.bus.threatenedSince ?? this.time) > .65 &&
        Math.hypot(enemy.x - target.x, enemy.y - target.y) < 10) this.beginVehicleSwipe(enemy, ESCORT_BUS, pose, contact);
    return target;
  }

  private beginVehicleSwipe(enemy: EscortEnemy, vehicle: number, pose: VehiclePose, contact: VehicleContact) {
    const heavy = enemy.type === 'brute', point = escortContactPoint(pose, contact);
    enemy.angle = Math.atan2(point.y - enemy.y, point.x - enemy.x);
    enemy.swipe = { vehicle, contact, began: this.time, landsAt: this.time + (heavy ? .32 : .19),
      endsAt: this.time + (heavy ? .67 : .39) };
    enemy.attack = heavy ? 1.64 : 1.15;
  }

  private landVehicleSwipe(enemy: EscortEnemy, pose: VehiclePose) {
    const swipe = enemy.swipe!;
    if (swipe.landed || this.time < swipe.landsAt) return;
    swipe.landed = true;
    const heavy = enemy.type === 'brute', point = escortContactPoint(pose, swipe.contact);
    if (Math.hypot(point.x - enemy.x, point.y - enemy.y) > (heavy ? 60 : 46)) return;
    const bus = this.bus, hittingBus = swipe.vehicle === ESCORT_BUS;
    let damaged = false;
    if (hittingBus) {
      if (bus.hp <= 0) return;
      if (this.time >= (bus.nextDamageAt ?? 0)) {
        bus.nextDamageAt = this.time + (this.stopped ? 1.05 : .96 + .55 * (1 - escortHordeEscalation(this.time)));
        damaged = true;
        this.damageBus(heavy ? 6 : 2, pose, enemy.x);
      }
    }
    const previous = this.vehicleHits[swipe.vehicle];
    if (damaged || !previous || this.time - previous.at >= .26 || heavy && !previous.heavy && this.time - previous.at > .12)
      this.vehicleHits[swipe.vehicle] = { at: this.time, contact: swipe.contact, heavy };
  }

  private damageBus(amount: number, pose: VehiclePose, sourceX: number) {
    const bus = this.bus;
    bus.hp = Math.max(0, bus.hp - amount);
    bus.struck = .32;
    if (bus.hp === 0) bus.wreck = { ...pose, y: pose.y + this.distance, at: this.time, side: sourceX < pose.x ? 1 : -1 };
  }

  private spawnWave() {
    const stopped = this.stopped;
    const outbound = this.clearPhase === 'outbound';
    const chase = outbound && this.time < (this.resumeAt ?? 0) + 25;
    const visible = this.visibleEnemies, incoming = this.enemies.length - visible;
    const escalation = escortHordeEscalation(this.time);
    const target = stopped ? 96 : chase ? 94 : 49 + Math.round(41 * escalation);
    const batch = stopped ? 40 : outbound ? 34 : 17 + Math.round(17 * escalation);
    const deficit = Math.ceil(target - visible - incoming * .36);
    const count = Math.min(batch, ESCORT_ENEMY_CAP - this.enemies.length - this.crewAmbush.length, deficit);
    this.nextWave = this.time + (count <= 0 ? .42 : stopped || chase ? 1.62 : 2.25);
    const camera = this.camera(ESCORT_VIEW_H);
    const halfWidth = ESCORT_VIEW_W / 2 / camera.scale, halfHeight = ESCORT_VIEW_H / 2 / camera.scale;
    let raiders = this.enemies.filter(enemy => enemy.raidRear).length;
    for (let i = 0; i < count; i++) {
      const ticket = this.random(), sector = (i + this.wave) % 4, side = sector === 0 ? -1 : 1;
      const flank = sector < 2, ahead = sector === 2;
      const runnerChance = sector === 3 ? .46 + .23 * escalation : .27;
      const type = this.wave > 2 && (i === 0 || stopped && i === 18) && this.wave % 4 === 3 ? 'brute' : ticket < runnerChance ? 'runner' : 'walker';
      const spread = (i * .618 + this.wave * .19 + this.random() * .27) % 1 - .5;
      const beyond = 36 + this.random() * 84;
      const x = flank ? side * (halfWidth + beyond) : spread * halfWidth * (ahead && i % 3 === 0 ? .14 : 1.48);
      const y = camera.y + (flank ? spread * halfHeight * 1.65 : (ahead ? 1 : -1) * (halfHeight + beyond));
      const raidRear = raiders < 6 + 5 * escalation && (sector === 3 && type === 'runner' && i % 3 !== 0 || flank && (i + this.wave * 2) % 6 === 0);
      if (raidRear) raiders++;
      this.enemies.push({ x, y: Math.min(y, this.gateY - 36), type, id: this.nextId++, hp: type === 'brute' ? 225 : type === 'runner' ? 38 : 68,
        angle: Math.atan2(camera.y - y, -x), hit: 0, attack: stopped ? .72 : .9, variant: Math.floor(this.random() * 4), raidRear });
    }
    if (count > 0) this.wave++;
  }

  private updateCover() {
    const segment = Math.floor(this.distance / ESCORT_TILE);
    if (segment === this.segment) return;
    this.segment = segment;
    this.cover = [-1, 0, 1, 2].flatMap(offset => [-1, 1].map(side => {
      const tile = segment + offset;
      return { ...escortShoulder(tile, side), metal: escortShoulderVariant(tile, side) === 0 };
    }));
  }

  private indexEnemy(enemy: EscortEnemy, key: number) {
    let bucket = this.enemyCells.get(key);
    if (!bucket) this.enemyCells.set(key, bucket = this.cellPool.pop() ?? []);
    bucket.push(enemy);
  }

  private moveEnemyCell(enemy: EscortEnemy, from: number) {
    const key = enemyCell(enemy);
    if (key === from) return;
    const previous = this.enemyCells.get(from)!;
    previous.splice(previous.indexOf(enemy), 1);
    this.indexEnemy(enemy, key);
  }

  private moveEnemy(enemy: EscortEnemy, angle: number, step: number, from: number) {
    let x = enemy.x + Math.cos(angle) * step, y = enemy.y + Math.sin(angle) * step;
    for (const block of this.cover) {
      const dy = y - block.y + this.distance, dx = x - block.x, range = Math.hypot(dx, dy);
      if (range >= 51 || range === 0) continue;
      x = block.x + dx / range * 51;
      y = block.y - this.distance + dy / range * 51 + (dy >= 0 ? 1 : -1) * step * .28;
      break;
    }
    const c = Math.floor(x / ENEMY_CELL), r = Math.floor(y / ENEMY_CELL);
    for (let row = r - 1; row <= r + 1; row++) for (let column = c - 1; column <= c + 1; column++) {
      const neighbors = this.enemyCells.get(cellKey(column, row));
      if (!neighbors) continue;
      for (const other of neighbors) {
        if (other === enemy || other.hp <= 0) continue;
        const dx = x - other.x, dy = y - other.y, square = dx * dx + dy * dy;
        const spacing = enemy.type === 'brute' || other.type === 'brute' ? 32 : 23;
        if (square === 0 || square >= spacing * spacing) continue;
        const range = Math.sqrt(square), push = Math.min(step * .48, spacing - range);
        x += dx / range * push;
        y += dy / range * push;
      }
    }
    this.positionEnemy(enemy, x, y, from);
  }

  private positionEnemy(enemy: EscortEnemy, x: number, y: number, from: number) {
    const radius = enemy.type === 'brute' ? 24 : 15, exterior = this.gateY - 18 - radius;
    if (enemy.y <= this.gateY && y > exterior && (this.gateClosingAt !== undefined || Math.abs(x) + radius > ESCORT_GATE_HALF * this.gateOpen))
      y = Math.min(y, exterior);
    enemy.x = x; enemy.y = y;
    this.moveEnemyCell(enemy, from);
  }

  private coverFire() {
    const origin = this.rearGunOrigin;
    let target = this.guardTarget;
    if (!target || target.hp <= 0 || !this.enemies.includes(target) || Math.hypot(target.x - origin.x, target.y - origin.y) >= GUARD_RANGE) {
      target = this.guardTarget = this.findGuardTarget(origin);
    }
    if (!target) { this.guardShot = .1; return; }
    this.rearHeading = Math.atan2(target.y - origin.y, target.x - origin.x) + (this.random() - .5) * .09;
    this.rearMuzzle = .045;
    this.fire(origin, this.rearHeading, 23, true, this.rearShotsFired++ % 3 === 0, ESCORT_TURRETS[1].barrel);
    this.guardShot = Math.max(-.05, this.guardShot) + GUARD_CADENCE;
  }

  private findGuardTarget(origin: Point) {
    const bus = this.vehiclePose(ESCORT_BUS);
    let target: EscortEnemy | undefined, best = Infinity;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const range = Math.hypot(enemy.x - origin.x, enemy.y - origin.y);
      if (range >= GUARD_RANGE) continue;
      const behind = enemy.y < origin.y + 20;
      const nearBus = Math.hypot(enemy.x - bus.x, enemy.y - bus.y) < 135;
      const priority = behind ? 0 : nearBus ? 1 : 2;
      const score = priority * GUARD_RANGE + range;
      if (score < best) { best = score; target = enemy; }
    }
    return target;
  }

  private fire(origin: Point, angle: number, damage: number, allied: boolean, tracer: boolean, barrel: number, airRange?: number, source: 'rifle' | 'vehicle' = 'vehicle') {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    if (airRange === undefined && tracer) this.casingShots.push({
      origin: { x: origin.x + dx * barrel * .24, y: origin.y + dy * barrel * .24 }, angle,
      source,
    });
    this.rounds.push({ x: origin.x + dx * barrel, y: origin.y + dy * barrel, vx: dx * ROUND_SPEED, vy: dy * ROUND_SPEED,
      left: airRange ?? (allied ? 360 : 885), travelled: 0, damage, allied, tracer, airborne: airRange !== undefined, hits: [] });
  }

  private advanceRounds(dt: number, scroll: number) {
    for (const round of this.rounds) {
      const flight = Math.min(dt, round.left / ROUND_SPEED);
      if (round.airborne) {
        round.x += round.vx * flight;
        round.y += round.vy * flight - scroll;
        round.travelled += ROUND_SPEED * flight;
        round.left -= ROUND_SPEED * flight;
        if (round.left <= .01) {
          round.left = 0;
          if (round.damage > 0) this.strikeGround(round);
        }
        continue;
      }
      const dx = round.vx * flight, dy = round.vy * flight - scroll * flight / dt;
      const distance = Math.hypot(dx, dy);
      if (!distance) continue;
      const ux = dx / distance, uy = dy / distance;
      const candidates = this.roundCandidates;
      candidates.length = 0;
      const left = Math.floor((Math.min(round.x, round.x + dx) - 28) / ENEMY_CELL);
      const right = Math.floor((Math.max(round.x, round.x + dx) + 28) / ENEMY_CELL);
      const bottom = Math.floor((Math.min(round.y, round.y + dy) - 28) / ENEMY_CELL);
      const top = Math.floor((Math.max(round.y, round.y + dy) + 28) / ENEMY_CELL);
      for (let y = bottom; y <= top; y++) for (let x = left; x <= right; x++) {
        const bucket = this.enemyCells.get(cellKey(x, y));
        if (bucket) for (const enemy of bucket) candidates.push(enemy);
      }
      let remaining = distance;
      while (remaining > .01) {
        let hit: EscortEnemy | undefined;
        let cover: 'metal' | 'dust' | undefined;
        let travelled = remaining;
        const intersect = (x: number, y: number, radius: number) => {
          const rx = x - round.x, ry = y - round.y;
          const along = rx * ux + ry * uy, across = ry * ux - rx * uy;
          if (along + radius < 0 || along - radius >= travelled || Math.abs(across) >= radius) return Infinity;
          const edge = Math.sqrt(radius * radius - across * across);
          return along + edge < 0 ? Infinity : Math.max(0, along - edge);
        };
        for (const block of this.cover) {
          const hitAt = intersect(block.x, block.y - this.distance, 35);
          if (hitAt < travelled) { travelled = hitAt; cover = block.metal ? 'metal' : 'dust'; }
        }
        const gateHit = (this.gateY - round.y) / uy, wallX = Math.abs(round.x + ux * gateHit);
        if (gateHit >= 0 && gateHit < travelled && wallX > ESCORT_GATE_HALF * this.gateOpen) {
          travelled = gateHit;
          cover = wallX <= ESCORT_GATE_HALF ? 'metal' : 'dust';
        }
        if (this.breachAt === undefined || this.time < this.breachAt) {
          const y = ESCORT_LOG - this.distance;
          if (Math.abs(y - round.y) < remaining + 32) {
            for (let x = -192; x <= 192; x += 32) {
              const hitAt = intersect(x, y, 19);
              if (hitAt < travelled) { travelled = hitAt; cover = 'dust'; }
            }
          }
        }
        for (const enemy of candidates) {
          if (enemy.hp <= 0 || round.hits.includes(enemy.id)) continue;
          const hitAt = intersect(enemy.x, enemy.y, enemy.type === 'brute' ? 28 : 18);
          if (hitAt < travelled) { travelled = hitAt; hit = enemy; }
        }
        round.x += ux * travelled; round.y += uy * travelled;
        round.travelled += travelled;
        remaining -= travelled;
        if (hit) {
          round.hits.push(hit.id);
          hit.hp -= round.damage;
          hit.hit = .12;
          const push = hit.type === 'brute' ? 52 : 115;
          hit.push = { x: ux * push, y: uy * push };
          const broken = hit.hp <= 0 && !round.allied &&
            (round.hits.length > 1 || Math.hypot(hit.x, hit.y - ESCORT_ORIGIN.y) < 235);
          this.impact(round, Math.atan2(round.vy, round.vx), broken ? 'burst' : 'hit', hit.type === 'brute' ? 1.65 : 1);
          if (hit.hp <= 0) {
            if (!round.allied) this.kills++;
            this.fallEnemy(hit, ux * 125, uy * 125, broken);
          }
          if (hit.type !== 'brute' && round.hits.length < (round.allied ? 2 : 3)) {
            round.damage *= .68;
            continue;
          }
        } else if (cover) this.impact(round, Math.atan2(round.vy, round.vx), cover);
        if (hit || cover) round.left = 0;
        break;
      }
      if (round.left > 0) {
        round.left -= ROUND_SPEED * flight;
        if (round.left <= .01) { round.left = 0; this.impact(round, Math.atan2(round.vy, round.vx), 'dust'); }
      }
    }
    this.rounds = this.rounds.filter(round => round.left > 0);
  }

  private strikeGround(round: EscortRound) {
    const { x, y } = round, angle = Math.atan2(round.vy, round.vx);
    if (this.airImpacts.length >= ESCORT_AIR_IMPACT_CAP) this.airImpacts.shift();
    this.airImpacts.push({ x, y, angle, age: 0, pavement: Math.abs(x) < 195, pattern: this.airImpactPattern++ % 7 });
    const left = Math.floor((x - AIR_SPLASH_RADIUS) / ENEMY_CELL), right = Math.floor((x + AIR_SPLASH_RADIUS) / ENEMY_CELL);
    const bottom = Math.floor((y - AIR_SPLASH_RADIUS) / ENEMY_CELL), top = Math.floor((y + AIR_SPLASH_RADIUS) / ENEMY_CELL);
    for (let row = bottom; row <= top; row++) for (let col = left; col <= right; col++) {
      const enemies = this.enemyCells.get(cellKey(col, row));
      if (!enemies) continue;
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const dx = enemy.x - x, dy = enemy.y - y, range = Math.hypot(dx, dy);
        if (range >= AIR_SPLASH_RADIUS) continue;
        const heavy = enemy.type === 'brute';
        enemy.hp -= round.damage * (1 - range / AIR_SPLASH_RADIUS * .72) * (heavy ? .56 : 1);
        const direction = range > 1 ? Math.atan2(dy, dx) : angle;
        const strength = 88 - range * .34;
        if (enemy.hp <= 0) this.fallEnemy(enemy, Math.cos(direction) * strength, Math.sin(direction) * strength, false);
        else {
          enemy.hit = Math.max(enemy.hit, heavy ? .07 : .14);
          if (!heavy) enemy.push = { x: Math.cos(direction) * strength, y: Math.sin(direction) * strength };
        }
      }
    }
  }

  private fallEnemy(enemy: EscortEnemy, vx: number, vy: number, broken: boolean) {
    if (this.fallen.length >= ESCORT_EFFECT_CAP) this.fallen.shift();
    const { x, y, angle, type, variant } = enemy;
    this.fallen.push({ x, y, angle, type, variant, age: 0, vx, vy, broken });
  }

  private impact(point: Point, angle: number, kind: EscortImpact['kind'], size = 1) {
    if (this.impacts.length >= ESCORT_EFFECT_CAP) this.impacts.shift();
    this.impacts.push({ x: point.x, y: point.y, angle, age: 0, kind, size });
  }
}
