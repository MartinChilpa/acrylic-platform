import { TestBed } from '@angular/core/testing';

import { MyArtistService } from './my-artist.service';

describe('MyArtistService', () => {
  let service: MyArtistService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyArtistService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
