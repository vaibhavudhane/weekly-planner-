import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { WeekCycle } from '../models';

@Injectable({ providedIn: 'root' })
export class WeekCycleService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getCurrent() {
    return this.http.get<WeekCycle>(`${this.api}/weekcycle/current`);
  }
  getAll() {
    return this.http.get<WeekCycle[]>(`${this.api}/weekcycle`);
  }
  create(c: WeekCycle) {
    return this.http.post<WeekCycle>(`${this.api}/weekcycle`, c);
  }
  setPercentages(id: number, cat1: number, cat2: number, cat3: number) {
    return this.http.put(`${this.api}/weekcycle/${id}/percentages`, { cat1, cat2, cat3 });
  }
}
