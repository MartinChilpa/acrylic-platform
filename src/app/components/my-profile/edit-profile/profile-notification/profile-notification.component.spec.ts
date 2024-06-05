import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileNotificationComponent } from './profile-notification.component';

describe('ProfileNotificationComponent', () => {
  let component: ProfileNotificationComponent;
  let fixture: ComponentFixture<ProfileNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileNotificationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProfileNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
