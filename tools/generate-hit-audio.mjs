import fs from 'node:fs';
import path from 'node:path';
const rate = 22050, count = Math.ceil(rate * 0.075), data = Buffer.alloc(44 + count * 2);
data.write('RIFF', 0); data.writeUInt32LE(36 + count * 2, 4); data.write('WAVEfmt ', 8);
data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
data.write('data', 36); data.writeUInt32LE(count * 2, 40);
let seed = 961;
for (let i = 0; i < count; i++) {
  const t = i / rate; seed = (seed * 1664525 + 1013904223) >>> 0;
  const noise = seed / 2147483648 - 1, attack = Math.min(1, t / 0.0015);
  const sample = (Math.sin(t * (1450 - t * 9000) * Math.PI * 2) * 0.45 + noise * 0.22) * Math.exp(-t * 70) * attack;
  data.writeInt16LE(Math.round(sample * 17000), 44 + i * 2);
}
const file = path.resolve(import.meta.dirname, '../assets/resources/audio/hit.wav');
fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data);
console.log('Generated short hit feedback audio: ' + file);
