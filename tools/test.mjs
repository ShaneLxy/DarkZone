import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(root, 'assets/scripts/' + name + '.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, strict: true } }).outputText;
  const m = { exports: {} }; cache.set(name, m.exports);
  new Function('require', 'module', 'exports', js)(id => load(id.replace('./', '')), m, m.exports); return m.exports;
}
const { Battle, DORM_LEVEL, HEROINE_ID, ALLY_VISION_RANGE, heroStats, profileGrowth, trainingCost, sightRange, visible, visibilityPolygon, doorSurfacePolygon, walkable, lineClear, rayRect, doorShape, circleRect, rectCorners, newProfile, readProfile, recruit, upgrade, roomAt } = load('Core');
const { configuredHero } = load('WeaponMods');
const { installMod, salvageMod } = load('Shop');
const { createApartmentRun, createDormRun, createStreet } = load('Levels');
const { operationLevel, OPERATION_HOLD, OPERATION_WIDTH, OPERATION_HEIGHT, OPERATION_ENEMY_CAP, OPERATION_MG } = load('Operation');
const { exitGuideAngle } = load('ExitGuide');
const { FLOOR_DETAIL_ART, scatterFloorDetails } = load('FloorDetails');
const { AmbientWildlife } = load('AmbientWildlife');
const { readDailyMissions, recordExploration, claimDailyMission, dailyActivity, claimDailyMilestone } = load('DailyMissions');
const { checkInStatus, claimCheckInDay, claimCheckInChest, refreshCheckIn } = load('CheckIn');
const { CASE_IDS, CASE_POOLS, CASE_ROLL_TIME, caseRollProgress, prepareCaseOpening, sampleCasePrize } = load('LootCases');
let passed = 0;
function test(name, run) { run(); console.log('PASS ' + name); passed++; }
const dormIdle = { x: 0, y: 0, angle: 0, fire: false };
test('operation gates its three stages, spends air support once, and preserves the defense timer outside the rally point', () => {
  const city = operationLevel('city'), compound = operationLevel('compound'), defense = operationLevel('defense');
  const battle = new Battle(0, 1, city);
  const tick = count => { for (let i = 0; i < count; i++) battle.update(.05, dormIdle); };
  assert.equal(battle.advanceOperation(compound), false);
  assert.equal(battle.useOperationSupport(), true);
  assert.equal(battle.useOperationSupport(), false);
  tick(18);
  assert(battle.tacticalEffects.some(effect => effect.kind === 'grenade'));
  for (const enemy of battle.enemies) enemy.hp = 0;
  Object.assign(battle.player, { ...city.exit, hp: 49, ammo: 6 });
  battle.allies[0].hp = 0;
  tick(1);
  assert(battle.operationRun.ready);
  const entryHealth = battle.player.hp;
  assert(battle.advanceOperation(compound));
  assert.equal(battle.allies[0].hp, 0);
  assert.equal(battle.player.hp, entryHealth);
  assert.equal(battle.player.ammo, 6);
  assert.equal(battle.operationRun.airSupport, false);
  const leader = battle.enemies.find(enemy => enemy.operationBoss === 'leader');
  assert(leader && leader.hp > 0);
  const killsBeforeBoss = battle.kills, fragmentsBeforeBoss = battle.deathFragments.length;
  battle.damageEnemy(leader, 9999);
  assert.equal(leader.hp, 0);
  assert.equal(battle.kills, killsBeforeBoss);
  assert.equal(battle.deathFragments.length, fragmentsBeforeBoss);
  const king = battle.enemies.find(enemy => enemy.operationBoss === 'king');
  assert(king && king.hp === 1100);
  for (const enemy of battle.enemies) if (enemy !== king && enemy.hp > 0) enemy.hp = 0;
  battle.damageEnemy(king, 9999);
  assert.equal(king.hp, 0);
  assert.equal(battle.kills, killsBeforeBoss);
  assert.equal(battle.deathFragments.length, fragmentsBeforeBoss);
  assert(battle.operationRun.kingEscaped);
  Object.assign(battle.player, compound.exit);
  tick(1);
  assert(battle.operationRun.ready);
  assert(battle.advanceOperation(defense));
  assert.equal(battle.allies.length, 2);
  assert(battle.allies.every(ally => ally.hp > 0));
  assert.equal(battle.player.hp, battle.player.maxHp);
  battle.player.invulnerable = 120;
  Object.assign(battle.player, defense.exit);
  tick(20);
  assert.equal(battle.operationRun.hold, OPERATION_HOLD);
  for (const point of defense.operation.route) { Object.assign(battle.player, point); tick(1); }
  assert(battle.operationRun.announced);
  Object.assign(battle.player, defense.spawn);
  tick(40);
  assert.equal(battle.operationRun.hold, OPERATION_HOLD);
  Object.assign(battle.player, defense.exit);
  tick(300);
  assert(battle.operationRun.ready);
  assert.equal(battle.status, 'playing');
  assert(battle.enemies.filter(enemy => enemy.hp > 0).length <= OPERATION_ENEMY_CAP);
  assert(battle.enemies.some(enemy => enemy.id >= city.spawns.length + compound.spawns.length + defense.spawns.length));
});
test('chapter four bosses survive zero health, sweep the squad and carry survivors into defense', () => {
  const compound = operationLevel('compound'), defense = operationLevel('defense');
  const battle = new Battle(0, 1, compound);
  const tick = count => { for (let i = 0; i < count; i++) battle.update(.05, dormIdle); };
  assert.equal(battle.operationRun.phase, 'leader-fight');
  const leader = battle.enemies.find(enemy => enemy.operationBoss === 'leader');
  assert(leader && leader.hp === 650);
  battle.damageEnemy(leader, 9999);
  assert.equal(leader.hp, 0);
  assert.equal(battle.operationRun.phase, 'king-fight');
  const king = battle.enemies.find(enemy => enemy.operationBoss === 'king');
  assert.equal(king.hp, 1100);
  assert.equal(battle.operationRun.survivors, 2);
  assert.equal(battle.allies.filter(ally => ally.hp > 0).length, 2);
  battle.player.invulnerable = 999;
  Object.assign(battle.player, { x: king.x, y: king.y });
  tick(90);
  assert(battle.events.includes('operation-slam'));
  battle.damageEnemy(king, 9999);
  assert.equal(king.hp, 0);
  assert(battle.operationRun.kingEscaped);
  tick(1);
  assert.equal(battle.operationRun.phase, 'new-order');
  for (const enemy of battle.enemies) if (enemy.hp > 0) enemy.hp = 0;
  Object.assign(battle.player, compound.exit);
  tick(1);
  assert(battle.operationRun.ready);
  assert(battle.advanceOperation(defense));
  assert.equal(battle.allies.length, 2);
  assert.equal(battle.operationRun.phase, 'retreat');

  const lone = new Battle(0, 1, operationLevel('compound'));
  for (const ally of lone.allies) ally.hp = 0;
  const loneLeader = lone.enemies.find(enemy => enemy.operationBoss === 'leader');
  lone.damageEnemy(loneLeader, 9999);
  assert.equal(lone.operationRun.survivors, 0);
  const loneKing = lone.enemies.find(enemy => enemy.operationBoss === 'king');
  lone.damageEnemy(loneKing, 9999);
  for (const enemy of lone.enemies) if (enemy.hp > 0) enemy.hp = 0;
  Object.assign(lone.player, compound.exit);
  for (let i = 0; i < 2; i++) lone.update(.05, dormIdle);
  assert(lone.operationRun.ready);
  assert(lone.advanceOperation(defense));
  assert.equal(lone.allies.length, 0);
});
test('operation daylight doubles outdoor sight, restores indoor sight, spreads the squad and extends support fire', () => {
  const city = operationLevel('city'), compound = operationLevel('compound');
  const battle = new Battle(0, 1, city);
  assert.equal(battle.visionScale, 2);
  assert.equal(battle.playerVisionRange, battle.stats.visionRange * 2);
  assert.equal(battle.allyVisionRange, ALLY_VISION_RANGE * 2);
  assert.equal(new Battle(0, 1, compound).visionScale, 1);
  assert.equal(new Battle(0, 1, compound).playerVisionRange, battle.stats.visionRange);
  const slots = battle.squadSlots(false);
  assert(slots.some(slot => slot.back < 0), 'wedge should place a point man ahead of the player');
  assert(slots.some(slot => Math.abs(slot.side) >= 115), 'wedge should spread the flanks');

  const squad = new Battle(0, 1, city);
  squad.enemies = [];
  Object.assign(squad.player, { x: 2200, y: 700, angle: 0 });
  squad.allies.forEach((ally, index) => Object.assign(ally, {
    x: 2200 + Math.cos(index * Math.PI / 4) * 40, y: 700 + Math.sin(index * Math.PI / 4) * 40,
    angle: 0, cooldown: 20,
  }));
  for (let i = 0; i < 40; i++) squad.update(0.05, dormIdle);
  const live = squad.allies.filter(ally => ally.hp > 0);
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++)
    assert(Math.hypot(live[i].x - live[j].x, live[i].y - live[j].y) >= 18, 'squad members should not overlap');
  assert(Math.max(...live.map(ally => ally.x)) - Math.min(...live.map(ally => ally.x)) > 150,
    'wedge should spread the squad across the street');

  const probe = new Battle(0, 1, city);
  probe.enemies = [];
  Object.assign(probe.player, { x: 2200, y: 700, angle: 0 });
  for (const ally of probe.allies) Object.assign(ally, { x: 2200, y: 700, angle: 0, cooldown: 0, ammo: 18 });
  probe.spawnEnemy([0, 2650, 700, 'gunner']);
  for (let i = 0; i < 12; i++) probe.update(0.05, dormIdle);
  assert(probe.events.includes('support-shot') || probe.events.includes('support-shot-suppressed'),
    'allies should engage a target beyond the old 305px sight radius');
});
test('operation actor spawns, cover and both doorways admit a continuous path to the objective', () => {
  for (const part of ['city', 'compound', 'defense']) {
    const level = operationLevel(part), battle = new Battle(0, 1, level);
    for (const point of [level.spawn, level.exit, ...battle.allies, ...battle.enemies, ...battle.loot,
      ...level.operation.reinforcements.filter(() => part === 'defense')]) {
      assert(walkable(point, 16, battle.blockers, level.rooms), `${part} ${point.x},${point.y}`);
    }
    const step = 8, cols = OPERATION_WIDTH / step, rows = OPERATION_HEIGHT / step;
    const at = p => Math.round(p.y / step) * cols + Math.round(p.x / step);
    const visited = new Set([at(level.spawn)]), queue = [at(level.spawn)];
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const cell = queue[cursor], x = cell % cols, y = Math.floor(cell / cols);
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        const next = ny * cols + nx;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || visited.has(next)) continue;
        if (!walkable({ x: nx * step, y: ny * step }, 17, battle.obstacles, level.rooms)) continue;
        queue.push(next); visited.add(next);
      }
    }
    for (const point of [level.exit, ...level.operation.route, ...battle.enemies, ...battle.loot]) {
      assert(visited.has(at(point)), `${part} route ${point.x},${point.y}`);
    }
  }
});
test('operation machine guns engage on sight and cover stops hostile bullets', () => {
  const battle = new Battle(0, 1, operationLevel('city'));
  const gun = battle.enemies.find(enemy => enemy.appearance === OPERATION_MG);
  battle.enemies = [gun]; battle.allies = [];
  Object.assign(battle.player, { x: 2860, y: 662, angle: 0 });
  for (let i = 0; i < 62; i++) battle.update(.05, dormIdle);
  assert(battle.player.hp < battle.player.maxHp);
  assert.equal(gun.x, 2990);
  const hp = battle.player.hp;
  Object.assign(battle.player, { x: 2760, y: 908, angle: 0, invulnerable: 0 });
  assert(!lineClear(battle.player, gun, battle.blockers));
  for (let i = 0; i < 42; i++) battle.update(.05, dormIdle);
  assert.equal(battle.player.hp, hp);
});
test('local sign-in crosses 05:00, retains missed-day progress and saves rewards exactly once', () => {
  const p = readProfile(JSON.stringify({ version: 3, materials: 150, coins: 20, tickets: 6 }));
  const at = (day, hour, minute = 0) => new Date(2026, 10, day, hour, minute);
  assert.equal(checkInStatus(p.checkIn, at(1, 5)).daily, 1);
  assert.deepEqual(claimCheckInDay(p, 1, at(1, 5)), { coins: 60 });
  assert.equal(claimCheckInDay(p, 2, at(2, 4, 59)), undefined);
  assert.deepEqual(claimCheckInDay(p, 2, at(2, 5)), { materials: 30 });
  assert.equal(checkInStatus(p.checkIn, at(6, 8)).daily, 3);
  assert.equal(claimCheckInChest(p, 3, at(6, 8)), undefined);
  assert.deepEqual(claimCheckInDay(p, 3, at(6, 8)), { coins: 80 });
  assert.deepEqual(claimCheckInChest(p, 3, at(6, 8)), { coins: 100, materials: 25 });
  const saved = readProfile(JSON.stringify(p));
  assert.equal(claimCheckInDay(saved, 3, at(6, 8)), undefined);
  assert.equal(claimCheckInChest(saved, 3, at(6, 8)), undefined);
  assert.deepEqual([saved.checkIn.count, saved.coins, saved.materials, saved.tickets], [3, 260, 205, 6]);
});
test('the final day stays visible until 05:00 and unclaimed chests carry over as wallet rewards once', () => {
  let p = newProfile();
  for (let day = 1; day <= 14; day++) assert(claimCheckInDay(p, day, new Date(2026, 10, day, 8)));
  assert(claimCheckInChest(p, 7, new Date(2026, 10, 14, 8)));
  assert.equal(refreshCheckIn(p, new Date(2026, 10, 15, 4, 59)), undefined);
  assert.equal(p.checkIn.count, 14);
  const { coins, materials, tickets } = p;
  const morning = new Date(2026, 10, 15, 5);
  assert.deepEqual(refreshCheckIn(p, morning), { coins: 260, materials: 195, tickets: 2 });
  p = readProfile(JSON.stringify(p));
  assert.equal(refreshCheckIn(p, morning), undefined);
  assert.equal(checkInStatus(p.checkIn, morning).daily, 1);
  assert.deepEqual([p.coins, p.materials, p.tickets], [coins + 260, materials + 195, tickets + 2]);
  assert.equal(claimCheckInChest(p, 14, morning), undefined);
  assert(claimCheckInDay(p, 1, morning));
});
test('apartment exterior spawns a bounded horde offscreen and seals the entry after crossing', () => {
  const [stage] = createApartmentRun(17), b = new Battle(HEROINE_ID, 1, stage);
  const { room } = stage.apartment.outdoor;
  const inside = { x: 1004, y: 1083 }, outside = { x: 1004, y: 1170 };
  const tick = (steps, controls = dormIdle) => { for (let i = 0; i < steps; i++) b.update(.05, controls); };
  const alive = () => b.enemies.filter(e => e.room === room && e.hp > 0 && e.type === 'walker');
  assert.equal(alive().length, 10);
  assert.equal(roomAt(b.player, b.rooms), room);
  assert(!lineClear(inside, outside, b.blockers));
  assert(lineClear(inside, outside, b.visionBlockers));
  assert.equal(exitGuideAngle(b), undefined);
  b.player.invulnerable = 100;
  tick(59);
  assert(!b.enemies.some(e => e.type === 'boss'));
  tick(2);
  const brute = b.enemies.find(e => e.type === 'boss');
  assert(brute && !b.sees(brute));
  assert(exitGuideAngle(b) < -1.5);
  alive()[0].hp = 0;
  tick(15);
  assert.equal(alive().length, 10);
  assert.equal(b.enemies.length, 11);
  Object.assign(b.player, { x: 1004, y: 1220 });
  tick(1);
  assert(b.apartment.entryOpen);
  assert(lineClear(inside, outside, b.blockers));
  b.enemies = [brute];
  tick(21, { ...dormIdle, y: -1, angle: -Math.PI / 2 });
  assert.equal(b.apartment.phase, 'entry-talk');
  assert(!b.apartment.entryOpen);
  assert(!lineClear(inside, outside, b.blockers));
  const outsideCount = alive().length;
  tick(20);
  assert.equal(alive().length, outsideCount);
  assert.equal(roomAt(brute, b.rooms), room);
});
test('lobby meeting room door clears the repositioned planter from both sides', () => {
  const [stage] = createApartmentRun(17);
  for (const y of [407, 515]) {
    const b = new Battle(HEROINE_ID, 1, stage);
    const door = b.doors.find(d => d.rooms.includes(7));
    Object.assign(b.player, { x: door.x + 63, y });
    b.enemies.length = 0;
    assert.equal(b.nearbyDoor(), door);
    assert(b.interactDoor());
    for (let i = 0; i < 16; i++) b.update(.05, dormIdle);
    assert(Math.abs(door.angle - door.baseAngle) > 1.56);
    assert(lineClear({ x: door.x + 63, y: 407 }, { x: door.x + 63, y: 515 }, b.blockers));
  }
});
test('tank charge is telegraphed, accelerates, and knocks the player back over time', () => {
  const [stage] = createApartmentRun(17), b = new Battle(HEROINE_ID, 1, stage);
  const brute = b.spawnEnemy([5, 915, 1480, 'boss']);
  b.enemies = [brute]; b.apartment.tankArrived = true;
  Object.assign(b.player, { x: 1095, y: 1480 });
  b.update(.05, dormIdle);
  assert.equal(brute.charge.phase, 'windup');
  while (brute.charge.phase === 'windup') b.update(.05, dormIdle);
  const start = brute.x;
  b.update(.05, dormIdle);
  const early = brute.x - start;
  for (let i = 0; i < 4; i++) b.update(.05, dormIdle);
  const middle = brute.x;
  b.update(.05, dormIdle);
  assert(brute.x - middle > early);
  for (let i = 0; i < 20 && !b.player.knockback; i++) b.update(.05, dormIdle);
  assert.equal(brute.charge.phase, 'recover');
  assert.equal(b.player.hp, b.player.maxHp - 42);
  assert(b.player.knockback);
  assert.equal(b.player.x, 1095);
  b.update(.025, dormIdle);
  assert(b.player.x > 1095 && b.player.x < 1223);
});
test('tank displaces smaller units while keeping walls and other large bodies solid', () => {
  const [stage] = createApartmentRun(17), b = new Battle(HEROINE_ID, 1, stage);
  const tank = b.spawnEnemy([5, 918, 1500, 'boss']);
  const walker = b.spawnEnemy([5, 959, 1500, 'walker']);
  const otherTank = b.spawnEnemy([5, 1120, 1500, 'boss']);
  b.enemies = [tank, walker, otherTank];
  Object.assign(b.player, { x: 1280, y: 1515 });
  b.indexUnits();
  b.move(tank, 45, 0, 25);
  assert(tank.x > 960 && walker.x > 1000);
  assert(Math.hypot(tank.x - walker.x, tank.y - walker.y) >= 40);
  b.move(tank, 150, 0, 25);
  assert.equal(otherTank.x, 1120);
  assert(Math.hypot(walker.x - otherTank.x, walker.y - otherTank.y) >= 40);
  assert(Math.hypot(tank.x - walker.x, tank.y - walker.y) >= 40);
  Object.assign(tank, { x: 1010, y: 1200, angle: -Math.PI / 2 });
  assert(b.bruteChargePreview(tank).length < 90, 'closed entrance limits the rectangular charge warning');
});
test('entrance trap shocks nearby enemies, interrupts the tank and expires before it affects movement again', () => {
  const [stage] = createApartmentRun(17), b = new Battle(HEROINE_ID, 1, stage);
  b.apartment.tankArrived = true;
  const trap = b.apartment.traps[0];
  const brute = b.spawnEnemy([5, trap.x + 18, trap.y, 'boss']);
  const walker = b.spawnEnemy([5, trap.x - 62, trap.y, 'walker']);
  brute.charge = { phase: 'dash', time: .1, angle: Math.PI / 2 };
  b.enemies = [brute, walker];
  b.update(.05, dormIdle);
  assert.equal(trap.charge, 0);
  assert(brute.paralysis > 0 && walker.paralysis > brute.paralysis);
  assert.equal(brute.charge, undefined);
  assert.equal(brute.x, trap.x + 18);
  assert.equal(walker.x, trap.x - 62);
  for (let i = 0; i < 24; i++) b.update(.05, dormIdle);
  assert.equal(brute.paralysis, 0);
  assert(walker.paralysis > 0);
});
test('apartment tank heavy footfalls remain spaced out while walking', () => {
  const [stage] = createApartmentRun(17), b = new Battle(HEROINE_ID, 1, stage);
  const brute = b.spawnEnemy([5, 1005, 1750, 'boss']);
  b.enemies = [brute]; b.apartment.tankArrived = true;
  Object.assign(b.player, { x: 1005, y: 1200, invulnerable: 100 });
  b.apartment.traps.length = 0;
  const steps = [];
  for (let i = 0; i < 64; i++) {
    b.update(.05, dormIdle);
    if (b.bruteFootfalls.length) { assert.equal(b.bruteFootfalls.length, 1); steps.push(b.elapsed); }
  }
  assert(steps.length >= 3 && steps.every((time, i) => !i || time - steps[i - 1] >= .55));
  assert(roomAt(brute, b.rooms) === 5);
  brute.stun = 1;
  b.update(.05, dormIdle);
  assert.equal(b.bruteFootfalls.length, 0);
});
test('apartment run restores power, arms the engineer at home and escapes from the garage by car', () => {
  const [arrival, garage, defense, home] = createApartmentRun(17), b = new Battle(HEROINE_ID, 1, arrival);
  for (const stage of [arrival, garage, defense, home]) {
    const floor = new Battle(HEROINE_ID, 1, stage);
    for (const [room, x, y, type] of [...stage.spawns, ...(stage.apartment.reinforcements ?? [])]) {
      assert.equal(roomAt({ x, y }, floor.rooms), room);
      assert(walkable({ x, y }, type === 'boss' ? 25 : 16, floor.blockers, floor.rooms), JSON.stringify({ floor: stage.id, x, y }));
    }
  }
  const station = (id, offset = {}) => Object.assign(b.player, b.stage.apartment.stations.find(s => s.id === id).point, offset);
  const tick = (seconds, controls = dormIdle) => { for (let i = 0; i < Math.ceil(seconds * 20); i++) b.update(0.05, controls); };
  const walk = (x, y) => {
    for (let i = 0; i < 400; i++) {
      const dx = x - b.player.x, dy = y - b.player.y;
      if (Math.hypot(dx, dy) < 10) return;
      const angle = Math.atan2(dy, dx);
      b.update(0.05, { ...dormIdle, x: Math.cos(angle), y: Math.sin(angle), angle });
    }
    assert.fail(`blocked near ${b.player.x},${b.player.y} while walking to ${x},${y}`);
  };
  station('stairs'); assert(!b.nearbyObjective() || b.nearbyObjective().station !== 'stairs');
  b.player.invulnerable = 100;
  tick(3.1);
  Object.assign(b.player, { x: 1004, y: 1210 });
  walk(1004, 1083); assert.equal(b.apartment.phase, 'entry-talk');
  assert.equal(b.apartment.kits, 1); assert(b.enemies.every(e => e.room === arrival.apartment.outdoor.room));
  tick(25); assert.equal(b.apartment.phase, 'training');
  Object.assign(b.player, { x: 675, y: 640 }); assert(!b.placeApartmentTrap());
  Object.assign(b.player, arrival.apartment.training.center); const enemyCount = b.enemies.length; assert(b.placeApartmentTrap());
  Object.assign(b.player, { x: 1515, y: 875, invulnerable: 60 });
  tick(12);
  assert.equal(b.apartment.phase, 'stairs'); assert.equal(b.apartment.traps.at(-1).charge, 1); assert.equal(b.enemies.length, enemyCount);
  assert.equal(b.apartment.kits, 0);
  station('stairs'); assert(b.interact()); assert(!b.descend(home));
  b.player.hp = 81; b.reserveAmmo = 41;
  assert(b.descend(garage)); assert.equal(b.player.hp, 81); assert.equal(b.reserveAmmo, 41);
  b.enemies.length = 0;
  walk(315, 1092); walk(2340, 1092); walk(2340, 430); walk(2248, 430);
  assert(b.interactDoor()); tick(0.65); walk(2248, 316); walk(2278, 238);
  assert(b.interact()); assert.equal(b.generatorProgress, 0);
  tick(1); assert(b.generatorProgress > 0.3 && b.generatorProgress < 0.35);
  tick(0.05, { ...dormIdle, x: 1 }); assert.equal(b.generatorProgress, undefined); assert.equal(b.apartment.phase, 'generator');
  assert(b.interact()); tick(2.95); assert.equal(b.apartment.phase, 'generator'); assert.equal(b.apartment.queue.length, 0);
  tick(0.05); assert.equal(b.apartment.phase, 'return'); assert.equal(b.generatorProgress, undefined);
  tick(2); assert(b.enemies.length > 0); b.enemies.length = 0; b.apartment.queue.length = 0;
  walk(2248, 316); walk(2248, 430); walk(2340, 430); walk(2340, 1092); walk(315, 1092); walk(315, 1322);
  const generatorDoor = b.doors[0];
  const loot = b.loot[0]; if (loot) loot.taken = true;
  assert(b.interact()); assert(b.descend(defense)); assert(b.enemies.every(e => e.room !== 1));
  station('lift'); assert(!b.nearbyObjective() || b.nearbyObjective().station !== 'lift');
  Object.assign(b.player, defense.spawn);
  b.enemies.length = 0; walk(1988, 535); walk(1935, 526); assert(b.interactDoor()); tick(0.65);
  walk(1935, 411); walk(1974, 355); assert(b.interact()); assert(b.apartmentShutter);
  b.apartment.queue.length = 0;
  b.hurtAlly(b.apartment.engineer, 999, { angle: 0, distance: 0 });
  tick(0.5); assert.equal(b.apartment.timer, 14);
  Object.assign(b.player, { x: 1880, y: 570 }); assert(b.interact()); assert(b.apartment.engineer.hp > 0);
  tick(22); assert.equal(b.apartment.phase, 'lift');
  assert(!b.engineerArmed);
  station('lift'); assert(b.interact()); assert(b.descend(home)); assert.equal(b.apartment.phase, 'note');
  assert(!b.engineerArmed);
  b.enemies.length = 0;
  walk(1180, 753); walk(1981, 753); walk(1981, 789);
  assert(b.interactDoor()); tick(0.65); walk(1981, 931); walk(1945, 1011); walk(1830, 1011);
  assert(b.interact()); assert.equal(b.apartment.phase, 'gear');
  assert(!b.engineerArmed);
  walk(1945, 1011); walk(1981, 931); walk(1981, 753); walk(1180, 753); walk(1180, 1020);
  tick(29);
  assert(b.engineerArmed);
  assert.equal(b.apartment.phase, 'escape');
  assert.equal(b.tactical.remaining, 3);
  assert(b.interact()); assert(b.descend(garage));
  assert.equal(b.apartment.phase, 'car-prep');
  assert(b.engineerArmed);
  assert.equal(b.doors[0], generatorDoor);
  if (loot) assert(b.loot[0].taken);
  assert(!b.placeApartmentTrap());
  b.enemies.length = 0;
  walk(625, 1130); walk(321, 1130); walk(224, 1060); walk(224, 940);
  assert(b.placeApartmentTrap()); walk(224, 840);
  tick(10); assert(b.interact()); assert.equal(b.apartment.timer, 20);
  b.player.invulnerable = 30;
  tick(19.95); assert.equal(b.apartment.phase, 'car-hold');
  tick(0.1); assert.equal(b.apartment.phase, 'car-ready');
  assert(b.enemies.some(unit => unit.hp > 0));
  assert(b.interact()); assert.equal(b.apartment.phase, 'driving');
  const enemy = b.spawnEnemy([0, 322, 630, 'walker']);
  tick(1); assert.equal(b.status, 'playing'); assert(b.player.y < 832);
  tick(4); assert.equal(enemy.hp, 0); assert.equal(b.status, 'won');
  const profile = newProfile(), street = new Battle(HEROINE_ID, 1, createStreet(17));
  assert.equal(profile.owned[4], false);
  assert(b.claimReward(profile)); assert.equal(readProfile(JSON.stringify(profile)).owned[4], true);
  assert(!profile.apartmentUnlocked); street.status = 'won'; assert(street.claimReward(profile));
  assert(readProfile(JSON.stringify(profile)).apartmentUnlocked);
});
test('parking layouts retain two return routes and every ninth-floor apartment door swings freely', () => {
  const connected = (battle, start, finish, radius) => {
    const key = p => `${p.x},${p.y}`;
    const queue = [start], seen = new Set([key(start)]);
    for (let i = 0; i < queue.length; i++) {
      const point = queue[i];
      if (Math.hypot(point.x - finish.x, point.y - finish.y) < 25) return true;
      for (const [dx, dy] of [[20, 0], [-20, 0], [0, 20], [0, -20]]) {
        const next = { x: point.x + dx, y: point.y + dy };
        if (seen.has(key(next)) || !walkable(next, radius, battle.blockers, battle.rooms)) continue;
        seen.add(key(next)); queue.push(next);
      }
    }
    return false;
  };
  for (const seed of [1, 17, 53, 199, 824, 16384, 865913, 4294967295]) {
    const [, garage] = createApartmentRun(seed);
    const b = new Battle(HEROINE_ID, 1, garage);
    assert.equal(garage.apartment.decals.filter(decal => decal.art === 'parking-bay').length, 24);
    const options = garage.furniture.filter(f => /^garage-(sedan|suv)/.test(f.kind));
    assert(options.length >= 6);
    // Close off the northern lane to check that the loop still connects around the parking rows.
    b.blockers.push({ x: 1135, y: 1020, w: 24, h: 185 });
    assert(connected(b, garage.spawn, { x: 2248, y: 420 }, 25), `parking layout ${seed} cuts off the loop`);
  }
  const [, , , home] = createApartmentRun(17);
  for (const [index, spec] of home.doors.entries()) {
    for (const side of [-1, 1]) {
      const b = new Battle(HEROINE_ID, 1, home);
      b.enemies.length = 0;
      const approach = { x: spec.x + 62, y: spec.y + side * 49 };
      Object.assign(b.player, approach);
      assert(walkable(approach, 16, b.blockers, b.rooms), spec.name);
      assert.equal(b.nearbyDoor()?.id, index);
      assert(b.interactDoor(), spec.name);
      for (let i = 0; i < 14; i++) b.update(0.05, dormIdle);
      assert(Math.abs(b.doors[index].angle - b.doors[index].baseAngle) > 1.5, spec.name);
    }
  }
});
test('nearby exit guidance respects each level prerequisite and direction', () => {
  for (const stage of createDormRun(2)) {
    const b = new Battle(HEROINE_ID, 1, stage); Object.assign(b.player, { x: stage.exit.x - 100, y: stage.exit.y });
    assert.equal(exitGuideAngle(b), undefined);
    b.keys.add(stage.dorm.pickup.id); assert.equal(exitGuideAngle(b), 0);
    b.player.x = stage.exit.x - 651; assert.equal(exitGuideAngle(b), undefined);
    b.player.x = stage.exit.x; b.player.y = stage.exit.y - 100; assert.equal(exitGuideAngle(b), Math.PI / 2);
  }
  const b = new Battle(HEROINE_ID, 1, createStreet(1)); Object.assign(b.player, { x: b.stage.exit.x - 100, y: b.stage.exit.y });
  assert.equal(exitGuideAngle(b), undefined); b.alarmTime = 0; assert.equal(exitGuideAngle(b), 0);
  b.status = 'won'; assert.equal(exitGuideAngle(b), undefined);
});
const streetPoint = ({ x, y, ...rest }) => ({ x: x > 520 ? x + 640 : x, y: y + 600, ...rest });
test('limited ammo, interrupted supplies, loot and saved coins survive a floor transition', () => {
  const [upper, lower] = createDormRun(12);
  const b = new Battle(HEROINE_ID, 1, upper), p = b.player;
  b.enemies = [];
  p.invulnerable = 100;
  assert.equal(p.ammo, 12); assert.equal(b.reserveAmmo, 48);
  assert.equal(new Battle(0).reserveAmmo, 264);
  p.ammo = 7; b.reserveAmmo = 3; b.reload();
  for (let i = 0; i < 30; i++) b.update(0.05, dormIdle);
  assert.equal(p.ammo, 10); assert.equal(b.reserveAmmo, 0);
  p.ammo = 0; b.reload(); assert.equal(p.reload, 0);
  const bandage = b.loot.find(item => item.kind === 'bandage');
  Object.assign(p, bandage, { angle: 0, hp: 50 });
  assert(b.collectPickup()); assert.equal(b.supplies.bandage, 1); assert(bandage.taken);
  assert(b.useSupply('bandage')); b.dodge(1, 0);
  assert(!b.usingSupply && b.supplies.bandage === 1);
  p.dashTime = 0; p.dash = 0;
  assert(b.useSupply('bandage'));
  for (let i = 0; i < 120; i++) b.update(0.05, dormIdle);
  assert(p.hp >= 74.9 && p.hp <= 75.1);
  b.supplies.drink = 1; assert(b.useSupply('drink'));
  for (let i = 0; i < 6; i++) b.update(0.05, dormIdle);
  assert(b.speedTime > 9 && p.hp >= 85);
  const coins = b.loot.find(item => item.kind === 'coins');
  Object.assign(p, coins, { angle: 0 }); assert(b.collectPickup()); assert.equal(b.coins, 20);
  b.floorPending = true; assert(b.descend(lower)); assert.equal(b.coins, 20); assert.equal(b.reserveAmmo, 0);
  b.status = 'lost'; const profile = newProfile(); assert.equal(b.claimReward(profile).coins, 20);
  assert.equal(readProfile(JSON.stringify(profile)).coins, 20); assert.equal(b.claimReward(profile), null);
});
test('street seeds leave both routes open and the horde follows without requiring a clear', () => {
  for (const seed of [0, 2397, 99183, 0xffffffff]) {
    const stage = createStreet(seed);
    assert.deepEqual(stage, createStreet(seed));
    const battle = new Battle(HEROINE_ID, 1, stage);
    assert(!lineClear(streetPoint({ x: 618, y: 606 }), streetPoint({ x: 956, y: 606 }), battle.blockers), 'the bus blocks bullets and sight');
    for (const [room, x, y] of [...stage.spawns, ...stage.street.waves.flatMap(wave => wave.entries), ...stage.street.streams.flat()]) {
      assert.equal(roomAt({ x, y }, stage.rooms), room);
      assert(walkable({ x, y }, 17, battle.blockers, stage.rooms), JSON.stringify({ seed, room, x, y }));
    }
    for (const [a, b] of [[{ x: 3240, y: 650 }, { x: 3340, y: 650 }], [{ x: 1740, y: -360 }, { x: 1740, y: -450 }], [{ x: 1860, y: 2270 }, { x: 1860, y: 2340 }]].map(pair => pair.map(streetPoint))) {
      assert(walkable(a, 17, battle.blockers, stage.rooms));
      assert(!lineClear(a, b, battle.blockers), 'roadblock stops travel into visible continuation');
    }
    const routes = [
      [{ x: 570, y: 693 }, { x: 1510, y: 693 }],
      [{ x: 570, y: 710 }, { x: 828, y: 710 }, { x: 828, y: 836 }, { x: 828, y: 1020 }, { x: 1360, y: 1020 }, { x: 1360, y: 697 }, { x: 1510, y: 697 }],
    ];
    const main = [{ x: 1860, y: 697 }, { x: 1860, y: 2135 }, { x: 3910, y: 2135 }].map(streetPoint).concat([stage.exit]);
    for (const [routeIndex, points] of routes.entries()) {
      const run = new Battle(HEROINE_ID, 1, stage), p = run.player;
      run.enemies = [];
      run.updateAlarm = () => { if (roomAt(p, [stage.street.trigger]) >= 0) run.alarmTime ??= 0; };
      for (const point of [...points.map(streetPoint), ...main]) {
        for (let i = 0; i < 420 && Math.hypot(p.x - point.x, p.y - point.y) > 5 && run.status === 'playing'; i++) {
          const angle = Math.atan2(point.y - p.y, point.x - p.x);
          run.update(0.05, { x: Math.cos(angle), y: Math.sin(angle), angle, fire: false });
        }
        assert(run.status === 'won' || Math.hypot(p.x - point.x, p.y - point.y) <= 5, JSON.stringify({ seed, routeIndex, point, position: [p.x, p.y] }));
        if (routeIndex === 1 && point.y === 1436) {
          assert(run.interact());
          for (let i = 0; i < 20; i++) run.update(0.05, dormIdle);
        }
        if (point.x === 2150) assert.equal(run.alarmTime, null);
      }
      assert.equal(run.status, 'won');
    }
    Object.assign(battle.player, streetPoint({ x: 1650, y: 1040 }));
    battle.updateAlarm(0.05);
    assert.equal(battle.alarmTime, null, 'alarm depends on the intersection, not only x');
    Object.assign(battle.player, streetPoint({ x: 1565, y: 670, angle: 0, invulnerable: 100 }));
    const count = battle.enemies.length;
    const kioskDoor = battle.doors[1];
    for (let i = 0; i < 240; i++) battle.update(0.05, dormIdle);
    assert(Math.abs(kioskDoor.angle) > 1.4 && !kioskDoor.destroyed, 'the kiosk occupant hears the car through the wall and opens the door');
    const from = new Set(battle.enemies.slice(count).map(e => e.room));
    for (const area of [1, 3, 8, 9]) assert(from.has(area), `no reinforcements from zone ${area} for seed ${seed}`);
    Object.assign(battle.player, stage.street.supply, { hp: 40 });
    assert(battle.collectPickup()); assert.equal(battle.player.hp, 75); assert(!battle.collectPickup());
  }
  const oldSave = { ...newProfile(), victories: 1 };
  delete oldSave.streetUnlocked;
  assert(readProfile(JSON.stringify(oldSave)).streetUnlocked);
  const profile = newProfile(), dorm = new Battle(HEROINE_ID, 1, createDormRun(2)[1]);
  dorm.status = 'won'; dorm.claimReward(profile);
  assert(readProfile(JSON.stringify(profile)).streetUnlocked);
});
test('new residential shops can be entered and their supplies remain accessible', () => {
  for (let seed = 0; seed < 12; seed++) {
    const stage = createStreet(seed), run = new Battle(HEROINE_ID, 1, stage);
    assert(stage.rooms[1].w > 1500 && stage.rooms[8].w > 1100 && stage.rooms[9].h > 800);
    for (const room of [12, 13]) assert(run.loot.some(item => roomAt(item, stage.rooms) === room));
    run.enemies = [];
    for (const [index, direction] of [[2, 1], [3, -1]]) {
      const door = run.doors[index];
      Object.assign(run.player, { x: door.x + door.length / 2, y: door.y - direction * 65, invulnerable: 100 });
      assert(run.interactDoor(), `shop door ${index} should open`);
      for (let i = 0; i < 30; i++) run.update(0.05, dormIdle);
      const destination = { x: door.x + door.length * 0.68, y: door.y + direction * 75 };
      for (let i = 0; i < 160 && Math.hypot(run.player.x - destination.x, run.player.y - destination.y) > 8; i++) {
        const angle = Math.atan2(destination.y - run.player.y, destination.x - run.player.x);
        run.update(0.05, { x: Math.cos(angle), y: Math.sin(angle), angle, fire: false });
      }
      assert.equal(roomAt(run.player, stage.rooms), index === 2 ? 12 : 13, `shop door ${index} must be traversable`);
    }
  }
});
test('street assault stays bounded and all three routes refill long after the siren', () => {
  const b = new Battle(HEROINE_ID, 1, createStreet(123));
  Object.assign(b.player, streetPoint({ x: 1565, y: 670, invulnerable: 200 }));
  const arrivals = new Set();
  for (let i = 0; i < 1800; i++) {
    const sequence = b.enemySequence;
    b.update(0.05, dormIdle);
    assert(b.enemies.length <= 40);
    if (b.alarmTime > 16 && i % 20 === 0) {
      for (const e of b.enemies) if (e.hp > 0) b.damageEnemy(e, 999);
    }
    if (b.alarmTime > 45) for (const e of b.enemies) if (e.id >= sequence) arrivals.add(e.room);
  }
  assert(arrivals.has(1) || arrivals.has(11));
  assert(arrivals.has(8) && arrivals.has(9));
});
test('three Ghost operators enter from the residential street, follow, fight and can be killed', () => {
  const b = new Battle(HEROINE_ID, 1, createStreet(123));
  Object.assign(b.player, streetPoint({ x: 1920, y: 2010, invulnerable: 100 }));
  b.update(0.05, dormIdle);
  assert.equal(b.allies.length, 3);
  assert(b.allies.every(ally => ally.x > 3440 && !visible(b.player, b.player.angle, ally, b.blockers, b.stats.visionRange)));
  const closest = () => Math.min(...b.allies.filter(a => a.hp > 0).map(a => Math.hypot(a.x - b.player.x, a.y - b.player.y)));
  const before = closest();
  let fired = false, footstep = false;
  for (let i = 0; i < 200; i++) { b.events.length = 0; b.update(0.05, dormIdle); fired ||= b.events.includes('support-shot'); footstep ||= b.sounds.some(sound => sound.type === 'footstep' && sound.radius === 175); }
  assert(closest() < before / 2 && fired && footstep);
  const ally = b.allies[0];
  b.hurtAlly(ally, 999, { angle: 0, distance: 0 });
  assert.equal(ally.hp, 0);
  b.update(0.05, dormIdle);
  assert.equal(b.allies.length, 3);
  assert(b.bloodStains.some(stain => stain.x === ally.x && stain.y === ally.y));
});
test('street horde follows past the car and into the northern street after the alarm expires', () => {
  const stage = createStreet(31);
  const b = new Battle(HEROINE_ID, 1, { ...stage, spawns: [[2, 2430, 1305, 'walker']] });
  Object.assign(b.player, streetPoint({ x: 1850, y: 705, invulnerable: 120 }));
  b.update(0.05, dormIdle);
  const walker = b.enemies[0];
  Object.assign(b.player, streetPoint({ x: 1870, y: 1750 }));
  for (let i = 0; i < 340; i++) b.update(0.05, dormIdle);
  assert(b.alarmTime > 11 && walker.y > 2150, JSON.stringify(walker));
});
test('Ghost retreats from a nearby enemy and reveals terrain only while alive and in sight', () => {
  const stage = createStreet(7);
  const b = new Battle(HEROINE_ID, 1, { ...stage, spawns: [[5, 3630, 2720, 'walker']] });
  Object.assign(b.player, streetPoint({ x: 2670, y: 2120, angle: Math.PI }));
  const ally = { ...streetPoint({ x: 2900, y: 2120 }), angle: 0, id: -1, slot: 0, hp: 110, maxHp: 110, ammo: 18, cooldown: 20, burst: 0, hit: 0, muzzle: 0 };
  b.allies.push(ally);
  b.supportCalled = true;
  stage.street.support.entries.length = 0;
  const enemy = b.enemies[0];
  enemy.stun = 10;
  const cell = Math.floor(enemy.y / 40) * b.minimap.columns + Math.floor(enemy.x / 40);
  b.updateMinimap();
  assert(b.sees(enemy) && b.minimap.visible[cell]);
  for (let i = 0; i < 5; i++) b.update(0.05, { ...dormIdle, angle: Math.PI });
  assert(Math.hypot(enemy.x - ally.x, enemy.y - ally.y) > 120);
  ally.hp = 0;
  b.updateMinimap();
  assert(!b.sees(enemy) && !b.minimap.visible[cell] && b.minimap.explored[cell]);
});
test('units block walking and rolling passes through them, landing outside their bodies', () => {
  const stage = { ...createStreet(0), spawns: [[0, 260, 1255, 'walker'], [0, 356, 1255, 'walker']] };
  const b = new Battle(HEROINE_ID, 1, stage), p = b.player;
  Object.assign(p, { x: 210, y: 1255 });
  for (const e of b.enemies) e.stun = 10;
  for (let i = 0; i < 12; i++) b.update(0.05, { ...dormIdle, x: 1 });
  assert(p.x <= 229.01);
  b.dodge(1, 0);
  for (let i = 0; i < 6; i++) b.update(0.05, dormIdle);
  assert(p.x > 280 && p.dashTime === 0);
  for (const e of b.enemies) assert(Math.hypot(e.x - p.x, e.y - p.y) >= 31 - 0.01);
});
test('ambient animals run briefly along clear wall lanes on both floors and leave combat state alone', () => {
  const kinds = new Set();
  const wildlife = new AmbientWildlife();
  for (const stage of createDormRun(0)) {
    const battle = new Battle(HEROINE_ID, 1, stage);
    Object.assign(battle.player, stage.dorm.number === 2 ? { x: 484, y: 530, angle: 0 } : { x: 296, y: 584, angle: 0 });
    const blockers = battle.blockers;
    let previous, beganAt = -Infinity, occurrences = 0;
    for (let i = 0; i < 1800; i++) {
      const time = (i + 1) * 0.05;
      const animal = wildlife.step(0.05, battle);
      if (animal) {
        assert(walkable(animal, 9, blockers, battle.rooms));
        assert(blockers.some(r => circleRect(animal, 43, r)));
        assert(animal.opacity > 0 && animal.opacity <= 1);
        if (previous) {
          assert(lineClear(previous, animal, blockers));
          assert(animal.elapsed < 1.35);
        } else {
          assert(time >= 9 && time - beganAt >= 20);
          beganAt = time; occurrences++; kinds.add(animal.kind);
        }
      }
      previous = animal;
    }
    assert(occurrences >= 2 && occurrences <= 4);
    assert.equal(battle.blockers, blockers);
    assert.equal(battle.events.length + battle.bullets.length + battle.sounds.length, 0);
  }
  assert.deepEqual(Array.from(kinds).sort(), ['rat', 'roach']);
  assert.equal(wildlife.step(0.05, new Battle(HEROINE_ID, 1, DORM_LEVEL)), undefined);
});
test('shared floor details are seeded, fill both floors, and respect geometry and interaction space', () => {
  const seenKinds = new Set();
  assert.deepEqual(scatterFloorDetails(DORM_LEVEL), []);
  for (let i = 0; i < 24; i++) for (const stage of createDormRun(Math.imul(i, 2654435761))) {
    const details = scatterFloorDetails(stage);
    assert.deepEqual(details, scatterFloorDetails(stage));
    assert(details.length > 30);
    const before = new Battle(HEROINE_ID, 1, stage).blockers;
    for (const detail of details) {
      const radius = Math.hypot(detail.w, detail.h) / 2;
      const room = stage.rooms[roomAt(detail, stage.rooms)];
      assert(detail.x - radius > room.x && detail.x + radius < room.x + room.w);
      assert(detail.y - radius > room.y && detail.y + radius < room.y + room.h);
      assert(!before.some(r => circleRect(detail, radius, r)));
      for (const p of [stage.spawn, stage.exit, stage.dorm.pickup]) assert(Math.hypot(detail.x - p.x, detail.y - p.y) >= radius + 35);
      for (const d of stage.doors) assert(Math.hypot(detail.x - d.x, detail.y - d.y) >= radius + d.length + 9);
      seenKinds.add(detail.kind);
    }
    assert.deepEqual(new Battle(HEROINE_ID, 1, stage).blockers, before);
    const varied = { ...stage, floorDetails: { ...stage.floorDetails, seed: stage.floorDetails.seed + 1 } };
    assert.notDeepEqual(scatterFloorDetails(varied), details);
  }
  assert.deepEqual([...seenKinds].sort(), Object.keys(FLOOR_DETAIL_ART).sort());
});
test('dorm seeds keep the route fixed and pre-place safe inhabitants, keys and reinforcements', () => {
  const baseline = createDormRun(0), upperKeys = new Set(), lowerKeys = new Set(), placements = new Set();
  const lampCounts = new Set(), lampLocations = new Set();
  for (let seed = 0; seed < 96; seed++) {
    const stages = createDormRun(Math.imul(seed, 2654435761));
    assert.deepEqual(stages, createDormRun(stages[0].dorm.seed));
    lampCounts.add(stages.filter(stage => stage.faultyDoorLamp).length);
    for (const [i, stage] of stages.entries()) {
      const b = new Battle(HEROINE_ID, 1, stage);
      assert.deepEqual(stage.walls, baseline[i].walls);
      assert(stage.walls.length > 20);
      assert.deepEqual(stage.doors, baseline[i].doors);
      assert(walkable(stage.spawn, 18, b.blockers, b.rooms));
      assert(walkable(b.pickup, 18, b.blockers, b.rooms));
      const lamp = stage.faultyDoorLamp;
      if (lamp) {
        const d = stage.doors[lamp.door];
        assert(d && !d.key && !d.alarm);
        assert(walkable(lamp, 2, b.blockers, b.rooms));
        lampLocations.add(stage.id + '/' + lamp.door);
      }
      for (const [room, x, y, type, appearance] of [...stage.spawns, ...(stage.dorm.alarmWaves ?? []).flatMap(w => w.entries)]) {
        assert.equal(roomAt({ x, y }, b.rooms), room);
        assert(walkable({ x, y }, 18, b.blockers, b.rooms), JSON.stringify({ seed, room, x, y }));
        assert.equal(type, 'walker'); assert([0, 1, 2, 3].includes(appearance));
        assert.notEqual(room, roomAt(stage.spawn, b.rooms));
      }
    }
    upperKeys.add(stages[0].dorm.pickup.x); lowerKeys.add(stages[1].dorm.pickup.x);
    placements.add(stages[0].spawns.map(spawn => spawn.slice(1, 3).join(',')).join('/'));
  }
  assert.equal(upperKeys.size, 3); assert.equal(lowerKeys.size, 3); assert(placements.size > 30);
  assert.deepEqual(Array.from(lampCounts).sort(), [1, 2]);
  assert(lampLocations.size >= 4);
});
test('both dorm floors have walkable routes and all doors can swing from either side', () => {
  const connected = (b, from, to) => {
    const snap = p => [Math.round(p.x / 16), Math.round(p.y / 16)];
    const [x, y] = snap(from), [tx, ty] = snap(to);
    const queue = [[x, y]], seen = new Set([x + y * 160]);
    for (let i = 0; i < queue.length; i++) {
      const [gx, gy] = queue[i];
      if (gx === tx && gy === ty) return true;
      for (const [nx, ny] of [[gx - 1, gy], [gx + 1, gy], [gx, gy - 1], [gx, gy + 1]]) {
        const id = nx + ny * 160;
        if (seen.has(id)) continue;
        seen.add(id);
        if (walkable({ x: nx * 16, y: ny * 16 }, 16, b.blockers, b.rooms)) queue.push([nx, ny]);
      }
    }
    return false;
  };
  for (const seed of [0, 0x80c7b2a7]) for (const stage of createDormRun(seed)) {
    const b = new Battle(HEROINE_ID, 1, stage);
    b.enemies = []; b.keys.add(stage.dorm.pickup.id);
    for (const d of b.doors) {
      for (const side of [-1, 1]) {
        d.angle = d.target = 0; b.syncGeometry();
        Object.assign(b.player, { x: d.x + d.length / 2, y: d.y + side * 64 });
        assert(b.interactDoor(), d.name);
        for (let i = 0; i < 12; i++) b.update(0.05, dormIdle);
        assert(Math.abs(d.angle + side * Math.PI / 2) < 0.01, d.name);
      }
    }
    assert(connected(b, stage.spawn, stage.dorm.pickup));
    assert(connected(b, stage.dorm.pickup, stage.exit));
    for (const room of stage.rooms) assert(connected(b, stage.spawn, { x: room.x + room.w / 2, y: room.y + room.h / 2 }), room.kind);
  }
});
test('locked steel gates require keys and descent keeps combat state before alarm extraction', () => {
  const [upper, lower] = createDormRun(1234), b = new Battle(HEROINE_ID, 1, upper);
  const p = b.player, stairs = b.doors.find(d => d.key === 'stairs');
  Object.assign(p, { x: stairs.x + 56, y: stairs.y - 62 });
  assert.equal(b.interact(), false); assert(stairs.locked);
  assert.equal(b.damageDoor(stairs, 999), false); assert(!stairs.destroyed);
  Object.assign(p, upper.exit); assert.equal(b.interact(), false);
  const firstEnemy = b.enemies[0]; b.damageEnemy(firstEnemy, 999);
  Object.assign(p, upper.dorm.pickup); assert(b.collectPickup()); assert(!b.pickup);
  Object.assign(p, { x: stairs.x + 56, y: stairs.y - 62 }); assert(b.interact());
  assert(!stairs.locked);
  Object.assign(p, upper.exit, { hp: 73, ammo: 4, reload: 0.8 }); b.revivalCharges = 0;
  b.tactical.remaining = 1;
  assert(b.interact()); const elapsed = b.elapsed; b.update(0.05, dormIdle); assert.equal(b.elapsed, elapsed);
  assert.equal(b.descend(createDormRun(5)[1]), false);
  assert(b.descend(lower)); assert.equal(b.player, p);
  assert.deepEqual([p.hp, p.ammo, p.reload, b.revivalCharges, b.tactical.remaining, b.kills], [73, 4, 0.8, 0, 1, 1]);
  assert.equal(b.descend(lower), false);
  const gate = b.doors.find(d => d.key === 'exit'), alarm = b.doors.find(d => d.alarm);
  Object.assign(p, { x: gate.x + 56, y: gate.y + 62 }); assert.equal(b.interact(), false);
  Object.assign(p, lower.exit); b.update(0.05, dormIdle); assert.equal(b.status, 'playing');
  Object.assign(p, { x: alarm.x + 56, y: alarm.y + 63, invulnerable: 100 });
  const initial = b.enemies.length;
  assert(b.interact()); for (let i = 0; i < 20; i++) b.update(0.05, dormIdle);
  assert(b.alarmTime > 0); assert.equal(b.enemies.length, initial);
  Object.assign(p, lower.dorm.pickup); assert(b.collectPickup());
  for (let i = 0; i < 170; i++) b.update(0.05, dormIdle);
  assert(b.enemies.length > initial); assert(b.enemies.length <= initial + 6);
  assert.equal(b.events.filter(event => event === 'alarm').length, 1);
  Object.assign(p, { x: gate.x + 56, y: gate.y + 62 }); assert(b.interact());
  Object.assign(p, lower.exit); b.update(0.05, dormIdle);
  assert(b.enemies.some(e => e.hp > 0)); assert.equal(b.status, 'won');
  const profile = newProfile(); assert(b.claimReward(profile)); assert.equal(profile.daily.progress.extracts, 1);
});
test('daily task claims and milestones persist once and reset at 05:00 local time', () => {
  const before = new Date(2026, 10, 11, 4, 59), after = new Date(2026, 10, 11, 5);
  const profile = { ...newProfile(), daily: readDailyMissions(undefined, before) };
  assert.equal(claimDailyMission(profile, 'rooms', before), false);
  recordExploration(profile, { rooms: 3, kills: 6, clears: 0, extracts: 0 }, before);
  assert.equal(profile.daily.progress.rooms, 2);
  assert.equal(dailyActivity(profile.daily), 0);
  assert(claimDailyMission(profile, 'rooms', before));
  assert(claimDailyMilestone(profile, 20, before));
  const saved = JSON.parse(JSON.stringify(profile.daily));
  profile.daily = readDailyMissions(saved, before);
  assert.equal(claimDailyMission(profile, 'rooms', before), false);
  assert.equal(claimDailyMilestone(profile, 20, before), false);
  assert.equal(claimDailyMilestone(profile, 40, before), false);
  assert.equal(profile.materials, 115);
  assert.equal(claimDailyMission(profile, 'kills', after), false);
  assert.equal(dailyActivity(profile.daily), 0);
  assert.deepEqual(profile.daily.progress, { rooms: 0, kills: 0, clears: 0, extracts: 0 });
  assert.equal(profile.materials, 115);
  assert.equal(profile.cases.keys, 4);
});
test('exploration settlement counts visits, kills, clears and extraction once per run', () => {
  const battle = new Battle(HEROINE_ID, 1, DORM_LEVEL), profile = newProfile();
  battle.visited[1] = true;
  battle.kills = 3;
  battle.cleared[1] = true;
  assert.equal(battle.claimReward(profile), null);
  assert.equal(profile.daily.progress.kills, 0);
  battle.status = 'won';
  assert(battle.claimReward(profile));
  assert.equal(battle.claimReward(profile), null);
  assert.deepEqual(profile.daily.progress, { rooms: 1, kills: 3, clears: 1, extracts: 1 });
});
test('all actor spawn positions clear walls and furniture', () => {
  const b = new Battle(); assert(walkable(b.player));
  for (const e of b.enemies) assert(walkable(e, e.type === 'boss' ? 25 : 15), `blocked spawn: ${e.id}`);
});
test('obstacles occlude vision in both cone and peripheral circle', () => {
  assert.equal(visible({ x: 400, y: 320 }, 0, { x: 640, y: 320 }), false);
  assert.equal(visible({ x: 300, y: 360 }, 0, { x: 410, y: 360 }), true);
  assert.equal(visible({ x: 810, y: 300 }, 0, { x: 850, y: 300 }), false);
  assert.equal(visible({ x: 300, y: 360 }, 0, { x: 120, y: 360 }), false);
  assert.equal(visible({ x: 780, y: 390 }, 0, { x: 900, y: 390 }), true);
});
test('visibility polygon rays stop at walls and furniture', () => {
  const p = { x: 400, y: 320 };
  for (const q of visibilityPolygon(p, 0)) assert(lineClear(p, q));
  assert.equal(rayRect({ x: 0, y: 5 }, 1, 0, { x: 10, y: 0, w: 10, h: 10 }, 100), 10);
});
test('dodge cannot tunnel through a thin wall', () => {
  const b = new Battle(); b.enemies = []; b.player.x = 795; b.player.y = 300;
  b.dodge(1, 0); for (let i = 0; i < 8; i++) b.update(0.03, { x: 1, y: 0, angle: 0, fire: false });
  assert(b.player.x <= 806.1); assert(walkable(b.player));
});
test('continuous bullets collide with cover before enemies', () => {
  const b = new Battle(); b.player.x = 400; b.player.y = 320;
  b.enemies = [{ ...b.enemies[0], x: 630, y: 320, hp: 66 }];
  for (let i = 0; i < 30; i++) b.update(0.05, { x: 0, y: 0, angle: 0, fire: true });
  assert.equal(b.enemies[0].hp, 66);
});
test('gun hits enemies in clear line of sight', () => {
  const b = new Battle(); b.enemies = [{ ...b.enemies[0], x: 450, y: 360 }];
  for (let i = 0; i < 20; i++) b.update(0.05, { x: 0, y: 0, angle: 0, fire: true });
  assert.equal(b.kills, 1);
});
test('empty magazine auto-reloads and refills once', () => {
  const b = new Battle(); b.enemies = []; b.player.ammo = 0;
  b.update(0.01, { x: 0, y: 0, angle: 0, fire: true }); assert(b.player.reload > 0);
  for (let i = 0; i < 35; i++) b.update(0.05, { x: 0, y: 0, angle: 0, fire: false });
  assert.equal(b.player.ammo, 24); assert.equal(b.player.reload, 0);
});
test('first recruit unlocks another weapon; duplicate converts to materials', () => {
  const p = newProfile(); assert.deepEqual(recruit(p), { id: 0, duplicate: false });
  assert.deepEqual(recruit(p), { id: 0, duplicate: true }); assert.equal(p.materials, 110);
  p.tickets = 0; assert.equal(recruit(p), null);
});
test('training consumes exact materials and caps levels', () => {
  const p = newProfile(); assert(upgrade(p, HEROINE_ID)); assert.equal(p.materials, 50); assert.equal(p.levels[HEROINE_ID], 2);
  assert(!upgrade(p, HEROINE_ID)); assert(!upgrade(p, 1));
  p.materials = 10000; while (upgrade(p, HEROINE_ID)) {} assert.equal(p.levels[HEROINE_ID], 10);
});
test('corrupt saves cannot lock startup or select a locked hero', () => {
  assert.deepEqual(readProfile('{bad json'), newProfile());
  const p = readProfile(JSON.stringify({ version: 1, selected: 9, levels: [-99, 999, null], materials: -5, tickets: 0 }));
  assert.equal(p.materials, 80); assert.equal(p.tickets, 0); assert.deepEqual(p.levels, { 0: 1, 3: 1, 4: 1 });
});
test('all three fixed weapons apply their own compatible mods to the fired rounds', () => {
  const p = newProfile();
  p.owned[0] = p.owned[4] = true;
  const contents = [
    { serial: 1, kind: 'redDot', quality: 1, roll: 700, level: 3 },
    { serial: 2, kind: 'suppressor', quality: 3, roll: 500, level: 4 },
    { serial: 3, kind: 'choke', quality: 2, roll: 300, level: 2 },
  ];
  p.armory.mods = contents;
  assert(!installMod(p, 3, 'muzzle', 2));
  assert(installMod(p, 3, 'sight', 1));
  assert(installMod(p, 0, 'muzzle', 2));
  assert(installMod(p, 4, 'muzzle', 3));
  assert(!installMod(p, 0, 'sight', 1));
  assert(!salvageMod(p.armory, 1));
  const rng = Math.random;
  Math.random = () => 0.9;
  try {
    for (const id of [3, 0, 4]) {
      p.armory.kits[id].weaponLevel = 10;
      const b = new Battle(id, 1, DORM_LEVEL, {}, p.armory), base = configuredHero(id);
      b.player.angle = 0;
      b.shoot();
      assert(b.hero.spread >= b.hero.spreadFloor && b.hero.spread < base.spread);
      assert.equal(b.bullets.length, base.pellets);
      assert(Math.abs(Math.atan2(b.bullets[0].vy, b.bullets[0].vx) - b.hero.spread * 0.8) < 1e-9);
      assert(b.bullets[0].damage > base.damage);
      if (id === 0) assert(b.sounds.at(-1).radius < base.shotSound.radius);
    }
  } finally { Math.random = rng; }
  assert(installMod(p, 3, 'sight'));
  assert(salvageMod(p.armory, 1));
});
test('combat rewards are granted only once after completion', () => {
  const b = new Battle(), p = newProfile(); assert.equal(b.claimReward(p), null);
  b.status = 'won'; b.kills = 14; const first = b.claimReward(p);
  assert.deepEqual(first, { materials: 102, tickets: 2, coins: 0, keys: 2 }); assert.equal(b.claimReward(p), null); assert.equal(p.victories, 1); assert.equal(p.cases.keys, 5);
});
test('case weights are exhaustive and each attachment quality has a separate drop entry', () => {
  for (const id of CASE_IDS) {
    let first = 0;
    for (const prize of CASE_POOLS[id]) {
      assert.equal(sampleCasePrize(id, () => (first + 0.5) / 10000), prize);
      assert.equal(sampleCasePrize(id, () => (first + prize.weight - 0.5) / 10000), prize);
      first += prize.weight;
    }
    assert.equal(first, 10000);
    assert.equal(new Set(CASE_POOLS[id].map(prize => prize.id)).size, CASE_POOLS[id].length);
  }
  assert.equal(CASE_POOLS.tactical.filter(prize => prize.item === 'suppressor').length, 4);
});
test('ten case rewards are generated and persisted together with the exact qualities and rolls', () => {
  const p = newProfile(); p.cases.keys = 12;
  const samples = Array.from({ length: 10 }, (_, i) => [i % 2 ? 0.01 : 0.85, 0.07 + i * 0.09]).flat();
  const transaction = prepareCaseOpening(p, 'tactical', 10, () => samples.shift());
  assert.equal(transaction.opening.rewards.length, 10);
  assert.equal(p.cases.keys, 12);
  assert.equal(p.armory.mods.length, 0);
  const persisted = readProfile(JSON.stringify(transaction.profile));
  assert.equal(persisted.cases.keys, 2);
  assert.deepEqual(persisted.cases.pending, transaction.opening);
  assert.deepEqual(persisted.armory.mods, transaction.opening.rewards.map(reward => reward.mod));
  assert.equal(persisted.armory.mods[0].quality, 3);
  assert.equal(persisted.armory.mods[1].quality, 0);
  assert.deepEqual(prepareCaseOpening(persisted, 'basic', 1), { reason: 'pending' });
});
test('case openings check balances and inventory before committing, and animation stops at its target', () => {
  const p = newProfile();
  assert.deepEqual(prepareCaseOpening(p, 'basic', 10), { reason: 'keys' });
  p.armory.counts.bandage = 99;
  assert.deepEqual(prepareCaseOpening(p, 'basic', 1), { reason: 'stock' });
  p.armory.mods.length = 120;
  assert.deepEqual(prepareCaseOpening(p, 'tactical', 1), { reason: 'mods' });
  assert.equal(p.cases.keys, 3);
  assert.equal(caseRollProgress(0), 0);
  let previous = 0;
  for (let t = 0.01; t < CASE_ROLL_TIME; t += 0.01) {
    assert(caseRollProgress(t) >= previous && caseRollProgress(t) <= 1);
    previous = caseRollProgress(t);
  }
  assert.equal(caseRollProgress(CASE_ROLL_TIME + 0.01), 1);
});
test('extraction requires all rooms cleared and player at exit', () => {
  const b = new Battle(); b.enemies = []; b.player.x = 2190; b.player.y = 1185;
  const c = { x: 0, y: 0, angle: 0, fire: false }; b.update(0.01, c); assert.equal(b.status, 'playing');
  b.discovered.fill(true); b.update(0.01, c); assert.equal(b.status, 'won');
});
const idle = { x: 0, y: 0, angle: 0, fire: false };
function tick(b, seconds, controls = idle) { for (let i = 0; i < Math.ceil(seconds / 0.02); i++) b.update(0.02, controls); }
function emptyBattle() { const b = new Battle(); b.enemies = []; return b; }
test('actual gunshots and explosions apply ordered pushes and a single directional burst per shot', () => {
  function impact(weapon) {
    const battle = new Battle(typeof weapon === 'number' ? weapon : HEROINE_ID, 1, DORM_LEVEL);
    const enemy = battle.enemies[0]; battle.enemies = [enemy];
    Object.assign(enemy, { x: 355, y: 220, hp: 999, maxHp: 999, stun: 10, angle: Math.PI });
    if (typeof weapon === 'number') { battle.player.angle = 0; battle.shoot(); }
    else battle.tacticalThrows.push({ x: 305, y: 220, kind: weapon, delay: 0, origin: { ...battle.player } });
    tick(battle, 0.12);
    assert(enemy.hp < 999);
    const drops = battle.particles.filter(f => f.kind === 'hit-blood');
    assert.equal(drops.length, 4); assert(drops.every(f => f.vx > 0 && f.x >= 355 + 21));
    tick(battle, 0.3);
    return enemy.x - 355;
  }
  const distances = [HEROINE_ID, 0, 4, 'grenade', 'proximity-mine'].map(impact);
  assert(distances.every((distance, i) => distance > (distances[i - 1] || 0)), String(distances));
});
test('a hostile hit pushes the player away, and solid cover stops the push and blood', () => {
  const battle = new Battle(HEROINE_ID, 1, DORM_LEVEL);
  Object.assign(battle.player, { x: 150, y: 220 });
  battle.bullets.push({ x: 177, y: 220, vx: -1000, vy: 0, hostile: true, life: 1, damage: 15, push: 70 });
  battle.update(0.02, idle);
  assert.equal(battle.player.hp, 85);
  assert.equal(battle.particles.filter(f => f.kind === 'hit-blood' && f.vx < 0).length, 4);
  tick(battle, 0.26);
  assert(battle.player.x < 150 && battle.player.x >= 115);
  assert(battle.particles.filter(f => f.kind === 'hit-blood').every(f => f.x >= 98));
  assert(!battle.player.knockback);
});
function openReception(b) { b.player.x = 775; b.player.y = 390; assert(b.interactDoor()); tick(b, 0.6); }
test('closed door blocks sight, movement and friendly bullets at the same geometry', () => {
  const b = emptyBattle(), a = { x: 775, y: 390 }, z = { x: 900, y: 390 };
  assert(lineClear(a, z)); assert(!lineClear(a, z, b.blockers));
  assert(!visible(a, 0, z, b.blockers)); assert(!walkable({ x: 831, y: 390 }, 16, b.blockers));
  b.player.x = a.x; b.player.y = a.y; tick(b, 0.25, { ...idle, fire: true });
  assert(b.doors[0].hp < 100); assert(!b.doors[0].destroyed);
});
test('open door clears the doorway while its swung leaf still blocks bullets and movement', () => {
  const b = emptyBattle(); openReception(b);
  assert(Math.abs(b.doors[0].angle) < 0.01);
  assert(lineClear({ x: 775, y: 390 }, { x: 900, y: 390 }, b.blockers));
  assert(walkable({ x: 831, y: 390 }, 16, b.blockers));
  assert(!walkable({ x: 900, y: 330 }, 16, b.blockers));
  assert(!lineClear({ x: 900, y: 300 }, { x: 900, y: 370 }, b.blockers));
});
test('half-open leaves use rotated geometry instead of an oversized axis-aligned box', () => {
  const b = emptyBattle(); b.doors[0].target = Math.PI / 4; tick(b, 0.4);
  const shape = doorShape(b.doors[0]); assert(Math.abs(shape.angle - Math.PI / 4) < 0.01);
  assert(circleRect({ x: 880, y: 379 }, 2, shape));
  assert(!circleRect({ x: 837, y: 402 }, 2, shape));
  for (const q of visibilityPolygon({ x: 775, y: 390 }, 0, b.blockers)) assert(lineClear({ x: 775, y: 390 }, q, b.blockers));
  assert.equal(rectCorners(shape).length, 4);
});
test('closing onto a player reverses without pushing or crushing the player', () => {
  const b = emptyBattle(); openReception(b); b.player.x = 845; b.player.y = 390;
  assert(b.interactDoor()); let blocked = false;
  for (let i = 0; i < 65; i++) { b.update(0.02, idle); blocked ||= b.events.includes('door-blocked'); assert(!circleRect(b.player, 16, doorShape(b.doors[0]))); }
  assert(blocked); assert.equal(b.player.x, 845); assert.equal(b.player.hp, b.player.maxHp); assert(Math.abs(b.doors[0].angle) < 0.01);
});
test('wood destruction immediately removes all door blocking and cannot be toggled again', () => {
  const b = emptyBattle(); b.player.x = 775; b.player.y = 390; const rev = b.geometryRevision;
  b.damageDoor(b.doors[0], 100);
  assert(b.doors[0].destroyed); assert(b.geometryRevision > rev);
  assert(lineClear(b.player, { x: 900, y: 390 }, b.blockers)); assert(walkable({ x: 831, y: 390 }, 16, b.blockers)); assert.equal(b.interactDoor(), false);
});
test('steel door absorbs bullets indefinitely but can be opened for the critical route', () => {
  const b = emptyBattle(), d = b.doors[1]; b.player.x = 1175; b.player.y = 600;
  b.damageDoor(d, 100000); assert(!d.destroyed); assert.equal(d.hp, 100);
  assert(!lineClear(b.player, { x: 1175, y: 750 }, b.blockers));
  assert(b.interactDoor()); tick(b, 0.6);
  assert(lineClear(b.player, { x: 1175, y: 750 }, b.blockers)); assert(!walkable({ x: 1110, y: 750 }, 16, b.blockers));
});
test('hostile shots hit the closed leaf before reaching the player', () => {
  const b = emptyBattle(); b.player.x = 775; b.player.y = 390;
  b.bullets.push({ x: 900, y: 390, vx: -1000, vy: 0, damage: 20, hostile: true, life: 1 }); tick(b, 0.25);
  assert.equal(b.player.hp, b.player.maxHp); assert.equal(b.doors[0].hp, 80);
});
test('dodge cannot tunnel through a closed door', () => {
  const b = emptyBattle(); b.player.x = 795; b.player.y = 390; b.dodge(1, 0); tick(b, 0.3);
  assert(b.player.x < 810); assert(walkable(b.player, 16, b.blockers));
});
test('doors reset between runs without leaking damage or angle', () => {
  const a = emptyBattle(); openReception(a); a.damageDoor(a.doors[0], 100);
  const b = new Battle(); assert.equal(b.doors[0].hp, 100); assert(!b.doors[0].destroyed); assert.equal(b.doors[0].angle, Math.PI / 2);
});
test('a walker investigating a loud sound opens the closed doorway', () => {
  const b = new Battle(); b.player.x = 1000; b.player.y = 390;
  b.enemies = [{ ...b.enemies[0], x: 775, y: 390, cooldown: 0 }];
  b.emitSound({ x: 1000, y: 390 }, 'alarm'); tick(b, 8);
  assert(Math.abs(b.doors[0].angle - b.doors[0].baseAngle) > 1); assert(b.enemies[0].x > 850);
});
test('interaction is rejected from too far away or through adjacent walls', () => {
  const b = emptyBattle(); assert.equal(b.interactDoor(), false);
  b.player.x = 800; b.player.y = 290; assert.equal(b.nearbyDoor(), undefined);
});
test('door surface allowance affects only door-facing rays and leaves enemy sight strict', () => {
  const b = emptyBattle(), p = { x: 775, y: 390 }, strict = visibilityPolygon(p, 0, b.blockers);
  const surface = doorSurfacePolygon(p, 0, strict, b.doors);
  assert(surface.some((q, i) => Math.hypot(q.x - p.x, q.y - p.y) > Math.hypot(strict[i].x - p.x, strict[i].y - p.y) + 1));
  assert(!visible(p, 0, { x: 850, y: 390 }, b.blockers));
  const wallOrigin = { x: 775, y: 300 }, wallPoint = [{ x: 822, y: 300 }];
  assert.deepEqual(doorSurfacePolygon(wallOrigin, 0, wallPoint, b.doors), wallPoint);
});
test('every critical-route door can fully open when approached from either room', () => {
  const approaches = [[{ x: 775, y: 390 }, { x: 890, y: 390 }], [{ x: 1175, y: 600 }, { x: 1175, y: 740 }], [{ x: 1470, y: 985 }, { x: 1590, y: 985 }]];
  for (let id = 0; id < 3; id++) for (const p of approaches[id]) {
    const b = emptyBattle(); Object.assign(b.player, p);
    assert.equal(b.nearbyDoor()?.id, id); assert(b.interactDoor()); tick(b, 0.7);
    assert(Math.abs(b.doors[id].angle - b.doors[id].baseAngle) > 1.56, `door ${id} failed to open from ${JSON.stringify(p)}`);
  }
});
test('lethal hits create one bounded body burst and one stable varied stain per enemy', () => {
  const b = new Battle(), e = b.enemies[0];
  b.damageEnemy(e, 1); assert.equal(b.particles.length, 4);
  b.damageEnemy(e, 999); assert.equal(e.hp, 0); assert.equal(b.kills, 1);
  assert.equal(b.bloodStains.length, 1); assert.equal(b.particles.length, 0); assert(b.deathFragments.length >= 10 && b.deathFragments.length <= 16); assert.equal(e.windup, 0);
  assert.equal(b.bloodStains[0].x, e.x); assert.equal(b.bloodStains[0].y, e.y); assert(Number.isInteger(b.bloodStains[0].seed)); assert.equal(b.bloodStains[0].outline.length,24); assert(b.bloodStains[0].droplets.length<=7);
  const frozen = JSON.stringify(b.bloodStains); b.damageEnemy(e, 999); assert.equal(b.bloodStains.length, 1); assert.equal(b.kills, 1); assert.equal(JSON.stringify(b.bloodStains), frozen);
  b.status = 'won'; const elapsed = b.elapsed, pos = { x: b.player.x, y: b.player.y };
  for (let i = 0; i < 30; i++) b.update(0.05, { x: 1, y: 1, angle: 1, fire: true });
  assert.equal(b.deathFragments.length, 0); assert.equal(b.elapsed, elapsed); assert.deepEqual({ x: b.player.x, y: b.player.y }, pos); assert.equal(b.kills, 1); assert.equal(JSON.stringify(b.bloodStains), frozen);
});
test('death fragments stay on floor, respect thin cover, cap counts and expire after termination', () => {
  const b = new Battle(), e = b.enemies[0]; Object.assign(e, {x:800,y:300}); b.damageEnemy(e,999);
  for (let i=0;i<40;i++) { b.updateDeathFragments(0.025); for (const f of b.deathFragments) assert(walkable(f,f.size,b.blockers,b.rooms)); }
  assert.equal(b.deathFragments.length,0);
  for (const enemy of b.enemies) b.damageEnemy(enemy,999);
  assert(b.deathFragments.length<=128); const stains=JSON.stringify(b.bloodStains);
  b.status='lost'; const positions=JSON.stringify(b.enemies), elapsed=b.elapsed;
  for(let i=0;i<30;i++) b.update(0.05,{x:1,y:1,angle:0,fire:true});
  assert.equal(b.deathFragments.length,0); assert.equal(JSON.stringify(b.enemies),positions); assert.equal(b.elapsed,elapsed); assert.equal(JSON.stringify(b.bloodStains),stains);
  assert.equal(new Battle().deathFragments.length,0);
});
test('player death leaves one stain and a room clear cannot resurrect the player', () => {
  const b = emptyBattle(); b.hurt(999); assert.equal(b.status, 'lost'); assert.equal(b.player.hp, 0);
  b.hurt(999); assert.equal(b.bloodStains.length, 1);
  const other = emptyBattle(); other.bullets.push({ x: other.player.x, y: other.player.y, vx: 100, vy: 0, damage: 999, hostile: true, life: 1 });
  other.update(0.01, idle); assert.equal(other.status, 'lost'); assert.equal(other.player.hp, 0); assert.equal(other.bloodStains.length, 1);
  assert.equal(new Battle().bloodStains.length, 0);
});
test('the removed area skill has no callable action or cooldown state', () => {
  const b = new Battle(); assert.equal(b.skill, undefined); assert.equal(b.pulse, undefined); assert.equal(b.player.skill, undefined); assert.equal(b.hero.skill, undefined);
});
test('roll duration is visible across frames and keeps a roughly 132px travel budget', () => {
  const b = emptyBattle(), x = b.player.x; b.player.y = 400; b.dodge(1, 0);
  b.update(0.1, idle); assert(b.player.dashTime > 0.2);
  for (let i = 0; i < 20; i++) b.update(1 / 60, idle);
  assert.equal(b.player.dashTime, 0); assert(Math.abs(b.player.x - x - 132) < 0.1);
});
test('new campaigns start with the USP heroine and only Ghost unlocks through recruitment', () => {
  const p = newProfile(); assert.deepEqual(p.owned, { 0: false, 3: true, 4: false });
  assert.deepEqual(recruit(p), { id: 0, duplicate: false });
  for (let i = 0; i < 2; i++) assert.deepEqual(recruit(p), { id: 0, duplicate: true });
  assert.equal(p.owned[4], false);
  const b = new Battle(HEROINE_ID, 1, DORM_LEVEL); assert.equal(b.player.ammo, 12); assert.match(b.hero.gun, /USP/);
});
test('old saves refund retired recruits once and preserve surviving characters and credits', () => {
  const p = readProfile(JSON.stringify({ version: 1, selected: 0, owned: [true, true, false], levels: [5, 3, 1], materials: 340, tickets: 2, draws: 4, victories: 2 }));
  assert.equal(p.version, 5); assert.deepEqual(p.owned, { 0: false, 3: true, 4: false }); assert.deepEqual(p.levels, { 0: 5, 3: 1, 4: 1 });
  assert.equal(p.materials, 430); assert.equal(p.tickets, 3); assert.equal(p.victories, 2);
  assert.deepEqual(readProfile(JSON.stringify(p)), p);
});
test('dorm spawns, exit and furniture align with simulation and every doorway opens from both sides', () => {
  const b = new Battle(HEROINE_ID, 1, DORM_LEVEL);
  for (const p of [b.player, b.stage.exit, ...b.enemies]) assert(walkable(p, p.type === 'boss' ? 25 : 16, b.blockers, b.rooms), JSON.stringify(p));
  for (let id = 0; id < 3; id++) for (const y of [285, 420]) {
    const run = new Battle(HEROINE_ID, 1, DORM_LEVEL); run.enemies = []; const d = run.doors[id]; run.player.x = d.x + 63; run.player.y = y;
    assert(run.interactDoor()); tick(run, 0.7); assert(Math.abs(d.angle) > 1.56); assert(lineClear({ x: d.x + 63, y: 290 }, { x: d.x + 63, y: 430 }, run.blockers));
  }
  assert.equal(roomAt({ x: 450, y: 600 }, b.rooms), 1); assert.equal(roomAt({ x: 1150, y: 600 }, b.rooms), 2);
});
test('dorm floor is connected from corridor to every room and extraction requires clearing', () => {
  const b = new Battle(HEROINE_ID, 1, DORM_LEVEL); b.enemies = []; for (const d of b.doors) { d.destroyed = true; } b.syncGeometry();
  const seen = new Set(), queue = [{ x: 256, y: 224 }];
  for (let head = 0; head < queue.length; head++) { const p = queue[head], key = p.x + ',' + p.y; if (seen.has(key) || !walkable(p, 16, b.blockers, b.rooms)) continue; seen.add(key); for (const [x, y] of [[32,0],[-32,0],[0,32],[0,-32]]) queue.push({ x: p.x + x, y: p.y + y }); }
  for (const target of [{ x: 448, y: 832 }, { x: 1152, y: 832 }, { x: 2112, y: 1024 }]) assert(seen.has(target.x + ',' + target.y), 'unreachable dorm region');
  Object.assign(b.player, b.stage.exit); b.update(0.01, idle); assert.equal(b.status, 'playing'); b.discovered.fill(true); b.update(0.01, idle); assert.equal(b.status, 'won');
});
test('heroine starts slower with a 0.48s firing interval while soldier base stats are preserved', () => {
  const s = heroStats(HEROINE_ID); assert.equal(s.speed, 150); assert(Math.abs(s.interval - 0.48) < 1e-10); assert(Math.abs(s.attackRate - 2.083333333) < 1e-8);
  for (const [id, speed, interval] of [[0,205,0.14],[4,175,0.62]]) { const other = heroStats(id); assert.equal(other.speed, speed); assert(Math.abs(other.interval - interval) < 1e-10); }
});
test('movement and attack training charge their own cost and never advance other tracks', () => {
  const p = newProfile(); p.materials = 1000;
  assert.equal(trainingCost(p, HEROINE_ID, 'mobility'), 40); assert(upgrade(p, HEROINE_ID, 'mobility'));
  assert.deepEqual(profileGrowth(p, HEROINE_ID), { mobility: 2, attack: 1 }); assert.equal(p.levels[HEROINE_ID], 1);
  assert.equal(trainingCost(p, HEROINE_ID, 'mobility'), 80); assert(upgrade(p, HEROINE_ID, 'attack')); assert(upgrade(p, HEROINE_ID));
  assert.equal(p.materials, 890); assert.deepEqual(profileGrowth(p, HEROINE_ID), { mobility: 2, attack: 2 }); assert.equal(p.levels[HEROINE_ID], 2);
  for (const id of [0, 4]) assert.deepEqual(profileGrowth(p, id), { mobility: 1, attack: 1 });
});
test('new training tracks reject locked heroes, insufficient funds and purchases at the level cap', () => {
  const p = newProfile(); p.materials = 39;
  const before = JSON.stringify(p); assert(!upgrade(p, HEROINE_ID, 'mobility')); assert(!upgrade(p, 0, 'attack')); assert(!upgrade(p, 99, 'attack')); assert.equal(JSON.stringify(p), before);
  p.materials = 10000;
  for (const kind of ['mobility', 'attack']) { let count = 0; while (upgrade(p, HEROINE_ID, kind)) count++; assert.equal(count, 9); assert.equal(trainingCost(p, HEROINE_ID, kind), null); }
  assert.deepEqual(profileGrowth(p, HEROINE_ID), { mobility: 10, attack: 10 }); const materials = p.materials; assert(!upgrade(p, HEROINE_ID, 'attack')); assert.equal(p.materials, materials);
  const max = heroStats(HEROINE_ID, 1, profileGrowth(p, HEROINE_ID)); assert.equal(max.speed, 217.5); assert(Math.abs(max.attackRate - 3.583333333) < 1e-8);
});
test('v2 saves retain ownership and resources; current growth survives reload and sanitizes bad ranks', () => {
  const p = readProfile(JSON.stringify({ version: 2, selected: 0, owned: [true,false,true,true], levels: [6,1,3,4], materials: 350, tickets: 4, draws: 2, victories: 5, sound: false }));
  assert.equal(p.version, 5); assert.deepEqual(p.owned, { 0: true, 3: true, 4: false }); assert.deepEqual(p.levels, { 0: 6, 3: 4, 4: 1 }); assert.equal(p.materials, 440); assert.equal(p.sound, false);
  assert.deepEqual(p.mobilityLevels, { 0: 1, 3: 1, 4: 1 }); assert.deepEqual(p.attackLevels, { 0: 1, 3: 1, 4: 1 });
  assert(upgrade(p, HEROINE_ID, 'mobility')); assert(upgrade(p, HEROINE_ID, 'attack')); assert.deepEqual(readProfile(JSON.stringify(p)), p);
  const bad = readProfile(JSON.stringify({ ...p, mobilityLevels: [999,-5,1.5,'7'], attackLevels: [null,5,0,10] }));
  assert.deepEqual(bad.mobilityLevels, { 0: 10, 3: 1, 4: 1 }); assert.deepEqual(bad.attackLevels, { 0: 1, 3: 10, 4: 1 });
});
test('upgraded movement changes real travel without increasing dodge travel or projectile damage', () => {
  const runs = [new Battle(HEROINE_ID, 1, DORM_LEVEL), new Battle(HEROINE_ID, 1, DORM_LEVEL, { mobility: 10 })];
  for (const b of runs) {
    b.enemies = []; const x = b.player.x;
    for (let i = 0; i < 120; i++) b.update(1 / 60, { ...idle, x: 1 });
    assert(Math.abs(b.player.x - x - b.stats.speed * 2) < 1e-7); assert.equal(b.stats.damage, 26);
    const start = b.player.x; b.dodge(1, 0); for (let i = 0; i < 24; i++) b.update(1 / 60, idle);
    assert(Math.abs(b.player.x - start - 132) < 1e-7);
  }
  assert(runs[1].player.x > runs[0].player.x);
});
test('attack training increases actual shot cadence independently of movement and damage', () => {
  const shots = [];
  for (const attack of [1, 10]) {
    const b = new Battle(HEROINE_ID, 1, DORM_LEVEL, { attack }); b.enemies = []; let count = 0;
    for (let i = 0; i < 360; i++) { b.update(1 / 120, { ...idle, fire: true }); count += b.events.filter(e => e === 'shoot').length; b.events = []; }
    shots.push(count); assert.equal(b.stats.speed, 150); assert.equal(b.stats.damage, 26); assert.equal(b.player.reload, 0);
    assert(b.stats.interval > 0.27 && b.stats.interval <= 0.48);
  }
  assert.deepEqual(shots, [7, 11]);
});
test('heroine vision is exactly half the former distance in every direction', () => {
  const girl = heroStats(HEROINE_ID); assert.equal(girl.visionRange, 265); assert.equal(girl.peripheralRange, 70);
  assert.equal(heroStats(0).visionRange, 530); assert.equal(heroStats(0).peripheralRange, 140);
  assert.equal(heroStats(4).visionRange, 420); assert(Math.abs(heroStats(4).peripheralRange - 110.94) < 0.01);
  for (const facing of [0, 1.4, -2.8]) for (const offset of [0,0.5,0.95,1.02,Math.PI]) assert.equal(sightRange(facing + offset, facing, girl.visionRange), sightRange(facing + offset, facing) / 2);
  const origin = { x: 0, y: 0 };
  assert(visible(origin, 0, { x: 260, y: 0 }, [], girl.visionRange)); assert(!visible(origin, 0, { x: 270, y: 0 }, [], girl.visionRange));
  assert(visible(origin, 0, { x: -65, y: 0 }, [], girl.visionRange)); assert(!visible(origin, 0, { x: -75, y: 0 }, [], girl.visionRange));
});
test('shorter vision polygons still stop at cover and rotate with facing', () => {
  const origin = { x: 400, y: 400 }, wall = { x: 500, y: 300, w: 16, h: 200 }, range = 265;
  for (const q of visibilityPolygon(origin, 0, [wall], range)) { assert(lineClear(origin, q, [wall])); assert(Math.hypot(q.x - origin.x, q.y - origin.y) <= 265.001); }
  assert(!visible(origin, 0, { x: 580, y: 400 }, [wall], range));
  assert(visible(origin, Math.PI / 2, { x: 400, y: 650 }, [], range)); assert(!visible(origin, Math.PI / 2, { x: 650, y: 400 }, [], range));
});
test('vision is a per-hero base attribute and existing growth saves do not override it', () => {
  const p = newProfile(); p.levels[3] = p.mobilityLevels[3] = p.attackLevels[3] = 10;
  const loaded = readProfile(JSON.stringify(p)), b = new Battle(3, loaded.levels[3], DORM_LEVEL, profileGrowth(loaded, 3));
  assert.equal(b.stats.visionRange, 265); assert.equal(b.stats.peripheralRange, 70); assert.deepEqual(loaded, p);
});
function dormDoorBattle(type = 'walker', y = 450, heroId = HEROINE_ID) {
  return new Battle(heroId, 1, { ...DORM_LEVEL, spawn: { x: 475, y: 285 }, spawns: [[1,475,y,type]] });
}
test('enemies exist with stable identity while an unseen closed room stays dormant', () => {
  const b = dormDoorBattle(), e = b.enemies[0], before = { ...e };
  tick(b,2,{...idle,angle:Math.PI/2});
  assert.equal(b.enemies.length,1); assert.equal(b.enemies[0],e); assert.deepEqual(e,before);
  assert.equal(b.alerted[1],false); assert.equal(b.discovered[1],false); assert.equal(b.visited[1],false);
  assert(!visible(b.player,Math.PI/2,e,b.blockers,b.stats.visionRange));
});
test('opening each dorm door discovers only its connected room before crossing the threshold', () => {
  for (let id=0;id<3;id++) {
    const b=new Battle(HEROINE_ID,1,DORM_LEVEL), d=b.doors[id]; b.player.x=d.x+63; b.player.y=285;
    const identities=[...b.enemies]; assert(b.interactDoor());
    assert.equal(b.alerted[id+1],false); assert.equal(b.discovered[id+1],true); assert.equal(b.visited[id+1],false);
    for (let other=1;other<4;other++) if (other!==id+1) assert.equal(b.alerted[other],false);
    assert(b.enemies.every((e,i)=>e===identities[i]));
  }
});
test('walkers, ranged enemies and bosses can all be seen and shot from outside an opened room', () => {
  for (const type of ['walker','spitter','boss']) {
    const b=dormDoorBattle(type,500), e=b.enemies[0], hp=e.hp;
    assert(b.interactDoor()); tick(b,0.5,{...idle,angle:Math.PI/2});
    assert(visible(b.player,Math.PI/2,e,b.blockers,b.stats.visionRange)); assert.equal(b.visited[1],false);
    // Door-clear now moves the actor sideways: aim at its real position each
    // frame rather than firing down its obsolete spawn coordinate.
    for(let frame=0;frame<60;frame++) b.update(0.01,{...idle,angle:Math.atan2(e.y-b.player.y,e.x-b.player.x),fire:true});
    assert(e.hp<hp,type); assert.equal(b.visited[1],false); assert.equal(b.enemies[0],e);
  }
});
test('friendly projectiles can hit a still-dormant enemy and the hit raises the room alarm', () => {
  const b=dormDoorBattle(), e=b.enemies[0]; b.doors[0].destroyed=true; b.syncGeometry(); b.perceptionTime=100;
  assert.equal(b.alerted[1],false); tick(b,0.25,{...idle,angle:Math.PI/2,fire:true});
  assert.equal(e.hp,40); assert.equal(b.alerted[1],true); assert.equal(b.discovered[1],true); assert.equal(b.visited[1],false);
});
test('destroying wood alerts the connected room while shooting intact steel does not reveal or reset enemies', () => {
  const b=new Battle(HEROINE_ID,1,DORM_LEVEL); b.damageDoor(b.doors[0],100);
  assert(b.doors[0].destroyed); assert.equal(b.alerted[1],true); assert.equal(b.visited[1],false); assert.equal(b.alerted[2],false);
  b.damageDoor(b.doors[2],10000); assert.equal(b.alerted[3],false); assert.equal(b.doors[2].destroyed,false);
});
test('seeing a distant enemy discovers its room independently of AI alert', () => {
  const b=dormDoorBattle('walker',700,0), e=b.enemies[0], d=b.doors[0]; d.angle=d.target=d.openAngle=Math.PI/2; b.syncGeometry();
  b.update(0.01,{...idle,angle:Math.PI/2});
  assert(visible(b.player,Math.PI/2,e,b.blockers,b.stats.visionRange)); assert.equal(b.discovered[1],true); assert.equal(b.alerted[1],false); assert.equal(b.visited[1],false);
  assert.equal(e.x,475); assert.equal(e.y,700);
});
test('an enemy spotting the player through an already-open passage wakes and retains an attack windup', () => {
  const b=new Battle(HEROINE_ID), e={...b.enemies.find(e=>e.room===1),x:855,y:390,type:'walker',cooldown:0,angle:Math.PI};
  b.enemies=[e]; b.player.x=815; b.player.y=390; const d=b.doors[0]; d.angle=d.target=d.openAngle=0; b.syncGeometry();
  b.update(0.01,idle); assert.equal(b.alerted[1],true); assert.equal(b.visited[1],false); assert.equal(e.windup,0); assert.equal(b.player.hp,b.player.maxHp);
  tick(b,0.36); assert(e.windup>0); assert.equal(b.player.hp,b.player.maxHp);
  tick(b,0.42); assert(b.player.hp<b.player.maxHp);
});
test('dormant enemies still block a closing door and cannot be swept through by the leaf', () => {
  const b=new Battle(HEROINE_ID), e={...b.enemies.find(e=>e.room===1),x:845,y:390}; b.enemies=[e]; b.player.x=775; b.player.y=390;
  const d=b.doors[0]; d.angle=d.target=d.openAngle=0; b.syncGeometry(); b.perceptionTime=100;
  assert(b.interactDoor()); let blocked=false;
  for (let i=0;i<65;i++) { b.update(0.02,idle); blocked ||= b.events.includes('door-blocked'); assert(!circleRect(e,15,doorShape(d))); }
  assert(blocked || Math.abs(d.angle) > 0.01); assert.equal(b.alerted[1],false); assert(e.x !== 845 || e.y !== 390 || Math.abs(d.angle) > 0.01);
});
test('outside kills clear a discovered room and heal once without marking it visited or respawning the dead', () => {
  const b=dormDoorBattle(), e=b.enemies[0]; b.update(0.01,idle); b.player.hp=20;
  b.damageEnemy(e,999); b.events=[]; b.update(0.01,idle);
  assert.equal(b.cleared[1],true); assert.equal(b.visited[1],false); assert.equal(b.player.hp,40); assert.equal(b.events.filter(v=>v==='clear').length,1);
  b.events=[]; assert(b.interactDoor()); tick(b,0.6); assert(b.interactDoor()); tick(b,0.6); assert(b.interactDoor()); tick(b,0.6);
  b.player.y=450; b.update(0.01,idle); assert.equal(b.visited[1],true); assert.equal(b.player.hp,40); assert.equal(e.hp,0); assert.equal(b.enemies.length,1); assert.equal(b.events.filter(v=>v==='clear').length,0);
});
test('closing, reopening and entering preserve living enemy damage and state until a new run', () => {
  const b=dormDoorBattle('spitter',505), e=b.enemies[0]; assert(b.interactDoor()); tick(b,0.6,{...idle,angle:Math.PI/2});
  b.damageEnemy(e,10); const hp=e.hp; assert(b.interactDoor()); tick(b,0.6,{...idle,angle:Math.PI/2});
  const position={x:e.x,y:e.y}; assert(b.interactDoor()); assert.deepEqual({x:e.x,y:e.y},position); tick(b,0.6,{...idle,angle:Math.PI/2});
  b.player.y=450; b.update(0.01,idle); assert.equal(b.enemies[0],e); assert.equal(e.hp,hp); assert.equal(b.enemies.length,1);
  const next=dormDoorBattle('spitter',505); assert.notEqual(next.enemies[0],e); assert.equal(next.enemies[0].hp,next.enemies[0].maxHp);
  assert.deepEqual(next.visited,[true,false,false,false]); assert.deepEqual(next.discovered,[true,false,false,false]); assert.deepEqual(next.alerted,[true,false,false,false]); assert(next.cleared.every(v=>!v));
});
test('consuming last shot reloads immediately even when firing stops, emits once, and keeps manual reload', () => {
  for(const id of [0,3,4]) {
    const b=new Battle(id); b.enemies=[]; b.player.ammo=1; b.update(0.01,{...idle,fire:true});
    assert.equal(b.player.ammo,0); assert.equal(b.player.reload,b.hero.reload); assert.equal(b.events.filter(e=>e==='reload').length,1);
    b.reload(); tick(b,b.hero.reload+0.1); assert.equal(b.player.ammo,b.hero.magazine); assert.equal(b.events.filter(e=>e==='reload').length,1);
    b.player.ammo--; b.reload(); assert.equal(b.player.reload,b.hero.reload); assert.equal(b.events.filter(e=>e==='reload').length,2);
  }
  for(const status of ['lost','won']) { const b=new Battle(); b.status=status; b.player.ammo=0; b.reload(); b.update(0.01,{...idle,fire:true}); assert.equal(b.player.reload,0); assert(!b.events.includes('reload')); }
});
console.log(`${passed} gameplay checks passed.`);
