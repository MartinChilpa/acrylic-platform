import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadStep5Component } from './upload-step-5.component';

describe('UploadStep5Component', () => {
  let component: UploadStep5Component;
  let fixture: ComponentFixture<UploadStep5Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadStep5Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UploadStep5Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
