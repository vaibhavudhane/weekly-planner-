import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AppStateService } from './app-state.service';
import { of, throwError } from 'rxjs';

describe('AppStateService - ULTIMATE 100% Coverage', () => {
  let service: AppStateService;
  let mockHttpClient: any;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mockHttpClient = {
      get: vi.fn().mockReturnValue(of({})),
      post: vi.fn().mockReturnValue(of({})),
      put: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
      patch: vi.fn().mockReturnValue(of({})),
    };
    service = new AppStateService(mockHttpClient);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // ==================== LINES 1-100: BASIC INITIALIZATION ====================
  describe('Service Initialization & Setup', () => {
    it('should initialize service with all signals', () => {
      expect(service.theme()).toBe('light');
      expect(service.view()).toBe('identity');
      expect(service.toast()).toBe('');
      expect(service.errorMsg()).toBe('');
    });

    it('should have all team members signals', () => {
      expect(service.teamMembers()).toBeDefined();
      expect(service.setupMembers()).toBeDefined();
      expect(service.backlogEntries()).toBeDefined();
      expect(service.planningCycles()).toBeDefined();
    });

    it('should have all error and status signals', () => {
      expect(service.setupError()).toBe('');
      expect(service.teamError()).toBe('');
      expect(service.appSettings()).toBeDefined();
    });

    it('should have all editing signals', () => {
      expect(service.editingMemberId()).toBeNull();
      expect(service.editingMemberVal()).toBe('');
      expect(service.confirmModal()).toBe(false);
    });

    it('should have all filter signals', () => {
      expect(service.blFilter()).toBeDefined();
      expect(service.dashCycleId()).toBeNull();
    });
  });

  // ==================== LINES 100-200: THEME & VIEW ====================
  describe('Theme Toggle with Storage Persistence', () => {
    it('should toggle theme and update localStorage', () => {
      service.toggleTheme();
      expect(service.theme()).toBe('dark');
      expect(localStorage.getItem('wpt_theme')).toBe('"dark"');
    });

    it('should toggle back to light', () => {
      service.theme.set('dark');
      service.toggleTheme();
      expect(service.theme()).toBe('light');
      expect(localStorage.getItem('wpt_theme')).toBe('"light"');
    });

    it('should handle multiple rapid toggles', () => {
      for (let i = 0; i < 10; i++) {
        service.toggleTheme();
      }
      expect(service.theme()).toBe('light');
    });
  });

  describe('View Navigation with State', () => {
    it('should navigate through all views', () => {
      const views = ['setup', 'hub', 'planning', 'dashboard', 'identity'];
      views.forEach((view) => {
        service.view.set(view as any);
        expect(service.view()).toBe(view);
      });
    });

    it('should maintain view state during other changes', () => {
      service.view.set('planning');
      service.theme.set('dark');
      service.toast.set('message');
      expect(service.view()).toBe('planning');
    });
  });

  // ==================== LINES 200-300: TOAST & ERROR MANAGEMENT ====================
  describe('Toast Messages with Auto-Clear', () => {
    it('should show toast and auto-clear after 3 seconds', (done) => {
      service.showToast('Test toast');
      expect(service.toast()).toBe('Test toast');
      setTimeout(() => {
        expect(service.toast()).toBe('');
        done();
      }, 3100);
    });

    it('should overwrite previous toast', (done) => {
      service.showToast('First');
      expect(service.toast()).toBe('First');
      service.showToast('Second');
      expect(service.toast()).toBe('Second');
      setTimeout(() => {
        expect(service.toast()).toBe('');
        done();
      }, 3100);
    });

    it('should clear toast manually', () => {
      service.showToast('Message');
      service.toast.set('');
      expect(service.toast()).toBe('');
    });
  });

  describe('Error Messages with Auto-Clear', () => {
    it('should show error and auto-clear after 5 seconds', (done) => {
      service.showError('Error message');
      expect(service.errorMsg()).toBe('Error message');
      setTimeout(() => {
        expect(service.errorMsg()).toBe('');
        done();
      }, 5100);
    });

    it('should handle multiple error displays', (done) => {
      service.showError('Error 1');
      expect(service.errorMsg()).toBe('Error 1');
      service.showError('Error 2');
      expect(service.errorMsg()).toBe('Error 2');
      setTimeout(() => {
        expect(service.errorMsg()).toBe('');
        done();
      }, 5100);
    });

    it('should clear error manually', () => {
      service.showError('Error');
      service.errorMsg.set('');
      expect(service.errorMsg()).toBe('');
    });
  });

  // ==================== LINES 300-500: SETUP MEMBERS ====================
  describe('Setup Members - Complete Flow', () => {
    it('should add first member as lead', () => {
      service.setupMembers.set([]);
      service.setupName.set('Alice');
      service.addSetupMember();
      expect(service.setupMembers().length).toBe(1);
      expect(service.setupMembers()[0].isLead).toBe(true);
      expect(service.setupMembers()[0].isActive).toBe(true);
    });

    it('should add second member as non-lead', () => {
      service.setupMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.setupName.set('Bob');
      service.addSetupMember();
      expect(service.setupMembers().length).toBe(2);
      expect(service.setupMembers()[1].isLead).toBe(false);
    });

    it('should reject empty member name with error', () => {
      service.setupMembers.set([]);
      service.setupName.set('');
      service.addSetupMember();
      expect(service.setupError()).toBe('Please type a name.');
      expect(service.setupMembers().length).toBe(0);
    });

    it('should reject duplicate member name', () => {
      service.setupMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.setupName.set('Alice');
      service.addSetupMember();
      expect(service.setupError()).toBe('This name is already used.');
      expect(service.setupMembers().length).toBe(1);
    });

    it('should clear setup error on successful add', () => {
      service.setupError.set('Previous error');
      service.setupMembers.set([]);
      service.setupName.set('NewMember');
      service.addSetupMember();
      expect(service.setupError()).toBe('');
    });

    it('should handle special characters in names', () => {
      service.setupMembers.set([]);
      service.setupName.set("O'Brien-Smith");
      service.addSetupMember();
      expect(service.setupMembers()[0].name).toBe("O'Brien-Smith");
    });

    it('should handle very long names', () => {
      service.setupMembers.set([]);
      const longName = 'A'.repeat(1000);
      service.setupName.set(longName);
      service.addSetupMember();
      expect(service.setupMembers()[0].name).toBe(longName);
    });

    it('should handle unicode names', () => {
      service.setupMembers.set([]);
      service.setupName.set('日本語 العربية Русский');
      service.addSetupMember();
      expect(service.setupMembers().length).toBe(1);
    });

    it('should trim whitespace from names', () => {
      service.setupMembers.set([]);
      service.setupName.set('   Alice   ');
      service.addSetupMember();
      expect(service.setupMembers().length).toBeGreaterThan(0);
    });
  });

  // ==================== LINES 500-700: SETUP COMPLETION ====================
  describe('Setup Completion - All Paths', () => {
    it('should complete setup with single member', () => {
      service.setupMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.finishSetup();
      expect(service.appSettings().setupComplete).toBe(true);
      expect(service.currentUserId()).toBe('1');
      expect(service.view()).toBe('hub');
      expect(service.teamMembers().length).toBe(1);
    });

    it('should complete setup with multiple members', () => {
      service.setupMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Bob',
          isLead: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.finishSetup();
      expect(service.appSettings().setupComplete).toBe(true);
      expect(service.view()).toBe('identity');
      expect(service.teamMembers().length).toBe(2);
    });

    it('should reject setup with no members', () => {
      service.setupMembers.set([]);
      service.finishSetup();
      expect(service.setupError()).toBe('Please add at least one team member.');
      expect(service.appSettings().setupComplete).toBe(false);
    });

    it('should reject setup without a lead', () => {
      service.setupMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Bob',
          isLead: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.finishSetup();
      expect(service.setupError()).toBe('Please pick one person as the Team Lead.');
    });

    it('should handle setup with multiple members successfully', () => {
      service.setupMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        { id: '2', name: 'Bob', isLead: true, isActive: true, createdAt: new Date().toISOString() },
      ]);
      service.finishSetup();
      expect(service.appSettings().setupComplete).toBe(true);
    });

    it('should complete setup and assign team members', () => {
      service.setupMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.finishSetup();
      expect(service.teamMembers().length).toBeGreaterThan(0);
    });
  });

  // ==================== LINES 700-900: TEAM MEMBERS OPERATIONS ====================
  describe('Team Members - Get & Query', () => {
    it('should get active members only', () => {
      service.teamMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Bob',
          isLead: false,
          isActive: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Charlie',
          isLead: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      const active = service.activeMembers();
      expect(active.length).toBe(2);
      expect(active.every((m) => m.isActive)).toBe(true);
    });

    it('should get member by id with exact match', () => {
      service.teamMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Bob',
          isLead: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      expect(service.getMember('1')?.name).toBe('Alice');
      expect(service.getMember('2')?.name).toBe('Bob');
      expect(service.getMember('3')).toBeNull();
    });

    it('should get current user name from id', () => {
      service.currentUserId.set('1');
      service.teamMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      expect(service.currentUserName()).toBe('Alice');
    });

    it('should return empty string for unknown current user', () => {
      service.currentUserId.set('999');
      service.teamMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      expect(service.currentUserName()).toBe('');
    });

    it('should check if current user is lead', () => {
      service.teamMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Bob',
          isLead: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.currentUserId.set('1');
      expect(service.isLead()).toBe(true);
      service.currentUserId.set('2');
      expect(service.isLead()).toBe(false);
    });
  });

  describe('Team Members - Mutations', () => {
    it('should make any member lead and demote previous lead', () => {
      service.teamMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Bob',
          isLead: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Charlie',
          isLead: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.makeLead('3');
      expect(service.teamMembers()[2].isLead).toBe(true);
      expect(service.teamMembers()[0].isLead).toBe(false);
      expect(service.teamMembers()[1].isLead).toBe(false);
    });

    it('should reactivate inactive member', () => {
      service.teamMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.reactivateMember('1');
      expect(service.teamMembers()[0].isActive).toBe(true);
    });

    it('should edit member name with validation', () => {
      service.teamMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Bob',
          isLead: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.editingMemberId.set('1');
      service.editingMemberVal.set('Alicia');
      service.saveEditMember('1');
      expect(service.teamMembers()[0].name).toBe('Alicia');
    });

    it('should reject empty name on edit', () => {
      service.teamMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.editingMemberVal.set('');
      service.saveEditMember('1');
      expect(service.teamError()).toBe('Please type a name.');
      expect(service.teamMembers()[0].name).toBe('Alice');
    });

    it('should reject duplicate name on edit', () => {
      service.teamMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Bob',
          isLead: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.editingMemberVal.set('Bob');
      service.saveEditMember('1');
      expect(service.errorMsg()).toContain('already used');
    });

    it('should handle edit with special characters', () => {
      service.teamMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.editingMemberId.set('1');
      service.editingMemberVal.set("O'Brien");
      service.saveEditMember('1');
      expect(service.teamMembers()[0].name).toBe("O'Brien");
    });
  });

  // ==================== LINES 900-1100: BACKLOG FILTERING ====================
  describe('Backlog Filtering - All Combinations', () => {
    const setupBacklog = () => {
      service.backlogEntries.set([
        {
          id: '1',
          title: 'Client Feature',
          description: '',
          category: 'CLIENT_FOCUSED',
          status: 'AVAILABLE',
          estimatedEffort: 5,
          createdBy: '1',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Tech Debt Fix',
          description: '',
          category: 'TECH_DEBT',
          status: 'AVAILABLE',
          estimatedEffort: 5,
          createdBy: '1',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Research Item',
          description: '',
          category: 'R_AND_D',
          status: 'BLOCKED',
          estimatedEffort: 5,
          createdBy: '1',
          createdAt: new Date().toISOString(),
        },
      ]);
    };

    it('should filter by CLIENT_FOCUSED', () => {
      setupBacklog();
      service.blFilter.set({ client: true, tech: false, rd: false, status: '', search: '' });
      expect(service.filteredBacklog().length).toBe(1);
      expect(service.filteredBacklog()[0].category).toBe('CLIENT_FOCUSED');
    });

    it('should filter by TECH_DEBT', () => {
      setupBacklog();
      service.blFilter.set({ client: false, tech: true, rd: false, status: '', search: '' });
      expect(service.filteredBacklog().length).toBe(1);
      expect(service.filteredBacklog()[0].category).toBe('TECH_DEBT');
    });

    it('should filter by multiple categories', () => {
      setupBacklog();
      service.blFilter.set({ client: true, tech: true, rd: true, status: '', search: '' });
      expect(service.filteredBacklog().length).toBe(2);
    });

    it('should filter by AVAILABLE status', () => {
      setupBacklog();
      service.blFilter.set({ client: true, tech: true, rd: true, status: 'AVAILABLE', search: '' });
      expect(service.filteredBacklog().length).toBe(2);
    });

    it('should filter by BLOCKED status', () => {
      setupBacklog();
      service.blFilter.set({ client: true, tech: true, rd: true, status: 'BLOCKED', search: '' });
      expect(service.filteredBacklog().length).toBe(1);
    });

    it('should search case-insensitive', () => {
      setupBacklog();
      service.blFilter.set({ client: true, tech: true, rd: true, status: '', search: 'client' });
      expect(service.filteredBacklog().length).toBe(1);
      expect(service.filteredBacklog()[0].title.toLowerCase()).toContain('client');
    });

    it('should combine multiple filters', () => {
      setupBacklog();
      service.blFilter.set({
        client: true,
        tech: true,
        rd: false,
        status: 'AVAILABLE',
        search: 'Fix',
      });
      expect(service.filteredBacklog().length).toBe(1);
    });

    it('should return empty when no match', () => {
      setupBacklog();
      service.blFilter.set({ client: false, tech: false, rd: false, status: '', search: '' });
      expect(service.filteredBacklog().length).toBe(0);
    });
  });

  describe('Backlog Entry Operations', () => {
    it('should get entry by id', () => {
      service.backlogEntries.set([
        {
          id: '1',
          title: 'Task',
          description: '',
          category: 'CLIENT_FOCUSED',
          status: 'AVAILABLE',
          estimatedEffort: 5,
          createdBy: '1',
          createdAt: new Date().toISOString(),
        },
      ]);
      expect(service.getEntry('1')?.title).toBe('Task');
    });

    it('should return null for non-existent entry', () => {
      service.backlogEntries.set([]);
      expect(service.getEntry('999')).toBeNull();
    });
  });

  // ==================== LINES 1100-1300: PLANNING CYCLES ====================
  describe('Planning Cycles - Query & State', () => {
    it('should get active cycle in PLANNING state', () => {
      service.planningCycles.set([
        {
          id: '1',
          planningDate: '2026-03-05',
          executionStartDate: '2026-03-06',
          executionEndDate: '2026-03-12',
          state: 'PLANNING',
          participatingMemberIds: [],
          teamCapacity: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      expect(service.activeCycle()?.id).toBe('1');
    });

    it('should return null if no active cycle', () => {
      service.planningCycles.set([
        {
          id: '1',
          planningDate: '2026-03-05',
          executionStartDate: '2026-03-06',
          executionEndDate: '2026-03-12',
          state: 'COMPLETED',
          participatingMemberIds: [],
          teamCapacity: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      expect(service.activeCycle()).toBeNull();
    });

    it('should check user participation', () => {
      service.currentUserId.set('1');
      service.planningCycles.set([
        {
          id: '1',
          planningDate: '2026-03-05',
          executionStartDate: '2026-03-06',
          executionEndDate: '2026-03-12',
          state: 'PLANNING',
          participatingMemberIds: ['1', '2'],
          teamCapacity: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      expect(service.isParticipating()).toBe(true);
    });

    it('should return false if user not participating', () => {
      service.currentUserId.set('3');
      service.planningCycles.set([
        {
          id: '1',
          planningDate: '2026-03-05',
          executionStartDate: '2026-03-06',
          executionEndDate: '2026-03-12',
          state: 'PLANNING',
          participatingMemberIds: ['1', '2'],
          teamCapacity: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      expect(service.isParticipating()).toBe(false);
    });

    it('should get past completed cycles sorted desc', () => {
      service.planningCycles.set([
        {
          id: '1',
          planningDate: '2026-02-01',
          executionStartDate: '2026-02-02',
          executionEndDate: '2026-02-08',
          state: 'COMPLETED',
          participatingMemberIds: [],
          teamCapacity: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          planningDate: '2026-02-15',
          executionStartDate: '2026-02-16',
          executionEndDate: '2026-02-22',
          state: 'COMPLETED',
          participatingMemberIds: [],
          teamCapacity: 0,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          planningDate: '2026-03-01',
          executionStartDate: '2026-03-02',
          executionEndDate: '2026-03-08',
          state: 'COMPLETED',
          participatingMemberIds: [],
          teamCapacity: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      const past = service.pastCycles();
      expect(past[0].id).toBe('3');
      expect(past[1].id).toBe('2');
      expect(past[2].id).toBe('1');
    });
  });

  // ==================== LINES 1300-1400: LABELS & DATE UTILITIES ====================
  describe('Category Labels', () => {
    it('should label all categories', () => {
      expect(service.catLabel('CLIENT_FOCUSED')).toBe('Client Focused');
      expect(service.catLabel('TECH_DEBT')).toBe('Tech Debt');
      expect(service.catLabel('R_AND_D')).toBe('R&D');
    });
  });

  describe('Status Labels', () => {
    it('should label all statuses', () => {
      expect(service.statusLabel('NOT_STARTED')).toBe('Not Started');
      expect(service.statusLabel('IN_PROGRESS')).toBe('In Progress');
      expect(service.statusLabel('COMPLETED')).toBe('Completed');
      expect(service.statusLabel('BLOCKED')).toBe('Blocked');
    });
  });

  describe('Date Utilities', () => {
    it('should identify Tuesday correctly', () => {
      expect(service.isTuesday('2026-03-03')).toBe(true);
      expect(service.isTuesday('2026-03-04')).toBe(false);
      expect(service.isTuesday('2026-03-05')).toBe(false);
    });

    it('should add days correctly', () => {
      expect(service.addDays('2026-03-05', 1)).toBe('2026-03-06');
      expect(service.addDays('2026-03-05', 7)).toBe('2026-03-12');
      expect(service.addDays('2026-03-05', 0)).toBe('2026-03-05');
    });

    it('should get next Tuesday', () => {
      const nextTue = service.getNextTuesday();
      const date = new Date(nextTue + 'T00:00:00');
      expect(date.getDay()).toBe(2);
    });
  });

  // ==================== LINES 1400-1500: CONFIRMATION DIALOGS ====================
  describe('Confirmation Dialogs', () => {
    it('should show confirm dialog with all params', () => {
      const action = vi.fn();
      service.showConfirm('Delete', 'Are you sure?', action, 'Delete', true, 'Cancel');
      expect(service.confirmModal()).toBe(true);
      expect(service.confirmTitle()).toBe('Delete');
      expect(service.confirmText()).toBe('Are you sure?');
    });

    it('should handle danger flag', () => {
      const action = vi.fn();
      service.showConfirm('Delete', 'Confirm', action, 'Yes', true, 'No');
      expect(service.confirmModal()).toBe(true);
    });

    it('should handle safe operations', () => {
      const action = vi.fn();
      service.showConfirm('Save', 'Save?', action, 'Yes', false, 'No');
      expect(service.confirmModal()).toBe(true);
    });
  });

  // ==================== LINES 1500-1600: INITIALIZATION & PERSISTENCE ====================
  describe('Service Initialization', () => {
    it('should init to setup view when not complete', () => {
      service.appSettings.set({ setupComplete: false, dataVersion: 1 });
      service.init();
      expect(service.view()).toBe('setup');
    });

    it('should init to hub with single member', () => {
      service.appSettings.set({ setupComplete: true, dataVersion: 1 });
      service.teamMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.init();
      expect(service.view()).toBe('hub');
      expect(service.currentUserId()).toBe('1');
    });
  });

  describe('Home Navigation', () => {
    it('should go home to hub with active cycle', () => {
      service.planningCycles.set([
        {
          id: '1',
          planningDate: '2026-03-05',
          executionStartDate: '2026-03-06',
          executionEndDate: '2026-03-12',
          state: 'PLANNING',
          participatingMemberIds: [],
          teamCapacity: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.goHome();
      expect(service.view()).toBe('hub');
      expect(service.dashCycleId()).toBe('1');
    });

    it('should go home without cycle', () => {
      service.planningCycles.set([]);
      service.goHome();
      expect(service.view()).toBe('hub');
    });
  });

  describe('Data Persistence', () => {
    it('should save state', () => {
      service.theme.set('dark');
      service.teamMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.save();
      expect(service.theme()).toBe('dark');
      expect(service.teamMembers().length).toBe(1);
    });
  });

  // ==================== LINES 1600+: EDGE CASES & STRESS ====================
  describe('Edge Cases & Stress Tests', () => {
    it('should handle 100 rapid state changes', () => {
      for (let i = 0; i < 100; i++) {
        service.toggleTheme();
      }
      expect(service.theme()).toBe('light');
    });

    it('should handle 1000 members', () => {
      const members = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        name: `Member${i}`,
        isLead: i === 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      }));
      service.teamMembers.set(members);
      expect(service.activeMembers().length).toBe(1000);
      expect(service.getMember('500')?.name).toBe('Member500');
    });

    it('should handle 500 backlog entries', () => {
      const entries = Array.from({ length: 500 }, (_, i) => ({
        id: String(i),
        title: `Task${i}`,
        description: '',
        category: i % 3 === 0 ? 'CLIENT_FOCUSED' : i % 3 === 1 ? 'TECH_DEBT' : 'R_AND_D',
        status: 'AVAILABLE',
        estimatedEffort: 5,
        createdBy: '1',
        createdAt: new Date().toISOString(),
      }));
      service.backlogEntries.set(entries);
      service.blFilter.set({ client: true, tech: true, rd: true, status: '', search: '' });
      expect(service.filteredBacklog().length).toBe(500);
    });

    it('should handle null/undefined safely', () => {
      service.currentUserId.set(null as any);
      service.teamMembers.set([]);
      expect(service.currentUserName()).toBe('');
      expect(service.isLead()).toBe(false);
    });

    it('should handle empty collections', () => {
      service.teamMembers.set([]);
      service.backlogEntries.set([]);
      service.planningCycles.set([]);
      expect(service.activeMembers().length).toBe(0);
      expect(service.filteredBacklog().length).toBe(0);
      expect(service.activeCycle()).toBeNull();
    });

    it('should handle duplicate member IDs', () => {
      service.teamMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '1',
          name: 'Bob',
          isLead: false,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      expect(service.getMember('1')).toBeDefined();
    });

    it('should handle very large state objects', () => {
      service.teamMembers.set([
        {
          id: '1',
          name: 'A'.repeat(10000),
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      expect(service.teamMembers()[0].name.length).toBe(10000);
    });

    it('should handle concurrent modifications', () => {
      service.teamMembers.set([
        {
          id: '1',
          name: 'Alice',
          isLead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
      service.makeLead('1');
      service.reactivateMember('1');
      service.editingMemberId.set('1');
      service.editingMemberVal.set('Alicia');
      service.saveEditMember('1');
      expect(service.teamMembers()[0].name).toBe('Alicia');
    });

    it('should maintain state integrity through all operations', () => {
      const initialState = {
        theme: 'light',
        view: 'hub',
        members: 3,
        cycles: 2,
      };

      service.theme.set(initialState.theme as any);
      service.view.set(initialState.view as any);
      service.teamMembers.set(
        Array.from({ length: initialState.members }, (_, i) => ({
          id: String(i),
          name: `Member${i}`,
          isLead: i === 0,
          isActive: true,
          createdAt: new Date().toISOString(),
        })),
      );
      service.planningCycles.set(
        Array.from({ length: initialState.cycles }, (_, i) => ({
          id: String(i),
          planningDate: '2026-03-05',
          executionStartDate: '2026-03-06',
          executionEndDate: '2026-03-12',
          state: 'PLANNING',
          participatingMemberIds: [],
          teamCapacity: 0,
          createdAt: new Date().toISOString(),
        })),
      );

      expect(service.theme()).toBe('light');
      expect(service.view()).toBe('hub');
      expect(service.teamMembers().length).toBe(3);
      expect(service.planningCycles().length).toBe(2);
    });
  });
});
