import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppStateService } from './services/app-state.service';
import { HttpClient } from '@angular/common/http';

const mockHttp = { get: vi.fn(), post: vi.fn() } as unknown as HttpClient;

function makeService(): AppStateService {
  return new AppStateService(mockHttp);
}

/** Sets up a single-member team (Alice as lead), returns her id */
function setupTeam(service: AppStateService, leadName = 'Alice'): string {
  service.setupName.set(leadName);
  service.addSetupMember();
  service.makeSetupLead(service.setupMembers()[0].id);
  service.finishSetup();
  return service.teamMembers()[0].id;
}

/** Seeds a full PLANNING cycle with one backlog item per category */
function seedPlanningCycle(service: AppStateService, aliceId: string) {
  const cycleId = crypto.randomUUID();
  const allocClient = crypto.randomUUID();
  const allocTech = crypto.randomUUID();
  const allocRD = crypto.randomUUID();
  const planId = crypto.randomUUID();
  const entryClient = crypto.randomUUID();
  const entryTech = crypto.randomUUID();
  const entryRD = crypto.randomUUID();
  const taId = crypto.randomUUID();

  service.backlogEntries.set([
    {
      id: entryClient,
      title: 'Client Work',
      description: '',
      category: 'CLIENT_FOCUSED',
      status: 'AVAILABLE',
      estimatedEffort: 10,
      createdBy: aliceId,
      createdAt: new Date().toISOString(),
    },
    {
      id: entryTech,
      title: 'Tech Debt',
      description: '',
      category: 'TECH_DEBT',
      status: 'AVAILABLE',
      estimatedEffort: 5,
      createdBy: aliceId,
      createdAt: new Date().toISOString(),
    },
    {
      id: entryRD,
      title: 'Research',
      description: '',
      category: 'R_AND_D',
      status: 'AVAILABLE',
      estimatedEffort: 3,
      createdBy: aliceId,
      createdAt: new Date().toISOString(),
    },
  ]);

  service.planningCycles.set([
    {
      id: cycleId,
      planningDate: '2026-03-03',
      executionStartDate: '2026-03-04',
      executionEndDate: '2026-03-09',
      state: 'PLANNING',
      participatingMemberIds: [aliceId],
      teamCapacity: 30,
      createdAt: new Date().toISOString(),
    },
  ]);

  service.categoryAllocations.set([
    { id: allocClient, cycleId, category: 'CLIENT_FOCUSED', percentage: 50, budgetHours: 15 },
    { id: allocTech, cycleId, category: 'TECH_DEBT', percentage: 30, budgetHours: 9 },
    { id: allocRD, cycleId, category: 'R_AND_D', percentage: 20, budgetHours: 6 },
  ]);

  service.memberPlans.set([
    {
      id: planId,
      cycleId,
      memberId: aliceId,
      isReady: false,
      totalPlannedHours: 10,
    },
  ]);

  service.taskAssignments.set([
    {
      id: taId,
      memberPlanId: planId,
      backlogEntryId: entryClient,
      committedHours: 10,
      progressStatus: 'NOT_STARTED',
      hoursCompleted: 0,
      createdAt: new Date().toISOString(),
    },
  ]);

  return { cycleId, planId, taId, entryClient, entryTech, entryRD };
}

/** Seeds a FROZEN cycle with progress data */
function seedFrozenCycle(service: AppStateService, aliceId: string) {
  const ids = seedPlanningCycle(service, aliceId);
  service.planningCycles.update((cs) => cs.map((c) => ({ ...c, state: 'FROZEN' })));
  service.dashCycleId.set(ids.cycleId);
  return ids;
}

describe('AppStateService', () => {
  let service: AppStateService;

  beforeEach(() => {
    localStorage.clear();
    service = makeService();
  });

  // ── Initialization ────────────────────────────────────────────────────────

  it('should create service', () => expect(service).toBeTruthy());

  it('should start on setup view when not configured', () => {
    service.init();
    expect(service.view()).toBe('setup');
  });

  it('should go to identity view after setup with multiple members', () => {
    service.setupName.set('Alice');
    service.addSetupMember();
    service.setupName.set('Bob');
    service.addSetupMember();
    service.makeSetupLead(service.setupMembers()[0].id);
    service.finishSetup();
    expect(service.view()).toBe('identity');
  });

  it('should go directly to hub when only one active lead member', () => {
    setupTeam(service);
    expect(service.view()).toBe('hub');
  });

  it('should init go to hub when single active lead exists in saved state', () => {
    setupTeam(service);
    // Simulate re-init (e.g. page reload)
    service.currentUserId.set(null);
    service.view.set('identity');
    service.init();
    expect(service.view()).toBe('hub');
  });

  // ── Theme ─────────────────────────────────────────────────────────────────

  it('should default theme to light', () => expect(service.theme()).toBe('light'));
  it('should toggle theme to dark', () => {
    service.toggleTheme();
    expect(service.theme()).toBe('dark');
  });
  it('should toggle theme back to light', () => {
    service.toggleTheme();
    service.toggleTheme();
    expect(service.theme()).toBe('light');
  });

  // ── Setup ─────────────────────────────────────────────────────────────────

  it('should add setup member', () => {
    service.setupName.set('Alice');
    service.addSetupMember();
    expect(service.setupMembers().length).toBe(1);
  });

  it('should not add empty name', () => {
    service.setupName.set('   ');
    service.addSetupMember();
    expect(service.setupMembers().length).toBe(0);
    expect(service.setupError()).toBeTruthy();
  });

  it('should not add duplicate name (case insensitive)', () => {
    service.setupName.set('Alice');
    service.addSetupMember();
    service.setupName.set('alice');
    service.addSetupMember();
    expect(service.setupMembers().length).toBe(1);
  });

  it('should auto-assign lead to first member added', () => {
    service.setupName.set('Alice');
    service.addSetupMember();
    expect(service.setupMembers()[0].isLead).toBe(true);
  });

  it('should make setup lead', () => {
    service.setupName.set('Alice');
    service.addSetupMember();
    service.setupName.set('Bob');
    service.addSetupMember();
    service.makeSetupLead(service.setupMembers()[1].id);
    expect(service.setupMembers()[1].isLead).toBe(true);
    expect(service.setupMembers()[0].isLead).toBe(false);
  });

  it('should remove setup member and auto-reassign lead', () => {
    service.setupName.set('Alice');
    service.addSetupMember();
    service.setupName.set('Bob');
    service.addSetupMember();
    service.removeSetupMember(service.setupMembers()[0].id);
    expect(service.setupMembers().length).toBe(1);
    expect(service.setupMembers()[0].isLead).toBe(true);
  });

  it('should finish setup and mark setupComplete', () => {
    setupTeam(service);
    expect(service.appSettings().setupComplete).toBe(true);
  });

  it('should not finish setup without members', () => {
    service.finishSetup();
    expect(service.appSettings().setupComplete).toBe(false);
    expect(service.setupError()).toBeTruthy();
  });

  it('should not finish setup without a lead assigned', () => {
    service.setupName.set('Alice');
    service.addSetupMember();
    service.setupMembers.update((ms) => ms.map((m) => ({ ...m, isLead: false })));
    service.finishSetup();
    expect(service.appSettings().setupComplete).toBe(false);
  });

  // ── Identity ──────────────────────────────────────────────────────────────

  it('should select identity and go to hub', () => {
    service.setupName.set('Alice');
    service.addSetupMember();
    service.setupName.set('Bob');
    service.addSetupMember();
    service.makeSetupLead(service.setupMembers()[0].id);
    service.finishSetup();
    const id = service.teamMembers()[0].id;
    service.selectIdentity(id);
    expect(service.currentUserId()).toBe(id);
    expect(service.view()).toBe('hub');
  });

  it('should identify lead correctly', () => {
    const id = setupTeam(service);
    service.selectIdentity(id);
    expect(service.isLead()).toBe(true);
  });

  it('should identify non-lead correctly', () => {
    service.setupName.set('Alice');
    service.addSetupMember();
    service.setupName.set('Bob');
    service.addSetupMember();
    service.makeSetupLead(service.setupMembers()[0].id);
    service.finishSetup();
    const bob = service.teamMembers().find((m) => m.name === 'Bob')!;
    service.selectIdentity(bob.id);
    expect(service.isLead()).toBe(false);
  });

  // ── Team Management ───────────────────────────────────────────────────────

  it('should add team member', () => {
    setupTeam(service);
    service.newMemberName.set('Bob');
    service.addTeamMember();
    expect(service.teamMembers().some((m) => m.name === 'Bob')).toBe(true);
  });

  it('should not add team member with empty name', () => {
    setupTeam(service);
    const count = service.teamMembers().length;
    service.newMemberName.set('');
    service.addTeamMember();
    expect(service.teamMembers().length).toBe(count);
    expect(service.teamError()).toBeTruthy();
  });

  it('should not add team member with name over 100 chars', () => {
    setupTeam(service);
    const count = service.teamMembers().length;
    service.newMemberName.set('A'.repeat(101));
    service.addTeamMember();
    expect(service.teamMembers().length).toBe(count);
  });

  it('should not add duplicate team member', () => {
    setupTeam(service, 'Alice');
    const count = service.teamMembers().length;
    service.newMemberName.set('Alice');
    service.addTeamMember();
    expect(service.teamMembers().length).toBe(count);
  });

  it('should reactivate member', () => {
    setupTeam(service);
    service.newMemberName.set('Bob');
    service.addTeamMember();
    const bob = service.teamMembers().find((m) => m.name === 'Bob')!;
    service.teamMembers.update((ms) =>
      ms.map((m) => (m.id === bob.id ? { ...m, isActive: false } : m)),
    );
    service.reactivateMember(bob.id);
    expect(service.teamMembers().find((m) => m.id === bob.id)?.isActive).toBe(true);
  });

  it('should make lead via makeLead', () => {
    setupTeam(service);
    service.newMemberName.set('Bob');
    service.addTeamMember();
    const bob = service.teamMembers().find((m) => m.name === 'Bob')!;
    service.makeLead(bob.id);
    expect(service.teamMembers().find((m) => m.id === bob.id)?.isLead).toBe(true);
  });

  it('should save edit member name', () => {
    setupTeam(service);
    const alice = service.teamMembers().find((m) => m.name === 'Alice')!;
    service.editingMemberId.set(alice.id);
    service.editingMemberVal.set('Alicia');
    service.saveEditMember(alice.id);
    expect(service.teamMembers().find((m) => m.id === alice.id)?.name).toBe('Alicia');
  });

  it('should not save edit with empty name', () => {
    setupTeam(service);
    const alice = service.teamMembers().find((m) => m.name === 'Alice')!;
    service.editingMemberId.set(alice.id);
    service.editingMemberVal.set('');
    service.saveEditMember(alice.id);
    expect(service.teamMembers().find((m) => m.id === alice.id)?.name).toBe('Alice');
  });

  it('should not save edit with duplicate name', () => {
    setupTeam(service);
    service.newMemberName.set('Bob');
    service.addTeamMember();
    const bob = service.teamMembers().find((m) => m.name === 'Bob')!;
    service.editingMemberId.set(bob.id);
    service.editingMemberVal.set('Alice'); // already taken
    service.saveEditMember(bob.id);
    expect(service.teamMembers().find((m) => m.id === bob.id)?.name).toBe('Bob');
  });

  it('should show error when deactivating member in active cycle', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedPlanningCycle(service, aliceId);
    service.deactivateMember(aliceId);
    expect(service.errorMsg()).toBeTruthy();
  });

  it('should show confirm modal when deactivating member not in active cycle', () => {
    setupTeam(service);
    service.newMemberName.set('Bob');
    service.addTeamMember();
    const bob = service.teamMembers().find((m) => m.name === 'Bob')!;
    service.deactivateMember(bob.id);
    expect(service.confirmModal()).toBe(true);
  });

  // ── Backlog ───────────────────────────────────────────────────────────────

  it('should add backlog entry', () => {
    service.backlogForm.set({
      title: 'Task 1',
      description: '',
      category: 'CLIENT_FOCUSED',
      estimatedEffort: '5',
    });
    service.saveBacklogEntry();
    expect(service.backlogEntries().length).toBe(1);
    expect(service.backlogEntries()[0].status).toBe('AVAILABLE');
  });

  it('should not save backlog without title', () => {
    service.backlogForm.set({
      title: '',
      description: '',
      category: 'CLIENT_FOCUSED',
      estimatedEffort: '',
    });
    service.saveBacklogEntry();
    expect(service.backlogEntries().length).toBe(0);
    expect(service.backlogError()).toBeTruthy();
  });

  it('should not save backlog without category', () => {
    service.backlogForm.set({ title: 'Task', description: '', category: '', estimatedEffort: '' });
    service.saveBacklogEntry();
    expect(service.backlogEntries().length).toBe(0);
  });

  it('should not save backlog with negative hours', () => {
    service.backlogForm.set({
      title: 'Task',
      description: '',
      category: 'CLIENT_FOCUSED',
      estimatedEffort: '-3',
    });
    service.saveBacklogEntry();
    expect(service.backlogEntries().length).toBe(0);
  });

  it('should not save backlog with non-half-hour effort', () => {
    service.backlogForm.set({
      title: 'Task',
      description: '',
      category: 'CLIENT_FOCUSED',
      estimatedEffort: '2.3',
    });
    service.saveBacklogEntry();
    expect(service.backlogEntries().length).toBe(0);
  });

  it('should save backlog with null effort', () => {
    service.backlogForm.set({
      title: 'Task',
      description: '',
      category: 'CLIENT_FOCUSED',
      estimatedEffort: '',
    });
    service.saveBacklogEntry();
    expect(service.backlogEntries().length).toBe(1);
    expect(service.backlogEntries()[0].estimatedEffort).toBeNull();
  });

  it('should edit existing backlog entry', () => {
    service.backlogForm.set({
      title: 'Original',
      description: '',
      category: 'CLIENT_FOCUSED',
      estimatedEffort: '',
    });
    service.saveBacklogEntry();
    const entry = service.backlogEntries()[0];
    service.startEditEntry(entry);
    service.backlogForm.update((f) => ({ ...f, title: 'Updated' }));
    service.saveBacklogEntry();
    expect(service.backlogEntries()[0].title).toBe('Updated');
    expect(service.backlogEntries().length).toBe(1);
  });

  it('should archive backlog entry via direct update', () => {
    service.backlogForm.set({
      title: 'Task 1',
      description: '',
      category: 'CLIENT_FOCUSED',
      estimatedEffort: '',
    });
    service.saveBacklogEntry();
    const id = service.backlogEntries()[0].id;
    service.backlogEntries.update((es) =>
      es.map((e) => (e.id === id ? { ...e, status: 'ARCHIVED' } : e)),
    );
    expect(service.backlogEntries()[0].status).toBe('ARCHIVED');
  });

  it('should show error when archiving IN_PLAN entry', () => {
    service.backlogEntries.set([
      {
        id: 'e1',
        title: 'Task',
        description: '',
        category: 'CLIENT_FOCUSED',
        status: 'IN_PLAN',
        estimatedEffort: null,
        createdBy: '',
        createdAt: '',
      },
    ]);
    service.archiveEntry('e1');
    expect(service.errorMsg()).toBeTruthy();
  });

  it('should show confirm when archiving AVAILABLE entry', () => {
    service.backlogEntries.set([
      {
        id: 'e1',
        title: 'Task',
        description: '',
        category: 'CLIENT_FOCUSED',
        status: 'AVAILABLE',
        estimatedEffort: null,
        createdBy: '',
        createdAt: '',
      },
    ]);
    service.archiveEntry('e1');
    expect(service.confirmModal()).toBe(true);
  });

  it('should filter backlog by category', () => {
    service.backlogForm.set({
      title: 'Client Task',
      description: '',
      category: 'CLIENT_FOCUSED',
      estimatedEffort: '',
    });
    service.saveBacklogEntry();
    service.backlogForm.set({
      title: 'Tech Task',
      description: '',
      category: 'TECH_DEBT',
      estimatedEffort: '',
    });
    service.saveBacklogEntry();
    service.blFilter.update((f) => ({ ...f, tech: false, rd: false }));
    expect(service.filteredBacklog().every((e) => e.category === 'CLIENT_FOCUSED')).toBe(true);
  });

  it('should filter backlog by search text', () => {
    service.backlogForm.set({
      title: 'Fix login bug',
      description: '',
      category: 'TECH_DEBT',
      estimatedEffort: '',
    });
    service.saveBacklogEntry();
    service.backlogForm.set({
      title: 'Add dashboard',
      description: '',
      category: 'CLIENT_FOCUSED',
      estimatedEffort: '',
    });
    service.saveBacklogEntry();
    service.blFilter.update((f) => ({ ...f, search: 'login' }));
    expect(service.filteredBacklog().length).toBe(1);
  });

  it('should filter backlog by status ALL', () => {
    service.backlogEntries.set([
      {
        id: '1',
        title: 'A',
        description: '',
        category: 'CLIENT_FOCUSED',
        status: 'AVAILABLE',
        estimatedEffort: null,
        createdBy: '',
        createdAt: '',
      },
      {
        id: '2',
        title: 'B',
        description: '',
        category: 'CLIENT_FOCUSED',
        status: 'ARCHIVED',
        estimatedEffort: null,
        createdBy: '',
        createdAt: '',
      },
    ]);
    service.blFilter.update((f) => ({ ...f, status: 'ALL' }));
    expect(service.filteredBacklog().length).toBe(2);
  });

  it('should filter backlog by specific status ARCHIVED', () => {
    service.backlogEntries.set([
      {
        id: '1',
        title: 'A',
        description: '',
        category: 'CLIENT_FOCUSED',
        status: 'AVAILABLE',
        estimatedEffort: null,
        createdBy: '',
        createdAt: '',
      },
      {
        id: '2',
        title: 'B',
        description: '',
        category: 'CLIENT_FOCUSED',
        status: 'ARCHIVED',
        estimatedEffort: null,
        createdBy: '',
        createdAt: '',
      },
    ]);
    service.blFilter.update((f) => ({ ...f, status: 'ARCHIVED' }));
    expect(service.filteredBacklog().every((e) => e.status === 'ARCHIVED')).toBe(true);
  });

  // ── Labels ────────────────────────────────────────────────────────────────

  it('should return correct category labels', () => {
    expect(service.catLabel('CLIENT_FOCUSED')).toBe('Client Focused');
    expect(service.catLabel('TECH_DEBT')).toBe('Tech Debt');
    expect(service.catLabel('R_AND_D')).toBe('R&D');
    expect(service.catLabel('')).toBe('');
  });

  it('should return correct status labels', () => {
    expect(service.statusLabel('NOT_STARTED')).toBe('Not Started');
    expect(service.statusLabel('IN_PROGRESS')).toBe('In Progress');
    expect(service.statusLabel('COMPLETED')).toBe('Completed');
    expect(service.statusLabel('BLOCKED')).toBe('Blocked');
    expect(service.statusLabel('')).toBe('');
  });

  // ── Date Utilities ────────────────────────────────────────────────────────

  it('should isTuesday return true for 2026-03-03', () =>
    expect(service.isTuesday('2026-03-03')).toBe(true));
  it('should isTuesday return false for 2026-03-04', () =>
    expect(service.isTuesday('2026-03-04')).toBe(false));
  it('should isTuesday return false for empty string', () =>
    expect(service.isTuesday('')).toBe(false));
  it('should addDays add 1 day', () => expect(service.addDays('2026-03-03', 1)).toBe('2026-03-04'));
  it('should addDays add 6 days', () =>
    expect(service.addDays('2026-03-03', 6)).toBe('2026-03-09'));
  it('should getNextTuesday return a Tuesday', () => {
    const d = service.getNextTuesday();
    expect(new Date(d + 'T12:00:00').getDay()).toBe(2);
  });

  // ── Percentage / Budget ───────────────────────────────────────────────────

  it('should pctSum return 100', () => {
    service.cycleForm.set({
      planningDate: '',
      memberIds: [],
      pctClient: 50,
      pctTech: 30,
      pctRD: 20,
    });
    expect(service.pctSum()).toBe(100);
  });

  it('should pctSum return 0 for defaults', () => expect(service.pctSum()).toBe(0));

  it('should calcBudget for 2 members 50/30/20', () => {
    service.cycleForm.set({
      planningDate: '',
      memberIds: ['1', '2'],
      pctClient: 50,
      pctTech: 30,
      pctRD: 20,
    });
    expect(service.calcBudget('CLIENT_FOCUSED')).toBe(30);
    expect(service.calcBudget('TECH_DEBT')).toBe(18);
    expect(service.calcBudget('R_AND_D')).toBe(12);
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  it('should goHome set view to hub', () => {
    setupTeam(service);
    service.view.set('backlog');
    service.goHome();
    expect(service.view()).toBe('hub');
  });

  it('should currentUserName return name', () => {
    const id = setupTeam(service);
    service.selectIdentity(id);
    expect(service.currentUserName()).toBe('Alice');
  });

  it('should getMember return null for unknown id', () =>
    expect(service.getMember('x')).toBeNull());
  it('should getEntry return null for unknown id', () => expect(service.getEntry('x')).toBeNull());

  // ── Confirm / Toast ───────────────────────────────────────────────────────

  it('should showConfirm set modal state', () => {
    service.showConfirm('Title', 'Text', () => {}, 'Yes', true);
    expect(service.confirmModal()).toBe(true);
    expect(service.confirmTitle()).toBe('Title');
    expect(service.confirmDanger()).toBe(true);
  });

  it('should showToast set toast message', () => {
    service.showToast('Hello!');
    expect(service.toast()).toBe('Hello!');
  });

  it('should showError set error message', () => {
    service.showError('Oops!');
    expect(service.errorMsg()).toBe('Oops!');
  });

  // ── Active Cycle ──────────────────────────────────────────────────────────

  it('should activeCycle return null when no cycles', () =>
    expect(service.activeCycle()).toBeNull());
  it('should frozenCycle return null when no cycles', () =>
    expect(service.frozenCycle()).toBeNull());
  it('should pastCycles return empty when none', () =>
    expect(service.pastCycles()).toHaveLength(0));
  it('should isParticipating return false when no active cycle', () => {
    setupTeam(service);
    expect(service.isParticipating()).toBe(false);
  });

  it('should activeCycle return PLANNING cycle', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedPlanningCycle(service, aliceId);
    expect(service.activeCycle()).not.toBeNull();
    expect(service.activeCycle()!.state).toBe('PLANNING');
  });

  it('should isParticipating return true when member is in cycle', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedPlanningCycle(service, aliceId);
    expect(service.isParticipating()).toBe(true);
  });

  it('should startNewWeek show error if active cycle exists', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedPlanningCycle(service, aliceId);
    service.startNewWeek();
    expect(service.errorMsg()).toBeTruthy();
  });

  it('should startNewWeek create a new SETUP cycle when none exists', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    service.startNewWeek();
    expect(service.activeCycle()?.state).toBe('SETUP');
  });

  it('should openPlanning show error when no members selected', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    service.startNewWeek();
    service.cycleForm.update((f) => ({ ...f, memberIds: [] }));
    service.openPlanning();
    expect(service.cycleError()).toBeTruthy();
  });

  it('should openPlanning show error when percentages do not sum to 100', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    service.startNewWeek();
    service.cycleForm.update((f) => ({
      ...f,
      memberIds: [aliceId],
      pctClient: 50,
      pctTech: 30,
      pctRD: 10,
    }));
    service.openPlanning();
    expect(service.cycleError()).toBeTruthy();
  });

  it('should openPlanning show error when date is not Tuesday', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    service.startNewWeek();
    service.cycleForm.update((f) => ({
      ...f,
      memberIds: [aliceId],
      pctClient: 50,
      pctTech: 30,
      pctRD: 20,
      planningDate: '2026-03-04',
    }));
    service.openPlanning();
    expect(service.cycleError()).toBeTruthy();
  });

  // ── Planning ──────────────────────────────────────────────────────────────

  it('should myPlan return null when no active cycle', () => expect(service.myPlan()).toBeNull());
  it('should myAssignments return empty when no plan', () =>
    expect(service.myAssignments()).toHaveLength(0));
  it('should myPlannedHours return 0 when no assignments', () =>
    expect(service.myPlannedHours()).toBe(0));

  it('should myPlan return correct plan', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedPlanningCycle(service, aliceId);
    expect(service.myPlan()).not.toBeNull();
  });

  it('should myAssignments return tasks for my plan', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedPlanningCycle(service, aliceId);
    expect(service.myAssignments().length).toBeGreaterThan(0);
  });

  it('should myPlannedHours sum committed hours', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedPlanningCycle(service, aliceId);
    expect(service.myPlannedHours()).toBe(10);
  });

  it('should getCatBudget return correct budget', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedPlanningCycle(service, aliceId);
    expect(service.getCatBudget('CLIENT_FOCUSED')).toBe(15);
  });

  it('should getCatBudget return 0 when no cycle', () => {
    expect(service.getCatBudget('CLIENT_FOCUSED')).toBe(0);
  });

  it('should getCatClaimed return sum of committed hours', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedPlanningCycle(service, aliceId);
    expect(service.getCatClaimed('CLIENT_FOCUSED')).toBe(10);
  });

  it('should getCatClaimed return 0 when no cycle', () => {
    expect(service.getCatClaimed('CLIENT_FOCUSED')).toBe(0);
  });

  it('should toggleReady flip isReady on myPlan', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedPlanningCycle(service, aliceId);
    service.toggleReady();
    expect(service.myPlan()?.isReady).toBe(true);
    service.toggleReady();
    expect(service.myPlan()?.isReady).toBe(false);
  });

  it('should claimableEntries return available items', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedPlanningCycle(service, aliceId);
    const claimable = service.claimableEntries();
    expect(claimable.length).toBeGreaterThan(0);
  });

  it('should claimableEntries return empty when no active cycle', () => {
    expect(service.claimableEntries()).toHaveLength(0);
  });

  it('should startClaim set claimEntry and open modal', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    const ids = seedPlanningCycle(service, aliceId);
    const entry = service.backlogEntries().find((e) => e.id === ids.entryTech)!;
    service.startClaim(entry);
    expect(service.claimModal()).toBe(true);
    expect(service.claimEntry()?.id).toBe(ids.entryTech);
  });

  it('should submitClaim show error when hours is 0', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    const ids = seedPlanningCycle(service, aliceId);
    const entry = service.backlogEntries().find((e) => e.id === ids.entryTech)!;
    service.startClaim(entry);
    service.claimHours.set(0);
    service.submitClaim();
    expect(service.claimError()).toBeTruthy();
  });

  it('should submitClaim show error when hours is not half-step', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    const ids = seedPlanningCycle(service, aliceId);
    const entry = service.backlogEntries().find((e) => e.id === ids.entryTech)!;
    service.startClaim(entry);
    service.claimHours.set(1.3);
    service.submitClaim();
    expect(service.claimError()).toBeTruthy();
  });

  it('should submitClaim show error when hours exceed remaining', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    const ids = seedPlanningCycle(service, aliceId);
    const entry = service.backlogEntries().find((e) => e.id === ids.entryTech)!;
    service.startClaim(entry);
    service.claimHours.set(25); // already have 10, only 20 left
    service.submitClaim();
    expect(service.claimError()).toBeTruthy();
  });

  it('should submitClaim show error when hours exceed category budget', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    const ids = seedPlanningCycle(service, aliceId);
    const entry = service.backlogEntries().find((e) => e.id === ids.entryRD)!;
    service.startClaim(entry);
    service.claimHours.set(8); // R&D budget is only 6
    service.submitClaim();
    expect(service.claimError()).toBeTruthy();
  });

  it('should submitClaim successfully add assignment', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    const ids = seedPlanningCycle(service, aliceId);
    const countBefore = service.taskAssignments().length;
    const entry = service.backlogEntries().find((e) => e.id === ids.entryTech)!;
    service.startClaim(entry);
    service.claimHours.set(5);
    service.submitClaim();
    expect(service.taskAssignments().length).toBe(countBefore + 1);
    expect(service.claimModal()).toBe(false);
  });

  it('should getMemberPlan return null when no cycle', () => {
    expect(service.getMemberPlan('x')).toBeNull();
  });

  it('should getMemberPlanned return 0 for unknown member', () => {
    expect(service.getMemberPlanned('x')).toBe(0);
  });

  it('should freezeErrors return empty array when no cycle', () => {
    expect(service.freezeErrors()).toHaveLength(0);
  });

  // ── Freeze Review ─────────────────────────────────────────────────────────

  it('should freezeErrors return errors when hours not 30', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedPlanningCycle(service, aliceId);
    const errs = service.freezeErrors();
    expect(errs.length).toBeGreaterThan(0); // Alice has 10h, not 30
  });

  it('should confirmFreeze open confirm modal', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedPlanningCycle(service, aliceId);
    service.confirmFreeze();
    expect(service.confirmModal()).toBe(true);
  });

  it('should confirmCancelPlanning open confirm modal', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedPlanningCycle(service, aliceId);
    service.confirmCancelPlanning();
    expect(service.confirmModal()).toBe(true);
  });

  // ── Progress ──────────────────────────────────────────────────────────────

  it('should myFrozenAssignments return tasks in frozen cycle', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    expect(service.myFrozenAssignments().length).toBeGreaterThan(0);
  });

  it('should myCompletedHours return 0 initially', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    expect(service.myCompletedHours()).toBe(0);
  });

  it('should startProgressUpdate set progressTA and open modal', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    const ta = service.myFrozenAssignments()[0];
    service.startProgressUpdate(ta);
    expect(service.progressModal()).toBe(true);
    expect(service.progressTA()?.id).toBe(ta.id);
  });

  it('should allowedStatuses return correct statuses for NOT_STARTED', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    const ta = service.myFrozenAssignments()[0];
    service.startProgressUpdate(ta);
    const statuses = service.allowedStatuses();
    expect(statuses).toContain('NOT_STARTED');
    expect(statuses).toContain('IN_PROGRESS');
  });

  it('should submitProgress show error when hours negative', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    const ta = service.myFrozenAssignments()[0];
    service.startProgressUpdate(ta);
    service.progForm.update((f) => ({ ...f, hours: -1, status: 'NOT_STARTED' }));
    service.submitProgress();
    expect(service.progError()).toBeTruthy();
  });

  it('should submitProgress show error when hours not half-step', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    const ta = service.myFrozenAssignments()[0];
    service.startProgressUpdate(ta);
    service.progForm.update((f) => ({ ...f, hours: 1.3, status: 'IN_PROGRESS' }));
    service.submitProgress();
    expect(service.progError()).toBeTruthy();
  });

  it('should submitProgress block direct COMPLETED from NOT_STARTED', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    const ta = service.myFrozenAssignments()[0];
    service.startProgressUpdate(ta);
    service.progForm.update((f) => ({ ...f, hours: 5, status: 'COMPLETED' }));
    service.submitProgress();
    expect(service.progError()).toBeTruthy();
  });

  it('should submitProgress succeed with valid IN_PROGRESS update', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    const ta = service.myFrozenAssignments()[0];
    service.startProgressUpdate(ta);
    service.progForm.update((f) => ({ ...f, hours: 5, status: 'IN_PROGRESS' }));
    service.submitProgress();
    expect(service.progError()).toBe('');
    expect(service.progressModal()).toBe(false);
    expect(service.progressUpdates().length).toBe(1);
  });

  it('should submitProgress auto-upgrade status from NOT_STARTED when hours > 0', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    const ta = service.myFrozenAssignments()[0];
    service.startProgressUpdate(ta);
    service.progForm.update((f) => ({ ...f, hours: 3, status: 'NOT_STARTED' }));
    service.submitProgress();
    const updated = service.taskAssignments().find((t) => t.id === ta.id);
    expect(updated?.progressStatus).toBe('IN_PROGRESS');
  });

  // ── Dashboard ─────────────────────────────────────────────────────────────

  it('should dashCycle return null when dashCycleId not set', () =>
    expect(service.dashCycle()).toBeNull());
  it('should dashAllAssignments return empty when no dash cycle', () =>
    expect(service.dashAllAssignments()).toHaveLength(0));
  it('should dashCapacity return 0 when no cycle', () => expect(service.dashCapacity()).toBe(0));
  it('should dashTotalCompleted return 0 when no assignments', () =>
    expect(service.dashTotalCompleted()).toBe(0));

  it('should viewDashboard set dashCycleId and view', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    service.viewDashboard();
    expect(service.view()).toBe('dashboard');
    expect(service.dashCycleId()).not.toBeNull();
  });

  it('should dashCapacity return teamCapacity', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    expect(service.dashCapacity()).toBe(30);
  });

  it('should dashCompletedTasks return 0 initially', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    expect(service.dashCompletedTasks()).toBe(0);
  });

  it('should dashBlockedTasks return 0 initially', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    expect(service.dashBlockedTasks()).toBe(0);
  });

  it('should getDashCatBudget return 0 when no dash cycle', () => {
    expect(service.getDashCatBudget('CLIENT_FOCUSED')).toBe(0);
  });

  it('should getDashCatBudget return correct hours', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    expect(service.getDashCatBudget('CLIENT_FOCUSED')).toBe(15);
  });

  it('should dashCatCompleted return 0 initially', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    expect(service.dashCatCompleted('CLIENT_FOCUSED')).toBe(0);
  });

  it('should dashMemberCompleted return 0 initially', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    expect(service.dashMemberCompleted(aliceId)).toBe(0);
  });

  it('should dashMemberBlocked return false initially', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    expect(service.dashMemberBlocked(aliceId)).toBe(false);
  });

  it('should dashMemberAllDone return false initially', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    expect(service.dashMemberAllDone(aliceId)).toBe(false);
  });

  it('should getAssignMember return null for null task', () => {
    expect(service.getAssignMember(null)).toBeNull();
  });

  it('should taskProgressHistory return empty for undefined id', () => {
    expect(service.taskProgressHistory(undefined)).toHaveLength(0);
  });

  it('should taskProgressHistory return updates for known id', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    const ta = service.myFrozenAssignments()[0];
    service.startProgressUpdate(ta);
    service.progForm.update((f) => ({ ...f, hours: 5, status: 'IN_PROGRESS' }));
    service.submitProgress();
    expect(service.taskProgressHistory(ta.id).length).toBe(1);
  });

  // ── Finish Week ───────────────────────────────────────────────────────────

  it('should confirmFinishWeek open confirm modal for frozen cycle', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    service.confirmFinishWeek();
    expect(service.confirmModal()).toBe(true);
  });

  it('should confirmFinishWeek do nothing if no frozen cycle', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    service.confirmFinishWeek();
    expect(service.confirmModal()).toBe(false);
  });

  it('should pastCycles return completed cycles', () => {
    const aliceId = setupTeam(service);
    service.selectIdentity(aliceId);
    seedFrozenCycle(service, aliceId);
    service.planningCycles.update((cs) => cs.map((c) => ({ ...c, state: 'COMPLETED' })));
    expect(service.pastCycles().length).toBe(1);
  });

  // ── Import / Export ───────────────────────────────────────────────────────

  it('should executeImport restore data correctly', () => {
    const mockData = {
      appName: 'WeeklyPlanTracker',
      dataVersion: 1,
      data: {
        appSettings: { setupComplete: true, dataVersion: 1 },
        teamMembers: [
          { id: '1', name: 'Imported User', isLead: true, isActive: true, createdAt: '' },
        ],
        backlogEntries: [],
        planningCycles: [],
        categoryAllocations: [],
        memberPlans: [],
        taskAssignments: [],
        progressUpdates: [],
      },
    };
    service.importData.set(mockData);
    service.executeImport();
    expect(service.teamMembers().some((m) => m.name === 'Imported User')).toBe(true);
    expect(service.view()).toBe('identity');
  });

  it('should executeImport do nothing when importData is null', () => {
    service.importData.set(null);
    const before = service.teamMembers().length;
    service.executeImport();
    expect(service.teamMembers().length).toBe(before);
  });
});
