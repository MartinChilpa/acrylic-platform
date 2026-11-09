import { Component, HostListener, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ToastService } from '../../../../services/toast.service';
import { SAVE_DESTINATIONS_CONFIG } from '../../../../constants/save-destinations.config';

@Component({
  selector: 'acrylic-toast-host',
  standalone: true,
  imports: [TranslocoModule],
  templateUrl: './toast-host.component.html',
  styleUrl: './toast-host.component.scss',
})
export class ToastHostComponent {
  readonly toasts = inject(ToastService);

  /** Cmd/Ctrl+Z undoes the toast's action; never while typing in a field. */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!SAVE_DESTINATIONS_CONFIG.undoShortcutEnabled) { return; }
    if (event.key.toLowerCase() !== 'z' || !(event.metaKey || event.ctrlKey) || event.shiftKey) { return; }
    if (isEditable(event.target)) { return; }
    if (this.toasts.undo()) { event.preventDefault(); }
  }
}

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) { return false; }
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}
