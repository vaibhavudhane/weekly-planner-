import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { switchMap, catchError, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatChipsModule } from '@angular/material/chips';
import { BacklogItem, PlanEntry, WeekCycle } from '../../models';
import { BacklogService } from '../../services/backlog.service';
import { WeekCycleService } from '../../services/week-cycle.service';
import { PlanService } from '../../services/plan.service';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    MatChipsModule,
  ],
  templateUrl: './planning.html',
  styleUrl: './planning.scss',
})
export class Planning implements OnInit, OnDestroy {
  readonly TOTAL_HOURS = 30;
  currentWeek?: WeekCycle;
  backlogItems: BacklogItem[] = [];
  selectedEntries: PlanEntry[] = [];
  isSubmitted = false;
  isLoading = true;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  get cat1Max() {
    return this.currentWeek ? (this.TOTAL_HOURS * this.currentWeek.category1Percent) / 100 : 0;
  }
  get cat2Max() {
    return this.currentWeek ? (this.TOTAL_HOURS * this.currentWeek.category2Percent) / 100 : 0;
  }
  get cat3Max() {
    return this.currentWeek ? (this.TOTAL_HOURS * this.currentWeek.category3Percent) / 100 : 0;
  }

  get totalAllocated() {
    return this.selectedEntries.reduce((s, e) => s + (e.plannedHours || 0), 0);
  }
  get hoursLeft() {
    return this.TOTAL_HOURS - this.totalAllocated;
  }

  catUsed(cat: number) {
    return this.selectedEntries
      .filter((e) => e.backlogItem?.category === cat)
      .reduce((s, e) => s + (e.plannedHours || 0), 0);
  }

  constructor(
    private backlogSvc: BacklogService,
    private weekSvc: WeekCycleService,
    private planSvc: PlanService,
    private roleSvc: RoleService,
  ) {}

  ngOnInit() {
    const member = this.roleSvc.getCurrent();

    this.backlogSvc
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => (this.backlogItems = items));

    // FIX 6: switchMap chains week load → plan load sequentially
    this.weekSvc
      .getCurrent()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((week) => {
          this.currentWeek = week;
          return this.planSvc.getPlan(member.id, week.id).pipe(catchError(() => of(null)));
        }),
      )
      .subscribe({
        next: (plan) => {
          if (plan) {
            this.selectedEntries = plan.planEntries;
            this.isSubmitted = plan.isFrozen;
          }
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Failed to load week data.';
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addItem(item: BacklogItem) {
    if (!this.selectedEntries.find((e) => e.backlogItemId === item.id)) {
      this.selectedEntries.push({
        backlogItemId: item.id,
        backlogItem: item,
        plannedHours: 0,
        progressPercent: 0,
      });
    }
  }

  removeItem(entry: PlanEntry) {
    this.selectedEntries = this.selectedEntries.filter(
      (e) => e.backlogItemId !== entry.backlogItemId,
    );
  }

  submitPlan() {
    console.log('Submitting:', {
      memberId: this.roleSvc.getCurrent().id,
      weekCycleId: this.currentWeek?.id,
      entries: this.selectedEntries,
    });

    this.errorMessage = '';
    if (this.selectedEntries.length === 0) {
      this.errorMessage = 'Add at least one task.';
      return;
    }
    if (this.selectedEntries.some((e) => e.plannedHours <= 0)) {
      this.errorMessage = 'All tasks need > 0 hours.';
      return;
    }
    if (this.totalAllocated > this.TOTAL_HOURS) {
      this.errorMessage = 'Total exceeds 30 hours!';
      return;
    }
    if (this.catUsed(1) > this.cat1Max) {
      this.errorMessage = `Cat 1 exceeds ${this.currentWeek?.category1Percent}% limit.`;
      return;
    }
    if (this.catUsed(2) > this.cat2Max) {
      this.errorMessage = `Cat 2 exceeds ${this.currentWeek?.category2Percent}% limit.`;
      return;
    }
    if (this.catUsed(3) > this.cat3Max) {
      this.errorMessage = `Cat 3 exceeds ${this.currentWeek?.category3Percent}% limit.`;
      return;
    }

    const m = this.roleSvc.getCurrent();
    this.planSvc.submitPlan(m.id, this.currentWeek!.id, this.selectedEntries).subscribe({
      next: (plan) => {
        this.selectedEntries = plan.planEntries;
        this.isSubmitted = true;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Submission failed.';
      },
    });
  }

  saveProgress(entry: PlanEntry) {
    if (!entry.id) return;
    this.planSvc.updateProgress(entry.id, entry.progressPercent, entry.actualHours).subscribe({
      error: (err) => {
        this.errorMessage = err.error?.error || 'Progress update failed.';
      },
    });
  }

  categoryLabel(cat: number) {
    return ['', 'Client Focused', 'Tech Debt', 'R&D'][cat];
  }
}
