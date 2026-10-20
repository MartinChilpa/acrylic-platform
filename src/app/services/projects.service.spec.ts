import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const track = {
    uuid: 'track-1',
    track_name: 'Saved track',
    artist_canonical: 'Saved artist',
    audience_size: 125000,
    spotify_followers: 100000,
    instagram_followers: 25000,
  };
  const favorite = {
    uuid: 'favorite-1',
    track_uuid: 'track-1',
    track,
    isrc: 'ISRC1',
    track_name: 'Saved track',
    artist_name: 'Saved artist',
    cover_image: '',
    created: '2026-09-17T00:00:00Z',
  };

  let service: ProjectsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProjectsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ProjectsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads rich track metrics directly from the favorites API', () => {
    let favorites: any[] = [];
    service.favorites$.subscribe((value) => { favorites = value; });
    service.loadFavorites();
    http.expectOne('/api/v1/my-club/favorites/').flush({ results: [favorite] });

    expect(favorites).toHaveSize(1);
    expect(favorites[0].track.audience_size).toBe(125000);
    expect(favorites[0].track.spotify_followers).toBe(100000);
  });

  it('loads every backend page before publishing the favorites list', () => {
    const secondFavorite = {
      ...favorite,
      uuid: 'favorite-2',
      track_uuid: 'track-2',
      track: { ...track, uuid: 'track-2' },
      isrc: 'ISRC2',
      track_name: 'Second track',
    };
    let favorites: any[] = [];
    service.favorites$.subscribe((value) => { favorites = value; });

    service.loadFavorites();
    http.expectOne('/api/v1/my-club/favorites/').flush({
      count: 2,
      previous: null,
      next: 'https://platform.acrylic.la/api/v1/my-club/favorites/?page=2',
      results: [favorite],
    });
    http.expectOne('/api/v1/my-club/favorites/?page=2').flush({
      count: 2,
      previous: '/api/v1/my-club/favorites/?page=1',
      next: null,
      results: [secondFavorite],
    });

    expect(favorites.map((item) => item.track_uuid)).toEqual(['track-1', 'track-2']);
  });

  it('clears favorites held in memory at the end of the session', () => {
    let favorites: any[] = [];
    service.favorites$.subscribe((value) => { favorites = value; });
    service.loadFavorites();
    http.expectOne('/api/v1/my-club/favorites/').flush({ results: [favorite] });
    service.clear();

    expect(favorites).toEqual([]);
  });

  it('does not store track snapshots in localStorage', () => {
    const setItem = spyOn(Storage.prototype, 'setItem').and.callThrough();
    service.toggleFavorite(track.uuid, track).subscribe();
    http.expectOne('/api/v1/my-club/favorites/toggle/').flush({});
    http.expectOne('/api/v1/my-club/favorites/').flush({ results: [favorite] });

    expect(setItem).not.toHaveBeenCalled();
  });
});
