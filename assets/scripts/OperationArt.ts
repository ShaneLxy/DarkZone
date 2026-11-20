import { OPERATION_BOARD_GATHER, OPERATION_BOARD_SLOT, OPERATION_DEPARTURE_SECONDS, OPERATION_PICKUP_READY, OPERATION_ROPE_FOOT } from './Operation';

export const OPERATION_GHOST_SIZE = 72;
export const OPERATION_SOLDIER_SIZE = { width: 53, height: 78 };
export const OPERATION_FORMATION_SECONDS = 13.5;
export const OPERATION_HANDOFF_SECONDS = 5.98;
export const OPERATION_APPROACH_SECONDS = 5.65;
export const OPERATION_COAST_LZ = { x: 523, y: 407 };
export const OPERATION_UNIT_ART = { width: 82, height: 102, anchorY: 0.33 };
export const OPERATION_LITTLEBIRD_ART = { width: 71, height: 170, rotorForward: 32 };
export function operationTakeoffAt(landing: number) {
  const progress = smoothFlight((landing - 5.08) / 2.3);
  return { x: -990 * progress, y: 625 * progress, bank: 39 * progress,
    scale: 1 + 0.18 * progress, visible: progress < 1 };
}

const smoothFlight = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
export function operationDescentAt(time: number) {
  const distance = smoothFlight(time / OPERATION_APPROACH_SECONDS);
  const near = smoothFlight((time - OPERATION_APPROACH_SECONDS) / 1.15);
  const touchdown = smoothFlight((time - OPERATION_APPROACH_SECONDS) / 2.4);
  return { distance, near, touchdown, airborneScale: 0.53 - distance * 0.26 };
}

export function operationExtractionAt(seconds: number, departure: number) {
  const approach = smoothFlight(seconds / 2.45);
  const hover = smoothFlight((seconds - 2.35) / 0.65);
  const leaving = Math.max(0, Math.min(1, departure / OPERATION_DEPARTURE_SECONDS));
  return { x: 1110 * (1 - approach) - 1230 * leaving ** 1.65 + 3 * hover * Math.sin(seconds * 3.2),
    y: 98 + 320 * (1 - approach) + 113 * leaving + 3 * hover * Math.cos(seconds * 3.5),
    bank: 78 * (1 - approach) + 90 * smoothFlight(leaving * 1.6), scale: 1.08 + 0.13 * (1 - approach) - leaving * 0.19,
    rope: smoothFlight((seconds - 2.47) / (OPERATION_PICKUP_READY - 2.47)) * (1 - smoothFlight(departure / 0.43)),
    foot: OPERATION_ROPE_FOOT,
  };
}

export function operationBoarderAt(time: number, index: number) {
  const seconds = time - OPERATION_BOARD_GATHER - index * OPERATION_BOARD_SLOT;
  return { gather: smoothFlight(time / OPERATION_BOARD_GATHER), walk: smoothFlight(seconds / 0.38),
    climb: smoothFlight((seconds - 0.34) / (OPERATION_BOARD_SLOT - 0.34)), visible: seconds < OPERATION_BOARD_SLOT };
}
const blackhawkWings = [
  { x: 373, y: 382, depart: 8.15, duration: 4.45, arc: -226, rise: -97, scale: 0.46 },
  { x: 895, y: 386, depart: 3.62, duration: 3.55, arc: 82, rise: 60, scale: 0.48 },
  { x: 245, y: 155, depart: 5.18, duration: 3.95, arc: -66, rise: 105, scale: 0.41 },
  { x: 1020, y: 156, depart: 1.85, duration: 3.4, arc: 62, rise: 148, scale: 0.43 },
];

/** Choreography in 1280 × 720 reference coordinates, with positive y up. */
export function operationFormationAt(time: number) {
  return [{ x: 640, y: 480, scale: 0.53, bank: 0 }, ...blackhawkWings.map(cue => {
    const elapsed = Math.max(0, Math.min(1, (time - cue.depart) / cue.duration));
    const progress = smoothFlight(elapsed);
    return { x: cue.x + (1540 - cue.x) * progress ** 1.35,
      y: cue.y + Math.sin(Math.PI * progress) * cue.arc + progress * cue.rise,
      scale: cue.scale * (1 - 0.16 * progress),
      bank: -59 * smoothFlight(elapsed / 0.31) };
  })];
}

export const OPERATION_FLYOVERS = [
  { craft: 'littlebird', x: 393, toX: 574, start: 0.72, duration: 1.72, landing: false, scale: 0.85 },
  { craft: 'blackhawk', x: 775, toX: 875, start: 6.05, duration: 2.55, landing: false, scale: 0.70 },
  { craft: 'littlebird', x: 476, toX: 625, start: 0.15, duration: 1.66, landing: true, scale: 0.92 },
  { craft: 'littlebird', x: 872, toX: 676, start: 2.04, duration: 1.94, landing: true, scale: 0.88 },
  { craft: 'littlebird', x: 633, toX: 835, start: 4.06, duration: 1.42, landing: true, scale: 0.94 },
] as const;

export const OPERATION_JETS = [
  { start: 2.56, duration: 0.56, x: 340, toX: 637, size: 1, shake: 16 },
  { start: 4.49, duration: 0.53, x: 790, toX: 986, size: 0.87, shake: 13 },
] as const;

export const OPERATION_RETURN_JETS = [
  { start: 3.25, duration: 0.55, x: 386, toX: 500, size: 0.90, shake: 9 },
  { start: 4.16, duration: 0.52, x: 780, toX: 719, size: 1, shake: 12 },
] as const;
export const OPERATION_IMPACT_SECONDS = 3.50;
export const OPERATION_STRIKE_FADE_SECONDS = 4.38;
export const OPERATION_STRIKE_END_SECONDS = 5.34;
export const OPERATION_STRIKE_GROUPS = [
  { delay: 0, shake: 15, spots: [
    { delay: 0, x: 38, y: 3, size: 150 }, { delay: .06, x: 53, y: -67, size: 96 },
    { delay: .14, x: 63, y: 91, size: 132 }, { delay: .23, x: 91, y: -130, size: 91 },
    { delay: .32, x: 107, y: 34, size: 141 }, { delay: .43, x: 111, y: 147, size: 83 },
  ] },
  { delay: .89, shake: 19, spots: [
    { delay: 0, x: 144, y: -86, size: 161 }, { delay: .05, x: 157, y: 20, size: 110 },
    { delay: .11, x: 187, y: 90, size: 174 }, { delay: .19, x: 204, y: -29, size: 158 },
    { delay: .25, x: 214, y: -152, size: 92 }, { delay: .34, x: 238, y: 140, size: 115 },
    { delay: .46, x: 259, y: 32, size: 121 },
  ] },
  { delay: 1.58, shake: 22, spots: [
    { delay: 0, x: 301, y: -84, size: 176 }, { delay: .08, x: 323, y: -14, size: 111 },
    { delay: .14, x: 344, y: 85, size: 202 }, { delay: .24, x: 390, y: -149, size: 109 },
    { delay: .32, x: 431, y: -35, size: 182 }, { delay: .38, x: 448, y: 151, size: 112 },
    { delay: .49, x: 475, y: 50, size: 154 },
  ] },
] as const;

export const OPERATION_STRIKE_FRAMES = [
  { id: 'strike-flash', delay: 0, duration: .17, rise: .025, from: .28, to: .58, alpha: 1 },
  { id: 'strike-flame', delay: .035, duration: .58, rise: .085, from: .49, to: 1.02, alpha: 1 },
  { id: 'strike-dust', delay: .15, duration: 1.41, rise: .23, from: .66, to: 1.46, alpha: .88 },
  { id: 'strike-smoke', delay: .47, duration: 2.72, rise: .56, from: .91, to: 1.68, alpha: .67 },
] as const;

export function operationStrikeFrame(age: number, frame: typeof OPERATION_STRIKE_FRAMES[number]) {
  const time = age - frame.delay;
  const growth = smoothFlight(time / frame.duration);
  return { scale: frame.from + (frame.to - frame.from) * growth,
    alpha: frame.alpha * smoothFlight(time / frame.rise) * (1 - smoothFlight((time - frame.rise) / (frame.duration - frame.rise))) };
}

export function operationJetFrame(landing: number, cue: (typeof OPERATION_JETS | typeof OPERATION_RETURN_JETS)[number], down = false) {
  const seconds = landing - cue.start;
  const progress = Math.max(0, Math.min(1, seconds / cue.duration));
  const pulse = seconds - cue.duration * 0.44;
  const tremor = pulse >= 0 && pulse < 0.78 ? cue.shake * (1 - pulse / 0.78) ** 1.8 : 0;
  return {
    jet: { x: cue.x + (cue.toX - cue.x) * progress, y: down ? 936 - progress * 1152 : -216 + progress * 1152 },
    angle: -Math.atan2(cue.toX - cue.x, down ? -1152 : 1152) * 180 / Math.PI,
    flying: seconds >= 0 && seconds <= cue.duration,
    pulse: seconds >= 0.12,
    shakeX: tremor * Math.cos(pulse * 69), shakeY: tremor * Math.cos(pulse * 94 + 0.8) * 0.62,
  };
}

// Fade the dry-sand edge into the ground beneath the shore sprite.
export const OPERATION_SHORE_STRIPS = [496, ...Array<number>(12).fill(12)].map((width, index) =>
  ({ id: 'op-coast-shore-' + index, x: index ? 496 + (index - 1) * 12 : 0, width,
    alpha: Math.round(255 * (1 + Math.cos(Math.PI * index / 12)) / 2) }));
export const OPERATION_ART = [
  ['radio-portraits', [['op-portrait-pilot', 0, 0, 256, 256], ['op-portrait-liaison', 256, 0, 256, 256]]],
  ['dialogue-portraits', [['op-portrait-two', 0, 0, 256, 256], ['op-portrait-three', 256, 0, 256, 256],
    ['op-portrait-four', 0, 256, 256, 256], ['op-portrait-rimelet', 256, 256, 256, 256]]],
  ['command-office-atlas', [
    ['op-office-desk', 40, 50, 458, 451], ['op-office-cabinet', 687, 71, 164, 436],
    ['op-office-board', 1032, 132, 477, 353], ['op-office-counter', 28, 608, 483, 314],
    ['op-office-bench', 548, 609, 441, 149], ['op-office-stool', 702, 751, 132, 193],
    ['op-office-tools', 1025, 631, 503, 279],
  ]],
  ['command-chapel-atlas', [
    ['op-chapel-pew', 26, 198, 572, 291], ['op-chapel-altar', 654, 125, 605, 409],
    ['op-chapel-column', 89, 712, 355, 425], ['op-chapel-runner', 497, 793, 757, 297],
  ]],
  ['flyover-f15', [['op-f15', 0, 0, 486, 652]]],
  ['gunner-variants', [['op-gunner-helmet', 0, 0, 256, 320], ['op-gunner-scarf', 256, 0, 256, 320]]],
  ['rimelet-classic-poses', [['op-rimelet-human', 0, 0, 256, 320], ['op-rimelet-injection', 256, 0, 256, 320], ['op-rimelet-mutated', 512, 0, 256, 320]]],
  ['littlebird-black', [['op-littlebird', 0, 0, 240, 576], ['op-littlebird-pod', 240, 0, 128, 128]]],
  ['littlebird-hud', [['op-littlebird-hud', 0, 0, 148, 192]]],
  ['rimelet-health-frame', [['op-rimelet-health', 0, 0, 1024, 62]]],
  ['coastal-district-atlas', [
    ['op-coast-home', 43, 57, 508, 541], ['op-coast-warehouse', 651, 120, 562, 437],
    ['op-coast-stall', 62, 720, 507, 467], ['op-coast-cargo', 679, 746, 515, 439],
  ]],
  ['coastal-shore', OPERATION_SHORE_STRIPS.map(({ id, x, width }) => [id, x, 0, width, 1280] as const)],
  ['coastal-sand-v2', [['op-coastal-sand', 0, 0, 512, 512]]],
  ['dusty-paving-v2', [['op-dusty-paving', 0, 0, 1200, 400]]],
  ['landing-dust-v2', [['op-landing-dust', 0, 0, 768, 512]]],
  ['coast', [['op-coast', 0, 0, 1672, 941]]],
  ['city', [['op-city', 0, 0, 1672, 941]]],
  ['street-ground', [['op-ground', 0, 0, 1672, 941]]],
  ['landing-field', [['op-field', 0, 0, 1672, 941]]],
  ['landing', [['op-landing', 0, 0, 1024, 1536]]],
  ['compound', [['op-compound', 0, 0, 1672, 941], ['op-floor', 35, 0, 840, 680]]],
  ['aircraft', [
    ['op-blackhawk', 270, 14, 256, 553],
    ['op-rotor', 185, 568, 422, 422],
  ]],
  ['actors-v2', [
    ['op-soldier', 90, 12, 329, 487], ['op-gunner', 598, 10, 335, 497], ['op-infected', 1087, 97, 394, 409],
    ['op-leader', 38, 607, 437, 353], ['op-inject', 550, 571, 429, 402], ['op-king', 1000, 531, 529, 455],
  ]],
  ['city-kit', [
    ['op-roof', 35, 82, 466, 378], ['op-stall', 564, 65, 404, 403], ['op-machinegun', 1043, 56, 431, 414],
    ['op-shelf', 40, 616, 437, 324], ['op-barrels', 627, 540, 278, 452], ['op-cot', 1082, 546, 417, 454],
  ]],
  ['props', [
    ['op-wall', 45, 219, 440, 119], ['op-sandbags', 564, 214, 415, 126], ['op-crates', 1096, 138, 362, 240],
    ['op-console', 68, 639, 392, 278], ['op-pickup', 651, 510, 232, 492], ['op-door', 1134, 685, 283, 167],
  ]],
  ['ending', [['op-aftermath', 0, 469, 1672, 472]]],
  ['airstrike-overhead', OPERATION_STRIKE_FRAMES.map(({ id }, i) =>
    [`op-${id}`, (i % 2) * 320, Math.floor(i / 2) * 320, 320, 320] as const)],
  ['airstrike-overhead-variants', OPERATION_STRIKE_FRAMES.map(({ id }, i) =>
    [`op-${id}-variant`, (i % 2) * 320, Math.floor(i / 2) * 320, 320, 320] as const)],
  ['effects', [
    ['op-cloud', 0, 0, 478, 480], ['op-smoke', 479, 0, 481, 480], ['op-impact', 968, 31, 441, 423],
  ]],
  ['leader-ak47', [
    ['op-leader-ak', 0, 0, 445, 962],
  ]],
  ['ground-tiles', [
    ['op-sand', 24, 24, 464, 464], ['op-pavement', 536, 24, 464, 464],
    ['op-indoor', 24, 536, 464, 464], ['op-ash', 536, 536, 464, 464],
  ]],
  ['ruins-kit', [
    ['op-crater', 40, 55, 440, 395], ['op-collapsed-roof', 545, 55, 435, 395],
    ['op-barricade', 40, 555, 440, 345], ['op-embers', 545, 555, 435, 345],
  ]],
  ['wall-kit', [
    ['op-wall-cap-left', 52, 194, 110, 153], ['op-wall-mid', 290, 194, 445, 153],
    ['op-wall-cap-right', 862, 194, 110, 153], ['op-roof-a', 55, 585, 245, 243],
    ['op-roof-b', 389, 585, 245, 243], ['op-roof-c', 724, 585, 244, 243],
  ]],
] as const;
