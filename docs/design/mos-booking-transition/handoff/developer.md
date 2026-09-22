# Разработчику

OfferBookingAction сохраняет href и перехватывает только обычный primary/Enter.
MosBookingCountdown хранит cancellation ref для синхронной отмены, effect cleanup
и guard устаревшего callback. Automatic assign не ждёт уведомления и не вызывает
window.open. Родитель уничтожает состояние по ключу цели, форма — по сессии.
Не добавлять timer-поля или контакты в booking.mos_click; backend не меняется.
Проверки выполняются на локальном static export с перехватом всех внешних POST.
Выпуск только после отдельного разрешения, receiver раньше frontend, как в первой версии.
Версия2.1: COUNTDOWN_MS=15000, performance.now для общего deadline текста/RAF.
RAF меняет только transform DOM-узла; stop/cleanup отменяют оба scheduler.
matchMedia change управляет только движением и не сбрасывает15секунд. Точка
входа в анкету теперь только popup; focus restoration остаётся на ссылке карточки.
