# BM QuestHub CMS — ADR backlog

Planning backlog for architecture decisions listed in [`00_foundation/02_TARGET_ARCHITECTURE.md`](00_foundation/02_TARGET_ARCHITECTURE.md) §15. This document records questions, ownership evidence, and blockers only.

## 1. Normative scope

- This file is a **planning backlog**, not an Architecture Decision Record.
- It contains **no accepted decision** for any ADR topic.
- Architecture §15 ([`02_TARGET_ARCHITECTURE.md`](00_foundation/02_TARGET_ARCHITECTURE.md) lines 333–344) is the **closed source set** for M0-12: exactly `ADR-001` through `ADR-008`.
- Roadmap rows in [`02_delivery/23_ATOMIC_ROADMAP.md`](02_delivery/23_ATOMIC_ROADMAP.md) provide **scheduling and ownership evidence** only; a roadmap row is not authorization to implement.
- Current repository code and deployment artifacts are **evidence**, not retroactive architecture decisions.
- Each future ADR requires its own maintainer-authorized Task Packet.
- A future ADR task is **read-only** with respect to implementation: it may analyze alternatives and produce a reviewed ADR, but must not implement the chosen stack.
- Implementation begins only in a **separate**, later authorized task after an ADR reaches `ACCEPTED`.
- Provider, version, vendor, and tool choices remain **blocked** until ADR approval.

Authority chain (unchanged by this backlog):

```text
AGENTS.md
→ PLANS.md
→ Task Packet
→ ExecPlan
→ relevant architecture / UX / reference docs
```

## 2. What this document is not

- Not a recommendation or preferred option.
- Not a provider or product shortlist.
- Not a cost study or capacity plan.
- Not a threat model execution record.
- Not an implementation plan for any ADR topic.
- Not roadmap authorization for implementation tasks.
- Not proof that a future ADR task is ready to start.
- Not permission to create production infrastructure.
- Not a substitute for decision-owner or maintainer approval.
- Not an ADR directory and not a substitute for reviewed ADR files.

## 3. Status vocabulary

| Status | Meaning |
|---|---|
| `BACKLOG` | Question exists in architecture §15. No ADR is authorized or accepted. |
| `READY_FOR_ADR` | A separate maintainer-authorized ADR Task Packet exists and all prerequisites are satisfied. |
| `ACCEPTED` | A separately reviewed ADR exists with independent verdict `APPROVE`. |
| `SUPERSEDED` | An accepted ADR was replaced by another accepted ADR. |
| `REJECTED` | A separately reviewed ADR rejected a proposal without selecting that option. |

**Current status of all eight entries:** `BACKLOG`.

No `DRAFT` status is used in M0-12 because no ADR file was created.

## 4. Ownership vocabulary

| Term | Meaning |
|---|---|
| **Decision owner role** | Human role accountable for convening and approving the future ADR process. A responsibility label, not a named individual. |
| **Owning roadmap task** | Existing roadmap Task ID that authorizes the future ADR work. Only exact IDs from [`23_ATOMIC_ROADMAP.md`](02_delivery/23_ATOMIC_ROADMAP.md). |
| **Earliest consuming task** | First known implementation or planning task that needs the decision. **Not** the owner and **not** authorization. |
| **Ownership gap** | No explicit ADR task exists in the current roadmap. Record as `Owning roadmap task: UNASSIGNED` and `Ownership status: GAP`. |

## 5. Summary matrix

| ID | Neutral question | Status | Decision owner role | Owning roadmap task | Ownership | Earliest consumers |
|---|---|---|---|---|---|---|
| ADR-001 | Which server boundary should own admin API concerns, and what deployment, security, operational, ownership, and migration constraints decide between Next.js BFF and a standalone content-api? | BACKLOG | Application architecture owner | M3-01 | ASSIGNED | M3-02, M3-03 |
| ADR-002 | Which PostgreSQL operating model and exact supported version should be used given availability, backups, connection model, data residency, cost, observability, and recovery requirements? | BACKLOG | Data/platform architecture owner | M4-01 | ASSIGNED | M4-02, M4-03 |
| ADR-003 | Which identity/authentication integration and server-side session mechanism satisfy individual identity, expiry, revocation, secure cookies, CSRF, audit, and recovery requirements? | BACKLOG | Security and identity architecture owner | M3-01 | ASSIGNED | M3-03, M3-04, M3-05, M3-08 |
| ADR-004 | Which database access and migration approach should own SQL, schema changes, checksums, locking, concurrency, rollback/recovery, and testability? | BACKLOG | Data/platform architecture owner | M4-01 | ASSIGNED | M4-03, M4-04 |
| ADR-005 | How should immutable release artifacts, namespaces, manifests, and the atomic activation pointer be represented in object storage while supporting verification, concurrency, retention, and rollback? | BACKLOG | Publication/release architecture owner | UNASSIGNED | GAP | M9-04, M9-09, M9-10, M9-15 |
| ADR-006 | How should preview artifacts be built, stored, accessed, expired, and rendered using the same compiler and compatible consumer without affecting the production activation pointer? | BACKLOG | Preview architecture owner | UNASSIGNED | GAP | M9-04, M9-05, M9-06 |
| ADR-007 | What runtime or boundary should perform media validation, metadata extraction, malware/content checks, variants, and bounded processing while satisfying storage, security, cost, and data-residency requirements? | BACKLOG | Media platform and security owner | M8-01 | ASSIGNED | M8-02, M8-03, M8-04, M8-05, M8-06 |
| ADR-008 | What readiness, dual-source, write-freeze, import, rollback, retention, and retirement policy governs the transition from Google Sheets to the CMS source of truth? | BACKLOG | Migration/cutover owner with product owner approval | UNASSIGNED | GAP | M10-01, M10-02, M10-09, M10-10, M10-11 |

Sources: architecture §15; roadmap ownership evidence in [`23_ATOMIC_ROADMAP.md`](02_delivery/23_ATOMIC_ROADMAP.md); traceability context in [`03_reference/35_TRACEABILITY_MATRIX.md`](03_reference/35_TRACEABILITY_MATRIX.md).

## ADR-001

Source topic: Next.js BFF или отдельный content-api.

Neutral question: Which server boundary should own admin API concerns, and what deployment, security, operational, ownership, and migration constraints decide between a Next.js BFF and a standalone content-api?

Status: BACKLOG

Decision owner role: Application architecture owner

Owning roadmap task: M3-01

Ownership status: ASSIGNED

Prerequisites: M0-12, M2-14

Earliest consuming tasks: M3-02, M3-03

Evidence required before ADR:

- current admin, web, and API boundary inventory;
- deployment topology;
- session and cookie boundary implications;
- CSRF and CORS implications;
- failure isolation between admin and public surfaces;
- scaling and operational ownership;
- migration impact from current layout;
- threat model for the chosen boundary;
- alternatives comparison and reversibility.

Explicitly named alternatives:

- Next.js BFF
- standalone content-api

Decision: NOT MADE

Future ADR path: `docs/admin-cms/adrs/ADR-001-admin-bff-boundary.md`

Implementation authorization: NONE

## ADR-002

Source topic: PostgreSQL provider и точная версия.

Neutral question: Which PostgreSQL operating model and exact supported version should be used given availability, backups, connection model, data residency, cost, observability, and recovery requirements?

Status: BACKLOG

Decision owner role: Data/platform architecture owner

Owning roadmap task: M4-01

Ownership status: ASSIGNED

Prerequisites: M3-14

Earliest consuming tasks: M4-02, M4-03

Evidence required before ADR:

- data residency requirements;
- backup, restore, RPO, and RTO needs;
- required or prohibited extensions;
- connection and session limits;
- local and integration test parity;
- upgrade and patch policy;
- operating ownership;
- cost envelope;
- failure and recovery model.

Explicitly named alternatives: TBD by future ADR

Decision: NOT MADE

Future ADR path: `docs/admin-cms/adrs/ADR-002-postgresql-provider-version.md`

Implementation authorization: NONE

## ADR-003

Source topic: authentication provider/session implementation.

Neutral question: Which identity and authentication integration and server-side session mechanism satisfy individual identity, expiry, revocation, secure cookies, CSRF, audit, and recovery requirements?

Status: BACKLOG

Decision owner role: Security and identity architecture owner

Owning roadmap task: M3-01

Ownership status: ASSIGNED

Prerequisites: M0-12, M2-14

Earliest consuming tasks: M3-03, M3-04, M3-05, M3-08

Evidence required before ADR:

- actor and role model;
- threat model;
- session lifecycle;
- cookie and security properties;
- CSRF interaction with mutations;
- revocation and disabled-user behavior;
- audit requirements for auth events;
- account recovery flows;
- operational ownership;
- migration from any shared-token pattern.

Explicitly named alternatives: TBD by future ADR

Decision: NOT MADE

Future ADR path: `docs/admin-cms/adrs/ADR-003-authentication-session.md`

Implementation authorization: NONE

## ADR-004

Source topic: ORM/query builder и миграции.

Neutral question: Which database access and migration approach should own SQL, schema changes, checksums, locking, concurrency, rollback/recovery, and testability?

Status: BACKLOG

Decision owner role: Data/platform architecture owner

Owning roadmap task: M4-01

Ownership status: ASSIGNED

Prerequisites: M3-14

Earliest consuming tasks: M4-03, M4-04

Evidence required before ADR:

- query complexity and raw SQL needs;
- transaction boundary expectations;
- migration checksum and locking needs;
- code generation policy;
- raw SQL ownership model;
- integration testing strategy;
- schema review workflow;
- rollback and recovery behavior;
- version pinning policy;
- operational ergonomics for developers and operators.

Explicitly named alternatives: TBD by future ADR

Decision: NOT MADE

Future ADR path: `docs/admin-cms/adrs/ADR-004-query-migration-stack.md`

Implementation authorization: NONE

## ADR-005

Source topic: release pointer and S3 layout.

Neutral question: How should immutable release artifacts, namespaces, manifests, and the atomic activation pointer be represented in object storage while supporting verification, concurrency, retention, and rollback?

Status: BACKLOG

Decision owner role: Publication/release architecture owner

Owning roadmap task: UNASSIGNED

Ownership status: GAP

Prerequisites: an owning ADR task must be created or authorized before M9 storage work proceeds

Earliest consuming tasks: M9-04, M9-09, M9-10, M9-15

Evidence required before ADR:

- current object storage and snapshot layout inventory;
- artifact inventory for releases;
- immutability requirements;
- atomic activation semantics;
- concurrent publisher model;
- checksum and manifest rules;
- retention policy;
- rollback compatibility with prior releases;
- preview isolation requirements;
- public consumer compatibility constraints.

Explicitly named alternatives: TBD by future ADR

Decision: NOT MADE

Future ADR path: `docs/admin-cms/adrs/ADR-005-release-pointer-storage-layout.md`

Implementation authorization: NONE

## ADR-006

Source topic: preview deployment.

Neutral question: How should preview artifacts be built, stored, accessed, expired, and rendered using the same compiler and compatible consumer without affecting the production activation pointer?

Status: BACKLOG

Decision owner role: Preview architecture owner

Owning roadmap task: UNASSIGNED

Ownership status: GAP

Prerequisites: an owning ADR task must be created or authorized before M9-04

Earliest consuming tasks: M9-04, M9-05, M9-06

Evidence required before ADR:

- same-compiler invariant for preview and production;
- temporary namespace requirements;
- access control for preview URLs or tokens;
- expiry and cleanup policy;
- rendering compatibility with public consumer;
- URL and routing model;
- data exposure limits;
- cost and resource limits;
- error recovery;
- production isolation guarantees.

Explicitly named alternatives: TBD by future ADR

Decision: NOT MADE

Future ADR path: `docs/admin-cms/adrs/ADR-006-preview-deployment.md`

Implementation authorization: NONE

## ADR-007

Source topic: media processing runtime.

Neutral question: What runtime or boundary should perform media validation, metadata extraction, malware/content checks, variants, and bounded processing while satisfying storage, security, cost, and data-residency requirements?

Status: BACKLOG

Decision owner role: Media platform and security owner

Owning roadmap task: M8-01

Ownership status: ASSIGNED

Prerequisites: M4-16

Earliest consuming tasks: M8-02, M8-03, M8-04, M8-05, M8-06

Evidence required before ADR:

- file size, type, and volume expectations;
- MIME, checksum, and security verification needs;
- malware and content check requirements;
- variant matrix and determinism rules;
- queue or job semantics if applicable;
- timeout, retry, and idempotency behavior;
- data residency constraints;
- operational ownership;
- cost envelope;
- failure cleanup behavior.

Explicitly named alternatives: TBD by future ADR

Decision: NOT MADE

Future ADR path: `docs/admin-cms/adrs/ADR-007-media-processing-runtime.md`

Implementation authorization: NONE

## ADR-008

Source topic: Google Sheets cutover policy.

Neutral question: What readiness, dual-source, write-freeze, import, rollback, retention, and retirement policy governs the transition from Google Sheets to the CMS source of truth?

Status: BACKLOG

Decision owner role: Migration/cutover owner with product owner approval

Owning roadmap task: UNASSIGNED

Ownership status: GAP

Prerequisites: an owning ADR task and owner approval must exist before production cutover

Earliest consuming tasks: M10-01, M10-02, M10-09, M10-10, M10-11

Evidence required before ADR:

- parity and reconciliation criteria;
- user readiness and training needs;
- write ownership during transition;
- rollback conditions and triggers;
- dual-read and dual-write policy;
- import repeatability and audit;
- retention and export requirements;
- monitoring and support readiness;
- permission freeze policy;
- legacy adapter retirement criteria.

Explicitly named alternatives: TBD by future ADR

Decision: NOT MADE

Future ADR path: `docs/admin-cms/adrs/ADR-008-google-sheets-cutover.md`

Implementation authorization: NONE

## 14. Ownership gaps

The current roadmap contains **no dedicated ADR task** for these IDs:

### ADR-005 — release pointer and S3 layout

- No owning ADR Task ID exists in [`23_ATOMIC_ROADMAP.md`](02_delivery/23_ATOMIC_ROADMAP.md).
- Earliest consumers (`M9-04`, `M9-09`, `M9-10`, `M9-15`) are **not** authorization and must not select the decision.
- Implementation tasks must not silently choose storage layout or activation pointer semantics.
- Maintainer must authorize either a roadmap amendment or a one-off ADR Task Packet before ADR work starts.
- M0-12 does not create either authorization.

### ADR-006 — preview deployment

- No owning ADR Task ID exists in the current roadmap.
- Earliest consumers (`M9-04`, `M9-05`, `M9-06`) are **not** authorization.
- Preview implementation must not select hosting, namespace, or expiry policy without an accepted ADR.
- Maintainer must authorize either a roadmap amendment or a one-off ADR Task Packet.
- M0-12 does not create either authorization.

### ADR-008 — Google Sheets cutover policy

- No owning ADR Task ID exists in the current roadmap.
- Earliest consumers (`M10-01`, `M10-02`, `M10-09`, `M10-10`, `M10-11`) are **not** authorization.
- Cutover and migration tasks must not declare retirement dates or dual-write policy without an accepted ADR.
- Maintainer must authorize either a roadmap amendment or a one-off ADR Task Packet with product owner involvement.
- M0-12 does not create either authorization.

## 15. Decision lifecycle

```text
BACKLOG
→ maintainer authorizes exact ADR task
→ prerequisites verified
→ READY_FOR_ADR
→ read-only alternatives / threat / cost / operations analysis
→ frozen ADR document
→ independent APPROVE review
→ ACCEPTED
→ separate implementation Task Packet
```

Rules:

- A future ADR task does **not** implement its outcome.
- An implementation task cannot silently change an accepted decision.
- Changed assumptions require ADR review or supersession.
- Supersession requires a new accepted ADR; do not edit accepted history in place.
- Current implementation artifacts do **not** retroactively count as acceptance.
- A future ADR must record alternatives, consequences, rollback/reversibility, and exact versions where relevant.

## 16. Validation rules

Backlog validation requires:

- exactly eight IDs: `ADR-001` … `ADR-008`, contiguous, no duplicates;
- every current status is `BACKLOG`;
- every entry contains all required fields listed in §5 and per-ADR sections;
- every `Decision` field is `NOT MADE`;
- every `Implementation authorization` field is `NONE`;
- only ADR-001 lists explicitly named alternatives (`Next.js BFF`, `standalone content-api`);
- all other alternatives remain `TBD by future ADR`;
- owning tasks are only `M3-01`, `M4-01`, `M8-01`, or `UNASSIGNED`;
- ownership gaps are exactly ADR-005, ADR-006, ADR-008;
- no `docs/admin-cms/adrs/` directory and no ADR files exist;
- no provider, version, vendor, or product is invented as a decision;
- architecture and roadmap source references resolve;
- [`INDEX.md`](INDEX.md) links this backlog;
- imported package bytes remain unchanged from M0-02 fingerprint.

## 17. Current backlog summary

```text
Architecture ADR topics: 8
Backlog entries: 8
Accepted decisions: 0
Ready-for-ADR entries: 0
Assigned owning roadmap tasks: 5
Ownership gaps: 3
Implementation authorizations: 0
Created ADR files: 0
```
