# 第二章 · 归途

第一章撤离后，可在探索地图点选「第二章 · 归途」。凛从学校出口向东经过公交站，到第一个路口转向北，再向东进入住宅街。抵达撤离点即完成关卡。便利店和后巷提供一条绕行路线，后巷或废弃车库会随机出现急救包。支路尽头的施工路障和封锁线挡住通行，路面延伸到路障另一边。

主路和封锁线位置固定，每局随机调整部分车辆、急救包和丧尸的起始位置。第一个路口的汽车发出持续约 11 秒的警报，北向长街的尸群向路口推进。左、下、右三个方向随后持续从视野外补充丧尸，场上最多同时存活 40 名。听见声音的丧尸能绕过墙壁，从可通行的门出来。

最后一个拐角触发三名幽灵突击手从住宅街东侧前来支援。队友在危险时后撤射击，脱离威胁后回到凛身边。战斗画面和小地图合并凛与存活队友的视野。汽车警报触发后，丧尸会持续追击凛，也会攻击靠近的队友。

## 街景图集

使用内置 ImageGen 生成。车辆、候车亭、路障和立面存放于 `assets/resources/common/environment/street-props-v1.png`。地面材质存放于 `assets/resources/common/environment/street-ground-v1.jpg`。

> Create a production-ready transparent PNG atlas for a top-down zombie survival game, 3 columns by 2 rows, six isolated realistic orthographic camera straight overhead props. Each cell equally sized, blank transparent margins and separation, no grid lines and no words. Row 1 left to right: long abandoned gray green city bus with roof scratches and broken windshield (long axis horizontal, front pointing right), rusted beige hatchback (horizontal right), blue crashed sedan with crushed front (horizontal right). Row 2 left to right: dark steel and smoked glass bus shelter with an opaque canopy and a bench, footprint horizontal, squat concrete traffic barricade with faded white diagonal strips (horizontal), and a long narrow gray supermarket wall with two mint green awnings and worn lintel (horizontal). Compact props centered in their own cell, fill 80% cell width and no overlapping. Plausible East Asian city after evacuation, worn but grounded textures, neutral soft ambient light, realistic materials, game-readable silhouettes, no side perspective, no people, no blood, no extraneous floor, no external shadows. True transparency outside all six silhouettes.

> Create a square four-quadrant game ground texture atlas, 2 by 2 perfectly aligned equal square tiles, no borders. Straight overhead orthographic scan of worn materials for a post-apocalyptic modern urban street. Top left asphalt with fine rough aggregate, old thin cracks, gray, no road markings. Top right light gray concrete sidewalk with long rectangular slabs and faint stains, no objects. Bottom left worn off-white and sage small square convenience-store ceramic tiles. Bottom right dark textured rough concrete service alley with faint drainage stains and small surface cracks. Each tile fills its entire quadrant edge to edge. Uniform diffuse light, subtle detail with no shadows or deep perspective, no text, no people, no props, no signs or decals. Keep colors softly desaturated and the texture readable at the scale of a top-down game.

## 探索地图底图

使用内置 ImageGen 生成，成品位于 `assets/resources/home/exploration-map-v1.jpg`。

> A realistic overhead tactical city map backdrop for a dark survival game level-select screen. Wide landscape 1536x1024 composition that can be center-cropped to 2.12:1. Straight orthographic top-down satellite/drone photography and precise site plan of a deserted contemporary East Asian city neighborhood, dim slate-gray and graphite palette, very subtle muted olive vegetation, lightly weathered real materials. WEST / LEFT THIRD: recognizable walled school campus with a running track and long blocky concrete academic roofs, including one smaller dorm block along the east campus edge. EAST / RIGHT THIRD: dense mid-rise residential blocks, a visible big four-way crossing and small roadside shops. A clear east-west avenue links campus exit in left-center to the big junction in right-center across the middle third, with varied narrow alleys, courtyards, sidewalks. Fill frame edge to edge with real city blocks at one consistent scale, continuous geography, professional game world map image. Soft, even light with good local contrast, dark atmospheric without crushing the plan, sparse warm windows if any. NO text, labels, coordinate lines, overlay, markers, interface, borders, arrows or route highlights, NO people, no bright lights. Only the unobstructed base satellite map for live UI markers. Roofs, running track and intersection identifiable at small sizes.
