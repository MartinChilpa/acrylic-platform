import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { IProjectResult, ITrackDestinations } from '../interfaces/response/projects.response';
import { ProjectsService } from './projects.service';
import { ToastService } from './toast.service';
import {
  PickerSelection,
  SavePickerMode,
  buildUndo,
  destinationNames,
  joinNames,
} from '../utils/save-to-picker.state';

/** The track a Save to… action is about, as the list showing it knows it. */
export interface SaveTrackRef {
  /** Catalog track uuid (ProjectsService.trackKey). */
  uuid: string;
  title: string;
  artist: string;
  /** Rich row data kept for the Projects page (Home results). */
  snapshot?: any;
}

export interface PickerRequest {
  mode: SavePickerMode;
  tracks: SaveTrackRef[];
  resolve: (result: ITrackDestinations[] | null) => void;
}

export interface ProjectFormRequest {
  mode: 'create' | 'edit';
  project?: IProjectResult;
  resolve: (project: IProjectResult | null) => void;
}

export type ConfirmChoice = 'confirm' | 'secondary' | null;

export interface ConfirmRequest {
  title: string;
  body?: string;
  items?: string[];
  note?: string;
  cancelLabel: string;
  secondaryLabel?: string;
  confirmLabel: string;
  resolve: (choice: ConfirmChoice) => void;
}

/**
 * Shared Save to… flow. Any page opens the picker, the project form or a
 * confirmation through here; SaveToHostComponent (mounted once in the brand
 * layout) renders them.
 */
@Injectable({ providedIn: 'root' })
export class SaveToService {
  private projectsService = inject(ProjectsService);
  private toasts = inject(ToastService);
  private transloco = inject(TranslocoService);
  private router = inject(Router);

  readonly picker = signal<PickerRequest | null>(null);
  readonly form = signal<ProjectFormRequest | null>(null);
  readonly confirm = signal<ConfirmRequest | null>(null);

  /** Element to refocus when the outermost dialog closes. */
  private returnFocus: HTMLElement | null = null;

  /**
   * Opens the picker. Without a mode: several tracks → bulk; one saved track →
   * edit (its current destinations checked); otherwise single.
   */
  openPicker(tracks: SaveTrackRef[], mode?: SavePickerMode): Promise<ITrackDestinations[] | null> {
    const usable = tracks.filter(t => !!t.uuid);
    if (!usable.length) { return Promise.resolve(null); }
    const resolved: SavePickerMode = mode
      ?? (usable.length > 1 ? 'bulk' : this.projectsService.isSaved(usable[0].uuid) ? 'edit' : 'single');
    if (this.projectsService.projectsState === 'idle' || this.projectsService.projectsState === 'error') {
      this.projectsService.loadProjects();
    }
    this.rememberFocus();
    return new Promise(resolve => {
      this.picker.set({
        mode: resolved,
        tracks: usable,
        resolve: (result) => { this.picker.set(null); this.restoreFocus(); resolve(result); },
      });
    });
  }

  openProjectForm(mode: 'create' | 'edit', project?: IProjectResult): Promise<IProjectResult | null> {
    this.rememberFocus();
    return new Promise(resolve => {
      this.form.set({
        mode,
        project,
        resolve: (result) => { this.form.set(null); this.restoreFocus(); resolve(result); },
      });
    });
  }

  ask(request: Omit<ConfirmRequest, 'resolve'>): Promise<ConfirmChoice> {
    this.rememberFocus();
    return new Promise(resolve => {
      this.confirm.set({
        ...request,
        resolve: (choice) => { this.confirm.set(null); this.restoreFocus(); resolve(choice); },
      });
    });
  }

  goToProjects(projectUuid?: string | null): void {
    this.router.navigate(['/brand/projects'], { queryParams: { view: projectUuid || 'saved' } });
  }

  /** B2: confirm exactly where the track(s) went, with Undo and Go to projects. */
  notifySaved(mode: SavePickerMode, tracks: SaveTrackRef[], selection: PickerSelection, previous: ITrackDestinations[]): void {
    const t = (key: string, params?: Record<string, unknown>) => this.transloco.translate(key, params);
    const lang = this.transloco.getActiveLang();
    const names = joinNames(destinationNames(selection, this.projectsService.projects, t('saveTo.savedTracks')), lang);
    const firstProject = this.projectsService.projects.find(p => selection.projects.has(p.uuid))?.uuid ?? null;

    let title: string;
    if (mode === 'edit') {
      title = names ? t('saveTo.toast.updated', { names }) : t('saveTo.toast.removedFromSaved');
    } else if (tracks.length > 1) {
      title = t('saveTo.toast.addedMany', { count: tracks.length, names });
    } else {
      title = t('saveTo.toast.added', { names });
    }

    const undo = () => this.restore(previous);
    this.toasts.show({
      title,
      body: mode === 'edit' || tracks.length > 1 ? undefined : tracks[0]?.title,
      undo,
      actions: [
        { label: t('saveTo.undo'), run: undo, primary: true },
        { label: t('saveTo.goToProjects'), run: () => this.goToProjects(firstProject) },
      ],
    });
  }

  /**
   * C3: removing from Saved warns when the track is also in projects, since it
   * leaves them too. Resolves true when the track was removed.
   */
  async removeFromSaved(tracks: SaveTrackRef | SaveTrackRef[]): Promise<boolean> {
    const list = (Array.isArray(tracks) ? tracks : [tracks]).filter(t => !!t.uuid);
    if (!list.length) { return false; }
    const t = (key: string, params?: Record<string, unknown>) => this.transloco.translate(key, params);
    const uuids = list.map(track => track.uuid);

    let previous: ITrackDestinations[];
    try {
      previous = await firstValueFrom(this.projectsService.getDestinations(uuids));
    } catch {
      previous = uuids.map(uuid => ({
        track_uuid: uuid,
        saved: true,
        project_uuids: this.projectsService.projectsContaining(uuid).map(p => p.uuid),
      }));
    }
    const affected = new Set(previous.flatMap(p => p.project_uuids));
    const names = this.projectsService.projects.filter(p => affected.has(p.uuid)).map(p => p.name);
    const many = list.length > 1;

    const choice = await this.ask({
      title: many ? t('saveTo.removeSaved.titleMany', { count: list.length }) : t('saveTo.removeSaved.title'),
      body: names.length
        ? t(names.length === 1 ? 'saveTo.removeSaved.bodyProjectsOne' : 'saveTo.removeSaved.bodyProjectsOther', { count: names.length })
        : t('saveTo.removeSaved.bodyNoProjects'),
      items: names,
      note: t('saveTo.removeSaved.note'),
      cancelLabel: t('saveTo.cancel'),
      secondaryLabel: t('saveTo.goToProjects'),
      confirmLabel: t('saveTo.removeSaved.confirm'),
    });
    if (choice === 'secondary') {
      this.goToProjects(previous.find(p => p.project_uuids.length)?.project_uuids[0] ?? null);
      return false;
    }
    if (choice !== 'confirm') { return false; }

    try {
      if (many) {
        // One request: "set" to nothing removes from Saved and every project.
        await firstValueFrom(this.projectsService.applyDestinations('set', uuids.map(uuid => ({ track_uuid: uuid, saved: false, project_uuids: [] }))));
      } else {
        await firstValueFrom(this.projectsService.removeFromSaved(uuids[0]));
      }
    } catch {
      this.showError(t('saveTo.errors.removeFailed'), () => this.removeFromSaved(list));
      return false;
    }
    const undo = () => this.restore(previous);
    this.toasts.show({
      title: many ? t('saveTo.toast.removedManyFromSaved', { count: list.length }) : t('saveTo.toast.removedFromSaved'),
      body: many ? undefined : list[0].title,
      undo,
      actions: [{ label: t('saveTo.undo'), run: undo, primary: true }],
    });
    return true;
  }

  /** Puts tracks back exactly where they were. */
  restore(previous: ITrackDestinations[]): void {
    const request = buildUndo(previous);
    this.projectsService.applyDestinations(request.mode, request.items).subscribe({
      error: () => this.showError(this.transloco.translate('saveTo.errors.undoFailed'), () => this.restore(previous)),
    });
  }

  /** An error says what happened and offers the next step. */
  showError(message: string, retry?: () => void): void {
    this.toasts.show({
      title: message,
      tone: 'error',
      actions: retry ? [{ label: this.transloco.translate('saveTo.retry'), run: retry, primary: true }] : [],
    });
  }

  private rememberFocus(): void {
    // Only the outermost dialog records it; nested ones return into the dialog below.
    if (this.picker() || this.form() || this.confirm()) { return; }
    const active = document.activeElement;
    this.returnFocus = active instanceof HTMLElement ? active : null;
  }

  private restoreFocus(): void {
    setTimeout(() => {
      if (this.picker() || this.form() || this.confirm()) { return; }
      if (this.returnFocus?.isConnected) { this.returnFocus.focus(); }
      this.returnFocus = null;
    });
  }
}
