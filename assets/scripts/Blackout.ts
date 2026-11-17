import { _decorator, AudioClip, AudioSource, Button, Camera, Canvas, Color, Component, EffectAsset, EventKeyboard, EventMouse, EventTouch, game, Game, Graphics, input, Input, KeyCode, Label, Layers, Mask, Material, Node, Rect as TextureRect, RenderTexture, ResolutionPolicy, resources, Size, Sprite, SpriteFrame, sys, Texture2D, UITransform, UIOpacity, Vec2, Vec3, Vec4, view } from 'cc';
import { ALLY_VISION_RANGE, angleDiff, APARTMENT_LINE_SECONDS, Battle, clamp, closestOnRect, DORM_LEVEL, grenadeLightPolygon, GRENADE_LIGHT_TIME, heroRating, heroStats, lineClear, MINIMAP_CELL_SIZE, peripheralRange, Profile, profileGrowth, rayDistance, readProfile, recruit, rectCorners, roomAt, SUPPLY_INFO, SupplyKind, TRAINING_CAP, TrainingKind, trainingCost, upgrade, visibilityPolygon } from './Core';
import { ENGINEER_ID, GHOST_ID, HERO_IDS, HEROINE_ID, heroes, type HeroId } from './Heroes';
import { box, color, disc, drawActors, drawAmbientAnimal, drawBloodStains, drawDoors, drawHitBlood, drawMap, drawParalysis, drawTutorialTarget, drawWeaponEffects, line, outline, palette as C, paralyzedModelPosition, polygon } from './Art';
import { TRAINING_ART, TRAINING_PROFILES, type TrainingImage } from './TrainingArt';
import { buyProduct, canStock, GEAR, GEAR_IDS, installMod, MAX_STOCK, ownedProduct, productPrice, PRODUCTS, PRODUCT_BY_ID, salvageMod, SHOP_TACTICALS, toggleGear, upgradeMod, upgradeWeapon, workshopMods, type ConsumableId, type GearId, type Product, type ProductId, type ShopCategory } from './Shop';
import { configuredHero, fitsWeapon, installedMods, MODS, MOD_STORAGE_CAP, modDescription, modRange, modText, modUpgradeCost, QUALITY_COLORS, QUALITY_NAMES, salvageValue, SLOT_NAMES, WEAPON_SLOTS, WEAPON_TYPES, weaponUpgradeCost, type Attachment, type ModId, type Quality } from './WeaponMods';
import { SHOP_ART, type ShopImage } from './ShopArt';
import { CASE_ART, type CaseImage } from './CaseArt';
import { BACKPACK_ART, type BackpackImage } from './BackpackArt';
import { BACKPACK_FILTERS, backpackDetails, backpackItems, type BackpackFilter, type BackpackItem } from './Backpack';
import { CASE_IDS, CASE_POOLS, CASE_ROLL_TIME, CASES, CLEAR_CASE_KEYS, DAILY_CASE_KEYS, casePrize, caseRollProgress, prepareCaseOpening, sampleCasePrize, type CaseId, type CaseOpening, type CasePrize, type DrawCount } from './LootCases';
import { ActorMotion, ActorPose, CombatFeedback, DARK_BRIGHTNESS, DARK_SATURATION, DOOR_LAMP_RADIUS, doorLampFlicker, FEATHER_PIXELS, VisibilityField, visibleSurfaces, WeaponEffects, weaponMount } from './Presentation';
import { claimDailyMilestone, claimDailyMission, dailyActivity, DAILY_MILESTONES, DAILY_MISSIONS, refreshDailyMissions } from './DailyMissions';
import { CHECK_IN_CHESTS, CHECK_IN_DAYS, CHECK_IN_REWARD_NAMES, checkInRewardText, checkInStatus, claimCheckInChest, claimCheckInDay, refreshCheckIn } from './CheckIn';
import { grenadePose, isShopMine, newTacticalLoadout, TACTICAL_DEFINITIONS, type TacticalKind } from './Tactical';
import { createApartmentRun, createDormRun, createStreet, type LevelDefinition } from './Levels';
import { AimAssist } from './AimAssist';
import { TUTORIAL_SEED } from './Tutorial';
import { FLOOR_DETAIL_ART, FLOOR_DETAIL_ATLAS, scatterFloorDetails, type FloorDetailKind } from './FloorDetails';
import { AmbientWildlife } from './AmbientWildlife';
import { CLUE_SPECS, closeReader, openReader, turnReader, type ReaderState } from './ClueReader';
import { TutorialGuide, guideLayout } from './TutorialGuide';
import { exitGuideAngle } from './ExitGuide';
import { drawTutorialGuide } from './TutorialGuideArt';
import { CAMPAIGN_ART, type CampaignImage } from './CampaignArt';
import { operationLevel, OPERATION_HEIGHT, OPERATION_LEADER, OPERATION_WIDTH } from './Operation';
import { OPERATION_ART } from './OperationArt';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_REWARDS, achievementScore, achievementState, claimAchievement, claimAchievementLevel, type AchievementCategory } from './Achievements';

const { ccclass, property } = _decorator;
const W = 1280, H = 720, SAVE_KEY = 'blackout.prototype.v1';
const trainingX = (x: number) => x * W / 1672;
const trainingY = (top: number) => H - top * H / 941;
const TRAINING_AXES = [
  { name: '生存', x: 1402, y: 396, lx: 1402, ly: 382 },
  { name: '输出', x: 1501, y: 465, lx: 1531, ly: 449 },
  { name: '隐蔽', x: 1462, y: 580, lx: 1518, ly: 595 },
  { name: '视野', x: 1340, y: 580, lx: 1289, ly: 595 },
  { name: '机动', x: 1304, y: 465, lx: 1269, ly: 449 },
] as const;
const ENVIRONMENT_LAYER = 1 << 10, ACTOR_LAYER = 1 << 11;
type Mode = 'menu' | 'chapters' | 'chapter-intro' | 'select-hero' | 'achievements' | 'missions' | 'checkin' | 'playing' | 'loading' | 'street-loading' | 'falling' | 'revive' | 'backpack' | 'roster' | 'training' | 'shop' | 'cases' | 'recruit' | 'settings' | 'help' | 'pause' | 'result' | 'operation-cinematic';
type OperationLine = readonly [speaker: string, text: string];
type StoryDialogueNodes = { node: Node; label: Label; portrait: Node };
const isChapterMenu = (mode: Mode) => mode === 'chapters' || mode === 'chapter-intro' || mode === 'select-hero';
const BAG_COLUMNS = 5, BAG_ROWS = 5, BAG_ROW_HEIGHT = 88, BAG_SWIPE_THRESHOLD = 36;
const BAG_GRID = { left: 303, right: 834, bottom: 110, top: 571 };
const WORKSHOP_PAGE_SIZE = 4;
const CASE_PITCH = 151, CASE_START = 4, CASE_STOP = 37, CASE_HOLD = 0.55;
type CaseRoll = { opening: CaseOpening; elapsed: number; track?: Node; closed?: UIOpacity; opened?: UIOpacity; cell: number; cards: Node[] };
const SHOP_CATEGORIES = [{ id: 'mod', label: '改装' }, { id: 'gear', label: '装备' }, { id: 'item', label: '道具' }] as const;
const FIXED_WEAPON_ART = { [HEROINE_ID]: 'fixed-usp', [GHOST_ID]: 'fixed-ar', [ENGINEER_ID]: 'fixed-shotgun' } as const;
type HitBox = { x: number; y: number; w: number; h: number; node: Node };
type DialogAction = { id: string; label: string; run: () => void; enabled?: boolean };
const DIALOG_SCALE = 0.5;
const CHARACTER_DIALOG_BACKGROUND_ALPHA = 170;
const DIALOG_WIDTH = 1671 * DIALOG_SCALE, DIALOG_HEIGHT = 941 * DIALOG_SCALE;
const DIALOG_BUTTONS = [[330, 734, 480, 116], [878, 734, 480, 116]] as const;
const usesDialog = (mode: Mode) => mode === 'pause' || mode === 'settings' || mode === 'result' || mode === 'revive' || mode === 'chapter-intro';
const CHAPTERS = {
  1: { name: '静默宿舍', location: '学校宿舍楼', x: 342, y: 449, side: 1, cast: [HEROINE_ID], locked: '', lines: ['从二楼寝室出发，寻找两把钥匙。', '下楼后穿过宿管室警报引来的尸群，从大门撤离。'] },
  2: { name: '归途', location: '学校东侧街区', x: 805, y: 373, side: 1, cast: [HEROINE_ID], locked: '通关「静默宿舍」后解锁。', lines: ['凛离开学校，沿街寻找回家的路。', '经过公交站后往北走，再向东转入住宅街。'] },
  3: { name: '归巢', location: '凛居住的公寓', x: 1017, y: 496, side: -1, cast: [HEROINE_ID], locked: '通关「归途」后解锁。', lines: ['凛回到停电的公寓，在一层遇见邻居维川。', '恢复应急供电，乘直达电梯回九层找家人。'] },
  4: { name: '断翼行动', location: '前传 · 北非沿岸', x: 639, y: 195, side: 1, cast: [GHOST_ID], locked: '通关「归巢」后解锁。', lines: ['感染爆发前，一支军方编队抵达北非沿岸。', '以「幽灵」为行动代号，攻入「阀」的指挥部，活捉首领。'] },
} as const;
type Chapter = keyof typeof CHAPTERS;
const FALL_DURATION = 0.54, GRAY_DURATION = 0.28, GRAY_HOLD = 0.09;
// The generated rows have different gaps. Each frame is anchored at the hips.
const FALL_SHEETS = {
  lin: { file: 'lin-downed-v4', cuts: [[0, 477, 944, 1536], [0, 430, 962, 1536]], pivots: [[300, 266], [770, 267], [1255, 264], [264, 240], [725, 242], [1246, 244]] },
  operator: { file: 'operator-downed-v1', cuts: [[0, 480, 990, 1536], [0, 465, 997, 1536]], pivots: [[305, 273], [819, 276], [1309, 273], [306, 265], [818, 265], [1293, 265]] },
} as const;
type FallFrame = { frame: SpriteFrame; width: number; anchorX: number; anchorY: number };
const HOME_ART = [
  'defaultBG', 'profile_panel', 'game_logo', 'resource_cash', 'resource_gems',
  'button_shop', 'button_equipment', 'button_character', 'button_settings', 'mode_survival', 'mode_challenge', 'mode_explore',
  'nav_daily_tasks', 'nav_checkin', 'nav_achievements',
] as const;
type HomeImage = typeof HOME_ART[number];
const CHECK_IN_PLATES = {
  card: [15, 108, 395, 533], active: [424, 106, 404, 538], special: [844, 108, 395, 533],
  check: [40, 770, 338, 348], track: [436, 908, 375, 69], fill: [856, 905, 373, 72],
} as const;
const CHECK_IN_ICONS = {
  coins: [44, 226, 237, 230], materials: [326, 199, 285, 281], tickets: [641, 232, 297, 216],
  'chest-olive': [14, 820, 284, 243], 'chest-blue': [329, 820, 283, 243],
  'chest-purple': [643, 820, 282, 243], 'chest-gold': [954, 820, 285, 243],
} as const;
type CheckInImage = 'panel' | 'badge' | 'shade' | keyof typeof CHECK_IN_PLATES | keyof typeof CHECK_IN_ICONS;
const HOME_CROPS: Partial<Record<HomeImage, readonly [number, number, number, number]>> = {
  profile_panel: [6, 4, 101, 97],
  resource_cash: [18, 7, 65, 59],
  resource_gems: [18, 8, 57, 58],
};
// The notification badges are baked into the top right of these textures.
const HOME_BADGES: Partial<Record<HomeImage, { width: number; height: number; cutX: number; cutY: number; mirrorX: number }>> = {
  button_shop: { width: 170, height: 146, cutX: 126, cutY: 38, mirrorX: 1 },
  button_equipment: { width: 169, height: 148, cutX: 125, cutY: 38, mirrorX: 0 },
};
// Each mode keeps its original proportions. These are the angles of its painted top edge.
const MODE_CARDS = [
  { id: 'start', art: 'mode_explore', title: '探索模式', width: 600, height: 207, top: 153, edgeAngle: 0.1 },
  { id: 'challenge', art: 'mode_challenge', title: '挑战模式', width: 601, height: 196, top: 310, edgeAngle: 1.4 },
  { id: 'survival', art: 'mode_survival', title: '生存模式', width: 602, height: 229, top: 460, edgeAngle: 1.9 },
] as const;
const MODE_EDGE_ANGLE = 5;
// mession.png supplies the small symbols. The panel, chest and buttons are separate art from main/.
const MISSION_ICONS = {
  clipboard: [0, 0, 98, 98], compass: [103, 0, 91, 86], skull: [199, 0, 91, 86], ammo: [295, 0, 91, 86],
} as const;
const MISSION_TEXTURES = { panel: 'mission-panel', chest: 'mission-chest', claim: 'mission-claim', go: 'mission-go' } as const;
type MissionImage = keyof typeof MISSION_ICONS | keyof typeof MISSION_TEXTURES;
const showsBattle = (mode: Mode, battleSettings = false) => mode === 'playing' || mode === 'loading' || mode === 'falling' || mode === 'revive' || mode === 'pause' || mode === 'result' || battleSettings && (mode === 'settings' || mode === 'help');
const LOWER_ART = [['lobby-floor', 'reception-floor-v1'], ['lobby-desk', 'desk-reception-v2'], ['lobby-sofa', 'sofa-reception-v2']] as const;
const STREET_ART = [
  ['street-props-v1', [
    ['street-bus', 5, 175, 534, 209], ['street-hatchback', 598, 156, 381, 226], ['street-wreck', 1033, 153, 483, 233],
    ['street-shelter', 4, 618, 525, 282], ['street-barrier', 555, 666, 346, 200], ['street-facade', 926, 639, 602, 228],
  ]],
  ['street-ground-v1', [
    ['asphalt', 3, 3, 621, 621], ['pavement', 630, 3, 621, 621],
    ['shop-tile', 3, 630, 621, 621], ['alley', 630, 630, 621, 621],
  ]],
  ['campus-gate-v1', [['campus-gate', 0, 0, 1774, 887]]],
  ['community-gate-v1', [['community-gate', 0, 0, 1774, 887]]],
] as const;
const APARTMENT_ART = [
  STREET_ART[0],
  ['apartment-engineer-flashlight-v3', [['engineer', 0, 0, 1536, 1024]]],
  ['apartment-engineer-shotgun-v3', [['engineer-shotgun', 0, 0, 1774, 887]]],
  ['apartment-portrait-v2', [['engineer-portrait', 240, 8, 720, 720]]],
  ['apartment-brute-v2', [['brute', 13, 130, 1060, 1010]]],
  ['apartment-brute-charge', [['brute-charge', 130, 150, 895, 1015]]],
  ['apartment-lobby-v2', [['apartment-reception', 66, 170, 596, 382], ['apartment-pingpong', 782, 78, 375, 533], ['apartment-meeting', 32, 702, 626, 445], ['apartment-planter', 699, 774, 539, 288]]],
  ['apartment-props', [['generator', 53, 52, 550, 515], ['lift', 679, 29, 568, 535], ['trap', 86, 710, 485, 414], ['shutter', 681, 640, 562, 541]]],
  ['apartment-floors', [['apartment-lobby', 2, 2, 880, 437], ['apartment-garage', 890, 2, 880, 437], ['apartment-hall', 2, 446, 880, 437], ['apartment-flat', 890, 446, 880, 437]]],
  ['apartment-ground-v2', [['apartment-parking', 2, 2, 764, 508], ['apartment-utility', 770, 2, 764, 508],
    ['apartment-residential', 2, 514, 764, 508], ['apartment-timber', 770, 514, 764, 508]]],
  ['apartment-parking-props-v1', [['garage-sedan', 35, 155, 451, 237], ['garage-suv', 534, 154, 484, 241],
    ['garage-column', 1167, 123, 236, 333], ['garage-stop', 39, 730, 441, 84],
    ['garage-generator', 525, 616, 486, 324]]],
  ['apartment-parking-markings-v1', [['parking-bay', 108, 77, 299, 386], ['parking-arrow', 568, 172, 390, 187],
    ['parking-stripe', 1054, 236, 450, 59], ['parking-warning', 34, 716, 445, 104],
    ['parking-grate', 545, 706, 446, 122], ['parking-b1', 1108, 635, 358, 290]]],
  ['apartment-shelf-overhead-v1', [['garage-shelf', 72, 153, 2028, 423]]],
  ['apartment-home-props-v1', [['home-living', 52, 137, 441, 312], ['home-bed', 561, 158, 358, 276],
    ['home-kitchen', 985, 218, 498, 158], ['home-bath', 64, 638, 413, 233], ['home-dining', 540, 647, 339, 205],
  ]],
  ['apartment-wall-caps-v1', [['garage-wall', 2, 2, 1532, 507], ['home-wall', 2, 514, 1532, 508]]],
  ['apartment-wood-door-v1', [['apartment-wood-door', 32, 299, 2110, 126]]],
] as const;
const STAIR_ATLAS = 'common/environment/dorm-stairs-v1/spriteFrame';
const BATTLE_ART = ['player_status', 'area_banner', 'mission_status', 'minimap_panel', 'weapon_ammo', 'button_settings', 'button_pause', 'joystick_move', 'joystick_fire', 'button_reload', 'button_roll', 'button_grenade', 'button_interact', 'button_pickup', 'button_trap'] as const;
type BattleImage = typeof BATTLE_ART[number] | 'joystick_move_base' | 'joystick_move_cap' | 'auto-background';
type HudAction = { id: string; root: Node; sprite?: Sprite; ring: Graphics; label: Label; remaining: () => number; duration: () => number; locked: boolean; previous: number; glow: number; scale: number; owners: Set<number>; progress: number };
// Reference coordinates use a top-left origin; UI/input use bottom-left design pixels.
const hudRect = (x: number, top: number, w: number, h: number) => ({ x: x * W / 1047, y: H - (top + h) * H / 589, w: w * W / 1047, h: h * H / 589 });
const HUD = {
  status: hudRect(10, 3, 272, 69), area: hudRect(310, 4, 425, 27), mission: hudRect(312, 35, 449, 23),
  settings: hudRect(935, 5, 44, 44), pause: hudRect(989, 5, 45, 44), map: hudRect(853, 56, 180, 102),
  move: hudRect(42, 391, 158, 160), ammo: hudRect(10, 103, 220, 70), fire: hudRect(877.5, 385, 133, 140), reload: hudRect(796, 417, 66, 66),
  auto: hudRect(877, 535, 115, 44),
  roll: hudRect(713.5, 478, 69, 70), grenade: hudRect(805.5, 498.5, 67, 67),
  door: hudRect(709, 392, 70, 70), pickup: hudRect(623, 392, 70, 70), trap: hudRect(627, 478, 69, 70),
};
const OBJECTIVE_BUTTON = { x: 24, y: 308, w: 54, h: 75 };
const OBJECTIVE_BUBBLE = { x: 85, y: 317, w: 352, h: 58 };

@ccclass('Blackout')
export class Blackout extends Component {
  @property(EffectAsset) visibilityEffect: EffectAsset | null = null;
  private canvas!: Node;
  private camera!: Camera;
  private world!: Node;
  private environment!: Node;
  private environmentCamera!: Camera;
  private actorCamera!: Camera;
  private environmentTarget!: RenderTexture;
  private actorTarget!: RenderTexture;
  private outputSprite!: Sprite;
  private outputFrame!: SpriteFrame;
  private visibilityTexture!: Texture2D;
  private presentationMaterial?: Material;
  private presentationReady = false;
  private visibilityField = new VisibilityField();
  private allyVisibilityField?: VisibilityField;
  private lastAllySight = '';
  private ghostPortrait?: SpriteFrame;
  private linPortrait?: SpriteFrame;
  private itemFrames = new Map<string, SpriteFrame>();
  private supplyUiFrames = new Map<string, SpriteFrame>();
  private supplySlotNodes: Node[] = [];
  private itemHudNodes = new Map<string, Node>();
  private lootNodes = new Map<number, Node>();
  private lootIcons = new Map<number, Node>();
  private lootBattle?: Battle;
  private lootLevel?: LevelDefinition;
  private suppliesOpen = false;
  private supplyPress?: { id: number; kind: SupplyKind; time: number; long: boolean; cancelled: boolean };
  private supplyTooltip = '';
  private intro?: { battle: Battle; node: Node; label: Label; time: number };
  private ghostRadio?: { battle: Battle; node: Node; label: Label; elapsed: number };
  private feedback = new CombatFeedback();
  private motion = new ActorMotion();
  private motionBattle?: Battle;
  private enemyMotions = new Map<number, ActorMotion>();
  private enemyPoses = new Map<number, ActorPose>();
  private weaponEffects = new WeaponEffects();
  private lastGeometry = -1;
  private hadGrenadeLight = false;
  private lastSightX = -10000; private lastSightY = -10000; private lastSightAngle = -10000;
  private hitAudioTime = 0;
  private litWorld!: Node;
  private wildlifeArt!: Graphics;
  private wildlife = new AmbientWildlife();
  private actors!: Graphics;
  private weaponArt!: Graphics;
  private bloodArt!: Graphics;
  private lastBloodBattle?: Battle;
  private lastBloodRevision = -1;
  private stencil!: Graphics;
  private doorsLit!: Graphics;
  private floors!: Graphics;
  private floorArt!: Node;
  private floorDetailsArt!: Node;
  private floorDetailFrames = new Map<FloorDetailKind, SpriteFrame>();
  private stairFrames = new Map<'up' | 'down', SpriteFrame>();
  private floorDetailNodes: Node[] = [];
  private detailedLevel?: LevelDefinition;
  private propsArt!: Node;
  private signsArt!: Node;
  private mapNodes: Node[] = [];
  private fixtures!: Graphics;
  private rasterProps = new Set<string>();
  private spriteLayer!: Node;
  private actorSprites = new Map<string, Sprite>();
  private pooledEnemySprites: Sprite[] = [];
  private artFrames = new Map<string, SpriteFrame>();
  private streetFrames = new Map<string, SpriteFrame>();
  private chapterLoad?: { chapter: 2 | 3 | 4; returnTo: Mode; time: number; done: number; total: number; failed: boolean };
  private operationCinema?: { root: Node; time: number; draw: (time: number) => boolean; finish: () => void };
  private operationDialogue?: StoryDialogueNodes & { lines: OperationLine[]; index: number; time: number; cinematic: boolean };
  private operationLeader?: Node;
  private fallFrames = new Map<keyof typeof FALL_SHEETS, FallFrame[]>();
  private fallTime = 0;
  private fallVariant = 0;
  private rollFrames: SpriteFrame[] = [];
  private trainingLayer?: Node;
  private backpackLayer?: Node;
  private backpackFrames = new Map<BackpackImage, SpriteFrame>();
  private backpackFilter: BackpackFilter = 'all';
  private backpackSelection?: string;
  private backpackRow = 0;
  private backpackMaxRow = 0;
  private backpackTouch?: { id: number; x: number; y: number; swiped: boolean };
  private shopLayer?: Node;
  private caseLayer?: Node;
  private caseFrames = new Map<CaseImage, SpriteFrame>();
  private selectedCase: CaseId = 'tactical';
  private casePreview?: { page: number; quality?: Quality };
  private caseRoll?: CaseRoll;
  private shopFrames = new Map<ShopImage, SpriteFrame>();
  private mineSprites: Sprite[] = [];
  private shopCategory: ShopCategory = 'mod';
  private shopQuality: Quality = 0;
  private shopFilter = '';
  private shopPage = 0;
  private shopProduct?: ProductId;
  private shopBack: 'menu' | 'training' | 'roster' = 'menu';
  private rosterHero: HeroId = HEROINE_ID;
  private rosterBack: 'menu' | 'training' | 'shop' | 'backpack' = 'menu';
  private rosterFocus?: GearId | ConsumableId;
  private trainingBack: 'menu' | 'backpack' = 'menu';
  private recruitBack: 'menu' | 'training' | 'shop' = 'menu';
  private trainingPortraitStage?: Node;
  private trainingPortrait?: Node;
  private trainingDetails?: Node;
  private trainingRadar?: { graphics: Graphics; scores: number[] };
  private trainingFlashLabels: [Label, Color][] = [];
  private trainingNoiseOpen = false;
  private trainingSwitch?: { target: HeroId; elapsed: number; swapped: boolean; outgoing?: Node; startX: number; endX?: number; fromScores?: number[]; queued?: HeroId };
  private trainingFrames = new Map<TrainingImage, SpriteFrame>();
  private trainingArtFailed = false;
  private hud!: Graphics;
  private homeBackdrop!: Node;
  private homeArtwork?: Node;
  private chapterMap?: Node;
  private achievementsLayer?: Node;
  private campaignFrames = new Map<CampaignImage, SpriteFrame>();
  private achievementCategory: AchievementCategory = 'all';
  private achievementPage = 0;
  private selectedChapter: Chapter = 1;
  private sortieHero: HeroId = HEROINE_ID;
  private missionLayer?: Node;
  private dialogArtwork?: Node;
  private dialogFrame?: SpriteFrame;
  private dialogClosePatch?: SpriteFrame;
  private battleArtwork?: Node;
  private battleFrames = new Map<BattleImage, SpriteFrame>();
  private objectiveFrame?: SpriteFrame;
  private objectiveNotice?: { battle: Battle; key: string; time: number; pinned: boolean; open: number };
  private objectiveHud?: { icon: Node; button: Node; bubble: Node; click: Node; label: Label; opacity: UIOpacity };
  private battleSticks: Node[] = [];
  private moveCap?: Node;
  private capOffset = { x: 0, y: 0 };
  private hudActions: HudAction[] = [];
  private battleSettings = false;
  private homeFrames = new Map<HomeImage, SpriteFrame>();
  private missionFrames = new Map<MissionImage, SpriteFrame>();
  private checkInFrames = new Map<CheckInImage, SpriteFrame>();
  private checkInLayer?: Node;
  private checkInBadge?: Node;
  private checkInPulse?: UIOpacity;
  private checkInClaimFeedback?: { day: number; chest: boolean; time: number; mark?: Node };
  private checkInShownDay = '';
  private checkInLoadError = false;
  private reader: ReaderState = { clueId: 'letter_alarm', page: 0, open: false };
  private readerFrames = new Map<string, SpriteFrame>();
  private readerAnimating = false;
  private readerClosing = false;
  private readerAnimationTime = 0;
  private readonly readerAnimationDuration = 0.24;
  private readerPanel?: Node;
  private readerOpacity?: UIOpacity;
  private homeButtonParts = new Map<HomeImage, readonly [SpriteFrame, SpriteFrame, SpriteFrame]>();
  private uiCrops: SpriteFrame[] = [];
  private modal!: Node;
  private modalArt!: Graphics;
  private labels = new Map<string, Label>();
  private mode: Mode = 'menu';
  private battle = new Battle(HEROINE_ID, 1, DORM_LEVEL);
  private lowerFloor?: LevelDefinition;
  private apartmentFloors?: LevelDefinition[];
  private apartmentEffects!: Graphics;
  private trapLayer!: Node;
  private grenadeLayer!: Node;
  private grenadeShadows!: Graphics;
  private grenadeFrame?: SpriteFrame;
  private grenadeBlastFrames: SpriteFrame[] = [];
  private grenadeSprites: Sprite[] = [];
  private apartmentDoors: Sprite[] = [];
  private getawaySprite?: Sprite;
  private doorArtBattle?: Battle;
  private doorArtStage?: LevelDefinition;
  private grenadeBlasts: { node: Node; stencil: Graphics; light: Graphics; sprite: Sprite; revision: number; effect?: Battle['tacticalEffects'][number]; points: { x: number; y: number }[]; debris: number[] }[] = [];
  private apartmentShutterSprite?: Sprite;
  private trapSprites: Sprite[] = [];
  private apartmentDialogue?: { node: Node; battle: Battle; text: Label; portrait: Sprite; lines: string[]; time: number };
  private transition?: { kind: 'enter' | 'win'; time: number; chapter?: Chapter; prompt?: 'first' | 'resume' | 'replay' | null };
  private transitionShade!: Graphics;
  private exitArrow!: Graphics;
  private streetStory?: { battle: Battle; node: Node; label: Label; portrait: Node; index: number; time: number };
  private streetStoryBattle?: Battle;
  private floorLoad?: { time: number; done: number; started: boolean; swapped: boolean; failed: boolean };
  private profile: Profile = readProfile(null);
  private guide = new TutorialGuide();
  private guideArt?: Graphics;
  private guideSession?: object;
  private clearGuide(reset = false) {
    if (this.guideArt) { this.guideArt.node.active = false; this.guideArt.node.destroy(); this.guideArt = undefined; }
    for (const id of ['tutorial-guide-copy', 'tutorial-guide-auto']) {
      const label = this.labels.get(id); if (label) { label.node.destroy(); this.labels.delete(id); }
    }
    if (reset) { this.guide.reset(); this.guideSession = undefined; }
  }
  private updateGuide(dt: number) {
    const t = this.battle.tutorial;
    if (!t || t.step === 'done' || !showsBattle(this.mode, this.battleSettings)) { this.clearGuide(true); return; }
    if (this.guideSession !== t) { this.guide.reset(); this.guideSession = t; }
    const frozen = this.mode !== 'playing' || !!this.tutorialPrompt;
    const v = this.movement();
    const operating = t.step === 'move' ? Math.hypot(v.x, v.y) > .12 : this.aiming && this.aimRadius > .08 || this.mouseFire;
    const pose = this.guide.advance(dt, { step: t.step, player: this.battle.player, goal: t.moveGoal, target: t.target,
      auto: this.profile.autoFire, enabled: t.autoEnabled, operating, frozen });
    if (frozen) { this.clearGuide(); return; }
    if (!this.guideArt) this.guideArt = this.graphics('Tutorial guide (visual only)', this.canvas);
    const layout = guideLayout(pose.kind, HUD), b = layout.body;
    drawTutorialGuide(this.guideArt, pose, layout);
    const copy = t.hint(true, this.profile.autoFire, this.battle.shootBlockReason());
    // Explicit line wrapping and a taller label avoid truncation on mobile.
    const split = copy.indexOf('，');
    const wrapped = split > 0 ? copy.slice(0, split + 1) + '\n' + copy.slice(split + 1) : copy;
    const label = this.text('tutorial-guide-copy', wrapped, b.x + b.w / 2, b.y + b.h - 37, 18, C.text, this.canvas, b.w - 24, Label.HorizontalAlign.CENTER);
    label.node.getComponent(UITransform)!.setContentSize(b.w - 24, 66);
    label.color = color(C.text, Math.round(255 * pose.opacity));
    const click = pose.kind === 'click-on' || pose.kind === 'click-off';
    const auto = this.text('tutorial-guide-auto', click ? `AUTO ${this.profile.autoFire ? 'ON → OFF' : 'OFF → ON'}` : '', b.x + b.w / 2, b.y + 61, 17, C.text, this.canvas, 180, Label.HorizontalAlign.CENTER);
    auto.color = color(C.text, Math.round(255 * pose.opacity));
  }
  private tutorialPrompt: 'first' | 'resume' | 'replay' | 'skip' | null = null;
  private replayTutorial = false;
  private tutorialSkipReturn: 'playing' | 'pause' = 'playing';
  private requestTutorialSkip() {
    if (this.tutorialPrompt || !this.battle.tutorial) return;
    this.tutorialSkipReturn = this.mode === 'pause' ? 'pause' : 'playing';
    this.tutorialPrompt = 'skip'; this.open('playing');
  }
  private cancelTutorialSkip() {
    if (this.tutorialPrompt !== 'skip') return;
    this.tutorialPrompt = null; this.open(this.tutorialSkipReturn);
  }
  private trainingHeroId: HeroId = HEROINE_ID;
  private trainingKind: TrainingKind = 'level';
  private trainingTab: 'growth' | 'workshop' = 'growth';
  private trainingSlot = 0;
  private trainingModPage = 0;
  private trainingMod?: number;
  private unlockedEngineer = false;
  private buttons: HitBox[] = [];
  private keys = new Set<KeyCode>();
  private mx = 900; private my = 430; private mouseFire = false;
  private mouseAimInput = false;
  private moveTouch = -1; private aimTouch = -1;
  private moveOrigin = { x: 155, y: 150 }; private aimOrigin = { x: 1105, y: 150 };
  private moveVector = { x: 0, y: 0 }; private aimVector = { x: 1, y: 0 };
  private aimRadius = 0; private aimOuter = false;
  private moving = false; private aiming = false;
  private lastFacing = 0.2;
  private aimAssist = new AimAssist();
  private sweeping = false;
  private uiTick = 0;
  private presentationTime = 0; private sightTick = 0;
  private notice = ''; private noticeTime = 0;
  private audio!: AudioSource;
  private clips = new Map<string, AudioClip>();
  private storageOkay = true;
  private lastDraw = '';
  private reward = { materials: 0, tickets: 0, coins: 0, keys: 0 };
  private tacticalChoice: TacticalKind = 'grenade';

  onLoad() {
    view.setDesignResolutionSize(W, H, ResolutionPolicy.SHOW_ALL);
    try {
      let migrated = false;
      this.profile = readProfile(sys.localStorage.getItem(SAVE_KEY), () => { migrated = true; });
      if (migrated) this.save();
    } catch { this.storageOkay = false; }
    this.battle = this.makeBattle();
    if (Layers.nameToLayer('BLACKOUT_ENV') < 0) Layers.addLayer('BLACKOUT_ENV', 10);
    if (Layers.nameToLayer('BLACKOUT_ACTORS') < 0) Layers.addLayer('BLACKOUT_ACTORS', 11);
    this.canvas = this.makeNode('Game Canvas', this.node, Layers.Enum.UI_2D);
    this.canvas.setPosition(W / 2, H / 2);
    const canvas = this.canvas.addComponent(Canvas);
    const cameraNode = this.makeNode('UI Camera', this.canvas);
    cameraNode.setPosition(0, 0, 1000);
    const camera = this.camera = cameraNode.addComponent(Camera);
    camera.projection = Camera.ProjectionType.ORTHO;
    camera.orthoHeight = H / 2; camera.near = 0; camera.far = 2000;
    camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
    camera.clearColor = color('#020509'); camera.visibility = Layers.Enum.UI_2D;
    canvas.cameraComponent = camera;
    this.createPresentation();
    this.environment = this.makeNode('Unified facility environment', this.canvas, ENVIRONMENT_LAYER);
    const bg = this.graphics('Facility blueprint background', this.environment);
    box(bg, -3000, -2200, 9000, 6200, '#0b1720');
    // Thin blueprint lines outside the building follow the reference's empty space.
    for (let x = -1000; x < 5800; x += 48) line(bg, x, -1000, x, 3800, '#25404b', 1, 95);
    for (let y = -1000; y < 3800; y += 48) line(bg, -1000, y, 5800, y, '#25404b', 1, 95);
    this.floors = this.graphics('Shared material floors', this.environment);
    this.floorArt = this.makeNode('Textured floor tiles', this.environment);
    this.floorDetailsArt = this.makeNode('Shared floor details', this.environment);
    this.bloodArt = this.graphics('Persistent blood only decals', this.environment);
    this.fixtures = this.graphics('Shared walls and furniture', this.environment);
    this.propsArt = this.makeNode('Raster furniture', this.environment);
    this.signsArt = this.makeNode('Room signs', this.environment);
    this.doorsLit = this.graphics('Shared physical door surfaces', this.environment);
    this.rebuildLevel();
    this.world = this.makeNode('Strictly visible combat layer', this.canvas, ACTOR_LAYER);
    const maskNode = this.makeNode('Line of sight', this.world);
    const mask = maskNode.addComponent(Mask); mask.type = Mask.Type.GRAPHICS_STENCIL;
    this.stencil = mask.subComp as Graphics;
    this.litWorld = this.makeNode('Visible combatants only', maskNode);
    this.apartmentEffects = this.graphics('Apartment mechanisms', this.litWorld);
    this.trapLayer = this.makeNode('Floor trap sprites', this.litWorld);
    this.wildlifeArt = this.graphics('Ambient wildlife', this.litWorld);
    this.wildlifeArt.node.active = false;
    this.actors = this.graphics('Combatants', this.litWorld);
    this.spriteLayer = this.makeNode('Sample character sprites', this.litWorld);
    this.weaponArt = this.graphics('Barrel flash smoke and ejected casings', this.litWorld);
    this.grenadeLayer = this.makeNode('Grenade particles', this.litWorld);
    this.grenadeShadows = this.graphics('Thrown grenade ground shadow', this.grenadeLayer);
    this.homeBackdrop = this.makeNode('Home background', this.canvas);
    const homeFill = this.graphics('Home backdrop fill', this.homeBackdrop);
    this.sbox(homeFill, 0, 0, W, H, C.ink);
    this.exitArrow = this.graphics('Nearby exit direction', this.canvas);
    this.hud = this.graphics('HUD', this.canvas);
    this.modal = this.makeNode('Panels', this.canvas);
    this.modalArt = this.graphics('Panel background', this.modal);
    this.transitionShade = this.graphics('Chapter transition shade', this.canvas);
    this.sbox(this.transitionShade, 0, 0, W, H, '#000000');
    this.transitionShade.node.addComponent(UIOpacity).opacity = 255;
    this.transitionShade.node.active = false;
    const audioNode = new Node('Combat audio');
    audioNode.parent = this.canvas;
    this.audio = audioNode.addComponent(AudioSource);
    for (const name of ['shoot', 'shoot-suppressed', 'hurt', 'dash', 'reload', 'hit', 'kill', 'win', 'alarm']) resources.load('audio/' + name, AudioClip, (err, clip) => { if (!err) this.clips.set(name, clip); });
    input.on(Input.EventType.KEY_DOWN, this.keyDown, this);
    input.on(Input.EventType.KEY_UP, this.keyUp, this);
    input.on(Input.EventType.MOUSE_MOVE, this.mouseMove, this);
    input.on(Input.EventType.MOUSE_DOWN, this.mouseDown, this);
    input.on(Input.EventType.MOUSE_UP, this.mouseUp, this);
    input.on(Input.EventType.TOUCH_START, this.touchStart, this);
    input.on(Input.EventType.TOUCH_MOVE, this.touchMove, this);
    input.on(Input.EventType.TOUCH_END, this.touchEnd, this);
    input.on(Input.EventType.TOUCH_CANCEL, this.touchEnd, this);
    game.on(Game.EVENT_HIDE, this.hide, this);
    this.open('menu');
    this.loadHomeArt();
    this.loadTrainingArt();
    this.loadShopArt();
    this.loadCaseArt();
    this.loadBackpackArt();
    this.loadMissionArt();
    this.loadCheckInArt();
    resources.load('home/dialog/spriteFrame', SpriteFrame, (err, frame) => {
      if (err || !this.isValid) return;
      frame.packable = false;
      this.dialogFrame = frame;
      this.dialogClosePatch = this.cropUiFrame(frame, 1388, 24, 122, 98);
      if (usesDialog(this.mode)) this.open(this.mode);
    });
    this.loadBattleArt();
    this.loadGrenadeArt();
    resources.load('art/ghost-radio-portrait/spriteFrame', SpriteFrame, (err, frame) => {
      if (!err && this.isValid) this.ghostPortrait = frame;
    });
    resources.load('art/lin-radio-portrait/spriteFrame', SpriteFrame, (err, frame) => { if (!err && this.isValid) this.linPortrait = frame; });
    resources.load('art/supplies-atlas-v1/spriteFrame', SpriteFrame, (err, frame) => {
      if (err || !this.isValid) return;
      const keys = ['ammo', 'bandage', 'medkit', 'drink', 'coins', 'bleed', 'healing', 'speed', 'rifle-ammo'];
      keys.forEach((key, i) => this.itemFrames.set(key, this.cropUiFrame(frame, i % 3 * 421, Math.floor(i / 3) * 415, 421, 415)));
    });
    resources.load('art/combat-ui-supply-v1/spriteFrame', SpriteFrame, (err, frame) => {
      if (err || !this.isValid) return;
      const pieces: Array<[string, number, number, number, number]> = [
        ['backpack', 22, 165, 380, 390], ['slot', 450, 165, 390, 390],
        ['rifle', 885, 265, 410, 190], ['shotgun', 1760, 275, 410, 170],
      ];
      for (const [id, x, y, width, height] of pieces) this.supplyUiFrames.set(id, this.cropUiFrame(frame, x, y, width, height));
      if (this.mode === 'playing') this.open('playing');
    });
    for (const asset of ['clues/paper', 'clues/pc']) resources.load(asset + '/spriteFrame', SpriteFrame, (err, frame) => { if (!err && this.isValid) this.readerFrames.set(asset, frame); });
    this.loadSampleArt();
    this.loadCampaignArt();
    this.loadFloorDetailArt();
    this.loadStairArt();
    this.loadFallArt();
    if (this.visibilityEffect) this.bindPresentation(this.visibilityEffect);
    else resources.load('effects/visibility', EffectAsset, (err, effect) => {
      if (!this.isValid) return;
      if (err) { console.error('Visibility effect failed to load', err); this.toast('视野效果加载失败，请重新启动预览'); return; }
      this.bindPresentation(effect);
    });
  }
  private createPresentation() {
    const target = (name: string) => { const rt = new RenderTexture(); rt.reset({ name, width: W, height: H }); rt.setFilters(Texture2D.Filter.LINEAR, Texture2D.Filter.LINEAR); return rt; };
    this.environmentTarget = target('Facility environment'); this.actorTarget = target('Visible combatants');
    const capture = (name: string, layer: number, texture: RenderTexture, priority: number, transparent: boolean) => {
      const n = this.makeNode(name, this.canvas); n.setPosition(0, 0, 1000);
      const camera = n.addComponent(Camera); camera.projection = Camera.ProjectionType.ORTHO;
      camera.near = 0; camera.far = 2000; camera.orthoHeight = H / 2; camera.priority = priority;
      camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
      camera.clearColor = transparent ? color('#000000', 0) : color('#0b1720');
      camera.visibility = layer; camera.targetTexture = texture; return camera;
    };
    this.environmentCamera = capture('Environment capture', ENVIRONMENT_LAYER, this.environmentTarget, -20, false);
    this.actorCamera = capture('Actor capture', ACTOR_LAYER, this.actorTarget, -10, true);
    this.visibilityTexture = new Texture2D();
    this.visibilityTexture.reset({ width: this.visibilityField.width, height: this.visibilityField.height, format: Texture2D.PixelFormat.RGBA8888 });
    this.visibilityTexture.setFilters(Texture2D.Filter.LINEAR, Texture2D.Filter.LINEAR);
    this.visibilityTexture.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
    this.visibilityTexture.uploadData(this.visibilityField.build([]));
    this.outputFrame = new SpriteFrame(); this.outputFrame.texture = this.environmentTarget; this.outputFrame.packable = false;
    const output = this.makeNode('Presented world', this.canvas);
    this.outputSprite = this.setupSprite(output, this.outputFrame, W, H);
    this.outputSprite.color = color('#465464');
  }
  private bindPresentation(effect: EffectAsset) {
    const material = new Material(); material.initialize({ effectAsset: effect, defines: { USE_LOCAL: false } });
    material.setProperty('actorsTexture', this.actorTarget);
    material.setProperty('visibilityTexture', this.visibilityTexture);
    material.setProperty('grading', new Vec4(DARK_BRIGHTNESS, DARK_SATURATION, 0, 0));
    this.presentationMaterial = material; this.outputSprite.customMaterial = material;
    this.outputSprite.color = color('#ffffff'); this.presentationReady = true; this.sightTick = 0;
  }
  private cropUiFrame(source: SpriteFrame, x: number, y: number, width: number, height: number) {
    const frame = source.clone();
    frame.packable = false;
    frame.rect = new TextureRect(x, y, width, height);
    frame.originalSize = new Size(width, height);
    frame.offset = new Vec2(0, 0);
    this.uiCrops.push(frame);
    return frame;
  }
  private loadCampaignArt() {
    let remaining = CAMPAIGN_ART.length;
    for (const asset of CAMPAIGN_ART) resources.load(`campaign/${asset.file}/spriteFrame`, SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      if (err) console.warn('Campaign artwork could not load:', asset.file, err);
      else {
        source.packable = false;
        if ('crops' in asset) {
          for (const [id, crop] of Object.entries(asset.crops)) {
            if (crop) this.campaignFrames.set(id as CampaignImage, this.cropUiFrame(source, ...crop));
          }
        } else this.campaignFrames.set(asset.image, source);
      }
      if (--remaining === 0 && (isChapterMenu(this.mode) || this.mode === 'achievements')) this.open(this.mode);
    });
  }
  private loadHomeArt() {
    let remaining: number = HOME_ART.length;
    for (const id of HOME_ART) resources.load('home/' + id + '/spriteFrame', SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      if (err) console.warn('Home artwork could not load:', id, err);
      else {
        source.packable = false;
        const crop = HOME_CROPS[id];
        const frame = crop ? this.cropUiFrame(source, ...crop) : source;
        const badge = HOME_BADGES[id];
        if (badge) {
          const { width, height, cutX, cutY, mirrorX } = badge;
          const right = width - cutX;
          this.homeButtonParts.set(id, [
            this.cropUiFrame(source, 0, 0, cutX, height),
            this.cropUiFrame(source, cutX, cutY, right, height - cutY),
            this.cropUiFrame(source, mirrorX, 0, right, cutY),
          ]);
        }
        this.homeFrames.set(id, frame);
        if (id === 'defaultBG') {
          const background = this.makeNode('defaultBG', this.homeBackdrop);
          // Cover the landscape canvas at the source image's aspect ratio.
          this.setupSprite(background, frame, H * 1672 / 941, H);
        }
      }
      if (--remaining === 0 && ['menu', 'missions', 'checkin', 'backpack', 'achievements'].includes(this.mode)) this.open(this.mode);
    });
  }
  private loadTrainingArt() {
    let pending = TRAINING_ART.length;
    for (const asset of TRAINING_ART) resources.load(`training/${asset.file}/spriteFrame`, SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      if (err) {
        this.trainingArtFailed = true;
        console.warn('Training artwork could not load:', asset.file, err);
      } else {
        source.packable = false;
        if ('crops' in asset) {
          for (const [key, crop] of Object.entries(asset.crops)) {
            if (crop) this.trainingFrames.set(key as TrainingImage, this.cropUiFrame(source, ...crop));
          }
        } else this.trainingFrames.set(asset.key, source);
      }
      if (--pending === 0 && (['menu', 'checkin', 'missions', 'roster', 'training', 'recruit', 'backpack', 'select-hero', 'achievements'].includes(this.mode) || this.mode === 'cases' && !this.caseRoll)) this.open(this.mode);
    });
  }
  private loadShopArt() {
    let remaining = SHOP_ART.length;
    for (const asset of SHOP_ART) resources.load(`shop/${asset.file}/spriteFrame`, SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      if (!err) {
        source.packable = false;
        if ('crops' in asset) {
          for (const [key, crop] of Object.entries(asset.crops)) if (crop) {
            this.shopFrames.set(key as ShopImage, this.cropUiFrame(source, ...crop));
          }
        } else this.shopFrames.set(asset.image, source);
      } else console.warn('Shop artwork could not load:', asset.file, err);
      if (--remaining === 0 && (['shop', 'roster', 'training', 'backpack', 'achievements'].includes(this.mode) || this.mode === 'cases' && !this.caseRoll)) this.open(this.mode);
    });
  }
  private loadCaseArt() {
    let remaining = CASE_ART.length;
    for (const asset of CASE_ART) resources.load(`cases/${asset.file}/spriteFrame`, SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      if (err) console.warn('Case artwork could not load:', asset.file, err);
      else {
        source.packable = false;
        if ('crops' in asset) for (const [key, crop] of Object.entries(asset.crops)) this.caseFrames.set(key as CaseImage, this.cropUiFrame(source, ...crop));
        else this.caseFrames.set(asset.image, source);
      }
      if (--remaining === 0 && (['shop', 'backpack', 'achievements'].includes(this.mode) || this.mode === 'cases' && !this.caseRoll)) this.open(this.mode);
    });
  }
  private loadBackpackArt() {
    let remaining = BACKPACK_ART.length;
    for (const asset of BACKPACK_ART) resources.load(`backpack/${asset.file}/spriteFrame`, SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      if (err) console.warn('Backpack artwork could not load:', asset.file, err);
      else {
        source.packable = false;
        if ('crops' in asset) {
          for (const [key, crop] of Object.entries(asset.crops)) {
            if (crop) this.backpackFrames.set(key as BackpackImage, this.cropUiFrame(source, ...crop));
          }
        } else this.backpackFrames.set(asset.image, source);
      }
      if (--remaining === 0 && ['menu', 'checkin', 'missions', 'backpack'].includes(this.mode)) this.open(this.mode);
    });
  }
  private loadMissionArt() {
    const textures = Object.keys(MISSION_TEXTURES) as Array<keyof typeof MISSION_TEXTURES>;
    const images = [...textures, 'icons'] as const;
    let remaining = images.length;
    for (const id of images) resources.load(`home/${id === 'icons' ? 'mission-ui' : MISSION_TEXTURES[id]}/spriteFrame`, SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      if (err) console.warn('Mission artwork could not load:', id, err);
      else {
        source.packable = false;
        if (id === 'icons') {
          for (const icon of Object.keys(MISSION_ICONS) as Array<keyof typeof MISSION_ICONS>) {
            const [x, y, width, height] = MISSION_ICONS[icon];
            this.missionFrames.set(icon, this.cropUiFrame(source, x, y, width, height));
          }
        } else this.missionFrames.set(id, source);
      }
      if (--remaining === 0 && this.mode === 'missions') this.open('missions');
    });
  }
  private loadCheckInArt() {
    const textures = [['panel', null], ['badge', null], ['plates', CHECK_IN_PLATES], ['rewards', CHECK_IN_ICONS]] as const;
    let remaining = textures.length as number;
    for (const [id, crops] of textures) resources.load(`home/checkin-${id}/spriteFrame`, SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      if (err) { this.checkInLoadError = true; console.warn('Check-in artwork could not load:', id, err); }
      else {
        source.packable = false;
        if (crops) {
          for (const [key, [x, y, w, h]] of Object.entries(crops)) this.checkInFrames.set(key as CheckInImage, this.cropUiFrame(source, x, y, w, h));
        } else if (id === 'panel' || id === 'badge') {
          this.checkInFrames.set(id, source);
          if (id === 'panel') this.checkInFrames.set('shade', this.cropUiFrame(source, 750, 652, 2, 2));
        }
      }
      if (--remaining === 0 && (this.mode === 'menu' || this.mode === 'checkin' || this.mode === 'backpack')) this.open(this.mode);
    });
  }
  private loadBattleArt() {
    resources.load('battle/button_objective/spriteFrame', SpriteFrame, (err, frame) => {
      if (!this.isValid || err) return;
      frame.packable = false;
      this.objectiveFrame = this.cropUiFrame(frame, 77, 74, 1100, 1100);
      if (this.objectiveHud) this.setupSprite(this.objectiveHud.icon, this.objectiveFrame, 52, 52);
    });
    const images: BattleImage[] = [...BATTLE_ART, 'joystick_move_base', 'joystick_move_cap'];
    let remaining = images.length;
    for (const id of images) resources.load('battle/' + id + '/spriteFrame', SpriteFrame, (err, frame) => {
      if (!this.isValid) return;
      if (err) console.warn('Battle artwork could not load:', id, err);
      else { frame.packable = false; this.battleFrames.set(id, frame); }
      if (--remaining === 0 && this.mode === 'playing') this.open('playing');
    });
  }
  private loadGrenadeArt() {
    resources.load('common/environment/grenade-throw-v1/spriteFrame', SpriteFrame, (err, frame) => {
      if (!err && this.isValid) this.grenadeFrame = this.cropUiFrame(frame, 179, 53, 1389, 799);
    });
    resources.load('common/environment/grenade-blast-v1/spriteFrame', SpriteFrame, (err, frame) => {
      if (err || !this.isValid) return;
      for (let i = 0; i < 6; i++) this.grenadeBlastFrames.push(this.cropUiFrame(frame, i % 3 * 512 + 8, Math.floor(i / 3) * 512 + 8, 496, 496));
    });
  }
  private updateMineArt() {
    let active = 0;
    for (const mine of this.battle.plantedMines) {
      const frame = this.shopFrames.get(mine.kind);
      if (!frame) continue;
      const sprite = this.mineSprites[active] ??= this.setupSprite(this.makeNode('Placed mine', this.trapLayer), frame, 31, 23);
      sprite.spriteFrame = frame;
      sprite.node.active = true;
      sprite.node.setPosition(mine.x, mine.y);
      sprite.node.angle = mine.angle * 180 / Math.PI;
      sprite.color = color(mine.delay > 0 ? '#a59077' : '#ffffff');
      active++;
    }
    for (let i = active; i < this.mineSprites.length; i++) this.mineSprites[i].node.active = false;
  }
  private updateGrenadeArt() {
    const b = this.battle, g = this.grenadeShadows, frame = this.grenadeFrame;
    g.clear();
    let thrown = 0;
    if (frame) for (const item of b.tacticalThrows) {
      if (item.kind !== 'grenade') continue;
      const pose = grenadePose(item.delay);
      const x = item.origin.x + (item.x - item.origin.x) * pose.travel;
      const y = item.origin.y + (item.y - item.origin.y) * pose.travel;
      const scale = 1 + pose.height * 0.008;
      disc(g, x + 2, y - 2, 8 + pose.height * 0.06, '#080909', Math.round(135 - pose.height * 2.2));
      const sprite = this.grenadeSprites[thrown] ??= this.setupSprite(this.makeNode('Airborne grenade', this.grenadeLayer), frame, 23, 13);
      thrown++;
      sprite.node.active = true;
      sprite.node.setPosition(x, y + pose.height);
      sprite.node.setScale(scale, scale, 1);
      sprite.node.angle = pose.spin + Math.atan2(item.y - item.origin.y, item.x - item.origin.x) * 180 / Math.PI;
    }
    for (let i = thrown; i < this.grenadeSprites.length; i++) this.grenadeSprites[i].node.active = false;

    let active = 0;
    for (const effect of b.tacticalEffects) {
      if (effect.kind !== 'grenade' || !this.grenadeBlastFrames.length) continue;
      let blast = this.grenadeBlasts[active];
      if (!blast) {
        const node = this.makeNode('Grenade exposure mask', this.grenadeLayer);
        const mask = node.addComponent(Mask);
        mask.type = Mask.Type.GRAPHICS_STENCIL;
        const light = this.graphics('Flash light and debris', node);
        const sprite = this.setupSprite(this.makeNode('Grenade explosion frame', node), this.grenadeBlastFrames[0], 184, 184);
        this.grenadeBlasts[active] = blast = { node, stencil: mask.subComp as Graphics, light, sprite, revision: -1, points: [], debris: [] };
      }
      active++;
      blast.node.active = true;
      blast.node.setPosition(effect.x, effect.y);
      if (blast.effect !== effect || blast.revision !== b.geometryRevision) {
        blast.effect = effect;
        blast.revision = b.geometryRevision;
        // The atlas fades to transparent before the outer stencil. Solid cover
        // can still cut through the texture at any distance from the blast.
        const radius = TACTICAL_DEFINITIONS.grenade.radius + 53;
        const cover = b.blockers.filter(rect => {
          const nearest = closestOnRect(effect, rect);
          return Math.hypot(nearest.x - effect.x, nearest.y - effect.y) <= radius;
        });
        const angles = Array.from({ length: 64 }, (_, i) => i / 64 * Math.PI * 2);
        for (const rect of cover) for (const corner of rectCorners(rect)) {
          if (Math.hypot(corner.x - effect.x, corner.y - effect.y) > radius * 1.6) continue;
          const angle = (Math.atan2(corner.y - effect.y, corner.x - effect.x) + Math.PI * 2) % (Math.PI * 2);
          angles.push(Math.max(0, angle - 0.001), angle, Math.min(Math.PI * 2, angle + 0.001));
        }
        angles.sort((a, b) => a - b);
        blast.points = angles.map(angle => {
          const reach = rayDistance(effect, angle, radius, cover);
          return { x: Math.cos(angle) * reach, y: Math.sin(angle) * reach };
        });
        blast.stencil.clear();
        polygon(blast.stencil, blast.points, '#ffffff');
        const damageRadius = TACTICAL_DEFINITIONS.grenade.radius;
        blast.debris = Array.from({ length: 13 }, (_, i) => rayDistance(effect, i / 13 * Math.PI * 2, damageRadius * (0.59 + (i % 4) * 0.102), cover));
      }
      const age = effect.max - effect.life;
      const phase = age < 0.045 ? 0 : age < 0.14 ? 1 : age < 0.24 ? 2 : age < 0.39 ? 3 : age < 0.70 ? 4 : 5;
      const size = 85 + 143 * (1 - Math.exp(-age * 12));
      blast.sprite.spriteFrame = this.grenadeBlastFrames[phase];
      blast.sprite.node.setScale(size / 184, size / 184, 1);
      blast.sprite.color = color('#ffffff', Math.round(255 * (1 - clamp((age - 0.32) / 0.73, 0, 1)) ** 0.75));
      const light = blast.light;
      light.clear();
      const flash = Math.max(0, 1 - age / 0.19);
      if (flash > 0) for (let layer = 0; layer < 8; layer++) {
        disc(light, 0, 0, 89 - layer * 9, '#f2a35b', Math.round((4 + layer * 3) * flash));
      }
      const debrisTime = Math.min(1, age / 0.38);
      if (debrisTime < 1) for (const [i, distance] of blast.debris.entries()) {
        const angle = i / 13 * Math.PI * 2;
        const travel = distance * (0.15 + 0.85 * debrisTime);
        const tail = Math.max(0, travel - Math.min(9, distance * 0.16));
        line(light, Math.cos(angle) * tail, Math.sin(angle) * tail, Math.cos(angle) * travel, Math.sin(angle) * travel,
          i % 3 === 0 ? '#ffcb87' : '#e27537', i % 3 === 0 ? 2 : 1, Math.round(230 * (1 - debrisTime)));
      }
    }
    for (let i = active; i < this.grenadeBlasts.length; i++) {
      this.grenadeBlasts[i].node.active = false;
      this.grenadeBlasts[i].effect = undefined;
    }
  }
  private battleSprite(id: BattleImage, rect: { x: number; y: number; w: number; h: number }) {
    const frame = this.battleFrames.get(id);
    if (!frame || !this.battleArtwork) return;
    const node = this.makeNode(id, this.battleArtwork);
    node.setPosition(rect.x + rect.w / 2 - W / 2, rect.y + rect.h / 2 - H / 2);
    this.setupSprite(node, frame, rect.w, rect.h);
    return node;
  }
  private loadFallArt() {
    for (const id of ['lin', 'operator'] as const) {
      const sheet = FALL_SHEETS[id];
      resources.load(`art/${sheet.file}/spriteFrame`, SpriteFrame, (err, source) => {
        if (err || !this.isValid) return;
        source.packable = false;
        this.fallFrames.set(id, sheet.pivots.map(([px, py], i) => {
          const row = Math.floor(i / 3), column = i % 3;
          const x = sheet.cuts[row][column], width = sheet.cuts[row][column + 1] - x;
          return { frame: this.cropUiFrame(source, x, row * 512, width, 512), width, anchorX: (px - x) / width, anchorY: 1 - py / 512 };
        }));
      });
    }
  }
  private loadSampleArt() {
    resources.load('art/desk-reception-v2/spriteFrame', SpriteFrame, (err, frame) => {
      if (!this.isValid || err) return;
      frame.packable = false;
      this.artFrames.set('lobby-desk', this.cropUiFrame(frame, 46, 138, 1582, 679));
      this.rebuildLevel();
    });
    const assets = [['operator', 'operator-raven-v1'], ['walker', 'enemy-walker-v1'], ['dormWalkers', 'dorm-walkers-v1'], ['roll', 'operator-roll-v2'], ['heroine', 'heroine-usp-v1'], ['heroineRoll', 'heroine-roll-v2'], ['dormKit', 'dorm-kit-v2'], ['corridor', 'dorm-corridor-floor-v1'], ['bedroom', 'dorm-bedroom-floor-v1']];
    const crop = (source: SpriteFrame, x: number, y: number, w: number, h: number) => {
      const frame = source.clone(); frame.packable = false; frame.rect = new TextureRect(x, y, w, h); frame.originalSize = new Size(w, h); frame.offset = new Vec2(0, 0); this.rollFrames.push(frame); return frame;
    };
    for (const [id, filename] of assets) resources.load('art/' + filename + '/spriteFrame', SpriteFrame, (err, frame) => {
      if (!this.isValid) return;
      if (err) { console.warn('Game art could not load:', filename, err); this.toast('素材加载失败，请刷新预览'); return; }
      frame.packable = false; this.artFrames.set(id, frame);
      if (id === 'roll' || id === 'heroineRoll') for (let i = 0; i < 3; i++) this.artFrames.set(id + '-' + i, crop(frame, i * 724, 0, 724, 724));
      if (id === 'dormWalkers') {
        const size = frame.originalSize.width / 2;
        for (let i = 0; i < 4; i++) this.artFrames.set('dorm-walker-' + i, crop(frame, (i % 2) * size, Math.floor(i / 2) * size, size, size));
      }
      if (id === 'dormKit') {
        const definitions: Array<[string, number, number, number, number]> = [['dorm-bed', 43, 183, 541, 287], ['study-desk', 673, 170, 536, 340], ['dorm-locker', 41, 818, 544, 285]];
        for (const [kind, x, y, w, h] of definitions) this.artFrames.set(kind, crop(frame, x, y, w, h));
      }
      if (id === 'corridor' || id === 'bedroom' || id === 'dormKit') this.rebuildLevel();
    });
  }
  private loadFloorDetailArt() {
    resources.load(FLOOR_DETAIL_ATLAS, SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      if (err) { console.warn('Floor detail art could not load:', err); return; }
      source.packable = false;
      for (const kind of Object.keys(FLOOR_DETAIL_ART) as FloorDetailKind[]) {
        const [x, y, w, h] = FLOOR_DETAIL_ART[kind].crop;
        this.floorDetailFrames.set(kind, this.cropUiFrame(source, x, y, w, h));
      }
      this.rebuildFloorDetails();
    });
  }
  private loadStairArt() {
    resources.load(STAIR_ATLAS, SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      if (err) { console.warn('Stair artwork could not load:', err); return; }
      source.packable = false;
      this.stairFrames.set('down', this.cropUiFrame(source, 148, 166, 558, 738));
      this.stairFrames.set('up', this.cropUiFrame(source, 829, 166, 568, 738));
      this.rebuildLevel();
    });
  }
  private rebuildFloorDetails() {
    const stage = this.battle.stage;
    if (!this.floorDetailFrames.size || this.detailedLevel === stage) return;
    this.detailedLevel = stage;
    for (const node of this.floorDetailNodes) { node.active = false; node.destroy(); }
    this.floorDetailNodes = [];
    for (const detail of scatterFloorDetails(stage)) {
      const node = this.makeNode('Floor detail ' + detail.kind, this.floorDetailsArt);
      node.setPosition(detail.x, detail.y); node.angle = detail.angle;
      const sprite = this.setupSprite(node, this.floorDetailFrames.get(detail.kind)!, detail.w, detail.h);
      sprite.color = color('#ffffff', FLOOR_DETAIL_ART[detail.kind].alpha);
      this.floorDetailNodes.push(node);
    }
  }
  private rebuildLevel() {
    for (const node of this.mapNodes) { node.active = false; node.destroy(); }
    this.mapNodes = [];
    this.apartmentDoors = [];
    this.getawaySprite = undefined;
    this.operationLeader = undefined;
    this.doorArtBattle = this.battle;
    this.doorArtStage = this.battle.stage;
    this.apartmentShutterSprite = undefined;
    const stage = this.battle.stage, upper = stage.dorm?.number === 2, lower = stage.dorm?.number === 1;
    this.rasterProps.clear(); this.floors.clear(); this.fixtures.clear(); this.bloodArt.clear(); this.lastBloodRevision = -1;
    this.rebuildFloorDetails();
    const operation = stage.operation;
    if (operation) {
      const terrain = (id: string, x: number, y: number, w: number, h: number, flipX = 1, flipY = 1) => {
        const node = this.makeNode(id, this.floorArt);
        node.setPosition(x, y);
        node.setScale(flipX, flipY, 1);
        const sprite = this.setupSprite(node, this.streetFrames.get(id)!, w, h);
        if (operation.part === 'defense') sprite.color = color('#ada69b');
        this.mapNodes.push(node);
      };
      const tileW = 1280, tileH = 960;
      for (let row = -1; row < OPERATION_HEIGHT / tileH + 1; row++) {
        for (let col = -1; col < OPERATION_WIDTH / tileW + 1; col++) {
          terrain('op-ground', (col + .5) * tileW, (row + .5) * tileH, tileW, tileH, col % 2 ? -1 : 1, row % 2 ? -1 : 1);
        }
      }
      if (operation.part !== 'compound') {
        terrain('op-field', 339, 711, 920, 680);
        terrain('op-landing', -367, 705, 493, 1140);
      }
      for (const interior of operation.interiors) {
        terrain('op-floor', interior.x + interior.w / 2, interior.y + interior.h / 2, interior.w, interior.h);
      }
      if (operation.part === 'compound') {
        const leader = this.operationLeader = this.makeNode('Command leader', this.spriteLayer);
        this.setupSprite(leader, this.streetFrames.get('op-leader')!, 59, 48);
        leader.setPosition(OPERATION_LEADER.x, OPERATION_LEADER.y);
        leader.angle = 90;
        this.mapNodes.push(leader);
      }
    } else drawMap(this.floors, 'floor', this.rasterProps, stage);
    const stairs = stage.stairFlight;
    const stairFrame = stairs && this.stairFrames.get(stairs.direction);
    if (stairs && stairFrame) {
      const node = this.makeNode('Stairs ' + stairs.direction, this.propsArt);
      node.setPosition(stairs.x + stairs.w / 2, stairs.y + stairs.h / 2);
      this.setupSprite(node, stairFrame, stairs.w, stairs.h);
      this.mapNodes.push(node);
    }
    for (const f of [...stage.furniture, ...(operation?.scenery ?? [])]) {
      const reversed = f.kind === 'garage-sedan-reverse' || f.kind === 'garage-suv-reverse';
      const art = f.kind === 'getaway-car' ? 'garage-suv' : f.kind === 'desk' ? 'lobby-desk' : f.kind === 'locker' || f.kind === 'cabinet' ? 'dorm-locker'
        : f.kind === 'sofa' && lower ? 'lobby-sofa' : reversed ? f.kind!.slice(0, -8) : f.kind;
      const frame = art && (this.streetFrames.get(art) ?? this.artFrames.get(art));
      if (!frame) continue;
      const node = this.makeNode('Prop ' + f.kind, this.propsArt); this.mapNodes.push(node);
      node.setPosition(f.x + f.w / 2, f.y + f.h / 2);
      const turn = f.h > f.w && !['apartment-pingpong', 'op-pickup', 'op-roof', 'op-cot', 'op-barrels'].includes(f.kind ?? '');
      const sprite = this.setupSprite(node, frame, turn ? f.h : f.w, turn ? f.w : f.h);
      sprite.trim = true;
      node.angle = (turn ? 90 : 0) + (reversed ? 180 : 0);
      if (f.kind === 'getaway-car') { this.getawaySprite = sprite; node.angle = -90; }
      this.rasterProps.add(f.kind + ':' + f.x + ':' + f.y);
    }
    if (!operation) drawMap(this.fixtures, 'fixtures', this.rasterProps, stage);
    const floor = stage.apartment?.part;
    const wallFrame = operation ? this.streetFrames.get('op-wall') :
      floor === 'garage' || floor === 'home' ? this.streetFrames.get(floor + '-wall') : undefined;
    if (wallFrame) for (const wall of stage.walls) {
      if (wall.kind === 'op-roof') continue;
      const vertical = wall.h > wall.w, length = vertical ? wall.h : wall.w, thickness = vertical ? wall.w : wall.h;
      const segments = Math.ceil(length / 390);
      for (let i = 0; i < segments; i++) {
        const step = length / segments, offset = (i + 0.5) * step;
        const node = this.makeNode('Textured apartment wall cap', this.propsArt);
        node.setPosition(wall.x + (vertical ? wall.w / 2 : offset), wall.y + (vertical ? offset : wall.h / 2));
        node.angle = vertical ? 90 : 0;
        this.setupSprite(node, wallFrame, step, thickness);
        this.mapNodes.push(node);
      }
    }
    const doorFrame = operation ? this.streetFrames.get('op-door') :
      floor === 'home' || floor === 'garage' ? this.streetFrames.get('apartment-wood-door') : undefined;
    if (doorFrame) for (const [index, door] of this.battle.doors.entries()) {
      if (door.material !== 'wood') continue;
      const node = this.makeNode('Apartment door leaf', this.propsArt);
      this.apartmentDoors[index] = this.setupSprite(node, doorFrame, door.length, door.thickness);
      this.mapNodes.push(node);
    }
    if (stage.apartment) for (const prop of stage.apartment.props) {
      const frame = this.streetFrames.get(prop.art);
      if (!frame) continue;
      const node = this.makeNode('Apartment ' + prop.art, this.propsArt);
      node.setPosition(prop.point.x, prop.point.y);
      const sprite = this.setupSprite(node, frame, prop.w, prop.h);
      if (prop.art === 'shutter' && stage.apartment.part === 'defense') { this.apartmentShutterSprite = sprite; node.active = !!this.battle.apartmentShutter; }
      this.mapNodes.push(node);
    }
    if (stage.street) {
      for (const gate of stage.street.gates) {
        const frame = this.streetFrames.get(gate.kind === 'school' ? 'campus-gate' : 'community-gate');
        if (!frame) continue;
        const node = this.makeNode('Gate ' + gate.kind, this.propsArt);
        node.setPosition(gate.x, gate.y);
        this.setupSprite(node, frame, gate.h, gate.w);
        node.angle = 90;
        this.mapNodes.push(node);
      }
      const facade = this.streetFrames.get('street-facade');
      if (facade) {
        const node = this.makeNode('Convenience store frontage', this.propsArt);
        node.setPosition(stage.street.facade.x, stage.street.facade.y);
        this.setupSprite(node, facade, 256, 62);
        this.mapNodes.push(node);
      }
      for (const r of stage.street.surfaces) {
        const frame = this.streetFrames.get(r.kind);
        if (frame) this.tileFloor(r, frame, r.kind === 'shop-tile' ? 300 : 384);
      }
    }
    for (const [i, r] of (operation ? [] : stage.rooms).entries()) {
      const bedroom = upper ? i >= 1 && i <= 3 : !lower && (i === 1 || i === 2);
      const frame = stage.apartment ? this.streetFrames.get('apartment-' + stage.apartment.floors[i]) : this.artFrames.get(lower && (i === 0 || i === 4 || i === 10) ? 'lobby-floor' : bedroom ? 'bedroom' : 'corridor');
      if (!stage.street && frame) this.tileFloor(r, frame, floor === 'garage' || floor === 'home' ? 480 : 384, floor === 'garage' || floor === 'home' ? 320 : 384);
      const n = this.makeNode('Area sign ' + i, this.signsArt); this.mapNodes.push(n);
      n.setPosition(r.x + r.w / 2, stage.street ? r.y + r.h - 35 : r.y + (i === 0 && upper ? 104 : 43));
      n.getComponent(UITransform)!.setContentSize(r.w - 24, 35); const label = n.addComponent(Label);
      label.string = r.kind || ''; label.fontSize = 19; label.isBold = true;
      label.color = color('#d6c7a6'); label.enableOutline = true; label.outlineColor = color('#555b56'); label.outlineWidth = 1;
      label.horizontalAlign = Label.HorizontalAlign.CENTER;
    }
    if (floor === 'home') for (const door of stage.doors) {
      const number = door.name.match(/^90[1-8]/)?.[0];
      if (!number) continue;
      const plaque = this.makeNode('Apartment number ' + number, this.signsArt);
      plaque.setPosition(door.x + door.length / 2, door.y + (door.y > stage.rooms[0].y ? -22 : 22));
      plaque.getComponent(UITransform)!.setContentSize(62, 20);
      const background = this.graphics('Number plate', plaque);
      box(background, -29, -9, 58, 18, '#24211e', 230);
      const lettering = this.makeNode('Unit number', plaque);
      lettering.getComponent(UITransform)!.setContentSize(62, 20);
      const label = lettering.addComponent(Label);
      label.string = number; label.fontSize = 14; label.isBold = true; label.color = color('#e5c995');
      this.mapNodes.push(plaque);
    }
    for (const decal of stage.apartment?.decals ?? []) {
      const frame = this.streetFrames.get(decal.art);
      if (!frame) continue;
      const node = this.makeNode('Floor marking ' + decal.art, this.floorArt);
      node.setPosition(decal.point.x, decal.point.y);
      node.angle = decal.angle ?? 0;
      const sprite = this.setupSprite(node, frame, decal.w, decal.h);
      sprite.color = color('#dad1bd', 195);
      this.mapNodes.push(node);
      if (!decal.label) continue;
      const plate = this.makeNode('Parking bay ' + decal.label, this.floorArt);
      plate.setPosition(decal.point.x, decal.point.y + (decal.angle ? 79 : -79));
      plate.getComponent(UITransform)!.setContentSize(60, 19);
      const label = plate.addComponent(Label);
      label.string = decal.label; label.fontSize = 12; label.isBold = true;
      label.color = color('#d5c6aa', 220);
      label.horizontalAlign = Label.HorizontalAlign.CENTER;
      this.mapNodes.push(plate);
    }
    if (stage.apartment?.glass || stage.apartment?.part === 'defense') {
      const lobby = this.graphics('Lobby floor details', this.floorArt);
      box(lobby, 926, 979, 160, 40, '#663837');
      outline(lobby, 930, 983, 152, 32, '#ad7b58', 155);
      const center = { x: 1015, y: 765 };
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        const point = (distance: number, width: number) => ({ x: center.x + Math.cos(angle) * distance - Math.sin(angle) * width, y: center.y + Math.sin(angle) * distance + Math.cos(angle) * width });
        polygon(lobby, [center, point(21, 9), point(i % 2 ? 35 : 55, 0), point(21, -9)], i % 2 ? '#9c8060' : '#a3906d', 175);
      }
      this.mapNodes.push(lobby.node);
    }
  }
  private tileFloor(r: { x: number; y: number; w: number; h: number }, frame: SpriteFrame, width: number, height = width) {
    const clip = this.makeNode('Floor texture', this.floorArt);
    clip.setPosition(r.x + r.w / 2, r.y + r.h / 2);
    this.mapNodes.push(clip);
    clip.getComponent(UITransform)!.setContentSize(r.w, r.h);
    clip.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    for (let y = -r.h / 2; y < r.h / 2; y += height) for (let x = -r.w / 2; x < r.w / 2; x += width) {
      const tile = this.makeNode('Floor tile', clip);
      tile.setPosition(x + width / 2, y + height / 2);
      this.setupSprite(tile, frame, width, height);
    }
  }
  private hasPlayerArt() { return this.artFrames.has(this.battle.heroId === HEROINE_ID ? 'heroine' : 'operator') && [0, HEROINE_ID].includes(this.battle.heroId); }
  private playerWeaponMount() {
    const pose = this.motion.pose;
    return weaponMount(this.battle.player, pose.scale, this.hasPlayerArt(), this.battle.heroId, pose);
  }
  private rollKey() { return (this.battle.heroId === HEROINE_ID ? 'heroineRoll-' : 'roll-') + this.motion.pose.rollFrame; }
  private setupSprite(node: Node, frame: SpriteFrame, width: number, height: number): Sprite {
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM; sprite.trim = false; sprite.spriteFrame = frame;
    node.getComponent(UITransform)!.setContentSize(width, height);
    return sprite;
  }
  private updateActorSprites() {
    const b = this.battle, active = new Set<string>();
    const brute = b.apartment && this.streetFrames.get('brute');
    if (this.operationLeader) this.operationLeader.active = b.sees(OPERATION_LEADER, 36);
    const nearby = b.enemies.filter(e => e.hp > 0 && (e.type === 'walker' || e.type === 'gunner' || e.type === 'boss' && !!brute) && (!(b.stage.street || b.stage.operation) || b.sees(e, 35)));
    const enemyIds = new Set(nearby.map(e => 'enemy-' + e.id));
    for (const [id, sprite] of this.actorSprites) if (id.startsWith('enemy-') && !enemyIds.has(id)) {
      sprite.node.active = false;
      this.pooledEnemySprites.push(sprite);
      this.actorSprites.delete(id);
    }
    const show = (id: string, frame: SpriteFrame, x: number, y: number, angle: number, hit: boolean, player = false, roll = false, scale = 1, operator = false) => {
      let sprite = this.actorSprites.get(id);
      if (!sprite) {
        sprite = id.startsWith('enemy-') ? this.pooledEnemySprites.pop() : undefined;
        if (sprite) sprite.node.name = 'Sprite-' + id;
        else sprite = this.setupSprite(this.makeNode('Sprite-' + id, this.spriteLayer), frame, 72, 72);
        this.actorSprites.set(id, sprite);
      }
      // The cached player node is shared across runs, including hero switches.
      const size = operator ? 82 : roll ? b.heroId === HEROINE_ID ? 64 : 70 : player ? b.heroId === HEROINE_ID ? 72 : 82 : 72;
      const transform = sprite.node.getComponent(UITransform)!;
      transform.setContentSize(size, size);
      transform.setAnchorPoint(operator ? 0.36 : roll ? 0.5 : player ? b.heroId === HEROINE_ID ? 0.25 : 0.36 : 0.42, 0.5);
      active.add(id); sprite.node.active = true;
      if (sprite.spriteFrame !== frame) sprite.spriteFrame = frame;
      sprite.node.setPosition(x, y); sprite.node.angle = angle * 180 / Math.PI;
      sprite.node.setScale(scale, scale, 1);
      sprite.color = color(hit ? '#ffd4b4' : '#ffffff');
      return sprite;
    };
    const player = this.artFrames.get(b.heroId === HEROINE_ID ? 'heroine' : 'operator'), walker = this.artFrames.get('walker');
    const pose = this.motion.pose, roll = this.artFrames.get(this.rollKey());
    if (b.player.hp > 0 && !b.evacuationDrive) {
      if (pose.rollFrame >= 0) { if (roll) show('player-roll', roll, b.player.x, b.player.y, pose.angle, b.player.hit > 0, true, true, pose.scale); }
      else if (player && [0, HEROINE_ID].includes(b.heroId)) show('player', player, b.player.x + pose.offsetX, b.player.y + pose.offsetY, pose.angle, b.player.hit > 0, true, false, pose.scale);
    } else if (this.fallTime > 0) {
      const index = this.fallTime < 0.13 ? 0 : this.fallTime < 0.31 ? 1 : 2;
      const falling = this.fallFrames.get(b.heroId === HEROINE_ID ? 'lin' : 'operator')?.[this.fallVariant * 3 + index];
      if (falling) {
        const sprite = show('player-fallen', falling.frame, b.player.x, b.player.y, b.player.angle, false);
        const transform = sprite.node.getComponent(UITransform)!;
        const scale = b.heroId === HEROINE_ID ? 0.15 : 0.16;
        transform.setContentSize(falling.width * scale, 512 * scale);
        transform.setAnchorPoint(falling.anchorX, falling.anchorY);
      }
    }
    const operator = this.artFrames.get('operator');
    if (!b.evacuationDrive && (operator || b.apartment)) for (const ally of b.allies) if (ally.hp > 0 || ally === b.apartment?.engineer) {
      const pose = this.enemyPoses.get(ally.id);
      const engineer = ally === b.apartment?.engineer;
      const armed = engineer && ally.hp > 0 && b.engineerArmed;
      const operationSoldier = b.stage.operation && this.streetFrames.get('op-soldier');
      const frame = operationSoldier || (engineer ? this.streetFrames.get(armed ? 'engineer-shotgun' : 'engineer') ?? operator : operator);
      if (frame) {
        const angle = (pose?.angle ?? ally.angle) + (operationSoldier ? -Math.PI / 2 : engineer && !ally.hp ? Math.PI / 2 : 0);
        const sprite = show('ally-' + ally.slot, frame, ally.x + (pose?.offsetX ?? 0), ally.y + (pose?.offsetY ?? 0), angle, ally.hit > 0 || ally.hp === 0, false, false, ally.hp === 0 ? 0.78 : pose?.scale ?? 1, !engineer);
        if (operationSoldier) {
          const transform = sprite.node.getComponent(UITransform)!;
          transform.setContentSize(45, 67); transform.setAnchorPoint(0.5, 0.32);
        } else if (engineer) {
          const transform = sprite.node.getComponent(UITransform)!;
          transform.setContentSize(armed ? 108 : 96, armed ? 54 : 64);
          transform.setAnchorPoint(armed ? 0.25 : 0.31, 0.5);
        }
      }
    }
    for (const e of nearby) {
      const model = paralyzedModelPosition(e, b.elapsed);
      const chargeFrame = e.charge && this.streetFrames.get('brute-charge');
      const opFrame = e.type === 'gunner' ? this.streetFrames.get('op-gunner') :
        b.stage.operation?.part === 'defense' ? this.streetFrames.get('op-infected') : undefined;
      const frame = opFrame || (e.type === 'boss' ? chargeFrame || brute : this.artFrames.get('dorm-walker-' + e.appearance) ?? walker);
      if (!frame) continue;
      if (opFrame) {
        const sprite = show('enemy-' + e.id, frame, model.x, model.y, e.angle - Math.PI / 2, e.hit > 0, false, false, this.enemyPoses.get(e.id)?.scale || 1);
        const transform = sprite.node.getComponent(UITransform)!;
        transform.setContentSize(e.type === 'gunner' ? 44 : 52, e.type === 'gunner' ? 66 : 54);
        transform.setAnchorPoint(0.5, 0.31);
        continue;
      }
      if (e.type === 'boss' && brute) {
        const pose = b.bruteStepPose(e);
        const charge = e.charge;
        const load = charge?.phase === 'windup' ? Math.min(1, charge.time / 0.78) : 0;
        const rush = charge?.phase === 'dash' ? charge.time / 0.58 : 0;
        const recover = charge?.phase === 'recover' ? Math.max(0, 1 - charge.time / 0.85) : 0;
        const shift = 10 * rush - 8 * load;
        const sprite = show('enemy-' + e.id, frame, model.x + Math.cos(e.angle) * shift, model.y + Math.sin(e.angle) * shift, e.angle + pose.lean * 0.055, e.hit > 0, false, false, 1.6);
        sprite.node.setScale(1.6 * (1 - pose.compression * 0.07 - load * 0.09 + rush * 0.12), 1.6 * (1 + pose.compression * 0.06 + load * 0.05 - rush * 0.07 + recover * 0.07), 1);
        const transform = sprite.node.getComponent(UITransform)!;
        if (chargeFrame) transform.setContentSize(66, 76);
        transform.setAnchorPoint(chargeFrame ? 0.44 : 0.39, 0.5);
      } else show('enemy-' + e.id, frame, model.x, model.y, e.angle, e.hit > 0, false, false, this.enemyPoses.get(e.id)?.scale || 1);
    }
    for (const [id, sprite] of this.actorSprites) if (!active.has(id)) sprite.node.active = false;
  }
  private makeNode(name: string, parent: Node, layer = parent.layer): Node {
    const n = new Node(name); n.layer = layer; n.parent = parent;
    n.addComponent(UITransform).setContentSize(W, H); return n;
  }
  private graphics(name: string, parent: Node) { return this.makeNode(name, parent).addComponent(Graphics); }
  private text(id: string, value: string, x: number, y: number, size = 18, fill = C.text, parent = this.modal, width = 650, align = Label.HorizontalAlign.LEFT): Label {
    let label = this.labels.get(id);
    if (!label) {
      const n = this.makeNode(id, parent); const t = n.getComponent(UITransform)!;
      t.setContentSize(width, size * 1.7); t.setAnchorPoint(align === Label.HorizontalAlign.CENTER ? 0.5 : align === Label.HorizontalAlign.RIGHT ? 1 : 0, 0.5);
      label = n.addComponent(Label); label.fontFamily = 'sans-serif'; label.fontSize = size; label.lineHeight = size * 1.4; label.horizontalAlign = align; label.verticalAlign = Label.VerticalAlign.CENTER; label.overflow = Label.Overflow.CLAMP;
      this.labels.set(id, label);
    }
    label.node.setPosition(x - W / 2, y - H / 2); label.color = color(fill);
    if (label.string !== value) label.string = value;
    return label;
  }
  private sbox(g: Graphics, x: number, y: number, w: number, h: number, fill: string, a = 255) { box(g, x - W / 2, y - H / 2, w, h, fill, a); }
  private soutline(g: Graphics, x: number, y: number, w: number, h: number, fill: string, a = 255) { outline(g, x - W / 2, y - H / 2, w, h, fill, a); }
  private sline(g: Graphics, x: number, y: number, x2: number, y2: number, fill: string, width = 1, a = 255) { line(g, x - W / 2, y - H / 2, x2 - W / 2, y2 - H / 2, fill, width, a); }
  private buildTutorialPrompt() {
    this.clearButtons(); this.modalArt.clear();
    this.modal.setSiblingIndex(9999);
    this.addButton('tutorial-blocker', 0, 0, W, H, () => {});
    if (this.tutorialPrompt === 'skip') {
      this.dialog('跳过教学？', [
        { id: 'tutorial-prompt-continue', label: '继续教学', run: () => this.cancelTutorialSkip() },
        { id: 'tutorial-prompt-skip-confirm', label: '跳过教学', run: () => { if (this.tutorialPrompt !== 'skip') return; this.tutorialPrompt = null; this.completeTutorial(true); } },
      ]);
      this.dialogText('tutorial-prompt-body', '跳过后将原地开始探索。', W / 2, 395, 23, 620);
      return;
    }
    const action = this.tutorialPrompt === 'replay' ? '重播教学' : this.tutorialPrompt === 'resume' ? '继续教学' : '开始教学';
    this.dialog(action + '？', [
      { id: 'tutorial-prompt-start', label: action, run: () => this.chooseTutorial(true) },
      { id: 'tutorial-prompt-skip', label: '直接探索', run: () => this.chooseTutorial(false) },
    ]);
    this.dialogText('tutorial-prompt-body', '在寝室里练习移动、瞄准和射击。', W / 2, 395, 23, 620);
  }
  private chooseTutorial(start: boolean) {
    if (!this.tutorialPrompt || this.tutorialPrompt === 'skip') return;
    this.replayTutorial = this.tutorialPrompt === 'replay';
    this.tutorialPrompt = null;
    this.profile.tutorialSeen = true;
    if (start) this.battle.beginTutorial(this.replayTutorial ? 'move' : this.profile.tutorial);
    else if (!this.replayTutorial) {
      this.profile.tutorialSkipped = true;
      this.profile.tutorial = 'done';
    }
    this.save(); this.open('playing');
    if (!start && this.battle.stage.dorm) this.toast('打开寝室北侧木门，沿长廊去东侧值班室');
  }
  private button(id: string, title: string, x: number, y: number, w: number, action: () => void, primary = false, enabled = true, h = 54, disabledNotice = '所需资源不足，继续战斗可获得奖励') {
    this.sbox(this.modalArt, x, y, w, h, primary ? C.gold : C.panel, enabled ? 255 : 120);
    this.soutline(this.modalArt, x, y, w, h, enabled ? primary ? '#e5c792' : C.line : '#28343b');
    this.text('button-' + id, title, x + w / 2, y + h / 2, 19, enabled ? primary ? '#18242a' : C.text : '#58676b', this.modal, w - 12, Label.HorizontalAlign.CENTER);
    this.addButton(id, x, y, w, h, enabled ? action : () => this.toast(disabledNotice));
  }
  private addButton(id: string, x: number, y: number, w: number, h: number, action: () => void,
    parent = id.startsWith('reader-') && this.readerLayer ? this.readerLayer : this.modal) {
    const node = this.makeNode('Button-' + id, parent);
    node.setPosition(x + w / 2 - W / 2, y + h / 2 - H / 2);
    node.getComponent(UITransform)!.setContentSize(w, h);
    const button = node.addComponent(Button);
    button.transition = Button.Transition.NONE;
    // Let Cocos hit-test the real UI node and emit one click on release.
    node.on(Button.EventType.CLICK, () => {
      if (this.transition) return;
      if (this.readerLayer && (!id.startsWith('reader-') || this.readerAnimating)) return;
      action();
    }, this);
    this.buttons.push({ x, y, w, h, node });
    return node;
  }
  private save() {
    if (!this.persist(this.profile)) this.toast('本次进度暂存在内存中，浏览器未能保存');
  }
  private persist(profile: Profile) {
    try { sys.localStorage.setItem(SAVE_KEY, JSON.stringify(profile)); return this.storageOkay = true; }
    catch { return this.storageOkay = false; }
  }
  private makeBattle(id: HeroId = HEROINE_ID, chapter: Chapter = 1) {
    this.apartmentFloors = undefined;
    if (chapter === 4) {
      this.lowerFloor = undefined;
      return new Battle(GHOST_ID, 1, operationLevel('city'));
    }
    const create = (hero: HeroId, level: LevelDefinition) =>
      new Battle(hero, this.profile.levels[hero], level, profileGrowth(this.profile, hero), this.profile.armory);
    if (chapter === 3) {
      this.apartmentFloors = createApartmentRun(Math.floor(Math.random() * 4294967296));
      this.lowerFloor = this.apartmentFloors[1];
      return create(HEROINE_ID, this.apartmentFloors[0]);
    }
    if (chapter === 2) {
      this.lowerFloor = undefined;
      const street = createStreet(Math.floor(Math.random() * 4294967296));
      return create(HEROINE_ID, street);
    }
    const [upper, lower] = createDormRun(this.profile.tutorial !== 'done' ? TUTORIAL_SEED : Math.floor(Math.random() * 4294967296));
    this.lowerFloor = lower;
    return create(id, upper);
  }
  private toast(s: string, duration = 3.4) { this.notice = s; this.noticeTime = duration; this.uiTick = 0; }
  private resetInput() { this.mouseAimInput = false; this.aimAssist.reset(); this.sweeping = false; this.lastFacing = this.battle.player.angle; this.keys.clear(); this.mouseFire = false; this.moveTouch = this.aimTouch = -1; this.moving = this.aiming = false; this.aimRadius = 0; this.aimOuter = false; this.moveVector = { x: 0, y: 0 }; }
  private closeReader() {
    if (!this.readerLayer || this.readerClosing) return;
    this.reader = closeReader(this.reader);
    this.readerClosing = true; this.readerAnimating = true; this.readerAnimationTime = 0;
    this.resetInput();
    for (const hit of this.buttons.filter(b => b.node.name.startsWith('Button-reader-'))) hit.node.active = false;
  }
  private readerLayer?: Node;
  private finishReaderClose() {
    for (const id of ['reader-title', 'reader-body', 'reader-page', 'reader-close-label', 'reader-prev-label', 'reader-next-label']) { this.labels.get(id)?.node.destroy(); this.labels.delete(id); }
    this.readerLayer?.destroy(); this.readerLayer = undefined; this.readerPanel = undefined; this.readerOpacity = undefined;
    this.buttons = this.buttons.filter(b => !b.node.name.startsWith('Button-reader-'));
    this.readerAnimating = this.readerClosing = false; this.readerAnimationTime = 0;
    this.resetInput();
  }
  private showReader(id: string) {
    const page = this.reader.open && this.reader.clueId === id ? this.reader.page : 0;
    if (this.readerLayer) this.finishReaderClose();
    this.reader = openReader(id); this.reader.page = page;
    this.readerAnimating = true; this.readerClosing = false; this.readerAnimationTime = 0;
    const layer = this.readerLayer = this.makeNode('Clue Reader', this.canvas);
    layer.setSiblingIndex(10000);
    const blocker = this.makeNode('Reader input shield', layer);
    blocker.getComponent(UITransform)!.setContentSize(W, H); blocker.addComponent(Button).transition = Button.Transition.NONE;
    blocker.on(Button.EventType.CLICK, () => {});
    const dim = this.graphics('Reader scene dim', layer);
    this.sbox(dim, 0, 0, W, H, '#050607', 214);
    const blockerButton = blocker.getComponent(Button)!;
    blockerButton.transition = Button.Transition.NONE;
    const panel = this.readerPanel = this.makeNode('Reader material panel', layer);
    panel.setPosition(0, 0); panel.setScale(0.12, 0.12, 1);
    const opacity = this.readerOpacity = panel.addComponent(UIOpacity);
    const mat = this.graphics('Reader material and text backing', panel);
    const clue = CLUE_SPECS.find(c => c.id === id)!;
    const imageWidth = clue.kind === 'letter' ? 330 : 650, imageHeight = clue.kind === 'letter' ? 586 : 650;
    if (this.readerFrames.has(clue.asset)) {
      const image = this.makeNode('Clue image', panel); image.setPosition(0, clue.kind === 'letter' ? 10 : 0);
      this.setupSprite(image, this.readerFrames.get(clue.asset)!, imageWidth, imageHeight);
    }
    // The art, local translucent overlay and copy share the animated Cocos root.
    const overlay = this.graphics('Clue translucent overlay', panel);
    const paper = clue.kind === 'letter';
    this.sbox(overlay, paper ? 505 : 426, paper ? 155 : 291, paper ? 270 : 436, paper ? 430 : 238, paper ? '#30291d' : '#061011', paper ? 174 : 218);
    const title = this.text('reader-title', clue.title, 640, paper ? 555 : 605, 26, C.gold, panel, 390, Label.HorizontalAlign.CENTER); title.fontFamily = 'KaiTi, STKaiti, KaiTi_GB2312, serif';
    const body = this.text('reader-body', clue.pages[this.reader.page], 640, paper ? 365 : 410, 22, '#fff0d5', panel, paper ? 252 : 408, Label.HorizontalAlign.CENTER); body.fontFamily = 'KaiTi, STKaiti, KaiTi_GB2312, serif'; body.lineHeight = 32; body.node.getComponent(UITransform)!.setContentSize(paper ? 252 : 408, paper ? 330 : 190);
    this.text('reader-page', clue.pages.length > 1 ? `${this.reader.page + 1} / ${clue.pages.length}` : '剧情档案', 640, 128, 17, C.gold, panel, 280, Label.HorizontalAlign.CENTER);
    this.text('reader-close-label', '关闭 · ESC', 938, 70, 20, C.text, panel, 150, Label.HorizontalAlign.CENTER);
    this.addButton('reader-close', 858, 46, 160, 48, () => this.closeReader());
    if (clue.pages.length > 1) {
      this.text('reader-prev-label', '‹ 上页', 540, 70, 20, C.text, panel, 120, Label.HorizontalAlign.CENTER);
      this.text('reader-next-label', '下页 ›', 710, 70, 20, C.text, panel, 120, Label.HorizontalAlign.CENTER);
      this.addButton('reader-prev', 480, 46, 120, 48, () => this.pageReader(-1));
      this.addButton('reader-next', 650, 46, 120, 48, () => this.pageReader(1));
    }
    opacity.opacity = 0; this.resetInput();
  }
  private pageReader(delta: number) {
    if (this.readerAnimating || !this.reader.open) return;
    this.reader = turnReader(this.reader, delta);
    const clue = CLUE_SPECS.find(c => c.id === this.reader.clueId)!;
    this.labels.get('reader-body')!.string = clue.pages[this.reader.page];
    this.labels.get('reader-page')!.string = `${this.reader.page + 1} / ${clue.pages.length}`;
    this.resetInput();
  }
  private stepReaderAnimation(dt: number) {
    if (!this.readerLayer || !this.readerAnimating) return;
    this.readerAnimationTime = Math.min(this.readerAnimationDuration, this.readerAnimationTime + dt);
    const progress = this.readerAnimationTime / this.readerAnimationDuration;
    const eased = this.readerClosing ? 1 - progress : 1 - (1 - progress) ** 3;
    const scale = 0.12 + eased * 0.88;
    if (this.readerPanel) this.readerPanel.setScale(scale, scale, 1);
    if (this.readerOpacity) this.readerOpacity.opacity = Math.round(255 * eased);
    if (progress >= 1) {
      this.readerAnimating = false;
      if (this.readerClosing) this.finishReaderClose();
    }
  }
  private clearButtons() {
    for (const button of this.buttons) { button.node.active = false; button.node.destroy(); }
    this.buttons = [];
  }
  private open(mode: Mode) {
    if (this.readerLayer) return;
    // A pending scene decision survives hide/pause requests. Only its actions
    // resolve it; unrelated menus must never silently accept or discard it.
    if (this.tutorialPrompt) mode = 'playing';
    if (mode === 'settings' && (this.mode === 'playing' || this.mode === 'pause')) this.battleSettings = true;
    if (mode !== 'settings' && mode !== 'help') this.battleSettings = false;
    if (this.reader.open || this.readerLayer) this.closeReader();
    this.clearGuide(!showsBattle(mode, this.battleSettings));
    this.mode = mode; this.resetInput(); this.sightTick = 0;
    if (this.operationDialogue && (mode === 'operation-cinematic' || mode === 'result' || mode === 'menu' ||
      mode === 'playing' && this.operationDialogue.cinematic)) this.clearOperationDialogue();
    if (this.operationCinema && mode !== 'operation-cinematic') {
      this.operationCinema.root.destroy();
      this.operationCinema = undefined;
    }
    if (!this.transition && mode !== 'result' && this.transitionShade) this.transitionShade.node.active = false;
    this.supplyPress = undefined; this.supplyTooltip = '';
    for (const kind of ['bandage', 'medkit', 'drink', 'healing', 'speed']) {
      const icon = this.itemHudNodes.get(kind);
      if (icon) icon.active = false;
    }
    const battleView = showsBattle(mode, this.battleSettings);
    this.exitArrow.node.active = mode === 'playing';
    if (this.battleArtwork) { this.battleArtwork.active = false; this.battleArtwork.destroy(); this.battleArtwork = undefined; }
    this.objectiveHud = undefined;
    this.battleSticks = []; this.moveCap = undefined; this.capOffset = { x: 0, y: 0 }; this.hudActions = []; this.supplySlotNodes = [];
    this.homeBackdrop.active = !battleView;
    this.outputSprite.node.active = battleView;
    this.environmentCamera.enabled = battleView;
    this.actorCamera.enabled = battleView;
    if (mode !== 'playing') { this.feedback.suspend(); this.motion.suspend(); this.weaponEffects.clear(); }
    if (this.homeArtwork) { this.homeArtwork.active = false; this.homeArtwork.destroy(); this.homeArtwork = undefined; }
    if (this.chapterMap) { this.chapterMap.active = false; this.chapterMap.destroy(); this.chapterMap = undefined; }
    if (this.achievementsLayer) { this.achievementsLayer.active = false; this.achievementsLayer.destroy(); this.achievementsLayer = undefined; }
    if (this.missionLayer) { this.missionLayer.active = false; this.missionLayer.destroy(); this.missionLayer = undefined; }
    if (this.checkInLayer) { this.checkInLayer.active = false; this.checkInLayer.destroy(); this.checkInLayer = undefined; }
    this.checkInBadge = undefined;
    this.checkInPulse = undefined;
    if (mode !== 'checkin') this.checkInClaimFeedback = undefined;
    if (this.dialogArtwork) { this.dialogArtwork.active = false; this.dialogArtwork.destroy(); this.dialogArtwork = undefined; }
    if (this.shopLayer) { this.shopLayer.active = false; this.shopLayer.destroy(); this.shopLayer = undefined; }
    if (this.caseLayer) { this.caseLayer.active = false; this.caseLayer.destroy(); this.caseLayer = undefined; }
    if (mode !== 'cases') this.casePreview = this.caseRoll = undefined;
    if (this.backpackLayer) { this.backpackLayer.active = false; this.backpackLayer.destroy(); this.backpackLayer = undefined; }
    this.backpackTouch = undefined;
    if (this.trainingLayer) {
      this.trainingLayer.active = false;
      this.trainingLayer.destroy();
      this.trainingLayer = this.trainingPortraitStage = this.trainingPortrait = this.trainingDetails = undefined;
      this.trainingRadar = this.trainingSwitch = undefined;
      this.trainingFlashLabels = [];
      if (mode !== 'training') this.trainingNoiseOpen = false;
    }
    this.clearButtons();
    for (const label of this.labels.values()) label.node.destroy(); this.labels.clear();
    this.modalArt.clear(); this.hud.clear(); this.uiTick = 0;
    if (mode === 'playing') { this.buildHud(); if (this.tutorialPrompt) this.buildTutorialPrompt(); return; }
    if (mode === 'menu' || mode === 'checkin' || mode === 'backpack') {
      this.refreshCheckInRewards();
      this.buildMenu();
      if (mode === 'checkin') { this.clearButtons(); this.buildCheckIn(); }
      if (mode === 'backpack') this.renderBackpack();
    }
    else if (isChapterMenu(mode)) this.buildChapterMap();
    else if (mode === 'missions') {
      this.buildMenu();
      this.clearButtons();
      this.buildMissions();
    }
    else if (mode === 'achievements') { this.buildMenu(); this.clearButtons(); this.buildAchievements(); }
    else if (mode === 'roster') this.buildRoster();
    else if (mode === 'training') this.buildTraining();
    else if (mode === 'shop') this.buildShop();
    else if (mode === 'cases') this.buildCases();
    else if (mode === 'recruit') this.buildRecruit();
    else if (mode === 'settings') this.buildSettings();
    else if (mode === 'help') this.buildHelp();
    else if (mode === 'pause') this.buildPause();
    else if (mode === 'revive') this.buildRevive();
    else if (mode === 'result') this.buildResult();
  }
  private panel(title: string, subtitle: string, back = () => this.open('menu')) {
    this.sbox(this.modalArt, 0, 0, W, H, C.ink, 224);
    this.sbox(this.modalArt, 104, 80, 1072, 560, C.panel, 245);
    this.soutline(this.modalArt, 104, 80, 1072, 560, C.line);
    this.sbox(this.modalArt, 104, 636, 1072, 4, C.gold);
    this.text('panel-title', title, 144, 590, 30);
    this.text('panel-subtitle', subtitle, 144, 548, 16, C.muted);
    this.button('close', '返回', 1052, 570, 84, back, false, true, 40);
  }
  private dialogText(id: string, value: string, x: number, y: number, size: number, width: number, fill = '#ffffff', outline = false) {
    const label = this.text(id, value, x, y, size, fill, this.modal, width, Label.HorizontalAlign.CENTER);
    label.isBold = true;
    if (outline) {
      label.enableOutline = true;
      label.outlineColor = color('#000000');
      label.outlineWidth = 2;
    }
    return label;
  }
  private dialog(title: string, actions: readonly [DialogAction, DialogAction], close?: () => void) {
    const x = (W - DIALOG_WIDTH) / 2, y = (H - DIALOG_HEIGHT) / 2;
    this.sbox(this.modalArt, 0, 0, W, H, '#08090b', 184);
    if (this.dialogFrame) {
      this.dialogArtwork = this.makeNode('Common dialog artwork', this.modal);
      this.setupSprite(this.dialogArtwork, this.dialogFrame, DIALOG_WIDTH, DIALOG_HEIGHT);
    } else {
      this.missionPlate(this.modalArt, x, y, DIALOG_WIDTH, DIALOG_HEIGHT, '#1c1b1a', '#9b7a4d', 15);
    }
    this.dialogText('dialog-title', title, W / 2, 506, 40, 640, '#ffd282', true);
    actions.forEach((action, index) => {
      const [left, top, width, height] = DIALOG_BUTTONS[index];
      const bx = x + left * DIALOG_SCALE, by = y + DIALOG_HEIGHT - (top + height) * DIALOG_SCALE;
      const bw = width * DIALOG_SCALE, bh = height * DIALOG_SCALE;
      if (!this.dialogFrame) this.missionPlate(this.modalArt, bx, by, bw, bh, index === 0 ? '#9b6a2d' : '#3d3b38', '#bba27f');
      const enabled = action.enabled !== false;
      this.dialogText('button-' + action.id, action.label, bx + bw / 2, by + bh / 2, 24, bw - 14, enabled ? '#ffffff' : '#aaa297', true);
      if (enabled) this.addButton(action.id, bx, by, bw, bh, action.run);
    });
    const closeX = x + 1510 * DIALOG_SCALE, closeY = y + DIALOG_HEIGHT - 122 * DIALOG_SCALE;
    if (close) {
      if (!this.dialogFrame) this.dialogText('dialog-close', '×', closeX + 28, closeY + 25, 32, 54, '#ffd282', true);
      this.addButton('close', closeX, closeY, 58, 50, close);
    } else if (this.dialogArtwork && this.dialogClosePatch) {
      const patch = this.makeNode('Dialog frame without close tab', this.dialogArtwork);
      patch.setPosition(closeX + 30.5 - W / 2, closeY + 24.5 - H / 2);
      this.setupSprite(patch, this.dialogClosePatch, 61, 49);
    }
  }
  private showChapter(chapter: Chapter) {
    this.selectedChapter = chapter;
    this.open('chapter-intro');
  }
  private campaignSprite(parent: Node, id: CampaignImage | SpriteFrame, x: number, y: number, w: number, h: number, fit = false) {
    const frame = typeof id === 'string' ? this.campaignFrames.get(id) : id;
    if (!frame) return;
    const node = this.makeNode('Campaign ' + (typeof id === 'string' ? id : 'artwork'), parent);
    node.setPosition(x - W / 2, y - H / 2);
    if (!fit) return this.setupSprite(node, frame, w, h);
    const { width, height } = frame.originalSize, scale = Math.min(w / width, h / height);
    return this.setupSprite(node, frame, width * scale, height * scale);
  }
  private campaignLabel(parent: Node, id: string, value: string, x: number, y: number, size: number, width: number,
    tint = '#f7e6c9', align = Label.HorizontalAlign.LEFT) {
    const label = this.text(id, value, x, y, size, tint, parent, width, align);
    label.isBold = true;
    label.enableOutline = true;
    label.outlineColor = color('#13100d');
    label.outlineWidth = 1.5;
    return label;
  }
  private buildChapterMap() {
    const root = this.chapterMap = this.makeNode('Exploration map', this.modal);
    root.setSiblingIndex(0);
    if (!this.campaignSprite(root, 'map', W / 2, H / 2, W, H)) this.sbox(this.graphics('Map background', root), 0, 0, W, H, '#131d21');
    if (!this.campaignSprite(root, 'map-frame', W / 2, H / 2, W, H)) {
      this.campaignLabel(root, 'map-title', '探索地图', 50, 674, 33, 300);
      this.campaignLabel(root, 'map-return', '返回首页', 1212, 672, 19, 145, C.text, Label.HorizontalAlign.RIGHT);
    }
    for (const chapter of [1, 2, 3, 4] as const) {
      const { x, y, name, location, side } = CHAPTERS[chapter];
      const locked = !this.chapterUnlocked(chapter);
      const cardX = x + side * 155, tint = locked ? '#babdc0' : '#f4d297';
      this.campaignSprite(root, locked ? 'pin-locked' : 'pin', x, y + 4, 76, 98);
      this.campaignLabel(root, 'map-point-' + chapter, '0' + chapter, x, y + 19, 22, 49, tint, Label.HorizontalAlign.CENTER);
      this.campaignSprite(root, 'chapter-card', cardX, y - 14, 234, 70);
      const preview = this.campaignSprite(root, `chapter-${chapter}`, cardX - 70, y - 13, 75, 45);
      if (locked && preview) preview.color = color('#6e7478');
      if (locked) this.campaignSprite(root, 'lock', cardX - 70, y - 13, 20, 24, true);
      this.campaignLabel(root, 'map-chapter-' + chapter, name, cardX - 22, y - 3, 22, 132, tint);
      this.campaignLabel(root, 'map-location-' + chapter, locked ? '尚未解锁' : location, cardX - 22, y - 28, 14, 121, tint);
      if (this.mode === 'chapters') {
        this.addButton('chapter-' + chapter, Math.min(x - 38, cardX - 117), y - 55, 311, 106, () => this.showChapter(chapter));
      }
    }
    if (this.mode === 'chapters') {
      this.addButton('map-back', 1061, 645, 195, 58, () => this.open('menu'));
      return;
    }
    this.sbox(this.graphics('Dimmed campaign map', root), 0, 0, W, H, '#000000', 135);
    if (this.mode === 'select-hero') { this.buildSortiePicker(root); return; }
    const chapter = this.selectedChapter;
    const data = CHAPTERS[chapter];
    const unlocked = this.chapterUnlocked(chapter);
    const back = () => this.open('chapters');
    this.dialog(data.name, [
      { id: 'chapter-enter', label: unlocked ? '选择角色' : '尚未解锁', enabled: unlocked, run: () => this.openSortiePicker() },
      { id: 'chapter-cancel', label: '返回地图', run: back },
    ], back);
    this.dialogText('chapter-place', ['第一章', '第二章', '第三章', '第四章'][chapter - 1] + ' · ' + data.location, W / 2, 448, 20, 640, C.gold);
    data.lines.forEach((line, i) => this.dialogText('chapter-line-' + i, line, W / 2, 395 - i * 34, 20, 670));
    if (!unlocked) this.dialogText('chapter-locked', data.locked, W / 2, 307, 20, 640, '#f5cb8b');
  }
  private sortieAllowed(id: HeroId, chapter = this.selectedChapter) {
    const cast: readonly HeroId[] = CHAPTERS[chapter].cast;
    return cast.includes(id) && (chapter === 4 || this.profile.owned[id]);
  }
  private openSortiePicker() {
    if (!this.chapterUnlocked(this.selectedChapter)) return;
    this.sortieHero = HERO_IDS.find(id => this.sortieAllowed(id)) ?? HEROINE_ID;
    this.open('select-hero');
  }
  private dispatchSortie() {
    if (this.mode === 'select-hero' && this.sortieAllowed(this.sortieHero)) this.startBattle(this.selectedChapter);
  }
  private buildSortiePicker(root: Node) {
    const center = Label.HorizontalAlign.CENTER, right = Label.HorizontalAlign.RIGHT;
    const id = this.sortieHero, p = this.profile, hero = heroes[id], kit = p.armory.kits[id];
    const operation = this.selectedChapter === 4;
    const art = this.campaignSprite(root, 'hero-frame', 640, 359, 1116, 628);
    const text = (key: string, value: string, x: number, y: number, size: number, w: number, tint = C.text, align = Label.HorizontalAlign.LEFT) =>
      this.campaignLabel(root, 'sortie-' + key, value, x, y, size, w, tint, align);
    this.campaignSprite(root, 'team', 187, 600, 66, 52, true);
    text('title', '选择战斗角色', 233, 598, 32, 278, '#ffdf9f');
    text('chapter', CHAPTERS[this.selectedChapter].name + (operation ? '  ·  联合作战' : '  ·  单人行动'), 1008, 593, 18, 280, C.text, right);
    if (!art) text('close-label', '×', 1108, 601, 35, 55, C.gold, center);
    this.addButton('sortie-close', 1076, 568, 72, 67, () => this.open('chapter-intro'));

    const portrait = this.trainingFrames.get(`${TRAINING_PROFILES[id].key}-art`);
    if (portrait) {
      const clip = this.makeNode('Sortie portrait clip', root);
      clip.setPosition(270 - W / 2, 380 - H / 2);
      clip.getComponent(UITransform)!.setContentSize(246, 336);
      clip.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
      const picture = this.makeNode('Full height operator portrait', clip);
      const height = 415, width = height * portrait.originalSize.width / portrait.originalSize.height;
      picture.setPosition(0, 166 - height / 2);
      this.setupSprite(picture, portrait, width, height);
    }
    for (const [i, candidate] of HERO_IDS.entries()) {
      const x = 482 + i * 148, y = 382, active = id === candidate, allowed = this.sortieAllowed(candidate);
      this.campaignSprite(root, active ? 'hero-active' : 'hero-card', x, y, 128, 177);
      const face = this.trainingFrames.get(`${TRAINING_PROFILES[candidate].key}-face`);
      if (face) {
        const avatar = this.campaignSprite(root, face, x, y + 14, 101, 105, true);
        if (avatar && !allowed) avatar.color = color('#858487');
      }
      text('hero-' + candidate, heroes[candidate].name, x, y - 51, 19, 110, active ? '#ffe0a1' : '#d7cec2', center);
      if (!allowed) {
        this.campaignSprite(root, 'lock', x - 41, y - 72, 13, 15, true);
        text('blocked-' + candidate, operation ? '未参与行动' : p.owned[candidate] ? '本关限定凛' : '尚未解锁', x + 8, y - 72, 13, 88, '#c4b59e', center);
      } else {
        this.addButton('sortie-hero-' + candidate, x - 64, y - 88, 128, 176, () => {
          if (!this.sortieAllowed(candidate) || active) return;
          this.sortieHero = candidate; this.open('select-hero');
        });
      }
    }
    text('restriction', operation ? '剧情指定  ·  幽灵行动组' : '剧情指定  ·  仅凛可出战', 642, 251, 18, 417, '#e7c891', center);
    text('name', operation ? '幽灵 · 任务配装' : hero.name + '  Lv.' + p.levels[id], 907, 508, 27, 212, '#ffdb96');
    text('role', '定位  ' + hero.role, 908, 470, 17, 208);
    text('weapon', '武器  ' + WEAPON_TYPES[hero.weapon], 908, 443, 17, 208);
    const weapon = operation ? configuredHero(id) : configuredHero(id, kit.weaponLevel, installedMods(id, kit, p.armory.mods));
    const stats = heroStats(id, operation ? 1 : p.levels[id], operation ? {} : profileGrowth(p, id), weapon);
    const protection = operation ? 0 : kit.gear.reduce((total, part) => total + GEAR[part].protection, 0);
    const rating = heroRating(id, { ...stats, hp: stats.hp / (1 - protection) }, weapon);
    for (const [i, axis] of TRAINING_AXES.entries()) {
      const y = 394 - i * 30;
      text('rating-' + i, axis.name, 908, y, 16, 60);
      const filled = Math.round(rating.axes[i] * 6);
      for (let seg = 0; seg < 6; seg++) this.campaignSprite(root, seg < filled ? 'rating-filled' : 'rating-empty', 980 + seg * 24, y, 23, 12);
    }
    text('lineup', '出战角色', 168, 142, 22, 130, '#f5d498');
    const face = this.trainingFrames.get(`${TRAINING_PROFILES[id].key}-face`);
    if (face) this.campaignSprite(root, face, 347, 150, 62, 62, true);
    text('start', '开始战斗  »', 970, 155, 30, 258, '#ffecd0', center);
    if (this.sortieAllowed(id)) this.addButton('sortie-start', 838, 122, 270, 65, () => this.dispatchSortie());
  }
  private homeSprite(id: HomeImage, x: number, top: number, w: number, h: number, available = true) {
    const frame = this.homeFrames.get(id);
    if (!frame || !this.homeArtwork) return;
    const node = this.makeNode(id, this.homeArtwork);
    node.setPosition(x + w / 2 - W / 2, H / 2 - top - h / 2);
    const parts = this.homeButtonParts.get(id), badge = HOME_BADGES[id];
    if (parts && badge) {
      const leftWidth = w * badge.cutX / badge.width;
      const cornerHeight = h * badge.cutY / badge.height;
      const rightWidth = w - leftWidth;
      const left = this.makeNode('Button artwork', node);
      left.setPosition(-rightWidth / 2, 0);
      this.setupSprite(left, parts[0], leftWidth, h);
      const lowerRight = this.makeNode('Right edge', node);
      lowerRight.setPosition(leftWidth / 2, -cornerHeight / 2);
      this.setupSprite(lowerRight, parts[1], rightWidth, h - cornerHeight);
      const corner = this.makeNode('Mirrored clean corner', node);
      corner.setPosition(leftWidth / 2, (h - cornerHeight) / 2);
      corner.setScale(-1, 1, 1);
      this.setupSprite(corner, parts[2], rightWidth, cornerHeight);
    } else {
      const sprite = this.setupSprite(node, frame, w, h);
      if (!available) sprite.color = color('#a7aab0');
    }
    return node;
  }
  private homeTile(id: string, art: HomeImage, title: string, x: number, top: number, w: number, h: number, action: () => void, available = true, angle = 0) {
    const y = H - top - h;
    const artwork = this.homeSprite(art, x, top, w, h, available);
    if (!artwork) { this.button(id, title, x, y, w, action, id === 'start', true, h); return; }
    artwork.angle = angle;
    const node = this.addButton(id, x, y, w, h, action);
    node.angle = angle;
    this.setButtonArtwork(node, artwork);
    return artwork;
  }
  private setButtonArtwork(node: Node, artwork: Node) {
    const button = node.getComponent(Button)!;
    button.target = artwork;
    button.zoomScale = 1.025;
    button.duration = 0.09;
    button.transition = Button.Transition.SCALE;
  }
  private homePlate(x: number, y: number, w: number, h: number) {
    const corners = [[x, y + 9], [x + 9, y], [x + w - 14, y], [x + w, y + 14], [x + w, y + h], [x + 9, y + h], [x, y + h - 9]];
    polygon(this.modalArt, corners.map(([px, py]) => ({ x: px - W / 2, y: py - H / 2 })), '#111519', 234);
    corners.forEach(([px, py], i) => {
      const [nx, ny] = corners[(i + 1) % corners.length];
      this.sline(this.modalArt, px, py, nx, ny, '#8b7b61', 1, 170);
    });
  }
  private buildAchievements() {
    const root = this.achievementsLayer = this.makeNode('Achievements dialog', this.modal);
    const center = Label.HorizontalAlign.CENTER, right = Label.HorizontalAlign.RIGHT;
    this.sbox(this.graphics('Dimmed achievement backdrop', root), 0, 0, W, H, '#000000', 172);
    const sprite = (id: CampaignImage, x: number, y: number, w: number, h: number, fit = false) => this.campaignSprite(root, id, x, y, w, h, fit);
    const shell = sprite('achievement-shell', 640, 365, 1210, 680);
    const text = (id: string, value: string, x: number, y: number, size: number, w: number, tint = C.text, align = Label.HorizontalAlign.LEFT) =>
      this.campaignLabel(root, id, value, x, y, size, w, tint, align);
    const button = (id: string, caption: string, x: number, y: number, w: number, h: number, action?: () => void) => {
      const plate = sprite(action ? 'plate-active' : 'plate', x, y, w, h);
      text('ach-label-' + id, caption, x, y, 16, w - 6, action ? '#ffe3ab' : '#aaa69d', center);
      if (!action) return;
      const hit = this.addButton(id, x - w / 2, y - h / 2, w, h, action);
      if (plate) this.setButtonArtwork(hit, plate.node);
    };
    const bar = (x: number, y: number, w: number, ratio: number, h: number) => {
      sprite('track', x + w / 2, y, w, h);
      if (ratio > 0) {
        const fill = Math.max(1, (w - 4) * ratio);
        sprite('fill', x + 2 + fill / 2, y, fill, h - 3);
      }
    };
    const states = ACHIEVEMENTS.map(entry => ({ entry, ...achievementState(this.profile, entry) }));
    text('ach-title', '成就', 704, 649, 45, 160, '#ffdf9e', center);
    if (!shell) text('ach-close', '×', 1195, 637, 37, 63, C.gold, center);
    this.addButton('achievement-close', 1157, 607, 77, 63, () => this.open('menu'));
    const selected = this.achievementCategory;
    for (const [i, category] of (Object.keys(ACHIEVEMENT_CATEGORIES) as AchievementCategory[]).entries()) {
      const y = 570 - i * 88;
      const entries = states.filter(row => category === 'all' || row.entry.category === category);
      sprite(selected === category ? 'plate-active' : 'plate', 171, y, 211, 74);
      sprite(category === 'all' ? 'badge-growth' : `badge-${category}`, 101, y, 48, 48, true);
      text('ach-category-' + category, ACHIEVEMENT_CATEGORIES[category], 135, y + 9, 20, 133, '#f0d7a7');
      text('ach-count-' + category, `${entries.filter(row => row.complete).length} / ${entries.length}`, 135, y - 15, 16, 120);
      this.addButton('achievement-filter-' + category, 65, y - 36, 211, 72, () => {
        this.achievementCategory = category; this.achievementPage = 0; this.open('achievements');
      });
    }
    const score = achievementScore(this.profile);
    sprite('plate', 543, 570, 492, 84);
    sprite('badge-growth', 359, 571, 66, 64, true);
    text('ach-level', 'Lv.' + score.level, 412, 585, 24, 90, '#ffe0a1');
    text('ach-score-label', '成就等级', 504, 585, 19, 130, '#f0d7a7');
    text('ach-points', score.next ? `${score.points} / ${score.next.points}` : `${score.points} · 满级`, 757, 584, 17, 170, '#ffdfa0', right);
    bar(412, 551, 340, score.next ? score.points / score.next.points : 1, 16);
    sprite('plate', 1007, 570, 400, 84);
    const rewardLevel = score.rewardLevel;
    text('ach-level-reward', rewardLevel ? `等级奖励  ·  Lv.${rewardLevel.level}` : '等级奖励已领完', 829, 592, 17, 227, '#f0d7a7');
    if (rewardLevel) {
      text('ach-level-rewards', rewardLevel.rewards.map(reward => `${ACHIEVEMENT_REWARDS[reward.kind]} ×${reward.amount}`).join('  ·  '),
        829, 555, 13, 279, '#e9ca95');
      button('achievement-claim-level', '领取', 1143, 579, 104, 35, score.points >= rewardLevel.points
        ? () => this.saveAchievementClaim(claimAchievementLevel(this.profile, rewardLevel.level)) : undefined);
    }
    const list = states.filter(row => selected === 'all' || row.entry.category === selected);
    const rows = 5, pages = Math.max(1, Math.ceil(list.length / rows));
    this.achievementPage = Math.min(this.achievementPage, pages - 1);
    const first = this.achievementPage * rows;
    list.slice(first, first + rows).forEach(({ entry, complete, claimed, progress }, i) => {
      const y = 474 - i * 84;
      sprite('plate', 753, y, 904, 78);
      sprite(`badge-${entry.category}`, 349, y, 60, 60, true);
      text('ach-item-' + entry.id, entry.clue && !complete ? '未发现的线索' : entry.name, 392, y + 20, 21, 324, complete ? '#ffdc96' : C.text);
      const description = entry.clue ? (complete ? '已调查 · ' : '未发现 · ') + entry.description : entry.description;
      text(entry.clue ? 'clue-state-' + entry.id : 'ach-desc-' + entry.id, description, 392, y - 3, 15, 425, '#dfd0b7');
      text('ach-progress-' + entry.id, `${progress} / ${entry.target}`, 876, y + 1, 16, 111, '#f3d293', right);
      bar(393, y - 23, 482, progress / entry.target, 11);
      const { kind, amount } = entry.reward;
      if (kind === 'keys') this.caseArt('key', 925, y + 5, 32, 31, true, root);
      else if (kind === 'materials') this.trainingSprite('materials', root, 925, y + 5, 36, 30);
      else this.shopArt('coin', 925, y + 5, 31, 31, true, root);
      text('ach-reward-' + entry.id, `${ACHIEVEMENT_REWARDS[kind]} ×${amount}`, 953, y, 14, 125);
      button('achievement-claim-' + entry.id, claimed ? '已领取' : complete ? '领取' : '进行中', 1135, y, 112, 42,
        complete && !claimed ? () => this.saveAchievementClaim(claimAchievement(this.profile, entry.id)) : undefined);
    });
    if (pages > 1) {
      button('achievement-prev', '上一页', 677, 88, 106, 30, this.achievementPage > 0 ? () => { this.achievementPage--; this.open('achievements'); } : undefined);
      text('ach-page', `${this.achievementPage + 1} / ${pages}`, 805, 88, 16, 93, C.gold, center);
      button('achievement-next', '下一页', 933, 88, 106, 30, this.achievementPage + 1 < pages ? () => { this.achievementPage++; this.open('achievements'); } : undefined);
    }
  }
  private saveAchievementClaim(next: Profile | undefined) {
    if (!next) return;
    if (!this.persist(next)) { this.toast('奖励领取失败，请检查存档设置后重试'); return; }
    this.profile = next;
    this.play('win');
    this.open('achievements');
  }
  private buildMenu() {
    this.homeArtwork = this.makeNode('Home artwork', this.modal);
    const roster = () => this.showRoster('menu', HEROINE_ID);
    const shop = () => { this.shopBack = 'menu'; this.shopProduct = undefined; this.open('shop'); };
    const recruit = () => this.showRecruit('menu');
    const unavailable = (name: string) => () => this.toast(`${name}尚未开放`);
    const selected = HEROINE_ID;

    this.sbox(this.modalArt, 0, H - 72, W, 72, '#070b0e', 167);
    this.sline(this.modalArt, 0, H - 72, W, H - 72, '#6b6354', 1, 105);
    this.homePlate(21, 654, 290, 55);
    if (this.trainingFrames.has('lin-face') && this.trainingFrames.has('frame')) {
      this.trainingSprite('lin-face', this.homeArtwork, 53, 682, 46, 46);
      this.trainingSprite('frame', this.homeArtwork, 53, 682, 57, 55);
    } else this.homeSprite('profile_panel', 22, 8, 62, 60);
    this.text('home-profile', '幸存者档案', 94, 690, 20, '#f0e6d4', this.modal, 194);
    this.text('home-hero', `${heroes[selected].name}   Lv.${this.profile.levels[selected]}`, 94, 667, 15, C.gold, this.modal, 194);
    this.addButton('profile', 21, 652, 290, 59, roster);

    const resource = (id: 'materials' | 'tickets', icon: HomeImage, title: string, count: number, x: number, action: () => void) => {
      this.homePlate(x, 660, 174, 45);
      this.homeSprite(icon, x + 8, 18, 43, 40);
      this.text('home-' + id + '-label', title, x + 56, 693, 13, C.gold, this.modal, 106);
      this.text('home-' + id, count.toLocaleString('en-US'), x + 56, 673, 20, '#f0e6d4', this.modal, 109);
      this.addButton(id, x, 658, 174, 49, action);
    };
    resource('materials', 'resource_cash', '培养材料', this.profile.materials, 897, roster);
    resource('tickets', 'resource_gems', '招募券', this.profile.tickets, 1080, recruit);

    if (!this.homeSprite('game_logo', 27, 54, 357, 191)) this.text('title', '暗区求生', 45, 571, 53, '#f0e6d4');
    this.homeTile('recruit', 'button_shop', '商城', 34, 228, 105, 90, shop);
    const backpack = this.backpackArt('home-tile', 86.5, H - 364.5, 105, 91, this.homeArtwork);
    if (backpack) {
      this.backpackText('home-tile', '背包', 86.5, H - 387, 18, 75, '#f4e4bd', Label.HorizontalAlign.CENTER, this.homeArtwork);
      this.setButtonArtwork(this.addButton('backpack', 34, H - 410, 105, 91, () => this.openBackpack()), backpack);
    } else this.button('backpack', '背包', 34, H - 410, 105, () => this.openBackpack(), false, true, 91);
    const openTraining = () => {
      this.noticeTime = 0; this.trainingHeroId = HEROINE_ID; this.trainingKind = 'level'; this.trainingTab = 'growth';
      this.trainingBack = 'menu'; this.open('training');
    };
    const trainingTile = this.homeTile('training', 'button_character', '角色', 34, 411, 105, 91, openTraining);
    if (trainingTile) {
      const title = this.text('home-training', '角色', W / 2, H / 2 - 20, 17, '#f4e4bd', trainingTile, 80, Label.HorizontalAlign.CENTER);
      title.isBold = true;
      title.enableOutline = true;
      title.outlineColor = color('#15110c');
      title.outlineWidth = 1.5;
    }
    this.homeTile('settings', 'button_settings', '设置', 34, 502, 105, 91, () => this.open('settings'));

    const carried = this.profile.armory.tactical, unlocked = this.profile.tacticalUnlocked;
    if (carried && this.profile.armory.counts[carried]) {
      const count = Math.min(2, this.profile.armory.counts[carried]!);
      this.text('tactical-choice', `行动道具 · ${TACTICAL_DEFINITIONS[carried].title} ×${count}`, 1025, 594, 14, C.gold, this.modal, 300, Label.HorizontalAlign.CENTER);
      this.addButton('tactical-choice', 875, 570, 300, 34, roster);
    } else if (unlocked.length) {
      if (!unlocked.includes(this.tacticalChoice)) this.tacticalChoice = unlocked[0];
      this.text('tactical-choice', `行动道具：${TACTICAL_DEFINITIONS[this.tacticalChoice].title}（点击切换）`, 1025, 594, 14, C.gold, this.modal, 300, Label.HorizontalAlign.CENTER);
      this.addButton('tactical-choice', 875, 570, 300, 34, () => {
        this.tacticalChoice = unlocked[(unlocked.indexOf(this.tacticalChoice) + 1) % unlocked.length];
        this.labels.get('tactical-choice')!.string = `行动道具：${TACTICAL_DEFINITIONS[this.tacticalChoice].title}（点击切换）`;
      });
    }
    for (const mode of MODE_CARDS) {
      const width = 434, height = width * mode.height / mode.width, available = mode.id === 'start';
      const artwork = this.homeTile(mode.id, mode.art, mode.title, 821, mode.top, width, height,
        available ? () => this.open('chapters') : unavailable(mode.title), available, MODE_EDGE_ANGLE - mode.edgeAngle);
      if (!available && artwork) {
        this.text(mode.id + '-status', '未开放', W / 2 + width / 2 - 34, H / 2 + height / 2 - 34,
          15, '#e5d6bc', artwork, 100, Label.HorizontalAlign.RIGHT);
      }
    }

    this.homeTile('daily', 'nav_daily_tasks', '每日任务', 499, 623, 136, 84, () => this.open('missions'));
    this.homeTile('checkin', 'nav_checkin', '签到', 647, 623, 134, 86, () => {
      this.noticeTime = 0;
      this.open('checkin');
    });
    this.checkInBadge = this.checkInSprite('badge', this.homeArtwork, 758, 77, 17, 17);
    this.updateCheckInBadge();
    this.homeTile('achievements', 'nav_achievements', '成就', 795, 623, 136, 84, () => {
      this.noticeTime = 0;
      this.achievementCategory = 'all';
      this.achievementPage = 0;
      this.open('achievements');
    });
  }
  private refreshCheckInRewards() {
    const reward = refreshCheckIn(this.profile);
    if (!reward) return;
    const contents = checkInRewardText(reward);
    this.save();
    if (contents && this.storageOkay) this.toast('上轮补发  ·  ' + contents, 5);
  }
  private updateCheckInBadge() {
    const badge = this.checkInBadge;
    if (!badge) return;
    const { daily, chests } = checkInStatus(this.profile.checkIn);
    badge.active = daily !== undefined || chests.length > 0;
  }
  private checkInSprite(id: CheckInImage, parent: Node, x: number, y: number, width: number, height: number) {
    const frame = this.checkInFrames.get(id);
    if (!frame) return;
    const node = this.makeNode('Sign-in ' + id, parent);
    node.setPosition(x - W / 2, y - H / 2);
    this.setupSprite(node, frame, width, height);
    return node;
  }
  private buildCheckIn() {
    const layer = this.checkInLayer = this.makeNode('Sign-in panel', this.modal);
    const state = this.profile.checkIn, status = checkInStatus(state);
    this.checkInShownDay = status.day;
    const label = (id: string, value: string, x: number, y: number, size: number, width: number, fill = '#f4e3c8') => {
      const text = this.text('checkin-' + id, value, x, y, size, fill, layer, width, Label.HorizontalAlign.CENTER);
      text.isBold = true;
      text.enableOutline = true;
      text.outlineColor = color('#120c07');
      text.outlineWidth = 2;
      return text;
    };
    const art = (id: CheckInImage, x: number, y: number, w: number, h: number) => this.checkInSprite(id, layer, x, y, w, h);
    const addClaimMark = (day: number, chest: boolean, x: number, y: number, size: number) => {
      const mark = art('check', x, y, size, size);
      const feedback = this.checkInClaimFeedback;
      if (mark && feedback?.day === day && feedback.chest === chest) {
        feedback.mark = mark;
        mark.setScale(1.25, 1.25, 1);
      }
    };
    const shade = art('shade', W / 2, H / 2, W, H);
    if (shade) {
      shade.getComponent(Sprite)!.color = color('#000000');
      shade.addComponent(UIOpacity).opacity = 204;
    }
    const panel = art('panel', W / 2, H / 2, 1240, 698);
    if (!panel) label('return', '返回', 1149, 620, 24, 96);
    this.addButton('checkin-close', 1071, 577, 132, 75, () => this.open('menu'));
    if (!this.checkInFrames.has('card') || !this.checkInFrames.has('chest-gold') || !panel) {
      label('loading', this.checkInLoadError ? '签到素材加载失败' : '正在加载签到', 650, 355, 28, 460);
      return;
    }

    label('status', status.daily ? '每日 05:00 刷新' : '今日已签到 · 05:00 刷新', 846, 618, 16, 420, '#d4bd95');
    CHECK_IN_DAYS.forEach((reward, index) => {
      const day = index + 1, special = day === 7 || day === 14;
      const ready = status.daily === day, claimed = day <= state.count;
      const x = 312 + index % 7 * 129, y = index < 7 ? 462 : 293;
      art(special ? 'special' : 'card', x, y, 118, 154);
      if (ready) {
        const glow = art('active', x, y, 121, 156);
        if (glow) this.checkInPulse = glow.addComponent(UIOpacity);
      }
      const kind = (Object.keys(reward) as (keyof typeof CHECK_IN_REWARD_NAMES)[])[0];
      label('day-' + day, `第${day}天`, x, y + 57, 19, 108, claimed ? '#ad9880' : '#ffe4ae');
      const icon = art(special ? day === 7 ? 'chest-blue' : 'chest-gold' : kind, x, y - 6, special ? 74 : 55, 55);
      if (claimed && icon) icon.addComponent(UIOpacity).opacity = 95;
      if (claimed) addClaimMark(day, false, x, y - 1, 41);
      label('reward-' + day, `${CHECK_IN_REWARD_NAMES[kind]} ×${reward[kind]}`, x, y - 42, 14, 115, claimed ? '#ac9880' : '#fff0d1');
      if (ready || claimed) label('state-' + day, ready ? '点击领取' : '已领取', x, y - 60, 12, 115, ready ? '#ffd176' : '#9bdb63');
      if (ready) this.addButton('checkin-day-' + day, x - 59, y - 77, 118, 154, () => this.claimCheckIn(day, false));
    });

    label('total-label', '累计签到', 323, 172, 17, 150);
    label('total', `${state.count} / 14 天`, 323, 128, 30, 168, '#ffe0a0');
    const laneStart = 429, laneWidth = 677;
    art('track', laneStart + laneWidth / 2, 103, laneWidth, 12);
    const fill = art('fill', laneStart + laneWidth / 2, 103, laneWidth, 12)?.getComponent(Sprite);
    if (fill) { fill.type = Sprite.Type.FILLED; fill.fillStart = 0; fill.fillRange = state.count / CHECK_IN_DAYS.length; }
    CHECK_IN_CHESTS.forEach(({ day, icon, reward }) => {
      const x = laneStart + laneWidth * day / CHECK_IN_DAYS.length;
      const claimed = state.chests.includes(day), ready = status.chests.some(chest => chest.day === day);
      const chest = art(icon, x, 156, 66, 48);
      if (chest) {
        if (!claimed && !ready) chest.addComponent(UIOpacity).opacity = 155;
        if (ready) {
          art('badge', x + 32, 172, 13, 13);
          const button = this.addButton('checkin-chest-' + day, x - 53, 112, 106, 76, () => this.claimCheckIn(day, true));
          this.setButtonArtwork(button, chest);
        }
      }
      if (claimed) addClaimMark(day, true, x + 23, 143, 24);
      label('chest-' + day, `${day}天${claimed ? ' · 已领' : ready ? ' · 领取' : ''}`, x, 122, 15, 122, ready ? '#ffd176' : '#ead8b8');
      const contents = checkInRewardText(reward).replace('培养材料', '材料').replace(/ ×/g, '×').replace('  ·  ', ' · ');
      label('chest-reward-' + day, contents, x, 84, 12, 160, '#c9b593');
    });
  }
  private claimCheckIn(day: number, chest: boolean) {
    const reward = chest ? claimCheckInChest(this.profile, day) : claimCheckInDay(this.profile, day);
    if (!reward) { this.open('checkin'); return; }
    this.save();
    if (this.storageOkay) this.toast('已获得  ·  ' + checkInRewardText(reward), 3);
    this.checkInClaimFeedback = { day, chest, time: 0 };
    this.open('checkin');
  }
  private missionPlate(g: Graphics, x: number, y: number, w: number, h: number, fill: string, edge: string, cut = 9, alpha = 255) {
    const points = [[x + cut, y], [x + w - cut, y], [x + w, y + cut], [x + w, y + h - cut],
      [x + w - cut, y + h], [x + cut, y + h], [x, y + h - cut], [x, y + cut]];
    polygon(g, points.map(([px, py]) => ({ x: px - W / 2, y: py - H / 2 })), fill, alpha);
    points.forEach(([px, py], i) => {
      const [nx, ny] = points[(i + 1) % points.length];
      this.sline(g, px, py, nx, ny, edge, 1.2);
    });
  }
  private buildMissions() {
    refreshDailyMissions(this.profile);
    const state = this.profile.daily, activity = dailyActivity(state);
    const layer = this.missionLayer = this.makeNode('Daily missions', this.modal);
    const shade = this.graphics('Dimmed home', layer);
    const cream = '#f8e8cd', bronze = '#c6b29a', gold = '#f4c066';
    const label = (id: string, value: string, x: number, y: number, size: number, fill: string, width: number, center = false) =>
      this.text('mission-' + id, value, x, y, size, fill, layer, width, center ? Label.HorizontalAlign.CENTER : Label.HorizontalAlign.LEFT);
    const sprite = (id: string, frame: SpriteFrame | undefined, x: number, y: number, w: number, h: number) => {
      if (!frame) return;
      const node = this.makeNode(id, layer);
      node.setPosition(x + w / 2 - W / 2, y + h / 2 - H / 2);
      this.setupSprite(node, frame, w, h);
      return node;
    };
    this.sbox(shade, 0, 0, W, H, '#060507', 204);
    const panel = sprite('Mission metal panel', this.missionFrames.get('panel'), 80, 45, 1120, 627);
    if (!panel) this.missionPlate(shade, 80, 45, 1120, 627, '#1e1a17', '#8a735a', 27);
    const art = this.graphics('Task progress and reward slots', layer);
    const marker = (x: number, y: number, radius: number, fill: string) => polygon(art, [
      { x: x - W / 2, y: y + radius - H / 2 }, { x: x + radius - W / 2, y: y - H / 2 },
      { x: x - W / 2, y: y - radius - H / 2 }, { x: x - radius - W / 2, y: y - H / 2 },
    ], fill);
    const bar = (x: number, y: number, width: number, height: number, progress: number) => {
      this.sbox(art, x, y, width, height, '#100f0e');
      this.soutline(art, x, y, width, height, '#7a684f');
      if (progress > 0) {
        this.sbox(art, x + 1, y + 1, (width - 2) * progress, height - 2, gold);
        this.sbox(art, x + 1, y + height - 3, (width - 2) * progress, 1, '#ffe1a2');
      }
    };
    sprite('Daily missions clipboard', this.missionFrames.get('clipboard'), 134, 601, 65, 65);
    const title = label('title', '每日任务', 207, 628, 36, cream, 265);
    title.isBold = true;
    title.enableOutline = true;
    title.outlineColor = color('#271a13');
    title.outlineWidth = 2;
    art.strokeColor = color(bronze); art.lineWidth = 1.6;
    art.circle(873 - W / 2, 615 - H / 2, 8); art.stroke();
    this.sline(art, 873, 620, 873, 615, bronze, 1.6);
    this.sline(art, 873, 615, 877, 612, bronze, 1.6);
    label('reset', '每日 05:00 重置任务', 890, 615, 17, bronze, 210);
    this.sline(art, 1148, 652, 1167, 633, cream, 4);
    this.sline(art, 1148, 633, 1167, 652, cream, 4);
    this.addButton('close', 1105, 614, 89, 55, () => this.open('menu'));

    sprite('Activity supply chest', this.missionFrames.get('chest'), 111, 228, 201, 194);
    label('activity-title', '今日活跃度', 211, 522, 22, cream, 180, true).isBold = true;
    label('activity', String(activity), 211, 471, 52, gold, 170, true).isBold = true;
    this.sline(art, 154, 433, 268, 433, '#c49349', 1.5);
    marker(211, 433, 5, gold);
    label('supply', '活跃度补给', 211, 208, 21, gold, 181, true).isBold = true;
    label('activity-hint', '领取任务奖励获得活跃度', 211, 174, 14, bronze, 186, true);
    label('settlement', '行动结算后更新进度', 211, 106, 14, bronze, 185, true);

    DAILY_MISSIONS.forEach((task, index) => {
      const y = 494 - index * 88.5, count = state.progress[task.id];
      const claimed = state.claimed.includes(task.id), ready = count >= task.goal && !claimed;
      if (!panel) this.missionPlate(art, 321, y, 848, 80, '#29241f', '#766652');
      sprite(task.id + ' icon', this.missionFrames.get(task.icon), 339, y + 8, 66, 63);
      label(task.id + '-title', task.title, 419, y + 60, 22, cream, 350).isBold = true;
      label(task.id + '-description', task.description, 419, y + 36, 15, bronze, 379);
      bar(419, y + 12, 294, 9, count / task.goal);
      label(task.id + '-count', `${count}/${task.goal}`, 724, y + 17, 16, cream, 65);

      this.missionPlate(art, 813, y + 10, 67, 60, '#0e0c0b', '#695947', 5, 158);
      sprite('Materials', this.homeFrames.get('resource_cash'), 829, y + 42, 29, 27);
      label(task.id + '-materials', `+${task.materials}`, 851, y + 30, 15, cream, 54, true);
      label(task.id + '-case-key', `钥匙 +${DAILY_CASE_KEYS}`, 846, y + 17, 13, gold, 81, true);
      this.missionPlate(art, 889, y + 10, 72, 60, '#0e0c0b', '#695947', 5, 158);
      label(task.id + '-activity-label', '活跃度', 925, y + 51, 14, bronze, 70, true);
      label(task.id + '-activity', `+${task.activity}`, 925, y + 25, 17, gold, 70, true);

      const actionArt = claimed ? undefined : sprite(`Mission ${task.id} ${ready ? 'claim' : 'go'}`,
        this.missionFrames.get(ready ? 'claim' : 'go'), 1010, y + 11, 146, 59);
      if (!actionArt) {
        this.missionPlate(art, 1014, y + 19, 138, 43, ready ? '#c99040' : '#211d19', ready ? '#f4d591' : '#766652', 8, claimed ? 180 : 255);
        label(task.id + '-action', claimed ? '已领取' : ready ? '领取' : '前往  »', 1083, y + 41, 19, ready ? '#27180d' : claimed ? bronze : cream, 130, true);
      }
      if (claimed) return;
      const button = this.addButton('mission-' + task.id, 1010, y + 14, 146, 53, ready ? () => {
        if (claimDailyMission(this.profile, task.id)) { this.save(); this.play('win'); }
        this.open('missions');
      } : () => this.open('chapters'));
      if (actionArt) this.setButtonArtwork(button, actionArt);
    });

    if (!panel) this.missionPlate(art, 321, 79, 852, 133, '#29241f', '#766652');
    label('milestones', '活跃度奖励', 345, 174, 19, gold, 180).isBold = true;
    bar(455, 113, 657, 7, activity / 100);
    for (const reward of DAILY_MILESTONES) {
      const x = 455 + 657 * reward.points / 100;
      const claimed = state.milestones.includes(reward.points), ready = activity >= reward.points && !claimed;
      this.missionPlate(art, x - 53, 129, 106, 68, ready ? '#3b2c1b' : '#0e0c0b', ready ? gold : '#6d5c49', 6, 184);
      sprite('Milestone reward', this.homeFrames.get(reward.tickets ? 'resource_gems' : 'resource_cash'), x - 44, 160, 30, 29);
      label(`reward-${reward.points}`, reward.tickets ? `招募券 ×${reward.tickets}` : `材料 ×${reward.materials}`, x - 10, 175, 13, cream, 63);
      const claimArt = ready ? sprite(`Claim milestone ${reward.points}`, this.missionFrames.get('claim'), x - 34, 130, 68, 28) : undefined;
      if (!claimArt) label(`reward-${reward.points}-state`, claimed ? '已领取' : ready ? '领取' : '未达成', x, 143, 14, ready ? gold : bronze, 100, true);
      marker(x, 116, 8, activity >= reward.points ? gold : '#857563');
      if (activity < reward.points) marker(x, 116, 5, '#211c17');
      label(`threshold-${reward.points}`, String(reward.points), x, 94, 17, cream, 55, true);
      if (ready) {
        const button = this.addButton(`milestone-${reward.points}`, x - 53, 129, 106, 68, () => {
          if (claimDailyMilestone(this.profile, reward.points)) { this.save(); this.play('win'); }
          this.open('missions');
        });
        if (claimArt) this.setButtonArtwork(button, claimArt);
      }
    }
  }
  private showRecruit(back: 'menu' | 'shop' | 'training') {
    this.recruitBack = back; this.lastDraw = ''; this.open('recruit');
  }
  private showRoster(back: 'menu' | 'shop' | 'training' | 'backpack', hero: HeroId, focus?: GearId | ConsumableId) {
    this.rosterBack = back; this.rosterHero = hero; this.rosterFocus = focus; this.open('roster');
  }
  private openBackpack() {
    this.backpackFilter = 'all';
    this.backpackSelection = undefined;
    this.backpackRow = 0;
    this.noticeTime = 0;
    this.open('backpack');
  }
  private backpackArt(id: BackpackImage, x: number, y: number, w: number, h: number, parent = this.backpackLayer!) {
    const frame = this.backpackFrames.get(id);
    if (!frame) return;
    const node = this.makeNode('Backpack ' + id, parent);
    node.setPosition(x - W / 2, y - H / 2);
    return this.setupSprite(node, frame, w, h).node;
  }
  private backpackText(id: string, value: string, x: number, y: number, size: number, width: number,
    tint = '#f5e4c4', align = Label.HorizontalAlign.LEFT, parent = this.backpackLayer!) {
    const label = this.text('backpack-' + id, value, x, y, size, tint, parent, width, align);
    label.isBold = true;
    label.enableOutline = true;
    label.outlineWidth = 1.25;
    label.outlineColor = color('#15100b');
    return label;
  }
  private backpackButton(id: string, title: string, x: number, y: number, w: number, h: number, run?: () => void, primary = false) {
    const art = this.backpackArt(primary ? 'action' : 'filter', x, y, w, h);
    const label = this.backpackText(id, title, x, y, primary ? 22 : 16, w - 8,
      primary ? '#261606' : run ? '#fff0ce' : '#a3927e', Label.HorizontalAlign.CENTER);
    if (primary) label.enableOutline = false;
    if (run) {
      const button = this.addButton('backpack-' + id, x - w / 2, y - h / 2, w, h, run);
      if (art) this.setButtonArtwork(button, art);
    }
  }
  private backpackIcon(item: BackpackItem, x: number, y: number, w: number, h: number) {
    const layer = this.backpackLayer!;
    if (item.type === 'attachment') this.shopArt(item.mod.kind, x, y, w, h, true, layer);
    else if (item.type !== 'material') this.shopArt(item.id, x, y, w, h, true, layer);
    else if (item.id === 'coins' || item.id === 'parts') this.shopArt(item.id === 'coins' ? 'coin' : 'parts', x, y, w, h, true, layer);
    else if (item.id === 'keys') this.caseArt('key', x, y, w, h, true, layer);
    else {
      const frame = this.checkInFrames.get(item.id);
      if (!frame) return;
      const node = this.makeNode('Backpack resource ' + item.id, layer);
      node.setPosition(x - W / 2, y - H / 2);
      const { width, height } = frame.originalSize, scale = Math.min(w / width, h / height);
      this.setupSprite(node, frame, width * scale, height * scale);
    }
  }
  private renderBackpack() {
    this.clearButtons();
    if (this.backpackLayer) {
      this.backpackLayer.active = false; this.backpackLayer.destroy();
      for (const [id, label] of this.labels) {
        if (id.startsWith('backpack-') && id !== 'backpack-home-tile') { label.node.destroy(); this.labels.delete(id); }
      }
    }
    const layer = this.backpackLayer = this.makeNode('Inventory dialog', this.modal);
    // Cocos dispatches UI gestures before global input. Capture drags before a card can click.
    layer.on(Node.EventType.MOUSE_WHEEL, this.backpackWheel, this, true);
    layer.on(Node.EventType.TOUCH_START, this.backpackTouchStart, this, true);
    layer.on(Node.EventType.TOUCH_MOVE, this.backpackTouchMove, this, true);
    layer.on(Node.EventType.TOUCH_END, this.backpackTouchEnd, this, true);
    layer.on(Node.EventType.TOUCH_CANCEL, this.backpackTouchEnd, this, true);
    this.sbox(this.graphics('Dimmed home', layer), 0, 0, W, H, '#000000', 177);
    this.backpackArt('shell', W / 2, H / 2, 1200, 660);
    this.backpackArt('banner-icon', 139, 626, 76, 73);
    this.backpackText('title', '背包', 193, 625, 43, 160);
    this.backpackArt('capacity-icon', 960, 633, 28, 28);
    const count = this.profile.armory.mods.length;
    this.backpackText('capacity', `配件容量  ${count} / ${MOD_STORAGE_CAP}`, 983, 632, 19, 178,
      count >= MOD_STORAGE_CAP ? '#ffbf6b' : '#f5e4c4');
    const close = this.backpackArt('close', 1193, 630, 66, 59);
    if (!close) this.backpackText('close-label', '×', 1193, 630, 36, 62, '#f5e4c4', Label.HorizontalAlign.CENTER);
    const closeButton = this.addButton('backpack-close', 1160, 600, 66, 60, () => this.open('menu'));
    if (close) this.setButtonArtwork(closeButton, close);
    this.caseArt('tray', 567, 328, 549, 505, false, layer);
    this.caseArt('tray', 1028, 328, 357, 505, false, layer);
    for (const [i, filter] of (Object.keys(BACKPACK_FILTERS) as BackpackFilter[]).entries()) {
      const y = 524 - i * 80, active = filter === this.backpackFilter;
      const art = this.backpackArt(active ? 'filter-active' : 'filter', 180, y, 213, 66);
      this.backpackArt(`icon-${filter}`, 117, y, 37, 36);
      this.backpackText('filter-' + filter, BACKPACK_FILTERS[filter], 150, y, 23, 120, active ? '#fff1cb' : '#e1d1b6');
      const button = this.addButton('backpack-filter-' + filter, 74, y - 33, 212, 66, () => {
        if (this.backpackFilter === filter) return;
        this.backpackFilter = filter; this.backpackRow = 0; this.backpackSelection = undefined; this.renderBackpack();
      });
      if (art) this.setButtonArtwork(button, art);
    }

    const items = backpackItems(this.profile).filter(item => this.backpackFilter === 'all' || item.type === this.backpackFilter);
    this.backpackMaxRow = Math.max(0, Math.ceil(items.length / BAG_COLUMNS) - BAG_ROWS);
    this.backpackRow = Math.min(this.backpackRow, this.backpackMaxRow);
    const start = this.backpackRow * BAG_COLUMNS, gridSize = BAG_COLUMNS * BAG_ROWS;
    const visible = items.slice(start, start + gridSize);
    const selected = visible.find(item => item.key === this.backpackSelection) ?? visible[0];
    this.backpackSelection = selected?.key;
    for (let i = 0; i < gridSize; i++) {
      const x = 363 + i % BAG_COLUMNS * 102, y = 523 - Math.floor(i / BAG_COLUMNS) * BAG_ROW_HEIGHT;
      const item = visible[i], quality = item?.type === 'attachment' ? item.mod.quality : 0;
      const card = this.backpackArt(`slot-${quality}`, x, y, 95, 86);
      if (!item) {
        if (card) card.addComponent(UIOpacity).opacity = 100;
        continue;
      }
      this.backpackIcon(item, x, y + 3, 72, 61);
      const caption = 'amount' in item ? '×' + item.amount.toLocaleString('en-US') : item.type === 'attachment' ? 'Lv.' + item.mod.level : '';
      if (caption) this.backpackText('quantity-' + i, caption, x + 39, y - 27, 14, 82,
        item.type === 'attachment' ? QUALITY_COLORS[quality] : '#fff3d8', Label.HorizontalAlign.RIGHT);
      if (item === selected) this.backpackArt('selected', x, y, 99, 90);
      this.addButton('backpack-item-' + item.key, x - 48, y - 42, 96, 84, () => {
        if (this.backpackTouch?.swiped || this.backpackSelection === item.key) return;
        this.backpackSelection = item.key; this.renderBackpack();
      }, layer);
    }
    const range = visible.length ? `${start + 1}–${start + visible.length} / ${items.length}` : '0 件物品';
    this.backpackText('position', range, 567, 100, 17, 210, '#e6d0aa', Label.HorizontalAlign.CENTER);
    if (this.backpackMaxRow) {
      this.backpackButton('previous', '上一页', 430, 100, 117, 39, this.backpackRow > 0 ? () => this.scrollBackpack(-BAG_ROWS) : undefined);
      this.backpackButton('next', '下一页', 704, 100, 117, 39, this.backpackRow < this.backpackMaxRow ? () => this.scrollBackpack(BAG_ROWS) : undefined);
    }
    if (selected) this.renderBackpackDetails(selected);
    else this.backpackText('empty', '该分类暂无物品', 1028, 340, 22, 310, '#c6b291', Label.HorizontalAlign.CENTER);
  }
  private renderBackpackDetails(item: BackpackItem) {
    const details = backpackDetails(this.profile, item);
    const tint = item.type === 'attachment' ? QUALITY_COLORS[item.mod.quality] : '#f5e4c4';
    this.backpackArt('detail', 1028, 481, 321, 145);
    this.backpackIcon(item, 948, 481, 131, 118);
    this.backpackText('name', item.name, 1021, 520, 21, 167, tint);
    this.backpackText('meta', details.meta, 1021, 488, 15, 166, tint);
    if ('amount' in item) {
      const amount = item.amount.toLocaleString('en-US'), limit = item.type === 'consumable' ? ` / ${MAX_STOCK}` : '';
      this.backpackText('held', `持有  ${amount}${limit}`, 1021, 455, 16, 166);
    }
    this.backpackText('effect-heading', item.type === 'attachment' ? '配件属性' : '用途', 875, 393, 18, 303, '#e6bf77');
    const description = this.backpackText('effect', details.description, 875, 351, 19, 304, tint);
    description.enableWrapText = true;
    description.node.getComponent(UITransform)!.setContentSize(304, 62);
    const notes = this.backpackText('notes', details.notes.join('\n'), 875, 267, 17, 304, '#c6b291');
    notes.enableWrapText = true;
    notes.node.getComponent(UITransform)!.setContentSize(304, 67);
    if (details.action === 'workshop' && item.type === 'attachment') {
      this.backpackButton('action', '前往改装', 1028, 119, 238, 60, () => this.openWorkshop(details.hero, item.mod), true);
    } else if (details.action === 'equipment' && item.type === 'equipment') {
      this.backpackButton('action', '前往装备', 1028, 119, 238, 60, () => this.showRoster('backpack', details.hero, item.id), true);
    } else if (details.action === 'carry' && item.type === 'consumable') {
      this.backpackButton('action', '设置携行', 1028, 119, 238, 60, () => this.showRoster('backpack', HEROINE_ID, item.id), true);
    }
  }
  private overBackpackGrid(x: number, y: number) {
    return x >= BAG_GRID.left && x <= BAG_GRID.right && y >= BAG_GRID.bottom && y <= BAG_GRID.top;
  }
  private scrollBackpack(rows: number) {
    const next = clamp(this.backpackRow + rows, 0, this.backpackMaxRow);
    if (next === this.backpackRow) return;
    this.backpackRow = next;
    this.renderBackpack();
  }
  private backpackWheel(e: EventMouse) {
    const { x, y } = this.pointerPosition(e);
    if (this.overBackpackGrid(x, y)) this.scrollBackpack(-Math.sign(e.getScrollY()));
  }
  private backpackTouchStart(e: EventTouch) {
    if (this.backpackTouch && this.backpackTouch.id >= 0) return;
    const id = e.getID(), point = this.pointerPosition(e);
    this.backpackTouch = id !== null && this.overBackpackGrid(point.x, point.y) ? { id, ...point, swiped: false } : undefined;
  }
  private backpackTouchMove(e: EventTouch) {
    const touch = this.backpackTouch;
    if (!touch || touch.id !== e.getID()) return;
    const { x, y } = this.pointerPosition(e);
    const vertical = Math.abs(y - touch.y);
    if (vertical >= BAG_SWIPE_THRESHOLD && vertical > Math.abs(x - touch.x)) touch.swiped = true;
  }
  private backpackTouchEnd(e: EventTouch) {
    const touch = this.backpackTouch;
    if (!touch || touch.id !== e.getID()) return;
    touch.id = -1;
    // Releasing outside the pressed card is delivered as TOUCH_CANCEL by Cocos.
    if (!touch.swiped) return;
    const delta = this.pointerPosition(e).y - touch.y;
    if (Math.abs(delta) >= BAG_SWIPE_THRESHOLD) this.scrollBackpack(Math.sign(delta) * Math.max(1, Math.round(Math.abs(delta) / BAG_ROW_HEIGHT)));
  }
  private shopArt(id: ShopImage, x: number, y: number, w: number, h: number, fit = false, parent = this.shopLayer!) {
    const frame = this.shopFrames.get(id);
    if (!frame) return;
    const node = this.makeNode('Shop ' + id, parent);
    node.setPosition(x - W / 2, y - H / 2);
    const { width, height } = frame.originalSize;
    const scale = Math.min(w / width, h / height);
    return this.setupSprite(node, frame, fit ? width * scale : w, fit ? height * scale : h);
  }
  private shopText(id: string, name: string, x: number, y: number, size: number, width: number, tint = C.text, align = Label.HorizontalAlign.LEFT) {
    const label = this.text(id, name, x, y, size, tint, this.shopLayer!, width, align);
    label.isBold = true;
    label.enableOutline = true;
    label.outlineWidth = 1.5;
    label.outlineColor = color('#121015');
    return label;
  }
  private shopButton(id: string, name: string, x: number, y: number, w: number, h: number, run?: () => void, skin: ShopImage = 'button', size = 17) {
    const plate = this.shopArt(skin, x, y, w, h);
    const label = this.shopText('shop-label-' + id, name, x, y, size, w - 14, run ? C.text : C.muted, Label.HorizontalAlign.CENTER);
    if (skin === 'purchase' && run) { label.color = color('#221609'); label.enableOutline = false; }
    if (run) {
      const button = this.addButton(id, x - w / 2, y - h / 2, w, h, run);
      if (plate) this.setButtonArtwork(button, plate.node);
    }
  }
  private caseArt(id: CaseImage, x: number, y: number, w: number, h: number, fit = false, parent = this.caseLayer) {
    const frame = this.caseFrames.get(id);
    if (!frame || !parent) return;
    const node = this.makeNode('Case ' + id, parent);
    node.setPosition(x - W / 2, y - H / 2);
    const { width, height } = frame.originalSize;
    const scale = Math.min(w / width, h / height);
    return this.setupSprite(node, frame, fit ? width * scale : w, fit ? height * scale : h).node;
  }
  private caseText(id: string, value: string, x: number, y: number, size: number, width: number, tint = '#f5e5ca',
    align = Label.HorizontalAlign.CENTER, parent = this.caseLayer!) {
    const label = this.text('cases-' + id, value, x, y, size, tint, parent, width, align);
    label.isBold = true;
    label.enableOutline = true;
    label.outlineWidth = 2;
    label.outlineColor = color('#120e0e');
    return label;
  }
  private caseButton(id: string, value: string, x: number, y: number, w: number, h: number, action?: () => void, active = false, size = 20) {
    const art = this.caseArt(active ? 'button-gold' : 'button-dark', x, y, w, h);
    this.caseText(id, value, x, y, size, w - 20, action ? '#fff0cd' : '#a29482');
    if (action) {
      const button = this.addButton('case-' + id, x - w / 2, y - h / 2, w, h, action);
      if (art) this.setButtonArtwork(button, art);
    }
  }
  private caseIcon(prize: CasePrize, x: number, y: number, w: number, h: number, parent = this.caseLayer!) {
    if (prize.type === 'materials') this.trainingSprite('materials', parent, x, y, w, h);
    else this.shopArt(prize.type === 'mod' || prize.type === 'item' ? prize.item : prize.type === 'coins' ? 'coin' : 'parts', x, y, w, h, true, parent);
  }
  private caseCaption(prize: CasePrize) {
    return prize.type === 'mod' ? QUALITY_NAMES[prize.quality] : `×${prize.amount}`;
  }
  private caseRange(prize: CasePrize) {
    if (prize.type !== 'mod') return this.caseCaption(prize);
    const [min, max] = modRange(prize.item, prize.quality);
    const value = modText(prize.item, min === max ? min : `${min}–${max}`);
    return prize.item === 'tube' ? value + ` · 换弹 −${1 + prize.quality * 2}–${4 + prize.quality * 2}%` : value;
  }
  private buildCases() {
    this.caseLayer = this.makeNode('Supply cases', this.modal);
    this.caseArt('background', W / 2, H / 2, W, H);
    this.caseArt('title', 182, 675, 350, 92);
    this.caseText('title', '补给开箱', 178, 677, 42, 245);
    this.caseArt('button-dark', 1065, 673, 172, 50);
    this.caseArt('key', 1026, 673, 32, 27, true);
    this.caseText('keys', String(this.profile.cases.keys), 1092, 673, 23, 87, '#ffd383');
    const pending = this.profile.cases.pending;
    if (!this.caseRoll) this.caseButton('back', pending ? '关闭' : '返回', 1210, 673, 108, 50, () => this.backFromCases(), false, 19);
    if (pending && !this.caseRoll) { this.buildCaseResults(pending); return; }
    if (this.casePreview) { this.buildCasePreview(this.casePreview); return; }

    const id = this.selectedCase, roll = this.caseRoll;
    CASE_IDS.forEach((boxId, i) => {
      const y = 516 - i * 143;
      this.caseArt(boxId === id ? 'card-3' : 'card-0', 109, y, 166, 129);
      this.caseArt(`${boxId}-closed`, 109, y + 24, 131, 90, true);
      this.caseText(boxId, CASES[boxId].name, 109, y - 41, 19, 148, boxId === id ? '#ffda8e' : '#e7dcce');
      if (!roll) this.addButton('case-box-' + boxId, 26, y - 64, 166, 128, () => { this.selectedCase = boxId; this.open('cases'); });
    });
    const closed = this.caseArt(`${id}-closed`, 659, 509, 410, 283, true);
    if (roll) {
      const opened = this.caseArt(`${id}-open`, 659, 509, 410, 283, true);
      if (closed) roll.closed = closed.addComponent(UIOpacity);
      if (opened) { roll.opened = opened.addComponent(UIOpacity); roll.opened.opacity = 0; }
    }
    this.caseArt('card-0', 1104, 508, 267, 139);
    this.caseText('box-name', CASES[id].name, 1104, 545, 25, 247, '#ffdb94');
    CASES[id].lines.forEach((value, i) => this.caseText('box-info-' + i, value, 1104, 507 - 23 * i, 15, 242));
    this.caseButton('preview', '掉落预览', 1146, 404, 160, 42, roll ? undefined : () => {
      this.casePreview = { page: 0 }; this.open('cases');
    }, false, 17);

    this.buildCaseTrack(id, roll);
    for (const [i, count] of ([1, 10] as const).entries()) {
      const x = 564 + i * 340, canAfford = this.profile.cases.keys >= count;
      const art = this.caseArt(count === 10 && canAfford ? 'button-gold' : 'button-dark', x, 99, 282, 84);
      this.caseText('open-label-' + count, `开 ${count} 次`, x, 112, 27, 230, canAfford ? '#fff0cd' : '#ae9e89');
      this.caseArt('key', x - 21, 82, 24, 19, true);
      this.caseText('cost-' + count, `×${count}`, x + 20, 82, 16, 56, canAfford ? '#ffdda0' : '#ae9e89');
      if (!roll) {
        const button = this.addButton('case-open-' + count, x - 141, 57, 282, 84, () => this.startCaseOpening(count));
        if (art) this.setButtonArtwork(button, art);
      }
    }
    this.caseText('key-source', `探索通关 +${CLEAR_CASE_KEYS} 把   /   领取每日任务 +${DAILY_CASE_KEYS} 把`, 732, 38, 15, 660, '#d9c2a1');
  }
  private buildCaseTrack(id: CaseId, roll?: CaseRoll) {
    const x = 740, y = 264, width = 1018, height = 188;
    this.caseArt('tray', x, y, width + 18, height + 24);
    const clip = this.makeNode('Case roll viewport', this.caseLayer!);
    clip.setPosition(x - W / 2, y - H / 2);
    clip.getComponent(UITransform)!.setContentSize(width, height);
    clip.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    const track = this.makeNode('Case roll track', clip);
    track.setPosition(-CASE_START * CASE_PITCH, 0);
    const pool = CASE_POOLS[id], idleCount = CASE_START * 2 + 1, cards = roll ? CASE_STOP + CASE_START + 1 : idleCount;
    for (let i = 0; i < cards; i++) {
      const prize = i < idleCount ? pool[(i * 11 + 5) % pool.length] :
        i === CASE_STOP ? casePrize(id, roll!.opening.rewards[0].id)! : sampleCasePrize(id);
      const card = this.makeNode('Reel card ' + i, track), cx = W / 2, cy = H / 2;
      card.setPosition(i * CASE_PITCH, 0);
      this.caseArt(`card-${prize.type === 'mod' ? prize.quality : 0}`, cx, cy, 141, 153, false, card);
      this.caseIcon(prize, cx, cy + 16, 113, 75, card);
      this.caseText('reel-name-' + i, prize.title, cx, cy - 34, 16, 137, '#f5e5ca', Label.HorizontalAlign.CENTER, card);
      this.caseText('reel-quality-' + i, this.caseCaption(prize), cx, cy - 55, 14, 130,
        prize.type === 'mod' ? QUALITY_COLORS[prize.quality] : '#ddd0b8', Label.HorizontalAlign.CENTER, card);
      if (roll) { card.active = Math.abs(i - CASE_START) <= CASE_START; roll.cards.push(card); }
    }
    this.caseArt('pointer', x, y, 36, 209);
    if (roll) roll.track = track;
  }
  private buildCasePreview(state: { page: number; quality?: Quality }) {
    const id = this.selectedCase;
    this.caseArt('tray', W / 2, 342, 1175, 576);
    this.caseText('preview-title', CASES[id].name + ' · 掉落预览', 346, 590, 29, 525);
    this.caseText('preview-note', '单次开箱概率   /   配件属性为初始范围', 942, 590, 17, 480, '#e2ceb1');
    const all = CASE_POOLS[id];
    const prizes = state.quality === undefined ? all : all.filter(prize => prize.type === 'mod' && prize.quality === state.quality);
    if (id === 'tactical') for (const [i, quality] of ([undefined, 0, 1, 2, 3] as const).entries()) {
      this.caseButton('filter-' + i, quality === undefined ? '全部' : QUALITY_NAMES[quality], 190 + i * 161, 532, 146, 44, () => {
        this.casePreview = { page: 0, quality }; this.open('cases');
      }, state.quality === quality, 17);
    }
    const pageSize = 8, pages = Math.ceil(prizes.length / pageSize);
    prizes.slice(state.page * pageSize, (state.page + 1) * pageSize).forEach((prize, i) => {
      const x = 353 + i % 2 * 575, y = 458 - Math.floor(i / 2) * 86;
      this.caseArt('button-dark', x, y, 552, 76);
      this.caseIcon(prize, x - 218, y, 72, 55);
      this.caseText('drop-name-' + i, prize.title, x - 165, y + 13, 19, 334, '#f7e6c6', Label.HorizontalAlign.LEFT);
      const caption = prize.type === 'mod' ? QUALITY_NAMES[prize.quality] + ' · ' + this.caseRange(prize) : this.caseCaption(prize);
      this.caseText('drop-details-' + i, caption, x - 165, y - 14, 15, 337,
        prize.type === 'mod' ? QUALITY_COLORS[prize.quality] : '#d9c2a1', Label.HorizontalAlign.LEFT);
      this.caseText('drop-probability-' + i, (prize.weight / 100).toFixed(2) + '%', x + 212, y, 19, 103, '#ffdc96');
    });
    const turn = (delta: number) => { state.page += delta; this.open('cases'); };
    this.caseButton('prev', '上一页', 496, 106, 145, 47, state.page > 0 ? () => turn(-1) : undefined, false, 17);
    this.caseText('page', `${state.page + 1} / ${pages}`, 640, 106, 19, 115);
    this.caseButton('next', '下一页', 784, 106, 145, 47, state.page + 1 < pages ? () => turn(1) : undefined, false, 17);
  }
  private buildCaseResults(opening: CaseOpening) {
    const single = opening.rewards.length === 1;
    this.caseArt('tray', W / 2, 352, single ? 760 : 1190, 548);
    this.caseText('result-title', single ? '开箱奖励' : '十连开箱奖励', W / 2, 583, 32, 555, '#ffdc96');
    this.caseText('result-box', CASES[opening.caseId].name, W / 2, 542, 17, 290, '#d4bc99');
    const tint = (prize: CasePrize) => prize.type === 'mod' ? QUALITY_COLORS[prize.quality] : '#ead9b9';
    opening.rewards.forEach((reward, i) => {
      const prize = casePrize(opening.caseId, reward.id)!;
      const x = single ? W / 2 : 186 + i % 5 * 227, y = single ? 349 : 422 - Math.floor(i / 5) * 195;
      this.caseArt(`card-${prize.type === 'mod' ? prize.quality : 0}`, x, y, single ? 392 : 214, single ? 286 : 176);
      this.caseIcon(prize, x, y + (single ? 38 : 36), single ? 205 : 143, single ? 116 : 71);
      this.caseText('reward-' + i, prize.title, x, y - (single ? 39 : 15), single ? 26 : 19, single ? 364 : 195);
      this.caseText('quality-' + i, this.caseCaption(prize), x, y - (single ? 69 : 37), single ? 20 : 16, 193, tint(prize));
      if (reward.mod) {
        const descriptions = modDescription(reward.mod).split(' · ');
        descriptions.forEach((value, line) => this.caseText(`reward-stat-${i}-${line}`, value, x, y - (single ? 93 : 54) - 15 * line,
          single ? 17 : 13, single ? 338 : 199, tint(prize)));
      }
    });
    this.caseButton('done', '确认', W / 2, 109, 228, 59, () => this.backFromCases(), true, 22);
  }
  private startCaseOpening(count: DrawCount) {
    if (this.caseRoll || this.casePreview) return;
    const transaction = prepareCaseOpening(this.profile, this.selectedCase, count);
    if ('reason' in transaction) {
      if (transaction.reason === 'pending') { this.open('cases'); return; }
      this.toast(transaction.reason === 'keys' ? `钥匙不足 · 开 ${count} 次需要 ${count} 把钥匙` :
        transaction.reason === 'mods' ? `配件空间不足 · 开 ${count} 次需要预留 ${count} 格，可在武器改装中分解配件` : '有奖励库存接近上限，请先消耗一部分再开箱');
      return;
    }
    if (!this.persist(transaction.profile)) { this.toast('本地存档写入失败，请重试'); return; }
    this.profile = transaction.profile;
    this.caseRoll = { opening: transaction.opening, elapsed: 0, cell: CASE_START, cards: [] };
    this.open('cases');
  }
  private stepCaseRoll(dt: number) {
    const roll = this.caseRoll;
    if (!roll) return;
    roll.elapsed += dt;
    const position = CASE_START + (CASE_STOP - CASE_START) * caseRollProgress(roll.elapsed);
    roll.track?.setPosition(-position * CASE_PITCH, 0);
    const open = Math.round(255 * Math.min(1, roll.elapsed / 0.42));
    if (roll.closed) roll.closed.opacity = 255 - open;
    if (roll.opened) roll.opened.opacity = open;
    const cell = Math.round(position);
    if (cell !== roll.cell) {
      roll.cell = cell;
      roll.cards.forEach((card, i) => {
        const visible = Math.abs(i - cell) <= CASE_START;
        if (card.active !== visible) card.active = visible;
      });
      const click = this.clips.get('reload');
      if (click && this.profile.sound) this.audio.playOneShot(click, 0.075);
    }
    if (roll.elapsed < CASE_ROLL_TIME + CASE_HOLD) return;
    this.caseRoll = undefined;
    this.play(roll.opening.rewards.some(reward => (reward.mod?.quality ?? 0) >= 2) ? 'win' : 'hit');
    this.open('cases');
  }
  private backFromCases() {
    if (this.caseRoll) return;
    if (this.casePreview) { this.casePreview = undefined; this.open('cases'); return; }
    if (this.profile.cases.pending) {
      const next = { ...this.profile, cases: { keys: this.profile.cases.keys } };
      if (!this.persist(next)) { this.toast('本地存档写入失败，请重试'); return; }
      this.selectedCase = this.profile.cases.pending.caseId;
      this.profile = next;
      this.open('cases');
      return;
    }
    this.open('shop');
  }
  private shopShell(title: string, banner: string, subtitle: string, back: () => void) {
    this.shopLayer = this.makeNode(title, this.modal);
    this.shopArt('background', W / 2, H / 2, W, H);
    this.shopText('shop-title', title, 43, 623, 52, 230, '#f5deb2');
    this.shopText('shop-banner', banner, 330, 536, 41, 450, '#f5deb2');
    this.shopText('shop-subtitle', subtitle, 332, 494, 17, 380, C.text);
    this.shopArt('coin', 1022, 689, 32, 32, true);
    this.shopText('shop-coins', this.profile.coins.toLocaleString('en-US'), 1049, 689, 23, 117, '#ffe4a4');
    this.shopText('shop-back', '返回', 1237, 689, 18, 63, C.text, Label.HorizontalAlign.CENTER);
    this.addButton('close', 1202, 663, 64, 52, back);
  }
  private buildShop() {
    const current = this.shopProduct ? PRODUCT_BY_ID[this.shopProduct] : undefined;
    const category = this.shopCategory;
    const categoryName = SHOP_CATEGORIES.find(tab => tab.id === category)!.label;
    const back = () => {
      if (this.shopProduct) { this.shopProduct = undefined; this.open('shop'); }
      else this.open(this.shopBack);
    };
    this.shopShell('商城', current ? '商品详情' : '装备商店', current ? current.category : categoryName, back);
    SHOP_CATEGORIES.forEach((tab, i) => {
      const y = 503 - i * 68;
      this.shopButton('shop-' + tab.id, tab.label, 145, y, 225, 59, () => {
        this.shopCategory = tab.id; this.shopFilter = ''; this.shopPage = 0; this.shopProduct = undefined; this.open('shop');
      }, tab.id === category ? 'selected' : 'button', 23);
      this.shopArt(`${tab.id}-icon`, 75, y, 36, 36, true);
    });
    this.shopButton('shop-cases', '补给开箱', 145, 282, 225, 59, () => { this.shopProduct = undefined; this.open('cases'); }, 'button', 23);
    this.caseArt('key', 75, 282, 31, 32, true, this.shopLayer);
    if (current) { this.buildShopProduct(current); return; }
    const catalog = PRODUCTS.filter(product => product.group === category);
    const filters = ['', ...Array.from(new Set(catalog.map(product => product.category)))];
    filters.forEach((filter, i) => this.shopButton('shop-filter-' + i, filter || '全部', 362 + i * 120, 432, 111, 44, () => {
      this.shopFilter = filter; this.shopPage = 0; this.open('shop');
    }, filter === this.shopFilter ? 'selected' : 'button'));
    const products = catalog.filter(product => !this.shopFilter || product.category === this.shopFilter);
    const pages = Math.ceil(products.length / 6);
    const page = Math.min(this.shopPage, pages - 1);
    products.slice(page * 6, page * 6 + 6).forEach((product, i) => {
      const x = 457 + i % 3 * 316, y = 321 - Math.floor(i / 3) * 165;
      this.shopArt('card', x, y, 302, 152);
      this.shopArt(product.id, x, y + 16, 263, 90, true);
      this.shopText('shop-card-' + product.id, product.title, x - 132, y - 49, 19, 172);
      const owned = ownedProduct(this.profile.armory, product);
      const price = product.group === 'gear' && owned ? '已拥有' : `${product.price} 金币${product.group === 'mod' && product.id !== 'parts' ? '起' : ''}`;
      this.shopText('shop-price-' + product.id, price, x + 130, y - 49, 15, 104, C.gold, Label.HorizontalAlign.RIGHT);
      this.addButton('product-' + product.id, x - 151, y - 76, 302, 152, () => { this.shopQuality = 0; this.shopProduct = product.id; this.open('shop'); });
    });
    if (pages > 1) {
      this.shopButton('shop-previous', '上一页', 636, 46, 106, 41, page > 0 ? () => { this.shopPage = page - 1; this.open('shop'); } : undefined);
      this.shopText('shop-page', `${page + 1} / ${pages}`, 774, 46, 16, 90, C.gold, Label.HorizontalAlign.CENTER);
      this.shopButton('shop-next', '下一页', 912, 46, 106, 41, page < pages - 1 ? () => { this.shopPage = page + 1; this.open('shop'); } : undefined);
    }
  }
  private buildShopProduct(product: Product) {
    this.shopArt('card', 775, 257, 944, 395);
    this.shopArt(product.id, 530, 276, 395, 220, true);
    this.shopText('shop-product', product.title, 778, 421, 26, 424, '#ffe1a2');
    this.shopText('shop-description', product.description, 778, 383, 16, 427);
    const isMod = product.group === 'mod' && product.id !== 'parts';
    if (isMod) {
      const kind = product.id as ModId;
      const compatible = HERO_IDS.filter(id => fitsWeapon(id, kind)).map(id => heroes[id].name).join('、');
      this.shopText('shop-compatibility', '适配：' + compatible, 778, 341, 17, 425, C.gold);
      for (const [i, quality] of QUALITY_NAMES.entries()) this.shopButton('shop-quality-' + i, quality,
        825 + i * 109, 291, 101, 47, () => { this.shopQuality = i as Quality; this.open('shop'); },
        this.shopQuality === i ? 'selected' : 'button', 16);
      const [min, max] = modRange(kind, this.shopQuality);
      this.shopText('shop-range', modText(kind, min === max ? min : min + '–' + max), 778, 232, 22, 420, QUALITY_COLORS[this.shopQuality]);
      if (kind === 'tube') this.shopText('shop-tube-bonus', '附带随机换弹速度增益', 778, 197, 15, 400, C.muted);
    }
    const owned = ownedProduct(this.profile.armory, product);
    const available = canStock(this.profile.armory, product), price = productPrice(product, this.shopQuality);
    const canBuy = available && this.profile.coins >= price;
    this.shopText('shop-stock', product.group === 'gear' ? (owned ? '已拥有' : '未购买') :
      product.group === 'item' ? `库存 ${owned} / ${MAX_STOCK}` : `已持有 ${owned}`, 333, 111, 18, 220, C.gold);
    this.shopButton('shop-buy', !available ? (product.group === 'gear' ? '已拥有' : '库存已满') :
      canBuy ? `购买  ${price} 金币` : `${price} 金币 · 余额不足`,
    1081, 105, 242, 49, canBuy ? () => {
      if (!buyProduct(this.profile, product.id, this.shopQuality)) return;
      this.save(); this.open('shop');
      if (this.storageOkay) this.toast(`已购买 ${product.title}`);
    } : undefined, canBuy ? 'purchase' : 'button');
    this.shopButton('shop-list', '返回列表', 608, 105, 147, 47, () => {
      this.shopProduct = undefined; this.open('shop');
    });
  }
  private buildRoster() {
    const id = this.rosterHero, p = this.profile, kit = p.armory.kits[id], hero = heroes[id];
    this.shopShell('装备', hero.name + '的装备', WEAPON_TYPES[hero.weapon] + ' · ' + hero.gun, () => this.open(this.rosterBack));
    HERO_IDS.forEach((other, i) => {
      this.shopButton('roster-hero-' + other, heroes[other].name + (p.owned[other] ? '' : ' · 未解锁'), 145, 503 - i * 68, 219, 58, () => {
        this.rosterHero = other; this.open('roster');
      }, id === other ? 'selected' : 'button');
    });
    this.shopButton('equipment-training', '角色培养', 145, 268, 207, 49, () => {
      this.trainingHeroId = id; this.trainingTab = 'growth';
      this.trainingBack = this.rosterBack === 'backpack' ? 'backpack' : 'menu'; this.open('training');
    });
    this.shopButton('roster-shop', '前往商城', 145, 209, 207, 47, () => { this.shopBack = 'roster'; this.shopProduct = undefined; this.open('shop'); });
    this.shopText('roster-weapon-label', '固定武器', 321, 430, 20, 160, C.gold);
    this.shopArt('card', 620, 343, 580, 133);
    this.shopArt(FIXED_WEAPON_ART[id], 445, 350, 200, 83, true);
    this.shopText('roster-gun', hero.gun + '　Lv.' + kit.weaponLevel, 585, 366, 22, 310, C.gold);
    this.shopButton('equipment-workshop', '武器改装', 680, 316, 190, 42, () => this.openWorkshop(id), 'selected');
    this.shopText('roster-gear-label', '防护与背包', 321, 249, 20, 160, C.gold);
    GEAR_IDS.forEach((piece, i) => {
      const equipped = kit.gear.includes(piece), owned = p.armory.gear.includes(piece);
      this.shopButton('gear-' + piece, GEAR[piece].category + (equipped ? ' · 已装备' : owned ? ' · 装备' : ' · 未购买'), 453 + i * 265, 209, 251, 45,
        p.owned[id] && owned ? () => { if (toggleGear(p, id, piece)) { this.save(); this.open('roster'); } } : undefined, equipped ? 'selected' : this.rosterFocus === piece ? 'purchase' : 'button');
    });
    this.shopText('roster-tactical-label', '下次行动的战术道具', 321, 150, 20, 305, C.gold);
    this.shopText('roster-tactical-hint', '从库存携带最多 2 件，医疗补给自动携带', 610, 150, 15, 465, C.muted);
    const selected = p.armory.tactical;
    const options = [null, ...SHOP_TACTICALS] as const;
    options.forEach((kind, i) => {
      const count = kind ? p.armory.counts[kind] ?? 0 : 0;
      const label = kind ? `${TACTICAL_DEFINITIONS[kind].title} ×${count}` : '关卡配发';
      this.shopButton('carry-' + (kind ?? 'default'), label, 390 + i * 187, 105, 172, 47, (!kind || count || kind === selected) ? () => {
        p.armory.tactical = kind; this.save(); this.open('roster');
      } : undefined, kind === selected ? 'selected' : kind === this.rosterFocus ? 'purchase' : 'button', 15);
    });
  }
  private statNumber(n: number) { return n.toFixed(1).replace(/\.0$/, ''); }
  private openWorkshop(id: HeroId, mod?: Attachment) {
    this.trainingHeroId = id;
    this.trainingTab = 'workshop';
    this.trainingBack = this.mode === 'backpack' || this.mode === 'roster' && this.rosterBack === 'backpack' ? 'backpack' : 'menu';
    const slot = mod ? MODS[mod.kind].slot : WEAPON_SLOTS[id][0];
    this.trainingSlot = Math.max(0, WEAPON_SLOTS[id].indexOf(slot));
    this.trainingMod = mod?.serial;
    const index = mod ? workshopMods(this.profile.armory, id, slot).findIndex(entry => entry.serial === mod.serial) : 0;
    this.trainingModPage = Math.floor(Math.max(0, index) / WORKSHOP_PAGE_SIZE);
    this.open('training');
  }
  private selectWorkshopSlot(index: number) {
    if (this.trainingSwitch) return;
    this.trainingSlot = index;
    this.trainingMod = undefined;
    this.trainingModPage = 0;
    this.renderTrainingDetails();
  }
  private renderWeaponWorkshop(parent: Node, text: (id: string, caption: string, x: number, top: number, size: number, width: number, tint?: string, align?: Parameters<Blackout['text']>[8]) => Label) {
    const p = this.profile, id = this.trainingHeroId, armory = p.armory, kit = armory.kits[id];
    const gun = configuredHero(id, kit.weaponLevel, installedMods(id, kit, armory.mods)), base = configuredHero(id);
    const stats = heroStats(id, p.levels[id], profileGrowth(p, id), gun);
    const bench = this.shopFrames.get('workshop-panel');
    if (!bench) {
      text('workshop-status', '正在加载改装台素材', 1175, 540, 18, 430, C.gold, Label.HorizontalAlign.CENTER);
      return;
    }
    const center = Label.HorizontalAlign.CENTER, right = Label.HorizontalAlign.RIGHT;
    const art = (key: ShopImage, x: number, top: number, w: number, h: number, fit = false) =>
      this.shopArt(key, trainingX(x), trainingY(top), trainingX(w), trainingX(h), fit, parent);
    const hit = (key: string, x: number, top: number, w: number, h: number, action: () => void) =>
      this.addButton(key, trainingX(x - w / 2), trainingY(top + h / 2), trainingX(w), trainingX(h), () => {
        if (!this.trainingSwitch) action();
      });
    const control = (key: string, caption: string, x: number, top: number, w: number, action?: () => void, active = false, size = 13) => {
      const plate = art(active ? 'workshop-active' : 'workshop-button', x, top, w, 34);
      text(key, caption, x, top, size, w - 10, action ? '#fff0cf' : C.muted, center);
      if (action) {
        const node = hit('workshop-' + key, x, top, w, 34, action);
        if (plate) this.setButtonArtwork(node, plate.node);
      }
    };
    const changed = () => { this.save(); this.renderTrainingDetails(); };
    const affordable = (cost: { coins: number; parts: number } | undefined) =>
      !!cost && p.coins >= cost.coins && armory.parts >= cost.parts;
    const value = (key: string, copy: string, x: number, top: number, size: number, w: number, tint: string, align?: Parameters<Blackout['text']>[8]) => {
      const label = text(key, copy, x, top, size, w, tint, align);
      this.trainingFlashLabels.push([label, color(tint)]);
    };
    art('workshop-panel', 1187, 546, 868, 652);
    value('fixed-gun', gun.gun, 817, 298, 19, 322, C.gold);
    value('weapon-level', `Lv.${kit.weaponLevel}`, 1210, 298, 16, 95, '#f7e5c2', right);
    art(FIXED_WEAPON_ART[id], 1020, 375, 330, 112, true);
    const upgrade = weaponUpgradeCost(kit.weaponLevel);
    if (upgrade) {
      const nextGun = configuredHero(id, kit.weaponLevel + 1, installedMods(id, kit, armory.mods));
      const next = heroStats(id, p.levels[id], profileGrowth(p, id), nextGun);
      text('weapon-next', `下级 ${this.statNumber(next.damage)}伤害 · ±${(nextGun.spread * 180 / Math.PI).toFixed(2)}°`, 817, 444, 12, 212, C.gold);
    }
    control('weapon-upgrade', upgrade ? `升级 ${upgrade.coins}金币 · ${upgrade.parts}零件` : '武器已满级', 1142, 446, 189,
      p.owned[id] && affordable(upgrade) ? () => { if (upgradeWeapon(p, id)) changed(); } : undefined, affordable(upgrade), 12);
    const attributes = [
      ['伤害' + (gun.pellets > 1 ? ' / 弹丸' : ''), this.statNumber(stats.damage), stats.damage - base.damage],
      ['射速', stats.attackRate.toFixed(2) + ' 发/秒', stats.attackRate - 1 / base.interval],
      ['弹道散布', '±' + (gun.spread * 180 / Math.PI).toFixed(2) + '°', (gun.spread - base.spread) * 180 / Math.PI],
      [gun.pellets > 1 ? '弹仓容量' : '弹匣容量', gun.magazine + ' 发', gun.magazine - base.magazine],
      ['换弹时间', gun.reload.toFixed(2) + ' 秒', gun.reload - base.reload],
      ['枪声范围', String(gun.shotSound.radius), gun.shotSound.radius - base.shotSound.radius],
    ] as const;
    text('weapon-attributes', '武器属性', 1259, 297, 16, 265, C.gold);
    attributes.forEach(([name, current, diff], i) => {
      const y = 326 + i * 25;
      text('weapon-stat-' + i, name, 1263, y, 12, 124);
      value('weapon-stat-value-' + i, current, 1481, y, 13, 108, '#f5e7cb', right);
      if (Math.abs(diff) > 0.0001) value('weapon-stat-diff-' + i, `(${diff >= 0 ? '+' : '−'}${Math.abs(diff).toFixed(i === 2 || i === 4 ? 2 : i === 1 ? 2 : 1).replace(/\.0$/, '')})`,
        1564, y, 11, 75, '#a9d77c', right);
    });

    text('mod-heading', '武器改装', 815, 495, 17, 200, C.gold);
    art('parts', 1453, 495, 27, 25, true);
    text('mod-parts', `改装零件 ${armory.parts}`, 1574, 495, 13, 120, C.gold, right);
    WEAPON_SLOTS[id].forEach((slot, i) => {
      const x = 897 + 193 * i;
      const mod = armory.mods.find(item => item.serial === kit.slots[slot]);
      const selected = i === this.trainingSlot;
      if (mod || selected) art(`socket-${mod?.quality ?? 3}`, x, 584, 180, 125);
      if (mod) art(mod.kind, x, 567, 93, 67, true);
      if (selected) text('slot-selected-' + i, '▼', x, 532, 9, 45, C.gold, center);
      text('slot-' + i, SLOT_NAMES[slot], x, 612, 14, 158, selected ? C.gold : '#f4e4bf', center);
      text('slot-state-' + i, mod ? `${QUALITY_NAMES[mod.quality]} · Lv.${mod.level}` : '空槽', x, 635, 10, 140,
        mod ? QUALITY_COLORS[mod.quality] : C.muted, center);
      hit('workshop-slot-' + i, x, 581, 170, 115, () => this.selectWorkshopSlot(i));
    });
    const slot = WEAPON_SLOTS[id][this.trainingSlot];
    const installed = kit.slots[slot];
    const compatible = workshopMods(armory, id, slot);
    const pages = Math.max(1, Math.ceil(compatible.length / WORKSHOP_PAGE_SIZE));
    const page = Math.min(this.trainingModPage, pages - 1);
    const selected = compatible.find(mod => mod.serial === this.trainingMod) ?? compatible.find(mod => mod.serial === installed) ?? compatible[page * WORKSHOP_PAGE_SIZE];
    text('mod-list-heading', `${SLOT_NAMES[slot]} · 兼容配件`, 813, 698, 16, 325, C.gold);
    if (pages > 1) {
      control('mod-prev', '‹', 1450, 699, 46, page > 0 ? () => { this.trainingModPage = page - 1; this.trainingMod = compatible[(page - 1) * WORKSHOP_PAGE_SIZE].serial; this.renderTrainingDetails(); } : undefined);
      text('mod-page', `${page + 1}/${pages}`, 1500, 699, 12, 50, C.gold, center);
      control('mod-next', '›', 1550, 699, 46, page + 1 < pages ? () => { this.trainingModPage = page + 1; this.trainingMod = compatible[(page + 1) * WORKSHOP_PAGE_SIZE].serial; this.renderTrainingDetails(); } : undefined);
    }
    if (!selected) {
      text('no-mod', p.owned[id] ? '暂无兼容配件，可从商城或关卡获得。' : '解锁角色后可为武器安装配件。', 817, 753, 15, 499, C.muted);
      control('mod-shop', '前往商城', 1480, 762, 162, () => {
        this.shopBack = 'training'; this.shopCategory = 'mod'; this.shopFilter = SLOT_NAMES[slot]; this.shopPage = 0; this.shopProduct = undefined; this.open('shop');
      });
      return;
    }
    compatible.slice(page * WORKSHOP_PAGE_SIZE, (page + 1) * WORKSHOP_PAGE_SIZE).forEach((mod, i) => {
      const x = 897 + i * 193;
      control('mod-' + mod.serial, MODS[mod.kind].title + (mod.serial === installed ? ' · 已装' : ''), x, 736, 179, () => {
        this.trainingMod = mod.serial; this.renderTrainingDetails();
      }, mod.serial === selected.serial, 12);
    });
    const cost = modUpgradeCost(selected), equipped = selected.serial === installed;
    value('mod-effect', `${QUALITY_NAMES[selected.quality]} Lv.${selected.level}　${modDescription(selected)}`, 815, 771, 13, 383, QUALITY_COLORS[selected.quality]);
    if (cost) text('mod-preview', `下级 ${modDescription(selected, selected.level + 1)}`, 815, 805, 12, 350, C.gold);
    if (!equipped) {
      const mods = installedMods(id, kit, armory.mods).filter(mod => mod.serial !== installed);
      const next = configuredHero(id, kit.weaponLevel, [...mods, selected]);
      const compare = (name: string, from: string | number, to: string | number) => from === to ? '' : `${name} ${from} → ${to}`;
      const spread = (n: number) => (n * 180 / Math.PI).toFixed(2) + '°';
      const changes = [
        compare('散布', spread(gun.spread), spread(next.spread)), compare('容量', gun.magazine, next.magazine),
        compare('枪声', gun.shotSound.radius, next.shotSound.radius), compare('换弹', gun.reload.toFixed(2), next.reload.toFixed(2)),
        compare('视野', gun.visionRange, next.visionRange),
      ].filter(Boolean);
      if (changes.length) text('mod-compare', '安装后 ' + changes.join(' · '), 1127, 818, 11, 438, C.gold);
    }
    control('mod-install', equipped ? '卸下' : installed ? '替换' : '安装', 1180, 783, 111,
      p.owned[id] ? () => { if (installMod(p, id, slot, equipped ? undefined : selected.serial)) changed(); } : undefined);
    control('mod-upgrade', cost ? `升级 ${cost.coins}币 · ${cost.parts}件` : '配件已满级', 1330, 783, 169,
      p.owned[id] && affordable(cost) ? () => { if (upgradeMod(p, selected.serial)) changed(); } : undefined, affordable(cost), 12);
    control('mod-salvage', equipped ? '已安装' : `分解 +${salvageValue(selected)}`, 1495, 783, 135,
      equipped ? undefined : () => { if (salvageMod(armory, selected.serial)) { this.trainingMod = undefined; changed(); } });
  }
  private trainingSprite(id: TrainingImage, parent: Node, x: number, y: number, width: number, height: number) {
    const frame = this.trainingFrames.get(id);
    if (!frame) return;
    const node = this.makeNode('Training ' + id, parent);
    node.setPosition(x - W / 2, y - H / 2);
    this.setupSprite(node, frame, width, height);
    return node;
  }
  private buildTraining() {
    const layer = this.trainingLayer = this.makeNode('Character training', this.modal);
    this.trainingSprite('background', layer, W / 2, H / 2, W, H);

    const clip = this.makeNode('Training portrait window', layer);
    const clipX = trainingX(473), clipY = trainingY(480);
    clip.setPosition(clipX - W / 2, clipY - H / 2);
    clip.getComponent(UITransform)!.setContentSize(trainingX(715), trainingX(840));
    clip.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    this.trainingPortraitStage = this.makeNode('Training portrait stage', clip);
    this.trainingPortraitStage.setPosition(W / 2 - clipX, H / 2 - clipY);
    this.trainingPortrait = this.makeTrainingPortrait(this.trainingHeroId);

    this.trainingSprite('panel', layer, W / 2, H / 2, W, H);
    this.renderTrainingDetails();
  }
  private makeTrainingPortrait(id: HeroId, offset = 0) {
    if (!this.trainingPortraitStage) return;
    const { key, position } = TRAINING_PROFILES[id];
    const frame = this.trainingFrames.get(`${key}-art`);
    if (!frame) return;
    const [x, bottom, height] = position;
    const width = height * frame.originalSize.width / frame.originalSize.height;
    return this.trainingSprite(`${key}-art`, this.trainingPortraitStage,
      trainingX(x) + offset, trainingY(bottom - height / 2), trainingX(width), trainingX(height));
  }
  private selectTrainingHero(target: HeroId) {
    if (this.trainingSwitch) {
      const swap = this.trainingSwitch;
      if (swap.swapped) swap.queued = target;
      else swap.target = target;
      return;
    }
    if (target === this.trainingHeroId) return;
    const outgoing = this.trainingPortrait, startX = outgoing?.position.x ?? 0;
    this.noticeTime = 0;
    this.trainingSwitch = { target, elapsed: 0, swapped: false, outgoing, startX, fromScores: this.trainingRadar?.scores };
  }
  private stepTrainingSwitch(dt: number) {
    const swap = this.trainingSwitch;
    if (!swap) return;
    const midpoint = 0.14, duration = 0.36, travel = trainingX(700);
    swap.elapsed = Math.min(duration, swap.elapsed + dt);
    const out = clamp(swap.elapsed / 0.26, 0, 1);
    const outgoing = swap.outgoing;
    if (outgoing) outgoing.setPosition(swap.startX - travel * out * out, outgoing.position.y);
    if (swap.elapsed >= midpoint && !swap.swapped) {
      swap.swapped = true;
      this.trainingHeroId = swap.target;
      this.trainingPortrait = this.makeTrainingPortrait(swap.target, travel);
      swap.endX = (this.trainingPortrait?.position.x ?? travel) - travel;
      this.trainingNoiseOpen = false;
      this.trainingSlot = 0; this.trainingMod = undefined; this.trainingModPage = 0;
      this.renderTrainingDetails();
    }
    if (!swap.swapped) return;
    const incoming = this.trainingPortrait;
    const progress = clamp((swap.elapsed - midpoint) / (duration - midpoint), 0, 1);
    const remaining = (1 - progress) ** 3;
    if (incoming && swap.endX !== undefined) incoming.setPosition(swap.endX + travel * remaining, incoming.position.y);
    const radar = this.trainingRadar, from = swap.fromScores;
    if (radar && from) this.drawTrainingRadar(radar.graphics, radar.scores.map((score, i) => score + (from[i] - score) * remaining));

    const flash = (1 - clamp((swap.elapsed - midpoint) / 0.13, 0, 1)) ** 2;
    const white = color('#ffffff');
    for (const [label, base] of this.trainingFlashLabels) {
      label.color = flash > 0 ? Color.lerp(new Color(), base, white, flash) : base;
    }
    if (swap.elapsed < duration) return;
    if (outgoing) { outgoing.active = false; outgoing.destroy(); }
    this.trainingSwitch = undefined;
    if (swap.queued !== undefined) this.selectTrainingHero(swap.queued);
  }
  private drawTrainingRadar(radar: Graphics, scores: readonly number[]) {
    radar.clear();
    const points = TRAINING_AXES.map(({ x, y }, i) => ({
      x: trainingX(1402 + (x - 1402) * scores[i]) - W / 2,
      y: trainingY(498 + (y - 498) * scores[i]) - H / 2,
    }));
    polygon(radar, points, '#ef9c34', 115);
    points.forEach((a, i) => {
      const b = points[(i + 1) % points.length];
      line(radar, a.x, a.y, b.x, b.y, '#ffd07b', 1.5);
      disc(radar, a.x, a.y, 2.4, '#ffe1a0');
    });
  }
  private renderTrainingDetails() {
    const layer = this.trainingLayer!;
    const previous = this.trainingDetails;
    if (previous) {
      previous.active = false;
      for (const [id, label] of this.labels) if (label.node.parent === previous) this.labels.delete(id);
      this.clearButtons();
      previous.destroy();
    }
    const details = this.trainingDetails = this.makeNode('Training information', layer);
    this.trainingFlashLabels = [];
    this.trainingRadar = undefined;
    const art = (id: TrainingImage, x: number, top: number, w: number, h: number) =>
      this.trainingSprite(id, details, trainingX(x), trainingY(top), trainingX(w), trainingX(h));
    const center = Label.HorizontalAlign.CENTER, right = Label.HorizontalAlign.RIGHT;
    const gold = '#ffcf7a', cream = '#f4e5cd', muted = '#c9b8a3', green = '#a9d77c';
    const label = (id: string, caption: string, x: number, top: number, size: number, width: number, tint = cream, align = Label.HorizontalAlign.LEFT) => {
      const text = this.text('training-' + id, caption, trainingX(x), trainingY(top), size, tint, details, trainingX(width), align);
      text.isBold = true;
      text.enableOutline = true;
      text.outlineColor = color('#100d08');
      text.outlineWidth = 2;
      return text;
    };
    const value = (...args: Parameters<typeof label>) => {
      const text = label(...args);
      this.trainingFlashLabels.push([text, color(args[6] ?? cream)]);
    };
    const button = (id: string, x: number, top: number, w: number, h: number, run: () => void) =>
      this.addButton(id, trainingX(x - w / 2), trainingY(top + h / 2), trainingX(w), trainingX(h), run);
    const control = (id: string, caption: string, x: number, top: number, w: number, h: number, run?: () => void, active = false, size = 17) => {
      const plate = art(active ? 'active' : 'tab', x, top, w, h);
      label('button-' + id, caption, x, top - 2, size, w - 27, run || active ? '#fff0d0' : muted, center);
      if (run) {
        const hit = button(id, x, top, w, h, run);
        if (plate) this.setButtonArtwork(hit, plate);
      }
    };
    art('people', 128, 68, 93, 73);
    label('title', '角色培养', 198, 67, 43, 333);
    control('close', this.trainingBack === 'backpack' ? '背包' : '首页', 1600, 42, 119, 61, () => this.open(this.trainingBack));

    const id = this.trainingHeroId, hero = heroes[id], p = this.profile, kind = this.trainingKind;
    if (!this.trainingFrames.has('panel') || !this.trainingFrames.has(`${TRAINING_PROFILES[id].key}-art`)) {
      label('loading', this.trainingArtFailed ? '角色培养素材加载失败' : '正在加载角色培养素材', 836, 471, 24, 520, muted, center);
      return;
    }
    const wallet = [
      { key: 'materials', name: '培养材料', value: p.materials, x: 934 },
      { key: 'coins', name: '金币', value: p.coins, x: 1155 },
      { key: 'tickets', name: '招募券', value: p.tickets, x: 1376 },
    ] as const;
    for (const entry of wallet) {
      art('tab', entry.x, 44, 216, 56);
      if (entry.key === 'materials') art('materials', entry.x - 73, 43, 39, 34);
      else this.checkInSprite(entry.key, details, trainingX(entry.x - 73), trainingY(43), trainingX(38), trainingX(32));
      label('wallet-' + entry.key, entry.name, entry.x - 44, 34, 11, 140, muted);
      label('wallet-' + entry.key + '-value', entry.value.toLocaleString('en-US'), entry.x - 44, 53, 17, 143, gold);
    }
    const tabs = ['升级', '突破', '技能', '装备', '专精'];
    tabs.forEach((name, i) => {
      const x = 840 + i * 168;
      control('tab-' + i, name, x, 166, 163, 76, i === 0 || i === 3 ? () => {
        if (this.trainingSwitch) return;
        this.trainingTab = i === 3 ? 'workshop' : 'growth';
        this.renderTrainingDetails();
      } : undefined, i === (this.trainingTab === 'growth' ? 0 : 3), 22);
      if (i > 0 && i !== 3) label('unavailable-' + i, '未开放', x, 186, 10, 96, muted, center);
    });
    HERO_IDS.forEach((other, i) => {
      const top = 256 + i * 158, x = 135 - i * 15, available = p.owned[other];
      const face = art(`${TRAINING_PROFILES[other].key}-face`, x, top, 104, 104);
      if (face && !available) face.getComponent(Sprite)!.color = color('#97938c');
      art(other === id ? 'frame-selected' : 'frame', x, top, 145, 132);
      if (!available) art('lock', x + 43, top + 43, 20, 24);
      label('name-' + other, heroes[other].name, x, top + 77, 16, 118, other === id ? gold : cream, center);
      button('training-hero-' + other, x, top + 12, 145, 140, () => this.selectTrainingHero(other));
    });

    art('header', 363, 792, 388, 105);
    value('hero', hero.name, 251, 774, 39, 340, gold);
    label('role', hero.role, 375, 776, 16, 172, muted);
    const kit = p.armory.kits[id], weapon = configuredHero(id, kit.weaponLevel, installedMods(id, kit, p.armory.mods));
    label('gun', WEAPON_TYPES[weapon.weapon], 243, 812, 19, 294);
    if (this.trainingTab === 'workshop') { this.renderWeaponWorkshop(details, label); return; }
    const owned = p.owned[id], level = p.levels[id], growth = profileGrowth(p, id);
    const current = heroStats(id, level, growth, weapon);
    const next = heroStats(id, level + Number(kind === 'level'), {
      mobility: growth.mobility + Number(kind === 'mobility'), attack: growth.attack + Number(kind === 'attack'),
    }, weapon);
    const rating = heroRating(id, current, weapon), powerGain = heroRating(id, next, weapon).power - rating.power;
    const rank = { level, mobility: growth.mobility, attack: growth.attack };
    const cost = trainingCost(p, id, kind);
    value('level', `Lv. ${level} / ${TRAINING_CAP}`, 895, 254, 26, 315, cream);
    if (!owned) label('locked', '未解锁', 1078, 255, 14, 108, muted);
    art('damage', 1300, 253, 34, 32);
    value('power', `战力  ${rating.power.toLocaleString('en-US')}`, 1539, 254, 21, 222, gold, right);
    this.checkInSprite('track', details, trainingX(1208), trainingY(291), trainingX(658), trainingX(14));
    const fill = this.checkInSprite('fill', details, trainingX(1208), trainingY(291), trainingX(658), trainingX(14))?.getComponent(Sprite);
    if (fill) { fill.type = Sprite.Type.FILLED; fill.fillStart = 0; fill.fillRange = level / TRAINING_CAP; }

    label('attributes', '基础属性', 837, 353, 20, 190, gold);
    const showNext = owned && cost !== null, currentColumn = showNext ? 1078 : 1173;
    label('current-heading', '当前', currentColumn, 353, 12, 72, muted, right);
    if (showNext) label('next-heading', '提升后', 1173, 353, 12, 82, muted, right);
    const stats = [
      { icon: 'health', name: '生命', value: String(current.hp), next: String(next.hp), h: 24 },
      { icon: 'damage', name: weapon.pellets > 1 ? '单颗弹丸伤害' : '单发伤害', value: this.statNumber(current.damage), next: this.statNumber(next.damage), h: 28 },
      { icon: 'movement', name: '移动速度', value: this.statNumber(current.speed), next: this.statNumber(next.speed), h: 21 },
      { icon: 'fire', name: '攻击速度', value: current.attackRate.toFixed(2) + ' 发/秒', next: next.attackRate.toFixed(2) + ' 发/秒', h: 11 },
      { icon: 'sight', name: '正面 / 近身视野', value: `${current.visionRange} / ${this.statNumber(current.peripheralRange)}`, h: 20 },
    ] as const;
    stats.forEach((stat, i) => {
      const top = 399 + i * 38, x = 837 - i * 5;
      art(stat.icon, x, top, 27, stat.h);
      label(stat.icon + '-name', stat.name, x + 25, top, 15, 184);
      value(stat.icon, stat.value, currentColumn, top, 16, 143, cream, right);
      if (showNext && 'next' in stat && stat.next !== stat.value) value(stat.icon + '-next', stat.next, 1173, top, 15, 113, green, right);
    });
    const noise = rating.noise;
    label('noise-name', '行动噪音', 837, 589, 15, 160);
    value('noise', `${noise.score} / 100`, currentColumn, 589, 16, 143, cream, right);
    label('noise-toggle', this.trainingNoiseOpen ? '收起 ▴' : '详情 ▾', showNext ? 1173 : 1013, 589, 13, 86, gold, right);
    button('training-noise', 987, 589, 390, 37, () => {
      if (this.trainingSwitch) return;
      this.trainingNoiseOpen = !this.trainingNoiseOpen;
      this.renderTrainingDetails();
    });

    label('rating', '能力评级', 1244, 353, 20, 185, gold);
    const radar = this.graphics('Training rating data', details);
    this.trainingRadar = { graphics: radar, scores: rating.axes };
    this.drawTrainingRadar(radar, this.trainingSwitch?.fromScores ?? rating.axes);
    for (const [i, axis] of TRAINING_AXES.entries()) {
      const score = rating.axes[i];
      const grade = score >= 0.8 ? 'S' : score >= 0.6 ? 'A' : score >= 0.4 ? 'B' : 'C';
      value('rating-' + i, `${axis.name} ${grade}`, axis.lx, axis.ly, 14, 112, gold, center);
    }

    label('materials-title', '材料消耗', 800, 665, 21, 275, gold);
    const tracks = [
      { key: 'level', word: '基础' }, { key: 'mobility', word: '移速' }, { key: 'attack', word: '攻速' },
    ] as const;
    tracks.forEach((track, i) => control('track-' + track.key, `${track.word} Lv.${rank[track.key]}`, 864 + i * 156, 716, 149, 47, () => {
      if (this.trainingSwitch) return;
      this.trainingKind = track.key;
      this.noticeTime = 0;
      this.renderTrainingDetails();
    }, track.key === kind, 14));
    if (owned) {
      art('materials', 820, 776, 61, 51);
      label('cost', cost === null ? '此项已满级' : `培养材料 ×${cost}`, 864, 770, 19, 222, gold);
      if (cost !== null && p.materials < cost) label('insufficient', `还差 ${cost - p.materials} 材料`, 864, 803, 14, 201, muted);
      else if (cost !== null) label('power-gain', `升级后战力 +${powerGain}`, 864, 803, 14, 244, green);
      const canTrain = cost !== null && p.materials >= cost;
      control('train-' + kind, cost === null ? '已满级' : '升级  »', 1402, 762, 246, 72, canTrain ? () => {
        if (this.trainingSwitch || !upgrade(p, id, kind)) return;
        this.save(); this.renderTrainingDetails();
        if (this.storageOkay) this.toast(`${hero.name} · 培养成功`);
      } : undefined, canTrain, 23);
    } else {
      art('lock', 833, 778, 36, 42);
      label('unlock', id === GHOST_ID ? '通过商城招募幽灵' : '完成第三关「归巢」后解锁', 864, 777, 17, 405, muted);
      if (id === GHOST_ID) control('training-recruit', '前往招募', 1402, 762, 246, 72, () => {
        if (this.trainingSwitch) return;
        this.showRecruit('training');
      }, true, 22);
    }
    if (this.trainingNoiseOpen) {
      art('plate', 989, 495, 397, 151);
      label('noise-explainer', '分数越低，行动越安静', 989, 451, 15, 350, gold, center);
      label('noise-footsteps', `脚步声范围  ${noise.footsteps}`, 905, 491, 14, 178, cream, center);
      label('noise-gunfire', `枪声范围  ${noise.gunfire}`, 1082, 491, 14, 164, cream, center);
      label('noise-obstruction', '基础传播范围，受距离和遮挡影响', 989, 530, 13, 356, muted, center);
    }
  }
  private buildRecruit() {
    this.panel('招募特勤', `招募券 ${this.profile.tickets}  ·  可招募角色：幽灵`, () => this.open(this.recruitBack));
    this.trainingSprite('ghost-face', this.modal, 420, 371, 177, 177);
    this.trainingSprite('frame', this.modal, 420, 371, 228, 216);
    this.text('recruit-hero-0', '幽灵 · 突击手', 420, 239, 24, heroes[GHOST_ID].color, this.modal, 260, Label.HorizontalAlign.CENTER);
    this.text('draw-title', this.lastDraw || '幽灵待命', 778, 440, 22, C.gold, this.modal, 340);
    this.text('draw-desc', '首次招募幽灵直接解锁', 778, 387, 18);
    this.text('draw-dup', '已拥有时转为 30 培养材料', 778, 345, 16, C.muted);
    this.button('draw', '招募一次 · 1 券', 778, 224, 340, () => {
      const result = recruit(this.profile); if (!result) return;
      this.lastDraw = result.duplicate ? '幽灵 · 重复 / 材料 +30' : '新特勤加入：幽灵';
      this.save(); this.play('win'); this.open('recruit');
    }, true, this.profile.tickets >= 1, 62);
  }
  private buildSettings() {
    const toggleSound = () => {
      this.profile.sound = !this.profile.sound;
      this.save();
      this.open('settings');
    };
    this.dialog('设置', [
      { id: 'sound', label: this.profile.sound ? '关闭音效' : '开启音效', run: toggleSound },
      { id: 'help', label: '操作说明', run: () => this.open('help') },
    ], () => this.open(this.battleSettings ? 'playing' : 'menu'));
    this.button('aim-assist', `轻辅助瞄准 ${this.profile.aimAssist ? 'ON' : 'OFF'}`, 360, 393, 260, () => {
      this.profile.aimAssist = !this.profile.aimAssist; this.save(); this.open('settings');
    }, false, true, 44);
    this.button('auto-fire', `自动开火 ${this.profile.autoFire ? 'ON' : 'OFF'}`, 660, 393, 260, () => {
      this.toggleAutoFire(); this.open('settings');
    }, false, true, 44);
    this.dialogText('aim-description', '辅助仅手机主动瞄准生效 · 桌面不磁吸', W / 2, 365, 18, 700, '#d7c8b2');
    this.dialogText('auto-description', '自动：右杆只转向，当前射线命中可见敌人才射击', W / 2, 335, 18, 700, '#d7c8b2');
    this.dialogText('sound-label', this.profile.sound ? '游戏音效已开启' : '游戏音效已关闭', W / 2, 300, 19, 610);
  }
  private buildHelp() {
    this.panel('行动指南', '射击、移动、闪避和观察视野，是你在宿舍内生存的手段。', () => this.open('settings'));
    const rows = [
      ['移动', '手机：左侧摇杆', '电脑：W A S D / 方向键'],
      ['瞄准与射击', '手动：推右杆射击；自动：右杆只转向', '电脑：鼠标瞄准，手动按住左键'],
      ['辅助 / 自动', '设置切换；自动只在当前射线命中时开火', '桌面无磁吸，可开启自动试玩'],
      ['翻滚', '手机：点击「翻滚」', '电脑：空格，沿移动方向翻滚'],
      ['交互与拾取', '手机：靠近后点击对应的交互或拾取按钮', '电脑：E 交互 / F 拾取 / T 布置陷阱'],
      ['换弹', '手机：点击弹匣区域', '电脑：R 换弹，空弹匣自动换弹'],
      ['视野', '朝瞄准方向看得更远', '墙体和高家具遮挡视线与子弹'],
      ['目标', '在两层宿舍各找到一把钥匙并撤离', '每清理一个有敌人的区域，恢复 20 生命'],
    ];
    rows.forEach((r, i) => { const y = 477 - i * 45; this.text('help-a' + i, r[0], 146, y, 18, C.gold, this.modal, 200); this.text('help-b' + i, r[1], 350, y, 17, C.text, this.modal, 420); this.text('help-c' + i, r[2], 780, y, 16, C.muted, this.modal, 370); this.sline(this.modalArt, 145, y - 21, 1135, y - 21, C.line, 1, 100); });
    this.text('help-tip', '木门可被子弹打坏，锁住的铁门需要钥匙。宿管室门上的警报会引来丧尸。Esc / P 暂停。', 146, 123, 16, C.muted);
  }
  private buildPause() {
    const resume = () => this.open('playing');
    this.dialog('行动暂停', [
      { id: 'resume', label: '继续行动', run: resume },
      { id: 'abandon', label: '结束本次行动', run: () => { if (this.battle.tutorial) { this.open('menu'); return; } this.battle.status = 'lost'; this.finishBattle(); } },
    ], resume);
    this.dialogText('pause-tip', this.battle.tutorial ? '教学已保存 · 返回首页后可从当前步骤重开' : '继续后将从当前位置恢复', W / 2, 391, 25, 640);
    if (this.battle.tutorial) {
      this.button('tutorial-skip', '跳过教学 · 原地继续探索', 420, 330, 440, () => {
        this.requestTutorialSkip();
      }, false, true, 42);
      this.button('tutorial-exit', '保存教学步骤并返回首页（本场不结算）', 380, 270, 520, () => this.open('menu'), false, true, 42);
    }
  }
  private buildResult() {
    const won = this.battle.status === 'won';
    const street = !!this.battle.stage.street;
    const operation = !!this.battle.stage.operation;
    const nextChapter = won && (street ? '归巢' : this.battle.stage.dorm?.number === 1 || this.battle.stage.id === DORM_LEVEL.id ? '归途' : this.unlockedEngineer ? '断翼行动' : '');
    const back = () => { this.battle = this.makeBattle(); this.open('menu'); };
    this.dialog(won ? operation ? '断翼行动 · 完成' : street ? '已抵达住宅街' : '撤离成功' : '行动结束', [
      { id: 'retry', label: '选择关卡', run: () => this.open('chapters') },
      { id: 'base', label: '返回整备', run: back },
    ], back);
    this.dialogText('result-stat', `击败 ${this.battle.kills}  /  清理 ${this.battle.clearedTotal} 区  /  ${this.time(this.battle.elapsed)}`, W / 2, 423, 23, 650);
    const keys = this.reward.keys ? `     开箱钥匙 +${this.reward.keys}` : '';
    this.dialogText('result-reward', `材料 +${this.reward.materials}     招募券 +${this.reward.tickets}     金币 +${this.reward.coins}${keys}`, W / 2, 366, 23, 700, '#ffd282');
    const workshop = this.battle.workshopReward;
    if (workshop?.parts || workshop?.mods.length) this.dialogText('result-mods',
      `改装零件 +${workshop.parts}　武器配件 +${workshop.mods.length}`, W / 2, 333, 18, 680, '#ffd282');
    this.dialogText('saved', this.storageOkay ? '奖励已保存至本机' : '奖励暂存在内存，浏览器未能保存', W / 2, 304, 17, 650, '#d7c8b2');
    if (nextChapter) this.dialogText('next-chapter', `「${nextChapter}」已解锁，可在探索地图选择。`, W / 2, 269, 17, 650, '#ffd282');
    if (this.unlockedEngineer) this.dialogText('engineer-unlocked', '维川已加入，可在角色培养中提升属性。', W / 2, 243, 17, 650, '#ffd282');
  }
  private buildRevive() {
    this.dialog('角色倒地', [
      { id: 'revive', label: '使用强心剂', run: () => {
        if (!this.battle.revivePlayer()) return;
        this.fallTime = 0;
        this.feedback.reset(); this.motion.reset(this.battle.player);
        this.open('playing');
      } },
      { id: 'give-up', label: '放弃并结算', run: () => this.finishBattle() },
    ]);
    this.dialogText('revive-effect', '消耗 1 支强心剂，原地恢复 30% 最大生命', W / 2, 404, 25, 690);
    this.dialogText('revive-count', `剩余 ${this.battle.revivalCharges} 支`, W / 2, 350, 19, 500, '#d7c8b2');
  }
  private chapterUnlocked(chapter: Chapter) {
    return chapter === 1 || (chapter === 2 ? this.profile.streetUnlocked : chapter === 3 ? this.profile.apartmentUnlocked : this.profile.owned[ENGINEER_ID]);
  }
  private loadChapterArt(chapter: 2 | 3 | 4, returnTo: Mode) {
    const art = chapter === 2 ? STREET_ART : chapter === 3 ? APARTMENT_ART : OPERATION_ART;
    const request: NonNullable<Blackout['chapterLoad']> = { chapter, returnTo, time: 0, done: 0, total: art.length, failed: false };
    this.chapterLoad = request;
    this.open('street-loading');
    this.noticeTime = 0;
    this.drawLoading(CHAPTERS[chapter].name, 0);
    for (const [atlas, parts] of art) {
      if (parts.every(([id]) => this.streetFrames.has(id))) { request.done++; continue; }
      resources.load((chapter === 4 ? 'chapter4/' : 'common/environment/') + atlas + '/spriteFrame', SpriteFrame, (err, source) => {
        if (!this.isValid || this.chapterLoad !== request) return;
        if (err) { request.failed = true; return; }
        source.packable = false;
        for (const [id, x, y, w, h] of parts) this.streetFrames.set(id, this.cropUiFrame(source, x, y, w, h));
        request.done++;
      });
    }
  }
  private updateChapterLoad(dt: number) {
    const load = this.chapterLoad;
    if (!load) return;
    if (load.failed && this.buttons.some(button => button.node.name === 'Button-reload-chapter')) return;
    load.time += dt;
    const progress = load.done / load.total;
    this.modalArt.clear();
    this.drawLoading(CHAPTERS[load.chapter].name, progress, load.failed);
    if (load.failed) {
      this.button('reload-chapter', '重新加载', 465, 247, 164, () => this.loadChapterArt(load.chapter, load.returnTo), true);
      this.button('back-chapter', '返回', 651, 247, 164, () => { this.chapterLoad = undefined; this.open(load.returnTo); });
    } else if (!load.failed && progress === 1 && load.time >= 0.35) {
      this.chapterLoad = undefined;
      this.startBattle(load.chapter);
    }
  }
  private drawLoading(title: string, progress: number, failed = false, background = true) {
    if (background) this.sbox(this.modalArt, 0, 0, W, H, '#03070a');
    this.text('floor-loading', failed ? '场景素材加载失败' : title, W / 2, 397, 24, C.text, this.modal, 450, Label.HorizontalAlign.CENTER);
    this.sbox(this.modalArt, 460, 346, 360, 5, '#303a3d');
    this.sbox(this.modalArt, 460, 346, 360 * progress, 5, C.gold);
    this.text('floor-progress', failed ? '' : `加载场景  ${Math.round(progress * 100)}%`, W / 2, 316, 16, C.muted, this.modal, 450, Label.HorizontalAlign.CENTER);
  }
  private startBattle(chapter: Chapter = 1) {
    if (!this.chapterUnlocked(chapter) || !this.sortieAllowed(this.sortieHero, chapter)) return;
    const requiredArt = chapter === 4 ? ['operator', 'walker'] :
      ['heroine', 'heroineRoll-0', 'heroineRoll-1', 'heroineRoll-2', 'dormKit', 'lobby-desk', 'corridor', 'bedroom'];
    if (chapter === 2) requiredArt.push('operator');
    const fallArt = this.fallFrames.has(chapter === 4 ? 'operator' : 'lin');
    if (!this.presentationReady || !fallArt || !requiredArt.every(id => this.artFrames.has(id))) { this.toast('正在加载战斗素材，请稍候再开始'); return; }
    if (chapter !== 1) {
      const art = chapter === 2 ? STREET_ART : chapter === 3 ? APARTMENT_ART : OPERATION_ART;
      if (!art.every(([, parts]) => parts.every(([id]) => this.streetFrames.has(id)))) { this.loadChapterArt(chapter, this.mode); return; }
    }
    this.battle = this.makeBattle(this.sortieHero, chapter); this.fallTime = 0;
    this.objectiveNotice = undefined;
    if (chapter === 4) {
      this.beginOperationCinematic('flight');
      return;
    }
    this.battle.tactical = newTacticalLoadout(this.profile.tacticalUnlocked.includes(this.tacticalChoice) ? this.tacticalChoice : this.profile.tacticalUnlocked[0] || null);
    this.battle.preparePurchasedItems(this.profile.armory, id => {
      const count = this.profile.armory.counts[id] ?? 0;
      if (count <= 1) delete this.profile.armory.counts[id];
      else this.profile.armory.counts[id] = count - 1;
      this.save();
    });
    this.replayTutorial = false;
    const prompt = chapter === 1 && this.battle.stage.dorm?.number === 2 ?
      this.profile.tutorial === 'done' ? 'replay' : this.profile.tutorialSeen ? 'resume' : 'first' : null;
    this.enterBattleScene(chapter, prompt);
  }
  private enterBattleScene(chapter: Chapter, prompt: NonNullable<Blackout['transition']>['prompt'] = null) {
    this.clearOperationDialogue();
    this.tutorialPrompt = null;
    this.feedback.reset(); this.motion.reset(this.battle.player); this.weaponEffects.clear();
    this.motionBattle = undefined;
    this.objectiveNotice = undefined;
    this.rebuildLevel();
    this.lastFacing = this.battle.player.angle; this.sightTick = 0; this.lastGeometry = -1;
    if (this.battle.stage.apartment?.outdoor) { this.mx = W / 2; this.my = H / 2 - 240; }
    this.transition = { kind: 'enter', time: 0, chapter, prompt };
    this.open('playing'); this.noticeTime = 0; this.applyTransitionVisuals(0, 1);
  }
  private beginOperationCinematic(part: 'flight' | 'mutate' | 'strike') {
    this.open('operation-cinematic');
    this.homeBackdrop.active = false;
    const root = this.makeNode('Operation ' + part, this.modal);
    this.sbox(this.graphics('Cinematic backdrop', root), 0, 0, W, H, '#080c0d');
    const picture = this.makeNode('Operation scene', root);
    const asset = (id: string, x: number, y: number, w: number, h: number) =>
      this.campaignSprite(picture, this.streetFrames.get('op-' + id)!, x, y, w, h)!;
    const place = (sprite: Sprite, x: number, y: number) => sprite.node.setPosition(x - W / 2, y - H / 2);
    const smooth = (t: number) => { const p = clamp(t, 0, 1); return p * p * (3 - 2 * p); };
    let draw: (time: number) => boolean;
    let finish: () => void;
    if (part === 'flight') {
      const coast = [asset('coast', 640, 360, W, H + 1), asset('coast', 640, 1080, W, H + 1)];
      const field = asset('field', 640, 360, W, H);
      const positions = [[250, 500], [492, 455], [735, 500], [940, 540], [385, 255], [640, 226], [889, 270]];
      const aircraft = positions.map(([x, y], index) => {
        const heavy = index < 3, w = heavy ? 86 : 49, h = heavy ? 182 : 116;
        const dust = asset('smoke', x, y, 195, 145);
        const body = asset(heavy ? 'blackhawk' : 'littlebird', x, y, w, h);
        const rotor = asset('rotor', x, y, heavy ? 167 : 114, heavy ? 167 : 114);
        return { x, y, h, heavy, dust, body, rotor };
      });
      const soldiers = aircraft.flatMap(({ x, y, heavy }, ship) =>
        Array.from({ length: heavy ? 5 : 4 }, (_, index) => ({
          x, y, ship, index, actor: asset('soldier', x, y, 26, 38),
        })));
      this.speakOperation([
        ['黑鹰领队', '幽灵，全队已进入北非沿岸。无线电保持畅通。'],
        ['幽灵一组', '收到。我们要活捉「阀」的首领，优先控制指挥部。'],
        ['小鸟二号', '街口有武装人员和重机枪。我会留在上空，等你们呼叫。'],
        ['幽灵二组', '我们守住登陆区和返回路线。要撤就原路回来。'],
        ['黑鹰领队', '前方空地可以降落。各机按顺序接地。'],
      ], true);
      let landingAt: number | undefined, marchRadio = false;
      draw = t => {
        if (landingAt === undefined && !this.operationDialogue) landingAt = t;
        const landing = landingAt === undefined ? -1 : t - landingAt;
        const offset = t * 112 % H;
        const page = Math.floor(t * 112 / H);
        coast.forEach((sprite, i) => {
          place(sprite, 640, H / 2 - offset + i * H);
          sprite.node.setScale(1, (page + i) % 2 ? -1 : 1, 1);
        });
        field.node.active = landing >= 0;
        field.color = color('#ffffff', Math.round(255 * smooth(landing / 1.15)));
        aircraft.forEach(({ x, y, h, heavy, dust, body, rotor }, i) => {
          const descent = smooth((landing - i * 0.17) / 2.4);
          const blend = smooth(landing / 2.5);
          const airX = 640 + (x - 635) * 0.8 + Math.sin(t * 1.9 + i) * 5;
          const airY = 460 + (y - 370) * 0.73 + Math.cos(t * 1.4 + i) * 7;
          const escort = i === 6 ? smooth((landing - 5.8) / 2.4) : 0;
          const px = airX + (x - airX) * blend + 460 * escort, py = airY + (y - airY) * blend + 560 * escort;
          const scale = 1.12 - descent * 0.33 + escort * 0.26;
          for (const sprite of [body, rotor, dust]) sprite.node.setScale(scale, scale, 1);
          dust.node.active = landing > .35;
          dust.color = color('#d4ab79', Math.round(155 * descent * (1 - smooth((landing - 3.0) / 2.6))));
          place(dust, px, py - 13);
          place(body, px, py);
          place(rotor, px, py + h * (heavy ? 0.145 : 0.1) * scale);
          rotor.node.angle = (t * 815 - landing * 65 * descent + i * 31) % 360;
          rotor.color = color('#ffffff', 165);
        });
        for (const { x, y, ship, index, actor } of soldiers) {
          const leave = landing - 2.7 - ship * .15 - index * .19;
          const disembark = smooth(leave / .85);
          const assemble = smooth((leave - .65) / 1.55);
          const advance = smooth((leave - 2.1) / 3.6);
          actor.node.active = leave >= 0;
          const file = (ship + index) % 5;
          const drift = Math.sin(leave * 21 + index) * 2.3 * (advance > 0 && advance < 1 ? 1 : 0.35);
          place(actor, x + (40 + index * 12) * disembark + (1020 - x + file * 69) * advance,
            y + (395 - y + file * 16 + ship * 4) * assemble + drift);
          actor.node.angle = -90 + (index % 2 ? 15 : -15) * (1 - advance);
        }
        if (landing > 4 && !marchRadio) {
          marchRadio = true;
          this.speakOperation([['幽灵一组', '人员到齐。各小队沿路进城，第一组跟我走。']], true);
        }
        return landing >= 9.2 && !this.operationDialogue;
      };
      finish = () => this.enterBattleScene(4);
    } else if (part === 'mutate') {
      asset('compound', 640, 360, W, H);
      asset('console', 967, 515, 260, 133);
      asset('wall', 640, 661, 1180, 64);
      const leader = asset('leader', 817, 357, 116, 94);
      leader.node.angle = 90;
      const injection = asset('inject', 810, 357, 132, 122);
      injection.node.angle = 90;
      const soldiers = [[485, 305], [440, 415], [370, 355], [520, 430], [340, 240]]
        .slice(0, 1 + this.battle.allies.filter(ally => ally.hp > 0).length)
        .map(([x, y]) => ({ x, y, sprite: asset('soldier', x, y, 55, 81) }));
      const king = asset('king', 704, 376, 235, 201);
      const flash = asset('impact', 478, 371, 500, 440);
      this.speakOperation([
        ['幽灵一组', '这里是一组，已控制指挥室。首领，放下你手里的东西。'],
        ['「阀」首领', '你们来迟了。样本已经送往各地，你们留不住我。'],
        ['幽灵一组', '他手里是注射器！离他远点！'],
      ], true);
      let changeAt: number | undefined, aftermath = false;
      draw = t => {
        if (changeAt === undefined && !this.operationDialogue) changeAt = t;
        const seconds = changeAt === undefined ? -1 : t - changeAt;
        leader.node.active = seconds < 0;
        injection.node.active = seconds >= 0 && seconds < 1.58;
        injection.node.angle = 90 + 8 * Math.sin(clamp(seconds / 0.7, 0, 1) * Math.PI);
        king.node.active = seconds >= 1.58;
        king.node.angle = 76 + Math.sin(seconds * 18) * 4;
        const lunge = smooth((seconds - 2.4) / 0.52);
        place(king, 808 - lunge * 329, 377 + 5 * Math.sin(t * 8));
        king.node.setScale(0.6 + smooth((seconds - 1.58) / 0.94) * 0.67, 0.58 + smooth((seconds - 1.58) / 0.94) * 0.68, 1);
        for (const { x, y, sprite } of soldiers) {
          sprite.node.active = seconds < 3.25;
          sprite.node.angle = -90 - 48 * lunge;
          place(sprite, x - lunge * 50, y + (y - 360) * lunge * 0.5);
        }
        flash.node.active = seconds >= 2.76 && seconds < 3.25;
        if (seconds >= 3.15 && !aftermath) {
          aftermath = true;
          this.play('grenade-blast');
          this.speakOperation([
            ['指挥部', '幽灵一组，回话！二组，街道上发生了什么？'],
            ['幽灵二组', '一组的信号全断了。街上的人开始撕咬彼此。我们正往登陆区撤！'],
          ], true);
        }
        return aftermath && !this.operationDialogue;
      };
      finish = () => {
        if (this.battle.advanceOperation(operationLevel('defense'))) this.enterBattleScene(4);
      };
    } else {
      const view = asset('city', 640, 360, W * 1.11, H * 1.11);
      const ruin = asset('aftermath', 640, 360, W * 2.0, H * 1.09);
      const bomb = asset('bomb', 750, 430, 37, 106);
      const frames = ['ignition', 'fireball', 'mushroom', 'embers'].map(id => asset(id, 670, 375, 200, 200));
      const rings = [asset('shockwave', 670, 375, 410, 370), asset('shockwave', 670, 375, 410, 370)];
      const dust = [-1, 0, 1].map(i => asset('smoke', 670 + i * 160, 375, 475, 430));
      const king = asset('king', 590, 376, 175, 150);
      const infected = Array.from({ length: 13 }, (_, i) => {
        const x = 246 + i * 51, y = 317 + (i * 61) % 160;
        return { x, y, sprite: asset('infected', x, y, 24, 25) };
      });
      const glare = this.graphics('Shockwave glare', picture);
      this.sbox(glare, -55, -55, W + 110, H + 110, '#fff4dd');
      const glareOpacity = glare.node.addComponent(UIOpacity);
      const timeCard = this.campaignLabel(root, 'operation-time-jump', '一小时后', W / 2, H / 2, 27, 440, '#f2e1b8', Label.HorizontalAlign.CENTER);
      this.speakOperation([
        ['幽灵二组', '尸群截断了撤离路线。接应编队，听到请回答！'],
        ['指挥部', '接应编队失联。所有单位立即撤出，核打击将在一小时后实施。'],
      ], true);
      let strikeAt: number | undefined, aftermath = false, detonated = false;
      draw = t => {
        if (strikeAt === undefined && !this.operationDialogue) strikeAt = t;
        const seconds = strikeAt === undefined ? -1 : t - strikeAt;
        const sinceImpact = seconds - 3.35;
        timeCard.node.active = seconds >= .5 && seconds < 1.75;
        view.color = color('#edcda9', Math.round(255 * (seconds < .45 ? 1 : seconds < 1.75 ? .15 : smooth((seconds - 1.75) / .45))));
        bomb.node.active = seconds > 1.92 && sinceImpact < 0;
        const fall = clamp((seconds - 1.92) / 1.43, 0, 1);
        place(bomb, 795 - 125 * fall, 655 - 280 * fall);
        bomb.node.angle = -24;
        bomb.node.setScale(1.29 - fall * 1.08, 1.29 - fall * 1.08, 1);
        if (sinceImpact >= 0 && !detonated) { detonated = true; this.play('grenade-blast'); }
        ruin.node.active = sinceImpact >= 1.38;
        ruin.color = color('#c6b09f', Math.round(255 * smooth((sinceImpact - 1.38) / 1.95)));
        const timings = [0, .18, .52, 1.28, 3.6], sizes = [.28, .69, 1.45, 1.95, 3.7];
        frames.forEach((sprite, i) => {
          const age = sinceImpact - timings[i];
          sprite.node.active = age >= 0 && sinceImpact < timings[i + 1] + .36;
          const progress = clamp(age / (timings[i + 1] - timings[i]), 0, 1);
          const size = sizes[i] + (sizes[i + 1] - sizes[i]) * progress;
          sprite.node.setScale(size, size, 1);
          sprite.color = color('#ffffff', Math.round(255 * (1 - smooth((sinceImpact - timings[i + 1]) / .36))));
        });
        rings.forEach((sprite, i) => {
          const age = sinceImpact - 0.29 - i * .15;
          sprite.node.active = age > 0 && age < 1.7;
          const scale = .27 + age * 2.1 + age * age * .65;
          sprite.node.setScale(Math.max(.01, scale), Math.max(.01, scale * (1 + age * .22)), 1);
          sprite.color = color('#f1d6b0', Math.round(195 * (1 - smooth((age - .64) / 1.06))));
        });
        dust.forEach((sprite, i) => {
          const age = sinceImpact - .57 - i * .13;
          sprite.node.active = age > 0 && age < 6;
          const size = 0.7 + Math.max(0, age) * .68;
          sprite.node.setScale(size, size, 1);
          place(sprite, 666 + (i - 1) * (161 + age * 150), 353 + Math.sin(i) * age * 96);
          sprite.color = color('#cfad87', Math.round(175 * smooth(age / .4) * (1 - smooth((age - 1.7) / 4.3))));
        });
        const shake = sinceImpact < 0 ? 0 : 24 * (1 - smooth(sinceImpact / 2.7));
        picture.setPosition(shake * Math.sin(sinceImpact * 73), shake * .68 * Math.cos(sinceImpact * 91));
        const zoom = 1 + smooth((sinceImpact - .17) / .71) * .19 - smooth((sinceImpact - 1.4) / 1.35) * .19;
        picture.setScale(zoom, zoom, 1);
        glareOpacity.opacity = sinceImpact < 0 ? 0 : Math.round(222 * (1 - smooth(sinceImpact / .58)));
        const escape = Math.max(0, sinceImpact - 4.45);
        king.node.active = escape > 0;
        king.node.angle = -35;
        const advance = Math.min(escape, 7);
        place(king, 498 + advance * 58, 344 + advance * 22);
        king.node.setScale(1 + Math.sin(escape * 6.7) * 0.105, 1, 1);
        infected.forEach(({ x, y, sprite }, i) => {
          sprite.node.active = escape > .31 + i * .085;
          sprite.node.angle = -49;
          place(sprite, x + advance * (18 + i % 3 * 5), y + advance * 12);
        });
        if (sinceImpact > 5.2 && !aftermath) {
          aftermath = true;
          this.speakOperation([
            ['侦察机', '打击结束。没有收到任何地面小队的信号。等一下，烟里有东西飞出来了！'],
            ['指挥部', '继续跟踪。其他地区也开始报告感染，通知所有剩余部队。'],
          ], true);
        }
        return aftermath && !this.operationDialogue;
      };
      finish = () => {
        this.battle.status = 'won';
        this.finishBattle();
        this.transitionShade.node.active = true;
        this.transitionShade.node.setSiblingIndex(this.modal.getSiblingIndex());
        this.transitionShade.node.getComponent(UIOpacity)!.opacity = 255;
      };
    }
    const shade = this.graphics('Cinematic fade', root);
    this.sbox(shade, 0, 0, W, H, '#000000');
    const opacity = shade.node.addComponent(UIOpacity);
    const render = (t: number) => {
      const done = draw(t);
      opacity.opacity = Math.round(255 * (1 - smooth(t / .56)));
      return done;
    };
    this.operationCinema = { root, time: 0, draw: render, finish };
    render(0);
  }
  private applyTransitionVisuals(hudAlpha: number, blackAlpha: number) {
    const opacity = Math.round(clamp(hudAlpha, 0, 1) * 255);
    const nodes = [this.hud.node, this.battleArtwork, this.modal, ...Array.from(this.labels.values()).filter(label => label.node.parent === this.canvas).map(label => label.node), ...Array.from(this.itemHudNodes.values())];
    for (const node of nodes) if (node) (node.getComponent(UIOpacity) || node.addComponent(UIOpacity)).opacity = opacity;
    this.transitionShade.node.active = true;
    this.transitionShade.node.setSiblingIndex(9999);
    this.transitionShade.node.getComponent(UIOpacity)!.opacity = Math.round(clamp(blackAlpha, 0, 1) * 255);
  }
  private stepTransition(dt: number) {
    const t = this.transition;
    if (!t) return;
    t.time += dt;
    if (t.kind === 'enter') {
      this.applyTransitionVisuals(clamp((t.time - 1) / 0.5, 0, 1), 1 - clamp(t.time, 0, 1));
      if (t.time < 1.5) return;
      this.transition = undefined; this.transitionShade.node.active = false; this.resetInput();
      if (t.prompt) { this.tutorialPrompt = t.prompt; this.open('playing'); }
      else if (t.chapter === 2) this.startIntro();
      else if (t.chapter === 4) {
        const part = this.battle.stage.operation?.part;
        if (part === 'city') this.speakOperation([
          ['幽灵一组', '各组准备。穿过前面的街口，夺下沙袋阵地。'],
          ['小鸟二号', '我在上空待命。指给我火力点，我能支援一次。'],
        ]);
        else if (part === 'compound') this.speakOperation([
          ['幽灵一组', '正门已拿下。两边都能通向内院，见到首领先留活口。'],
          ['指挥部', '收到。守军还在建筑里，进房前先确认角落。'],
        ]);
        else this.speakOperation([
          ['幽灵二组', '街区已失守！穿过市集，回登陆区等接应。'],
          ['指挥部', '二组，保持无线电畅通。我们会尽快联系接应编队。'],
        ]);
      }
    } else {
      this.applyTransitionVisuals(1 - clamp(t.time / 0.5, 0, 1), clamp((t.time - 0.7) / 1, 0, 1));
      if (t.time < 1.7) return;
      this.transition = undefined;
      (this.modal.getComponent(UIOpacity) || this.modal.addComponent(UIOpacity)).opacity = 255;
      this.finishBattle();
      this.transitionShade.node.active = true;
      this.transitionShade.node.setSiblingIndex(this.modal.getSiblingIndex());
    }
  }
  private beginFloorLoad() {
    if (this.battle.apartment) {
      const index = this.apartmentFloors?.indexOf(this.battle.stage) ?? -1;
      this.lowerFloor = this.battle.stage.apartment?.part === 'home' ? this.apartmentFloors?.find(floor => floor.apartment?.part === 'garage')
        : index >= 0 ? this.apartmentFloors?.[index + 1] : undefined;
    }
    this.floorLoad = { time: 0, done: 0, started: false, swapped: false, failed: false };
    this.open('loading');
  }
  private updateFloorLoad(dt: number) {
    const load = this.floorLoad, next = this.lowerFloor;
    if (!load || !next) return;
    load.time += dt;
    const fade = 0.28;
    this.modalArt.clear();
    if (load.swapped) {
      this.sbox(this.modalArt, 0, 0, W, H, '#03070a', Math.round(255 * (1 - clamp(load.time / fade, 0, 1))));
      if (load.time >= fade) { this.floorLoad = undefined; this.open('playing'); this.toast(next.apartment ? next.title : '已抵达一楼 · 留意宿管室门旁的警报'); }
      return;
    }
    this.sbox(this.modalArt, 0, 0, W, H, '#03070a', Math.round(255 * clamp(load.time / fade, 0, 1)));
    if (load.time < fade) return;
    if (!load.started) {
      load.started = true;
      for (const [id, asset] of next.apartment ? [] : LOWER_ART) {
        if (this.artFrames.has(id)) { load.done++; continue; }
        resources.load('art/' + asset + '/spriteFrame', SpriteFrame, (err, frame) => {
          if (!this.isValid || this.floorLoad !== load) return;
          if (err) { load.failed = true; return; }
          frame.packable = false; this.artFrames.set(id, frame); load.done++;
        });
      }
    }
    const progress = next.apartment ? clamp((load.time - fade) / 0.62, 0, 1) : load.done / LOWER_ART.length;
    const elevator = this.battle.stage.apartment?.part === 'home' ? '直达电梯 · 9F → B1' : '直达电梯 · 1F → 9F';
    this.drawLoading(next.apartment?.part === 'home' || this.battle.stage.apartment?.part === 'home' ? elevator : next.apartment ? next.title : '宿舍楼 · 一楼', progress, load.failed, false);
    if (load.failed && !this.buttons.some(button => button.node.name === 'Button-reload-floor')) {
      this.button('reload-floor', '重新加载', 558, 247, 164, () => this.beginFloorLoad(), true);
    }
    if (!load.failed && progress === 1 && load.time >= 0.72 && this.battle.descend(next)) {
      this.labels.get('floor-loading')!.string = ''; this.labels.get('floor-progress')!.string = '';
      this.rebuildLevel(); this.motionBattle = undefined; this.lastFacing = this.battle.player.angle; this.lastGeometry = -1;
      load.swapped = true; load.time = 0;
    }
  }
  private finishBattle() {
    const engineerOwned = this.profile.owned[ENGINEER_ID];
    this.reward = this.battle.claimReward(this.profile) || { materials: 0, tickets: 0, coins: 0, keys: 0 };
    this.unlockedEngineer = !engineerOwned && this.profile.owned[ENGINEER_ID];
    this.save(); this.play(this.battle.status === 'won' ? 'win' : 'hurt'); this.open('result');
  }
  private buildObjectiveHud(parent: Node) {
    const r = OBJECTIVE_BUTTON, bounds = OBJECTIVE_BUBBLE;
    const icon = this.makeNode('Objective icon', parent);
    icon.setPosition(r.x + r.w / 2 - W / 2, r.y + 27 - H / 2);
    if (this.objectiveFrame) this.setupSprite(icon, this.objectiveFrame, 52, 52);
    else this.text('objective-bang', '!', r.x + r.w / 2, r.y + 27, 24, C.gold, parent, r.w, Label.HorizontalAlign.CENTER);
    const caption = this.text('objective-caption', '目标', r.x + r.w / 2, r.y + 64, 14, C.gold, parent, r.w, Label.HorizontalAlign.CENTER);
    caption.isBold = true;
    caption.enableOutline = true;
    caption.outlineColor = color(C.ink);
    const bubble = this.makeNode('Current objective bubble', parent);
    bubble.setPosition(bounds.x - W / 2, bounds.y + bounds.h / 2 - H / 2);
    const bg = this.graphics('Objective bubble fill', bubble);
    polygon(bg, [{ x: 0, y: -bounds.h / 2 }, { x: bounds.w, y: -bounds.h / 2 }, { x: bounds.w, y: bounds.h / 2 },
      { x: 0, y: bounds.h / 2 }, { x: 0, y: 8 }, { x: -9, y: 0 }, { x: 0, y: -8 }], '#111b21', 210);
    line(bg, 0, bounds.h / 2, bounds.w, bounds.h / 2, C.gold, 1.5, 200);
    const label = this.makeNode('Current objective text', bubble).addComponent(Label);
    label.node.setPosition(16, 0);
    const transform = label.node.getComponent(UITransform)!;
    transform.setContentSize(bounds.w - 32, bounds.h - 10);
    transform.setAnchorPoint(0, 0.5);
    label.fontSize = 17; label.lineHeight = 22; label.enableWrapText = true; label.overflow = Label.Overflow.CLAMP;
    label.verticalAlign = Label.VerticalAlign.CENTER; label.color = color('#f1e2c2');
    const opacity = bubble.addComponent(UIOpacity);
    const toggle = (fromBubble = false) => {
      const state = this.objectiveNotice;
      if (!state || state.battle !== this.battle) return;
      if (fromBubble || state.pinned) { state.pinned = false; state.time = 0; }
      else { state.pinned = true; state.time = 0; }
      this.updateObjectiveHud(0);
    };
    const button = this.addButton('objective-toggle', r.x, r.y, r.w, r.h, () => toggle());
    const click = this.addButton('objective-close', bounds.x, bounds.y, bounds.w, bounds.h, () => toggle(true));
    this.objectiveHud = { icon, button, bubble, click, label, opacity };
    this.updateObjectiveHud(0);
  }
  private updateObjectiveHud(dt: number) {
    const hud = this.objectiveHud, b = this.battle;
    if (!hud) return;
    const description = b.objective;
    const available = this.mode === 'playing' && !this.transition && !b.floorPending && !b.tutorial && !this.tutorialPrompt && !!description;
    hud.icon.active = hud.button.active = available;
    const caption = this.labels.get('objective-caption'), fallback = this.labels.get('objective-bang');
    if (caption) caption.node.active = available;
    if (fallback) fallback.node.active = available && !this.objectiveFrame;
    if (!available) { hud.bubble.active = hud.click.active = false; return; }
    const key = b.apartment?.phase === 'hold' || b.apartment?.phase === 'car-hold' ? b.apartment.phase :
      b.operationRun ? description.replace(/ · (剩余 \d+|\d+ 秒)$/, '') : description;
    let state = this.objectiveNotice;
    if (!state || state.battle !== b) state = this.objectiveNotice = { battle: b, key: '', time: 0, pinned: false, open: 0 };
    if (state.key !== key) { state.key = key; state.time = 3; }
    else state.time = Math.max(0, state.time - dt);
    const show = state.pinned || state.time > 0;
    state.open = clamp(state.open + (show ? dt : -dt) / 0.17, 0, 1);
    const reveal = 1 - (1 - state.open) ** 2;
    hud.bubble.active = state.open > 0;
    hud.click.active = show && state.open >= 0.85;
    hud.bubble.setPosition(OBJECTIVE_BUBBLE.x - W / 2 - (1 - reveal) * 24, OBJECTIVE_BUBBLE.y + OBJECTIVE_BUBBLE.h / 2 - H / 2);
    hud.opacity.opacity = Math.round(255 * reveal);
    hud.label.string = description;
  }
  private buildHud() {
    this.battleArtwork = this.makeNode('Battle artwork', this.canvas);
    // Artwork sits below dynamic graphics/text and never participates in hit testing.
    this.battleArtwork.setSiblingIndex(this.hud.node.getSiblingIndex());
    this.buildObjectiveHud(this.battleArtwork);
    for (const [id, rect] of [
      ['player_status', HUD.status], ['area_banner', HUD.area], ['mission_status', HUD.mission], ['minimap_panel', HUD.map],
      ['button_settings', HUD.settings], ['button_pause', HUD.pause],
    ] as Array<[BattleImage, typeof HUD.status]>) this.battleSprite(id, rect);
    const ammoFrame = this.battleFrames.get('weapon_ammo');
    if (ammoFrame) {
      // Crop the icon-free right side, then mirror it to preserve the full frame.
      if (!this.battleFrames.has('auto-background')) this.battleFrames.set('auto-background', this.cropUiFrame(ammoFrame, 166, 0, 164, 125));
      const a = HUD.auto, frame = this.battleFrames.get('auto-background')!;
      const bg = this.makeNode('auto-background', this.battleArtwork!);
      bg.setPosition(a.x + a.w / 2 - W / 2, a.y + a.h / 2 - H / 2);
      for (const side of [-1, 1]) {
        const half = this.makeNode('auto-background-half', bg);
        half.setPosition(side * a.w / 4, 0); half.setScale(side, 1, 1);
        this.setupSprite(half, frame, a.w / 2, a.h);
      }
    }
    this.battleSprite('weapon_ammo', HUD.ammo);
    if (ammoFrame && this.battle.heroId !== HEROINE_ID) {
      const icon = this.supplyUiFrames.get(this.battle.hero.weapon);
      if (icon) {
        const patch = this.cropUiFrame(ammoFrame, 180, 35, 95, 65);
        const backdrop = this.makeNode('Weapon icon background', this.battleArtwork!);
        backdrop.setPosition(HUD.ammo.x + 72 - W / 2, HUD.ammo.y + HUD.ammo.h / 2 - H / 2);
        this.setupSprite(backdrop, patch, 98, 51);
        const weapon = this.makeNode('Weapon icon ' + this.battle.heroId, this.battleArtwork!);
        weapon.setPosition(HUD.ammo.x + 72 - W / 2, HUD.ammo.y + HUD.ammo.h / 2 - H / 2);
        const fit = Math.min(82 / icon.originalSize.width, 42 / icon.originalSize.height);
        this.setupSprite(weapon, icon, icon.originalSize.width * fit, icon.originalSize.height * fit);
      }
    }
    for (const [id, rect] of [['joystick_move_base', HUD.move], ['joystick_fire', HUD.fire]] as Array<[BattleImage, typeof HUD.move]>) {
      const node = this.battleSprite(id, rect); if (node) this.battleSticks.push(node);
    }
    this.moveCap = this.battleSprite('joystick_move_cap', { x: HUD.move.x + HUD.move.w / 2 - 40, y: HUD.move.y + HUD.move.h / 2 - 40, w: 80, h: 80 });
    this.createHudAction('dodge', 'button_roll', HUD.roll, () => this.battle.player.dash, () => 2.4);
    this.createHudAction('reload', 'button_reload', HUD.reload, () => this.battle.player.reload, () => this.battle.hero.reload);
    const air = this.battle.operationRun?.airSupport && this.streetFrames.get('op-littlebird');
    this.createHudAction('grenade', air || (isShopMine(this.battle.tactical.selected) ? 'button_trap' : 'button_grenade'), HUD.grenade,
      () => this.battle.tactical.cooldown, () => TACTICAL_DEFINITIONS[this.battle.tactical.selected || 'grenade'].cooldown);
    this.createHudAction('door', 'button_interact', HUD.door, () => 0, () => 0);
    this.createHudAction('pickup', 'button_pickup', HUD.pickup, () => 0, () => 0);
    if (this.battle.apartment) this.createHudAction('apartment-trap', 'button_trap', HUD.trap, () => 0, () => 0);
    // The source PNG restores the erased quantity-badge corner from its clean mirrored rim.
    const operation = this.battle.stage.operation;
    const name = operation ? operation.part === 'defense' ? '幽灵二组' : '幽灵一组' : `${this.battle.hero.name}  Lv.${this.battle.level}`;
    this.text('name', name, 113, 691, 17, C.text, this.canvas, 180);
    this.text('health', '', 113, 657, 13, C.jade, this.canvas, 205);
    this.text('portrait', this.battle.hero.name.slice(0, 1), 62, 674, 28, C.gold, this.canvas, 62, Label.HorizontalAlign.CENTER);
    this.text('objective', '', 446, 698, 17, C.text, this.canvas, 430);
    this.text('sub-objective', '', 423, 663, 12, C.text, this.canvas, 506);
    this.text('ammo', '', HUD.ammo.x + HUD.ammo.w * 0.68, HUD.ammo.y + HUD.ammo.h * 0.60, 23, C.text, this.canvas, HUD.ammo.w * 0.57, Label.HorizontalAlign.CENTER);
    this.text('gun', this.battle.hero.gun, HUD.ammo.x + HUD.ammo.w * 0.68, HUD.ammo.y + HUD.ammo.h * 0.28, 11, C.text, this.canvas, HUD.ammo.w * 0.57, Label.HorizontalAlign.CENTER);
    this.text('reload-hint', sys.isMobile ? '换弹' : '换弹 R', HUD.reload.x + HUD.reload.w / 2, HUD.reload.y - 6, 12, C.text, this.canvas, 90, Label.HorizontalAlign.CENTER);
    const bind = (id: string, r: typeof HUD.status, action: () => void) => this.addButton(id, r.x, r.y, r.w, r.h, action);
    bind('settings', HUD.settings, () => this.open('settings'));
    bind('pause', HUD.pause, () => this.open('pause'));
    if (this.battle.tutorial) this.button('tutorial-skip-live', '跳过教程', 24, 440, 148, () => {
      this.requestTutorialSkip();
    }, false, true, 38);
    bind('dodge', HUD.roll, () => this.dodge());
    bind('reload', HUD.reload, () => this.battle.reload());
    bind('grenade', HUD.grenade, () => this.useTactical());
    bind('auto-fire', HUD.auto, () => this.toggleAutoFire());
    bind('supply-toggle', { x: 1170, y: 365, w: 75, h: 48 }, () => { this.suppliesOpen = !this.suppliesOpen; this.uiTick = 0; });
    if (this.battle.apartment) bind('apartment-trap', HUD.trap, () => this.placeApartmentTrap());
    const backpack = this.supplyUiFrames.get('backpack');
    if (backpack) {
      const node = this.makeNode('Supply backpack', this.battleArtwork!);
      node.setPosition(1207 - W / 2, 389 - H / 2);
      this.setupSprite(node, backpack, 58, 58);
    }
    const slotFrame = this.supplyUiFrames.get('slot');
    if (slotFrame) for (let i = 0; i < 3; i++) {
      const node = this.makeNode('Supply slot ' + i, this.battleArtwork!);
      node.setPosition(1120 - i * 55 + 24 - W / 2, 389 - H / 2);
      this.setupSprite(node, slotFrame, 50, 50);
      node.active = this.suppliesOpen;
      this.supplySlotNodes.push(node);
    }
    (['bandage', 'medkit', 'drink'] as SupplyKind[]).forEach((kind, i) => {
      const node = bind('supply-' + kind, { x: 1120 - i * 55, y: 365, w: 48, h: 48 }, () => {
        if (!this.supplyPress?.long && !this.supplyPress?.cancelled) this.battle.useSupply(kind);
        this.supplyTooltip = '';
        this.supplyPress = undefined;
      });
      node.on(Node.EventType.TOUCH_START, (e: EventTouch) => { if (this.transition) return; const id = e.getID(); if (id !== null) this.supplyPress = { id, kind, time: 0, long: false, cancelled: false }; });
      node.on(Node.EventType.TOUCH_CANCEL, () => { if (this.supplyPress) this.supplyPress.cancelled = true; this.supplyTooltip = ''; });
      node.active = this.suppliesOpen;
    });
    (['healing', 'speed'] as const).forEach((kind, i) => {
      const node = bind('status-' + kind, { x: 25 + i * 31, y: 600, w: 26, h: 26 }, () => this.toast(kind === 'healing' ? '生命恢复中 · 绷带持续治疗' : '提速中 · 能量饮料提高移动速度'));
      node.active = false;
    });
    bind('door', HUD.door, () => this.interactOrInvestigate());
    bind('pickup', HUD.pickup, () => this.battle.collectPickup());
    for (const a of this.hudActions) {
      const node = this.buttons.find(b => b.node.name === 'Button-' + a.id)!.node;
      node.on(Node.EventType.TOUCH_START, (e: EventTouch) => { if (this.transition) return; const id = e.getID(); if (id === null) return; a.owners.add(id); a.scale = 0.88; a.root.setScale(0.88, 0.88, 1); });
      for (const event of [Node.EventType.TOUCH_END, Node.EventType.TOUCH_CANCEL]) node.on(event, (e: EventTouch) => this.releaseHud(e.getID()));
    }
    this.updateHud(); this.updateHudFeedback(0);
  }
  private startGhostRadio() {
    if (this.ghostRadio?.battle === this.battle) return;
    const node = this.makeNode('Ghost radio', this.canvas);
    node.setPosition(W / 2, 60);
    const panel = this.graphics('Radio panel', node);
    polygon(panel, [{ x: 0, y: -42 }, { x: 302, y: -42 }, { x: 316, y: -28 }, { x: 316, y: 42 }, { x: 14, y: 42 }, { x: 0, y: 28 }], '#111b21', CHARACTER_DIALOG_BACKGROUND_ALPHA);
    line(panel, 14, 41, 315, 41, C.gold, 1.5, 235);
    line(panel, 0, -41, 302, -41, '#59615a', 1.2);
    box(panel, 10, -33, 65, 66, '#314142');
    outline(panel, 10, -33, 65, 66, '#9d8b6c');
    const portrait = this.trainingFrames.get('ghost-face') ?? this.ghostPortrait ?? this.artFrames.get('operator');
    if (portrait) {
      const icon = this.makeNode('Ghost portrait', node);
      icon.setPosition(42.5, 0);
      this.setupSprite(icon, portrait, 61, 62);
    }
    const label = this.makeNode('Radio line', node).addComponent(Label);
    label.node.setPosition(86, 0);
    const layout = label.node.getComponent(UITransform)!;
    layout.setContentSize(220, 44);
    layout.setAnchorPoint(0, 0.5);
    label.fontSize = 22;
    label.lineHeight = 28;
    label.isBold = true;
    label.horizontalAlign = Label.HorizontalAlign.LEFT;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.color = color('#f2e1b8');
    label.enableOutline = true; label.outlineColor = color('#080d10'); label.outlineWidth = 2;
    label.string = '';
    this.ghostRadio = { battle: this.battle, node, label, elapsed: 0 };
  }
  private startIntro() {
    this.intro?.node.destroy();
    const node = this.makeNode('Lin monologue', this.canvas);
    const panel = this.graphics('Monologue panel', node);
    box(panel, 0, -42, 460, 84, '#111b21', CHARACTER_DIALOG_BACKGROUND_ALPHA);
    line(panel, 0, 42, 460, 42, C.gold, 2);
    const portrait = this.trainingFrames.get('lin-face') ?? this.linPortrait ?? this.artFrames.get('heroine');
    if (portrait) { const icon = this.makeNode('Lin portrait', node); icon.setPosition(40, 0); this.setupSprite(icon, portrait, 64, 64); }
    const label = this.makeNode('Monologue line', node).addComponent(Label);
    label.node.setPosition(83, 0);
    const layout = label.node.getComponent(UITransform)!; layout.setContentSize(365, 62); layout.setAnchorPoint(0, 0.5);
    label.fontSize = 19; label.lineHeight = 26; label.isBold = true; label.horizontalAlign = Label.HorizontalAlign.LEFT;
    label.verticalAlign = Label.VerticalAlign.CENTER; label.color = color('#f2e1b8'); label.string = '';
    label.enableOutline = true; label.outlineColor = color('#080d10'); label.outlineWidth = 2;
    this.intro = { battle: this.battle, node, label, time: 0 };
  }
  private apartmentPortrait(lin: boolean) {
    return lin ? this.trainingFrames.get('lin-face') ?? this.linPortrait ?? this.artFrames.get('heroine')! :
      this.trainingFrames.get('weichuan-face') ?? this.streetFrames.get('engineer-portrait')!;
  }
  private speakApartment(...lines: string[]) {
    const existing = this.apartmentDialogue;
    if (existing?.battle === this.battle && existing.lines.length && this.battle.status === 'playing') {
      existing.lines.push(...lines);
      return;
    }
    this.apartmentDialogue?.node.destroy();
    const node = this.makeNode('Apartment dialogue', this.canvas);
    node.setPosition(lines[0].startsWith('凛') ? -W / 2 + 20 : W / 2 - 515, 106);
    const panel = this.graphics('Dialogue background', node);
    box(panel, 0, -46, 495, 92, '#111b21', CHARACTER_DIALOG_BACKGROUND_ALPHA);
    line(panel, 0, 45, 495, 45, C.gold, 2);
    const frame = this.apartmentPortrait(lines[0].startsWith('凛'));
    const icon = this.makeNode('Apartment speaker portrait', node); icon.setPosition(43, 0);
    const portrait = this.setupSprite(icon, frame, 67, 67);
    const text = this.makeNode('Apartment line', node).addComponent(Label);
    text.node.setPosition(86, 0); text.node.getComponent(UITransform)!.setAnchorPoint(0, .5);
    text.node.getComponent(UITransform)!.setContentSize(390, 76);
    text.fontSize = 18; text.lineHeight = 25; text.enableWrapText = true; text.overflow = Label.Overflow.CLAMP;
    text.verticalAlign = Label.VerticalAlign.CENTER; text.color = color('#f5e2b8'); text.enableOutline = true; text.outlineColor = color('#090e12'); text.outlineWidth = 2;
    text.string = lines[0]; this.apartmentDialogue = { node, battle: this.battle, text, portrait, lines, time: 0 };
  }
  private updateApartmentPresentation(dt: number) {
    const dialogue = this.apartmentDialogue;
    if (dialogue) {
      if (dialogue.battle !== this.battle || this.mode === 'result' || !showsBattle(this.mode, this.battleSettings)) { dialogue.node.destroy(); this.apartmentDialogue = undefined; }
      else {
        dialogue.node.active = this.mode === 'playing' && !this.transition;
        if (dialogue.node.active) {
          dialogue.time += dt;
          const index = Math.floor(dialogue.time / APARTMENT_LINE_SECONDS);
          if (index >= dialogue.lines.length) { dialogue.node.destroy(); this.apartmentDialogue = undefined; }
          else {
            const sentence = dialogue.lines[index];
            const left = sentence.startsWith('凛');
            const localTime = dialogue.time - index * APARTMENT_LINE_SECONDS;
            const slide = Math.max(0, 1 - Math.min(localTime, APARTMENT_LINE_SECONDS - localTime) / 0.22) ** 2;
            dialogue.node.setPosition((left ? -W / 2 + 20 : W / 2 - 515) + (left ? -1 : 1) * 520 * slide, 106);
            dialogue.text.string = sentence;
            const portrait = this.apartmentPortrait(left);
            if (portrait && dialogue.portrait.spriteFrame !== portrait) dialogue.portrait.spriteFrame = portrait;
          }
        }
      }
    }
    const b = this.battle, run = b.apartment, plan = b.stage.apartment, g = this.apartmentEffects;
    g.clear();
    const traps = run?.traps ?? [];
    for (const sprite of this.trapSprites) sprite.node.active = false;
    if (!plan || !run) return;
    const shock = plan.shock;
    if (shock && run.phase === 'hold') {
      const active = run.timer < 13 && run.timer > 4;
      box(g, shock.x, shock.y, shock.w, shock.h, active ? '#70cbea' : '#b6a056', active ? 75 : 30);
      outline(g, shock.x, shock.y, shock.w, shock.h, active ? '#a5e5ff' : '#c5b77d');
      if (active) for (let i = 0; i < 6; i++) {
        const x = shock.x + 12 + i * 28, y = shock.y + 20 + Math.sin(b.elapsed * 16 + i) * 17;
        line(g, x, y, x + 22, y + 45, '#bcf2ff', 2, 160);
      }
    }
    const shutter = b.apartmentShutter;
    if (this.apartmentShutterSprite) this.apartmentShutterSprite.node.active = !!shutter;
    else if (shutter) box(g, shutter.x, shutter.y, shutter.w, shutter.h, '#a28862', 255);
    const frame = this.streetFrames.get('trap');
    for (const [i, trap] of traps.entries()) {
      if (frame) {
        const sprite = this.trapSprites[i] ?? (this.trapSprites[i] = this.setupSprite(this.makeNode('Electric trap', this.trapLayer), frame, 48, 42));
        sprite.node.active = true; sprite.node.setPosition(trap.x, trap.y); sprite.color = color(trap.charge ? '#ffffff' : '#737b79');
      }
      if (trap.charge || trap.flash > 0) {
        if (trap.flash > 0 && trap.entrance) {
          const radius = 38 + (1 - trap.flash / 0.55) * 56;
          const points = Array.from({ length: 33 }, (_, index) => {
            const angle = index * Math.PI / 16;
            const length = rayDistance(trap, angle, radius, b.blockers);
            return { x: trap.x + Math.cos(angle) * length, y: trap.y + Math.sin(angle) * length };
          });
          polygon(g, points, '#ffd767', Math.round(115 * trap.flash / 0.55));
        } else disc(g, trap.x, trap.y, trap.flash > 0 ? 49 : 26, '#6fdcff', trap.flash > 0 ? 125 : 42);
        if (!frame) box(g, trap.x - 14, trap.y - 10, 28, 20, '#639fa8');
      }
    }
    const target = b.nearbyObjective();
    if (plan.glass) {
      const r = plan.glass, center = r.x + r.w / 2;
      const width = run.entryOpen ? 13 : r.w / 2;
      for (const x of [r.x, r.x + r.w - width]) {
        box(g, x, r.y, width, r.h, '#6c98a4', 155);
        outline(g, x, r.y, width, r.h, '#bec7be', 210);
      }
      if (!run.entryOpen) for (const x of [center - 12, center + 12]) box(g, x, r.y + 4, 4, 8, '#d0ba8a');
    } else if (plan.part === 'defense') {
      for (let i = 0; i < 7; i++) {
        const x = 906 + i * 29, y = 1118 - (i % 3) * 10;
        polygon(g, [{ x, y }, { x: x + 8, y: y - 8 }, { x: x + 14, y: y + 2 }], '#9db3b3', 140);
      }
    }
    if (plan.part === 'arrival' || plan.part === 'defense') {
      const powered = plan.part === 'defense';
      box(g, 1537, 956, 36, 9, '#202924');
      box(g, 1542, 958, 26, 5, powered ? '#8cdbc0' : '#8e5345');
      if (powered) disc(g, 1555, 962, 25, '#8cdbc0', 38);
      box(g, 1717, 956, 30, 9, '#202924');
      box(g, 1723, 958, 18, 5, '#8e5345');
    }
    const station = target?.id === 'apartment' ? plan.stations.find(s => s.id === target.station) : undefined;
    if (station) {
      g.strokeColor = color(C.gold, 230); g.lineWidth = 2;
      g.circle(station.point.x, station.point.y, 19 + Math.sin(this.presentationTime * 4) * 2); g.stroke();
    }
  }
  private readonly streetStoryLines = [
    '你们是从那边的公寓出来的吗?',
    '不是,算你运气好,我们恰巧在执行任务碰到了你..',
    '你们能帮我回家吗?',
    '抱歉,这不在我们的任务范围之内,我们知道最近的避难点（递出地图）,接下来的路就得靠你自己了..',
  ];
  private makeStoryDialogue(name: string, parent: Node, advance: () => void): StoryDialogueNodes {
    const node = this.makeNode(name, parent);
    const panel = this.graphics('Street story panel', node);
    box(panel, 0, -55, 510, 110, '#111b21', CHARACTER_DIALOG_BACKGROUND_ALPHA);
    line(panel, 0, 54, 510, 54, C.gold, 2);
    box(panel, 10, -34, 66, 68, '#314142'); outline(panel, 10, -34, 66, 68, '#9d8b6c');
    const portrait = this.makeNode('Story portrait', node); portrait.setPosition(43, 0);
    const label = this.makeNode('Story line', node).addComponent(Label);
    label.node.setPosition(86, 5); const layout = label.node.getComponent(UITransform)!;
    layout.setContentSize(410, 82); layout.setAnchorPoint(0, 0.5);
    label.fontSize = 19; label.lineHeight = 25; label.isBold = true; label.enableWrapText = true; label.overflow = Label.Overflow.CLAMP;
    label.horizontalAlign = Label.HorizontalAlign.LEFT; label.verticalAlign = Label.VerticalAlign.CENTER; label.color = color('#f2e1b8'); label.enableOutline = true; label.outlineColor = color('#080d10'); label.outlineWidth = 2; label.string = '';
    const hint = this.makeNode('Story hint', node).addComponent(Label);
    hint.node.setPosition(492, -44); const hintLayout = hint.node.getComponent(UITransform)!;
    hintLayout.setContentSize(230, 18); hintLayout.setAnchorPoint(1, 0.5);
    hint.fontSize = 11; hint.horizontalAlign = Label.HorizontalAlign.RIGHT; hint.color = color('#b4a588'); hint.string = '点击对话框继续';
    const next = this.makeNode('Story advance', node); next.setPosition(255, 0); next.getComponent(UITransform)!.setContentSize(510, 110);
    next.addComponent(Button).transition = Button.Transition.NONE;
    next.on(Button.EventType.CLICK, advance, this);
    return { node, label, portrait };
  }
  private beginStreetStory() {
    this.intro?.node.destroy(); this.intro = undefined;
    this.ghostRadio?.node.destroy(); this.ghostRadio = undefined;
    const { node, label, portrait } = this.makeStoryDialogue('Street story', this.canvas, () => this.advanceStreetStory());
    this.streetStory = { battle: this.battle, node, label, portrait, index: 0, time: 0 };
    this.battle.exitHold = true;
    this.streetStoryBattle = this.battle;
  }
  private advanceStreetStory() {
    const story = this.streetStory;
    if (!story || this.mode !== 'playing') return;
    const typed = 0.25 + this.streetStoryLines[story.index].length * 0.045;
    if (story.time < typed) story.time = typed;
    else story.time = typed + 2.2;
  }
  private updateStreetStory(dt: number) {
    const b = this.battle, street = b.stage.street, story = this.streetStory;
    if (story && (story.battle !== b || !showsBattle(this.mode, this.battleSettings) || b.status !== 'playing')) {
      story.battle.exitHold = false; story.node.destroy(); this.streetStory = undefined; return;
    }
    if (!story) {
      if (this.mode !== 'playing' || this.tutorialPrompt || !street || b.alarmTime === null || this.streetStoryBattle === b) return;
      const road = b.rooms[5];
      if (roomAt(b.player, b.rooms) !== 5 || b.player.x < road.x + (b.stage.exit.x - road.x) * 0.3) return;
      this.beginStreetStory(); return;
    }
    story.node.active = this.mode === 'playing';
    if (!story.node.active) return;
    if (Math.hypot(b.player.x - b.stage.exit.x, b.player.y - b.stage.exit.y) < 100 && this.noticeTime <= 0) this.toast('完成对话后即可撤离');
    story.time += dt;
    const text = this.streetStoryLines[story.index], typed = 0.25 + text.length * 0.045;
    const visible = text.slice(0, Math.max(0, Math.floor((story.time - 0.25) / 0.045)));
    story.label.string = visible.match(/.{1,19}/gu)?.join('\n') ?? '';
    const portraitFrame = story.index % 2 === 0
      ? this.trainingFrames.get('lin-face') ?? this.linPortrait ?? this.artFrames.get('heroine')
      : this.trainingFrames.get('ghost-face') ?? this.ghostPortrait ?? this.artFrames.get('operator');
    if (portraitFrame) this.setupStoryPortrait(story.portrait, portraitFrame);
    this.placeStoryDialogue(story.node, story.index % 2 === 0, story.time, typed + 2.2);
    if (story.time >= typed + 2.45) {
      if (++story.index >= this.streetStoryLines.length) { story.battle.exitHold = false; story.node.destroy(); this.streetStory = undefined; }
      else story.time = 0;
    }
  }
  private placeStoryDialogue(node: Node, left: boolean, time: number, exit: number) {
    const smooth = (x: number) => x * x * (3 - 2 * x);
    const slide = smooth(clamp(time / 0.25, 0, 1)) - smooth(clamp((time - exit) / 0.25, 0, 1));
    node.setPosition(left ? -W / 2 - 510 + 530 * slide : W / 2 - 530 * slide, left ? 80 : 108);
  }
  private speakOperation(lines: OperationLine[], cinematic = false) {
    const existing = this.operationDialogue;
    if (existing && existing.cinematic === cinematic) { existing.lines.push(...lines); return; }
    this.clearOperationDialogue();
    const dialogue = this.makeStoryDialogue('Operation dialogue', this.canvas, () => {
      const state = this.operationDialogue;
      if (!state || !state.node.active) return;
      const reveal = 0.25 + state.lines[state.index].join('  ').length * 0.035;
      state.time = state.time < reveal ? reveal : reveal + 1.5;
    });
    dialogue.node.setPosition(-W, 80);
    this.operationDialogue = { ...dialogue, lines, index: 0, time: 0, cinematic };
  }
  private clearOperationDialogue() {
    if (!this.operationDialogue) return;
    this.operationDialogue.node.active = false;
    this.operationDialogue.node.destroy();
    this.operationDialogue = undefined;
  }
  private stepOperationDialogue(dt: number) {
    const dialogue = this.operationDialogue;
    if (!dialogue) return;
    dialogue.node.active = dialogue.cinematic ? this.mode === 'operation-cinematic' : this.mode === 'playing' && !this.transition;
    if (!dialogue.node.active) return;
    dialogue.time += dt;
    const [speaker, line] = dialogue.lines[dialogue.index];
    const text = speaker + '  ' + line, typed = 0.25 + text.length * 0.035;
    const visible = text.slice(0, Math.max(0, Math.floor((dialogue.time - 0.25) / 0.035)));
    dialogue.label.string = visible.match(/.{1,19}/gu)?.join('\n') ?? '';
    const left = speaker.startsWith('幽灵');
    const frame = speaker === '「阀」首领' ? this.streetFrames.get('op-leader') :
      left ? this.trainingFrames.get('ghost-face') ?? this.ghostPortrait ?? this.streetFrames.get('op-soldier') : this.streetFrames.get('op-soldier');
    if (frame) this.setupStoryPortrait(dialogue.portrait, frame);
    this.placeStoryDialogue(dialogue.node, left, dialogue.time, typed + 1.5);
    if (dialogue.time < typed + 1.75) return;
    dialogue.time = 0;
    if (++dialogue.index === dialogue.lines.length) this.clearOperationDialogue();
  }
  private setupStoryPortrait(node: Node, frame: SpriteFrame) {
    const sprite = node.getComponent(Sprite);
    if (sprite) { if (sprite.spriteFrame !== frame) sprite.spriteFrame = frame; }
    else this.setupSprite(node, frame, 62, 64);
  }
  private updateIntro(dt: number) {
    const intro = this.intro;
    if (!intro) return;
    if (intro.battle !== this.battle || !showsBattle(this.mode, this.battleSettings)) { intro.node.destroy(); this.intro = undefined; return; }
    intro.node.active = this.mode === 'playing';
    if (!intro.node.active) return;
    intro.time += dt;
    const lines = ['这里是...地狱吗?', '我得赶紧回去,家离学校不远,就在北边的街道'];
    const first = 0.3 + lines[0].length * 0.075 + 2 + 0.3 + 0.25;
    const second = intro.time >= first, elapsed = second ? intro.time - first : intro.time;
    const text = lines[second ? 1 : 0], end = 0.3 + text.length * 0.075 + 2;
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const slide = smooth(clamp(elapsed / 0.3, 0, 1)) - smooth(clamp((elapsed - end) / 0.3, 0, 1));
    intro.node.setPosition(-W / 2 - 460 + 480 * slide, 106);
    intro.label.string = text.slice(0, clamp(Math.floor((elapsed - 0.3) / 0.075), 0, text.length));
    if (second && elapsed >= end + 0.3) { intro.node.destroy(); this.intro = undefined; }
  }
  private updateSupplySprites() {
    const b = this.battle;
    if (this.lootBattle !== b || this.lootLevel !== b.stage) {
      for (const node of this.lootNodes.values()) node.destroy();
      this.lootNodes.clear(); this.lootIcons.clear(); this.lootBattle = b; this.lootLevel = b.stage;
    }
    for (const item of b.loot) {
      let node = this.lootNodes.get(item.id);
      const frame = item.kind === 'mod-cache' ? this.shopFrames.get('parts') :
        this.itemFrames.get(item.kind === 'ammo' && b.heroId !== HEROINE_ID ? 'rifle-ammo' : item.kind);
      if (!node && frame) {
        node = this.makeNode('Loot ' + item.id, this.litWorld);
        const glow = this.graphics('Gold outline', node);
        disc(glow, 0, 0, 28, '#e9ad34', 32);
        glow.lineWidth = 5; glow.strokeColor = color('#8b5714', 240); glow.circle(0, 0, 25); glow.stroke();
        glow.lineWidth = 2.5; glow.strokeColor = color('#ffe387'); glow.circle(0, 0, 25); glow.stroke();
        const icon = this.makeNode('Loot icon', node); this.setupSprite(icon, frame, 42, 42);
        this.lootIcons.set(item.id, icon);
        this.lootNodes.set(item.id, node);
      }
      if (node) { node.active = !item.taken; node.setPosition(item.x, item.y); }
      const icon = this.lootIcons.get(item.id);
      if (icon) { const scale = 1 + 0.10 * Math.sin(b.elapsed * Math.PI * 1.2); icon.setScale(scale, scale, 1); }
    }
    for (const [index, kind] of (['bandage', 'medkit', 'drink', 'healing', 'speed'] as const).entries()) {
      const id = 'supply-art-' + kind;
      let node = this.itemHudNodes.get(kind);
      const frame = this.itemFrames.get(kind);
      if (!node && frame) { node = this.makeNode(id, this.canvas); this.setupSprite(node, frame, index < 3 ? 38 : 22, index < 3 ? 38 : 22); this.itemHudNodes.set(kind, node); }
      if (!node) continue;
      const time = kind === 'healing' ? b.healingTime : kind === 'speed' ? b.speedTime : 0;
      node.active = this.mode === 'playing' && (index < 3 ? this.suppliesOpen && !b.tutorial : time > 0 && (time >= 3 || Math.floor(b.elapsed * 5) % 2 === 0));
      if (index < 3) node.setPosition(1120 - index * 55 + 24 - W / 2, 389 - H / 2);
      else node.setPosition(25 + (index - 3) * 31 + 13 - W / 2, 613 - H / 2);
      node.setSiblingIndex(this.hud.node.getSiblingIndex() + 1);
    }
    for (const slot of this.supplySlotNodes) slot.active = this.suppliesOpen && !b.tutorial;
  }
  private updateGhostRadio(dt: number) {
    const radio = this.ghostRadio;
    if (!radio) return;
    if (radio.battle !== this.battle || this.mode === 'result' || !showsBattle(this.mode, this.battleSettings)) {
      radio.node.destroy();
      this.ghostRadio = undefined;
      return;
    }
    radio.node.active = this.mode === 'playing';
    if (!radio.node.active) return;
    radio.elapsed += dt;
    const text = '疑似发现幸存者!';
    const slide = 0.30, cadence = 0.075, typingEnds = slide + text.length * cadence, exitStarts = typingEnds + 2;
    const ease = (t: number) => t * t * (3 - 2 * t);
    const progress = ease(clamp(radio.elapsed / slide, 0, 1)) - ease(clamp((radio.elapsed - exitStarts) / slide, 0, 1));
    radio.node.setPosition(W / 2 - 338 * progress, 60);
    radio.label.string = text.slice(0, clamp(Math.floor((radio.elapsed - slide) / cadence), 0, text.length));
    if (radio.elapsed >= exitStarts + slide) {
      radio.node.destroy();
      this.ghostRadio = undefined;
    }
  }
  private completeTutorial(skipped = false) {
    if (!this.battle.tutorial) return;
    this.profile.tutorial = 'done'; this.profile.tutorialSeen = true;
    this.profile.tutorialCompleted = !skipped || this.profile.tutorialCompleted;
    this.profile.tutorialSkipped = skipped || this.profile.tutorialSkipped;
    this.battle.endTutorial(); this.save(); this.open('playing');
    this.resetInput(); this.feedback.reset(); this.weaponEffects.clear();
    this.toast('教学结束 · 北侧木门通向长廊，去值班室找钥匙');
  }
  private toggleAutoFire() {
    this.profile.autoFire = !this.profile.autoFire;
    this.battle.tutorial?.enableAuto(this.profile.autoFire);
    this.mouseFire = false; // Switching mode is never itself a trigger.
    this.save(); this.uiTick = 0;
  }
  private useTactical() {
    if (this.battle.operationRun) {
      if (!this.transition && this.mode === 'playing' && this.battle.operationRun.airSupport) {
        if (this.battle.useOperationSupport()) this.uiTick = 0;
        else this.toast('请朝开阔区域瞄准后再呼叫支援');
      }
      return;
    }
    if (!this.battle.tactical.selected || !this.battle.tactical.remaining) return;
    if (this.battle.throwTactical()) { this.uiTick = 0; return; }
    const slot = this.battle.tactical;
    this.toast(slot.cooldown > 0 ? `道具冷却 ${slot.cooldown.toFixed(1)}s` : isShopMine(slot.selected) ? '此处暂时无法布置地雷' : '当前动作无法投掷');
  }
  private time(n: number) { return `${Math.floor(n / 60).toString().padStart(2, '0')}:${Math.floor(n % 60).toString().padStart(2, '0')}`; }
  private updateHud() {
    const g = this.hud, b = this.battle, p = b.player; g.clear();
    const a = HUD.auto, on = this.profile.autoFire;
    this.soutline(g, a.x, a.y, a.w, a.h, on ? C.gold : C.line);
    this.text('auto-fire-state', `AUTO ${on ? 'ON' : 'OFF'}`, a.x + a.w / 2, a.y + a.h * 0.68, 18, on ? C.gold : C.text, this.canvas, a.w, Label.HorizontalAlign.CENTER);
    const reason = b.shootBlockReason();
    this.text('auto-fire-reason', on ? reason ? `禁火:${reason}` : (this.sweeping ? '转向中' : '自动射击') : '手动射击', a.x + a.w / 2, a.y + a.h * 0.24, 14, on && reason ? C.gold : C.text, this.canvas, a.w, Label.HorizontalAlign.CENTER);
    this.sbox(g, 113, 672, 205, 8, '#293c3e'); this.sbox(g, 113, 672, 205 * clamp(p.hp / p.maxHp, 0, 1), 8, p.hp / p.maxHp <= 0.25 ? C.red : C.jade);
    this.labels.get('health')!.string = `生命 ${Math.ceil(p.hp)} / ${p.maxHp}`;
    const room = Math.max(0, roomAt(p, this.battle.rooms));
    const intruders = b.enemies.filter(e => e.hp > 0 && e.room !== room && roomAt(e, b.rooms) === room).length;
    const remaining = b.enemies.filter(e => e.room === room && e.hp > 0).length + intruders, safe = b.cleared[room] && intruders === 0;
    this.labels.get('objective')!.string = b.stage.operation ? b.stage.title : b.stage.apartment ? `${b.stage.title}  /  ${b.rooms[room].kind}` : b.stage.street ? `归途  /  ${b.rooms[room].kind}` : b.stage.dorm ? `宿舍楼 ${b.stage.dorm.number}F  /  ${b.rooms[room].kind}` : b.cleared.every(Boolean) ? '前往洗衣房东北角楼梯撤离' : `${b.rooms[room].kind}  /  ${safe ? '区域安全' : intruders ? '应对追击' : '清理威胁'}`;
    this.labels.get('sub-objective')!.string = b.stage.operation || b.stage.dorm || b.stage.street || b.apartment ? `${this.time(b.elapsed)}    ·    ${b.alarmTime !== null && b.stage.dorm ? '警报响起  ·  ' : ''}${b.objective}` : `${this.time(b.elapsed)}    ·    已清理 ${b.cleared.filter(Boolean).length} / ${b.rooms.length}    ·    ${safe ? b.stage.hints[room] : `当前区域剩余威胁 ${remaining}`}`;
    this.drawMinimap(g);
    this.labels.get('ammo')!.string = p.reload > 0 ? `换弹 ${p.reload.toFixed(1)}s` : `${String(p.ammo).padStart(2, '0')} / ${b.reserveAmmo}`;
    this.labels.get('ammo')!.color = color(p.ammo < 5 || p.reload > 0 ? C.gold : C.text);
    if (!this.supplyUiFrames.has('backpack')) {
      this.sbox(g, 1170, 365, 75, 48, '#172328', 245);
      this.soutline(g, 1170, 365, 75, 48, C.gold);
    }
    this.text('supply-toggle-text', this.suppliesOpen ? '收起' : '补给', 1207, 357, 12, C.text, this.canvas, 70, Label.HorizontalAlign.CENTER);
    (['bandage', 'medkit', 'drink'] as SupplyKind[]).forEach((kind, i) => {
      const button = this.buttons.find(button => button.node.name === 'Button-supply-' + kind)?.node;
      if (button) button.active = this.suppliesOpen && !b.tutorial;
      const key = 'supply-icon-' + kind, existing = this.labels.get(key);
      if (!this.suppliesOpen || b.tutorial) { if (existing) existing.string = ''; return; }
      const x = 1120 - i * 55;
      if (!this.supplyUiFrames.has('slot')) {
        this.sbox(g, x, 365, 48, 48, '#1c292b', 245);
        this.soutline(g, x, 365, 48, 48, C.gold);
      }
      this.text(key, String(b.supplies[kind]), x + 41, 372, 15, '#ffffff', this.canvas, 20, Label.HorizontalAlign.CENTER);
    });
    for (const [i, kind, time] of [[0, 'healing', b.healingTime], [1, 'speed', b.speedTime]] as const) {
      const button = this.buttons.find(button => button.node.name === 'Button-status-' + kind)?.node;
      if (button) button.active = time > 0;
      if (time <= 0) continue;
      const alpha = time < 3 && Math.floor(b.elapsed * 5) % 2 ? 90 : 255;
      this.sbox(g, 25 + i * 31, 600, 26, 26, '#243734', alpha);
      this.soutline(g, 25 + i * 31, 600, 26, 26, C.gold, alpha);
      this.text('status-time-' + kind, String(Math.ceil(time)), 46 + i * 31, 604, 11, '#ffffff', this.canvas, 16, Label.HorizontalAlign.CENTER);
    }
    for (const kind of ['healing', 'speed'] as const) if ((kind === 'healing' ? b.healingTime : b.speedTime) <= 0 && this.labels.has('status-time-' + kind)) this.labels.get('status-time-' + kind)!.string = '';
    const hint = this.supplyTooltip || (b.usingSupply ? `正在使用 ${SUPPLY_INFO[b.usingSupply.kind].name} ${b.usingSupply.time.toFixed(1)}秒` : '');
    if (hint) { this.sbox(g, 755, 420, 475, 35, '#101a20', 245); this.text('supply-hint', hint, 990, 438, 15, C.text, this.canvas, 460, Label.HorizontalAlign.CENTER); }
    else if (this.labels.has('supply-hint')) this.labels.get('supply-hint')!.string = '';
    const t = b.tutorial;
    if (t) {
      const clickAuto = t.step === 'auto' && (!on || !t.autoEnabled) || t.step === 'manual' && on;
      const r = t.step === 'move' ? HUD.move : clickAuto ? HUD.auto : HUD.fire;
      this.soutline(g, r.x - 4, r.y - 4, r.w + 8, r.h + 8, C.gold);
      this.labels.get('sub-objective')!.string = '安全教学 · 暂停可跳过 · 完成后原地继续探索';
    }
    // Item cooldowns are drawn on their own scalable roots every frame.
    const target = b.nearbyObjective(), loot = b.nearbyPickup(), clue = b.nearbyClue(), door = b.nearbyDoor();
    for (const visibleClue of b.visibleClues()) {
      const found = this.profile.clues.includes(visibleClue.id), x = visibleClue.surface.x - p.x + W / 2, y = visibleClue.surface.y - p.y + H / 2;
      this.soutline(g, x - 18, y - 18, 36, 36, found ? '#e4d49a' : C.gold, found ? 160 : 245);
      this.sbox(g, x - 12, y - 12, 24, 24, found ? '#e4d49a' : '#d9ad4d', found ? 100 : 190);
    }
    const free = !t && !b.floorPending && !b.evacuationDrive, handsFree = free && b.generatorProgress === undefined;
    const verb = clue ? '调查' : target ? target.id === 'apartment' ? target.verb : '下楼' : door ? door.locked ? '开锁' : Math.abs(door.target - door.baseAngle) < 0.01 ? '开门' : '关门' : '';
    const kits = b.apartment?.kits ?? 0;
    this.showHudAction('door', HUD.door, handsFree && !!verb, 'door-button', verb, 'E');
    this.showHudAction('pickup', HUD.pickup, handsFree && !!loot, 'pickup-button', '拾取', 'F');
    this.showHudAction('apartment-trap', HUD.trap, free && kits > 0, 'apartment-trap-count', `陷阱 ×${kits}`, 'T');
    const tactical = b.tactical.selected;
    const air = b.operationRun?.airSupport;
    this.showHudAction('grenade', HUD.grenade, free && (!!air || !!tactical && b.tactical.remaining > 0), 'grenade-label',
      air ? '空中支援 ×1' : tactical ? `${TACTICAL_DEFINITIONS[tactical].title} ×${b.tactical.remaining}` : '', 'G');
    if (handsFree && (verb || loot)) {
      this.sbox(g, 388, 77, 440, 40, C.ink, 220);
      const context = clue ? `${CLUE_SPECS.find(c => c.id === clue.id)!.title}  ·  ${this.profile.clues.includes(clue.id) ? '已调查，可重复阅读' : '首次调查建立剧情档案'}` : target ? target.name : door ? `${door.name}  ·  ${door.locked ? door.key === 'stairs' ? '需要楼梯钥匙' : '需要大门钥匙' : door.alarm && b.alarmTime === null ? '警报装置待机' : door.material === 'steel' ? '不可破坏' : `耐久 ${Math.ceil(door.hp)} / ${door.maxHp}`}` : loot!.name;
      this.text('door-context', context, 608, 97, 17, C.gold, this.canvas, 430, Label.HorizontalAlign.CENTER);
    } else if (this.labels.has('door-context')) this.labels.get('door-context')!.string = '';
    for (const [i, rect, origin, active, vector] of [
      [0, HUD.move, this.moveOrigin, this.moving, this.moveVector],
      [1, HUD.fire, this.aimOrigin, this.aiming, this.aimVector],
    ] as const) {
      const x = active ? origin.x : rect.x + rect.w / 2, y = active ? origin.y : rect.y + rect.h / 2;
      this.battleSticks[i]?.setPosition(x - W / 2, y - H / 2);
      if (!this.battleSticks[i]) this.joystick(g, x, y, active ? vector : { x: 0, y: 0 }, active, i === 1);
      else if (active && i === 1) {
        // The inner/outer zones are feedback only; the plate itself remains the hit area.
        g.strokeColor = color(C.muted, 75); g.lineWidth = 1; g.circle(x - W / 2, y - H / 2, 42); g.stroke();
        g.strokeColor = color(C.gold, 90); g.lineWidth = 1; g.circle(x - W / 2, y - H / 2, 50); g.stroke();
        disc(g, x + vector.x * 39 - W / 2, y + vector.y * 39 - H / 2, 21, this.aimOuter ? C.gold : C.muted, 120);
      }
    }
    // Crosshair is part of HUD: it must not disclose unseen enemies.
    if (!sys.isMobile) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) this.sline(g, this.mx + dx * 6, this.my + dy * 6, this.mx + dx * 14, this.my + dy * 14, C.gold, 1.5, 200);
    }
    if (this.noticeTime > 0 && !t) {
      this.sbox(g, 345, 549, 590, 45, C.ink, 225);
      this.text('toast', this.notice, 640, 572, 17, C.gold, this.canvas, 570, Label.HorizontalAlign.CENTER);
    } else if (this.labels.has('toast')) this.labels.get('toast')!.string = '';
  }
  private drawMinimap(g: Graphics) {
    const r = HUD.map;
    this.sbox(g, r.x + 14, r.y + 17, r.w - 28, r.h - 34, '#0f1212');
    const rooms = this.battle.rooms;
    const minX = Math.min(...rooms.map(r => r.x)), minY = Math.min(...rooms.map(r => r.y));
    const maxX = Math.max(...rooms.map(r => r.x + r.w)), maxY = Math.max(...rooms.map(r => r.y + r.h));
    const scale = Math.min((r.w - 38) / (maxX - minX), (r.h - 44) / (maxY - minY));
    const ox = r.x + (r.w - (maxX - minX) * scale) / 2 - minX * scale;
    const oy = r.y + (r.h - (maxY - minY) * scale) / 2 - minY * scale;
    const b = this.battle, map = b.minimap, size = MINIMAP_CELL_SIZE;
    const state = (x: number, y: number) => map.visible[y * map.columns + x] ? 2 : map.explored[y * map.columns + x] ? 1 : 0;
    for (let y = 0; y < map.rows; y++) {
      for (let x = 0; x < map.columns;) {
        const fill = state(x, y);
        if (!fill) { x++; continue; }
        let end = x + 1;
        while (end < map.columns && state(end, y) === fill) end++;
        const left = Math.max(minX, x * size), bottom = Math.max(minY, y * size);
        this.sbox(g, ox + left * scale, oy + bottom * scale, (Math.min(maxX, end * size) - left) * scale, (Math.min(maxY, (y + 1) * size) - bottom) * scale, fill === 2 ? '#778c83' : '#37484c');
        x = end;
      }
    }
    const street = b.stage.street;
    const goal = street ? b.alarmTime === null ? street.alarm : b.player.y < street.upperTurn.y - 170 ? street.upperTurn : b.stage.exit
      : b.stage.dorm ? b.pickup ?? b.stage.exit : b.apartmentGoal;
    if (goal && state(Math.floor(goal.x / size), Math.floor(goal.y / size))) disc(g, ox + goal.x * scale - W / 2, oy + goal.y * scale - H / 2, 3, C.gold);
    for (const ally of b.allies) if (ally.hp > 0 && state(Math.floor(ally.x / size), Math.floor(ally.y / size)) === 2) {
      disc(g, ox + ally.x * scale - W / 2, oy + ally.y * scale - H / 2, 2, '#7acfbf');
    }
    const p = this.battle.player;
    const px = ox + p.x * scale - W / 2, py = oy + p.y * scale - H / 2;
    const angle = p.angle;
    polygon(g, [
      { x: px + Math.cos(angle) * 5, y: py + Math.sin(angle) * 5 },
      { x: px + Math.cos(angle + 2.5) * 4, y: py + Math.sin(angle + 2.5) * 4 },
      { x: px + Math.cos(angle - 2.5) * 4, y: py + Math.sin(angle - 2.5) * 4 },
    ], C.gold);
  }
  private createHudAction(id: string, art: BattleImage | SpriteFrame, rect: typeof HUD.roll, remaining: () => number, duration: () => number, locked = false) {
    const root = typeof art === 'string' ? this.battleSprite(art, rect) || this.makeNode(art, this.battleArtwork!) :
      this.makeNode(id, this.battleArtwork!);
    if (typeof art !== 'string') {
      const badge = this.makeNode('Air support aircraft', root);
      const sprite = this.setupSprite(badge, art, rect.h * 0.32, rect.h * 0.79);
      sprite.color = color('#ffe3a7');
      badge.angle = -36;
    }
    root.getComponent(UITransform)!.setContentSize(rect.w, rect.h);
    root.setPosition(rect.x + rect.w / 2 - W / 2, rect.y + rect.h / 2 - H / 2);
    const ring = this.graphics('Cooldown-' + id, root);
    const label = this.text('cooldown-' + id, '', W / 2, H / 2, 18, '#ffe0a0', root, 90, Label.HorizontalAlign.CENTER);
    label.enableOutline = true; label.outlineColor = color('#131719'); label.outlineWidth = 2;
    this.hudActions.push({ id, root, sprite: root.getComponent(Sprite) || undefined, ring, label, remaining, duration, locked, previous: remaining(), glow: 0, scale: 1, owners: new Set(), progress: 0 });
  }
  private showHudAction(id: string, rect: typeof HUD.roll, visible: boolean, label: string, caption: string, hotkey: string) {
    const action = this.hudActions.find(item => item.id === id);
    if (!action) return;
    const button = this.buttons.find(item => item.node.name === 'Button-' + id);
    if (button) button.node.active = visible;
    action.root.active = visible;
    this.text(label, visible ? `${caption}${sys.isMobile ? '' : '  ' + hotkey}` : '', rect.x + rect.w / 2, rect.y - 4, 12, C.text, this.canvas, 106, Label.HorizontalAlign.CENTER);
  }
  private pressHud(x: number, y: number, owner: number) {
    if (this.mode !== 'playing') return;
    for (const a of this.hudActions) {
      const b = this.buttons.find(b => b.node.name === 'Button-' + a.id);
      if (b?.node.active && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { a.owners.add(owner); a.scale = 0.88; a.root.setScale(a.scale, a.scale, 1); }
    }
  }
  private releaseHud(owner: number | null) { if (owner !== null) for (const a of this.hudActions) a.owners.delete(owner); }
  private updateHudFeedback(dt: number) {
    const v = this.moving ? this.moveVector : { x: 0, y: 0 };
    const ease = this.moving ? 1 : 1 - Math.exp(-dt * 24);
    this.capOffset.x += (v.x * 39 - this.capOffset.x) * ease;
    this.capOffset.y += (v.y * 39 - this.capOffset.y) * ease;
    if (Math.hypot(this.capOffset.x, this.capOffset.y) < 0.05) this.capOffset = { x: 0, y: 0 };
    this.moveCap?.setPosition(HUD.move.x + HUD.move.w / 2 - W / 2 + this.capOffset.x, HUD.move.y + HUD.move.h / 2 - H / 2 + this.capOffset.y);
    for (const a of this.hudActions) {
      const remaining = Math.max(0, a.remaining()), total = a.duration();
      a.scale += ((a.owners.size ? 0.88 : 1) - a.scale) * (1 - Math.exp(-dt * 26));
      a.root.setScale(a.scale, a.scale, 1);
      // Only a real positive -> zero transition in this HUD lifetime can flash.
      if (!a.locked && a.previous > 0 && remaining === 0) a.glow = 0.55;
      else a.glow = Math.max(0, a.glow - dt);
      a.previous = remaining;
      a.progress = remaining > 0 && total > 0 ? clamp(1 - remaining / total, 0, 1) : a.glow > 0 ? 1 : 0;
      if (a.sprite) a.sprite.color = color(a.locked ? '#55585e' : remaining > 0 ? '#383b40' : '#ffffff');
      a.label.string = !a.locked && remaining > 0 ? remaining.toFixed(1) + 's' : '';
      const g = a.ring; g.clear();
      const radius = Math.min(a.root.getComponent(UITransform)!.width, a.root.getComponent(UITransform)!.height) * 0.44;
      if (a.progress > 0) {
        g.strokeColor = color('#ffd16b'); g.lineWidth = 3.5;
        const steps = Math.max(1, Math.ceil(a.progress * 80));
        for (let i = 0; i <= steps; i++) {
          const angle = Math.PI / 2 - Math.PI * 2 * a.progress * i / steps;
          const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
          if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
      }
      if (a.glow > 0) {
        const phase = 1 - a.glow / 0.55, alpha = Math.sin(Math.PI * phase);
        for (let i = 0; i < 3; i++) {
          g.strokeColor = color('#ffe2a0', Math.round(alpha * (150 - i * 45))); g.lineWidth = 3 + i * 3;
          g.circle(0, 0, radius + phase * (4 + i * 3)); g.stroke();
        }
      }
    }
  }
  private joystick(g: Graphics, x: number, y: number, v: { x: number; y: number }, active: boolean, aim: boolean) {
    const px = x - W / 2, py = y - H / 2;
    disc(g, px, py, 64, '#17252c', active ? 150 : 80);
    g.strokeColor = color(active ? C.gold : '#83948e', active ? 170 : 65); g.lineWidth = 1.2; g.circle(px, py, 64); g.stroke();
    line(g, px - 72, py, px - 59, py, '#8b9e94', 1, 80); line(g, px + 59, py, px + 72, py, '#8b9e94', 1, 80);
    disc(g, px + v.x * 39, py + v.y * 39, 24, active ? aim ? '#bc9e6b' : '#83a89b' : '#536860', active ? 190 : 75);
    g.strokeColor = color(active ? C.text : '#96a99b', active ? 180 : 95); g.circle(px + v.x * 39, py + v.y * 39, 24); g.stroke();
  }
  private keyDown(e: EventKeyboard) {
    if (this.transition) return;
    if (this.readerLayer) { if (this.reader.open && !this.readerClosing && e.keyCode === KeyCode.ESCAPE) this.closeReader(); return; }
    if (this.tutorialPrompt) {
      if (e.keyCode === KeyCode.ESCAPE) this.cancelTutorialSkip();
      return; // No implicit acceptance, held movement or action keys behind cards.
    }
    const was = this.keys.has(e.keyCode); this.keys.add(e.keyCode);
    if (was) return;
    if (e.keyCode === KeyCode.ESCAPE && (this.mode === 'missions' || this.mode === 'checkin' || this.mode === 'backpack' || this.mode === 'achievements')) { this.open('menu'); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'training') { this.open(this.trainingBack); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'recruit') { this.open(this.recruitBack); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'roster') { this.open(this.rosterBack); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'cases') { this.backFromCases(); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'shop') {
      const product = this.shopProduct;
      this.shopProduct = undefined; this.open(product ? 'shop' : this.shopBack); return;
    }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'chapters') { this.open('menu'); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'chapter-intro') { this.open('chapters'); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'select-hero') { this.open('chapter-intro'); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'help') { this.open('settings'); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'settings') { this.open(this.battleSettings ? 'playing' : 'menu'); return; }
    if (e.keyCode === KeyCode.ENTER) {
      if (this.mode === 'menu') this.open('chapters');
      else if (this.mode === 'chapter-intro') this.openSortiePicker();
      else if (this.mode === 'select-hero') this.dispatchSortie();
      else if (this.mode === 'pause') this.open('playing');
      return;
    }
    if (e.keyCode === KeyCode.ESCAPE && this.reader.open) { this.closeReader(); return; }
    if (e.keyCode === KeyCode.ESCAPE || e.keyCode === KeyCode.KEY_P) { if (this.mode === 'playing') this.open('pause'); else if (this.mode === 'pause') this.open('playing'); return; }
    if (this.mode !== 'playing') return;
    if (e.keyCode === KeyCode.SPACE) this.dodge();
    if (e.keyCode === KeyCode.KEY_R) this.battle.reload();
    if (e.keyCode === KeyCode.KEY_G) this.useTactical();
    if (e.keyCode === KeyCode.KEY_T && this.battle.apartment) this.placeApartmentTrap();
    if (e.keyCode === KeyCode.KEY_E) this.interactOrInvestigate();
    if (e.keyCode === KeyCode.KEY_F) this.battle.collectPickup();
  }
  private interactOrInvestigate() {
    if (this.readerLayer || this.mode !== 'playing') return;
    const clue = this.battle.nearbyClue();
    if (clue) {
      const result = this.battle.investigateClue(this.profile);
      if (result) { if (result.first) this.save(); this.showReader(clue.id); }
      return;
    }
    this.battle.interact();
  }
  private placeApartmentTrap() {
    if (!this.battle.apartment?.kits) return;
    if (!this.battle.placeApartmentTrap()) this.toast('此处暂时无法布置麻痹陷阱');
    else { this.toast('麻痹陷阱已布置'); this.uiTick = 0; }
  }
  private keyUp(e: EventKeyboard) { this.keys.delete(e.keyCode); }
  private hitButton(x: number, y: number): boolean {
    return this.buttons.some(b => b.node.active && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
  }
  private pointerPosition(e: EventMouse | EventTouch) {
    // Match the actual UI camera, including letterboxing and editor preview resizing.
    const screen = e.getLocation();
    const world = this.camera.screenToWorld(new Vec3(screen.x, screen.y, 0));
    const local = this.canvas.getComponent(UITransform)!.convertToNodeSpaceAR(world);
    return { x: local.x + W / 2, y: local.y + H / 2 };
  }
  private overStreetStory(x: number, y: number) {
    const story = this.streetStory;
    if (!story || !story.node.active) return false;
    const left = story.node.position.x + W / 2, centerY = story.node.position.y + H / 2;
    return x >= left && x <= left + 510 && y >= centerY - 55 && y <= centerY + 55;
  }
  private mouseMove(e: EventMouse) { if (this.readerLayer || this.transition) return; const p = this.pointerPosition(e); this.mx = p.x; this.my = p.y; if (this.mode === 'playing' && !this.hitButton(p.x, p.y) && !this.overStreetStory(p.x, p.y)) this.mouseAimInput = true; }
  private mouseDown(e: EventMouse) { if (this.readerLayer || this.transition || this.tutorialPrompt || sys.isMobile || e.getButton() !== EventMouse.BUTTON_LEFT) return; const p = this.pointerPosition(e); if (this.overStreetStory(p.x, p.y)) return; this.mouseMove(e); this.startSupplyPress(this.mx, this.my, -2); this.pressHud(this.mx, this.my, -2); if (!this.hitButton(this.mx, this.my) && this.mode === 'playing') this.mouseFire = true; }
  private mouseUp() { if (this.readerLayer) { this.resetInput(); return; } this.mouseFire = false; this.releaseHud(-2); }
  private touchStart(e: EventTouch) {
    if (this.readerLayer) return;
    // Desktop clicks also generate touch events in Cocos; only mobile uses sticks.
    if (!sys.isMobile || this.tutorialPrompt || this.transition) return;
    const p = this.pointerPosition(e), id = e.getID();
    if (id === null) return;
    if (this.overStreetStory(p.x, p.y)) return;
    this.startSupplyPress(p.x, p.y, id);
    this.pressHud(p.x, p.y, id);
    if (this.hitButton(p.x, p.y) || this.mode !== 'playing') return;
    const inside = (r: typeof HUD.move) => Math.hypot((p.x - r.x - r.w / 2) / (r.w / 2), (p.y - r.y - r.h / 2) / (r.h / 2)) <= 1;
    if (inside(HUD.move) && this.moveTouch < 0) { this.moveTouch = id; this.moveOrigin = { x: HUD.move.x + HUD.move.w / 2, y: HUD.move.y + HUD.move.h / 2 }; this.moving = true; }
    else if (inside(HUD.fire) && this.aimTouch < 0) { this.aimTouch = id; this.aimOrigin = { x: HUD.fire.x + HUD.fire.w / 2, y: HUD.fire.y + HUD.fire.h / 2 }; this.aiming = true; this.aimVector = { x: 0, y: 0 }; }
    this.touchMove(e);
  }
  private startSupplyPress(x: number, y: number, id: number) {
    if (!this.suppliesOpen || this.mode !== 'playing') return;
    (['bandage', 'medkit', 'drink'] as SupplyKind[]).forEach((kind, i) => {
      const left = 1120 - i * 55;
      if (x >= left && x <= left + 48 && y >= 365 && y <= 413) this.supplyPress = { id, kind, time: 0, long: false, cancelled: false };
    });
  }
  private touchMove(e: EventTouch) {
    if (!sys.isMobile || this.tutorialPrompt || this.transition) return;
    const p = this.pointerPosition(e), id = e.getID();
    if (id === this.moveTouch) { const dx = p.x - this.moveOrigin.x, dy = p.y - this.moveOrigin.y, d = Math.max(52, Math.hypot(dx, dy)); this.moveVector = { x: dx / d, y: dy / d }; }
    if (id === this.aimTouch) {
      const dx = p.x - this.aimOrigin.x, dy = p.y - this.aimOrigin.y;
      const distance = Math.hypot(dx, dy);
      // Radius uses the actual plate ellipse. No gameplay centre dead zone:
      // even a subpixel drag has a direction; exact centre never calls atan2.
      this.aimRadius = Number.isFinite(distance) ? Math.min(1, Math.hypot(dx / (HUD.fire.w / 2), dy / (HUD.fire.h / 2))) : 0;
      this.aimVector = distance > 0 && Number.isFinite(distance) ? { x: dx / distance * this.aimRadius, y: dy / distance * this.aimRadius } : { x: 0, y: 0 };
      this.aimOuter = this.aimRadius >= (this.aimOuter ? 0.60 : 0.70);
    }
  }
  private touchEnd(e: EventTouch) {
    this.releaseHud(e.getID());
    if (e.getID() === this.moveTouch) { this.moveTouch = -1; this.moving = false; this.moveVector = { x: 0, y: 0 }; }
    if (e.getID() === this.aimTouch) { this.aimTouch = -1; this.aiming = false; this.aimOuter = false; this.aimRadius = 0; }
  }
  private movement() { return { x: this.moveVector.x + (this.keys.has(KeyCode.KEY_D) || this.keys.has(KeyCode.ARROW_RIGHT) ? 1 : 0) - (this.keys.has(KeyCode.KEY_A) || this.keys.has(KeyCode.ARROW_LEFT) ? 1 : 0), y: this.moveVector.y + (this.keys.has(KeyCode.KEY_W) || this.keys.has(KeyCode.ARROW_UP) ? 1 : 0) - (this.keys.has(KeyCode.KEY_S) || this.keys.has(KeyCode.ARROW_DOWN) ? 1 : 0) }; }
  private dodge() { const v = this.movement(); this.battle.dodge(v.x, v.y); }
  private hide() { if (this.mode === 'playing' && !this.transition) this.open('pause'); else this.resetInput(); }
  private play(name: string) {
    if (name === 'door-use' || !this.profile.sound) return;
    const support = name === 'support-shot' || name === 'support-shot-suppressed' || name === 'operation-hostile-shot';
    const quiet = name === 'support-shot-suppressed' || name === 'shoot' && this.battle.hero.quiet;
    const clip = this.clips.get(quiet ? 'shoot-suppressed' : support ? 'shoot' : name === 'door-sound' ? 'reload' :
      name === 'door-break' || name === 'grenade-blast' ? 'kill' : name);
    if (clip) this.audio.playOneShot(clip, support ? 0.11 : name === 'door-sound' ? 0.12 : name === 'shoot' ? 0.28 : 0.38);
  }
  private syncActorMotions() {
    if (this.motionBattle !== this.battle) {
      this.motionBattle = this.battle; this.motion.reset(this.battle.player);
      this.enemyMotions.clear(); this.enemyPoses.clear();
    }
    const units = [...this.battle.enemies, ...this.battle.allies].filter(unit => unit.hp > 0);
    const living = new Set(units.map(unit => unit.id));
    for (const id of this.enemyMotions.keys()) if (!living.has(id)) { this.enemyMotions.delete(id); this.enemyPoses.delete(id); }
    for (const e of units) {
      if (this.enemyMotions.has(e.id)) continue;
      const motion = new ActorMotion(); motion.reset(e);
      this.enemyMotions.set(e.id, motion); this.enemyPoses.set(e.id, motion.pose);
    }
  }
  update(dt: number) {
    if (this.readerLayer) { this.resetInput(); this.stepReaderAnimation(Math.min(dt, 0.05)); return; }
    dt = Math.min(dt, 0.05); this.presentationTime += dt; this.noticeTime = Math.max(0, this.noticeTime - dt); this.hitAudioTime = Math.max(0, this.hitAudioTime - dt);
    const cinema = this.operationCinema;
    this.stepOperationDialogue(dt);
    if (this.mode === 'operation-cinematic' && cinema) {
      cinema.time += dt;
      if (cinema.draw(cinema.time)) cinema.finish();
      return;
    }
    const transitioning = !!this.transition;
    if (transitioning) this.stepTransition(dt);
    else this.updateIntro(dt);
    if (!transitioning) this.updateStreetStory(dt);
    if (this.supplyPress && this.mode === 'playing' && !this.supplyPress.cancelled) {
      this.supplyPress.time += dt;
      if (this.supplyPress.time >= 0.5) { this.supplyPress.long = true; this.supplyTooltip = SUPPLY_INFO[this.supplyPress.kind].description; this.uiTick = 0; }
    }
    if (!transitioning) this.updateGhostRadio(dt);
    this.updateApartmentPresentation(dt);
    if (this.mode === 'street-loading') { this.updateChapterLoad(dt); return; }
    if (!showsBattle(this.mode, this.battleSettings)) {
      if (this.mode === 'training') this.stepTrainingSwitch(dt);
      if (this.mode === 'cases') this.stepCaseRoll(dt);
      if (this.mode === 'checkin' && this.checkInPulse) this.checkInPulse.opacity = Math.round(219 + 31 * Math.cos(this.presentationTime * 3.2));
      const claim = this.checkInClaimFeedback;
      if (claim) {
        claim.time = Math.min(0.32, claim.time + dt);
        const scale = 1 + 0.25 * (1 - claim.time / 0.32) ** 2;
        claim.mark?.setScale(scale, scale, 1);
        if (claim.time === 0.32) this.checkInClaimFeedback = undefined;
      }
      this.uiTick -= dt;
      if (this.uiTick <= 0) {
        this.uiTick = 1 / 20;
        if (this.mode === 'missions' && refreshDailyMissions(this.profile)) { this.open('missions'); return; }
        if (this.mode === 'menu' || this.mode === 'checkin') {
          const status = checkInStatus(this.profile.checkIn);
          if (status.rollover || this.mode === 'checkin' && status.day !== this.checkInShownDay) { this.open(this.mode); return; }
          if (this.mode === 'menu') this.updateCheckInBadge();
        }
        if (this.noticeTime > 0) {
          const home = this.mode === 'menu';
          const y = home ? 125 : this.mode === 'checkin' ? 556 : this.mode === 'cases' ? 151 : 34;
          const label = this.text('panel-toast', this.notice, home ? 455 : 640, y, 17, '#f5d9a1', this.modal, home ? 610 : 900, Label.HorizontalAlign.CENTER);
          label.enableOutline = true;
          label.outlineColor = color('#080b0d');
          label.outlineWidth = 2;
        } else if (this.labels.has('panel-toast')) this.labels.get('panel-toast')!.string = '';
      }
      return;
    }
    this.syncActorMotions();
    const active = this.mode === 'playing' && !transitioning && !this.transition, p = this.battle.player;
    if (active) {
      this.weaponEffects.step(dt, this.battle.blockers);
      if (this.tutorialPrompt) {
        this.resetInput();
      } else {
      const v = this.movement();
      const stick = this.aiming && this.aimRadius > 0;
      const intent = stick || !sys.isMobile;
      const raw = stick ? Math.atan2(this.aimVector.y, this.aimVector.x) : !sys.isMobile ? Math.atan2(this.my - H / 2 - this.feedback.y, this.mx - W / 2 - this.feedback.x) : p.angle;
      const aim = this.aimAssist.step(dt, raw, p.angle, intent && !p.knockback, sys.isMobile && this.profile.aimAssist, this.battle.aimCandidates());
      this.lastFacing = aim.angle; this.sweeping = aim.sweeping;
      this.battle.update(dt, { ...v, angle: this.lastFacing, fire: !this.profile.autoFire && (this.mouseFire || stick && this.aimOuter), autoFire: this.profile.autoFire, sweeping: this.sweeping,
        aimActive: sys.isMobile ? stick && !this.aimOuter : this.mouseAimInput, manualHeld: this.mouseFire || this.aimOuter });
      for (const footfall of this.battle.bruteFootfalls) this.feedback.heavyFootfall(footfall, p);
      this.mouseAimInput = false;
      const tutorial = this.battle.tutorial;
      if (tutorial && !this.replayTutorial && this.profile.tutorial !== tutorial.step) {
        this.profile.tutorial = tutorial.step; this.save(); this.uiTick = 0;
      }
      if (tutorial?.step === 'done') this.completeTutorial();
      this.lastFacing = p.angle;
      this.motion.step(dt, p);
      for (const event of this.battle.events) {
        if (event !== 'hit' || this.hitAudioTime <= 0 && !this.battle.events.includes('kill')) { this.play(event); if (event === 'hit') this.hitAudioTime = 0.055; }
        if (event === 'shoot') {
          this.feedback.shoot(p.angle, this.battle.heroId);
          this.motion.shoot(p, this.battle.heroId);
          this.weaponEffects.shoot(this.playerWeaponMount(), this.battle.heroId);
        }
        if (event === 'hurt') this.feedback.hurt(p.hp / p.maxHp);
        if (event === 'grenade-blast') {
          const effect = this.battle.tacticalEffects.find(item => item.kind === 'grenade' && item.life === item.max);
          if (effect) this.feedback.explosion(effect, p, !lineClear(effect, p, this.battle.blockers));
        }
        if (event === 'clear') this.toast(this.battle.stage.operation ? '敌人已肃清 · 前往目标' : !this.battle.stage.dorm && !this.battle.stage.street && this.battle.cleared.every(Boolean) ? '所有区域已清理，前往洗衣房东北角楼梯撤离' : '区域安全 · 生命恢复 20，继续前进');
        if (event === 'room' && !this.battle.stage.dorm && !this.battle.stage.street && !this.battle.stage.operation) this.toast(`进入${this.battle.rooms[Math.max(0, roomAt(p, this.battle.rooms))].kind} · 留意攻击预警`);
        if (event === 'operation-air-request') this.speakOperation([
          ['幽灵一组', '小鸟二号，请打击我标记的位置。'],
          ['小鸟二号', '收到，正在打击。'],
        ]);
        if (event === 'operation-market') this.speakOperation([
          ['幽灵一组', '我们进市集了，侧巷有人在增援。'],
          ['小鸟二号', '前方还有封锁线。市集仓库有后门，可以穿过去。'],
        ]);
        if (event === 'operation-emplacement') this.speakOperation([
          ['幽灵一组', '看到两处重机枪阵地。各组从掩体分开推进。'],
          ['指挥部', '指挥部就在封锁线后方。攻下阵地后，继续向东。'],
        ]);
        if (event === 'operation-hold') this.speakOperation([
          ['幽灵二组', '登陆区到了！各组守住这里。'],
          ['指挥部', '接应编队仍未应答，继续呼叫。'],
        ]);
        if (event === 'alert' && !this.battle.events.includes('street-alarm')) this.toast('附近敌人已警戒 · 留意攻击预警');
        if (event === 'door-blocked' && this.battle.doors.some(d => d.blocked > 0 && Math.hypot(p.x - d.x, p.y - d.y) < 200)) this.toast('门被挡住了，请让开门扇的转动范围');
        if (event === 'door-geometry-blocked') this.toast('门扇被墙体或其他门挡住了');
        if (event === 'door-warning') this.toast('⚠ 敌人正在强行撞门');
        if (event === 'door-forced') this.toast('门被强行撞开');
        if (event === 'stairs-locked') this.toast('楼梯间铁门锁住了 · 到东侧值班室找钥匙');
        if (event === 'exit-locked') this.toast('宿舍楼铁门锁住了 · 去宿管室找钥匙');
        if (event === 'key-pickup') this.toast(`已拾取${this.battle.stage.dorm?.pickup.name} · ${this.battle.objective}`);
        if (event === 'unlock') this.toast('铁门已解锁');
        if (event === 'alarm') this.toast('宿管室警报响了 · 丧尸正向这里靠近');
        if (event === 'street-alarm') { this.play('alarm'); this.toast('汽车警报响了 · 从路口向北突围'); }
        if (event === 'street-alarm-pulse') this.play('alarm');
        if (event === 'support-called') this.startGhostRadio();
        if (event === 'ammo-empty') this.toast('备用弹药已耗尽 · 寻找弹药');
        if (event === 'supply-full') this.toast('该补给已满');
        if (event === 'loot') this.toast(this.battle.events.includes('mod-cache') ? '已拾取配件箱 · 行动结束时结算' : '已拾取物资');
        if (event === 'supply-cancel') this.toast('补给使用中断');
        if (event === 'street-supply') this.toast('已使用急救包 · 恢复生命');
        if (event === 'descend') this.beginFloorLoad();
        if (event === 'apartment-outside') this.speakApartment('凛：马上就要到家里了！');
        if (event === 'apartment-tank') this.speakApartment('维川：凛！快进来！', '凛：这，好像是川叔的声音！');
        if (event === 'apartment-entry-open' || event === 'apartment-entry') this.play('door-sound');
        if (event === 'apartment-entry') this.toast('获得麻痹陷阱 ×1');
        if (event === 'apartment-entry') this.speakApartment(
          '维川：凛，你怎么跑回来了，学校应该更安全！',
          '凛：川叔，学校也已经沦陷了！你看到我爸妈了吗？',
          '维川：没有，我刚回来的时候就已经这样了',
          '凛：那现在怎么办？',
          '维川：现在电梯没电了，楼道口被堵住了，我们得先去负一楼把电梯的备用电源发动才能回去！',
        );
        if (event === 'apartment-trap-lesson') this.speakApartment('维川：去右侧电梯厅门口，在黄色圆环内用陷阱按钮放一枚麻痹陷阱。');
        if (event === 'apartment-training') this.speakApartment('维川：这东西只能用一次。去负一层合上发电机，我在一楼维修间接总控。');
        if (event === 'apartment-generator') this.speakApartment('维川：我收到供电信号了。启动声把它们引过来了，沿原路回楼梯！');
        if (event === 'apartment-generator-cancel') this.toast('供电操作中断，请重新启动');
        if (event === 'apartment-shutter') this.speakApartment('维川：卷帘门会把它们赶向电击区。我来启动电梯，你撑住这阵。');
        if (event === 'apartment-lift') this.speakApartment('维川：电梯好了！到电梯里会合，直接上九层。');
        if (event === 'apartment-note') this.speakApartment('凛：便条上说，他们和邻居去了附近的避难点……', '维川：我回 902 取把枪。我们在电梯厅会合。');
        if (event === 'apartment-escape-talk') {
          this.apartmentDialogue?.node.destroy();
          this.apartmentDialogue = undefined;
          this.speakApartment('维川：我们可以去地下室开车前往避难所。', '凛：没问题。',
            '维川：但是我要将车子的电源接上，车辆的警报声可能会吸引大量丧尸，我这里有一些东西可能可以派上用场。');
        }
        if (event === 'apartment-escape-supplies') this.toast('获得手雷 ×3、麻痹陷阱 ×3', 4);
        if (event === 'apartment-car-alarm') { this.play('alarm'); this.toast('车警已响 · 坚守 20 秒，掩护维川接电'); }
        if (event === 'apartment-car-ready') this.speakApartment('维川：车子发动了！快上车！');
        if (event === 'apartment-car-drive') { this.noticeTime = 0; this.resetInput(); }
        if (event === 'engineer-car-wait') this.toast('等维川到达撤离车旁');
        if (event === 'engineer-down') this.toast('维川倒地 · 靠近后扶起');
        if (event === 'engineer-wait') this.toast('等维川到达电梯再出发');
      }
      if (this.battle.enemies.some(e => (e.forceOpen || 0) > 0)) this.toast('⚠ 敌人正在强行撞门 · 立即远离门扇');
      this.battle.events = [];
      if (this.battle.status === 'playing' && this.battle.operationRun?.ready) {
        const part = this.battle.stage.operation?.part;
        if (part === 'city') {
          if (this.battle.advanceOperation(operationLevel('compound'))) this.enterBattleScene(4);
        } else if (part === 'compound' || part === 'defense') this.beginOperationCinematic(part === 'compound' ? 'mutate' : 'strike');
        return;
      }
      if (this.battle.status === 'lost' && p.hp <= 0) {
        this.fallTime = 0;
        this.fallVariant = Math.random() < 0.5 ? 0 : 1;
        this.open('falling');
      } else if (this.battle.status === 'won') { this.resetInput(); this.transition = { kind: 'win', time: 0 }; this.applyTransitionVisuals(1, 0); }
      else if (this.battle.status !== 'playing' && this.battle.deathFragments.length === 0) this.finishBattle();
      }
    }
    if (this.mode === 'falling') {
      // Simulation stopped on the lethal hit. Only particles and the presentation advance.
      if (!active) this.battle.update(dt, { x: 0, y: 0, angle: p.angle, fire: false });
      this.fallTime += dt;
      if (this.fallTime >= FALL_DURATION + GRAY_DURATION + GRAY_HOLD) {
        if (this.battle.revivalCharges > 0) this.open('revive');
        else this.finishBattle();
      }
    }
    if (!active) this.motion.step(dt, p, false);
    for (const e of this.battle.enemies) this.enemyMotions.get(e.id)?.step(dt, e, active && !this.transition);
    for (const ally of this.battle.allies) this.enemyMotions.get(ally.id)?.step(dt, ally, active && !this.transition);
    this.feedback.step(dt, p.hp / p.maxHp, active && !this.transition);
    const offsetX = this.feedback.x, offsetY = this.feedback.y;
    const driving = this.battle.evacuationDrive;
    if (driving && this.getawaySprite) {
      this.getawaySprite.node.setPosition(driving.x, driving.y);
      this.getawaySprite.node.angle = driving.angle * 180 / Math.PI;
    }
    this.world.setPosition(-p.x + offsetX, -p.y + offsetY);
    this.environment.setPosition(-p.x + offsetX, -p.y + offsetY);
    // Exact actor clipping is refreshed each frame; only the soft texture is cached.
    const visionRange = this.battle.stats.visionRange;
    const lamp = this.battle.stage.faultyDoorLamp;
    const allies = this.battle.allies.filter(ally => ally.hp > 0 && Math.abs(ally.x - p.x) <= W / 2 + ALLY_VISION_RANGE && Math.abs(ally.y - p.y) <= H / 2 + ALLY_VISION_RANGE);
    const allySight = allies.map(ally => [ally.id, Math.round(ally.x / 3), Math.round(ally.y / 3), Math.round(ally.angle * 40)].join(',')).join('|');
    const grenadeLights = this.battle.grenadeLights;
    this.sightTick -= dt;
    if (grenadeLights.length || this.hadGrenadeLight || this.sightTick <= 0 || allySight !== this.lastAllySight || this.lastGeometry !== this.battle.geometryRevision || Math.hypot(p.x - this.lastSightX, p.y - this.lastSightY) > 0.01 || Math.abs(angleDiff(p.angle, this.lastSightAngle)) > 0.001) {
      this.sightTick = 1;
      const blocks = this.battle.visionBlockers;
      const pts = visibilityPolygon(p, p.angle, blocks, visionRange);
      this.stencil.clear();
      polygon(this.stencil, pts, '#ffffff');
      const toScreen = (q: { x: number; y: number }) => ({ x: q.x - p.x + W / 2, y: q.y - p.y + H / 2 });
      this.visibilityField.build(pts.map(toScreen), FEATHER_PIXELS, visibilityPolygon(p, p.angle, [], visionRange).map(toScreen), { origin: toScreen(p), peripheralRadius: this.battle.stats.peripheralRange });
      this.visibilityField.addSurfaces(visibleSurfaces(p, p.angle, blocks, visionRange).map(surface => ({ ...surface, polygon: surface.polygon.map(toScreen) })));
      for (const ally of allies) {
        const range = ALLY_VISION_RANGE;
        const sight = visibilityPolygon(ally, ally.angle, blocks, range);
        polygon(this.stencil, sight, '#ffffff');
        const field = this.allyVisibilityField ??= new VisibilityField();
        field.build(sight.map(toScreen), FEATHER_PIXELS, visibilityPolygon(ally, ally.angle, [], range).map(toScreen),
          { origin: toScreen(ally), peripheralRadius: peripheralRange(range) });
        field.addSurfaces(visibleSurfaces(ally, ally.angle, blocks, range).map(surface => ({ ...surface, polygon: surface.polygon.map(toScreen) })));
        this.visibilityField.mergeLight(field);
      }
      for (const flash of grenadeLights) {
        const sight = grenadeLightPolygon(flash, blocks);
        polygon(this.stencil, sight, '#ffffff');
        const field = this.allyVisibilityField ??= new VisibilityField();
        field.build(sight.map(toScreen), 42);
        const strength = clamp((GRENADE_LIGHT_TIME - (flash.max - flash.life)) / 0.27, 0, 1);
        this.visibilityField.mergeLight(field, strength * strength);
      }
      this.hadGrenadeLight = grenadeLights.length > 0;
      if (lamp) this.visibilityField.addDoorLamp(lamp, p, this.battle.blockers);
      this.visibilityTexture.uploadData(this.visibilityField.pixels);
      this.lastSightX = p.x; this.lastSightY = p.y; this.lastSightAngle = p.angle; this.lastGeometry = this.battle.geometryRevision;
      this.lastAllySight = allySight;
    }
    const mount = this.playerWeaponMount();
    const flashAllowed = p.hp > 0 && p.dashTime <= 0 && lineClear(p, mount.muzzle, this.battle.blockers);
    if (this.presentationMaterial) {
      this.presentationMaterial.setProperty('viewInfo', new Vec4(W, H, offsetX, offsetY));
      // The field is rebuilt in the current player-relative space; translating it again
      // would make the whole unobstructed cone swim against the actors/camera.
      this.presentationMaterial.setProperty('maskMotion', new Vec4(0, 0, 0, 0));
      const quiet = this.battle.hero.quiet;
      this.presentationMaterial.setProperty('muzzle', new Vec4(W / 2 + mount.muzzle.x - p.x, H / 2 + mount.muzzle.y - p.y, flashAllowed ? this.feedback.muzzle * (quiet ? 0.22 : 1) : 0, quiet ? 90 : this.battle.hero.weapon === 'shotgun' ? 160 : 140));
      this.presentationMaterial.setProperty('doorLamp', lamp ?
        new Vec4(W / 2 + lamp.x - p.x, H / 2 + lamp.y - p.y, doorLampFlicker(lamp, this.battle.elapsed), DOOR_LAMP_RADIUS) :
        new Vec4(0, 0, 0, DOOR_LAMP_RADIUS));
      this.presentationMaterial.setProperty('feedback', new Vec4(this.feedback.hit, this.feedback.lowHealth, this.feedback.healthSeverity, 0));
      const gray = clamp((this.fallTime - FALL_DURATION) / GRAY_DURATION, 0, 1);
      this.presentationMaterial.setProperty('grading', new Vec4(DARK_BRIGHTNESS, DARK_SATURATION, gray * gray * (3 - 2 * gray), 0));
    }
    const rasterDoors = this.doorArtBattle === this.battle && this.doorArtStage === this.battle.stage;
    if (rasterDoors) this.apartmentDoors.forEach((sprite, index) => {
      const door = this.battle.doors[index];
      const half = door.length / 2;
      sprite.node.active = !door.destroyed;
      sprite.node.setPosition(door.x + Math.cos(door.angle) * half, door.y + Math.sin(door.angle) * half);
      sprite.node.angle = door.angle * 180 / Math.PI;
      sprite.color = color(door.hit > 0 ? '#ffe3ad' : '#ffffff');
    });
    drawDoors(this.doorsLit, this.battle.doors, this.battle.alarmTime, rasterDoors && this.apartmentDoors.length > 0);
    if (this.lastBloodBattle !== this.battle || this.lastBloodRevision !== this.battle.bloodRevision) {
      drawBloodStains(this.bloodArt, this.battle.bloodStains, this.battle); this.lastBloodBattle = this.battle; this.lastBloodRevision = this.battle.bloodRevision;
    }
    const animal = active && !this.transition && !this.tutorialPrompt && !this.battle.tutorial ? this.wildlife.step(dt, this.battle) : undefined;
    this.wildlifeArt.node.active = !!animal;
    if (animal) drawAmbientAnimal(this.wildlifeArt, animal);
    drawActors(this.actors, this.battle, this.motion.pose, this.hasPlayerArt(), this.artFrames.has('walker'), this.artFrames.has(this.rollKey()), this.enemyPoses, this.artFrames.has('operator') || this.streetFrames.has('engineer'), !!this.battle.apartment && this.streetFrames.has('brute'), !!this.grenadeFrame, this.grenadeBlastFrames.length > 0);
    this.updateGrenadeArt();
    this.updateMineArt();
    if (this.battle.tutorial) {
      const t = this.battle.tutorial;
      if (t.step === 'move') {
        this.actors.strokeColor = color(C.gold); this.actors.lineWidth = 3;
        this.actors.circle(t.moveGoal.x, t.moveGoal.y, 17); this.actors.stroke();
      }
      drawTutorialTarget(this.actors, this.battle, Math.floor(this.presentationTime * 25) / 25);
    }
    this.updateActorSprites();
    this.updateSupplySprites();
    this.exitArrow.clear();
    const training = this.battle.stage.apartment?.training;
    if (active && training && this.battle.apartment?.phase === 'training') {
      const { center, radius } = training;
      const x = center.x - p.x + offsetX, y = center.y - p.y + offsetY;
      const progress = this.battle.elapsed % 1.25 / 1.25;
      const ring = this.exitArrow;
      ring.strokeColor = color('#eac046', 159); ring.lineWidth = 1.7;
      ring.circle(x, y, radius); ring.stroke();
      ring.strokeColor = color('#ffdc6a', Math.round(252 - 144 * progress)); ring.lineWidth = 3.4 - 1.5 * progress;
      ring.circle(x, y, radius * (0.22 + 0.78 * progress)); ring.stroke();
    }
    const parking = this.battle.stage.apartment?.getaway;
    if (active && this.battle.apartment?.phase === 'car-prep' && parking) {
      const car = parking.route[0], x = car.x - p.x + offsetX, y = car.y - p.y + offsetY;
      const ring = this.exitArrow;
      ring.strokeColor = color('#f5cf76', 130); ring.lineWidth = 1.75;
      ring.circle(x, y, parking.trapRadius); ring.stroke();
    }
    const direction = active && !this.transition && !this.tutorialPrompt ? exitGuideAngle(this.battle) : undefined;
    if (direction !== undefined) {
      const c = Math.cos(direction), s = Math.sin(direction);
      const x = c * 78 + offsetX, y = s * 78 + offsetY;
      const point = (forward: number, side: number) => ({ x: x + c * forward - s * side, y: y + s * forward + c * side });
      polygon(this.exitArrow, [point(18, 0), point(-8, 13), point(-4, 5), point(-16, 5), point(-16, -5), point(-4, -5), point(-8, -13)], '#171713', 220);
      polygon(this.exitArrow, [point(14, 0), point(-7, 9), point(-3, 3), point(-13, 3), point(-13, -3), point(-3, -3), point(-7, -9)], '#f5d586');
    }
    const work = this.battle.generatorProgress;
    const workLabel = this.labels.get('generator-work');
    if (active && work !== undefined) {
      const x = W / 2 + offsetX, y = H / 2 + offsetY + 60;
      this.sbox(this.exitArrow, x - 47, y, 94, 7, '#182024', 245);
      this.sbox(this.exitArrow, x - 46, y + 1, 92 * work, 5, C.gold);
      this.text('generator-work', '操作中', x, y + 21, 17, C.text, this.canvas, 102, Label.HorizontalAlign.CENTER).isBold = true;
    } else if (workLabel) workLabel.string = '';
    drawWeaponEffects(this.weaponArt, this.weaponEffects, mount, flashAllowed);
    if (flashAllowed && !this.battle.tutorial && this.battle.hero.laser > 0) {
      const distance = rayDistance(mount.muzzle, mount.angle, this.battle.hero.laser, this.battle.blockers);
      line(this.weaponArt, mount.muzzle.x, mount.muzzle.y,
        mount.muzzle.x + Math.cos(mount.angle) * distance, mount.muzzle.y + Math.sin(mount.angle) * distance, '#ff614c', 1.2, 175);
    }
    drawHitBlood(this.weaponArt, this.battle.particles);
    drawParalysis(this.weaponArt, this.battle);
    if (this.mode === 'playing') {
      this.updateObjectiveHud(active ? dt : 0);
      this.updateHudFeedback(dt);
      this.uiTick -= dt;
      if (this.uiTick <= 0) { this.uiTick = 1 / 20; this.updateHud(); }
    }
    this.updateGuide(dt);
    if (this.mode === 'loading') this.updateFloorLoad(dt);
    if (this.transition) {
      const t = this.transition;
      this.applyTransitionVisuals(t.kind === 'enter' ? clamp((t.time - 1) / 0.5, 0, 1) : 1 - clamp(t.time / 0.5, 0, 1), t.kind === 'enter' ? 1 - clamp(t.time, 0, 1) : clamp((t.time - 0.7), 0, 1));
    }
  }
  onDestroy() {
    this.canvas?.destroy();
    this.environmentCamera?.node.destroy(); this.actorCamera?.node.destroy();
    this.presentationMaterial?.destroy(); this.outputFrame?.destroy(); this.visibilityTexture?.destroy(); this.environmentTarget?.destroy(); this.actorTarget?.destroy();
    for (const frame of this.rollFrames) frame.destroy();
    for (const frame of this.uiCrops) frame.destroy();
    input.off(Input.EventType.KEY_DOWN, this.keyDown, this);
    input.off(Input.EventType.KEY_UP, this.keyUp, this);
    input.off(Input.EventType.MOUSE_MOVE, this.mouseMove, this);
    input.off(Input.EventType.MOUSE_DOWN, this.mouseDown, this);
    input.off(Input.EventType.MOUSE_UP, this.mouseUp, this);
    input.off(Input.EventType.TOUCH_START, this.touchStart, this);
    input.off(Input.EventType.TOUCH_MOVE, this.touchMove, this);
    input.off(Input.EventType.TOUCH_END, this.touchEnd, this);
    input.off(Input.EventType.TOUCH_CANCEL, this.touchEnd, this);
    game.off(Game.EVENT_HIDE, this.hide, this);
  }
}
