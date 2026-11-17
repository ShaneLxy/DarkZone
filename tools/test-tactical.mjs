import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
const ts = require('typescript');
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(root, 'assets/scripts', name + '.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  const m = { exports: {} }; cache.set(name, m.exports);
  new Function('require', 'module', 'exports', js)(id => load(id.replace('./', '')), m, m.exports);
  return m.exports;
}
const T = load('Tactical'), C = load('Core');
let passed = 0;
function test(name, run) { run(); passed++; console.log('PASS ' + name); }
test('only implemented tactical items can be selected', () => {
  assert.deepEqual(T.SELECTABLE_TACTICALS, ['grenade', 'flashbang']);
  assert.equal(T.selectTactical('proximity-mine'), null);
  assert.equal(T.newTacticalLoadout('proximity-mine').remaining, 0);
});
test('single slot has two uses, cooldown and fresh-run reset', () => {
  const slot = T.selectTactical('grenade');
  assert(T.consumeTactical(slot)); assert.equal(slot.remaining, 1);
  assert(!T.consumeTactical(slot)); T.stepTactical(slot, 2);
  assert(T.consumeTactical(slot)); T.stepTactical(slot, 2);
  assert(!T.consumeTactical(slot)); T.resetTactical(slot);
  assert.equal(slot.remaining, 2); assert.equal(slot.cooldown, 0);
});
test('throw point stops before walls in facing direction', () => {
  const p = T.tacticalPoint({ x: 0, y: 50 }, 0, 200, [{ x: 80, y: 0, w: 10, h: 100 }], C.rayDistance);
  assert.equal(p.x, 77); assert.equal(p.y, 50);
});
const damage = (target, amount) => { target.hp = Math.max(0, target.hp - amount); };
test('grenade range and wall occlusion respect existing damage callbacks', () => {
  const enemies = [{ x: 20, y: 50, hp: 100 }, { x: 65, y: 50, hp: 100 }, { x: 180, y: 50, hp: 100 }];
  const result = T.resolveTactical('grenade', { x: 0, y: 50 }, enemies, [], [{ x: 40, y: 0, w: 10, h: 100 }], C.lineClear, damage, damage);
  assert.equal(result.affectedEnemies, 1); assert.equal(enemies[0].hp, 52);
  assert.equal(enemies[1].hp, 100); assert.equal(enemies[2].hp, 100);
});
test('flashbang interrupts attack and boss receives shorter stun', () => {
  const enemies = [{ x: 20, y: 0, hp: 100, windup: 0.7, type: 'walker' }, { x: 30, y: 0, hp: 650, windup: 0.7, type: 'boss' }];
  T.resolveTactical('flashbang', { x: 0, y: 0 }, enemies, [], [], C.lineClear, damage, damage);
  assert.equal(enemies[0].windup, 0); assert.equal(enemies[1].windup, 0);
  assert(enemies[1].stun < enemies[0].stun); assert.equal(enemies[0].hp, 100);
});
test('sound snapshots position, expires and preserves suppressed weapon range', () => {
  const p = { x: 0, y: 0 }, sound = T.makeSoundEvent(p, 1, 'explosion', 680);
  p.x = 99; assert.equal(sound.position.x, 0);
  assert(T.weaponSoundProfile(3).radius < T.weaponSoundProfile(4).radius);
  assert(T.weaponSoundProfile(4).radius < T.weaponSoundProfile(0).radius);
  assert(T.hearSound({ x: 200, y: 0 }, sound, false));
  T.ageSound(sound, 1); assert.equal(T.hearSound({ x: 10, y: 0 }, sound, false), null);
});
test('room wall seals sound and steel attenuates more than wood', () => {
  const sound = T.makeSoundEvent({ x: 0, y: 50 }, 1, 'explosion', 680), listener = { x: 100, y: 50 };
  const shape = { x: 40, y: 0, w: 10, h: 100 };
  assert.equal(T.hearSoundThroughGeometry(listener, sound, [shape], C.rayRect, () => 'wood'), null);
  const leaf = { ...shape, kind: 'door:0' };
  const wood = T.hearSoundThroughGeometry(listener, sound, [leaf], C.rayRect, () => 'wood');
  const steel = T.hearSoundThroughGeometry(listener, sound, [leaf], C.rayRect, () => 'steel');
  assert(steel.effectiveIntensity < wood.effectiveIntensity);
});
test('rifle reaches across a street and an alarm is audible behind multiple walls', () => {
  const source = { x: 0, y: 50 }, listener = { x: 980, y: 50 };
  const hear = (kind, blockers = []) => {
    const { intensity, radius } = T.SOUND_PROFILES[kind];
    return T.hearSoundThroughGeometry(listener, T.makeSoundEvent(source, intensity, kind, radius), blockers, C.rayRect, () => 'wood');
  };
  assert(hear('rifle').effectiveIntensity >= 0.08);
  assert.equal(hear('shotgun'), null);
  const walls = [{ x: 140, y: 0, w: 18, h: 100 }, { x: 480, y: 0, w: 18, h: 100 }];
  assert(hear('rifle', walls).effectiveIntensity < 0.08);
  assert(hear('alarm', walls).effectiveIntensity >= 0.08);
});
const controls = { x: 0, y: 0, angle: 0, fire: false };
function fixture(material = 'steel', walls = []) {
  const stage = { id: 'test', title: 'test', rooms: [{ x: 0, y: 0, w: 1000, h: 900 }], walls, furniture: [], doors: [{ x: 500, y: 300, length: 100, baseAngle: 0, material, name: 'test', rooms: [0, 0] }], spawn: { x: 550, y: 280 }, exit: { x: 900, y: 800 }, hints: [''], spawns: [[0, 550, 340, 'walker']] };
  return new C.Battle(3, 1, stage);
}
test('purchased mines arm, charge inventory once, and use distinct trigger geometry', () => {
  for (const kind of ['shock-mine', 'claymore']) {
    const b = fixture();
    Object.assign(b.player, { x: 350, y: 200, angle: 0 });
    const rear = b.enemies[0];
    Object.assign(rear, { x: 347, y: 190, hp: 140 });
    const front = { ...rear, id: rear.id + 1, x: 412, y: 210 };
    b.enemies.push(front);
    const armory = C.newProfile().armory;
    armory.tactical = kind; armory.counts[kind] = 1;
    const spent = [];
    b.preparePurchasedItems(armory, id => spent.push(id));
    assert(b.throwTactical());
    b.updateTactical(0.2);
    assert.equal(front.hp, 140); assert.equal(b.plantedMines.length, 1);
    b.updateTactical(0.26);
    assert.equal(b.plantedMines.length, 0); assert.deepEqual(spent, [kind]);
    if (kind === 'shock-mine') {
      assert(front.paralysis > 2); assert(rear.paralysis > 2);
    } else {
      assert.equal(front.hp, 60); assert.equal(rear.hp, 140);
    }
  }
});
test('grenade light briefly reveals open space outside the cone and is stopped by a wall', () => {
  const wall = { x: 700, y: 400, w: 10, h: 400 };
  const b = fixture('steel', [wall]);
  b.enemies = [];
  Object.assign(b.player, { x: 550, y: 530, angle: Math.PI });
  const open = { x: 650, y: 640 }, hidden = { x: 760, y: 600 };
  const cell = point => Math.floor(point.y / C.MINIMAP_CELL_SIZE) * b.minimap.columns + Math.floor(point.x / C.MINIMAP_CELL_SIZE);
  assert(!b.sees(open));
  b.tacticalThrows.push({ x: 640, y: 560, kind: 'grenade', delay: 0, origin: { ...b.player } });
  b.updateTactical(0.05);
  b.updateMinimap();
  assert(b.sees(open)); assert(!b.sees(hidden));
  assert.equal(b.minimap.visible[cell(open)], 1); assert.equal(b.minimap.visible[cell(hidden)], 0);
  b.updateTactical(C.GRENADE_LIGHT_TIME + 0.01); b.updateMinimap();
  assert(!b.sees(open)); assert.equal(b.minimap.visible[cell(open)], 0);
  assert.equal(b.minimap.explored[cell(open)], 1);
});
for (const material of ['wood', 'steel']) test(material + ' actor-blocked third attempt warns then forces fully open with damage and stun', () => {
  const b = fixture(material), e = b.enemies[0], door = b.doors[0];
  Object.assign(e, { soundOnly: true, investigate: { x: 550, y: 230 }, investigateTime: 20 });
  for (let i = 1; i <= 3; i++) {
    Object.assign(e, { x: 550, y: 340, cooldown: 0 });
    b.doorAttempts.set(door.id, e); b.openDoor(door, e); b.updateDoors(0.4);
    assert.equal(e.doorBlockCount, i); assert.equal(door.hp, door.maxHp);
    if (i < 3) assert(!e.forceOpen);
  }
  assert(b.events.includes('door-warning')); assert.equal(e.forceOpen, 0.45);
  const hp = b.player.hp; b.enemyStep(e, 0.2); assert(!b.events.includes('door-forced'));
  b.enemyStep(e, 0.26); assert(b.events.includes('door-forced'));
  assert(Math.abs(door.angle - door.baseAngle) > 1.5); assert.equal(b.player.hp, hp - 12); assert(b.player.knockback);
  assert(b.doorForceCooldown.has(door.id)); assert.equal(e.doorBlockCount, 0);
  const next = fixture(material); assert.equal(next.doorForceCooldown.size, 0); assert(!next.enemies[0].forceOpen);
});
test('wall-blocked swing does not count as actor obstruction', () => {
  const b = fixture('steel', [{ x: 530, y: 260, w: 4, h: 80 }]), e = b.enemies[0];
  for (let i = 0; i < 4; i++) { b.doorAttempts.set(0, e); b.openDoor(b.doors[0], e); b.updateDoors(0.4); }
  assert.equal(e.doorBlockCount, 0); assert(!e.forceOpen);
});
test('ordinary wood investigation opens the door without needless damage', () => {
  const b = fixture('wood'); b.player.x = 650; b.player.y = 200;
  Object.assign(b.enemies[0], { cooldown: 0, soundOnly: true, investigate: { x: 650, y: 200 }, investigateTime: 10 });
  b.enemyStep(b.enemies[0], 0.01); assert.equal(b.doors[0].hp, 100);
});
test('knockback movement checks thin-wall path and player stun blocks movement fire and dodge', () => {
  const b = fixture('steel', [{ x: 100, y: 250, w: 500, h: 4 }]);
  b.move(b.player, 0, -54, 16); assert(b.player.y >= 270);
  b.player.stun = 0.35; const x = b.player.x, ammo = b.player.ammo;
  b.dodge(1, 0); assert.equal(b.player.dashTime, 0);
  b.update(0.05, { ...controls, x: 1, fire: true }); assert.equal(b.player.x, x); assert.equal(b.player.ammo, ammo);
});
test('near loud sound alerts individual only; remote sound records snapshot then searches and restores', () => {
  const b = fixture(); b.alerted[0] = false; b.doors[0].destroyed = true; b.syncGeometry();
  const e = b.enemies[0]; b.player = { ...b.player, x: 900, y: 700 };
  b.emitSound({ x: 550, y: 240 }, 'explosion'); b.perceive(); assert(e.hearingAlert); assert(!b.alerted[0]);
  b.sounds = []; b.emitSound({ x: 200, y: 340 }, 'rifle'); b.perceive(); assert(!e.hearingAlert); assert.deepEqual(e.investigate, { x: 200, y: 340 });
  b.player.x = 950; for (let i = 0; i < 60; i++) b.enemyStep(e, 0.05);
  assert.equal(e.investigate, undefined); assert(!e.hearingAlert); assert(!b.alerted[0]);
});
test('vision respects enemy facing and cover; alert state alone does not reveal the player', () => {
  const b = fixture('wood', [{ x: 650, y: 100, w: 10, h: 500 }]);
  b.doors[0].destroyed = true; b.syncGeometry(); b.sounds = [];
  const e = b.enemies[0]; Object.assign(e, { x: 500, y: 200, angle: Math.PI });
  Object.assign(b.player, { x: 600, y: 200 }); b.alerted[e.room] = true;
  b.perceive(); assert(!e.lastSeen); b.enemyStep(e, .05); assert.equal(e.x, 500);
  e.angle = 0; b.player.x = 750; b.perceive(); assert(!e.lastSeen, 'wall must block vision');
  b.player.x = 600; b.perceive(); assert.deepEqual(e.lastSeen, { x: 600, y: 200 });
  b.player.x = 750; b.perceive(); b.enemyStep(e, .05);
  assert.deepEqual(e.investigate, { x: 600, y: 200 }, 'lost targets use a fixed last-seen point');
});
test('idle walkers alternate bounded wandering and pauses without crossing cover, then investigate sounds', () => {
  const wall = { x: 550, y: 80, w: 12, h: 280 }, b = fixture('steel', [wall]), e = b.enemies[0];
  Object.assign(e, { x: 490, y: 200, angle: Math.PI }); Object.assign(b.player, { x: 900, y: 800 });
  let moved = 0, stopped = 0;
  for (let i = 0; i < 600; i++) {
    const before = { x: e.x, y: e.y }; b.update(.05, controls);
    const delta = Math.hypot(e.x - before.x, e.y - before.y);
    if (delta > .01) moved++; else stopped++;
    assert(delta <= 1.11 && Math.hypot(e.x - 490, e.y - 200) <= 80.01);
    assert(!C.circleRect(e, 16, wall) && !e.investigate && !e.lastSeen);
  }
  assert(moved > 50 && stopped > 50);
  b.emitSound({ x: 380, y: 200 }, 'rifle'); b.perceive();
  assert.deepEqual(e.investigate, { x: 380, y: 200 });
  for (let i = 0; i < 10; i++) b.update(.05, controls);
  assert(e.investigate && e.investigate.x === 380);
});
test('footstep range is character-specific and only sounds after movement', () => {
  const radius = id => T.footstepSoundProfile(id).radius;
  assert(radius(3) < radius(0) && radius(0) < radius(4));
  for (const id of [0, 3]) {
    const b = fixture(); b.heroId = id; b.enemies = []; b.sounds = []; Object.assign(b.player, { x: 300, y: 500 });
    b.update(.05, { ...controls, x: -1 });
    assert.equal(b.sounds.find(s => s.type === 'footstep')?.radius, radius(id));
  }
});
test('heard alarm leads an enemy around a room wall and through its closed door to the sound snapshot', () => {
  const walls = [{ x: 0, y: 291, w: 498, h: 18 }, { x: 602, y: 291, w: 398, h: 18 }];
  const b = fixture('wood', walls), e = b.enemies[0];
  Object.assign(b.player, { x: 50, y: 800 });
  Object.assign(e, { x: 810, y: 390 });
  const source = { x: 790, y: 210 };
  b.emitSound(source, 'alarm'); b.perceive();
  assert.deepEqual(e.investigate, source);
  for (let i = 0; i < 178; i++) b.update(0.05, controls);
  assert(e.y < 275 && e.x > 700, JSON.stringify({ x: e.x, y: e.y, door: b.doors[0].angle }));
  assert(Math.abs(b.doors[0].angle) > 1.4 && b.doors[0].hp === b.doors[0].maxHp);
});
test('Battle tactical delay consumes once, shields behind wall and leaves steel intact', () => {
  const b = fixture('steel', [{ x: 700, y: 100, w: 8, h: 500 }]);
  b.player.x = 600; b.player.y = 400; b.player.angle = 0;
  const e = b.enemies[0]; e.x = 730; e.y = 400; const hp = e.hp;
  b.tactical = T.newTacticalLoadout('grenade'); assert(b.throwTactical()); assert(!b.throwTactical()); assert.equal(b.tactical.remaining, 1);
  assert(b.tacticalThrows[0].x < 700); b.updateTactical(0.1); assert.equal(e.hp, hp); assert.equal(b.sounds.length, 0);
  b.updateTactical(0.3); assert.equal(e.hp, hp); assert(b.sounds.some(s => s.type === 'explosion'));
});
for (const material of ['wood', 'steel']) test(material + ' continuous update resolves player-held door within three real failures', () => {
  const b = fixture(material, [{ x: 0, y: 291, w: 498, h: 18 }, { x: 602, y: 291, w: 398, h: 18 }]), e = b.enemies[0], d = b.doors[0]; let warned = -1, forced = -1, maxCount = 0;
  Object.assign(e, { soundOnly: true, investigate: { x: 550, y: 180 }, investigateTime: 20 });
  for (let i = 0; i < 200; i++) {
    b.update(0.025, controls); maxCount = Math.max(maxCount, e.doorBlockCount || 0);
    if (warned < 0 && b.events.includes('door-warning')) warned = b.elapsed;
    if (b.events.includes('door-forced')) { forced = b.elapsed; break; }
  }
  assert(warned >= 0, 'continuous AI never warned'); assert(forced >= warned + 0.4, 'warning not held');
  assert.equal(maxCount, 3); assert(Math.abs(d.angle - d.baseAngle) > 1.5);
  assert(b.player.knockback, 'player needs continuous exit, not instant endpoint');
  assert.equal(b.player.y, 280, 'force frame must not teleport');
  const samples = [];
  while (b.player.knockback) { b.events = []; b.update(0.025, controls); samples.push(b.player.y); }
  assert(samples.length >= 12); assert(samples.every((y, i) => i === 0 || y < samples[i - 1]));
  assert(samples[0] - samples[1] > samples.at(-2) - samples.at(-1), 'must decelerate');
  assert.equal(b.player.y, 226);
  const endpoint = { x: b.player.x, y: b.player.y };
  for (let i = 0; i < 4; i++) b.update(0.025, controls);
  assert.deepEqual({ x: b.player.x, y: b.player.y }, endpoint);
  assert(!C.circleRect(b.player, 17, C.doorShape(d)), 'player trapped inside final leaf');
  assert(!C.circleRect(e, 16, C.doorShape(d)), 'attacker trapped inside final leaf');
  assert(b.player.hp < b.player.maxHp); assert(!b.player.knockback);
});
test('alerted room cannot override heard snapshot and search returns to idle until visual detection', () => {
  const b = fixture(); b.doors[0].destroyed = true; b.syncGeometry(); b.player.x = 950; b.player.y = 850;
  const e = b.enemies[0]; b.emitSound({ x: 200, y: 340 }, 'rifle');
  for (let i = 0; i < 130; i++) b.update(0.025, controls);
  assert.equal(e.investigate, undefined); assert(e.x < 550, 'investigation followed live player instead');
  const pos = { x: e.x, y: e.y }; for (let i = 0; i < 30; i++) b.update(0.025, controls);
  assert.deepEqual({ x: e.x, y: e.y }, pos);
  e.angle = 0; b.player.x = e.x + 100; b.player.y = e.y;
  for (let i = 0; i < 10; i++) b.update(0.025, controls);
  assert(!e.soundOnly); assert(e.x > pos.x, 'visual detection did not resume combat');
});
test('wall pushing is silent while real movement emits bounded footsteps and sounds cap at 48', () => {
  const b = fixture('steel', [{ x: 568, y: 100, w: 4, h: 500 }]); b.enemies = [];
  b.player.x = 552; b.player.y = 200;
  for (let i = 0; i < 80; i++) b.update(0.025, { ...controls, x: 1 });
  assert.equal(b.player.x, 552); assert(!b.sounds.some(s => s.type === 'footstep'));
  b.update(0.025, { ...controls, x: -1 }); assert(b.sounds.some(s => s.type === 'footstep'));
  for (let i = 0; i < 200; i++) b.emitSound({ x: i * 20, y: 600 }, 'explosion');
  assert.equal(b.sounds.length, 48);
});
test('actual tactical updates expose flight then distinct expiring effects and fresh run clears all state', () => {
  for (const kind of ['grenade', 'flashbang']) {
    const b = fixture(); b.enemies = []; b.tactical = T.newTacticalLoadout(kind);
    assert(b.throwTactical()); b.update(0.05, controls); assert.equal(b.tacticalEffects.length, 0); assert.equal(b.tacticalThrows.length, 1);
    for (let i = 0; i < 7; i++) b.update(0.05, controls);
    assert.equal(b.tacticalThrows.length, 0); assert.equal(b.tacticalEffects[0].kind, kind);
    const effectLife = b.tacticalEffects[0].life;
    for (let i = 0; i <= Math.ceil(effectLife / 0.05); i++) b.update(0.05, controls);
    assert.equal(b.tacticalEffects.length, 0);
    const fresh = fixture(); assert.equal(fresh.tacticalThrows.length, 0); assert.equal(fresh.sounds.length, 0); assert.equal(fresh.doorForceCooldown.size, 0);
  }
});
test('continuous hard-wall obstruction never forces a leaf through geometry', () => {
  const wall = { x: 530, y: 260, w: 4, h: 25 }, b = fixture('steel', [wall]);
  for (let i = 0; i < 220; i++) { b.update(0.025, controls); assert(!C.rectIntersects(C.doorShape(b.doors[0], b.doors[0].angle, 18), wall)); }
  assert(!b.events.includes('door-forced')); assert(!b.events.includes('door-warning'));
});
test('attacker self obstruction does not accumulate player blocking failures', () => {
  const b = fixture(), e = b.enemies[0]; b.player.x = 800; b.player.y = 100;
  e.x = 550; e.y = 315;
  for (let i = 0; i < 8; i++) { b.doorAttempts.set(0,e); b.openDoor(b.doors[0],e); b.updateDoors(0.4); }
  assert.equal(e.doorBlockCount,0); assert(!e.forceOpen);
});
test('thin wall inside required door sweep safely cancels force rather than tunneling', () => {
  const wall = { x: 480, y: 245, w: 150, h: 4 }, b = fixture('steel', [wall]);
  for (let i = 0; i < 200; i++) b.update(0.025,controls);
  assert(!b.events.includes('door-forced')); assert(b.player.y >= 266); assert(!C.circleRect(b.player,17,wall));
  assert(!C.rectIntersects(C.doorShape(b.doors[0], b.doors[0].angle, 18),wall));
});
function forceByUpdates(b) {
  Object.assign(b.enemies[0], { soundOnly: true, investigate: { x: 550, y: 180 }, investigateTime: 20 });
  for (let i = 0; i < 220 && !b.player.knockback; i++) b.update(0.025, controls);
  assert(b.player.knockback, 'real third-failure force required');
}
for (const material of ['wood', 'steel']) test(material + ' reverse input and all active commands locked, reload timer continues, controls recover', () => {
  const b = fixture(material, [{ x: 0, y: 291, w: 498, h: 18 }, { x: 602, y: 291, w: 398, h: 18 }]); forceByUpdates(b);
  const p = b.player, angle = p.angle, end = { ...p.knockback.end }; p.ammo = 3;
  b.tactical = T.newTacticalLoadout('grenade');
  let frames = 0;
  while (p.knockback) {
    b.events = []; const y = p.y, target = b.doors[0].target;
    b.reload(); b.dodge(0, 1); b.shoot(); assert(!b.interactDoor()); assert(!b.throwTactical());
    assert.equal(p.reload, 0); assert.equal(p.dashTime, 0); assert.equal(b.doors[0].target, target);
    b.update(0.025, { x: 0, y: 1, angle: angle + 2, fire: true });
    assert(p.y < y); assert.equal(p.angle, angle); assert.equal(p.ammo, 3);
    assert(!b.events.some(e => ['shoot', 'dash', 'door-use', 'throw', 'reload'].includes(e))); frames++;
  }
  assert.equal(frames, 12); assert.deepEqual({ x: p.x, y: p.y }, end);
  b.update(0.025, { ...controls, x: 1 }); assert(p.x > end.x);
  b.reload(); assert(p.reload > 0);
  const fresh = fixture(material); forceByUpdates(fresh); fresh.player.reload = 0.1; fresh.player.ammo = 0;
  for (let i = 0; i < 5; i++) fresh.update(0.025, controls);
  assert.equal(fresh.player.ammo, fresh.hero.magazine); assert(fresh.player.knockback);
  const next = fixture(material); assert.equal(next.player.knockback, undefined);
});
test('trigger leaf initial overlap exits continuously and cannot close onto player afterwards', () => {
  const b = fixture('steel', [{ x: 0, y: 291, w: 498, h: 18 }, { x: 602, y: 291, w: 398, h: 18 }]);
  Object.assign(b.enemies[0], { soundOnly: true, investigate: { x: 550, y: 180 }, investigateTime: 20 });
  // Move inside final vertical leaf during actual warning, not by injecting knockback.
  for (let i = 0; i < 200 && !b.enemies[0].forceOpen; i++) b.update(0.025, controls);
  b.player.x = 510;
  for (let i = 0; i < 30 && !b.player.knockback; i++) b.update(0.025, controls);
  assert(b.player.knockback); assert(C.circleRect(b.player, 17, C.doorShape(b.doors[0])));
  const k = b.player.knockback, start = { x: b.player.x, y: b.player.y };
  b.doors[0].target = b.doors[0].baseAngle;
  while (b.player.knockback) { b.update(0.025, controls); assert.equal(b.doors[0].angle, -Math.PI / 2); }
  assert(Math.hypot(b.player.x - start.x, b.player.y - start.y) > 50);
  assert(!C.circleRect(b.player, 17, C.doorShape(b.doors[0]))); assert(!k.exiting);
  for (let i = 0; i < 40; i++) { b.update(0.025, controls); assert(!C.circleRect(b.player, 17, C.doorShape(b.doors[0]))); }
});
test('planned knockback stays clear of thin wall and unrelated closed door each frame', () => {
  for (const otherDoor of [false, true]) {
    const wall = { x: 480, y: 245, w: 150, h: 2 };
    const b = fixture('steel', otherDoor ? [] : [wall]);
    if (otherDoor) { b.doors.push({ ...b.doors[0], id: 1, x: 480, y: 245, length: 150 }); b.syncGeometry(); }
    for (let i = 0; i < 240; i++) {
      b.update(0.025, controls);
      assert(!C.circleRect(b.player, 17, otherDoor ? C.doorShape(b.doors[1]) : wall));
    }
    assert(!b.player.knockback); assert(!b.events.includes('door-forced'));
  }
});
console.log(`${passed} tactical domain and integration tests passed`);
