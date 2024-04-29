import { TestBed } from '@angular/core/testing';

import { DistributorsService } from './distributors.service';

describe('DistributorsService', () => {
  let service: DistributorsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DistributorsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
