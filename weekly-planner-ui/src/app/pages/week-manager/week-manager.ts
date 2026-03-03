import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { WeekCycle } from '../../models';
import { WeekCycleService } from '../../services/week-cycle.service';

@Component({
  selector: 'app-week-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './week-manager.html',
  styleUrl: './week-manager.scss',
})
export class WeekManager implements OnInit {
  weeks: WeekCycle[] = [];
  isLoading = true;
  errorMessage = '';
  showForm = false;
  cat1 = 50;
  cat2 = 30;
  cat3 = 20;
  newWeek = { planningDate: '', weekStartDate: '', weekEndDate: '' };

  constructor(private weekSvc: WeekCycleService) {}

  ngOnInit() {
    this.loadWeeks();
  }

  loadWeeks() {
    this.isLoading = true;
    this.weekSvc.getAll().subscribe({
      next: (weeks) => {
        this.weeks = weeks;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load weeks.';
        this.isLoading = false;
      },
    });
  }

  createWeek() {
    if (this.cat1 + this.cat2 + this.cat3 !== 100) {
      this.errorMessage = 'Percentages must sum to 100.';
      return;
    }
    const cycle: WeekCycle = {
      id: 0,
      planningDate: this.newWeek.planningDate,
      weekStartDate: this.newWeek.weekStartDate,
      weekEndDate: this.newWeek.weekEndDate,
      category1Percent: this.cat1,
      category2Percent: this.cat2,
      category3Percent: this.cat3,
      isActive: true,
    };
    this.weekSvc.create(cycle).subscribe({
      next: () => {
        this.showForm = false;
        this.newWeek = { planningDate: '', weekStartDate: '', weekEndDate: '' };
        this.loadWeeks();
      },
      error: () => {
        this.errorMessage = 'Failed to create week.';
      },
    });
  }

  setPercentages(week: WeekCycle) {
    this.weekSvc
      .setPercentages(week.id, week.category1Percent, week.category2Percent, week.category3Percent)
      .subscribe({
        next: () => alert('Percentages saved!'),
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to save percentages.';
        },
      });
  }
}
