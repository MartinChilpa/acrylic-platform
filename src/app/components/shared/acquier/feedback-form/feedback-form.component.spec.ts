import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { FeedbackFormComponent, FeedbackMessage } from './feedback-form.component';

describe('FeedbackFormComponent', () => {
  let fixture: ComponentFixture<FeedbackFormComponent>;
  let component: FeedbackFormComponent;
  let sent: FeedbackMessage[];
  const el = () => fixture.nativeElement as HTMLElement;
  const textarea = () => el().querySelector('textarea') as HTMLTextAreaElement;
  const emailInput = () => el().querySelector('input[type=email]') as HTMLInputElement;
  // The testing loader has no strings, so Transloco prints the key (prefixed with the language).
  const errors = () => Array.from(el().querySelectorAll('.qf-field__error')).map(e => e.textContent!.trim().replace(/^en\./, ''));

  const type = (input: HTMLInputElement | HTMLTextAreaElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const submit = () => {
    (el().querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FeedbackFormComponent, TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { defaultLang: 'en' } })],
    });
    fixture = TestBed.createComponent(FeedbackFormComponent);
    component = fixture.componentInstance;
    sent = [];
    component.send.subscribe((m: FeedbackMessage) => sent.push(m));
    fixture.detectChanges();
  });

  it('shows no errors before the first submit', () => {
    expect(errors()).toEqual([]);
  });

  it('requires a message and focuses it first', () => {
    submit();

    expect(sent).toEqual([]);
    expect(errors()).toEqual(['feedback.errors.messageRequired', 'feedback.errors.emailRequired']);
    expect(document.activeElement).toBe(textarea());
    expect(textarea().getAttribute('aria-invalid')).toBe('true');
    expect(textarea().getAttribute('aria-describedby')).toContain('-error');
  });

  it('treats a whitespace-only message as empty', () => {
    type(textarea(), '   ');
    type(emailInput(), 'me@club.com');
    submit();

    expect(sent).toEqual([]);
    expect(errors()).toEqual(['feedback.errors.messageRequired']);
  });

  it('rejects an invalid email and focuses that field', () => {
    type(textarea(), 'Hello');
    type(emailInput(), 'not-an-email');
    submit();

    expect(sent).toEqual([]);
    expect(errors()).toEqual(['feedback.errors.emailInvalid']);
    expect(document.activeElement).toBe(emailInput());
  });

  it('emits the trimmed message and email when valid', () => {
    type(textarea(), '  Need help with a license  ');
    type(emailInput(), ' me@club.com ');
    submit();

    expect(sent).toEqual([{ message: 'Need help with a license', email: 'me@club.com' }]);
    expect(errors()).toEqual([]);
  });

  it('does not submit twice while sending', () => {
    type(textarea(), 'Hello');
    type(emailInput(), 'me@club.com');
    component.status = 'sending';
    fixture.detectChanges();
    submit();

    expect(sent).toEqual([]);
    expect((el().querySelector('button[type=submit]') as HTMLButtonElement).disabled).toBeTrue();
  });

  it('keeps the text when sending fails and clears the message once sent', () => {
    type(textarea(), 'Hello');
    type(emailInput(), 'me@club.com');
    submit();

    component.status = 'error';
    fixture.detectChanges();
    expect(textarea().value).toBe('Hello');
    expect(el().querySelector('[role=status]')!.textContent).toContain('feedback.sendFailed');

    component.status = 'sent';
    fixture.detectChanges();
    expect(textarea().value).toBe('');
    expect(emailInput().value).toBe('me@club.com');
  });
});
