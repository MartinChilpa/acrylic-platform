import { DestinationsMode, ITrackDestinations } from '../interfaces/response/projects.response';

/**
 * single: one track, starts empty, "Add track" (A4–A6).
 * bulk:   several tracks, starts empty, "Add N tracks"; never removes (C1).
 * edit:   one track, starts on its current destinations, "Save changes" (C2).
 */
export type SavePickerMode = 'single' | 'bulk' | 'edit' | 'project';

export interface PickerSelection {
  saved: boolean;
  projects: ReadonlySet<string>;
}

export interface DestinationsRequest {
  mode: DestinationsMode;
  items: ITrackDestinations[];
}

export const EMPTY_SELECTION: PickerSelection = { saved: false, projects: new Set<string>() };

/** What the picker shows checked when it opens. */
export function initialSelection(mode: SavePickerMode, current: ITrackDestinations | null | undefined): PickerSelection {
  if (mode !== 'edit' || !current) {
    return { saved: false, projects: new Set<string>() };
  }
  const projects = new Set(current.project_uuids);
  return { saved: current.saved || projects.size > 0, projects };
}

/** Saved tracks cannot be unchecked while a project is chosen: projects always include it. */
export function isSavedLocked(selection: PickerSelection): boolean {
  return selection.projects.size > 0;
}

export function toggleSaved(selection: PickerSelection): PickerSelection {
  if (isSavedLocked(selection)) { return selection; }
  return { saved: !selection.saved, projects: selection.projects };
}

/** Choosing any project includes Saved tracks automatically. */
export function toggleProject(selection: PickerSelection, projectUuid: string): PickerSelection {
  const projects = new Set(selection.projects);
  if (projects.has(projectUuid)) { projects.delete(projectUuid); } else { projects.add(projectUuid); }
  return { saved: selection.saved || projects.size > 0, projects };
}

/** A project created from inside the picker comes back checked (B1). */
export function selectProject(selection: PickerSelection, projectUuid: string): PickerSelection {
  if (selection.projects.has(projectUuid)) { return selection; }
  return toggleProject(selection, projectUuid);
}

export function isEmpty(selection: PickerSelection): boolean {
  return !selection.saved && selection.projects.size === 0;
}

export function sameSelection(a: PickerSelection, b: PickerSelection): boolean {
  if (a.saved !== b.saved || a.projects.size !== b.projects.size) { return false; }
  for (const uuid of a.projects) {
    if (!b.projects.has(uuid)) { return false; }
  }
  return true;
}

/**
 * Add/Save is enabled when it would change something: a destination is chosen
 * (single, bulk), or the choice differs from where the track is now (edit).
 */
export function canSubmit(mode: SavePickerMode, selection: PickerSelection, initial: PickerSelection): boolean {
  return mode === 'edit' ? !sameSelection(selection, initial) : !isEmpty(selection);
}

/** The footer line under the destinations. */
export function summaryKey(selection: PickerSelection): { key: string; params: Record<string, number> } {
  const count = selection.projects.size;
  if (count > 0) {
    return { key: count === 1 ? 'saveTo.summary.projectsOne' : 'saveTo.summary.projectsOther', params: { count } };
  }
  return { key: selection.saved ? 'saveTo.summary.savedOnly' : 'saveTo.summary.none', params: {} };
}

/** The request for "Add track" / "Add N tracks" / "Save changes". */
export function buildRequest(mode: SavePickerMode, trackUuids: string[], selection: PickerSelection): DestinationsRequest {
  const projectUuids = [...selection.projects];
  const saved = selection.saved || projectUuids.length > 0;
  return {
    mode: mode === 'edit' ? 'set' : 'add',
    items: trackUuids.map(track_uuid => ({ track_uuid, saved, project_uuids: [...projectUuids] })),
  };
}

/** Undo puts every touched track back exactly where it was before the save. */
export function buildUndo(previous: ITrackDestinations[]): DestinationsRequest {
  return {
    mode: 'set',
    items: previous.map(p => ({ track_uuid: p.track_uuid, saved: p.saved, project_uuids: [...p.project_uuids] })),
  };
}

/**
 * Names for the confirmation toast, in project-list order: the projects that
 * were chosen, or Saved tracks alone when no project was.
 */
export function destinationNames(
  selection: PickerSelection,
  projects: { uuid: string; name: string }[],
  savedLabel: string,
): string[] {
  const names = projects.filter(p => selection.projects.has(p.uuid)).map(p => p.name);
  return names.length ? names : (selection.saved ? [savedLabel] : []);
}

/** "A", "A and B", "A, B and C" in the active language. */
export function joinNames(names: string[], lang: string): string {
  try {
    return new Intl.ListFormat(lang || 'en', { style: 'long', type: 'conjunction' }).format(names);
  } catch {
    return names.join(', ');
  }
}

/** Projects whose name matches the picker's search, accent- and case-insensitive. */
export function filterProjects<T extends { name: string }>(projects: T[], query: string): T[] {
  const q = normalize(query);
  return q ? projects.filter(p => normalize(p.name).includes(q)) : projects;
}

/** A name already used by another project of the account (create and rename). */
export function isDuplicateName(name: string, projects: { uuid: string; name: string }[], exceptUuid?: string | null): boolean {
  const n = name.trim().toLowerCase();
  return !!n && projects.some(p => p.uuid !== exceptUuid && p.name.trim().toLowerCase() === n);
}

function normalize(text: string): string {
  return (text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
