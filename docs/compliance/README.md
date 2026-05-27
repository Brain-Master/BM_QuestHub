# Compliance BrainMaster Quest Hub

Инженерный чек-лист по 152-ФЗ и смежным требованиям для сайта и приёма заявок.

## Документы в репозитории

| Файл | Назначение |
|------|------------|
| [rkn-notification-checklist.md](./rkn-notification-checklist.md) | Проверка уведомления Роскомнадзора (ст. 22 152-ФЗ) |
| [data-processing-decision.md](./data-processing-decision.md) | Решение по хранению заявок и обработчикам |
| [org/](./org/) | Шаблоны организационных документов (приказ, реестр, регламент) |

## Публикация на сайте

- Политика ПДн: `/legal/personal-data/`
- Согласие на ПДн: `/legal/personal-data-consent/`
- Cookies и аналитика: `/legal/cookies-analytics/`
- Пользовательское соглашение: `/legal/terms/`
- Реквизиты: `/legal/operator-details/`

## Локализация данных

- **Публичная политика:** обработка и хранение ПДн только на территории РФ.
- **Временный тест:** `bm-lead-receiver` может использовать Google Sheets и Telegram до публикации — см. [data-processing-decision.md](./data-processing-decision.md); в продакшен-уведомлении РКН их не указывать.

## Технические меры (код)

- Cookie-баннер и отложенная Яндекс.Метрика: `apps/web/lib/cookie-consent.ts`, `apps/web/components/cookie-consent-banner.tsx`
- Версия политики в заявке: `apps/web/content/legal/policy-meta.ts`

## Вне репозитория (оператор)

- Подача/актуализация уведомления в [ЛК оператора ПДн](https://pd.rkn.gov.ru/)
- Подписание поручений обработчикам (Yandex Cloud, сервер в РФ)
- Миграция lead-receiver: сервер в РФ вместо Sheets; отключить Telegram до публикации сайта
- Юридическая проверка формулировок перед проверкой РКН
