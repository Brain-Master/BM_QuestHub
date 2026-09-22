# Переход на mos.ru с добровольной анкетой

Версия2.1 локального сценария: компактная карточка и плавный15-секундный таймер.
Предыдущий пакет mos-direct-booking остаётся историей решения, а не текущим UX.
Мастера: apps/web/components/offer-booking-action.tsx,
apps/web/components/mos-booking-countdown.tsx, apps/web/content/mos-booking-copy.ts.
Экспорты: локальные браузерные PNG в /tmp/questhub-mos-compact-qa.
Сценарий: единственная кнопка карточки → выбор с15-секундным таймером → немедленный переход либо
добровольная анкета без ограничения времени. Никакой публикации в production.

См. [решения](decision-log.md), [правила](brandbook.md), [проверки](qa/validation-report.md).
