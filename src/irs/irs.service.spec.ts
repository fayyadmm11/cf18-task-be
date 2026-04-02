import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IrsService } from './irs.service';

describe('IrsService', () => {
  let service: IrsService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      transaction: jest.fn(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IrsService,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<IrsService>(IrsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('takeCourse', () => {
    it('should successfully take a course with valid enrollment', async () => {
      const studentId = 1;
      const courseId = 1;
      const targetCourse = {
        id: 1,
        name: 'Programming',
        credits: 3,
        capacity: 30,
      };

      const mockTx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn(),
        for: jest.fn().mockResolvedValue([targetCourse]),
        innerJoin: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockResolvedValue({}),
      };

      mockTx.where
        .mockReturnValueOnce(mockTx)
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([{ count: '10' }]));

      mockTx.for.mockReturnValueOnce(Promise.resolve([targetCourse]));

      mockDb.transaction.mockImplementation((cb) => cb(mockTx));

      const result = await service.takeCourse(studentId, courseId);

      expect(result.message).toBe('Berhasil mengambil mata kuliah');
      expect(result.course).toBe('Programming');
      expect(result.currentSks).toBe(3);
    });

    it('should throw NotFoundException when course does not exist', async () => {
      const studentId = 1;
      const courseId = 999;

      const mockTx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        for: jest.fn().mockResolvedValue([]),
      };

      mockDb.transaction.mockImplementation((cb) => cb(mockTx));

      await expect(service.takeCourse(studentId, courseId)).rejects.toThrow(
        new NotFoundException('Mata kuliah tidak ditemukan'),
      );
    });

    it('should throw BadRequestException when student already enrolled', async () => {
      const studentId = 1;
      const courseId = 1;

      const mockTx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn(),
        for: jest
          .fn()
          .mockResolvedValue([
            { id: 1, name: 'Programming', credits: 3, capacity: 30 },
          ]),
        innerJoin: jest.fn().mockReturnThis(),
      };

      mockTx.where
        .mockReturnValueOnce(mockTx)
        .mockReturnValueOnce(Promise.resolve([{ studentId: 1, courseId: 1 }]));

      mockDb.transaction.mockImplementation((cb) => cb(mockTx));

      await expect(service.takeCourse(studentId, courseId)).rejects.toThrow(
        new BadRequestException('Anda sudah mengambil mata kuliah ini'),
      );
    });

    it('should throw BadRequestException when SKS exceeds 24', async () => {
      const studentId = 1;
      const courseId = 1;

      const mockTx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn(),
        for: jest
          .fn()
          .mockResolvedValue([
            { id: 1, name: 'Programming', credits: 10, capacity: 30 },
          ]),
        innerJoin: jest.fn().mockReturnThis(),
      };

      mockTx.where
        .mockReturnValueOnce(mockTx)
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(
          Promise.resolve([{ credits: 15 }, { credits: 10 }]),
        );

      mockDb.transaction.mockImplementation((cb) => cb(mockTx));

      await expect(service.takeCourse(studentId, courseId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when schedule conflicts', async () => {
      const studentId = 1;
      const courseId = 1;

      const mockTx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn(),
        for: jest
          .fn()
          .mockResolvedValue([
            { id: 1, name: 'Programming', credits: 3, capacity: 30 },
          ]),
        innerJoin: jest.fn().mockReturnThis(),
      };

      mockTx.where
        .mockReturnValueOnce(mockTx)
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([{ credits: 3 }]))
        .mockReturnValueOnce(
          Promise.resolve([
            {
              courseId: 1,
              day: 'Monday',
              startTime: '08:00',
              endTime: '10:00',
            },
          ]),
        )
        .mockReturnValueOnce(
          Promise.resolve([
            {
              courseName: 'Database',
              day: 'Monday',
              startTime: '09:00',
              endTime: '11:00',
            },
          ]),
        );

      mockDb.transaction.mockImplementation((cb) => cb(mockTx));

      await expect(service.takeCourse(studentId, courseId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when course capacity is full', async () => {
      const studentId = 1;
      const courseId = 1;

      const mockTx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn(),
        for: jest
          .fn()
          .mockResolvedValue([
            { id: 1, name: 'Programming', credits: 3, capacity: 5 },
          ]),
        innerJoin: jest.fn().mockReturnThis(),
      };

      mockTx.where
        .mockReturnValueOnce(mockTx)
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([]))
        .mockReturnValueOnce(Promise.resolve([{ count: '5' }]));

      mockDb.transaction.mockImplementation((cb) => cb(mockTx));

      await expect(service.takeCourse(studentId, courseId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('dropCourse', () => {
    it('should successfully drop a course', async () => {
      const studentId = 1;
      const courseId = 1;

      mockDb.delete.mockReturnThis();
      mockDb.where.mockReturnValueOnce({
        returning: jest
          .fn()
          .mockResolvedValue([{ id: 1, studentId, courseId }]),
      });

      const result = await service.dropCourse(studentId, courseId);

      expect(result.message).toBe('Berhasil melepas mata kuliah');
    });

    it('should throw NotFoundException when enrollment does not exist', async () => {
      const studentId = 1;
      const courseId = 999;

      mockDb.delete.mockReturnThis();
      mockDb.where.mockReturnValueOnce({
        returning: jest.fn().mockResolvedValue([]),
      });

      await expect(service.dropCourse(studentId, courseId)).rejects.toThrow(
        new NotFoundException('Anda tidak sedang mengambil mata kuliah ini'),
      );
    });
  });

  describe('getStudentIrs', () => {
    it('should return student IRS with enrolled courses and total SKS', async () => {
      const studentId = 1;
      const enrolledCourses = [
        {
          id: 1,
          code: 'CS101',
          name: 'Programming',
          credits: 3,
          lecturerName: 'Dr. Smith',
        },
        {
          id: 2,
          code: 'CS102',
          name: 'Database',
          credits: 4,
          lecturerName: 'Dr. Jones',
        },
      ];

      const schedules = [
        { courseId: 1, day: 'Monday', startTime: '08:00', endTime: '10:00' },
        { courseId: 2, day: 'Tuesday', startTime: '10:00', endTime: '12:00' },
      ];

      mockDb.select.mockReturnValueOnce(mockDb).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(schedules),
      });

      mockDb.where.mockResolvedValue(enrolledCourses);

      const result = await service.getStudentIrs(studentId);

      expect(result.totalSks).toBe(7);
      expect(result.enrolledCourses.length).toBe(2);
      expect(result.enrolledCourses[0].schedules).toBeDefined();
    });

    it('should return empty courses when student has no enrollment', async () => {
      const studentId = 1;

      mockDb.select.mockReturnValueOnce(mockDb).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });

      mockDb.where.mockResolvedValue([]);

      const result = await service.getStudentIrs(studentId);

      expect(result.totalSks).toBe(0);
      expect(result.enrolledCourses.length).toBe(0);
    });

    it('should attach schedules correctly to courses', async () => {
      const studentId = 1;
      const enrolledCourses = [
        {
          id: 1,
          code: 'CS101',
          name: 'Programming',
          credits: 3,
          lecturerName: 'Dr. Smith',
        },
      ];

      const schedules = [
        { courseId: 1, day: 'Monday', startTime: '08:00', endTime: '10:00' },
        { courseId: 1, day: 'Wednesday', startTime: '10:00', endTime: '12:00' },
      ];

      mockDb.select.mockReturnValueOnce(mockDb).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(schedules),
      });

      mockDb.where.mockResolvedValue(enrolledCourses);

      const result = await service.getStudentIrs(studentId);

      expect(result.enrolledCourses[0].schedules.length).toBe(2);
      expect(
        result.enrolledCourses[0].schedules.every((s) => s.courseId === 1),
      ).toBe(true);
    });
  });
});
