import { Test, TestingModule } from '@nestjs/testing';
import { GradesService } from './grades.service';
import { DATABASE_CONNECTION } from '../database/database.module';

describe('GradesService', () => {
  let service: GradesService;

  const mockDatabase = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDatabase,
        },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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

  it('should have toggleGradePublication method', () => {
    expect(typeof service.toggleGradePublication).toBe('function');
  });
});
