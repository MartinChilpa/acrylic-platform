import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSplitSheetComponent } from './create-split-sheet.component';

describe('CreateSplitSheetComponent', () => {
  let component: CreateSplitSheetComponent;
  let fixture: ComponentFixture<CreateSplitSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSplitSheetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateSplitSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
