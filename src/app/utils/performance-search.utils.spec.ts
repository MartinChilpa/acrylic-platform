import { PerformanceArtist, PerformanceTrack } from '../interfaces/response/performance.response';
import { cityMatches, matchScore, resolveCountries, searchCatalog } from './performance-search.utils';

function artist(uuid: string, name: string, country: string | null, extra: Partial<PerformanceArtist> = {}): PerformanceArtist {
  return {
    uuid, name, countryCode: country, hometown: null, instagramTopCountries: [], instagramTopCities: [],
    audience: { tiktok: null, instagram: null, youtube: null, spotify: null }, totalAudience: null,
    largestPlatform: null, profileUrls: { tiktok: null, instagram: null, youtube: null, spotify: null }, updated: null,
    ...extra,
  };
}

function track(uuid: string, name: string, a: PerformanceArtist): PerformanceTrack {
  return {
    uuid, isrc: uuid, name, artistUuid: a.uuid, artist: a, tier: 'Artist Promo',
    extendedCommercialUse: false, spotifyStreams: null, previewUrl: null, coverUrl: null,
  };
}

// Test fixtures only; the app reads every name from the catalog API.
const didi = artist('a1', 'Didi B', 'CI', {
  audience: { tiktok: 3_000_000, instagram: 1_000_000, youtube: null, spotify: null }, totalAudience: 4_000_000,
});
const samba = artist('a2', 'Samba Peuzzi', 'SN', {
  audience: { tiktok: 900_000, instagram: null, youtube: null, spotify: null }, totalAudience: 900_000,
  instagramTopCountries: [{ code: 'SN', rank: 1, weight: 0.6 }],
  instagramTopCities: [{ name: 'Dakar', code: 'SN', rank: 1, weight: 0.3 }, { name: 'Lyon', code: 'FR', rank: 3, weight: 0.05 }],
});
const wally = artist('a3', 'Wally Seck', 'SN', {
  audience: { tiktok: 2_000_000, instagram: 500_000, youtube: null, spotify: null }, totalAudience: 2_500_000,
  instagramTopCities: [{ name: 'Lyon', code: 'FR', rank: 1, weight: 0.2 }, { name: 'Montréal', code: 'CA', rank: 2, weight: 0.1 }],
});
const catalog = [
  track('t1', 'NAS', didi), track('t2', 'Rolls Royce', didi),
  track('t3', 'Lou Yakou Yawa', samba), track('t4', 'Dakar Nights', wally),
];
const names = (tracks: PerformanceTrack[]) => tracks.map(t => t.name);

describe('performance search', () => {
  describe('countries', () => {
    it('reads a country name as artist origin', () => {
      const out = searchCatalog(catalog, 'Senegal');
      expect(out.mode).toBe('geo');
      expect(out.place?.key).toBe('SN');
      expect(names(out.tracks)).toEqual(['Dakar Nights', 'Lou Yakou Yawa']);
    });

    it('resolves regular and irregular demonyms', () => {
      expect(resolveCountries('Senegalese')).toEqual(['SN']);
      expect(resolveCountries('Nigerian')).toEqual(['NG']);
      expect(resolveCountries('French')).toEqual(['FR']);
      expect(resolveCountries('Ivorians')).toEqual(['CI']);
    });

    it('ranks a country by the platform named in the query', () => {
      const out = searchCatalog(catalog, 'Best Senegalese artists on TikTok');
      expect(out.platform).toBe('tiktok');
      expect(names(out.tracks)).toEqual(['Dakar Nights', 'Lou Yakou Yawa']);
    });

    it('does not consult Chartmetric for a plain country search', () => {
      const out = searchCatalog(catalog, 'Senegal');
      expect(out.mode).not.toBe('audience');
    });
  });

  describe('cities', () => {
    it('finds artists whose Chartmetric top cities include the city', () => {
      const out = searchCatalog(catalog, 'Lyon');
      expect(out.mode).toBe('audience');
      expect(out.place).toEqual(jasmine.objectContaining({ kind: 'city' }));
      // Wally Seck ranks Lyon first, Samba Peuzzi third.
      expect(names(out.tracks)).toEqual(['Dakar Nights', 'Lou Yakou Yawa']);
    });

    it('ignores case and accents', () => {
      expect(names(searchCatalog(catalog, 'lyon').tracks)).toEqual(['Dakar Nights', 'Lou Yakou Yawa']);
      expect(names(searchCatalog(catalog, 'montreal').tracks)).toEqual(['Dakar Nights']);
    });

    it('matches a city inside a longer name but not partial words', () => {
      expect(cityMatches('City of London', 'London')).toBeTrue();
      expect(cityMatches('Lyon', 'ly')).toBeFalse();
      expect(cityMatches('', 'Lyon')).toBeFalse();
    });

    it('falls back to a name search when no artist has the city', () => {
      const out = searchCatalog(catalog, 'Rolls Royce');
      expect(out.mode).toBe('text');
      expect(names(out.tracks)).toEqual(['Rolls Royce']);
    });
  });

  describe('names', () => {
    it('puts exact matches first', () => {
      expect(matchScore('nas', 'nas')).toBeGreaterThan(matchScore('nas', 'nasty'));
    });

    it('suggests the artist for a close spelling', () => {
      const out = searchCatalog(catalog, 'Didu B');
      expect(out.approximate).toBeTrue();
      expect(out.suggestion).toBe('Didi B');
      expect(names(out.tracks)).toEqual(['NAS', 'Rolls Royce']);
    });

    it('returns nothing for an unrelated query', () => {
      expect(searchCatalog(catalog, 'zzzz').tracks).toEqual([]);
    });
  });
});
