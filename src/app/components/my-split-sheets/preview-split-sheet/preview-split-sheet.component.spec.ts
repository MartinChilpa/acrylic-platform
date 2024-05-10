import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewSplitSheetComponent } from './preview-split-sheet.component';

describe('PreviewSplitSheetComponent', () => {
  let component: PreviewSplitSheetComponent;
  let fixture: ComponentFixture<PreviewSplitSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewSplitSheetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PreviewSplitSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
