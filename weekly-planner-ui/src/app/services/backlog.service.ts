import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BacklogItem } from '../models';

@Injectable({ providedIn: 'root' })
export class BacklogService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getAll() {
    return this.http.get<BacklogItem[]>(`${this.api}/backlog`);
  }
  getById(id: number) {
    return this.http.get<BacklogItem>(`${this.api}/backlog/${id}`);
  }
  create(item: BacklogItem) {
    return this.http.post<BacklogItem>(`${this.api}/backlog`, item);
  }
  update(id: number, item: BacklogItem) {
    return this.http.put<BacklogItem>(`${this.api}/backlog/${id}`, item);
  }
  delete(id: number) {
    return this.http.delete(`${this.api}/backlog/${id}`);
  }
}
