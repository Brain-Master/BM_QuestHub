# UX acceptance scenarios

Формат: Given / When / Then.

## A. Ориентация

### UX-A01
Given Course editor открыт. Then видны title, World, status, breadcrumb и save state.

### UX-A02
Given production admin. Then environment обозначен текстом и визуально на каждом экране.

## B. Сохранение

### UX-B01
Given поле изменено. Then unsaved state виден до server confirmation.

### UX-B02
Given save failed. Then input сохранён, status = failed, доступен retry.

### UX-B03
Given Ctrl/Cmd+S. Then save draft, но не publish.

### UX-B04
Given clean form. When leave. Then confirmation не показывается.

### UX-B05
Given dirty form. When leave. Then доступны save, discard, stay.

## C. Валидация

### UX-C01
Given end time раньше start. When save. Then inline error + summary; publish blocked.

### UX-C02
Given relation указывает на archived entity. Then status объяснён, entity не выбирается по умолчанию.

### UX-C03
Given blockers нет, warnings есть. Then publish доступен после review warnings.

## D. Конфликты

### UX-D01
Given server revision изменилась. When stale save. Then local data не теряется, показан field diff.

### UX-D02
Given конфликт в одном поле. Then non-conflicting changes можно объединить.

## E. Расписание

### UX-E01
Given фильтры school/date. Then они в URL и сохраняются при back.

### UX-E02
Given выбрано 12 смен. When bulk edit. Then dialog говорит `12 смен` и меняет только checked fields.

### UX-E03
Given copy shift. Then enrolled/external code не копируются default.

### UX-E04
Given capacity < enrolled. Then виден blocker/warning с числами.

## F. Медиа

### UX-F01
Given oversized file. Then upload не начинается; указаны лимит и файл.

### UX-F02
Given processing failed. Then entity form сохраняется, asset = failed, retry/replace доступны.

### UX-F03
Given asset используется. When archive. Then usages и replacement flow показаны.

## G. Публикация

### UX-G01
Given draft saved. Then public site не изменяется.

### UX-G02
Given release preparation. Then scope и affected pages видны.

### UX-G03
Given job running. Then current phase видна, false success отсутствует.

### UX-G04
Given activation success, verification fail. Then состояние не называется successful.

### UX-G05
Given release verified. Then release ID, public links и rollback доступны.

### UX-G06
Given rollback. Then current/target release показаны before confirm.

## H. Права

### UX-H01
Given viewer. Then write actions отсутствуют, server mutation denied.

### UX-H02
Given coordinator scope Venue A. When request Venue B. Then 403/404 policy without leak.

### UX-H03
Given editor no publish. Then readiness видна, publish action отсутствует.

## I. Доступность

### UX-I01
Given keyboard only. Then user can find shift, edit price, save, open preview.

### UX-I02
Given screen reader. When save state changes. Then announced without spam.

### UX-I03
Given 200% zoom. Then sticky bar не закрывает errors.

## J. Ошибки системы

### UX-J01
Given API unavailable. Then retry и last safe data.

### UX-J02
Given session expired during edit. Then local buffer + login + revision check.

### UX-J03
Given unknown publication failure. Then phase, correlation ID, escalation; no stack trace.

## K. Импорт

### UX-K01
Given import source. Then no write before dry-run and confirm.

### UX-K02
Given unknown course slug. Then report links to mapping resolution.

### UX-K03
Given partial conflicts. Then rows are not silently skipped.

## L. Архивирование

### UX-L01
Given published course with active shifts. When archive. Then dependencies/policy enforced.

### UX-L02
Given archived entity. Then hidden by default, available via filter, history intact.

## M. Performance perception

### UX-M01
Given fetch >300ms. Then skeleton without layout jump.

### UX-M02
Given publication >2s. Then phase and safe-leave behavior visible.

### UX-M03
Given large schedule. Then filtering responsive and focus stable.
