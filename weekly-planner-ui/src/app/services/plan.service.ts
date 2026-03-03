import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PlanEntry, WeeklyPlan, DashboardEntry } from '../models';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getPlan(memberId: number, weekCycleId: number) {
    return this.http.get<WeeklyPlan>(`${this.api}/plan/${memberId}/${weekCycleId}`);
  }
  submitPlan(memberId: number, weekCycleId: number, entries: PlanEntry[]) {
    // Send only the fields the API needs — strip Angular-side properties
    const cleanEntries = entries.map((e) => ({
      backlogItemId: e.backlogItemId,
      plannedHours: e.plannedHours,
      progressPercent: 0,
      actualHours: null,
    }));
    return this.http.post<WeeklyPlan>(`${this.api}/plan/submit`, {
      memberId,
      weekCycleId,
      entries: cleanEntries,
    });
  }
  updateProgress(entryId: number, progressPercent: number, actualHours?: number) {
    return this.http.put(`${this.api}/plan/progress/${entryId}`, { progressPercent, actualHours });
  }
  getDashboard(weekCycleId: number) {
    return this.http.get<DashboardEntry[]>(`${this.api}/plan/week/${weekCycleId}/dashboard`);
  }
}
