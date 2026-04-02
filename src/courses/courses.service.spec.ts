import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';

describe('CoursesService', () => {
  let service: CoursesService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      transaction: jest.fn(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: DATABASE_CONNECTION, useValue: mockDb },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have findAll method', () => {
    expect(typeof service.findAll).toBe('function');
  });

  it('should have create method', () => {
    expect(typeof service.create).toBe('function');
  });

  it('should have update method', () => {
    expect(typeof service.update).toBe('function');
  });

  it('should have remove method', () => {
    expect(typeof service.remove).toBe('function');
  });

  it('should have getCourseParticipants method', () => {
    expect(typeof service.getCourseParticipants).toBe('function');
  });

  describe('create', () => {
    it('should throw BadRequestException if schedules is empty', async () => {
      const createCourseDto = {
        code: 'CS101',
        name: 'Programming',
        credits: 3,
        capacity: 30,
        description: 'Basic course',
        schedules: [],
      } as any;
      await expect(service.create(createCourseDto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if schedules is undefined', async () => {
      const createCourseDto = {
        code: 'CS101',
        name: 'Programming',
        credits: 3,
        capacity: 30,
        description: 'Basic course',
      } as any;
      await expect(service.create(createCourseDto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if course not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });
      const updateCourseDto = { name: 'Updated' } as any;
      await expect(service.update(999, updateCourseDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if not course lecturer', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ lecturerId: 2 }]),
      });
      const updateCourseDto = { name: 'Updated' } as any;
      await expect(service.update(1, updateCourseDto, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if course not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });
      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not course lecturer', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ lecturerId: 2 }]),
      });
      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return paginated courses', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockResolvedValue([{ count: 5 }]),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([
          {
            id: 1,
            code: 'CS101',
            name: 'Programming',
            credits: 3,
            capacity: 30,
            enrolledCount: 25,
            lecturerName: 'Dr. Smith',
            lecturerId: 1,
          },
        ]),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });
      const result = await service.findAll(1, 10);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta.total).toBe(5);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('getCourseParticipants', () => {
    it('should return course participants successfully', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([{ name: 'Programming', capacity: 30 }]),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            id: 1,
            npm: '12345678',
            name: 'John Doe',
            email: 'john@example.com',
          },
        ]),
      });
      const result = await service.getCourseParticipants(1);
      expect(result.enrolled).toBe(1);
      expect(result.courseName).toBe('Programming');
      expect(result.capacity).toBe(30);
    });

    it('should throw NotFoundException if course not found', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      });
      await expect(service.getCourseParticipants(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
