import { Component, OnInit, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { HeaderComponent } from '../../../../shared/acquier/header/header.component';
import {
  FeedbackFormComponent,
  FeedbackMessage,
  FeedbackStatus,
} from '../../../../shared/acquier/feedback-form/feedback-form.component';
import { TeamBrandingService } from '../../../../../services/team-branding.service';

/**
 * Questions & Feedback tab (Figma 2688:53511 · "Direct form").
 * Frontend only for now: who receives the messages is still a team decision,
 * so `onSend` is where the sending call goes once that exists.
 */
@Component({
  selector: 'acrylic-questions-feedback',
  standalone: true,
  imports: [TranslocoModule, HeaderComponent, FeedbackFormComponent],
  templateUrl: './questions-feedback.component.html',
  styleUrl: './questions-feedback.component.scss',
})
export class QuestionsFeedbackComponent implements OnInit {
  private brandingService = inject(TeamBrandingService);

  /** Club branding for the page header, same source the other tabs use. */
  private initialBranding = this.brandingService.getActiveBranding();
  teamName = this.initialBranding.teamName;
  teamLogo = this.initialBranding.teamLogo;
  tagline = this.initialBranding.tagline;
  primaryColor = this.initialBranding.primaryColor;
  secondaryColor = this.initialBranding.secondaryColor;

  status: FeedbackStatus = 'idle';

  ngOnInit(): void {
    this.brandingService.applyCssVars(this.initialBranding);
  }

  /**
   * The form has validated the message and email. Sending is not wired yet
   * (no backend for it); when it is: set status to 'sending', then 'sent' on
   * success or 'error' on failure (the form keeps the text for a retry).
   */
  onSend(_message: FeedbackMessage): void {}
}
