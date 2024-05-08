import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MySplitSheetsComponent } from './my-split-sheets.component';

describe('MySplitSheetsComponent', () => {
  let component: MySplitSheetsComponent;
  let fixture: ComponentFixture<MySplitSheetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MySplitSheetsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MySplitSheetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
