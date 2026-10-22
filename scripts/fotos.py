#!/usr/bin/env python3
"""
Voz dos Sabores · galeria de fotografias

Converte as fotografias originais (JPG) em versões leves para a web e atualiza
automaticamente a galeria completa e a seleção da página inicial, nas duas línguas.

Uso (na pasta do site):
    pip install pillow
    python scripts/fotos.py                    # lê de fotos-originais/
    python scripts/fotos.py "C:/caminho/fotos" # ou de outra pasta

O que faz:
  - img/fotos/thumb/NOME.webp  miniatura, 640 px no lado maior (~25 KB)
  - img/fotos/full/NOME.webp   versão grande, 1800 px no lado maior (~120 KB)
  - remove os metadados (EXIF: GPS, câmara, datas) e corrige a orientação
  - reescreve a galeria entre <!-- FOTOS:START --> e <!-- FOTOS:END -->
    em galeria/index.html e en/gallery/index.html
  - reescreve a seleção da página inicial entre <!-- DESTAQUES:START --> e
    <!-- DESTAQUES:END --> em index.html e en/index.html

Ficheiros de configuração (opcionais):
  data/fotos-destaque.txt  nomes das fotos para a página inicial, uma por linha
                           (sem lista, usa as 12 primeiras)
  data/fotos-legendas.csv  NOME;legenda PT;legenda EN  (texto alternativo)
  data/fotos-excluir.txt   fotos que não devem ser publicadas, uma por linha

Os originais NÃO vão para o repositório (fotos-originais/ está no .gitignore).
"""
import csv
import html
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "fotos-originais"
THUMB_DIR = ROOT / "img" / "fotos" / "thumb"
FULL_DIR = ROOT / "img" / "fotos" / "full"
DATA = ROOT / "data"
SIZES = {"thumb": (THUMB_DIR, 640, 72), "full": (FULL_DIR, 1800, 76)}
HOME_COUNT = 12
EXTS = {".jpg", ".jpeg", ".png", ".webp"}

PAGES_ALL = [  # (ficheiro, prefixo até à raiz, língua)
    (ROOT / "galeria" / "index.html", "../", "pt"),
    (ROOT / "en" / "gallery" / "index.html", "../../", "en"),
]
PAGES_HOME = [
    (ROOT / "index.html", "", "pt"),
    (ROOT / "en" / "index.html", "../", "en"),
]
ALT_DEFAULT = {
    "pt": "Fotografia do festival Voz dos Sabores ({n} de {total})",
    "en": "Photo from the Voz dos Sabores festival ({n} of {total})",
}


def read_list(path):
    if not path.exists():
        return []
    out = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.split("#", 1)[0].strip()
        if line:
            out.append(Path(line).stem)
    return out


def read_captions():
    path = DATA / "fotos-legendas.csv"
    caps = {}
    if path.exists():
        with path.open(encoding="utf-8", newline="") as fh:
            for row in csv.reader(fh, delimiter=";"):
                if len(row) >= 3 and not row[0].startswith("#"):
                    caps[Path(row[0].strip()).stem] = {"pt": row[1].strip(), "en": row[2].strip()}
    return caps


def convert(src):
    """Gera as duas versões WebP de uma fotografia (só se ainda não existirem)."""
    name = src.stem
    sizes = {}
    im = None
    for key, (folder, side, quality) in SIZES.items():
        out = folder / f"{name}.webp"
        if not out.exists():
            if im is None:
                im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
            t = im.copy()
            t.thumbnail((side, side), Image.LANCZOS)
            folder.mkdir(parents=True, exist_ok=True)
            t.save(out, "WEBP", quality=quality, method=6)  # sem EXIF
        with Image.open(out) as done:
            sizes[key] = done.size
    return sizes


def item_html(photo, n, total, prefix, lang, caps):
    name, sizes = photo["name"], photo["sizes"]
    alt = caps.get(name, {}).get(lang) or ALT_DEFAULT[lang].format(n=n, total=total)
    tw, th = sizes["thumb"]
    fw, fh = sizes["full"]
    return (
        f'        <li><a href="{prefix}img/fotos/full/{name}.webp" data-lightbox data-w="{fw}" data-h="{fh}">'
        f'<img src="{prefix}img/fotos/thumb/{name}.webp" width="{tw}" height="{th}" loading="lazy" decoding="async" '
        f'alt="{html.escape(alt)}"></a></li>'
    )


def write_block(page, marker, items_html):
    pattern = re.compile(rf"(<!-- {marker}:START -->)(.*?)(\n\s*<!-- {marker}:END -->)", re.S)
    src = page.read_text(encoding="utf-8")
    if not pattern.search(src):
        sys.exit(f"Marcadores {marker}:START / {marker}:END não encontrados em {page}")
    new = pattern.sub(lambda m: m.group(1) + "\n" + items_html + m.group(3), src, count=1)
    page.write_text(new, encoding="utf-8")


def main():
    excluded = set(read_list(DATA / "fotos-excluir.txt"))
    caps = read_captions()

    if SRC.exists():
        sources = sorted(p for p in SRC.iterdir() if p.suffix.lower() in EXTS)
        for i, src in enumerate(sources, 1):
            if src.stem in excluded:
                continue
            convert(src)
            print(f"\r{i}/{len(sources)} {src.name}", end="", flush=True)
        print()
    else:
        print(f"Pasta {SRC} não encontrada: uso só as fotos já convertidas.")

    # a galeria publica todas as fotos já convertidas (menos as excluídas)
    photos = []
    for full in sorted(FULL_DIR.glob("*.webp")):
        name = full.stem
        if name in excluded or not (THUMB_DIR / f"{name}.webp").exists():
            continue
        with Image.open(full) as a, Image.open(THUMB_DIR / f"{name}.webp") as b:
            photos.append({"name": name, "sizes": {"full": a.size, "thumb": b.size}})
    if not photos:
        sys.exit("Nenhuma fotografia encontrada.")

    total = len(photos)
    for page, prefix, lang in PAGES_ALL:
        block = "\n".join(item_html(p, i, total, prefix, lang, caps) for i, p in enumerate(photos, 1))
        write_block(page, "FOTOS", block)

    wanted = read_list(DATA / "fotos-destaque.txt")
    by_name = {p["name"]: (i, p) for i, p in enumerate(photos, 1)}
    chosen = [by_name[n] for n in wanted if n in by_name] or list(enumerate(photos, 1))[:HOME_COUNT]
    for page, prefix, lang in PAGES_HOME:
        block = "\n".join(item_html(p, i, total, prefix, lang, caps) for i, p in chosen[:HOME_COUNT])
        write_block(page, "DESTAQUES", block)

    # remove versões de fotos excluídas
    for name in excluded:
        for folder in (THUMB_DIR, FULL_DIR):
            (folder / f"{name}.webp").unlink(missing_ok=True)

    print(f"Galeria: {total} fotografias · página inicial: {min(len(chosen), HOME_COUNT)}")


if __name__ == "__main__":
    main()
