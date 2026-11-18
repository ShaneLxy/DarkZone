// Runs the actual scene controller and Battle with engine services replaced by
// small non-rendering doubles. This tests wiring, not browser/device rendering.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');
class Events {
  listeners = new Map();
  on(name, fn, target) { const list = this.listeners.get(name) || []; list.push({ fn, target }); this.listeners.set(name, list); }
  off(name, fn, target) { this.listeners.set(name, (this.listeners.get(name) || []).filter(l => l.fn !== fn || l.target !== target)); }
  emit(name, event) { for (const l of [...(this.listeners.get(name) || [])]) l.fn.call(l.target, event); }
}
class Component { node; isValid = true; }
class Vec3 { constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); } }
class Vec2 { constructor(x = 0, y = 0) { Object.assign(this, { x, y }); } }
class Size { constructor(width = 0, height = 0) { Object.assign(this, { width, height }); } }
class Vec4 { constructor(x = 0, y = 0, z = 0, w = 0) { Object.assign(this, { x, y, z, w }); } }
class UITransform extends Component {
  width = 1280; height = 720;
  setContentSize(width, height) { Object.assign(this, { width, height }); }
  setAnchorPoint(x, y) { this.anchorPoint = { x, y }; }
  convertToNodeSpaceAR(p) { return new Vec3(p.x - this.node.position.x, p.y - this.node.position.y, 0); }
}
class Node extends Events {
  static EventType = { TOUCH_START: 'touch-start', TOUCH_MOVE: 'touch-move', TOUCH_END: 'touch-end', TOUCH_CANCEL: 'touch-cancel', MOUSE_WHEEL: 'mouse-wheel' };
  position = new Vec3(); components = []; active = true;
  constructor(name = '') { super(); this.name = name; }
  setPosition(x, y, z = 0) { this.position = new Vec3(x, y, z); }
  setScale(x, y, z = 1) { this.scale = new Vec3(x, y, z); }
  getSiblingIndex() { return 0; }
  setSiblingIndex(index) { this.siblingIndex = index; }
  addComponent(Type) { const c = new Type(); c.node = this; this.components.push(c); return c; }
  getComponent(Type) { return this.components.find(c => c instanceof Type); }
  destroy() { this.active = false; this.listeners.clear(); }
}
// Cocos Scene.addComponent throws error 3822; components must live on a child Node.
class Scene extends Node { addComponent() { throw new Error('Cocos error 3822: cannot add a component to Scene'); } }
class Graphics extends Component { commands = []; }
for (const name of ['rect', 'circle', 'fill', 'stroke', 'moveTo', 'lineTo', 'close']) Graphics.prototype[name] = function (...args) { this.commands.push({ name, args }); };
Graphics.prototype.clear = function () { this.commands = []; };
Graphics.prototype.fill = function () { this.commands.push({ name: 'fill', args: [], fill: this.fillColor?.hex }); };
class Color {
  static fromHEX(c, hex) { c.hex = hex; return c; }
  static lerp(out, start, end, t) {
    const channels = [1, 3, 5].map(i => {
      const a = parseInt(start.hex.slice(i, i + 2), 16), b = parseInt(end.hex.slice(i, i + 2), 16);
      return Math.round(a + (b - a) * t).toString(16).padStart(2, '0');
    });
    return Object.assign(out, { hex: '#' + channels.join('') });
  }
}
class Camera extends Component {
  static ProjectionType = { ORTHO: 0 }; static ClearFlag = { SOLID_COLOR: 1 };
  toWorld = p => p;
  screenToWorld(p) { return this.toWorld(p); }
}
class Canvas extends Component {}
class Label extends Component {
  static HorizontalAlign = { LEFT: 0, CENTER: 1, RIGHT: 2 };
  static VerticalAlign = { CENTER: 1 }; static Overflow = { CLAMP: 1 };
}
class Button extends Component { static EventType = { CLICK: 'click' }; static Transition = { NONE: 0, SCALE: 1 }; }
class Mask extends Component { static Type = { GRAPHICS_STENCIL: 2, GRAPHICS_RECT: 0 }; subComp = new Graphics(); }
class Sprite extends Component { static SizeMode = { CUSTOM: 0 }; static Type = { FILLED: 3 }; }
class UIOpacity extends Component { opacity = 255; }
class SpriteFrame { originalSize = new Size(1254, 1254); clone() { return Object.assign(new SpriteFrame(), this); } destroy() { this.destroyed = true; } }
class EffectAsset {}
class Material {
  properties = new Map();
  initialize(info) { this.info = info; }
  setProperty(name, value) { this.properties.set(name, value); }
  destroy() { this.destroyed = true; }
}
class Texture2D {
  static PixelFormat = { RGBA8888: 0 }; static Filter = { LINEAR: 1 }; static WrapMode = { CLAMP_TO_EDGE: 0 };
  reset(info) { Object.assign(this, info); }
  setFilters() {} setWrapMode() {}
  uploadData(data) { this.lastPixels = data.slice(); }
  destroy() { this.destroyed = true; }
}
class RenderTexture extends Texture2D {}
class TextureRect { constructor(x, y, width, height) { Object.assign(this, { x, y, width, height }); } }
class AudioSource extends Component { playOneShot() {} }
const EventType = Object.fromEntries(['KEY_DOWN', 'KEY_UP', 'MOUSE_MOVE', 'MOUSE_DOWN', 'MOUSE_UP', 'TOUCH_START', 'TOUCH_MOVE', 'TOUCH_END', 'TOUCH_CANCEL'].map(n => [n, n]));
const input = new Events();
const KeyCode = Object.fromEntries(['KEY_W', 'KEY_A', 'KEY_S', 'KEY_D', 'KEY_E', 'KEY_F', 'KEY_Q', 'KEY_R', 'KEY_G', 'KEY_P', 'ESCAPE', 'ENTER', 'SPACE', 'ARROW_UP', 'ARROW_DOWN', 'ARROW_LEFT', 'ARROW_RIGHT'].map(n => [n, n]));
let pending = [];
let deferEffect = false;
let deferArt = false;
let persistedSave = null;
const cc = { _decorator: { ccclass: () => Type => Type, property: () => () => {} }, Component, Node, Graphics, Color, Canvas, Camera, Label, UITransform, Mask, Sprite, SpriteFrame, EffectAsset, Material, Texture2D, RenderTexture, Rect: TextureRect, AudioSource, AudioClip: class {}, Button, Vec3, Vec4, Layers: { Enum: { UI_2D: 1 }, nameToLayer: () => -1, addLayer() {} }, ResolutionPolicy: { SHOW_ALL: 2 }, input, Input: { EventType }, KeyCode, EventMouse: { BUTTON_LEFT: 0 }, Game: { EVENT_HIDE: 'hide' }, game: new Events(), resources: { load(name, Type, callback) { if (Type === EffectAsset && !deferEffect) callback(null, new EffectAsset()); else pending.push({ name, Type, callback }); } }, sys: { isMobile: false, localStorage: { getItem() { return null; }, setItem() {} } }, view: { setDesignResolutionSize() {} } };
Object.assign(cc, { Size, Vec2, UIOpacity });
cc.sys.localStorage = { getItem() { return persistedSave; }, setItem(key, value) { persistedSave = value; } };
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const source = fs.readFileSync(path.join(root, `assets/scripts/${name}.ts`), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true } }).outputText;
  const m = { exports: {} }; cache.set(name, m.exports);
  new Function('require', 'module', 'exports', js)(id => id === 'cc' ? cc : load(id.replace('./', '')), m, m.exports);
  return m.exports;
}
const { Blackout } = load('Blackout');
const { drawFeet, drawTutorialTarget } = load('Art');
const { weaponMount } = load('Presentation');
const { Battle, DORM_LEVEL, profileGrowth, readProfile } = load('Core');
let passed = 0;
function testTutorialMarkerRendering() {
  const { Battle } = load('Core'), { createDormRun } = load('Levels');
  const g = new Graphics(); const b = new Battle(3, 1, createDormRun(0x12d02)[0]);
  drawTutorialTarget(g, b, 0); assert.equal(g.commands.length, 0);
  b.beginTutorial('aim'); drawTutorialTarget(g, b, 0); const on = g.commands.length;
  drawTutorialTarget(g, b, .375); assert(g.commands.length > on);
  assert(g.commands.some(c => c.name === 'circle'));
}
testTutorialMarkerRendering(); console.log('PASS tutorial red marker active-only and pulse rendering'); passed++;
function run(name, test, configure = () => {}) {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'assets/scenes/Facility.scene'), 'utf8'));
  const entry = data.find(item => item.__type__ === '0aaf7DMtNFN8bI0oSTnO61U');
  const host = data[entry.node.__id__];
  assert.equal(host.__type__, 'cc.Node', 'controller must be attached to a regular child Node');
  assert.equal(data[1]._components.length, 0, 'Scene must not directly own gameplay components');
  const controller = new Blackout(); controller.node = host.__type__ === 'cc.Scene' ? new Scene(host._name) : new Node(host._name); cc.sys.isMobile = false;
  assert(entry.visibilityEffect?.__uuid__, 'effect asset must be a scene dependency'); controller.visibilityEffect = new EffectAsset();
  // Existing controller scenarios represent returning players; first-account
  // onboarding is exercised separately with an explicitly absent save.
  pending = []; persistedSave = JSON.stringify({ version: 3 });
  configure(controller);
  try {
    controller.onLoad();
    if (!deferArt) for (const request of pending.filter(r => r.Type === SpriteFrame)) request.callback(null, new SpriteFrame());
    test(controller); console.log('PASS ' + name); passed++;
  }
  finally { controller.onDestroy(); deferEffect = false; deferArt = false; }
}
function clickButton(c, id) {
  const button = c.buttons.find(b => b.node.name === 'Button-' + id);
  assert(button, 'real Cocos button missing: ' + id); button.node.emit(Button.EventType.CLICK);
}
function enterFirstChapter(c) {
  if (c.mode === 'menu') clickButton(c, 'start');
  if (c.mode === 'chapters') clickButton(c, 'chapter-1');
  if (c.mode === 'chapter-intro') clickButton(c, 'chapter-enter');
  clickButton(c, 'sortie-start');
  for (let i = 0; i < 31 && c.transition; i++) c.update(.05);
}
function click(c, id) {
  if (id !== 'start' && id !== 'retry') { clickButton(c, id); return; }
  if (id === 'retry') clickButton(c, id);
  enterFirstChapter(c);
  if (c.tutorialPrompt === 'replay') clickButton(c, 'tutorial-prompt-skip');
}
function selectTraining(c, id) {
  click(c, 'training-hero-' + id);
  for (let i = 0; i < 9 && c.trainingSwitch; i++) c.update(0.05);
}
function restartExploration(c) {
  c.open('chapters');
  click(c, 'start');
}
function startLegacyFixture(c) {
  c.makeBattle = (id = 3) => new Battle(id, c.profile.levels[id], DORM_LEVEL, profileGrowth(c.profile, id));
  click(c, 'start');
}
const key = (name, up = false) => input.emit(up ? EventType.KEY_UP : EventType.KEY_DOWN, { keyCode: KeyCode[name] });
const pointer = (x, y, id = 0) => ({ getLocation: () => ({ x, y }), getUILocation: () => ({ x: -9999, y: -9999 }), getButton: () => 0, getID: () => id });
run('street conversation triggers once, wraps all four lines and keeps the battle running', c => {
  click(c, 'start'); const stage = load('Levels').createStreet(17);
  c.battle = new Battle(3, 1, stage); const b = c.battle;
  b.enemies = []; b.supportCalled = true; stage.street.support.entries.length = 0; c.intro = undefined; c.ghostRadio = undefined;
  Object.assign(b.player, { x: stage.street.trigger.x + 30, y: stage.street.trigger.y + 100 }); b.updateAlarm(.05);
  const road = b.rooms[5]; Object.assign(b.player, { x: road.x + (stage.exit.x - road.x) * .3 - 5, y: road.y + 200 });
  c.update(.05); assert(!c.streetStory);
  b.player.x += 10; c.update(.05); assert(c.streetStory); const elapsed = b.elapsed;
  for (let i = 0; i < 4; i++) {
    assert.equal(c.streetStory.index, i);
    c.advanceStreetStory(); c.update(.001);
    assert.equal(c.streetStory.label.string.replaceAll('\n', ''), c.streetStoryLines[i]);
    assert(c.streetStory.label.string.split('\n').every(line => line.length <= 19));
    key('KEY_D'); assert(c.keys.has(KeyCode.KEY_D)); c.update(.05); key('KEY_D', true);
    c.advanceStreetStory(); for (let j = 0; j < 6; j++) c.update(.05);
  }
  assert(!c.streetStory); assert(b.elapsed > elapsed); assert.equal(b.exitHold, false);
  c.update(.05); assert(!c.streetStory);
});
run('chapter fades freeze gameplay and input, delay tutorial, then settle on black', c => {
  clickButton(c, 'start'); clickButton(c, 'chapter-1'); clickButton(c, 'chapter-enter'); clickButton(c, 'sortie-start');
  const b = c.battle, start = { ...b.player }, enemies = JSON.stringify(b.enemies);
  assert.equal(c.transition.kind, 'enter'); assert.equal(c.transitionShade.node.getComponent(UIOpacity).opacity, 255);
  assert.equal(c.hud.node.getComponent(UIOpacity).opacity, 0); assert(!c.tutorialPrompt);
  key('KEY_D'); key('SPACE'); clickButton(c, 'pause');
  for (let i = 0; i < 20; i++) c.update(.05);
  assert.equal(b.elapsed, 0); assert.equal(b.player.x, start.x); assert.equal(JSON.stringify(b.enemies), enemies);
  assert.equal(c.mode, 'playing'); assert.equal(c.hud.node.getComponent(UIOpacity).opacity, 0);
  assert(c.transitionShade.node.getComponent(UIOpacity).opacity < 5);
  for (let i = 0; i < 11; i++) c.update(.05);
  assert(!c.transition && c.tutorialPrompt === 'replay'); assert(!c.transitionShade.node.active);
  clickButton(c, 'tutorial-prompt-skip'); b.status = 'won'; c.update(.05);
  assert.equal(c.transition.kind, 'win'); const elapsed = b.elapsed;
  for (let i = 0; i < 20; i++) c.update(.05);
  assert.equal(c.mode, 'playing'); assert.equal(b.elapsed, elapsed); assert(c.transitionShade.node.getComponent(UIOpacity).opacity > 0);
  for (let i = 0; i < 16; i++) c.update(.05);
  assert.equal(c.mode, 'result'); assert(c.transitionShade.node.active); assert.equal(c.transitionShade.node.getComponent(UIOpacity).opacity, 255);
  clickButton(c, 'retry'); assert(!c.transitionShade.node.active);
});
run('scene finishes startup with a visible menu and input bindings', c => {
  assert.equal(c.mode, 'menu'); assert(c.homeFrames.has('defaultBG')); assert(c.homeFrames.has('game_logo'));
  assert.equal(c.homeBackdrop.active, true); assert.equal(c.environmentCamera.enabled, false);
  assert(input.listeners.get(EventType.KEY_DOWN).length > 0);
  const preview = c.battle;
  assert(!c.buttons.some(b => /Button-(street-start|tutorial-replay)/.test(b.node.name)));
  clickButton(c, 'start'); assert.equal(c.mode, 'chapters');
  assert.equal(c.battle, preview); assert.equal(c.environmentCamera.enabled, false);
  clickButton(c, 'chapter-2'); assert.equal(c.mode, 'chapter-intro');
  assert.match(c.labels.get('chapter-locked').string, /静默宿舍/);
  assert(!c.buttons.some(b => b.node.name === 'Button-chapter-enter'));
  key('ENTER'); key('ENTER', true); assert.equal(c.mode, 'chapter-intro');
  clickButton(c, 'chapter-cancel'); assert.equal(c.mode, 'chapters');
  clickButton(c, 'chapter-1'); assert.equal(c.mode, 'chapter-intro');
  assert.equal(c.battle, preview); assert.equal(c.labels.get('dialog-title').string, '静默宿舍');
  key('ESCAPE'); key('ESCAPE', true); assert.equal(c.mode, 'chapters');
  click(c, 'start'); assert.equal(c.mode, 'playing');
  assert.equal(c.homeBackdrop.active, false); assert.equal(c.environmentCamera.enabled, true);
  c.update(1 / 60); assert.match(c.labels.get('ammo').string, /12/); assert.match(c.labels.get('health').string, /100/);
}, c => { c.unlockAllChapters = false; });
run('all four chapters are unlocked during test verification', c => {
  clickButton(c, 'start');
  const titles = ['静默宿舍', '归途', '归巢', '断翼行动'];
  for (const chapter of [1, 2, 3, 4]) {
    clickButton(c, 'chapter-' + chapter);
    assert.equal(c.mode, 'chapter-intro');
    assert.equal(c.labels.get('dialog-title').string, titles[chapter - 1]);
    assert(!c.labels.has('chapter-locked'), 'chapter ' + chapter + ' still shows the locked notice');
    clickButton(c, 'chapter-enter');
    assert.equal(c.mode, 'select-hero', 'chapter ' + chapter + ' cannot open the sortie picker');
    clickButton(c, 'sortie-close');
    clickButton(c, 'chapter-cancel');
    assert.equal(c.mode, 'chapters');
  }
});
run('chapter art uses the floor loading presentation and starts only after resources arrive', c => {
  c.profile.apartmentUnlocked = true;
  clickButton(c, 'start'); clickButton(c, 'chapter-3'); clickButton(c, 'chapter-enter'); clickButton(c, 'sortie-start');
  assert.equal(c.mode, 'street-loading'); assert.match(c.labels.get('floor-progress').string, /0%/);
  assert(!c.labels.has('panel-title') && !c.dialogArtwork);
  const assets = pending.filter(request => request.name.startsWith('common/environment/') && c.chapterLoad.total > 0 && !c.streetFrames.size);
  const chapterRequests = assets.slice(-c.chapterLoad.total);
  assert(chapterRequests.length > 1);
  chapterRequests[0].callback(null, new SpriteFrame()); c.update(.05);
  assert.notEqual(c.labels.get('floor-progress').string, '加载场景  0%');
  for (const request of chapterRequests.slice(1)) request.callback(null, new SpriteFrame());
  for (let i = 0; i < 8; i++) c.update(.05);
  assert.equal(c.mode, 'playing'); assert.equal(c.battle.stage.id, 'apartment-arrival'); assert(c.transition);
});
run('all three chapters restrict sortie choices even for unlocked operators', c => {
  c.profile.streetUnlocked = c.profile.apartmentUnlocked = true;
  c.profile.owned[0] = c.profile.owned[4] = true;
  clickButton(c, 'start');
  const preview = c.battle;
  for (const chapter of [1, 2, 3]) {
    clickButton(c, 'chapter-' + chapter); clickButton(c, 'chapter-enter');
    assert.equal(c.mode, 'select-hero');
    assert.equal(c.battle, preview);
    assert.equal(c.sortieHero, 3);
    assert.equal(c.labels.get('sortie-blocked-0').string, '本关限定凛');
    assert.equal(c.labels.get('sortie-blocked-4').string, '本关限定凛');
    assert(!c.buttons.some(b => /Button-sortie-hero-(0|4)/.test(b.node.name)));
    c.sortieHero = 0; c.dispatchSortie(); assert.equal(c.battle, preview);
    clickButton(c, 'sortie-close'); assert.equal(c.mode, 'chapter-intro');
    assert.equal(c.selectedChapter, chapter);
    clickButton(c, 'chapter-cancel');
  }
});
run('achievement and level claims persist each payout once across reload', c => {
  c.profile.streetUnlocked = c.profile.apartmentUnlocked = true;
  const keys = c.profile.cases.keys, coins = c.profile.coins;
  click(c, 'achievements');
  click(c, 'achievement-claim-clear-dorm'); click(c, 'achievement-claim-clear-street');
  assert.equal(c.profile.cases.keys, keys + 2);
  assert.equal(c.labels.get('ach-level').string, 'Lv.2');
  click(c, 'achievement-claim-level');
  const saved = readProfile(persistedSave);
  assert.equal(saved.coins, coins + 90);
  assert.deepEqual(saved.achievementProgress.levels, [2]);
  c.profile = saved; c.open('achievements');
  assert(!c.buttons.some(b => ['Button-achievement-claim-clear-dorm', 'Button-achievement-claim-level'].includes(b.node.name)));
});
run('home reads real balances and routes available and unavailable tiles', c => {
  assert.equal(c.labels.get('home-materials').string, '1,240');
  assert.equal(c.labels.get('home-tickets').string, '7');
  click(c, 'challenge'); assert.equal(c.mode, 'menu'); assert.match(c.notice, /尚未开放/);
  click(c, 'survival'); assert.equal(c.mode, 'menu'); assert.match(c.notice, /生存模式尚未开放/);
  click(c, 'settings'); assert.equal(c.mode, 'settings');
  click(c, 'sound'); assert.equal(JSON.parse(persistedSave).sound, false);
  click(c, 'help'); assert.equal(c.mode, 'help'); click(c, 'close'); assert.equal(c.mode, 'settings');
  click(c, 'close');
  for (const id of ['mail', 'calendar', 'events', 'record']) assert(!c.buttons.some(b => b.node.name === 'Button-' + id));
  click(c, 'tickets'); assert.equal(c.mode, 'recruit');
}, () => { persistedSave = JSON.stringify({ version: 3, materials: 1240, tickets: 7 }); });
run('mission popup blocks the home buttons, starts exploration and claims settled rewards', c => {
  click(c, 'daily'); assert.equal(c.mode, 'missions');
  for (const asset of ['panel', 'chest', 'claim', 'go']) assert(c.missionFrames.has(asset));
  assert(!c.buttons.some(b => b.node.name === 'Button-start'));
  assert.equal(c.labels.get('mission-rooms-count').string, '0/2');
  key('ESCAPE'); assert.equal(c.mode, 'menu');
  click(c, 'daily'); click(c, 'mission-rooms'); assert.equal(c.mode, 'chapters');
  click(c, 'start'); assert.equal(c.mode, 'playing');
  c.battle.visited[0] = c.battle.visited[2] = true;
  c.battle.status = 'lost'; c.update(1 / 60);
  click(c, 'base'); click(c, 'daily');
  assert.equal(c.labels.get('mission-rooms-count').string, '2/2');
  const balance = c.profile.materials;
  click(c, 'mission-rooms'); assert.equal(c.profile.materials, balance + 20);
  assert.equal(c.labels.get('mission-activity').string, '20');
  click(c, 'milestone-20'); assert.equal(c.profile.materials, balance + 35);
  assert.equal(c.labels.get('mission-reward-20-state').string, '已领取');
  assert.deepEqual(JSON.parse(persistedSave).daily.milestones, [20]);
});
run('WASD and arrow keys move the player and release stops movement', c => {
  key('ENTER'); key('ENTER', true); assert.equal(c.mode, 'chapters');
  click(c, 'start'); const start = { ...c.battle.player };
  key('KEY_W'); c.update(0.05); key('KEY_W', true); assert(c.battle.player.y > start.y);
  const y = c.battle.player.y; c.update(0.05); assert.equal(c.battle.player.y, y);
  key('ARROW_RIGHT'); c.update(0.05); key('ARROW_RIGHT', true); assert(c.battle.player.x > start.x);
});
run('mouse clicks do not activate simulated mobile sticks', c => {
  click(c, 'start');
  input.emit(EventType.TOUCH_START, pointer(900, 420));
  assert.equal(c.aimTouch, -1); assert.equal(c.moveTouch, -1);
  input.emit(EventType.MOUSE_MOVE, pointer(900, 360));
  input.emit(EventType.MOUSE_DOWN, pointer(900, 360)); c.update(0.05);
  assert.equal(c.battle.player.angle, 0); assert.equal(c.battle.player.ammo, 11);
  input.emit(EventType.MOUSE_UP, pointer(900, 360));
  for (let i = 0; i < 10; i++) c.update(0.02);
  assert.equal(c.battle.player.ammo, 11);
});
run('pointer conversion follows camera and canvas instead of assuming UI origin', c => {
  click(c, 'start'); c.canvas.setPosition(700, 410);
  c.camera.toWorld = p => new Vec3(p.x * 0.5 + 60, p.y * 0.5 + 50, 0);
  input.emit(EventType.MOUSE_MOVE, pointer(1800, 720));
  assert.equal(c.mx, 900); assert.equal(c.my, 360);
});
run('one UI recruit click consumes exactly one ticket', c => {
  click(c, 'tickets'); const tickets = c.profile.tickets;
  click(c, 'draw'); assert.equal(c.profile.tickets, tickets - 1); assert.equal(c.profile.draws, 1);
  assert.equal(Object.values(c.profile.owned).filter(Boolean).length, 2);
});
run('the store case roll persists the award once and restores the summary after a reload', c => {
  click(c, 'recruit');
  assert(!c.buttons.some(box => ['Button-shop-roster', 'Button-shop-recruit'].includes(box.node.name)));
  click(c, 'shop-cases');
  click(c, 'case-preview');
  click(c, 'case-filter-4');
  assert.equal(c.labels.get('cases-drop-probability-0').string, '0.25%');
  click(c, 'case-next');
  assert.equal(c.labels.get('cases-page').string, '2 / 2');
  click(c, 'case-back');
  const originalSetItem = cc.sys.localStorage.setItem;
  cc.sys.localStorage.setItem = () => { throw Error('blocked write'); };
  try { click(c, 'case-open-1'); } finally { cc.sys.localStorage.setItem = originalSetItem; }
  assert.equal(c.profile.cases.keys, 3);
  assert.equal(c.caseRoll, undefined);
  click(c, 'case-open-1');
  assert.equal(c.profile.cases.keys, 2);
  assert(!c.buttons.some(box => box.node.name === 'Button-case-open-1'));
  const saved = readProfile(persistedSave);
  assert.deepEqual(saved.cases.pending, c.profile.cases.pending);
  for (let i = 0; i < 100; i++) c.update(0.05);
  assert.equal(c.labels.get('cases-result-title').string, '开箱奖励');
  c.open('menu');
  c.profile = saved;
  click(c, 'recruit'); click(c, 'shop-cases');
  assert.equal(c.labels.get('cases-result-title').string, '开箱奖励');
  click(c, 'case-done');
  assert.equal(readProfile(persistedSave).cases.pending, undefined);
  assert.equal(readProfile(persistedSave).cases.keys, 2);
  assert.deepEqual(readProfile(persistedSave).armory, saved.armory);
});
run('backpack preserves the exact equipped attachment across filtering, scrolling and workshop return', c => {
  click(c, 'backpack');
  assert.equal(c.mode, 'backpack');
  assert(!c.buttons.some(box => box.node.name === 'Button-start'));
  assert.match(c.labels.get('backpack-capacity').string, /32 \/ 120/);
  click(c, 'backpack-item-medkit');
  assert.match(c.labels.get('backpack-held').string, /15 \/ 99/);
  assert(!c.buttons.some(box => box.node.name === 'Button-backpack-action'));
  click(c, 'backpack-filter-attachment');
  click(c, 'backpack-next');
  click(c, 'backpack-item-mod-31');
  assert.match(c.labels.get('backpack-notes').string, /已安装于 幽灵/);
  click(c, 'backpack-action');
  assert.equal(c.mode, 'training');
  assert.equal(c.trainingHeroId, 0);
  assert.equal(c.trainingMod, 31);
  assert(c.buttons.some(box => box.node.name === 'Button-workshop-mod-31'));
  click(c, 'close');
  assert.equal(c.mode, 'backpack');
  assert.equal(c.backpackSelection, 'mod-31');
  click(c, 'backpack-filter-consumable'); click(c, 'backpack-item-shock-mine'); click(c, 'backpack-action');
  assert.equal(c.mode, 'roster');
  assert.equal(c.rosterFocus, 'shock-mine');
  click(c, 'carry-shock-mine'); click(c, 'close');
  assert.match(c.labels.get('backpack-notes').string, /已选为下次行动道具/);
  assert.equal(c.profile.armory.counts['shock-mine'], 2);
  click(c, 'backpack-close');
  assert.equal(c.mode, 'menu');
}, () => {
  const mods = Array.from({ length: 32 }, (_, i) => ({ serial: i + 1, kind: 'suppressor', quality: i % 4, roll: i * 21, level: 1 }));
  persistedSave = JSON.stringify({ version: 5, owned: { 0: true }, armory: {
    counts: { medkit: 15, 'shock-mine': 2 }, mods, kits: { 0: { slots: { muzzle: 31 } } },
  } });
});
run('fixed weapon mods survive reload and combat uses the upgraded magazine, vest and purchased supplies', c => {
  assert.equal(c.profile.coins, 780);
  assert.equal(readProfile(persistedSave).coins, 780);
  click(c, 'recruit'); click(c, 'product-extended'); click(c, 'shop-quality-1'); click(c, 'shop-buy');
  const extended = c.profile.armory.mods[0];
  click(c, 'shop-gear'); click(c, 'product-vest'); click(c, 'shop-buy');
  click(c, 'shop-item'); click(c, 'product-shock-mine'); click(c, 'shop-buy');
  click(c, 'shop-item'); click(c, 'shop-filter-3'); click(c, 'product-bandage'); click(c, 'shop-buy');
  click(c, 'close'); click(c, 'close');
  click(c, 'backpack'); click(c, 'backpack-item-vest'); click(c, 'backpack-action'); click(c, 'gear-vest'); click(c, 'carry-shock-mine');
  click(c, 'close'); click(c, 'backpack-close');
  click(c, 'training');
  assert.equal(c.labels.get('training-gun').string, '手枪');
  click(c, 'tab-3'); click(c, 'workshop-slot-1'); click(c, 'workshop-mod-install');
  click(c, 'workshop-mod-upgrade'); click(c, 'workshop-weapon-upgrade');
  c.profile = readProfile(persistedSave);
  const kit = c.profile.armory.kits[3];
  assert.equal(kit.weaponLevel, 2);
  assert.equal(kit.slots.magazine, extended.serial);
  const saved = c.profile.armory.mods[0];
  assert.deepEqual([saved.quality, saved.roll, saved.level], [1, extended.roll, 2]);
  click(c, 'close'); click(c, 'start');
  assert.equal(c.battle.hero.gun, 'USP 消音手枪');
  assert(c.battle.hero.spread < 0.018);
  assert(c.battle.player.ammo >= 16 && c.battle.player.ammo <= 17);
  assert.equal(c.battle.supplies.bandage, 1);
  c.battle.hurt(30); assert.equal(c.battle.player.hp, 76);
  Object.assign(c.battle.player, { knockback: undefined, hit: 0, angle: 0 });
  c.battle.enemies = [];
  assert(c.battle.throwTactical());
  assert.equal(readProfile(persistedSave).armory.counts['shock-mine'], undefined);
  assert.equal(c.battle.plantedMines.length, 1);
  assert(c.battle.useSupply('bandage'));
  for (let i = 0; i < 21; i++) c.update(0.05);
  assert.equal(readProfile(persistedSave).armory.counts.bandage, undefined);
}, () => { persistedSave = JSON.stringify({ version: 4, coins: 600, tutorial: 'done', armory: { weapons: ['usp', 'glock', 'glock'], parts: 6 } }); });
run('real mobile touches support independent move and aim and cancel cleanly', c => {
  cc.sys.isMobile = true; click(c, 'start');
  const stick = c.battleSticks[1];
  const aim = { x: stick.position.x + 640, y: stick.position.y + 360 };
  input.emit(EventType.TOUCH_START, pointer(155, 150, 3));
  input.emit(EventType.TOUCH_START, pointer(aim.x, aim.y, 4));
  input.emit(EventType.TOUCH_MOVE, pointer(155, 202, 3));
  input.emit(EventType.TOUCH_MOVE, pointer(aim.x + 75, aim.y, 4));
  const y = c.battle.player.y; c.update(0.05);
  assert(c.battle.player.y > y); assert.equal(c.battle.player.ammo, 11);
  input.emit(EventType.TOUCH_CANCEL, pointer(155, 202, 3));
  input.emit(EventType.TOUCH_CANCEL, pointer(1157, 150, 4));
  assert.equal(c.moving, false); assert.equal(c.aiming, false);
});
run('pause and hide clear held movement and firing', c => {
  click(c, 'start'); key('KEY_D'); input.emit(EventType.MOUSE_DOWN, pointer(900, 360));
  cc.game.emit('hide'); assert.equal(c.mode, 'pause'); assert.equal(c.keys.size, 0); assert.equal(c.mouseFire, false);
  const x = c.battle.player.x; c.update(0.05); assert.equal(c.battle.player.x, x);
  key('ENTER'); assert.equal(c.mode, 'playing'); c.update(0.05); assert.equal(c.battle.player.x, x);
});
assert([...input.listeners.values()].every(list => list.length === 0), 'destroy must remove all input subscriptions');
run('E and the mobile interaction button operate doors while preserving movement input', c => {
  click(c, 'start'); c.battle.loot = []; c.battle.enemies = []; const d = c.battle.doors[0]; c.battle.player.x = d.x + d.length / 2; c.battle.player.y = d.y - 64; c.update(0.05);
  key('KEY_E'); key('KEY_E', true); assert.equal(c.battle.doors[0].target, Math.PI / 2);
  cc.sys.isMobile = true; key('KEY_W'); click(c, 'door'); assert.equal(c.battle.doors[0].target, 0); assert(c.keys.has(KeyCode.KEY_W));
});
run('touch key pickup and descent load the real lower-floor dependencies before resuming the run', c => {
  click(c, 'start'); cc.sys.isMobile = true;
  const b = c.battle;
  Object.assign(b.player, { x: b.pickup.x, y: b.pickup.y, hp: 67, ammo: 5, invulnerable: 20 });
  c.update(0.05); assert.equal(c.labels.get('pickup-button').string, '拾取');
  key('KEY_E'); key('KEY_E', true); assert(!b.keys.has('stairs'));
  click(c, 'pickup'); assert(b.keys.has('stairs'));
  const d = b.doors.find(d => d.key === 'stairs');
  Object.assign(b.player, { x: d.x + d.length / 2, y: d.y - 64 });
  c.update(0.05); click(c, 'door');
  for (let i = 0; i < 12; i++) c.update(0.05);
  Object.assign(b.player, b.stage.exit);
  c.update(0.05); assert.equal(c.labels.get('door-button').string, '下楼');
  click(c, 'door');
  for (let i = 0; i < 8; i++) c.update(0.05);
  const lowerAssets = pending.filter(r => /(?:reception-floor-v1|sofa-reception-v2)/.test(r.name));
  assert.equal(lowerAssets.length, 2); assert.equal(c.mode, 'loading');
  assert.match(c.labels.get('floor-progress').string, /33%/);
  lowerAssets[0].callback(null, new SpriteFrame());
  for (let i = 0; i < 14; i++) c.update(0.05);
  assert.match(c.labels.get('floor-progress').string, /67%/);
  assert.equal(b.stage.dorm.number, 2);
  for (const asset of lowerAssets.slice(1)) asset.callback(null, new SpriteFrame());
  for (let i = 0; i < 9; i++) c.update(0.05);
  assert.equal(c.mode, 'playing'); assert.equal(c.battle, b);
  assert.deepEqual([b.stage.dorm.number, b.player.hp, b.player.ammo], [1, 67, 5]);
  assert.match(c.labels.get('objective').string, /1F/);
});
run('sample textures load through engine resources and character sprites stay under the sight mask', c => {
  assert(c.artFrames.has('lobby-desk')); assert(c.artFrames.has('dorm-locker')); assert(c.rasterProps.size >= 18);
  click(c, 'start'); c.update(0.05);
  assert(c.actorSprites.has('player')); assert(c.actorSprites.has('enemy-0'));
  assert.equal(c.spriteLayer.parent, c.litWorld); assert(c.litWorld.parent.getComponent(Mask));
  assert.equal(c.doorsLit.node.parent, c.environment); assert.equal(c.propsArt.parent, c.environment);
  assert.equal(c.presentationMaterial.properties.get('actorsTexture'), c.actorTarget);
});
run('offscreen cameras exclude HUD and output to prevent recursive capture', c => {
  assert.equal(c.environmentCamera.visibility & cc.Layers.Enum.UI_2D, 0);
  assert.equal(c.actorCamera.visibility & cc.Layers.Enum.UI_2D, 0);
  assert.equal(c.environmentCamera.visibility & c.actorCamera.visibility, 0);
  assert.equal(c.camera.visibility, cc.Layers.Enum.UI_2D);
  assert.equal(c.environment.layer, c.environmentCamera.visibility); assert.equal(c.world.layer, c.actorCamera.visibility);
});
run('shooting shakes only world layers and updates muzzle light without moving HUD', c => {
  click(c, 'start'); const canvas = { ...c.canvas.position }, health = { ...c.labels.get('health').node.position };
  input.emit(EventType.MOUSE_DOWN, pointer(900, 360)); c.update(1 / 60);
  assert(Math.hypot(c.feedback.x, c.feedback.y) > 0.5); assert(c.feedback.muzzle > 0);
  assert.deepEqual(c.environment.position, c.world.position); assert.deepEqual({ ...c.canvas.position }, canvas); assert.deepEqual({ ...c.labels.get('health').node.position }, health);
  assert(c.presentationMaterial.properties.get('muzzle').z > 0);
});
run('empty magazine and invulnerable contact do not synthesize feedback events', c => {
  click(c, 'start'); c.battle.player.ammo = 0;
  input.emit(EventType.MOUSE_DOWN, pointer(900, 360)); c.update(1 / 60);
  assert.equal(c.feedback.muzzle, 0); assert.equal(c.feedback.x, 0);
  c.battle.player.invulnerable = 1; c.battle.hurt(20); c.update(1 / 60); assert.equal(c.feedback.hit, 0);
});
run('actual damage triggers red and pauses clear shader feedback immediately', c => {
  click(c, 'start'); c.battle.hurt(20); c.update(1 / 60); assert(c.feedback.hit > 0.8);
  cc.game.emit('hide'); c.update(1 / 60);
  const value = c.presentationMaterial.properties.get('feedback'); assert.equal(value.x, 0); assert.equal(value.y, 0);
});
run('legacy scene waits for the effect instead of starting with invisible enemies', c => {
  assert.equal(c.presentationReady, false); click(c, 'start'); assert.equal(c.mode, 'select-hero');
  const request = pending.find(r => r.Type === EffectAsset); assert(request);
  request.callback(null, new EffectAsset()); assert(c.presentationReady);
  click(c, 'start'); assert.equal(c.mode, 'playing');
}, c => { c.visibilityEffect = null; deferEffect = true; });
run('Q has no combat action and no removed skill button or audio is wired', c => {
  click(c, 'start'); assert(!c.buttons.some(b => b.node.name === 'Button-skill'));
  assert(!pending.some(r => r.name === 'audio/pulse'));
  const hp = c.battle.enemies.map(e => e.hp); key('KEY_Q'); c.update(1 / 60);
  assert.deepEqual(c.battle.enemies.map(e => e.hp), hp); assert.equal(c.battle.pulse, undefined);
});
run('roll uses three atlas frames and hides the standing weapon until landing', c => {
  click(c, 'start'); c.update(1 / 60); key('SPACE'); c.update(1 / 60);
  const sprite = c.actorSprites.get('player-roll'); assert(sprite?.node.active); assert.equal(c.actorSprites.get('player').node.active, false);
  assert.equal(sprite.spriteFrame, c.artFrames.get('heroineRoll-0'));
  for (let i = 0; i < 9; i++) c.update(1 / 60);
  assert.equal(sprite.spriteFrame, c.artFrames.get('heroineRoll-1')); assert.equal(sprite.spriteFrame.rect.x, 724);
  for (let i = 0; i < 4; i++) c.update(1 / 60);
  assert.equal(sprite.spriteFrame, c.artFrames.get('heroineRoll-2')); assert.equal(sprite.spriteFrame.rect.x, 1448);
  assert.equal(c.actorSprites.get('player').node.active, false); assert.equal(c.weaponEffects.flash, 0);
  for (let i = 0; i < 15; i++) c.update(1 / 60);
  assert.equal(sprite.node.active, false); assert.equal(c.actorSprites.get('player').node.active, true);
});
run('death without an injector plays three frames then fades to gray before settling', c => {
  click(c, 'start'); c.update(1 / 60); c.battle.revivalCharges = 0;
  c.battle.enemies = []; c.battle.hurt(999); c.update(1 / 60);
  const fallen = c.actorSprites.get('player-fallen'), frames = new Set([fallen.spriteFrame]);
  const elapsed = c.battle.elapsed;
  assert.equal(c.mode, 'falling'); assert.equal(c.actorSprites.get('player').node.active, false);
  assert(fallen.node.active); assert.equal(c.presentationMaterial.properties.get('grading').z, 0);
  assert.equal(c.battle.rewardClaimed, false);
  for (let i = 0; i < 11; i++) { c.update(0.05); frames.add(fallen.spriteFrame); }
  assert.equal(frames.size, 3); assert.equal(c.mode, 'falling');
  assert(c.presentationMaterial.properties.get('grading').z > 0 && c.presentationMaterial.properties.get('grading').z < 1);
  for (let i = 0; i < 8; i++) c.update(0.05);
  assert.equal(c.mode, 'result'); assert.equal(c.presentationMaterial.properties.get('grading').z, 1);
  assert.equal(c.battle.elapsed, elapsed); assert.equal(c.battle.rewardClaimed, true);
  assert.equal(c.actors.commands.filter(cmd => cmd.name === 'circle' && Math.hypot(cmd.args[0] - c.battle.player.x, cmd.args[1] - c.battle.player.y) < 100).length, 0);
  assert.equal(c.bloodArt.commands.filter(cmd => cmd.name === 'fill').length, 1);
  assert.equal(c.bloodArt.node.parent, c.environment);
  assert.equal(c.weaponEffects.flash, 0);
  click(c, 'retry'); c.update(1 / 60); assert.equal(c.bloodArt.commands.length, 0);
  assert.equal(c.presentationMaterial.properties.get('grading').z, 0); assert.equal(fallen.node.active, false);
});
run('the revival dialog follows the fade and can resume the same run once', c => {
  click(c, 'start'); const battle = c.battle;
  battle.player.ammo = 5; battle.hurt(999);
  for (let i = 0; i < 20; i++) c.update(0.05);
  assert.equal(c.mode, 'revive'); assert.equal(battle.rewardClaimed, false);
  assert.equal(c.presentationMaterial.properties.get('grading').z, 1);
  click(c, 'revive'); c.update(1 / 60);
  assert.equal(c.mode, 'playing'); assert.equal(c.battle, battle);
  assert.equal(battle.player.hp, 30); assert.equal(battle.player.ammo, 5); assert.equal(battle.revivalCharges, 0);
  assert.equal(c.presentationMaterial.properties.get('grading').z, 0);
});
run('dorm campaign waits for heroine artwork and then starts with the correct level and weapon', c => {
  click(c, 'start'); assert.equal(c.mode, 'select-hero');
  for (const request of pending.filter(r => r.Type === SpriteFrame)) request.callback(null, new SpriteFrame());
  click(c, 'start'); c.update(1 / 60);
  assert.equal(c.mode, 'playing'); assert.equal(c.battle.heroId, 3);
  assert.equal(c.battle.stage.id, 'campus-dorm-2f'); assert.equal(c.battle.enemies.length, 8);
  assert.equal(c.battle.hero.gun, 'USP 消音手枪'); assert.match(c.labels.get('gun').string, /USP/);
  assert.equal(c.actorSprites.get('player').spriteFrame, c.artFrames.get('heroine'));
}, () => { deferArt = true; });
run('opening Ghost in training keeps the dorm campaign on Lin', c => {
  c.profile.owned[0] = true;
  click(c, 'training'); selectTraining(c, 0);
  assert.equal(c.labels.get('training-hero').string, '幽灵');
  click(c, 'close'); click(c, 'start'); c.update(1 / 60);
  assert.equal(c.battle.heroId, 3);
  assert.equal(c.actorSprites.get('player').spriteFrame, c.artFrames.get('heroine'));
});
run('USP shooting selects its suppressed clip and keeps the muzzle light subtle', c => {
  for (const request of pending.filter(r => r.name.startsWith('audio/'))) request.callback(null, {});
  const played = []; c.audio.playOneShot = clip => played.push(clip);
  click(c, 'start'); input.emit(EventType.MOUSE_DOWN, pointer(900, 360)); c.update(1 / 60);
  assert(played.includes(c.clips.get('shoot-suppressed'))); assert(!played.includes(c.clips.get('shoot')));
  const muzzle = c.presentationMaterial.properties.get('muzzle'); assert(muzzle.z > 0 && muzzle.z < 0.23); assert.equal(muzzle.w, 90);
});
run('every shoe style draws no idle feet and places alternating shoes only in front under rotation', () => {
  const origin = { x: 300, y: 400 };
  for (const style of ['military', 'walker', 'plain']) for (const angle of [0, Math.PI / 2, -2]) {
    const g = new Graphics(); drawFeet(g, origin, angle, 1, { leftFoot: 0, rightFoot: 0 }, style); assert.equal(g.commands.length, 0);
    for (const [leftFoot, rightFoot] of [[1, 0], [0, 1]]) {
      g.clear(); drawFeet(g, origin, angle, 1, { leftFoot, rightFoot }, style);
      assert.equal(g.commands.filter(cmd => cmd.name === 'fill').length, 1);
      for (const cmd of g.commands.filter(cmd => cmd.name === 'moveTo' || cmd.name === 'lineTo')) {
        const [x, y] = cmd.args, forward = (x - origin.x) * Math.cos(angle) + (y - origin.y) * Math.sin(angle);
        const sideways = -(x - origin.x) * Math.sin(angle) + (y - origin.y) * Math.cos(angle);
        assert(forward > 0); assert(leftFoot ? sideways > 0 : sideways < 0);
      }
    }
  }
});
run('actual shots recoil the model and muzzle together while empty fire, pause and restart clear it', c => {
  click(c, 'start'); input.emit(EventType.MOUSE_DOWN, pointer(900, 360)); c.update(1 / 60);
  const p = c.battle.player, pose = c.motion.pose, sprite = c.actorSprites.get('player');
  assert(sprite.node.position.x < p.x); assert(Math.abs(sprite.node.angle) > 0);
  const mount = weaponMount(p, pose.scale, true, 3, pose), light = c.presentationMaterial.properties.get('muzzle');
  assert.equal(light.x, 640 + mount.muzzle.x - p.x); assert.equal(light.y, 360 + mount.muzzle.y - p.y);
  assert.equal(c.weaponEffects.smoke[0].x, mount.muzzle.x); assert.equal(c.weaponEffects.smoke[0].y, mount.muzzle.y);
  input.emit(EventType.MOUSE_UP, pointer(900, 360));
  for (let i = 0; i < 10; i++) c.update(1 / 60);
  assert.equal(sprite.node.position.x, p.x); assert.equal(c.motion.pose.offsetX + c.motion.pose.offsetY, 0);
  c.battle.player.ammo = 0; input.emit(EventType.MOUSE_DOWN, pointer(900, 360)); c.update(1 / 60);
  assert.equal(c.motion.pose.offsetX + c.motion.pose.offsetY, 0);
  cc.game.emit('hide'); c.update(1 / 60); assert.equal(c.motion.pose.offsetX + c.motion.pose.offsetY, 0);
  click(c, 'abandon'); click(c, 'retry'); c.update(1 / 60); assert.equal(c.motion.pose.offsetX + c.motion.pose.offsetY, 0);
});
run('enemy feet follow real motion and stop during windup, with fresh states after restarting', c => {
  click(c, 'start'); const enemy = c.battle.enemies[0]; enemy.x = c.battle.player.x + 100; enemy.y = c.battle.player.y; enemy.angle = Math.PI;
  c.update(1 / 60); const moving = c.enemyPoses.get(enemy.id); assert(moving.leftFoot + moving.rightFoot > 0);
  enemy.windup = 1; c.update(1 / 60); assert.equal(moving.leftFoot + moving.rightFoot, 0);
  const oldMotion = c.enemyMotions.get(enemy.id); restartExploration(c); c.update(1 / 60);
  assert.equal(c.enemyMotions.size, c.battle.stage.spawns.length); assert.notEqual(c.enemyMotions.get(enemy.id), oldMotion);
});
run('Ghost still uses the unarmed atlas through the final recovery frame', c => {
  c.makeBattle = () => new Battle(0, 1, DORM_LEVEL);
  click(c, 'start'); c.update(1 / 60); key('SPACE');
  c.battle.player.dashTime = 0.02; c.update(1 / 120);
  const sprite = c.actorSprites.get('player-roll');
  assert(sprite.node.active); assert.equal(sprite.spriteFrame, c.artFrames.get('roll-2'));
  assert.equal(c.actorSprites.get('player')?.node.active ?? false, false);
});
run('enemy fragments and combat freeze during the victory fade before single settlement', c => {
  click(c,'start'); const e=c.battle.enemies[0]; c.battle.damageEnemy(e,999); c.update(0);
  assert(c.battle.deathFragments.length>0); assert(c.actors.commands.some(cmd=>cmd.name==='fill'&&cmd.fill==='#7f4b42'));
  const stainCommands=JSON.stringify(c.bloodArt.commands); c.update(0.01); assert.equal(JSON.stringify(c.bloodArt.commands),stainCommands);
  c.open('pause'); const paused=JSON.stringify(c.battle.deathFragments); c.update(0.05); assert.equal(JSON.stringify(c.battle.deathFragments),paused);
  c.open('playing'); c.battle.status='won'; const elapsed=c.battle.elapsed, positions=JSON.stringify(c.battle.enemies);
  c.update(0.05); const fragments=JSON.stringify(c.battle.deathFragments);
  for(let i=0;i<36;i++)c.update(0.05);
  assert.equal(c.mode,'result'); assert.equal(JSON.stringify(c.battle.deathFragments),fragments); assert.equal(c.battle.elapsed,elapsed); assert.equal(JSON.stringify(c.battle.enemies),positions);
  const saved=JSON.stringify(c.profile); c.update(0.05); assert.equal(JSON.stringify(c.profile),saved);
  restartExploration(c); assert.equal(c.battle.deathFragments.length+c.battle.bloodStains.length,0);
});
run('training tabs save independent upgrades that apply to the story character', c => {
  click(c, 'training'); assert.equal(c.mode, 'training');
  const power = () => Number(c.labels.get('training-power').string.replace(/\D/g, ''));
  const initial = power();
  click(c, 'track-mobility'); assert.equal(c.labels.get('training-movement-next').string, '157.5');
  click(c, 'train-mobility'); assert.equal(c.profile.materials, 40); assert.equal(c.profile.mobilityLevels[3], 2);
  assert(power() > initial);
  assert.equal(c.profile.attackLevels[3], 1); assert.equal(c.profile.levels[3], 1);
  click(c, 'track-attack'); assert.match(c.labels.get('training-fire-next').string, /2.25/);
  click(c, 'train-attack'); assert.equal(c.profile.materials, 0); assert.equal(c.profile.attackLevels[3], 2);
  assert.deepEqual(readProfile(persistedSave), c.profile);
  click(c, 'close'); click(c, 'start'); assert.equal(c.battle.stats.speed, 157.5);
  assert(Math.abs(c.battle.stats.attackRate - 2.25) < 1e-8);
  c.battle.revivalCharges = 0; c.battle.hurt(999);
  for (let i = 0; i < 20; i++) c.update(0.05);
  click(c, 'retry'); assert.equal(c.battle.stats.speed, 157.5);
});
run('training guards locked heroes, insufficient materials and capped attributes', c => {
  click(c, 'training'); selectTraining(c, 0);
  assert.match(c.labels.get('training-unlock').string, /招募幽灵/);
  click(c, 'training-recruit'); assert.equal(c.mode, 'recruit'); click(c, 'close'); assert.equal(c.mode, 'training');
  selectTraining(c, 4); assert.match(c.labels.get('training-unlock').string, /归巢/);
  c.profile.materials = 39; selectTraining(c, 3); click(c, 'track-mobility');
  assert.equal(c.labels.get('training-insufficient').string, '还差 1 材料');
  assert(!c.buttons.some(b => b.node.name === 'Button-train-mobility'));
  c.profile.mobilityLevels[3] = 10; c.open('training');
  assert.equal(c.labels.get('training-cost').string, '此项已满级');
  assert.equal(c.labels.get('training-movement').string, '217.5');
  for (const [i, a] of c.buttons.entries()) for (const b of c.buttons.slice(i + 1)) {
    assert(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  }
});
run('other operators can train independently of the active story character', c => {
  c.profile.owned[0] = c.profile.owned[4] = true; c.profile.materials = 1000;
  click(c, 'training'); selectTraining(c, 0); click(c, 'track-mobility'); click(c, 'train-mobility');
  selectTraining(c, 4); click(c, 'track-attack'); click(c, 'train-attack');
  assert.equal(c.profile.mobilityLevels[0], 2); assert.equal(c.profile.attackLevels[4], 2);
  assert.equal(c.profile.mobilityLevels[3], 1); assert.equal(c.profile.attackLevels[3], 1);
  click(c, 'close'); click(c, 'start'); assert.equal(c.battle.heroId, 3);
});
run('v2 startup retains existing training and refunds retired characters', c => {
  assert.equal(c.profile.levels[0], 5); assert.equal(c.profile.materials, 370); assert.equal(c.profile.tickets, 3);
  assert.deepEqual(c.profile.mobilityLevels, {0:1,3:1,4:1}); assert.deepEqual(c.profile.attackLevels, {0:1,3:1,4:1});
  click(c, 'start'); assert.equal(c.battle.player.maxHp, 112); assert.equal(c.battle.stats.speed, 150);
}, () => { persistedSave = JSON.stringify({ version: 2, selected: 0, owned: [true,true,false,true], levels: [5,2,1,3], materials: 340, tickets: 2, draws: 4, victories: 1 }); });
run('heroine movement retains body feedback but renders no shoes while soldiers still step', c => {
  click(c, 'start'); c.battle.enemies = []; key('KEY_D'); c.update(0.05); key('KEY_D', true);
  assert(c.motion.pose.leftFoot + c.motion.pose.rightFoot > 0); assert.notEqual(c.motion.pose.scale, 1);
  assert.equal(c.actors.commands.filter(cmd => cmd.name === 'fill' && cmd.fill === '#283539').length, 0);
  c.makeBattle = () => new Battle(0, 1, DORM_LEVEL); restartExploration(c); c.battle.enemies = []; key('KEY_D'); c.update(0.05); key('KEY_D', true);
  assert(c.actors.commands.some(cmd => cmd.name === 'fill' && cmd.fill === '#283539'));
});
run('training shows vision, noise details and their corresponding stealth grades', c => {
  click(c, 'training'); assert.equal(c.labels.get('training-sight').string, '265 / 70');
  assert.equal(c.labels.get('training-rating-2').string, '隐蔽 S');
  click(c, 'training-noise');
  assert.match(c.labels.get('training-noise-footsteps').string, /80$/);
  assert.match(c.labels.get('training-noise-gunfire').string, /190$/);
  click(c, 'training-noise');
  assert(!c.labels.has('training-noise-gunfire'));
  click(c, 'training-noise');
  selectTraining(c, 0);
  assert(!c.labels.has('training-noise-gunfire'));
  assert.equal(c.labels.get('training-sight').string, '530 / 140');
  assert.equal(c.labels.get('training-rating-2').string, '隐蔽 C');
  click(c, 'training-noise');
  assert.match(c.labels.get('training-noise-gunfire').string, /1100$/);
  selectTraining(c, 4);
  assert.equal(c.labels.get('training-rating-2').string, '隐蔽 B');
});
run('training slides portraits left, flashes new information and honors the latest selection', c => {
  click(c, 'training');
  const lin = c.trainingPortrait, originalX = lin.position.x;
  const baseNameColor = c.labels.get('training-hero').color.hex;
  const baseHeadingColor = c.labels.get('training-attributes').color.hex;
  const linRadar = structuredClone(c.trainingRadar.graphics.commands);
  click(c, 'training-hero-0'); c.update(0.05);
  assert(lin.position.x < originalX);
  assert.equal(c.labels.get('training-hero').string, '凛');
  click(c, 'training-hero-4'); c.update(0.05); c.update(0.05);
  assert.equal(c.labels.get('training-hero').string, '维川');
  assert(c.trainingPortrait.position.x > c.trainingSwitch.endX);
  assert.notEqual(c.labels.get('training-hero').color.hex, baseNameColor);
  assert.equal(c.labels.get('training-attributes').color.hex, baseHeadingColor);
  const intermediateRadar = structuredClone(c.trainingRadar.graphics.commands);
  assert.notDeepEqual(intermediateRadar, linRadar);
  for (let i = 0; i < 2; i++) c.update(0.05);
  assert.notDeepEqual(c.trainingRadar.graphics.commands, intermediateRadar);
  click(c, 'training-hero-0');
  for (let i = 0; i < 15 && c.trainingSwitch; i++) c.update(0.05);
  assert.equal(c.labels.get('training-hero').string, '幽灵');
  assert.equal(c.labels.get('training-hero').color.hex, baseNameColor);
  assert.equal(lin.active, false);
  click(c, 'training-hero-4'); click(c, 'close'); c.update(0.05);
  assert.equal(c.mode, 'menu');
  assert.equal(c.trainingSwitch, undefined);
});
run('runtime actor mask and soft field both follow heroine range and refresh after switching operators', c => {
  startLegacyFixture(c); c.battle.enemies=[]; Object.assign(c.battle.player,{x:435,y:850}); c.mx=900; c.my=360; c.update(1/60);
  assert.equal(c.battle.stats.visionRange,265); assert.equal(c.visibilityField.sample(890,360,true),1); assert.equal(c.visibilityField.sample(940,360,true),0);
  assert(c.visibilityField.sample(640,360)>0.98);
  const player=c.battle.player, points=c.stencil.commands.filter(cmd=>cmd.name==='moveTo'||cmd.name==='lineTo');
  assert(points.every(cmd=>Math.hypot(cmd.args[0]-player.x,cmd.args[1]-player.y)<=265.001));
  c.makeBattle = () => new Battle(0, 1, DORM_LEVEL); restartExploration(c); c.battle.enemies=[]; Object.assign(c.battle.player,{x:435,y:850}); c.mx=900; c.my=360; c.update(1/60);
  assert.equal(c.battle.stats.visionRange,530); assert.equal(c.visibilityField.sample(940,360,true),1);
});
run('dormant walker sprites and procedural enemies render through an open doorway independently of room flags', c => {
  startLegacyFixture(c); const b=c.battle; Object.assign(b.player,{x:475,y:285});
  const template=b.enemies.find(e=>e.room===1);
  b.enemies=[{...template,id:100,x:475,y:450,type:'walker'},{...template,id:101,x:505,y:485,type:'spitter'},{...template,id:102,x:445,y:510,type:'boss'}];
  const d=b.doors[0]; d.angle=d.target=d.openAngle=Math.PI/2; b.syncGeometry(); b.perceptionTime=100; c.mx=640; c.my=600; c.update(1/60);
  assert.equal(b.alerted[1],false); assert.equal(b.visited[1],false);
  const sprite=c.actorSprites.get('enemy-100'); assert(sprite?.node.active);
  for (const e of b.enemies) assert.equal(c.visibilityField.sample(640+e.x-b.player.x,360+e.y-b.player.y,true),1);
  for (const e of b.enemies.slice(1)) { const sc=e.type==='boss'?1.7:1; assert(c.actors.commands.some(cmd=>cmd.name==='circle'&&Math.abs(cmd.args[0]-e.x-9*sc)<1e-7&&cmd.args[1]===e.y)); }
  d.angle=d.target=0; b.syncGeometry(); c.update(1/60);
  assert.equal(c.visibilityField.sample(640,525,true),0); assert.equal(c.actorSprites.get('enemy-100'),sprite); assert(sprite.node.active);
});
run('real door interaction reveals an existing enemy before entry and entering keeps the same wounded sprite', c => {
  startLegacyFixture(c); const b=c.battle,e=b.enemies.find(e=>e.room===1); b.enemies=[e]; Object.assign(b.player,{x:475,y:285}); Object.assign(e,{x:475,y:500}); c.mx=640;c.my=600;c.update(1/60);
  const sprite=c.actorSprites.get('enemy-'+e.id); assert(sprite); assert.equal(c.visibilityField.sample(640,575,true),0);
  key('KEY_E');key('KEY_E',true);c.update(1/60);assert.equal(b.discovered[1],true);assert.equal(b.visited[1],false);assert.equal(b.alerted[1],false);
  for (let i=0;i<35;i++)c.update(1/60);
  assert.equal(b.visited[1],false);assert.equal(c.visibilityField.sample(640+e.x-b.player.x,360+e.y-b.player.y,true),1,JSON.stringify({door:b.doors[0].angle,target:b.doors[0].target,enemy:{x:e.x,y:e.y},player:{x:b.player.x,y:b.player.y},notice:c.notice}));assert.equal(c.actorSprites.get('enemy-'+e.id),sprite);
  b.damageEnemy(e,1);const hp=e.hp;key('KEY_W');for(let i=0;i<20;i++)c.update(0.04);key('KEY_W',true);
  assert.equal(b.visited[1],true);assert.equal(b.enemies.length,1);assert.equal(b.enemies[0],e);assert.equal(e.hp,hp);assert.equal(c.actorSprites.get('enemy-'+e.id),sprite);
});
run('mouse shooting through a door damages the unvisited room and survives closing and reopening', c => {
  startLegacyFixture(c);const b=c.battle,e=b.enemies.find(e=>e.room===1);b.enemies=[e];Object.assign(b.player,{x:475,y:285});Object.assign(e,{x:475,y:505,type:'spitter',hp:52,maxHp:52,cooldown:30});c.mx=640;c.my=600;c.update(1/60);
  key('KEY_E');key('KEY_E',true);for(let i=0;i<30;i++)c.update(0.02);
  input.emit(EventType.MOUSE_DOWN,pointer(640,600));for(let i=0;i<13;i++)c.update(0.02);input.emit(EventType.MOUSE_UP,pointer(640,600));
  assert.equal(e.hp,26);assert.equal(b.player.ammo,11);assert.equal(b.visited[1],false);
  const sprite=c.actorSprites.get('enemy-'+e.id);
  key('KEY_E');key('KEY_E',true);for(let i=0;i<30;i++)c.update(0.02);key('KEY_E');key('KEY_E',true);for(let i=0;i<30;i++)c.update(0.02);
  assert.equal(e.hp,26);assert.equal(b.enemies[0],e);assert.equal(c.actorSprites.get('enemy-'+e.id),sprite);assert.equal(b.visited[1],false);
});
run('HUD marks a cleared corridor as threatened and the minimap only draws explored sight', c => {
  startLegacyFixture(c);const b=c.battle,e=b.enemies.find(e=>e.room===1);b.enemies=[e];Object.assign(e,{x:b.player.x+100,y:b.player.y,cooldown:30});b.cleared[0]=true;b.alerted[1]=b.discovered[1]=true;c.update(0.05);
  assert.equal(b.visited[1],false);assert.match(c.labels.get('objective').string,/应对追击/);assert.match(c.labels.get('sub-objective').string,/剩余威胁 1/);
  const before = new Graphics(); c.drawMinimap(before);
  assert(before.commands.some(cmd=>cmd.name==='fill'&&cmd.fill==='#778c83'));
  b.player.angle = Math.PI; b.updateMinimap();
  const after = new Graphics(); c.drawMinimap(after);
  assert(after.commands.some(cmd=>cmd.name==='fill'&&cmd.fill==='#37484c'));
  assert.equal(after.commands.filter(cmd=>cmd.name==='circle').length,0);
  assert.equal(after.commands.filter(cmd=>cmd.name==='close').length,1);
});
run('battle settings and guide pause the same battle and return without losing state', c => {
  click(c, 'start'); const b = c.battle; b.player.ammo = 7; b.player.hp = 63;
  key('KEY_W'); input.emit(EventType.MOUSE_DOWN, pointer(800, 400));
  click(c, 'settings'); assert.equal(c.mode, 'settings'); assert(c.environmentCamera.enabled); assert.equal(c.keys.size, 0); assert.equal(c.mouseFire, false);
  const before = JSON.stringify(b); for (let i = 0; i < 10; i++) c.update(0.05); assert.equal(JSON.stringify(b), before);
  click(c, 'sound'); click(c, 'help'); assert(c.environmentCamera.enabled); key('ESCAPE'); assert.equal(c.mode, 'settings');
  click(c, 'close'); assert.equal(c.mode, 'playing'); assert.equal(c.battle, b); assert.equal(b.player.ammo, 7); assert.equal(b.player.hp, 63);
});
run('reference HUD rectangles do not overlap and selected tactical item can fire', c => {
  click(c, 'start'); assert.equal(c.battleFrames.size, 18);
  const buttons = c.buttons;
  for (let i = 0; i < buttons.length; i++) for (let j = i + 1; j < buttons.length; j++) {
    const a = buttons[i], b = buttons[j];
    assert(!(a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y), a.node.name+' overlaps '+b.node.name);
  }
  const g = buttons.find(b => b.node.name === 'Button-grenade'); input.emit(EventType.MOUSE_DOWN, pointer(g.x+g.w/2, g.y+g.h/2));
  assert.equal(c.mouseFire, false); click(c, 'grenade'); assert.equal(c.battle.tactical.remaining, 1); assert.equal(c.labels.get('grenade-label').string.includes('手雷'), true);
  c.battle.player.hp = 37; c.battle.player.ammo = 4; c.battle.elapsed = 86; c.updateHud();
  assert.equal(c.labels.get('health').string, '生命 37 / 100'); assert.match(c.labels.get('ammo').string, /04/); assert.match(c.labels.get('sub-objective').string, /01:26/);
  click(c, 'reload'); assert(c.battle.player.reload > 0); click(c, 'dodge'); assert(c.battle.player.dash > 0);
});
run('multi-touch buttons preserve the move owner and empty HUD space never starts a stick', c => {
  click(c, 'start'); cc.sys.isMobile = true;
  input.emit(EventType.TOUCH_START, pointer(650, 500, 10)); assert.equal(c.aimTouch, -1);
  input.emit(EventType.TOUCH_START, pointer(148, 144, 1)); input.emit(EventType.TOUCH_MOVE, pointer(148, 195, 1));
  const reload = c.buttons.find(b => b.node.name === 'Button-reload');
  input.emit(EventType.TOUCH_START, pointer(reload.x+reload.w/2, reload.y+reload.h/2, 2)); click(c, 'reload'); assert.equal(c.moveTouch, 1); assert.equal(c.aimTouch, -1);
  click(c, 'dodge'); assert.equal(c.moveTouch, 1); assert(c.battle.player.dash > 0);
  input.emit(EventType.TOUCH_START, pointer(1154, 139, 3)); input.emit(EventType.TOUCH_MOVE, pointer(1200, 139, 3)); assert.equal(c.aimTouch, 3);
  input.emit(EventType.TOUCH_CANCEL, pointer(148, 195, 1)); assert.equal(c.moveTouch, -1); assert.equal(c.aimTouch, 3);
});
run('item feedback shares sprite/count/ring scale with stable hit boxes and independent owners', c => {
  click(c,'start'); const a=c.hudActions.find(a=>a.id==='reload'), b=c.buttons.find(b=>b.node.name==='Button-reload');
  const bounds={x:b.x,y:b.y,w:b.w,h:b.h}; c.battle.player.ammo=4;
  input.emit(EventType.MOUSE_DOWN,pointer(b.x+b.w/2,b.y+b.h/2)); assert.equal(c.mouseFire,false); assert.equal(a.root.scale.x,0.88);
  click(c,'reload'); c.update(1/60); assert.equal(a.sprite.color.hex,'#383b40'); assert.match(a.label.string,/s/); assert.equal(a.label.node.parent,a.root); assert.equal(a.ring.node.parent,a.root);
  assert.deepEqual({x:b.x,y:b.y,w:b.w,h:b.h},bounds); input.emit(EventType.MOUSE_UP,pointer(0,0)); for(let i=0;i<20;i++)c.update(1/60); assert(a.root.scale.x>0.99);
  cc.sys.isMobile=true; b.node.emit(Node.EventType.TOUCH_START,pointer(0,0,8)); b.node.emit(Node.EventType.TOUCH_START,pointer(0,0,9));
  b.node.emit(Node.EventType.TOUCH_END,pointer(0,0,8)); assert(a.owners.has(9)); b.node.emit(Node.EventType.TOUCH_CANCEL,pointer(0,0,9)); assert.equal(a.owners.size,0);
});
run('real cap is separate from fixed plate and returns without residual movement', c => {
  click(c,'start'); cc.sys.isMobile=true; c.battle.enemies=[];
  const plate={...c.battleSticks[0].position}; input.emit(EventType.TOUCH_START,pointer(148,144,1)); input.emit(EventType.TOUCH_MOVE,pointer(500,500,1)); c.update(1/60);
  assert(Math.abs(Math.hypot(c.capOffset.x,c.capOffset.y)-39)<1e-8); assert.deepEqual({...c.battleSticks[0].position},plate); assert.equal(c.moveCap.getComponent(Sprite).spriteFrame,c.battleFrames.get('joystick_move_cap'));
  input.emit(EventType.TOUCH_END,pointer(500,500,1)); assert.deepEqual(c.movement(),{x:0,y:0}); const pos={x:c.battle.player.x,y:c.battle.player.y}; c.update(1/60);
  assert(Math.hypot(c.capOffset.x,c.capOffset.y)>0); assert.deepEqual({x:c.battle.player.x,y:c.battle.player.y},pos);
  for(let i=0;i<30;i++)c.update(1/60); assert.deepEqual(c.capOffset,{x:0,y:0});
});
run('normalized clockwise gold ring flashes once and pause/restart/locked items do not flash', c => {
  click(c,'start'); c.battle.enemies=[];
  for(const id of ['dodge','reload']) {
    const a=c.hudActions.find(a=>a.id===id), key=id==='dodge'?'dash':'reload', total=a.duration();
    c.battle.player[key]=total; c.updateHudFeedback(0); assert.equal(a.progress,0);
    c.battle.player[key]=total/2; c.updateHudFeedback(1/60); assert.equal(a.progress,0.5);
    const pts=a.ring.commands.filter(x=>x.name==='moveTo'||x.name==='lineTo'); assert(Math.abs(pts[0].args[0])<1e-8); assert(pts[1].args[0]>0);
    c.battle.player[key]=0; c.updateHudFeedback(1/60); assert.equal(a.progress,1); assert.equal(a.glow,0.55);
    for(let i=0;i<40;i++)c.updateHudFeedback(1/60); assert.equal(a.glow,0); assert.equal(a.progress,0);
  }
  c.battle.player.dash=1; c.updateHudFeedback(0); c.open('pause'); c.update(0.05); c.open('playing'); assert(c.hudActions.every(a=>a.glow===0));
  restartExploration(c); assert(c.hudActions.every(a=>a.glow===0)); const grenade=c.hudActions.find(a=>a.id==='grenade'); assert.equal(grenade.locked,false); assert.equal(grenade.progress,0); assert.equal(grenade.label.string,'');
});
run('home selection stays single-slot, actual G respects cooldown and hides an exhausted item', c => {
  const choice=c.buttons.find(b=>b.node.name==='Button-tactical-choice');
  for(const name of ['start','challenge','survival']) {
    const b=c.buttons.find(b=>b.node.name==='Button-'+name);
    assert(choice.x+choice.w<=b.x || b.x+b.w<=choice.x || choice.y+choice.h<=b.y || b.y+b.h<=choice.y, 'choice overlaps mode hitbox');
  }
  click(c,'tactical-choice'); assert.equal(c.mode,'menu'); assert.equal(c.tacticalChoice,'flashbang');
  click(c,'challenge'); assert.equal(c.mode,'menu'); assert.equal(c.tacticalChoice,'flashbang');
  click(c,'start'); c.battle.enemies=[]; key('KEY_G'); assert.equal(c.battle.tactical.remaining,1); assert.equal(c.battle.tacticalThrows[0].kind,'flashbang');
  key('KEY_G',true); key('KEY_G'); assert.equal(c.battle.tactical.remaining,1); assert.match(c.notice,/冷却/); key('KEY_G',true);
  c.open('pause'); const delay=c.battle.tacticalThrows[0].delay; c.update(0.05); key('KEY_G'); assert.equal(c.battle.tacticalThrows[0].delay,delay); assert.equal(c.battle.tactical.remaining,1); key('KEY_G',true);
  c.open('playing'); for(let i=0;i<80;i++)c.update(1/60); key('KEY_G'); key('KEY_G',true); assert.equal(c.battle.tactical.remaining,0);
  key('KEY_G'); key('KEY_G',true); c.updateHud();
  assert(!c.buttons.find(item=>item.node.name==='Button-grenade').node.active);
  assert(!c.hudActions.find(item=>item.id==='grenade').root.active);
  restartExploration(c); assert.equal(c.battle.tactical.remaining,2); assert.equal(c.battle.tactical.cooldown,0);
});
run('mobile tactical button preserves movement owner, never fires and pause clears held touches', c => {
  click(c,'start'); cc.sys.isMobile=true; c.battle.enemies=[];
  input.emit(EventType.TOUCH_START,pointer(148,144,1)); input.emit(EventType.TOUCH_MOVE,pointer(148,195,1));
  const b=c.buttons.find(b=>b.node.name==='Button-grenade'); input.emit(EventType.TOUCH_START,pointer(b.x+b.w/2,b.y+b.h/2,2)); click(c,'grenade');
  assert.equal(c.battle.tactical.remaining,1); assert.equal(c.moveTouch,1); assert.equal(c.aimTouch,-1); assert(!c.mouseFire);
  c.open('pause'); c.update(0.05); assert.equal(c.moveTouch,-1); assert.equal(c.aimTouch,-1);
});
run('real forced door knockback freezes during pause, locks keyboard actions and fresh run clears it', c => {
  click(c,'start');
  const stage={id:'knockback',title:'test',rooms:[{x:0,y:0,w:1000,h:900}],walls:[],furniture:[],doors:[{x:500,y:300,length:100,baseAngle:0,material:'steel',name:'test',rooms:[0,0]}],spawn:{x:550,y:280},exit:{x:900,y:800},hints:[''],spawns:[[0,550,340,'walker']]};
  c.battle=new c.battle.constructor(3,1,stage);
  Object.assign(c.battle.enemies[0],{soundOnly:true,investigate:{x:550,y:180},investigateTime:20});
  for(let i=0;i<220&&!c.battle.player.knockback;i++)c.update(0.025);
  assert(c.battle.player.knockback); c.battle.player.ammo=3;
  c.open('pause'); const frozen=JSON.stringify(c.battle.player); for(let i=0;i<10;i++)c.update(0.05); assert.equal(JSON.stringify(c.battle.player),frozen);
  c.open('playing'); key('KEY_W');
  const angle=c.battle.player.angle;
  for(let i=0;i<6;i++) {
    for(const k of ['KEY_G','KEY_R','KEY_E','SPACE']) { key(k); key(k,true); }
    input.emit(EventType.MOUSE_DOWN,pointer(950,500)); c.update(0.025);
    assert.equal(c.battle.player.ammo,3); assert.equal(c.battle.player.reload,0); assert.equal(c.battle.player.dashTime,0); assert.equal(c.battle.player.angle,angle);
  }
  assert(c.battle.player.knockback); restartExploration(c); assert.equal(c.battle.player.knockback,undefined);
});
run('auto button and settings persist independently without stealing mobile move or firing', c => {
  click(c,'start'); cc.sys.isMobile=true; c.battle.enemies=[];
  assert(c.profile.aimAssist); assert(!c.profile.autoFire);
  input.emit(EventType.TOUCH_START,pointer(148,144,1)); input.emit(EventType.TOUCH_MOVE,pointer(148,195,1));
  const a=c.buttons.find(b=>b.node.name==='Button-auto-fire');
  input.emit(EventType.TOUCH_START,pointer(a.x+a.w/2,a.y+a.h/2,2)); click(c,'auto-fire');
  assert.equal(c.moveTouch,1); assert.equal(c.aimTouch,-1); assert(!c.mouseFire); assert(c.profile.autoFire);
  c.update(.05); assert.equal(c.battle.player.ammo,12); assert.match(c.labels.get('auto-fire-state').string,/ON/);
  assert.equal(readProfile(persistedSave).autoFire,true);
  click(c,'settings'); click(c,'aim-assist'); assert(!c.profile.aimAssist); click(c,'auto-fire'); assert(!c.profile.autoFire);
  click(c,'close'); assert.match(c.labels.get('auto-fire-state').string,/OFF/); assert(!readProfile(persistedSave).aimAssist);
  restartExploration(c); assert(!c.profile.aimAssist); assert(!c.profile.autoFire); assert.equal(c.aimAssist.target,undefined);
});
run('auto mobile right stick aims without forcing shots and release holds actual angle', c => {
  click(c,'start'); cc.sys.isMobile=true; c.battle.enemies=[]; click(c,'auto-fire');
  input.emit(EventType.TOUCH_START,pointer(1140,164,3)); input.emit(EventType.TOUCH_MOVE,pointer(1191,164,3));
  c.update(.05); assert.equal(c.battle.player.ammo,12); const angle=c.battle.player.angle;
  input.emit(EventType.TOUCH_END,pointer(1191,164,3)); c.update(.05); assert.equal(c.battle.player.angle,angle);
  click(c,'auto-fire'); input.emit(EventType.TOUCH_START,pointer(1140,164,4)); input.emit(EventType.TOUCH_MOVE,pointer(1221,164,4));
  c.update(.05); assert.equal(c.battle.player.ammo,11);
});
run('auto enabled during special state stays ON with reason and pause clears assist history', c => {
  click(c,'start'); c.battle.shootingBlockedReason='解锁中'; click(c,'auto-fire'); c.update(.05);
  assert.match(c.labels.get('auto-fire-state').string,/ON/); assert.match(c.labels.get('auto-fire-reason').string,/解锁/);
  assert.equal(c.battle.shootingBlockedReason,'解锁中'); assert.equal(c.battle.player.ammo,12);
  c.aimAssist.reset(); c.aimAssist.step(.05,0,0,true,true,[{id:4,angle:.1}]); assert.equal(c.aimAssist.target,4);
  c.open('pause'); assert.equal(c.aimAssist.target,undefined); assert(c.profile.autoFire); c.open('playing'); assert(c.profile.autoFire);
});
run('relayout hitboxes avoid ammo and both joystick ellipses with a mobile-sized target', c => {
  click(c,'start'); const a=c.buttons.find(b=>b.node.name==='Button-auto-fire');
  const fire=c.buttons.find(b=>b.node.name==='Button-door') ? { x: 877.5*1280/1047, y: 720-(385+140)*720/589, w: 133*1280/1047, h: 140*720/589 } : null;
  const ammo={x:10*1280/1047,y:720-150*720/589,w:220*1280/1047,h:70*720/589};
  assert(a.w>=100 && a.h>=52); assert(a.y>=0 && a.y+a.h<=fire.y);
  assert(a.x+a.w<=ammo.x || a.x>=ammo.x+ammo.w || a.y+a.h<=ammo.y || a.y>=ammo.y+ammo.h);
  assert(fire && fire.y>0 && fire.y+fire.h<720); assert(a.y+a.h<720); assert(fire.y+fire.h<=720);
});
run('right stick ellipse strength, tiny offsets, hysteresis and release use real touch wiring', c => {
  click(c,'start'); cc.sys.isMobile=true; c.battle.enemies=[]; c.profile.aimAssist=false;
  const n=c.battleSticks[1],t=n.getComponent(UITransform),x=n.position.x+640,y=n.position.y+360,rx=t.width/2,ry=t.height/2;
  const send=(type,dx,dy)=>input.emit(EventType[type],pointer(x+dx,y+dy,3));
  send('TOUCH_START',0,0);c.update(.05);const angle=c.battle.player.angle;
  send('TOUCH_MOVE',.2,.1);c.update(.05);assert(Math.abs(c.battle.player.angle-Math.atan2(.1,.2))<1e-8);assert(c.aimRadius>0);assert(Math.abs(c.aimRadius-Math.hypot(.2/rx,.1/ry))<1e-8);assert.equal(c.battle.player.ammo,12);
  send('TOUCH_MOVE',-.1,.2);c.update(.05);assert(Math.abs(c.battle.player.angle-Math.atan2(.2,-.1))<1e-8);assert.notEqual(c.battle.player.angle,angle);
  send('TOUCH_MOVE',rx*.65,0);c.update(.05);assert(!c.aimOuter);assert.equal(c.battle.player.ammo,12);
  send('TOUCH_MOVE',rx*.72,0);c.update(.05);assert(c.aimOuter);assert.equal(c.battle.player.ammo,11);
  send('TOUCH_MOVE',rx*.65,0);assert(c.aimOuter);send('TOUCH_MOVE',rx*.59,0);assert(!c.aimOuter);send('TOUCH_MOVE',rx*.65,0);assert(!c.aimOuter);
  send('TOUCH_END',rx*.65,0);const ammo=c.battle.player.ammo,held=c.battle.player.angle;for(let i=0;i<20;i++)c.update(.05);assert.equal(c.battle.player.ammo,ammo);assert.equal(c.battle.player.angle,held);assert(!c.aiming&&!c.aimOuter);
});
run('auto outer ring cannot bypass strict occlusion and right finger release preserves left movement', c => {
  click(c,'start');cc.sys.isMobile=true;c.battle.enemies=[];c.profile.autoFire=true;c.profile.aimAssist=false;
  const n=c.battleSticks[1],t=n.getComponent(UITransform),x=n.position.x+640,y=n.position.y+360;
  input.emit(EventType.TOUCH_START,pointer(148,144,1));input.emit(EventType.TOUCH_MOVE,pointer(148,190,1));
  input.emit(EventType.TOUCH_START,pointer(x,y,3));input.emit(EventType.TOUCH_MOVE,pointer(x+t.width*.4,y,3));
  c.update(.05);assert(c.aimOuter);assert.equal(c.battle.player.ammo,12);assert.equal(c.moveTouch,1);assert.equal(c.aimTouch,3);
  input.emit(EventType.TOUCH_END,pointer(x,y,3));assert(c.moving&&!c.aiming);assert.equal(c.moveTouch,1);input.emit(EventType.TOUCH_END,pointer(148,190,1));
});
run('first account has no item controls, persists each tutorial step and resumes after hide/exit', c => {
  assert(!c.buttons.some(b=>b.node.name==='Button-tactical-choice'));
  click(c,'start');assert.equal(c.tutorialPrompt,'first');assert(!c.battle.tutorial);click(c,'tutorial-prompt-start');assert.equal(c.battle.tutorial.step,'move');assert(!c.buttons.some(b=>b.node.name==='Button-grenade'&&b.node.active));
  key('KEY_W');for(let i=0;i<20;i++)c.update(1/60);key('KEY_W',true);
  assert.equal(c.profile.tutorial,'aim');assert.equal(JSON.parse(persistedSave).tutorial,'aim');
  const target=c.battle.tutorial.target, player=c.battle.player;
  input.emit(EventType.MOUSE_MOVE,pointer(640+target.x-player.x,360+target.y-player.y));c.update(.05);assert.equal(c.profile.tutorial,'manual');
  cc.game.emit('hide');assert.equal(c.mode,'pause');assert(!c.mouseFire);
  click(c,'resume');assert.equal(c.battle.tutorial.step,'manual');
  click(c,'pause');click(c,'tutorial-exit');const balance=c.profile.materials;
  enterFirstChapter(c);assert.equal(c.tutorialPrompt,'resume');click(c,'tutorial-prompt-start');
  assert.equal(c.battle.tutorial.step,'manual');assert.equal(c.profile.materials,balance);
  click(c,'pause');click(c,'tutorial-skip');click(c,'tutorial-prompt-skip-confirm');assert.equal(c.profile.tutorial,'done');assert(!c.battle.tutorial);assert.equal(c.mode,'playing');assert.equal(c.profile.materials,balance);
},()=>{persistedSave=null;});
run('replay starts in the same first chapter and preserves history and final AUTO option',c=>{
  const balance=c.profile.materials, owned={...c.profile.owned};enterFirstChapter(c);
  const battle = c.battle, seed = battle.stage.dorm.seed;
  assert.equal(c.tutorialPrompt,'replay');assert.match(c.labels.get('dialog-title').string,/重播教学/);
  click(c,'tutorial-prompt-start');assert.equal(c.battle.tutorial.step,'move');
  assert.equal(c.battle,battle);assert.equal(c.battle.stage.dorm.seed,seed);
  assert(!c.buttons.some(b=>b.node.name==='Button-tutorial-replay'));
  click(c,'auto-fire');assert(c.profile.autoFire);click(c,'pause');click(c,'tutorial-skip');click(c,'tutorial-prompt-skip-confirm');
  assert(c.profile.autoFire);assert.equal(JSON.parse(persistedSave).autoFire,true);assert.equal(c.profile.materials,balance);assert.deepEqual(c.profile.owned,owned);
});
run('welcome freezes scene and all inputs; returning player can decline replay without losing history', c=>{
  click(c,'start'); const battle=c.battle,stage=battle.stage; assert.equal(c.tutorialPrompt,'first');
  assert.equal(c.profile.tutorialSeen,false); assert(!c.buttons.some(b=>b.node.name==='Button-tutorial-prompt-dismiss'));
  key('ENTER');key('ESCAPE');key('KEY_E');key('KEY_W');input.emit(EventType.MOUSE_DOWN,pointer(700,360));
  cc.sys.isMobile=true;input.emit(EventType.TOUCH_START,pointer(148,144,1));input.emit(EventType.TOUCH_MOVE,pointer(148,190,1));
  for(let i=0;i<30;i++)c.update(.05);assert.equal(battle.elapsed,0);assert.equal(c.moveTouch,-1);assert.equal(c.tutorialPrompt,'first');
  click(c,'tutorial-blocker');assert.equal(c.tutorialPrompt,'first');click(c,'tutorial-prompt-skip');
  assert.equal(c.battle,battle);assert.equal(c.battle.stage,stage);assert(!battle.tutorial);assert(c.profile.tutorialSkipped);assert.equal(c.profile.materials,80);
  c.open('menu');enterFirstChapter(c);assert.equal(c.tutorialPrompt,'replay');click(c,'tutorial-prompt-skip');
  assert.equal(c.tutorialPrompt,null);assert(!c.battle.tutorial);assert(c.profile.tutorialSkipped);
},()=>{persistedSave=null;});
run('live and pause skip cancel restore state; confirm keeps AUTO history and grants no rewards',c=>{
  enterFirstChapter(c);click(c,'tutorial-prompt-start');const b=c.battle,e=b.enemies,s=b.stage,balances=[c.profile.materials,c.profile.tickets];
  click(c,'auto-fire');click(c,'tutorial-skip-live');assert.equal(c.tutorialPrompt,'skip');key('ENTER');assert.equal(c.tutorialPrompt,'skip');key('ESCAPE');assert.equal(c.tutorialPrompt,null);assert.equal(c.mode,'playing');assert(b.tutorial);
  click(c,'pause');click(c,'tutorial-skip');click(c,'tutorial-prompt-continue');assert.equal(c.mode,'pause');assert(b.tutorial);
  click(c,'tutorial-skip');const action=c.buttons.find(b=>b.node.name==='Button-tutorial-prompt-skip-confirm');action.node.emit('click');action.node.emit('click');
  assert.equal(c.battle,b);assert.equal(b.enemies,e);assert.equal(b.stage,s);assert(!b.tutorial);assert(c.profile.autoFire);assert.deepEqual([c.profile.materials,c.profile.tickets],balances);assert(c.profile.tutorialCompleted);assert(c.profile.tutorialSkipped);
},()=>{persistedSave=JSON.stringify({version:3,tutorial:'done',tutorialSeen:true,tutorialCompleted:true,tutorialSkipped:false,tutorialDismissed:false});});
run('guide is visual only; tiny right input remains real, multitouch fade preserves owners, pause and skip freeze then clean',c=>{
  enterFirstChapter(c);click(c,'tutorial-prompt-start');cc.sys.isMobile=true;c.update(.05);
  const art=c.guideArt,buttons=c.buttons.length;assert(art);assert.equal(art.node.components.length,2);assert.equal(art.node.listeners.size,0);
  input.emit(EventType.TOUCH_START,pointer(148,144,1));input.emit(EventType.TOUCH_MOVE,pointer(163,144,1));
  const n=c.battleSticks[1],x=n.position.x+640,y=n.position.y+360;
  input.emit(EventType.TOUCH_START,pointer(x,y,2));input.emit(EventType.TOUCH_MOVE,pointer(x+.01,y+.01,2));
  for(let i=0;i<8;i++)c.update(.05);
  assert.equal(c.moveTouch,1);assert.equal(c.aimTouch,2);assert(c.aimRadius>0);assert.equal(c.buttons.length,buttons);assert(c.guide.opacity<.3);
  const elapsed=c.guide.elapsed;click(c,'pause');for(let i=0;i<80;i++)c.update(.05);assert.equal(c.guide.elapsed,elapsed);assert(!c.guideArt);assert(!c.labels.has('tutorial-guide-copy'));
  click(c,'resume');c.update(.05);assert(c.guide.elapsed>elapsed&&c.guide.elapsed<elapsed+.1);
  click(c,'tutorial-skip-live');const frozen=c.guide.elapsed;for(let i=0;i<20;i++)c.update(.05);assert.equal(c.guide.elapsed,frozen);assert(!c.guideArt);
  click(c,'tutorial-prompt-continue');c.update(.05);assert(c.guideArt);click(c,'tutorial-skip-live');click(c,'tutorial-prompt-skip-confirm');c.update(.05);assert(!c.guideArt);assert.equal(c.guide.elapsed,0);assert(!c.labels.has('tutorial-guide-copy'));
});
console.log(`${passed} controller wiring checks passed (non-rendering engine doubles).`);
