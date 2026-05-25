# Инструкция дизайнеру BM Quest Hub

Версия Design Pack: **1.0.0**

## Что в ZIP

| Файл / папка | Назначение |
|--------------|------------|
| `01_Инструкция_дизайнеру.pdf` | Этот документ |
| `02_Структура_inbox.pdf` | Дерево папок и имена `.source.*` |
| `presets/vse_sloty.csv` | Все слоты → **Sync/** на Drive → WebP на сайте |
| `templates-psd/` | PSD с разметкой safe area (слой `SAFE_AREA_GUIDE`) |
| `templates-svg/` | Те же зоны в SVG |
| `previews/` | PNG-превью шаблонов |
| `inbox-README.txt` | Справка: тот же текст, что README в папке **Sync/** на Drive |
| `03_School_agenda_media.pdf` | Видео и галерея на странице расписания школы |

## Workflow

1. Откройте PSD из `templates-psd/` для нужного слота.
2. Сверьтесь с `previews/` и CSV (`presets/vse_sloty.csv`).
3. Соберите кадр: главный объект в **cyan safe area**; не кладите важное в красные/затемнённые зоны.
4. Экспортируйте **отдельный файл на слот**:
   - `hero-16x9.source.jpg` — баннер 16:9
   - `catalog-4x3.source.jpg` — каталог 4:3
   - `compact-4x3.source.jpg` — карточка расписания (три горизонтальные зоны)
   - `logo-256.source.png` — логотип площадки
   - `photo-01-16x10.source.jpg` … `photo-04` — фото площадки (сайдбар школы)
   - `landing-poster.source.jpg` — постер к landing-видео (~30 с)
   - `activity-gallery/gallery-01.source.jpg` … `gallery-12` — галерея «Как проходят занятия»
   - `landing-30s.mp4` — короткое видео для school agenda (без звука, до ~30 с)
5. Откройте на Drive папку **`Sync`** внутри [BM_QuestHub_Media](https://drive.google.com/drive/folders/1mnzEh2-aqkzFaxg2oOtxX1E5KGrj0_1F) (дерево как в `02_Структура_inbox.pdf`). Серые файлы — заглушки: замените файл **с тем же именем** своим экспортом. PSD и PDF — в соседней папке **`FOR_DESIGNER`**.
6. Сообщите редактору: **`make media-push`** (скачать Sync → обновить сайт). Команда для команды перед правками: **`make media-pull`** (выложить актуальное дерево в Sync).

## Правила

- **Не** вносите URL картинок в Google Sheets.
- Расписание: **два** файла на смену — hero и compact.
- Квест: hero 16:9 и catalog 4:3 — **разные** экспорты, если crop отличается.
- Видео квеста/мира: `hero.mp4` в папке квеста/мира; в таблице только embed VK/YouTube.
- **School agenda** (страница `/sites/school-XX/agenda/`): видео и галерея **только** через Sync — см. раздел ниже и `03_School_agenda_media.pdf`.
- Форматы: JPG/PNG/MP4 в **Sync/** → на сайте WebP / H.264 MP4.

## School agenda: видео и галерея

Отдельно от фото площадки в сайдбаре (`photo-01` … `photo-04`).

| Папка | Назначение |
|-------|------------|
| `venues/_default/` | Универсальный альбом и видео по умолчанию для всех школ |
| `venues/school-17/` (и др. `school-*`) | Свои кадры и видео конкретной площадки |

Файлы в папке площадки:

- `landing-30s.mp4` — опционально
- `landing-poster.source.jpg` — постер до Play
- `activity-gallery/gallery-01.source.jpg` … `gallery-12.source.jpg`
- `activity-gallery/gallery-01.caption.txt` — опциональная подпись в lightbox

**Как показывается на сайте:**

- Альбом площадки пуст → только фото из `_default/activity-gallery/`
- Альбом площадки есть → сначала её фото, потом `_default`
- Оба альбома пусты → блок галереи скрыт
- Видео: сначала mp4 площадки, иначе `_default/landing-30s.mp4`, иначе блок скрыт
- Постер: площадка → `_default` → первое фото галереи

Подробнее: `03_School_agenda_media.pdf` и [school-agenda-landing-media.md](../school-agenda-landing-media.md) в репозитории.

## Слоты (кратко)

См. `presets/vse_sloty.csv` и [image-templates-index.md](../image-templates-index.md) в репозитории.

## Контакты

Вопросы по slug и `shift_group_id` — к редактору контента (Google Sheet).
