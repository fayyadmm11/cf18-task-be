import { Test, TestingModule } from '@nestjs/testing';
import { RhsService } from './rhs.service';
import { DATABASE_CONNECTION } from '../database/database.module';

describe('RhsService', () => {
  let service: RhsService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RhsService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<RhsService>(RhsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStudentRHS', () => {
    it('should return RHS with student courses and IP Semester', async () => {
      const studentId = 1;

      const enrolledCourses = [
        {
          courseId: 1,
          code: 'CS101',
          name: 'Programming',
          credits: 3,
          isPublished: true,
        },
        {
          courseId: 2,
          code: 'CS102',
          name: 'Database',
          credits: 4,
          isPublished: true,
        },
      ];

      const studentScores = [
        { courseId: 1, weight: 100, score: 85 },
        { courseId: 2, weight: 100, score: 80 },
      ];

      mockDb.select
        .mockReturnValueOnce(mockDb)
        .mockReturnValueOnce(mockDb);

      mockDb.where
        .mockReturnValueOnce(Promise.resolve(enrolledCourses))
        .mockReturnValueOnce(Promise.resolve(studentScores));

      const result = await service.getStudentRHS(studentId);

      expect(result.studentId).toBe(studentId);
      expect(result.totalSksEvaluated).toBe(7);
      expect(result.details.length).toBe(2);
      expect(result.details[0].status).toBe('Rilis');
      expect(result.details[0].letter).toBe('A');
      expect(result.details[1].letter).toBe('A-');
    });

    it('should return empty details when student has no courses', async () => {
      const studentId = 1;

      mockDb.select
        .mockReturnValueOnce(mockDb)
        .mockReturnValueOnce(mockDb);

      mockDb.where
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([]));

      const result = await service.getStudentRHS(studentId);

      expect(result.studentId).toBe(studentId);
      expect(result.details.length).toBe(0);
      expect(result.ipSemester).toBe(0);
      expect(result.totalSksEvaluated).toBe(0);
    });

    it('should return "Menunggu Publikasi" status when grades not published', async () => {
      const studentId = 1;

      const enrolledCourses = [
        {
          courseId: 1,
          code: 'CS101',
          name: 'Programming',
          credits: 3,
          isPublished: false,
        },
      ];

      const studentScores = [
        { courseId: 1, weight: 100, score: 85 },
      ];

      mockDb.select
        .mockReturnValueOnce(mockDb)
        .mockReturnValueOnce(mockDb);

      mockDb.where
        .mockReturnValueOnce(Promise.resolve(enrolledCourses))
        .mockReturnValueOnce(Promise.resolve(studentScores));

      const result = await service.getStudentRHS(studentId);

      expect(result.details[0].status).toBe('Menunggu Publikasi');
      expect(result.details[0].finalScore).toBeNull();
      expect(result.details[0].letter).toBe('-');
      expect(result.totalSksEvaluated).toBe(0);
    });

    it('should return "Belum Dinilai" status when no grades and not published', async () => {
      const studentId = 1;

      const enrolledCourses = [
        {
          courseId: 1,
          code: 'CS101',
          name: 'Programming',
          credits: 3,
          isPublished: false,
        },
      ];

      mockDb.select
        .mockReturnValueOnce(mockDb)
        .mockReturnValueOnce(mockDb);

      mockDb.where
        .mockReturnValueOnce(Promise.resolve(enrolledCourses))
        .mockReturnValueOnce(Promise.resolve([]));

      const result = await service.getStudentRHS(studentId);

      expect(result.details[0].status).toBe('Belum Dinilai');
      expect(result.totalSksEvaluated).toBe(0);
    });

    it('should calculate correct IP Semester with multiple courses', async () => {
      const studentId = 1;

      const enrolledCourses = [
        {
          courseId: 1,
          code: 'CS101',
          name: 'Programming',
          credits: 3,
          isPublished: true,
        },
        {
          courseId: 2,
          code: 'CS102',
          name: 'Database',
          credits: 4,
          isPublished: true,
        },
        {
          courseId: 3,
          code: 'CS103',
          name: 'Networks',
          credits: 2,
          isPublished: true,
        },
      ];

      // Programming: 85 = A (4.0), Database: 70 = B (3.0), Networks: 90 = A (4.0)
      // IP = (3*4.0 + 4*3.0 + 2*4.0) / (3 + 4 + 2) = (12 + 12 + 8) / 9 = 32 / 9 = 3.56
      const studentScores = [
        { courseId: 1, weight: 100, score: 85 },
        { courseId: 2, weight: 100, score: 70 },
        { courseId: 3, weight: 100, score: 90 },
      ];

      mockDb.select
        .mockReturnValueOnce(mockDb)
        .mockReturnValueOnce(mockDb);

      mockDb.where
        .mockReturnValueOnce(Promise.resolve(enrolledCourses))
        .mockReturnValueOnce(Promise.resolve(studentScores));

      const result = await service.getStudentRHS(studentId);

      expect(result.totalSksEvaluated).toBe(9);
      expect(parseFloat(result.ipSemester.toString())).toBeCloseTo(3.56, 1);
    });

    it('should handle grade letter conversion correctly for different score ranges', async () => {
      const studentId = 1;

      const enrolledCourses = [
        {
          courseId: 1,
          code: 'CS101',
          name: 'Score90',
          credits: 1,
          isPublished: true,
        },
        {
          courseId: 2,
          code: 'CS102',
          name: 'Score80',
          credits: 1,
          isPublished: true,
        },
        {
          courseId: 3,
          code: 'CS103',
          name: 'Score70',
          credits: 1,
          isPublished: true,
        },
        {
          courseId: 4,
          code: 'CS104',
          name: 'Score50',
          credits: 1,
          isPublished: true,
        },
        {
          courseId: 5,
          code: 'CS105',
          name: 'Score30',
          credits: 1,
          isPublished: true,
        },
      ];

      const studentScores = [
        { courseId: 1, weight: 100, score: 90 },
        { courseId: 2, weight: 100, score: 80 },
        { courseId: 3, weight: 100, score: 70 },
        { courseId: 4, weight: 100, score: 50 },
        { courseId: 5, weight: 100, score: 30 },
      ];

      mockDb.select
        .mockReturnValueOnce(mockDb)
        .mockReturnValueOnce(mockDb);

      mockDb.where
        .mockReturnValueOnce(Promise.resolve(enrolledCourses))
        .mockReturnValueOnce(Promise.resolve(studentScores));

      const result = await service.getStudentRHS(studentId);

      expect(result.details[0].letter).toBe('A');
      expect(result.details[1].letter).toBe('A-');
      expect(result.details[2].letter).toBe('B');
      expect(result.details[3].letter).toBe('D');
      expect(result.details[4].letter).toBe('E');
    });

    it('should calculate weighted scores correctly when components have different weights', async () => {
      const studentId = 1;

      const enrolledCourses = [
        {
          courseId: 1,
          code: 'CS101',
          name: 'Programming',
          credits: 3,
          isPublished: true,
        },
      ];

      // Component 1: weight=30%, score=100
      // Component 2: weight=70%, score=60
      // Final: (100*30 + 60*70)/100 = (3000 + 4200)/100 = 72
      const studentScores = [
        { courseId: 1, weight: 30, score: 100 },
        { courseId: 1, weight: 70, score: 60 },
      ];

      mockDb.select
        .mockReturnValueOnce(mockDb)
        .mockReturnValueOnce(mockDb);

      mockDb.where
        .mockReturnValueOnce(Promise.resolve(enrolledCourses))
        .mockReturnValueOnce(Promise.resolve(studentScores));

      const result = await service.getStudentRHS(studentId);

      expect(result.details[0].finalScore).toBeCloseTo(72, 1);
      expect(result.details[0].letter).toBe('B');
    });

    it('should only include courses with published grades in SKS calculation', async () => {
      const studentId = 1;

      const enrolledCourses = [
        {
          courseId: 1,
          code: 'CS101',
          name: 'Programming',
          credits: 3,
          isPublished: true,
        },
        {
          courseId: 2,
          code: 'CS102',
          name: 'Database',
          credits: 4,
          isPublished: false,
        },
        {
          courseId: 3,
          code: 'CS103',
          name: 'Networks',
          credits: 2,
          isPublished: true,
        },
      ];

      const studentScores = [
        { courseId: 1, weight: 100, score: 80 },
        { courseId: 2, weight: 100, score: 90 },
        { courseId: 3, weight: 100, score: 85 },
      ];

      mockDb.select
        .mockReturnValueOnce(mockDb)
        .mockReturnValueOnce(mockDb);

      mockDb.where
        .mockReturnValueOnce(Promise.resolve(enrolledCourses))
        .mockReturnValueOnce(Promise.resolve(studentScores));

      const result = await service.getStudentRHS(studentId);

      // Only CS101 (3 SKS, A-) and CS103 (2 SKS, A) are included
      expect(result.totalSksEvaluated).toBe(5);
      expect(result.details[1].status).toBe('Menunggu Publikasi');
    });
  });
});
