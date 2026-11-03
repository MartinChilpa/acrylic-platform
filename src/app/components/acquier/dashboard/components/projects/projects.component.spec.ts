import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { IFavoriteResult } from '../../../../../interfaces/response/projects.response';
import { ProjectsService } from '../../../../../services/projects.service';
import { TeamBrandingService } from '../../../../../services/team-branding.service';
import { ProjectsComponent } from './projects.component';

describe('ProjectsComponent pagination', () => {
  let favorites$: BehaviorSubject<IFavoriteResult[]>;
  let component: ProjectsComponent;

  const makeFavorite = (index: number): IFavoriteResult => ({
    uuid: `favorite-${index}`,
    track_uuid: `track-${index}`,
    isrc: `isrc-${index}`,
    track_name: `Track ${index}`,
    artist_name: 'Artist',
    cover_image: '',
    created: '2026-10-19T00:00:00Z',
  });

  beforeEach(() => {
    favorites$ = new BehaviorSubject<IFavoriteResult[]>([]);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProjectsService,
          useValue: {
            favorites$: favorites$.asObservable(),
            loadFavorites: () => undefined,
          },
        },
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

  it('keeps the tracks visible and limits each page to ten rows', () => {
    favorites$.next(Array.from({ length: 23 }, (_, index) => makeFavorite(index + 1)));

    expect(component.favorites).toHaveSize(23);
    expect(component.visibleFavorites).toHaveSize(10);
    expect(component.visibleFavorites[0].track_uuid).toBe('track-1');
    expect(component.favoritesTotalPages).toBe(3);

    component.goToNextFavoritesPage();

    expect(component.favoritesPageNumber).toBe(2);
    expect(component.visibleFavorites[0].track_uuid).toBe('track-11');
  });

  it('clamps the page after removing the final track on the last page', () => {
    favorites$.next(Array.from({ length: 11 }, (_, index) => makeFavorite(index + 1)));
    component.goToNextFavoritesPage();
    expect(component.visibleFavorites).toHaveSize(1);

    favorites$.next(Array.from({ length: 10 }, (_, index) => makeFavorite(index + 1)));

    expect(component.favoritesPageNumber).toBe(1);
    expect(component.visibleFavorites).toHaveSize(10);
  });
});
