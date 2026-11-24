import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

/** What the form hands to whoever sends it. */
export interface FeedbackMessage {
  message: string;
  email: string;
}

/**
 * idle: nothing sent yet; sending: request in flight (button locked);
 * sent: delivered (the form clears); error: failed (text is kept, retry).
 */
export type FeedbackStatus = 'idle' | 'sending' | 'sent' | 'error';

/** Required text that is not only whitespace. */
function notBlank(control: AbstractControl): ValidationErrors | null {
  return (control.value ?? '').toString().trim() ? null : { required: true };
}

/**
 * Questions & Feedback form (Figma: QF / Message field, Reply email field,
 * Send message). Reusable: it only validates and emits `send`; the host does
 * the sending and reports back through `status`.
 */
@Component({
  selector: 'acrylic-feedback-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoModule],
  templateUrl: './feedback-form.component.html',
  styleUrl: './feedback-form.component.scss',
})
export class FeedbackFormComponent {
  private fb = inject(FormBuilder);

  /** Driven by the host while it sends. */
  @Input()
  set status(value: FeedbackStatus) {
    this.currentStatus = value;
    if (value === 'sent') {
      this.form.reset({ message: '', email: this.form.controls.email.value });
      this.submitted = false;
    }
  }
  get status(): FeedbackStatus { return this.currentStatus; }
  private currentStatus: FeedbackStatus = 'idle';

  /** Prefills the reply email (still editable). */
  @Input()
  set email(value: string | null | undefined) {
    if (value && !this.form.controls.email.value) { this.form.controls.email.setValue(value); }
  }

  @Output() send = new EventEmitter<FeedbackMessage>();

  @ViewChild('messageInput') private messageInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('emailInput') private emailInput?: ElementRef<HTMLInputElement>;

  readonly ids = {
    message: `qf-message-${Math.random().toString(36).slice(2, 8)}`,
    email: `qf-email-${Math.random().toString(36).slice(2, 8)}`,
  };

  readonly form = this.fb.nonNullable.group({
    message: ['', [notBlank]],
    email: ['', [notBlank, Validators.email]],
  });

  /** Errors show after the first submit attempt, then update as the user types. */
  submitted = false;

  get messageError(): string | null {
    return this.submitted && this.form.controls.message.invalid ? 'feedback.errors.messageRequired' : null;
  }

  get emailError(): string | null {
    const c = this.form.controls.email;
    if (!this.submitted || c.valid) { return null; }
    return c.hasError('required') ? 'feedback.errors.emailRequired' : 'feedback.errors.emailInvalid';
  }

  get sending(): boolean { return this.status === 'sending'; }

  submit(): void {
    if (this.sending) { return; }  // no duplicate submissions
    this.submitted = true;
    if (this.form.invalid) {
      // Focus the first field that needs attention; its error is announced with it.
      (this.form.controls.message.invalid ? this.messageInput : this.emailInput)?.nativeElement.focus();
      return;
    }
    const { message, email } = this.form.getRawValue();
    this.send.emit({ message: message.trim(), email: email.trim() });
  }
}
