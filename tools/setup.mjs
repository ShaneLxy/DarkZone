import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const engineRoot = process.env.COCOS_CREATOR_ROOT || 'E:/cocos/Creator/3.8.8';
const write = (file, data) => { const target = path.join(root, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, typeof data === 'string' ? data : JSON.stringify(data, null, 2), 'utf8'); };
const scriptUuid = '0aaf70cc-b4d1-4df1-b234-a124e73bad54';
const sceneUuid = 'f49b761e-7bc9-4377-89f3-7f782eed76e1';
const compress = uuid => {
  const h = uuid.replaceAll('-', ''), alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = h.slice(0, 5);
  for (let i = 5; i < 32; i += 3) { const n = parseInt(h.slice(i, i + 3), 16); result += alphabet[n >> 6] + alphabet[n & 63]; }
  return result;
};
write('assets/scripts/Blackout.ts.meta', { ver: '4.0.24', importer: 'typescript', imported: true, uuid: scriptUuid, files: [], subMetas: {}, userData: {} });
write('assets/scenes/Facility.scene.meta', { ver: '1.1.50', importer: 'scene', imported: true, uuid: sceneUuid, files: ['.json'], subMetas: {}, userData: {} });
write('assets/scenes/Facility.scene', [
  { __type__: 'cc.SceneAsset', _name: 'Facility', _objFlags: 0, _native: '', scene: { __id__: 1 } },
  { __type__: 'cc.Scene', _name: 'Facility', _objFlags: 0, _parent: null, _children: [{ __id__: 2 }], _active: true, _components: [], _prefab: null, autoReleaseAssets: false, _id: sceneUuid },
  { __type__: 'cc.Node', _name: 'Game Bootstrap', _objFlags: 0, _parent: { __id__: 1 }, _children: [], _active: true, _components: [{ __id__: 3 }], _prefab: null, _lpos: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 }, _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 }, _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 }, _layer: 1073741824, _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 }, _id: 'blackout-bootstrap-node' },
  { __type__: compress(scriptUuid), _name: '', _objFlags: 0, node: { __id__: 2 }, _enabled: true, visibilityEffect: { __uuid__: 'd7f2b159-842f-4c83-9c31-20f6830a4b67' }, __prefab: null, _id: 'blackout-bootstrap' },
]);
const template = path.join(engineRoot, 'resources/templates/empty-2d');
const engineSettings = JSON.parse(fs.readFileSync(path.join(template, 'settings/v2/packages/engine.json'), 'utf8'));
const config = engineSettings.modules.configs.defaultConfig;
const modules = ['2d', 'mask', 'graphics', 'audio', 'base', 'gfx-webgl', 'gfx-webgl2', 'ui', 'custom-pipeline'];
config.includeModules = modules;
for (const [name, options] of Object.entries(config.cache)) if ('_value' in options) options._value = modules.includes(name);
write('settings/v2/packages/engine.json', engineSettings);
write('settings/v2/packages/project.json', { __version__: '1.0.0', general: { designResolution: { width: 1280, height: 720, fitWidth: true, fitHeight: true } } });
write('settings/v2/packages/preview.json', { __version__: '1.0.0', general: { startScene: sceneUuid } });
write('.creator/default-meta.json', { image: { type: 'sprite-frame' } });
const common = { name: 'Blackout', buildPath: 'project://build', startScene: sceneUuid, scenes: [{ url: 'db://assets/scenes/Facility.scene', uuid: sceneUuid }], debug: false, md5Cache: false, sourceMaps: true, mainBundleCompressionType: 'merge_dep', renderPipeline: 'custom', experimentalEraseModules: false };
write('config/build-web-mobile.json', { ...common, platform: 'web-mobile', outputName: 'web-mobile', packages: { 'web-mobile': { orientation: 'landscape', embedWebDebugger: false } } });
write('config/build-wechatgame.json', { ...common, platform: 'wechatgame', outputName: 'wechatgame', packages: { wechatgame: { orientation: 'landscape', appid: '', separateEngine: false } } });
// Small synthesized effects keep the sample self-contained and portable to mini games.
for (const [name, seconds, frequency] of [['shoot', 0.12, 110], ['hurt', 0.2, 65], ['dash', 0.22, 460], ['reload', 0.24, 720], ['kill', 0.12, 160], ['win', 0.65, 520]]) {
  const rate = 22050, count = Math.ceil(seconds * rate), data = Buffer.alloc(44 + count * 2);
  data.write('RIFF', 0); data.writeUInt32LE(36 + count * 2, 4); data.write('WAVEfmt ', 8); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22); data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(count * 2, 40);
  let seed = 142;
  for (let i = 0; i < count; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const t = i / rate, decay = Math.pow(1 - i / count, name === 'shoot' ? 3 : 1.8), noise = seed / 2147483648 - 1;
    const tone = Math.sin(t * frequency * Math.PI * 2 * (name === 'dash' ? 1 - t : 1));
    const v = (name === 'shoot' || name === 'hurt' ? noise * 0.65 + tone * 0.3 : name === 'win' ? Math.sin(t * frequency * (1 + Math.floor(t * 5) / 4) * Math.PI * 2) : tone * 0.6 + noise * 0.12) * decay;
    data.writeInt16LE(Math.round(v * 20000), 44 + i * 2);
  }
  const target = path.join(root, 'assets/resources/audio/' + name + '.wav'); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, data);
}
console.log('Created Cocos 3.8.8 scene, build configurations and audio effects.');
