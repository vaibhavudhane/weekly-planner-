import { Injectable, signal, computed } from '@angular/core';
import { Member } from '../models';

/// <summary>
/// Manages the currently active member/role.
/// Uses Angular 21 signals for reactive state.
/// </summary>
@Injectable({ providedIn: 'root' })
export class RoleService {
  private members: Member[] = [
    { id: 1, name: 'Team Lead', isLead: true },
    { id: 2, name: 'Alice', isLead: false },
    { id: 3, name: 'Bob', isLead: false },
  ];

  private currentMember = signal<Member>(this.members[0]);
  currentMember$ = computed(() => this.currentMember());

  getMembers(): Member[] {
    return this.members;
  }
  getCurrent(): Member {
    return this.currentMember();
  }
  switchTo(m: Member): void {
    this.currentMember.set(m);
  }
  isLead(): boolean {
    return this.currentMember().isLead;
  }
}
