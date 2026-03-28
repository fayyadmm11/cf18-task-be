import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DATABASE_CONNECTION } from '../database/database.module';

describe('UsersService', () => {
  let service: UsersService;

  const mockDatabase = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDatabase,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find user by email', async () => {
    const mockUser = { id: 1, email: 'test@example.com', role: 'MAHASISWA' };
    mockDatabase.limit.mockResolvedValueOnce([mockUser]);

    const result = await service.findByEmail('test@example.com');
    expect(result).toBeDefined();
  });

  it('should return null if user not found', async () => {
    mockDatabase.limit.mockResolvedValueOnce([]);

    const result = await service.findByEmail('notfound@example.com');
    expect(result).toBeNull();
  });
});
