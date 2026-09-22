# Проверки и границы доказательств

Локально: receiver38/38; клиент события2/2; schedule-board data rules20/20;
полный web check прошёл
(4 существующих lint warning, предупреждение Next tracing); регрессия
мастера26 сценариев; школа2103 —9 групп,2 корпуса, цена1000, мобильный проход.
Первый новый browser-прогон нашёл контраст текста успеха; исправлен. Повторный
прогон:7 комплексных проверок PASS,4 axe scans без violations (есть incomplete
contrast cases, проверены визуально);0 page errors/неожиданных POST. Проверены
новая вкладка при сбое/зависании уведомления, Enter/middle/Ctrl-click, optional
consent, сохранение полей/retry, отсутствие auto-popup, поздний ответ после
закрытия, focus и доступная кнопка закрытия44px на320/390px. Все91 сочетание
offer/variant с mos-ссылкой из текущего снапшота распознаются сервером.
Audit B нашёл обход cooldown через omitted/main alias: исправлен canonical-key
резервацией и отдельным concurrent тестом. Валидатор пакета22 checks PASS.
Финальные команды, fingerprint, secret scan и независимый вердикт фиксируются
в docs/admin-cms/execplans/WEB-MOS-DIRECT-BOOKING.md.
Старые Windows-only визуальные PNG-baselines не перезаписывались; полный
legacy visual suite не запускался. Новые screenshot evidence — отдельная
локальная приёмка, не заявление о совпадении со старым дизайном анкеты.

Артефакты: /tmp/questhub-mos-direct-qa,
/tmp/questhub-finder-mos-direct-qa,
/tmp/questhub-school2103-mos-direct-qa. Это локальные экспорты с синтетическими
HTTP-ответами. Внешние POST не отправляются; карточка mos.ru тоже mock.

Не доказано: production deployment, реальная доставка Telegram/Sheets,
конверсия родителей, полноценная WCAG-сертификация. Axe и клавиатурный проход
не равны исследованию с пользователями. No-JS проверка касается anchor:
само query-зависимое расписание на холодной загрузке по-прежнему требует JS.
Гарантии доставки каждого клика нет; см. численные лимиты и best-effort контракт.
