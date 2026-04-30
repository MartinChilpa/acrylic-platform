import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../environments/environment';

export interface TeamConfigDto {
  slug: string;
  team_name: string;
  team_logo_url?: string | null;
  tagline?: string | null;
  colors?: {
    primary?: string | null;
    secondary?: string | null;
  } | null;
  auth_promo?: {
    image_url?: string | null;
    image_alt?: string | null;
    tagline?: string | null;
  } | null;
  sidenav?: {
    background?: string | null;
    border?: string | null;
    active_background?: string | null;
    active_border?: string | null;
    text?: string | null;
    muted_text?: string | null;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class TeamsConfigService {
  private http = inject(HttpClient);
  private TEAMS_API_URL = `${environment.API_URL}/${environment.VERSION}/teams`;

  getTeamConfig(teamSlug: string) {
    const slug = (teamSlug ?? '').toString().trim().toLowerCase();
    return this.http.get<TeamConfigDto>(`${this.TEAMS_API_URL}/${slug}/config/`);
  }
}
