import { Graphics } from 'cc';
import { box, color, disc, line, outline, polygon } from './Art';
import type { GuideLayout, GuidePose } from './TutorialGuide';

/** Coordinates are design pixels. This layer has no Button, listeners or hit boxes. */
export function drawTutorialGuide(g: Graphics, pose: GuidePose, layout: GuideLayout) {
  g.clear();
  const { body: b, route } = layout, alpha = Math.round(255 * pose.opacity);
  const x = b.x - 640, y = b.y - 360;
  // An outlined narrow tail routes around the real fire plate when pointing at AUTO.
  for (let n = 1; n < route.length; n++) {
    const a = route[n - 1], z = route[n];
    line(g, a.x - 640, a.y - 360, z.x - 640, z.y - 360, '#8b9299', 7, alpha);
    line(g, a.x - 640, a.y - 360, z.x - 640, z.y - 360, '#08090b', 4, alpha);
  }
  const tip = route[route.length - 1], prev = route[route.length - 2];
  const a = Math.atan2(tip.y - prev.y, tip.x - prev.x), c = Math.cos(a), s = Math.sin(a);
  polygon(g, [{ x: tip.x - 640, y: tip.y - 360 }, { x: tip.x - 640 - c * 14 - s * 7, y: tip.y - 360 - s * 14 + c * 7 }, { x: tip.x - 640 - c * 14 + s * 7, y: tip.y - 360 - s * 14 - c * 7 }], '#d0d3d5', alpha);
  box(g, x, y, b.w, b.h, '#060709', Math.round(220 * pose.opacity));
  outline(g, x, y, b.w, b.h, '#8b9299', alpha);
  const cx = x + b.w / 2, cy = y + (pose.kind === 'move' ? 48 : 61);
  if (pose.kind === 'click-on' || pose.kind === 'click-off') {
    box(g, cx - 66, cy - 23, 132, 46, '#22272b', alpha);
    outline(g, cx - 66, cy - 23, 132, 46, '#adb6ba', alpha);
    g.strokeColor = color('#f8f8f3', Math.round(alpha * (.5 + pose.click * .5))); g.lineWidth = 3;
    g.circle(cx + 70, cy, 12 + pose.click * 10); g.stroke();
    polygon(g, [{ x: cx + 61, y: cy + 14 }, { x: cx + 65, y: cy - 5 }, { x: cx + 78, y: cy + 5 }], '#ffffff', alpha);
    return;
  }
  disc(g, cx, cy, 48, '#232a30', alpha);
  g.strokeColor = color('#909ca3', alpha); g.lineWidth = 2; g.circle(cx, cy, 48); g.stroke();
  if (pose.kind !== 'move') { g.circle(cx, cy, 30); g.stroke(); }
  if (pose.kind === 'manual' && pose.flash) { g.strokeColor = color('#f4ce85', alpha); g.lineWidth = 5; g.circle(cx, cy, 48); g.stroke(); }
  const d = pose.direction, r = Math.max(7, pose.radius), ex = cx + d.x * r, ey = cy + d.y * r;
  line(g, cx, cy, ex, ey, '#ffffff', 7, alpha);
  polygon(g, [{ x: ex + d.x * 12, y: ey + d.y * 12 }, { x: ex - d.x * 4 - d.y * 9, y: ey - d.y * 4 + d.x * 9 }, { x: ex - d.x * 4 + d.y * 9, y: ey - d.y * 4 - d.x * 9 }], '#ffffff', alpha);
  disc(g, cx + d.x * pose.radius, cy + d.y * pose.radius, 13, '#f3f4ef', Math.round(alpha * .8));
  if (pose.flash) {
    const fx = cx + 88, fy = cy + 9;
    polygon(g, [{ x: fx - 12, y: fy }, { x: fx, y: fy + 6 }, { x: fx + 5, y: fy + 20 }, { x: fx + 10, y: fy + 4 }, { x: fx + 23, y: fy }, { x: fx + 7, y: fy - 6 }, { x: fx, y: fy - 14 }], '#ffdd9a', alpha);
  }
}
