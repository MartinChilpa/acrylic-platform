import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';

import { TeamBrandingService, TeamBranding } from '../services/team-branding.service';
import { TeamsConfigService } from '../services/teams-config.service';

export const teamBrandingResolver: ResolveFn<TeamBranding> = (route) => {
  const brandingService = inject(TeamBrandingService);
  const teamsConfigService = inject(TeamsConfigService);

  const teamSlug = route.paramMap.get('teamSlug');
  const slug = (teamSlug ?? '').toString().trim().toLowerCase();

  if (!slug) {
    return of(brandingService.getBranding(null));
  }

  brandingService.setActiveTeamSlug(slug);

  return teamsConfigService.getTeamConfig(slug).pipe(
    map((dto) => brandingService.upsertRemoteBrandingFromDto(dto)),
    catchError(() => of(brandingService.getBranding(slug))),
  );
};

