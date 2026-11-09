import { AfterViewInit, Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ConfirmRequest } from '../../../../../services/save-to.service';

/**
 * Confirmation with an optional middle action: Remove from Saved (C3),
 * Delete project (D3). Cancel sits on the left, as in Figma.
 */
@Component({
  selector: 'acrylic-confirm-dialog',
  standalone: true,
  imports: [TranslocoModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent implements AfterViewInit {
  @Input({ required: true }) request!: ConfirmRequest;

  @ViewChild('cancelButton') private cancelButton?: ElementRef<HTMLButtonElement>;

  readonly titleId = `confirm-${Math.random().toString(36).slice(2, 8)}`;

  ngAfterViewInit(): void {
    // The safe choice takes focus first.
    setTimeout(() => this.cancelButton?.nativeElement.focus());
  }

  choose(choice: 'confirm' | 'secondary' | null): void {
    this.request.resolve(choice);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (event.defaultPrevented) { return; }
    event.preventDefault();
    this.choose(null);
  }
}
