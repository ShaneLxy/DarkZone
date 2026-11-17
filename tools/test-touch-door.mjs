import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');
const cache = new Map();
function load(name) { if (cache.has(name)) return cache.get(name); const source = fs.readFileSync(path.join(root, 'assets/scripts', name + '.ts'), 'utf8'); const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText; const m={exports:{}}; cache.set(name,m.exports); new Function('require','module','exports',js)(id=>load(id.replace('./','')),m,m.exports); return m.exports; }
const C=load('Core'), T=load('Tactical'); let passed=0; const ok=(n,f)=>{f(); passed++; console.log('PASS '+n);};
const stage={id:'touch-door',title:'touch-door',rooms:[{x:0,y:0,w:1000,h:900}],walls:[],furniture:[],doors:[{x:500,y:300,length:100,baseAngle:0,material:'steel',name:'test',rooms:[0,0]}],spawn:{x:550,y:280},exit:{x:900,y:800},hints:[''],spawns:[[0,550,340,'walker']]};
const idle={x:0,y:0,angle:0,fire:false};
function battle(material='steel'){const s={...stage,doors:[{...stage.doors[0],material}]};return new C.Battle(3,1,s);}
function byUpdate(b,n=1){for(let i=0;i<n;i++)b.update(.025,idle);}
ok('door sound profile is local and steel attenuates more than wood',()=>{assert(T.SOUND_PROFILES['door-interact'].radius<250);const s=T.makeSoundEvent({x:0,y:0},.32,'door-interact',180),shape={x:40,y:-50,w:10,h:100};const w=T.hearSoundThroughGeometry({x:100,y:0},s,[{...shape,kind:'door:0'}],C.rayRect,()=> 'wood');const st=T.hearSoundThroughGeometry({x:100,y:0},s,[{...shape,kind:'door:0'}],C.rayRect,()=> 'steel');assert(w&&st&&st.effectiveIntensity<w.effectiveIntensity);});
ok('successful and failed player interactions emit once with throttle',()=>{const b=battle();b.player.x=500;b.player.y=240;assert(b.interactDoor());assert.equal(b.sounds.length,1);assert.equal(b.sounds[0].type,'door-open');assert(b.interactDoor());assert.equal(b.sounds.length,1);byUpdate(b,15);b.doors[0].locked=true;b.doors[0].key='stairs';assert(!b.interactDoor());assert.equal(b.sounds.length,2);});
ok('door clear uses real update and does not lock steel door',()=>{for(const material of ['wood','steel']){const b=battle(material);const e=b.enemies[0];Object.assign(b.player,{x:500,y:240});Object.assign(e,{x:550,y:340});assert(b.interactDoor());const start={x:e.x,y:e.y};byUpdate(b,20);assert(e.x!==start.x||e.y!==start.y||b.doors[0].angle!==0,material);assert(!e.doorClearTime||e.doorClearTime>=0,material);}});
ok('geometry-blocked interaction is classified, throttled and does not alert the room',()=>{const b=battle('steel');b.stage={...b.stage,walls:[{x:530,y:350,w:30,h:20,kind:'wall'}]};b.syncGeometry();b.player.x=500;b.player.y=280;b.alerted=[true];b.doors[0].rooms=[0,0];assert(!b.interactDoor());assert(b.events.includes('door-geometry-blocked'));assert.equal(b.sounds.length,1);assert.equal(b.sounds[0].type,'door-interact');assert.equal(b.alerted[0],true);const before=b.sounds.length;assert(!b.interactDoor());assert.equal(b.sounds.length,before);});
ok('near blocker yields and remote enemy remains dormant',()=>{const b=battle('steel'),near=b.enemies[0],remote={...near,id:99,x:900,y:800,room:0,hp:100,maxHp:100};b.enemies=[near,remote];b.alerted=[false];b.perceptionTime=1000;Object.assign(b.player,{x:500,y:240});Object.assign(near,{x:550,y:340});assert(b.interactDoor());const start={x:near.x,y:near.y};byUpdate(b,20);assert(near.x!==start.x||near.y!==start.y);assert.equal(b.alerted[0],false);assert.equal(remote.investigate,undefined);assert.equal(remote.soundOnly,undefined);});
ok('failure falls back to existing three-attempt force open',()=>{const b=battle();const e=b.enemies[0];for(let i=0;i<3;i++){Object.assign(e,{x:550,y:340,cooldown:0});b.doorAttempts.set(0,e);b.openDoor(b.doors[0],e);b.update(.4,idle);}assert(b.events.includes('door-warning')||e.forceOpen||Math.abs(b.doors[0].angle)>0.01);});
console.log(`${passed} touch-door behavior tests passed`);
