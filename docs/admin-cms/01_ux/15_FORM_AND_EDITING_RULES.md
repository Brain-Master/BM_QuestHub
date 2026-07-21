# Правила форм и редактирования

## 1. Модель сохранения

- изменения происходят локально;
- server autosave разрешён только с revision/ETag и безопасным retry;
- `Сохранить черновик` всегда доступно;
- `Ctrl/Cmd+S` сохраняет;
- publish никогда не запускается autosave.

На раннем этапе explicit save с local recovery buffer предпочтительнее ненадёжного autosave.

## 2. Dirty state

Dirty определяется по нормализованным данным.

При уходе из dirty form доступны:

- сохранить;
- уйти без сохранения;
- остаться.

`beforeunload` — последний слой, а не основная навигация.

## 3. Поля

- visible label обязателен;
- placeholder не заменяет label;
- help text объясняет смысл;
- required виден заранее;
- error связан через ARIA и сохраняется до исправления.

## 4. Валидация

### Client

Синтаксис, format, min/max, required, local cross-field.

### Server

Повторяет проверки, проверяет permission, relations, uniqueness, revision и invariants.

### Publish

Проверяет release-wide constraints, artifacts, media и compatibility.

Client validation не authority.

## 5. Text input

- trim policy фиксируется;
- paste не ломает format;
- multiline сохраняет абзацы;
- запрещённые символы объясняются;
- length counter только там, где важен.

## 6. Slug

- генерируется до первого ручного изменения;
- после manual edit не перезаписывается;
- preview URL виден;
- uniqueness server-side;
- published slug меняется через dialog с alias/redirect и affected links.

## 7. Rich text

Разрешены paragraph, heading 2/3, lists, emphasis, link и одобренный callout.

Запрещены arbitrary HTML, inline styles, scripts, произвольные fonts и hidden formatting. Paste очищается.

## 8. Повторяемые списки

Highlights, skills, gallery поддерживают add, delete, reorder, keyboard alternative, min/max count и stable item IDs.

## 9. Relation picker

Показывает display name, type, status и контекст. Архивные объекты не выбираются по умолчанию.

## 10. Даты

- `ru-RU`;
- timezone semantics фиксированы;
- range показывает duration;
- keyboard input;
- date хранится без случайного UTC shift;
- `startDate > endDate` блокирует save.

## 11. Время

- 24-hour;
- start < end;
- timezone видна;
- overnight либо запрещён, либо моделируется явно.

## 12. Цена

- numeric input;
- display suffix `₽`;
- server unit фиксирован контрактом;
- отрицательная цена запрещена;
- ноль задаётся explicit option `Бесплатно`, а не означает «не публиковать».

## 13. Capacity и enrolled

- capacity editable с permission;
- enrolled может быть integration-owned read-only;
- available вычисляется;
- overcapacity — alert;
- manual enrolled override требует elevated permission и reason.

## 14. Boolean

Checkbox/switch, не текст `true/false` или `да/нет`. В draft form предпочтителен checkbox.

## 15. Status

- только допустимые transitions;
- недоступный transition объясняется;
- cancel/archive требуют reason;
- publish status не обычный select.

## 16. Overrides

```text
[ ] Использовать отдельный адрес для этой смены
    Базовый адрес: ...
```

После включения поле заполняется базовым значением. Reset возвращает inheritance.

## 17. Inline edit

Разрешён для одного простого low-risk поля при ясном save state и keyboard flow. Сложные relations — object page.

## 18. Copy/Duplicate

| Поле | По умолчанию |
|---|---|
| Course | копировать |
| VenueCampus | копировать |
| Dates | очистить/сдвинуть |
| Offer formats | копировать |
| Enrolled | не копировать |
| External codes | не копировать |
| Teacher | копировать с подтверждением |
| Overrides | копировать с предупреждением |
| Media relations | копировать relation |

## 19. Delete/Archive

Archive — primary destructive flow. Physical delete только admin и только для never-published orphan. Dialog называет объект и dependencies.

## 20. Success

После save status bar обновляется, revision доступна в technical details, focus остаётся, форма не закрывается автоматически.

## 21. Performance

- long forms lazy-render тяжёлый preview;
- typing не вызывает global rerender;
- validation debounce bounded;
- upload не блокирует поля;
- recovery buffer не хранит секреты.

## 22. Acceptance checklist

- labels visible;
- required заранее;
- inline errors;
- error summary links;
- keyboard save;
- dirty guard;
- failure preserves input;
- conflict handled;
- permission handled;
- mobile usable;
- status announced;
- no raw technical fields in basic mode.
