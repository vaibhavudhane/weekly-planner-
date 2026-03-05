import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type AppView =
  | 'setup'
  | 'identity'
  | 'hub'
  | 'team'
  | 'backlog'
  | 'backlogEdit'
  | 'cycleSetup'
  | 'planning'
  | 'claim'
  | 'freezeReview'
  | 'progress'
  | 'dashboard'
  | 'catDrill'
  | 'memberDrill'
  | 'taskDrill'
  | 'pastCycles';

export interface Member {
  id: string;
  name: string;
  isLead: boolean;
  isActive: boolean;
  createdAt: string;
}
export interface BacklogEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  estimatedEffort: number | null;
  createdBy: string;
  createdAt: string;
}
export interface PlanningCycle {
  id: string;
  planningDate: string;
  executionStartDate: string;
  executionEndDate: string;
  state: string;
  participatingMemberIds: string[];
  teamCapacity: number;
  createdAt: string;
}
export interface CategoryAllocation {
  id: string;
  cycleId: string;
  category: string;
  percentage: number;
  budgetHours: number;
}
export interface MemberPlan {
  id: string;
  cycleId: string;
  memberId: string;
  isReady: boolean;
  totalPlannedHours: number;
}
export interface TaskAssignment {
  id: string;
  memberPlanId: string;
  backlogEntryId: string;
  committedHours: number;
  progressStatus: string;
  hoursCompleted: number;
  createdAt: string;
}
export interface ProgressUpdate {
  id: string;
  taskAssignmentId: string;
  timestamp: string;
  previousHoursCompleted: number;
  newHoursCompleted: number;
  previousStatus: string;
  newStatus: string;
  note: string;
  updatedBy: string;
}
export interface AppSettings {
  setupComplete: boolean;
  dataVersion: number;
}

function uid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
}
function lsGet<T>(k: string, d: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch {
    return d;
  }
}
function lsSet(k: string, v: any) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    console.error(e);
  }
}

@Injectable({ providedIn: 'root' })
export class AppStateService {
  theme = signal<'light' | 'dark'>(lsGet('wpt_theme', 'light'));
  view = signal<AppView>('identity');
  toast = signal('');
  errorMsg = signal('');
  appSettings = signal<AppSettings>(
    lsGet('wpt_appSettings', { setupComplete: false, dataVersion: 1 }),
  );
  teamMembers = signal<Member[]>(lsGet('wpt_teamMembers', []));
  backlogEntries = signal<BacklogEntry[]>(lsGet('wpt_backlogEntries', []));
  planningCycles = signal<PlanningCycle[]>(lsGet('wpt_planningCycles', []));
  categoryAllocations = signal<CategoryAllocation[]>(lsGet('wpt_categoryAllocations', []));
  memberPlans = signal<MemberPlan[]>(lsGet('wpt_memberPlans', []));
  taskAssignments = signal<TaskAssignment[]>(lsGet('wpt_taskAssignments', []));
  progressUpdates = signal<ProgressUpdate[]>(lsGet('wpt_progressUpdates', []));
  currentUserId = signal<string | null>(null);
  setupMembers = signal<Member[]>([]);
  setupName = signal('');
  setupError = signal('');
  newMemberName = signal('');
  teamError = signal('');
  editingMemberId = signal<string | null>(null);
  editingMemberVal = signal('');
  blFilter = signal({ client: true, tech: true, rd: true, status: '', search: '' });
  editEntry = signal<BacklogEntry | null>(null);
  backlogForm = signal<any>({ title: '', description: '', category: '', estimatedEffort: '' });
  backlogError = signal('');
  cycleForm = signal<any>({
    planningDate: '',
    memberIds: [] as string[],
    pctClient: 0,
    pctTech: 0,
    pctRD: 0,
  });
  cycleError = signal('');
  editingAssignId = signal<string | null>(null);
  editingAssignHrs = signal(0);
  assignError = signal('');
  claimCatFilter = signal<any>({ CLIENT_FOCUSED: true, TECH_DEBT: true, R_AND_D: true });
  claimModal = signal(false);
  claimEntry = signal<BacklogEntry | null>(null);
  claimHours = signal(0);
  claimError = signal('');
  freezeDetailMember = signal<string | null>(null);
  progressModal = signal(false);
  progressTA = signal<TaskAssignment | null>(null);
  progForm = signal<any>({ hours: 0, status: '', note: '' });
  progError = signal('');
  dashCycleId = signal<string | null>(null);
  drillCat = signal<string | null>(null);
  drillMember = signal<string | null>(null);
  drillTask = signal<TaskAssignment | null>(null);
  prevDrillView = signal<AppView>('dashboard');
  confirmModal = signal(false);
  confirmTitle = signal('');
  confirmText = signal('');
  confirmYes = signal('');
  confirmNo = signal('');
  confirmDanger = signal(false);
  confirmAction = signal<() => void>(() => {});
  importModal = signal(false);
  importData = signal<any>(null);
  importFileName = signal('');
  importError = signal('');

  constructor(private http: HttpClient) {}

  init() {
    if (!this.appSettings().setupComplete) {
      this.view.set('setup');
      return;
    }
    const active = this.teamMembers().filter((m) => m.isActive);
    if (active.length === 1 && active[0].isLead) {
      this.currentUserId.set(active[0].id);
      this.view.set('hub');
    } else {
      this.view.set('identity');
    }
  }

  toggleTheme() {
    const t = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(t);
    lsSet('wpt_theme', t);
  }

  save() {
    lsSet('wpt_appSettings', this.appSettings());
    lsSet('wpt_teamMembers', this.teamMembers());
    lsSet('wpt_backlogEntries', this.backlogEntries());
    lsSet('wpt_planningCycles', this.planningCycles());
    lsSet('wpt_categoryAllocations', this.categoryAllocations());
    lsSet('wpt_memberPlans', this.memberPlans());
    lsSet('wpt_taskAssignments', this.taskAssignments());
    lsSet('wpt_progressUpdates', this.progressUpdates());
  }

  goHome() {
    this.view.set('hub');
    this.dashCycleId.set(this.activeCycle()?.id || null);
  }
  showToast(m: string) {
    this.toast.set(m);
    setTimeout(() => this.toast.set(''), 3000);
  }
  showError(m: string) {
    this.errorMsg.set(m);
    setTimeout(() => this.errorMsg.set(''), 5000);
  }
  showConfirm(
    title: string,
    text: string,
    action: () => void,
    yes = 'Yes',
    danger = false,
    no = 'No, Go Back',
  ) {
    this.confirmTitle.set(title);
    this.confirmText.set(text);
    this.confirmAction.set(action);
    this.confirmYes.set(yes);
    this.confirmDanger.set(danger);
    this.confirmNo.set(no);
    this.confirmModal.set(true);
  }

  activeMembers() {
    return this.teamMembers().filter((m) => m.isActive);
  }
  getMember(id: string | null) {
    return this.teamMembers().find((m) => m.id === id) || null;
  }
  currentUserName() {
    return this.getMember(this.currentUserId())?.name || '';
  }
  isLead() {
    return this.getMember(this.currentUserId())?.isLead || false;
  }
  activeCycle() {
    return (
      this.planningCycles().find((c) => ['SETUP', 'PLANNING', 'FROZEN'].includes(c.state)) || null
    );
  }
  frozenCycle() {
    return this.planningCycles().find((c) => c.state === 'FROZEN') || this.activeCycle();
  }
  isParticipating() {
    const c = this.activeCycle();
    return c ? c.participatingMemberIds.includes(this.currentUserId()!) : false;
  }
  catLabel(c: string) {
    return (
      ({ CLIENT_FOCUSED: 'Client Focused', TECH_DEBT: 'Tech Debt', R_AND_D: 'R&D' } as any)[c] || c
    );
  }
  statusLabel(s: string) {
    return (
      (
        {
          NOT_STARTED: 'Not Started',
          IN_PROGRESS: 'In Progress',
          COMPLETED: 'Completed',
          BLOCKED: 'Blocked',
        } as any
      )[s] || s
    );
  }

  selectIdentity(id: string) {
    this.currentUserId.set(id);
    this.dashCycleId.set(this.activeCycle()?.id || null);
    this.view.set('hub');
  }

  addSetupMember() {
    this.setupError.set('');
    const n = this.setupName().trim();
    if (!n) {
      this.setupError.set('Please type a name.');
      return;
    }
    if (this.setupMembers().some((m) => m.name.toLowerCase() === n.toLowerCase())) {
      this.setupError.set('This name is already used.');
      return;
    }
    this.setupMembers.update((ms) => [
      ...ms,
      {
        id: uid(),
        name: n,
        isLead: ms.length === 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ]);
    this.setupName.set('');
  }
  finishSetup() {
    if (this.setupMembers().length === 0) {
      this.setupError.set('Please add at least one team member.');
      return;
    }
    if (!this.setupMembers().some((m) => m.isLead)) {
      this.setupError.set('Please pick one person as the Team Lead.');
      return;
    }
    this.teamMembers.set(this.setupMembers());
    this.appSettings.update((s) => ({ ...s, setupComplete: true }));
    this.save();
    if (this.teamMembers().length === 1) {
      this.currentUserId.set(this.teamMembers()[0].id);
      this.view.set('hub');
    } else {
      this.view.set('identity');
    }
  }
  makeSetupLead(id: string) {
    this.setupMembers.update((ms) => ms.map((m) => ({ ...m, isLead: m.id === id })));
  }
  removeSetupMember(id: string) {
    this.setupMembers.update((ms) => {
      const f = ms.filter((m) => m.id !== id);
      if (f.length > 0 && !f.some((m) => m.isLead)) f[0] = { ...f[0], isLead: true };
      return f;
    });
  }

  addTeamMember() {
    this.teamError.set('');
    const n = this.newMemberName().trim();
    if (!n) {
      this.teamError.set('Please type a name.');
      return;
    }
    if (n.length > 100) {
      this.teamError.set('Name is too long.');
      return;
    }
    if (this.teamMembers().some((m) => m.name.toLowerCase() === n.toLowerCase())) {
      this.teamError.set('This name is already used.');
      return;
    }
    this.teamMembers.update((ms) => [
      ...ms,
      { id: uid(), name: n, isLead: false, isActive: true, createdAt: new Date().toISOString() },
    ]);
    this.newMemberName.set('');
    this.save();
    this.showToast('Team member added!');
  }
  saveEditMember(id: string) {
    const n = this.editingMemberVal().trim();
    if (!n) {
      this.teamError.set('Please type a name.');
      return;
    }
    if (this.teamMembers().some((m) => m.id !== id && m.name.toLowerCase() === n.toLowerCase())) {
      this.showError('This name is already used.');
      return;
    }
    this.teamMembers.update((ms) => ms.map((m) => (m.id === id ? { ...m, name: n } : m)));
    this.editingMemberId.set(null);
    this.save();
    this.showToast('Name updated!');
  }
  makeLead(id: string) {
    this.teamMembers.update((ms) => ms.map((m) => ({ ...m, isLead: m.id === id })));
    this.save();
    this.showToast('Team Lead changed!');
  }
  deactivateMember(id: string) {
    const ac = this.activeCycle();
    if (ac && ac.participatingMemberIds.includes(id)) {
      this.showError('This person is part of an active plan right now.');
      return;
    }
    this.showConfirm(
      'Remove ' + this.getMember(id)?.name + '?',
      "They won't be available for future plans. Their past work will still be saved.",
      () => {
        this.teamMembers.update((ms) =>
          ms.map((m) => (m.id === id ? { ...m, isActive: false } : m)),
        );
        this.save();
        this.showToast('Member deactivated.');
      },
      'Yes, Remove Them',
      true,
    );
  }
  reactivateMember(id: string) {
    this.teamMembers.update((ms) => ms.map((m) => (m.id === id ? { ...m, isActive: true } : m)));
    this.save();
    this.showToast('Member reactivated!');
  }

  getEntry(id: string) {
    return this.backlogEntries().find((e) => e.id === id) || null;
  }
  filteredBacklog() {
    let entries = this.backlogEntries();
    const f = this.blFilter();
    const cats: string[] = [];
    if (f.client) cats.push('CLIENT_FOCUSED');
    if (f.tech) cats.push('TECH_DEBT');
    if (f.rd) cats.push('R_AND_D');
    entries = entries.filter((e) => cats.includes(e.category));
    if (!f.status)
      entries = entries.filter((e) => e.status === 'AVAILABLE' || e.status === 'IN_PLAN');
    else if (f.status !== 'ALL') entries = entries.filter((e) => e.status === f.status);
    if (f.search) {
      const s = f.search.toLowerCase();
      entries = entries.filter((e) => e.title.toLowerCase().includes(s));
    }
    return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  startEditEntry(e: BacklogEntry) {
    this.editEntry.set(e);
    this.backlogForm.set({
      title: e.title,
      description: e.description,
      category: e.category,
      estimatedEffort: e.estimatedEffort ?? '',
    });
    this.backlogError.set('');
    this.view.set('backlogEdit');
  }
  saveBacklogEntry() {
    this.backlogError.set('');
    const f = this.backlogForm();
    if (!f.title.trim()) {
      this.backlogError.set('Please give this item a title.');
      return;
    }
    if (!this.editEntry() && !f.category) {
      this.backlogError.set('Please pick a category.');
      return;
    }
    const eff =
      f.estimatedEffort === '' || f.estimatedEffort === null ? null : parseFloat(f.estimatedEffort);
    if (eff !== null && (eff < 0 || isNaN(eff))) {
      this.backlogError.set("Hours can't be less than zero.");
      return;
    }
    if (eff !== null && eff % 0.5 !== 0) {
      this.backlogError.set('Please enter hours in half-hour steps.');
      return;
    }
    if (this.editEntry()) {
      this.backlogEntries.update((es) =>
        es.map((e) =>
          e.id === this.editEntry()!.id
            ? { ...e, title: f.title.trim(), description: f.description, estimatedEffort: eff }
            : e,
        ),
      );
    } else {
      this.backlogEntries.update((es) => [
        ...es,
        {
          id: uid(),
          title: f.title.trim(),
          description: f.description,
          category: f.category,
          status: 'AVAILABLE',
          estimatedEffort: eff,
          createdBy: this.currentUserId()!,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    this.save();
    this.showToast(this.editEntry() ? 'Changes saved!' : 'Backlog item saved!');
    this.view.set('backlog');
  }
  archiveEntry(id: string) {
    const e = this.getEntry(id)!;
    if (e.status === 'IN_PLAN') {
      this.showError('This item is part of an active plan.');
      return;
    }
    this.showConfirm(
      'Archive "' + e.title + '"?',
      'It will be moved to the archived list.',
      () => {
        this.backlogEntries.update((es) =>
          es.map((x) => (x.id === id ? { ...x, status: 'ARCHIVED' } : x)),
        );
        this.save();
        this.showToast('Archived!');
      },
      'Yes, Archive It',
      true,
    );
  }

  isTuesday(d: string) {
    if (!d) return false;
    return new Date(d + 'T12:00:00').getDay() === 2;
  }
  addDays(d: string, n: number) {
    const dt = new Date(d + 'T12:00:00');
    dt.setDate(dt.getDate() + n);
    return dt.toISOString().slice(0, 10);
  }
  getNextTuesday() {
    const d = new Date();
    while (d.getDay() !== 2) d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  pctSum() {
    const f = this.cycleForm();
    return (parseInt(f.pctClient) || 0) + (parseInt(f.pctTech) || 0) + (parseInt(f.pctRD) || 0);
  }
  calcBudget(cat: string) {
    const f = this.cycleForm();
    const cap = f.memberIds.length * 30;
    const pcts: any = {
      CLIENT_FOCUSED: parseInt(f.pctClient) || 0,
      TECH_DEBT: parseInt(f.pctTech) || 0,
      R_AND_D: parseInt(f.pctRD) || 0,
    };
    const raw: any = {};
    let sum = 0;
    for (const c of ['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D']) {
      raw[c] = Math.round(((cap * pcts[c]) / 100) * 2) / 2;
      sum += raw[c];
    }
    if (sum !== cap) {
      const s = ['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D'].sort((a, b) => pcts[b] - pcts[a]);
      raw[s[0]] += cap - sum;
    }
    return raw[cat];
  }
  startNewWeek() {
    if (this.activeCycle()) {
      this.showError('There is already a week being planned.');
      return;
    }
    const d = this.getNextTuesday();
    this.planningCycles.update((cs) => [
      ...cs,
      {
        id: uid(),
        planningDate: d,
        executionStartDate: this.addDays(d, 1),
        executionEndDate: this.addDays(d, 6),
        state: 'SETUP',
        participatingMemberIds: [],
        teamCapacity: 0,
        createdAt: new Date().toISOString(),
      },
    ]);
    this.cycleForm.set({
      planningDate: d,
      memberIds: this.activeMembers().map((m) => m.id),
      pctClient: 0,
      pctTech: 0,
      pctRD: 0,
    });
    this.save();
    this.view.set('cycleSetup');
  }
  openPlanning() {
    this.cycleError.set('');
    const f = this.cycleForm();
    if (f.memberIds.length === 0) {
      this.cycleError.set('Please pick at least one team member.');
      return;
    }
    if (this.pctSum() !== 100) {
      this.cycleError.set('Percentages must add up to 100.');
      return;
    }
    if (!this.isTuesday(f.planningDate)) {
      this.cycleError.set('Please pick a Tuesday.');
      return;
    }
    const c = this.activeCycle()!;
    this.planningCycles.update((cs) =>
      cs.map((x) =>
        x.id !== c.id
          ? x
          : {
              ...x,
              planningDate: f.planningDate,
              executionStartDate: this.addDays(f.planningDate, 1),
              executionEndDate: this.addDays(f.planningDate, 6),
              participatingMemberIds: f.memberIds,
              teamCapacity: f.memberIds.length * 30,
              state: 'PLANNING',
            },
      ),
    );
    this.categoryAllocations.update((as) => [
      ...as.filter((a) => a.cycleId !== c.id),
      ...['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D'].map((cat) => ({
        id: uid(),
        cycleId: c.id,
        category: cat,
        percentage:
          cat === 'CLIENT_FOCUSED'
            ? parseInt(f.pctClient)
            : cat === 'TECH_DEBT'
              ? parseInt(f.pctTech)
              : parseInt(f.pctRD),
        budgetHours: this.calcBudget(cat),
      })),
    ]);
    this.memberPlans.update((ps) => [
      ...ps.filter((p) => p.cycleId !== c.id),
      ...f.memberIds.map((mid: string) => ({
        id: uid(),
        cycleId: c.id,
        memberId: mid,
        isReady: false,
        totalPlannedHours: 0,
      })),
    ]);
    this.save();
    this.showToast('Planning is open! Team members can now plan their work.');
    this.goHome();
  }

  myPlan() {
    const c = this.activeCycle();
    return c
      ? this.memberPlans().find((p) => p.cycleId === c.id && p.memberId === this.currentUserId()) ||
          null
      : null;
  }
  myAssignments() {
    const p = this.myPlan();
    return p ? this.taskAssignments().filter((t) => t.memberPlanId === p.id) : [];
  }
  myPlannedHours() {
    return this.myAssignments().reduce((s, t) => s + t.committedHours, 0);
  }
  getCatBudget(cat: string) {
    const c = this.activeCycle();
    if (!c) return 0;
    const a = this.categoryAllocations().find((x) => x.cycleId === c.id && x.category === cat);
    return a ? a.budgetHours : 0;
  }
  getCatClaimed(cat: string) {
    const c = this.activeCycle();
    if (!c) return 0;
    const pids = this.memberPlans()
      .filter((p) => p.cycleId === c.id)
      .map((p) => p.id);
    return this.taskAssignments()
      .filter(
        (t) => pids.includes(t.memberPlanId) && this.getEntry(t.backlogEntryId)?.category === cat,
      )
      .reduce((s, t) => s + t.committedHours, 0);
  }
  toggleReady() {
    const p = this.myPlan();
    if (p) {
      this.memberPlans.update((ps) =>
        ps.map((x) => (x.id === p.id ? { ...x, isReady: !x.isReady } : x)),
      );
      this.save();
    }
  }

  claimableEntries() {
    const c = this.activeCycle();
    if (!c) return [];
    const f = this.claimCatFilter();
    return this.backlogEntries().filter((e) => {
      if (e.status !== 'AVAILABLE' && e.status !== 'IN_PLAN') return false;
      if (!f[e.category]) return false;
      if (e.status === 'IN_PLAN') {
        const ocs = this.planningCycles().filter(
          (cy) => cy.id !== c.id && ['PLANNING', 'FROZEN'].includes(cy.state),
        );
        for (const oc of ocs) {
          const pids = this.memberPlans()
            .filter((p) => p.cycleId === oc.id)
            .map((p) => p.id);
          if (
            this.taskAssignments().some(
              (t) => pids.includes(t.memberPlanId) && t.backlogEntryId === e.id,
            )
          )
            return false;
        }
      }
      return true;
    });
  }
  startClaim(e: BacklogEntry) {
    this.claimEntry.set(e);
    this.claimHours.set(0);
    this.claimError.set('');
    this.claimModal.set(true);
  }
  submitClaim() {
    this.claimError.set('');
    const h = this.claimHours();
    if (!h || h <= 0) {
      this.claimError.set('Please enter more than 0 hours.');
      return;
    }
    if (h % 0.5 !== 0) {
      this.claimError.set('Please enter hours in half-hour steps.');
      return;
    }
    const rem = 30 - this.myPlannedHours();
    if (h > rem) {
      this.claimError.set('You only have ' + rem + ' hours left.');
      return;
    }
    const e = this.claimEntry()!;
    const catRem = this.getCatBudget(e.category) - this.getCatClaimed(e.category);
    if (h > catRem) {
      this.claimError.set(
        'The ' + this.catLabel(e.category) + ' budget only has ' + catRem + ' hours left.',
      );
      return;
    }
    const p = this.myPlan()!;
    this.taskAssignments.update((ts) => [
      ...ts,
      {
        id: uid(),
        memberPlanId: p.id,
        backlogEntryId: e.id,
        committedHours: h,
        progressStatus: 'NOT_STARTED',
        hoursCompleted: 0,
        createdAt: new Date().toISOString(),
      },
    ]);
    if (e.status === 'AVAILABLE')
      this.backlogEntries.update((es) =>
        es.map((x) => (x.id === e.id ? { ...x, status: 'IN_PLAN' } : x)),
      );
    this.memberPlans.update((ps) =>
      ps.map((x) =>
        x.id === p.id ? { ...x, totalPlannedHours: this.myPlannedHours() + h, isReady: false } : x,
      ),
    );
    this.save();
    this.claimModal.set(false);
    this.showToast('Added! ' + e.title + ' — ' + h + 'h');
    this.view.set('planning');
  }
  saveAssignHours(taId: string) {
    this.assignError.set('');
    const ta = this.taskAssignments().find((t) => t.id === taId)!;
    const newH = this.editingAssignHrs();
    const oldH = ta.committedHours;
    const delta = newH - oldH;
    if (newH <= 0) {
      this.assignError.set('Hours must be more than 0.');
      return;
    }
    if (newH % 0.5 !== 0) {
      this.assignError.set('Please enter hours in half-hour steps.');
      return;
    }
    if (delta > 0) {
      const rem = 30 - this.myPlannedHours();
      if (delta > rem) {
        this.assignError.set('You only have ' + (rem + oldH) + ' hours you can set here.');
        return;
      }
      const e = this.getEntry(ta.backlogEntryId)!;
      const catRem = this.getCatBudget(e.category) - this.getCatClaimed(e.category);
      if (delta > catRem) {
        this.assignError.set(
          'The ' +
            this.catLabel(e.category) +
            ' budget only has ' +
            (catRem + oldH) +
            ' hours left.',
        );
        return;
      }
    }
    this.taskAssignments.update((ts) =>
      ts.map((t) => (t.id === taId ? { ...t, committedHours: newH } : t)),
    );
    const p = this.myPlan()!;
    this.memberPlans.update((ps) =>
      ps.map((x) =>
        x.id === p.id ? { ...x, totalPlannedHours: this.myPlannedHours(), isReady: false } : x,
      ),
    );
    this.editingAssignId.set(null);
    this.save();
    this.showToast('Hours updated!');
  }
  removeAssignment(taId: string) {
    const ta = this.taskAssignments().find((t) => t.id === taId)!;
    const e = this.getEntry(ta.backlogEntryId)!;
    this.showConfirm(
      'Remove "' + e?.title + '"?',
      'The ' + ta.committedHours + ' hours will be freed up.',
      () => {
        this.taskAssignments.update((ts) => ts.filter((t) => t.id !== taId));
        const c = this.activeCycle()!;
        const pids = this.memberPlans()
          .filter((p) => p.cycleId === c.id)
          .map((p) => p.id);
        const still = this.taskAssignments().some(
          (t) => pids.includes(t.memberPlanId) && t.backlogEntryId === e.id,
        );
        if (!still && e.status === 'IN_PLAN')
          this.backlogEntries.update((es) =>
            es.map((x) => (x.id === e.id ? { ...x, status: 'AVAILABLE' } : x)),
          );
        const p = this.myPlan()!;
        this.memberPlans.update((ps) =>
          ps.map((x) =>
            x.id === p.id ? { ...x, totalPlannedHours: this.myPlannedHours(), isReady: false } : x,
          ),
        );
        this.save();
        this.showToast('Removed!');
      },
      'Yes, Remove It',
      true,
    );
  }

  getMemberPlan(mid: string) {
    const c = this.activeCycle();
    return c
      ? this.memberPlans().find((p) => p.cycleId === c.id && p.memberId === mid) || null
      : null;
  }
  getMemberAssignments(mid: string) {
    const p = this.getMemberPlan(mid);
    return p ? this.taskAssignments().filter((t) => t.memberPlanId === p.id) : [];
  }
  getMemberPlanned(mid: string) {
    return this.getMemberAssignments(mid).reduce((s, t) => s + t.committedHours, 0);
  }
  freezeErrors() {
    const c = this.activeCycle();
    if (!c) return [];
    const errs: string[] = [];
    for (const mid of c.participatingMemberIds) {
      const h = this.getMemberPlanned(mid);
      const n = this.getMember(mid)?.name;
      if (h !== 30)
        errs.push(
          n +
            ' has ' +
            h +
            ' hours (needs ' +
            (h < 30 ? 30 - h + ' more' : h - 30 + ' fewer') +
            ').',
        );
    }
    for (const cat of ['CLIENT_FOCUSED', 'TECH_DEBT', 'R_AND_D']) {
      const b = this.getCatBudget(cat),
        cl = this.getCatClaimed(cat);
      if (cl !== b)
        errs.push(this.catLabel(cat) + ' has ' + cl + 'h planned but budget is ' + b + 'h.');
    }
    return errs;
  }
  confirmFreeze() {
    this.showConfirm(
      'Freeze the Plan?',
      'After this, nobody can change their hours. Team members will only report progress.',
      () => {
        if (this.freezeErrors().length > 0) {
          this.showError('Validation failed.');
          return;
        }
        const c = this.activeCycle()!;
        this.planningCycles.update((cs) =>
          cs.map((x) => (x.id === c.id ? { ...x, state: 'FROZEN' } : x)),
        );
        this.save();
        this.showToast('The plan is frozen! Team members can now report progress.');
        this.goHome();
      },
      'Yes, Freeze It',
    );
  }
  confirmCancelPlanning() {
    this.showConfirm(
      'Cancel Planning?',
      "This will erase everyone's plans. This cannot be undone.",
      () => {
        const c = this.activeCycle()!;
        const pids = this.memberPlans()
          .filter((p) => p.cycleId === c.id)
          .map((p) => p.id);
        const eids = [
          ...new Set(
            this.taskAssignments()
              .filter((t) => pids.includes(t.memberPlanId))
              .map((t) => t.backlogEntryId),
          ),
        ];
        this.taskAssignments.update((ts) => ts.filter((t) => !pids.includes(t.memberPlanId)));
        this.memberPlans.update((ps) => ps.filter((p) => p.cycleId !== c.id));
        this.categoryAllocations.update((as) => as.filter((a) => a.cycleId !== c.id));
        for (const eid of eids) {
          const any = this.taskAssignments().some((t) => t.backlogEntryId === eid);
          if (!any)
            this.backlogEntries.update((es) =>
              es.map((x) =>
                x.id === eid && x.status === 'IN_PLAN' ? { ...x, status: 'AVAILABLE' } : x,
              ),
            );
        }
        this.planningCycles.update((cs) => cs.filter((x) => x.id !== c.id));
        this.save();
        this.showToast('Planning has been canceled.');
        this.goHome();
      },
      'Yes, Cancel Planning',
      true,
    );
  }

  myFrozenAssignments() {
    const c = this.frozenCycle();
    if (!c) return [];
    const p = this.memberPlans().find(
      (pp) => pp.cycleId === c.id && pp.memberId === this.currentUserId(),
    );
    if (!p) return [];
    const a = this.taskAssignments().filter((t) => t.memberPlanId === p.id);
    const order: any = { BLOCKED: 0, IN_PROGRESS: 1, NOT_STARTED: 2, COMPLETED: 3 };
    return [...a].sort((x, y) => (order[x.progressStatus] || 9) - (order[y.progressStatus] || 9));
  }
  myCompletedHours() {
    return this.myFrozenAssignments().reduce((s, t) => s + t.hoursCompleted, 0);
  }
  startProgressUpdate(ta: TaskAssignment) {
    this.progressTA.set(ta);
    this.progForm.set({ hours: ta.hoursCompleted, status: ta.progressStatus, note: '' });
    this.progError.set('');
    this.progressModal.set(true);
  }
  allowedStatuses() {
    const ta = this.progressTA();
    if (!ta) return [];
    const map: any = {
      NOT_STARTED: ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED'],
      IN_PROGRESS: ['IN_PROGRESS', 'COMPLETED', 'BLOCKED'],
      BLOCKED: ['BLOCKED', 'IN_PROGRESS'],
      COMPLETED: ['COMPLETED', 'IN_PROGRESS'],
    };
    return map[ta.progressStatus] || [];
  }
  submitProgress() {
    this.progError.set('');
    const f = this.progForm();
    const ta = this.progressTA()!;
    if (f.hours < 0) {
      this.progError.set("Hours can't be less than zero.");
      return;
    }
    if (f.hours % 0.5 !== 0) {
      this.progError.set('Please enter hours in half-hour steps.');
      return;
    }
    let status = f.status;
    if (f.hours > 0 && ta.progressStatus === 'NOT_STARTED' && status === 'NOT_STARTED')
      status = 'IN_PROGRESS';
    if (
      (ta.progressStatus === 'NOT_STARTED' && status === 'COMPLETED') ||
      (ta.progressStatus === 'BLOCKED' && status === 'COMPLETED')
    ) {
      this.progError.set('Please set this to "In Progress" first.');
      return;
    }
    this.progressUpdates.update((ps) => [
      ...ps,
      {
        id: uid(),
        taskAssignmentId: ta.id,
        timestamp: new Date().toISOString(),
        previousHoursCompleted: ta.hoursCompleted,
        newHoursCompleted: f.hours,
        previousStatus: ta.progressStatus,
        newStatus: status,
        note: f.note || '',
        updatedBy: this.currentUserId()!,
      },
    ]);
    this.taskAssignments.update((ts) =>
      ts.map((t) =>
        t.id === ta.id ? { ...t, hoursCompleted: f.hours, progressStatus: status } : t,
      ),
    );
    this.save();
    this.progressModal.set(false);
    this.showToast('Progress saved!');
  }

  viewDashboard() {
    this.dashCycleId.set(this.activeCycle()?.id || null);
    this.view.set('dashboard');
  }
  dashCycle() {
    return this.planningCycles().find((c) => c.id === this.dashCycleId()) || null;
  }
  dashAllAssignments() {
    const c = this.dashCycle();
    if (!c) return [];
    const pids = this.memberPlans()
      .filter((p) => p.cycleId === c.id)
      .map((p) => p.id);
    return this.taskAssignments().filter((t) => pids.includes(t.memberPlanId));
  }
  dashCapacity() {
    return this.dashCycle()?.teamCapacity || 0;
  }
  dashTotalCompleted() {
    return this.dashAllAssignments().reduce((s, t) => s + t.hoursCompleted, 0);
  }
  dashCompletedTasks() {
    return this.dashAllAssignments().filter((t) => t.progressStatus === 'COMPLETED').length;
  }
  dashBlockedTasks() {
    return this.dashAllAssignments().filter((t) => t.progressStatus === 'BLOCKED').length;
  }
  getDashCatBudget(cat: string) {
    const c = this.dashCycle();
    if (!c) return 0;
    const a = this.categoryAllocations().find((x) => x.cycleId === c.id && x.category === cat);
    return a ? a.budgetHours : 0;
  }
  dashCatCompleted(cat: string) {
    return this.dashAllAssignments()
      .filter((t) => this.getEntry(t.backlogEntryId)?.category === cat)
      .reduce((s, t) => s + t.hoursCompleted, 0);
  }
  dashCatAssignments(cat: string) {
    return this.dashAllAssignments().filter(
      (t) => this.getEntry(t.backlogEntryId)?.category === cat,
    );
  }
  getAssignMember(ta: TaskAssignment | null) {
    if (!ta) return null;
    const p = this.memberPlans().find((pp) => pp.id === ta.memberPlanId);
    return p?.memberId || null;
  }
  dashMemberCompleted(mid: string) {
    const c = this.dashCycle();
    const p = this.memberPlans().find((pp) => pp.cycleId === c?.id && pp.memberId === mid);
    return p
      ? this.taskAssignments()
          .filter((t) => t.memberPlanId === p.id)
          .reduce((s, t) => s + t.hoursCompleted, 0)
      : 0;
  }
  dashMemberAssignments(mid: string) {
    const c = this.dashCycle();
    const p = this.memberPlans().find((pp) => pp.cycleId === c?.id && pp.memberId === mid);
    return p ? this.taskAssignments().filter((t) => t.memberPlanId === p.id) : [];
  }
  dashMemberBlocked(mid: string) {
    return this.dashMemberAssignments(mid).some((t) => t.progressStatus === 'BLOCKED');
  }
  dashMemberAllDone(mid: string) {
    const a = this.dashMemberAssignments(mid);
    return a.length > 0 && a.every((t) => t.progressStatus === 'COMPLETED');
  }
  allEntryAssignments(eid: string) {
    return this.dashAllAssignments().filter((t) => t.backlogEntryId === eid);
  }
  taskProgressHistory(taId: string | undefined) {
    if (!taId) return [];
    return this.progressUpdates()
      .filter((p) => p.taskAssignmentId === taId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  confirmFinishWeek() {
    const c = this.activeCycle();
    if (!c || c.state !== 'FROZEN') return;
    const pids = this.memberPlans()
      .filter((p) => p.cycleId === c.id)
      .map((p) => p.id);
    const allDone = this.taskAssignments()
      .filter((t) => pids.includes(t.memberPlanId))
      .every((t) => t.progressStatus === 'COMPLETED');
    this.showConfirm(
      'Finish This Week?',
      allDone
        ? 'All tasks are completed! Close out this week?'
        : 'Some tasks are not finished yet. Those backlog items will go back to the backlog. Are you sure?',
      () => {
        this.planningCycles.update((cs) =>
          cs.map((x) => (x.id === c.id ? { ...x, state: 'COMPLETED' } : x)),
        );
        const eids = [
          ...new Set(
            this.taskAssignments()
              .filter((t) => pids.includes(t.memberPlanId))
              .map((t) => t.backlogEntryId),
          ),
        ];
        for (const eid of eids) {
          const tas = this.taskAssignments().filter(
            (t) => pids.includes(t.memberPlanId) && t.backlogEntryId === eid,
          );
          this.backlogEntries.update((es) =>
            es.map((x) =>
              x.id === eid
                ? {
                    ...x,
                    status: tas.every((t) => t.progressStatus === 'COMPLETED')
                      ? 'COMPLETED'
                      : 'AVAILABLE',
                  }
                : x,
            ),
          );
        }
        this.save();
        this.showToast('This week is done! You can start planning a new week.');
        this.goHome();
      },
      'Yes, Finish This Week',
    );
  }

  pastCycles() {
    return this.planningCycles()
      .filter((c) => c.state === 'COMPLETED' || c.state === 'FROZEN')
      .sort((a, b) => b.planningDate.localeCompare(a.planningDate));
  }

  exportData() {
    const data = {
      appName: 'WeeklyPlanTracker',
      dataVersion: 1,
      exportedAt: new Date().toISOString(),
      data: {
        appSettings: this.appSettings(),
        teamMembers: this.teamMembers(),
        backlogEntries: this.backlogEntries(),
        planningCycles: this.planningCycles(),
        categoryAllocations: this.categoryAllocations(),
        memberPlans: this.memberPlans(),
        taskAssignments: this.taskAssignments(),
        progressUpdates: this.progressUpdates(),
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    a.download =
      'weeklyplantracker-backup-' +
      d.toISOString().slice(0, 10) +
      '-' +
      d.toTimeString().slice(0, 8).replace(/:/g, '') +
      '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    this.showToast('Your data was saved to a file.');
  }
  handleImportFile(ev: Event) {
    this.importError.set('');
    this.importData.set(null);
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.importFileName.set(f.name);
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const d = JSON.parse(e.target.result);
        if (d.appName !== 'WeeklyPlanTracker') {
          this.importError.set("This file doesn't look like a backup from this app.");
          return;
        }
        if (!d.dataVersion || d.dataVersion > 1) {
          this.importError.set('This backup file is from a newer version.');
          return;
        }
        if (!d.data || !d.data.teamMembers || !d.data.backlogEntries) {
          this.importError.set('This backup file is missing some data.');
          return;
        }
        this.importData.set(d);
      } catch {
        this.importError.set("This file can't be read.");
      }
    };
    reader.readAsText(f);
  }
  executeImport() {
    if (!this.importData()) return;
    const d = this.importData().data;
    this.appSettings.set(d.appSettings || { setupComplete: true, dataVersion: 1 });
    this.teamMembers.set(d.teamMembers || []);
    this.backlogEntries.set(d.backlogEntries || []);
    this.planningCycles.set(d.planningCycles || []);
    this.categoryAllocations.set(d.categoryAllocations || []);
    this.memberPlans.set(d.memberPlans || []);
    this.taskAssignments.set(d.taskAssignments || []);
    this.progressUpdates.set(d.progressUpdates || []);
    this.save();
    this.importModal.set(false);
    this.importData.set(null);
    this.currentUserId.set(null);
    this.view.set('identity');
    this.showToast('Your data was loaded!');
  }

  seedData() {
    this.showConfirm(
      'Seed Sample Data?',
      'This will add sample team members, backlog items, and a planning cycle. Existing data will not be erased.',
      () => {
        const m1 = {
          id: uid(),
          name: 'Alice Chen',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        const m2 = {
          id: uid(),
          name: 'Bob Martinez',
          isLead: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        const m3 = {
          id: uid(),
          name: 'Carol Singh',
          isLead: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        const m4 = {
          id: uid(),
          name: 'Dave Kim',
          isLead: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        this.teamMembers.set([m1, m2, m3, m4]);
        this.backlogEntries.set([
          {
            id: uid(),
            title: 'Customer onboarding redesign',
            description: 'Revamp the onboarding flow.',
            category: 'CLIENT_FOCUSED',
            status: 'AVAILABLE',
            estimatedEffort: 12,
            createdBy: m1.id,
            createdAt: new Date().toISOString(),
          },
          {
            id: uid(),
            title: 'Fix billing invoice formatting',
            description: 'Some invoices show wrong currency format.',
            category: 'CLIENT_FOCUSED',
            status: 'AVAILABLE',
            estimatedEffort: 4,
            createdBy: m1.id,
            createdAt: new Date().toISOString(),
          },
          {
            id: uid(),
            title: 'Customer feedback dashboard',
            description: 'Build a dashboard showing NPS scores.',
            category: 'CLIENT_FOCUSED',
            status: 'AVAILABLE',
            estimatedEffort: 16,
            createdBy: m2.id,
            createdAt: new Date().toISOString(),
          },
          {
            id: uid(),
            title: 'Migrate database to PostgreSQL 16',
            description: 'Upgrade from PG 14 to PG 16.',
            category: 'TECH_DEBT',
            status: 'AVAILABLE',
            estimatedEffort: 20,
            createdBy: m1.id,
            createdAt: new Date().toISOString(),
          },
          {
            id: uid(),
            title: 'Remove deprecated API endpoints',
            description: 'Clean up v1 API routes.',
            category: 'TECH_DEBT',
            status: 'AVAILABLE',
            estimatedEffort: 8,
            createdBy: m3.id,
            createdAt: new Date().toISOString(),
          },
          {
            id: uid(),
            title: 'Add unit tests for payment module',
            description: 'Coverage is below 50%.',
            category: 'TECH_DEBT',
            status: 'AVAILABLE',
            estimatedEffort: 10,
            createdBy: m2.id,
            createdAt: new Date().toISOString(),
          },
          {
            id: uid(),
            title: 'Experiment with LLM-based search',
            description: 'Prototype semantic search.',
            category: 'R_AND_D',
            status: 'AVAILABLE',
            estimatedEffort: 15,
            createdBy: m1.id,
            createdAt: new Date().toISOString(),
          },
          {
            id: uid(),
            title: 'Evaluate new caching strategy',
            description: 'Compare Redis Cluster vs Memcached.',
            category: 'R_AND_D',
            status: 'AVAILABLE',
            estimatedEffort: 6,
            createdBy: m4.id,
            createdAt: new Date().toISOString(),
          },
          {
            id: uid(),
            title: 'Build internal CLI tool',
            description: 'A command-line tool for common dev tasks.',
            category: 'R_AND_D',
            status: 'AVAILABLE',
            estimatedEffort: 8,
            createdBy: m3.id,
            createdAt: new Date().toISOString(),
          },
          {
            id: uid(),
            title: 'Client SSO integration',
            description: 'Support SAML-based single sign-on.',
            category: 'CLIENT_FOCUSED',
            status: 'AVAILABLE',
            estimatedEffort: 18,
            createdBy: m1.id,
            createdAt: new Date().toISOString(),
          },
        ]);
        this.planningCycles.set([]);
        this.categoryAllocations.set([]);
        this.memberPlans.set([]);
        this.taskAssignments.set([]);
        this.progressUpdates.set([]);
        this.appSettings.set({ setupComplete: true, dataVersion: 1 });
        this.save();
        this.currentUserId.set(null);
        this.view.set('identity');
        this.showToast('Sample data loaded! Pick a person to get started.');
      },
      'Yes, Load Sample Data',
    );
  }

  resetAll() {
    this.showConfirm(
      'Reset Everything?',
      'This will erase all your data. This cannot be undone.',
      () => {
        localStorage.clear();
        location.reload();
      },
      'Yes, Erase Everything',
      true,
    );
  }
}
