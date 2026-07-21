# Инвентарь UI-компонентов

## 1. Правило зрелости

Компонент не становится shared library после первого использования. Сначала он является локальным component или `repository_admin_template`. Extraction допускается после второго реального consumer.

## 2. Foundations

- semantic color tokens;
- typography tokens;
- spacing/radius;
- focus ring;
- elevation;
- motion durations;
- breakpoints;
- z-index layers.

## 3. Primitive controls

| Component | Contract |
|---|---|
| Button | primary/secondary/tertiary/destructive, loading, reason for disabled |
| IconButton | accessible name mandatory |
| TextInput | label/help/error/prefix/suffix |
| Textarea | character count optional, resize policy |
| Checkbox | form boolean |
| Switch | immediate state only |
| Select | bounded known options |
| Combobox | searchable relation picker |
| DateInput | manual + picker |
| TimeInput | 24-hour validation |
| MoneyInput | numeric + ₽ display |
| NumberInput | bounds and step |
| FileInput | button alternative to drag |
| Link | internal/external distinction |

## 4. Feedback

- StatusChip;
- InlineError;
- ErrorSummary;
- SaveStateIndicator;
- AlertBanner;
- Toast;
- Skeleton;
- EmptyState;
- PermissionState;
- OfflineBanner;
- ConflictBanner;
- ProgressTimeline.

## 5. Navigation

- AppShell;
- SidebarNav;
- TopBar;
- Breadcrumbs;
- PageHeader;
- Tabs;
- SectionNav;
- MobileDrawer;
- GlobalSearch;
- EnvironmentBadge.

## 6. Data display

- DataTable;
- MobileEntityCard;
- SortHeader;
- FilterBar;
- FilterChip;
- Pagination;
- SelectionBar;
- KeyValueList;
- RelationLink;
- DiffView;
- AuditEntry;
- TechnicalDetailsDrawer.

## 7. Forms

- FormSection;
- StickyFormActions;
- SlugField;
- RelationPicker;
- RepeatableList;
- SkillsEditor;
- HighlightsEditor;
- LimitedRichTextEditor;
- AddressField;
- CoordinateField;
- OverrideFieldset;
- OfferFormatsEditor;
- StatusTransitionControl;
- ArchiveDialog;
- UnsavedChangesDialog;
- ConflictResolutionDialog.

## 8. Domain components

### Content

- WorldIdentity;
- CourseIdentity;
- WorldThemePicker;
- CourseReadinessPanel;
- CourseCardPreview.

### Venue

- VenueIdentity;
- CampusAddressCard;
- TransitLabel;
- AddressMapPreview;
- InheritanceSource.

### Schedule

- ShiftIdentity;
- ShiftStatusChip;
- CapacityIndicator;
- OfferFormatRow;
- DateRangeLabel;
- RegistrationChannelBadge;
- ScheduleIssueList;
- BulkEditPreview.

### Media

- MediaSlot;
- AssetCard;
- UploadTray;
- ProcessingStatus;
- CropEditor;
- FocalPointEditor;
- UsageList.

### Publication

- ReleaseScopeSummary;
- ValidationIssueList;
- AffectedPagesList;
- PublicationTimeline;
- ReleaseBadge;
- VerificationResult;
- RollbackDialog.

## 9. Component contract template

Каждый material component документирует:

```text
Purpose
User goal
Props/data contract
States
Keyboard
ARIA pattern
Responsive behavior
Error behavior
Examples
Tests
Non-goals
```

## 10. Story/state matrix

Для UI catalog или visual tests минимум:

- default;
- loading;
- empty;
- error;
- disabled with reason;
- long Russian text;
- narrow width;
- high density;
- permission denied where relevant.

## 11. Запрещённые abstractions

- generic `EntityForm` with arbitrary schema before 3 real forms;
- generic `DataGridEngine` built before schedule needs prove it;
- universal `Status` without domain mapping;
- generic `useApi` hiding auth/error/revision semantics;
- `utils.ts` containing unrelated UI/domain functions;
- CSS classes containing world-specific themes in admin foundation.
