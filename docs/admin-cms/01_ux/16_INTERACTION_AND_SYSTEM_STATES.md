# Состояния интерфейса и обратная связь

## 1. Загрузка

- до 300 мс: spinner не показывать;
- 300 мс–2 с: skeleton без layout jump;
- более 2 с: текст текущей операции;
- выше ожидаемого порога: phase, safe-leave behavior, correlation ID, retry/cancel.

Бесконечный spinner запрещён.

## 2. Empty states

### First use

Объясняет назначение и primary action.

> Курсов пока нет. Создайте первый курс или импортируйте существующие данные.

### Filtered empty

> По выбранным фильтрам ничего не найдено. Сбросить 3 фильтра.

### Permission empty

> У вас нет доступа к площадкам этого раздела.

### Data problem

> Данные не удалось загрузить.

## 3. Ошибки

- field error рядом с полем;
- form error summary + links;
- page fetch error внутри content area с retry;
- mutation error сохраняет input;
- system outage — persistent banner;
- publication failure — timeline и recovery.

## 4. Toast policy

Toast допустим для вторичного подтверждения, background completion и clipboard. Он не является единственным carrier для form error, save state, publication, conflict и access denial.

## 5. Banner policy

- info — контекст;
- warning — действие возможно с риском;
- error — действие заблокировано/degraded;
- success — завершение многофазной операции.

## 6. Disabled actions

Кнопка имеет видимую и доступную причину.

> Опубликовать нельзя: исправьте 2 ошибки.

## 7. Confirmation dialogs

Используются для publish, rollback, archive, revoke access, destructive batch и published slug change.

Не используются для save draft, preview, add list item и safe navigation.

Dialog содержит точное действие, объект, последствия, обратимость, primary verb и cancel.

## 8. Progress

Publication использует phase progress, а не фиктивный процент.

## 9. Offline

- top banner;
- local recovery buffer;
- server actions disabled;
- no false saved state;
- retry;
- conflict check after reconnect.

## 10. Stale data

- timestamp;
- refresh;
- high-risk mutation требует revision confirmation;
- silent refresh не перезаписывает форму.

## 11. Conflict

- local copy сохраняется;
- field differences показаны;
- values можно копировать;
- force overwrite требует elevated permission и audit.

## 12. Session expiry

- 401;
- local buffer сохраняется;
- re-auth;
- retry только idempotent safe request;
- publish требует повторного explicit confirmation.

## 13. Upload states

```text
selected
validating
uploading
processing
ready
failed
cancelled
```

Статус каждого файла отдельный.

## 14. Batch states

```text
25 выбрано
21 изменено
3 конфликтуют
1 не разрешено
```

Partial success не сводится к зелёному toast.

## 15. Focus

- dialog получает focus;
- после закрытия focus возвращается;
- error summary focusable;
- add item фокусирует новое поле;
- route navigation фокусирует `h1`;
- live region не спамит.

## 16. Keyboard

- Tab order;
- Enter/Space;
- Escape closes safe dialogs;
- Ctrl/Cmd+S saves;
- `/` focuses search вне input;
- no keyboard traps.

## 17. Motion

120–200 мс micro transitions, reduced motion, no parallax, no motion-only meaning.

## 18. Status colors

| Смысл | Токен |
|---|---|
| neutral/draft | gray |
| info/processing | blue |
| success/published | green |
| warning | amber |
| error/blocked | red |
| archived | slate |

Цвет всегда сопровождается текстом/icon.

## 19. Recovery-first

Каждое failure state предлагает ближайшее безопасное действие: retry, открыть поле, сохранить копию, вернуться, escalation или job details.
