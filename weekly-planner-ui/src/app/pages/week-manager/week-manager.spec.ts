import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeekManager } from './week-manager';

describe('WeekManager', () => {
  let component: WeekManager;
  let fixture: ComponentFixture<WeekManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeekManager]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeekManager);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
