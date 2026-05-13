# Хабы материалов по квестам (`docs/camps/`)

Каждая подпапка квеста — единая точка входа: в ней `README.md` с оглавлением, а также `media.md`, `copy-advertising.md`, `operations-manual.md`, `card-draft.md`, `gaps-and-risks.md`. Цены и даты для публикации — только из операционного источника правды.

## Повторяемый чеклист по лагерю (фазы 1A–1H)

Использовать для каждого slug после появления новых источников (Inbox, Google Drive, согласований).

| Шаг | Действие |
|-----|----------|
| **A** | Прочитать `README.md`, `gaps-and-risks.md`, `operations-manual.md`, `card-draft.md`, `media.md`, `copy-advertising.md` (+ `inbox-sources.md`, если есть). |
| **B** | Краткий **аудит-вывод** в конце `gaps-and-risks.md` (блок «Сильные стороны пакета» / риски): сильные стороны, пробелы, дубли имён или обещаний с другим квестом. |
| **C** | **Медиа:** заполнить или расширить `media.md` (Drive, фото/видео, VK); пометить права и неактуальные даты. |
| **D** | **Операционка / Drive:** при появлении стабильных ссылок — `google-drive-index.md` в корне slug (по образцу [Мехвариум: кинетика](mekhvarium-laboratoriya-kineticheskih-monstrov/google-drive-index.md) или [Minecraft: Тайна](minecraft-taina-drevnih-inzhenerov/google-drive-index.md)); ссылки из `README` и `operations-manual`. |
| **E** | **Экспорт:** если появляются файлы из Inbox/Drive — создать [exported-md/README.md](minecraft-probuzhdenie-strazhey/exported-md/README.md) с таблицей «файл ↔ оригинал Inbox ↔ смысл» и правилом синхронизации. |
| **F** | **Сценарии:** если программа многодневная и в исходнике есть дни — привести к `scenario-day-01.md` … `scenario-day-NN.md` (в корне slug или внутри `exported-md/` — как уже сделано у эталонных пакетов) с единой шапкой (`#` + блок `> Оригинал / Канон` + `**Документ:**` + структура актов/сцен). **Не выдумывать** текст без исходника. |
| **G** | **Тайминги:** при достаточной детализации в сценариях — [`timing-summary.md`](mekhvarium-laboratoriya-kineticheskih-monstrov/timing-summary.md); отдельные `timing-day-NN.md` — только если есть отдельные листы. |
| **H** | Обновить таблицу ниже в этом файле и при существенных изменениях — [`docs/Продукты-и-каталог-квестов.md`](../Продукты-и-каталог-квестов.md). |

| Квест | Slug | Медиа, индексы, экспорт | Карточка (`card-draft`) |
|-------|------|--------------------------|-------------------------|
| КиберРитм | `cyber-rhythm` | [media.md](cyber-rhythm/media.md), [google-drive-index](cyber-rhythm/google-drive-index.md), [exported-md](cyber-rhythm/exported-md/README.md), [timing-summary](cyber-rhythm/timing-summary.md), [raw](cyber-rhythm/raw/README.md) ([аудит](cyber-rhythm/gaps-and-risks.md)) | [card-draft](cyber-rhythm/card-draft.md) — цены/даты из CRM |
| Minecraft: Тайна древних инженеров | `minecraft-taina-drevnih-inzhenerov` | [media.md](minecraft-taina-drevnih-inzhenerov/media.md), [google-drive-index](minecraft-taina-drevnih-inzhenerov/google-drive-index.md); `exported-md` / `timing-summary` — после экспорта из GDoc | Частично + `[TODO]` |
| Minecraft: Пробуждение стражей | `minecraft-probuzhdenie-strazhey` | GDoc в [media.md](minecraft-probuzhdenie-strazhey/media.md); [exported-md](minecraft-probuzhdenie-strazhey/exported-md/README.md) (Inbox + `scenario-day-01`…`05`); видео/фото Hero — `[TODO]` | Контент из Inbox в [card-draft](minecraft-probuzhdenie-strazhey/card-draft.md); операционка — оглавление `[TODO]` |
| Мехвариум: Лаборатория кинетических монстров | `mekhvarium-laboratoriya-kineticheskih-monstrov` | [Drive](https://drive.google.com/drive/folders/1ns0Wd0G9OxFGV-X50um4u78mH1RBhsLX?usp=sharing), [media.md](mekhvarium-laboratoriya-kineticheskih-monstrov/media.md), [google-drive-index](mekhvarium-laboratoriya-kineticheskih-monstrov/google-drive-index.md), [timing-summary](mekhvarium-laboratoriya-kineticheskih-monstrov/timing-summary.md), [exported-md](mekhvarium-laboratoriya-kineticheskih-monstrov/exported-md/README.md) | [card-draft](mekhvarium-laboratoriya-kineticheskih-monstrov/card-draft.md) + Drive + экспорт Inbox |
| Мехвариум: Мастерская гидравлических монстров | `mekhvarium-masterskaya-gidravlicheskih-monstrov` | `[TODO]` в [media.md](mekhvarium-masterskaya-gidravlicheskih-monstrov/media.md); `google-drive-index` / `exported-md` — после появления ссылок и файлов ([gaps](mekhvarium-masterskaya-gidravlicheskih-monstrov/gaps-and-risks.md)) | Скелет + `[TODO]` |

**Мехвариум:** две программы независимы — см. перекрёстные ссылки в README каждой папки.

**Последнее обновление таблицы:** 2026-05-12 (КиберРитм: медиа + Drive + raw).
