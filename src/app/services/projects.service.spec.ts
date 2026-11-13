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

  it('creates a project with its name and description', () => {
    service.createProject('Matchday playlist', 'Tracks para partidos en casa').subscribe();

    const request = http.expectOne('/api/v1/my-club/projects/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Matchday playlist',
      description: 'Tracks para partidos en casa',
    });
    request.flush({
      uuid: 'project-uuid',
      name: 'Matchday playlist',
      description: 'Tracks para partidos en casa',
      track_count: 0,
      tracks: [],
      created: '2026-11-11T00:00:00Z',
      updated: '2026-11-11T00:00:00Z',
    });
  });

  it('lists projects and normalizes their nested saved tracks', () => {
    let projects: any[] = [];
    service.projects$.subscribe(value => { projects = value; });

    service.loadProjects();
    const request = http.expectOne('/api/v1/my-club/projects/');
    expect(request.request.method).toBe('GET');
    request.flush({
      count: 1,
      results: [{
        uuid: 'project-uuid',
        name: 'Matchday playlist',
        description: 'Tracks para partidos en casa',
        track_count: 1,
        tracks: [{
          uuid: 'project-track-uuid',
          track: { track_uuid: 'saved-track-uuid', track_name: 'Nombre del track' },
          created: '2026-11-11T00:00:00Z',
        }],
        created: '2026-11-11T00:00:00Z',
        updated: '2026-11-11T00:00:00Z',
      }],
    });

    expect(projects[0].tracks[0].track_uuid).toBe('saved-track-uuid');
    expect(projects[0].tracks[0].track_name).toBe('Nombre del track');
  });

  it('adds a saved track through the project tracks endpoint', () => {
    service.addTrackToProject('project-uuid', 'saved-track-uuid').subscribe();

    const request = http.expectOne('/api/v1/my-club/projects/project-uuid/tracks/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ track_uuid: 'saved-track-uuid' });
    request.flush({ uuid: 'project-track-uuid' });

    http.expectOne('/api/v1/my-club/projects/').flush({ count: 0, results: [] });
    http.expectOne('/api/v1/my-club/favorites/').flush({ results: [] });
  });
});
