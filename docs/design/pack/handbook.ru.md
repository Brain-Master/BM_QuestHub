# Инструкция дизайнеру BM Quest Hub

Версия Design Pack: **1.0.0**

## Что в ZIP

| Файл / папка | Назначение |
|--------------|------------|
| `01_Инструкция_дизайнеру.pdf` | Этот документ |
| `02_Структура_inbox.pdf` | Дерево папок и имена `.source.*` |
| `presets/vse_sloty.csv` | Все слоты → inbox → WebP на сайте |
| `templates-psd/` | PSD с разметкой safe area (слой `SAFE_AREA_GUIDE`) |
| `templates-svg/` | Те же зоны в SVG |
| `previews/` | PNG-превью шаблонов |
| `inbox-README.txt` | Текст для корня папки на Drive |

## Workflow

1. Откройте PSD из `templates-psd/` для нужного слота.
2. Сверьтесь с `previews/` и CSV (`presets/vse_sloty.csv`).
3. Соберите кадр: главный объект в **cyan safe area**; не кладите важное в красные/затемнённые зоны.
4. Экспортируйте **отдельный файл на слот**:
   - `hero-16x9.source.jpg` — баннер 16:9
   - `catalog-4x3.source.jpg` — каталог 4:3
   - `compact-4x3.source.jpg` — карточка расписания (три горизонтальные зоны)
   - `logo-256.source.png` — логотип площадки
5. Загрузите исходники в **BM_QuestHub_Media** на Google Drive (структура как в `02_Структура_inbox.pdf`). Инструкции и PSD-шаблоны лежат в подпапке **`FOR_DESIGNER`** (обновляются командой через `make design-pack`).
6. Редактор запускает `make publish-sheet-cold` / `make publish-sheet-hot` — сайт получит WebP на CDN.

## Правила

- **Не** вносите URL картинок в Google Sheets.
- Расписание: **два** файла на смену — hero и compact.
- Квест: hero 16:9 и catalog 4:3 — **разные** экспорты, если crop отличается.
- Видео: `hero.mp4` в папке квеста/мира; в таблице только embed VK/YouTube.
- Форматы: JPG/PNG в inbox → на сайте WebP.

## Слоты (кратко)

См. `presets/vse_sloty.csv` и [image-templates-index.md](../image-templates-index.md) в репозитории.

## Контакты

Вопросы по slug и `shift_group_id` — к редактору контента (Google Sheet).
