import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BacklogService } from './backlog.service';
import { BacklogItem } from '../models';
import { environment } from '../../environments/environment';

describe('BacklogService', () => {
  let service: BacklogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BacklogService],
    });

    service = TestBed.inject(BacklogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should fetch all backlog items', () => {
      // Arrange
      const mockItems: BacklogItem[] = [
        {
          id: 1,
          title: 'Implement user auth',
          description: 'Setup JWT authentication',
          category: 'DEVELOPMENT',
          status: 'AVAILABLE',
          estimatedEffort: 8,
          createdBy: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Fix bug in dashboard',
          description: 'Charts not updating',
          category: 'BUG_FIX',
          status: 'AVAILABLE',
          estimatedEffort: 3,
          createdBy: 1,
          createdAt: new Date().toISOString(),
        },
      ];

      // Act
      service.getAll().subscribe((items) => {
        // Assert
        expect(items).toEqual(mockItems);
        expect(items.length).toBe(2);
      });

      // Assert HTTP request
      const req = httpMock.expectOne(`${environment.apiUrl}/backlog`);
      expect(req.request.method).toBe('GET');
      req.flush(mockItems);
    });

    it('should return empty array when no items exist', () => {
      // Act
      service.getAll().subscribe((items) => {
        // Assert
        expect(items).toEqual([]);
        expect(items.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/backlog`);
      req.flush([]);
    });

    it('should make GET request to correct endpoint', () => {
      // Act
      service.getAll().subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/backlog`);
      expect(req.request.method).toBe('GET');
    });
  });

  describe('getById', () => {
    it('should fetch a single backlog item by id', () => {
      // Arrange
      const mockItem: BacklogItem = {
        id: 1,
        title: 'Implement user auth',
        description: 'Setup JWT authentication',
        category: 'DEVELOPMENT',
        status: 'AVAILABLE',
        estimatedEffort: 8,
        createdBy: 1,
        createdAt: new Date().toISOString(),
      };

      // Act
      service.getById(1).subscribe((item) => {
        // Assert
        expect(item).toEqual(mockItem);
        expect(item.id).toBe(1);
        expect(item.title).toBe('Implement user auth');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/backlog/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockItem);
    });

    it('should include item id in request URL', () => {
      // Act
      service.getById(42).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/backlog/42`);
      expect(req.request.url).toContain('/42');
      req.flush({});
    });

    it('should handle different item ids correctly', () => {
      // Act
      const ids = [1, 5, 100, 999];

      ids.forEach((id) => {
        service.getById(id).subscribe();
        const req = httpMock.expectOne(`${environment.apiUrl}/backlog/${id}`);
        expect(req.request.method).toBe('GET');
        req.flush({});
      });
    });
  });

  describe('create', () => {
    it('should create a new backlog item', () => {
      // Arrange
      const newItem: BacklogItem = {
        id: 0, // Not set yet
        title: 'New feature',
        description: 'Implement new feature',
        category: 'DEVELOPMENT',
        status: 'AVAILABLE',
        estimatedEffort: 13,
        createdBy: 1,
        createdAt: new Date().toISOString(),
      };

      const createdItem: BacklogItem = { ...newItem, id: 3 };

      // Act
      service.create(newItem).subscribe((item) => {
        // Assert
        expect(item.id).toBe(3);
        expect(item.title).toBe('New feature');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/backlog`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newItem);
      req.flush(createdItem);
    });

    it('should send item data in request body', () => {
      // Arrange
      const item: BacklogItem = {
        id: 0,
        title: 'Test',
        description: 'Test item',
        category: 'BUG_FIX',
        status: 'AVAILABLE',
        estimatedEffort: 2,
        createdBy: 2,
        createdAt: new Date().toISOString(),
      };

      // Act
      service.create(item).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/backlog`);
      expect(req.request.body).toEqual(item);
      req.flush({});
    });

    it('should make POST request', () => {
      // Act
      service.create({} as BacklogItem).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/backlog`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('update', () => {
    it('should update an existing backlog item', () => {
      // Arrange
      const updatedItem: BacklogItem = {
        id: 1,
        title: 'Updated title',
        description: 'Updated description',
        category: 'DEVELOPMENT',
        status: 'IN_PROGRESS',
        estimatedEffort: 10,
        createdBy: 1,
        createdAt: new Date().toISOString(),
      };

      // Act
      service.update(1, updatedItem).subscribe((item) => {
        // Assert
        expect(item.title).toBe('Updated title');
        expect(item.status).toBe('IN_PROGRESS');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/backlog/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedItem);
      req.flush(updatedItem);
    });

    it('should include item id in request URL', () => {
      // Act
      service.update(5, {} as BacklogItem).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/backlog/5`);
      expect(req.request.url).toContain('/5');
      req.flush({});
    });

    it('should make PUT request', () => {
      // Act
      service.update(1, {} as BacklogItem).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/backlog/1`);
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('should send updated item data in request body', () => {
      // Arrange
      const item: BacklogItem = {
        id: 1,
        title: 'Updated',
        description: 'Updated',
        category: 'DEVELOPMENT',
        status: 'COMPLETED',
        estimatedEffort: 5,
        createdBy: 1,
        createdAt: new Date().toISOString(),
      };

      // Act
      service.update(1, item).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/backlog/1`);
      expect(req.request.body).toEqual(item);
      req.flush({});
    });
  });

  describe('delete', () => {
    it('should delete a backlog item', () => {
      // Act
      service.delete(1).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/backlog/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should include item id in request URL', () => {
      // Act
      service.delete(10).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/backlog/10`);
      expect(req.request.url).toContain('/10');
      req.flush(null);
    });

    it('should make DELETE request', () => {
      // Act
      service.delete(1).subscribe();

      // Assert
      const req = httpMock.expectOne(`${environment.apiUrl}/backlog/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle deletion of multiple items', () => {
      // Act
      [1, 2, 3].forEach((id) => {
        service.delete(id).subscribe();
      });

      // Assert
      [1, 2, 3].forEach((id) => {
        const req = httpMock.expectOne(`${environment.apiUrl}/backlog/${id}`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP errors in getAll', () => {
      // Act
      service.getAll().subscribe({
        error: (error: any) => {
          // Assert
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/backlog`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle 404 errors in getById', () => {
      // Act
      service.getById(999).subscribe({
        error: (error: any) => {
          // Assert
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/backlog/999`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });
});
