import type { Point, Rect } from './Core';
import type { TutorialStep } from './Tutorial';

export type GuideKind = 'move' | 'aim' | 'manual' | 'click-off' | 'click-on' | 'auto-aim';
export type GuideInput = { step: TutorialStep; player: Point; goal: Point; target: Point; auto: boolean; enabled: boolean; operating: boolean; frozen: boolean };
export type GuidePose = { kind: GuideKind; direction: Point; radius: number; flash: boolean; click: number; opacity: number; cycles: number; stopped: boolean };
const smooth = (t: number) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
export function guideKind(i: GuideInput): GuideKind {
  if (i.step === 'move') return 'move';
  if (i.step === 'aim') return 'aim';
  if (i.step === 'manual') return i.auto ? 'click-off' : 'manual';
  return !i.auto ? 'click-on' : !i.enabled ? 'click-off' : 'auto-aim';
}
/** Presentation only: never writes input, profile or tutorial state. */
export class TutorialGuide {
  elapsed = 0; idle = 1; opacity = 1;
  private step?: TutorialStep; private kind?: GuideKind;
  reset() { this.step = undefined; this.kind = undefined; this.elapsed = 0; this.idle = 1; this.opacity = 1; }
  advance(dt: number, i: GuideInput): GuidePose {
    const kind = guideKind(i);
    if (this.step !== i.step || this.kind !== kind) { this.reset(); this.step = i.step; this.kind = kind; }
    if (!i.frozen) {
      const delta = Math.max(0, dt);
      this.elapsed = Math.min(7.2, this.elapsed + delta);
      this.idle = i.operating ? 0 : this.idle + delta;
      this.opacity += ((this.idle < 0.55 ? 0.18 : 1) - this.opacity) * (1 - Math.exp(-delta * 12));
    }
    const stopped = this.elapsed >= 7.2, t = stopped ? 1.25 : this.elapsed % 2.4;
    const drag = t < .25 ? 0 : t < .95 ? smooth((t - .25) / .7) : t < 1.65 ? 1 : 1 - smooth((t - 1.65) / .55);
    const q = kind === 'move' ? i.goal : i.target, dx = q.x - i.player.x, dy = q.y - i.player.y, length = Math.hypot(dx, dy);
    return { kind, direction: length > .001 ? { x: dx / length, y: dy / length } : { x: 0, y: 1 },
      radius: drag * (kind === 'move' ? 35 : kind === 'manual' ? 43 : 22),
      flash: kind === 'manual' || kind === 'auto-aim' ? drag > .9 && (stopped || t % .32 < .18) : false,
      click: stopped ? 1 : .5 + .5 * Math.cos(t * Math.PI * 2 / 1.2), opacity: this.opacity,
      cycles: Math.min(3, Math.floor((this.elapsed + 1e-8) / 2.4)), stopped };
  }
}
export type GuideLayout = { body: Rect; anchor: Point; route: Point[] };
export function guideLayout(kind: GuideKind, hud: { move: Rect; fire: Rect; auto: Rect }): GuideLayout {
  const move = kind === 'move', click = kind === 'click-on' || kind === 'click-off';
  const body = move ? { x: 24, y: 250, w: 350, h: 180 } : { x: 916, y: 280, w: 340, h: 190 };
  const r = move ? hud.move : click ? hud.auto : hud.fire;
  const anchor = click ? { x: r.x + r.w + 3, y: r.y + r.h / 2 } : { x: r.x + r.w / 2, y: r.y + r.h + 7 };
  const route = click ? [{ x: body.x + body.w - 8, y: body.y }, { x: 1266, y: body.y - 14 }, { x: 1266, y: anchor.y }, anchor] : [{ x: Math.max(body.x + 20, Math.min(body.x + body.w - 20, anchor.x)), y: body.y }, anchor];
  return { body, anchor, route };
}
