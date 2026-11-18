"""第四章 AI 生成素材后处理。

用于把 image_gen 产出的图整理成 Cocos 可直接使用的资源：
  - sprite 模式：去掉右下角工具水印、把纯黑背景转成透明、裁到角色边界；
  - tile 模式：用同图上方纹理覆盖右下角水印区域（地面平铺图不能留白字）；
  - --meta：按输出图尺寸生成对应的 Cocos .meta。

用法：
  python tools/process-chapter4-art.py <input.png> <output.png> --mode sprite|tile [--meta]

示例：
  python tools/process-chapter4-art.py raw/leader.png assets/resources/chapter4/leader-ak47.png --mode sprite --meta
  python tools/process-chapter4-art.py raw/ground.png assets/resources/chapter4/ground-tiles.png --mode tile --meta
  # 多帧图集保留 1024x1024 画布，便于按固定网格裁帧
  python tools/process-chapter4-art.py raw/ruins.png assets/resources/chapter4/ruins-kit.png --mode sprite --keep-canvas --meta
"""

import argparse
import json
import uuid
from collections import deque
from pathlib import Path

from PIL import Image

# image_gen 会在右下角固定区域叠加 "AI生成 / WORKBUDDY" 水印，按比例定位。
WATERMARK_LEFT = 0.86
WATERMARK_TOP = 0.91
# 判定为纯黑背景的亮度阈值；只从图像边缘泛洪，避免误删角色深色衣物。
BLACK_THRESHOLD = 28


def watermark_box(size):
    w, h = size
    return int(w * WATERMARK_LEFT), int(h * WATERMARK_TOP), w, h


def remove_watermark_sprite(im):
    left, top, right, bottom = watermark_box(im.size)
    px = im.load()
    for y in range(top, bottom):
        for x in range(left, right):
            px[x, y] = (0, 0, 0, 255)


def remove_watermark_tile(im):
    left, top, right, bottom = watermark_box(im.size)
    height = bottom - top
    if top - height < 0:
        return
    patch = im.crop((left, top - height, right, top))
    im.paste(patch, (left, top))


def black_to_transparent(im):
    """把与图像边缘连通的近黑像素转为透明，保留角色内部的深色区域。"""
    w, h = im.size
    px = im.load()
    visited = bytearray(w * h)
    queue = deque()
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))

    def near_black(x, y):
        r, g, b, _ = px[x, y]
        return r < BLACK_THRESHOLD and g < BLACK_THRESHOLD and b < BLACK_THRESHOLD

    while queue:
        x, y = queue.popleft()
        idx = y * w + x
        if visited[idx] or not near_black(x, y):
            continue
        visited[idx] = 1
        px[x, y] = (0, 0, 0, 0)
        if x > 0:
            queue.append((x - 1, y))
        if x < w - 1:
            queue.append((x + 1, y))
        if y > 0:
            queue.append((x, y - 1))
        if y < h - 1:
            queue.append((x, y + 1))


def crop_to_content(im, margin=8):
    alpha = im.getchannel('A')
    bbox = alpha.getbbox()
    if not bbox:
        return im
    left, top, right, bottom = bbox
    return im.crop((
        max(0, left - margin), max(0, top - margin),
        min(im.width, right + margin), min(im.height, bottom + margin),
    ))


def write_meta(png_path: Path):
    im = Image.open(png_path)
    w, h = im.size
    main_uuid = str(uuid.uuid4())
    texture_uuid = f'{main_uuid}@6c48a'
    frame_uuid = f'{main_uuid}@f9941'
    name = png_path.stem
    meta = {
        "ver": "1.0.27",
        "importer": "image",
        "imported": True,
        "uuid": main_uuid,
        "files": [".json", ".png"],
        "subMetas": {
            "6c48a": {
                "importer": "texture",
                "uuid": texture_uuid,
                "displayName": name,
                "id": "6c48a",
                "name": "texture",
                "userData": {
                    "wrapModeS": "clamp-to-edge",
                    "wrapModeT": "clamp-to-edge",
                    "imageUuidOrDatabaseUri": main_uuid,
                    "isUuid": True,
                    "visible": False,
                    "minfilter": "linear",
                    "magfilter": "linear",
                    "mipfilter": "none",
                    "anisotropy": 0,
                },
                "ver": "1.0.22",
                "imported": True,
                "files": [".json"],
                "subMetas": {},
            },
            "f9941": {
                "importer": "sprite-frame",
                "uuid": frame_uuid,
                "displayName": name,
                "id": "f9941",
                "name": "spriteFrame",
                "userData": {
                    "trimThreshold": 1,
                    "rotated": False,
                    "offsetX": 0,
                    "offsetY": 0,
                    "trimX": 0,
                    "trimY": 0,
                    "width": w,
                    "height": h,
                    "rawWidth": w,
                    "rawHeight": h,
                    "borderTop": 0,
                    "borderBottom": 0,
                    "borderLeft": 0,
                    "borderRight": 0,
                    "packable": True,
                    "pixelsToUnit": 100,
                    "pivotX": 0.5,
                    "pivotY": 0.5,
                    "meshType": 0,
                    "vertices": {
                        "rawPosition": [-w / 2, -h / 2, 0, w / 2, -h / 2, 0, -w / 2, h / 2, 0, w / 2, h / 2, 0],
                        "indexes": [0, 1, 2, 2, 1, 3],
                        "uv": [0, h, w, h, 0, 0, w, 0],
                        "nuv": [0, 0, 1, 0, 0, 1, 1, 1],
                        "minPos": [-w / 2, -h / 2, 0],
                        "maxPos": [w / 2, h / 2, 0],
                    },
                    "isUuid": True,
                    "imageUuidOrDatabaseUri": texture_uuid,
                    "atlasUuid": "",
                    "trimType": "auto",
                },
                "ver": "1.0.12",
                "imported": True,
                "files": [".json"],
                "subMetas": {},
            },
        },
        "userData": {
            "type": "sprite-frame",
            "fixAlphaTransparencyArtifacts": False,
            "hasAlpha": True,
            "redirect": texture_uuid,
        },
    }
    meta_path = png_path.with_suffix(png_path.suffix + '.meta')
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return meta_path


def main():
    parser = argparse.ArgumentParser(description='第四章 AI 生成素材后处理')
    parser.add_argument('input', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--mode', choices=['sprite', 'tile'], required=True)
    parser.add_argument('--meta', action='store_true', help='同时生成 Cocos .meta')
    parser.add_argument('--keep-canvas', action='store_true', help='保留原画布尺寸，不裁到内容边界（用于多帧图集）')
    args = parser.parse_args()

    im = Image.open(args.input).convert('RGBA' if args.mode == 'sprite' else 'RGB')
    if args.mode == 'sprite':
        remove_watermark_sprite(im)
        black_to_transparent(im)
        if not args.keep_canvas:
            im = crop_to_content(im)
    else:
        remove_watermark_tile(im)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    im.save(args.output)
    result = {'output': str(args.output), 'size': list(im.size), 'mode': args.mode}
    if args.meta:
        result['meta'] = str(write_meta(args.output))
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
