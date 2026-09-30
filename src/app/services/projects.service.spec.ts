import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const snapshotsStoragePrefix = 'acrylic.favoriteTrackSnapshots';
  const snapshotsScopeKey = 'acrylic.favoriteTrackSnapshots.scope';
  const accountScope = 'account-1';
  const accountStorageKey = `${snapshotsStoragePrefix}.${accountScope}`;
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
    track: 'track-1',
    isrc: 'ISRC1',
    track_name: 'Saved track',
    artist_name: 'Saved artist',
    cover_image: '',
    created: '2026-09-17T00:00:00Z',
  };

  let service: ProjectsService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(snapshotsStoragePrefix);
    localStorage.removeItem(snapshotsScopeKey);
    localStorage.removeItem(accountStorageKey);
    localStorage.removeItem(`${snapshotsStoragePrefix}.account-2`);
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
    localStorage.removeItem(snapshotsStoragePrefix);
    localStorage.removeItem(snapshotsScopeKey);
    localStorage.removeItem(accountStorageKey);
    localStorage.removeItem(`${snapshotsStoragePrefix}.account-2`);
  });

  it('restores rich track metrics after signing out and back into the same account', () => {
    service.setSnapshotScope(accountScope);
    service.toggleFavorite(track.uuid, track).subscribe();

    http.expectOne('/api/v1/my-club/favorites/toggle/').flush({});
    http.expectOne('/api/v1/my-club/favorites/').flush({ results: [favorite] });

    service.clear();
    service.setSnapshotScope(accountScope);

    let favorites: any[] = [];
    service.favorites$.subscribe((value) => { favorites = value; });
    service.loadFavorites();
    http.expectOne('/api/v1/my-club/favorites/').flush({ results: [favorite] });

    expect(favorites).toHaveSize(1);
    expect(favorites[0].track.audience_size).toBe(125000);
    expect(favorites[0].track.spotify_followers).toBe(100000);
  });

  it('does not turn a cached snapshot into a favorite when the backend returns none', () => {
    service.setSnapshotScope(accountScope);
    localStorage.setItem(accountStorageKey, JSON.stringify({ [track.uuid]: track }));

    let favorites: any[] = [];
    service.favorites$.subscribe((value) => { favorites = value; });
    service.loadFavorites();
    http.expectOne('/api/v1/my-club/favorites/').flush({ results: [] });

    expect(favorites).toEqual([]);
    expect(localStorage.getItem(accountStorageKey)).toBeNull();
  });

  it('keeps persisted snapshots when clearing the live session', () => {
    service.setSnapshotScope(accountScope);
    localStorage.setItem(accountStorageKey, JSON.stringify({ [track.uuid]: track }));

    service.clear();

    expect(localStorage.getItem(accountStorageKey)).not.toBeNull();
  });

  it('does not expose one account snapshot to another account', () => {
    service.setSnapshotScope(accountScope);
    localStorage.setItem(accountStorageKey, JSON.stringify({ [track.uuid]: track }));

    service.clear();
    service.setSnapshotScope('account-2');

    let favorites: any[] = [];
    service.favorites$.subscribe((value) => { favorites = value; });
    service.loadFavorites();
    http.expectOne('/api/v1/my-club/favorites/').flush({ results: [favorite] });

    expect(favorites).toHaveSize(1);
    expect(favorites[0].track).toBe('track-1');
  });
});
