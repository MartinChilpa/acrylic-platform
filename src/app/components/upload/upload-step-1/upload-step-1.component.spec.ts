import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadStep1Component } from './upload-step-1.component';

describe('UploadStep1Component', () => {
  let component: UploadStep1Component;
  let fixture: ComponentFixture<UploadStep1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadStep1Component]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UploadStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
