import { _decorator, AudioClip, AudioSource, Button, Camera, Canvas, Color, Component, EditBox, EffectAsset, EventKeyboard, EventMouse, EventTouch, game, Game, Graphics, input, Input, KeyCode, Label, Layers, Mask, Material, Node, Rect as TextureRect, RenderTexture, ResolutionPolicy, resources, Size, Sprite, SpriteFrame, sys, Texture2D, UITransform, UIOpacity, Vec2, Vec3, Vec4, view } from 'cc';
import { ALLY_VISION_RANGE, angleDiff, APARTMENT_LINE_SECONDS, Battle, clamp, closestOnRect, DORM_LEVEL, grenadeLightPolygon, GRENADE_LIGHT_TIME, heroRating, heroStats, lineClear, MINIMAP_CELL_SIZE, peripheralRange, Profile, type ProfileIdentity, PROFILE_NAME_LIMIT, profileGrowth, profileName, rayDistance, readProfile, recruit, rectCorners, roomAt, SUPPLY_INFO, SupplyKind, TRAINING_CAP, TrainingKind, trainingCost, upgrade, visibilityPolygon, type Door, type Point, type Rect } from './Core';
import { ENGINEER_ID, GHOST_ID, HERO_IDS, HEROINE_ID, heroes, type HeroId } from './Heroes';
import { box, color, disc, drawActors, drawAmbientAnimal, drawBloodStains, drawDoors, drawHitBlood, drawMap, drawParalysis, drawRecovery, drawTutorialTarget, drawWeaponEffects, line, outline, palette as C, paralyzedModelPosition, polygon } from './Art';
import { TRAINING_ART, TRAINING_PROFILES, type TrainingImage } from './TrainingArt';
import { buyProduct, canStock, GEAR, GEAR_IDS, installMod, MAX_STOCK, ownedProduct, productPrice, PRODUCTS, PRODUCT_BY_ID, salvageMod, SHOP_TACTICALS, toggleGear, upgradeMod, upgradeWeapon, workshopMods, type ConsumableId, type GearId, type Product, type ProductId, type ShopCategory } from './Shop';
import { configuredHero, fitsWeapon, installedMods, MODS, MOD_STORAGE_CAP, modDescription, modRange, modText, modUpgradeCost, QUALITY_COLORS, QUALITY_NAMES, salvageValue, SLOT_NAMES, WEAPON_SLOTS, WEAPON_TYPES, weaponUpgradeCost, type Attachment, type ModId, type Quality } from './WeaponMods';
import { SHOP_ART, type ShopImage } from './ShopArt';
import { CASE_ART, type CaseImage } from './CaseArt';
import { BACKPACK_ART, type BackpackImage } from './BackpackArt';
import { BACKPACK_FILTERS, backpackDetails, backpackItems, type BackpackFilter, type BackpackItem } from './Backpack';
import { CASE_IDS, CASE_POOLS, CASE_ROLL_TIME, CASES, CLEAR_CASE_KEYS, DAILY_CASE_KEYS, casePrize, caseRollProgress, prepareCaseOpening, type CaseId, type CaseOpening, type CasePrize } from './LootCases';
import { ActorMotion, ActorPose, CombatFeedback, DARK_BRIGHTNESS, DARK_SATURATION, DOOR_LAMP_RADIUS, doorLampFlicker, FEATHER_PIXELS, PlayerHealthDisplay, VisibilityField, visibleSurfaces, WeaponEffects, weaponMount } from './Presentation';
import { claimDailyMilestone, claimDailyMission, dailyActivity, DAILY_MILESTONES, DAILY_MISSIONS, refreshDailyMissions } from './DailyMissions';
import { CHECK_IN_CHESTS, CHECK_IN_DAYS, CHECK_IN_REWARD_NAMES, checkInRewardText, checkInStatus, claimCheckInChest, claimCheckInDay, refreshCheckIn } from './CheckIn';
import { grenadeThrowPose, isShopMine, newTacticalLoadout, TACTICAL_DEFINITIONS, type TacticalKind } from './Tactical';
import { createApartmentRun, createDormRun, createStreet, type LevelDefinition } from './Levels';
import { AimAssist } from './AimAssist';
import { TUTORIAL_SEED } from './Tutorial';
import { FLOOR_DETAIL_ART, FLOOR_DETAIL_ATLAS, scatterFloorDetails, type FloorDetailKind } from './FloorDetails';
import { AmbientWildlife } from './AmbientWildlife';
import { CLUE_SPECS, closeReader, openReader, turnReader, type ReaderState } from './ClueReader';
import { TutorialGuide, guideLayout } from './TutorialGuide';
import { exitGuideAngle } from './ExitGuide';
import { drawTutorialGuide } from './TutorialGuideArt';
import { CAMPAIGN_ART, CAMPAIGN_LOCATIONS, satelliteFraming, type CampaignImage } from './CampaignArt';
import { operationLevel, OPERATION_AIRCRAFT, OPERATION_AIR_COOLDOWN, OPERATION_AIR_DURATION, OPERATION_AIR_PODS, OPERATION_BOSS_NAME, OPERATION_EXTRACT, OPERATION_EXTRACT_RADIUS, OPERATION_GRENADE_RANGE, OPERATION_LEADER, OPERATION_LZ, OPERATION_PICKUP_READY, operationBoardingEnd } from './Operation';
import { OPERATION_APPROACH_SECONDS, OPERATION_ART, OPERATION_COAST_LZ, OPERATION_FLYOVERS, OPERATION_FORMATION_SECONDS, OPERATION_GHOST_SIZE, OPERATION_HANDOFF_SECONDS, OPERATION_IMPACT_SECONDS, OPERATION_JETS, OPERATION_LITTLEBIRD_ART, OPERATION_RETURN_JETS, OPERATION_SHORE_STRIPS, OPERATION_SOLDIER_SIZE, OPERATION_STRIKE_END_SECONDS, OPERATION_STRIKE_FADE_SECONDS, OPERATION_STRIKE_FRAMES, OPERATION_STRIKE_GROUPS, OPERATION_UNIT_ART, operationBoarderAt, operationDescentAt, operationExtractionAt, operationFormationAt, operationJetFrame, operationStrikeFrame, operationTakeoffAt } from './OperationArt';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_REWARDS, achievementScore, achievementState, claimAchievement, claimAchievementLevel, recordAchievementKills, type AchievementCategory } from './Achievements';
import { createSurvivalLevel, survivalPayout, SURVIVAL_MAP_IDS, type SurvivalCheckpoint, type SurvivalMapId } from './Survival';
import { CONVOY_ARRIVAL, CONVOY_BOARD, CONVOY_LEAVE, CONVOY_NOTICE, convoyVehicles, EVAC_BOAT_WIDTH, EVAC_ROUTE_NAME, EVAC_VEHICLES, SURVIVAL_DEADLINE, type EvacVehicle } from './SurvivalTimed';
import { BLOOD_MOON } from './SurvivalTimed';
import { TIMED_SURVIVAL_ATLAS } from './SurvivalTimedArt';
import { SENTRY_HP, SURVIVAL_DESCRIPTIONS, SURVIVAL_DOORS, SURVIVAL_DOOR_KINDS, SURVIVAL_GEAR, SURVIVAL_GUNS, SURVIVAL_RECIPES, SURVIVAL_RECIPE_IDS, canUseSurvivalGear, isSurvivalGun, type GearKind, type SurvivalCrate, type SurvivalDoorKind, type SurvivalRecipe } from './SurvivalGear';
import { isSurvivalMine, isSurvivalThrowable, SURVIVAL_FIRE, SURVIVAL_THROWABLES, type SurvivalBindings } from './SurvivalGear';
import { SURVIVAL_PARTS } from './SurvivalGear';
import { HARBOR_ART_HEIGHT, HARBOR_ART_WIDTH, HARBOR_CHUNKS, HARBOR_MAP_REGIONS, HARBOR_OVERVIEW_MARGIN, HARBOR_REGIONAL_ROOFS, HARBOR_ROOFS, HARBOR_SCALE, harborBuildingRoof, harborDistanceToChunk, harborPoint, SURVIVAL_LAYOUT, type HarborChunk } from './SurvivalHarbor';
import type { SurvivalBuilding, SurvivalStair } from './SurvivalInteriors';

const { ccclass, property } = _decorator;
const W = 1280, H = 720, SAVE_KEY = 'blackout.prototype.v1';
const trainingX = (x: number) => x * W / 1672;
const trainingY = (top: number) => H - top * H / 941;
const CONTROL_GUIDE = [
      ['移动', '手机：左侧摇杆', '电脑：W A S D / 方向键'],
      ['瞄准与射击', '手动：推右杆射击；自动：右杆只转向', '电脑：鼠标瞄准，手动按住左键'],
      ['辅助 / 自动', '设置切换；自动只在当前射线命中时开火', '桌面无磁吸，可开启自动试玩'],
      ['翻滚', '手机：点击「翻滚」', '电脑：空格，沿移动方向翻滚'],
      ['交互与拾取', '手机：靠近后点击对应的交互或拾取按钮', '电脑：E 交互 / F 拾取 / T 布置陷阱'],
      ['换弹', '手机：点击弹匣区域', '电脑：R 换弹，空弹匣自动换弹'],
      ['视野', '朝瞄准方向看得更远', '墙体和高家具遮挡视线与子弹'],
      ['目标', '在两层宿舍各找到一把钥匙并撤离', '每清理一个有敌人的区域，恢复 20 生命'],
  ] as const;
const TRAINING_AXES = [
  { name: '生存', x: 1402, y: 396, lx: 1402, ly: 382 },
  { name: '输出', x: 1501, y: 465, lx: 1531, ly: 449 },
  { name: '隐蔽', x: 1462, y: 580, lx: 1518, ly: 595 },
  { name: '视野', x: 1340, y: 580, lx: 1289, ly: 595 },
  { name: '机动', x: 1304, y: 465, lx: 1269, ly: 449 },
] as const;
const ENVIRONMENT_LAYER = 1 << 10, ACTOR_LAYER = 1 << 11;
const OPERATION_ROOF_TILES = new Set(['op-roof-a', 'op-roof-b', 'op-roof-c']);
const UNLOCK_ALL_CHAPTERS_FOR_TEST: boolean = true;
type Mode = 'menu' | 'profile-info' | 'chapters' | 'select-hero' | 'achievements' | 'missions' | 'checkin' | 'playing' | 'loading' | 'street-loading' | 'falling' | 'revive' | 'backpack' | 'roster' | 'training' | 'shop' | 'cases' | 'recruit' | 'settings' | 'help' | 'pause' | 'result' | 'operation-cinematic' | 'survival-entry' | 'survival-resume' | 'survival-hero' | 'survival-radio' | 'survival-map';
const OPERATION_SPEAKERS = {
  ghost: { name: '幽灵', left: true, frame: '' },
  two: { name: '幽灵二号', left: true, frame: 'op-portrait-two', slot: 0 },
  three: { name: '幽灵三号', left: true, frame: 'op-portrait-three', slot: 1 },
  four: { name: '幽灵四号', left: true, frame: 'op-portrait-four', slot: 2 },
  rimelet: { name: OPERATION_BOSS_NAME, left: false, frame: 'op-portrait-rimelet' },
  lead: { name: '黑鹰领队', left: false, frame: 'op-blackhawk' },
  littlebird: { name: '小鸟二号', left: false, frame: 'op-portrait-pilot' },
  command: { name: '指挥室联络员', left: false, frame: 'op-portrait-liaison' },
  headquarters: { name: '军方总部', left: false, frame: 'survival-headquarters' },
  pickup: { name: '接应黑鹰', left: false, frame: 'op-blackhawk' },
} as const;
type OperationLine = readonly [speaker: keyof typeof OPERATION_SPEAKERS, text: string];
const OPERATION_DIALOGUE_LAYOUT = { y: 80, readDelay: 0.24, charTime: 0.029, hold: 1.18, slideOut: 0.25 };
const STORY_PANEL_WIDTH = 518, STORY_PANEL_Y = 80;
type StoryDialogueNodes = { node: Node; label: Label; portrait: Node; speaker: Label; trim: Graphics;
  side?: boolean; tint?: string };
const isChapterMenu = (mode: Mode) => mode === 'chapters' || mode === 'select-hero';
const isSurvivalMenu = (mode: Mode) => mode === 'survival-entry' || mode === 'survival-resume' || mode === 'survival-hero';
const FOCUS_SECONDS = .58, REVEAL_SECONDS = .56, DEPARTURE_FADE_SECONDS = .42, BRIEF_CHAR_SECONDS = .035, BRIEF_OPEN_SECONDS = .16;
const BAG_COLUMNS = 5, BAG_ROWS = 5, BAG_ROW_HEIGHT = 88, BAG_SWIPE_THRESHOLD = 36;
const BAG_GRID = { left: 303, right: 834, bottom: 110, top: 571 };
const WORKSHOP_PAGE_SIZE = 4;
const CASE_PITCH = 151, CASE_RADIUS = 5, CASE_IDLE_SPEED = .5, CASE_HOLD = .55;
type CaseRoll = { opening: CaseOpening; elapsed: number; start: number; stop: number; entryRate: number };
type CaseReelCard = { node: Node; title: Label; caption: Label; plate?: Sprite; icon?: Node; index?: number };
type CaseReel = { id: CaseId; track: Node; cards: CaseReelCard[]; position: number; speed: number;
  winner?: { index: number; prize: CasePrize }; closed?: Node; opened?: Node; openButtonArt?: Node; result?: Node };
const SHOP_CATEGORIES = [{ id: 'mod', label: '改装' }, { id: 'gear', label: '装备' }, { id: 'item', label: '道具' }] as const;
const FIXED_WEAPON_ART = { [HEROINE_ID]: 'fixed-usp', [GHOST_ID]: 'fixed-ar', [ENGINEER_ID]: 'fixed-shotgun' } as const;
type HitBox = { x: number; y: number; w: number; h: number; node: Node };
type DialogAction = { id: string; label: string; run: () => void; enabled?: boolean };
const DIALOG_SCALE = 0.5;
const DIALOG_WIDTH = 1671 * DIALOG_SCALE, DIALOG_HEIGHT = 941 * DIALOG_SCALE;
const DIALOG_BUTTONS = [[330, 734, 480, 116], [878, 734, 480, 116]] as const;
const usesDialog = (mode: Mode) => mode === 'pause' || mode === 'settings' || mode === 'result' || mode === 'revive' || mode === 'survival-resume' || mode === 'survival-radio';
const CHAPTERS = {
  1: { name: '静默宿舍', location: '学校宿舍楼', cast: [HEROINE_ID], locked: '', lines: ['在二楼找到钥匙，再从楼梯下去。', '避开尸群，从宿舍大门撤离。'] },
  2: { name: '归途', location: '学校东侧街区', cast: [HEROINE_ID], locked: '通关「静默宿舍」后解锁。', lines: ['穿过学校东侧街区，找到回家的路。', '经过公交站往北走，再折向住宅街。'] },
  3: { name: '归巢', location: '凛居住的公寓', cast: [HEROINE_ID], locked: '通关「归途」后解锁。', lines: ['公寓停电了，到一层找维川。', '恢复供电后，乘电梯上九层找家人。'] },
  4: { name: '断翼行动', location: '前传 · 沿岸作战区', cast: [GHOST_ID], locked: '通关「归巢」后解锁。', lines: ['幽灵一组，准备从海岸登陆。', '前往「阀」的指挥部，活捉首领。'] },
} as const;
type Chapter = keyof typeof CHAPTERS;
const SURVIVAL_MAPS: Record<SurvivalMapId, { name: string; createLevel: typeof createSurvivalLevel }> = {
  harbor: { name: '港区工事', createLevel: createSurvivalLevel },
};
type DeparturePage = { heading?: string; point: { x: number; y: number }; lines: readonly [string, string] };
type DepartureBrief = DeparturePage & {
  title: string; area: string; pages?: readonly DeparturePage[]; survey?: boolean;
  map: () => SpriteFrame | undefined; avatar: () => SpriteFrame | undefined; inset?: () => SpriteFrame | undefined;
  repeated: boolean; returnTo: Mode; focusZoom?: number;
};
type Departure = {
  brief: DepartureBrief; time: number; typed: number; waiting: number; progress: () => number; retry: () => void;
  launch: () => boolean; briefRoot: Node; overlay: Graphics; fade: Graphics; terrain?: Sprite; info?: Sprite;
  failed?: string; fadeTime?: number; page: number; pageTime: number;
};
const FALL_DURATION = 0.54, GRAY_DURATION = 0.28, GRAY_HOLD = 0.09;
// The generated rows have different gaps. Each frame is anchored at the hips.
const FALL_SHEETS = {
  lin: { file: 'lin-downed-v4', cuts: [[0, 477, 944, 1536], [0, 430, 962, 1536]], pivots: [[300, 266], [770, 267], [1255, 264], [264, 240], [725, 242], [1246, 244]] },
  operator: { file: 'operator-downed-v1', cuts: [[0, 480, 990, 1536], [0, 465, 997, 1536]], pivots: [[305, 273], [819, 276], [1309, 273], [306, 265], [818, 265], [1293, 265]] },
} as const;
type FallFrame = { frame: SpriteFrame; width: number; anchorX: number; anchorY: number };
const HOME_ART = [
  'defaultBG', 'profile_panel', 'game_logo', 'resource_cash', 'resource_gems',
  'button_shop', 'button_character', 'mode_survival', 'mode_explore',
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
};
// Each mode keeps its original proportions. These are the angles of its painted top edge.
const MODE_CARDS = [
  { id: 'start', art: 'mode_explore', title: '探索模式', width: 600, height: 207, top: 153, edgeAngle: 0.1 },
  { id: 'survival', art: 'mode_survival', title: '生存模式', width: 602, height: 229, top: 310, edgeAngle: 1.9 },
] as const;
const MODE_EDGE_ANGLE = 5;
// mession.png supplies the small symbols. The panel, chest and buttons are separate art from main/.
const MISSION_ICONS = {
  clipboard: [0, 0, 98, 98], compass: [103, 0, 91, 86], skull: [199, 0, 91, 86], ammo: [295, 0, 91, 86],
} as const;
const MISSION_TEXTURES = { panel: 'mission-panel', chest: 'mission-chest', claim: 'mission-claim', go: 'mission-go' } as const;
type MissionImage = keyof typeof MISSION_ICONS | keyof typeof MISSION_TEXTURES;
const showsBattle = (mode: Mode, battleSettings = false) => mode === 'playing' || mode === 'loading' || mode === 'falling' || mode === 'revive' || mode === 'pause' || mode === 'result' || mode === 'survival-radio' || mode === 'survival-map' || battleSettings && (mode === 'settings' || mode === 'help');
const SURVIVAL_PROPS = [
  ['survival-sandbags', 19, 219, 484, 167], ['survival-radio', 608, 18, 333, 474],
  ['survival-case', 1115, 162, 332, 260], ['survival-counter', 20, 653, 474, 276],
  ['survival-crates', 603, 597, 333, 360], ['survival-pack', 1076, 647, 406, 277],
] as const;
const SURVIVAL_BUILDING_ART = {
  'interior-furniture': [
    ['survival-couch', 22, 116, 359, 216], ['survival-bed', 450, 50, 259, 338],
    ['survival-kitchen', 768, 107, 365, 213], ['survival-exam', 23, 461, 354, 242],
    ['survival-pharmacy', 412, 459, 326, 209], ['survival-rack', 779, 456, 349, 221],
  ],
  'harbor-floors': [
    ['harbor-floor-house', 1, 1, 510, 510], ['harbor-floor-shop', 513, 1, 510, 510],
    ['harbor-floor-clinic', 1, 513, 510, 510], ['harbor-floor-warehouse', 513, 513, 510, 510],
  ],
  'harbor-furniture': [
    ['survival-shelf', 33, 127, 322, 177], ['survival-checkout', 411, 132, 329, 175],
    ['survival-dining', 819, 92, 282, 248], ['survival-workbench', 33, 472, 320, 222],
    ['survival-forklift', 392, 453, 361, 239], ['survival-radio-harbor', 781, 438, 353, 265],
  ],
} as const;
type SurvivalRoofArt = { bounds: Rect; rooms: Rect[]; opacity: UIOpacity };
type SurvivalFloorArt = { bounds: Rect; opacity: UIOpacity; doors: Graphics; doorIds: number[]; blood: Graphics };
const SURVIVAL_BAG = { x: 205, y: 65, w: 961, h: 588, cell: 50, gridX: 248, gridTop: 563, displaySize: 9 };
const SURVIVAL_BAG_CLOSE = { x: 1093, y: 598, w: 37, h: 37 };
const SURVIVAL_BAG_ACTIONS = [
  { id: 'use', label: '使用', x: 734, y: 213, w: 185, h: 46 },
  { id: 'rotate', label: '旋转', x: 934, y: 213, w: 185, h: 46 },
  { id: 'split', label: '拆分', x: 734, y: 157, w: 185, h: 46 },
  { id: 'drop', label: '丢弃', x: 934, y: 157, w: 185, h: 46 },
] as const;
const SURVIVAL_RESUME_PANEL = { x: 218, y: 127, w: 844, h: 466 };
const SURVIVAL_RESULT_PANEL = { x: 47, y: 37, w: 1186, h: 646 };
const SURVIVAL_VEHICLE_PANEL = { x: 320, y: 122, w: 700, h: 488 };
const SURVIVAL_UI_CONTROLS = [
  ['primary', 224, 66], ['secondary', 224, 66], ['close', 112, 112],
  ['tile', 128, 128], ['tile-locked', 128, 128], ['tile-selected', 128, 128],
  ['extracted', 224, 128], ['fallen', 128, 128], ['complete', 224, 128],
  ['harbor-mark', 140, 112], ['coin', 112, 112], ['material', 112, 112],
] as const;
const SURVIVAL_QUICK = { x: 959, y: 365, w: 62, h: 48 };
const SURVIVAL_BAG_BUTTON = { x: 1170, y: 365, w: 75, h: 48 };
const SURVIVAL_CRATE_PANEL = { x: 942, y: 220, w: 226, h: 295 };
const SURVIVAL_WORKSHOP = { x: 613, y: 172, w: 552, h: 423 };
const SENTRY_WORKSHOP_RECIPES = ['sentry', ...SURVIVAL_PARTS] as const satisfies readonly SurvivalRecipe[];
const SUPPLY_WORKSHOP_RECIPES = SURVIVAL_RECIPE_IDS.filter((recipe): recipe is Exclude<SurvivalRecipe, typeof SENTRY_WORKSHOP_RECIPES[number]> =>
  !SENTRY_WORKSHOP_RECIPES.some(sentry => sentry === recipe));
const SURVIVAL_DOOR_PANEL = { x: 615, y: 185, w: 533, h: 409 };
const SURVIVAL_DOOR_HOLD = .48;
const SURVIVAL_CRATE_LABELS = { medical: '药品箱', armory: '军械箱', engineering: '工程箱', airdrop: '空投补给', dropped: '地面物资', evac: '撤离配件箱' } as const;
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
const BATTLE_HUD_ATLASES = [
  ['hud-plates-v2', [
    ['status', 39, 167, 698, 125], ['portrait-rim', 979, 48, 347, 347], ['notice', 22, 528, 721, 107, 78],
    ['context', 806, 532, 691, 112, 50], ['keycap', 103, 799, 562, 177],
  ]],
  ['hud-vitals-v2', [['socket', 25, 141, 2122, 102], ['glass', 32, 374, 2109, 80], ['gloss', 32, 578, 2108, 23]]],
  ['hud-signals-v2', [
    ['work', 85, 77, 302, 313], ['warning', 456, 79, 337, 301], ['success', 881, 103, 308, 267],
    ['door', 90, 483, 272, 329], ['supplies', 464, 538, 329, 236], ['radio', 955, 455, 177, 361],
    ['stairs', 65, 942, 302, 248], ['inspect', 480, 903, 290, 294], ['interact', 899, 912, 224, 282],
  ]],
] as const;
type HudFrame = typeof BATTLE_HUD_ATLASES[number][1][number][0];
type NoticeKind = 'work' | 'warning' | 'success' | 'inspect';
type BattlePrompt = { title: string; detail?: string; badge: string; icon: HudFrame };
const HEALTH_X = 104, HEALTH_Y = 674, HEALTH_W = 216;
const PROMPT_CENTER = 594, PROMPT_Y = 98, PANEL_SCALE = 0.8;
type HudAction = { id: string; root: Node; sprite?: Sprite; icon?: Node; ring: Graphics; label: Label; remaining: () => number; duration: () => number; locked: boolean; previous: number; glow: number; scale: number; owners: Set<number>; progress: number };
type LittlebirdPod = { wheel: Node; flash: Graphics; spin: number };
// Reference coordinates use a top-left origin; UI/input use bottom-left design pixels.
const hudRect = (x: number, top: number, w: number, h: number) => ({ x: x * W / 1047, y: H - (top + h) * H / 589, w: w * W / 1047, h: h * H / 589 });
const HUD = {
  status: hudRect(10, 3, 272, 69), area: hudRect(310, 4, 425, 27), mission: hudRect(312, 35, 449, 23),
  settings: hudRect(935, 5, 44, 44), pause: hudRect(989, 5, 45, 44), map: hudRect(853, 56, 180, 102),
  move: hudRect(42, 391, 158, 160), ammo: hudRect(10, 103, 220, 70), fire: hudRect(877.5, 385, 133, 140), reload: hudRect(796, 417, 66, 66),
  auto: hudRect(877, 535, 115, 44), air: hudRect(805, 330, 64, 64),
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
  private outdoorAllyLight = new Map<number, {
    source: Point; angle: number; camera: Point; geometry: number; field: VisibilityField;
  }>();
  private outdoorLightTick = 0;
  private outdoorLightPending = true;
  private lightCamera?: Point;
  private lastAllySight = '';
  private lastAirSight = '';
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
  private lastEvacuationView = 0;
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
  private survivalRoofLayer!: Node;
  private survivalRoofStencil!: Graphics;
  private survivalRoofs: SurvivalRoofArt[] = [];
  private survivalFocus?: SurvivalRoofArt;
  private survivalArtRequested = new Set<keyof typeof SURVIVAL_BUILDING_ART>();
  private harborArtPending = false;
  private harborArtReady = false;
  private harborGroundLayer?: Node;
  private survivalCrateFrames = new Map<SurvivalCrate['kind'], SpriteFrame>();
  private survivalCrateNodes: Sprite[] = [];
  private survivalObjectNodes: Sprite[] = [];
  private survivalEvacNodes: Sprite[] = [];
  private survivalEvacArt!: Node;
  private survivalGearFrames = new Map<GearKind, SpriteFrame>();
  private survivalDoorFrames = new Map<SurvivalDoorKind, SpriteFrame>();
  private survivalDoorSprites = new Map<Graphics, Sprite[]>();
  private survivalSkin = new Map<string, SpriteFrame>();
  private survivalUiFrames = new Map<string, SpriteFrame>();
  private requestedArt = new Set<string>();
  private artRefresh?: Mode;
  private timedSurvivalFrames = new Map<string, SpriteFrame>();
  private timedSurvivalArtLoading = false;
  private survivalVehiclePanel?: EvacVehicle;
  private survivalAmmo?: { cards: { root: Node; icon: Node; name: Label; ammo: Label }[]; legacy: Node[]; hit: Node[] };
  private survivalSwap?: { time: number; startedWithSpecial: boolean; committed: boolean };
  private readonly convoyTurretAngles = new Map<number, number>();
  private survivalGearArtPending = false;
  private survivalGearArtReady = false;
  private survivalDevices!: Graphics;
  private survivalBagLayer?: Node;
  private survivalBagArt?: Graphics;
  private survivalBagSkin?: Node;
  private survivalBagItemLayer?: Node;
  private survivalBagSkinNodes: Sprite[] = [];
  private survivalBagIcons: Sprite[] = [];
  private survivalQuickOpen = false;
  private survivalWorkshopOpen = false;
  private survivalDoorPanel?: { id: number; replacement?: SurvivalDoorKind };
  private survivalDoorHold?: { owner: number; id: number; left: number; opened: boolean };
  private survivalRecipe: SurvivalRecipe | 'special-ammo' = 'grenade';
  private survivalHeldItem?: number;
  private survivalCrateId?: string;
  private survivalDrag?: { id?: number; owner: number | null; x: number; y: number; col?: number; row?: number };
  private survivalRotatePreview?: { id: number; until: number };
  private harborMapFrame?: SpriteFrame;
  private harborMapLayer?: Node;
  private harborGround = new Map<string, { bounds: HarborChunk; frame?: SpriteFrame; node?: Node; retry?: number }>();
  private harborLoads = 0;
  private harborStreamCenter?: { x: number; y: number };
  private harborScenery: { node: Node; bounds: Rect }[] = [];
  private survivalFloorArt: { stair: SurvivalStair; floors: SurvivalFloorArt[]; stairs: Node; upMarker: Node; downMarker: Node }[] = [];
  private survivalFloorDoors = new Set<number>();
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
  private venomSprites: Sprite[] = [];
  private pooledEnemySprites: Sprite[] = [];
  private artFrames = new Map<string, SpriteFrame>();
  private streetFrames = new Map<string, SpriteFrame>();
  private departure?: Departure;
  private lastLaunchedChapter?: Chapter;
  private satelliteMaterial?: Material;
  private operationCinema?: { root: Node; time: number; draw: (time: number) => boolean; finish: () => void };
  private operationDialogue?: StoryDialogueNodes & { lines: OperationLine[]; index: number; time: number; cinematic: boolean };
  private airborne?: { root: Node; craft: Sprite; rotor: Sprite; rope: Graphics; boarders: Sprite[]; littlebird: Sprite; littleRotor: Sprite; pods: LittlebirdPod[] };
  private operationArrival?: { battle: Battle; time: number };
  private operationBossHud?: { root: Node; fill: Graphics; label: Label; opacity: UIOpacity };
  private operationBossFill?: { battle: Battle; value: number; trail: number; phase: 'leader' | 'king'; reveal: number };
  private operationGrenadeKey = false;
  private operationGrenadeTouch?: { id: number; x: number; y: number; angle: number; range: number };
  private finishBrowserTacticalTouch = (event: TouchEvent) => {
    const gesture = this.operationGrenadeTouch;
    if (!gesture) return;
    for (let i = 0; i < event.changedTouches.length; i++) {
      if (event.changedTouches[i].identifier === gesture.id) {
        this.finishTacticalTouch(gesture.id, event.type === 'touchcancel');
        return;
      }
    }
  };
  private operationEscape?: { node: Node; opacity: UIOpacity; x: number; y: number; time: number; duration: number };
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
  private caseReel?: CaseReel;
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
  private profileLayer?: Node;
  private profilePage?: Node;
  private profileTabs?: [Sprite | undefined, Sprite | undefined];
  private homeProfileAvatar?: Sprite;
  private profileEditor?: ProfileIdentity & { tab: 'dossier' | 'settings' | 'guide'; editing?: boolean };
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
  private battleHudFrames = new Map<HudFrame, SpriteFrame>();
  private playerHealth = new PlayerHealthDisplay();
  private playerStatus?: { portrait: Node; fill: Sprite; trail: Sprite };
  private noticeHud?: { root: Node; plate: Sprite; icon: Sprite; opacity: UIOpacity };
  private promptHud?: { root: Node; plate: Sprite; icon: Sprite; badge: Sprite };
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
  private survivalFireLayer!: Node;
  private survivalFireFrames: SpriteFrame[] = [];
  private survivalFireSprites: { node: Node; sprite: Sprite; stencil: Graphics; revision: number; fire?: Battle['survivalFires'][number] }[] = [];
  private apartmentShutterSprite?: Sprite;
  private trapSprites: Sprite[] = [];
  private apartmentDialogue?: StoryDialogueNodes & { battle: Battle; lines: string[]; time: number };
  private transition?: { kind: 'enter' | 'win'; time: number; chapter?: Chapter; prompt?: 'first' | 'resume' | 'replay' | null };
  private survivalHero: HeroId = HEROINE_ID;
  private selectedSurvivalMap: SurvivalMapId = 'harbor';
  private transitionShade!: Graphics;
  private exitArrow!: Graphics;
  private streetStory?: StoryDialogueNodes & { battle: Battle; index: number; time: number };
  private streetStoryBattle?: Battle;
  private floorLoad?: { time: number; done: number; started: boolean; swapped: boolean; failed: boolean };
  private profile: Profile = readProfile(null);
  private unlockAllChapters: boolean = UNLOCK_ALL_CHAPTERS_FOR_TEST;
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
  private mouseQueuedFire = false;
  private operationGuideHeading?: number;
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
  private noticeSince = 0;
  private noticeKind: NoticeKind = 'inspect';
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
    this.survivalRoofLayer = this.makeNode('Survival roofs outside strict sight', this.environment);
    const roofMask = this.survivalRoofLayer.addComponent(Mask);
    roofMask.type = Mask.Type.GRAPHICS_STENCIL;
    roofMask.inverted = true;
    this.survivalRoofStencil = roofMask.subComp as Graphics;
    roofMask.node.active = false;
    this.survivalEvacArt = this.makeNode('Parked evacuation vehicles', this.environment);
    this.rebuildLevel();
    this.world = this.makeNode('Strictly visible combat layer', this.canvas, ACTOR_LAYER);
    const maskNode = this.makeNode('Line of sight', this.world);
    const mask = maskNode.addComponent(Mask); mask.type = Mask.Type.GRAPHICS_STENCIL;
    this.stencil = mask.subComp as Graphics;
    this.litWorld = this.makeNode('Visible combatants only', maskNode);
    this.apartmentEffects = this.graphics('Apartment mechanisms', this.litWorld);
    this.trapLayer = this.makeNode('Floor trap sprites', this.litWorld);
    this.survivalFireLayer = this.makeNode('Survival ground fire', this.litWorld);
    this.wildlifeArt = this.graphics('Ambient wildlife', this.litWorld);
    this.wildlifeArt.node.active = false;
    this.actors = this.graphics('Combatants', this.litWorld);
    this.spriteLayer = this.makeNode('Sample character sprites', this.litWorld);
    this.weaponArt = this.graphics('Barrel flash smoke and ejected casings', this.litWorld);
    this.grenadeLayer = this.makeNode('Grenade particles', this.litWorld);
    this.grenadeShadows = this.graphics('Thrown grenade ground shadow', this.grenadeLayer);
    this.survivalDevices = this.graphics('Survival deployables', this.litWorld);
    this.homeBackdrop = this.makeNode('Home background', this.canvas);
    const homeFill = this.graphics('Home backdrop fill', this.homeBackdrop);
    this.sbox(homeFill, 0, 0, W, H, C.ink);
    this.exitArrow = this.graphics('Nearby exit direction', this.canvas);
    this.hud = this.graphics('HUD', this.canvas);
    this.modal = this.makeNode('Panels', this.canvas);
    this.modalArt = this.graphics('Panel background', this.modal);
    this.transitionShade = this.graphics('Chapter transition shade', this.canvas);
    this.sbox(this.transitionShade, 0, 0, W, H, '#000000');
    this.transitionShade.node.active = false;
    const audioNode = new Node('Combat audio');
    audioNode.parent = this.canvas;
    this.audio = audioNode.addComponent(AudioSource);
    input.on(Input.EventType.KEY_DOWN, this.keyDown, this);
    input.on(Input.EventType.KEY_UP, this.keyUp, this);
    input.on(Input.EventType.MOUSE_MOVE, this.mouseMove, this);
    input.on(Input.EventType.MOUSE_DOWN, this.mouseDown, this);
    input.on(Input.EventType.MOUSE_UP, this.mouseUp, this);
    input.on(Input.EventType.TOUCH_START, this.touchStart, this);
    input.on(Input.EventType.TOUCH_MOVE, this.touchMove, this);
    input.on(Input.EventType.TOUCH_END, this.touchEnd, this);
    input.on(Input.EventType.TOUCH_CANCEL, this.touchEnd, this);
    if (sys.isBrowser && typeof window !== 'undefined') {
      // Cocos turns a release outside the button into a UI cancel and consumes it.
      window.addEventListener('touchend', this.finishBrowserTacticalTouch, true);
      window.addEventListener('touchcancel', this.finishBrowserTacticalTouch, true);
    }
    game.on(Game.EVENT_HIDE, this.hide, this);
    this.open('menu');
  }
  private requestArt(key: string, load: () => void) {
    if (this.requestedArt.has(key)) return;
    this.requestedArt.add(key);
    load();
  }
  private requestModeArt(mode: Mode) {
    if (mode === 'menu') {
      this.requestArt('home', () => this.loadHomeArt());
      this.requestArt('home-backpack', () => this.loadBackpackArt(true));
      this.requestArt('home-badge', () => this.loadCheckInArt(true));
      this.requestArt('portrait-' + this.profile.identity.avatar, () => this.loadTrainingArt(this.profile.identity.avatar));
    }
    if (mode === 'checkin') this.requestArt('checkin', () => this.loadCheckInArt());
    if (mode === 'missions') this.requestArt('missions', () => this.loadMissionArt());
    if (mode === 'backpack') {
      this.requestArt('backpack', () => this.loadBackpackArt());
      this.requestArt('checkin', () => this.loadCheckInArt());
    }
    if (mode === 'shop' || mode === 'training' || mode === 'roster') this.requestArt('shop', () => this.loadShopArt());
    if (mode === 'shop') this.requestArt('case-key', () => this.loadCaseArt('controls'));
    if (mode === 'cases') this.requestArt('cases', () => this.loadCaseArt());
    if (mode === 'backpack' || mode === 'achievements' || mode === 'cases') {
      if (mode !== 'cases') this.requestArt('case-icons', () => this.loadCaseArt('icons'));
      this.requestArt('shop-icons', () => this.loadShopArt(true));
    }
    if (mode === 'training' || mode === 'roster' || mode === 'recruit' || mode === 'backpack' ||
        mode === 'missions' || mode === 'achievements' || mode === 'checkin' || mode === 'cases' ||
        mode === 'profile-info' || isChapterMenu(mode) || isSurvivalMenu(mode)) {
      this.requestArt('training', () => this.loadTrainingArt());
    }
    if (isChapterMenu(mode) || isSurvivalMenu(mode) || mode === 'profile-info' || mode === 'achievements') this.loadCampaignArt(mode);
    if (isSurvivalMenu(mode)) this.requestArt('survival-ui', () => this.loadSurvivalUi());
    if (usesDialog(mode)) this.requestArt('dialog', () => {
      resources.load('home/dialog/spriteFrame', SpriteFrame, (err, frame) => {
        if (err || !this.isValid) return;
        frame.packable = false;
        this.dialogFrame = frame;
        this.dialogClosePatch = this.cropUiFrame(frame, 1388, 24, 122, 98);
        if (usesDialog(this.mode)) this.scheduleArtRefresh();
      });
    });
  }
  private loadCombatArt() {
    this.loadBattleArt();
    this.loadGrenadeArt();
    this.requestArt('shop-icons', () => this.loadShopArt(true));
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
      if (this.mode === 'playing' && !this.survivalWorkshopOpen && !this.suppliesOpen && !this.survivalCrateId) this.scheduleArtRefresh();
    });
    for (const asset of ['clues/paper', 'clues/pc']) resources.load(asset + '/spriteFrame', SpriteFrame, (err, frame) => { if (!err && this.isValid) this.readerFrames.set(asset, frame); });
    this.loadFloorDetailArt();
    this.loadStairArt();
    this.loadFallArt();
    for (const name of ['shoot', 'shoot-suppressed', 'hurt', 'dash', 'reload', 'hit', 'kill', 'win', 'alarm', 'jet-flyover', 'survival-stair-threat']) resources.load('audio/' + name, AudioClip, (err, clip) => { if (!err && this.isValid) this.clips.set(name, clip); });
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
  private setBattleRenderBudget(survival: boolean, operationOutdoors: boolean) {
    const mobileHarbor = survival && sys.isMobile;
    const renderWidth = mobileHarbor ? 960 : W, renderHeight = mobileHarbor ? 540 : H;
    if (this.environmentTarget.width !== renderWidth) {
      this.environmentTarget.resize(renderWidth, renderHeight);
      this.actorTarget.resize(renderWidth, renderHeight);
      this.outputFrame.rect = new TextureRect(0, 0, renderWidth, renderHeight);
      this.outputFrame.originalSize = new Size(renderWidth, renderHeight);
      this.presentationMaterial?.setProperty('actorsTexture', this.actorTarget);
    }
    const width = operationOutdoors ? 192 : mobileHarbor ? 240 : 320;
    if (this.visibilityField.width === width) return;
    this.visibilityField = new VisibilityField(width, width * 9 / 16);
    this.allyVisibilityField = undefined;
    this.visibilityTexture.reset({ width, height: this.visibilityField.height, format: Texture2D.PixelFormat.RGBA8888 });
    this.visibilityTexture.setFilters(Texture2D.Filter.LINEAR, Texture2D.Filter.LINEAR);
    this.visibilityTexture.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
    this.visibilityTexture.uploadData(this.visibilityField.build([]));
    this.presentationMaterial?.setProperty('visibilityTexture', this.visibilityTexture);
    this.sightTick = 0;
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
  private loadCampaignArt(mode: Mode) {
    const map = isChapterMenu(mode) || isSurvivalMenu(mode);
    if (map) this.requestArt('satellite-effect', () => resources.load('effects/satellite-focus', EffectAsset, (err, effect) => {
      if (err || !this.isValid) return;
      const material = new Material();
      material.initialize({ effectAsset: effect });
      this.satelliteMaterial = material;
    }));
    if (map) this.requestArt('liaison', () => resources.load('chapter4/radio-portraits/spriteFrame', SpriteFrame, (err, source) => {
      if (!err && this.isValid) this.campaignFrames.set('liaison', this.cropUiFrame(source, 256, 0, 256, 256));
    }));
    const group = mode === 'profile-info' ? 'profile' : mode === 'achievements' ? 'achievements' : isChapterMenu(mode) ? 'exploration' : 'survival';
    const sections = {
      profile: ['field-panels', 'account-shell', 'account-dusk', 'atlas'],
      achievements: ['achievement-shell', 'atlas'],
      exploration: ['satellite-map', 'tanSuo', 'field-panels', 'departure-brief-v1', 'selectHero', 'chapter-4', 'missions', 'hero-ui'],
      survival: ['harbor-selection-v2', 'tanSuo', 'field-panels', 'departure-brief-v1', 'selectHero', 'hero-ui'],
    };
    const assets = CAMPAIGN_ART.filter(asset => sections[group].includes(asset.file));
    for (const asset of assets) this.requestArt('campaign-' + asset.file, () => resources.load(`campaign/${asset.file}/spriteFrame`, SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      if (err) {
        this.requestedArt.delete('campaign-' + asset.file);
        console.warn('Campaign artwork could not load:', asset.file, err);
      }
      else {
        source.packable = false;
        if ('crops' in asset) {
          for (const [id, crop] of Object.entries(asset.crops)) {
            if (crop) this.campaignFrames.set(id as CampaignImage, this.cropUiFrame(source, ...crop));
          }
        } else this.campaignFrames.set(asset.image, source);
      }
      if (!err && (isChapterMenu(this.mode) || isSurvivalMenu(this.mode) || this.mode === 'achievements' || this.canRefreshProfileArt())) this.scheduleArtRefresh();
    }));
  }
  private scheduleArtRefresh() {
    this.artRefresh = this.mode;
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
      if (--remaining === 0 && (['menu', 'missions', 'checkin', 'backpack', 'achievements'].includes(this.mode) || this.canRefreshProfileArt())) this.scheduleArtRefresh();
    });
  }
  private loadTrainingArt(hero?: HeroId) {
    const assets = hero === undefined ? TRAINING_ART : TRAINING_ART.filter(asset => asset.file === TRAINING_PROFILES[hero].key + '-face' || asset.file === 'plates');
    for (const asset of assets) this.requestArt('training-' + asset.file, () => resources.load(`training/${asset.file}/spriteFrame`, SpriteFrame, (err, source) => {
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
      if (!err && (['menu', 'checkin', 'missions', 'roster', 'training', 'recruit', 'backpack', 'select-hero', 'survival-hero', 'achievements'].includes(this.mode) ||
        this.canRefreshProfileArt() || this.mode === 'cases' && !this.caseRoll)) this.scheduleArtRefresh();
    }));
  }
  private loadShopArt(iconsOnly = false) {
    const assets = iconsOnly ? SHOP_ART.filter(asset => ['ui', 'catalog', 'fixed-weapons', 'mods'].includes(asset.file)) : SHOP_ART;
    for (const asset of assets) this.requestArt('shop-' + asset.file, () => resources.load(`shop/${asset.file}/spriteFrame`, SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      if (!err) {
        source.packable = false;
        if ('crops' in asset) {
          for (const [key, crop] of Object.entries(asset.crops)) if (crop) {
            this.shopFrames.set(key as ShopImage, this.cropUiFrame(source, ...crop));
          }
        } else this.shopFrames.set(asset.image, source);
      } else console.warn('Shop artwork could not load:', asset.file, err);
      if (!err && (['shop', 'roster', 'training', 'backpack', 'achievements'].includes(this.mode) || this.mode === 'cases' && !this.caseRoll)) this.scheduleArtRefresh();
    }));
  }
  private loadCaseArt(group: 'all' | 'icons' | 'controls' = 'all') {
    const assets = CASE_ART.filter(asset => group === 'all' || asset.file === 'controls' || group === 'icons' && asset.file === 'crates');
    for (const asset of assets) this.requestArt('cases-' + asset.file, () => resources.load(`cases/${asset.file}/spriteFrame`, SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      if (err) console.warn('Case artwork could not load:', asset.file, err);
      else {
        source.packable = false;
        if ('crops' in asset) for (const [key, crop] of Object.entries(asset.crops)) this.caseFrames.set(key as CaseImage, this.cropUiFrame(source, ...crop));
        else this.caseFrames.set(asset.image, source);
      }
      if (!err && (['shop', 'backpack', 'achievements'].includes(this.mode) || this.mode === 'cases' && !this.caseRoll)) this.scheduleArtRefresh();
    }));
  }
  private loadBackpackArt(tileOnly = false) {
    const assets = tileOnly ? BACKPACK_ART.filter(asset => asset.file === 'home-tile') : BACKPACK_ART;
    for (const asset of assets) this.requestArt('backpack-' + asset.file, () => resources.load(`backpack/${asset.file}/spriteFrame`, SpriteFrame, (err, source) => {
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
      if (!err && ['menu', 'checkin', 'missions', 'backpack'].includes(this.mode)) this.scheduleArtRefresh();
    }));
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
  private loadCheckInArt(badgeOnly = false) {
    const textures = [['panel', null], ['badge', null], ['plates', CHECK_IN_PLATES], ['rewards', CHECK_IN_ICONS]] as const;
    for (const [id, crops] of textures) {
      if (badgeOnly && id !== 'badge') continue;
      this.requestArt('checkin-' + id, () => resources.load(`home/checkin-${id}/spriteFrame`, SpriteFrame, (err, source) => {
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
        if (this.mode === 'menu' || this.mode === 'checkin' || this.mode === 'backpack') this.scheduleArtRefresh();
      }));
    }
  }
  private loadBattleArt() {
    resources.load('battle/button_objective/spriteFrame', SpriteFrame, (err, frame) => {
      if (!this.isValid || err) return;
      frame.packable = false;
      this.objectiveFrame = this.cropUiFrame(frame, 77, 74, 1100, 1100);
      if (this.objectiveHud) this.setupSprite(this.objectiveHud.icon, this.objectiveFrame, 52, 52);
    });
    const images: BattleImage[] = [...BATTLE_ART, 'joystick_move_base', 'joystick_move_cap'];
    let remaining = images.length + BATTLE_HUD_ATLASES.length;
    const loaded = () => { if (--remaining === 0 && this.mode === 'playing' && !this.survivalWorkshopOpen && !this.suppliesOpen && !this.survivalCrateId) this.scheduleArtRefresh(); };
    for (const id of images) resources.load('battle/' + id + '/spriteFrame', SpriteFrame, (err, frame) => {
      if (!this.isValid) return;
      if (err) console.warn('Battle artwork could not load:', id, err);
      else { frame.packable = false; this.battleFrames.set(id, frame); }
      loaded();
    });
    for (const [asset, crops] of BATTLE_HUD_ATLASES) resources.load('battle/' + asset + '/spriteFrame', SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      if (err) console.warn('Battle HUD artwork could not load:', asset, err);
      else for (const [id, x, y, w, h, inset] of crops) {
        // The build textures use half-resolution exports of the source sheets.
        const left = Math.floor(x / 2), top = Math.floor(y / 2);
        const frame = this.cropUiFrame(source, left, top, Math.ceil((x + w) / 2) - left, Math.ceil((y + h) / 2) - top);
        if (inset) {
          frame.insetLeft = frame.insetRight = inset / 2;
          frame.insetTop = frame.insetBottom = 8;
        }
        this.battleHudFrames.set(id, frame);
      }
      loaded();
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
  private updateVenomArt(glob: SpriteFrame | undefined, dart: SpriteFrame | undefined) {
    const b = this.battle;
    let active = 0;
    const show = (p: Point, frame: SpriteFrame, angle: number, width: number, height: number, anchorY: number, alpha = 255) => {
      if (Math.abs(p.x - b.player.x) > W / 2 + 180 || Math.abs(p.y - b.player.y) > H / 2 + 180) return;
      const sprite = this.venomSprites[active] ??= this.setupSprite(this.makeNode('Venom effect', this.grenadeLayer), frame, width, height);
      active++;
      if (sprite.spriteFrame !== frame) sprite.spriteFrame = frame;
      const transform = sprite.node.getComponent(UITransform)!;
      transform.setContentSize(width, height);
      transform.setAnchorPoint(.5, anchorY);
      sprite.node.setPosition(p.x, p.y);
      sprite.node.angle = angle * 180 / Math.PI - 90;
      sprite.color = color('#ffffff', alpha);
      sprite.node.active = true;
    };
    for (const shot of b.bullets) {
      const frame = shot.venom === 'spit' ? glob : shot.venom === 'dart' ? dart : undefined;
      if (frame) {
        const height = shot.venom === 'spit' ? 27 : 36;
        show(shot, frame, Math.atan2(shot.vy, shot.vx), height * frame.originalSize.width / frame.originalSize.height, height, .7);
      }
    }
    if (glob) for (const splash of b.particles) if (splash.kind === 'spit-splash') {
      const phase = 1 - splash.life / splash.max;
      show(splash, glob, splash.rotation ?? 0, 19 + 29 * phase, 17 + 16 * phase, .53, Math.round(214 * (1 - phase)));
    }
    for (let i = active; i < this.venomSprites.length; i++) this.venomSprites[i].node.active = false;
  }
  private updateGrenadeArt() {
    const b = this.battle, g = this.grenadeShadows;
    g.clear();
    let thrown = 0;
    const onScreen = (p: Point, margin: number) =>
      Math.abs(p.x - b.player.x) <= W / 2 + margin && Math.abs(p.y - b.player.y) <= H / 2 + margin;
    for (const item of b.tacticalThrows) {
      const frame = item.kind === 'grenade' ? this.grenadeFrame :
        item.survival && isSurvivalThrowable(item.kind) ? this.survivalItemFrame(item.kind) : undefined;
      if (!frame || !onScreen(item, OPERATION_GRENADE_RANGE)) continue;
      const pose = grenadeThrowPose(item);
      const { x, y } = pose;
      const scale = 1 + pose.height * 0.008;
      disc(g, x + 2, y - 2, 8 + pose.height * 0.06, '#080909', Math.round(135 - pose.height * 2.2));
      const sprite = this.grenadeSprites[thrown] ??= this.setupSprite(this.makeNode('Airborne throwable', this.grenadeLayer), frame, 23, 13);
      thrown++;
      if (sprite.spriteFrame !== frame) sprite.spriteFrame = frame;
      const size = frame.originalSize, fit = (item.kind === 'molotov' ? 28 : 23) / Math.max(size.width, size.height);
      sprite.node.getComponent(UITransform)!.setContentSize(size.width * fit, size.height * fit);
      sprite.node.active = true;
      sprite.node.setPosition(x, y + pose.height);
      sprite.node.setScale(scale, scale, 1);
      sprite.node.angle = pose.angle;
    }
    for (let i = thrown; i < this.grenadeSprites.length; i++) this.grenadeSprites[i].node.active = false;

    let active = 0;
    for (const effect of b.tacticalEffects) {
      if (effect.survival && effect.kind === 'flashbang' && onScreen(effect, 130)) {
        const alpha = effect.life / effect.max, radius = 22 + (1 - alpha) * 102;
        disc(g, effect.x, effect.y, 26 * alpha, '#fff5ce', Math.round(235 * alpha));
        g.strokeColor = color('#e1efff', Math.round(210 * alpha ** 2)); g.lineWidth = 3;
        g.circle(effect.x, effect.y, radius); g.stroke();
      }
      if ((effect.kind !== 'grenade' && effect.kind !== 'proximity-mine') || !this.grenadeBlastFrames.length) continue;
      const damageRadius = TACTICAL_DEFINITIONS[effect.kind].radius;
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
        const radius = damageRadius + 53;
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
        blast.debris = Array.from({ length: 13 }, (_, i) => rayDistance(effect, i / 13 * Math.PI * 2, damageRadius * (0.59 + (i % 4) * 0.102), cover));
      }
      const age = effect.max - effect.life;
      const phase = age < 0.045 ? 0 : age < 0.14 ? 1 : age < 0.24 ? 2 : age < 0.39 ? 3 : age < 0.70 ? 4 : 5;
      const size = (85 + 143 * (1 - Math.exp(-age * 12))) * damageRadius / TACTICAL_DEFINITIONS.grenade.radius;
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
    if (b.survival) for (const e of b.enemies) {
      if (e.hp <= 0 || !e.disoriented || !onScreen(e, 26)) continue;
      const angle = this.presentationTime * 5 + e.id;
      for (let i = 0; i < 3; i++) {
        const a = angle + Math.PI * 2 * i / 3;
        disc(g, e.x + Math.cos(a) * 13, e.y + 19 + Math.sin(a) * 5, 2.1, '#ffe3a0', 230);
      }
    }
    let flames = 0;
    if (this.survivalFireFrames.length) for (const fire of b.survivalFires) {
      const { radius } = SURVIVAL_FIRE, life = fire.until - b.elapsed;
      if (life <= 0 || !onScreen(fire, radius) || flames >= (sys.isMobile ? 6 : 10)) continue;
      const phase = Math.floor((this.presentationTime + fire.x * .009) * 8) % this.survivalFireFrames.length;
      const frame = this.survivalFireFrames[phase];
      let flame = this.survivalFireSprites[flames];
      if (!flame) {
        const node = this.makeNode('Ground fire cover mask', this.survivalFireLayer);
        const mask = node.addComponent(Mask); mask.type = Mask.Type.GRAPHICS_STENCIL;
        const sprite = this.setupSprite(this.makeNode('Fire loop', node), frame, radius * 2, radius * 2);
        flame = this.survivalFireSprites[flames] = { node, sprite, stencil: mask.subComp as Graphics, revision: -1 };
      }
      flames++;
      flame.node.active = true;
      if (flame.fire !== fire || flame.revision !== b.geometryRevision) {
        flame.fire = fire; flame.revision = b.geometryRevision;
        flame.node.setPosition(fire.x, fire.y);
        const blockers = b.blockers.filter(rect => {
          const q = closestOnRect(fire, rect);
          return Math.hypot(q.x - fire.x, q.y - fire.y) <= radius;
        });
        const points = visibilityPolygon(fire, 0, blockers, radius, true).map(point => ({ x: point.x - fire.x, y: point.y - fire.y }));
        flame.stencil.clear();
        polygon(flame.stencil, points, '#ffffff');
      }
      if (flame.sprite.spriteFrame !== frame) flame.sprite.spriteFrame = frame;
      const intensity = Math.min(1, life / .65, .64 + (SURVIVAL_FIRE.duration - life) * 3);
      flame.sprite.color = color('#ffffff', Math.round(intensity * 244));
    }
    for (let i = flames; i < this.survivalFireSprites.length; i++) {
      this.survivalFireSprites[i].node.active = false;
      this.survivalFireSprites[i].fire = undefined;
    }
  }
  private updateSurvivalDeviceArt(dt: number) {
    const g = this.survivalDevices, b = this.battle, p = b.player;
    g.clear();
    let count = 0, objects = 0, parked = 0;
    const near = (point: { x: number; y: number }) => Math.abs(point.x - p.x) < W / 2 + 55 && Math.abs(point.y - p.y) < H / 2 + 55;
    const prop = (frame: SpriteFrame | undefined, x: number, y: number, size: number, tint = '#ffffff', angle = 0, pivot = .5, scenery = false) => {
      if (!frame) return false;
      const pool = scenery ? this.survivalEvacNodes : this.survivalObjectNodes;
      const parent = scenery ? this.survivalEvacArt : g.node;
      const i = scenery ? parked++ : objects++;
      const sprite = pool[i] ??= this.setupSprite(this.makeNode('Survival field object', parent), frame, size, size);
      sprite.spriteFrame = frame; sprite.color = color(tint);
      const transform = sprite.node.getComponent(UITransform)!;
      transform.setContentSize(size, size * frame.originalSize.height / frame.originalSize.width);
      transform.setAnchorPoint(pivot, .5);
      sprite.node.setPosition(x, y);
      sprite.node.angle = angle;
      sprite.node.active = true;
      return true;
    };
    if (b.survival?.timed) {
      const helicopter = EVAC_VEHICLES.helicopter.point, boat = EVAC_VEHICLES.boat.point;
      if (near(helicopter)) {
        prop(this.timedSurvivalFrames.get('helipad'), helicopter.x, helicopter.y, 237, '#ffffff', 0, .5, true);
        prop(this.streetFrames.get('op-blackhawk'), helicopter.x, helicopter.y, 88, '#ffffff', 0, .5, true);
        prop(this.streetFrames.get('op-rotor'), helicopter.x, helicopter.y + 20, 170,
          '#ffffff', b.survivalVehicleStatus('helicopter').fuel === undefined ? 36 : this.presentationTime * 540, .5, true);
      }
      if (near(boat)) prop(this.timedSurvivalFrames.get('boat'), boat.x, boat.y, EVAC_BOAT_WIDTH, '#ffffff', 0, .5, true);
      for (const vehicle of convoyVehicles(b.elapsed)) {
        if (!vehicle.visible) continue;
        const tank = vehicle.kind === 'tank', facing = vehicle.angle;
        const aim = b.survivalConvoyAim.get(vehicle.index);
        const previous = this.convoyTurretAngles.get(vehicle.index) ?? facing;
        const heading = previous + clamp(angleDiff(aim && b.elapsed - aim.trackingAt < 1.4 ? aim.angle : facing, previous), -dt * 4.3, dt * 4.3);
        this.convoyTurretAngles.set(vehicle.index, heading);
        if (near(vehicle)) {
          prop(this.timedSurvivalFrames.get(vehicle.kind), vehicle.x, vehicle.y, tank ? 137 : 130, '#ffffff', facing * 180 / Math.PI);
          prop(this.timedSurvivalFrames.get(tank ? 'tank-turret' : 'carrier-gunner'), vehicle.x, vehicle.y, tank ? 131 : 58,
            '#ffffff', heading * 180 / Math.PI, .21);
          if (aim && b.elapsed - aim.shotAt < .11) {
            const length = tank ? 88 : 42;
            const x = vehicle.x + Math.cos(heading) * length, y = vehicle.y + Math.sin(heading) * length;
            disc(g, x, y, tank ? 13 : 7, '#ffbd5d', 220);
            line(g, x, y, x + Math.cos(heading) * 38, y + Math.sin(heading) * 38, '#ffe09a', 2.4, 198);
          }
        }
        if (vehicle.index !== 0 && vehicle.index !== 2) continue;
        const flight = { x: vehicle.x - Math.sin(facing) * 108, y: vehicle.y + Math.cos(facing) * 108 };
        if (near(flight)) {
          prop(this.streetFrames.get('op-littlebird'), flight.x, flight.y, 47, '#ffffff', facing * 180 / Math.PI - 90);
          prop(this.streetFrames.get('op-rotor'), flight.x, flight.y, 103, '#c7c6b9', this.presentationTime * 700);
        }
      }
    }
    for (const crate of b.survivalCrates) {
      if (!near(crate) || crate.kind === 'dropped' && !crate.goods.length) continue;
      const { x, y } = crate, size = crate.kind === 'airdrop' ? 66 : crate.kind === 'dropped' ? 33 : 51;
      const frame = this.survivalCrateFrames.get(crate.kind === 'evac' ? 'engineering' : crate.kind);
      disc(g, x + 2, y - 5, size * .43, '#101618', 145);
      if (frame) {
        const sprite = this.survivalCrateNodes[count++] ??= this.setupSprite(this.makeNode('Supply container', g.node), frame, size, size);
        sprite.spriteFrame = frame;
        sprite.color = color(crate.goods.length ? '#ffffff' : '#696c62');
        sprite.node.setPosition(x, y);
        sprite.node.getComponent(UITransform)!.setContentSize(size, size * frame.originalSize.height / frame.originalSize.width);
        sprite.node.active = true;
      } else {
        box(g, x - size / 2, y - size * .3, size, size * .6, crate.goods.length ? '#636758' : '#383c3a');
        outline(g, x - size / 2, y - size * .3, size, size * .6, '#927b56');
      }
      if (crate.opened) line(g, x - size * .38, y + size * .31, x + size * .38, y + size * .31, crate.goods.length ? C.jade : '#656b5f', 3);
      else if (crate.kind === 'airdrop') disc(g, x, y + 27, 6 + Math.sin(b.elapsed * 5) * 3, '#ffa958', 188);
    }
    for (let i = count; i < this.survivalCrateNodes.length; i++) this.survivalCrateNodes[i].node.active = false;
    for (const item of b.survivalField) {
      if (!near(item)) continue;
      disc(g, item.x, item.y, 18, '#d4a972', 38);
      g.strokeColor = color('#e8ba66', 192); g.lineWidth = 2;
      g.circle(item.x, item.y, 19); g.stroke();
      prop(this.survivalItemFrame(item.kind), item.x, item.y, 29);
    }
    for (const mine of b.survivalMines) {
      if (!near(mine)) continue;
      disc(g, mine.x + 1, mine.y - 2, 13, '#141b1e');
      const shock = mine.kind === 'shock-mine';
      if (!prop(this.survivalItemFrame(shock ? 'shock-mine' : 'mine'), mine.x, mine.y, 25)) {
        disc(g, mine.x, mine.y, 11, '#707764');
        disc(g, mine.x, mine.y, 4, shock ? '#73ceda' : '#cbb565');
      }
      if (mine.fuse !== undefined) {
        g.strokeColor = color('#ff603f', 120 + Math.round(Math.abs(Math.sin(b.elapsed * 25)) * 110));
        g.lineWidth = 2; g.circle(mine.x, mine.y, 43); g.stroke();
      }
    }
    for (const sentry of b.survivalSentries) {
      if (!near(sentry)) continue;
      const { x, y, angle, hp } = sentry;
      const dx = Math.cos(angle), dy = Math.sin(angle);
      disc(g, x + 3, y - 3, 20, '#101417', 170);
      const drawn = prop(this.survivalItemFrame('sentry'), x, y, 72, hp ? '#ffffff' : '#555851', angle * 180 / Math.PI, .31);
      if (!drawn) {
        for (let i = 0; i < 3; i++) {
          const a = i * Math.PI * 2 / 3 + .35, tx = x + Math.cos(a) * 22, ty = y + Math.sin(a) * 22;
          line(g, x, y, tx, ty, hp ? '#838570' : '#4b4c43', 6);
          disc(g, tx, ty, 4, '#323c3b');
        }
        line(g, x - dx * 12, y - dy * 12, x + dx * 12, y + dy * 12, '#454d43', 17);
        line(g, x + dx * 7, y + dy * 7, x + dx * 44, y + dy * 44, '#728071', 6);
      }
      if (sentry.muzzle > 0) {
        line(g, x + dx * 50, y + dy * 50, x + dx * 67, y + dy * 67, '#ffd477', 5);
        disc(g, x + dx * 54, y + dy * 54, 4, '#fff6b2');
      }
      if (hp > 0) {
        box(g, x - 19, y + 28, 38, 4, '#263130');
        box(g, x - 19, y + 28, 38 * hp / SENTRY_HP, 4, hp > SENTRY_HP / 3 ? C.jade : '#ed7455');
      }
    }
    const placement = b.survivalPlacement;
    if (placement || this.suppliesOpen && b.survivalBag?.item(this.survivalHeldItem)?.kind === 'sentry') {
      const valid = placement ?? b.survivalSentryPreview;
      const point = valid ?? { x: p.x + Math.cos(p.angle) * 46, y: p.y + Math.sin(p.angle) * 46 };
      g.strokeColor = color(valid ? C.jade : '#ef6e53', 218);
      g.lineWidth = 2; g.circle(point.x, point.y, 24); g.stroke();
    }
    for (let i = objects; i < this.survivalObjectNodes.length; i++) this.survivalObjectNodes[i].node.active = false;
    for (let i = parked; i < this.survivalEvacNodes.length; i++) this.survivalEvacNodes[i].node.active = false;
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
  private loadSampleArt(commonOnly: boolean) {
    for (const [id, file] of [['spitter', 'art/venom-spitter-v1'], ['venom-glob', 'art/venom-glob-v1'], ['venom-dart', 'chapter4/rimelet-venom-dart-v1']]) {
      this.requestArt(file, () => resources.load(file + '/spriteFrame', SpriteFrame, (err, frame) => {
        if (err) { console.warn('Venom art could not load:', file, err); return; }
        if (this.isValid) this.artFrames.set(id, frame);
      }));
    }
    if (!commonOnly) this.requestArt('dorm-desk', () => resources.load('art/desk-reception-v2/spriteFrame', SpriteFrame, (err, frame) => {
      if (!this.isValid) return;
      if (err) { this.requestedArt.delete('dorm-desk'); return; }
      frame.packable = false;
      this.artFrames.set('lobby-desk', this.cropUiFrame(frame, 46, 138, 1582, 679));
      this.rebuildLevel();
    }));
    const assets = [['operator', 'operator-raven-v1'], ['walker', 'enemy-walker-v1'], ['dormWalkers', 'dorm-walkers-v1'], ['roll', 'operator-roll-v2'], ['heroine', 'heroine-usp-v1'], ['heroineRoll', 'heroine-roll-v2'], ['dormKit', 'dorm-kit-v2'], ['corridor', 'dorm-corridor-floor-v1'], ['bedroom', 'dorm-bedroom-floor-v1']];
    const crop = (source: SpriteFrame, x: number, y: number, w: number, h: number) => {
      const frame = source.clone(); frame.packable = false; frame.rect = new TextureRect(x, y, w, h); frame.originalSize = new Size(w, h); frame.offset = new Vec2(0, 0); this.rollFrames.push(frame); return frame;
    };
    for (const [id, filename] of assets) {
      if (commonOnly && ['dormWalkers', 'dormKit', 'corridor', 'bedroom'].includes(id)) continue;
      this.requestArt('art/' + filename, () => resources.load('art/' + filename + '/spriteFrame', SpriteFrame, (err, frame) => {
        if (!this.isValid) return;
        if (err) { this.requestedArt.delete('art/' + filename); console.warn('Game art could not load:', filename, err); return; }
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
      }));
    }
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
  private loadSurvivalArt() {
    resources.load('survival/field-props/spriteFrame', SpriteFrame, (err, source) => {
      if (err || !this.isValid) return;
      for (const [id, x, y, w, h] of SURVIVAL_PROPS) this.artFrames.set(id, this.cropUiFrame(source, x, y, w, h));
      if (this.battle.stage.survival) this.rebuildLevel();
    });
    resources.load('survival/street-surfaces/spriteFrame', SpriteFrame, (err, source) => {
      if (err || !this.isValid) return;
      this.artFrames.set('survival-asphalt', this.cropUiFrame(source, 0, 0, 640, 640));
      this.artFrames.set('survival-concrete', this.cropUiFrame(source, 640, 0, 640, 640));
      if (this.battle.stage.survival) this.rebuildLevel();
    });
  }
  private loadSurvivalBuildingArt(atlas: keyof typeof SURVIVAL_BUILDING_ART) {
    if (this.survivalArtRequested.has(atlas)) return;
    this.survivalArtRequested.add(atlas);
    resources.load(`survival/${atlas}/spriteFrame`, SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      if (err) { this.survivalArtRequested.delete(atlas); console.warn('Survival interior artwork could not load:', atlas, err); return; }
      for (const [id, x, y, w, h] of SURVIVAL_BUILDING_ART[atlas]) this.artFrames.set(id, this.cropUiFrame(source, x, y, w, h));
      if (this.battle.stage.survival) { this.rebuildLevel(); this.sightTick = 0; }
    });
  }
  private loadHarborMapArt() {
    if (this.harborArtPending || this.harborArtReady) return;
    this.harborArtPending = true;
    const names = ['overview', 'roofs', 'regional-roofs', 'doorstep'];
    Promise.all(names.map(name => new Promise<SpriteFrame>((resolve, reject) => {
      resources.load(`survival/harbor-hd/${name}/spriteFrame`, SpriteFrame, (err, frame) => {
        if (err) reject(err);
        else resolve(frame);
      });
    }))).then(frames => {
      if (!this.isValid) return;
      for (let i = 0; i < names.length; i++) {
        frames[i].packable = false;
        this.artFrames.set('harbor-hd-' + names[i], frames[i]);
      }
      for (const [key, roofs] of [['roofs', HARBOR_ROOFS], ['regional-roofs', HARBOR_REGIONAL_ROOFS]] as const) {
        const sheet = this.artFrames.get('harbor-hd-' + key)!;
        roofs.forEach((name, i) => this.artFrames.set('harbor-hd-roof-' + name,
          this.cropUiFrame(sheet, i % 3 * 512 + 4, Math.floor(i / 3) * 344 + 4, 504, 336)));
      }
      this.harborArtReady = true;
      if (isSurvivalMenu(this.mode)) this.open(this.mode);
    }).catch(err => console.warn('Harbor terrain artwork could not load:', err)).finally(() => {
      this.harborArtPending = false;
    });
  }
  private dropHarborChunk(tile: { frame?: SpriteFrame; node?: Node }) {
    if (tile.node?.isValid) {
      tile.node.active = false;
      const sprite = tile.node.getComponent(Sprite);
      if (sprite) sprite.spriteFrame = null;
      tile.node.destroy();
    }
    tile.frame?.decRef();
  }
  private clearHarborStream() {
    for (const tile of this.harborGround.values()) this.dropHarborChunk(tile);
    this.harborGround.clear();
    this.harborStreamCenter = undefined;
  }
  private streamHarbor(p: { x: number; y: number }, force = false) {
    const previous = this.harborStreamCenter;
    if (!force && previous && Math.hypot(p.x - previous.x, p.y - previous.y) < 36) {
      if (this.harborLoads === 0) this.pumpHarborStream();
      return;
    }
    this.harborStreamCenter = { ...p };
    const lead = (value: number) => Math.abs(value) < 30 ? 0 : Math.max(-384, Math.min(384, value * 8));
    const ahead = { x: p.x + lead(p.x - (previous?.x ?? p.x)), y: p.y + lead(p.y - (previous?.y ?? p.y)) };
    const ranked = HARBOR_CHUNKS.map(bounds => {
      const [x, y] = harborDistanceToChunk(p, bounds);
      const [dx, dy] = harborDistanceToChunk(ahead, bounds);
      const visible = x <= W / 2 + 24 && y <= H / 2 + 24;
      return { bounds, x, y, rank: visible ? Math.hypot(x, y) * .01 : 1000 + Math.hypot(dx, dy * 1.22) };
    }).filter(({ x, y }) => x <= W / 2 + 710 && y <= H / 2 + 550).sort((a, b) => a.rank - b.rank)
      .slice(0, sys.isMobile ? 10 : 13);
    const wanted = new Set(ranked.map(({ bounds }) => bounds.kind));
    for (const [key, tile] of this.harborGround) {
      if (wanted.has(key)) continue;
      this.dropHarborChunk(tile);
      this.harborGround.delete(key);
    }
    // Keep request order in sync with camera priority, including while retries are pending.
    this.harborGround = new Map(ranked.map(({ bounds }) => [bounds.kind, this.harborGround.get(bounds.kind) ?? { bounds }]));
    this.pumpHarborStream();
  }
  private readonly harborPending = new Set<string>();
  private pumpHarborStream() {
    const now = Date.now();
    for (const [key, tile] of this.harborGround) {
      if (this.harborLoads >= (sys.isMobile ? 2 : 3)) break;
      if (tile.frame || this.harborPending.has(key) || (tile.retry ?? 0) > now) continue;
      this.harborPending.add(key);
      this.harborLoads++;
      resources.load(`survival/harbor-hd/ground-${key}/spriteFrame`, SpriteFrame, (err, frame) => {
        this.harborPending.delete(key);
        this.harborLoads--;
        const current = this.isValid ? this.harborGround.get(key) : undefined;
        if (err) {
          if (current) { current.retry = Date.now() + 1200; console.warn('Harbor chunk unavailable:', key, err); }
        } else if (current) {
          frame.packable = false;
          frame.addRef();
          current.frame = frame;
          this.mountHarborChunk(current);
        } else frame.addRef().decRef();
        if (this.isValid) this.pumpHarborStream();
      });
    }
  }
  private mountHarborChunk(tile: { bounds: HarborChunk; frame?: SpriteFrame; node?: Node }) {
    if (tile.node || !tile.frame || !this.harborGroundLayer) return;
    const r = tile.bounds;
    const node = this.makeNode('Harbor ground ' + r.kind, this.harborGroundLayer);
    const sprite = this.setupSprite(node, tile.frame, r.w, r.h);
    node.setPosition(r.x + r.w / 2, r.y + r.h / 2);
    tile.node = sprite.node;
  }
  private buildSurvivalRoofs() {
    const stage = this.battle.stage.survival;
    if (!stage) return;
    const p = this.battle.player, offsetX = this.battle.survivalUpperFloor?.offsetX ?? 0;
    for (const { footprint: bounds, rooms, kind } of stage.buildings) {
      const node = this.makeNode('Harbor roof ' + bounds.kind, this.survivalRoofLayer);
      node.setPosition(bounds.x + bounds.w / 2, bounds.y + bounds.h / 2);
      const frame = this.artFrames.get('harbor-hd-roof-' + harborBuildingRoof(bounds, kind));
      if (frame) this.setupSprite(node, frame, bounds.w, bounds.h);
      else {
        const g = this.graphics('Roof fallback', node);
        box(g, -bounds.w / 2 - 10, -bounds.h / 2 - 10, bounds.w + 20, bounds.h + 20, '#403b33');
      }
      const opacity = node.addComponent(UIOpacity);
      opacity.opacity = roomAt({ x: p.x - offsetX, y: p.y }, [bounds]) >= 0 ? 0 : 255;
      this.survivalRoofs.push({ bounds, rooms, opacity });
      this.mapNodes.push(node);
    }
  }
  private updateSurvivalRoofs(dt: number) {
    const { x, y } = this.battle.player, view = this.battle.survivalFloorView;
    const p = { x: x - (view?.upstairs ? view.stair.offsetX : 0), y };
    for (const art of this.survivalFloorArt) {
      const blend = view?.stair === art.stair ? view.blend : 0;
      const bounds = art.floors[0].bounds;
      const visible = roomAt(p, [bounds]) >= 0 || view?.stair === art.stair;
      const near = p.x + W / 2 + 48 >= bounds.x && p.x - W / 2 - 48 <= bounds.x + bounds.w
        && p.y + H / 2 + 48 >= bounds.y && p.y - H / 2 - 48 <= bounds.y + bounds.h;
      art.floors.forEach(({ opacity }, i) => {
        const alpha = Math.round(255 * (i === 0 ? 1 - blend : blend));
        opacity.node.active = near && alpha > 0;
        if (alpha !== opacity.opacity) opacity.opacity = alpha;
      });
      art.stairs.active = visible;
      art.upMarker.active = visible && blend < .5;
      art.downMarker.active = visible && blend >= .5;
    }
    this.streamHarbor(p);
    for (const { node, bounds } of this.harborGround.values()) {
      if (!node) continue;
      const [dx, dy] = harborDistanceToChunk(p, bounds);
      node.active = dx < W / 2 + 48 && dy < H / 2 + 48;
    }
    for (const { node, bounds } of this.harborScenery) {
      node.active = p.x + W / 2 + 84 >= bounds.x && p.x - W / 2 - 84 <= bounds.x + bounds.w
        && p.y + H / 2 + 84 >= bounds.y && p.y - H / 2 - 84 <= bounds.y + bounds.h;
    }
    const fade = Math.round(1200 * dt);
    let visible = false, approaching = false;
    for (const roof of this.survivalRoofs) {
      const r = roof.bounds;
      const dx = Math.max(r.x - p.x, p.x - r.x - r.w, 0);
      const dy = Math.max(r.y - p.y, p.y - r.y - r.h, 0);
      const inside = dx === 0 && dy === 0;
      roof.opacity.opacity = inside ? Math.max(0, roof.opacity.opacity - fade) : Math.min(255, roof.opacity.opacity + fade);
      if (inside) this.survivalFocus = roof;
      const show = roof.opacity.opacity > 0 && dx <= W / 2 + 28 && dy <= H / 2 + 28;
      roof.opacity.node.active = show;
      visible ||= show;
      approaching ||= dx < W / 2 + 460 && dy < H / 2 + 460;
    }
    if (this.survivalFocus?.opacity.opacity === 255) this.survivalFocus = undefined;
    if (this.survivalRoofLayer.active !== visible) { this.survivalRoofLayer.active = visible; this.sightTick = 0; }
    if (approaching && !this.artFrames.has('survival-couch')) this.loadSurvivalBuildingArt('interior-furniture');
  }
  private buildSurvivalFloors(building: SurvivalBuilding, stair: SurvivalStair) {
    const stage = this.battle.stage;
    const bounds = [building.footprint, this.battle.rooms[stair.upperRoom]];
    const base = this.graphics('Underside of residence floors', this.floorArt);
    const lower = bounds[0];
    box(base, lower.x, lower.y, lower.w, lower.h, '#302c28');
    this.mapNodes.push(base.node);
    const floors: SurvivalFloorArt[] = [];
    bounds.forEach((r, index) => {
      const material = index && building.kind === 'shop' ? 'house' : building.kind;
      const floorFrame = this.artFrames.get('harbor-floor-' + material) ?? this.artFrames.get('survival-concrete');
      const parent = this.makeNode(index ? 'Residence 2F' : 'Residence 1F', this.floorArt);
      this.mapNodes.push(parent);
      if (index) parent.setPosition(-stair.offsetX, 0);
      const opacity = parent.addComponent(UIOpacity);
      opacity.opacity = index ? 0 : 255;
      parent.active = index === 0;
      if (floorFrame) {
        const floor = this.makeNode('Residence floorboards', parent);
        floor.setPosition(r.x + r.w / 2, r.y + r.h / 2);
        const sprite = this.setupSprite(floor, floorFrame, r.w, r.h);
        if (index) sprite.color = color('#b7aea0');
      } else box(this.graphics('Residence floor fallback', parent), r.x, r.y, r.w, r.h, '#655a4a');
      const blood = this.graphics('Residence blood', parent);
      const walls = building.walls.filter(w => (w.x > bounds[0].x + bounds[0].w + 10) === !!index);
      const furniture = building.furniture.filter(f => roomAt(f, [r]) >= 0);
      const raster = new Set<string>();
      for (const prop of furniture) {
        const frame = this.artFrames.get(prop.kind ?? '');
        if (!frame) continue;
        const node = this.makeNode(prop.kind ?? 'Furniture', parent);
        node.setPosition(prop.x + prop.w / 2, prop.y + prop.h / 2);
        this.setupSprite(node, frame, prop.w, prop.h);
        raster.add(prop.kind + ':' + prop.x + ':' + prop.y);
      }
      drawMap(this.graphics('Residence partitions', parent), 'fixtures', raster, {
        ...stage, walls: walls.filter(wall => wall.kind !== 'stair-rail'), furniture,
      });
      const roomIds = index ? [stair.upperRoom] : building.rooms.filter(room => room !== bounds[1])
        .map(room => stage.rooms.indexOf(room));
      const doorIds = this.battle.doors.filter(d => d.rooms.some(room => roomIds.includes(room))).map(d => d.id);
      for (const id of doorIds) this.survivalFloorDoors.add(id);
      floors.push({ bounds: r, opacity, doors: this.graphics('Residence doors', parent), doorIds, blood });
    });
    const flight = this.makeNode('Residence stair flight', this.floorArt);
    const r = stair.bounds;
    const frame = this.stairFrames.get('up');
    if (frame) {
      const sprite = this.setupSprite(flight, frame, r.w, r.h);
      sprite.color = color('#d2bda5');
    } else {
      const steps = this.graphics('Stair steps', flight);
      box(steps, -r.w / 2, -r.h / 2, r.w, r.h, '#473e33');
      for (let y = -r.h / 2; y < r.h / 2; y += 16) line(steps, -r.w / 2 + 10, y, r.w / 2 - 10, y, '#8c7b5d', 2);
    }
    flight.setPosition(r.x + r.w / 2, r.y + r.h / 2);
    const sign = (text: string, y: number) => {
      const node = this.makeNode(text, flight);
      node.setPosition(0, y);
      node.getComponent(UITransform)!.setContentSize(160, 27);
      const label = node.addComponent(Label);
      label.string = text; label.fontSize = 17; label.color = color('#ebd1a0');
      label.enableOutline = true; label.outlineColor = color('#30291e'); label.outlineWidth = 2;
      return node;
    };
    const upMarker = sign('上楼 ↑', -r.h / 2 - 23);
    const downMarker = sign('↓ 下楼', r.h / 2 + 23);
    this.mapNodes.push(flight);
    this.survivalFloorArt.push({ stair, floors, stairs: flight, upMarker, downMarker });
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
    this.survivalRoofs = [];
    this.harborScenery = [];
    this.harborGroundLayer = undefined;
    for (const tile of this.harborGround.values()) tile.node = undefined;
    this.survivalFloorArt = [];
    this.survivalFloorDoors.clear();
    for (const sprite of this.survivalDoorSprites.get(this.doorsLit) ?? []) {
      if (sprite.node.isValid) sprite.node.destroy();
    }
    this.survivalDoorSprites.clear();
    this.survivalFocus = undefined;
    if (this.survivalRoofLayer) this.survivalRoofLayer.active = false;
    this.apartmentDoors = [];
    this.getawaySprite = undefined;
    this.doorArtBattle = this.battle;
    this.doorArtStage = this.battle.stage;
    this.apartmentShutterSprite = undefined;
    const stage = this.battle.stage, upper = stage.dorm?.number === 2, lower = stage.dorm?.number === 1;
    this.setBattleRenderBudget(!!stage.survival, !!stage.operation && stage.operation.part !== 'compound');
    this.outdoorAllyLight.clear();
    this.lightCamera = undefined;
    this.outdoorLightTick = 0;
    this.outdoorLightPending = true;
    this.rasterProps.clear(); this.floors.clear(); this.fixtures.clear(); this.bloodArt.clear(); this.lastBloodRevision = -1;
    this.rebuildFloorDetails();
    const operation = stage.operation;
    if (stage.survival) {
      const tile = (id: string, x: number, y: number, w: number, h: number) => {
        const frame = this.artFrames.get(id);
        if (!frame) return;
        const node = this.makeNode(id, this.floorArt);
        node.setPosition(x + w / 2, y + h / 2);
        this.setupSprite(node, frame, w, h); this.mapNodes.push(node);
        this.harborScenery.push({ node, bounds: { x, y, w, h } });
        return node;
      };
      const margin = HARBOR_OVERVIEW_MARGIN * HARBOR_SCALE;
      const layout = tile('harbor-hd-overview', -margin, -margin, HARBOR_ART_WIDTH * HARBOR_SCALE + 2 * margin,
        HARBOR_ART_HEIGHT * HARBOR_SCALE + 2 * margin);
      if (!layout) box(this.floors, 0, 0, HARBOR_ART_WIDTH * HARBOR_SCALE, HARBOR_ART_HEIGHT * HARBOR_SCALE, '#414840');
      this.harborGroundLayer = this.makeNode('Streamed harbor ground', this.floorArt);
      this.mapNodes.push(this.harborGroundLayer);
      for (const resident of this.harborGround.values()) this.mountHarborChunk(resident);
      for (const building of stage.survival.buildings) {
        const bounds = building.footprint;
        for (const entry of building.entries) {
          const east = entry.baseAngle === Math.PI / 2;
          const north = !east && entry.y > bounds.y;
          const depth = building.kind === 'clinic' ? 46 : 30;
          const width = entry.length + 18;
          const x = east ? entry.x : entry.x - 9;
          const y = east ? entry.y - 9 : north ? entry.y : entry.y - depth;
          const doorstep = { x, y, w: east ? depth : width, h: east ? width : depth, kind: entry.name };
          const node = tile('harbor-hd-doorstep', x + (doorstep.w - width) / 2, y + (doorstep.h - depth) / 2, width, depth);
          if (node) node.angle = east ? 90 : north ? 180 : 0;
        }
        if (building.stair) {
          this.buildSurvivalFloors(building, building.stair);
          for (const r of [...building.walls, ...building.furniture]) this.rasterProps.add(r.kind + ':' + r.x + ':' + r.y);
          continue;
        }
        const material = 'harbor-floor-' + (building.kind === 'utility' ? 'warehouse' : building.kind);
        for (const room of building.rooms) {
          const id = this.artFrames.has(material) ? material : 'survival-concrete';
          if (!tile(id, room.x, room.y, room.w, room.h)) {
            const g = this.graphics('Harbor interior fallback', this.floorArt);
            box(g, room.x, room.y, room.w, room.h, '#64645a');
            this.mapNodes.push(g.node);
          }
        }
      }
      const radio = stage.survival.radio;
      const markings = this.graphics('Fort markings', this.propsArt);
      this.mapNodes.push(markings.node);
      markings.strokeColor = color('#f3cc80', 175);
      markings.lineWidth = 2;
      markings.circle(radio.x, radio.y, 42); markings.stroke();
      const workbench = stage.survival.workbench;
      markings.strokeColor = color('#9bbfa3', 164);
      markings.circle(workbench.x, workbench.y, 26); markings.stroke();
      this.buildSurvivalRoofs();
    } else if (operation) {
      const terrain = (id: string, x: number, y: number, w: number, h: number) => {
        const frame = this.streetFrames.get(id);
        if (!frame) return;
        const node = this.makeNode(id, this.floorArt);
        node.setPosition(x, y);
        const sprite = this.setupSprite(node, frame, w, h);
        this.mapNodes.push(node);
        return sprite.node;
      };
      const outside = operation.part !== 'compound', bounds = stage.rooms[0];
      const groundId = outside ? 'op-coastal-sand' : 'op-indoor';
      const tile = outside ? 384 : 464, padding = outside ? 2 : 0;
      for (let row = -padding; row < Math.ceil(bounds.h / tile) + 1; row++) {
        for (let col = -padding; col < Math.ceil(bounds.w / tile) + 1; col++) {
          const ground = terrain(groundId, (col + .5) * tile, (row + .5) * tile, tile, tile);
          ground?.setScale(col % 2 ? -1 : 1, row % 2 ? -1 : 1, 1);
        }
      }
      const chapelRunner = operation.chapel?.runner;
      if (chapelRunner?.kind) terrain(chapelRunner.kind, chapelRunner.x + chapelRunner.w / 2,
        chapelRunner.y + chapelRunner.h / 2, chapelRunner.w, chapelRunner.h);
      if (outside) {
        for (let row = -1; row <= Math.ceil(bounds.h / 1260); row++) for (const strip of OPERATION_SHORE_STRIPS) {
          if (!strip.alpha) continue;
          const scale = 1570 / 640;
          const shore = terrain(strip.id, -70 + (strip.x + strip.width / 2) * scale, (row + 0.5) * 1260, strip.width * scale, 1260);
          if (shore) {
            shore.setScale(1, row % 2 ? -1 : 1, 1);
            shore.getComponent(Sprite)!.color = color('#ffffff', strip.alpha);
          }
        }
        operation.roads.forEach((route, index) => {
          const width = [238, 178, 212, 165][index];
          const bed = this.graphics('Continuous street surface', this.floorArt);
          this.mapNodes.push(bed.node);
          for (const [extra, opacity] of [[32, 25], [12, 45], [0, 100]]) {
            bed.lineWidth = width + extra;
            bed.lineJoin = Graphics.LineJoin.ROUND; bed.lineCap = Graphics.LineCap.ROUND;
            bed.strokeColor = color('#c5af88', opacity);
            bed.moveTo(route[0].x, route[0].y);
            for (const point of route.slice(1)) bed.lineTo(point.x, point.y);
            bed.stroke();
          }
          route.slice(1).forEach((to, i) => {
            const from = route[i], length = Math.hypot(to.x - from.x, to.y - from.y);
            const segments = Math.ceil(length / 420);
            for (let piece = 0; piece < segments; piece++) {
              const fraction = (piece + 0.5) / segments;
              const strip = terrain('op-dusty-paving', from.x + (to.x - from.x) * fraction,
                from.y + (to.y - from.y) * fraction, length / segments + 70, width);
              if (strip) {
                strip.angle = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
                strip.setScale((i + piece) % 2 ? -1 : 1, 1, 1);
              }
            }
          });
        });
        const marker = this.graphics('Coastal pads', this.floorArt);
        marker.lineWidth = 4; marker.strokeColor = color('#eee1bd', 195);
        marker.circle(OPERATION_LZ.x, OPERATION_LZ.y, 156); marker.stroke();
        marker.moveTo(OPERATION_LZ.x - 45, OPERATION_LZ.y + 52);
        marker.lineTo(OPERATION_LZ.x - 45, OPERATION_LZ.y - 52);
        marker.moveTo(OPERATION_LZ.x + 45, OPERATION_LZ.y + 52);
        marker.lineTo(OPERATION_LZ.x + 45, OPERATION_LZ.y - 52);
        marker.moveTo(OPERATION_LZ.x - 45, OPERATION_LZ.y); marker.lineTo(OPERATION_LZ.x + 45, OPERATION_LZ.y); marker.stroke();
        if (operation.part === 'defense') {
          marker.strokeColor = color('#b7d2a0', 190);
          marker.circle(OPERATION_EXTRACT.x, OPERATION_EXTRACT.y, OPERATION_EXTRACT_RADIUS); marker.stroke();
        }
        this.mapNodes.push(marker.node);
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
      if (stage.survival && this.rasterProps.has(f.kind + ':' + f.x + ':' + f.y)) continue;
      const reversed = f.kind === 'garage-sedan-reverse' || f.kind === 'garage-suv-reverse';
      const art = f.kind === 'getaway-car' ? 'garage-suv' : f.kind === 'desk' ? 'lobby-desk' : f.kind === 'locker' || f.kind === 'cabinet' ? 'dorm-locker'
        : f.kind === 'sofa' && lower ? 'lobby-sofa' : reversed ? f.kind!.slice(0, -8) : f.kind;
      const roofTile = !!art && OPERATION_ROOF_TILES.has(art);
      const frame = (art && (this.streetFrames.get(art) ?? this.artFrames.get(art))) ||
        (roofTile ? this.streetFrames.get('op-roof') : undefined);
      if (!frame) continue;
      if (roofTile && this.streetFrames.has(art!)) {
        const clip = this.makeNode('Tiled roof ' + art, this.propsArt);
        clip.setPosition(f.x + f.w / 2, f.y + f.h / 2);
        clip.getComponent(UITransform)!.setContentSize(f.w, f.h);
        clip.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
        this.mapNodes.push(clip);
        const size = 232;
        for (let y = -f.h / 2; y < f.h / 2; y += size) for (let x = -f.w / 2; x < f.w / 2; x += size) {
          const tile = this.makeNode('Roof tile', clip);
          tile.setPosition(x + size / 2, y + size / 2);
          this.setupSprite(tile, frame, size, size);
        }
        this.rasterProps.add(f.kind + ':' + f.x + ':' + f.y);
        continue;
      }
      const node = this.makeNode('Prop ' + f.kind, this.propsArt); this.mapNodes.push(node);
      const angle = f.angle ?? 0, cos = Math.cos(angle), sin = Math.sin(angle);
      node.setPosition(f.x + (f.w * cos - f.h * sin) / 2, f.y + (f.w * sin + f.h * cos) / 2);
      const turn = f.kind === 'op-office-cabinet' ? f.w > f.h :
        f.h > f.w && !['apartment-pingpong', 'op-pickup', 'op-roof', 'op-cot', 'op-barrels'].includes(f.kind ?? '') &&
        (!f.angle || f.kind === 'op-wall-mid');
      const sprite = this.setupSprite(node, frame, turn ? f.h : f.w, turn ? f.w : f.h);
      sprite.trim = true;
      if (stage.survival) this.harborScenery.push({ node, bounds: f });
      node.angle = angle * 180 / Math.PI + (turn ? 90 : 0) + (reversed ? 180 : 0);
      if (f.kind === 'getaway-car') { this.getawaySprite = sprite; node.angle = -90; }
      this.rasterProps.add(f.kind + ':' + f.x + ':' + f.y);
    }
    if (!operation) drawMap(this.fixtures, 'fixtures', this.rasterProps, stage);
    const floor = stage.apartment?.part;
    const capLeft = this.streetFrames.get('op-wall-cap-left'), capMid = this.streetFrames.get('op-wall-mid');
    const capRight = this.streetFrames.get('op-wall-cap-right');
    if (operation && capLeft && capMid && capRight) {
      for (const wall of stage.walls) {
        if (wall.kind === 'op-roof' || wall.kind === 'op-sea') continue;
        const vertical = wall.h > wall.w;
        const length = vertical ? wall.h : wall.w, thickness = vertical ? wall.w : wall.h;
        const artHeight = Math.max(thickness, 34);
        const capWidth = artHeight * 110 / 153, midWidth = artHeight * 445 / 153;
        const cx = wall.x + wall.w / 2, cy = wall.y + wall.h / 2;
        const slice = (frame: SpriteFrame, offset: number, width: number) => {
          const node = this.makeNode('Operation wall slice', this.propsArt);
          node.setPosition(vertical ? cx : wall.x + offset, vertical ? wall.y + offset : cy);
          node.angle = vertical ? 90 : 0;
          this.setupSprite(node, frame, width, artHeight);
          this.mapNodes.push(node);
        };
        if (length <= capWidth * 2 + 12) { slice(capMid, length / 2, length); continue; }
        slice(capLeft, capWidth / 2, capWidth);
        const span = length - capWidth * 2;
        const count = Math.min(28, Math.max(1, Math.round(span / midWidth)));
        for (let i = 0; i < count; i++) slice(capMid, capWidth + (i + .5) * span / count, span / count);
        slice(capRight, length - capWidth / 2, capWidth);
      }
    } else {
      const wallFrame = operation ? this.streetFrames.get('op-wall') :
        floor === 'garage' || floor === 'home' ? this.streetFrames.get(floor + '-wall') : undefined;
      if (wallFrame) for (const wall of stage.walls) {
        if (wall.kind === 'op-roof' || wall.kind === 'op-sea') continue;
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
    const signedRooms = operation ? [] : stage.survival ? stage.rooms.filter((r, i) => i !== stage.survival!.streetRoom
      && !stage.survival!.buildings.some(building => building.stair && building.rooms.includes(r))) : stage.rooms;
    for (const [i, r] of signedRooms.entries()) {
      const bedroom = upper ? i >= 1 && i <= 3 : !lower && (i === 1 || i === 2);
      const frame = stage.apartment ? this.streetFrames.get('apartment-' + stage.apartment.floors[i]) : this.artFrames.get(lower && (i === 0 || i === 4 || i === 10) ? 'lobby-floor' : bedroom ? 'bedroom' : 'corridor');
      if (!stage.street && !stage.survival && frame) this.tileFloor(r, frame, floor === 'garage' || floor === 'home' ? 480 : 384, floor === 'garage' || floor === 'home' ? 320 : 384);
      const n = this.makeNode('Area sign ' + i, this.signsArt); this.mapNodes.push(n);
      if (stage.survival) this.harborScenery.push({ node: n, bounds: r });
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
    const size = this.battle.stage.operation && pose.rollFrame < 0 ? OPERATION_GHOST_SIZE / 82 : 1;
    return weaponMount(this.battle.player, pose.scale * size, this.hasPlayerArt(), this.battle.heroId, pose);
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
    const boarding = b.operationRun?.phase === 'boarding';
    const brute = b.apartment && this.streetFrames.get('brute');
    const injecting = b.operationRun?.phase === 'injection' ? b.operationRun.bossId : undefined;
    const spitter = this.artFrames.get('spitter');
    const nearby = b.enemies.filter(e => (e.hp > 0 || e.id === injecting) && (e.type === 'walker' || e.type === 'gunner' || e.type === 'spitter' && !!spitter || e.type === 'boss' && (!!brute || !!e.operationBoss)) && (!(b.stage.street || b.stage.operation || b.stage.survival) || b.sees(e, 35)));
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
    if (b.player.hp > 0 && !b.evacuationDrive && !boarding) {
      if (pose.rollFrame >= 0) { if (roll) show('player-roll', roll, b.player.x, b.player.y, pose.angle, b.player.hit > 0, true, true, pose.scale); }
      else if (player && [0, HEROINE_ID].includes(b.heroId)) {
        const sprite = show('player', player, b.player.x + pose.offsetX, b.player.y + pose.offsetY, pose.angle, b.player.hit > 0, true, false, pose.scale);
        if (b.stage.operation) sprite.node.getComponent(UITransform)!.setContentSize(OPERATION_GHOST_SIZE, OPERATION_GHOST_SIZE);
      }
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
    if (!b.evacuationDrive && !boarding && (operator || b.apartment)) for (const ally of b.allies) if (ally.hp > 0 || ally === b.apartment?.engineer) {
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
          transform.setContentSize(OPERATION_SOLDIER_SIZE.width, OPERATION_SOLDIER_SIZE.height); transform.setAnchorPoint(0.5, 0.32);
        } else if (engineer) {
          const transform = sprite.node.getComponent(UITransform)!;
          transform.setContentSize(armed ? 108 : 96, armed ? 54 : 64);
          transform.setAnchorPoint(armed ? 0.25 : 0.31, 0.5);
        }
      }
    }
    for (const e of nearby) {
      const model = paralyzedModelPosition(e, b.elapsed);
      if (e.type === 'spitter' && spitter) {
        const windup = e.windup > 0 && !e.stun && !e.paralysis && !e.disoriented;
        const angle = windup ? e.attackAngle : e.angle;
        const scale = (this.enemyPoses.get(e.id)?.scale ?? 1) * (windup ? 1 + .09 * (1 - e.windup / .7) : 1);
        const sprite = show('enemy-' + e.id, spitter, model.x, model.y, angle - Math.PI / 2, e.hit > 0, false, false, scale);
        const transform = sprite.node.getComponent(UITransform)!;
        transform.setContentSize(56, 56 * spitter.originalSize.height / spitter.originalSize.width);
        transform.setAnchorPoint(.5, .46);
        if (windup && e.hit <= 0) sprite.color = color('#c7f99d');
        continue;
      }
      if (e.operationBoss) {
        const leader = e.operationBoss === 'leader';
        const injection = e.id === injecting;
        const frame = this.streetFrames.get(injection ? 'op-rimelet-injection' : leader ? 'op-rimelet-human' : 'op-rimelet-mutated');
        if (frame) {
          const sway = injection ? 0.045 * Math.sin((b.operationRun?.phaseTime ?? 0) * 15) : 0;
          const slam = leader ? 0 : b.operationRun?.slam ?? 0;
          const jump = slam > 0 && slam < 0.55 ? 48 * Math.sin(Math.PI * slam / 0.55) : 0;
          const sprite = show('enemy-' + e.id, frame, model.x, model.y + jump, e.angle - Math.PI / 2 + sway, e.hit > 0);
          const transform = sprite.node.getComponent(UITransform)!;
          transform.setContentSize(OPERATION_UNIT_ART.width, OPERATION_UNIT_ART.height);
          transform.setAnchorPoint(0.5, OPERATION_UNIT_ART.anchorY);
        }
        continue;
      }
      const chargeFrame = e.charge && this.streetFrames.get('brute-charge');
      const variant = e.type === 'gunner' && (e.appearance === 1 ? this.streetFrames.get('op-gunner-helmet') :
        e.appearance === 2 ? this.streetFrames.get('op-gunner-scarf') : undefined);
      const opFrame = e.type === 'gunner' ? variant || this.streetFrames.get('op-gunner') :
        b.stage.operation?.part === 'defense' ? this.streetFrames.get('op-infected') : undefined;
      const timed = e.survivalVariant && this.timedSurvivalFrames.get(e.survivalVariant);
      const frame = opFrame || timed || (e.type === 'boss' ? chargeFrame || brute : this.artFrames.get('dorm-walker-' + e.appearance) ?? walker);
      if (!frame) continue;
      if (opFrame) {
        const sprite = show('enemy-' + e.id, frame, model.x, model.y, e.angle - Math.PI / 2, e.hit > 0, false, false, this.enemyPoses.get(e.id)?.scale || 1);
        const transform = sprite.node.getComponent(UITransform)!;
        transform.setContentSize(variant ? OPERATION_UNIT_ART.width : e.type === 'gunner' ? 52 : 60,
          variant ? OPERATION_UNIT_ART.height : e.type === 'gunner' ? 77 : 62);
        transform.setAnchorPoint(0.5, variant ? OPERATION_UNIT_ART.anchorY : 0.31);
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
      } else show('enemy-' + e.id, frame, model.x, model.y, e.angle, e.hit > 0, false, false,
        (this.enemyPoses.get(e.id)?.scale || 1) * (e.survivalVariant === 'overrun' ? 1.4 : e.survivalVariant === 'breaker' ? 1.18 : 1));
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
  private blackFade(g: Graphics, fraction: number) {
    g.clear();
    this.sbox(g, 0, 0, W, H, '#000000', Math.round(clamp(fraction, 0, 1) * 255));
  }
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
      if (this.transition || button.interactable === false) return;
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
  private toast(s: string, duration = this.mode === 'playing' ? 2.2 : 3.4, kind: NoticeKind = 'inspect') {
    if (s !== this.notice || this.noticeTime <= 0 || kind !== this.noticeKind) this.noticeSince = this.presentationTime;
    this.notice = s; this.noticeTime = duration; this.noticeKind = kind; this.uiTick = 0;
  }
  private resetInput() { this.survivalDoorHold = undefined; this.operationGrenadeTouch = undefined; this.operationGrenadeKey = false; this.mouseAimInput = false; this.aimAssist.reset(); this.sweeping = false; this.lastFacing = this.battle.player.angle; this.keys.clear(); this.mouseFire = this.mouseQueuedFire = false; this.moveTouch = this.aimTouch = -1; this.moving = this.aiming = false; this.aimRadius = 0; this.aimOuter = false; this.moveVector = { x: 0, y: 0 }; }
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
  private dismissUiLayer(layer: Node) {
    const within = (node: Node) => {
      for (let parent = node.parent; parent; parent = parent.parent) if (parent === layer) return true;
      return false;
    };
    this.buttons = this.buttons.filter(button => !within(button.node));
    for (const [id, label] of this.labels) if (within(label.node)) this.labels.delete(id);
    layer.active = false;
    layer.destroy();
  }
  private open(mode: Mode) {
    if (this.readerLayer) return;
    // A pending scene decision survives hide/pause requests. Only its actions
    // resolve it; unrelated menus must never silently accept or discard it.
    if (this.tutorialPrompt) mode = 'playing';
    this.artRefresh = undefined;
    if (mode === 'settings' && (this.mode === 'playing' || this.mode === 'pause')) this.battleSettings = true;
    if (mode !== 'settings' && mode !== 'help') this.battleSettings = false;
    if (this.reader.open || this.readerLayer) this.closeReader();
    if (mode !== 'street-loading') this.departure = undefined;
    if (mode === 'profile-info') this.profileEditor ??= { ...this.profile.identity, tab: 'dossier' };
    else this.profileEditor = undefined;
    this.clearGuide(!showsBattle(mode, this.battleSettings));
    this.mode = mode; this.resetInput(); this.sightTick = 0;
    this.requestModeArt(mode);
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
    if (mode !== 'street-loading' && !battleView) this.clearHarborStream();
    this.exitArrow.node.active = mode === 'playing';
    if (this.battleArtwork) { this.battleArtwork.active = false; this.battleArtwork.destroy(); this.battleArtwork = undefined; }
    this.playerStatus = this.noticeHud = this.promptHud = undefined;
    this.objectiveHud = undefined;
    this.operationBossHud = undefined;
    if (mode !== 'playing' && this.airborne) this.airborne.root.active = false;
    this.battleSticks = []; this.moveCap = undefined; this.capOffset = { x: 0, y: 0 }; this.hudActions = []; this.supplySlotNodes = [];
    this.homeBackdrop.active = !battleView;
    this.outputSprite.node.active = battleView;
    this.environmentCamera.enabled = battleView;
    this.actorCamera.enabled = battleView;
    if (mode !== 'playing') { this.feedback.suspend(); this.motion.suspend(); this.weaponEffects.clear(); }
    if (this.homeArtwork) { this.homeArtwork.active = false; this.homeArtwork.destroy(); this.homeArtwork = undefined; }
    if (this.profileLayer) { this.profileLayer.active = false; this.profileLayer.destroy(); this.profileLayer = this.profilePage = undefined; this.profileTabs = undefined; }
    if (this.chapterMap) { this.chapterMap.active = false; this.chapterMap.destroy(); this.chapterMap = undefined; }
    if (this.achievementsLayer) { this.achievementsLayer.active = false; this.achievementsLayer.destroy(); this.achievementsLayer = undefined; }
    if (this.missionLayer) { this.missionLayer.active = false; this.missionLayer.destroy(); this.missionLayer = undefined; }
    if (this.checkInLayer) { this.checkInLayer.active = false; this.checkInLayer.destroy(); this.checkInLayer = undefined; }
    this.checkInBadge = undefined;
    this.checkInPulse = undefined;
    if (mode !== 'checkin') this.checkInClaimFeedback = undefined;
    if (this.dialogArtwork) { this.dialogArtwork.active = false; this.dialogArtwork.destroy(); this.dialogArtwork = undefined; }
    if (this.harborMapLayer) { this.harborMapLayer.active = false; this.harborMapLayer.destroy(); this.harborMapLayer = undefined; }
    if (this.survivalBagLayer) {
      this.survivalBagLayer.active = false; this.survivalBagLayer.destroy();
      this.survivalBagLayer = undefined; this.survivalBagArt = undefined; this.survivalBagIcons = [];
      this.survivalBagSkin = this.survivalBagItemLayer = undefined; this.survivalBagSkinNodes = [];
    }
    this.survivalQuickOpen = this.survivalWorkshopOpen = false;
    this.survivalDoorPanel = undefined;
    if (this.battle.survival) this.suppliesOpen = false;
    this.survivalHeldItem = undefined; this.survivalCrateId = undefined; this.survivalDrag = undefined;
    this.survivalVehiclePanel = this.survivalAmmo = this.survivalSwap = undefined;
    this.survivalRotatePreview = undefined;
    if (this.shopLayer) { this.shopLayer.active = false; this.shopLayer.destroy(); this.shopLayer = undefined; }
    if (this.caseLayer) { this.caseLayer.active = false; this.caseLayer.destroy(); this.caseLayer = undefined; }
    if (mode !== 'cases') this.casePreview = this.caseRoll = this.caseReel = undefined;
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
    if (mode === 'menu' || mode === 'profile-info' || mode === 'checkin' || mode === 'backpack') {
      this.refreshCheckInRewards();
      this.buildMenu();
      if (mode === 'profile-info') {
        for (const button of this.buttons) button.node.getComponent(Button)!.interactable = false;
        this.buildProfileInfo();
      }
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
    else if (isSurvivalMenu(mode)) this.buildSurvivalSelection();
    else if (mode === 'survival-radio') this.buildSurvivalRadio();
    else if (mode === 'survival-map') this.buildSurvivalMap();
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
    if (!this.chapterUnlocked(chapter)) { this.toast(CHAPTERS[chapter].locked); return; }
    this.selectedChapter = chapter;
    this.sortieHero = HERO_IDS.find(id => this.sortieAllowed(id)) ?? HEROINE_ID;
    this.open('select-hero');
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
    if (!this.campaignSprite(root, 'satellite-map', W / 2, H / 2, W, H)) {
      this.sbox(this.graphics('Satellite fallback', root), 0, 0, W, H, '#24302c');
    }
    if (!this.campaignSprite(root, 'map-frame', W / 2, H / 2, W, H)) {
      this.campaignLabel(root, 'map-title', '探索地图', 50, 669, 33, 280);
      this.campaignLabel(root, 'map-return', '返回首页', 1238, 674, 20, 180, C.text, Label.HorizontalAlign.RIGHT);
    }
    for (const chapter of [1, 2, 3, 4] as const) {
      const { name, location } = CHAPTERS[chapter];
      const locked = !this.chapterUnlocked(chapter);
      const y = 544 - (chapter - 1) * 111, tint = locked ? '#babdc0' : '#f4d297';
      this.campaignSprite(root, 'chapter-card', 1060, y, 344, 92);
      const preview = this.campaignSprite(root, `chapter-${chapter}`, 949, y, 86, 54);
      if (locked && preview) preview.color = color('#6e7478');
      if (locked) this.campaignSprite(root, 'lock', 949, y, 20, 25, true);
      this.campaignLabel(root, 'map-chapter-' + chapter, name, 1009, y + 13, 24, 196, tint);
      this.campaignLabel(root, 'map-location-' + chapter, locked ? '尚未解锁' : location, 1009, y - 15, 16, 194, tint);
      if (this.mode === 'chapters') this.addButton('chapter-' + chapter, 891, y - 46, 340, 92, () => this.showChapter(chapter));
    }
    if (this.mode === 'chapters') {
      this.addButton('map-back', 1052, 645, 219, 64, () => this.open('menu'));
    } else {
      this.sbox(this.graphics('Dimmed campaign map', root), 0, 0, W, H, '#000000', 147);
      this.buildSortiePicker(root);
    }
  }
  private sortieAllowed(id: HeroId, chapter = this.selectedChapter) {
    const cast: readonly HeroId[] = CHAPTERS[chapter].cast;
    return cast.includes(id) && (chapter === 4 || this.profile.owned[id]);
  }
  private closeSurvivalPicker() {
    this.open(this.profile.survivalMaps[this.selectedSurvivalMap] ? 'survival-resume' : 'survival-entry');
  }
  private dispatchSortie() {
    if (this.mode === 'select-hero' && this.sortieAllowed(this.sortieHero)) this.startBattle(this.selectedChapter);
    if (this.mode === 'survival-hero' && this.profile.owned[this.survivalHero]) this.loadSurvivalDeparture(this.selectedSurvivalMap, this.survivalHero);
  }
  private buildSortiePicker(root: Node, survival = false) {
    const center = Label.HorizontalAlign.CENTER, right = Label.HorizontalAlign.RIGHT;
    const id = survival ? this.survivalHero : this.sortieHero, p = this.profile, hero = heroes[id], kit = p.armory.kits[id];
    const operation = !survival && this.selectedChapter === 4;
    const allowedHero = (candidate: HeroId) => survival ? p.owned[candidate] : this.sortieAllowed(candidate);
    const art = this.campaignSprite(root, 'hero-frame', 640, 359, 1116, 628);
    const text = (key: string, value: string, x: number, y: number, size: number, w: number, tint = C.text, align = Label.HorizontalAlign.LEFT) =>
      this.campaignLabel(root, 'sortie-' + key, value, x, y, size, w, tint, align);
    this.campaignSprite(root, 'team', 187, 600, 66, 52, true);
    text('title', '选择战斗角色', 233, 598, 32, 278, '#ffdf9f');
    const title = survival ? SURVIVAL_MAPS[this.selectedSurvivalMap].name : CHAPTERS[this.selectedChapter].name + (operation ? '  ·  联合作战' : '  ·  单人行动');
    text('chapter', title, 1008, 593, 18, 280, C.text, right);
    if (!art) text('close-label', '×', 1108, 601, 35, 55, C.gold, center);
    this.addButton('sortie-close', 1076, 568, 72, 67, () => survival ? this.closeSurvivalPicker() : this.open('chapters'));

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
      const x = 482 + i * 148, y = 382, active = id === candidate, allowed = allowedHero(candidate);
      this.campaignSprite(root, active ? 'hero-active' : 'hero-card', x, y, 128, 177);
      const face = this.trainingFrames.get(`${TRAINING_PROFILES[candidate].key}-face`);
      if (face) {
        const avatar = this.campaignSprite(root, face, x, y + 14, 101, 105, true);
        if (avatar && !allowed) avatar.color = color('#858487');
      }
      text('hero-' + candidate, heroes[candidate].name, x, y - 51, 19, 110, active ? '#ffe0a1' : '#d7cec2', center);
      if (!allowed) {
        this.campaignSprite(root, 'lock', x - 41, y - 72, 13, 15, true);
        text('blocked-' + candidate, operation ? '未参与行动' : !survival && p.owned[candidate] ? '本关限定凛' : '尚未解锁', x + 8, y - 72, 13, 88, '#c4b59e', center);
      } else {
        this.addButton('sortie-hero-' + candidate, x - 64, y - 88, 128, 176, () => {
          if (!allowedHero(candidate) || active) return;
          if (survival) { this.survivalHero = candidate; this.open('survival-hero'); }
          else { this.sortieHero = candidate; this.open('select-hero'); }
        });
      }
    }
    if (!survival) text('restriction', operation ? '剧情指定  ·  幽灵行动组' : '剧情指定  ·  仅凛可出战', 642, 251, 18, 417, '#e7c891', center);
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
    if (allowedHero(id)) this.addButton('sortie-start', 838, 122, 270, 65, () => this.dispatchSortie());
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
  private profilePortrait(id: HeroId) {
    return this.trainingFrames.get(`${TRAINING_PROFILES[id].key}-face`) ??
      (id === HEROINE_ID ? this.linPortrait ?? this.homeFrames.get('profile_panel') : id === GHOST_ID ? this.ghostPortrait : undefined);
  }
  private canRefreshProfileArt() {
    return this.mode === 'profile-info' && !this.profileEditor?.editing;
  }
  private buildProfileInfo() {
    const root = this.profileLayer = this.makeNode('Survivor dossier', this.modal);
    const left = 100, bottom = 57, width = 1080, height = 606, right = left + width, top = bottom + height;
    const shade = this.graphics('Dossier backdrop', root);
    this.sbox(shade, 0, 0, W, H, '#07090a', 182);
    if (!this.campaignSprite(root, 'profile-shell', W / 2, H / 2, width, height) &&
        !this.campaignSprite(root, 'profile-panel', W / 2, H / 2, width, height)) {
      this.sbox(shade, left, bottom, width, height, '#171918');
      this.soutline(shade, left, bottom, width, height, '#9d7952');
    }
    const close = () => this.open('menu');
    for (const [index, [x, y, w, h]] of [[0, 0, W, bottom], [0, top, W, H - top],
      [0, bottom, left, height], [right, bottom, W - right, height]].entries()) {
      this.addButton('profile-outside-' + index, x, y, w, h, close, root);
    }
    this.campaignLabel(root, 'profile-title', '账号信息', 248, 621, 30, 216, '#fee6be');
    this.text('profile-title-sub', 'ACCOUNT', 249, 591, 14, '#c0a77f', root, 140).isBold = true;
    this.campaignLabel(root, 'profile-close-label', '×', 1127, 592, 39, 51, '#ffce81', Label.HorizontalAlign.CENTER);
    this.addButton('profile-close', 1096, 563, 62, 55, close, root);

    const nav = this.graphics('Account navigation fallback', root);
    const tabAt = (key: 'dossier' | 'settings', title: string, y: number) => {
      const art = this.campaignSprite(root, 'plate', 239, y, 160, 53);
      if (!art) this.sbox(nav, 159, y - 26, 160, 52, '#302d29');
      this.campaignLabel(root, 'profile-tab-' + key + '-text', title, 249, y, 22, 100, '#e3cfaa', Label.HorizontalAlign.CENTER);
      this.addButton('profile-tab-' + key, 160, y - 26, 158, 52, () => this.showProfilePage(key), root);
      return art;
    };
    this.profileTabs = [tabAt('dossier', '档案', 507), tabAt('settings', '设置', 441)];
    this.renderProfilePage();
  }
  private showProfilePage(tab: NonNullable<Blackout['profileEditor']>['tab']) {
    if (!this.profileEditor || tab === this.profileEditor.tab) return;
    this.profileEditor.tab = tab;
    this.renderProfilePage();
  }
  private renderProfilePage() {
    const editor = this.profileEditor!, panel = this.profileLayer!;
    if (this.profilePage) this.dismissUiLayer(this.profilePage);
    const root = this.profilePage = this.makeNode('Account page', panel);
    this.profileTabs?.forEach((sprite, i) => {
      const active = i === 0 ? editor.tab === 'dossier' : editor.tab !== 'dossier';
      const frame = this.campaignFrames.get(active ? 'plate-active' : 'plate');
      if (sprite && frame) sprite.spriteFrame = frame;
      const label = this.labels.get(i === 0 ? 'profile-tab-dossier-text' : 'profile-tab-settings-text');
      if (label) label.color = color(active ? '#ffde9e' : '#bcb1a1');
    });
    const details = this.graphics('Dossier controls', root), center = Label.HorizontalAlign.CENTER, right = Label.HorizontalAlign.RIGHT;
    const text = (id: string, value: string, x: number, y: number, size: number, w: number, tint = '#ddd3bf', align = Label.HorizontalAlign.LEFT) =>
      this.text('profile-' + id, value, x, y, size, tint, root, w, align);
    const button = (id: string, title: string, x: number, y: number, w: number, h: number, action: () => void, active = false) => {
      const art = this.campaignSprite(root, active ? 'plate-active' : 'plate', x + w / 2, y + h / 2, w, h);
      if (!art) {
        this.sbox(details, x, y, w, h, active ? '#49371f' : '#25282a');
        this.soutline(details, x, y, w, h, active ? '#ebb570' : '#73614b', 233);
      }
      text(id + '-text', title, x + w / 2, y + h / 2, 18, w - 10, active ? '#ffdda0' : '#ddceba', center).isBold = true;
      const hit = this.addButton('profile-' + id, x, y, w, h, action, root);
      if (art) this.setButtonArtwork(hit, art.node);
    };
    if (editor.tab === 'guide') {
      text('guide-title', '操作说明', 365, 549, 25, 245, '#f4d8a6').isBold = true;
      button('guide-back', '返回设置', 976, 526, 134, 39, () => this.showProfilePage('settings'));
      CONTROL_GUIDE.forEach(([name, mobile, desktop], i) => {
        const y = 491 - i * 44;
        this.sbox(details, 362, y - 19, 752, 39, i % 2 === 0 ? '#242526' : '#202121');
        text('guide-topic-' + i, name, 375, y, 15, 105, '#f0d4a2');
        text('guide-touch-' + i, mobile, 484, y, 14, 310);
        text('guide-key-' + i, desktop, 797, y, 14, 305);
      });
      text('guide-tip', '木门可破坏，锁住的铁门需钥匙。Esc / P 暂停。', 375, 126, 15, 695, '#b8aa92');
      return;
    }
    if (editor.tab === 'settings') {
      text('settings-title', '设置', 363, 549, 26, 250, '#f4d8a6').isBold = true;
      const options = [
        ['sound', '音效', '游戏音效'],
        ['aimAssist', '轻辅助瞄准', '仅手机主动瞄准时生效'],
        ['autoFire', '自动开火', '准星对准可见目标时自动射击'],
      ] as const;
      options.forEach(([key, title, hint], i) => {
        const y = 480 - i * 89, enabled = this.profile[key];
        this.sbox(details, 363, y - 36, 750, 72, '#252626');
        this.soutline(details, 363, y - 36, 750, 72, '#51483d');
        text(key, title, 389, y + 13, 20, 310, '#edcf9d');
        text(key + '-hint', hint, 389, y - 14, 15, 520);
        button(key, enabled ? '已开启' : '已关闭', 940, y - 21, 142, 42, () => {
          if (key === 'autoFire') this.toggleAutoFire();
          else { this.profile[key] = !enabled; this.save(); }
          this.renderProfilePage();
        }, enabled);
      });
      button('guide', '操作说明', 364, 153, 179, 46, () => this.showProfilePage('guide'));
      return;
    }

    const unlocked = 1 + Number(this.profile.streetUnlocked) + Number(this.profile.apartmentUnlocked) + Number(this.profile.owned[ENGINEER_ID]);
    const banner = this.campaignSprite(root, 'profile-banner', 737, 498, 758, 146);
    banner?.node.setSiblingIndex(0);
    if (!banner) this.sbox(details, 358, 425, 758, 146, '#282828');
    this.soutline(details, 358, 425, 758, 146, '#6c5941', 195);
    this.sbox(details, 378, 446, 105, 105, '#2b2c2e');
    const headingFrame = this.campaignFrames.get('hero-active');
    const avatar = this.profilePortrait(editor.avatar);
    if (headingFrame) this.campaignSprite(root, headingFrame, 431, 498, 115, 115);
    if (avatar) this.campaignSprite(root, avatar, 431, 498, 96, 96, true);
    this.soutline(details, 378, 446, 105, 105, '#bb864e', 188);
    const displayName = text('display-name', profileName(editor.name), 505, 536, 29, 423, '#fff0d7');
    displayName.isBold = true;
    text('local', '本地档案', 506, 501, 16, 154, '#c0a786');
    text('progress', '关卡解锁', 506, 466, 15, 108, '#f2cc91');
    this.sbox(details, 604, 459, 392, 9, '#141414', 242);
    this.sbox(details, 604, 459, 392 * unlocked / 4, 9, '#e6af58');
    text('progress-value', `${unlocked} / 4`, 1086, 464, 17, 87, '#f7daab', right);

    this.sbox(details, 358, 274, 435, 135, '#222324');
    this.soutline(details, 358, 274, 435, 135, '#544a3d');
    text('avatar-heading', '头像', 376, 390, 19, 100, '#f2d2a0').isBold = true;
    HERO_IDS.forEach((id, i) => {
      const x = 376 + i * 107, active = id === editor.avatar;
      if (!this.campaignSprite(root, active ? 'hero-active' : 'hero-card', x + 45.5, 327.5, 97, 91)) {
        this.sbox(details, x, 286, 91, 83, active ? '#3c3022' : '#292d2e');
        this.soutline(details, x, 286, 91, 83, active ? '#ffc376' : '#685a46');
      }
      const frame = this.profilePortrait(id);
      if (frame) this.campaignSprite(root, frame, x + 45, 333, 61, 61, true);
      text('avatar-' + id, heroes[id].name, x + 45, 298, 14, 79, active ? '#ffe0a4' : '#cbc2b2', center);
      if (active) text('avatar-selected', '✓', x + 76, 352, 17, 18, '#ffcf79', center).isBold = true;
      this.addButton('profile-avatar-' + id, x, 286, 91, 83, () => {
        if (editor.avatar === id) return;
        editor.avatar = id; this.renderProfilePage();
      }, root);
    });

    const entries = [
      ['战役进度', `${unlocked} / 4 关已解锁`, 'badge-chapter'],
      ['已解锁角色', `${HERO_IDS.filter(id => this.profile.owned[id]).length} / ${HERO_IDS.length}`, 'badge-growth'],
      ['累计击杀', this.profile.achievementProgress.kills.toLocaleString('zh-CN'), 'badge-combat'],
    ] as const;
    entries.forEach(([title, value, badge], i) => {
      const y = 371 - i * 67;
      this.sbox(details, 810, y - 25, 306, 51, '#282727');
      this.soutline(details, 810, y - 25, 306, 51, '#51483c');
      this.campaignSprite(root, badge, 837, y, 32, 32, true);
      text('field-' + i, title, 862, y, 17, 121, '#d7bc91');
      text('value-' + i, value, 1101, y, 17, 133, '#f1cc92', right);
    });

    text('name-label', '昵称', 375, 246, 19, 110, '#f2d2a0').isBold = true;
    this.sbox(details, 358, 179, 435, 49, '#222728');
    this.soutline(details, 358, 179, 435, 49, '#9b7953');
    const input = this.makeNode('Profile nickname input', root);
    input.active = false;
    input.setPosition(575.5 - W / 2, 203.5 - H / 2);
    input.getComponent(UITransform)!.setContentSize(408, 49);
    const label = this.text('profile-nickname', editor.name, W / 2, H / 2, 20, '#f4e9d7', input, 400);
    const placeholder = this.text('profile-nickname-placeholder', '输入昵称', W / 2, H / 2, 19, '#b9ab95', input, 400);
    label.node.getComponent(UITransform)!.setAnchorPoint(0, 1);
    placeholder.node.getComponent(UITransform)!.setAnchorPoint(0, 1);
    const nickname = input.addComponent(EditBox);
    nickname.textLabel = label; nickname.placeholderLabel = placeholder;
    nickname.inputMode = EditBox.InputMode.SINGLE_LINE;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    nickname.maxLength = PROFILE_NAME_LIMIT * 2;
    nickname.placeholder = '输入昵称';
    nickname.string = editor.name;
    const syncName = () => { editor.name = nickname.string; displayName.string = profileName(editor.name); };
    input.on(EditBox.EventType.EDITING_DID_BEGAN, () => { editor.editing = true; }, this);
    input.on(EditBox.EventType.EDITING_DID_ENDED, () => { editor.editing = false; syncName(); }, this);
    input.on(EditBox.EventType.TEXT_CHANGED, syncName, this);
    input.active = true;
    button('save', '保存档案', 360, 114, 195, 48, () => {
      const identity = { name: profileName(nickname.string), avatar: editor.avatar };
      const next = { ...this.profile, identity };
      if (!this.persist(next)) { this.toast('保存失败，请重试'); return; }
      this.profile = next;
      editor.name = identity.name;
      nickname.string = identity.name;
      syncName();
      const homeName = this.labels.get('home-profile');
      if (homeName) homeName.string = identity.name;
      const homeAvatar = this.profilePortrait(identity.avatar);
      if (this.homeProfileAvatar && homeAvatar) this.homeProfileAvatar.spriteFrame = homeAvatar;
      text('saved', '档案已保存', 579, 138, 15, 159, '#f1ce99');
    }, true);
  }
  private buildMenu() {
    this.homeArtwork = this.makeNode('Home artwork', this.modal);
    const roster = () => this.showRoster('menu', HEROINE_ID);
    const shop = () => { this.shopBack = 'menu'; this.shopProduct = undefined; this.open('shop'); };
    const recruit = () => this.showRecruit('menu');
    this.sbox(this.modalArt, 0, H - 72, W, 72, '#070b0e', 167);
    this.sline(this.modalArt, 0, H - 72, W, H - 72, '#6b6354', 1, 105);
    this.homePlate(21, 654, 290, 55);
    const avatar = this.profilePortrait(this.profile.identity.avatar);
    this.homeProfileAvatar = undefined;
    if (avatar) {
      this.homeProfileAvatar = this.campaignSprite(this.homeArtwork, avatar, 53, 682, 46, 46, true);
      this.trainingSprite('frame', this.homeArtwork, 53, 682, 57, 55);
    } else {
      this.text('home-avatar', heroes[this.profile.identity.avatar].name, 53, 680, 15, C.gold, this.modal, 49, Label.HorizontalAlign.CENTER);
    }
    this.text('home-profile', this.profile.identity.name, 94, 690, 17, '#f0e6d4', this.modal, 216);
    this.text('home-hero', '本地档案', 94, 667, 15, C.gold, this.modal, 194);
    this.addButton('profile', 21, 652, 290, 59, () => this.open('profile-info'));

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
      const width = 434, height = width * mode.height / mode.width;
      const artwork = this.homeTile(mode.id, mode.art, mode.title, 821, mode.top, width, height,
        () => this.open(mode.id === 'start' ? 'chapters' : 'survival-entry'), true, MODE_EDGE_ANGLE - mode.edgeAngle);
      if (mode.id === 'survival' && artwork && SURVIVAL_MAP_IDS.some(id => !!this.profile.survivalMaps[id])) this.text('survival-status', '可继续', W / 2 + width / 2 - 34,
        H / 2 + height / 2 - 34, 15, '#e5d6bc', artwork, 100, Label.HorizontalAlign.RIGHT);
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
  private caseButton(id: string, value: string, x: number, y: number, w: number, h: number, action?: () => void, active = false, size = 20, parent = this.caseLayer!) {
    const art = this.caseArt(active ? 'button-gold' : 'button-dark', x, y, w, h, false, parent);
    this.caseText(id, value, x, y, size, w - 20, action ? '#fff0cd' : '#a29482', Label.HorizontalAlign.CENTER, parent);
    if (action) {
      const button = this.addButton('case-' + id, x - w / 2, y - h / 2, w, h, action, parent);
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
    this.caseButton('back', '返回', 1210, 673, 108, 50, () => this.backFromCases(), false, 19);
    if (this.casePreview) { this.buildCasePreview(this.casePreview); return; }

    const id = pending?.caseId ?? this.selectedCase;
    CASE_IDS.forEach((boxId, i) => {
      const y = 516 - i * 143;
      this.caseArt(boxId === id ? 'card-3' : 'card-0', 109, y, 166, 129);
      this.caseArt(`${boxId}-closed`, 109, y + 24, 131, 90, true);
      this.caseText(boxId, CASES[boxId].name, 109, y - 41, 19, 148, boxId === id ? '#ffda8e' : '#e7dcce');
      this.addButton('case-box-' + boxId, 26, y - 64, 166, 128, () => {
        if (boxId === id) return;
        this.selectedCase = boxId; this.open('cases');
      });
    });
    const closed = this.caseArt(`${id}-closed`, 659, 509, 410, 283, true);
    const opened = this.caseArt(`${id}-open`, 659, 509, 410, 283, true);
    if (closed) closed.active = !pending;
    if (opened) opened.active = !!pending;

    this.caseArt('card-0', 1104, 508, 267, 139);
    this.caseText('box-name', CASES[id].name, 1104, 545, 25, 247, '#ffdb94');
    CASES[id].lines.forEach((value, i) => this.caseText('box-info-' + i, value, 1104, 507 - 23 * i, 15, 242));
    this.caseButton('preview', '掉落预览', 1146, 404, 160, 42, () => {
      this.casePreview = { page: 0 }; this.open('cases');
    }, false, 17);

    const reel = this.caseReel = this.buildCaseTrack(id, pending);
    reel.closed = closed; reel.opened = opened;
    const x = 740;
    reel.openButtonArt = this.caseArt('button-dark', x, 99, 282, 84);
    this.caseText('open-label-1', '开一次', x, 112, 27, 230);
    this.caseArt('key', x - 21, 82, 24, 19, true);
    this.caseText('cost-1', '×1', x + 20, 82, 16, 56);
    const button = this.addButton('case-open-1', x - 141, 57, 282, 84, () => this.startCaseOpening());
    if (reel.openButtonArt) this.setButtonArtwork(button, reel.openButtonArt);
    this.caseText('key-source', `探索通关 +${CLEAR_CASE_KEYS} 把   /   领取每日任务 +${DAILY_CASE_KEYS} 把`, 732, 38, 15, 660, '#d9c2a1');
    this.setCaseControls(!pending);
    if (pending) reel.result = this.buildCaseResults(pending);
  }
  private buildCaseTrack(id: CaseId, settled?: CaseOpening): CaseReel {
    const x = 740, y = 264, width = 1018, height = 188;
    this.caseArt('tray', x, y, width + 18, height + 24);
    const clip = this.makeNode('Case roll viewport', this.caseLayer!);
    clip.setPosition(x - W / 2, y - H / 2);
    clip.getComponent(UITransform)!.setContentSize(width, height);
    clip.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    const track = this.makeNode('Case roll track', clip);
    const cx = W / 2, cy = H / 2, center = Label.HorizontalAlign.CENTER;
    const cards = Array.from({ length: CASE_RADIUS * 2 + 1 }, (_, slot): CaseReelCard => {
      const node = this.makeNode('Reel card ' + slot, track);
      const plate = this.caseArt('card-0', cx, cy, 141, 153, false, node)?.getComponent(Sprite) ?? undefined;
      const title = this.caseText('reel-name-' + slot, '', cx, cy - 34, 16, 137, '#f5e5ca', center, node);
      const caption = this.caseText('reel-quality-' + slot, '', cx, cy - 55, 14, 130, '#ddd0b8', center, node);
      return { node, title, caption, plate };
    });
    const previous = this.caseReel?.id === id ? this.caseReel : undefined;
    const position = previous?.position ?? 0;
    const winner = settled ? { index: Math.round(position), prize: casePrize(id, settled.rewards[0].id)! } : previous?.winner;
    const reel = { id, track, cards, position, winner, speed: settled ? 0 : previous?.speed ?? CASE_IDLE_SPEED };
    this.renderCaseTrack(reel);
    this.caseArt('pointer', x, y, 36, 209);
    return reel;
  }
  private renderCaseTrack(reel: CaseReel) {
    const center = Math.floor(reel.position), pool = CASE_POOLS[reel.id], count = reel.cards.length;
    // Keep coordinates near the viewport and recycle cards a full slot outside the mask.
    reel.track.setPosition(-(reel.position - center) * CASE_PITCH, 0);
    for (let offset = -CASE_RADIUS; offset <= CASE_RADIUS; offset++) {
      const index = center + offset, card = reel.cards[(index % count + count) % count];
      card.node.setPosition(offset * CASE_PITCH, 0);
      if (card.index === index) continue;
      card.index = index;
      const prize = reel.winner?.index === index ? reel.winner.prize : pool[((index + 2) % pool.length + pool.length) % pool.length];
      const quality = prize.type === 'mod' ? prize.quality : 0;
      const frame = this.caseFrames.get(`card-${quality}`);
      if (card.plate && frame) card.plate.spriteFrame = frame;
      if (card.icon) { card.icon.active = false; card.icon.destroy(); }
      const icon = card.icon = this.makeNode('Case prize art', card.node);
      icon.setSiblingIndex(1);
      this.caseIcon(prize, W / 2, H / 2 + 16, 113, 75, icon);
      card.title.string = prize.title;
      card.caption.string = this.caseCaption(prize);
      card.caption.color = color(prize.type === 'mod' ? QUALITY_COLORS[quality] : '#ddd0b8');
    }
  }
  private setCaseControls(enabled: boolean) {
    for (const { node } of this.buttons) node.getComponent(Button)!.interactable = enabled;
    const affordable = enabled && this.profile.cases.keys >= 1;
    const art = this.caseReel?.openButtonArt?.getComponent(Sprite);
    const frame = this.caseFrames.get(affordable ? 'button-gold' : 'button-dark');
    if (art && frame) art.spriteFrame = frame;
    const label = this.labels.get('cases-open-label-1'), cost = this.labels.get('cases-cost-1');
    if (label) label.color = color(affordable ? '#fff0cd' : '#ae9e89');
    if (cost) cost.color = color(affordable ? '#ffdda0' : '#ae9e89');
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
    const panel = this.makeNode('Case reward overlay', this.caseLayer!);
    const shade = this.graphics('Reward backdrop', panel);
    this.sbox(shade, 0, 0, W, H, '#080c0e', 100);
    const single = opening.rewards.length === 1, center = single ? 1040 : W / 2;
    const text = (id: string, value: string, x: number, y: number, size: number, width: number, tint?: string) =>
      this.caseText(id, value, x, y, size, width, tint, Label.HorizontalAlign.CENTER, panel);
    this.caseArt('tray', center, single ? 409 : 352, single ? 395 : 1190, single ? 441 : 548, false, panel);
    text('result-title', '开箱奖励', center, 583, 30, single ? 335 : 555, '#ffdc96');
    text('result-box', CASES[opening.caseId].name, center, 547, 16, 290, '#d4bc99');
    opening.rewards.forEach((reward, i) => {
      const prize = casePrize(opening.caseId, reward.id)!;
      const x = single ? center : 186 + i % 5 * 227, y = single ? 405 : 422 - Math.floor(i / 5) * 195;
      const tint = prize.type === 'mod' ? QUALITY_COLORS[prize.quality] : '#ead9b9';
      this.caseArt(`card-${prize.type === 'mod' ? prize.quality : 0}`, x, y, single ? 333 : 214, single ? 260 : 176, false, panel);
      this.caseIcon(prize, x, y + (single ? 39 : 36), single ? 170 : 143, single ? 106 : 71, panel);
      text('reward-' + i, prize.title, x, y - (single ? 32 : 15), single ? 24 : 19, single ? 313 : 195);
      text('quality-' + i, this.caseCaption(prize), x, y - (single ? 62 : 37), single ? 19 : 16, 193, tint);
      if (reward.mod) modDescription(reward.mod).split(' · ').forEach((value, line) =>
        text(`reward-stat-${i}-${line}`, value, x, y - (single ? 85 : 54) - 15 * line, single ? 16 : 13, single ? 311 : 199, tint));
    });
    this.caseButton('done', '确认', center, single ? 231 : 109, 211, 55, () => this.backFromCases(), true, 21, panel);
    return panel;
  }
  private startCaseOpening() {
    const reel = this.caseReel;
    if (!reel || this.caseRoll || this.casePreview || reel.result) return;
    if (!reel.opened || !reel.closed || !this.caseFrames.has('tray')) { this.toast('开箱素材加载中'); return; }
    const transaction = prepareCaseOpening(this.profile, this.selectedCase, 1);
    if ('reason' in transaction) {
      if (transaction.reason === 'pending') { this.open('cases'); return; }
      this.toast(transaction.reason === 'keys' ? '钥匙不足 · 开一次需要 1 把钥匙' :
        transaction.reason === 'mods' ? '配件空间不足 · 请预留 1 格，可在武器改装中分解配件' : '有奖励库存接近上限，请先消耗一部分再开箱');
      return;
    }
    if (!this.persist(transaction.profile)) { this.toast('本地存档写入失败，请重试'); return; }
    this.profile = transaction.profile;
    const start = reel.position, stop = Math.ceil(start) + 33;
    reel.winner = { index: stop, prize: casePrize(reel.id, transaction.opening.rewards[0].id)! };
    this.caseRoll = { opening: transaction.opening, elapsed: 0, start, stop, entryRate: reel.speed / (stop - start) };
    this.labels.get('cases-keys')!.string = String(this.profile.cases.keys);
    this.setCaseControls(false);
  }
  private stepCaseRoll(dt: number) {
    const reel = this.caseReel;
    if (!reel || this.casePreview || reel.result) return;
    const roll = this.caseRoll;
    if (!roll) {
      const speed = Math.min(CASE_IDLE_SPEED, reel.speed + dt * .88);
      reel.position += (reel.speed + speed) * .5 * dt;
      reel.speed = speed;
      this.renderCaseTrack(reel);
      return;
    }
    const previous = Math.round(reel.position);
    roll.elapsed += dt;
    reel.position = roll.elapsed >= CASE_ROLL_TIME ? roll.stop :
      roll.start + (roll.stop - roll.start) * caseRollProgress(roll.elapsed, roll.entryRate);
    this.renderCaseTrack(reel);
    if (Math.round(reel.position) !== previous) {
      const click = this.clips.get('reload');
      if (click && this.profile.sound) this.audio.playOneShot(click, .075);
    }
    if (roll.elapsed < CASE_ROLL_TIME) return;
    reel.speed = 0;
    if (reel.closed) reel.closed.active = false;
    if (reel.opened) reel.opened.active = true;
    if (roll.elapsed < CASE_ROLL_TIME + CASE_HOLD) return;
    this.caseRoll = undefined;
    this.play(roll.opening.rewards.some(reward => (reward.mod?.quality ?? 0) >= 2) ? 'win' : 'hit');
    reel.result = this.buildCaseResults(roll.opening);
  }
  private backFromCases() {
    if (this.caseRoll) return;
    if (this.casePreview) { this.casePreview = undefined; this.open('cases'); return; }
    if (this.profile.cases.pending) {
      const next = { ...this.profile, cases: { keys: this.profile.cases.keys } };
      if (!this.persist(next)) { this.toast('本地存档写入失败，请重试'); return; }
      this.selectedCase = this.profile.cases.pending.caseId;
      this.profile = next;
      const reel = this.caseReel;
      if (reel?.result) {
        this.dismissUiLayer(reel.result);
        reel.result = undefined;
        if (reel.closed) reel.closed.active = true;
        if (reel.opened) reel.opened.active = false;
        this.setCaseControls(true);
      } else this.open('cases');
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
    CONTROL_GUIDE.forEach((r, i) => { const y = 477 - i * 45; this.text('help-a' + i, r[0], 146, y, 18, C.gold, this.modal, 200); this.text('help-b' + i, r[1], 350, y, 17, C.text, this.modal, 420); this.text('help-c' + i, r[2], 780, y, 16, C.muted, this.modal, 370); this.sline(this.modalArt, 145, y - 21, 1135, y - 21, C.line, 1, 100); });
    this.text('help-tip', '木门可被子弹打坏，锁住的铁门需要钥匙。宿管室门上的警报会引来丧尸。Esc / P 暂停。', 146, 123, 16, C.muted);
  }
  private loadSurvivalUi() {
    const sheets = ['frame', 'bag', 'controls', 'landscapes'] as const;
    let remaining = sheets.length;
    for (const sheet of sheets) resources.load(`survival/survival-ui-${sheet}-v3/spriteFrame`, SpriteFrame, (err, frame) => {
      if (!this.isValid) return;
      if (err) console.warn('Survival interface artwork could not load:', sheet, err);
      else {
        frame.packable = false;
        if (sheet === 'controls') {
          SURVIVAL_UI_CONTROLS.forEach(([id, w, h], i) => {
            const x = (i % 3) * 240 + (240 - w) / 2, y = Math.floor(i / 3) * 160 + (160 - h) / 2;
            this.survivalUiFrames.set(id, this.cropUiFrame(frame, x, y, w, h));
          });
        } else if (sheet === 'landscapes') {
          this.survivalUiFrames.set('port', this.cropUiFrame(frame, 0, 0, 1152, 648));
          this.survivalUiFrames.set('base', this.cropUiFrame(frame, 0, 648, 1152, 648));
        } else this.survivalUiFrames.set(sheet, frame);
      }
      if (--remaining === 0) {
        if (this.mode === 'survival-resume' || this.mode === 'result' && this.battle.survival) this.open(this.mode);
        else this.uiTick = 0;
      }
    });
  }
  private loadTimedSurvivalArt() {
    if (this.timedSurvivalArtLoading || this.timedSurvivalFrames.size) return;
    this.timedSurvivalArtLoading = true;
    resources.load('survival/timed-survival-v1/spriteFrame', SpriteFrame, (err, source) => {
      if (!this.isValid) return;
      this.timedSurvivalArtLoading = false;
      if (err) { console.warn('Timed survival artwork could not load:', err); return; }
      for (const [id, x, y, w, h] of TIMED_SURVIVAL_ATLAS) this.timedSurvivalFrames.set(id, this.cropUiFrame(source, x, y, w, h));
      const head = this.timedSurvivalFrames.get('headquarters')!;
      this.streetFrames.set('survival-headquarters', head);
      this.uiTick = 0;
    });
  }
  private survivalUiSprite(parent: Node, id: string, x: number, y: number, w: number, h: number, fit = false) {
    const frame = this.survivalUiFrames.get(id);
    if (frame) return this.campaignSprite(parent, frame, x, y, w, h, fit);
    return undefined;
  }
  private survivalDialog(bounds: Rect, backdrop: 'port' | 'base') {
    const root = this.dialogArtwork = this.makeNode('Survival dialog', this.modal);
    const { x, y, w, h } = bounds;
    const cx = x + w / 2, cy = y + h / 2;
    this.noticeTime = 0;
    this.sbox(this.modalArt, 0, 0, W, H, '#08090b', 181);
    const frame = this.survivalUiFrames.get('frame') ?? this.dialogFrame;
    const clip = this.makeNode('Dialog illustration clip', root);
    clip.setPosition(cx - W / 2, cy - H / 2);
    const mask = clip.addComponent(Mask);
    mask.type = Mask.Type.GRAPHICS_STENCIL;
    const halfWidth = (w - 28) / 2, halfHeight = (h - 26) / 2, bevel = 35;
    polygon(mask.subComp as Graphics, [
      { x: -halfWidth + bevel, y: -halfHeight }, { x: halfWidth - bevel, y: -halfHeight },
      { x: halfWidth, y: -halfHeight + bevel }, { x: halfWidth, y: halfHeight - bevel },
      { x: halfWidth - bevel, y: halfHeight }, { x: -halfWidth + bevel, y: halfHeight },
      { x: -halfWidth, y: halfHeight - bevel }, { x: -halfWidth, y: -halfHeight + bevel },
    ], '#ffffff');
    const art = this.survivalUiSprite(clip, backdrop, W / 2, H / 2, w - 28, h - 26);
    const fallback = this.campaignFrames.get('departure-brief');
    if (!art && fallback) this.campaignSprite(clip, fallback, W / 2, H / 2, w - 28, h - 26);
    if (frame) this.campaignSprite(root, frame, cx, cy, w, h);
    return root;
  }
  private survivalDialogButton(parent: Node, action: DialogAction, x: number, y: number, w: number, h: number, primary = false) {
    const enabled = action.enabled !== false;
    const skin = this.survivalUiFrames.get(primary ? 'primary' : 'secondary') ?? this.campaignFrames.get('departure-brief');
    if (skin) {
      const art = this.campaignSprite(parent, skin, x + w / 2, y + h / 2, w, h)!;
      if (!enabled) art.color = color('#777777');
    }
    this.campaignLabel(parent, 'button-' + action.id, action.label, x + w / 2, y + h / 2 + 1,
      25, w - 27, enabled ? primary ? '#ffe4a6' : '#f0eee9' : '#9c9b93', Label.HorizontalAlign.CENTER);
    if (enabled) this.addButton(action.id, x, y, w, h, action.run, parent);
  }
  private survivalDialogClose(parent: Node, bounds: Rect, action: () => void) {
    const x = bounds.x + bounds.w - 40, y = bounds.y + bounds.h - 37;
    if (!this.survivalUiSprite(parent, 'close', x, y, 47, 47)) {
      this.campaignLabel(parent, 'dialog-close', '×', x, y, 27, 44, C.gold, Label.HorizontalAlign.CENTER);
    }
    this.addButton('close', x - 22, y - 22, 44, 44, action, parent);
  }
  private survivalDialogPlate(parent: Node, x: number, y: number, w: number, h: number, tint = '#c4c2bd') {
    const sprite = this.campaignSprite(parent, 'departure-brief', x, y, w, h);
    if (sprite) sprite.color = color(tint);
  }
  private buildSurvivalSelection() {
    this.loadHarborMapArt();
    const root = this.chapterMap = this.makeNode('Survival map selection', this.modal);
    root.setSiblingIndex(0);
    const draft = this.campaignFrames.get('harbor-selection');
    const backdrop = draft ?? this.harborOverviewFrame() ?? this.campaignFrames.get('satellite-map');
    if (backdrop) this.campaignSprite(root, backdrop, W / 2, H / 2, W, W * backdrop.originalSize.height / backdrop.originalSize.width);
    else this.sbox(this.graphics('Survival map backdrop', root), 0, 0, W, H, '#24302c');
    const frame = this.campaignSprite(root, 'map-frame', W / 2, H / 2, W, H);
    if (!this.campaignSprite(root, 'departure-brief', 292, 678, 511, 75)) {
      this.missionPlate(this.graphics('Survival map header', root), 37, 640, 510, 75, '#1d2121', '#a48960', 15);
    }
    this.campaignLabel(root, 'survival-map-title', '生存地图', 65, 677, 31, 290);
    if (!frame) this.campaignLabel(root, 'map-return', '返回首页', 1238, 674, 20, 180, C.text, Label.HorizontalAlign.RIGHT);
    for (const [index, id] of SURVIVAL_MAP_IDS.entries()) {
      const y = 531 - index * 112, save = this.profile.survivalMaps[id];
      if (!this.campaignSprite(root, 'chapter-card', 1043, y, 380, 98)) {
        this.missionPlate(this.graphics('Survival map card', root), 853, y - 49, 380, 98, '#212524', '#987c54', 12);
      }
      const overview = draft ?? this.harborOverviewFrame();
      if (overview) this.campaignSprite(root, overview, 918, y, 93, 62);
      this.campaignLabel(root, 'survival-name-' + id, SURVIVAL_MAPS[id].name, 981, y + 17, 25, 230, '#f4d297');
      this.campaignLabel(root, 'survival-status-' + id, save ? '可继续 · 已存活 ' + this.time(save.elapsed) : '沿岸港口 · 搜刮与撤离',
        981, y - 17, 17, 230);
      if (this.mode === 'survival-entry') this.addButton('survival-map-' + id, 853, y - 49, 380, 98, () => {
        this.selectedSurvivalMap = id;
        this.survivalHero = HEROINE_ID;
        this.open(this.profile.survivalMaps[id] ? 'survival-resume' : 'survival-hero');
      });
    }
    if (this.mode === 'survival-entry') {
      this.addButton('survival-back', 1052, 645, 219, 64, () => this.open('menu'));
    } else if (this.mode === 'survival-hero') {
      this.sbox(this.graphics('Dimmed survival map', root), 0, 0, W, H, '#000000', 147);
      this.buildSortiePicker(root, true);
    } else {
      const id = this.selectedSurvivalMap, save = this.profile.survivalMaps[id];
      if (!save) { this.open('survival-hero'); return; }
      this.buildSurvivalResume(id, save);
    }
  }
  private buildSurvivalResume(id: SurvivalMapId, save: SurvivalCheckpoint) {
    const root = this.survivalDialog(SURVIVAL_RESUME_PANEL, 'port');
    const center = Label.HorizontalAlign.CENTER;
    this.survivalDialogClose(root, SURVIVAL_RESUME_PANEL, () => this.open('survival-entry'));
    this.survivalUiSprite(root, 'harbor-mark', 513, 516, 82, 66, true);
    this.campaignLabel(root, 'survival-dialog-title', SURVIVAL_MAPS[id].name, 558, 515, 46, 350, '#ffd37a');
    this.survivalDialogPlate(root, 707, 429, 619, 61);
    this.campaignLabel(root, 'survival-brief', '存活 ' + this.time(save.elapsed),
      513, 430, 20, 152, '#fff0d4', center);
    const portrait = this.trainingFrames.get(`${TRAINING_PROFILES[save.hero].key}-face`);
    if (portrait) this.campaignSprite(root, portrait, 679, 430, 36, 36, true);
    this.campaignLabel(root, 'survival-saved-hero', heroes[save.hero].name, 747, 430, 21, 86, '#f8ead2', center);
    this.campaignLabel(root, 'survival-saved-status', '已保存', 906, 430, 22, 143, '#a6e78b', center);
    for (const [i, x] of [607, 808].entries()) this.campaignLabel(root, 'survival-saved-divider-' + i, '│', x, 430, 28, 22, '#a78b59', center);
    this.survivalDialogPlate(root, 724, 331, 584, 91);
    this.campaignLabel(root, 'survival-save-warning', '提示', 455, 364, 19, 90, '#f8c664');
    this.text('survival-save-note', '新局成功保存后，将替换本地图的旧存档。', 456, 328, 20, '#f1dfbd', root, 525);
    this.survivalDialogButton(root, { id: 'survival-continue', label: '»  继续本局', run: () => this.loadSurvivalDeparture(id, save.hero, save) },
      332, 181, 282, 69, true);
    this.survivalDialogButton(root, { id: 'survival-restart', label: '↻  重新开始', run: () => this.open('survival-hero') },
      662, 181, 282, 69);
  }
  private prepareSurvivalArt(point: { x: number; y: number }) {
    this.loadHarborMapArt();
    this.loadSurvivalGearArt();
    this.loadTimedSurvivalArt();
    for (const [name, parts] of OPERATION_ART) {
      if (name !== 'aircraft' && name !== 'littlebird-black' || parts.every(([key]) => this.streetFrames.has(key))) continue;
      resources.load('chapter4/' + name + '/spriteFrame', SpriteFrame, (err, frame) => {
        if (this.isValid && !err) for (const [key, x, y, w, h] of parts) {
          if (!this.streetFrames.has(key)) this.streetFrames.set(key, this.cropUiFrame(frame, x, y, w, h));
        }
      });
    }
    if (!this.survivalCrateFrames.size) resources.load('survival/gear-crates/spriteFrame', SpriteFrame, (err, source) => {
      if (err || !this.isValid || this.survivalCrateFrames.size) return;
      const crops = [[69, 147, 466, 347], [675, 144, 505, 350], [72, 743, 464, 312], [631, 649, 570, 454]] as const;
      (['medical', 'armory', 'engineering', 'airdrop'] as const).forEach((kind, i) => {
        const [x, y, w, h] = crops[i];
        this.survivalCrateFrames.set(kind, this.cropUiFrame(source, x, y, w, h));
      });
      this.survivalCrateFrames.set('dropped', this.survivalCrateFrames.get('engineering')!);
    });
    this.streamHarbor(point, true);
    for (const atlas of ['harbor-floors', 'harbor-furniture', 'interior-furniture'] as const) this.loadSurvivalBuildingArt(atlas);
  }
  private loadSurvivalGearArt() {
    if (this.survivalGearArtPending || this.survivalGearArtReady) return;
    this.survivalGearArtPending = true;
    let left = 8;
    const load = (name: string, mount: (frame: SpriteFrame) => void) => {
      resources.load('survival/' + name + '/spriteFrame', SpriteFrame, (error, frame) => {
        if (!this.isValid) return;
        if (error) console.warn('Survival asset unavailable:', name, error);
        else mount(frame);
        if (--left === 0) { this.survivalGearArtPending = false; this.survivalGearArtReady = true; }
      });
    };
    load('gear-ui-v2', frame => {
      const crops = [[15, 172, 646, 378], [754, 135, 438, 441], [13, 839, 603, 208], [643, 777, 596, 305]] as const;
      (['panel', 'slot', 'button', 'tooltip'] as const).forEach((key, i) => {
        const [x, y, w, h] = crops[i];
        const f = this.cropUiFrame(frame, x, y, w, h);
        if (key === 'panel' || key === 'tooltip') {
          f.insetLeft = f.insetRight = 45;
          f.insetTop = f.insetBottom = 43;
        }
        this.survivalSkin.set(key, f);
      });
    });
    load('tactical-fire-v1', frame => {
      this.survivalGearFrames.set('molotov', this.cropUiFrame(frame, 8, 8, 240, 240));
      this.survivalFireFrames = [[264, 8], [8, 264], [264, 264]].map(([x, y]) => this.cropUiFrame(frame, x, y, 240, 240));
    });
    load('gear-parts-v2', frame => {
      const pieces = [
        ['sentry-bracket', 568, 20, 120, 382], ['sentry-base', 891, 99, 310, 224],
        ['mine', 487, 481, 280, 288], ['shock-mine', 904, 481, 282, 290], ['medical-stock', 39, 924, 342, 248],
        ['tactical-stock', 453, 911, 346, 274], ['tactical-module', 897, 898, 298, 290],
      ] as const;
      for (const [kind, x, y, w, h] of pieces) this.survivalGearFrames.set(kind, this.cropUiFrame(frame, x, y, w, h));
    });
    load('fort-workbench', frame => {
      this.artFrames.set('survival-craft-bench', this.cropUiFrame(frame, 92, 51, 1595, 796));
    });
    load('gear-scanner', frame => this.survivalGearFrames.set('scanner', this.cropUiFrame(frame, 174, 36, 672, 1415)));
    load('gear-sentry-overhead', frame => {
      this.survivalGearFrames.set('sentry-barrel', this.cropUiFrame(frame, 77, 273, 936, 210));
      this.survivalGearFrames.set('sentry', this.cropUiFrame(frame, 1204, 38, 901, 630));
    });
    load('door-leaves', frame => {
      const crops = [[72, 92, 2033, 94], [73, 257, 2031, 100], [72, 424, 2033, 97], [72, 586, 2033, 97]] as const;
      SURVIVAL_DOOR_KINDS.forEach((kind, i) => {
        const [x, y, w, h] = crops[i];
        this.survivalDoorFrames.set(kind, this.cropUiFrame(frame, x, y, w, h));
      });
    });
    load('door-materials', frame => {
      this.survivalGearFrames.set('door-wood', this.cropUiFrame(frame, 41, 149, 558, 391));
      this.survivalGearFrames.set('door-metal', this.cropUiFrame(frame, 666, 111, 528, 446));
      this.survivalGearFrames.set('door-brace', this.cropUiFrame(frame, 38, 708, 548, 474));
    });
  }
  private drawSurvivalDoorSurfaces(g: Graphics, doors: Door[]) {
    let sprites = this.survivalDoorSprites.get(g);
    if (!sprites) { sprites = []; this.survivalDoorSprites.set(g, sprites); }
    let count = 0;
    for (const door of doors) {
      const frame = door.fortification && this.survivalDoorFrames.get(door.fortification);
      if (!frame || door.destroyed) continue;
      const sprite = sprites[count] ??= this.setupSprite(this.makeNode('Fitted survival door leaf', g.node), frame, door.length, door.thickness);
      count++;
      if (sprite.spriteFrame !== frame) sprite.spriteFrame = frame;
      sprite.node.getComponent(UITransform)!.setContentSize(door.length, door.thickness);
      sprite.node.setPosition(door.x + Math.cos(door.angle) * door.length / 2, door.y + Math.sin(door.angle) * door.length / 2);
      sprite.node.angle = door.angle * 180 / Math.PI;
      sprite.color = color(door.hit > 0 ? '#ffddb0' : door.hp < door.maxHp * .35 ? '#b29b84' : '#ffffff');
      sprite.node.active = true;
    }
    for (let i = count; i < sprites.length; i++) sprites[i].node.active = false;
    drawDoors(g, doors, this.battle.alarmTime, door => !!door.fortification && this.survivalDoorFrames.has(door.fortification));
  }
  private loadSurvivalDeparture(mapId: SurvivalMapId, id: HeroId, save?: SurvivalCheckpoint, seed = save?.seed ?? Math.floor(Math.random() * 0x100000000)) {
    if (!this.profile.owned[id]) return;
    this.loadCampaignArt('survival-entry');
    this.requestArt('combat', () => this.loadCombatArt());
    this.loadSampleArt(true);
    this.requestArt('survival-world', () => this.loadSurvivalArt());
    this.requestArt('survival-ui', () => this.loadSurvivalUi());
    const level = SURVIVAL_MAPS[mapId].createLevel(seed);
    const point = this.survivalEntryPoint(level, save);
    const returnTo = this.mode;
    const mapPoint = ({ x, y }: { x: number; y: number }) => ({
      x: x / (HARBOR_SCALE * HARBOR_ART_WIDTH), y: y / (HARBOR_SCALE * HARBOR_ART_HEIGHT),
    });
    const convoyWindow = `第 ${CONVOY_ARRIVAL / 60} 分钟到南门，第 ${CONVOY_LEAVE / 60} 分钟撤离。`;
    const routes: DeparturePage[] = [
      { heading: '01 / 05　装甲车队', point: mapPoint(CONVOY_BOARD),
        lines: ['三条路线，完成任意一条即可撤离。', '车队' + convoyWindow] },
      { heading: '02 / 05　黑鹰直升机', point: mapPoint(EVAC_VEHICLES.helicopter.point),
        lines: ['按地图线索，到各街区室内搜集五个黑鹰部件。', '回营地装好后加油，守住停机坪就能登机。'] },
      { heading: '03 / 05　港口快艇', point: mapPoint(EVAC_VEHICLES.boat.access),
        lines: ['按地图线索，到各街区室内搜集五个快艇部件。', '到港口木桥尽头装好，守到加油完成后登船。'] },
      { heading: '04 / 05　搜刮与血月', point: mapPoint(harborPoint(968, 588)),
        lines: [`血月第 ${BLOOD_MOON / 60} 分钟开始，趁早搜集补给、加固工事。`, `尸群会进楼搜人，最迟第 ${SURVIVAL_DEADLINE / 60} 分钟撤离。`] },
      { heading: '05 / 05　工事工作台', point: mapPoint(level.survival!.workbench),
        lines: ['在工作台制作弹药、道具和哨械枪。', '架枪守入口，房门要到门边加固。'] },
    ];
    const load = this.beginDeparture({
      title: SURVIVAL_MAPS[mapId].name, area: save ? '港区 · 已存活 ' + this.time(save.elapsed) : '沿岸港口',
      heading: '撤离路线速览 · 三选一', point: mapPoint(CONVOY_BOARD),
      lines: ['车队' + convoyWindow, '黑鹰 / 快艇：装齐五个部件，加油后登乘。'],
      pages: save ? undefined : routes,
      map: () => this.campaignFrames.get('harbor-selection'),
      avatar: () => this.timedSurvivalFrames.get('headquarters') ?? this.campaignFrames.get('liaison'),
      repeated: !!save, returnTo, survey: true,
    }, () => this.loadSurvivalDeparture(mapId, id, save, seed), () => this.launchSurvival(mapId, id, save, level));
    this.prepareSurvivalArt(point);
    load.progress = () => this.survivalLoadProgress(id, point);
  }
  private survivalLoadProgress(id: HeroId, point: { x: number; y: number }) {
    this.pumpHarborStream();
    const art = id === HEROINE_ID ? 'heroine' : 'operator';
    const nearbyReady = HARBOR_CHUNKS.every(bounds => {
      const [dx, dy] = harborDistanceToChunk(point, bounds);
      return dx > W / 2 + 24 || dy > H / 2 + 24 || !!this.harborGround.get(bounds.kind)?.frame;
    });
    const groups = [this.presentationReady && this.artFrames.has(art) && this.artFrames.has('walker'),
      this.harborArtReady, this.survivalGearArtReady, nearbyReady, this.artFrames.has('harbor-floor-house'),
      this.artFrames.has('survival-radio-harbor'), this.artFrames.has('survival-couch'),
      this.timedSurvivalFrames.has('carrier') && this.streetFrames.has('op-blackhawk') && this.streetFrames.has('op-littlebird')];
    return groups.filter(Boolean).length / groups.length;
  }
  private launchSurvival(mapId: SurvivalMapId, id: HeroId, save?: SurvivalCheckpoint,
    level = SURVIVAL_MAPS[mapId].createLevel(save?.seed ?? Math.floor(Math.random() * 0x100000000))) {
    const battle = new Battle(id, this.profile.levels[id], level, profileGrowth(this.profile, id), this.profile.armory);
    battle.survivalActiveLimit = sys.isMobile ? 54 : 86;
    if (save) battle.restoreSurvival(save);
    else if (!this.saveSurvivalCheckpoint(battle)) return false;
    this.battle = battle;
    this.convoyTurretAngles.clear();
    this.fallTime = 0; this.suppliesOpen = false; this.replayTutorial = false;
    this.enterBattleScene(1);
    if (save && save.layout !== SURVIVAL_LAYOUT) {
      if (this.saveSurvivalCheckpoint()) this.toast('已转入港区工事 · 保留奖励和背包', 5);
    }
    return true;
  }
  private survivalEntryPoint(level: LevelDefinition, save?: SurvivalCheckpoint) {
    if (!save || save.layout !== SURVIVAL_LAYOUT) return level.spawn;
    const { x, y } = save.position;
    if (x >= 0 && x <= HARBOR_ART_WIDTH * HARBOR_SCALE && y >= 0 && y <= HARBOR_ART_HEIGHT * HARBOR_SCALE) return { x, y };
    const upper = level.survival?.stairs.find(stair => roomAt(save.position, [level.rooms[stair.upperRoom]]) >= 0);
    return upper ? { x: x - upper.offsetX, y } : level.spawn;
  }
  private saveSurvivalCheckpoint(battle = this.battle) {
    const checkpoint = battle.survivalCheckpoint(), id = battle.stage.survival?.mapId;
    if (!checkpoint || !id) return false;
    const next = { ...this.profile, survivalMaps: { ...this.profile.survivalMaps, [id]: checkpoint } };
    if (!this.persist(next)) {
      if (this.mode !== 'street-loading') this.toast('本机存档写入失败，请重试');
      return false;
    }
    this.profile = next;
    return true;
  }
  private buildSurvivalRadio() {
    const b = this.battle, run = b.survival!;
    const close = () => this.open('playing');
    this.dialog('工事电台', [
      { id: 'survival-evac-map', label: '打开港区地图', run: () => this.open('survival-map') },
      { id: 'survival-save-exit', label: '暂停本局', run: () => {
        if (b.survivalAtRadio && this.saveSurvivalCheckpoint()) this.open('menu');
      } },
    ], close);
    this.dialogText('survival-pool', `当前奖励池　金币 ${run.pool.coins}　材料 ${run.pool.materials}`, W / 2, 443, 23, 690, '#ffd282');
    this.dialogText('survival-extract-payout', '撤离路线 · 工事黑鹰 / 港口快艇 / 装甲车队', W / 2, 405, 20, 680);
    b.doors.slice(0, 2).forEach((door, i) => this.dialogText('survival-gate-' + i,
      `${door.name}　${SURVIVAL_DOORS[door.fortification ?? 'wood'].title}　${door.destroyed ? '已破坏' : Math.ceil(door.hp) + ' / ' + door.maxHp}`,
      W / 2, 370 - i * 27, 18, 680, door.destroyed ? '#ef987f' : '#ecd4ae'));
    this.button('survival-deposit', run.salvage ? `存入战利品 · +${run.salvage} 金币` : '存入战利品', 522, 281, 236, () => {
      if (b.depositSurvivalSalvage()) { this.saveSurvivalCheckpoint(); this.open('survival-radio'); }
    }, false, run.salvage > 0, 42, '背包里没有可存入的战利品');
  }
  private buildPause() {
    const resume = () => this.open('playing');
    if (this.battle.survival) {
      this.dialog('生存行动暂停', [
        { id: 'resume', label: '继续行动', run: resume },
        { id: 'survival-console', label: '工事电台', enabled: this.battle.survivalAtRadio, run: () => this.open('survival-radio') },
      ], resume);
      this.dialogText('pause-tip', '回到工事电台可撤离或保存后离开。', W / 2, 391, 22, 660);
      return;
    }
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
  private harborOverviewFrame() {
    if (!this.harborMapFrame) {
      const overview = this.artFrames.get('harbor-hd-overview');
      if (!overview) return;
      const margin = HARBOR_OVERVIEW_MARGIN;
      this.harborMapFrame = this.cropUiFrame(overview, margin, margin, HARBOR_ART_WIDTH, HARBOR_ART_HEIGHT);
    }
    return this.harborMapFrame;
  }
  private harborMapSprite(parent: Node, x: number, y: number, w: number, h: number) {
    const frame = this.harborOverviewFrame();
    if (!frame) return;
    const node = this.makeNode('Harbor district overview', parent);
    node.setPosition(x + w / 2 - W / 2, y + h / 2 - H / 2);
    return this.setupSprite(node, frame, w, h);
  }
  private buildSurvivalMap() {
    this.panel('港区地图', '北 ↑', () => this.open('playing'));
    const layer = this.harborMapLayer = this.makeNode('Harbor map', this.modal);
    const x = 132, y = 104, w = 648, h = 432;
    const project = (east: number, south: number) => ({
      x: x + east * w / HARBOR_ART_WIDTH,
      y: y + h - south * h / HARBOR_ART_HEIGHT,
    });
    this.harborMapSprite(layer, x, y, w, h);
    const markers = this.graphics('Harbor map markers', layer);
    this.soutline(markers, x, y, w, h, C.line);
    for (const [name, east, south] of HARBOR_MAP_REGIONS) {
      const q = project(east, south);
      const supplied = this.battle.survivalRestock?.zones.includes(HARBOR_MAP_REGIONS.findIndex(region => region[0] === name));
      disc(markers, q.x - W / 2, q.y - H / 2, supplied ? 4 : 3, supplied ? C.jade : C.gold);
      this.dialogText('harbor-region-' + name, supplied ? name + ' · 补给' : name, q.x, q.y + 14, 16, 125, supplied ? '#b9ebdb' : '#ffdda0', true);
    }
    const b = this.battle, p = b.player;
    const drops = b.survivalCrates.filter(crate => crate.kind === 'airdrop' && crate.goods.length);
    if (b.survival?.timed) {
      const pins = [{ ...EVAC_VEHICLES.helicopter.access, name: '黑鹰' }, { ...EVAC_VEHICLES.boat.access, name: '快艇' },
        { ...CONVOY_BOARD, name: '车队' }];
      for (const pin of pins) {
        const q = project(pin.x / HARBOR_SCALE, HARBOR_ART_HEIGHT - pin.y / HARBOR_SCALE);
        disc(markers, q.x - W / 2, q.y - H / 2, 4, '#ffc98a');
        this.dialogText('harbor-evac-' + pin.name, pin.name, q.x + 25, q.y + 8, 13, 60, '#ffc98a', true);
      }
      for (const part of b.survivalField.filter(item => item.id.startsWith('evac-') || item.kind === 'evac-fuel')) {
        const q = project(part.x / HARBOR_SCALE, HARBOR_ART_HEIGHT - part.y / HARBOR_SCALE);
        this.sbox(markers, q.x - 3, q.y - 3, 6, 6, '#f5ad75');
      }
      this.text('harbor-parts-legend', '■ 燃油 / 地面部件', 817, 469, 15, '#f5ad75');
    }
    if (b.stage.survival) {
      const workbench = b.stage.survival.workbench, mark = project(workbench.x / HARBOR_SCALE, HARBOR_ART_HEIGHT - workbench.y / HARBOR_SCALE);
      this.sbox(markers, mark.x - 4, mark.y - 4, 8, 8, '#98e0ca');
      this.dialogText('harbor-workbench-pin', '工作台', mark.x - 31, mark.y + 13, 14, 66, '#b7f3df', true);
    }
    for (const [i, point] of drops.entries()) {
      const q = project(point.x / HARBOR_SCALE, HARBOR_ART_HEIGHT - point.y / HARBOR_SCALE);
      this.sbox(markers, q.x - 3, q.y - 3, 6, 6, '#f6a967');
      this.dialogText('harbor-airdrop-' + i, '空投', q.x, q.y - 14, 13, 110, '#ffc182', true);
    }
    const q = project((p.x - (b.survivalUpperFloor?.offsetX ?? 0)) / HARBOR_SCALE, HARBOR_ART_HEIGHT - p.y / HARBOR_SCALE);
    disc(markers, q.x - W / 2, q.y - H / 2, 7, '#122022');
    disc(markers, q.x - W / 2, q.y - H / 2, 4, C.jade);
    this.text('harbor-position-key', '● 你的位置', 817, 503, 18, C.jade);
    this.text('harbor-loot-title', '撤离配件线索', 817, 433, 23, C.gold);
    const leads = b.survivalEvacLeads;
    this.text('harbor-loot-route', leads.length ? '在所示街区的建筑内查找配件箱。' : '收到新配件线索后将在此显示。', 817, 400, 17, C.text, this.modal, 320);
    leads.forEach(({ kind, region }, i) => {
      const y = 368 - i * 25;
      this.text('harbor-part-name-' + i, SURVIVAL_GEAR[kind][0], 817, y, 17, C.text, this.modal, 224);
      this.text('harbor-part-region-' + i, region, 1135, y, 16, '#ffc182', this.modal, 93, Label.HorizontalAlign.RIGHT);
    });
  }
  private buildResult() {
    if (this.battle.survival) { this.buildSurvivalResult(); return; }
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
    if (operation && this.profile.operationArchive) this.dialogText('operation-debrief',
      '剧情档案 · 接应队已撤离。里姆雷特在空袭后仍然存活，样本已扩散。', W / 2, 215, 16, 700, '#d7c8b2');
  }
  private buildSurvivalResult() {
    const b = this.battle, run = b.survival!, outcome = run.outcome ?? 'fallen', saved = b.rewardClaimed;
    const root = this.survivalDialog(SURVIVAL_RESULT_PANEL, 'base');
    const center = Label.HorizontalAlign.CENTER;
    const caption = (id: string, value: string, x: number, y: number, size: number, width: number, tint = '#f6e6d2') =>
      this.campaignLabel(root, id, value, x, y, size, width, tint, center);
    const back = () => {
      if (!b.rewardClaimed) { this.finishBattle(); return; }
      this.battle = this.makeBattle();
      this.open('menu');
    };
    const ending = {
      extracted: { title: '安全撤离', rate: '撤离奖励  ·  100%', message: '已安全撤离至基地。', tone: '#ffda89' },
      fallen: { title: '行动员阵亡', rate: '阵亡结算  ·  50%', message: '本次行动结束。', tone: '#ecc1a1' },
    }[outcome];
    if (saved) this.survivalDialogClose(root, SURVIVAL_RESULT_PANEL, back);
    const crestWidth = outcome === 'extracted' ? 377 : 138;
    this.survivalUiSprite(root, outcome, 640, 557, crestWidth, 146);
    caption('survival-result-title', ending.title, 640, 539, 57, 610, ending.tone);
    this.survivalDialogPlate(root, 640, 445, 963, 64);
    const route = run.timed?.route;
    caption('survival-result-stat', route ? EVAC_ROUTE_NAME[route] : '撤离失败', 390, 445, 26, 263);
    caption('survival-result-kills', '击败 ' + b.kills, 640, 445, 26, 192);
    caption('survival-result-time', '用时 ' + this.time(b.elapsed), 895, 445, 26, 245);
    for (const [i, x] of [516, 767].entries()) caption('survival-stat-divider-' + i, '│', x, 445, 31, 35, '#b19a76');
    this.survivalDialogPlate(root, 640, 367, 401, 55, '#f6be70');
    caption('survival-result-rate', ending.rate, 640, 366, 27, 390, '#ffdb85');
    const tickets = this.reward.tickets > 0;
    const coinX = tickets ? 375 : 493, materialX = tickets ? 624 : 800;
    this.survivalUiSprite(root, 'coin', coinX - 102, 290, 44, 44, true);
    this.survivalUiSprite(root, 'material', materialX - 102, 290, 43, 43, true);
    caption('result-reward', '金币 +' + this.reward.coins, coinX, 290, 29, 174);
    caption('survival-material-reward', '材料 +' + this.reward.materials, materialX, 290, 29, 174);
    if (tickets) caption('survival-ticket-reward', '招募券 +' + this.reward.tickets, 874, 290, 29, 210);
    caption('saved', saved ? ending.message : '存档写入失败，请重试保存。', 640, 216, 22, 640, saved ? '#ddcdb2' : '#f0a989');
    this.survivalDialogButton(root, { id: 'survival-result-main', label: saved ? '返回基地' : '重试保存', run: back }, 225, 92, 368, 80, true);
    this.survivalDialogButton(root, { id: 'survival-result-extra', label: '继续挑战', enabled: saved, run: () => this.open('survival-entry') }, 687, 92, 368, 80);
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
    if (this.unlockAllChapters) return true;
    return chapter === 1 || (chapter === 2 ? this.profile.streetUnlocked : chapter === 3 ? this.profile.apartmentUnlocked : this.profile.owned[ENGINEER_ID]);
  }
  private loadChapterArt(chapter: Chapter, returnTo: Mode) {
    this.loadCampaignArt('chapters');
    this.requestArt('combat', () => this.loadCombatArt());
    this.loadSampleArt(chapter === 4);
    const neighbors = chapter === 1 ? [] : chapter === 2 ? STREET_ART : chapter === 3 ? APARTMENT_ART : OPERATION_ART;
    const info = CHAPTERS[chapter];
    const avatar = () => chapter === 4 ? this.streetFrames.get('op-portrait-rimelet') ?? this.campaignFrames.get('liaison') :
      chapter === 3 ? this.trainingFrames.get('weichuan-face') : this.trainingFrames.get('lin-face');
    const load = this.beginDeparture({
      title: info.name, area: info.location, point: CAMPAIGN_LOCATIONS[chapter], lines: info.lines,
      heading: chapter === 4 ? '任务目标 · ' + OPERATION_BOSS_NAME : undefined,
      map: () => this.campaignFrames.get('satellite-map'),
      avatar: () => avatar() ?? this.campaignFrames.get(`chapter-${chapter}`),
      inset: chapter < 3 ? () => this.campaignFrames.get(`chapter-${chapter}`) : undefined,
      repeated: chapter === this.lastLaunchedChapter, returnTo,
    }, () => this.loadChapterArt(chapter, returnTo), () => {
      this.lastLaunchedChapter = chapter;
      this.launchChapter(chapter);
      return true;
    });
    let done = 0;
    load.progress = () => (done + Number(this.chapterBaseArtReady(chapter))) / (neighbors.length + 1);
    for (const [atlas, parts] of neighbors) {
      if (parts.every(([id]) => this.streetFrames.has(id))) { done++; continue; }
      resources.load((chapter === 4 ? 'chapter4/' : 'common/environment/') + atlas + '/spriteFrame', SpriteFrame, (err, source) => {
        if (!this.isValid || this.departure !== load) return;
        if (err) { load.failed = '场景素材加载失败'; return; }
        source.packable = false;
        for (const [id, x, y, w, h] of parts) this.streetFrames.set(id, this.cropUiFrame(source, x, y, w, h));
        done++;
      });
    }
    this.renderDeparture(load, load.progress());
  }
  private beginDeparture(brief: DepartureBrief, retry: () => void, launch: () => boolean) {
    this.open('street-loading');
    this.homeBackdrop.active = false;
    this.noticeTime = 0;
    const root = this.chapterMap = this.makeNode('Satellite departure', this.modal);
    root.setSiblingIndex(0);
    root.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    this.sbox(this.graphics('Satellite backdrop', root), 0, 0, W, H, '#24302c');
    const overlay = this.graphics('Satellite tracking', root);
    const briefRoot = this.makeNode('Satellite mission brief', root);
    briefRoot.addComponent(UIOpacity).opacity = 0;
    briefRoot.active = false;
    const fade = this.graphics('Satellite blackout', root);
    const load: Departure = { brief, time: 0, typed: 0, waiting: 0, page: 0, pageTime: 0,
      progress: () => 0, retry, launch, briefRoot, overlay, fade };
    this.departure = load;
    return load;
  }
  private backFromDeparture() {
    const load = this.departure;
    if (load && load.fadeTime === undefined) this.open(load.brief.returnTo);
  }
  private departureScansIn(load: Departure) { return load.brief.repeated ? .34 : .94; }
  private departurePage(load: Departure) { return load.brief.pages?.[load.page] ?? load.brief; }
  private departureHasNext(load: Departure) { return load.page + 1 < (load.brief.pages?.length ?? 1); }
  private departureRevealElapsed(load: Departure) {
    return load.page ? load.pageTime - .58 : load.time - this.departureScansIn(load) - FOCUS_SECONDS - REVEAL_SECONDS;
  }
  private departureTextTime(load: Departure) {
    const { lines } = this.departurePage(load);
    return (lines[0].length + lines[1].length) * BRIEF_CHAR_SECONDS;
  }
  private updateDeparture(dt: number) {
    const load = this.departure;
    if (!load) return;
    const progress = load.failed ? 0 : load.progress();
    if (!load.failed) {
      if (load.brief.map()) {
        load.time += dt;
        load.pageTime += dt;
        if (this.departureRevealElapsed(load) >= BRIEF_OPEN_SECONDS) load.typed = Math.min(this.departureTextTime(load), load.typed + dt);
      }
      if (progress < 1 || !load.brief.map()) load.waiting += dt;
      if (load.waiting >= 30) load.failed = '场景素材加载超时';
    }
    if (load.fadeTime !== undefined) {
      load.fadeTime = Math.min(DEPARTURE_FADE_SECONDS, load.fadeTime + dt);
      if (load.fadeTime === DEPARTURE_FADE_SECONDS) {
        if (load.launch()) return;
        load.fadeTime = undefined;
        load.failed = '存档写入失败，原存档已保留';
      }
    }
    if (load.failed && !this.buttons.some(button => button.node.name === 'Button-reload-chapter')) {
      this.button('reload-chapter', '重试', 278, 58, 108, load.retry, true, true, 30);
    }
    this.renderDeparture(load, progress);
  }
  private confirmDeparture() {
    const load = this.departure;
    if (!load || load.failed || load.fadeTime !== undefined) return;
    if (this.departureRevealElapsed(load) < 0) return;
    const textTime = this.departureTextTime(load);
    if (load.typed < textTime) { load.typed = textTime; return; }
    if (this.departureHasNext(load)) {
      load.page++;
      load.pageTime = load.typed = 0;
      load.briefRoot.active = false;
      return;
    }
    if (load.progress() < 1) return;
    load.fadeTime = 0;
    this.resetInput();
  }
  private renderDeparture(load: Departure, progress: number) {
    const { brief, overlay: g } = load, root = g.node.parent!;
    const smooth = (n: number) => { const t = clamp(n, 0, 1); return t * t * (3 - 2 * t); };
    const scan = this.departureScansIn(load), focus = smooth((load.time - scan) / FOCUS_SECONDS);
    const pan = smooth(load.time / scan);
    const reveal = clamp((load.time - scan - FOCUS_SECONDS) / REVEAL_SECONDS, 0, 1);
    const blur = focus * .0062;
    const point = this.departurePage(load).point, frame = brief.map();
    const previous = brief.pages?.[load.page - 1]?.point ?? { x: .5, y: .5 };
    const travel = load.page ? smooth(load.pageTime / .58) : pan;
    const zoom = brief.survey ? 1 + .16 * pan + .32 * focus :
      (brief.repeated ? 1.58 : 1) + (brief.repeated ? .42 : 1) * pan + ((brief.focusZoom ?? 3.35) - 2) * focus;
    const map = satelliteFraming(W, H, previous.x + (point.x - previous.x) * travel, previous.y + (point.y - previous.y) * travel, zoom,
      frame ? frame.originalSize.width / frame.originalSize.height : W / H);
    if (frame && !load.terrain) {
      load.terrain = this.campaignSprite(root, frame, W / 2, H / 2, W, H);
      load.terrain?.node.setSiblingIndex(1);
    }
    if (load.terrain) {
      load.terrain.node.setPosition(map.left + (map.w - W) / 2, map.bottom + (map.h - H) / 2);
      load.terrain.node.setScale(map.w / W, map.h / H, 1);
      if (this.satelliteMaterial) {
        if (load.terrain.customMaterial !== this.satelliteMaterial) load.terrain.customMaterial = this.satelliteMaterial;
        const texture = frame?.texture, rect = frame?.rect;
        const u = texture?.width && rect?.width ? rect.width / texture.width : 1;
        const v = texture?.height && rect?.height ? rect.height / texture.height : 1;
        const originX = texture?.width && rect ? rect.x / texture.width : 0;
        const originY = texture?.height && rect ? rect.y / texture.height : 0;
        const blurAmount = load.page ? .004 * Math.sin(Math.PI * travel) : blur;
        this.satelliteMaterial.setProperty('blurStep', new Vec4(blurAmount * u, blurAmount * v * map.w / map.h, map.w / (W * u), map.h / (H * v)));
        this.satelliteMaterial.setProperty('tileReveal', new Vec4(originX + point.x * u, originY + (1 - point.y) * v, reveal, 0));
      }
    }
    const target = load.page && travel < 1 ? { x: previous.x + (point.x - previous.x) * travel, y: previous.y + (point.y - previous.y) * travel } : point;
    const x = map.left + target.x * map.w, y = map.bottom + target.y * map.h;
    const lock = smooth((pan - .6) / .4), tint = lock > .99 ? '#f8d18b' : '#c8c4a8', span = 24 + 27 * (1 - lock);
    g.clear();
    this.sbox(g, 0, 0, W, H, '#111a18', 32);
    if (frame) {
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const cx = x + sx * span, cy = y + sy * span;
        this.sline(g, cx, cy, cx - sx * 14, cy, tint, 2);
        this.sline(g, cx, cy, cx, cy - sy * 14, tint, 2);
      }
      disc(g, x - W / 2, y - H / 2, 3.5, tint);
    }
    const revealElapsed = this.departureRevealElapsed(load);
    const ready = progress === 1 && revealElapsed >= 0 && load.typed >= this.departureTextTime(load) && !this.departureHasNext(load) && !load.failed;
    const infoLift = brief.survey && point.y < .06 ? 43 * travel : 0;
    if (!load.info) {
      const shell = this.timedSurvivalFrames.get('load-card') ?? this.campaignFrames.get('departure-brief');
      if (shell) {
        load.info = this.campaignSprite(root, shell, 224, 85, 372, 132);
        load.info?.node.setSiblingIndex(g.node.getSiblingIndex());
      }
    }
    if (load.info) load.info.node.setPosition(224 - W / 2, 85 + infoLift - H / 2);
    else this.sbox(g, 43, 23 + infoLift, 362, 123, '#101819', 233);
    this.text('satellite-location', brief.area, 62, 124 + infoLift, 15, '#dccaad', root, 325);
    this.text('satellite-title', brief.title, 62, 98 + infoLift, 24, '#f7e4c3', root, 325).isBold = true;
    const status = load.failed ?? (progress < 1 ? `加载场景  ${Math.floor(progress * 100)}%` : reveal === 1 ? '落点已锁定' : '正在定位');
    this.text('floor-progress', status, 62, 70 + infoLift, 15, '#d9c3a5', root, 328);
    this.sbox(g, 62, 54 + infoLift, 324, 3, '#393c35');
    if (!load.failed && progress > 0) this.sbox(g, 62, 54 + infoLift, 324 * progress, 3, '#b38856');
    if (ready) {
      const prompt = this.text('satellite-ready', '点击屏幕开始', 62, 36 + infoLift, 19, '#ffe2a4', root, 320);
      prompt.isBold = true;
      const pulse = prompt.node.getComponent(UIOpacity) ?? prompt.node.addComponent(UIOpacity);
      pulse.opacity = Math.round(182 + 73 * Math.cos(this.presentationTime * 4.8));
    } else if (this.labels.has('satellite-ready')) this.labels.get('satellite-ready')!.string = '';
    if (revealElapsed >= 0) this.renderDepartureBrief(load, x, y, smooth(revealElapsed / BRIEF_OPEN_SECONDS));
    load.fade.node.setSiblingIndex(9999);
    this.blackFade(load.fade, smooth((load.fadeTime ?? 0) / DEPARTURE_FADE_SECONDS));
  }
  private renderDepartureBrief(load: Departure, x: number, y: number, reveal: number) {
    const { brief, briefRoot: root, overlay } = load;
    const width = brief.inset ? 546 : 480, height = 118;
    const right = W - x >= width + 72;
    const bx = clamp(right ? x + 56 : x - 56 - width, 30, W - width - 30);
    const by = clamp(y + 38, 168, H - height - 34);
    root.active = true;
    root.setPosition(bx + width / 2 - W / 2, by + height / 2 - H / 2 + (1 - reveal) * -9);
    root.getComponent(UIOpacity)!.opacity = Math.round(reveal * 255);
    this.sline(overlay, x, y, x + (right ? 22 : -22), y + 22, '#c99e5f', 1.5, Math.round(220 * reveal));
    this.sline(overlay, x + (right ? 22 : -22), y + 22, right ? bx : bx + width, by + 25, '#c99e5f', 1.5, Math.round(220 * reveal));
    if (!root.getChildByName('Brief base')) {
      const background = this.graphics('Brief base', root);
      const art = this.campaignSprite(root, 'departure-brief', W / 2, H / 2, width, height);
      if (!art) this.missionPlate(background, (W - width) / 2, (H - height) / 2, width, height, '#1c2222', '#a88c63', 12);
    }
    const avatar = brief.avatar(), inset = brief.inset?.();
    const currentPortrait = root.getChildByName('Brief portrait')?.getComponent(Sprite);
    if (avatar && currentPortrait?.spriteFrame !== avatar) {
      if (currentPortrait) {
        currentPortrait.spriteFrame = avatar;
        const { width: w, height: h } = avatar.originalSize, fit = 76 / Math.max(w, h);
        currentPortrait.node.getComponent(UITransform)!.setContentSize(w * fit, h * fit);
      } else {
        const portrait = this.campaignSprite(root, avatar, (W - width) / 2 + 55, H / 2, 76, 76, true)!;
        portrait.node.name = 'Brief portrait';
      }
    }
    if (inset && !root.getChildByName('Brief location')) {
      const icon = this.campaignSprite(root, inset, (W + width) / 2 - 59, H / 2, 83, 66, true)!;
      icon.node.name = 'Brief location';
    }
    const textX = (W - width) / 2 + 104, available = width - (brief.inset ? 218 : 120);
    const page = this.departurePage(load);
    this.campaignLabel(root, 'satellite-brief-heading', page.heading ?? brief.area, textX, H / 2 + 32, 19, available, '#f5d29a');
    let count = Math.floor(load.typed / BRIEF_CHAR_SECONDS + .0001);
    for (const [i, line] of page.lines.entries()) {
      this.text('satellite-brief-' + i, line.slice(0, Math.max(0, count)), textX, H / 2 + 3 - i * 24, 17, '#f1e7d1', root, available);
      count -= line.length;
    }
    if (brief.pages) this.text('satellite-brief-next',
      this.departureHasNext(load) && load.typed >= this.departureTextTime(load) ? '点击继续 ›' : '',
      textX + available - 102, H / 2 - 44, 14, '#e2b46c', root, 100, Label.HorizontalAlign.RIGHT);
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
    this.loadChapterArt(chapter, this.mode);
  }
  private chapterBaseArtReady(chapter: Chapter) {
    const requiredArt = chapter === 4 ? ['operator', 'walker'] :
      ['heroine', 'heroineRoll-0', 'heroineRoll-1', 'heroineRoll-2', 'dormKit', 'lobby-desk', 'corridor', 'bedroom'];
    if (chapter === 2) requiredArt.push('operator');
    const fallArt = this.fallFrames.has(chapter === 4 ? 'operator' : 'lin');
    return this.presentationReady && fallArt && requiredArt.every(id => this.artFrames.has(id));
  }
  private launchChapter(chapter: Chapter) {
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
  private enterBattleScene(chapter: Chapter, prompt: NonNullable<Blackout['transition']>['prompt'] = null, fromLanding = false) {
    this.clearOperationDialogue();
    this.clearOperationEscape();
    this.tutorialPrompt = null;
    this.feedback.reset(); this.motion.reset(this.battle.player); this.weaponEffects.clear();
    this.motionBattle = undefined;
    this.objectiveNotice = undefined;
    if (!fromLanding) this.rebuildLevel();
    this.lastFacing = this.battle.player.angle; this.sightTick = 0; this.lastGeometry = -1;
    if (this.battle.stage.apartment?.outdoor) { this.mx = W / 2; this.my = H / 2 - 240; }
    this.transition = fromLanding ? undefined : { kind: 'enter', time: 0, chapter, prompt };
    this.open('playing');
    this.noticeTime = 0;
    this.operationGuideHeading = undefined;
    this.applyTransitionVisuals(fromLanding ? 1 : 0, fromLanding ? 0 : 1);
    if (fromLanding) this.transitionShade.node.active = false;
  }
  private beginOperationCinematic(part: 'flight' | 'mutate' | 'strike') {
    this.open('operation-cinematic');
    this.homeBackdrop.active = false;
    const root = this.makeNode('Operation ' + part, this.modal);
    this.sbox(this.graphics('Cinematic backdrop', root), 0, 0, W, H, '#080c0d');
    const viewport = part !== 'mutate' ? this.makeNode('Flight viewport', root) : root;
    if (part !== 'mutate') {
      viewport.getComponent(UITransform)!.setContentSize(W, H);
      viewport.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    }
    const picture = this.makeNode('Operation scene', viewport);
    const asset = (id: string, x: number, y: number, w: number, h: number) =>
      this.campaignSprite(picture, this.streetFrames.get('op-' + id)!, x, y, w, h)!;
    const place = (sprite: Sprite, x: number, y: number) => sprite.node.setPosition(x - W / 2, y - H / 2);
    const smooth = (t: number) => { const p = clamp(t, 0, 1); return p * p * (3 - 2 * p); };
    let draw: (time: number) => boolean;
    let finish: () => void;
    if (part === 'flight') {
      this.rebuildLevel();
      this.environmentCamera.enabled = true;
      const coastSpan = H + 44;
      const coast = Array.from({ length: 3 }, () => asset('coast', W / 2, H / 2, W + 56, coastSpan + 1));
      const field = this.campaignSprite(picture, this.outputFrame, W / 2, H / 2, W, H)!;
      const haze = asset('landing-dust', W / 2, H / 2, W * 1.45, H * 1.45);
      const landingPad = OPERATION_AIRCRAFT;
      const dust = asset('landing-dust', 0, 0, 400, 280);
      const makeAircraft = (craft: 'blackhawk' | 'littlebird', opacity = 255) => {
        const heavy = craft === 'blackhawk', w = heavy ? 133 : 99, h = heavy ? 297 : 238;
        const body = asset(craft, 0, 0, w, h), diameter = heavy ? 274 : 214;
        const rotor = asset('rotor', 0, 0, diameter, diameter);
        const stem = heavy ? h * 0.145 : OPERATION_LITTLEBIRD_ART.rotorForward * h / OPERATION_LITTLEBIRD_ART.height;
        if (!heavy) this.attachLittlebirdPods(body, w, h);
        return { body, rotor, stem, opacity, extent: Math.max(Math.hypot(w, h) / 2, diameter / Math.SQRT2 + stem) };
      };
      const wings = Array.from({ length: 4 }, () => makeAircraft('blackhawk', 238));
      const soldiers = [this.battle.player, ...this.battle.stage.operation!.allies].map((destination, index) => {
        const ghost = index === 0;
        const frame = ghost ? this.artFrames.get('operator')! : this.streetFrames.get('op-soldier')!;
        const size = ghost ? { width: OPERATION_GHOST_SIZE, height: OPERATION_GHOST_SIZE } : OPERATION_SOLDIER_SIZE;
        const actor = this.campaignSprite(picture, frame, 0, 0, size.width, size.height)!;
        actor.node.getComponent(UITransform)!.setAnchorPoint(ghost ? 0.36 : 0.5, ghost ? 0.5 : 0.32);
        return { destination, index, actor, ghost };
      });
      // Created after the squad, so the fuselage naturally covers the cabin door.
      const playerAircraft = makeAircraft('blackhawk');
      const flyovers = OPERATION_FLYOVERS.map(cue => ({ ...cue, aircraft: makeAircraft(cue.craft, 222) }));
      const jets = OPERATION_JETS.map(cue => ({ cue, sprite: asset('f15', 0, 0, 246 * cue.size, 332 * cue.size), heard: false }));
      const poseAircraft = (aircraft: ReturnType<typeof makeAircraft>, x: number, y: number, scale: number, time: number, bank = 0) => {
        const { body, rotor, stem, opacity, extent } = aircraft;
        const showing = x + extent * scale >= 0 && x - extent * scale <= W &&
          y + extent * scale >= 0 && y - extent * scale <= H;
        body.node.active = rotor.node.active = showing;
        body.node.setScale(scale, scale, 1);
        rotor.node.setScale(scale, scale, 1);
        const angle = bank * Math.PI / 180, rotorOffset = stem * scale;
        place(body, x, y); place(rotor, x - Math.sin(angle) * rotorOffset, y + Math.cos(angle) * rotorOffset);
        body.node.angle = bank;
        body.color = color('#ffffff', opacity);
        rotor.node.angle = bank + time * 830 % 360;
        rotor.color = color('#ffffff', Math.round(opacity * 0.64));
        return showing;
      };
      this.speakOperation([
        ['lead', '沿岸分开。幽灵，准备落地。'],
        ['littlebird', '海滩上没动静，可以下。'],
        ['ghost', '收到。落地后跟我走。'],
      ], true);
      let landingAt: number | undefined;
      draw = t => {
        if (landingAt === undefined && t >= OPERATION_FORMATION_SECONDS && !this.operationDialogue) landingAt = t;
        const approach = landingAt === undefined ? -1 : t - landingAt;
        const landing = approach - OPERATION_APPROACH_SECONDS;
        const flightTime = landingAt === undefined ? t : landingAt + 2.5 * (1 - Math.exp(-approach / 2.5));
        const offset = flightTime * 112 % coastSpan, page = Math.floor(flightTime * 112 / coastSpan);
        coast.forEach((sprite, i) => {
          place(sprite, W / 2, H / 2 - offset + (i - 1) * coastSpan);
          sprite.node.setScale(1, (page + i) % 2 ? -1 : 1, 1);
        });
        const formation = operationFormationAt(t);
        for (const [i, wing] of wings.entries()) {
          const position = formation[i + 1];
          poseAircraft(wing, position.x, position.y, position.scale, t + i * 0.03, position.bank);
        }
        for (const cue of flyovers) {
          const fraction = ((cue.landing ? approach : t) - cue.start) / cue.duration;
          const y = -250 + fraction * (H + 500);
          const x = cue.x + (cue.toX - cue.x) * fraction;
          poseAircraft(cue.aircraft, x, y, cue.scale, t, -(cue.toX - cue.x) * 0.038);
        }
        const descent = operationDescentAt(approach), progress = descent.touchdown;
        const handoff = smooth((landing - 2.8) / (OPERATION_HANDOFF_SECONDS - 2.8));
        const zoom = 0.69 + 0.12 * progress + 0.19 * handoff;
        const player = this.battle.player;
        const focusX = player.x - 86 * (1 - progress);
        const focusY = player.y + 147 * (1 - progress) - 40 * progress * (1 - handoff);
        const screenX = (x: number) => W / 2 + (x - focusX) * zoom;
        const screenY = (y: number) => H / 2 + (y - focusY) * zoom;
        this.environment.setScale(zoom, zoom, 1);
        this.environment.setPosition(-focusX * zoom, -focusY * zoom);
        const landVisible = descent.near;
        field.color = color('#ffffff', Math.round(255 * landVisible));
        haze.color = color('#f5dfbc', Math.round(120 * Math.sin(Math.PI * landVisible)));

        const takeoff = operationTakeoffAt(landing);
        const padX = screenX(landingPad.x), padY = screenY(landingPad.y);
        const farX = formation[0].x + (OPERATION_COAST_LZ.x - formation[0].x) * descent.distance;
        const farY = formation[0].y + (OPERATION_COAST_LZ.y - formation[0].y) * descent.distance;
        const approachX = farX + (padX - farX) * landVisible;
        const approachY = farY + (padY + 58 * (1 - progress) - farY) * landVisible;
        const scale = (descent.airborneScale + (zoom - descent.airborneScale) * progress) * takeoff.scale;
        poseAircraft(playerAircraft, approachX + takeoff.x, approachY + takeoff.y, scale, t, takeoff.bank);
        dust.node.active = landing > 1.2 && landing < 5.5;
        dust.node.setScale(zoom, zoom, 1); place(dust, padX, padY);
        dust.color = color('#d7b789', Math.round(168 * progress * (1 - smooth((landing - 2.8) / 2.6))));

        let shakeX = 0, shakeY = 0;
        for (const jet of jets) {
          const frame = operationJetFrame(approach, jet.cue);
          jet.sprite.node.active = frame.flying;
          jet.sprite.node.angle = frame.angle;
          place(jet.sprite, frame.jet.x, frame.jet.y);
          shakeX += frame.shakeX; shakeY += frame.shakeY;
          if (frame.pulse && !jet.heard) {
            jet.heard = true;
            this.playOperationJet(0.53);
          }
        }
        picture.setPosition(shakeX, shakeY);
        picture.setScale(1 + 2 * Math.abs(shakeX) / W, 1 + 2 * Math.abs(shakeY) / H, 1);

        const door = { x: landingPad.x + 80, y: landingPad.y + 16 };
        for (const { destination, index, actor, ghost } of soldiers) {
          const leave = landing - 2.55 - index * 0.62;
          const disembark = smooth(leave / 0.52);
          const walk = smooth((leave - 0.43) / 1.13);
          actor.node.active = leave >= 0;
          actor.node.setScale(zoom, zoom, 1);
          place(actor, screenX(landingPad.x + (door.x - landingPad.x) * disembark + (destination.x - door.x) * walk),
            screenY(landingPad.y + (door.y - landingPad.y) * disembark + (destination.y - door.y) * walk));
          const angle = leave < 0.46 ? 0 : Math.atan2(destination.y - door.y, destination.x - door.x);
          const facing = smooth((leave - 1.36) / 0.35);
          actor.node.angle = (angle * (1 - facing) + player.angle * facing) * 180 / Math.PI - (ghost ? 0 : 90);
        }
        return landing >= OPERATION_HANDOFF_SECONDS;
      };
      finish = () => {
        this.environment.setScale(1, 1, 1);
        this.enterBattleScene(4, null, true);
        this.operationArrival = { battle: this.battle, time: OPERATION_HANDOFF_SECONDS };
        this.speakOperation([['four', '人齐了，走吧。']]);
      };
    } else if (part === 'mutate') {
      asset('compound', 640, 360, W, H);
      asset('console', 967, 515, 260, 133);
      asset('wall', 640, 661, 1180, 64);
      const leader = asset('rimelet-human', 817, 357, 96, 120);
      leader.node.angle = 90;
      const injection = asset('rimelet-injection', 817, 357, 96, 120);
      injection.node.angle = 90;
      const soldiers = [[485, 305], [440, 415], [370, 355], [520, 430], [340, 240]]
        .slice(0, 1 + this.battle.allies.filter(ally => ally.hp > 0).length)
        .map(([x, y]) => ({ x, y, sprite: asset('soldier', x, y, 55, 81) }));
      const king = asset('rimelet-mutated', 817, 357, 96, 120);
      const flash = asset('impact', 478, 371, 500, 440);
      this.speakOperation([
        ['ghost', '把手里的东西放下。'],
        ['rimelet', '来晚了。样本已经送走了。'],
        ['two', '他在扎针！往后退！'],
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
            ['command', '喂？有人听见吗？'],
            ['three', '街上乱了，先回海滩。'],
          ], true);
        }
        return aftermath && !this.operationDialogue;
      };
      finish = () => {
        if (this.battle.advanceOperation(operationLevel('defense'))) this.enterBattleScene(4);
      };
    } else {
      asset('coast', 640, 360, W * 1.085, H * 1.14);
      const beach = this.campaignSprite(picture, this.outputFrame, W / 2, H / 2, W, H)!;
      const target = OPERATION_COAST_LZ;
      const strikes = OPERATION_STRIKE_GROUPS.map((group, wave) => ({
        delay: group.delay, shake: group.shake, heard: false,
        spots: group.spots.map((spot, index) => ({
          delay: spot.delay, x: target.x + spot.x, y: target.y + spot.y,
          frames: OPERATION_STRIKE_FRAMES.map(frame => {
            const id = (index + wave) % 2 === 0 ? frame.id : frame.id + '-variant';
            const sprite = asset(id, target.x + spot.x, target.y + spot.y, spot.size, spot.size);
            sprite.node.name = frame.id;
            sprite.node.angle = (spot.x * 7 + index * 53) % 360;
            return { frame, sprite };
          }),
        })),
      }));
      const retreat = asset('blackhawk', 0, 0, 133, 297), rotor = asset('rotor', 0, 0, 274, 274);
      const jets = OPERATION_RETURN_JETS.map(cue => ({ cue, sprite: asset('f15', 0, 0, 241 * cue.size, 324 * cue.size), heard: false }));
      draw = t => {
        const cut = smooth(t / 0.92);
        beach.node.active = cut < 1;
        beach.color = color('#ffffff', Math.round(255 * (1 - cut)));
        beach.node.setScale(1 + cut * 0.095, 1 + cut * 0.095, 1);
        const p = clamp((t - 0.32) / 4.45, 0, 1);
        const travel = p * (0.30 + p * 0.70);
        const x = 619 + 77 * travel, y = 488 - 686 * travel;
        const scale = 0.60 - 0.16 * travel, opacity = Math.round(255 * smooth((t - 0.16) / 0.65));
        retreat.node.active = rotor.node.active = p < 1;
        retreat.node.angle = 180 + 4 * Math.sin(p * Math.PI);
        rotor.node.angle = t * 830 % 360;
        place(retreat, x, y); place(rotor, x + 2, y - 43 * scale);
        retreat.node.setScale(scale, scale, 1); rotor.node.setScale(scale, scale, 1);
        retreat.color = color('#ffffff', opacity); rotor.color = color('#ffffff', Math.round(opacity * 0.64));
        let shakeX = 0, shakeY = 0;
        for (const jet of jets) {
          const frame = operationJetFrame(t, jet.cue, true);
          jet.sprite.node.active = frame.flying;
          jet.sprite.node.angle = frame.angle;
          place(jet.sprite, frame.jet.x, frame.jet.y);
          shakeX += frame.shakeX; shakeY += frame.shakeY;
          if (frame.pulse && !jet.heard) { jet.heard = true; this.playOperationJet(0.47); }
        }
        const impact = t - OPERATION_IMPACT_SECONDS;
        for (const group of strikes) {
          const elapsed = impact - group.delay;
          if (elapsed >= 0 && elapsed < 0.60) {
            if (!group.heard) { group.heard = true; this.play('grenade-blast'); }
            const shake = group.shake * (1 - elapsed / 0.60) ** 1.65;
            shakeX += shake * Math.cos(elapsed * 66);
            shakeY += shake * .64 * Math.cos(elapsed * 81 + .7);
          }
          for (const spot of group.spots) {
            const age = elapsed - spot.delay;
            for (const { frame, sprite } of spot.frames) {
              const visual = operationStrikeFrame(age, frame);
              sprite.node.active = visual.alpha > .006;
              if (!sprite.node.active) continue;
              sprite.node.setScale(visual.scale, visual.scale, 1);
              if (frame.id === 'strike-smoke') place(sprite, spot.x + (age - frame.delay) * 14, spot.y + (age - frame.delay) * 8);
              sprite.color = color('#ffffff', Math.round(255 * visual.alpha));
            }
          }
        }
        picture.setPosition(clamp(shakeX, -26, 26), clamp(shakeY, -21, 21));
        return impact >= OPERATION_STRIKE_END_SECONDS;
      };
      finish = () => {
        this.battle.status = 'won';
        if (this.battle.operationRun) this.battle.operationRun.phase = 'debrief';
        this.profile.operationArchive = true;
        this.save();
        this.finishBattle();
      };
    }
    const shade = this.graphics('Cinematic fade', root);
    const render = (t: number) => {
      const done = draw(t);
      const fade = (t - OPERATION_IMPACT_SECONDS - OPERATION_STRIKE_FADE_SECONDS) /
        (OPERATION_STRIKE_END_SECONDS - OPERATION_STRIKE_FADE_SECONDS);
      this.blackFade(shade, part === 'strike' ? smooth(fade) : 1 - smooth(t / .56));
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
    this.blackFade(this.transitionShade, blackAlpha);
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
          ['ghost', '沿街屋走，别惊动岗哨。'],
        ]);
        else if (part === 'compound') this.speakOperation([
          ['ghost', '找里姆雷特。要活的。'],
                  ]);
        else this.speakOperation([
          ['three', '快走，后面还有东西。'],
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
    const run = this.battle.survival;
    if (run) {
      if (this.battle.rewardClaimed || this.battle.status === 'playing') return;
      run.outcome ??= 'fallen';
      this.reward = survivalPayout(run.pool, run.outcome);
      const survivalMaps = { ...this.profile.survivalMaps };
      delete survivalMaps[this.battle.stage.survival!.mapId];
      const next = { ...this.profile, survivalMaps, achievementProgress: { ...this.profile.achievementProgress },
        materials: this.profile.materials + this.reward.materials, coins: this.profile.coins + this.reward.coins,
        tickets: this.profile.tickets + this.reward.tickets };
      recordAchievementKills(next, this.battle.kills);
      if (this.persist(next)) {
        this.profile = next; this.battle.rewardClaimed = true;
        this.play(run.outcome === 'fallen' ? 'hurt' : 'win');
      }
      this.open('result');
      return;
    }
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
  private battleHudSprite(name: HudFrame, parent: Node, x: number, y: number, w: number, h: number, sliced = false) {
    const node = this.makeNode(name, parent);
    node.setPosition(x, y);
    const scale = sliced ? PANEL_SCALE : 1;
    const sprite = this.setupSprite(node, this.battleHudFrames.get(name)!, w / scale, h / scale);
    if (sliced) {
      sprite.type = Sprite.Type.SLICED;
      node.setScale(scale, scale, 1);
    }
    return sprite;
  }
  private buildBattleStatus(parent: Node) {
    const frames = this.battleHudFrames;
    if (!(['status', 'portrait-rim', 'socket', 'glass', 'gloss'] as const).every(id => frames.has(id))) {
      this.battleSprite('player_status', HUD.status);
      return;
    }
    const { x, w } = HUD.status;
    this.battleHudSprite('status', parent, x + w / 2 - W / 2, 674 - H / 2, w, 76);
    const portraitMask = this.makeNode('Player portrait clip', parent);
    portraitMask.setPosition(57 - W / 2, 674 - H / 2);
    portraitMask.getComponent(UITransform)!.setContentSize(59, 59);
    portraitMask.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    const portrait = this.makeNode('Player portrait art', portraitMask);
    this.battleHudSprite('portrait-rim', parent, 57 - W / 2, 674 - H / 2, 70, 70);
    this.battleHudSprite('socket', parent, HEALTH_X + HEALTH_W / 2 - W / 2, HEALTH_Y - H / 2, HEALTH_W + 10, 15);
    const makeGlass = (name: string) => {
      const sprite = this.battleHudSprite('glass', parent, HEALTH_X - W / 2, HEALTH_Y - H / 2, HEALTH_W, 9);
      sprite.node.name = name;
      sprite.node.getComponent(UITransform)!.setAnchorPoint(0, 0.5);
      return sprite;
    };
    const trail = makeGlass('Damage trail'), fill = makeGlass('Current health glass');
    trail.color = color('#943b37');
    const gloss = this.battleHudSprite('gloss', parent, HEALTH_X + HEALTH_W / 2 - W / 2, HEALTH_Y + 4 - H / 2, HEALTH_W, 2);
    gloss.node.addComponent(UIOpacity).opacity = 140;
    this.playerStatus = { portrait, fill, trail };
    const p = this.battle.player;
    this.playerHealth.reset(p.hp / p.maxHp);
  }
  private buildBattleMessages(parent: Node) {
    const frames = this.battleHudFrames;
    if (frames.has('notice') && frames.has('inspect')) {
      const root = this.makeNode('Battle notice', parent);
      const plate = this.battleHudSprite('notice', root, 0, 0, 280, 42, true);
      const icon = this.battleHudSprite('inspect', root, 0, 0, 18, 18);
      this.noticeHud = { root, plate, icon, opacity: root.addComponent(UIOpacity) };
      root.active = false;
    }
    if (frames.has('context') && frames.has('keycap') && frames.has('interact')) {
      const root = this.makeNode('Battle interaction prompt', parent);
      root.setPosition(PROMPT_CENTER - W / 2, PROMPT_Y - H / 2);
      const plate = this.battleHudSprite('context', root, 0, 0, 440, 43, true);
      const badge = this.battleHudSprite('keycap', root, 0, 0, 70, 26);
      const icon = this.battleHudSprite('interact', root, 0, 0, 20, 20);
      this.promptHud = { root, plate, badge, icon };
      root.active = false;
    }
  }
  private buildHud() {
    this.battleArtwork = this.makeNode('Battle artwork', this.canvas);
    // Artwork sits below dynamic graphics/text and never participates in hit testing.
    this.battleArtwork.setSiblingIndex(this.hud.node.getSiblingIndex());
    this.buildObjectiveHud(this.battleArtwork);
    for (const [id, rect] of [
      ['area_banner', HUD.area], ['mission_status', HUD.mission], ['minimap_panel', HUD.map],
      ['button_settings', HUD.settings], ['button_pause', HUD.pause],
    ] as Array<[BattleImage, typeof HUD.status]>) this.battleSprite(id, rect);
    this.buildBattleStatus(this.battleArtwork);
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
    const legacyAmmo: Node[] = [];
    const normalAmmo = this.battleSprite('weapon_ammo', HUD.ammo);
    if (normalAmmo) legacyAmmo.push(normalAmmo);
    if (ammoFrame && this.battle.heroId !== HEROINE_ID) {
      const icon = this.supplyUiFrames.get(this.battle.hero.weapon);
      if (icon) {
        const patch = this.cropUiFrame(ammoFrame, 180, 35, 95, 65);
        const backdrop = this.makeNode('Weapon icon background', this.battleArtwork!);
        backdrop.setPosition(HUD.ammo.x + 72 - W / 2, HUD.ammo.y + HUD.ammo.h / 2 - H / 2);
        this.setupSprite(backdrop, patch, 98, 51);
        legacyAmmo.push(backdrop);
        const weapon = this.makeNode('Weapon icon ' + this.battle.heroId, this.battleArtwork!);
        weapon.setPosition(HUD.ammo.x + 72 - W / 2, HUD.ammo.y + HUD.ammo.h / 2 - H / 2);
        const fit = Math.min(82 / icon.originalSize.width, 42 / icon.originalSize.height);
        this.setupSprite(weapon, icon, icon.originalSize.width * fit, icon.originalSize.height * fit);
        legacyAmmo.push(weapon);
      }
    }
    for (const [id, rect] of [['joystick_move_base', HUD.move], ['joystick_fire', HUD.fire]] as Array<[BattleImage, typeof HUD.move]>) {
      const node = this.battleSprite(id, rect); if (node) this.battleSticks.push(node);
    }
    this.moveCap = this.battleSprite('joystick_move_cap', { x: HUD.move.x + HUD.move.w / 2 - 40, y: HUD.move.y + HUD.move.h / 2 - 40, w: 80, h: 80 });
    this.createHudAction('dodge', 'button_roll', HUD.roll, () => this.battle.player.dash, () => 2.4);
    this.createHudAction('reload', 'button_reload', HUD.reload, () => this.battle.player.reload, () => this.battle.hero.reload);
    if (this.battle.survival) {
      this.createHudAction('grenade', undefined, HUD.grenade, () => this.battle.survivalThrowCooldown,
        () => { const kind = this.battle.survivalBindings.throw; return kind ? SURVIVAL_THROWABLES[kind].cooldown : 0; });
      this.createHudAction('survival-mine', undefined, HUD.trap, () => 0, () => 0);
    } else this.createHudAction('grenade', isShopMine(this.battle.tactical.selected) ? 'button_trap' : 'button_grenade', HUD.grenade,
      () => this.battle.tactical.cooldown, () => TACTICAL_DEFINITIONS[this.battle.tactical.selected || 'grenade'].cooldown);
    const air = this.streetFrames.get('op-littlebird-hud');
    if (this.battle.operationRun?.airSupport && air) this.createHudAction('air', air, HUD.air,
      () => this.battle.operationRun?.airCooldown ?? 0, () => OPERATION_AIR_COOLDOWN);
    if (this.battle.stage.operation?.part === 'compound') this.buildOperationBossHud(this.battleArtwork);
    this.createHudAction('door', 'button_interact', HUD.door, () => 0, () => 0);
    this.createHudAction('pickup', 'button_pickup', HUD.pickup, () => 0, () => 0);
    if (this.battle.apartment) this.createHudAction('apartment-trap', 'button_trap', HUD.trap, () => 0, () => 0);
    // The source PNG restores the erased quantity-badge corner from its clean mirrored rim.
    const operation = this.battle.stage.operation;
    const name = operation ? '幽灵一组' : `${this.battle.hero.name}  Lv.${this.battle.level}`;
    const statusX = this.playerStatus ? HEALTH_X : 113;
    this.text('name', name, statusX, 693, this.playerStatus && sys.isMobile ? 19 : 17, C.text, this.canvas, 212);
    const healthSize = this.playerStatus ? (sys.isMobile ? 16 : 14) : 13;
    this.text('health', '', statusX, 654, healthSize, C.jade, this.canvas, HEALTH_W);
    this.text('portrait', this.battle.hero.name.slice(0, 1), this.playerStatus ? 57 : 62, 674, 28, C.gold, this.canvas, 62, Label.HorizontalAlign.CENTER);
    this.buildBattleMessages(this.battleArtwork);
    this.text('objective', '', 446, 698, 17, C.text, this.canvas, 430);
    this.text('sub-objective', '', 423, 663, 12, C.text, this.canvas, 506);
    this.text('ammo', '', HUD.ammo.x + HUD.ammo.w * 0.68, HUD.ammo.y + HUD.ammo.h * 0.60, 23, C.text, this.canvas, HUD.ammo.w * 0.57, Label.HorizontalAlign.CENTER);
    this.text('gun', this.battle.hero.gun, HUD.ammo.x + HUD.ammo.w * 0.68, HUD.ammo.y + HUD.ammo.h * 0.28, 11, C.text, this.canvas, HUD.ammo.w * 0.57, Label.HorizontalAlign.CENTER);
    if (this.battle.survival) this.buildSurvivalAmmo(legacyAmmo);
    this.text('reload-hint', sys.isMobile ? '换弹' : '换弹 R', HUD.reload.x + HUD.reload.w / 2, HUD.reload.y - 6, 12, C.text, this.canvas, 90, Label.HorizontalAlign.CENTER);
    const bind = (id: string, r: typeof HUD.status, action: () => void) => this.addButton(id, r.x, r.y, r.w, r.h, action);
    bind('settings', HUD.settings, () => this.open('settings'));
    bind('pause', HUD.pause, () => this.open('pause'));
    if (this.battle.survival) {
      const map = HUD.map, height = map.h - 44, width = height * HARBOR_ART_WIDTH / HARBOR_ART_HEIGHT;
      const backdrop = this.graphics('Harbor minimap backdrop', this.battleArtwork);
      this.sbox(backdrop, map.x + 14, map.y + 17, map.w - 28, map.h - 34, '#0f1212');
      const sprite = this.harborMapSprite(this.battleArtwork, map.x + (map.w - width) / 2, map.y + 22, width, height);
      if (sprite) sprite.color = color('#cfd8d5');
      this.text('harbor-minimap-open', sys.isMobile ? '港区地图' : '港区地图  M', map.x + map.w / 2,
        map.y + 5, 12, C.text, this.canvas, map.w - 24, Label.HorizontalAlign.CENTER);
      bind('survival-map', map, () => this.open('survival-map'));
    }
    if (this.battle.tutorial) this.button('tutorial-skip-live', '跳过教程', 24, 440, 148, () => {
      this.requestTutorialSkip();
    }, false, true, 38);
    bind('dodge', HUD.roll, () => this.dodge());
    bind('reload', HUD.reload, () => this.battle.reload());
    const grenadeButton = bind('grenade', HUD.grenade, () => {
      if (sys.isMobile && this.aimedTacticalButton()) return;
      this.releaseTacticalThrow(this.battle.player.angle, this.battle.survival ? 205 : 150);
    });
    grenadeButton.on(Node.EventType.TOUCH_START, (e: EventTouch) => this.startTacticalTouch(e));
    grenadeButton.on(Node.EventType.TOUCH_MOVE, (e: EventTouch) => this.moveTacticalTouch(e));
    grenadeButton.on(Node.EventType.TOUCH_END, (e: EventTouch) => this.finishTacticalTouch(e.getID(), false));
    grenadeButton.on(Node.EventType.TOUCH_CANCEL, (e: EventTouch) => this.finishTacticalTouch(e.getID(), true));
    if (this.battle.survival) bind('survival-mine', HUD.trap, () => this.useSurvivalTactical('mine'));
    if (this.battle.operationRun?.airSupport) bind('air', HUD.air, () => this.callOperationAir());
    bind('auto-fire', HUD.auto, () => this.toggleAutoFire());
    if (this.battle.apartment) bind('apartment-trap', HUD.trap, () => this.placeApartmentTrap());
    if (!this.battle.survival) {
    bind('supply-toggle', { x: 1170, y: 365, w: 75, h: 48 }, () => { this.suppliesOpen = !this.suppliesOpen; this.uiTick = 0; });
    const backpack = this.supplyUiFrames.get('backpack');
    if (backpack) {
      const node = this.makeNode('Supply backpack', this.battleArtwork!);
      node.setPosition(1207 - W / 2, 389 - H / 2);
      this.setupSprite(node, backpack, 58, 58);
    }
    const slotFrame = this.supplyUiFrames.get('slot');
    if (slotFrame) for (let i = 0; i < (this.battle.survival ? 4 : 3); i++) {
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
    }
    (['healing', 'speed'] as const).forEach((kind, i) => {
      const node = bind('status-' + kind, { x: 25 + i * 31, y: 600, w: 26, h: 26 }, () => this.toast(kind === 'healing' ? '生命恢复中 · 绷带持续治疗' : '提速中 · 能量饮料提高移动速度'));
      node.active = false;
    });
    const doorButton = bind('door', HUD.door, () => {
      if (!this.survivalDoorHold?.opened) this.interactOrInvestigate();
    });
    if (this.battle.survival) {
      doorButton.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
        const owner = event.getID();
        if (owner !== null) this.startSurvivalDoorHold(owner);
      });
      const release = (event: EventTouch) => {
        if (this.survivalDoorHold?.owner === event.getID()) this.survivalDoorHold = undefined;
      };
      doorButton.on(Node.EventType.TOUCH_END, release);
      doorButton.on(Node.EventType.TOUCH_CANCEL, release);
      doorButton.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
        const p = this.pointerPosition(event), r = HUD.door;
        if (p.x < r.x || p.x > r.x + r.w || p.y < r.y || p.y > r.y + r.h) release(event);
      });
    }
    bind('pickup', HUD.pickup, () => this.battle.collectPickup());
    for (const a of this.hudActions) {
      const node = this.buttons.find(b => b.node.name === 'Button-' + a.id)!.node;
      node.on(Node.EventType.TOUCH_START, (e: EventTouch) => { if (this.transition) return; const id = e.getID(); if (id === null) return; a.owners.add(id); a.scale = 0.88; a.root.setScale(0.88, 0.88, 1); });
      for (const event of [Node.EventType.TOUCH_END, Node.EventType.TOUCH_CANCEL]) node.on(event, (e: EventTouch) => this.releaseHud(e.getID()));
    }
    if (this.battle.survival) this.buildSurvivalBagHud();
    this.updateHud(); this.updateHudFeedback(0);
  }
  private startGhostRadio() {
    if (this.ghostRadio?.battle === this.battle) return;
    const dialogue = this.makeStoryDialogue('Ghost radio', this.canvas);
    dialogue.node.setPosition(W / 2, STORY_PANEL_Y);
    const portrait = this.trainingFrames.get('ghost-face') ?? this.ghostPortrait ?? this.artFrames.get('operator');
    this.setStorySpeaker(dialogue, '幽灵', false, portrait, '#b8c0ad');
    this.ghostRadio = { battle: this.battle, node: dialogue.node, label: dialogue.label, elapsed: 0 };
  }
  private startIntro() {
    this.intro?.node.destroy();
    const dialogue = this.makeStoryDialogue('Lin monologue', this.canvas);
    const portrait = this.trainingFrames.get('lin-face') ?? this.linPortrait ?? this.artFrames.get('heroine');
    this.setStorySpeaker(dialogue, '凛', true, portrait);
    this.intro = { battle: this.battle, node: dialogue.node, label: dialogue.label, time: 0 };
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
    const dialogue = this.makeStoryDialogue('Apartment dialogue', this.canvas, () => {
      const active = this.apartmentDialogue;
      if (!active || !active.node.active) return;
      const index = Math.floor(active.time / APARTMENT_LINE_SECONDS);
      const text = active.lines[index]?.replace(/^[^：]+：/, '') ?? '';
      const reveal = .13 + text.length * .024;
      const start = index * APARTMENT_LINE_SECONDS;
      active.time = active.time < start + reveal ? start + reveal : (index + 1) * APARTMENT_LINE_SECONDS;
    });
    dialogue.node.setPosition(-W - STORY_PANEL_WIDTH, STORY_PANEL_Y);
    this.apartmentDialogue = { ...dialogue, battle: this.battle, lines, time: 0 };
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
            const sentence = dialogue.lines[index], left = sentence.startsWith('凛');
            const body = sentence.replace(/^[^：]+：/, '');
            const time = dialogue.time - index * APARTMENT_LINE_SECONDS;
            this.setStorySpeaker(dialogue, left ? '凛' : '维川', left, this.apartmentPortrait(left), left ? '#ddc18c' : '#b8c0ad');
            dialogue.label.string = body.slice(0, Math.max(0, Math.floor((time - .13) / .024 + 1e-6)));
            this.placeStoryDialogue(dialogue.node, left, time, APARTMENT_LINE_SECONDS - .25);
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
  private makeStoryDialogue(name: string, parent: Node, advance?: () => void): StoryDialogueNodes {
    const node = this.makeNode(name, parent);
    const frame = this.campaignFrames.get('radio-panel');
    if (frame) {
      const artwork = this.makeNode('Dialogue plate', node);
      artwork.setPosition(STORY_PANEL_WIDTH / 2, 0);
      this.setupSprite(artwork, frame, STORY_PANEL_WIDTH, 104);
    } else {
      const panel = this.graphics('Dialogue plate', node);
      box(panel, 0, -52, STORY_PANEL_WIDTH, 104, '#141c20', 247);
      outline(panel, 0, -52, STORY_PANEL_WIDTH, 104, '#957354');
    }
    const trim = this.graphics('Dialogue portrait surround', node);
    const portrait = this.makeNode('Story portrait', node);
    const label = this.makeNode('Story line', node).addComponent(Label);
    label.node.getComponent(UITransform)!.setContentSize(399, 48);
    label.node.getComponent(UITransform)!.setAnchorPoint(0, 1);
    label.fontSize = 18; label.lineHeight = 23; label.enableWrapText = true; label.overflow = Label.Overflow.CLAMP;
    label.horizontalAlign = Label.HorizontalAlign.LEFT; label.verticalAlign = Label.VerticalAlign.TOP; label.color = color('#f3e9d9'); label.string = '';
    const speaker = this.makeNode('Story speaker', node).addComponent(Label);
    speaker.node.getComponent(UITransform)!.setAnchorPoint(0, .5);
    speaker.node.getComponent(UITransform)!.setContentSize(395, 20);
    speaker.fontSize = 16; speaker.isBold = true; speaker.horizontalAlign = Label.HorizontalAlign.LEFT;
    if (advance) {
      const hint = this.makeNode('Story advance hint', node).addComponent(Label);
      hint.node.setPosition(STORY_PANEL_WIDTH / 2, -41);
      hint.node.getComponent(UITransform)!.setContentSize(90, 18);
      hint.fontSize = 11; hint.color = color('#bda888'); hint.string = '继续 ›';
      const button = this.makeNode('Story advance', node);
      button.setPosition(STORY_PANEL_WIDTH / 2, 0);
      button.getComponent(UITransform)!.setContentSize(STORY_PANEL_WIDTH, 104);
      button.addComponent(Button).transition = Button.Transition.NONE;
      button.on(Button.EventType.CLICK, advance, this);
    }
    return { node, label, portrait, speaker, trim };
  }
  private setStorySpeaker(dialogue: StoryDialogueNodes, name: string, left: boolean, frame?: SpriteFrame, tint = left ? '#ddc18c' : '#cda098') {
    if (dialogue.speaker.string !== name) dialogue.speaker.string = name;
    if (dialogue.side !== left || dialogue.tint !== tint) {
      dialogue.side = left; dialogue.tint = tint;
      const face = left ? 52 : STORY_PANEL_WIDTH - 52;
      const textX = left ? 101 : 20;
      dialogue.portrait.setPosition(face, 1);
      dialogue.speaker.node.setPosition(textX, 28);
      dialogue.speaker.color = color(tint);
      dialogue.label.node.setPosition(textX, 13);
      const g = dialogue.trim;
      g.clear();
      box(g, textX, 16, 38, 1.5, tint, 155);
    }
    dialogue.portrait.active = !!frame;
    if (frame) this.setupStoryPortrait(dialogue.portrait, frame);
  }
  private beginStreetStory() {
    this.intro?.node.destroy(); this.intro = undefined;
    this.ghostRadio?.node.destroy(); this.ghostRadio = undefined;
    const dialogue = this.makeStoryDialogue('Street story', this.canvas, () => this.advanceStreetStory());
    this.streetStory = { ...dialogue, battle: this.battle, index: 0, time: 0 };
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
    const left = story.index % 2 === 0;
    this.setStorySpeaker(story, left ? '凛' : '幽灵', left, portraitFrame, left ? '#ddc18c' : '#b8c0ad');
    this.placeStoryDialogue(story.node, left, story.time, typed + 2.2);
    if (story.time >= typed + 2.45) {
      if (++story.index >= this.streetStoryLines.length) { story.battle.exitHold = false; story.node.destroy(); this.streetStory = undefined; }
      else story.time = 0;
    }
  }
  private placeStoryDialogue(node: Node, left: boolean, time: number, exit: number, y = STORY_PANEL_Y) {
    const smooth = (x: number) => x * x * (3 - 2 * x);
    const slide = smooth(clamp(time / 0.25, 0, 1)) - smooth(clamp((time - exit) / 0.25, 0, 1));
    const travel = (STORY_PANEL_WIDTH + 20) * slide;
    node.setPosition(left ? -W / 2 - STORY_PANEL_WIDTH + travel : W / 2 - travel, y);
  }
  private beginOperationEscape(x: number, y: number, duration: number) {
    this.clearOperationEscape();
    const frame = this.streetFrames.get('op-rimelet-mutated');
    if (!frame) return;
    const node = this.makeNode('Operation escape', this.spriteLayer);
    this.setupSprite(node, frame, OPERATION_UNIT_ART.width, OPERATION_UNIT_ART.height);
    node.getComponent(UITransform)!.setAnchorPoint(0.5, OPERATION_UNIT_ART.anchorY);
    const opacity = node.addComponent(UIOpacity);
    node.setPosition(x, y);
    this.operationEscape = { node, opacity, x, y, time: 0, duration };
  }
  private clearOperationEscape() {
    const escape = this.operationEscape;
    if (!escape) return;
    escape.node.active = false;
    escape.node.destroy();
    this.operationEscape = undefined;
  }
  private stepOperationEscape(dt: number) {
    const escape = this.operationEscape;
    if (!escape || this.mode !== 'playing') return;
    escape.time += dt;
    const t = escape.time;
    escape.node.setPosition(escape.x + 90 * t + 260 * t * t, escape.y + 60 * t + 190 * t * t);
    escape.node.setScale(1 + t * .25, 1 + t * .25, 1);
    escape.opacity.opacity = Math.round(255 * (1 - clamp((t - .5) / 1.6, 0, 1)));
    if (t >= escape.duration) this.clearOperationEscape();
  }
  private speakOperation(lines: OperationLine[], cinematic = false) {
    const existing = this.operationDialogue;
    if (existing && existing.cinematic === cinematic) { existing.lines.push(...lines); return; }
    this.clearOperationDialogue();
    const { y, readDelay, charTime, hold, slideOut } = OPERATION_DIALOGUE_LAYOUT;
    const dialogue = this.makeStoryDialogue('Operation dialogue', this.canvas, () => {
      const state = this.operationDialogue;
      if (!state || !state.node.active) return;
      const reveal = readDelay + state.lines[state.index][1].length * charTime;
      state.time = state.time < reveal ? reveal : reveal + hold + slideOut;
    });
    dialogue.node.setPosition(-W - STORY_PANEL_WIDTH, y);
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
    const [key, line] = dialogue.lines[dialogue.index];
    const configured = OPERATION_SPEAKERS[key];
    const speaker = 'slot' in configured && !this.battle.allies.some(a => a.slot === configured.slot && a.hp > 0) ?
      OPERATION_SPEAKERS.ghost : configured;
    const { y, readDelay, charTime, hold, slideOut } = OPERATION_DIALOGUE_LAYOUT;
    const typed = readDelay + line.length * charTime;
    dialogue.label.string = line.slice(0, Math.max(0, Math.floor((dialogue.time - readDelay) / charTime + 1e-6)));
    const frame = speaker.frame ? this.streetFrames.get(speaker.frame) :
      this.trainingFrames.get('ghost-face') ?? this.ghostPortrait ?? this.streetFrames.get('op-soldier');
    this.setStorySpeaker(dialogue, speaker.name, speaker.left, frame, key === 'rimelet' ? '#d49a89' : '#ddc18c');
    if (frame) {
      const mutated = key === 'rimelet' && (this.battle.operationRun?.phase === 'king-fight' || this.battle.operationRun?.kingEscaped);
      dialogue.portrait.getComponent(Sprite)!.color = color(mutated ? '#becbb1' : '#ffffff');
    }
    const flight = dialogue.cinematic && this.operationCinema?.root.name === 'Operation flight';
    const radioY = y + (this.battle.survival ? 35 : 0);
    this.placeStoryDialogue(dialogue.node, speaker.left, dialogue.time, typed + hold, flight ? H / 2 - 75 : radioY);
    if (dialogue.time < typed + hold + slideOut) return;
    dialogue.time = 0;
    if (++dialogue.index === dialogue.lines.length) this.clearOperationDialogue();
  }
  private setupStoryPortrait(node: Node, frame: SpriteFrame) {
    const sprite = node.getComponent(Sprite);
    if (sprite) { if (sprite.spriteFrame !== frame) sprite.spriteFrame = frame; }
    else this.setupSprite(node, frame, 66, 68);
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
    intro.node.setPosition(-W / 2 - STORY_PANEL_WIDTH + (STORY_PANEL_WIDTH + 20) * slide, STORY_PANEL_Y);
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
      node.active = this.mode === 'playing' && (index < 3 ? this.suppliesOpen && !b.tutorial && !b.survival : time > 0 && (time >= 3 || Math.floor(b.elapsed * 5) % 2 === 0));
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
    radio.node.setPosition(W / 2 - (STORY_PANEL_WIDTH + 20) * progress, STORY_PANEL_Y);
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
    this.mouseFire = this.mouseQueuedFire = false; // Switching mode is never itself a trigger.
    this.save(); this.uiTick = 0;
  }
  private buildOperationBossHud(parent: Node) {
    const root = this.makeNode('Rimelet health', parent);
    root.active = false;
    const opacity = root.addComponent(UIOpacity);
    const fill = this.graphics('Health under the glass', root);
    const frame = this.streetFrames.get('op-rimelet-health');
    if (frame) this.campaignSprite(root, frame, W / 2, 53, 510, 31);
    const label = this.text('operation-boss-name', OPERATION_BOSS_NAME, W / 2, 83, 21, '#f8e3b2', root, 330, Label.HorizontalAlign.CENTER);
    label.enableOutline = true; label.outlineColor = color('#111718'); label.outlineWidth = 2;
    this.operationBossHud = { root, fill, label, opacity };
  }
  private updateOperationBossHud(dt: number) {
    const hud = this.operationBossHud!;
    const b = this.battle, run = b.operationRun, injection = run?.phase === 'injection';
    const enemy = b.enemies.find(e => e.operationBoss === (injection || run?.phase === 'leader-fight' ? 'leader' : 'king'));
    const chapel = b.stage.operation?.chapel;
    const departing = this.operationEscape?.time;
    let health = this.operationBossFill;
    if (health?.battle !== b) health = undefined;
    const seen = !!enemy && !!chapel && roomAt(b.player, [chapel.bounds]) >= 0;
    hud.root.active = !this.transition && !!enemy && (!!health || seen || injection) &&
      (!run?.kingEscaped || departing !== undefined && departing < 1.15);
    if (!hud.root.active || !enemy) return;
    hud.opacity.opacity = departing === undefined ? 255 : Math.round(255 * (1 - clamp((departing - 0.55) / 0.6, 0, 1)));
    if (!health) health = this.operationBossFill = { battle: b, phase: 'leader', value: injection ? 0 : enemy.hp / enemy.maxHp,
      trail: injection ? 0 : enemy.hp / enemy.maxHp, reveal: 0 };
    const phase = injection ? 'leader' : enemy.operationBoss!;
    if (phase !== health.phase) {
      health.phase = phase;
      health.value = health.trail = 0;
      health.reveal = 0.95;
    }
    const target = injection ? 0 : enemy.hp / enemy.maxHp;
    health.value += (target - health.value) * (1 - Math.exp(-dt * (health.reveal > 0 ? 4 : 14)));
    health.trail += (target - health.trail) * (1 - Math.exp(-dt * (target > health.trail ? 7 : 3.4)));
    health.reveal = Math.max(0, health.reveal - dt);
    const glass = hud.fill; glass.clear();
    const width = 474, x = (W - width) / 2;
    this.sbox(glass, x, 43, width, 20, '#161c20');
    this.sbox(glass, x, 43, width * health.trail, 20, '#d99a61', 205);
    const rows = phase === 'king' ? ['#762723', '#ab392a', '#d95838', '#ef8659'] : ['#902826', '#b13a32', '#d44c3b', '#f07a58'];
    rows.forEach((tint, i) => {
      if (health!.value > 0.001) this.sbox(glass, x, 43 + 5 * i, width * health!.value, 5, tint);
    });
  }
  private attachLittlebirdPods(body: Sprite, width: number, height: number): LittlebirdPod[] {
    const { side, forward } = OPERATION_AIR_PODS;
    const frame = this.streetFrames.get('op-littlebird-pod')!;
    const scale = width / OPERATION_LITTLEBIRD_ART.width;
    return [-1, 1].map(sign => {
      const mount = this.makeNode('Rotary pod mount', body.node);
      mount.setPosition(sign * side * scale, forward * height / OPERATION_LITTLEBIRD_ART.height);
      const perspective = this.makeNode('Rotary pod perspective', mount);
      perspective.setScale(1, 0.56, 1);
      const wheel = this.makeNode('Rotary barrel face', perspective);
      this.setupSprite(wheel, frame, 9.5 * scale, 9.5 * scale);
      wheel.angle = sign * 14;
      return { wheel, flash: this.graphics('Rotary pod flash', mount), spin: 0 };
    });
  }
  private playOperationJet(volume: number) {
    const clip = this.clips.get('jet-flyover');
    if (clip && this.profile.sound) this.audio.playOneShot(clip, volume);
  }
  private updateOperationAirArt(dt: number) {
    const stage = this.battle.stage.operation;
    const run = this.battle.operationRun, extraction = stage?.part === 'defense' ? run?.extraction : undefined;
    const air = this.battle.airSupportFlight;
    const arrival = stage?.part === 'city' && this.operationArrival?.battle === this.battle ? this.operationArrival : undefined;
    if (!air && !arrival && !extraction || this.mode !== 'playing') {
      if (this.airborne) this.airborne.root.active = false;
      return;
    }
    if (!this.airborne || stage && !this.airborne.boarders.length) {
      this.airborne?.root.destroy();
      const root = this.makeNode('Operation air overlay', this.canvas);
      root.setSiblingIndex(this.exitArrow.node.getSiblingIndex());
      root.getComponent(UITransform)!.setContentSize(W, H);
      root.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
      const asset = (id: string, w: number, h: number) => this.campaignSprite(root, this.streetFrames.get(id)!, 0, 0, w, h)!;
      const rope = this.graphics('Extraction rope and ground marker', root);
      const boarders = Array.from({ length: stage ? 4 : 0 }, () => {
        const node = this.makeNode('Rope boarding soldier', root);
        return this.setupSprite(node, this.streetFrames.get('op-soldier')!, OPERATION_SOLDIER_SIZE.width, OPERATION_SOLDIER_SIZE.height);
      });
      const craft = asset('op-blackhawk', 133, 297), rotor = asset('op-rotor', 274, 274);
      const { width, height } = OPERATION_LITTLEBIRD_ART;
      const littlebird = asset('op-littlebird', width, height), littleRotor = asset('op-rotor', 163, 163);
      const pods = this.attachLittlebirdPods(littlebird, width, height);
      this.airborne = { root, craft, rotor, littlebird, littleRotor, rope, boarders, pods };
    }
    const art = this.airborne, p = this.battle.player;
    art.root.active = !this.transition;
    const pose = (body: Sprite, rotor: Sprite, x: number, y: number, bank: number, scale: number, stem: number, visible: boolean) => {
      body.node.active = rotor.node.active = visible;
      const angle = bank * Math.PI / 180;
      body.node.setPosition(x, y);
      rotor.node.setPosition(x - Math.sin(angle) * stem * scale, y + Math.cos(angle) * stem * scale);
      body.node.angle = bank;
      rotor.node.angle = bank + this.presentationTime * 840 % 360;
      body.node.setScale(scale, scale, 1); rotor.node.setScale(scale, scale, 1);
      rotor.color = color('#ffffff', 160);
    };
    if (air) {
      const stageOffset = this.battle.survivalUpperFloor?.offsetX ?? 0;
      pose(art.littlebird, art.littleRotor, air.x - (p.x - stageOffset), air.y - p.y,
        air.heading * 180 / Math.PI - 90, 1, OPERATION_LITTLEBIRD_ART.rotorForward, true);
      art.pods.forEach((pod, index) => {
        const intensity = air.podFlash[index] / OPERATION_AIR_PODS.flashTime;
        const speed = air.mode === 'sweep' ? 1140 : 0;
        pod.spin += (speed - pod.spin) * (1 - Math.exp(-dt * 12));
        pod.wheel.angle = (pod.wheel.angle + dt * pod.spin * (index === 0 ? -1 : 1)) % 360;
        pod.flash.clear();
        if (intensity <= 0) return;
        const length = 12 + intensity * 13, alpha = Math.round(230 * Math.sqrt(intensity));
        polygon(pod.flash, [{ x: -4, y: 0 }, { x: -6, y: 8 }, { x: 0, y: length }, { x: 6, y: 8 }, { x: 4, y: 0 }], '#ee8e38', alpha);
        polygon(pod.flash, [{ x: -2.5, y: 1 }, { x: 0, y: length * 0.71 }, { x: 2.5, y: 1 }], '#fff5c5', alpha);
      });
    } else art.littlebird.node.active = art.littleRotor.node.active = false;
    art.craft.node.active = art.rotor.node.active = false;
    art.rope.clear();
    for (const actor of art.boarders) actor.node.active = false;
    if (arrival) {
      arrival.time += dt;
      const takeoff = operationTakeoffAt(arrival.time);
      pose(art.craft, art.rotor, OPERATION_AIRCRAFT.x - p.x + takeoff.x, OPERATION_AIRCRAFT.y - p.y + takeoff.y,
        takeoff.bank, takeoff.scale, 43, takeoff.visible);
      if (!takeoff.visible) this.operationArrival = undefined;
    }
    if (extraction) {
      const { pickupTime, boarding } = extraction, pad = this.battle.stage.exit;
      const departure = boarding ? Math.max(0, boarding.time - operationBoardingEnd(boarding.actors.length)) : 0;
      const flight = operationExtractionAt(pickupTime, departure);
      const x = pad.x + flight.x - p.x, y = pad.y + flight.y - p.y;
      pose(art.craft, art.rotor, x, y, flight.bank, flight.scale, 43, true);

      const radians = flight.bank * Math.PI / 180, c = Math.cos(radians), s = Math.sin(radians);
      const hatch = { x: x + (c * 61 - s * 7) * flight.scale, y: y + (s * 61 + c * 7) * flight.scale };
      const foot = { x: pad.x + flight.foot.x - p.x, y: pad.y + flight.foot.y - p.y };
      const g = art.rope;
      if (flight.rope > 0) {
        const sway = Math.sin(pickupTime * 8.4) * (1 - flight.rope) * 41;
        const end = { x: hatch.x + (foot.x - hatch.x) * flight.rope + sway, y: hatch.y + (foot.y - hatch.y) * flight.rope };
        if (pickupTime >= OPERATION_PICKUP_READY && !boarding) {
          const radius = 24 + 3 * Math.sin(this.presentationTime * 4);
          disc(g, foot.x, foot.y, radius, '#d8ab5d', 46);
          g.strokeColor = color('#f4d490', 210); g.lineWidth = 2;
          g.circle(foot.x, foot.y, radius); g.stroke();
        }
        const loose = (1 - flight.rope) * 29;
        const path = Array.from({ length: 8 }, (_, i) => {
          const t = i / 7;
          return { x: hatch.x + (end.x - hatch.x) * t + loose * Math.sin(t * Math.PI) * Math.cos(pickupTime * 7 - t * 5),
            y: hatch.y + (end.y - hatch.y) * t };
        });
        for (let i = 1; i < path.length; i++) {
          const a = path[i - 1], b = path[i];
          line(g, a.x + 2, a.y - 1, b.x + 2, b.y - 1, '#242322', 5, 178);
          line(g, a.x, a.y, b.x, b.y, '#b59459', 3);
          line(g, a.x - 0.7, a.y, b.x - 0.7, b.y, '#f3d99b', 1.15, 232);
        }
        disc(g, end.x, end.y, 3, '#dec999');
      }
      if (boarding) boarding.actors.forEach((unit, index) => {
        const actor = art.boarders[index], frame = operationBoarderAt(boarding.time, index);
        if (!actor || !frame.visible) return;
        const ghost = unit.id === 0;
        actor.spriteFrame = (ghost ? this.artFrames.get('operator') : this.streetFrames.get('op-soldier'))!;
        const tr = actor.node.getComponent(UITransform)!;
        tr.setContentSize(ghost ? OPERATION_GHOST_SIZE : OPERATION_SOLDIER_SIZE.width, ghost ? OPERATION_GHOST_SIZE : OPERATION_SOLDIER_SIZE.height);
        tr.setAnchorPoint(ghost ? 0.36 : 0.5, ghost ? 0.5 : 0.32);
        const rally = { x: unit.rally.x - p.x, y: unit.rally.y - p.y };
        const gatherX = unit.x - p.x + (unit.rally.x - unit.x) * frame.gather;
        const gatherY = unit.y - p.y + (unit.rally.y - unit.y) * frame.gather;
        const walkX = gatherX + (foot.x - gatherX) * frame.walk;
        const walkY = gatherY + (foot.y - gatherY) * frame.walk;
        actor.node.active = true;
        actor.node.setPosition(walkX + (hatch.x - walkX) * frame.climb, walkY + (hatch.y - walkY) * frame.climb);
        actor.node.setScale(1 - 0.18 * frame.climb, 1 - 0.18 * frame.climb, 1);
        const angle = frame.climb > 0 ? Math.atan2(hatch.y - foot.y, hatch.x - foot.x) :
          frame.walk > 0 || frame.gather === 1 ? Math.atan2(foot.y - rally.y, foot.x - rally.x) :
          Math.atan2(unit.rally.y - unit.y, unit.rally.x - unit.x);
        actor.node.angle = (boarding.time < 0.04 ? unit.angle : angle) * 180 / Math.PI - (ghost ? 0 : 90);
      });
    }
  }
  private callOperationAir() {
    const run = this.battle.operationRun;
    if (!run || this.transition || this.mode !== 'playing') return;
    if (this.battle.useOperationSupport()) { this.uiTick = 0; return; }
    this.toast(run.air ? '小鸟正在支援' : run.airCooldown > 0 ? '小鸟整备中 · ' + Math.ceil(run.airCooldown) + ' 秒' :
      !run.airSupport ? '室内无法呼叫小鸟' : '小鸟待命 · 进入战区后可呼叫');
  }
  private operationMouseGrenadeAim() {
    const dx = this.mx - W / 2 - this.feedback.x, dy = this.my - H / 2 - this.feedback.y;
    const distance = Math.hypot(dx, dy);
    return distance > 1 ? { angle: Math.atan2(dy, dx), range: clamp(distance, 45, OPERATION_GRENADE_RANGE) } :
      { angle: this.battle.player.angle, range: 150 };
  }
  private useTactical(angle?: number, range?: number) {
    if (this.transition || this.mode !== 'playing') return;
    if (this.battle.throwTactical(angle, range)) { this.uiTick = 0; return; }
    this.toast(this.battle.tacticalBlock ?? (isShopMine(this.battle.tactical.selected) ? '此处暂时无法布置地雷' : '当前动作无法投掷'));
  }
  private aimedTacticalButton() {
    return !!this.battle.survival || !!this.battle.operationRun && this.battle.tactical.selected === 'grenade';
  }
  private releaseTacticalThrow(angle: number, range: number) {
    if (this.battle.survival) this.useSurvivalTactical('throw', angle, range);
    else this.useTactical(angle, range);
  }
  private useSurvivalTactical(slot: keyof SurvivalBindings, angle?: number, range?: number) {
    if (this.transition || this.mode !== 'playing' || this.suppliesOpen || this.survivalWorkshopOpen || this.survivalCrateId ||
        this.survivalDoorPanel || this.survivalVehiclePanel) return;
    const b = this.battle, kind = b.survivalBindings[slot];
    if (!kind) { this.toast('在背包中设置 ' + (slot === 'throw' ? 'G 投掷' : 'T 布雷')); return; }
    const item = b.survivalBag?.items.find(item => item.kind === kind);
    if (!item) { this.toast(SURVIVAL_GEAR[kind][0] + '已用完'); return; }
    if (b.useSurvivalItem(item.id, angle, range)) { this.uiTick = 0; return; }
    this.toast(b.tacticalInputBlock ?? (slot === 'throw' && b.survivalThrowCooldown > 0
      ? '投掷冷却 ' + b.survivalThrowCooldown.toFixed(1) + ' 秒' : '前方没有足够的布置空间'));
  }
  private time(n: number) { return `${Math.floor(n / 60).toString().padStart(2, '0')}:${Math.floor(n % 60).toString().padStart(2, '0')}`; }
  private hudTextWidth(value: string, size: number) {
    return Math.ceil(Array.from(value).reduce((width, char) => width + (char === ' ' ? .34 : char.charCodeAt(0) < 128 ? .62 : 1), 0) * size);
  }
  private fitHudIcon(sprite: Sprite, name: HudFrame, maxSize: number) {
    const frame = this.battleHudFrames.get(name);
    if (!frame) return;
    if (sprite.spriteFrame !== frame) sprite.spriteFrame = frame;
    const { width, height } = frame.originalSize;
    const scale = maxSize / Math.max(width, height);
    sprite.node.getComponent(UITransform)!.setContentSize(width * scale, height * scale);
  }
  private messageLabel(id: string, value: string, x: number, size: number, fill: string, root: Node, width: number, align = Label.HorizontalAlign.LEFT) {
    const label = this.text(id, value, W / 2 + x, H / 2, size, fill, root, width, align);
    label.enableWrapText = false;
    label.overflow = Label.Overflow.SHRINK;
    label.node.getComponent(UITransform)!.width = width;
    return label;
  }
  private drawBattlePrompt(prompt: BattlePrompt | undefined) {
    const panel = this.promptHud;
    if (!panel) {
      if (prompt) {
        this.sbox(this.hud, 388, 77, 440, 40, C.ink, 220);
        this.text('door-context', [prompt.title, prompt.detail, prompt.badge].filter(Boolean).join('  ·  '),
          608, 97, 15, C.gold, this.canvas, 430, Label.HorizontalAlign.CENTER);
      } else if (this.labels.has('door-context')) this.labels.get('door-context')!.string = '';
      return;
    }
    panel.root.active = !!prompt;
    if (!prompt) return;
    const { title, detail = '', badge } = prompt;
    const titleSize = sys.isMobile ? 18 : 16, detailSize = sys.isMobile ? 16 : 13;
    const detailWidth = detail ? this.hudTextWidth(detail, detailSize) + 18 : 0;
    const badgeWidth = Math.max(62, this.hudTextWidth(badge, detailSize) + 24);
    const width = clamp(this.hudTextWidth(title, titleSize) + detailWidth + badgeWidth + 76, 255, 460);
    const left = -width / 2, badgeX = width / 2 - 15 - badgeWidth / 2, detailX = badgeX - badgeWidth / 2 - detailWidth;
    panel.plate.node.getComponent(UITransform)!.width = width / PANEL_SCALE;
    panel.icon.node.setPosition(left + 25, 0);
    this.fitHudIcon(panel.icon, this.battleHudFrames.has(prompt.icon) ? prompt.icon : 'interact', 21);
    panel.badge.node.getComponent(UITransform)!.width = badgeWidth;
    panel.badge.node.setPosition(badgeX, 0);
    this.messageLabel('door-context', title, left + 44, titleSize, '#eee0c7', panel.root, detailX - left - 50);
    this.messageLabel('door-context-detail', detail, detailX, detailSize, '#c7c4b5', panel.root, detailWidth);
    this.messageLabel('door-context-key', badge, badgeX, detailSize, '#f1d295', panel.root, badgeWidth - 11, Label.HorizontalAlign.CENTER);
  }
  private drawBattleNotice(visible: boolean, y: number) {
    const panel = this.noticeHud;
    if (!panel) {
      if (visible) {
        this.sbox(this.hud, 345, y, 590, 42, C.ink, 225);
        this.text('toast', this.notice, 640, y + 21, 17, C.gold, this.canvas, 570, Label.HorizontalAlign.CENTER);
      } else if (this.labels.has('toast')) this.labels.get('toast')!.string = '';
      return;
    }
    panel.root.active = visible;
    if (!visible) return;
    const size = sys.isMobile ? 18 : 16, width = clamp(this.hudTextWidth(this.notice, size) + 83, 220, 565);
    const kind = this.battleHudFrames.has(this.noticeKind) ? this.noticeKind : 'inspect';
    panel.root.setPosition(0, y + 21 - H / 2);
    panel.plate.node.getComponent(UITransform)!.width = width / PANEL_SCALE;
    this.fitHudIcon(panel.icon, kind, 20);
    panel.icon.node.setPosition(-width / 2 + 32, 0);
    this.messageLabel('toast', this.notice, 15.5, size,
      kind === 'warning' ? '#ffcc80' : '#f1e2c5', panel.root, width - 75, Label.HorizontalAlign.CENTER);
    this.updateBattleNoticeFade();
  }
  private updateBattleNoticeFade() {
    const panel = this.noticeHud;
    if (!panel?.root.active) return;
    if (this.noticeTime <= 0) { panel.root.active = false; return; }
    const fade = Math.min((this.presentationTime - this.noticeSince) / .12, this.noticeTime / .23);
    panel.opacity.opacity = Math.round(clamp(fade, 0, 1) * 255);
  }
  private updateBattlePortrait() {
    const status = this.playerStatus, hero = this.battle.heroId;
    if (!status) return;
    const frame = hero === ENGINEER_ID ? this.trainingFrames.get('weichuan-face') ?? this.streetFrames.get('engineer-portrait') :
      hero === GHOST_ID ? this.trainingFrames.get('ghost-face') ?? this.ghostPortrait ?? this.artFrames.get('operator') :
        this.trainingFrames.get('lin-face') ?? this.linPortrait ?? this.artFrames.get('heroine');
    if (!frame) return;
    this.labels.get('portrait')!.node.active = false;
    const portrait = status.portrait.getComponent(Sprite);
    if (portrait?.spriteFrame === frame) return;
    if (portrait) portrait.spriteFrame = frame;
    const { width, height } = frame.originalSize;
    const fit = 60 / Math.min(width, height);
    if (portrait) status.portrait.getComponent(UITransform)!.setContentSize(width * fit, height * fit);
    else this.setupSprite(status.portrait, frame, width * fit, height * fit);
  }
  private updateBattleHealth(dt: number) {
    const status = this.playerStatus, p = this.battle.player;
    if (!status) return;
    const ratio = p.hp / p.maxHp;
    this.playerHealth.step(ratio, dt);
    status.fill.color = color(ratio <= .25 ? '#ff6863' : '#ffffff');
    for (const [sprite, value] of [[status.fill, this.playerHealth.fill], [status.trail, this.playerHealth.trail]] as const) {
      sprite.node.active = value > 0;
      sprite.node.getComponent(UITransform)!.width = HEALTH_W * value;
    }
  }
  private updateHud() {
    const g = this.hud, b = this.battle, p = b.player; g.clear();
    const a = HUD.auto, on = this.profile.autoFire;
    this.soutline(g, a.x, a.y, a.w, a.h, on ? C.gold : C.line);
    this.text('auto-fire-state', `AUTO ${on ? 'ON' : 'OFF'}`, a.x + a.w / 2, a.y + a.h * 0.68, 18, on ? C.gold : C.text, this.canvas, a.w, Label.HorizontalAlign.CENTER);
    const reason = b.shootBlockReason();
    this.text('auto-fire-reason', on ? reason ? `禁火:${reason}` : (this.sweeping ? '转向中' : '自动射击') : '手动射击', a.x + a.w / 2, a.y + a.h * 0.24, 14, on && reason ? C.gold : C.text, this.canvas, a.w, Label.HorizontalAlign.CENTER);
    if (!this.playerStatus) {
      this.sbox(g, 113, 672, 205, 8, '#293c3e');
      this.sbox(g, 113, 672, 205 * clamp(p.hp / p.maxHp, 0, 1), 8, p.hp / p.maxHp <= 0.25 ? C.red : C.jade);
    }
    this.updateBattlePortrait();
    const health = this.labels.get('health')!;
    health.string = `生命 ${Math.ceil(p.hp)} / ${p.maxHp}`;
    health.color = color(p.hp / p.maxHp <= .25 ? '#f19a83' : C.jade);
    const room = Math.max(0, roomAt(p, this.battle.rooms));
    const intruders = b.enemies.filter(e => e.hp > 0 && e.room !== room && roomAt(e, b.rooms) === room).length;
    const remaining = b.enemies.filter(e => e.room === room && e.hp > 0).length + intruders, safe = b.cleared[room] && intruders === 0;
    this.labels.get('objective')!.string = b.stage.operation ? b.stage.title : b.stage.apartment ? `${b.stage.title}  /  ${b.rooms[room].kind}` : b.stage.street ? `归途  /  ${b.rooms[room].kind}` : b.stage.dorm ? `宿舍楼 ${b.stage.dorm.number}F  /  ${b.rooms[room].kind}` : b.cleared.every(Boolean) ? '前往洗衣房东北角楼梯撤离' : `${b.rooms[room].kind}  /  ${safe ? '区域安全' : intruders ? '应对追击' : '清理威胁'}`;
    this.labels.get('sub-objective')!.string = b.stage.operation || b.stage.dorm || b.stage.street || b.apartment ? `${this.time(b.elapsed)}    ·    ${b.alarmTime !== null && b.stage.dorm ? '警报响起  ·  ' : ''}${b.objective}` : `${this.time(b.elapsed)}    ·    已清理 ${b.cleared.filter(Boolean).length} / ${b.rooms.length}    ·    ${safe ? b.stage.hints[room] : `当前区域剩余威胁 ${remaining}`}`;
    if (b.survival) this.updateSurvivalHud();
    this.drawMinimap(g);
    this.labels.get('ammo')!.string = p.reload > 0 ? `换弹 ${p.reload.toFixed(1)}s` : `${String(p.ammo).padStart(2, '0')} / ${b.reserveAmmo}`;
    this.labels.get('ammo')!.color = color(p.ammo < 5 || p.reload > 0 ? C.gold : C.text);
    this.labels.get('gun')!.string = b.hero.gun;
    if (!b.survival) {
    if (!this.supplyUiFrames.has('backpack')) {
      this.sbox(g, 1170, 365, 75, 48, '#172328', 245);
      this.soutline(g, 1170, 365, 75, 48, C.gold);
    }
    this.text('supply-toggle-text', this.suppliesOpen ? '收起' : b.survival ? '背包' : '补给', 1207, 357, 12, C.text, this.canvas, 70, Label.HorizontalAlign.CENTER);
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
    }
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
    const target = b.nearbyObjective(), loot = b.nearbyPickup(), clue = b.nearbyClue();
    const door = b.survival ? b.nearbySurvivalDoor() : b.nearbyDoor();
    const crate = !target && b.survival ? b.nearbySurvivalCrate() : undefined;
    for (const visibleClue of b.visibleClues()) {
      const found = this.profile.clues.includes(visibleClue.id), x = visibleClue.surface.x - p.x + W / 2, y = visibleClue.surface.y - p.y + H / 2;
      this.soutline(g, x - 18, y - 18, 36, 36, found ? '#e4d49a' : C.gold, found ? 160 : 245);
      this.sbox(g, x - 12, y - 12, 24, 24, found ? '#e4d49a' : '#d9ad4d', found ? 100 : 190);
    }
    const free = !t && !b.floorPending && !b.evacuationDrive && b.operationRun?.phase !== 'boarding';
    const handsFree = free && b.generatorProgress === undefined && !b.survivalDoorWork && !this.survivalVehiclePanel;
    const verb = crate ? (crate.opened ? '查看' : '开箱') : clue ? '调查' : target ? target.id === 'apartment' ? target.verb :
      target.id === 'survival-board' ? '上车' : target.id === 'survival-vehicle' ? b.survivalVehicleStatus(target.vehicle).ready ? '撤离' : '检查' :
      target.id === 'operation-board' ? '登机' : target.id === 'survival-workbench' ? '制作' : target.id === 'survival-radio' ? '电台' : '下楼' :
      door ? door.destroyed ? '工事' : door.locked ? '开锁' : Math.abs(door.target - door.baseAngle) < 0.01 ? '开门' : '关门' : '';
    const kits = b.apartment?.kits ?? 0;
    this.showHudAction('door', HUD.door, handsFree && (!!verb || !!this.survivalDoorHold?.opened), 'door-button', verb, 'E');
    this.showHudAction('pickup', HUD.pickup, handsFree && !!loot, 'pickup-button', loot?.id === 'survival-drop' ? SURVIVAL_GEAR[loot.dropped.goods[0].kind][0] : '拾取', 'F');
    this.showHudAction('apartment-trap', HUD.trap, free && kits > 0, 'apartment-trap-count', `陷阱 ×${kits}`, 'T');
    const tactical = b.tactical.selected;
    if (b.survival) {
      const visible = handsFree && !this.suppliesOpen && !this.survivalWorkshopOpen && !this.survivalCrateId && !this.survivalDoorPanel;
      for (const [slot, id, rect, key, title] of [
        ['throw', 'grenade', HUD.grenade, 'G', '投掷'], ['mine', 'survival-mine', HUD.trap, 'T', '布雷'],
      ] as const) {
        const kind = b.survivalBindings[slot], count = kind ? b.survivalCount(kind) : 0;
        this.updateTacticalHudIcon(id, this.survivalItemFrame(kind ?? (slot === 'throw' ? 'grenade' : 'mine')), !count || !!b.tacticalInputBlock);
        this.showHudAction(id, rect, visible, id + '-label', kind ? SURVIVAL_GEAR[kind][0] + ' ×' + count : title + '未绑定', key);
      }
    } else {
      this.updateTacticalHudIcon('grenade', undefined, !!b.tacticalBlock);
      this.showHudAction('grenade', HUD.grenade, free && !!tactical && b.tactical.remaining > 0, 'grenade-label',
        tactical ? TACTICAL_DEFINITIONS[tactical].title + ' ×' + b.tactical.remaining : '', 'G');
    }
    const air = b.operationRun?.air;
    const airLabel = air?.mode === 'outbound' ? '小鸟返航' : air?.onStation === undefined ? air ? '小鸟进场' : '小鸟支援' :
      '支援 ' + Math.max(0, Math.ceil(OPERATION_AIR_DURATION - air.onStation)) + ' 秒';
    this.showHudAction('air', HUD.air, free && !!b.operationRun?.airSupport, 'air-label', airLabel, 'V');
    let prompt: BattlePrompt | undefined;
    if (handsFree) {
      const badge = sys.isMobile ? verb : 'E · ' + verb;
      const barricade = door?.fortification;
      if (crate) prompt = { title: SURVIVAL_CRATE_LABELS[crate.kind], badge, icon: 'supplies' };
      else if (clue) prompt = { title: CLUE_SPECS.find(c => c.id === clue.id)!.title, badge, icon: 'inspect',
        detail: this.profile.clues.includes(clue.id) ? '可重复阅读' : '首次调查' };
      else if (target) {
        const [title, detail] = target.name.split(' · ', 2);
        const icon = target.id === 'survival-radio' ? 'radio' : target.id === 'survival-workbench' ? 'work' :
          target.id === 'descend' || target.id === 'apartment' && target.station === 'stairs' ? 'stairs' : 'interact';
        prompt = { title, detail, badge, icon };
      } else if (door) {
        const durability = `耐久 ${Math.ceil(door.hp)}/${door.maxHp}`;
        if (barricade) prompt = { title: door.name + ' · ' + SURVIVAL_DOORS[barricade].title,
          detail: door.destroyed ? '可重装' : durability, badge: door.destroyed ? badge : sys.isMobile ? '长按交互' : '长按 E · 工事', icon: 'door' };
        else prompt = { title: door.name, badge, icon: 'door', detail: door.locked ? (door.key === 'stairs' ? '需要楼梯钥匙' : '需要大门钥匙') :
          door.alarm && b.alarmTime === null ? '警报装置待机' : door.material === 'steel' ? '不可破坏' : durability };
      } else if (loot) {
        const [title, detail] = loot.name.split(' · ', 2);
        prompt = { title, detail: detail === '拾取' ? undefined : detail, badge: sys.isMobile ? '拾取' : 'F · 拾取', icon: 'supplies' };
      }
    }
    this.drawBattlePrompt(prompt);
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
    const grenade = this.operationGrenadeTouch ?? (this.operationGrenadeKey ? this.operationMouseGrenadeAim() : undefined);
    const throwKind = b.survival ? b.survivalBindings.throw : b.tactical.selected;
    const readyThrow = b.survival ? !!throwKind && isSurvivalThrowable(throwKind) && !!b.survivalCount(throwKind) &&
      b.survivalThrowCooldown <= 0 && !b.tacticalInputBlock : throwKind === 'grenade' && !b.tacticalBlock;
    if (grenade && readyThrow && isSurvivalThrowable(throwKind)) {
      const range = Math.min(grenade.range, SURVIVAL_THROWABLES[throwKind].range);
      const { bounces, impact } = throwKind === 'grenade' ? b.operationGrenadePreview(grenade.angle, range) :
        { bounces: [], impact: b.grenadeAim(grenade.angle, range, range) };
      let x = W / 2 + this.feedback.x, y = H / 2 + this.feedback.y;
      for (const [i, point] of [...bounces, impact].entries()) {
        const nx = W / 2 + this.feedback.x + point.x - p.x, ny = H / 2 + this.feedback.y + point.y - p.y;
        this.sline(g, x, y, nx, ny, '#f0d29c', 1.8, i === 0 ? 190 : 126);
        x = nx; y = ny;
        if (i < bounces.length) disc(g, x - W / 2, y - H / 2, 4, '#efcb83', 200);
      }
      g.strokeColor = color('#f0bd70', 195); g.lineWidth = 2;
      g.circle(x - W / 2, y - H / 2, 22); g.stroke();
    }
    // Crosshair is part of HUD: it must not disclose unseen enemies.
    if (!sys.isMobile && !this.overSurvivalBag(this.mx, this.my)) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) this.sline(g, this.mx + dx * 6, this.my + dy * 6, this.mx + dx * 14, this.my + dy * 14, C.gold, 1.5, 200);
    }
    const gearPanel = this.suppliesOpen || this.survivalWorkshopOpen || this.survivalCrateId || this.survivalDoorPanel || this.survivalVehiclePanel;
    this.drawBattleNotice(this.noticeTime > 0 && !t, b.survival && gearPanel ? 608 : 549);
    if (b.survival) this.drawSurvivalBagHud();
  }
  private updateSurvivalHud() {
    const b = this.battle, run = b.survival!, plan = b.stage.survival!;
    const title = this.labels.get('objective')!, detail = this.labels.get('sub-objective')!;
    const floor = b.survivalFloorView;
    const atHouse = floor || plan.stairs.some(stair => roomAt(b.player, [b.rooms[stair.lowerRoom]]) >= 0);
    const level = floor?.moving ? '楼梯间' : floor?.upstairs ? '二楼' : '一楼';
    const floorLabel = atHouse ? '　·　' + level : '';
    const now = b.elapsed;
    const fuel = (['helicopter', 'boat'] as const).find(id => b.survivalVehicleStatus(id).fuel !== undefined && !b.survivalVehicleStatus(id).ready);
    title.string = (now >= CONVOY_LEAVE ? '最后追击　' + this.time(Math.ceil(SURVIVAL_DEADLINE - now)) :
      now >= CONVOY_ARRIVAL ? '车队撤离　' + this.time(Math.ceil(CONVOY_LEAVE - now)) :
        now >= BLOOD_MOON ? '血月 · 车队抵达 ' + this.time(Math.ceil(CONVOY_ARRIVAL - now)) :
          '距离血月　' + this.time(Math.ceil(BLOOD_MOON - now))) + floorLabel;
    title.color = color(now >= BLOOD_MOON || fuel ? '#ff9f75' : '#ecd8b8');
    detail.string = (fuel ? EVAC_VEHICLES[fuel].name + '加油 ' + Math.ceil(b.survivalVehicleStatus(fuel).fuel ?? 0) + ' 秒　·　' : '') +
      '奖励池　金币 ' + (run.pool.coins + run.salvage) + '　材料 ' + run.pool.materials;
    const air = b.airSupportFlight, queued = b.pendingAirSupport;
    if (air || queued) {
      const status = !air || air.mode === 'inbound' ? '小鸟进场' : air.mode === 'outbound' ? '小鸟返航' :
        '小鸟支援 ' + Math.ceil(air.supportTime - (air.onStation ?? 0)) + ' 秒';
      this.text('survival-air-status', status + (queued ? ' · 待命 ' + queued : ''), HUD.map.x + HUD.map.w / 2,
        HUD.map.y - 28, 14, '#e5bf81', this.canvas, HUD.map.w + 22, Label.HorizontalAlign.CENTER);
    } else if (this.labels.has('survival-air-status')) this.labels.get('survival-air-status')!.string = '';
  }
  private overSurvivalBag(x: number, y: number) {
    if (!this.battle.survival) return false;
    const panels = [this.suppliesOpen ? SURVIVAL_BAG : undefined,
      this.survivalWorkshopOpen ? SURVIVAL_WORKSHOP : undefined, this.survivalCrateId ? SURVIVAL_CRATE_PANEL : undefined,
      this.survivalDoorPanel ? SURVIVAL_DOOR_PANEL : undefined, this.survivalVehiclePanel ? SURVIVAL_VEHICLE_PANEL : undefined];
    return panels.some(r => r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  }
  private toggleSurvivalQuick() {
    this.survivalQuickOpen = !this.suppliesOpen && !this.survivalQuickOpen;
    this.suppliesOpen = this.survivalWorkshopOpen = false;
    this.survivalDoorPanel = undefined;
    this.survivalVehiclePanel = undefined;
    this.survivalCrateId = undefined;
    this.survivalHeldItem = undefined;
    this.survivalDrag = this.survivalRotatePreview = undefined;
    this.mouseFire = this.mouseQueuedFire = false;
    this.updateHud();
  }
  private toggleSurvivalBag() {
    this.suppliesOpen = !this.suppliesOpen;
    this.survivalWorkshopOpen = false;
    this.survivalDoorPanel = undefined;
    this.survivalHeldItem = undefined;
    this.survivalDrag = this.survivalRotatePreview = undefined;
    this.mouseFire = this.mouseQueuedFire = false;
    this.updateHud();
  }
  private closeSurvivalPanels() {
    this.suppliesOpen = this.survivalQuickOpen = this.survivalWorkshopOpen = false;
    this.survivalDoorPanel = undefined;
    this.survivalVehiclePanel = undefined;
    this.survivalCrateId = undefined; this.survivalHeldItem = undefined;
    this.survivalDrag = this.survivalRotatePreview = undefined;
    this.updateHud();
  }
  private openSurvivalDoorPanel(id: number) {
    const door = this.battle.nearbySurvivalDoor(id);
    if (!door || this.battle.survivalDoorWork) return;
    this.suppliesOpen = this.survivalQuickOpen = this.survivalWorkshopOpen = false;
    this.survivalCrateId = undefined; this.survivalHeldItem = undefined;
    this.survivalDoorPanel = { id, replacement: door.destroyed ? door.fortification : undefined };
    this.mouseFire = this.mouseQueuedFire = false;
    this.updateHud();
  }
  private startSurvivalDoorHold(owner: number) {
    if (this.mode !== 'playing' || this.transition || this.survivalDoorHold || this.survivalDoorPanel ||
        this.battle.survivalDoorWork || !this.battle.survival || this.battle.nearbyObjective()) return false;
    const door = this.battle.nearbySurvivalDoor();
    if (!door) return false;
    this.survivalDoorHold = { owner, id: door.id, left: SURVIVAL_DOOR_HOLD, opened: false };
    return true;
  }
  private stepSurvivalDoorHold(dt: number) {
    const hold = this.survivalDoorHold;
    if (!hold || hold.opened) return;
    if (!this.battle.nearbySurvivalDoor(hold.id)) { this.survivalDoorHold = undefined; return; }
    hold.left -= dt;
    if (hold.left > 0) return;
    hold.opened = true;
    this.openSurvivalDoorPanel(hold.id);
  }
  private survivalItemFrame(kind: GearKind) {
    const newArt = this.timedSurvivalFrames.get(kind);
    if (newArt) return newArt;
    if (kind === 'mod-cache') return this.shopFrames.get('parts');
    if (kind === 'grenade') return this.grenadeFrame;
    if (kind === 'flashbang') return this.shopFrames.get('flashbang');
    if (kind === 'special-ammo') return this.itemFrames.get('rifle-ammo');
    if (kind === 'scanner') return this.survivalGearFrames.get(kind);
    if (isSurvivalGun(kind)) return this.shopFrames.get(FIXED_WEAPON_ART[SURVIVAL_GUNS[kind].hero]);
    return this.survivalGearFrames.get(kind) ?? (kind === 'shock-mine' ? this.shopFrames.get('shock-mine') : this.itemFrames.get(kind));
  }
  private useSurvivalBagItem(id: number | null | undefined) {
    const item = this.battle.survivalBag?.item(id);
    if (!item) return;
    if (this.battle.useSurvivalItem(item.id)) {
      if ((item.kind === 'scanner' || item.kind === 'sentry' || isSurvivalThrowable(item.kind) || isSurvivalMine(item.kind)) && this.suppliesOpen) this.toggleSurvivalBag();
      if (item.kind === 'scanner' && this.saveSurvivalCheckpoint()) {
        this.toast(this.battle.pendingAirSupport ? '已预约小鸟 · 待命 ' + this.battle.pendingAirSupport + ' 架' : '打击终端已启用 · 小鸟进场');
      }
      this.uiTick = 0;
    } else if (isSurvivalGun(item.kind)) {
      this.toast(SURVIVAL_GUNS[item.kind].hero !== this.battle.heroId ? '该武器限 ' + heroes[SURVIVAL_GUNS[item.kind].hero].name + ' 装备' :
        this.battle.survivalSpecial ? '无法替换 · 请为换下的武器腾出空间' : '当前动作无法装备');
    } else {
      this.toast(['sentry', 'shock-mine', 'mine'].includes(item.kind) ? '前方没有足够的布置空间' :
        item.kind === 'special-ammo' ? '需要先装备一把特殊武器' : '此时无法使用或背包空间不足');
    }
  }
  private buildSurvivalBagHud() {
    const b = this.battle, bag = b.survivalBag!, layout = SURVIVAL_BAG, q = SURVIVAL_QUICK;
    this.survivalBagLayer = this.makeNode('Survival gear overlay', this.canvas);
    this.survivalBagSkin = this.makeNode('Textured panels', this.survivalBagLayer);
    this.survivalBagArt = this.graphics('Inventory highlights', this.survivalBagLayer);
    this.survivalBagItemLayer = this.makeNode('Inventory item models', this.survivalBagLayer);
    const bind = (name: string, x: number, y: number, w: number, h: number, run: () => void) =>
      this.addButton('gear-' + name, x, y, w, h, () => { run(); this.uiTick = 0; });
    bind('blocker', layout.x, layout.y, layout.w, layout.h, () => {});
    bind('toggle', SURVIVAL_BAG_BUTTON.x, SURVIVAL_BAG_BUTTON.y, SURVIVAL_BAG_BUTTON.w, SURVIVAL_BAG_BUTTON.h, () => this.toggleSurvivalQuick());
    bind('all', q.x - 68, q.y, 61, q.h, () => this.toggleSurvivalBag());
    for (let i = 0; i < 3; i++) bind('quick-' + i, q.x + i * 67, q.y, q.w, q.h, () => this.useSurvivalBagItem(bag.quick[i]));
    const close = SURVIVAL_BAG_CLOSE;
    bind('close', close.x, close.y, close.w, close.h, () => this.toggleSurvivalBag());
    const vehiclePanel = SURVIVAL_VEHICLE_PANEL;
    bind('vehicle-blocker', vehiclePanel.x, vehiclePanel.y, vehiclePanel.w, vehiclePanel.h, () => {});
    bind('vehicle-close', 941, 546, 54, 36, () => this.closeSurvivalPanels());
    for (let i = 0; i < 5; i++) bind('vehicle-fit-' + i, 859, 477 - 51 * i, 116, 36, () => {
      const id = this.survivalVehiclePanel;
      if (id && b.fitSurvivalPart(id, i)) this.play('unlock');
    });
    bind('vehicle-start', 716, 177, 258, 51, () => {
      const id = this.survivalVehiclePanel;
      if (!id) return;
      const status = b.survivalVehicleStatus(id);
      if (!(status.ready ? b.boardSurvival(id) : b.beginSurvivalFuel(id))) return;
      this.closeSurvivalPanels();
      if (!status.ready) this.toast('加油开始 · 尸群正在被引来', 4, 'warning');
    });
    for (const tab of [SUPPLY_WORKSHOP_RECIPES, SENTRY_WORKSHOP_RECIPES]) tab.forEach((recipe, i) =>
      bind('recipe-' + recipe, 644, 468 - 44 * i, 216, 39, () => { this.survivalRecipe = recipe; }));
    bind('recipe-ammo', 644, 468 - 44 * SUPPLY_WORKSHOP_RECIPES.length, 216, 39, () => { this.survivalRecipe = 'special-ammo'; });
    bind('work-supply', 644, 515, 103, 32, () => { this.survivalRecipe = 'grenade'; });
    bind('work-sentry', 755, 515, 105, 32, () => { this.survivalRecipe = 'sentry'; });
    bind('workshop-close', 1073, 543, 61, 34, () => this.closeSurvivalPanels());
    bind('fort-close', 1060, 543, 61, 34, () => this.closeSurvivalPanels());
    bind('fort-repair', 645, 466, 182, 37, () => {
      if (this.survivalDoorPanel) this.survivalDoorPanel.replacement = undefined;
    });
    SURVIVAL_DOOR_KINDS.forEach((kind, i) => bind('fort-kind-' + i, 645, 419 - i * 41, 182, 36, () => {
      if (this.survivalDoorPanel) this.survivalDoorPanel.replacement = kind;
    }));
    bind('fort-confirm', 859, 221, 235, 42, () => {
      const selection = this.survivalDoorPanel;
      if (!selection) return;
      if (b.startSurvivalDoorWork(selection.id, selection.replacement)) {
        this.closeSurvivalPanels();
      } else this.toast(b.survivalDoorPlan(selection.id, selection.replacement)?.reason ?? '当前无法施工', undefined, 'warning');
    });
    const craft = (toGround: boolean) => {
      const recipe = this.survivalRecipe, result = b.craftSurvival(recipe, false, toGround), ammo = b.survivalAmmoRecipe;
      if (result === 'ok') {
        this.play('loot');
        this.toast(recipe === 'special-ammo' && ammo ? ammo.title + ' · 备弹 +' + ammo.rounds : SURVIVAL_GEAR[recipe][0] + ' 已放入背包');
      } else if (result === 'dropped') {
        this.play('loot');
        this.closeSurvivalPanels();
        this.toast(SURVIVAL_GEAR[recipe][0] + ' 已放在台边');
      } else this.toast(result === 'space' ? '成品需要一块连续空位' : result === 'materials' ? '制作材料不足' :
        result === 'ground-blocked' ? '台边没有空位，请先清理掉落物' : result === 'changed' ? '背包已有空位，可直接制作入包' :
        result === 'weapon' ? '先在背包装备特殊武器' : result === 'full' ? '备弹已接近上限' : '请靠近工事工作台');
    };
    bind('craft', 902, 229, 210, 43, () => craft(false));
    bind('craft-drop', 902, 229, 210, 43, () => craft(true));
    const crateRect = SURVIVAL_CRATE_PANEL;
    bind('crate-close', crateRect.x + 12, crateRect.y + 12, 80, 34, () => { this.survivalCrateId = undefined; });
    bind('crate-all', crateRect.x + 128, crateRect.y + 12, 80, 34, () => this.toggleSurvivalBag());
    for (let i = 0; i < 6; i++) bind('take-' + i, crateRect.x + 13, 440 - i * 33, 200, 31, () => {
      if (!this.survivalCrateId) return;
      const crate = b.nearbySurvivalCrate(this.survivalCrateId), stack = crate?.goods[i];
      if (!crate || !stack) return;
      if (!b.takeSurvivalCrate(crate.id, i)) {
        const [w, h] = bag.size(stack.kind, false);
        this.toast(SURVIVAL_GEAR[stack.kind][0] + '需要连续 ' + w + '×' + h + ' 格（' + w * h + ' 格）');
      }
    });
    const actions = {
      use: () => this.useSurvivalBagItem(this.survivalHeldItem),
      rotate: () => {
        const item = bag.item(this.survivalHeldItem);
        if (!item) return;
        if (bag.move(item.id, item.col, item.row, !item.rotated)) this.survivalRotatePreview = undefined;
        else {
          this.survivalRotatePreview = { id: item.id, until: this.presentationTime + .55 };
          this.toast('旋转后的空间不足');
        }
      },
      split: () => {
        const item = bag.item(this.survivalHeldItem);
        if (item && !bag.split(item.id)) this.toast('没有可拆分的堆叠或空间不足');
      },
      drop: () => {
        if (this.survivalHeldItem !== undefined && b.dropSurvivalItem(this.survivalHeldItem)) this.survivalHeldItem = undefined;
      },
    };
    for (const { id, x, y, w, h } of SURVIVAL_BAG_ACTIONS) bind(id, x, y, w, h, actions[id]);
    bind('assign-tactical', 734, 105, 385, 35, () => {
      const item = bag.item(this.survivalHeldItem);
      if (!item || !b.bindSurvivalTactical(item.kind)) return;
      if (this.saveSurvivalCheckpoint(b)) this.toast('已绑定 ' + (isSurvivalThrowable(item.kind) ? 'G' : 'T') + ' · ' + SURVIVAL_GEAR[item.kind][0]);
      this.uiTick = 0;
    });
    for (let i = 0; i < 3; i++) bind('assign-' + i, 734 + i * 131, 105, 122, 35, () => {
      const item = bag.item(this.survivalHeldItem);
      if (!item || !canUseSurvivalGear(item.kind)) return;
      const old = bag.quick[i];
      bag.quick = bag.quick.map(id => id === item.id ? null : id);
      bag.quick[i] = old === item.id ? null : item.id;
      this.toast(old === item.id ? '已移出快捷栏' : '已绑定快捷格 ' + (i + 1));
    });
    // Cocos cancels a touch released outside its starting hit box. One hit box
    // for the whole inventory keeps a drag alive while moving across cells.
    const extent = layout.cell * layout.displaySize;
    const grid = bind('grid', layout.gridX, layout.gridTop - extent, extent, extent, () => {});
    const cellAt = (p: { x: number; y: number }) => ({
      col: Math.floor((p.x - layout.gridX) / layout.cell),
      row: Math.floor((layout.gridTop - p.y) / layout.cell),
    });
    const distance = (start: { x: number; y: number }, end: { x: number; y: number }) => Math.hypot(end.x - start.x, end.y - start.y);
    grid.on(Node.EventType.TOUCH_START, (e: EventTouch) => {
      if (this.survivalDrag || !this.suppliesOpen) return;
      const p = this.pointerPosition(e), { col, row } = cellAt(p);
      this.survivalDrag = { ...p, id: bag.covering(col, row)?.id, owner: e.getID() };
    });
    const updateDrag = (drag: NonNullable<Blackout['survivalDrag']>, p: { x: number; y: number }) => {
      const item = bag.item(drag.id);
      if (!item || drag.col === undefined && distance(drag, p) < 8) return;
      drag.col = item.col + Math.round((p.x - drag.x) / layout.cell);
      drag.row = item.row - Math.round((p.y - drag.y) / layout.cell);
      this.survivalHeldItem = item.id;
      this.survivalRotatePreview = undefined;
      this.uiTick = 0;
    };
    grid.on(Node.EventType.TOUCH_MOVE, (e: EventTouch) => {
      const drag = this.survivalDrag;
      if (drag && drag.owner === e.getID()) updateDrag(drag, this.pointerPosition(e));
    });
    grid.on(Node.EventType.TOUCH_END, (e: EventTouch) => {
      const drag = this.survivalDrag;
      if (!drag || drag.owner !== e.getID()) return;
      this.survivalDrag = undefined;
      const p = this.pointerPosition(e);
      updateDrag(drag, p);
      if (drag.id !== undefined && drag.col !== undefined && drag.row !== undefined) {
        bag.move(drag.id, drag.col, drag.row);
      } else if (distance(drag, p) < 8) {
        const { col, row } = cellAt(p);
        if (col < 0 || col >= bag.columns || row < 0 || row >= bag.rows) return;
        const item = bag.covering(col, row), selected = bag.item(this.survivalHeldItem);
        this.survivalRotatePreview = undefined;
        if (item) this.survivalHeldItem = selected === item ? undefined : item.id;
        else if (selected && !bag.move(selected.id, col, row)) this.toast('这个位置放不下');
      }
      this.uiTick = 0;
    });
    grid.on(Node.EventType.TOUCH_CANCEL, (e: EventTouch) => {
      if (this.survivalDrag?.owner !== e.getID()) return;
      this.survivalDrag = undefined;
      this.uiTick = 0;
    });
  }
  private drawSurvivalBagHud() {
    const b = this.battle, bag = b.survivalBag!, g = this.survivalBagArt;
    if (!g || !this.survivalBagLayer) return;
    g.clear();
    const shown = new Set<string>(), activeButtons = new Set<string>();
    const q = SURVIVAL_QUICK, layout = SURVIVAL_BAG, show = this.suppliesOpen;
    const selected = bag.item(this.survivalHeldItem);
    const crate = this.survivalCrateId ? b.nearbySurvivalCrate(this.survivalCrateId) : undefined;
    if (!crate) this.survivalCrateId = undefined;
    if (this.survivalWorkshopOpen && !b.survivalAtWorkbench) this.survivalWorkshopOpen = false;
    const fortDoor = this.survivalDoorPanel ? b.nearbySurvivalDoor(this.survivalDoorPanel.id) : undefined;
    if (!fortDoor) this.survivalDoorPanel = undefined;
    const label = (id: string, str: string, x: number, y: number, w: number, size = 14, fill = C.text, height?: number,
      align = Label.HorizontalAlign.CENTER) => {
      const key = 'gear-ui-' + id;
      shown.add(key);
      const result = this.text(key, str, x, y, size, fill, this.survivalBagLayer!, w, align);
      if (height) result.node.getComponent(UITransform)!.height = height;
    };
    let skinIndex = 0, icons = 0;
    const texture = (frame: SpriteFrame | undefined, x: number, y: number, w: number, h: number, tint = '#ffffff', slice = false) => {
      if (!frame) return false;
      const index = skinIndex++;
      const sprite = this.survivalBagSkinNodes[index] ??= this.setupSprite(this.makeNode('Survival UI texture', this.survivalBagSkin!), frame, w, h);
      sprite.spriteFrame = frame; sprite.type = slice ? Sprite.Type.SLICED : Sprite.Type.SIMPLE; sprite.color = color(tint);
      sprite.node.getComponent(UITransform)!.setContentSize(w, h);
      sprite.node.setPosition(x + w / 2 - W / 2, y + h / 2 - H / 2);
      sprite.node.active = true;
      return true;
    };
    const panel = (r: { x: number; y: number; w: number; h: number }, type = 'panel') => {
      if (!texture(this.survivalSkin.get(type), r.x, r.y, r.w, r.h, '#ffffff', true)) {
        this.sbox(g, r.x, r.y, r.w, r.h, '#111c22', 251);
        this.soutline(g, r.x, r.y, r.w, r.h, '#a38558');
      }
    };
    const button = (id: string, str: string, x: number, y: number, w: number, h: number, pressed = false, enabled = true) => {
      if (!texture(this.survivalSkin.get('button'), x, y, w, h, pressed ? '#e5c48d' : enabled ? '#ffffff' : '#8a8c86')) {
        this.sbox(g, x, y, w, h, pressed ? '#493c2a' : '#1c292a');
        this.soutline(g, x, y, w, h, '#8a734f');
      }
      label(id, str, x + w / 2, y + h / 2, w - 7, w < 55 ? 12 : 14, enabled ? C.text : C.muted);
      if (enabled) activeButtons.add(id);
    };
    const icon = (kind: GearKind, x: number, y: number, w: number, h: number, rotated = false) => {
      const frame = this.survivalItemFrame(kind);
      if (!frame) return false;
      const sprite = this.survivalBagIcons[icons++] ??= this.setupSprite(this.makeNode('Inventory object', this.survivalBagItemLayer!), frame, w, h);
      sprite.spriteFrame = frame;
      const { width, height } = frame.originalSize;
      const turn = rotated !== (kind === 'sentry-barrel');
      const scale = Math.min(w / (turn ? height : width), h / (turn ? width : height));
      sprite.node.getComponent(UITransform)!.setContentSize(width * scale, height * scale);
      sprite.node.setPosition(x - W / 2, y - H / 2);
      sprite.node.angle = turn ? 90 : 0;
      sprite.node.active = true;
      return true;
    };
    const old = SURVIVAL_BAG_BUTTON;
    texture(this.supplyUiFrames.get('backpack'), old.x + 10, old.y - 5, 56, 56);
    label('backpack-label', '背包', old.x + old.w / 2, old.y - 8, 70, 12, this.survivalQuickOpen ? C.gold : C.text);
    activeButtons.add('toggle');
    if (this.survivalQuickOpen && !show && !crate && !this.survivalWorkshopOpen) {
      button('all', '全部', q.x - 68, q.y, 61, q.h);
      for (let i = 0; i < 3; i++) {
        const x = q.x + i * 67, item = bag.item(bag.quick[i]);
        texture(this.survivalSkin.get('slot') ?? this.supplyUiFrames.get('slot'), x, q.y, q.w, q.h);
        if (item) {
          icon(item.kind, x + q.w / 2, q.y + 27, 42, 31);
          label('quick-count-' + i, '×' + item.count, x + 47, q.y + 8, 25, 10, C.gold);
        } else label('quick-empty-' + i, String(i + 1), x + q.w / 2, q.y + 23, 28, 13, '#8a918e');
        activeButtons.add('quick-' + i);
      }
    }
    if (b.survivalPlacement) {
      const p = b.survivalPlacement;
      button('install', '安装哨械枪  ' + p.left.toFixed(1) + ' 秒', 487, 108, 277, 39, true);
      this.sbox(g, 500, 114, 248 * (1 - p.left / p.duration), 3, C.gold);
    }
    if (b.survivalDoorWork) {
      const work = b.survivalDoorWork;
      button('fort-progress', (work.replacement ? '安装门板' : '修补门板') + '  ' + Math.max(0, work.left).toFixed(1) + ' 秒', 481, 105, 285, 40, true);
      this.sbox(g, 497, 111, 252 * (1 - Math.max(0, work.left) / work.duration), 3, C.gold);
    } else if (this.survivalDoorHold && !this.survivalDoorHold.opened) {
      const hold = this.survivalDoorHold;
      this.sbox(g, 498, 78, 220 * clamp(1 - hold.left / SURVIVAL_DOOR_HOLD, 0, 1), 3, C.gold);
    }
    if (show) {
      if (!texture(this.survivalUiFrames.get('bag'), layout.x, layout.y, layout.w, layout.h)) panel(layout);
      activeButtons.add('blocker');
      activeButtons.add('grid');
      label('capacity', bag.columns + ' × ' + bag.rows + '　·　已用 ' + bag.used + ' / ' + (bag.columns * bag.rows) + ' 格',
        layout.gridX, 612, 350, 21, '#f0d8a9', undefined, Label.HorizontalAlign.LEFT);
      const close = SURVIVAL_BAG_CLOSE;
      if (texture(this.survivalUiFrames.get('close'), close.x, close.y, close.w, close.h)) activeButtons.add('close');
      else button('close', '×', close.x, close.y, close.w, close.h);
      const cell = layout.cell, gridLength = layout.displaySize * cell;
      const slot = this.survivalUiFrames.get('tile') ?? this.survivalSkin.get('slot');
      const locked = this.survivalUiFrames.get('tile-locked');
      for (let row = 0; row < layout.displaySize; row++) for (let col = 0; col < layout.displaySize; col++) {
        const x = layout.gridX + col * cell, y = layout.gridTop - (row + 1) * cell;
        const available = row < bag.rows && col < bag.columns;
        texture(available ? slot : locked ?? slot, x, y, cell - 2, cell - 2, available ? '#ffffff' : '#868782');
        if (!available && !locked) label('locked-' + col + '-' + row, '×', x + cell / 2, y + cell / 2, cell - 2, 19, '#848179');
      }
      for (const [i, item] of bag.items.entries()) {
        const [w, h] = bag.size(item.kind, item.rotated);
        const x = layout.gridX + item.col * cell + 2, y = layout.gridTop - (item.row + h) * cell + 2;
        const width = w * cell - 4, height = h * cell - 4;
        this.sbox(g, x, y, width, height, item === selected ? '#655336' : '#303e37', 151);
        if (item === selected && !texture(this.survivalUiFrames.get('tile-selected'), x, y, width, height)) {
          this.soutline(g, x, y, width, height, '#f3cf8b');
        }
        const visible = icon(item.kind, x + width / 2, y + height / 2, width - 5, height - 7, item.rotated);
        if (!visible || item.count > 1) label('item-' + i, visible ? String(item.count) : SURVIVAL_GEAR[item.kind][0],
          visible ? x + width - 8 : x + width / 2, visible ? y + 7 : y + height / 2, visible ? 16 : width, visible ? 10 : 11, '#f5dfae');
      }
      const turn = this.survivalRotatePreview;
      const rotation = turn && turn.until > this.presentationTime ? bag.item(turn.id) : undefined;
      const drag = this.survivalDrag, moving = bag.item(drag?.id);
      const preview = rotation ? { item: rotation, col: rotation.col, row: rotation.row, rotated: !rotation.rotated } :
        moving && drag?.col !== undefined && drag.row !== undefined ? { item: moving, col: drag.col, row: drag.row, rotated: moving.rotated } : undefined;
      if (preview) {
        const { item, col, row, rotated } = preview, [w, h] = bag.size(item.kind, rotated);
        const x = layout.gridX + col * cell, y = layout.gridTop - (row + h) * cell;
        const valid = bag.fits(item.kind, col, row, rotated, item.id);
        const left = Math.max(x, layout.gridX), right = Math.min(x + w * cell, layout.gridX + gridLength);
        const bottom = Math.max(y, layout.gridTop - gridLength), top = Math.min(y + h * cell, layout.gridTop);
        if (right > left && top > bottom) this.sbox(g, left, bottom, right - left, top - bottom, valid ? '#9acb93' : '#e75a4d', 137);
      }
      const [w, h] = selected ? bag.size(selected.kind, selected.rotated) : [0, 0];
      const gun = selected && isSurvivalGun(selected.kind) ? SURVIVAL_GUNS[selected.kind] : undefined;
      const usable = !!selected && canUseSurvivalGear(selected.kind) && (!gun || gun.hero === b.heroId);
      if (selected) {
        label('selected', SURVIVAL_GEAR[selected.kind][0], 734, 539, 370, 31, '#f3d6a3', undefined, Label.HorizontalAlign.LEFT);
        icon(selected.kind, 928, 447, 240, 119, selected.rotated);
        const detail = SURVIVAL_DESCRIPTIONS[selected.kind] + (gun ? '\n适用 ' + heroes[gun.hero].name + '　·　弹匣 ' +
          (selected.rounds ?? gun.magazine) + ' / ' + gun.magazine : '');
        label('details', detail, 734, 343, 384, 19, '#eee2cd', 63, Label.HorizontalAlign.LEFT);
        label('size', w + ' × ' + h + ' 格　·　数量 ' + selected.count, 734, 286, 360, 16, C.jade, undefined, Label.HorizontalAlign.LEFT);
      } else {
        label('details-empty', '选择左侧物品查看详情', 927, 424, 355, 23, '#c5bba6');
      }
      const enabled = { use: usable, rotate: w !== h, split: (selected?.count ?? 0) > 1, drop: !!selected };
      const actionButton = (id: string, title: string, x: number, y: number, width: number, height: number,
        active: boolean, primary = false) => {
        const frame = this.survivalUiFrames.get(primary ? 'primary' : 'secondary') ?? this.survivalSkin.get('button');
        texture(frame, x, y, width, height, active ? '#ffffff' : '#727475');
        label(id, title, x + width / 2, y + height / 2, width - 12, height >= 40 ? 20 : 14, active ? '#f1dfbd' : '#9e9b91');
        if (active) activeButtons.add(id);
      };
      const equip = gun ? b.survivalSpecial ? '替换 ' + SURVIVAL_GUNS[b.survivalSpecial.id].gun : '装备' : '使用';
      for (const action of SURVIVAL_BAG_ACTIONS) actionButton(action.id, action.id === 'use' ? equip : action.label, action.x, action.y, action.w, action.h,
        enabled[action.id], action.id === 'use' && usable);
      const tacticalSlot = isSurvivalThrowable(selected?.kind) ? 'throw' : isSurvivalMine(selected?.kind) ? 'mine' : undefined;
      if (tacticalSlot) {
        const assigned = b.survivalBindings[tacticalSlot] === selected?.kind;
        const title = tacticalSlot === 'throw' ? 'G 投掷' : 'T 布雷';
        actionButton('assign-tactical', (assigned ? '已绑定 · ' : '设为 ') + title, 734, 105, 385, 35, usable, assigned);
      } else for (let i = 0; i < 3; i++) {
        const assigned = !!selected && bag.quick[i] === selected.id;
        actionButton('assign-' + i, '快捷 ' + (i + 1), 734 + i * 131, 105, 122, 35, usable, assigned);
      }
    } else if (crate) {
      const r = SURVIVAL_CRATE_PANEL;
      panel(r, 'tooltip');
      label('source', SURVIVAL_CRATE_LABELS[crate.kind], r.x + r.w / 2, 487, 185, 18, '#f0d5a3');
      for (const [i, stack] of crate.goods.entries()) {
        button('take-' + i, '　' + SURVIVAL_GEAR[stack.kind][0] + ' ×' + stack.count, r.x + 13, 440 - i * 33, 200, 31);
        icon(stack.kind, r.x + 31, 455 - i * 33, 25, 22);
      }
      button('crate-close', '关闭', r.x + 12, r.y + 12, 80, 34);
      button('crate-all', show ? '收起背包' : '全部', r.x + 128, r.y + 12, 80, 34);
    }
    if (this.survivalVehiclePanel && b.survivalVehicleAtPlayer() !== this.survivalVehiclePanel) this.survivalVehiclePanel = undefined;
    const vehicleId = this.survivalVehiclePanel;
    if (vehicleId) {
      activeButtons.add('vehicle-blocker');
      const r = SURVIVAL_VEHICLE_PANEL, v = EVAC_VEHICLES[vehicleId], status = b.survivalVehicleStatus(vehicleId);
      if (!texture(this.timedSurvivalFrames.get('service-card'), r.x, r.y, r.w, r.h)) panel(r);
      label('vehicle-title', v.name, 655, 564, 286, 27, '#ffdc9c');
      button('vehicle-close', '关闭', 941, 546, 54, 36);
      const craft = vehicleId === 'helicopter' ? this.streetFrames.get('op-blackhawk') : this.timedSurvivalFrames.get('boat');
      if (craft) {
        const fit = Math.min(200 / craft.originalSize.width, 265 / craft.originalSize.height);
        const w = fit * craft.originalSize.width, h = fit * craft.originalSize.height;
        texture(craft, 507 - w / 2, 365 - h / 2, w, h, '#d1d6c9');
        if (vehicleId === 'helicopter') texture(this.streetFrames.get('op-rotor'), 439, 327, 136, 136, '#c4c5b8');
      }
      for (const [i, part] of v.parts.entries()) {
        const fitted = !!(status.installed & (1 << i)), y = 477 - 51 * i;
        const markerX = 507 + (i % 2 ? 67 : -63), markerY = 453 - i * 43;
        texture(this.timedSurvivalFrames.get('service-strip'), 669, y - 3, 309, 42, fitted ? '#86ab82' : '#b37d71');
        icon(part, 695, y + 18, 33, 27);
        label('vehicle-part-' + i, SURVIVAL_GEAR[part][0], 719, y + 18, 136, 16, fitted ? '#a9d9a2' : '#ffc0a9',
          undefined, Label.HorizontalAlign.LEFT);
        texture(this.survivalUiFrames.get(fitted ? 'tile-selected' : 'tile-locked'), markerX - 13, markerY - 13, 26, 26,
          fitted ? '#8bdd8a' : '#ff8467');
        label('vehicle-mark-' + i, String(i + 1), markerX, markerY, 22, 15, '#fff0d0');
        if (fitted) label('vehicle-fitted-' + i, '已安装', 917, y + 18, 100, 16, '#a9d9a2');
        else button('vehicle-fit-' + i, bag.count(part) ? '装入' : '缺少部件', 859, y, 116, 36, !!bag.count(part), !!bag.count(part));
      }
      const readyToFuel = status.installed === 31 && !!bag.count('evac-fuel');
      const start = status.ready ? '登乘撤离' : status.fuel !== undefined ? '加油中 · ' + Math.ceil(status.fuel) + ' 秒' :
        status.installed !== 31 ? '部件未齐全' : readyToFuel ? '开始加油' : '需要撤离燃油';
      button('vehicle-start', start, 716, 177, 258, 51, status.ready || readyToFuel, status.ready || status.fuel === undefined && readyToFuel);
      label('vehicle-fuel-note', '加油会吸引附近尸群', 817, 151, 290, 14, '#e4af92');
    }
    if (this.survivalWorkshopOpen) {
      panel(SURVIVAL_WORKSHOP);
      label('workshop-title', '工事工作台', 731, 560, 170, 23, '#f0d5a3');
      button('workshop-close', '关闭', 1073, 543, 61, 34);
      const sentryTab = SENTRY_WORKSHOP_RECIPES.some(id => this.survivalRecipe === id);
      button('work-supply', '通用制作', 644, 515, 103, 32, !sentryTab);
      button('work-sentry', '哨械枪', 755, 515, 105, 32, sentryTab);
      (sentryTab ? SENTRY_WORKSHOP_RECIPES : SUPPLY_WORKSHOP_RECIPES).forEach((id, i) => {
        const y = 468 - i * 44;
        button('recipe-' + id, id === 'sentry' ? '组装哨械枪' : SURVIVAL_GEAR[id][0], 644, y, 216, 39, this.survivalRecipe === id);
        icon(id, 671, y + 20, 34, 30);
      });
      const recipe = this.survivalRecipe, ammoSelected = recipe === 'special-ammo', ammo = b.survivalAmmoRecipe;
      if (!sentryTab) {
        const y = 468 - 44 * SUPPLY_WORKSHOP_RECIPES.length;
        button('recipe-ammo', '特殊弹药', 644, y, 216, 39, ammoSelected);
        icon('special-ammo', 671, y + 20, 34, 30);
      }
      const plan = b.planSurvivalCraft(recipe), { status } = plan, [w, h] = bag.size(recipe, false);
      const canDrop = status === 'space' && 'drop' in plan && !!plan.drop;
      icon(recipe, 1007, 482, 102, 72);
      const output = recipe === 'special-ammo' ? ammo ? ammo.title + '  ·  +' + ammo.rounds + ' 发' : '特殊弹药' :
        SURVIVAL_GEAR[recipe][0] + '  ·  ' + w + '×' + h + ' 格';
      label('result-size', output, 1007, 430, 222, 17, '#f3d6a3');
      const cost = recipe === 'special-ammo' ? ammo?.cost ?? [] : SURVIVAL_RECIPES[recipe];
      for (const [i, [material, count]] of cost.entries()) {
        const y = 391 - i * 33, have = bag.count(material);
        icon(material, 913, y, 25, 23);
        label('material-' + i, SURVIVAL_GEAR[material][0] + '   ' + have + ' / ' + count, 1016, y, 173, 15, have >= count ? C.jade : '#eb967a');
      }
      label('craft-status', status === 'space' ? (canDrop ? '扣料后仍缺 ' + w + '×' + h + ' 连续空间' : '背包与台边都无空位') : status === 'materials' ? '材料不足' :
        status === 'weapon' ? '请先装备一把特殊武器' : status === 'full' ? '备弹接近上限' : status === 'location' ? '请靠近工事工作台' :
          ammoSelected ? '制作后直接补入备弹' : '成品直接放入背包', 1007, 291, 203, 13, status === 'ok' ? C.jade : '#eb967a');
      if (status === 'space') button('craft-drop', '制作后放在台边', 902, 229, 210, 43, canDrop, canDrop);
      else button('craft', recipe === 'sentry' ? '确认组装' : '确认制作', 902, 229, 210, 43, status === 'ok', status === 'ok');
      if (status === 'ok' && 'output' in plan && plan.output) {
        const size = 5.5, x = 919, y = 199 + bag.rows * size / 2;
        for (let row = 0; row < bag.rows; row++) for (let col = 0; col < bag.columns; col++) {
          const item = plan.bag.covering(col, row);
          this.sbox(g, x + col * size, y - (row + 1) * size, size - 1, size - 1,
            item?.id === plan.output.id ? '#efbc68' : item ? '#646c68' : '#303738');
        }
        label('craft-placement', '扣料后成品位置', 1029, 199, 125, 14, '#efbc68');
      }
    }
    if (fortDoor && this.survivalDoorPanel) {
      const selection = this.survivalDoorPanel, current = SURVIVAL_DOORS[fortDoor.fortification!];
      const plan = b.survivalDoorPlan(selection.id, selection.replacement);
      panel(SURVIVAL_DOOR_PANEL);
      label('fort-title', fortDoor.name + ' · 工事', 781, 563, 277, 21, '#f0d5a3');
      label('fort-health', current.title + '   ·   ' + (fortDoor.destroyed ? '门板已毁' : Math.ceil(fortDoor.hp) + ' / ' + fortDoor.maxHp), 850, 524, 353, 15, fortDoor.destroyed ? '#ed9b80' : C.jade);
      button('fort-close', '关闭', 1060, 543, 61, 34);
      button('fort-repair', '修补本门', 645, 466, 182, 37, !selection.replacement);
      for (const [i, kind] of SURVIVAL_DOOR_KINDS.entries()) {
        const y = 419 - i * 41;
        button('fort-kind-' + i, SURVIVAL_DOORS[kind].title, 645, y, 182, 36, kind === selection.replacement);
        texture(this.survivalDoorFrames.get(kind), 657, y + 6, 44, 7);
      }
      if (plan) {
        const self = !selection.replacement, title = SURVIVAL_DOORS[plan.kind].title;
        const verb = self ? '修补' : fortDoor.destroyed ? '重装' : '换装';
        label('fort-choice', verb + ' ' + title, 976, 478, 245, 17, '#f3d6a3');
        label('fort-estimate', plan.seconds.toFixed(1) + ' 秒 · ' + (self ? '+' + Math.ceil(plan.gain) + ' 耐久' : plan.gain + ' 耐久'), 976, 443, 245, 15, C.jade);
        for (const [i, [material, quantity]] of plan.cost.entries()) {
          const y = 410 - i * 29, have = bag.count(material);
          icon(material, 875, y, 24, 22);
          label('fort-material-' + i, SURVIVAL_GEAR[material][0] + '   ' + have + ' / ' + quantity, 978, y, 173, 14, have >= quantity ? C.jade : '#eb967a');
        }
        label('fort-status', plan.reason ?? '施工期间可移动取消', 975, 295, 251, 14, plan.reason ? '#eb967a' : '#d9d1b9');
        button('fort-confirm', '确认' + verb, 859, 221, 235, 42, !plan.reason, !plan.reason);
      }
    }
    for (const buttonNode of this.buttons) {
      const key = buttonNode.node.name;
      if (!key.startsWith('Button-gear-')) continue;
      const id = key.slice('Button-gear-'.length);
      buttonNode.node.active = activeButtons.has(id);
    }
    for (const [key, existing] of this.labels) if (key.startsWith('gear-ui-') && !shown.has(key)) existing.string = '';
    for (let i = skinIndex; i < this.survivalBagSkinNodes.length; i++) this.survivalBagSkinNodes[i].node.active = false;
    for (let i = icons; i < this.survivalBagIcons.length; i++) this.survivalBagIcons[i].node.active = false;
  }
  private drawMinimap(g: Graphics) {
    const r = HUD.map, b = this.battle;
    if (!b.survival) this.sbox(g, r.x + 14, r.y + 17, r.w - 28, r.h - 34, '#0f1212');
    const rooms = b.stage.survival ? [b.rooms[b.stage.survival.streetRoom]] : b.rooms;
    const minX = Math.min(...rooms.map(r => r.x)), minY = Math.min(...rooms.map(r => r.y));
    const maxX = Math.max(...rooms.map(r => r.x + r.w)), maxY = Math.max(...rooms.map(r => r.y + r.h));
    const scale = Math.min((r.w - 38) / (maxX - minX), (r.h - 44) / (maxY - minY));
    const ox = r.x + (r.w - (maxX - minX) * scale) / 2 - minX * scale;
    const oy = r.y + (r.h - (maxY - minY) * scale) / 2 - minY * scale;
    const map = b.minimap, size = MINIMAP_CELL_SIZE, columns = Math.min(map.columns, Math.ceil(maxX / size));
    const state = (x: number, y: number) => map.visible[y * map.columns + x] ? 2 : map.explored[y * map.columns + x] ? 1 : 0;
    for (let y = 0; y < map.rows; y++) {
      for (let x = 0; x < columns;) {
        const fill = state(x, y);
        if (!fill) { x++; continue; }
        let end = x + 1;
        while (end < columns && state(end, y) === fill) end++;
        const left = Math.max(minX, x * size), bottom = Math.max(minY, y * size);
        this.sbox(g, ox + left * scale, oy + bottom * scale, (Math.min(maxX, end * size) - left) * scale, (Math.min(maxY, (y + 1) * size) - bottom) * scale,
          fill === 2 ? '#778c83' : '#37484c', b.survival ? fill === 2 ? 110 : 75 : 255);
        x = end;
      }
    }
    const street = b.stage.street;
    const goal = street ? b.alarmTime === null ? street.alarm : b.player.y < street.upperTurn.y - 170 ? street.upperTurn : b.stage.exit
      : b.stage.dorm ? b.pickup ?? b.stage.exit : b.stage.survival?.radio ?? b.operationGoal ?? b.apartmentGoal;
    if (goal && (b.stage.operation || b.stage.survival || state(Math.floor(goal.x / size), Math.floor(goal.y / size)))) {
      disc(g, ox + goal.x * scale - W / 2, oy + goal.y * scale - H / 2, 3, C.gold);
    }
    for (const ally of b.allies) if (ally.hp > 0 && state(Math.floor(ally.x / size), Math.floor(ally.y / size)) === 2) {
      disc(g, ox + ally.x * scale - W / 2, oy + ally.y * scale - H / 2, 2, '#7acfbf');
    }
    const air = b.operationAirSight;
    if (air) for (const enemy of b.enemies) if (enemy.hp > 0 && b.operationAirSees(enemy, air)) {
      disc(g, ox + enemy.x * scale - W / 2, oy + enemy.y * scale - H / 2, 1.8, '#ff8667', Math.round(220 * air.intensity));
    }
    const p = this.battle.player;
    if (b.survival) for (const [index, [name, x, y]] of HARBOR_MAP_REGIONS.entries()) {
      const supplied = b.survivalRestock?.zones.includes(index);
      if (name === '工事' && !supplied) continue;
      const q = harborPoint(x, y);
      disc(g, ox + q.x * scale - W / 2, oy + q.y * scale - H / 2, supplied ? 3.3 : 1.8, supplied ? C.jade : '#e6cb98');
    }
    if (b.survival) {
      const mark = (point: { x: number; y: number }, fill: string, size: number) =>
        this.sbox(g, ox + point.x * scale - size / 2, oy + point.y * scale - size / 2, size, size, fill);
      if (b.survivalConvoyReady) mark(CONVOY_BOARD, '#fff1ad', 6);
      for (const crate of b.survivalCrates) if (crate.kind === 'airdrop' && crate.goods.length) mark(crate, '#ffad64', 6);
    }
    const px = ox + (p.x - (b.survivalUpperFloor?.offsetX ?? 0)) * scale - W / 2, py = oy + p.y * scale - H / 2;
    const angle = p.angle;
    polygon(g, [
      { x: px + Math.cos(angle) * 5, y: py + Math.sin(angle) * 5 },
      { x: px + Math.cos(angle + 2.5) * 4, y: py + Math.sin(angle + 2.5) * 4 },
      { x: px + Math.cos(angle - 2.5) * 4, y: py + Math.sin(angle - 2.5) * 4 },
    ], C.gold);
  }
  private createHudAction(id: string, art: BattleImage | SpriteFrame | undefined, rect: typeof HUD.roll, remaining: () => number, duration: () => number, locked = false) {
    const root = typeof art === 'string' ? this.battleSprite(art, rect) || this.makeNode(art, this.battleArtwork!) :
      this.makeNode(id, this.battleArtwork!);
    let icon: Node | undefined;
    if (typeof art !== 'string') {
      const plate = this.graphics('Support button plate', root);
      disc(plate, 0, 0, rect.h * 0.43, '#282824', 245);
      plate.strokeColor = color('#d4a950', 225); plate.lineWidth = 2;
      plate.circle(0, 0, rect.h * 0.43); plate.stroke();
      icon = this.makeNode('Action item', root);
      if (art) this.setupSprite(icon, art, rect.h * 0.49, rect.h * 0.64);
    }
    root.getComponent(UITransform)!.setContentSize(rect.w, rect.h);
    root.setPosition(rect.x + rect.w / 2 - W / 2, rect.y + rect.h / 2 - H / 2);
    const ring = this.graphics('Cooldown-' + id, root);
    const label = this.text('cooldown-' + id, '', W / 2, H / 2, 18, '#ffe0a0', root, 90, Label.HorizontalAlign.CENTER);
    label.enableOutline = true; label.outlineColor = color('#131719'); label.outlineWidth = 2;
    this.hudActions.push({ id, root, sprite: root.getComponent(Sprite) || undefined, icon, ring, label, remaining, duration, locked, previous: remaining(), glow: 0, scale: 1, owners: new Set(), progress: 0 });
  }
  private updateTacticalHudIcon(id: string, art: SpriteFrame | undefined, blocked: boolean) {
    const action = this.hudActions.find(item => item.id === id);
    if (!action) return;
    action.locked = blocked && action.remaining() <= 0;
    if (!action.icon) return;
    action.icon.active = !!art;
    if (!art) return;
    const sprite = action.icon.getComponent(Sprite);
    const size = art.originalSize, scale = action.root.getComponent(UITransform)!.height * .54 / Math.max(size.width, size.height);
    if (!sprite) this.setupSprite(action.icon, art, size.width * scale, size.height * scale).color = color(blocked ? '#747775' : '#ffffff');
    else {
      if (sprite.spriteFrame !== art) {
        sprite.spriteFrame = art;
        action.icon.getComponent(UITransform)!.setContentSize(size.width * scale, size.height * scale);
      }
      sprite.color = color(blocked || action.remaining() > 0 ? '#747775' : '#ffffff');
    }
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
  private buildSurvivalAmmo(legacy: Node[]) {
    const frame = this.timedSurvivalFrames.get('ammo-card');
    if (!frame || !this.battleArtwork) return;
    const { x, y, w, h } = HUD.ammo;
    const cards = [false, true].map(special => {
      const root = this.makeNode(special ? 'Special weapon card' : 'Base weapon card', this.battleArtwork!);
      this.campaignSprite(root, frame, W / 2, H / 2, w, h);
      const icon = this.makeNode('Weapon icon', root);
      icon.setPosition(-w * .29, 3);
      const name = this.text('stack-gun-' + special, '', W / 2 + w * .19, H / 2 - h * .29,
        13, C.text, root, w * .55, Label.HorizontalAlign.CENTER);
      const ammo = this.text('stack-ammo-' + special, '', W / 2 + w * .19, H / 2 + h * .09,
        23, C.text, root, w * .55, Label.HorizontalAlign.CENTER);
      return { root, icon, name, ammo };
    });
    const rearY = y - h * .49;
    const hit = [this.addButton('weapon-front', x, y, w, h, () => this.requestSurvivalWeaponSwap()),
      this.addButton('weapon-rear', x + 14, rearY, w, h, () => this.requestSurvivalWeaponSwap())];
    this.survivalAmmo = { cards, legacy, hit };
  }
  private requestSurvivalWeaponSwap() {
    const b = this.battle;
    if (!b.canSwitchSurvivalWeapon() || this.survivalSwap || this.transition) return;
    if (!this.survivalAmmo) { b.switchSurvivalWeapon(); this.uiTick = 0; return; }
    this.mouseFire = this.mouseQueuedFire = false;
    this.survivalSwap = { time: 0, startedWithSpecial: b.survivalSpecialActive, committed: false };
  }
  private updateSurvivalAmmo(dt: number) {
    const widget = this.survivalAmmo;
    if (!widget) return;
    const b = this.battle, special = b.survivalSpecial, showing = !!special;
    for (const node of widget.legacy) node.active = !showing;
    for (const key of ['ammo', 'gun']) {
      const label = this.labels.get(key);
      if (label) label.node.active = !showing;
    }
    for (const node of widget.hit) node.active = showing;
    for (const card of widget.cards) card.root.active = showing;
    if (!special) { this.survivalSwap = undefined; return; }
    const swap = this.survivalSwap;
    if (swap) {
      swap.time += dt;
      if (!swap.committed && swap.time >= .12) {
        if (!b.switchSurvivalWeapon()) this.survivalSwap = undefined;
        else { swap.committed = true; this.uiTick = 0; }
      }
      if (swap.time >= .24) this.survivalSwap = undefined;
    }
    const { x, y, w, h } = HUD.ammo, motion = this.survivalSwap, t = clamp((motion?.time ?? 0) / .24, 0, 1);
    const mix = t * t * (3 - 2 * t), swing = Math.sin(t * Math.PI);
    widget.cards.forEach((card, i) => {
      const isSpecial = i === 1, active = b.survivalSpecialActive === isSpecial;
      const startedInFront = (motion?.startedWithSpecial ?? b.survivalSpecialActive) === isSpecial;
      const offset = motion ? startedInFront ? mix : 1 - mix : active ? 0 : 1;
      card.root.setPosition(x + w / 2 - W / 2 + offset * 14 + swing * (startedInFront ? -22 : 22),
        y + h / 2 - H / 2 - offset * h * .49 + swing * (startedInFront ? 5 : -5));
      if (active) card.root.setSiblingIndex(widget.cards[1 - i].root.getSiblingIndex() + 1);
      const background = card.root.children[0]?.getComponent(Sprite);
      if (background) background.color = color(active ? '#ffffff' : '#aaa99f');
      const data = b.survivalWeaponReadout(isSpecial);
      card.name.string = data.name;
      card.name.color = color(active ? '#ffe1a3' : '#ccb998');
      card.ammo.string = active && b.player.reload > 0 ? '换弹 ' + b.player.reload.toFixed(1) + 's' :
        String(data.ammo).padStart(2, '0') + ' / ' + data.reserve;
      const face = isSpecial ? this.timedSurvivalFrames.get(special.id) :
        this.shopFrames.get(FIXED_WEAPON_ART[b.heroId]) ?? this.supplyUiFrames.get(heroes[b.heroId].weapon);
      card.icon.active = !!face;
      card.icon.setPosition(-w * .29, active ? 3 : -h * .23);
      if (face) {
        const icon = card.icon.getComponent(Sprite);
        const { width, height } = face.originalSize, scale = Math.min(74 / width, 39 / height);
        if (!icon) this.setupSprite(card.icon, face, width * scale, height * scale);
        else if (icon.spriteFrame !== face) {
          icon.spriteFrame = face;
          card.icon.getComponent(UITransform)!.setContentSize(width * scale, height * scale);
        }
      }
    });
  }
  private updateHudFeedback(dt: number) {
    this.updateSurvivalAmmo(dt);
    this.updateBattleHealth(dt);
    this.updateBattleNoticeFade();
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
    if (e.keyCode === KeyCode.ESCAPE && (this.mode === 'chapters' || this.mode === 'profile-info')) { this.open('menu'); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'survival-entry') { this.open('menu'); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'survival-resume') { this.open('survival-entry'); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'survival-hero') { this.closeSurvivalPicker(); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'street-loading') { this.backFromDeparture(); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'survival-radio') { this.open('playing'); return; }
    if (this.mode === 'survival-map' && (e.keyCode === KeyCode.ESCAPE || e.keyCode === KeyCode.KEY_M)) { this.open('playing'); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'select-hero') { this.open('chapters'); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'help') { this.open('settings'); return; }
    if (e.keyCode === KeyCode.ESCAPE && this.mode === 'settings') { this.open(this.battleSettings ? 'playing' : 'menu'); return; }
    if (e.keyCode === KeyCode.ENTER) {
      if (this.mode === 'menu') this.open('chapters');
      else if (this.mode === 'street-loading') this.confirmDeparture();
      else if (this.mode === 'select-hero' || this.mode === 'survival-hero') this.dispatchSortie();
      else if (this.mode === 'pause') this.open('playing');
      return;
    }
    if (e.keyCode === KeyCode.ESCAPE && this.reader.open) { this.closeReader(); return; }
    if (this.mode === 'playing' && this.battle.survival) {
      if (e.keyCode === KeyCode.KEY_B) { this.toggleSurvivalQuick(); return; }
      if (e.keyCode === KeyCode.ESCAPE && (this.suppliesOpen || this.survivalQuickOpen || this.survivalWorkshopOpen || this.survivalCrateId || this.survivalDoorPanel || this.survivalVehiclePanel)) {
        this.closeSurvivalPanels(); return;
      }
      if (e.keyCode === KeyCode.KEY_X) { this.requestSurvivalWeaponSwap(); return; }
      if (e.keyCode === KeyCode.KEY_T) { this.useSurvivalTactical('mine'); return; }
      if (e.keyCode === KeyCode.KEY_G) {
        if (this.battle.survivalBindings.throw) this.operationGrenadeKey = true;
        else this.useSurvivalTactical('throw');
        return;
      }
      if (e.keyCode === KeyCode.ESCAPE && this.battle.survivalPlacement) { this.battle.cancelSurvivalPlacement(); return; }
      if (e.keyCode === KeyCode.ESCAPE && this.battle.survivalDoorWork) { this.battle.cancelSurvivalDoorWork(); this.toast('已取消施工', undefined, 'warning'); return; }
    }
    if (e.keyCode === KeyCode.ESCAPE || e.keyCode === KeyCode.KEY_P) { if (this.mode === 'playing') this.open('pause'); else if (this.mode === 'pause') this.open('playing'); return; }
    if (this.mode !== 'playing') return;
    if (e.keyCode === KeyCode.KEY_M && this.battle.survival) { this.open('survival-map'); return; }
    if (e.keyCode === KeyCode.SPACE) this.dodge();
    if (e.keyCode === KeyCode.KEY_R) this.battle.reload();
    if (e.keyCode === KeyCode.KEY_G) {
      if (this.battle.operationRun && this.battle.tactical.selected === 'grenade') this.operationGrenadeKey = true;
      else this.useTactical();
    }
    if (e.keyCode === KeyCode.KEY_V && this.battle.operationRun) this.callOperationAir();
    if (e.keyCode === KeyCode.KEY_T && this.battle.apartment) this.placeApartmentTrap();
    if (e.keyCode === KeyCode.KEY_E && !this.startSurvivalDoorHold(-1)) this.interactOrInvestigate();
    if (e.keyCode === KeyCode.KEY_F) this.battle.collectPickup();
  }
  private interactOrInvestigate() {
    if (this.readerLayer || this.mode !== 'playing' || this.survivalDoorPanel || this.battle.survivalDoorWork) return;
    const b = this.battle;
    if (b.survivalAtConvoy && b.interact()) return;
    const vehicle = b.survivalVehicleAtPlayer();
    if (vehicle && b.interact()) {
      if (b.status === 'playing') {
        this.closeSurvivalPanels();
        this.survivalVehiclePanel = vehicle;
        this.mouseFire = this.mouseQueuedFire = false;
        this.updateHud();
      }
      return;
    }
    if (this.battle.survivalAtRadio && this.battle.interact()) { this.open('survival-radio'); return; }
    if (this.battle.survivalAtWorkbench && this.battle.interact()) {
      this.survivalWorkshopOpen = true;
      this.suppliesOpen = this.survivalQuickOpen = false;
      this.survivalCrateId = undefined; this.survivalHeldItem = undefined;
      this.mouseFire = this.mouseQueuedFire = false;
      this.updateHud(); return;
    }
    const crate = this.battle.openSurvivalCrate();
    if (crate) {
      this.survivalCrateId = crate.id; this.survivalWorkshopOpen = false; this.survivalHeldItem = undefined;
      this.mouseFire = this.mouseQueuedFire = false;
      this.updateHud(); return;
    }
    const broken = this.battle.nearbySurvivalDoor();
    if (broken?.destroyed) { this.openSurvivalDoorPanel(broken.id); return; }
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
  private keyUp(e: EventKeyboard) {
    this.keys.delete(e.keyCode);
    if (e.keyCode === KeyCode.KEY_E && this.survivalDoorHold?.owner === -1) {
      const hold = this.survivalDoorHold;
      this.survivalDoorHold = undefined;
      if (!hold.opened) this.interactOrInvestigate();
    }
    if (e.keyCode === KeyCode.KEY_G && this.operationGrenadeKey) {
      this.operationGrenadeKey = false;
      const aim = this.operationMouseGrenadeAim();
      this.releaseTacticalThrow(aim.angle, aim.range);
    }
  }
  private hitButton(x: number, y: number): boolean {
    return this.overSurvivalBag(x, y) || this.buttons.some(b => b.node.active && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
  }
  private pointerPosition(e: EventMouse | EventTouch) {
    // Match the actual UI camera, including letterboxing and editor preview resizing.
    const screen = e.getLocation();
    const world = this.camera.screenToWorld(new Vec3(screen.x, screen.y, 0));
    const local = this.canvas.getComponent(UITransform)!.convertToNodeSpaceAR(world);
    return { x: local.x + W / 2, y: local.y + H / 2 };
  }
  private overStreetStory(x: number, y: number) {
    const story = this.operationDialogue ?? this.streetStory;
    if (!story || !story.node.active) return false;
    const left = story.node.position.x + W / 2, centerY = story.node.position.y + H / 2;
    return x >= left && x <= left + 510 && y >= centerY - 55 && y <= centerY + 55;
  }
  private mouseMove(e: EventMouse) {
    if (this.readerLayer) return;
    const point = this.pointerPosition(e);
    this.mx = point.x; this.my = point.y;
    if (this.mode === 'playing' && !this.transition &&
        !this.hitButton(point.x, point.y) && !this.overStreetStory(point.x, point.y)) this.mouseAimInput = true;
  }
  private mouseDown(e: EventMouse) {
    if (this.readerLayer || this.transition || this.tutorialPrompt || sys.isMobile ||
        e.getButton() !== EventMouse.BUTTON_LEFT) return;
    const point = this.pointerPosition(e);
    if (this.mode === 'street-loading') {
      if (!this.hitButton(point.x, point.y)) this.confirmDeparture();
      return;
    }
    if (this.overStreetStory(point.x, point.y)) return;
    this.mouseMove(e);
    this.startSupplyPress(this.mx, this.my, -2);
    this.pressHud(this.mx, this.my, -2);
    if (!this.hitButton(this.mx, this.my) && this.mode === 'playing') {
      this.mouseFire = true;
      this.mouseQueuedFire = true;
    }
  }
  private mouseUp() { if (this.readerLayer) { this.resetInput(); return; } this.mouseFire = false; this.releaseHud(-2); }
  private touchStart(e: EventTouch) {
    if (this.readerLayer) return;
    // Desktop clicks also generate touch events in Cocos; only mobile uses sticks.
    if (!sys.isMobile || this.tutorialPrompt || this.transition) return;
    const p = this.pointerPosition(e), id = e.getID();
    if (this.mode === 'street-loading') {
      if (!this.hitButton(p.x, p.y)) this.confirmDeparture();
      return;
    }
    if (id === null) return;
    if (this.overStreetStory(p.x, p.y)) return;
    this.startSupplyPress(p.x, p.y, id);
    this.pressHud(p.x, p.y, id);
    const grenade = this.buttons.find(button => button.node.name === 'Button-grenade');
    if (this.aimedTacticalButton() &&
        grenade?.node.active && p.x >= grenade.x && p.x <= grenade.x + grenade.w && p.y >= grenade.y && p.y <= grenade.y + grenade.h) {
      this.startTacticalTouch(e);
      return;
    }
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
    this.moveTacticalTouch(e, p);
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
    this.finishTacticalTouch(e.getID(), e.type === Input.EventType.TOUCH_CANCEL);
    if (e.getID() === this.moveTouch) { this.moveTouch = -1; this.moving = false; this.moveVector = { x: 0, y: 0 }; }
    if (e.getID() === this.aimTouch) { this.aimTouch = -1; this.aiming = false; this.aimOuter = false; this.aimRadius = 0; }
  }
  private startTacticalTouch(e: EventTouch) {
    const id = e.getID();
    if (!sys.isMobile || id === null || this.mode !== 'playing' || this.transition || this.tutorialPrompt ||
        this.operationGrenadeTouch || !this.aimedTacticalButton()) return;
    this.operationGrenadeTouch = { id, ...this.pointerPosition(e), angle: this.battle.player.angle, range: this.battle.survival ? 205 : 150 };
    const button = this.buttons.find(item => item.node.name === 'Button-grenade');
    if (button) this.pressHud(button.x + button.w / 2, button.y + button.h / 2, id);
  }
  private moveTacticalTouch(e: EventTouch, point?: Point) {
    const grenade = this.operationGrenadeTouch;
    if (!grenade || e.getID() !== grenade.id) return;
    const p = point ?? this.pointerPosition(e);
    const dx = p.x - grenade.x, dy = p.y - grenade.y, length = Math.hypot(dx, dy);
    grenade.angle = length > 10 ? Math.atan2(dy, dx) : this.battle.player.angle;
    grenade.range = length > 10 ? clamp(length * 3.6, 55, OPERATION_GRENADE_RANGE) : this.battle.survival ? 205 : 150;
  }
  private finishTacticalTouch(id: number | null, cancelled: boolean) {
    const grenade = this.operationGrenadeTouch;
    if (!grenade || id !== grenade.id) return;
    this.operationGrenadeTouch = undefined;
    this.releaseHud(grenade.id);
    if (!cancelled) this.releaseTacticalThrow(grenade.angle, grenade.range);
  }
  private movement() { return { x: this.moveVector.x + (this.keys.has(KeyCode.KEY_D) || this.keys.has(KeyCode.ARROW_RIGHT) ? 1 : 0) - (this.keys.has(KeyCode.KEY_A) || this.keys.has(KeyCode.ARROW_LEFT) ? 1 : 0), y: this.moveVector.y + (this.keys.has(KeyCode.KEY_W) || this.keys.has(KeyCode.ARROW_UP) ? 1 : 0) - (this.keys.has(KeyCode.KEY_S) || this.keys.has(KeyCode.ARROW_DOWN) ? 1 : 0) }; }
  private dodge() { const v = this.movement(); this.battle.dodge(v.x, v.y); }
  private hide() { if (this.mode === 'playing' && !this.transition) this.open('pause'); else this.resetInput(); }
  private play(name: string) {
    if (name === 'door-use' || !this.profile.sound) return;
    const support = name === 'operation-air-burst' || name === 'support-shot' || name === 'support-shot-suppressed' || name === 'operation-hostile-shot';
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
    const refresh = this.artRefresh;
    this.artRefresh = undefined;
    if (refresh === this.mode && !this.readerLayer && !this.caseRoll && (refresh !== 'profile-info' || this.canRefreshProfileArt())) this.open(refresh);
    if (this.readerLayer) { this.resetInput(); this.stepReaderAnimation(Math.min(dt, 0.05)); return; }
    dt = Math.min(dt, 0.05); this.presentationTime += dt; this.noticeTime = Math.max(0, this.noticeTime - dt); this.hitAudioTime = Math.max(0, this.hitAudioTime - dt);
    const cinema = this.operationCinema;
    this.stepOperationDialogue(dt);
    this.stepOperationEscape(dt);
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
    if (this.mode === 'street-loading') { this.updateDeparture(dt); return; }
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
      this.stepSurvivalDoorHold(dt);
      this.weaponEffects.step(dt, this.battle.blockers);
      if (this.tutorialPrompt) {
        this.resetInput();
      } else {
      const v = this.movement();
      const stick = this.aiming && this.aimRadius > 0;
      const overBag = !sys.isMobile && this.overSurvivalBag(this.mx, this.my);
      const pointer = overBag ? p.angle : Math.atan2(this.my - H / 2 - this.feedback.y, this.mx - W / 2 - this.feedback.x);
      const raw = stick ? Math.atan2(this.aimVector.y, this.aimVector.x) : p.angle;
      const aim = sys.isMobile ? this.aimAssist.step(dt, raw, p.angle, stick && !p.knockback,
        this.profile.aimAssist, this.battle.aimCandidates()) : { angle: pointer, sweeping: false };
      this.lastFacing = aim.angle; this.sweeping = aim.sweeping;
      this.battle.operationRadioBusy = !!this.operationDialogue;
      const fire = !overBag && (this.mouseFire || this.mouseQueuedFire || stick && this.aimOuter);
      this.mouseQueuedFire = false;
      this.battle.update(dt, { ...v, angle: this.lastFacing, fire: !this.profile.autoFire && fire,
        autoFire: this.profile.autoFire && !overBag, sweeping: this.sweeping,
        aimActive: sys.isMobile ? stick && !this.aimOuter : this.mouseAimInput, manualHeld: fire });
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
        if (event === 'hurt') this.feedback.hurt(p.hp / p.maxHp, this.battle.lastHurtAngle);
        if (event === 'grenade-blast') {
          const effect = this.battle.tacticalEffects.find(item => (item.kind === 'grenade' || item.kind === 'proximity-mine') && item.life === item.max);
          if (effect) this.feedback.explosion(effect, p, !lineClear(effect, p, this.battle.blockers), effect.kind === 'proximity-mine' ? 1.45 : 1);
        }
        if (event === 'clear') this.toast(this.battle.stage.operation ? '敌人已肃清 · 前往目标' : !this.battle.stage.dorm && !this.battle.stage.street && this.battle.cleared.every(Boolean) ? '所有区域已清理，前往洗衣房东北角楼梯撤离' : '区域安全 · 生命恢复 20，继续前进');
        if (event === 'room' && !this.battle.survival && !this.battle.stage.dorm && !this.battle.stage.street && !this.battle.stage.operation) this.toast(`进入${this.battle.rooms[Math.max(0, roomAt(p, this.battle.rooms))].kind} · 留意攻击预警`);
        if (event === 'operation-air-request') this.speakOperation([
          ['littlebird', '我到了，正在找目标。'],
        ]);
        if (event === 'operation-first-contact') this.speakOperation([
          ['two', '前面有人，留神。'],
        ]);
        if (event === 'operation-market') this.speakOperation([
          ['three', '侧巷有人过来了！'],
                  ]);
        if (event === 'operation-emplacement') this.speakOperation([
          ['four', '两挺机枪，先找掩体！'],
                  ]);
        if (event === 'operation-rope-ready') this.speakOperation([['pickup', '绳放下了。一个个上。']]);
        if (event === 'operation-boarding') {
          this.clearOperationDialogue();
          this.resetInput();
          this.feedback.reset();
          this.weaponEffects.clear();
          this.uiTick = 0;
        }
        if (event === 'operation-hold') this.speakOperation([
          ['pickup', '还要一会儿。你们先撑住。'],
                  ]);
        if (event === 'operation-injection') this.speakOperation([
          ['rimelet', '来晚了。样本已经送走了。'],
          ['two', '他在扎针！往后退！'],
        ]);
        if (event === 'operation-king-escape') {
          const king = this.battle.enemies.find(e => e.operationBoss === 'king');
          this.beginOperationEscape(king?.x ?? OPERATION_LEADER.x, king?.y ?? OPERATION_LEADER.y, 2.2);
          this.toast('任务更新 · 经大厅左侧西门撤回登陆区');
          this.speakOperation([
            ['rimelet', '你们挡不住。末日已经到了。'],
          ]);
        }
        if (event === 'operation-announcement') {
          this.speakOperation([
            ['command', '接应在路上。你们撤出后，空袭开始。'],
          ]);
        }
        if (event === 'operation-slam') this.play('grenade-blast');
        if (event === 'alert' && !this.battle.events.includes('street-alarm')) this.toast('附近敌人已警戒 · 留意攻击预警', 3.4, 'warning');
        if (event === 'door-blocked' && this.battle.doors.some(d => d.blocked > 0 && Math.hypot(p.x - d.x, p.y - d.y) < 200)) this.toast('门被挡住了，请让开门扇的转动范围', undefined, 'warning');
        if (event === 'door-geometry-blocked') this.toast('门扇被墙体或其他门挡住了', undefined, 'warning');
        if (event === 'door-warning') this.toast('敌人正在强行撞门', 3.4, 'warning');
        if (event === 'door-forced') this.toast('门被强行撞开', undefined, 'warning');
        if (event === 'stairs-locked') this.toast('楼梯间铁门锁住了 · 到东侧值班室找钥匙');
        if (event === 'exit-locked') this.toast('宿舍楼铁门锁住了 · 去宿管室找钥匙');
        if (event === 'key-pickup') this.toast(`已拾取${this.battle.stage.dorm?.pickup.name} · ${this.battle.objective}`);
        if (event === 'unlock') this.toast('铁门已解锁', undefined, 'success');
        if (event === 'alarm') this.toast('宿管室警报响了 · 丧尸正向这里靠近', 3.4, 'warning');
        if (event === 'street-alarm') { this.play('alarm'); this.toast('汽车警报响了 · 从路口向北突围', 3.4, 'warning'); }
        if (event === 'street-alarm-pulse') this.play('alarm');
        if (event === 'support-called') this.startGhostRadio();
        if (event === 'ammo-empty') this.toast('备用弹药已耗尽 · 寻找弹药');
        if (event === 'supply-full') {
          if (this.battle.survival) { this.survivalQuickOpen = true; this.uiTick = 0; }
          const block = this.battle.survivalPickupBlocked;
          this.toast(block ? SURVIVAL_GEAR[block.kind][0] + '需要连续 ' + block.width + '×' + block.height + ' 格（' +
            block.width * block.height + ' 格）' : '该补给已满');
        }
        if (event === 'loot') this.toast(this.battle.events.includes('mod-cache') ? '已拾取配件箱 · 行动结束时结算' : '已拾取物资');
        if (event === 'survival-stair-threat') this.toast('听见楼梯传来脚步', 2.4, 'warning');
        if (event === 'survival-airdrop') { this.play('alarm'); this.toast('空投已落地 · 查看港区地图', 4); this.uiTick = 0; }
        if (event === 'survival-mine-trigger') { this.play('unlock'); this.toast('感应地雷已触发', 1.25); }
        if (event === 'survival-shock-trigger') this.play('unlock');
        if (event === 'survival-flashbang' || event === 'survival-fire-ignite') this.play('explosion');
        if (event === 'survival-sentry-fire') this.play('shoot');
        if (event === 'survival-sentry-placed') this.toast('哨械枪已部署');
        if (event === 'survival-sentry-blocked') this.toast('落点被占用 · 哨械枪已放回背包');
        if (event === 'survival-sentry-lost') this.toast('一台哨械枪已被摧毁');
        if (event === 'survival-door-work-cancel') this.toast('门位施工中断 · 材料已保留', undefined, 'warning');
        if (event === 'survival-door-repaired' || event === 'survival-door-installed') {
          this.play('door-sound');
          this.toast(event === 'survival-door-repaired' ? '门板修补完成' : '新门板已安装', undefined, 'work');
        }
        if (event === 'survival-timed-checkpoint') this.saveSurvivalCheckpoint();
        if (event === 'survival-part-found') this.toast('收到新的配件线索 · 查看港区地图');
        if (event === 'survival-convoy-radio') this.speakOperation([
          ['headquarters', '装甲车队两分钟后到工事南门。'],
          ['headquarters', '车队停留三分钟。能赶到，就跟他们撤离。'],
        ]);
        if (event === 'survival-blood-moon') this.speakOperation([
          ['headquarters', '血月来了。丧尸开始成群活动。'],
          ['headquarters', '小心，它们会进楼搜人。'],
        ]);
        if (event === 'survival-air-request' && !this.operationDialogue) this.speakOperation([
          ['headquarters', '小鸟进场，马上压住尸群。'],
        ]);
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
      if (this.battle.enemies.some(e => (e.forceOpen || 0) > 0)) this.toast('敌人正在强行撞门 · 立即远离门扇', 3.4, 'warning');
      this.battle.events = [];
      if (this.battle.status === 'playing' && this.battle.operationRun?.ready) {
        const part = this.battle.stage.operation?.part;
        if (part === 'city' && this.battle.advanceOperation(operationLevel('compound'))) this.enterBattleScene(4);
        else if (part === 'compound' && this.battle.advanceOperation(operationLevel('defense'))) this.enterBattleScene(4);
        else if (part === 'defense') this.beginOperationCinematic('strike');
        return;
      }
      if (this.battle.survival && this.battle.status !== 'playing') {
        if (this.battle.survival.timed?.route) { this.transition = { kind: 'win', time: 0 }; this.resetInput(); }
        else this.finishBattle();
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
    if (this.battle.stage.operation || this.battle.survival || this.airborne?.root.active) this.updateOperationAirArt(active ? dt : 0);
    const offsetX = this.feedback.x, offsetY = this.feedback.y;
    const driving = this.battle.evacuationDrive;
    if (driving && this.getawaySprite) {
      this.getawaySprite.node.setPosition(driving.x, driving.y);
      this.getawaySprite.node.angle = driving.angle * 180 / Math.PI;
    }
    this.world.setPosition(-p.x + offsetX, -p.y + offsetY);
    const floorOffset = this.battle.survivalUpperFloor?.offsetX ?? 0;
    this.environment.setPosition(-p.x + floorOffset + offsetX, -p.y + offsetY);
    if (this.battle.survival) this.updateSurvivalRoofs(dt);
    // Actor clipping follows movement immediately, independent of the outdoor lighting budget.
    const outdoor = !!this.battle.stage.operation && this.battle.stage.operation.part !== 'compound';
    const evacuationView = this.battle.evacuationViewRadius;
    const visionRange = evacuationView || this.battle.playerVisionRange;
    const allyRange = this.battle.allyVisionRange;
    const lamp = this.battle.stage.faultyDoorLamp;
    const allies = evacuationView ? [] : this.battle.allies.filter(ally => ally.hp > 0 && Math.abs(ally.x - p.x) <= W / 2 + allyRange && Math.abs(ally.y - p.y) <= H / 2 + allyRange);
    const allySight = allies.map(ally => [ally.id, Math.round(ally.x / 3), Math.round(ally.y / 3), Math.round(ally.angle * 40)].join(',')).join('|');
    const grenadeLights = this.battle.grenadeLights, airSight = this.battle.operationAirSight;
    const airKey = airSight ? [airSight.x, airSight.y, airSight.radius].map(value => Math.round(value / 8)).join(',') : '';
    this.sightTick -= dt;
    this.outdoorLightTick -= dt;
    const geometry = this.battle.geometryRevision;
    const geometryChanged = this.lastGeometry !== geometry;
    const flashChanged = !!grenadeLights.length !== this.hadGrenadeLight;
    const sightDirty = grenadeLights.length || this.hadGrenadeLight || this.sightTick <= 0 || evacuationView !== this.lastEvacuationView ||
      allySight !== this.lastAllySight || airKey !== this.lastAirSight || geometryChanged ||
      Math.hypot(p.x - this.lastSightX, p.y - this.lastSightY) > 0.01 || Math.abs(angleDiff(p.angle, this.lastSightAngle)) > 0.001;
    if (sightDirty) this.outdoorLightPending = true;
    const lightDirty = outdoor
      ? !this.lightCamera || geometryChanged || flashChanged || this.outdoorLightPending && this.outdoorLightTick <= 0
      : sightDirty;
    if (sightDirty || lightDirty) {
      this.sightTick = 1;
      const localCover = (source: Point, range: number) => this.battle.visionBlockers.filter(r =>
        Math.abs(r.x + r.w / 2 - source.x) < range + r.w && Math.abs(r.y + r.h / 2 - source.y) < range + r.h);
      const blocks = localCover(p, visionRange);
      const pts = visibilityPolygon(p, p.angle, blocks, visionRange, !!evacuationView);
      if (this.survivalRoofLayer.active) {
        this.survivalRoofStencil.clear();
        polygon(this.survivalRoofStencil, floorOffset ? pts.map(q => ({ x: q.x - floorOffset, y: q.y })) : pts, '#ffffff');
      }
      this.stencil.clear();
      polygon(this.stencil, pts, '#ffffff');
      const toScreen = (q: Point) => ({ x: q.x - p.x + W / 2, y: q.y - p.y + H / 2 });
      const buildLight = (field: VisibilityField, unit: Point & { angle: number }, sight: Point[], cover: Rect[], range: number, panorama = false) => {
        field.build(sight.map(toScreen), FEATHER_PIXELS, visibilityPolygon(unit, unit.angle, [], range, panorama).map(toScreen),
          { origin: toScreen(unit), peripheralRadius: panorama ? range : peripheralRange(range) });
        field.addSurfaces(visibleSurfaces(unit, unit.angle, cover, range).map(surface => ({ ...surface, polygon: surface.polygon.map(toScreen) })));
      };
      if (lightDirty) buildLight(this.visibilityField, p, pts, blocks, visionRange, !!evacuationView);
      for (const ally of allies) {
        const cover = outdoor ? localCover(ally, allyRange) : blocks;
        const sight = visibilityPolygon(ally, ally.angle, cover, allyRange);
        polygon(this.stencil, sight, '#ffffff');
        if (!lightDirty) continue;
        if (!outdoor) {
          const field = this.allyVisibilityField ??= new VisibilityField(this.visibilityField.width, this.visibilityField.height);
          buildLight(field, ally, sight, cover, allyRange);
          this.visibilityField.mergeLight(field);
          continue;
        }
        const cached = this.outdoorAllyLight.get(ally.id);
        const dx = cached ? Math.round((p.x - cached.camera.x) * this.visibilityField.width / W) : 0;
        const dy = cached ? Math.round((p.y - cached.camera.y) * this.visibilityField.height / H) : 0;
        if (cached && cached.geometry === geometry && Math.abs(dx) <= 2 && Math.abs(dy) <= 2 &&
            Math.hypot(ally.x - cached.source.x, ally.y - cached.source.y) <= 4 && Math.abs(angleDiff(ally.angle, cached.angle)) <= .035) {
          this.visibilityField.mergeLight(cached.field, 1, dx, dy);
        } else {
          const field = cached?.field ?? new VisibilityField(this.visibilityField.width, this.visibilityField.height);
          buildLight(field, ally, sight, cover, allyRange);
          this.outdoorAllyLight.set(ally.id, { source: { x: ally.x, y: ally.y }, angle: ally.angle, camera: { x: p.x, y: p.y }, geometry, field });
          this.visibilityField.mergeLight(field);
        }
      }
      for (const flash of grenadeLights) {
        const sight = grenadeLightPolygon(flash, blocks);
        polygon(this.stencil, sight, '#ffffff');
        if (!lightDirty) continue;
        const field = this.allyVisibilityField ??= new VisibilityField(this.visibilityField.width, this.visibilityField.height);
        field.build(sight.map(toScreen), 42);
        const strength = clamp((GRENADE_LIGHT_TIME - (flash.max - flash.life)) / 0.27, 0, 1);
        this.visibilityField.mergeLight(field, strength * strength);
      }
      if (airSight) {
        this.stencil.fillColor = color('#ffffff');
        this.stencil.circle(airSight.x, airSight.y, airSight.radius); this.stencil.fill();
        if (lightDirty) this.visibilityField.addAerialSight(toScreen(airSight), airSight.radius, airSight.intensity);
      }
      this.lastAirSight = airKey;
      this.lastEvacuationView = evacuationView;
      this.hadGrenadeLight = grenadeLights.length > 0;
      if (lightDirty) {
        if (lamp) this.visibilityField.addDoorLamp(lamp, p, this.battle.blockers);
        this.visibilityTexture.uploadData(this.visibilityField.pixels);
        this.lightCamera = { x: p.x, y: p.y };
        if (outdoor) this.outdoorLightTick = 1 / 16;
        this.outdoorLightPending = false;
      }
      this.lastSightX = p.x; this.lastSightY = p.y; this.lastSightAngle = p.angle; this.lastGeometry = geometry;
      this.lastAllySight = allySight;
    }
    const mount = this.playerWeaponMount();
    const flashAllowed = p.hp > 0 && p.dashTime <= 0 && lineClear(p, mount.muzzle, this.battle.blockers);
    if (this.presentationMaterial) {
      this.presentationMaterial.setProperty('viewInfo', new Vec4(W, H, offsetX, offsetY));
      const camera = this.lightCamera;
      this.presentationMaterial.setProperty('maskMotion', outdoor && camera ? new Vec4(p.x - camera.x, p.y - camera.y, 0, 0) : new Vec4(0, 0, 0, 0));
      const quiet = this.battle.hero.quiet;
      this.presentationMaterial.setProperty('muzzle', new Vec4(W / 2 + mount.muzzle.x - p.x, H / 2 + mount.muzzle.y - p.y, flashAllowed ? this.feedback.muzzle * (quiet ? 0.22 : 1) : 0, quiet ? 90 : this.battle.hero.weapon === 'shotgun' ? 160 : 140));
      this.presentationMaterial.setProperty('doorLamp', lamp ?
        new Vec4(W / 2 + lamp.x - p.x, H / 2 + lamp.y - p.y, doorLampFlicker(lamp, this.battle.elapsed), DOOR_LAMP_RADIUS) :
        new Vec4(0, 0, 0, DOOR_LAMP_RADIUS));
      this.presentationMaterial.setProperty('feedback', new Vec4(this.feedback.hit, this.feedback.lowHealth, this.feedback.healthSeverity, 0));
      const gray = clamp((this.fallTime - FALL_DURATION) / GRAY_DURATION, 0, 1);
      const daylight = !!this.battle.survival;
      const focus = daylight ? this.survivalFocus : undefined;
      const interior = focus ? 1 - focus.opacity.opacity / 255 : 0;
      if (focus) {
        const r = focus.bounds;
        const sceneX = p.x - floorOffset;
        this.presentationMaterial.setProperty('interiorBounds', new Vec4(r.x + r.w / 2 - sceneX + W / 2, r.y + r.h / 2 - p.y + H / 2, r.w / 2, r.h / 2));
        const room = focus.rooms[roomAt({ x: sceneX, y: p.y }, focus.rooms)] ?? r;
        this.presentationMaterial.setProperty('currentRoomBounds', new Vec4(room.x + room.w / 2 - sceneX + W / 2,
          room.y + room.h / 2 - p.y + H / 2, room.w / 2, room.h / 2));
      }
      this.presentationMaterial.setProperty('grading', new Vec4(daylight ? .67 : DARK_BRIGHTNESS,
        daylight ? .8 : DARK_SATURATION, gray * gray * (3 - 2 * gray), interior));
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
    const doors = this.battle.doors;
    const exteriorDoors = this.battle.survival ? doors.filter(d => !this.survivalFloorDoors.has(d.id) &&
      Math.abs(d.x - (p.x - floorOffset)) <= W / 2 + d.length + 32 && Math.abs(d.y - p.y) <= H / 2 + d.length + 32) : doors;
    if (this.battle.survival) this.drawSurvivalDoorSurfaces(this.doorsLit, exteriorDoors);
    else drawDoors(this.doorsLit, exteriorDoors, this.battle.alarmTime, rasterDoors && this.apartmentDoors.length > 0);
    for (const house of this.survivalFloorArt) for (const floor of house.floors) {
      if (floor.opacity.node.active) this.drawSurvivalDoorSurfaces(floor.doors, floor.doorIds.map(id => doors[id]));
    }
    if (this.lastBloodBattle !== this.battle || this.lastBloodRevision !== this.battle.bloodRevision) {
      const stains = this.battle.bloodStains;
      const floorArt = this.survivalFloorArt.flatMap(house => house.floors);
      drawBloodStains(this.bloodArt, floorArt.length ? stains.filter(stain => !floorArt.some(floor => roomAt(stain, [floor.bounds]) >= 0)) : stains, this.battle);
      for (const floor of floorArt) drawBloodStains(floor.blood, stains.filter(stain => roomAt(stain, [floor.bounds]) >= 0), this.battle);
      this.lastBloodBattle = this.battle; this.lastBloodRevision = this.battle.bloodRevision;
    }
    const animal = active && !this.transition && !this.tutorialPrompt && !this.battle.tutorial ? this.wildlife.step(dt, this.battle) : undefined;
    this.wildlifeArt.node.active = !!animal;
    if (animal) drawAmbientAnimal(this.wildlifeArt, animal);
    const glob = this.artFrames.get('venom-glob'), dart = this.artFrames.get('venom-dart');
    drawActors(this.actors, this.battle, this.motion.pose, this.hasPlayerArt(), this.artFrames.has('walker'), this.artFrames.has(this.rollKey()), this.enemyPoses, this.artFrames.has('operator') || this.streetFrames.has('engineer'), !!this.battle.apartment && this.streetFrames.has('brute'), !!this.grenadeFrame, this.grenadeBlastFrames.length > 0,
      { spitter: this.artFrames.has('spitter'), glob: !!glob, dart: !!dart });
    this.updateGrenadeArt();
    this.updateVenomArt(glob, dart);
    this.updateSurvivalDeviceArt(dt);
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
    let direction = active && !this.transition && !this.tutorialPrompt ? exitGuideAngle(this.battle) : undefined;
    if (direction !== undefined && (this.battle.stage.operation || this.battle.survival)) {
      const previous = this.operationGuideHeading ?? direction;
      direction = previous + angleDiff(direction, previous) * (1 - Math.exp(-dt * 10));
      this.operationGuideHeading = direction;
    } else this.operationGuideHeading = undefined;
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
    drawWeaponEffects(this.weaponArt, this.weaponEffects, mount, flashAllowed, this.battle.visionScale > 1);
    if (flashAllowed && !this.battle.tutorial && this.battle.hero.laser > 0) {
      const distance = rayDistance(mount.muzzle, mount.angle, this.battle.hero.laser, this.battle.blockers);
      line(this.weaponArt, mount.muzzle.x, mount.muzzle.y,
        mount.muzzle.x + Math.cos(mount.angle) * distance, mount.muzzle.y + Math.sin(mount.angle) * distance, '#ff614c', 1.2, 175);
    }
    drawHitBlood(this.weaponArt, this.battle.particles);
    drawParalysis(this.weaponArt, this.battle);
    drawRecovery(this.weaponArt, this.battle);
    if (this.mode === 'playing') {
      if (this.operationBossHud) this.updateOperationBossHud(dt);
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
    this.clearHarborStream();
    this.canvas?.destroy();
    this.environmentCamera?.node.destroy(); this.actorCamera?.node.destroy();
    this.presentationMaterial?.destroy(); this.satelliteMaterial?.destroy(); this.outputFrame?.destroy();
    this.visibilityTexture?.destroy(); this.environmentTarget?.destroy(); this.actorTarget?.destroy();
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
    if (sys.isBrowser && typeof window !== 'undefined') {
      window.removeEventListener('touchend', this.finishBrowserTacticalTouch, true);
      window.removeEventListener('touchcancel', this.finishBrowserTacticalTouch, true);
    }
    game.off(Game.EVENT_HIDE, this.hide, this);
  }
}
