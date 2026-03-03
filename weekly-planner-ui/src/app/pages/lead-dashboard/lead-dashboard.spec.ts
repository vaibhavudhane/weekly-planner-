import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadDashboard } from './lead-dashboard';

describe('LeadDashboard', () => {
  let component: LeadDashboard;
  let fixture: ComponentFixture<LeadDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeadDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
