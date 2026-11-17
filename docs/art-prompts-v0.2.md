# 0.2 美术样板与生成提示词

使用内置 `image_gen` 工具生成，未使用 CLI / API fallback。以下最终素材已复制到工程，生成原件保留在工具默认目录。目标风格：严格正俯视、冷灰绿废弃设施、写实材质与简化轮廓、低饱和度、柔和中性底光。

| 素材 | 工程路径 | 用途 |
| --- | --- | --- |
| 地板 | `assets/resources/art/reception-floor-v1.png` | 接待区可见地面 |
| 渡鸦 | `assets/resources/art/operator-raven-v1.png` | 渡鸦战斗上半身与步枪 |
| 普通敌人 | `assets/resources/art/enemy-walker-v1.png` | 普通近战敌人上半身 |
| 沙发 | `assets/resources/art/sofa-reception-v1.png` | 接待区三人沙发 |
| 接待桌 | `assets/resources/art/desk-reception-v1.png` | 接待区中央桌面 |

角色透明图保留完整画布，以固定躯干锚点旋转；家具在引擎中按有效 alpha 区域选取 SpriteFrame。素材本身不包含碰撞体、视野遮挡、门的状态或完整动画。

## 地板：原始生成提示词

```text
Game-ready seamless floor texture, exact orthographic 90-degree top-down, square flat image filling the entire canvas edge-to-edge. A worn abandoned modern facility reception floor: cold gray-green stone tiles with fine dark grout on a regular square grid, subtle scratches, dusty worn edges, a few tiny stains. Realistic hand-painted game texture with restrained detail, material richness similar to an atmospheric 2D top-down tactical shooter. NORMAL neutral diffuse illumination, readable midtone surface, no baked directional lighting. Floor texture only, NO room walls, NO furniture, NO doors, NO people, NO objects, NO rug, NO text, NO border, NO perspective, NO vignette. Tile-scale uniform across image. This will be displayed underneath furniture in a mobile 2D game.
```

地板只用于一个房间内的样板，不宣称其边缘已经完成严格无缝拼接验收。

## 渡鸦：透明底生成提示词

```text
A SINGLE game-ready transparent PNG sprite of an adult tactical operator for an atmospheric 2D top-down shooter. STRICT exact 90 degree TOP-DOWN orthographic camera directly above the crown of the head, NOT isometric, NOT three-quarter front view. Facing EAST / RIGHT, holding a compact assault rifle aimed horizontally RIGHT. The visible anatomy is helmet crown, broad shoulders, upper back, forearms holding rifle; no visible face, no legs or feet (legs are animated separately in engine). Muted sage-gray tactical armor, small warm tan pouch accents, dark gloves, realistic proportions with simplified readable silhouette, richly textured hand-painted pre-rendered game asset style. Neutral soft ambient lighting with no directional cast shadow. One character only, centered at torso, uncropped rifle and hands, transparent background, no ground, NO cast shadow, no text, no sheet, no grid, no perspective. Character fills about 75 percent of square canvas with enough transparent margin. Distinct compact top-down silhouette must remain readable at 60 pixels. This is an upper-body sprite for continuous rotation around torso.
```

## 普通敌人：透明底生成提示词

```text
A SINGLE game-ready transparent PNG sprite of a hostile infected adult human for an atmospheric 2D top-down shooter. STRICT exact 90 degree TOP-DOWN orthographic camera directly above head, NOT isometric, NOT three-quarter front view. Facing EAST / RIGHT with both arms reaching slightly forward RIGHT. Visible anatomy: head crown, shoulders, upper back and arms; NO legs or feet (engine animates legs separately), NO visible frontal face. Ragged desaturated olive-gray work clothes, dirty pale skin, small rusty reddish cloth accents, lean uneven silhouette. Realistic proportions with simplified readable silhouette; richly textured hand-painted pre-rendered game asset style. Neutral soft ambient lighting, NO directional cast shadow. One creature only centered at torso, transparent background, no ground, no text, no sheet, no grid, no perspective. Body fills about 70 percent of square canvas with transparent margin. Must remain readable at 50 pixels. Same cold gray-green facility tactical-shooter art direction as a muted sage-armored player.
```

## 沙发：透明底原始生成提示词

```text
A single game-ready environment prop sprite: an old three-seat reception sofa, strict EXACT 90-degree orthographic TOP-DOWN view looking straight down, NO isometric or perspective. Wide horizontal sofa, muted worn blue-gray upholstery, subtle square cushion seams and dirt, sturdy slim arms on left/right and a backrest at the TOP edge. Realistic textured hand-painted pre-rendered 2D tactical game asset. Neutral diffuse lighting without cast shadow, no floor, no background, no people, no text, no other objects. Transparent background. Complete sofa uncropped, centered with thin transparent padding. Its physical overhead footprint is a horizontal rectangle with roughly 3.2 to 1 width-to-height ratio. All surfaces must be visible only from directly above, no front facade.
```

为控制最长纹理边长，随后用内置工具以原图为编辑目标重新安排方形透明画布。最终工程使用该版本，编辑提示词：

```text
Reformat this exact same top-down sofa sprite onto a SQUARE transparent canvas suitable for a mobile game texture. Preserve the sofa design, three cushions, material, color and exact overhead view. Center the entire sofa horizontally and vertically; sofa should occupy 90% of canvas width, with generous transparent space above and below. No floor, no text, no shadows, no new objects. Square output image, preferably 1024 by 1024, all edges at most 2048 pixels. Only reformat the sprite canvas and size; do not redesign the sofa.
```

## 接待桌：透明底生成提示词

```text
A single game-ready environment prop sprite: a worn rectangular facility reception office desk, strict EXACT 90-degree orthographic TOP-DOWN view looking straight down, NO isometric or perspective. Horizontal rectangular desk around 1.8 to 1 width-to-height, weathered gray-brown laminate desktop with brushed steel thin perimeter. On desktop a small old monitor at upper left seen from directly overhead with its short dark back and small base, a keyboard, two loose off-white documents, and a small dark coffee cup near the right. No office chair, no floor, no other objects outside the desk. Realistic textured hand-painted pre-rendered 2D tactical game asset, restrained cold gray-green palette and muted tan wood tones. Neutral diffuse lighting with NO directional cast shadow, transparent background, centered uncropped desk with thin padding. No text or readable lettering.
```
