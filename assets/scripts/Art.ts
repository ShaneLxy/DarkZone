import { Color, Graphics } from 'cc';
import { Battle, BloodStain, BRUTE_WINDUP, clamp, Door, doorShape, Enemy, engineerMuzzle, FACILITY_LEVEL, HEROINE_ID, lineClear, Particle, Point, Rect, rectCorners, rayDistance, visible, walkable } from './Core';
import { grenadeThrowPose, TACTICAL_DEFINITIONS } from './Tactical';
import { ENGINEER_ID } from './Heroes';
import type { LevelDefinition } from './Levels';
import type { AmbientAnimal } from './AmbientWildlife';
import { ActorPose, FootPose, WeaponEffects, WeaponMount, weaponMount } from './Presentation';

export const palette = { ink: '#0b1218', panel: '#131e26', line: '#33414a', text: '#e0dfd4', muted: '#82928f', gold: '#d7b47a', jade: '#8cbdad', red: '#cb6655' };
export function color(hex: string, alpha = 255): Color { const c = new Color(); Color.fromHEX(c, hex); c.a = alpha; return c; }
export function box(g: Graphics, x: number, y: number, w: number, h: number, fill: string, alpha = 255) { g.fillColor = color(fill, alpha); g.rect(x, y, w, h); g.fill(); }
export function disc(g: Graphics, x: number, y: number, r: number, fill: string, alpha = 255) { g.fillColor = color(fill, alpha); g.circle(x, y, r); g.fill(); }
export function line(g: Graphics, x: number, y: number, x2: number, y2: number, stroke: string, width = 1, alpha = 255) { g.strokeColor = color(stroke, alpha); g.lineWidth = width; g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); }
export function outline(g: Graphics, x: number, y: number, w: number, h: number, stroke: string, alpha = 255) { g.strokeColor = color(stroke, alpha); g.lineWidth = 1; g.rect(x, y, w, h); g.stroke(); }
export function drawTutorialTarget(g: Graphics, battle: Battle, time: number) {
  const t = battle.tutorial, p = battle.player;
  if (!t || !visible(p, p.angle, t.target, battle.blockers, battle.stats.visionRange)) return;
  const { x, y } = t.target;
  const pulse = (1 + Math.cos(time * Math.PI * 2 / 0.75)) / 2;
  disc(g, x, y, 24, '#ff2525', Math.round(25 + pulse * 85));
  disc(g, x, y, 16, '#8f101b', 235);
  disc(g, x, y, 9, '#ff4545', Math.round(120 + pulse * 135));
  disc(g, x, y, 3, '#fff1e7');
  g.strokeColor = color('#ff3434', Math.round(110 + pulse * 145)); g.lineWidth = 3;
  g.circle(x, y, 21); g.stroke();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
    line(g, x + dx * 25, y + dy * 25, x + dx * 32, y + dy * 32, '#ff4141', 3, Math.round(100 + pulse * 155));
}
export function polygon(g: Graphics, pts: Point[], fill: string, alpha = 255) {
  if (!pts.length) return;
  g.fillColor = color(fill, alpha); g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.close(); g.fill();
}
export function drawAmbientAnimal(g: Graphics, animal: AmbientAnimal) {
  g.clear();
  const { x, y, angle, elapsed, opacity } = animal;
  const c = Math.cos(angle), s = Math.sin(angle);
  const at = (forward: number, side: number): Point => ({ x: x + c * forward - s * side, y: y + s * forward + c * side });
  const stroke = (a: Point, b: Point, tint: string, width: number) => line(g, a.x, a.y, b.x, b.y, tint, width, Math.round(opacity * 235));
  const oval = (center: number, rx: number, ry: number, tint: string, alpha = 255) => {
    const rim = Array.from({ length: 12 }, (_, i) => {
      const phase = i * Math.PI / 6;
      return at(center + Math.cos(phase) * rx, Math.sin(phase) * ry);
    });
    polygon(g, rim, tint, Math.round(alpha * opacity));
  };
  const rat = animal.kind === 'rat', gait = elapsed * (rat ? 59 : 76);
  oval(-1, rat ? 12 : 7, rat ? 6.8 : 4.2, '#131516', 82);
  if (rat) {
    for (const side of [-1, 1]) for (const foot of [-6, 4]) {
      const phase = Math.sin(gait + side + foot);
      stroke(at(foot, side * 3), at(foot + phase * 2.8, side * (5.5 + phase * 0.6)), '#534035', 1.8);
    }
    let tail = at(-8, 0);
    for (let i = 1; i <= 6; i++) {
      const next = at(-8 - i * 2.6, Math.sin(elapsed * 17 - i * 0.44) * i * 0.72);
      stroke(tail, next, '#69564a', 2 - i * 0.22); tail = next;
    }
    oval(-2, 8.8, 4.8 + Math.sin(gait) * 0.32, '#4b4038');
    oval(-1, 6.7, 3.2, '#625448', 170);
    oval(5.8, 5.7, 3.6, '#514338');
    for (const side of [-1, 1]) {
      const ear = at(3.3, side * 3.4);
      disc(g, ear.x, ear.y, 1.65, '#806759', Math.round(opacity * 235));
    }
    const nose = at(11, 0);
    disc(g, nose.x, nose.y, 0.9, '#302724', Math.round(opacity * 255));
    return;
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const foot = i * 3 - 3, phase = Math.sin(gait + i * 2 + side) * 1.4;
      stroke(at(foot, side * 1.6), at(foot - 1.5 + phase, side * 4.4), '#533625', 0.9);
    }
    stroke(at(4, side * 1.2), at(9.4, side * (2.8 + Math.sin(elapsed * 22 + side) * 0.75)), '#533825', 0.8);
  }
  oval(-0.8, 5.4, 2.9, '#4a2e21');
  oval(2.5, 2.8, 2.4, '#684532');
  stroke(at(-5.1, 0), at(1.5, 0), '#876049', 0.75);
}

function seeded(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
export function drawMap(g: Graphics, phase: 'all' | 'floor' | 'fixtures' = 'all', rasterProps = new Set<string>(), stage: LevelDefinition = FACILITY_LEVEL) {
  const { rooms, walls, furniture } = stage;
  if (stage.street) { drawStreet(g, phase, rasterProps, stage); return; }
  if (stage.apartment || stage.dorm || stage.id === 'campus-dorm') { drawDorm(g, phase, rasterProps, stage); return; }
  const rand = seeded(71);
  if (phase !== 'fixtures') {
  for (let i = 0; i < rooms.length; i++) {
    const r = rooms[i];
    box(g, r.x - 8, r.y - 12, r.w + 26, r.h + 24, '#03090d');
    box(g, r.x, r.y, r.w, r.h, '#3d4748');
    for (let y = r.y + 18; y < r.y + r.h - 18; y += 38) for (let x = r.x + 18; x < r.x + r.w - 18; x += 38) {
      const c = i === 0 ? ['#4b514b', '#50554e', '#55584e', '#464e4b'] : i === 2 ? ['#65716b', '#4f5e5b', '#727971', '#596660'] : ['#414c4e', '#465253', '#4b5555', '#3c484b'];
      box(g, x, y, Math.min(36, r.x + r.w - 18 - x), Math.min(36, r.y + r.h - 18 - y), c[Math.floor(rand() * c.length)]);
      if (rand() > 0.72) line(g, x + 2, y + 1, x + 17, y + 1, '#87918a', 1, 45);
    }
    for (let n = 0; n < 210; n++) {
      const x = r.x + 22 + rand() * (r.w - 44), y = r.y + 22 + rand() * (r.h - 44);
      box(g, x, y, 1 + rand() * 4, 1 + rand() * 3, rand() > 0.5 ? '#9a9d8c' : '#1d2a2c', 45);
    }
    // Narrow skirting and worn floor marks.
    outline(g, r.x + 22, r.y + 22, r.w - 44, r.h - 44, '#929284', 55);
  }
  // Reception rug and utilitarian floor markings.
  box(g, 260, 405, 220, 120, '#696350'); outline(g, 269, 414, 202, 102, '#a19572', 130);
  for (let i = 0; i < 8; i++) line(g, 275 + i * 25, 425, 275 + i * 25, 505, '#91866a', 1, 65);
  box(g, 190, 266, 140, 42, '#404a45');
  }
  if (phase === 'floor') return;
  for (const f of furniture) if (f.kind !== 'harbor-obstacle' && !rasterProps.has(f.kind + ':' + f.x + ':' + f.y)) drawFurniture(g, f);
  for (const w of walls) {
    if (w.kind === 'harbor-obstacle' || w.kind === 'harbor-water') continue;
    if (stage.survival && rasterProps.has(w.kind + ':' + w.x + ':' + w.y)) continue;
    if (w.kind === 'survival-window') {
      box(g, w.x, w.y, w.w, w.h, '#4f625f');
      box(g, w.x + 3, w.y + 3, w.w - 6, w.h - 6, '#99b5b3', 140);
      line(g, w.x + w.w / 2, w.y + 2, w.x + w.w / 2, w.y + w.h - 2, '#576b66', 3);
      continue;
    }
    box(g, w.x, w.y, w.w, w.h, '#716f5b');
    box(g, w.x + 3, w.y + 3, Math.max(2, w.w - 6), Math.max(2, w.h - 6), '#9d9780');
    line(g, w.x, w.y + w.h - 1, w.x + w.w, w.y + w.h - 1, '#d4c9a8', 2);
    line(g, w.x + 1, w.y, w.x + 1, w.y + w.h, '#b7ae94', 1);
    line(g, w.x + w.w, w.y, w.x + w.w, w.y + w.h, '#3c433d', 3);
  }
  if (stage.survival) return;
  // Open door frames make the route readable, without locking the player in.
  for (const p of [{ x: 830, y: 330 }, { x: 1175, y: 670 }, { x: 1530, y: 920 }]) {
    disc(g, p.x, p.y, 5, '#b7c2b0'); disc(g, p.x, p.y, 10, '#c6d2b4', 22);
  }
  // Loose papers, cabling, drain covers.
  for (const p of [{ x: 620, y: 400 }, { x: 340, y: 210 }, { x: 1180, y: 460 }, { x: 1100, y: 740 }, { x: 1900, y: 1110 }]) {
    box(g, p.x, p.y, 16, 22, '#a8aa93', 185);
    for (let n = 0; n < 4; n++) line(g, p.x + 3, p.y + 5 + n * 4, p.x + 12, p.y + 5 + n * 4, '#4c5b59', 1, 150);
  }
  for (const p of [{ x: 730, y: 160 }, { x: 1470, y: 620 }, { x: 1490, y: 1210 }]) {
    box(g, p.x - 12, p.y - 12, 24, 24, '#263638');
    for (let n = 0; n < 5; n++) line(g, p.x - 9, p.y - 8 + n * 4, p.x + 9, p.y - 8 + n * 4, '#77817a', 1);
  }
}

function drawStreet(g: Graphics, phase: 'all' | 'floor' | 'fixtures', rasterProps: Set<string>, stage: LevelDefinition) {
  const street = stage.street!;
  const tones = { asphalt: '#52575a', pavement: '#8c8c80', 'shop-tile': '#828d7c', alley: '#606866' };
  if (phase !== 'fixtures') {
    for (const { x, y, w, h } of street.roofs) {
      box(g, x - 9, y - 9, w + 18, h + 18, '#293538');
      box(g, x, y, w, h, '#555e60');
      box(g, x + 8, y + 8, w - 16, h - 16, '#37434a');
      for (let dx = 22; dx < w - 14; dx += 56) {
        line(g, x + dx, y + 9, x + dx, y + h - 9, '#596367', 2, 155);
        box(g, x + dx, y + h - 15, 18, 7, '#81847b');
      }
      box(g, x + 22, y + 24, 43, 22, '#69706c');
    }
    for (const r of street.surfaces) box(g, r.x, r.y, r.w, r.h, tones[r.kind]);
  }
  if (phase === 'floor') return;
  for (const r of street.surfaces) {
    if (r.lanes === 'x') {
      for (const y of [r.y + 3, r.y + r.h - 3]) line(g, r.x, y, r.x + r.w, y, '#afb1a4', 4, 190);
      for (let x = r.x + 32; x + 55 < r.x + r.w - 16; x += 110) box(g, x, r.y + r.h / 2, 55, 3, '#d3d0b3', 154);
    } else if (r.lanes === 'y') {
      for (const x of [r.x + 3, r.x + r.w - 3]) line(g, x, r.y, x, r.y + r.h, '#afb1a4', 4, 190);
      for (let y = r.y + 32; y + 55 < r.y + r.h - 16; y += 110) box(g, r.x + r.w / 2, y, 3, 55, '#d3d0b3', 154);
    }
  }
  for (const { x, y, w, h, lanes } of street.crossings) {
    if (lanes === 'x') for (let offset = 0; offset < h - 11; offset += 29) box(g, x, y + offset, w, 11, '#dedbd0', 150);
    else for (let offset = 0; offset < w - 11; offset += 29) box(g, x + offset, y, 11, h, '#dedbd0', 150);
  }
  for (const r of stage.walls) {
    box(g, r.x, r.y, r.w, r.h, '#4f5654');
    box(g, r.x + 2, r.y + 2, r.w - 4, r.h - 4, '#aaa79a');
    line(g, r.x, r.y + r.h - 2, r.x + r.w, r.y + r.h - 2, '#d4cdbb', 2, 182);
  }
  for (const f of stage.furniture) {
    if (f.kind === 'gate-post') continue;
    if (rasterProps.has(f.kind + ':' + f.x + ':' + f.y)) continue;
    if (f.kind === 'street-roadblock') {
      const { x, y, w, h } = f;
      const vertical = h > w, length = Math.max(w, h);
      box(g, x, y, w, h, '#343b3b');
      for (let offset = 4; offset < length - 6; offset += 54) {
        const size = Math.min(48, length - offset - 4);
        const px = x + (vertical ? 4 : offset), py = y + (vertical ? offset : 4);
        box(g, px, py, vertical ? w - 8 : size, vertical ? size : h - 8, '#77796f');
        if (vertical) line(g, px + 3, py + 2, x + w - 7, py + size - 3, '#c0a468', 6, 210);
        else line(g, px + 3, py + 2, px + size - 3, y + h - 7, '#c0a468', 6, 210);
      }
      continue;
    }
    const shelf = f.kind === 'street-shelf', bin = f.kind === 'street-bin';
    box(g, f.x, f.y, f.w, f.h, bin ? '#4b5750' : shelf ? '#696e59' : '#7d7e70');
    outline(g, f.x + 2, f.y + 2, f.w - 4, f.h - 4, '#adb3a3', 200);
    if (shelf) for (let x = f.x + 10; x < f.x + f.w - 15; x += 22) {
      box(g, x, f.y + 7, 15, 11, '#a69869');
      box(g, x + 3, f.y + 24, 11, 8, '#80785f');
    }
  }
  for (const p of street.lamps) {
    disc(g, p.x, p.y, 7, '#2e3437');
    line(g, p.x, p.y, p.x, p.y - 24, '#666d66', 5);
    box(g, p.x - 8, p.y - 29, 16, 9, '#bca77a');
  }
}
function drawDorm(g: Graphics, phase: 'all' | 'floor' | 'fixtures', rasterProps: Set<string>, stage: LevelDefinition) {
  if (phase !== 'fixtures') for (const [i, r] of stage.rooms.entries()) {
    const bedroom = stage.dorm?.number === 2 ? i >= 1 && i <= 3 : !stage.dorm && (i === 1 || i === 2);
    box(g, r.x, r.y, r.w, r.h, bedroom ? '#a0947a' : '#b9b9ac');
    for (let y = r.y + 14; y < r.y + r.h - 47; y += 48) for (let x = r.x + 14; x < r.x + r.w - 47; x += 48) outline(g, x, y, 46, 46, '#7f8d80', 45);
  }
  if (phase === 'floor') return;
  for (const f of stage.furniture) if (!rasterProps.has(f.kind + ':' + f.x + ':' + f.y)) {
    if (f.kind === 'washer') {
      box(g, f.x, f.y, f.w, f.h, '#b7c2ba');
      const count = f.w >= 135 ? 2 : 1, width = f.w / count, radius = Math.min(width * 0.38, f.h * 0.32);
      for (let i = 0; i < count; i++) {
        const x = f.x + i * width, cy = f.y + f.h * 0.43;
        box(g, x + 3, f.y + 3, width - 6, f.h - 6, '#dee1d5');
        disc(g, x + width / 2, cy, radius, '#718d8d'); disc(g, x + width / 2, cy, radius * 0.72, '#a4b9b2');
        line(g, x + 8, f.y + f.h - 13, x + width - 8, f.y + f.h - 13, '#6e827b', 3);
      }
    } else drawFurniture(g, { ...f, kind: f.kind === 'dorm-bed' ? 'bed' : f.kind === 'study-desk' ? 'desk' : f.kind });
  }
  for (const w of stage.walls) {
    box(g, w.x, w.y, w.w, w.h, '#5d6867');
    box(g, w.x + 3, w.y + 3, Math.max(2, w.w - 6), Math.max(2, w.h - 6), '#cfc4ab');
    if (w.w >= w.h) {
      line(g, w.x, w.y + w.h - 2, w.x + w.w, w.y + w.h - 2, '#e2d9c5', 2);
      for (let x = w.x + 46; x < w.x + w.w - 2; x += 46) line(g, x, w.y + 3, x, w.y + w.h - 3, '#847c6c', 1.4, 150);
    } else {
      line(g, w.x + 2, w.y, w.x + 2, w.y + w.h, '#e2d9c5', 2);
      for (let y = w.y + 46; y < w.y + w.h - 2; y += 46) line(g, w.x + 3, y, w.x + w.w - 3, y, '#847c6c', 1.4, 150);
    }
  }
  if (stage.dorm) {
    const upper = stage.dorm.number === 2;
    for (const r of stage.rooms.filter(r => upper ? r.y === 96 : r.kind === '宿管室' || r.kind === '洗衣房')) {
      const x = r.x + r.w * 0.48, y = r.kind === '洗衣房' ? r.y + r.h : r.y;
      box(g, x - 61, y - 7, 122, 14, '#374b54');
      for (const dx of [-39, 0, 39]) box(g, x + dx - 16, y - 3, 32, 6, '#a39a71');
    }
    for (const [i, d] of stage.doors.entries()) {
      const lamp = stage.faultyDoorLamp;
      if (lamp?.door === i) {
        box(g, lamp.x - 10, lamp.y - 4, 20, 8, '#46413c');
        box(g, lamp.x - 7, lamp.y - 2, 14, 4, '#a3956d');
        continue;
      }
      const x = d.x + d.length + 17;
      box(g, x, d.y - 6, 22, 12, '#494942');
      box(g, x + 3, d.y - 3, 16, 6, d.alarm ? '#b46f49' : '#f3c987');
    }
    if (!upper) {
      box(g, 1165, 489, 218, 104, '#647168'); outline(g, 1171, 495, 206, 92, '#bbb198', 140);
      for (let x = 1178; x <= 1370; x += 24) line(g, x, 503, x, 580, '#829185', 1, 130);
      for (const x of [985, 1553]) for (const y of [431, 696]) box(g, x, y, 12, 12, '#ddb37d');
    }
    return;
  }
  if (stage.apartment) return;
  // Window sills, pinboards and stair treads are floor/wall decoration, not blockers.
  for (const x of [210, 560, 910, 1260, 1640, 2020]) { box(g, x, 1102, 85, 14, '#364e59'); line(g, x + 5, 1109, x + 80, 1109, '#9ebcc3', 3); }
  for (const x of [190, 890, 1590]) { box(g, x, 313, 110, 24, '#6d735b'); for (let i = 0; i < 4; i++) box(g, x + 7 + i * 25, 317, 18, 15, i % 2 ? '#dad0ac' : '#9ead99'); }
  box(g, 2045, 935, 125, 145, '#65796d');
  for (let i = 0; i < 10; i++) line(g, 2050, 943 + i * 13, 2165, 943 + i * 13, '#bec4af', 3);
  for (const x of [440, 1140, 1870]) { box(g, x - 10, 298, 85, 22, '#6e8377'); line(g, x + 8, 308, x + 50, 308, '#d6dcc5', 2); }
}
function drawFurniture(g: Graphics, f: Rect) {
  const { x, y, w, h, kind } = f;
  const fill = kind === 'sofa' ? '#526566' : kind === 'crate' ? '#665e48' : kind === 'bed' ? '#858c79' : kind === 'desk' ? '#686b5c' : '#4d605e';
  box(g, x, y, w, h, '#26383a'); box(g, x + 3, y + 4, w - 6, h - 7, fill);
  outline(g, x + 5, y + 6, w - 10, h - 11, '#a5ac94', 90);
  line(g, x + 2, y + h - 2, x + w - 2, y + h - 2, '#c3c3a8', 2, 120);
  if (kind === 'sofa') {
    box(g, x + 6, y + h - 14, w - 12, 10, '#334b50');
    box(g, x + 4, y + 6, 12, h - 15, '#3d5355'); box(g, x + w - 16, y + 6, 12, h - 15, '#3d5355');
    for (let n = 1; n < 4; n++) line(g, x + w / 4 * n, y + 10, x + w / 4 * n, y + h - 18, '#2b4145', 2);
  } else if (kind === 'desk') {
    box(g, x + 22, y + h - 35, 44, 25, '#1f2f32'); box(g, x + 25, y + h - 32, 38, 19, '#557577');
    line(g, x + 33, y + h - 23, x + 53, y + h - 23, '#a6c0b1', 1, 100);
    box(g, x + 30, y + h - 46, 32, 7, '#344448'); box(g, x + w - 38, y + 14, 22, 28, '#a7a58e');
    disc(g, x + w - 25, y + h - 21, 6, '#303f3e');
  } else if (kind === 'bed') {
    box(g, x + 10, y + 9, w - 20, h - 18, '#9aa08c'); box(g, x + 12, y + 12, 31, h - 24, '#bdc0a7');
    for (let n = 0; n < 5; n++) line(g, x + 55 + n * 18, y + 12, x + 55 + n * 18, y + h - 12, '#727e73', 1, 180);
  } else if (kind === 'crate') {
    box(g, x + 12, y + 4, 9, h - 8, '#89816a'); box(g, x + w - 21, y + 4, 9, h - 8, '#89816a');
    line(g, x + 21, y + 9, x + w - 21, y + h - 9, '#3a463d', 3);
  } else {
    for (let n = 1; n < 4; n++) { line(g, x + w / 4 * n, y + 7, x + w / 4 * n, y + h - 7, '#283e3f', 2); box(g, x + w / 4 * n - 9, y + h / 2, 5, 14, '#9d9d80'); }
  }
}
/** Foot layers are absent at rest. Only the advancing shoe crosses the front edge. */
export function drawFeet(g: Graphics, p: Point, angle: number, scale: number, feet: FootPose, style: 'military' | 'walker' | 'plain') {
  const c = Math.cos(angle), s = Math.sin(angle), lateral = style === 'military' ? 17 : 9;
  const at = (x: number, y: number) => ({ x: p.x + (x * c - y * s) * scale, y: p.y + (x * s + y * c) * scale });
  for (const [side, extension] of [[1, feet.leftFoot], [-1, feet.rightFoot]]) {
    if (extension <= 0.02) continue;
    const toe = 12 + extension * 15, y = side * lateral;
    polygon(g, [[toe - 9, y - 2.7], [toe - 1, y - 2.7], [toe + 1, y - 1.5], [toe + 1, y + 1.5], [toe - 1, y + 2.7], [toe - 9, y + 2.7]].map(([x, y]) => at(x, y)), '#283539');
    const a = at(toe - 1, y - 1.5), b = at(toe - 1, y + 1.5); line(g, a.x, a.y, b.x, b.y, '#637269', 1);
  }
}
export function drawPerson(g: Graphics, p: Point, angle: number, body: string, scale = 1, gun = true, hit = false, rasterBody = false) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const point = (x: number, y: number) => ({ x: p.x + (x * c - y * s) * scale, y: p.y + (x * s + y * c) * scale });
  const rect = (x: number, y: number, w: number, h: number, fill: string) => polygon(g, [point(x, y), point(x + w, y), point(x + w, y + h), point(x, y + h)], fill);
  const circle = (x: number, y: number, r: number, fill: string) => { const q = point(x, y); disc(g, q.x, q.y, r * scale, fill); };
  disc(g, p.x + 5, p.y - 6, 22 * scale, '#02090d', 135);
  if (rasterBody) return;
  circle(-2, -13, 8, hit ? '#e7c9b4' : body); circle(-2, 13, 8, hit ? '#e7c9b4' : body);
  rect(-15, -10, 24, 20, hit ? '#ddba9d' : body); rect(-16, -8, 8, 16, '#35494a');
  rect(-5, -8, 11, 16, '#52615a'); rect(0, -7, 5, 5, '#a6ad91');
  circle(2, 0, 10, '#303f40'); circle(4, 0, 8, '#697970');
  rect(7, -6, 5, 12, '#202f33'); rect(10, -5, 2, 10, '#91b7b1');
  if (gun) { rect(5, -15, 25, 7, '#78847a'); rect(18, -14, 23, 4, '#273a3f'); rect(14, -15, 12, 2, '#c4b792'); circle(20, -10, 5, '#9b9d7e'); }
}
function drawRoll(g: Graphics, p: Point, pose: ActorPose, body: string) {
  const c = Math.cos(pose.angle), s = Math.sin(pose.angle), sc = pose.scale;
  const at = (x: number, y: number) => ({ x: p.x + (x * c - y * s) * sc, y: p.y + (x * s + y * c) * sc });
  const shape = (points: number[][], fill: string) => polygon(g, points.map(([x, y]) => at(x, y)), fill);
  if (pose.rollFrame === 0) {
    shape([[-18, -13], [-10, -21], [11, -18], [17, -7], [13, 13], [-8, 20], [-20, 9]], body);
    shape([[-17, -9], [-5, -10], [1, 9], [-15, 12]], '#344746');
    const head = at(9, -1); disc(g, head.x, head.y, 9 * sc, '#66766a');
    shape([[-15, -16], [-6, -19], [1, -10], [-8, -7]], '#263739');
  } else if (pose.rollFrame === 1) {
    shape([[-14, -17], [4, -22], [17, -13], [20, 6], [7, 17], [-13, 15], [-21, 0]], body);
    shape([[-15, -9], [2, -13], [12, 5], [-4, 13], [-16, 4]], '#42554b');
    shape([[2, 11], [9, 5], [23, 9], [21, 17], [11, 19]], '#253739');
    shape([[4, -14], [9, -21], [22, -17], [21, -8], [10, -7]], '#253739');
    const head = at(-12, 2); disc(g, head.x, head.y, 8 * sc, '#66766a');
  } else {
    shape([[-17, -12], [-4, -18], [13, -12], [16, 9], [3, 17], [-17, 10]], body);
    shape([[-19, -15], [-10, -18], [-1, -9], [-11, -5]], '#263739');
    shape([[-18, 9], [-6, 5], [-1, 13], [-13, 19]], '#263739');
    shape([[8, -10], [19, -15], [22, -8], [13, -2]], '#52645e');
    const head = at(9, 1); disc(g, head.x, head.y, 9 * sc, '#66766a');
  }
}
export function drawBloodStains(g: Graphics, stains: BloodStain[], battle?: Battle) {
  g.clear();
  for (const stain of stains) {
    if (stain.outline) {
      polygon(g, stain.outline, '#8c2428', 220);
      for (const drop of stain.droplets || []) disc(g, drop.x, drop.y, drop.radius, '#9b2930', 205);
      continue;
    }
    const clip = (q: Point) => {
      if (!battle) return q;
      const a = Math.atan2(q.y - stain.y, q.x - stain.x), d = Math.hypot(q.x - stain.x, q.y - stain.y);
      const length = Math.max(0, rayDistance(stain, a, d, battle.blockers) - 1);
      return { x: stain.x + Math.cos(a) * length, y: stain.y + Math.sin(a) * length };
    };
    const rand = seeded(stain.seed), points: Point[] = [], angle = stain.angle || 0;
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2, r = stain.radius * (0.68 + rand() * 0.38), c = Math.cos(angle), s = Math.sin(angle);
      const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.77;
      points.push(clip({ x: stain.x + x * c - y * s, y: stain.y + x * s + y * c }));
    }
    polygon(g, points, '#8c2428', 220);
    const drops = stain.drops || 0;
    for (let i = 0; i < drops; i++) {
      const a = rand() * Math.PI * 2, d = stain.radius * (1.15 + rand() * 0.9), r = 1.3 + rand() * 2.4;
      const q = { x: stain.x + Math.cos(a) * d, y: stain.y + Math.sin(a) * d * 0.8 };
      if (!battle || walkable(q, r, battle.blockers, battle.rooms) && rayDistance(stain, Math.atan2(q.y - stain.y, q.x - stain.x), d, battle.blockers) >= Math.hypot(q.x - stain.x, q.y - stain.y)) disc(g, q.x, q.y, r, '#9b2930', 205);
    }
  }
}
export function paralyzedModelPosition(e: Enemy, time: number): Point {
  if (!e.paralysis) return e;
  const amplitude = e.type === 'boss' ? 2.2 : 1.6;
  return { x: e.x + Math.sin(time * 96 + e.id * 2) * amplitude, y: e.y + Math.cos(time * 113 + e.id) * amplitude * 0.7 };
}
export function drawParalysis(g: Graphics, b: Battle) {
  for (const enemy of b.enemies) {
    if (!enemy.hp || !enemy.paralysis || !b.sees(enemy, 24)) continue;
    const center = paralyzedModelPosition(enemy, b.elapsed);
    const scale = enemy.type === 'boss' ? 1.6 : 1;
    const frame = Math.floor(b.elapsed * 24);
    for (let arc = 0; arc < 2; arc++) {
      const angle = enemy.angle + arc * 1.75 + Math.sin(frame * 3.17 + enemy.id) * 0.7;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const jagged = [-3, 5, -5, 4, -2];
      const points = jagged.map((side, i) => {
        const forward = (i - 2) * 9 * scale;
        const lateral = (side + arc * 6 - 4 + Math.sin(frame * 1.7 + i * 3.1) * 3) * scale;
        return { x: center.x + cos * forward - sin * lateral, y: center.y + sin * forward + cos * lateral };
      });
      const stroke = (tint: string, alpha: number, width: number) => {
        g.strokeColor = color(tint, alpha); g.lineWidth = width;
        g.moveTo(points[0].x, points[0].y);
        for (const point of points.slice(1)) g.lineTo(point.x, point.y);
        g.stroke();
      };
      stroke('#f7b632', 110, 4);
      stroke('#fff192', (frame + arc) % 3 === 0 ? 160 : 250, 1.6);
    }
  }
}
function drawDaylightFlash(g: Graphics, origin: Point, angle: number, strength: number, length: number) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const at = (forward: number, side: number) => ({ x: origin.x + forward * c - side * s, y: origin.y + forward * s + side * c });
  const light = Math.sqrt(clamp(strength, 0, 1));
  const reach = length * (0.7 + 0.3 * light);
  polygon(g, [at(-3, -4), at(7, -8), at(reach + 4, 0), at(7, 8), at(-3, 4)], '#5c321e', Math.round(230 * light));
  polygon(g, [at(0, -3), at(8, -6), at(reach, 0), at(8, 6), at(0, 3)], '#f68b30', Math.round(245 * light));
  polygon(g, [at(0, -2), at(7, -3), at(reach * 0.68, 0), at(7, 3), at(0, 2)], '#fff7ce', Math.round(255 * light));
}

export function drawRecovery(g: Graphics, b: Battle) {
  for (const [unit, time] of b.recoveryFx) {
    if (unit.hp <= 0) continue;
    const intensity = Math.min(1, time / 0.45);
    const age = 0.84 - time;
    const y = unit.y + 3;
    disc(g, unit.x, y, 29, '#5bf58a', Math.round(49 * intensity));
    disc(g, unit.x, y, 17, '#97ffaa', Math.round(37 * intensity));
    g.strokeColor = color('#87ffa2', Math.round(130 * intensity));
    g.lineWidth = 1.8;
    g.circle(unit.x, y, 20 + 8 * (1 - intensity)); g.stroke();
    for (let i = 0; i < 6; i++) {
      const wave = (age * 2.6 + b.elapsed * 1.25 + i / 6) % 1;
      const angle = i * 2.399 + b.elapsed * 2.6;
      const x = unit.x + Math.cos(angle) * (11 + 19 * wave);
      const height = y + 52 * wave + Math.sin(angle) * 7;
      const alpha = Math.round(192 * intensity * Math.sin(Math.PI * wave));
      disc(g, x, height, 1.7 + (1 - wave) * 0.8, '#adffb9', alpha);
    }
  }
}

export function drawActors(g: Graphics, b: Battle, pose: ActorPose, rasterPlayer = false, rasterWalker = false, rasterRoll = false, enemyPoses: ReadonlyMap<number, ActorPose> = new Map(), rasterOperator = false, rasterBrute = false, grenadeArt = false, blastArt = false, venomArt?: { spitter: boolean; glob: boolean; dart: boolean }) {
  g.clear();
  const daylight = b.visionScale > 1, boarding = b.operationRun?.phase === 'boarding';
  for (const unit of [b.player, ...b.allies]) {
    if (boarding) break;
    if (unit.hp <= 0 || b.evacuationDrive) continue;
    disc(g, unit.x, unit.y, 25, '#43cb82', 40);
    g.strokeColor = color('#79e5a4', 176); g.lineWidth = 2;
    g.circle(unit.x, unit.y, 25); g.stroke();
  }
  for (const e of b.enemies) {
    if (e.hp <= 0) continue;
    if ((b.stage.street || b.stage.operation || b.stage.survival) && !b.sees(e, 35)) continue;
    if (e.hit > 0) disc(g, e.x, e.y, 24, '#ffe8b8', Math.round(e.hit / 0.12 * 65));
    const enemyPose = enemyPoses.get(e.id), sc = (e.type === 'boss' ? 1.7 : 1) * (enemyPose?.scale || 1);
    const model = paralyzedModelPosition(e, b.elapsed);
    const operationModel = e.type === 'gunner' || !!e.operationBoss || b.stage.operation?.part === 'defense';
    if (!operationModel) {
      if (enemyPose && !(b.apartment && e.type === 'boss')) drawFeet(g, model, e.angle, sc, enemyPose, e.type === 'walker' && rasterWalker ? 'walker' : 'plain');
      if (!(e.type === 'spitter' && venomArt?.spitter)) {
        drawPerson(g, model, e.angle, e.type === 'boss' ? '#9a654c' : e.type === 'spitter' ? '#a09169' : '#687a61', sc, false, e.hit > 0, rasterWalker && e.type === 'walker' || rasterBrute && e.type === 'boss');
        disc(g, model.x + Math.cos(e.angle) * 9 * sc, model.y + Math.sin(e.angle) * 9 * sc, 2.8 * sc, '#d99567');
      }
    }
    if (e.charge?.phase === 'windup') {
      const a = e.charge.angle;
      const { radius, length } = b.bruteChargePreview(e);
      const dx = Math.cos(a), dy = Math.sin(a);
      const alpha = 66 + Math.round(e.charge.time / BRUTE_WINDUP * 52);
      const point = (forward: number, side: number) => ({ x: e.x + dx * forward - dy * side, y: e.y + dy * forward + dx * side });
      const lane = [point(0, -radius), point(length, -radius), point(length, radius), point(0, radius)];
      polygon(g, lane, '#ea623f', alpha);
      for (let i = 0; i < lane.length; i++) {
        const from = lane[i], to = lane[(i + 1) % lane.length];
        line(g, from.x, from.y, to.x, to.y, '#f9a170', 1.6, alpha + 55);
      }
    }
    if (!e.operationBoss && e.hp < e.maxHp) { box(g, e.x - 22 * sc, e.y + 28 * sc, 44 * sc, 4, '#182629'); box(g, e.x - 22 * sc, e.y + 28 * sc, 44 * sc * Math.max(0, e.hp / e.maxHp), 4, '#bf7863'); }
    const slam = e.operationBoss === 'king' ? b.operationRun?.slam ?? 0 : 0;
    if (slam > 0) {
      const anticipation = Math.min(1, slam / 0.55);
      disc(g, e.x, e.y, 190, '#b74827', Math.round(24 + anticipation * 42));
      g.strokeColor = color('#f2a15b', Math.round(108 + anticipation * 103)); g.lineWidth = 2.6;
      g.circle(e.x, e.y, 190); g.stroke();
      const radius = slam < 0.55 ? 34 + anticipation * 151 : Math.min(190, 70 + (slam - 0.55) * 530);
      g.strokeColor = color('#ffd197', 185); g.lineWidth = 3;
      g.circle(e.x, e.y, radius); g.stroke();
    }
    if (e.windup > 0) {
      const radius = e.type === 'walker' ? 46 : 32;
      g.strokeColor = color('#e6a26a', 200); g.lineWidth = 2; g.circle(e.x, e.y, radius * sc); g.stroke();
      if (e.type !== 'walker' && !(e.type === 'boss' && b.apartment)) line(g, e.x, e.y, e.x + Math.cos(e.attackAngle) * 340, e.y + Math.sin(e.attackAngle) * 340, '#ce805d', 2, 95);
    }
    if (e.muzzle) {
      const angle = e.attackAngle, reach = e.operationBoss === 'leader' ? 47 : 36;
      const muzzle = { x: e.x + Math.cos(angle) * reach, y: e.y + Math.sin(angle) * reach };
      if (lineClear(e, muzzle, b.blockers)) {
        if (daylight) drawDaylightFlash(g, muzzle, angle, e.muzzle / 0.08, 27);
        else line(g, muzzle.x, muzzle.y, muzzle.x + Math.cos(angle) * 15, muzzle.y + Math.sin(angle) * 15, '#ffd18d', 3, Math.round(250 * e.muzzle / 0.08));
      }
    }
  }
  for (const ally of b.allies) {
    if (boarding || ally.hp <= 0 || b.evacuationDrive) continue;
    const allyPose = enemyPoses.get(ally.id), scale = allyPose?.scale ?? 1;
    if (allyPose && ally !== b.apartment?.engineer && !b.stage.operation) drawFeet(g, ally, ally.angle, scale, allyPose, 'military');
    if (!rasterOperator) drawPerson(g, ally, ally.angle, '#88b2ad', scale, true, ally.hit > 0);
    if (ally.hp < ally.maxHp) {
      box(g, ally.x - 16, ally.y + 26, 32, 3, '#182629');
      box(g, ally.x - 16, ally.y + 26, 32 * ally.hp / ally.maxHp, 3, '#72d2bd');
    }
    if (ally.muzzle > 0) {
      const angle = allyPose?.angle ?? ally.angle;
      const mount = ally === b.apartment?.engineer ? engineerMuzzle({ x: ally.x + (allyPose?.offsetX ?? 0), y: ally.y + (allyPose?.offsetY ?? 0) }, angle, scale)
        : weaponMount(ally, scale, rasterOperator, 0, allyPose).muzzle;
      const { x, y } = mount;
      if (lineClear(ally, mount, b.blockers)) {
        if (daylight) drawDaylightFlash(g, mount, angle, ally.muzzle / 0.09, 25);
        else {
          disc(g, x, y, 9, '#eca25b', Math.round(120 * ally.muzzle / 0.09));
          line(g, x, y, x + Math.cos(angle) * 16, y + Math.sin(angle) * 16, '#fff0bd', 3);
        }
      }
    }
  }
  for (const item of b.tacticalThrows) {
    if (item.kind === 'molotov' || item.survival && item.kind === 'flashbang') continue;
    if (item.kind === 'grenade' && grenadeArt) continue;
    const duration = TACTICAL_DEFINITIONS[item.kind].delay, t = Math.max(0, Math.min(1, 1 - item.delay / duration));
    const pose = item.kind === 'grenade' ? grenadeThrowPose(item) : undefined;
    const x = pose ? pose.x : item.origin.x + (item.x - item.origin.x) * t;
    const y = pose ? pose.y + pose.height : item.origin.y + (item.y - item.origin.y) * t + Math.sin(t * Math.PI) * 28;
    g.strokeColor = color(item.kind === 'grenade' ? '#ffa94f' : '#97eaff', 210); g.lineWidth = 2;
    g.circle(item.x, item.y, 9 + Math.sin(t * Math.PI) * 3); g.stroke();
    line(g, x - 5, y - 5, x, y, '#fff0be', 2); disc(g, x, y, 5, item.kind === 'grenade' ? '#e39b45' : '#c7f6ff');
  }
  for (const effect of b.tacticalEffects) {
    if (effect.survival && effect.kind === 'flashbang') continue;
    if ((effect.kind === 'grenade' || effect.kind === 'proximity-mine') && blastArt) continue;
    const definition = TACTICAL_DEFINITIONS[effect.kind], explosive = definition.damage > 0;
    const t = 1 - effect.life / effect.max, radius = definition.radius * Math.min(1, 0.15 + t * 1.4);
    const tint = explosive ? '#ff9b3d' : '#a9efff', alpha = Math.round((1 - t) * 220);
    // Ray-clipped sectors keep both effects from visually crossing cover.
    const points = Array.from({ length: 65 }, (_, i) => { const a = i / 64 * Math.PI * 2, r = rayDistance(effect, a, radius, b.blockers); return { x: effect.x + Math.cos(a) * r, y: effect.y + Math.sin(a) * r }; });
    polygon(g, points, tint, Math.round(alpha * (explosive ? 0.28 : 0.12)));
    if (explosive) for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2, r = rayDistance(effect, a, radius * (0.7 + (i % 3) * 0.1), b.blockers);
      line(g, effect.x + Math.cos(a) * r * 0.25, effect.y + Math.sin(a) * r * 0.25, effect.x + Math.cos(a) * r, effect.y + Math.sin(a) * r, '#ff7c26', 3, alpha);
    }
    for (let i = 1; i < points.length; i++) line(g, points[i - 1].x, points[i - 1].y, points[i].x, points[i].y, tint, explosive ? 4 : 2, alpha);
    disc(g, effect.x, effect.y, Math.max(2, (1 - t) * 12), explosive ? '#ffe5a4' : '#efffff', alpha);
  }
  const mutation = b.operationMutationFlash;
  if (mutation) {
    const energy = Math.min(1, mutation.life / 0.24);
    disc(g, mutation.x, mutation.y, 34 + (1 - energy) * 45, '#aacc8c', Math.round(160 * energy));
    disc(g, mutation.x, mutation.y, 29 * energy, '#edfac3', Math.round(210 * energy));
  }
  for (const f of b.particles) {
    if (f.kind === 'spit-splash') continue;
    if (f.kind === 'hit-blood' || f.kind === 'hit-fabric') continue;
    if (f.kind === 'air-case') {
      const alpha = Math.round(255 * Math.min(1, f.life / 0.14)), angle = f.rotation ?? 0;
      const dx = 3.1 * Math.cos(angle), dy = 3.1 * Math.sin(angle), y = f.y + (f.z ?? 0);
      line(g, f.x - dx, y - dy, f.x + dx, y + dy, '#7a4d2d', 3, alpha);
      line(g, f.x - dx, y - dy + 0.7, f.x + dx, y + dy + 0.7, '#edc475', 1.5, alpha);
      continue;
    }
    if (f.kind === 'air-dust') {
      const age = 1 - f.life / f.max;
      disc(g, f.x, f.y, 7 + age * 12, '#c9a887', Math.round(105 * (1 - age)));
      continue;
    }
    if (f.kind === 'air-chip') {
      box(g, f.x, f.y, 3, 2, '#e3c79a', Math.round(240 * f.life / f.max));
      continue;
    }
    const tint = f.kind === 'spark' ? '#e6bd71' : '#b79b6c';
    disc(g, f.x, f.y, f.size ?? (f.kind === 'spark' ? 2 : 3), tint, Math.round(f.life / f.max * 240));
  }
  for (const f of b.deathFragments) {
    const alpha = Math.round(Math.min(1, f.life / (f.kind === 'fall' ? .12 : .31)) * 242);
    const height = f.z ?? 0, size = f.size ?? 3, x = f.x, y = f.y + height * .58;
    const a = f.rotation ?? 0, c = Math.cos(a), s = Math.sin(a);
    const point = (along: number, across: number) => ({ x: x + (along * c - across * s) * size, y: y + (along * s + across * c) * size });
    if (f.kind === 'fall') {
      polygon(g, [point(-1.8, -.42), point(-.6, -.71), point(.66, -.8), point(1.18, -.39),
        point(1.16, .37), point(.39, .75), point(-.6, .65), point(-1.65, .45)], f.tint ?? '#58554b', alpha);
      const head = point(1.24, -.16);
      disc(g, head.x, head.y, size * .46, '#383831', alpha);
    } else if (f.kind === 'blood') {
      box(g, x - size * .35, y - size * .27, size * .7, size * .54, '#8c2730', alpha);
    } else {
      if (height > .5) disc(g, f.x, f.y, size * .76, '#241613', Math.round(alpha * .30));
      const gear = f.kind === 'gear';
      polygon(g, [point(-.98, -.25), point(-.56, -.62), point(.31, -.69), point(.84, -.27),
        point(.63, .33), point(.21, .66), point(-.71, .5)], gear ? f.tint ?? '#5d5748' : '#642d2b', alpha);
      polygon(g, [point(-.52, -.33), point(.38, -.42), point(.47, .04), point(-.29, .30)],
        gear ? '#a59872' : '#a25649', Math.round(alpha * .90));
    }
  }
  for (const shot of b.bullets) {
    if (shot.venom) {
      if (shot.venom === 'spit' ? venomArt?.glob : venomArt?.dart) continue;
      const factor = 12 / Math.hypot(shot.vx, shot.vy);
      line(g, shot.x, shot.y, shot.x - shot.vx * factor, shot.y - shot.vy * factor, '#a2cc55', shot.venom === 'spit' ? 4 : 2);
    } else if (shot.airSupport) {
      const factor = Math.min(24, shot.traveled ?? 0) / Math.hypot(shot.vx, shot.vy);
      const dx = shot.vx * factor, dy = shot.vy * factor;
      line(g, shot.x, shot.y, shot.x - dx, shot.y - dy, '#9b531c', 4, 223);
      line(g, shot.x, shot.y, shot.x - dx * 0.83, shot.y - dy * 0.83, '#fff0b8', 1.8, 255);
    } else if (shot.hostile && !shot.firearm) { disc(g, shot.x, shot.y, 8, '#de8c61', 30); disc(g, shot.x, shot.y, 4, '#e8a36a'); }
    else {
      const trail = Math.min(daylight ? 0.039 : 0.023, (shot.traveled ?? Infinity) / Math.hypot(shot.vx, shot.vy));
      const dx = shot.vx * trail, dy = shot.vy * trail;
      if (daylight) {
        const dark = shot.hostile ? '#853821' : '#424942', core = shot.hostile ? '#ffb37d' : '#fff6d2';
        line(g, shot.x, shot.y, shot.x - dx, shot.y - dy, dark, 3, 95);
        line(g, shot.x, shot.y, shot.x - dx * 0.76, shot.y - dy * 0.76, dark, 4, 222);
        line(g, shot.x, shot.y, shot.x - dx * 0.62, shot.y - dy * 0.62, core, 1.9, 250);
      } else line(g, shot.x, shot.y, shot.x - dx, shot.y - dy, shot.hostile ? '#f1a477' : '#f3d59b', 2);
    }
  }
  const p = b.player;
  if (p.hp > 0 && !b.evacuationDrive && !boarding) {
    if (pose.rollFrame >= 0) { if (!rasterRoll) drawRoll(g, p, pose, b.hero.color); }
    else {
      if (b.heroId !== HEROINE_ID) drawFeet(g, p, p.angle, pose.scale, pose, rasterPlayer ? 'military' : 'plain');
      if (b.heroId !== HEROINE_ID || !rasterPlayer) drawPerson(g, { x: p.x + pose.offsetX, y: p.y + pose.offsetY }, pose.angle, b.hero.color, pose.scale, true, p.hit > 0, rasterPlayer);
    }
  }
  const pickup = b.pickup;
  if (pickup) {
    const { x, y } = pickup, glow = Math.round(110 + Math.sin(b.elapsed * 4) * 38);
    disc(g, x, y, 23, '#edbd59', 45); disc(g, x, y, 16, '#222a24', 215);
    g.strokeColor = color('#ffdc8f', 255); g.lineWidth = 3; g.circle(x - 4, y + 3, 4.5); g.stroke();
    line(g, x - 1, y, x + 9, y - 8, '#ffdc8f', 3); line(g, x + 5, y - 4, x + 9, y, '#ffdc8f', 2);
    g.strokeColor = color('#ffdc8f', glow); g.lineWidth = 1.5; g.circle(x, y, 22); g.stroke();
  }
  if (b.streetSupply) {
    const { x, y } = b.streetSupply;
    box(g, x - 12, y - 9, 24, 18, '#8d967e');
    outline(g, x - 12, y - 9, 24, 18, '#d7ceb4', 195);
    box(g, x - 5, y - 1, 10, 2, '#ede5d7');
    box(g, x - 1, y - 5, 2, 10, '#ede5d7');
  }
  const extraction = b.exitReady;
  const exit = b.stage.exit;
  if (b.stage.street && b.alarmTime !== null && b.alarmTime < 10.8) {
    const { x, y } = b.stage.street.alarm;
    const pulse = 0.5 + 0.5 * Math.cos(b.alarmTime * Math.PI * 4);
    for (const dx of [-64, 68]) {
      disc(g, x + dx, y - 7, 25, '#e65f3d', Math.round(pulse * 60));
      disc(g, x + dx, y - 7, 13, '#ee864b', Math.round(pulse * 136));
      disc(g, x + dx, y - 7, 4, '#ffd0a1', Math.round(pulse * 240));
    }
  }
  if ((b.stage.dorm || b.stage.street) && !extraction) return;
  if (b.stage.street) return;
  if (b.stage.stairFlight?.direction === 'down') {
    line(g, exit.x - 13, exit.y - 6, exit.x, exit.y + 5, '#b0c8b7', 2, 190);
    line(g, exit.x, exit.y + 5, exit.x + 13, exit.y - 6, '#b0c8b7', 2, 190);
    return;
  }
  outline(g, exit.x - 45, exit.y - 45, 90, 90, extraction ? '#a1cbb6' : '#647773', extraction ? 240 : 100);
  for (let i = 0; i < 3; i++) line(g, exit.x - 30, exit.y - 30 + i * 20, exit.x + 30, exit.y - 30 + i * 20, extraction ? '#a1cbb6' : '#647773', 2, 160);
}

/** Drawn above the character sprites, inside the same line-of-sight mask. */
export function drawHitBlood(g: Graphics, particles: readonly Particle[]) {
  for (const drop of particles) {
    if (drop.kind !== 'hit-blood' && drop.kind !== 'hit-fabric') continue;
    const { x, y, vx, vy } = drop;
    const size = drop.size ?? 3, cloth = drop.kind === 'hit-fabric';
    const alpha = Math.round(Math.min(1, drop.life / 0.14) * 249);
    const a = drop.rotation ?? 0, c = Math.cos(a) * size, s = Math.sin(a) * size;
    if (!cloth) line(g, x - vx * .023, y - vy * .023, x, y, '#a02330', size * .51, Math.round(alpha * .65));
    polygon(g, [{ x: x - c + s * .6, y: y - s - c * .6 }, { x: x + c + s * .5, y: y + s - c * .5 },
      { x: x + c - s * .7, y: y + s + c * .7 }, { x: x - c - s * .6, y: y - s + c * .6 }],
      cloth ? '#b9ad85' : '#812030', alpha);
    box(g, x - size * .23, y, size * .73, size * .48, cloth ? '#daceab' : '#d84b48', alpha);
  }
}

/** Drawn after body sprites so fire attaches to the actual barrel tip. */
export function drawWeaponEffects(g: Graphics, effects: WeaponEffects, mount: WeaponMount, flashAllowed: boolean, daylight = false) {
  g.clear();
  for (const shell of effects.casings) {
    const c = Math.cos(shell.angle), s = Math.sin(shell.angle), half = shell.shell ? 3.3 : 2.2;
    const alpha = Math.round(Math.min(1, shell.life / 0.35) * 245), y = shell.y + shell.z * 0.35;
    line(g, shell.x - c * half, y - s * half, shell.x + c * half, y + s * half, shell.shell ? '#b64e38' : '#c29a4e', shell.shell ? 2.3 : 1.6, alpha);
    line(g, shell.x, y, shell.x + c * half, y + s * half, '#f0d994', 0.8, alpha);
  }
  for (const puff of effects.smoke) {
    const progress = 1 - puff.life / puff.max, radius = puff.radius + progress * 7;
    disc(g, puff.x, puff.y, radius, '#a3aaa5', Math.round((1 - progress) ** 2 * 36));
    disc(g, puff.x + 1.5, puff.y + 1.5, radius * 0.65, '#c4c8bc', Math.round((1 - progress) ** 2 * 22));
  }
  if (!flashAllowed || effects.flash <= 0) return;
  if (daylight) {
    drawDaylightFlash(g, mount.muzzle, mount.angle, effects.flash, effects.heroId === HEROINE_ID ? 13 : effects.heroId === ENGINEER_ID ? 42 : 34);
    return;
  }
  const c = Math.cos(mount.angle), s = Math.sin(mount.angle), t = effects.flash;
  const at = (x: number, y: number) => ({ x: mount.muzzle.x + x * c - y * s, y: mount.muzzle.y + x * s + y * c });
  const length = (effects.heroId === HEROINE_ID ? 9 : effects.heroId === ENGINEER_ID ? 33 : 26) * (0.65 + 0.35 * t) * (0.88 + effects.shotCount % 3 * 0.09);
  const side = effects.shotCount % 2 ? 1 : -1;
  disc(g, mount.muzzle.x + c * 4, mount.muzzle.y + s * 4, 10 * t, '#eab05d', Math.round(t * 27));
  polygon(g, [at(0, -2), at(length * 0.22, -5 * side), at(length * 0.5, -3), at(length, side), at(length * 0.45, 3), at(length * 0.18, 5 * side), at(0, 2)], '#eea34b', Math.round(210 * t));
  polygon(g, [at(0, -1.4), at(length * 0.25, -2.5), at(length * 0.72, 0), at(length * 0.22, 2.2), at(0, 1.4)], '#fff0bd', Math.round(255 * Math.sqrt(t)));
  polygon(g, [at(0, -0.8), at(length * 0.37, 0), at(0, 0.8)], '#fffdf0', Math.round(255 * Math.sqrt(t)));
}

export function drawDoors(g: Graphics, doors: Door[], alarmTime: number | null = null, rasterLeaf: boolean | ((door: Door) => boolean) = false) {
  g.clear();
  for (const d of doors) {
    const c = Math.cos(d.angle), s = Math.sin(d.angle);
    const p = (x: number, y: number): Point => ({ x: d.x + x * c - y * s, y: d.y + x * s + y * c });
    const segment = (x: number, y: number, x2: number, y2: number, fill: string, width = 1) => { const a = p(x, y), b = p(x2, y2); line(g, a.x, a.y, b.x, b.y, fill, width); };
    disc(g, d.x, d.y, 8, '#a99e80'); disc(g, d.x, d.y, 3, '#364347');
    const jamb = { x: d.x + Math.cos(d.baseAngle) * d.length, y: d.y + Math.sin(d.baseAngle) * d.length };
    disc(g, jamb.x, jamb.y, 5, '#9a927c');
    if (d.alarm) {
      const x = jamb.x + 27, y = jamb.y;
      const flash = alarmTime !== null && Math.sin(alarmTime * 16) >= 0;
      if (flash) disc(g, x, y, 26, '#ff4026', 70);
      disc(g, x, y, 7, flash ? '#ffe0b9' : '#ad6149');
    }
    if (d.destroyed) {
      for (let i = 0; i < 7; i++) { const a = p(14 + i * 13, (i % 3 - 1) * 10); line(g, a.x, a.y, a.x + 10 - i, a.y + (i % 2 ? 8 : -7), '#79674c', 3); }
      continue;
    }
    const textured = typeof rasterLeaf === 'function' ? rasterLeaf(d) : rasterLeaf && d.material === 'wood';
    if (!textured) {
      const pts = rectCorners(doorShape(d));
      polygon(g, pts, d.hit > 0 ? '#dec9a1' : d.material === 'wood' ? '#94774e' : '#71888b');
      segment(5, -4, d.length - 4, -4, '#3b4139', 2);
      segment(5, 4, d.length - 4, 4, d.material === 'wood' ? '#cbb17b' : '#b2c6bf', 2);
      for (let x = 14; x < d.length - 10; x += d.material === 'wood' ? 24 : 13) segment(x, -3, x, 3, d.material === 'wood' ? '#5e563c' : '#485e65', 2);
      segment(d.length - 22, -7, d.length - 12, -7, '#d9d5b4', 3);
    }
    if (d.material === 'steel' && !d.fortification) { segment(22, -3, 36, 3, '#d5bb73', 3); segment(38, -3, 52, 3, '#24383d', 3); }
    else if (d.hp < d.maxHp * 0.76) {
      segment(38, -5, 50, 3, '#2a322b', 2); segment(50, 3, 59, -3, '#2a322b', 2);
      if (d.hp < d.maxHp * 0.4) { segment(72, 5, 63, -3, '#302e25', 2); segment(63, -3, 80, 1, '#302e25', 2); }
    }
    if (d.locked) { const lock = p(d.length - 16, 0); disc(g, lock.x, lock.y, 6, '#deab67'); disc(g, lock.x, lock.y, 2, '#543e33'); }
  }
}

