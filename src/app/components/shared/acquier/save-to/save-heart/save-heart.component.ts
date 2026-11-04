import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { SaveToService, SaveTrackRef } from '../../../../../services/save-to.service';
import { ProjectsService } from '../../../../../services/projects.service';

/**
 * E: the single save control on a track row. Clicking an unsaved heart likes
 * it (saves to Saved tracks at once) and opens a small menu anchored to it:
 * "Add to projects" opens the shared picker, and a saved track can also be
 * removed from Saved. Filled when the track is saved.
 */
@Component({
  selector: 'acrylic-save-heart',
  standalone: true,
  imports: [TranslocoModule],
  templateUrl: './save-heart.component.html',
  styleUrl: './save-heart.component.scss',
})
export class SaveHeartComponent {
  @Input({ required: true }) track!: SaveTrackRef;
  @Input() saved = false;
  /** Visual size of the square button, matching the row it sits in. */
  @Input() size: 'sm' | 'md' = 'md';
  /** Fires when the menu opens (analytics). */
  @Output() opened = new EventEmitter<void>();

  private saveTo = inject(SaveToService);
  private projectsService = inject(ProjectsService);
  private transloco = inject(TranslocoService);
  private host: ElementRef<HTMLElement> = inject(ElementRef);

  open = false;
  /** This click saved the track: the menu confirms it. */
  justSaved = false;
  readonly menuId = `save-heart-${Math.random().toString(36).slice(2, 8)}`;

  toggle(event: Event): void {
    event.stopPropagation();
    // Like = save: an unsaved track goes to Saved tracks right away, and the
    // menu opens so it can also go to projects.
    this.justSaved = false;
    if (!this.saved && !this.open) {
      this.justSaved = true;
      this.projectsService.addFavorite(this.track.uuid, this.track.snapshot).subscribe({
        error: () => {
          this.justSaved = false;
          this.open = false;
          this.saveTo.showError(this.transloco.translate('saveTo.errors.likeFailed'), () => this.toggle(new Event('click')));
        },
      });
    }
    this.open = !this.open;
    if (this.open) {
      this.opened.emit();
      setTimeout(() => this.host.nativeElement.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus());
    }
  }

  addToProjects(): void {
    this.open = false;
    this.saveTo.openPicker([this.track]);
  }

  removeFromSaved(): void {
    this.open = false;
    this.saveTo.removeFromSaved(this.track);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.open && !this.host.nativeElement.contains(event.target as Node)) { this.open = false; }
  }

  @HostListener('keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.open) { return; }
    event.stopPropagation();
    this.open = false;
    this.host.nativeElement.querySelector<HTMLButtonElement>('.save-heart__button')?.focus();
  }
}
