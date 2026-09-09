/** Calendar dates are inclusive; an admission closure is not an archive. */
export function moscowDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
}

function calendarDate(raw) {
  let text = String(raw ?? "").trim();
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(text)) text = text.split(".").reverse().join("-");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === text ? text : null;
}

export function groupLifecycle(group, today = moscowDate()) {
  if (!calendarDate(today) || !group || group.invalid) return { state: "unknown", reason: "MOS_LIFECYCLE_UNKNOWN" };
  const flag = String(group.is_archived ?? group.isArchived ?? "").trim().toLowerCase();
  if (!["", "true", "false", "1", "0", "да", "нет"].includes(flag)) return { state: "unknown", reason: "MOS_ARCHIVE_FLAG_INVALID" };
  if (["true", "1", "да"].includes(flag) || ["archived", "cancelled", "архив", "отменено"].includes(String(group.status ?? "").toLowerCase())) return { state: "archived", reason: "MOS_EXPLICIT_ARCHIVE" };
  const start = calendarDate(group.courseStart ?? group.startDate ?? group.start_date);
  const end = calendarDate(group.courseEnd ?? group.endDate ?? group.end_date);
  if (!start || !end || start > end) return { state: "unknown", reason: "MOS_DATES_INVALID" };
  return { state: end < today ? "archived" : start > today ? "future" : "current", reason: end < today ? "MOS_COURSE_ENDED" : "MOS_CURRENT_COURSE" };
}

export function sheetGroupLifecycles(grid) {
  const headers = (grid[0] ?? []).map(h => String(h).trim().toLowerCase().replace(/\s+/g, "_"));
  if (!["shift_group_id", "start_date", "end_date"].every(h => headers.includes(h))) throw Error("MOS_GROUPS_HEADERS_MISSING");
  const groups = new Map();
  for (const cells of grid.slice(1)) {
    const record = Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
    const id = String(record.shift_group_id).trim();
    if (!id) continue;
    groups.set(id, groups.has(id) ? { invalid: true } : record);
  }
  return groups;
}

/** Join before URL deduplication: an archived row sharing a URL must not be written. */
export function currentMosRows(byUrl, lifecycleById, today = moscowDate()) {
  const selected = new Map(), errors = [], archived = new Set();
  for (const [id, group] of lifecycleById) if (groupLifecycle(group, today).state === "archived") archived.add(id);
  for (const [url, bucket] of byUrl) {
    const rows = [];
    for (const row of bucket.rows) {
      const lifecycle = lifecycleById.get(row.shiftGroupId);
      const result = groupLifecycle(lifecycle, today);
      if (result.state === "unknown") errors.push({ url, message: `${result.reason}:${row.shiftGroupId || "missing-id"}` });
      else if (result.state !== "archived") rows.push({ ...row, lifecycle });
    }
    if (rows.length) selected.set(url, { ...bucket, rows });
  }
  return { byUrl: selected, errors, archivedGroupIds: [...archived].sort(), lifecycleDate: today };
}
