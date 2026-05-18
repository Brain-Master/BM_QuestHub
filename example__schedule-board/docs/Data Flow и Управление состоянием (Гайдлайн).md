# **Техническая спецификация и аудит Data Flow: Управление состоянием, реконсиляция и жизненные циклы (Strict Technical Reference)**

**Продукт:** BrainMaster EdTech Platform (Модуль App.jsx)

**Уровень документа:** Senior Frontend / Architect (Strict Tech Details)

**Статус:** Verified against codebase.

Данный документ описывает строгую топологию данных, алгоритмическую сложность конвейера рендеринга и спецификации стейт-машин в компоненте витрины расписания. Лишен академических отступлений, сфокусирован исключительно на механике текущей реализации.

## **1\. Топология Глобального Состояния (Root State Signatures)**

Компонент App (Root) инициализирует 8 независимых хуков useState. Состояние нормализовано и разделено на 4 кластера.

### **1.1. Транзакционный кластер**

const \[bookingState, setBookingState\] \= useState\<Record\<string, 'success'\>\>({});

* **Факт-чек реализации:** Глобальный стейт **не отслеживает** состояние загрузки (pending/loading). Он работает как append-only лог (добавление только успешных транзакций).  
* **Асимптотика:** Поиск успешной транзакции внутри дочернего компонента (globalBookingState\[variant.id\] \=== 'success') выполняется за **O(1)**, предотвращая деградацию производительности при рендере N-количества тарифов. Обновление стейта строго иммутабельно через callback: prev \=\> ({ ...prev, \[variantId\]: 'success' }).

### **1.2. Кластер UI и Макро-сетки**

const \[viewMode, setViewMode\] \= useState\<'detailed' | 'compact'\>('detailed');  
const \[showScrollTop, setShowScrollTop\] \= useState\<boolean\>(false);

* **Особенность showScrollTop:** Обновляется через window.addEventListener('scroll').  
* **Технический долг / Оптимизация:** В текущей реализации обработчик handleScroll не обернут в throttle или requestAnimationFrame. Он срабатывает на каждый тик скролла. Однако, React батчит (batched updates) и игнорирует вызовы setState, если новое значение идентично старому (например, false \-\> false). Реальный re-render триггерится ровно дважды: при пересечении порога 400px вверх и вниз. Утечка памяти предотвращена корректным return () \=\> window.removeEventListener(...) в фазе unmount хука useEffect.

### **1.3. Кластер Интерактивности**

const \[expandedCardId, setExpandedCardId\] \= useState\<string | null\>(null);  
const \[activeBooking, setActiveBooking\] \= useState\<{ variant: VariantObj, cardData: CardObj } | null\>(null);

* **Радио-группа (expandedCardId):** Хранение ID (а не boolean флага внутри карточки) принудительно ограничивает количество открытых карточек до одной. Вычисление isExpanded={expandedCardId \=== item.id} делегируется Root-компоненту.  
* **Snapshot Payload (activeBooking):** В модальное окно передается не id смены для последующего fetch-запроса, а полный слепок (Snapshot) данных в момент клика. Форма рендерится синхронно без дополнительных запросов.

### **1.4. Кластер Фильтрации (Controlled State)**

const \[showCompleted, setShowCompleted\] \= useState\<boolean\>(false);  
const \[selectedSchool, setSelectedSchool\] \= useState\<string\>('Все площадки');  
const \[selectedProgram, setSelectedProgram\] \= useState\<string\>('Все программы');  
const \[selectedStatus, setSelectedStatus\] \= useState\<string\>('Все статусы');

* Мутация любого из этих состояний инвалидирует константу filteredSchedule и запускает Data Pipeline.

## **2\. Конвейер вычислений (Data Pipeline & Reconciliation)**

Пайплайн данных запускается синхронно в теле компонента App при каждом ре-рендере.

### **2.1. Извлечение уникальных ключей (Extract)**

const schools \= \['Все площадки', ...new Set(realSchedule.map(item \=\> item.school))\].sort();

* **Механика:** Использование new Set() для дедупликации массивов.  
* **Сложность:** O(N) для .map(), O(N) для добавления в Set, O(K log K) для сортировки (где K \- количество уникальных школ). Выполняется крайне быстро, но выполняется на каждый ре-рендер. При увеличении массива mockSchedule \> 1000 элементов, эти строки первые кандидаты на инкапсуляцию в useMemo.

### **2.2. Фильтрация и Сортировка (Transform)**

const filteredSchedule \= mockSchedule.filter(...).sort(...);

* **Мутационная безопасность (Fact-Check):** Метод Array.prototype.sort() мутирует массив "на месте" (in-place). Вызов mockSchedule.sort() привел бы к фатальным багам и нарушению порядка исходных данных. Однако, в нашей реализации .sort() вызывается в цепочке **сразу после** .filter(). Метод filter() возвращает **новую ссылку на массив** (Shallow copy). Таким образом, мутации подвергается только что созданный промежуточный массив, что абсолютно безопасно (Immutability preserved).  
* **Многоуровневая сортировка:** 1\. Вычисляются Timestamp через кастомный парсер parseStartDate() (приводит "15 ИЮНЯ" к getTime()).  
  2\. Разница dateA \- dateB (хронология).  
  3\. Вторичная сортировка localeCompare при совпадении дат.  
* **Сложность Pipeline:** O(N) на фильтрацию \+ O(M log M) на сортировку (где M — количество элементов, прошедших фильтр).

## **3\. Жизненный цикл Модального окна (BookingModal)**

Модальное окно бронирования имеет специфическую техническую реализацию:

### **3.1. Монтирование и CSS-изоляция**

* **Отсутствие React Portals:** Компонент \<BookingModal\> рендерится в нормальном дереве DOM внутри App, а не через ReactDOM.createPortal.  
* **CSS Override:** Перекрытие всего интерфейса достигается исключительно средствами CSS: fixed inset-0 z-50.  
* **Unmounting:** При activeBooking \=== null компонент физически выгружается из DOM. Это **ключевое архитектурное решение**: оно автоматически очищает локальные стейты формы (isSubmitting, isSuccess) и сбрасывает значения \<input\>. Нам не нужно вручную писать логику очистки формы после закрытия модалки — Garbage Collector и React Unmount делают это за нас.

### **3.2. Локальная Стейт-машина (Form Submission)**

Внутри BookingModal работают два локальных флага:

* isSubmitting: Блокирует кнопку submit (атрибут disabled={isSubmitting}), предотвращая race conditions при многократном клике.  
* isSuccess: Переключает UI на экран "Success State".  
* **Fake Async:** Используются вложенные setTimeout. Окно висит в состоянии успеха 2000ms, затем вызывает проп onSuccess(variant.id), передавая управление обратно в App.

## **4\. Маршрутизация Событий (Event Bubbling)**

Компонент CourseCard не содержит бизнес-логики. Весь интерактив делегирован наверх.

* **Поднятие событий (Event Drilling):**  
  onClick={() \=\> onAction(variant, data, actionType, data.mosRuLink)}

  Коллбек передает 4 аргумента. Наличие mosRuLink перекрывает дефолтное поведение.  
* **Ветвление в контроллере (App.handleActionClick):**  
  * actionType \=== 'external' \-\> прерывание потока данных React. Выполняется браузерный API: window.open(link, '\_blank'). Стейт не мутируется.  
  * actionType \=== 'internal' \-\> setActiveBooking(...). Запускается цикл рендеринга модалки.

## **5\. Выводы аудита (Производительность и узкие места)**

1. **DOM Size / Memory:** Зона перекрытия ("Swap Zone") использует opacity-0 invisible вместо условного рендеринга. Это оставляет DOM-узлы скрытых тарифов в памяти. Для списков до 200-300 элементов это не влияет на память, но обеспечивает нулевой CLS (Layout Shift). Для списков \> 1000 элементов потребуется внедрение Virtualization (например, react-window), так как скрытые узлы начнут давить на RAM браузера.  
2. **Re-renders:** Изменение стейта activeBooking (открытие модалки) заставляет функцию App пересчитывать filteredSchedule (математика и сортировка выполняются заново) и ре-рендерить все \<CourseCard\>, даже если их пропсы не изменились. **Техническая рекомендация на масштабирование:** обернуть filteredSchedule в useMemo, а CourseCard в React.memo (в связке с useCallback для пропсов onAction / onToggleExpand).