import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SimilarityUrlService, normalizeSpotifyTrackUrl } from './similarity-url.service';

describe('SimilarityUrlService', () => {
  let service: SimilarityUrlService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SimilarityUrlService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('removes Spotify locale segments from track URLs', () => {
    expect(normalizeSpotifyTrackUrl(
      'https://open.spotify.com/intl-es/track/6CLdnyg83r7ZRjLhiSykyK?si=abc123'
    )).toBe(
      'https://open.spotify.com/track/6CLdnyg83r7ZRjLhiSykyK?si=abc123'
    );
  });

  it('leaves canonical Spotify and non-Spotify URLs unchanged', () => {
    const spotify = 'https://open.spotify.com/track/6CLdnyg83r7ZRjLhiSykyK';
    const youtube = 'https://www.youtube.com/watch?v=123';

    expect(normalizeSpotifyTrackUrl(spotify)).toBe(spotify);
    expect(normalizeSpotifyTrackUrl(youtube)).toBe(youtube);
  });

  it('sends the canonical Spotify URL to AIMS', () => {
    service.searchSimilarityByUrl(
      'https://open.spotify.com/intl-fr/track/6CLdnyg83r7ZRjLhiSykyK',
      2,
      20
    ).subscribe();

    const request = http.expectOne('/api/v1/aims/similarity/');
    expect(request.request.body).toEqual({
      youtube_url: 'https://open.spotify.com/track/6CLdnyg83r7ZRjLhiSykyK',
      link: 'https://open.spotify.com/track/6CLdnyg83r7ZRjLhiSykyK',
      page: 2,
      page_size: 20,
    });
    request.flush([]);
  });
});
