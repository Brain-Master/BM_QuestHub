# Яндекс.Метрика: цели и параметры

Счётчик: `NEXT_PUBLIC_YM_ID` (см. `apps/web/.env.example`).

## Цели (создать в интерфейсе Метрики)

| Идентификатор | Смысл |
|---------------|--------|
| `booking_form_open` | Открыта модалка записи |
| `booking_lead_submit` | Успешно отправлена заявка (форма) |
| `booking_mos_click` | Переход на mos.ru после записи |

## Параметры целей

На всех трёх целях:

- `quest_id` — slug курса
- `venue_id` — slug площадки
- `offer_id` — id оффера
- `school_slug` — scope школы (`school-1517`) или пусто на портале

На `booking_lead_submit` дополнительно:

- `lead_type` — тип заявки
- `registration_channel` — канал регистрации

Отчёты: **Отчёты → Стандартные → Параметры целей** (срез по `school_slug` / `venue_id`).

## Параметры визита

На каждом визите выставляются (JS API `params`):

- `scope` — `portal` | `school_site` | `school_subdomain` | `school_query`
- `school_slug` — slug школы или пусто

Источники: путь `/sites/{route}/`, поддомен `{n}.b-master.pro`, `?school=` на афише.

Трафик по школам без клика «Записаться» — сегменты по URL или по параметру визита `school_slug`.
