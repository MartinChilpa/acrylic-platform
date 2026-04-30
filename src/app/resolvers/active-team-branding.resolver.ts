import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';

import { TeamBranding, TeamBrandingService } from '../services/team-branding.service';
import { TeamsConfigService } from '../services/teams-config.service';

export const activeTeamBrandingResolver: ResolveFn<TeamBranding> = () => {
  const brandingService = inject(TeamBrandingService);
  const teamsConfigService = inject(TeamsConfigService);

  const slug = brandingService.getActiveTeamSlug();

  return teamsConfigService.getTeamConfig(slug).pipe(
    map((dto) => brandingService.upsertRemoteBrandingFromDto(dto)),
    catchError(() => of(brandingService.getBranding(slug))),
  );
};

