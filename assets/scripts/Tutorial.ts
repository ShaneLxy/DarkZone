import type { Point } from './Core';

export const TUTORIAL_SEED = 0x12d02;
export const TUTORIAL_STEPS = ['move', 'aim', 'manual', 'auto', 'done'] as const;
export type TutorialStep = typeof TUTORIAL_STEPS[number];
export function sanitizeTutorial(value: unknown, fallback: TutorialStep = 'done'): TutorialStep {
  return TUTORIAL_STEPS.includes(value as TutorialStep) ? value as TutorialStep : fallback;
}
/** A training target is deliberately not an Enemy and cannot award kills or clears. */
export class DormTutorial {
  readonly moveGoal: Point = { x: 306, y: 300 };
  readonly target: Point = { x: 470, y: 370 };
  manualHit = false;
  autoHit = false;
  autoEnabled = false;
  aimed = false;
  hits = 0;
  constructor(public step: TutorialStep) {}
  enableAuto(on: boolean) { if (on) this.autoEnabled = true; }
  observe(moved: boolean, aim: boolean) {
    if (aim) this.aimed = true;
    if (this.step === 'move' && moved) this.step = 'aim';
    if (this.step === 'aim' && this.aimed) this.step = 'manual';
    if (this.step === 'manual' && this.manualHit) this.step = 'auto';
    if (this.step === 'auto' && this.autoHit && this.autoEnabled) this.step = 'done';
  }
  hit(auto: boolean) {
    this.hits++;
    if (auto && this.autoEnabled) this.autoHit = true;
    if (!auto) this.manualHit = true;
  }
  hint(_mobile: boolean, auto: boolean, reason = '') {
    switch (this.step) {
      case 'move': return '1/4 拖动左侧摇杆，移动到地面圆圈';
      case 'aim': return '2/4 轻推右侧摇杆内圈，转向红色目标；不要开火';
      case 'manual': return auto ? '3/4 点击 AUTO OFF，再推动右侧摇杆外圈命中红色目标' : '3/4 推动右侧摇杆外圈，手动开火命中目标';
      case 'auto': return !auto ? '4/4 点击 AUTO ON，瞄准目标并等待自动射击命中' : !this.autoEnabled ? '4/4 点击 AUTO OFF 再 ON，轻推右侧摇杆瞄准红色目标' : reason ? `4/4 轻推右侧摇杆瞄准红色目标 · ${reason}` : '4/4 轻推右侧摇杆瞄准红色目标，等待自动射击命中';
      default: return '';
    }
  }
}
