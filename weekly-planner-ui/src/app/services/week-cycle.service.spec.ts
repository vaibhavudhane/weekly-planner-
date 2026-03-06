import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WeekCycleService } from './week-cycle.service';
import { WeekCycle } from '../models';
import { environment } from '../../environments/environment';

describe('WeekCycleService', () => {
  let service: WeekCycleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WeekCycleService],
    });

    service = TestBed.inject(WeekCycleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getCurrent', () => {
    it('should fetch the current week cycle', () => {
      // Arrange
      const mockCycle: WeekCycle = {
        id: 1,
        weekStartDate: '2026-03-05',
        weekEndDate: '2026-03-11',
        state: 'PLANNING',
        categoryPercentages: [
          { categoryId: 1, percentage: 50 },
          { categoryId: 2, percentage: 30 },
          { categoryId: 3, percentage: 20 },
        ],
        createdAt: new Date().toISOString(),
      };

      // Act
      service.getCurrent().subscribe((cycle) => {
        // Assert
        expect(cycle).toEqual(mockCycle);
        expect(cycle.state).toBe('PLANNING');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle/current`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCycle);
    });

    it('should return null when no active cycle exists', () => {
      // Act
      service.getCurrent().subscribe((cycle) => {
        // Assert
        expect(cycle).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle/current`);
      req.flush(null);
    });

    it('should make GET request to correct endpoint', () => {
      // Act
      service.getCurrent().subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle/current`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('getAll', () => {
    it('should fetch all week cycles', () => {
      // Arrange
      const mockCycles: WeekCycle[] = [
        {
          id: 1,
          weekStartDate: '2026-02-19',
          weekEndDate: '2026-02-25',
          state: 'FROZEN',
          categoryPercentages: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          weekStartDate: '2026-02-26',
          weekEndDate: '2026-03-04',
          state: 'FROZEN',
          categoryPercentages: [],
          createdAt: new Date().toISOString(),
        },
        {
          id: 3,
          weekStartDate: '2026-03-05',
          weekEndDate: '2026-03-11',
          state: 'PLANNING',
          categoryPercentages: [],
          createdAt: new Date().toISOString(),
        },
      ];

      // Act
      service.getAll().subscribe((cycles) => {
        // Assert
        expect(cycles).toEqual(mockCycles);
        expect(cycles.length).toBe(3);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCycles);
    });

    it('should return empty array when no cycles exist', () => {
      // Act
      service.getAll().subscribe((cycles) => {
        // Assert
        expect(cycles).toEqual([]);
        expect(cycles.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle`);
      req.flush([]);
    });

    it('should make GET request to correct endpoint', () => {
      // Act
      service.getAll().subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('create', () => {
    it('should create a new week cycle', () => {
      // Arrange
      const newCycle: WeekCycle = {
        id: 0,
        weekStartDate: '2026-03-12',
        weekEndDate: '2026-03-18',
        state: 'SETUP',
        categoryPercentages: [],
        createdAt: new Date().toISOString(),
      };

      const createdCycle: WeekCycle = { ...newCycle, id: 4 };

      // Act
      service.create(newCycle).subscribe((cycle) => {
        // Assert
        expect(cycle.id).toBe(4);
        expect(cycle.state).toBe('SETUP');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newCycle);
      req.flush(createdCycle);
    });

    it('should send cycle data in request body', () => {
      // Arrange
      const cycle: WeekCycle = {
        id: 0,
        weekStartDate: '2026-03-12',
        weekEndDate: '2026-03-18',
        state: 'SETUP',
        categoryPercentages: [],
        createdAt: new Date().toISOString(),
      };

      // Act
      service.create(cycle).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle`);
      expect(req.request.body).toEqual(cycle);
      req.flush({});
    });

    it('should make POST request', () => {
      // Act
      service.create({} as WeekCycle).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('setPercentages', () => {
    it('should set category percentages for a cycle', () => {
      // Arrange
      const cycleId = 1;
      const cat1 = 50;
      const cat2 = 30;
      const cat3 = 20;

      // Act
      service.setPercentages(cycleId, cat1, cat2, cat3).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle/1/percentages`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ cat1, cat2, cat3 });
      req.flush({});
    });

    it('should include cycle id in request URL', () => {
      // Act
      service.setPercentages(5, 50, 30, 20).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle/5/percentages`);
      expect(req.request.url).toContain('/5/');
      req.flush({});
    });

    it('should handle different percentage combinations', () => {
      // Arrange
      const combinations = [
        { cat1: 50, cat2: 30, cat3: 20 },
        { cat1: 60, cat2: 25, cat3: 15 },
        { cat1: 40, cat2: 40, cat3: 20 },
        { cat1: 33, cat2: 33, cat3: 34 },
      ];

      // Act & Assert
      combinations.forEach(({ cat1, cat2, cat3 }, index) => {
        service.setPercentages(index + 1, cat1, cat2, cat3).subscribe();
        const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle/${index + 1}/percentages`);
        expect(req.request.body).toEqual({ cat1, cat2, cat3 });
        req.flush({});
      });
    });

    it('should handle zero percentages', () => {
      // Act
      service.setPercentages(1, 0, 0, 100).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle/1/percentages`);
      expect(req.request.body).toEqual({ cat1: 0, cat2: 0, cat3: 100 });
      req.flush({});
    });

    it('should handle edge case percentages summing to 100', () => {
      // Act
      service.setPercentages(1, 1, 1, 98).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle/1/percentages`);
      expect(req.request.body).toEqual({ cat1: 1, cat2: 1, cat3: 98 });
      req.flush({});
    });

    it('should make PUT request', () => {
      // Act
      service.setPercentages(1, 50, 30, 20).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle/1/percentages`);
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('should handle multiple cycles with different percentages', () => {
      // Act
      service.setPercentages(1, 50, 30, 20).subscribe();
      service.setPercentages(2, 60, 25, 15).subscribe();
      service.setPercentages(3, 40, 40, 20).subscribe();

      // Assert
      let req = httpMock.expectOne(`${environment.apiUrl}/weekcycle/1/percentages`);
      expect(req.request.body).toEqual({ cat1: 50, cat2: 30, cat3: 20 });
      req.flush({});

      req = httpMock.expectOne(`${environment.apiUrl}/weekcycle/2/percentages`);
      expect(req.request.body).toEqual({ cat1: 60, cat2: 25, cat3: 15 });
      req.flush({});

      req = httpMock.expectOne(`${environment.apiUrl}/weekcycle/3/percentages`);
      expect(req.request.body).toEqual({ cat1: 40, cat2: 40, cat3: 20 });
      req.flush({});
    });
  });

  describe('Error handling', () => {
    it('should handle errors in getCurrent', () => {
      // Act
      service.getCurrent().subscribe({
        error: (error: any) => {
          expect(error.status).toBe(500);
        },
      });

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle/current`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle 404 for non-existent cycle', () => {
      // Act
      service.getAll().subscribe({
        error: (error: any) => {
          expect(error.status).toBe(404);
        },
      });

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle validation errors in setPercentages', () => {
      // Act
      service.setPercentages(1, 50, 30, 20).subscribe({
        error: (error: any) => {
          expect(error.status).toBe(400);
        },
      });

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/weekcycle/1/percentages`);
      req.flush('Invalid percentages', {
        status: 400,
        statusText: 'Bad Request',
      });
    });
  });
});
