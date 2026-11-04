import { Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ProjectsService } from '../../../../../services/projects.service';
import { LicenseService } from '../../../../../services/license.service';
import { SaveToService, SaveTrackRef } from '../../../../../services/save-to.service';
import { ToastService } from '../../../../../services/toast.service';
import { IFavoriteResult, IProjectResult } from '../../../../../interfaces/response/projects.response';
import { TrackRowProjectsComponent } from '../track-row-projects/track-row-projects.component';
import { TeamBrandingService } from '../../../../../services/team-branding.service';
import { HeaderComponent } from '../../../../shared/acquier/header/header.component';
import { SAVE_DESTINATIONS_CONFIG } from '../../../../../constants/save-destinations.config';
import { filterProjects } from '../../../../../utils/save-to-picker.state';

type ProjectsSort = 'recent' | 'oldest' | 'name';

/** One track in the current view: a Saved track or a project track. */
interface LibraryRow {
  key: string;
  track_uuid: string;
  track_name: string;
  artist_name: string;
  created: string;
  /** Rich snapshot for the row component, when one is known. */
  track?: any;
}

/** The Saved Tracks library is shown when no project is selected. */
const SAVED = 'saved';

@Component({
  selector: 'acrylic-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, TrackRowProjectsComponent, HeaderComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent implements OnInit {
  private projectsService = inject(ProjectsService);
  private licenseService = inject(LicenseService);
  private saveTo = inject(SaveToService);
  private toasts = inject(ToastService);
  private transloco = inject(TranslocoService);
  private brandingService = inject(TeamBrandingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  /** Club branding for the page header, same source the dashboard uses. */
  private initialBranding = this.brandingService.getActiveBranding();
  teamName = this.initialBranding.teamName;
  teamLogo = this.initialBranding.teamLogo;
  tagline = this.initialBranding.tagline;
  primaryColor = this.initialBranding.primaryColor;
  secondaryColor = this.initialBranding.secondaryColor;

  readonly sortOptions: ProjectsSort[] = ['recent', 'oldest', 'name'];

  projects: IProjectResult[] = [];
  favorites: IFavoriteResult[] = [];
  private licensedKeys = new Set<string>();

  selectedId: string = SAVED;
  /** Filters the project list in the sidebar. */
  projectQuery = '';
  /** Filters the tracks of the current view. */
  query = '';
  sort: ProjectsSort = 'recent';
  sortMenuOpen = false;
  /** Track keys of the checked rows in the current view. */
  selected = new Set<string>();
  /** Track key whose ••• menu is open. */
  menuFor: string | null = null;

  ngOnInit(): void {
    const branding = this.brandingService.getActiveBranding();
    this.teamName = branding.teamName;
    this.teamLogo = branding.teamLogo;
    this.tagline = branding.tagline;
    this.primaryColor = branding.primaryColor;
    this.secondaryColor = branding.secondaryColor;
    this.brandingService.applyCssVars(branding);

    // "Go to projects" lands here with ?view=<project uuid> or ?view=saved.
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const view = params.get('view') || SAVED;
      if (view !== this.selectedId) { this.applyView(view); }
    });

    this.projectsService.loadFavorites();
    this.projectsService.favorites$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((favs) => {
      this.favorites = favs;
      this.pruneSelection();
    });
    this.licenseService.loadLicenses();
    this.licenseService.licensedTracks$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((tracks) => {
      this.licensedKeys = new Set(tracks.map((t: any) => this.projectsService.trackKey(t)).filter(Boolean));
    });
    this.projectsService.loadProjects();
    this.projectsService.projects$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(projects => {
      this.projects = projects;
      // The open project was deleted elsewhere: fall back to Saved tracks.
      if (this.selectedId !== SAVED && this.projectsService.projectsState === 'ready'
          && !projects.some(p => p.uuid === this.selectedId)) {
        this.selectView(SAVED);
      }
      this.pruneSelection();
    });
  }

  // ─── Views ───────────────────────────────────────────────────

  get isSavedView(): boolean { return this.selectedId === SAVED; }

  get projectsFailed(): boolean { return this.projectsService.projectsState === 'error'; }

  get selectedProject(): IProjectResult | null {
    return this.projects.find(p => p.uuid === this.selectedId) ?? null;
  }

  /** Sidebar list, narrowed by its search box. */
  get visibleProjects(): IProjectResult[] {
    return filterProjects(this.projects, this.projectQuery);
  }

  /**
   * Every track in the current view, before search and sort. Memoized on its
   * inputs so row objects (bound to the row component) keep their identity
   * between change-detection passes.
   */
  get viewTracks(): LibraryRow[] {
    const c = this.viewCache;
    if (c && c.favorites === this.favorites && c.projects === this.projects && c.id === this.selectedId) {
      return c.rows;
    }
    const rows = this.buildViewTracks();
    this.viewCache = { favorites: this.favorites, projects: this.projects, id: this.selectedId, rows };
    return rows;
  }
  private viewCache: { favorites: IFavoriteResult[]; projects: IProjectResult[]; id: string; rows: LibraryRow[] } | null = null;

  private buildViewTracks(): LibraryRow[] {
    if (this.isSavedView) {
      return this.favorites.map(f => ({
        key: this.key(f),
        track_uuid: f.track_uuid,
        track_name: f.track_name,
        artist_name: f.artist_name,
        created: f.created,
        track: f.track,
      }));
    }
    // A project row borrows the rich snapshot its Saved twin already has.
    const snapshots = new Map(this.favorites.map(f => [this.key(f), f.track]));
    return (this.selectedProject?.tracks ?? []).map(t => ({
      key: t.track_uuid,
      track_uuid: t.track_uuid,
      track_name: t.track_name,
      artist_name: t.artist_name,
      created: t.created,
      track: t.track ?? snapshots.get(t.track_uuid),
    }));
  }

  /** What the list shows: the view filtered by the search box and sorted. */
  get visibleTracks(): LibraryRow[] {
    const q = this.normalize(this.query);
    const tracks = q
      ? this.viewTracks.filter(f => this.normalize(`${this.trackName(f)} ${this.artistName(f)}`).includes(q))
      : [...this.viewTracks];
    switch (this.sort) {
      case 'name': return tracks.sort((a, b) => this.trackName(a).localeCompare(this.trackName(b)));
      case 'oldest': return tracks.sort((a, b) => this.time(a) - this.time(b));
      default: return tracks.sort((a, b) => this.time(b) - this.time(a));
    }
  }

  get licensedCount(): number {
    return this.viewTracks.filter(f => this.licensedKeys.has(f.key)).length;
  }

  /** Writes the view to the URL so Back and shared links land on it. */
  selectView(id: string): void {
    if (id === this.selectedId) { return; }
    this.applyView(id);
    this.router.navigate([], { relativeTo: this.route, queryParams: { view: id === SAVED ? null : id }, replaceUrl: true });
  }

  private applyView(id: string): void {
    this.selectedId = id;
    this.query = '';
    this.selected.clear();
    this.menuFor = null;
  }

  // ─── Selection ───────────────────────────────────────────────

  get allVisibleSelected(): boolean {
    const visible = this.visibleTracks;
    return visible.length > 0 && visible.every(f => this.selected.has(f.key));
  }

  toggleAll(): void {
    const visible = this.visibleTracks;
    if (this.allVisibleSelected) {
      visible.forEach(f => this.selected.delete(f.key));
    } else {
      visible.forEach(f => this.selected.add(f.key));
    }
  }

  toggleSelected(row: LibraryRow): void {
    if (this.selected.has(row.key)) { this.selected.delete(row.key); } else { this.selected.add(row.key); }
  }

  isSelected(row: LibraryRow): boolean {
    return this.selected.has(row.key);
  }

  clearSelection(): void {
    this.selected.clear();
  }

  private selectedRows(): LibraryRow[] {
    return this.viewTracks.filter(f => this.selected.has(f.key));
  }

  /** Drop checked rows that left the view (for example, after removing them). */
  private pruneSelection(): void {
    const keys = new Set(this.viewTracks.map(f => f.key));
    this.selected.forEach(k => { if (!keys.has(k)) { this.selected.delete(k); } });
  }

  // ─── Track actions ───────────────────────────────────────────

  toggleMenu(row: LibraryRow, event: Event): void {
    event.stopPropagation();
    this.menuFor = this.menuFor === row.key ? null : row.key;
  }

  /** C1: several checked tracks go through the picker in bulk mode; nothing is removed. */
  async addSelectedTo(): Promise<void> {
    const rows = this.selectedRows();
    if (!rows.length) { return; }
    const result = await this.saveTo.openPicker(rows.map(r => this.ref(r)), rows.length > 1 ? 'bulk' : 'edit');
    if (result) { this.selected.clear(); }
  }

  /** C2: the picker opens on the track's current destinations. */
  editDestinations(row: LibraryRow): void {
    this.menuFor = null;
    this.saveTo.openPicker([this.ref(row)], 'edit');
  }

  /** C3: removing from Saved warns about the projects it also leaves. */
  async removeFromSaved(rows: LibraryRow[]): Promise<void> {
    this.menuFor = null;
    if (await this.saveTo.removeFromSaved(rows.map(r => this.ref(r)))) {
      rows.forEach(r => this.selected.delete(r.key));
    }
  }

  /** D3: removing from a project is instant, with Undo; the tracks stay in Saved. */
  removeFromProject(rows: LibraryRow[]): void {
    this.menuFor = null;
    const project = this.selectedProject;
    if (!project || !rows.length) { return; }
    const uuids = rows.map(r => r.track_uuid);
    const t = (key: string, params?: Record<string, unknown>) => this.transloco.translate(key, params);
    this.projectsService.removeTracksFromProject(project.uuid, uuids).subscribe({
      next: () => {
        rows.forEach(r => this.selected.delete(r.key));
        const undo = () => this.projectsService.addTracksToProject(project.uuid, uuids).subscribe({
          error: () => this.saveTo.showError(t('saveTo.errors.undoFailed'), undo),
        });
        this.toasts.show({
          title: rows.length === 1
            ? t('projects.toast.removedOne', { name: project.name })
            : t('projects.toast.removedMany', { count: rows.length, name: project.name }),
          body: t('projects.toast.staysInSaved'),
          undo,
          actions: [
            { label: t('saveTo.undo'), run: undo, primary: true },
            { label: t('saveTo.dismiss'), run: () => {} },
          ],
        });
      },
      error: () => this.saveTo.showError(t('projects.errors.removeFailed', { name: project.name }), () => this.removeFromProject(rows)),
    });
  }

  removeSelected(): void {
    const rows = this.selectedRows();
    if (this.isSavedView) { this.removeFromSaved(rows); } else { this.removeFromProject(rows); }
  }

  // ─── Projects ────────────────────────────────────────────────

  async newProject(): Promise<void> {
    const project = await this.saveTo.openProjectForm('create');
    if (project) { this.selectView(project.uuid); }
  }

  editProject(): void {
    const project = this.selectedProject;
    if (project) { this.saveTo.openProjectForm('edit', project); }
  }

  /** D3: deleting a project keeps its tracks in Saved tracks. */
  async deleteProject(): Promise<void> {
    const project = this.selectedProject;
    if (!project) { return; }
    const t = (key: string, params?: Record<string, unknown>) => this.transloco.translate(key, params);
    if (SAVE_DESTINATIONS_CONFIG.confirmProjectDelete) {
      const choice = await this.saveTo.ask({
        title: t('projects.delete.title', { name: project.name }),
        body: t('projects.delete.body'),
        cancelLabel: t('saveTo.cancel'),
        confirmLabel: t('projects.delete.confirm'),
      });
      if (choice !== 'confirm') { return; }
    }
    this.projectsService.deleteProject(project.uuid).subscribe({
      next: () => {
        this.selectView(SAVED);
        this.toasts.show({ title: t('projects.toast.deleted', { name: project.name }), body: t('projects.delete.body'), actions: [] });
      },
      error: () => this.saveTo.showError(t('projects.errors.deleteFailed', { name: project.name }), () => this.deleteProject()),
    });
  }

  retryProjects(): void {
    this.projectsService.loadProjects();
  }

  // ─── Sort menu ───────────────────────────────────────────────

  toggleSortMenu(event: Event): void {
    event.stopPropagation();
    this.sortMenuOpen = !this.sortMenuOpen;
  }

  chooseSort(sort: ProjectsSort): void {
    this.sort = sort;
    this.sortMenuOpen = false;
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.sortMenuOpen = false;
    this.menuFor = null;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') { this.closeMenus(); return; }
    // D3: Delete/Backspace removes the checked rows, never while typing or with a dialog open.
    if ((event.key === 'Delete' || event.key === 'Backspace') && this.selected.size && !this.isEditable(event.target)
        && !this.saveTo.picker() && !this.saveTo.form() && !this.saveTo.confirm()) {
      event.preventDefault();
      this.removeSelected();
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────

  key(fav: IFavoriteResult): string {
    return this.projectsService.trackKey(fav) || fav.uuid;
  }

  trackByKey = (_: number, row: LibraryRow) => row.key;

  /**
   * The object to feed the track row.
   * - Optimistic favorites embed the full track object.
   * - Backend favorites may embed nested `track` payloads.
   * - If no rich snapshot exists, render the base row.
   */
  rowTrack(row: LibraryRow): any {
    const candidate = row.track && typeof row.track === 'object' ? row.track : row;
    return candidate?.track && typeof candidate.track === 'object' ? candidate.track : candidate;
  }

  private ref(row: LibraryRow): SaveTrackRef {
    return {
      uuid: row.track_uuid || row.key,
      title: this.trackName(row),
      artist: this.artistName(row),
      snapshot: row.track && typeof row.track === 'object' ? row.track : undefined,
    };
  }

  private trackName(row: LibraryRow): string {
    const track = this.rowTrack(row);
    return (row.track_name || track?.track_name || track?.name || '').toString();
  }

  private artistName(row: LibraryRow): string {
    const track = this.rowTrack(row);
    return (row.artist_name || track?.artist_canonical || track?.artist_name || '').toString();
  }

  private time(row: LibraryRow): number {
    const t = Date.parse(row.created ?? '');
    return Number.isFinite(t) ? t : 0;
  }

  private normalize(text: string): string {
    return (text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  private isEditable(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
  }
}
