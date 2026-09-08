# Developer handoff

Annual routes: /year-courses/ and shmi/, it-academy/, projects/, olympiad-league/. generateStaticParams supports existing static-export architecture; unknown programmes do not fall back to fabricated content. Editorial content lives in content/year-programs.ts. No dependency updates, third-party video embeds or application writes added.

Media generator: node scripts/prepare-year-course-media.mjs <media-review-directory>. Requires ffmpeg; validates photo source hashes and refuses overwrite. Prepared static assets need no archive at runtime. Browser checks: node scripts/verify-year-course-ui.mjs; PREVIEW_URL, QA_OUTPUT and CHROMIUM_PATH are optional overrides. Screenshots/results are task-owned evidence, not production output. Existing global build has S3/generation steps and was not run.

Annual schedule extension: /year-courses/schedule/, generated public projection in content/year-schedule.generated.json, strict boundary in lib/year-schedule.ts. Importer, tests, field exclusions and repeatable commands are in docs/data/year-schedule-import.md. No existing intensive offers mutated. Local filter state only. Schedule screenshots and browser results are in qa/schedule/.
