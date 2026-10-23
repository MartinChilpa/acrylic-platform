import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PublishedLinkDetectionError, TrackPublishedLinksService } from './track-published-links.service';

describe('TrackPublishedLinksService', () => {
  let service: TrackPublishedLinksService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TrackPublishedLinksService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TrackPublishedLinksService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('detects every platform accepted by the backend', () => {
    expect(service.detect('https://www.instagram.com/reel/abc/').platform).toBe('instagram');
    expect(service.detect('https://www.tiktok.com/@club/video/123').platform).toBe('tiktok');
    expect(service.detect('https://youtu.be/abc123').platform).toBe('youtube');
    expect(service.detect('https://youtube.com/shorts/abc123').platform).toBe('youtube_shorts');
    expect(service.detect('https://fb.watch/abc123/').platform).toBe('facebook');
  });

  it('does not accept root, relative, or lookalike URLs', () => {
    expect(service.detect('https://instagram.com/').valid).toBeFalse();
    expect(service.detect('instagram.com/p/abc').valid).toBeFalse();
    expect(service.detect('https://notyoutube.com/watch/abc').platform).toBeNull();
  });

  it('detects the platform and sends the serializer payload', () => {
    service.createForTrack('track-1', ' https://youtube.com/shorts/abc123 ').subscribe();

    const request = http.expectOne('/api/v1/my-club/published-links/');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      track_uuid: 'track-1',
      platform: 'youtube_shorts',
      url: 'https://youtube.com/shorts/abc123',
    });
    request.flush({});
  });

  it('does not send unsupported platforms', () => {
    let error: unknown;
    service.createForTrack('track-1', 'https://linkedin.com/posts/abc').subscribe({
      error: (value) => { error = value; },
    });

    expect(error).toEqual(jasmine.any(PublishedLinkDetectionError));
    expect((error as PublishedLinkDetectionError).code).toBe('unsupported-platform');
    http.expectNone('/api/v1/my-club/published-links/');
  });

  it('lists links filtered by track and platform', () => {
    service.list({ trackUuid: 'track-1', platform: 'instagram' }).subscribe();

    const request = http.expectOne(
      (candidate) => candidate.url === '/api/v1/my-club/published-links/'
        && candidate.params.get('track_uuid') === 'track-1'
        && candidate.params.get('platform') === 'instagram'
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      count: 0,
      results: [],
      by_platform: {
        instagram: [],
        tiktok: [],
        youtube: [],
        youtube_shorts: [],
        facebook: [],
      },
    });
  });
});
