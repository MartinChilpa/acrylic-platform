import { PerformanceArtist, PerformanceTrack } from '../interfaces/response/performance.response';
import {
  DEFAULT_PERFORMANCE_FILTERS,
  audienceComposition,
  formatAudience,
  matchesPerformanceFilters,
  sortBySocial,
} from './performance.utils';

function artist(name: string, audience: Partial<PerformanceArtist['audience']>): PerformanceArtist {
  return {
    uuid: name, name, countryCode: 'SN', hometown: null, instagramTopCountries: [], instagramTopCities: [],
    audience: { tiktok: null, instagram: null, youtube: null, spotify: null, ...audience },
    totalAudience: null, largestPlatform: null,
    profileUrls: { tiktok: null, instagram: null, youtube: null, spotify: null }, updated: null,
  };
}

function track(name: string, a: PerformanceArtist, ecu = false): PerformanceTrack {
  return {
    uuid: name, isrc: name, name, artistUuid: a.uuid, artist: a, tier: 'Artist Promo',
    extendedCommercialUse: ecu, spotifyStreams: null, previewUrl: null, coverUrl: null,
  };
}

describe('performance utils', () => {
  it('formats audience counts as the design writes them', () => {
    expect(formatAudience(38_000_000)).toBe('38 M');
    expect(formatAudience(3_360_000, 2)).toBe('3.36 M');
    expect(formatAudience(600_000)).toBe('600 k');
    expect(formatAudience(null)).toBeNull();
  });

  describe('ECU filter', () => {
    it('keeps only tracks with Extended Commercial Use when asked', () => {
      const a = artist('A', {});
      const filters = { ...DEFAULT_PERFORMANCE_FILTERS, ecu: 'available' as const };
      expect(matchesPerformanceFilters(track('yes', a, true), filters)).toBeTrue();
      expect(matchesPerformanceFilters(track('no', a, false), filters)).toBeFalse();
    });
  });

  describe('social filter', () => {
    const big = artist('Big', { tiktok: 3_000_000, instagram: 100 });
    const small = artist('Small', { tiktok: 10_000 });
    const none = artist('None', {});

    it('drops artists without a follower count on the platform', () => {
      const filters = { ...DEFAULT_PERFORMANCE_FILTERS, social: 'instagram' as const };
      expect(matchesPerformanceFilters(track('b', big), filters)).toBeTrue();
      expect(matchesPerformanceFilters(track('s', small), filters)).toBeFalse();
      expect(matchesPerformanceFilters(track('n', none), filters)).toBeFalse();
    });

    it('ranks by followers on that platform', () => {
      const sorted = sortBySocial([track('s', small), track('b', big)], 'tiktok');
      expect(sorted.map(t => t.name)).toEqual(['b', 's']);
    });
  });

  describe('audience composition', () => {
    it('reproduces the design sample with shares that add up to 100', () => {
      const comp = audienceComposition(artist('Himra', {
        spotify: 1_690_000, instagram: 1_160_000, youtube: 2_280_000, tiktok: 3_360_000,
      }));
      expect(comp.total).toBe(8_490_000);
      expect(comp.complete).toBeTrue();
      expect(comp.slices.map(s => s.share)).toEqual([19.9, 13.7, 26.8, 39.6]);
      expect(comp.slices.every(s => !!s.path)).toBeTrue();
    });

    it('does not chart or share out a partial total', () => {
      const comp = audienceComposition(artist('Partial', { spotify: 1, youtube: 1, tiktok: 1 }));
      expect(comp.complete).toBeFalse();
      expect(comp.slices.every(s => s.path === null && s.share === null)).toBeTrue();
    });
  });
});
