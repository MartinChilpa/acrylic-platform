import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyProfileDetailsComponent } from './my-profile-details.component';

describe('MyProfileDetailsComponent', () => {
  let component: MyProfileDetailsComponent;
  let fixture: ComponentFixture<MyProfileDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyProfileDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MyProfileDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
