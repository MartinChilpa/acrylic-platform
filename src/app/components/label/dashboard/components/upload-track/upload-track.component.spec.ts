import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { UploadTrackComponent } from './upload-track.component';

describe('UploadTrackComponent', () => {
  let component: UploadTrackComponent;
  let fixture: ComponentFixture<UploadTrackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadTrackComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UploadTrackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
