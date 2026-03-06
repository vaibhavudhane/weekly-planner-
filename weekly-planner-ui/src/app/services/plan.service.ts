import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlanEntry, WeeklyPlan } from '../models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getPlan(memberId: number, weekCycleId: number) {
    return this.http.get<WeeklyPlan>(`${this.api}/plan/${memberId}/${weekCycleId}`);
  }

  submitPlan(memberId: number, weekCycleId: number, entries: PlanEntry[]) {
    return this.http.post<WeeklyPlan>(`${this.api}/plan`, { memberId, weekCycleId, entries });
  }

  updateProgress(planEntryId: number, progressPercent: number, actualHours: number) {
    return this.http.put(`${this.api}/plan/entry/${planEntryId}/progress`, {
      progressPercent,
      actualHours,
    });
  }

  getAllPlansForWeek(weekCycleId: number) {
    return this.http.get<WeeklyPlan[]>(`${this.api}/plan/week/${weekCycleId}`);
  }
}
