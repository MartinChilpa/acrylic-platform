import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageSynclistComponent } from './manage-synclist.component';

describe('ManageSynclistComponent', () => {
  let component: ManageSynclistComponent;
  let fixture: ComponentFixture<ManageSynclistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageSynclistComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManageSynclistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
