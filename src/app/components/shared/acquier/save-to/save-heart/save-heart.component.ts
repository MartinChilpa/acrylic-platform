import { Component, Input, inject } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { SaveToService, SaveTrackRef } from '../../../../../services/save-to.service';
import { ProjectsService } from '../../../../../services/projects.service';

/**
 * The save control on a track row. Clicking it directly toggles the track in
 * Saved tracks; it does not open a secondary action menu.
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
  private saveTo = inject(SaveToService);
  private projectsService = inject(ProjectsService);
  private transloco = inject(TranslocoService);

  saving = false;

  toggle(event: Event): void {
    event.stopPropagation();
    if (this.saving || !this.track.uuid) { return; }

    this.saving = true;
    this.projectsService.toggleFavorite(this.track.uuid, this.track.snapshot).subscribe({
      next: () => { this.saving = false; },
      error: () => {
        this.saving = false;
        this.saveTo.showError(this.transloco.translate('saveTo.errors.likeFailed'), () => this.toggle(new Event('click')));
      },
    });
  }
}
