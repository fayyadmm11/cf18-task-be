import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { DATABASE_CONNECTION } from '../database/database.module';

describe('CoursesService', () => {
  let service: CoursesService;

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
        CoursesService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDatabase,
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
});
