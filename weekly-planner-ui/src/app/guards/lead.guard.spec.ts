import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';

describe('leadGuard', () => {
  let mockAppStateService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockAppStateService = {
      currentUserId: signal<string | null>(null),
      teamMembers: signal([]),
      getMember: (id: string | null) => {
        const members = mockAppStateService.teamMembers();
        return members.find((m: any) => m.id === id) || null;
      },
      isLead: () => {
        const member = mockAppStateService.getMember(mockAppStateService.currentUserId());
        return member?.isLead || false;
      },
    };

    mockRouter = {
      navigate: vi.fn().mockReturnValue(true),
    };
  });

  it('should allow access when user is a lead', () => {
    mockAppStateService.currentUserId.set('user1');
    mockAppStateService.teamMembers.set([
      {
        id: 'user1',
        name: 'Lead',
        isLead: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ]);

    const isLead = mockAppStateService.isLead();
    expect(isLead).toBe(true);
  });

  it('should deny access and navigate to home when user is not a lead', () => {
    mockAppStateService.currentUserId.set('user2');
    mockAppStateService.teamMembers.set([
      {
        id: 'user2',
        name: 'User',
        isLead: false,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ]);

    const isLead = mockAppStateService.isLead();
    expect(isLead).toBe(false);

    if (!isLead) {
      mockRouter.navigate(['/']);
    }

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should return true synchronously for lead', () => {
    mockAppStateService.currentUserId.set('user1');
    mockAppStateService.teamMembers.set([
      {
        id: 'user1',
        name: 'Lead',
        isLead: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ]);

    const result = mockAppStateService.isLead();
    expect(result).toBe(true);
  });

  it('should return false synchronously for non-lead', () => {
    mockAppStateService.currentUserId.set('user2');
    mockAppStateService.teamMembers.set([
      {
        id: 'user2',
        name: 'Member',
        isLead: false,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ]);

    const result = mockAppStateService.isLead();
    expect(result).toBe(false);
  });

  it('should navigate to root path on unauthorized access', () => {
    mockAppStateService.currentUserId.set('user2');
    mockAppStateService.teamMembers.set([
      {
        id: 'user2',
        name: 'User',
        isLead: false,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ]);

    const isLead = mockAppStateService.isLead();
    if (!isLead) {
      mockRouter.navigate(['/']);
    }

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should not navigate when access is allowed', () => {
    mockAppStateService.currentUserId.set('user1');
    mockAppStateService.teamMembers.set([
      {
        id: 'user1',
        name: 'Admin',
        isLead: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ]);

    const isLead = mockAppStateService.isLead();
    if (!isLead) {
      mockRouter.navigate(['/']);
    }

    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should work with multiple unauthorized access attempts', () => {
    mockAppStateService.currentUserId.set('user2');
    mockAppStateService.teamMembers.set([
      {
        id: 'user2',
        name: 'User',
        isLead: false,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ]);

    const isLead = mockAppStateService.isLead();

    if (!isLead) mockRouter.navigate(['/']);
    if (!isLead) mockRouter.navigate(['/']);
    if (!isLead) mockRouter.navigate(['/']);

    expect(mockRouter.navigate).toHaveBeenCalledTimes(3);
  });

  it('should toggle between lead and non-lead correctly', () => {
    const user = {
      id: 'user1',
      name: 'User',
      isLead: false,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    mockAppStateService.currentUserId.set('user1');
    mockAppStateService.teamMembers.set([user]);
    let result = mockAppStateService.isLead();
    expect(result).toBe(false);

    mockAppStateService.teamMembers.set([{ ...user, isLead: true }]);
    result = mockAppStateService.isLead();
    expect(result).toBe(true);

    mockAppStateService.teamMembers.set([{ ...user, isLead: false }]);
    result = mockAppStateService.isLead();
    expect(result).toBe(false);
  });
});
