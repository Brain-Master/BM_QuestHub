/**
 * @deprecated Temporary bridge for the shared content-admin token.
 * Replace with the server-side session flow owned by M3.
 */
export interface LegacyTokenAdapter {
  read(): string;
  write(value: string): void;
}

const LEGACY_TOKEN_STORAGE_KEY = "contentAdminToken";

/**
 * @deprecated Temporary bridge for the shared content-admin token.
 * Replace with the server-side session flow owned by M3.
 */
export const legacyTokenAdapter: LegacyTokenAdapter = {
  read() {
    return sessionStorage.getItem(LEGACY_TOKEN_STORAGE_KEY) ?? "";
  },
  write(value: string) {
    sessionStorage.setItem(LEGACY_TOKEN_STORAGE_KEY, value.trim());
  },
};
