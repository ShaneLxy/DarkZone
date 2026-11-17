import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'), require=createRequire(import.meta.url);
const ts=require('typescript');
const source=fs.readFileSync(path.join(root,'tools/test-input.mjs'),'utf8');
const prefix=source.slice(0,source.indexOf("run('scene finishes startup"));
const tail="console.log(`${passed} final clue controller checks passed (non-rendering engine doubles).`);";
const extra=`
run('reader opening closing animation freezes same battle and pages update without restarting',c=>{
 click(c,'start');c.battle.enemies=[];const b=c.battle,elapsed=b.elapsed;c.showReader('letter_alarm');
 assert(c.readerAnimating);assert.equal(c.readerPanel.scale.x,.12);c.update(.05);assert(b.elapsed===elapsed);assert(c.readerPanel.scale.x>.12&&c.readerPanel.scale.x<1);
 while(c.readerAnimating)c.update(.05);assert.equal(c.readerPanel.scale.x,1);
 c.showReader('warden_log');while(c.readerAnimating)c.update(.05);const before=b.elapsed;click(c,'reader-next');assert.equal(c.reader.page,1);assert.equal(b.elapsed,before);
 click(c,'reader-close');assert(c.readerClosing);const s=c.readerPanel.scale.x;c.update(.05);assert(c.readerPanel.scale.x<s);assert.equal(b.elapsed,before);while(c.readerAnimating)c.update(.05);
 assert.equal(c.readerLayer,undefined);assert.equal(c.mode,'playing');assert.equal(c.battle,b);
});
run('first and repeated keyboard/mobile investigations award once and achievement distinguishes missing',c=>{
 click(c,'start');c.battle.enemies=[];const q=c.battle.stage.clues[0];Object.assign(c.battle.player,{x:q.x,y:q.y,angle:Math.PI});c.update(0);
 key('KEY_E');key('KEY_E',true);assert.deepEqual(c.profile.clues,[q.id]);assert.deepEqual(c.profile.achievements,['letter_alarm']);assert(c.reader.open);c.closeReader();while(c.readerAnimating)c.update(.05);
 c.open('playing');Object.assign(c.battle.player,{x:q.x,y:q.y,angle:Math.PI});c.update(0);cc.sys.isMobile=true;click(c,'door');assert.deepEqual(c.profile.clues,[q.id]);assert.deepEqual(c.profile.achievements,['letter_alarm']);
 c.closeReader();while(c.readerAnimating)c.update(.05);c.open('achievements');click(c,'achievement-filter-collection');assert.match(c.labels.get('clue-state-letter_alarm').string,/已调查/);assert.match(c.labels.get('clue-state-letter_wall').string,/未发现/);
});
run('reader blocks keyboard mouse and multitouch input through close and returns same battle',c=>{
 click(c,'start');c.battle.enemies=[];const b=c.battle;c.showReader('warden_log');key('KEY_W');key('KEY_E');input.emit(EventType.MOUSE_DOWN,pointer(900,360));cc.sys.isMobile=true;input.emit(EventType.TOUCH_START,pointer(155,150,7));input.emit(EventType.TOUCH_START,pointer(1105,150,8));
 assert.equal(c.keys.size,0);assert.equal(c.moveTouch,-1);assert.equal(c.aimTouch,-1);assert.equal(c.mouseFire,false);assert.equal(b.player.ammo,12);
 c.closeReader();while(c.readerAnimating)c.update(.05);assert.equal(c.battle,b);assert.equal(c.mode,'playing');
});
`;
const output=prefix+extra+tail;
const encoded=Buffer.from(output.replaceAll('import.meta.url',JSON.stringify(import.meta.url)).replaceAll('import.meta.dirname',JSON.stringify(path.join(root,'tools'))).replace('c.openReaderForTest','c.showReader')).toString('base64');
await import('data:text/javascript;base64,'+encoded);
