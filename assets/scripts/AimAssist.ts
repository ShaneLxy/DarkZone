// Pure mobile aim intent filter. Candidates must already pass strict visibility in Core.
export type AimCandidate = { id: number; angle: number };
const diff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export const AIM = { cone: 0.20, retain: 0.25, correction: 0.16, speed: 1.8, release: 0.48, sweepSpeed: 3.8, suppress: 0.22 } as const;
export class AimAssist {
  target?: number;
  private previous?: number;
  private offset = 0;
  private inhibit = 0;
  reset() { this.target = this.previous = undefined; this.offset = this.inhibit = 0; }
  step(dt: number, raw: number, facing: number, active: boolean, enabled: boolean, candidates: AimCandidate[]) {
    dt = Math.max(0.001, Math.min(dt, 0.05));
    this.inhibit = Math.max(0, this.inhibit - dt);
    if (!active) { this.target = this.previous = undefined; this.offset = 0; return { angle: facing, sweeping: this.inhibit > 0 }; }
    const delta = this.previous === undefined ? diff(raw, facing) : diff(raw, this.previous);
    const speed = Math.abs(delta) / dt;
    this.previous = raw;
    const held = candidates.find(c => c.id === this.target);
    const reversing = !!held && Math.abs(delta) > 0.045 && delta * diff(held.angle, facing) < 0;
    if (Math.abs(delta) > AIM.release || speed > AIM.sweepSpeed || reversing) {
      this.target = undefined; this.offset = 0; this.inhibit = AIM.suppress;
    }
    if (!enabled || this.inhibit > 0) { this.target = undefined; this.offset = 0; return { angle: raw, sweeping: this.inhibit > 0 }; }
    const eligible = candidates.filter(c => Math.abs(diff(c.angle, raw)) <= (c.id === this.target ? AIM.retain : AIM.cone));
    const target = eligible.find(c => c.id === this.target) ?? eligible.sort((a, b) => Math.abs(diff(a.angle, raw)) - Math.abs(diff(b.angle, raw)))[0];
    this.target = target?.id;
    const desired = target ? Math.max(-AIM.correction, Math.min(AIM.correction, diff(target.angle, raw))) : 0;
    this.offset += Math.max(-AIM.speed * dt, Math.min(AIM.speed * dt, desired - this.offset));
    return { angle: raw + this.offset, sweeping: false };
  }
}
