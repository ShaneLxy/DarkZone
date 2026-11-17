import fs from 'node:fs';
import path from 'node:path';
const rate = 22050, count = Math.ceil(rate * 0.13), data = Buffer.alloc(44 + count * 2);
data.write('RIFF'); data.writeUInt32LE(36 + count * 2, 4); data.write('WAVEfmt ', 8); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22); data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(count * 2, 40);
let seed = 883, filtered = 0;
for (let i = 0; i < count; i++) {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  const t = i / rate, noise = seed / 2147483648 - 1;
  filtered += (noise - filtered) * 0.16;
  const body = (Math.sin(2 * Math.PI * (170 - t * 700) * t) * 0.48 + filtered * 0.42) * Math.exp(-t * 65);
  const action = t > 0.045 ? noise * Math.exp(-(t - 0.045) * 145) * 0.12 : 0;
  data.writeInt16LE(Math.round((body + action) * 12500), 44 + i * 2);
}
const file = path.resolve(import.meta.dirname, '../assets/resources/audio/shoot-suppressed.wav');
fs.writeFileSync(file, data); console.log('Generated quiet pistol report: ' + file);
