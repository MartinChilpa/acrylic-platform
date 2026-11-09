/**
 * Values for the Save to… flow (Audience Search, Projects, Home).
 *
 * Items marked DRAFT come from Figma notes marked "Draft / confirm with Devs".
 * They live here so they can be confirmed or tuned in one place.
 */
export const SAVE_DESTINATIONS_CONFIG = {
  /** DRAFT (B2, D3): how long a toast with Undo stays visible. Figma: 6–8 s. */
  toastDurationMs: 7000,

  /** Matches catalog.SyncList.name max_length on the backend. */
  projectNameMaxLength: 100,

  /** DRAFT (D3): Cmd/Ctrl+Z undoes the last action while its toast is visible. */
  undoShortcutEnabled: true,

  /** DRAFT (D3): deleting a project asks for confirmation first. */
  confirmProjectDelete: true,

  /** Matches MAX_BULK_TRACKS on the backend. */
  maxBulkTracks: 500,
} as const;
