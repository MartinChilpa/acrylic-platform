import { Component, EventEmitter, HostListener, Input, Output, SimpleChanges, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { TeamBrandingService } from '../../../../../../services/team-branding.service';

export interface TeamPlayerOption {
  id: string;
  name: string;
  countryCode2?: string | null;
}

@Component({
  selector: 'acrylic-team-player-optimization',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './team-player-optimization.component.html',
  styleUrl: './team-player-optimization.component.scss'
})
export class TeamPlayerOptimizationComponent {
  @Input() totalCount: number = 0;
  @Input() label: string = '';
  @Input() players: TeamPlayerOption[] = [];
  @Input() resetKey = 0;
  // Team slugs that should show "Countries…" instead of "Player…"
  @Input() countriesLabelTeamSlugs: string[] = ['lfp'];

  @Output() optionSelected = new EventEmitter<string>();

  private brandingService = inject(TeamBrandingService);

  isOpen = false;
  selectedMode: 'team' | 'player' | null = null;
  selectedPlayer: TeamPlayerOption | null = null;

  get selectedOptimizationLabel(): string | null {
    if (this.selectedMode === 'team') {
      return 'Team';
    }
    if (this.selectedMode === 'player' && this.selectedPlayer) {
      return this.selectedPlayer.name;
    }
    return null;
  }

  get formattedLabel(): { prefix: string; value: string; suffix: string; quoted: boolean } {
    const value = (this.label ?? '').toString().trim();
    const isUrl = /^https?:\/\//i.test(value);
    return {
      prefix: `${this.totalCount} Results for `,
      value,
      suffix: '',
      quoted: !isUrl,
    };
  }

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetKey'] && !changes['resetKey'].firstChange) {
      this.selectedMode = null;
      this.selectedPlayer = null;
    }
  }

  get activeTeamName(): string {
    return this.brandingService.getActiveBranding().teamName || 'Team';
  }

  get useCountriesLabel(): boolean {
    const slug = this.brandingService.getActiveTeamSlug();
    const allowed = new Set((this.countriesLabelTeamSlugs ?? []).map((s) => (s ?? '').toString().trim().toLowerCase()).filter(Boolean));
    return allowed.has((slug ?? '').toString().trim().toLowerCase());
  }

  setMode(mode: 'team' | 'player'): void {
    this.selectedMode = mode;
    if (mode === 'team') {
      this.selectedPlayer = null;
      this.optionSelected.emit('team');
      this.isOpen = false;
      return;
    }
  }

  selectPlayer(player: TeamPlayerOption): void {
    this.selectedMode = 'player';
    this.selectedPlayer = player;
    this.optionSelected.emit(player?.id ?? '');
    this.isOpen = false;
  }

  clearOptimization(): void {
    this.selectedMode = null;
    this.selectedPlayer = null;
    this.optionSelected.emit('');
    this.isOpen = false;
  }

  toFlagEmoji(code2: string | null | undefined): string {
    if (!code2 || code2.length !== 2) {
      return '';
    }
    const code = code2.toUpperCase();
    const first = code.charCodeAt(0);
    const second = code.charCodeAt(1);
    const isAtoZ = (value: number) => value >= 65 && value <= 90;
    if (!isAtoZ(first) || !isAtoZ(second)) {
      return '';
    }
    const OFFSET = 0x1f1e6 - 65;
    return String.fromCodePoint(first + OFFSET, second + OFFSET);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.tpo')) return;
    this.isOpen = false;
  }
}
