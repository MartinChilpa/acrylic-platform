import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../environments/environment';

export interface TeamPlayerDto {
  id: string | number;
  name: string;
  country_code2?: string | null;
}

export interface TeamPlayersResponseDto {
  team_slug?: string;
  players: TeamPlayerDto[];
}

@Injectable({
  providedIn: 'root'
})
export class TeamPlayersService {
  private http = inject(HttpClient);
  private TEAMS_API_URL = `${environment.API_URL}/${environment.VERSION}/teams`;

  getTeamPlayers(teamSlug: string) {
    const slug = (teamSlug ?? '').toString().trim().toLowerCase();
    return this.http.get<TeamPlayersResponseDto>(`${this.TEAMS_API_URL}/${slug}/players/`);
  }

  // Convenience method for the demo club.
  getCfMontrealPlayers() {
    return this.getTeamPlayers('cfmontreal');
  }
}

