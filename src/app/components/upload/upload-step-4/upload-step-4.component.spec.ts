import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadStep4Component } from './upload-step-4.component';

describe('UploadStep4Component', () => {
  let component: UploadStep4Component;
  let fixture: ComponentFixture<UploadStep4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadStep4Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UploadStep4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
