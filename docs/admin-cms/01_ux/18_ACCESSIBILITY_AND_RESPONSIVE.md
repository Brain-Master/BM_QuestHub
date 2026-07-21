# Доступность и адаптивность

## 1. Стандарт

Цель: WCAG 2.2 AA для login, поиска, редактирования, сохранения, исправления ошибок, preview, publish и rollback.

## 2. Клавиатура

Все функции доступны без мыши:

- логичный tab order;
- visible focus;
- skip link;
- dialog focus trap;
- menu/select patterns;
- table actions;
- reorder alternative;
- date manual input;
- keyboard save;
- no inaccessible drag-only flow.

## 3. Screen reader

Semantic headings, landmarks, labels, descriptions, error association, status live regions, table captions, sort state, expanded state, progress phase и dialog semantics.

## 4. Контраст

- normal text ≥4.5:1;
- large text ≥3:1;
- UI boundaries/focus ≥3:1;
- disabled state legible;
- status not color-only.

## 5. Target size

Touch ≥44×44 CSS px; compact desktop preferably ≥36px.

## 6. Zoom and reflow

At 200%:

- no loss of actions;
- no mandatory horizontal scroll кроме true data tables;
- sticky elements не закрывают content;
- dialogs fit viewport.

At 400% critical forms remain usable in one column.

## 7. Forms

- errors announced once;
- error summary;
- semantic required;
- autocomplete where relevant;
- no time-limited input;
- format examples;
- validation not color-only.

## 8. Tables

Semantic headers, accessible row identity, labeled selection, keyboard actions и card alternative on mobile.

## 9. Drag and drop

Каждой drag operation соответствует button/menu alternative: move up/down, choose file, assign slot.

## 10. Media

Alt text required or decorative explicitly; accessible video controls; no autoplay sound; poster; processing announced.

## 11. Motion

Respect `prefers-reduced-motion`; no flashing, parallax, mandatory animation or focus-moving effects.

## 12. Language

`lang=ru`; technical identifiers marked; dates/numbers tested with screen reader.

## 13. Mobile support

Обязательно: search, object view, simple edit, save draft, blockers, small release publish, rollback, audit summary.

Допустимо отложить: complex column customization, multi-file crop, large batch conflict resolution. Ограничение объясняется явно.

## 14. Tests

Automated: axe and semantic queries without serious/critical violations.

Manual: keyboard, NVDA/VoiceOver smoke, 200% zoom, high contrast, reduced motion, mobile screen reader.

Automated pass не заменяет manual checks.
