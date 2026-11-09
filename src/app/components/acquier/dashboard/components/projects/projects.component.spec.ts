import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { BehaviorSubject, of } from 'rxjs';

import { IFavoriteResult, IProjectResult } from '../../../../../interfaces/response/projects.response';
import { LicenseService } from '../../../../../services/license.service';
import { ProjectsService } from '../../../../../services/projects.service';
import { SaveToService } from '../../../../../services/save-to.service';
import { TeamBrandingService } from '../../../../../services/team-branding.service';
import { ToastService } from '../../../../../services/toast.service';
import { ProjectsComponent } from './projects.component';

describe('ProjectsComponent pagination', () => {
  let favorites$: BehaviorSubject<IFavoriteResult[]>;
  let component: ProjectsComponent;

  // Newest first, so the default "recent" sort keeps track-1 at the top.
  const makeFavorite = (index: number): IFavoriteResult => ({
    uuid: `favorite-${index}`,
    track_uuid: `track-${index}`,
    isrc: `isrc-${index}`,
    track_name: `Track ${index}`,
    artist_name: 'Artist',
    cover_image: '',
    created: new Date(Date.UTC(2026, 9, 19) - index * 60_000).toISOString(),
  });
  const favorites = (count: number) => Array.from({ length: count }, (_, i) => makeFavorite(i + 1));

  beforeEach(() => {
    favorites$ = new BehaviorSubject<IFavoriteResult[]>([]);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProjectsService,
          useValue: {
            favorites$: favorites$.asObservable(),
            projects$: new BehaviorSubject<IProjectResult[]>([]).asObservable(),
            projectsState: 'ready',
            loadFavorites: () => undefined,
            loadProjects: () => undefined,
            trackKey: (f: IFavoriteResult) => f.track_uuid,
          },
        },
        { provide: LicenseService, useValue: { loadLicenses: () => undefined, licensedTracks$: of([]) } },
        { provide: SaveToService, useValue: {} },
        { provide: ToastService, useValue: {} },
        { provide: TranslocoService, useValue: { translate: (key: string) => key } },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({})) } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        {
          provide: TeamBrandingService,
          useValue: {
            getActiveBranding: () => ({
              teamName: 'Club',
              teamLogo: '',
              tagline: '',
              primaryColor: '#000000',
              secondaryColor: '#ffffff',
            }),
            applyCssVars: () => undefined,
          },
        },
      ],
    });

    component = TestBed.runInInjectionContext(() => new ProjectsComponent());
    component.ngOnInit();
  });

  it('limits each page to ten rows', () => {
    favorites$.next(favorites(23));

    expect(component.visibleTracks).toHaveSize(23);
    expect(component.pageTracks).toHaveSize(10);
    expect(component.pageTracks[0].track_uuid).toBe('track-1');
    expect(component.totalPages).toBe(3);

    component.nextPage();

    expect(component.currentPage).toBe(2);
    expect(component.pageTracks[0].track_uuid).toBe('track-11');
  });

  it('falls back to the last page after removing its final track', () => {
    favorites$.next(favorites(11));
    component.nextPage();
    expect(component.pageTracks).toHaveSize(1);

    favorites$.next(favorites(10));

    expect(component.currentPage).toBe(1);
    expect(component.pageTracks).toHaveSize(10);
  });

  it('goes back to the first page when the search changes', () => {
    favorites$.next(favorites(23));
    component.nextPage();
    component.nextPage();

    component.query = 'Track 2';
    component.onQueryChange();

    expect(component.currentPage).toBe(1);
  });
});
