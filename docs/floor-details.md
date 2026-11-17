# 公共地面装饰

内置 ImageGen 生成的透明图集保存在 `assets/resources/common/environment/floor-details-v1.png`。三行依次包含血泊、拖行血痕、散落血滴，污渍擦痕、灰尘碎屑、凌乱衣物，以及碎纸、文件夹、废弃包装和杂物。

关卡可在 `LevelDefinition.floorDetails` 配置种子及每个房间的装饰类型。可选类型为 `passage`（走廊）、`quiet`（较干净的房间）、`bedroom`（寝室）、`office`（办公室）和 `service`（勤务间）。`reserved` 可填写钥匙等交互位置，生成器同时避开墙体、家具、门扇活动范围、出生点和撤离点。同一图集在地板上方、战斗痕迹和家具下方渲染，接受场景视野调色。装饰不参与战斗碰撞。

## 墙边小动物

设置 `LevelDefinition.ambientWildlifeSeed` 即可启用。公共模块 `AmbientWildlife.ts` 从关卡墙体生成短路线，避开家具及门口，并在播放时检查门扇位置。进入楼层约 9～17 秒后首次尝试。有合适路线时，随机播放一次约 0.5～1.3 秒的老鼠或蟑螂动画，随后间隔 20～35 秒再尝试。动画使用现有视线遮罩，暂停和教学期间停止。

## ImageGen 提示词

> Create one square transparent game sprite atlas for a gritty, grounded 2D overhead post-apocalyptic survival game set in an abandoned campus dorm. Exactly NINE isolated sprites in a perfectly regular 3-column by 3-row grid with equal square cells, centered one asset per cell, 12% transparent safety margin all around each cell; nothing crosses cell boundaries. 90-degree overhead orthographic camera, realistic baked material texture and diffuse neutral light, restrained natural colors, delicate contact shadows for physical objects only. First row from left to right: (1) irregular dried dark rusty red blood puddle with a few scattered droplets, (2) elongated dark red-brown dragged blood smear with streaks and a handful of drops, (3) sparse cluster of dark brick-red drops with irregular sizes. Second row: (4) uneven gray-brown grime streaks and heel scuffs, mostly translucent and thin, (5) patch of pale charcoal scratched concrete dust and tiny chipped plaster flakes, sparsely scattered, (6) crumpled muted olive t-shirt and dark navy cloth loosely dropped together. Third row: (7) scattered individual torn off-white papers, some lightly folded, lightly dirty, (8) loose manila file folder and loose lightly yellowed pages with illegible scribbles, (9) discarded dented drink can, crumpled brown wrapper and two dark broken plastic fragments, loose compact grouping. Ground decals should lie flat and fade with natural transparent irregular edges. ABSOLUTELY no background, no concrete tile or ground plane behind the elements, no drop-shadow box, no outlines, no text or labels, no numbers or visible grid. Use true alpha transparency, game-ready cutouts. Readable at small game sizes.

## 宿舍门灯与楼梯

每局随机一至两盏普通门灯闪烁。暖色微光以门槛旁灯座为中心，最大半径为 48 个逻辑像素。墙体、门扇与实体家具遮挡光线，角色与敌人继续采用原有的视野遮罩。

俯视楼梯图集用内置 ImageGen 制作，保存于 `assets/resources/common/environment/dorm-stairs-v1.png`。左侧为二楼下行楼梯，带有下沉井口与深处平台。右侧为一楼上行楼梯，带有凸出的踏步和扶手。两套素材都从画面下方进入。最终提示词使用同方向的初稿作为参考。

> Create a LANDSCAPE 3:2 transparent game sprite atlas of two compact rectangular concrete staircases side by side, adapted from the referenced atlas's convincing dark descending stairwell and light ascending staircase. Preserve their overhead cutaway look, direction of travel (approach from BOTTOM, travel toward TOP), concrete aging, and matching scale and palette. Redesign both staircases as SHORT and WIDE compact flights, only 7 chunky treads and a SHORT landing at the top. Width-to-length for EACH stair silhouette is approximately 0.85:1, nearly square, absolutely not tall or narrow. On a 1536x1024 canvas each stair silhouette occupies only about 500 pixels across by 590 pixels high and is centered vertically with generous transparent top/bottom margins, left centered at x=384 and right at x=1152. Keep the left sprite as a recessed DOWN stair, with an upper-floor threshold along its BOTTOM edge, open dark well, side wall caps, and treads receding into a lower short landing at the TOP. Keep the right sprite as an UP stair, with low first riser at BOTTOM, raised weathered concrete treads and a small raised landing at TOP, slim metal handrails. Clearly readable alternating tread faces and contact shadows. Exactly TWO complete separate sprites, equal proportions. True transparent alpha beyond each prop, no floor or external shadows, no background color, no grid, no text, no arrows.
