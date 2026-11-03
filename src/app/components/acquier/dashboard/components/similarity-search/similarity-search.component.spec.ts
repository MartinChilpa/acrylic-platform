import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, flush, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

import { SimilaritySearchComponent } from './similarity-search.component';
import { SpotifyService } from '../../../../../services/spotify.service';
import { ISpotifySearchResult } from '../../../../../interfaces/response/spotify.response';

const TRACK: ISpotifySearchResult = {
  name: 'Calm Down', artist: 'Rema, Selena Gomez', image: '',
  spotify_url: 'https://open.spotify.com/track/0WtM2NBVQNNJLh6scP13H8',
  spotify_id: '0WtM2NBVQNNJLh6scP13H8', isrc: 'USUM72215285', duration: 239318,
};

describe('SimilaritySearchComponent', () => {
  let component: SimilaritySearchComponent;
  let fixture: ComponentFixture<SimilaritySearchComponent>;
  let spotify: jasmine.SpyObj<SpotifyService>;

  beforeEach(async () => {
    spotify = jasmine.createSpyObj<SpotifyService>('SpotifyService', ['searchTracks', 'getTrack']);
    spotify.searchTracks.and.returnValue(of({ results: [TRACK] }));

    await TestBed.configureTestingModule({
      imports: [
        SimilaritySearchComponent,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' } }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SpotifyService, useValue: spotify },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimilaritySearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function type(text: string): void {
    component.searchControl.setValue(text);
    component.onSearchInputChange();
    tick(300);
    fixture.detectChanges();
  }

  const dropdown = () => fixture.nativeElement.querySelector('.spotify-suggest') as HTMLElement | null;

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows Spotify suggestions while typing', fakeAsync(() => {
    type('calm do');
    expect(spotify.searchTracks).toHaveBeenCalledOnceWith('calm do', 5);
    const items = fixture.nativeElement.querySelectorAll('.spotify-suggest__item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Calm Down');
    expect(items[0].textContent).toContain('Rema, Selena Gomez');
    expect(items[0].textContent).toContain('3:59');
  }));

  it('waits for the debounce and ignores text under 2 characters', fakeAsync(() => {
    component.searchControl.setValue('c');
    component.onSearchInputChange();
    tick(300);
    expect(spotify.searchTracks).not.toHaveBeenCalled();

    component.searchControl.setValue('ca');
    component.onSearchInputChange();
    tick(100);
    component.searchControl.setValue('cal');
    component.onSearchInputChange();
    tick(300);
    expect(spotify.searchTracks).toHaveBeenCalledOnceWith('cal', 5);
  }));

  it('does not look up suggestions for a pasted Spotify URL', fakeAsync(() => {
    type(TRACK.spotify_url);
    expect(spotify.searchTracks).not.toHaveBeenCalled();
    expect(dropdown()).toBeNull();
  }));

  it('searches by the picked suggestion’s spotify_url and shows its name', fakeAsync(() => {
    const searched: string[] = [];
    component.searchInput.subscribe(q => searched.push(q));
    type('calm do');

    (fixture.nativeElement.querySelector('.spotify-suggest__item') as HTMLElement).click();
    fixture.detectChanges();

    expect(searched).toEqual([TRACK.spotify_url]);
    expect(component.searchControl.value).toBe('Calm Down – Rema, Selena Gomez');
    expect(dropdown()).toBeNull();
    flush();
    discardPeriodicTasks();
  }));

  it('picks the highlighted suggestion with the keyboard', fakeAsync(() => {
    const searched: string[] = [];
    component.searchInput.subscribe(q => searched.push(q));
    type('calm do');

    component.onSearchKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component.onSearchKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(searched).toEqual([TRACK.spotify_url]);
    flush();
    discardPeriodicTasks();
  }));

  it('runs the prompt search on Enter when no suggestion is highlighted', fakeAsync(() => {
    const searched: string[] = [];
    component.searchInput.subscribe(q => searched.push(q));
    type('calm do');

    component.onSearchKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(searched).toEqual(['calm do']);
    flush();
    discardPeriodicTasks();
  }));

  it('closes the suggestions on Escape', fakeAsync(() => {
    type('calm do');
    component.onSearchKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    tick(300);
    fixture.detectChanges();
    expect(dropdown()).toBeNull();
    expect(spotify.searchTracks).toHaveBeenCalledTimes(1);
  }));

  it('says when Spotify finds nothing', fakeAsync(() => {
    spotify.searchTracks.and.returnValue(of({ results: [] }));
    type('zzzz');
    expect(dropdown()?.textContent).toContain('similaritySearch.spotifySuggest.empty');
  }));

  it('shows a quiet message when Spotify search is unavailable', fakeAsync(() => {
    spotify.searchTracks.and.returnValue(throwError(() => ({ status: 503, error: { detail: 'Spotify search unavailable' } })));
    type('calm do');
    const text = dropdown()?.textContent ?? '';
    expect(text).toContain('similaritySearch.spotifySuggest.unavailable');
    expect(text).not.toContain('Spotify search unavailable');
    expect(fixture.nativeElement.querySelectorAll('.spotify-suggest__item').length).toBe(0);
  }));
});
