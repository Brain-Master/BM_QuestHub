#!/usr/bin/env python3
"""
Генерация наборов файлов бренда BrainMaster из одного исходного PNG.

По умолчанию читает assets/brand/brainmaster-logo.png от корня репозитория
и записывает результат в assets/brand/generated/.

Примеры:
  python scripts/generate_brainmaster_assets.py
  python scripts/generate_brainmaster_assets.py --no-transparent --webp-quality 80
  python scripts/generate_brainmaster_assets.py --sync-next
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print(
        "Нужен Pillow: pip install -r scripts/requirements-brand-assets.txt",
        file=sys.stderr,
    )
    sys.exit(1)

RESAMPLE = Image.Resampling.LANCZOS if hasattr(Image, "Resampling") else Image.LANCZOS

# Размеры для веба и UI (маска прозрачности применяется до ресайза там, где нужно).
PNG_WEBP_SIZES = (16, 32, 48, 64, 128, 180, 192, 256, 512)

# Next.js / PWA / Apple (Google рекомендует 192 и 512 для manifest).
MANIFEST_SIZES = (192, 512)


def repo_root_from_script() -> Path:
    return Path(__file__).resolve().parent.parent


def remove_near_black_rgba(im: Image.Image, threshold: int) -> Image.Image:
    """Делает почти чёрный фон прозрачным (ожидается тёмный фон логотипа)."""
    rgba = im.convert("RGBA")
    pix = rgba.load()
    w, h = rgba.size
    t = threshold
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            if r <= t and g <= t and b <= t:
                pix[x, y] = (r, g, b, 0)
    return rgba


def resize_square(im: Image.Image, size: int) -> Image.Image:
    return im.resize((size, size), RESAMPLE)


def write_png(path: Path, im: Image.Image) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, format="PNG", optimize=True)


def write_webp(path: Path, im: Image.Image, quality: int, lossless: bool) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(
        path,
        format="WEBP",
        quality=quality,
        method=6,
        lossless=lossless,
    )


def ensure_rgba_for_ico(im: Image.Image) -> Image.Image:
    """Next.js / image-rs при разборе ICO ожидают встроенный PNG в RGBA."""
    if im.mode == "RGBA":
        return im
    return im.convert("RGBA")


def build_favicon_ico(images_for_sizes: list[tuple[int, Image.Image]], out_path: Path) -> None:
    """Мультиразмерный ICO из уже подготовленных квадратных изображений."""
    by_size = {s: im for s, im in images_for_sizes}
    order = sorted(by_size.keys())
    icons = [ensure_rgba_for_ico(resize_square(by_size[s], s)) for s in order]
    out_path.parent.mkdir(parents=True, exist_ok=True)
    first = icons[0]
    rest = icons[1:]
    save_kw: dict = {"format": "ICO"}
    if rest:
        save_kw["append_images"] = rest
    first.save(out_path, **save_kw)


def sync_next_app(web_public_dir: Path, paths: dict[str, Path]) -> None:
    """Копирует ключевые файлы в apps/web/app для метаданных Next.js."""
    web_public_dir.mkdir(parents=True, exist_ok=True)
    mapping = [
        ("favicon.ico", paths["favicon.ico"]),
        ("icon.png", paths["icon_png"]),
        ("apple-icon.png", paths["apple_png"]),
    ]
    for name, src in mapping:
        if src.is_file():
            shutil.copy2(src, web_public_dir / name)


def sync_public_brand_mark(
    root: Path,
    transparent_icon_128: Path | None,
    opaque_icon_128: Path,
) -> None:
    """Марк для шапки (next/image → /brand/brainmaster-mark.png)."""
    dest_dir = root / "apps" / "web" / "public" / "brand"
    dest_dir.mkdir(parents=True, exist_ok=True)
    src = (
        transparent_icon_128
        if transparent_icon_128 and transparent_icon_128.is_file()
        else opaque_icon_128
    )
    if src.is_file():
        shutil.copy2(src, dest_dir / "brainmaster-mark.png")


def main() -> int:
    root = repo_root_from_script()
    parser = argparse.ArgumentParser(description="Экспорт BrainMaster: PNG, WebP, ICO.")
    parser.add_argument(
        "--source",
        type=Path,
        default=root / "assets" / "brand" / "brainmaster-logo.png",
        help="Исходный PNG",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=root / "assets" / "brand" / "generated",
        help="Каталог вывода",
    )
    parser.add_argument(
        "--webp-quality",
        type=int,
        default=85,
        help="Качество WebP (0–100), если не --webp-lossless",
    )
    parser.add_argument(
        "--webp-lossless",
        action="store_true",
        help="Сохранять WebP без потерь (игнорирует --webp-quality)",
    )
    parser.add_argument(
        "--black-threshold",
        type=int,
        default=36,
        help="Порог RGB для удаления чёрного фона (ниже — прозрачность)",
    )
    parser.add_argument(
        "--no-transparent",
        action="store_true",
        help="Не генерировать варианты с прозрачным фоном",
    )
    parser.add_argument(
        "--sync-next",
        action="store_true",
        help="Скопировать favicon/icon/apple-icon в apps/web/app",
    )
    args = parser.parse_args()

    src = args.source.resolve()
    if not src.is_file():
        print(f"Файл не найден: {src}", file=sys.stderr)
        return 1

    out = args.out.resolve()
    base_rgb = Image.open(src).convert("RGB")
    rgba_transparent = (
        None if args.no_transparent else remove_near_black_rgba(base_rgb, args.black_threshold)
    )

    written: list[str] = []

    # --- Непрозрачные PNG/WebP (как исходник, только ресайзы; для тёмных тем/фона)
    opaque_dir = out / "opaque" / "png"
    opaque_webp = out / "opaque" / "webp"
    for size in PNG_WEBP_SIZES:
        sq = resize_square(base_rgb, size)
        p = opaque_dir / f"icon-{size}.png"
        write_png(p, sq)
        written.append(str(p.relative_to(root)))
        wpath = opaque_webp / f"icon-{size}.webp"
        write_webp(wpath, sq, args.webp_quality, args.webp_lossless)
        written.append(str(wpath.relative_to(root)))

    # ICO из непрозрачной версии (16, 32, 48)
    ico_sizes = (16, 32, 48)
    ico_images = [(s, resize_square(base_rgb, s)) for s in ico_sizes]
    ico_path = out / "opaque" / "favicon.ico"
    build_favicon_ico(ico_images, ico_path)
    written.append(str(ico_path.relative_to(root)))

    # Прозрачные PNG/WebP
    if rgba_transparent is not None:
        t_png = out / "transparent" / "png"
        t_webp = out / "transparent" / "webp"
        for size in PNG_WEBP_SIZES:
            sq = resize_square(rgba_transparent, size)
            p = t_png / f"icon-{size}.png"
            write_png(p, sq)
            written.append(str(p.relative_to(root)))
            wpath = t_webp / f"icon-{size}.webp"
            write_webp(wpath, sq, args.webp_quality, args.webp_lossless)
            written.append(str(wpath.relative_to(root)))

        # Отдельный ICO с альфой (часть браузеров предпочитает непрозрачный favicon)
        t_ico_images = [(s, resize_square(rgba_transparent, s)) for s in ico_sizes]
        t_ico = out / "transparent" / "favicon.ico"
        build_favicon_ico(t_ico_images, t_ico)
        written.append(str(t_ico.relative_to(root)))

        # PWA manifest размеры (прозрачный фон)
        manifest_dir = out / "transparent" / "pwa"
        for size in MANIFEST_SIZES:
            sq = resize_square(rgba_transparent, size)
            mp = manifest_dir / f"icon-{size}.png"
            write_png(mp, sq)
            written.append(str(mp.relative_to(root)))

    # Apple touch 180×180 (из непрозрачного квадрата — как отдельный файл)
    apple_path = out / "opaque" / "apple-touch-icon.png"
    write_png(apple_path, resize_square(base_rgb, 180))
    written.append(str(apple_path.relative_to(root)))

    # Дубликат «сжатый» каталог: WebP с более низким качеством для экономии трафика
    if not args.webp_lossless:
        low_q = max(60, min(args.webp_quality - 10, 90))
        low_dir = out / "opaque" / "webp-low"
        for size in PNG_WEBP_SIZES:
            sq = resize_square(base_rgb, size)
            p = low_dir / f"icon-{size}.webp"
            write_webp(p, sq, low_q, False)
            written.append(str(p.relative_to(root)))
        if rgba_transparent is not None:
            lt = out / "transparent" / "webp-low"
            for size in PNG_WEBP_SIZES:
                sq = resize_square(rgba_transparent, size)
                p = lt / f"icon-{size}.webp"
                write_webp(p, sq, low_q, False)
                written.append(str(p.relative_to(root)))

    if args.sync_next:
        paths_for_next = {
            "favicon.ico": ico_path,
            "icon_png": opaque_dir / "icon-512.png",
            "apple_png": apple_path,
        }
        next_app = root / "apps" / "web" / "app"
        sync_next_app(next_app, paths_for_next)
        written.append(str((next_app / "favicon.ico").relative_to(root)))
        written.append(str((next_app / "icon.png").relative_to(root)))
        written.append(str((next_app / "apple-icon.png").relative_to(root)))
        t128 = out / "transparent" / "png" / "icon-128.png"
        sync_public_brand_mark(
            root,
            t128 if rgba_transparent is not None else None,
            opaque_dir / "icon-128.png",
        )
        pub_mark = root / "apps" / "web" / "public" / "brand" / "brainmaster-mark.png"
        if pub_mark.is_file():
            written.append(str(pub_mark.relative_to(root)))

    print(f"Готово: {len(written)} файлов в {out.relative_to(root)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
