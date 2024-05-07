import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageSplitSheetComponent } from './manage-split-sheet.component';

describe('ManageSplitSheetComponent', () => {
  let component: ManageSplitSheetComponent;
  let fixture: ComponentFixture<ManageSplitSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageSplitSheetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManageSplitSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
