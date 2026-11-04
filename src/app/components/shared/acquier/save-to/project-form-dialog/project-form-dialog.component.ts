import { AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoModule } from '@jsverse/transloco';
import { ProjectsService } from '../../../../../services/projects.service';
import { ProjectFormRequest, SaveToService } from '../../../../../services/save-to.service';
import { SAVE_DESTINATIONS_CONFIG } from '../../../../../constants/save-destinations.config';
import { isDuplicateName } from '../../../../../utils/save-to-picker.state';

type NameError = 'required' | 'duplicate' | null;

/** New project (B1, D1) and Edit project (B3): name required and unique, description optional. */
@Component({
  selector: 'acrylic-project-form-dialog',
  standalone: true,
  imports: [FormsModule, TranslocoModule],
  templateUrl: './project-form-dialog.component.html',
  styleUrl: './project-form-dialog.component.scss',
})
export class ProjectFormDialogComponent implements OnInit, AfterViewInit {
  @Input({ required: true }) request!: ProjectFormRequest;

  private projectsService = inject(ProjectsService);
  private saveTo = inject(SaveToService);

  @ViewChild('nameInput') private nameInput?: ElementRef<HTMLInputElement>;

  readonly maxLength = SAVE_DESTINATIONS_CONFIG.projectNameMaxLength;
  readonly titleId = `project-form-${Math.random().toString(36).slice(2, 8)}`;

  name = '';
  description = '';
  /** The name field was left or a submit was tried: show the required message. */
  touched = false;
  /** The backend refused the name as taken (another session created it meanwhile). */
  serverDuplicate: string | null = null;
  busy = false;
  failed = false;

  ngOnInit(): void {
    if (this.request.project) {
      this.name = this.request.project.name;
      this.description = this.request.project.description ?? '';
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.nameInput?.nativeElement.focus());
  }

  get isEdit(): boolean { return this.request.mode === 'edit'; }

  get nameError(): NameError {
    const name = this.name.trim();
    if (!name) { return 'required'; }
    const taken = isDuplicateName(name, this.projectsService.projects, this.request.project?.uuid)
      || (this.serverDuplicate !== null && this.serverDuplicate.toLowerCase() === name.toLowerCase());
    return taken ? 'duplicate' : null;
  }

  /** Required shows once the user has interacted; duplicate shows right away. */
  get visibleError(): NameError {
    const error = this.nameError;
    return error === 'required' && !this.touched ? null : error;
  }

  get unchanged(): boolean {
    const p = this.request.project;
    return !!p && p.name === this.name.trim() && (p.description ?? '') === this.description.trim();
  }

  get canSubmit(): boolean {
    return !this.busy && !this.nameError && !(this.isEdit && this.unchanged);
  }

  submit(): void {
    this.touched = true;
    if (!this.canSubmit) { return; }
    this.busy = true;
    this.failed = false;
    const name = this.name.trim();
    const description = this.description.trim();
    const call = this.isEdit
      ? this.projectsService.updateProject(this.request.project!.uuid, { name, description })
      : this.projectsService.createProject(name, description);
    call.subscribe({
      next: project => {
        this.busy = false;
        this.request.resolve(project);
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        const nameErrors = err?.error?.name;
        if (err?.status === 400 && Array.isArray(nameErrors) && String(nameErrors[0]).includes('already exists')) {
          this.serverDuplicate = name;
        } else {
          this.failed = true;
        }
      },
    });
  }

  cancel(): void {
    if (this.busy) { return; }
    this.request.resolve(null);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (event.defaultPrevented || this.saveTo.confirm()) { return; }
    // Tells the picker underneath that this Escape is handled.
    event.preventDefault();
    this.cancel();
  }
}
