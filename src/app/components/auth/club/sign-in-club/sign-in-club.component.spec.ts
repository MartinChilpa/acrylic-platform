import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignInClubComponent } from './sign-in-club.component';

describe('SignInClubComponent', () => {
  let component: SignInClubComponent;
  let fixture: ComponentFixture<SignInClubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignInClubComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SignInClubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
