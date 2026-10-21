"""Ставит на сайт новые фотографии товаров.

Как пользоваться
----------------
1. Сложить присланные файлы в папку tools/incoming/
   Имя файла — артикул товара: CH031113.jpg, DGR-125.png, MS-115.jpeg
   Регистр, пробелы и лишние знаки не важны: ch 031113.JPG тоже подойдёт.
   Несколько фото одного товара: CH031113.jpg, CH031113-2.jpg — возьмётся первое.

2. Сухой прогон, ничего не меняет:
       python3 tools/import_photos.py
   Покажет, сколько файлов легло на товары и какие не опознались.

3. Записать:
       python3 tools/import_photos.py --apply

Что делает с картинкой: ужимает до 900 px по длинной стороне (больше для
карточки товара не нужно), сохраняет в JPEG качества 86. Прозрачный фон
подкладывается белым. Старый файл не затирается — у товара просто
меняется ссылка, так что откатиться можно через git.
"""
import io, os, re, sys, shutil

try:
    from PIL import Image
except ImportError:
    sys.exit("Нужна библиотека Pillow:  pip3 install Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INCOMING = os.path.join(ROOT, "tools", "incoming")
DEST_DIR = os.path.join(ROOT, "images", "products2026")
PRODUCTS_JS = os.path.join(ROOT, "js", "products.js")
MAX_SIDE = 900
QUALITY = 86
EXTS = (".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff")

APPLY = "--apply" in sys.argv

HOMO = str.maketrans("АВСЕНКМОРТХУ", "ABCEHKMOPTXY")

def key(s):
    """Артикул к единому виду: латиница, только буквы и цифры."""
    s = (s or "").upper().replace("Ё", "Е").translate(HOMO)
    return re.sub(r"[^A-ZА-Я0-9]+", "", s)

def code_of(name):
    m = re.search(r'\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$', name)
    return m.group(1) if m else None

# ---------- каталог ----------
lines = io.open(PRODUCTS_JS, encoding="utf-8").read().split("\n")
LINE_RE = re.compile(r'^(\s*\{ id: (\d+), categoryId: "[^"]+", name: ")((?:[^"\\]|\\.)*)(".*?image: )(null|"[^"]*")(,.*)$')

items = []
for i, ln in enumerate(lines):
    m = LINE_RE.match(ln)
    if m:
        name = m.group(3).replace('\\"', '"')
        items.append({"i": i, "id": int(m.group(2)), "name": name,
                      "key": key(code_of(name)), "m": m})
by_key = {}
for p in items:
    if p["key"]:
        by_key.setdefault(p["key"], p)

# ---------- входящие файлы ----------
if not os.path.isdir(INCOMING):
    os.makedirs(INCOMING, exist_ok=True)
    sys.exit(f"Создал папку {INCOMING}\nПоложи туда фото и запусти снова.")

files = sorted(f for f in os.listdir(INCOMING)
               if os.path.splitext(f)[1].lower() in EXTS and not f.startswith("."))
if not files:
    sys.exit(f"В {INCOMING} нет картинок.")

matched, unknown, taken = [], [], set()
for f in files:
    base = os.path.splitext(f)[0]
    # сначала пробуем имя целиком: у артикулов вроде CH031210 и DGR-125
    # цифры на конце — часть кода, срезать их нельзя
    p = by_key.get(key(base))
    if not p:
        # не нашлось — возможно, это второй снимок: CH031113-2, DGR-125_3
        p = by_key.get(key(re.sub(r"[-_ ]\d{1,2}$", "", base)))
    if not p:
        unknown.append(f)
    elif p["id"] in taken:
        pass                                         # уже взяли фото для этого товара
    else:
        taken.add(p["id"])
        matched.append((f, p))

print(f"файлов: {len(files)}   опознано товаров: {len(matched)}   не опознано: {len(unknown)}")
if unknown:
    print("\nне нашёл такой артикул в каталоге:")
    for f in unknown[:25]:
        print("   ", f)
    if len(unknown) > 25:
        print(f"    ... и ещё {len(unknown) - 25}")

# ---------- обработка ----------
if not APPLY:
    print("\nпримеры привязки:")
    for f, p in matched[:10]:
        print(f"   {f:<28} -> {p['name'][:50]}")
    print("\n(сухой прогон — добавь --apply, чтобы записать)")
    sys.exit()

os.makedirs(DEST_DIR, exist_ok=True)
written = 0
for f, p in matched:
    src = os.path.join(INCOMING, f)
    try:
        im = Image.open(src)
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            bg = Image.new("RGB", im.size, (255, 255, 255))
            bg.paste(im, mask=im.split()[-1])
            im = bg
        else:
            im = im.convert("RGB")
        if max(im.size) > MAX_SIDE:
            s = MAX_SIDE / max(im.size)
            im = im.resize((round(im.size[0] * s), round(im.size[1] * s)), Image.LANCZOS)
        name = f"p{p['id']}.jpg"
        im.save(os.path.join(DEST_DIR, name), "JPEG", quality=QUALITY, optimize=True)
    except Exception as e:
        print(f"   не смог обработать {f}: {e}")
        continue
    mm = p["m"]
    lines[p["i"]] = mm.group(1) + mm.group(3) + mm.group(4) + f'"images/products2026/{name}"' + mm.group(6)
    written += 1

io.open(PRODUCTS_JS, "w", encoding="utf-8").write("\n".join(lines))
print(f"\nобновлено товаров: {written}")
print("Не забудь поднять версию js/products.js в HTML, иначе браузер отдаст старый каталог.")
