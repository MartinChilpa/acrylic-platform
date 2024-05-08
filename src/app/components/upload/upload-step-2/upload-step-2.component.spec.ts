import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadStep2Component } from './upload-step-2.component';

describe('UploadStep2Component', () => {
  let component: UploadStep2Component;
  let fixture: ComponentFixture<UploadStep2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadStep2Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UploadStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
