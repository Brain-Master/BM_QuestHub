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

## Workflow

1. Откройте PSD из `templates-psd/` для нужного слота.
2. Сверьтесь с `previews/` и CSV (`presets/vse_sloty.csv`).
3. Соберите кадр: главный объект в **cyan safe area**; не кладите важное в красные/затемнённые зоны.
4. Экспортируйте **отдельный файл на слот**:
   - `hero-16x9.source.jpg` — баннер 16:9
   - `catalog-4x3.source.jpg` — каталог 4:3
   - `compact-4x3.source.jpg` — карточка расписания (три горизонтальные зоны)
   - `logo-256.source.png` — логотип площадки
5. Откройте на Drive папку **`Sync`** внутри [BM_QuestHub_Media](https://drive.google.com/drive/folders/1mnzEh2-aqkzFaxg2oOtxX1E5KGrj0_1F) (дерево как в `02_Структура_inbox.pdf`). Серые файлы — заглушки: замените файл **с тем же именем** своим экспортом. PSD и PDF — в соседней папке **`FOR_DESIGNER`**.
6. Сообщите редактору: **`make media-push`** (скачать Sync → обновить сайт). Команда для команды перед правками: **`make media-pull`** (выложить актуальное дерево в Sync).

## Правила

- **Не** вносите URL картинок в Google Sheets.
- Расписание: **два** файла на смену — hero и compact.
- Квест: hero 16:9 и catalog 4:3 — **разные** экспорты, если crop отличается.
- Видео: `hero.mp4` в папке квеста/мира; в таблице только embed VK/YouTube.
- Форматы: JPG/PNG в **Sync/** → на сайте WebP.

## Слоты (кратко)

См. `presets/vse_sloty.csv` и [image-templates-index.md](../image-templates-index.md) в репозитории.

## Контакты

Вопросы по slug и `shift_group_id` — к редактору контента (Google Sheet).
