# Информационная архитектура

## 1. Верхнеуровневая навигация

```text
Обзор
Контент
  Миры
  Курсы
Площадки
  Организации
  Корпуса
Расписание
  Смены
  Форматы участия
Медиа
Публикация
  Подготовка
  Релизы
  Задачи публикации
История
  Изменения
  Аудит
Настройки
  Пользователи и роли
  Интеграции
  Справочники
```

Для малой команды меню может быть компактнее, но route model остаётся стабильной.

## 2. Global shell

### Верхняя панель

- глобальный поиск;
- индикатор окружения;
- save state текущего экрана;
- уведомления;
- меню пользователя.

### Боковая панель

- основные разделы;
- badge с blockers;
- collapse;
- active state;
- permission-aware items.

### Окружение

Production и preview/test различаются текстовым label, цветовой полосой и доменом. Environment label нельзя скрыть.

## 3. Маршруты

```text
/admin
/admin/worlds
/admin/worlds/new
/admin/worlds/:worldId
/admin/worlds/:worldId/edit

/admin/courses
/admin/courses/new
/admin/courses/:courseId
/admin/courses/:courseId/edit

/admin/venues
/admin/venues/new
/admin/venues/:venueId
/admin/venues/:venueId/edit
/admin/campuses/:campusId/edit

/admin/schedule
/admin/shifts/new
/admin/shifts/:shiftId
/admin/shifts/:shiftId/edit

/admin/media
/admin/media/:assetId

/admin/publishing
/admin/releases
/admin/releases/:releaseId
/admin/jobs/:jobId

/admin/audit
/admin/settings/users
/admin/settings/roles
/admin/settings/integrations
/admin/settings/dictionaries
```

## 4. Object page

Единый каркас:

```text
Breadcrumb
Title + status + primary action
Summary
Tabs:
  Overview
  Content / Details
  Relations
  Media
  History
  Technical
```

Технический ID не должен быть главным заголовком.

## 5. Cross-entity navigation

- World показывает Courses;
- Course показывает Shifts;
- Venue показывает Campuses и Shifts;
- Shift показывает Course, Campus и OfferFormats;
- MediaAsset показывает usages;
- Release показывает entities и artifacts.

Relation всегда кликабельна при наличии permission.

## 6. Global search

Поиск работает по названию, slug, адресу, метро, внешнему коду, преподавателю, release ID и filename.

Результат содержит тип и контекст:

```text
Minecraft: Пробуждение Стражей
Курс · Мир Minecraft · опубликован

Школа №17, Введенского 27А
Корпус · Беляево · 4 активные смены
```

Поиск не раскрывает объекты без permission.

## 7. Фильтры

- отражаются в URL;
- back/forward работает;
- есть `Сбросить`;
- активные фильтры показаны chips;
- count обновляется;
- пустой результат объясняет фильтры.

### Расписание

Обязательные фильтры:

- даты;
- площадка;
- корпус;
- район/метро;
- курс;
- мир;
- статус;
- преподаватель;
- канал регистрации;
- наличие мест;
- наличие внешней ссылки;
- validation issues.

## 8. Списки

- предсказуемая сортировка;
- статус виден без открытия;
- строка кликабельна, actions отдельны;
- selection checkbox не конфликтует с переходом;
- density переключается;
- mobile использует cards.

## 9. Breadcrumb

```text
Курсы / Minecraft: Пробуждение Стражей / Редактирование
Площадки / Школа №1517 / Живописная 11к1
Расписание / 15–19 июня / Редактирование
Публикация / Релиз 01K... / Проверка
```

## 10. Deep links

URL фиксирует сущность, tab, фильтры, release, job и audit entry. Modal-only навигация не должна быть единственным способом открыть объект.

## 11. Dashboard IA

Dashboard отвечает:

1. Что требует внимания?
2. Что менялось недавно?
3. Что скоро начнётся?
4. Система работает?

Блоки:

- blockers;
- draft changes;
- upcoming shifts;
- capacity alerts;
- recent releases;
- health summary.

## 12. Permission-aware IA

- скрывать недоступные разделы;
- прямой URL проверяется сервером;
- publisher видит Publication Center;
- editor видит readiness, но не publish action;
- viewer не видит write actions;
- coordinator видит свой scope.

## 13. Пользовательские названия

| Внутреннее | UI |
|---|---|
| snapshots | не показывать в основном меню |
| offers | Форматы участия |
| hot content | Расписание |
| cold content | Каталог и площадки |
| sync | Публикация или обновление |
| manifest | Техническая информация релиза |
| shift_group_id | Внешний ключ, только technical |
