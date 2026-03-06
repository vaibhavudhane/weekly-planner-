import { Injectable } from '@angular/core';
import { Member } from '../models';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private members: Member[] = [
    { id: 1, name: 'Team Lead', isLead: true, isActive: true },
    { id: 2, name: 'Alice', isLead: false, isActive: true },
    { id: 3, name: 'Bob', isLead: false, isActive: true },
  ];

  private current = this.members[0];

  getAll() {
    return this.members;
  }
  getCurrent() {
    return this.current;
  }
  setCurrent(id: number) {
    this.current = this.members.find((m) => m.id === id) ?? this.members[0];
  }
}
