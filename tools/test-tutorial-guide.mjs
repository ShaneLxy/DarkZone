import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),root=path.resolve(import.meta.dirname,'..');
const ts=require('typescript');
const m={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync(path.join(root,'assets/scripts/TutorialGuide.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(m,m.exports);
const {TutorialGuide,guideLayout}=m.exports;
const base={step:'move',player:{x:306,y:230},goal:{x:306,y:300},target:{x:470,y:370},auto:false,enabled:false,operating:false,frozen:false};
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
function run(g,input,seconds){let p;for(let t=0;t<seconds-1e-6;t+=1/60)p=g.advance(1/60,input);return p;}
test('three cycles stop on readable outward pose and never restart after idle',()=>{const g=new TutorialGuide(),p=run(g,base,8);assert.equal(p.cycles,3);assert(p.stopped);assert.equal(p.radius,35);const time=g.elapsed;run(g,{...base,operating:true},1);run(g,base,2);assert.equal(g.elapsed,time);assert.equal(g.advance(0,base).radius,35);});
test('step resets and pause freezes phase fade and cycle budget',()=>{const g=new TutorialGuide();run(g,base,1);const e=g.elapsed,opacity=g.opacity;run(g,{...base,frozen:true,operating:true},20);assert.equal(g.elapsed,e);assert.equal(g.opacity,opacity);const p=g.advance(.1,{...base,step:'aim'});assert.equal(p.cycles,0);assert.equal(g.elapsed,.1);});
test('arrows follow current actual goal or target vector with stable normalization',()=>{const g=new TutorialGuide();for(const step of ['move','aim','manual','auto']){const i={...base,step,auto:step==='auto',enabled:true};const p=g.advance(1.25,i),q=step==='move'?i.goal:i.target;assert(Math.abs(Math.atan2(p.direction.y,p.direction.x)-Math.atan2(q.y-i.player.y,q.x-i.player.x))<1e-8);}const p=g.advance(0,{...base,target:{x:206,y:230},step:'aim'});assert.deepEqual(p.direction,{x:-1,y:0});});
test('aim stays inside inner circle, manual reaches outer circle and flash, no rotating demo',()=>{for(const step of ['aim','manual']){const p=new TutorialGuide().advance(1.35,{...base,step});assert.equal(p.radius,step==='aim'?22:43);assert.equal(p.flash,step==='manual');assert(p.radius/48<(step==='aim'?.5:1));}});
test('manual AUTO ON first asks OFF; auto requires personally toggled ON then aim',()=>{const g=new TutorialGuide();assert.equal(g.advance(0,{...base,step:'manual',auto:true}).kind,'click-off');assert.equal(g.advance(0,{...base,step:'manual'}).kind,'manual');assert.equal(g.advance(0,{...base,step:'auto'}).kind,'click-on');assert.equal(g.advance(0,{...base,step:'auto',auto:true}).kind,'click-off');assert.equal(g.advance(0,{...base,step:'auto',auto:true,enabled:true}).kind,'auto-aim');});
test('sustained input fades, release delay prevents flutter, never mutates input',()=>{const g=new TutorialGuide(),i=structuredClone(base),snapshot=JSON.stringify(i);run(g,{...i,operating:true},.6);assert(g.opacity<.2);run(g,i,.3);assert(g.opacity<.2);run(g,i,1);assert(g.opacity>.99);assert.equal(JSON.stringify(i),snapshot);assert.equal(g.advance(0,i).cycles,0);});
const rect=(x,top,w,h)=>({x:x*1280/1047,y:720-(top+h)*720/589,w:w*1280/1047,h:h*720/589});
const hud={move:rect(42,391,158,160),fire:rect(877.5,385,133,140),auto:rect(877,535,115,44)};
const controls=[...Object.values(hud),rect(796,417,66,66),rect(713.5,478,69,70),rect(805.5,498.5,67,67),rect(708,391,72,58),{x:24,y:440,w:148,h:38}];
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
test('all bubble bodies clear real touch controls skip player and target',()=>{for(const kind of ['move','aim','manual','click-on','click-off','auto-aim']){const l=guideLayout(kind,hud);for(const r of controls)assert(!overlap(l.body,r),kind+' overlaps control');assert(!overlap(l.body,{x:610,y:330,w:60,h:60}));assert(!overlap(l.body,{x:780,y:450,w:80,h:80}));assert(l.body.x>=0&&l.body.x+l.body.w<=1280);if(kind.startsWith('click'))assert.equal(l.anchor.y,hud.auto.y+hud.auto.h/2);}});
test('reset clears presentation on next session and resumed step gets full budget',()=>{const g=new TutorialGuide();run(g,base,8);g.reset();assert.equal(g.elapsed,0);assert.equal(g.opacity,1);assert.equal(g.advance(.1,{...base,step:'manual'}).cycles,0);});
console.log(count+' tutorial guide checks passed.');
