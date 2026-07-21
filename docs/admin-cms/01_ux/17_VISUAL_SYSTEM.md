# Визуальная система административного интерфейса

## 1. Характер

Админка спокойная, функциональная, плотная, нейтральная относительно тем курсов и устойчивая при большом количестве данных.

Маркетинговая эстетика миров появляется в preview и малых identity accents, но не перекрашивает рабочую систему.

## 2. Базовая тема

- светлая нейтральная default;
- optional dark после стабилизации;
- высокий контраст;
- белые/серые surfaces;
- один брендовый accent;
- production обозначен label, а не красным фоном всей страницы.

## 3. Layout tokens

```text
page max width:
  data screens: fluid
  form screens: 1440px
  text column: 720–840px

sidebar:
  expanded 240px
  collapsed 64px

header: 56–64px
spacing: 4, 8, 12, 16, 24, 32, 48
radius: controls 8, cards 12, panels 16
```

## 4. Typography

- один UI sans-serif;
- tabular numerals для цен/дат/capacity;
- body ≥14px desktop;
- labels 13–14px medium;
- title 28–32px;
- line-height ≥1.4;
- длинный текст в колонке 720–840px.

## 5. Плотность

Comfortable и compact. Compact не уменьшает target ниже 36–40px desktop и 44px touch.

## 6. Иерархия действий

- Primary: одна на область.
- Secondary: neutral/outline.
- Tertiary: text/ghost.
- Destructive: red, не default primary.

На форме primary — `Сохранить черновик`; publish отделён.

## 7. Cards

Для dashboard, summary, media, mobile rows и warning blocks. Не превращать каждую form row в card.

## 8. Tables

Sticky header, left text, right numbers, status chips, hover, selected state, actions menu, sortable headers, filter state, mobile card alternative.

## 9. Forms

Vertical default; короткие связанные поля могут быть двумя колонками. Label above, help/error below, section headings и sticky action bar.

## 10. Status chips

Text + optional icon + semantic color. Не использовать только цветную точку.

## 11. Icons

Одна library; uncommon actions сопровождаются текстом; consistent sizes; минимум декоративных icons.

## 12. World representation

В lists: small swatch, name, icon. Full gradient только в preview.

## 13. Maps

Map — supporting control, не единственное представление адреса. Text address и keyboard alternative обязательны.

## 14. Charts

Только operational questions, без vanity metrics.

## 15. Responsive

- Desktop ≥1200: sidebar, full table, side panels.
- Tablet 768–1199: collapsible sidebar, reduced columns, drawers.
- Mobile <768: cards, one-column forms, sticky save, readable publication summary.

## 16. Visual validation

Screenshots:

- desktop 1440;
- tablet 1024;
- mobile 390;
- error;
- empty;
- loading;
- длинный русский текст;
- максимальная плотность.

## 17. Semantic tokens

```text
--surface-default
--surface-muted
--border-default
--text-primary
--text-secondary
--action-primary
--status-success
--status-warning
--status-danger
```

Product-specific tokens вроде `--minecraft-green` не входят в базовую admin UI.
