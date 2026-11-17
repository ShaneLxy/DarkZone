import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url), root = path.resolve(import.meta.dirname, '..');
const ts = require('typescript');
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const js = ts.transpileModule(fs.readFileSync(path.join(root, 'assets/scripts/'+name+'.ts'), 'utf8'), { compilerOptions: {target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS} }).outputText;
  const m = {exports:{}}; cache.set(name,m.exports); new Function('require','module','exports',js)(id=>load(id.replace('./','')),m,m.exports); return m.exports;
}
const {AimAssist,AIM}=load('AimAssist'), {Battle,newProfile,readProfile}=load('Core');
let passed=0;
const test=(name,run)=>{run();passed++;console.log('PASS '+name);};
const stage={id:'aim',title:'aim',rooms:[{x:0,y:0,w:1200,h:900}],walls:[],furniture:[],doors:[],spawn:{x:400,y:400},exit:{x:1100,y:800},hints:[''],spawns:[[0,560,400,'walker']]};
function fixture(){const b=new Battle(3,1,stage);b.player.angle=0;b.enemies[0].stun=100;return b;}
const idle={x:0,y:0,angle:0,fire:false};
const step=(b,c={},n=1)=>{for(let i=0;i<n;i++)b.update(1/60,{...idle,...c});};
test('profile defaults and boolean persistence retain v1-v4 compatibility',()=>{assert.equal(newProfile().aimAssist,true);assert.equal(newProfile().autoFire,false);for(const version of [1,2,3,4]){const p=readProfile(JSON.stringify({version,materials:123,aimAssist:false,autoFire:true}));assert.equal(p.version,5);assert.equal(p.materials,123);assert.equal(p.aimAssist,false);assert.equal(p.autoFire,true);}});
test('dirty or missing options never coerce truthy values',()=>{for(const value of [undefined,null,0,1,'false',[],{}]){const p=readProfile(JSON.stringify({version:3,aimAssist:value,autoFire:value}));assert.equal(p.aimAssist,true);assert.equal(p.autoFire,false);}});
test('full deflection equivalent input receives bounded angular correction',()=>{const a=new AimAssist();let angle=0;for(let i=0;i<30;i++){const next=a.step(1/60,0,angle,true,true,[{id:1,angle:.14}]).angle;assert(Math.abs(next-angle)<=AIM.speed/60+1e-9);angle=next;}assert.equal(angle,.14);assert.equal(a.target,1);});
test('target stays stable across a nearer competing aim direction',()=>{const a=new AimAssist();a.step(.05,0,0,true,true,[{id:1,angle:.12}]);a.step(.05,0,.09,true,true,[{id:2,angle:.01},{id:1,angle:.12}]);assert.equal(a.target,1);});
test('dead/occluded target drops and another eligible candidate replaces it',()=>{const a=new AimAssist();a.step(.05,0,0,true,true,[{id:1,angle:.1}]);a.step(.05,0,.09,true,true,[{id:2,angle:-.1}]);assert.equal(a.target,2);a.step(.05,0,0,true,true,[]);assert.equal(a.target,undefined);});
test('behind and outside raw cone never acquire',()=>{for(const angle of [Math.PI,-Math.PI,.3,-.3]){const a=new AimAssist();assert.equal(a.step(.05,0,0,true,true,[{id:1,angle}]).angle,0);assert.equal(a.target,undefined);}});
test('large turn releases immediately with noninstant reattachment',()=>{const a=new AimAssist();a.step(.05,0,0,true,true,[{id:1,angle:.12}]);const r=a.step(.016,1,.09,true,true,[{id:1,angle:1.1}]);assert.equal(r.angle,1);assert(r.sweeping);for(let i=0;i<10;i++){assert(a.step(.016,1,1,true,true,[{id:2,angle:1.1}]).sweeping);assert.equal(a.target,undefined);}for(let i=0;i<10;i++)a.step(.016,1,1,true,true,[{id:2,angle:1.1}]);assert.equal(a.target,2);});
test('strong opposing turn immediately releases and suppresses',()=>{const a=new AimAssist();a.step(.05,0,0,true,true,[{id:1,angle:.15}]);const r=a.step(.05,-.08,.09,true,true,[{id:1,angle:.15}]);assert.equal(r.angle,-.08);assert(r.sweeping);assert.equal(a.target,undefined);});
test('release holds actual facing even if enemy moves; reset clears history',()=>{const a=new AimAssist();a.step(.05,0,0,true,true,[{id:1,angle:.12}]);assert.equal(a.step(.05,0,.09,false,true,[{id:1,angle:.2}]).angle,.09);assert.equal(a.target,undefined);a.reset();assert.equal(a.step(.05,0,0,true,true,[{id:2,angle:.1}]).sweeping,false);});
test('disabled and desktop style disabled filter cannot magnetize',()=>{const a=new AimAssist();assert.equal(a.step(.05,0,0,true,false,[{id:1,angle:.1}]).angle,0);assert.equal(a.target,undefined);});
test('Core candidates require alive strict visibility and lineClear, not discovery',()=>{const b=fixture();assert.equal(b.aimCandidates().length,1);b.enemies[0].hp=0;assert.equal(b.aimCandidates().length,0);b.enemies[0].hp=66;b.blockers=[{x:470,y:200,w:8,h:400}];assert.equal(b.aimCandidates().length,0);b.blockers=[];b.enemies[0].x=800;assert.equal(b.aimCandidates().length,0);});
test('auto requires actual ray not any enemy in cone and respects collider radius',()=>{const b=fixture();assert(b.autoFireTarget());b.player.angle=.2;assert.equal(b.autoFireTarget(),undefined);b.player.angle=.1;assert(b.autoFireTarget());step(b,{angle:.2,autoFire:true,fire:true});assert.equal(b.player.ammo,12);step(b,{autoFire:true});assert.equal(b.player.ammo,11);});
for(const kind of ['wall','furniture','door:0'])test('auto blocks first '+kind+' and never fires through it',()=>{const b=fixture();b.blockers=[{x:470,y:350,w:8,h:100,kind}];assert.equal(b.autoFireTarget(),undefined);step(b,{autoFire:true});assert.equal(b.player.ammo,12);});
test('first intersected enemy must itself be visible and living within bullet range',()=>{const b=fixture();b.enemies[0].x=1101;assert.equal(b.autoFireTarget(),undefined);b.enemies[0].x=560;b.enemies[0].hp=0;assert.equal(b.autoFireTarget(),undefined);});
for(const state of ['reload','dashTime','stun','knockback','floorPending','interaction','lost','dead'])test('unified direct/manual/auto permission rejects '+state,()=>{for(const mode of ['direct','manual','auto']){const b=fixture();if(state==='knockback')b.player.knockback={start:{x:400,y:400},end:{x:410,y:400},elapsed:0,duration:1};else if(state==='floorPending')b.floorPending=true;else if(state==='interaction')b.shootingBlockedReason='解锁中';else if(state==='lost')b.status='lost';else if(state==='dead')b.player.hp=0;else b.player[state]=1;assert(!b.canShoot());if(mode==='direct')b.shoot();else step(b,{fire:true,autoFire:mode==='auto'});assert.equal(b.player.ammo,12);assert(!b.events.includes('shoot'));}});
test('fire interval blocks every entrance without disrupting final round reload',()=>{const b=fixture();b.player.fire=.2;b.shoot();assert.equal(b.player.ammo,12);b.player.fire=0;b.player.ammo=1;step(b,{autoFire:true});assert.equal(b.player.ammo,0);assert.equal(b.player.reload,b.hero.reload);step(b,{autoFire:true},80);assert(b.player.ammo>0);});
test('auto sweep suppresses firing then returns to standby without following target',()=>{const b=fixture();step(b,{autoFire:true,sweeping:true},20);assert.equal(b.player.ammo,12);step(b,{autoFire:true});assert.equal(b.player.ammo,11);b.enemies[0].y+=100;b.player.fire=0;step(b,{autoFire:true});assert.equal(b.player.ammo,11);assert.equal(b.player.angle,0);});
test('special interaction ends without cancellation and auto resumes; dead target stops',()=>{const b=fixture();b.shootingBlockedReason='部署中';step(b,{autoFire:true},10);assert.equal(b.shootingBlockedReason,'部署中');b.shootingBlockedReason='';step(b,{autoFire:true});assert.equal(b.player.ammo,11);b.enemies[0].hp=0;b.player.fire=0;step(b,{autoFire:true});assert.equal(b.player.ammo,11);});
console.log(`${passed} aim-assist checks passed.`);
