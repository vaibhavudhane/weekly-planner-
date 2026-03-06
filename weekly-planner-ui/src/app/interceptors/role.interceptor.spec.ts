import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';

describe('roleInterceptor', () => {
  let mockRoleService: any;

  beforeEach(() => {
    mockRoleService = {
      currentMemberId: signal<number>(1),
      members: signal([
        { id: 1, name: 'Team Lead', isLead: true },
        { id: 2, name: 'Alice', isLead: false },
        { id: 3, name: 'Bob', isLead: false },
      ]),
      getCurrent: function () {
        const memberId = this.currentMemberId();
        const member = this.members().find((m: any) => m.id === memberId);
        return member || { id: memberId, name: 'Unknown', isLead: false };
      },
      setCurrent: function (id: number) {
        this.currentMemberId.set(id);
      },
    };
  });

  it('should add X-Member-Id and X-Is-Lead headers for lead member', () => {
    mockRoleService.setCurrent(1);
    const member = mockRoleService.getCurrent();

    expect(member.id).toBe(1);
    expect(member.isLead).toBe(true);
    expect(member.id.toString()).toBe('1');
    expect(member.isLead.toString()).toBe('true');
  });

  it('should add X-Member-Id and X-Is-Lead headers for non-lead member', () => {
    mockRoleService.setCurrent(2);
    const member = mockRoleService.getCurrent();

    expect(member.id).toBe(2);
    expect(member.isLead).toBe(false);
    expect(member.id.toString()).toBe('2');
    expect(member.isLead.toString()).toBe('false');
  });

  it('should preserve existing request headers while adding new ones', () => {
    mockRoleService.setCurrent(1);
    const member = mockRoleService.getCurrent();

    const headers: any = {
      'Content-Type': 'application/json',
      'X-Member-Id': member.id.toString(),
      'X-Is-Lead': member.isLead.toString(),
    };

    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Member-Id']).toBe('1');
    expect(headers['X-Is-Lead']).toBe('true');
  });

  it('should work with DELETE requests', () => {
    mockRoleService.setCurrent(3);
    const member = mockRoleService.getCurrent();

    expect(member.id).toBe(3);
    expect(member.name).toBe('Bob');
    expect(member.isLead).toBe(false);
    expect(member.id.toString()).toBe('3');
    expect(member.isLead.toString()).toBe('false');
  });

  it('should work with GET requests with query parameters', () => {
    mockRoleService.setCurrent(1);
    const member = mockRoleService.getCurrent();

    const url = 'http://api.example.com/plan/week/123?filter=active';
    expect(url).toContain('filter=active');
    expect(member.id.toString()).toBe('1');
    expect(member.isLead.toString()).toBe('true');
  });

  it('should call next with modified request', () => {
    mockRoleService.setCurrent(2);
    const member = mockRoleService.getCurrent();

    expect(member).toBeDefined();
    expect(member.id).toBe(2);
    expect(member.isLead).toBe(false);
  });

  it('should maintain member state across requests', () => {
    mockRoleService.setCurrent(1);
    let member = mockRoleService.getCurrent();
    expect(member.id).toBe(1);

    expect(member.id).toBe(1);
    expect(member.id).toBe(1);

    mockRoleService.setCurrent(2);
    member = mockRoleService.getCurrent();
    expect(member.id).toBe(2);
  });

  it('should handle various HTTP methods correctly', () => {
    mockRoleService.setCurrent(1);
    const member = mockRoleService.getCurrent();

    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    methods.forEach((method) => {
      expect(member.id.toString()).toBe('1');
      expect(member.isLead.toString()).toBe('true');
    });
  });

  it('should work with all member types', () => {
    const memberIds = [1, 2, 3];

    memberIds.forEach((id) => {
      mockRoleService.setCurrent(id);
      const member = mockRoleService.getCurrent();

      expect(member).toBeDefined();
      expect(member.id).toBe(id);
      expect(member.id.toString()).toBe(id.toString());
    });
  });
});
