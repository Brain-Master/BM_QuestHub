/** Replaces `:` in shift_group_id — illegal in Windows/macOS inbox paths. S3 URLs keep the canonical id. */
export const SHIFT_GROUP_INBOX_DIR_SEP = "__";

export function shiftGroupIdToInboxDir(shiftGroupId: string): string {
  return shiftGroupId.replaceAll(":", SHIFT_GROUP_INBOX_DIR_SEP);
}
