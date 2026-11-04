import { AfterViewInit, Component, DestroyRef, ElementRef, HostListener, Input, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { IProjectResult, ITrackDestinations } from '../../../../../interfaces/response/projects.response';
import { ProjectsService } from '../../../../../services/projects.service';
import { PickerRequest, SaveToService } from '../../../../../services/save-to.service';
import {
  EMPTY_SELECTION,
  PickerSelection,
  buildRequest,
  canSubmit,
  filterProjects,
  initialSelection,
  isSavedLocked,
  selectProject,
  summaryKey,
  toggleProject,
  toggleSaved,
} from '../../../../../utils/save-to-picker.state';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Save to… picker shared by Audience Search, Projects and Home.
 * Modes: single (A4–A6), bulk (C1), edit (C2).
 */
@Component({
  selector: 'acrylic-save-to-picker',
  standalone: true,
  imports: [FormsModule, TranslocoModule],
  templateUrl: './save-to-picker.component.html',
  styleUrl: './save-to-picker.component.scss',
})
export class SaveToPickerComponent implements OnInit, AfterViewInit {
  @Input({ required: true }) request!: PickerRequest;

  private projectsService = inject(ProjectsService);
  private saveTo = inject(SaveToService);
  private transloco = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('panel') private panel?: ElementRef<HTMLElement>;
  @ViewChild('createButton') private createButton?: ElementRef<HTMLButtonElement>;

  projects: IProjectResult[] = [];
  query = '';

  /** Where each track is now; needed for edit mode and for Undo. */
  loadState: LoadState = 'loading';
  private current: ITrackDestinations[] = [];

  selection: PickerSelection = EMPTY_SELECTION;
  private initial: PickerSelection = EMPTY_SELECTION;

  saving = false;
  saveFailed = false;

  readonly titleId = `save-to-title-${Math.random().toString(36).slice(2, 8)}`;

  ngOnInit(): void {
    this.projectsService.projects$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(projects => {
      this.projects = projects;
    });
    this.loadDestinations();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.panel?.nativeElement.focus());
  }

  loadDestinations(): void {
    this.loadState = 'loading';
    this.projectsService.getDestinations(this.request.tracks.map(t => t.uuid))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: destinations => {
          this.current = destinations;
          this.initial = initialSelection(this.request.mode, destinations[0]);
          this.selection = this.initial;
          this.loadState = 'ready';
        },
        error: () => { this.loadState = 'error'; },
      });
  }

  // ─── View helpers ────────────────────────────────────────────

  get mode() { return this.request.mode; }
  get tracks() { return this.request.tracks; }
  get firstTrack() { return this.request.tracks[0]; }

  get visibleProjects(): IProjectResult[] {
    return filterProjects(this.projects, this.query);
  }

  get savedLocked(): boolean {
    return isSavedLocked(this.selection);
  }

  get canSubmit(): boolean {
    return this.loadState === 'ready' && !this.saving && canSubmit(this.mode, this.selection, this.initial);
  }

  get summary(): string {
    const { key, params } = summaryKey(this.selection);
    return this.transloco.translate(key, params);
  }

  /** "Hommage…, Sans Pression and 3 more" for the bulk header. */
  get bulkNames(): string {
    const names = this.tracks.map(t => t.title).filter(Boolean);
    const shown = names.slice(0, 2).join(', ');
    const rest = names.length - 2;
    return rest > 0 ? this.transloco.translate('saveTo.andMore', { names: shown, count: rest }) : shown;
  }

  isChecked(project: IProjectResult): boolean {
    return this.selection.projects.has(project.uuid);
  }

  // ─── Choices ─────────────────────────────────────────────────

  onToggleSaved(): void {
    this.selection = toggleSaved(this.selection);
    this.saveFailed = false;
  }

  onToggleProject(project: IProjectResult): void {
    this.selection = toggleProject(this.selection, project.uuid);
    this.saveFailed = false;
  }

  clearSearch(): void {
    this.query = '';
  }

  /** B1: the new project comes back checked; saving still needs Add track. */
  async createProject(): Promise<void> {
    const project = await this.saveTo.openProjectForm('create');
    if (project) {
      this.selection = selectProject(this.selection, project.uuid);
      this.query = '';
    }
    setTimeout(() => this.createButton?.nativeElement.focus());
  }

  // ─── Submit ──────────────────────────────────────────────────

  submit(): void {
    if (!this.canSubmit) { return; }
    this.saving = true;
    this.saveFailed = false;
    const { mode, items } = buildRequest(this.mode, this.tracks.map(t => t.uuid), this.selection);
    const selection = this.selection;
    const previous = this.current;
    this.projectsService.applyDestinations(mode, items).subscribe({
      next: result => {
        this.saving = false;
        this.saveTo.notifySaved(this.mode, this.tracks, selection, previous);
        this.request.resolve(result);
      },
      // D2: the choices stay as they are; the user can retry or cancel.
      error: () => {
        this.saving = false;
        this.saveFailed = true;
      },
    });
  }

  cancel(): void {
    if (this.saving) { return; }
    this.request.resolve(null);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    // A dialog opened above the picker handles its own Escape.
    if (event.defaultPrevented || this.saveTo.form() || this.saveTo.confirm()) { return; }
    event.preventDefault();
    this.cancel();
  }
}
