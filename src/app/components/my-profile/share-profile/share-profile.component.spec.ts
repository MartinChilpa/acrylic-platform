import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareProfileComponent } from './share-profile.component';

describe('ShareProfileComponent', () => {
  let component: ShareProfileComponent;
  let fixture: ComponentFixture<ShareProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareProfileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShareProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
