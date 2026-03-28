import { Test, TestingModule } from '@nestjs/testing';
import { RhsService } from './rhs.service';
import { DATABASE_CONNECTION } from '../database/database.module';

describe('RhsService', () => {
  let service: RhsService;

  const mockDatabase = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RhsService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDatabase,
        },
      ],
    }).compile();

    service = module.get<RhsService>(RhsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be able to get student RHS', async () => {
    mockDatabase.where.mockResolvedValueOnce([]);
    mockDatabase.where.mockResolvedValueOnce([]);

    const result = await service.getStudentRHS(1);
    expect(result).toBeDefined();
    expect(result.studentId).toBe(1);
  });
});
