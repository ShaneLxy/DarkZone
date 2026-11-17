# 0.4 美术素材与完整提示词

本轮使用内置 `image_gen`，未使用 CLI 或 API fallback。输入为工程内既有素材，生成原件保留在默认目录，游戏只引用工程内的副本。

| 文件 | 最终保存路径 | 用途与裁切 |
| --- | --- | --- |
| 翻滚两帧 | `assets/resources/art/operator-roll-v1.png` | 1774×887 RGBA，左右各 887×887；引擎按等大单元裁切，显示尺寸 90×90、中心锚点 |
| 无投影沙发 | `assets/resources/art/sofa-reception-v2.png` | 1774×887 RGBA；有效区域 x35 y187 w1705 h555，显示为 210×65 |
| 无投影桌子 | `assets/resources/art/desk-reception-v2.png` | 1671×941 RGBA；有效区域 x54 y145 w1563 h665，显示为 145×82 |

帧图不包含碰撞体、角色属性或特效。两帧覆盖收身与翻转，非完整骨骼动画；三名玩家暂时共用这组素材。无投影家具保留材质凹凸明暗，场景可见性由运行时视野系统决定。

## 翻滚帧图

输入编辑目标／风格参考：`operator-raven-v1.png`。真实透明背景。

```text
Use case: identity-preserve. Asset type: TWO FRAME SPRITE SHEET for this existing top-down tactical shooter character. Edit target/reference: attached olive tactical operator with helmet, backpack and rifle. Create a horizontal 2-cell sprite sheet, both square cells equal size, on real transparent background. Left cell: crouched tuck at start of forward combat roll toward EAST/right, shoulders low, rifle tucked safely across chest. Right cell: visibly different midway somersault pose toward EAST/right, back and compact folded legs uppermost, helmet tucked down, not a standing or running pose. Strict orthographic top-down 90 degree overhead camera; match the attached realistic worn olive military material style, identity, clothing and equipment. Each pose individually centered in its own square cell, equal world scale, full silhouette, generous transparent padding, no overlap. Clear compact silhouettes readable at 70 pixels. No ground plane, NO cast shadow, no motion trail, no fire, no effects, no border, no captions or labels. This sheet supplies exactly two animation frames between the existing standing sprite and recovery.
```

## 无投影沙发

输入编辑目标：`sofa-reception-v1.png`。真实透明背景。

```text
Use case: precise-object-edit. Edit target: this existing top-down sofa sprite. Preserve exactly the same sofa design, proportions, blue-gray worn upholstery, seams and orthographic top-down orientation. Remove ALL ground/contact/cast/drop shadows outside the object. The sofa must have a clean cutout alpha silhouette, no dark halo around its edges. Use uniform diffuse ambient illumination with readable material details, no directional shadow over the cushions. Center the sofa at full width with transparent padding, landscape image. No background, floor, other objects, border or text. Real transparent background.
```

## 无投影桌子

输入编辑目标：`desk-reception-v1.png`。真实透明背景。

```text
Use case: precise-object-edit. Edit target: this existing top-down office desk sprite. Preserve exactly the same worn rectangular desktop, monitor, keyboard, papers and cup, proportions and strict orthographic top-down orientation. Remove ALL ground/contact/cast/drop shadows outside the desk silhouette. No black halo or projected shadow around the desk. Use uniform diffuse ambient illumination so all tabletop details remain readable, minimize directional dark shading. Center the full desk with transparent padding, landscape image. Keep clean alpha cutout. No floor, background, new objects, border or text. Real transparent background.
```
