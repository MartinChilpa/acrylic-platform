import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveUploadComponent } from './live-upload.component';

describe('LiveUploadComponent', () => {
  let component: LiveUploadComponent;
  let fixture: ComponentFixture<LiveUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveUploadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LiveUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
