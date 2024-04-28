import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSynclistComponent } from './add-synclist.component';

describe('AddSynclistComponent', () => {
  let component: AddSynclistComponent;
  let fixture: ComponentFixture<AddSynclistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddSynclistComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddSynclistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
