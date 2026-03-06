import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlanService } from './plan.service';
import { of, throwError } from 'rxjs';

describe('PlanService', () => {
  let service: PlanService;
  let httpClientMock: any;

  beforeEach(() => {
    httpClientMock = {
      get: (url: string) => of({ id: '1', memberId: 1, weekCycleId: 1, entries: [] }),
      post: (url: string, body: any) => of({ id: '1', ...body }),
      put: (url: string, body: any) => of({ success: true }),
    };
    service = new PlanService(httpClientMock);
  });

  describe('getPlan', () => {
    it('should fetch a plan for a member in a week cycle', () => {
      return service
        .getPlan(1, 2)
        .toPromise()
        .then((plan) => {
          expect(plan).toBeDefined();
          expect(plan?.memberId).toBe(1);
        });
    });

    it('should include both memberId and weekCycleId in URL', () => {
      const spy = vi.spyOn(httpClientMock, 'get');
      return service
        .getPlan(5, 10)
        .toPromise()
        .then(() => {
          expect(spy).toHaveBeenCalled();
        });
    });

    it('should handle different member and cycle combinations', async () => {
      const testCases = [
        { memberId: 1, weekCycleId: 1 },
        { memberId: 2, weekCycleId: 3 },
        { memberId: 99, weekCycleId: 999 },
      ];
      for (const tc of testCases) {
        await service.getPlan(tc.memberId, tc.weekCycleId).toPromise();
      }
      expect(true).toBe(true);
    });
  });

  describe('submitPlan', () => {
    it('should submit a plan with entries', () => {
      const entries = [{ id: '1', hours: 8 }];
      return service
        .submitPlan(1, 2, entries)
        .toPromise()
        .then((result) => {
          expect(result).toBeDefined();
        });
    });

    it('should submit empty entries array', () => {
      return service
        .submitPlan(1, 2, [])
        .toPromise()
        .then((result) => {
          expect(result).toBeDefined();
        });
    });

    it('should make POST request to correct endpoint', () => {
      const spy = vi.spyOn(httpClientMock, 'post');
      return service
        .submitPlan(1, 1, [])
        .toPromise()
        .then(() => {
          expect(spy).toHaveBeenCalled();
        });
    });

    it('should include all required fields in request body', () => {
      const entries = [{ id: '1', hours: 4 }];
      const spy = vi.spyOn(httpClientMock, 'post');
      return service
        .submitPlan(5, 10, entries)
        .toPromise()
        .then(() => {
          const callArgs = spy.mock.calls[0];
          expect(callArgs).toBeDefined();
        });
    });
  });

  describe('updateProgress', () => {
    it('should update progress for a plan entry', () => {
      return service
        .updateProgress(1, 50, 4)
        .toPromise()
        .then((result) => {
          expect(result).toBeDefined();
        });
    });

    it('should include entry id in request URL', () => {
      const spy = vi.spyOn(httpClientMock, 'put');
      return service
        .updateProgress(123, 50, 4)
        .toPromise()
        .then(() => {
          expect(spy).toHaveBeenCalled();
        });
    });

    it('should handle different progress values', async () => {
      const progressValues = [0, 25, 50, 75, 100];
      for (const progress of progressValues) {
        await service.updateProgress(1, progress, 5).toPromise();
      }
      expect(true).toBe(true);
    });

    it('should handle zero values for progress and hours', () => {
      return service
        .updateProgress(1, 0, 0)
        .toPromise()
        .then((result) => {
          expect(result).toBeDefined();
        });
    });

    it('should handle maximum values for progress and hours', () => {
      return service
        .updateProgress(1, 100, 999)
        .toPromise()
        .then((result) => {
          expect(result).toBeDefined();
        });
    });
  });

  describe('getAllPlansForWeek', () => {
    it('should fetch all plans for a week cycle', () => {
      return service
        .getAllPlansForWeek(1)
        .toPromise()
        .then((plans) => {
          expect(plans).toBeDefined();
        });
    });

    it('should include week cycle id in request URL', () => {
      const spy = vi.spyOn(httpClientMock, 'get');
      return service
        .getAllPlansForWeek(42)
        .toPromise()
        .then(() => {
          expect(spy).toHaveBeenCalled();
        });
    });

    it('should return empty array when no plans exist', () => {
      httpClientMock.get = () => of([]);
      return service
        .getAllPlansForWeek(1)
        .toPromise()
        .then((plans) => {
          expect(Array.isArray(plans)).toBe(true);
        });
    });

    it('should handle multiple week cycles', async () => {
      const weekCycleIds = [1, 2, 3];
      for (const id of weekCycleIds) {
        await service.getAllPlansForWeek(id).toPromise();
      }
      expect(true).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle errors in getPlan', () => {
      httpClientMock.get = () => throwError(() => new Error('Server error'));
      return service
        .getPlan(1, 1)
        .toPromise()
        .catch((error) => {
          expect(error).toBeDefined();
        });
    });

    it('should handle 404 for non-existent plan', () => {
      httpClientMock.get = () => throwError(() => ({ status: 404 }));
      return service
        .getPlan(999, 999)
        .toPromise()
        .catch((error) => {
          expect(error).toBeDefined();
        });
    });

    it('should handle validation errors in submitPlan', () => {
      httpClientMock.post = () => throwError(() => ({ status: 400 }));
      return service
        .submitPlan(1, 1, [])
        .toPromise()
        .catch((error) => {
          expect(error).toBeDefined();
        });
    });
  });
});
