import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignUpClubComponent } from './sign-up-club.component';

describe('SignUpClubComponent', () => {
  let component: SignUpClubComponent;
  let fixture: ComponentFixture<SignUpClubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignUpClubComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SignUpClubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
