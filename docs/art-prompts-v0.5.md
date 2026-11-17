# 0.5 素材记录：女主与校园宿舍

生成方式：内置 ImageGen，未使用 API／CLI。使用用户提供的女生图作身份参考，原有 operator-raven-v1.png 作俯视材质风格参考。所有采用的原图已复制到项目，不依赖生成缓存目录。

## 最终接入文件

| 文件（相对项目根目录） | 用法 |
| --- | --- |
| assets/resources/art/heroine-usp-v1.png | 1254 × 1254 RGBA；俯视持 USP 消音手枪；72 × 72 逻辑像素，身体锚点 (0.25, 0.5) |
| assets/resources/art/heroine-roll-v1.png | 1774 × 887 RGBA；两帧各 887 × 887，按动作时间切换 |
| assets/resources/art/dorm-kit-v2.png | 1254 × 1254 RGBA；2 × 2 图集，仅使用床、书桌和柜顶三格 |
| assets/resources/art/dorm-corridor-floor-v1.png | 1254 × 1254 RGB；走廊与洗衣房水磨石地砖，重复平铺 |
| assets/resources/art/dorm-bedroom-floor-v1.png | 1254 × 1254 RGB；两间寝室木纹地板，重复平铺 |

图集矩形采用源图左上角坐标：床 (43,183,541,287)，书桌 (673,170,536,340)，柜顶 (41,818,544,285)。克隆 SpriteFrame 设置独立 originalSize 与 offset，防止透明边距造成放置偏移。贴图显示脚印与 Levels.ts 的碰撞／遮挡脚印共用。

女主枪口挂点为身体局部 (51,1)，抛壳点 (33,-2)，随瞄准旋转与步态缩放。女主与军人使用独立翻滚图集；切换角色时刷新缓存节点尺寸和锚点。

dorm-kit-v1.png 是保留的初版候选，没有被运行时代码引用。v2 右下洗衣机仍为正面视角，未采用；游戏内洗衣机使用代码绘制的俯视顶面。旧军人、敌人和前版素材继续保留。

## 最终提示词

### 女主持枪模型

身份参考：用户附件 codex-clipboard-c2ac0363-ca4e-4264-a09f-86a2ab2b4549.png。材质风格参考：assets/resources/art/operator-raven-v1.png。

Use case: stylized-concept. Asset type: game-ready transparent 2D sprite. Image 1 is CHARACTER IDENTITY reference only: long straight black hair, small silver X hair clip, navy blazer with white piping, white shirt/navy bow, navy plaid pleated skirt, black knee socks/shoes. Image 2 is STYLE reference only: realistic textured pre-rendered overhead game sprite. Create ONE heroine, strict orthographic 90-degree overhead looking directly at crown, facing EAST/right. Combat-ready two-handed grip on a black USP tactical pistol with cylindrical suppressor, pointing exactly right. Match the realistic worn hand-painted materials and proportions of Image 2, not anime front-view. No helmet or military armor. Hair falls down her back toward left, arms extend right. Upper body and skirt from overhead, no visible face or exposed underwear; legs animated separately. Center body pivot at 40% canvas width and 50% height; suppressor tip about 88% width at 50% height. Square canvas, full uncropped silhouette with clear transparent margin. Neutral diffuse ambient lighting, NO cast/contact shadow or dark halo, no floor, no motion, no fire, no text, no grid. Actual transparent background.

### 女主两帧翻滚

参考／编辑输入：上述女主持枪模型。

Use case: identity-preserve. Image is reference for a playable heroine: long black hair with X silver clip, navy blazer/white piping, navy plaid skirt and USP suppressed handgun. Make a horizontal TWO FRAME sprite sheet with two equal square cells and genuine transparent background. Strict overhead 90-degree camera, same realistic textured game material style and same outfit. Left cell: compact crouched tucked start of shoulder roll EAST/right, pistol tucked close. Right cell: clear midway shoulder-roll EAST/right, back and folded knees uppermost, hair gathered around shoulder, pistol tucked; visibly different pose. Modest coverage of clothing in both poses; no underwear or exposed intimate areas. Entire body in frame with padding, each pose same world scale and centered in cell, no cast shadows, no floor, no trails, no text/borders. Exactly two compact overhead action silhouettes, not a running pose or a front view.

### 宿舍道具初次生成

Use case: stylized-concept. Asset type: game-ready transparent 2x2 PROP ATLAS for a top-down university student dormitory, four exactly equal square cells in a square image. Strict orthographic 90-degree top-down, absolutely no isometric or front face. TOP LEFT: horizontal single student bed, pillow at LEFT, faded sage blue blanket, slim wooden frame, folded quilt; footprint about 2:1. TOP RIGHT: horizontal student study desk with closed notebook, small lamp, laptop and a textbook, footprint about 2:1. BOTTOM LEFT: horizontal row of two closed pale blue-gray dorm storage lockers as seen DIRECTLY from above, footprint about 2:1. BOTTOM RIGHT: compact pair of top-loading washing machines, white enamel with circular top lids, laundry-room furniture, footprint about 2:1. Exactly one isolated prop per cell, centered with large transparent gutters so cells can be cropped safely. All four sprites use same readable semi-realistic textured pre-rendered tactical game style, muted sage/cream/navy palette, neutral ambient light. NO ground or floor, NO cast shadows or contact shadows outside silhouettes, no dark halo, no labels, no letters, no people, no walls, no grid or borders. Truly transparent background, square atlas.

### 道具俯视修正版

编辑输入：dorm-kit-v1.png。接入结果为 dorm-kit-v2.png，使用范围见上方记录。

Edit this exact 2x2 transparent game prop atlas. Keep the TOP LEFT bed and TOP RIGHT desk unchanged. Correct ONLY the two bottom props to strict 90-degree overhead TOP surfaces, never front views: BOTTOM LEFT shows only the smooth rectangular TOP of two closed steel storage cabinets, flat blue-gray metal panels with fine seams, NO visible doors, handles or front vents. BOTTOM RIGHT shows only the TOP panels of two compact TOP-LOADING washing machines viewed straight down, each with a circular horizontal glass lid and small control strip along rear edge. NO front-loading door, no vertical front face. Each bottom prop centered in its equal square cell with plenty of transparent margin. Same realistic worn materials, neutral ambient illumination, no cast/contact shadows or colored edge halos. Preserve real transparency, four equal cells in square sheet, no text.

### 走廊地砖

Use case: stylized-concept. Asset type: seamless square floor tile material for a 2D overhead university dormitory game. Exact orthographic top-down, flat filling the full square canvas. A clean but lightly worn Chinese university residence corridor floor: small light warm-ivory terrazzo ceramic square tiles, restrained pale-gray grout, a few subtle scuffs and tiny aggregate grains. Diffuse neutral illumination, fairly bright readable midtones so runtime game lighting can darken it. NO wall, door, furniture, plants, people, writing, footprints, strong stains, vignette, directional light or baked shadows. Consistent tile size, repeatable edges. Realistic textured pre-rendered tactical game material.

### 寝室木纹地板

Use case: stylized-concept. Asset type: seamless square floor tile material for a 2D overhead university dormitory game. Exact orthographic top-down, flat filling the entire square canvas. Worn light honey-beige narrow vinyl wood planks in an older student dorm room, restrained fine wood grain, subtle scratches, desaturated warm beige and taupe, readable material. Neutral diffuse even illumination with no directional shadow, bright enough for runtime lighting. NO walls, furniture, rug, objects, people, text, strong stains, borders, vignette or perspective. Consistent plank scale with repeatable edges. Realistic pre-rendered hand-painted tactical game texture.

