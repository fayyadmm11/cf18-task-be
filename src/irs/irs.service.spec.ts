import { Test, TestingModule } from '@nestjs/testing';
import { IrsService } from './irs.service';
import { DATABASE_CONNECTION } from '../database/database.module';

describe('IrsService', () => {
  let service: IrsService;

  const mockDatabase = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue([]),
    limit: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IrsService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDatabase,
        },
      ],
    }).compile();

    service = module.get<IrsService>(IrsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have takeCourse method', () => {
    expect(typeof service.takeCourse).toBe('function');
  });

  it('should have dropCourse method', () => {
    expect(typeof service.dropCourse).toBe('function');
  });

  it('should have getStudentIrs method', () => {
    expect(typeof service.getStudentIrs).toBe('function');
  });

  it('should have getCourseStudents method', () => {
    expect(typeof service.getCourseStudents).toBe('function');
  });
});
