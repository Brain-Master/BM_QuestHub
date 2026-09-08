/* eslint-disable react-refresh/only-export-components --
   M2-01 public contract exports APP_SHELL_STATES with the pure AppShell. */
import type { ReactElement, ReactNode } from "react";

export const APP_SHELL_STATES = Object.freeze([
  "loading",
  "error",
  "authorized",
] as const);

export type AppShellStateKind = (typeof APP_SHELL_STATES)[number];

export type AppShellState =
  | Readonly<{ kind: "loading"; message: string }>
  | Readonly<{ kind: "error"; message: string }>
  | Readonly<{ kind: "authorized" }>;

export type AppShellProps = Readonly<{
  title: string;
  description?: string;
  utility: ReactNode;
  navigation: ReactNode;
  status: ReactNode;
  state: AppShellState;
  onRetry?: () => void;
  children: ReactNode;
}>;

/**
 * Pure admin layout shell. The `authorized` state name means "show content
 * region"; it is not a server identity, permission, or RBAC claim.
 */
export function AppShell(props: AppShellProps): ReactElement {
  const {
    title,
    description,
    utility,
    navigation,
    status,
    state,
    onRetry,
    children,
  } = props;

  return (
    <div className="app-shell" data-shell-state={state.kind}>
      <a className="skip-link" href="#admin-main-content">
        Перейти к основному содержимому
      </a>

      <header className="app-shell__header">
        <h1 className="app-shell__title">{title}</h1>
        {description ? (
          <p className="app-shell__description">{description}</p>
        ) : null}
      </header>

      <section
        className="app-shell__utility"
        aria-label="Подключение и состояние"
      >
        {utility}
        {status}
      </section>

      <div className="app-shell__body">
        <div className="app-shell__navigation">
          <nav aria-label="Разделы текущего инструмента">{navigation}</nav>
        </div>

        <main
          id="admin-main-content"
          className="app-shell__main"
          tabIndex={-1}
          aria-busy={state.kind === "loading"}
        >
          {state.kind === "loading" ? (
            <div
              className="app-shell__state"
              role="status"
              aria-live="polite"
            >
              <h2 className="app-shell__state-title">Загрузка данных</h2>
              <p>{state.message}</p>
            </div>
          ) : null}

          {state.kind === "error" ? (
            <div
              className="app-shell__state"
              role="alert"
              aria-live="assertive"
            >
              <h2 className="app-shell__state-title">
                Данные не удалось загрузить
              </h2>
              <p>{state.message}</p>
              {onRetry ? (
                <button
                  type="button"
                  className="app-shell__retry"
                  onClick={onRetry}
                >
                  Повторить загрузку
                </button>
              ) : null}
            </div>
          ) : null}

          {/* authorized = content visible; not identity / RBAC. */}
          {state.kind === "authorized" ? children : null}
        </main>
      </div>
    </div>
  );
}
