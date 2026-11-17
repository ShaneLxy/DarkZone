import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url), root = path.resolve(import.meta.dirname, '..');
const ts = require('typescript');
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(root, 'assets/scripts/' + name + '.ts'), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  const m = { exports: {} }; cache.set(name, m.exports);
  new Function('require', 'module', 'exports', js)(id => load(id.replace('./', '')), m, m.exports); return m.exports;
}
const { VisibilityField, CombatFeedback, visibleSurfaces, ActorMotion, weaponMount, WeaponEffects, FEATHER_PIXELS, doorLampFlicker } = load('Presentation');
const { Battle, DORM_LEVEL, visibilityPolygon, visible, ROLL_DURATION } = load('Core');
let passed = 0;
function test(name, action) { action(); console.log('PASS ' + name); passed++; }
const rectangle = (x, y, w, h) => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
test('heavy footfalls shake the view with distance falloff without a muzzle flash', () => {
  const shake = (distance) => {
    const feedback = new CombatFeedback();
    feedback.heavyFootfall({ x: 0, y: 0 }, { x: distance, y: 0 });
    feedback.step(.016, 1, true);
    assert.equal(feedback.muzzle, 0);
    return Math.hypot(feedback.x, feedback.y);
  };
  assert(shake(100) > shake(350));
  assert(shake(350) > shake(600));
  assert.equal(shake(800), 0);
});
test('a faulty lamp briefly lights a small spot on its side of a shut door without extending sight', () => {
  const f = new VisibilityField();
  const lamp = { x: 400, y: 360, phase: 0, period: 10 }, viewer = { x: 365, y: 360 };
  const leaf = { x: 412, y: 310, w: 12, h: 100 };
  const lampAt = (x, y) => f.pixels[(Math.floor(y / 4) * f.width + Math.floor(x / 4)) * 4 + 3];
  f.build([]);
  f.addDoorLamp(lamp, viewer, [leaf]);
  assert.equal(lampAt(665, 360), 255);
  assert.equal(lampAt(710, 360), 0);
  assert.equal(lampAt(615, 360), 0);
  assert.equal(f.sample(665, 360, true), 0);
  f.build([]);
  f.addDoorLamp(lamp, { x: 460, y: 360 }, [leaf]);
  assert.equal(lampAt(580, 360), 0);
  assert(doorLampFlicker(lamp, 0.45) > 0.7);
  assert.equal(doorLampFlicker(lamp, 0.28), 0);
  assert.equal(doorLampFlicker(lamp, 5), 0);
});
test('feather contains continuous intermediate values rather than six bands', () => {
  const f = new VisibilityField(); f.build(rectangle(100, 100, 600, 500));
  const values = []; for (let x = 104; x < 180; x += 4) values.push(f.sample(x, 300));
  assert(new Set(values).size > 10); assert(values.every((v, i) => i === 0 || v >= values[i - 1]));
  assert.equal(f.sample(400, 300), 1); assert.equal(f.sample(90, 300), 0); assert.equal(f.sample(90, 300, true), 0);
});
test('a concave shadow cannot be filled in by feathering', () => {
  const f = new VisibilityField(); f.build([{ x: 100, y: 100 }, { x: 500, y: 100 }, { x: 500, y: 200 }, { x: 200, y: 200 }, { x: 200, y: 500 }, { x: 100, y: 500 }]);
  assert.equal(f.sample(300, 300), 0); assert.equal(f.sample(300, 300, true), 0); assert.equal(f.sample(150, 350, true), 1);
});
test('door shadows stay dark until destruction immediately changes the visibility field', () => {
  const b = new Battle(), f = new VisibilityField(); b.player.x = 775; b.player.y = 390;
  const build = () => f.build(visibilityPolygon(b.player, 0, b.blockers).map(q => ({ x: q.x - b.player.x + 640, y: q.y - b.player.y + 360 })));
  build(); assert.equal(f.sample(765, 360), 0); assert.equal(f.sample(765, 360, true), 0);
  b.damageDoor(b.doors[0], 100); build(); assert(f.sample(765, 360) > 0.5); assert.equal(f.sample(765, 360, true), 1);
});
test('viewport borders do not invent dark seams when light extends off screen', () => {
  const f = new VisibilityField(); f.build(rectangle(-100, -100, 1500, 1000));
  assert.equal(f.sample(2, 2), 1); assert.equal(f.sample(1278, 718), 1);
  f.build([]); assert.equal(f.sample(640, 360), 0);
});
test('feather width is measured in logical pixels across mask resolutions', () => {
  const a = new VisibilityField(320, 180), b = new VisibilityField(160, 90), p = rectangle(100, 100, 600, 500);
  a.build(p); b.build(p); assert(Math.abs(a.sample(130, 300) - b.sample(130, 300)) < 0.12);
});
test('weapon recoil strengths are distinct and converge without random drift', () => {
  const values = [0, 3, 4].map(id => { const f = new CombatFeedback(); f.shoot(0, id); f.step(1 / 60, 1, true); return Math.hypot(f.x, f.y); });
  assert(values[1] < values[0] && values[0] < values[2]); assert(values[0] > 2);
  const f = new CombatFeedback(); f.shoot(0, 0); for (let i = 0; i < 60; i++) f.step(1 / 60, 1, true);
  assert(Math.hypot(f.x, f.y) < 0.001);
});
test('sustained fire is bounded and muzzle brightness expires independently', () => {
  const f = new CombatFeedback();
  for (let i = 0; i < 120; i++) { if (i % 4 === 0) f.shoot(0.3, 0); f.step(1 / 60, 1, true); assert(Math.hypot(f.x, f.y) <= 7.01); }
  f.shoot(0, 0); f.step(1 / 60, 1, true); assert(f.muzzle > 0);
  for (let i = 0; i < 10; i++) f.step(1 / 60, 1, true); assert.equal(f.muzzle, 0);
});
test('damage flash fades and is not a permanently filled red overlay', () => {
  const f = new CombatFeedback(); f.hurt(); f.step(1 / 60, 1, true); assert(f.hit > 0.8);
  for (let i = 0; i < 20; i++) f.step(1 / 60, 1, true); assert.equal(f.hit, 0); assert.equal(f.lowHealth, 0);
});
test('low health pulses intermittently with 25/30 percent hysteresis', () => {
  const f = new CombatFeedback(); const samples = [];
  for (let i = 0; i < 180; i++) { f.step(1 / 60, 0.24, true); samples.push(f.lowHealth); }
  assert(samples.some(v => v > 0.7)); assert(samples.filter(v => v === 0).length > 60);
  const between = []; for (let i = 0; i < 90; i++) { f.step(1 / 60, 0.28, true); between.push(f.lowHealth); } assert(between.some(v => v > 0.5));
  f.step(1 / 60, 0.31, true); assert.equal(f.lowHealth, 0);
  for (let i = 0; i < 90; i++) { f.step(1 / 60, 0.28, true); assert.equal(f.lowHealth, 0); }
});
test('pause and a new run cannot retain red flashes, recoil or muzzle illumination', () => {
  const f = new CombatFeedback(); f.shoot(0, 4); f.hurt(); f.step(1 / 60, 0.10, true); f.step(1 / 60, 0.10, false);
  assert.equal(f.x, 0); assert.equal(f.y, 0); assert.equal(f.hit, 0); assert.equal(f.lowHealth, 0); assert.equal(f.muzzle, 0);
  f.reset(); for (let i = 0; i < 100; i++) { f.step(1 / 60, 0.28, true); assert.equal(f.lowHealth, 0); }
});
test('critical health raises both the peak and the visible duration of a red pulse', () => {
  const trace = hp => {
    const feedback = new CombatFeedback(); feedback.hurt(hp);
    const samples = Array.from({ length: 90 }, () => { feedback.step(1 / 60, hp, true); return feedback.lowHealth; });
    return { peak: Math.max(...samples), litFrames: samples.filter(x => x > 0.15).length };
  };
  const low = trace(0.24), critical = trace(0.05);
  assert(critical.peak > low.peak && critical.litFrames > low.litFrames);
});
test('furniture tops receive light without revealing the actor behind them', () => {
  const prop = { x: 600, y: 250, w: 100, h: 200 }, origin = { x: 400, y: 350 }, f = new VisibilityField();
  const surfaces = visibleSurfaces(origin, 0, [prop]); assert.equal(surfaces.length, 1); assert.equal(surfaces[0].brightness, 1);
  f.build(visibilityPolygon(origin, 0, [prop])); f.addSurfaces(surfaces);
  const sampleB = (x, y) => f.pixels[(Math.floor(y / 4) * f.width + Math.floor(x / 4)) * 4 + 2];
  assert.equal(sampleB(650, 350), 255); assert.equal(f.sample(650, 350, true), 0);
  assert.equal(sampleB(750, 350), 0); assert.equal(f.sample(750, 350, true), 0); assert(!visible(origin, 0, { x: 750, y: 350 }, [prop]));
});
test('intervening walls still hide furniture tops and rotated doors light only their footprints', () => {
  const prop = { x: 600, y: 250, w: 100, h: 200 }, wall = { x: 500, y: 0, w: 18, h: 720 }, origin = { x: 400, y: 350 };
  const surfaces = visibleSurfaces(origin, 0, [prop, wall]); assert.equal(surfaces.some(s => s.polygon[0].x === prop.x), false);
  const f = new VisibilityField(); f.build([]); f.addSurfaces([{ polygon: [{ x: 600, y: 300 }, { x: 700, y: 400 }, { x: 690, y: 410 }, { x: 590, y: 310 }], brightness: 1 }]);
  const sampleB = (x, y) => f.pixels[(Math.floor(y / 4) * f.width + Math.floor(x / 4)) * 4 + 2];
  assert.equal(sampleB(646, 354), 255); assert.equal(sampleB(606, 390), 0);
});
test('cover has a narrow penumbra while the open view edge retains broad feathering', () => {
  const f = new VisibilityField(); f.build(rectangle(100, 100, 600, 500), 60, rectangle(0, 0, 1200, 700));
  assert(f.sample(120, 300) > 0.98); assert.equal(f.sample(96, 300, true), 0);
  f.build(rectangle(100, 100, 600, 500), 60, rectangle(100, 100, 600, 500));
  assert(f.sample(120, 300) < 0.4); assert.equal(f.sample(180, 300), 1);
  f.build([], 60, rectangle(100, 100, 200, 200)); f.addSurfaces([{ polygon: rectangle(200, 200, 400, 400), brightness: 1 }]);
  assert.equal(f.pixels[(Math.floor(400 / 4) * f.width + Math.floor(400 / 4)) * 4 + 2], 0, 'surface light must not extend past the view envelope');
});
test('walking squashes then rebounds, and wall contact or stopping returns to rest', () => {
  const b = new Battle(), m = new ActorMotion(), scales = []; m.reset(b.player);
  for (let i = 0; i < 70; i++) { b.player.x += 3; m.step(1 / 60, b.player); scales.push(m.pose.scale); }
  assert(Math.min(...scales) < 0.97); assert(Math.max(...scales) > 1.002);
  for (let i = 0; i < 60; i++) m.step(1 / 60, b.player);
  assert(Math.abs(m.pose.scale - 1) < 0.0001); assert.equal(m.pose.leftFoot, 0); assert.equal(m.pose.rightFoot, 0);
});
test('roll shows all three poses in movement direction and restores aiming only after landing', () => {
  const b = new Battle(), m = new ActorMotion(); m.reset(b.player); b.player.dashX = 0; b.player.dashY = 1;
  b.player.dashTime = ROLL_DURATION * 0.85; m.step(1 / 60, b.player); assert.equal(m.pose.rollFrame, 0); assert.equal(m.pose.angle, Math.PI / 2);
  b.player.dashTime = ROLL_DURATION * 0.4; m.step(1 / 60, b.player); assert.equal(m.pose.rollFrame, 1);
  b.player.dashTime = ROLL_DURATION * 0.1; m.step(1 / 60, b.player); assert.equal(m.pose.rollFrame, 2);
  b.player.dashTime = 0.00001; m.step(1 / 60, b.player); assert.equal(m.pose.rollFrame, 2);
  b.player.dashTime = 0; b.player.angle = -1; m.step(1 / 60, b.player); assert.equal(m.pose.rollFrame, -1); assert.equal(m.pose.angle, -1);
});
test('muzzle attachments match both art styles under rotation and walking scale', () => {
  const p = new Battle().player; p.angle = 0; let mount = weaponMount(p, 1, true);
  assert(Math.abs(mount.muzzle.x - p.x - 51.25) < 0.001); assert.equal(mount.muzzle.y, p.y);
  p.angle = Math.PI / 2; mount = weaponMount(p, 0.96, true); assert(Math.abs(mount.muzzle.x - p.x) < 0.001); assert(Math.abs(mount.muzzle.y - p.y - 49.2) < 0.001);
  p.angle = 0; mount = weaponMount(p, 1, false); assert.equal(mount.muzzle.x, p.x + 41); assert.equal(mount.muzzle.y, p.y - 12);
});
test('smoke starts at the barrel, casings eject sideways, bounce and fully expire', () => {
  const p = new Battle().player; p.angle = 0; const mount = weaponMount(p, 1, true), fx = new WeaponEffects(); fx.shoot(mount, 0);
  assert.equal(fx.smoke.length, 3); assert.equal(fx.smoke[0].x, mount.muzzle.x); assert.equal(fx.casings[0].y, mount.eject.y); assert(fx.casings[0].vy < 0);
  let bounced = false; for (let i = 0; i < 120; i++) { fx.step(1 / 60, []); bounced ||= fx.casings.some(c => c.bounces > 0); }
  assert(bounced); assert.equal(fx.flash, 0); assert.equal(fx.smoke.length, 0); assert.equal(fx.casings.length, 0);
});
test('effects respect cover and sustained fire keeps particle counts bounded', () => {
  const p = new Battle().player; p.angle = 0; const mount = weaponMount(p, 1, true), fx = new WeaponEffects();
  fx.shoot(mount, 0); const wall = { x: mount.muzzle.x + 1, y: 0, w: 10, h: 720 };
  for (let i = 0; i < 30; i++) fx.step(1 / 60, [wall]); assert.equal(fx.smoke.length, 0);
  for (let i = 0; i < 300; i++) { fx.shoot(mount, 0); fx.step(1 / 60, []); assert(fx.smoke.length <= 24); assert(fx.casings.length <= 32); }
  fx.clear(); assert.equal(fx.flash, 0); assert.equal(fx.smoke.length, 0); assert.equal(fx.casings.length, 0);
});
test('USP mount follows the suppressor and has softer recoil than the rifle', () => {
  const p = new Battle(3).player; p.angle = Math.PI / 2;
  const mount = weaponMount(p, 0.96, true, 3);
  assert(Math.abs(mount.muzzle.x - (p.x - 0.96)) < 0.001); assert(Math.abs(mount.muzzle.y - (p.y + 48.96)) < 0.001);
  assert(Math.abs(mount.eject.x - (p.x + 1.92)) < 0.001); assert(Math.abs(mount.eject.y - (p.y + 31.68)) < 0.001);
  const pistol = new CombatFeedback(), rifle = new CombatFeedback(); pistol.shoot(0, 3); rifle.shoot(0, 0);
  assert(Math.abs(pistol.x) > 0); assert(Math.abs(pistol.x) < Math.abs(rifle.x));
});
test('all actor types hide feet at rest and alternate one forward foot only during real travel', () => {
  for (const actor of [new Battle(3).player, new Battle().player, ...new Battle().enemies]) {
    const m = new ActorMotion(); m.reset(actor); const sides = new Set();
    for (let i = 0; i < 20; i++) { m.step(1 / 60, actor); assert.equal(m.pose.leftFoot + m.pose.rightFoot, 0); }
    for (let i = 0; i < 80; i++) {
      actor.x += 2; m.step(1 / 60, actor);
      assert(m.pose.leftFoot >= 0 && m.pose.rightFoot >= 0);
      assert(m.pose.leftFoot === 0 || m.pose.rightFoot === 0);
      if (m.pose.leftFoot > 0.2) sides.add('left'); if (m.pose.rightFoot > 0.2) sides.add('right');
    }
    assert.equal(sides.size, 2); m.step(1 / 60, actor); assert.equal(m.pose.leftFoot + m.pose.rightFoot, 0);
    actor.hp = 0; actor.x += 3; m.step(1 / 60, actor); assert.equal(m.pose.leftFoot + m.pose.rightFoot, 0);
  }
});
test('walking cadence uses distance at different frame rates, including sideways and backward travel', () => {
  const poses = [];
  for (const dt of [1 / 30, 1 / 60, 1 / 120]) {
    const actor = new Battle(3).player, m = new ActorMotion(); m.reset(actor); actor.angle = 0.4;
    for (let i = 0; i < Math.round(0.5 / dt); i++) { actor.y += 150 * dt; m.step(dt, actor); }
    poses.push(m.pose.leftFoot - m.pose.rightFoot); assert.equal(m.pose.angle, 0.4);
    for (let i = 0; i < 30; i++) { actor.x -= 2; m.step(dt, actor); assert.equal(m.pose.angle, 0.4); }
  }
  assert(Math.max(...poses) - Math.min(...poses) < 0.001);
});
test('body recoil is bounded, follows aim and keeps both weapon attachments in the same transform', () => {
  for (const id of [0, 3, 4]) {
    const p = new Battle(id).player, m = new ActorMotion(); p.angle = Math.PI / 2; m.reset(p); m.step(0, p);
    m.shoot(p, id); assert(Math.abs(m.pose.offsetX) < 0.001); assert(m.pose.offsetY < 0 && m.pose.offsetY >= -2.4);
    assert(Math.abs(m.pose.angle - p.angle) > 0 && Math.abs(m.pose.angle - p.angle) < 0.04);
    const base = weaponMount(p, 1, true, id), mount = weaponMount(p, 1, true, id, m.pose);
    assert.notDeepEqual(mount.muzzle, base.muzzle); assert.notDeepEqual(mount.eject, base.eject);
    assert.equal(mount.angle, m.pose.angle); assert.equal(p.angle, Math.PI / 2);
    for (let i = 0; i < 100; i++) { m.shoot(p, id); m.step(1 / 120, p); assert(Math.hypot(m.pose.offsetX, m.pose.offsetY) <= 2.4); }
    for (let i = 0; i < 10; i++) m.step(1 / 60, p);
    assert.equal(m.pose.offsetX + m.pose.offsetY, 0); assert.equal(m.pose.angle, p.angle);
  }
});
test('roll, pause, death and reset suppress model recoil and stepping immediately', () => {
  const p = new Battle(3).player, m = new ActorMotion(); m.reset(p); m.shoot(p, 3);
  p.dashX = 1; p.dashY = 0; p.dashTime = ROLL_DURATION; p.x += 10; m.step(1 / 60, p);
  assert.equal(m.pose.offsetX + m.pose.offsetY, 0); assert.equal(m.pose.leftFoot + m.pose.rightFoot, 0);
  m.shoot(p, 3); assert.equal(m.pose.offsetX + m.pose.offsetY, 0);
  p.dashTime = 0; m.shoot(p, 3); m.step(1 / 60, p, false); assert.equal(m.pose.offsetX + m.pose.offsetY, 0);
  m.shoot(p, 3); p.hp = 0; m.step(1 / 60, p); assert.equal(m.pose.offsetX + m.pose.offsetY, 0);
  m.reset(p); assert.equal(m.pose.offsetX + m.pose.offsetY + m.pose.leftFoot + m.pose.rightFoot, 0);
});
test('wider range feather provides more intermediate brightness while keeping a strict cutoff', () => {
  assert.equal(FEATHER_PIXELS, 96);
  const shape = rectangle(100,100,600,500), old = new VisibilityField(), current = new VisibilityField();
  old.build(shape,60,shape); current.build(shape,FEATHER_PIXELS,shape);
  assert(current.sample(140,300) < old.sample(140,300)); assert(current.sample(180,300) < 0.96); assert.equal(current.sample(204,300),1);
  const shades = new Set(); for (let x=100;x<200;x+=4) shades.add(current.sample(x,300)); assert(shades.size>20);
  assert.equal(current.sample(96,300),0); assert.equal(current.sample(96,300,true),0);
});
test('half-range adaptive feather keeps the near-player floor bright and surface light inside the envelope', () => {
  const origin={x:640,y:360}, cone=visibilityPolygon(origin,0,[],265), f=new VisibilityField();
  f.build(cone,FEATHER_PIXELS,cone,{origin,peripheralRadius:70});
  assert(f.sample(640,360)>0.98); assert(f.sample(660,360)>0.98);
  assert(f.sample(850,360)>0.1 && f.sample(850,360)<0.9); assert.equal(f.sample(915,360),0); assert.equal(f.sample(915,360,true),0);
  const before=f.sample(660,360); f.addSurfaces([{polygon:rectangle(650,350,50,30),brightness:1},{polygon:rectangle(920,350,30,30),brightness:1}]);
  const b=(x,y)=>f.pixels[(Math.floor(y/4)*f.width+Math.floor(x/4))*4+2];
  assert(b(660,360)>245); assert.equal(b(930,360),0); assert.equal(f.sample(660,360),before);
});
test('furniture surface sampling uses the actor range and intervening walls still win', () => {
  const origin={x:400,y:350}, near={x:500,y:300,w:40,h:100}, far={x:720,y:300,w:40,h:100};
  const surfaces=visibleSurfaces(origin,0,[near,far],265); assert(surfaces.some(s=>s.polygon[0].x===near.x)); assert(!surfaces.some(s=>s.polygon[0].x===far.x));
  const blocked=visibleSurfaces(origin,0,[near,{x:450,y:250,w:16,h:200}],265); assert(!blocked.some(s=>s.polygon[0].x===near.x));
});
test('subcell polygon movement changes feather continuously instead of whole-cell jumps', () => {
  const f = new VisibilityField(), values = [];
  for (let dx = 0; dx <= 3.5; dx += 0.5) { f.build(rectangle(100 + dx, 100, 600, 500)); values.push(f.sample(130, 300)); }
  assert(new Set(values).size >= 6); for (let i = 1; i < values.length; i++) assert(Math.abs(values[i] - values[i-1]) < 0.03);
});
test('rotating open cones retain range without losing strict cover or furniture isolation', () => {
  const origin = {x:640,y:360}, f = new VisibilityField(), values = [];
  for (let i = 0; i < 80; i++) {
    const a = i * 0.003, cone = visibilityPolygon(origin,a,[],265);
    f.build(cone,FEATHER_PIXELS,cone,{origin,peripheralRadius:70});
    values.push(f.sample(640 + Math.cos(a)*215,360 + Math.sin(a)*215));
    assert.equal(f.sample(640 + Math.cos(a)*275,360 + Math.sin(a)*275,true),0);
  }
  assert(Math.max(...values)-Math.min(...values)<0.04);
});
console.log(`${passed} presentation checks passed.`);
if (process.argv.includes('--bench')) {
  for (const heroId of [0,3]) {
    const b = new Battle(heroId,1,DORM_LEVEL), f = new VisibilityField(), times = [];
    const toScreen = q => ({ x: q.x - b.player.x + 640, y: q.y - b.player.y + 360 });
    for (let i = 0; i < 80; i++) {
      const start = performance.now(), angle = i * 0.017, range = b.stats.visionRange;
      const p = visibilityPolygon(b.player,angle,b.blockers,range).map(toScreen);
      f.build(p,FEATHER_PIXELS,visibilityPolygon(b.player,angle,[],range).map(toScreen),{origin:{x:640,y:360},peripheralRadius:b.stats.peripheralRange});
      f.addSurfaces(visibleSurfaces(b.player,angle,b.blockers,range).map(surface=>({...surface,polygon:surface.polygon.map(toScreen)})));
      if (i >= 20) times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    console.log(`Local full visibility CPU benchmark (hero ${heroId}): mean ${(times.reduce((a, b) => a + b) / times.length).toFixed(2)} ms, p95 ${times[Math.floor(times.length * 0.95)].toFixed(2)} ms; this is not a mobile/GPU result.`);
  }
}
