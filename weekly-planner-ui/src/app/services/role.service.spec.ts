import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RoleService } from './role.service';
import { Member } from '../models';

describe('RoleService', () => {
  let service: RoleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RoleService],
    });
    service = TestBed.inject(RoleService);
  });

  describe('getAll', () => {
    it('should return all members', () => {
      // Act
      const members = service.getAll();

      // Assert
      expect(members).toBeDefined();
      expect(members.length).toBe(3);
      expect(members[0].name).toBe('Team Lead');
      expect(members[1].name).toBe('Alice');
      expect(members[2].name).toBe('Bob');
    });

    it('should return members in correct order', () => {
      // Act
      const members = service.getAll();

      // Assert
      expect(members[0].id).toBe(1);
      expect(members[1].id).toBe(2);
      expect(members[2].id).toBe(3);
    });

    it('should return members with correct isLead status', () => {
      // Act
      const members = service.getAll();

      // Assert
      expect(members[0].isLead).toBe(true);
      expect(members[1].isLead).toBe(false);
      expect(members[2].isLead).toBe(false);
    });

    it('should return members with isActive set to true', () => {
      // Act
      const members = service.getAll();

      // Assert
      expect(members.every((m) => m.isActive === true)).toBe(true);
    });

    it('should return array of Member objects', () => {
      // Act
      const members = service.getAll();

      // Assert
      members.forEach((member) => {
        expect(member).toHaveProperty('id');
        expect(member).toHaveProperty('name');
        expect(member).toHaveProperty('isLead');
        expect(member).toHaveProperty('isActive');
      });
    });
  });

  describe('getCurrent', () => {
    it('should return the current member (initially Team Lead)', () => {
      // Act
      const current = service.getCurrent();

      // Assert
      expect(current).toBeDefined();
      expect(current.id).toBe(1);
      expect(current.name).toBe('Team Lead');
      expect(current.isLead).toBe(true);
    });

    it('should return the same object reference as in getAll', () => {
      // Act
      const current = service.getCurrent();
      const allMembers = service.getAll();

      // Assert
      expect(current).toBe(allMembers[0]);
    });
  });

  describe('setCurrent', () => {
    it('should set current member to Team Lead (id: 1)', () => {
      // Act
      service.setCurrent(1);
      const current = service.getCurrent();

      // Assert
      expect(current.id).toBe(1);
      expect(current.name).toBe('Team Lead');
    });

    it('should set current member to Alice (id: 2)', () => {
      // Act
      service.setCurrent(2);
      const current = service.getCurrent();

      // Assert
      expect(current.id).toBe(2);
      expect(current.name).toBe('Alice');
      expect(current.isLead).toBe(false);
    });

    it('should set current member to Bob (id: 3)', () => {
      // Act
      service.setCurrent(3);
      const current = service.getCurrent();

      // Assert
      expect(current.id).toBe(3);
      expect(current.name).toBe('Bob');
      expect(current.isLead).toBe(false);
    });

    it('should fallback to Team Lead when setting non-existent member id', () => {
      // Act
      service.setCurrent(999); // Non-existent id
      const current = service.getCurrent();

      // Assert
      expect(current.id).toBe(1);
      expect(current.name).toBe('Team Lead');
    });

    it('should allow switching between members multiple times', () => {
      // Act & Assert
      service.setCurrent(2);
      expect(service.getCurrent().id).toBe(2);

      service.setCurrent(3);
      expect(service.getCurrent().id).toBe(3);

      service.setCurrent(1);
      expect(service.getCurrent().id).toBe(1);

      service.setCurrent(2);
      expect(service.getCurrent().id).toBe(2);
    });

    it('should preserve member properties after setCurrent', () => {
      // Act
      service.setCurrent(2);
      const current = service.getCurrent();

      // Assert
      expect(current.name).toBe('Alice');
      expect(current.isActive).toBe(true);
      expect(current.isLead).toBe(false);
    });

    it('should update getCurrent to reflect the new current member', () => {
      // Arrange
      const initialCurrent = service.getCurrent();

      // Act
      service.setCurrent(3);
      const newCurrent = service.getCurrent();

      // Assert
      expect(initialCurrent.id).not.toBe(newCurrent.id);
      expect(newCurrent.id).toBe(3);
    });

    it('should handle setting current with 0 as id (non-existent)', () => {
      // Act
      service.setCurrent(0);
      const current = service.getCurrent();

      // Assert
      expect(current.id).toBe(1); // Should fallback to Team Lead
    });

    it('should handle setting current with negative id (non-existent)', () => {
      // Act
      service.setCurrent(-1);
      const current = service.getCurrent();

      // Assert
      expect(current.id).toBe(1); // Should fallback to Team Lead
    });
  });

  describe('Integration tests', () => {
    it('should correctly handle a series of member switches', () => {
      // Arrange & Act
      service.setCurrent(1);
      const lead = service.getCurrent();

      service.setCurrent(2);
      const alice = service.getCurrent();

      service.setCurrent(3);
      const bob = service.getCurrent();

      // Assert
      expect(lead.name).toBe('Team Lead');
      expect(alice.name).toBe('Alice');
      expect(bob.name).toBe('Bob');
    });

    it('should have consistent member data across multiple calls', () => {
      // Arrange
      service.setCurrent(2);
      const current1 = service.getCurrent();

      // Act
      const current2 = service.getCurrent();

      // Assert
      expect(current1).toBe(current2);
      expect(current1.name).toBe('Alice');
    });
  });
});
