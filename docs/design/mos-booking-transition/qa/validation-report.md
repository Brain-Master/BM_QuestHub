# Проверки

Детерминированный browser-сценарий: scripts/verify-mos-direct-booking.mjs,
обновлённый под контракт2.1. Проверяются точная граница15с, плавность, reduced-motion, manual escape,
пауза/скрытие/закрытие/opt-in, отсутствие события за открытие, поля/ошибки/согласие,
modified links, keyboard/focus,320/390px и короткая высота. Полный finder regression
и school2103 check сохраняются. Итоги и failure history фиксируются в
docs/admin-cms/execplans/WEB-MOS-COMPACT.md; не утверждаются до запуска.
Локальные PNG/JSON: /tmp/questhub-mos-compact-qa. Проверки доставки синтетические.
Production, реальные уведомления, исследование родителей и полный аудит с
экранным диктором — deferred. Логотип/печатные экспорты — not_applicable.

Исторический локальный результат2.0 от2026-09-21:11 составных browser-проверок PASS,
7axe scans без violations (color-contrast остаётся incomplete, это не полный
аудит доступности). Ноль page errors и неожиданных записей.8synthetic click
requests,4synthetic form requests; реальных заявок/сообщений не было.
Подтверждены граница9999/10000мс, прерывания на9с, stale success/error и
смена live URL с возвратом фокуса. Desktop,390px,320px PNG просмотрены;
короткая высота320x568 проверена на доступность верхних действий.
Finder26, school2103, domain20, receiver38/client2, TypeScript и production
export112routes — PASS. Существующие warnings перечислены в ExecPlan.
Бренд сохранён: изменение касается иерархии действий и спокойного объяснения,
а не новой айдентики. Источники текстов и границы утверждений — в brief.md.

Текущий результат2.1 от2026-09-22:12составных browser checks PASS, включая
14999/15000мс, отсутствие ухода на10с,8замеров progress через32мс внутри
одной секунды, initial/live reduced-motion и отсутствие возобновления после
отмены.7axe scans0violations (contrast incomplete),0page errors/unexpected writes,
8mock click/4mock form. Finder26 и domain20 PASS, client2 PASS,112routes built,
TypeScript/secret-scan1331files/package-validator22 PASS. Compact-card390px и
popup320px просмотрены. Реальная плавность зависит от кадровой частоты устройства;
тест доказывает обновление по кадрам, а не частоту конкретного телефона.
