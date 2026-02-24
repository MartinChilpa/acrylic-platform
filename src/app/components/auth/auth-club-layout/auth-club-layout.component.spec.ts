import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthClubLayoutComponent } from './auth-club-layout.component';

describe('AuthClubLayoutComponent', () => {
  let component: AuthClubLayoutComponent;
  let fixture: ComponentFixture<AuthClubLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthClubLayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AuthClubLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
