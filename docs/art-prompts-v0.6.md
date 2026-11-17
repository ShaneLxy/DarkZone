# 0.6 素材记录：三帧无武器翻滚

生成方式：内置 ImageGen。使用当前持枪角色图片作为身份与材质参考，重新生成连续动作；参考中的武器不出现在翻滚素材中。保留 v1 原文件供历史版本追溯，游戏加载 v2。

| 最终文件（相对项目根目录） | 规格与接入 |
| --- | --- |
| assets/resources/art/heroine-roll-v2.png | 2172 × 724 RGBA，三格各 724 × 724；女主收身、翻转、起身，显示尺寸 64 × 64 |
| assets/resources/art/operator-roll-v2.png | 2172 × 724 RGBA，三格各 724 × 724；军人收身、翻转、起身，显示尺寸 70 × 70，三名军人共用并略作配色区分 |

原图透明通道直接保留，没有额外抠图、合成或绘制武器。两张均检查为三个人物姿态、空手、固定俯视镜头，中段可见背部／侧面与翻过身体的腿。每格使用源图左上角裁切矩形 (i × 724, 0, 724, 724)，独立 originalSize、offset，锚点 (0.5,0.5)。

三帧按翻滚进度 0～25%、25～72%、72～100% 切换，完整动作结束前不显示站立持枪模型。保持原有 0.30 秒动作、约 132 像素位移及 2.4 秒冷却。

## 女主三帧完整提示词

参考图：assets/resources/art/heroine-usp-v1.png，仅用于身份和材质。

Use case: stylized-concept. Game-ready 2D THREE FRAME forward shoulder-roll animation sprite sheet. Horizontal 3:1 canvas, exactly THREE equal SQUARE cells in one row with wide transparent gutters. Fixed orthographic camera looking vertically DOWN at the ground throughout. Character rolls EAST/right in all three frames. This must be a real somersault, not three crouching poses. Frame LEFT: low forward lean, head and one shoulder lowered toward RIGHT, arms gathered close, legs pushing off behind LEFT. Frame MIDDLE: unmistakable INVERTED mid-tumble, shoulders/back on the ground, rounded back and folded bent legs uppermost, boots sweeping over toward RIGHT and head tucked toward LEFT; crown need not be visible. Frame RIGHT: feet planted, one knee bent under the body, torso rising toward RIGHT into a low recovery crouch. SAME body scale, same clothing proportions, each whole silhouette centered on its own cell with 15% margin and consistent animation pivot. Hands empty, absolutely NO visible weapon anywhere: no gun, pistol, rifle, suppressor, holster silhouette, blade or equipment held in hands. Realistic textured pre-rendered overhead tactical-game material style, neutral ambient lighting, clean silhouette, NO cast/contact shadow or dark halo, no floor, no trails, no text, no separators. Genuine transparent background. Reference image supplies IDENTITY and MATERIALS ONLY; omit its weapon. Same female survivor: long black hair, silver X hair clip, navy blazer with white piping, white shirt, navy plaid pleated skirt, dark knee socks and black shoes. Hair follows the rotation of the body, gathered around the head/back while tumbling. Keep skirt and clothing modestly covering the body in all poses, no underwear or exposed intimate areas. The middle frame must show a different body surface from the first: back and folded legs, with the head tucked under.

## 军人三帧完整提示词

参考图：assets/resources/art/operator-raven-v1.png，仅用于身份和材质。

Use case: stylized-concept. Game-ready 2D THREE FRAME forward shoulder-roll animation sprite sheet. Horizontal 3:1 canvas, exactly THREE equal SQUARE cells in one row with wide transparent gutters. Fixed orthographic camera looking vertically DOWN at the ground throughout. Character rolls EAST/right in all three frames. This must be a real somersault, not three crouching poses. Frame LEFT: low forward lean, head and one shoulder lowered toward RIGHT, arms gathered close, legs pushing off behind LEFT. Frame MIDDLE: unmistakable INVERTED mid-tumble, shoulders/back on the ground, rounded back and folded bent legs uppermost, boots sweeping over toward RIGHT and head tucked toward LEFT; crown need not be visible. Frame RIGHT: feet planted, one knee bent under the body, torso rising toward RIGHT into a low recovery crouch. SAME body scale, same clothing proportions, each whole silhouette centered on its own cell with 15% margin and consistent animation pivot. Hands empty, absolutely NO visible weapon anywhere: no gun, pistol, rifle, suppressor, holster silhouette, blade or equipment held in hands. Realistic textured pre-rendered overhead tactical-game material style, neutral ambient lighting, clean silhouette, NO cast/contact shadow or dark halo, no floor, no trails, no text, no separators. Genuine transparent background. Reference image supplies IDENTITY and MATERIALS ONLY; omit its rifle. Same military operator: green camouflage uniform, olive helmet, small tactical vest/pouches, dark boots and gloves. No rifle slung on the back either. In the middle frame, show backpack/rounded back and bent boots above the tucked helmet so the body visibly turns over.

