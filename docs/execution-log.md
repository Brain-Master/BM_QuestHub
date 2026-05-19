# Execution Log

This journal records meaningful work in the repository: what changed, why it changed, which files were touched, which decisions were made, and what remains open.

## Storage

- Journal file: `docs/execution-log.md`.
- New entries are added at the top, directly under `## Entries`.
- Keep entries factual and concise. Link to detailed docs instead of duplicating them.

## Entry Format

Use this template for each entry:

```markdown
### YYYY-MM-DD HH:MM TZ - Short Title

**Goal:** One sentence describing the requested outcome.

**Completed:**
- Concrete action or deliverable.

**Changed Files:**
- `path/to/file`: short reason.

**Decisions:**
- Decision and rationale.

**Validation:**
- Check or command result.

**Open Items:**
- Remaining blocker, external dependency, or `None`.
```

## Entries

### 2026-05-19 14:00 UTC+3 - Booking Form Success Feedback

**Goal:** Fix consent label layout in booking modals and show a clear success screen instead of closing immediately after submit.

**Completed:**
- Consent label uses block layout so legal links wrap as continuous text.
- Added `LeadFormSuccess` and `lead_success` dialog view for booking and waitlist flows.
- Differentiated success copy for preliminary waitlist, sold-out waitlist, and regular booking in `resolveRegistrationFlow`.

**Changed Files:**
- `apps/web/components/booking-form.tsx`: block consent label, inline policy links.
- `apps/web/components/lead-form-success.tsx`: post-submit success UI.
- `apps/web/components/offer-booking-action.tsx`: keep modal open on success.
- `apps/web/lib/registration-flow.ts`: success titles and messages per flow.
- `apps/web/e2e/schedule-board-data.spec.ts`: waitlist success copy coverage.

**Validation:**
- `npm run lint` (apps/web)

**Open Items:**
- None.

### 2026-05-19 00:01 UTC+3 - Yandex Lead Receiver

**Goal:** Route static-site lead forms through Yandex Cloud Functions with server-side Telegram, Google Sheets, and n8n integrations.

**Completed:**
- Added a standalone Yandex Cloud Function receiver for lead validation, CORS, Telegram delivery, Google Sheets append, and best-effort n8n forwarding.
- Documented function environment, Google Sheet column order, and deployment flow.
- Added local smoke tests for valid leads, validation failures, primary delivery failures, n8n failure tolerance, and sheet row order.
- Deployed the receiver to Yandex Cloud Function `bm-lead-receiver` and verified a test lead reaches Google Sheets.

**Changed Files:**
- `apps/yandex-lead-receiver/index.js`: serverless lead receiver.
- `apps/yandex-lead-receiver/index.test.js`: smoke tests for receiver behavior.
- `apps/yandex-lead-receiver/package.json`: local test script and Node engine.
- `apps/yandex-lead-receiver/.env.example`: Yandex Function environment template.
- `apps/yandex-lead-receiver/README.md`: receiver usage and sheet column contract.
- `docs/deployment/static-hosting-s3-yandex.md`: deployment and secret-handling guidance.
- `docs/execution-log.md`: this journal entry.

**Decisions:**
- Keep the receiver dependency-free for a small deployable function zip.
- Treat Telegram and Google Sheets as primary delivery; n8n is best-effort and does not block accepted leads.

**Validation:**
- `node --test` in `apps/yandex-lead-receiver`
- `npm --prefix apps/web run lint`
- Yandex Function test POST returned `ok: true`.
- Google Sheets read-back confirmed the test lead row was appended.
- IDE diagnostics reported no linter errors for edited files.

**Open Items:**
- Set `NEXT_PUBLIC_LEAD_SUBMIT_URL` in Timeweb build env, redeploy static site, and run a live browser form submission on prod.

### 2026-05-18 07:02 UTC+3 - Legal Policy And Registration Flows

**Goal:** Publish the personal data policy, link it from booking surfaces, and split booking UX into mos.ru assistance, preliminary registration, and direct BrainMaster flows.

**Completed:**
- Added `/legal/` and `/legal/personal-data/` with a formatted personal data policy, operator contact card, and table of contents.
- Linked the policy from the booking consent text and footer documents area.
- Added registration channel metadata (`mos_ru` / `brainmaster`) and preliminary-registration flags to schedule data and sheet mapping.
- Replaced direct mos.ru CTA navigation with a lead form, support copy, and a thank-you screen with phone support, a mos.ru button, and a 3-second auto-open countdown.
- Updated preliminary registration copy to clearly say it is not a seat booking and explain where final registration will happen.

**Changed Files:**
- `apps/web/app/legal/page.tsx`: legal document hub.
- `apps/web/app/legal/personal-data/page.tsx`: personal data policy route.
- `apps/web/components/legal-document-layout.tsx`: shared legal document UI.
- `apps/web/content/legal/personal-data-policy.ts`: structured policy content adapted for Quest Hub forms.
- `apps/web/components/booking-form.tsx`: policy link and flow notice block.
- `apps/web/components/offer-booking-action.tsx`: mos.ru two-step form/success flow.
- `apps/web/components/mos-booking-success.tsx`: thank-you screen with countdown and support phone.
- `apps/web/components/site-footer.tsx`: document links.
- `apps/web/lib/legal-routes.ts`, `apps/web/lib/site-contact.ts`, `apps/web/lib/registration-flow.ts`: shared routes, contacts, and flow copy.
- `apps/web/lib/schemas.ts`, `apps/web/lib/offers/sheet-contract.ts`, `apps/web/lib/offers/map-rows-to-offers.ts`, `apps/web/lib/offers/schedule-board.ts`: registration channel/preliminary data support.
- `apps/web/e2e/quest-schedule.spec.ts`, `apps/web/e2e/schedule-board-data.spec.ts`: legal and flow coverage.

**Decisions:**
- Keep legal text as structured TypeScript content for maintainable formatting instead of rendering one long text blob.
- Treat current mos.ru registration as `mos_assist`: collect contact details first, then guide the parent to the external portal.
- Keep future direct BrainMaster registration as the `brainmaster` channel without implementing payment or contract signing yet.

**Validation:**
- `npm run lint` (apps/web)
- `npm run build` (apps/web; `/legal` and `/legal/personal-data` are included in static output)
- `npx playwright test e2e/schedule-board-data.spec.ts e2e/quest-schedule.spec.ts --project=chromium`

**Open Items:**
- None.

### 2026-05-17 18:30 UTC+3 - Premium Booking Form Modal

**Goal:** Bring the booking application modal in line with the schedule-board reference: dark summary card, compact field grid, and a prominent gradient CTA while keeping the existing lead submission flow.

**Completed:**
- Restyled the booking dialog shell and title (`Оформление заявки` / waitlist variant).
- Added a summary card (venue, program, dates, format, price) above the form fields.
- Reworked field layout, dark inputs, consent block, gradient submit button, and consent disclaimer.
- Extended E2E smoke checks and added a mobile visual snapshot for the open modal.

**Changed Files:**
- `apps/web/components/offer-booking-action.tsx`: dialog styling, summary props, variant `priceLabel`.
- `apps/web/components/booking-form.tsx`: summary UI, grid, themed inputs/CTA.
- `apps/web/e2e/quest-schedule.spec.ts`: assertions for new modal structure.
- `apps/web/e2e/schedule-board.visual.spec.ts`: booking modal visual regression.
- `apps/web/e2e/schedule-board.visual.spec.ts-snapshots/booking-form-modal-mobile-chromium-win32.png`: baseline screenshot.

**Decisions:**
- Use a 2-column field grid at modal width (no `sm:` breakpoint) so the layout matches the reference on mobile.
- Keep `leadSchema` and payload unchanged; summary is display-only.

**Validation:**
- `npm run lint` (apps/web)
- `npm run build` (apps/web)
- `npx playwright test e2e/quest-schedule.spec.ts e2e/schedule-board.visual.spec.ts -g "mobile booking modal" --project=chromium` — booking-related tests passed; other schedule-board visual baselines still differ from stored snapshots (pre-existing drift).

**Open Items:**
- None.

### 2026-05-17 17:06 UTC+3 - Stable Dev Server Restart

**Goal:** Prevent parallel Next dev servers from corrupting the shared dev output and provide a reliable restart command for port 3000.

**Completed:**
- Pinned the hosted Next dev script to port 3000 and added a preflight port check so `make dev-host` does not silently fall back to port 3001.
- Added `make dev-restart` to stop the process listening on port 3000 and start the hosted dev server again on the same port.
- Added cross-platform helper scripts for checking and reclaiming the dev port, including a Windows shell-based restart path to avoid `spawn EINVAL`.

**Changed Files:**
- `Makefile`: documents and exposes the `dev-restart` target.
- `package.json`: adds the root `dev:restart` script.
- `apps/web/package.json`: pins `dev:host` to port 3000 behind the port-free check.
- `scripts/assert-port-free.mjs`: fails fast when port 3000 is already occupied.
- `scripts/restart-next-dev.mjs`: reclaims port 3000 and starts the Next dev server.
- `docs/execution-log.md`: records the dev-server workflow change.

**Decisions:**
- Keep normal `dev-host` non-destructive: it reports an occupied port instead of killing a process automatically.
- Make restart explicit through `dev-restart` so reclaiming port 3000 is intentional.

**Validation:**
- `node --check scripts/assert-port-free.mjs`
- `node --check scripts/restart-next-dev.mjs`
- `node scripts/assert-port-free.mjs 3999`
- `make -n dev-host`
- `make -n dev-restart`
- IDE diagnostics reported no linter errors for the helper scripts and package/make changes.

**Open Items:**
- None.

### 2026-05-17 05:01 UTC+3 - Execution Journal

**Goal:** Create a project execution journal and global guidance for maintaining it across projects.

**Completed:**
- Added `docs/execution-log.md` as the canonical project journal.
- Defined the journal entry format for goals, completed work, changed files, decisions, validation, and open items.
- Added a global Cursor rule requiring execution-log maintenance and pre-planning review across projects.
- Linked the journal from the project documentation index.

**Changed Files:**
- `docs/execution-log.md`: adds the journal location, format, and initial entry.
- `docs/README.md`: links the execution journal from the documentation index.
- `C:\Users\Xipsin\.cursor\rules\execution-log.mdc`: adds the global always-on execution-log rule for all projects.

**Decisions:**
- Store the project journal under `docs/` because it is durable project documentation, not tool-local state.
- Use reverse chronological entries so the latest context is easiest to find before planning or implementation.
- Keep the rule in the global Cursor rules directory so it applies across projects.

**Validation:**
- Read-back confirmed the project journal and global rule were created with the expected structure.
- IDE diagnostics reported no linter errors for the updated journal, docs index, or global rule.

**Open Items:**
- None.
