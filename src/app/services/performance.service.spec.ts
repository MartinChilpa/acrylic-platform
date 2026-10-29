import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PerformanceService } from './performance.service';
import { PerformanceCatalog, PerformanceTrack } from '../interfaces/response/performance.response';

/** Stand-in for HTMLAudioElement so playback can be driven from the test. */
class FakeAudio extends EventTarget {
  src = '';
  preload = '';
  paused = true;
  readyState = 0;
  currentTime = 0;
  duration = 0;
  loads = 0;
  /** Starts playback; the test fires 'playing' when the "audio" is ready. */
  play(): Promise<void> {
    this.paused = false;
    return Promise.resolve();
  }
  pause(): void {
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }
  removeAttribute(name: string): void {
    if (name === 'src') { this.src = ''; }
  }
  load(): void {
    this.loads++;
  }
}

const page = (results: unknown[]) => ({ count: results.length, next: null, previous: null, results });

describe('PerformanceService', () => {
  let service: PerformanceService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PerformanceService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function loadCatalog(trackRows: unknown[], artistRows: unknown[]): PerformanceCatalog {
    let catalog: PerformanceCatalog | null = null;
    service.loadCatalog().subscribe(c => (catalog = c));
    http.expectOne(r => r.url === '/api/v1/tracks/').flush(page(trackRows));
    http.expectOne(r => r.url === '/api/v1/artists/').flush(page(artistRows));
    http.expectOne(r => r.url === '/api/v1/prices/').flush(page([{ uuid: 'p-pre', name: 'PreClear' }]));
    return catalog!;
  }

  const artistRow = {
    uuid: 'a1', name: 'Wally Seck', country: 'SN', hometown: '', updated: '2026-04-10T00:00:00Z',
    tiktok_followers: 2_000_000, instagram_followers: 0, youtube_followers: null, spotify_followers: 10,
    tiktok_url: null, instagram_url: null, youtube_url: null, spotify_url: null,
    chartmetric_instagram_top_countries: '[{"code2": "FR", "rank": 1, "weights": 0.5}]',
    chartmetric_instagram_top_cities: [{ city_name: 'Lyon', code2: 'FR', rank: 1, weights: 0.2 }, { rank: 2 }],
  };

  it('maps platform counts, Chartmetric lists and tiers from the API rows', () => {
    const catalog = loadCatalog(
      [{ uuid: 't1', isrc: 'X', artist: 'a1', name: 'Dakar Nights', duration: 1, price: 'p-pre', extended_commercial_use: true }],
      [artistRow],
    );
    const track = catalog.tracks[0];
    expect(track.tier).toBe('PreClear');
    expect(track.artist?.audience.instagram).toBeNull();     // 0 means no count, not zero followers
    expect(track.artist?.audience.tiktok).toBe(2_000_000);
    expect(track.artist?.instagramTopCountries).toEqual([{ code: 'FR', rank: 1, weight: 0.5 }]);
    // The entry without a city name is dropped.
    expect(track.artist?.instagramTopCities.map(c => c.name)).toEqual(['Lyon']);
  });

  it('treats malformed Chartmetric data as empty', () => {
    const catalog = loadCatalog(
      [{ uuid: 't1', isrc: 'X', artist: 'a1', name: 'T', duration: 1, price: null, extended_commercial_use: false }],
      [{ ...artistRow, chartmetric_instagram_top_cities: '{not json', chartmetric_instagram_top_countries: null }],
    );
    expect(catalog.tracks[0].artist?.instagramTopCities).toEqual([]);
    expect(catalog.tracks[0].artist?.instagramTopCountries).toEqual([]);
  });

  it('uses only full http(s) preview links, never storage paths', () => {
    const catalog = loadCatalog(
      [
        { uuid: 't1', isrc: 'X', artist: 'a1', name: 'Signed', duration: 1, price: null, extended_commercial_use: false,
          preview_url: 'https://media.example/tracks/a.wav?Signature=abc' },
        { uuid: 't2', isrc: 'Y', artist: 'a1', name: 'Raw', duration: 1, price: null, extended_commercial_use: false,
          preview_url: 'tracks/9f56/a.wav' },
      ],
      [artistRow],
    );
    expect(catalog.tracks[0].previewUrl).toBe('https://media.example/tracks/a.wav?Signature=abc');
    expect(catalog.tracks[1].previewUrl).toBeNull();
  });

  describe('preview playback', () => {
    let created: FakeAudio[];
    const track = (): PerformanceTrack => ({
      uuid: 't1', isrc: 'X', name: 'Dakar Nights', artistUuid: 'a1', artist: null, tier: 'Artist Promo',
      extendedCommercialUse: false, spotifyStreams: null, previewUrl: 'https://media.example/old.wav', coverUrl: null,
    });

    beforeEach(() => {
      created = [];
      // A plain function, since the service calls `new Audio()`.
      spyOn(window as any, 'Audio').and.callFake(function () {
        const audio = new FakeAudio();
        created.push(audio);
        return audio;
      });
    });

    afterEach(() => service.stopPreview());

    it('shows loading until the audio plays, then keeps its position on pause', () => {
      const t = track();
      service.togglePreview(t);
      expect(created[0].src).toBe('https://media.example/old.wav');
      expect(service.loadingUuid()).toBe('t1');
      expect(service.playingUuid()).toBeNull();

      created[0].dispatchEvent(new Event('playing'));
      expect(service.loadingUuid()).toBeNull();
      expect(service.playingUuid()).toBe('t1');

      service.togglePreview(t);
      expect(service.playingUuid()).toBeNull();
      expect(service.loadedUuid()).toBe('t1');   // still loaded, so the time is kept
    });

    it('cancels a preview that is still loading on a second click and releases it', () => {
      const t = track();
      service.togglePreview(t);
      service.togglePreview(t);

      expect(service.loadedUuid()).toBeNull();
      expect(service.loadingUuid()).toBeNull();
      expect(created[0].src).toBe('');
      expect(created[0].loads).toBe(1);
      // Its listeners are gone: a late event changes nothing.
      created[0].dispatchEvent(new Event('playing'));
      expect(service.playingUuid()).toBeNull();
    });

    it('plays one preview at a time', () => {
      const other = { ...track(), uuid: 't2', previewUrl: 'https://media.example/two.wav' };
      service.togglePreview(track());
      service.togglePreview(other);
      expect(created[0].src).toBe('');
      expect(service.loadedUuid()).toBe('t2');
    });

    it('refreshes an expired link once, then marks the preview unavailable', () => {
      const t = track();
      service.togglePreview(t);
      created[0].dispatchEvent(new Event('error'));
      expect(service.loadingUuid()).toBe('t1');   // still loading while the new link is fetched

      http.expectOne('/api/v1/tracks/t1/').flush({ uuid: 't1', preview_url: 'https://media.example/new.wav' });
      expect(created[1].src).toBe('https://media.example/new.wav');
      expect(service.canPreview(t)).toBeTrue();

      created[1].dispatchEvent(new Event('error'));
      expect(service.canPreview(t)).toBeFalse();
      expect(service.playingUuid()).toBeNull();
      expect(service.loadingUuid()).toBeNull();
    });

    it('does not apply a refreshed link after the user moved on', () => {
      const t = track();
      service.togglePreview(t);
      created[0].dispatchEvent(new Event('error'));
      service.stopPreview();
      expect(http.expectOne('/api/v1/tracks/t1/').cancelled).toBeTrue();
      expect(created.length).toBe(1);
    });
  });
});
