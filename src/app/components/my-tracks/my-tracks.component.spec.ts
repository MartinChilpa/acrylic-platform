import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyTracksComponent } from './my-tracks.component';

describe('MyTracksComponent', () => {
  let component: MyTracksComponent;
  let fixture: ComponentFixture<MyTracksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyTracksComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MyTracksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
