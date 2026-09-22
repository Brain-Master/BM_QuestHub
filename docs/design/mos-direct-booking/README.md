# mos.ru без обязательной анкеты

Локальная эволюция существующего интерфейса; не новая айдентика.
Основной сценарий: прямая ссылка → карточка mos.ru в новой вкладке.
Второй, независимый сценарий: добровольные контакты → согласие → отправка.

Мастер реализации: apps/web/components/offer-booking-action.tsx.
Мастер текста: apps/web/content/mos-booking-copy.ts.
Мастер события: apps/yandex-lead-receiver/mos-booking-click.js.
Правила: [brandbook.md](brandbook.md), решения: [decision-log.md](decision-log.md),
доказательства и граница публикации: [qa/validation-report.md](qa/validation-report.md).

Скриншоты являются экспортами локальной сборки, не изображениями production.
Новый функционал не опубликован; реальная доставка Telegram не проверялась.
