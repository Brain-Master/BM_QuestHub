# Разработчику

OfferBookingAction использует action.url, включая variant override. Нативная
навигация не зависит от результата notifyMosBookingClick. Модальная форма
возвращает фокус к вторичной кнопке; поздний успех закрытой сессии игнорируется.
Глобальная аналитика сохраняет существующее ограничение по cookie consent.
Новое уведомление не использует persistent identity или контактные поля.

Receiver: строгий event-dispatch раньше lead-validation, canonical публичные
S3 lookup, отдельный Telegram-only путь. Численные ограничения и порядок
развёртывания находятся в apps/yandex-lead-receiver/README.md.
Запускать только локальные mock-проверки из manifest. Перед публикацией
проверить упаковку обоих JS-файлов и сначала обновить receiver. Реальные
Telegram/Sheet тесты требуют отдельного согласия и проверяемого readback.
