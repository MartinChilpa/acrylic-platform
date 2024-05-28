import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSynclistComponent } from './create-synclist.component';

describe('CreateSynclistComponent', () => {
  let component: CreateSynclistComponent;
  let fixture: ComponentFixture<CreateSynclistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSynclistComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateSynclistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
