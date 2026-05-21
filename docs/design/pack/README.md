# Design Pack (сборка)

Пакет для дизайнеров: PDF, PSD, SVG, CSV, ZIP и опционально **синхронизация на Google Drive**.

## Сборка

```bash
winget install JohnMacFarlane.Pandoc
winget install MiKTeX.MiKTeX

make design-pack
```

Результат локально: `dist/design-pack/BM_QuestHub_Design_Pack_v1.zip`

## Google Drive (автоматически)

На Drive: папка **`BM_QuestHub_Media`**, внутри подпапка **`FOR_DESIGNER`** (имя можно сменить).

1. Скопируйте `scripts/design-pack.env.example` → `scripts/design-pack.env`
2. Укажите `GOOGLE_MEDIA_DRIVE_FOLDER_ID` — ID из URL `https://drive.google.com/drive/folders/…`
3. В [Google Cloud Console](https://console.cloud.google.com/apis/library/drive.googleapis.com) проекта **bm-questhub**: включите **Google Drive API** (Enable)
4. Настройте **один** из способов доступа ниже (OAuth или service account)
5. `make design-pack` — после ZIP содержимое пакета заливается в `FOR_DESIGNER` (обновляет файлы с тем же именем)

Только выгрузка на Drive (пак уже собран):

```bash
make design-pack-publish-drive
```

Другая подпапка вместо `FOR_DESIGNER`:

```env
GOOGLE_DESIGN_PACK_DRIVE_SUBFOLDER=INSTRUCTIONS
```

### OAuth (личный Gmail, «Мой диск») — рекомендуется без Workspace

Service account **не может** создавать файлы в личном «Моём диске» (quota). Для папки на вашем Gmail используйте OAuth:

| Шаг | Действие |
|-----|----------|
| GCP | OAuth consent screen → **Testing** → ваш Gmail в Test users |
| GCP | Credentials → **Desktop app** → сохранить `client_id` / `client_secret` |
| Локально | `cp scripts/design-pack-oauth.env.example scripts/design-pack-oauth.env` — заполнить client |
| Login | `make design-pack-oauth-login` — браузер, scope `drive`, token в `scripts/design-pack-oauth-token.json` |
| Publish | `make design-pack-publish-drive` — в логе: `auth: oauth (user)` |

Принудительный режим в `scripts/design-pack.env`:

```env
GOOGLE_DRIVE_AUTH=oauth
# GOOGLE_DRIVE_AUTH=service_account
```

По умолчанию (пусто): **oauth-first** — если есть refresh token, OAuth; иначе SA из `GOOGLE_SERVICE_ACCOUNT_JSON`.

**Безопасность:** refresh token = пароль; файлы `design-pack-oauth.env` и `*-token.json` в `.gitignore`. Не кладите в CI по умолчанию. Отдельный OAuth client только для CLI контента.

### Service account (Shared drive или Workspace)

1. Выдайте папку **Editor** сервисному аккаунту (`client_email` из `GOOGLE_SERVICE_ACCOUNT_JSON`, тот же что для Sheets)
2. Папка `BM_QuestHub_Media` должна быть на **общем диске**, не в «Моём диске»
3. Либо Workspace: `GOOGLE_DRIVE_IMPERSONATE_EMAIL` + domain-wide delegation

Структура на Drive:

```text
BM_QuestHub_Media/
├── FOR_DESIGNER/          ← PDF, PSD, CSV (make design-pack)
└── Sync/                  ← все .source.* для сайта (make media-drive-push)
    ├── quests/{slug}/
    └── …
```

Дизайнер работает в **`Sync/`**; команда: `make media-drive-push` / дизайнер правит → PR просит `make media-drive-pull`.

## Состав пакета

| Артефакт | Источник |
|----------|----------|
| PDF/DOCX | `handbook.ru.md`, `media-inbox-layout.md` |
| PSD | `scripts/generate-design-pack-psd.mjs` |
| PNG previews | `media/placeholders` + SVG |
| CSV | `design-pack-slots.ts` |
