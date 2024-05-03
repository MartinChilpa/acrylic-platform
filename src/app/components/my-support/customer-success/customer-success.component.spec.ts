import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerSuccessComponent } from './customer-success.component';

describe('CustomerSuccessComponent', () => {
  let component: CustomerSuccessComponent;
  let fixture: ComponentFixture<CustomerSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerSuccessComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CustomerSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
