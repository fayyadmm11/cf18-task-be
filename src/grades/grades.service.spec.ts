import { Test, TestingModule } from '@nestjs/testing';
import { GradesService } from './grades.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';

describe('GradesService', () => {
  let service: GradesService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      transaction: jest.fn(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: DATABASE_CONNECTION, useValue: mockDb },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have getGradingComponents method', () => {
      expect(typeof service.getGradingComponents).toBe('function');
    });

    it('should have getCourseGrades method', () => {
      expect(typeof service.getCourseGrades).toBe('function');
    });

    it('should have inputStudentGrades method', () => {
      expect(typeof service.inputStudentGrades).toBe('function');
    });

    it('should have setGradingComponents method', () => {
      expect(typeof service.setGradingComponents).toBe('function');
    });

    it('should have toggleGradePublication method', () => {
      expect(typeof service.toggleGradePublication).toBe('function');
    });
  });

  describe('getGradingComponents', () => {
    it('should return grading components for course', async () => {
      const mockComponents = [
        { id: 1, courseId: 1, name: 'UTS', weight: 30 },
        { id: 2, courseId: 1, name: 'UAS', weight: 40 },
      ];
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockComponents),
      });
      const result = await service.getGradingComponents(1);
      expect(result).toEqual(mockComponents);
    });

    it('should return empty array if no components', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });
      const result = await service.getGradingComponents(1);
      expect(result).toEqual([]);
    });
  });

  describe('setGradingComponents', () => {
    it('should throw NotFoundException if course not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });
      const dto = {
        components: [
          { name: 'UTS', weight: 50 },
          { name: 'UAS', weight: 50 },
        ],
      } as any;
      await expect(service.setGradingComponents(999, dto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if not course lecturer', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ lecturerId: 2 }]),
      });
      const dto = {
        components: [
          { name: 'UTS', weight: 50 },
          { name: 'UAS', weight: 50 },
        ],
      } as any;
      await expect(service.setGradingComponents(1, dto, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if total weight not 100', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ lecturerId: 1 }]),
      });
      const dto = {
        components: [
          { name: 'UTS', weight: 50 },
          { name: 'UAS', weight: 30 },
        ],
      } as any;
      await expect(service.setGradingComponents(1, dto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should set components successfully with total weight 100', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ lecturerId: 1 }]),
      });
      mockDb.transaction.mockImplementation((cb: any) =>
        cb({
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([{ id: 1 }]),
          delete: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          values: jest.fn().mockResolvedValue([]),
        }),
      );
      const dto = {
        components: [
          { name: 'UTS', weight: 40 },
          { name: 'UAS', weight: 60 },
        ],
      } as any;
      const result = await service.setGradingComponents(1, dto, 1);
      expect(result.message).toContain('berhasil disimpan');
      expect(result.totalWeight).toBe(100);
    });
  });

  describe('getCourseGrades', () => {
    it('should throw NotFoundException if course not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });
      await expect(service.getCourseGrades(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if not course lecturer', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([
            { name: 'Programming', isGradesPublished: false, lecturerId: 2 },
          ]),
      });
      await expect(service.getCourseGrades(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return course grades with students and components', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([
            { name: 'Programming', isGradesPublished: false, lecturerId: 1 },
          ]),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([{ id: 1, name: 'UTS', weight: 50 }]),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([{ id: 1, npm: '123456', name: 'John' }]),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([{ studentId: 1, componentId: 1, score: 85 }]),
      });
      const result = await service.getCourseGrades(1, 1);
      expect(result).toHaveProperty('courseId');
      expect(result).toHaveProperty('courseName');
      expect(result).toHaveProperty('students');
      expect(result).toHaveProperty('initialComponents');
      expect(result).toHaveProperty('initialGrades');
    });
  });

  describe('inputStudentGrades', () => {
    it('should throw NotFoundException if course not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });
      const dto = {
        grades: [{ studentId: 1, componentId: 1, score: 85 }],
      } as any;
      await expect(service.inputStudentGrades(999, dto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if not course lecturer', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ lecturerId: 2 }]),
      });
      const dto = {
        grades: [{ studentId: 1, componentId: 1, score: 85 }],
      } as any;
      await expect(service.inputStudentGrades(1, dto, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should input student grades successfully', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ lecturerId: 1 }]),
      });
      mockDb.transaction.mockImplementation((cb: any) =>
        cb({
          delete: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([]),
          insert: jest.fn().mockReturnThis(),
          values: jest.fn().mockResolvedValue([]),
        }),
      );
      const dto = {
        grades: [{ studentId: 1, componentId: 1, score: 85 }],
      } as any;
      const result = await service.inputStudentGrades(1, dto, 1);
      expect(result.message).toContain('data nilai berhasil disimpan');
    });

    it('should input multiple grades successfully', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ lecturerId: 1 }]),
      });
      mockDb.transaction.mockImplementation((cb: any) =>
        cb({
          delete: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([]),
          insert: jest.fn().mockReturnThis(),
          values: jest.fn().mockResolvedValue([]),
        }),
      );
      const dto = {
        grades: [
          { studentId: 1, componentId: 1, score: 85 },
          { studentId: 2, componentId: 1, score: 90 },
        ],
      } as any;
      const result = await service.inputStudentGrades(1, dto, 1);
      expect(result.message).toContain('2 data nilai');
    });
  });

  describe('toggleGradePublication', () => {
    it('should throw NotFoundException if course not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });
      await expect(
        service.toggleGradePublication(999, true, 1),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not course lecturer', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ lecturerId: 2 }]),
      });
      await expect(service.toggleGradePublication(1, true, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should publish grades successfully', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ lecturerId: 1 }]),
      });
      mockDb.update.mockReturnValueOnce({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest
          .fn()
          .mockResolvedValue([{ id: 1, name: 'Programming' }]),
      });
      const result = await service.toggleGradePublication(1, true, 1);
      expect(result.message).toContain('DIPUBLIKASIKAN');
    });

    it('should hide grades successfully', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ lecturerId: 1 }]),
      });
      mockDb.update.mockReturnValueOnce({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest
          .fn()
          .mockResolvedValue([{ id: 1, name: 'Programming' }]),
      });
      const result = await service.toggleGradePublication(1, false, 1);
      expect(result.message).toContain('DISEMBUNYIKAN');
    });
  });
});
