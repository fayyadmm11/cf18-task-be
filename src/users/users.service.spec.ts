import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DATABASE_CONNECTION } from '../database/database.module';

describe('UsersService', () => {
  let service: UsersService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should find user by email successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'john@example.com',
        name: 'John Doe',
        role: 'MAHASISWA',
        npm: '2021001',
      };

      mockDb.limit.mockResolvedValueOnce([mockUser]);

      const result = await service.findByEmail('john@example.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe('john@example.com');
      expect(result?.name).toBe('John Doe');
      expect(result?.role).toBe('MAHASISWA');
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
    });

    it('should return null when user not found by email', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
    });

    it('should handle different email formats correctly', async () => {
      const testEmails = [
        'user+tag@example.com',
        'user.name@example.co.uk',
        'user_name@test-domain.com',
      ];

      for (const email of testEmails) {
        mockDb.limit.mockResolvedValueOnce([{ id: 1, email }]);

        const result = await service.findByEmail(email);

        expect(result?.email).toBe(email);
      }
    });

    it('should find DOSEN role users', async () => {
      const dosenUser = {
        id: 2,
        email: 'dosen@example.com',
        name: 'Dr. Smith',
        role: 'DOSEN',
        npm: null,
      };

      mockDb.limit.mockResolvedValueOnce([dosenUser]);

      const result = await service.findByEmail('dosen@example.com');

      expect(result?.role).toBe('DOSEN');
      expect(result?.name).toBe('Dr. Smith');
    });

    it('should find users with different roles', async () => {
      const roles = ['MAHASISWA', 'DOSEN', 'ADMIN'];

      for (const role of roles) {
        mockDb.limit.mockResolvedValueOnce([
          { id: 1, email: `user@${role.toLowerCase()}.com`, role },
        ]);

        const result = await service.findByEmail(
          `user@${role.toLowerCase()}.com`,
        );

        expect(result?.role).toBe(role);
      }
    });

    it('should call database methods in correct order', async () => {
      mockDb.limit.mockResolvedValueOnce([
        { id: 1, email: 'test@example.com' },
      ]);

      await service.findByEmail('test@example.com');

      const selectCall = (mockDb.select as jest.Mock).mock
        .invocationCallOrder[0];
      const fromCall = (mockDb.from as jest.Mock).mock.invocationCallOrder[0];
      const whereCall = (mockDb.where as jest.Mock).mock.invocationCallOrder[0];
      const limitCall = (mockDb.limit as jest.Mock).mock.invocationCallOrder[0];

      expect(selectCall).toBeLessThan(fromCall);
      expect(fromCall).toBeLessThan(whereCall);
      expect(whereCall).toBeLessThan(limitCall);
    });

    it('should return first result when multiple users exist (edge case)', async () => {
      const users = [
        { id: 1, email: 'test@example.com', name: 'User 1' },
        { id: 2, email: 'test@example.com', name: 'User 2' },
      ];

      mockDb.limit.mockResolvedValueOnce(users);

      const result = await service.findByEmail('test@example.com');

      expect(result?.id).toBe(1);
      expect(result?.name).toBe('User 1');
    });

    it('should handle empty string email', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const result = await service.findByEmail('');

      expect(result).toBeNull();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
    });

    it('should handle whitespace in email', async () => {
      const emailWithSpace = ' test@example.com ';
      mockDb.limit.mockResolvedValueOnce([{ id: 1, email: emailWithSpace }]);

      const result = await service.findByEmail(emailWithSpace);

      expect(result?.email).toBe(emailWithSpace);
    });

    it('should return user with complete information', async () => {
      const completeUser = {
        id: 1,
        email: 'complete@example.com',
        name: 'Complete User',
        role: 'MAHASISWA',
        npm: '2021001',
        createdAt: new Date('2023-01-01'),
      };

      mockDb.limit.mockResolvedValueOnce([completeUser]);

      const result = await service.findByEmail('complete@example.com');

      expect(result).toMatchObject(completeUser);
      expect(result?.createdAt).toBeDefined();
      expect(result?.id).toBe(1);
    });

    it('should handle case sensitivity in email search', async () => {
      const mockUser = { id: 1, email: 'Test@Example.Com' };

      mockDb.limit.mockResolvedValueOnce([mockUser]);

      const result = await service.findByEmail('Test@Example.Com');

      expect(result?.email).toBe('Test@Example.Com');
    });

    it('should maintain email exactly as stored in database', async () => {
      const emails = [
        'UPPERCASE@EXAMPLE.COM',
        'lowercase@example.com',
        'MixedCase@Example.Com',
      ];

      for (const email of emails) {
        mockDb.limit.mockResolvedValueOnce([{ id: 1, email }]);

        const result = await service.findByEmail(email);

        expect(result?.email).toBe(email);
      }
    });

    it('should use limit(1) to optimize query', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await service.findByEmail('test@example.com');

      expect(mockDb.limit).toHaveBeenCalledWith(1);
      expect(mockDb.limit).toHaveBeenCalledTimes(1);
    });

    it('should handle long email addresses', async () => {
      const longEmail =
        'very.long.email.address.with.many.parts@subdomain.example.co.uk';
      mockDb.limit.mockResolvedValueOnce([{ id: 1, email: longEmail }]);

      const result = await service.findByEmail(longEmail);

      expect(result?.email).toBe(longEmail);
    });

    it('should find MAHASISWA users with NPM', async () => {
      const mahasiswaUser = {
        id: 1,
        email: 'mahasiswa@example.com',
        name: 'Student Name',
        role: 'MAHASISWA',
        npm: '2021001234',
      };

      mockDb.limit.mockResolvedValueOnce([mahasiswaUser]);

      const result = await service.findByEmail('mahasiswa@example.com');

      expect(result?.role).toBe('MAHASISWA');
      expect(result?.npm).toBe('2021001234');
    });

    it('should find DOSEN users without NPM', async () => {
      const dosenUser = {
        id: 2,
        email: 'dosen@example.com',
        name: 'Lecturer Name',
        role: 'DOSEN',
        npm: null,
      };

      mockDb.limit.mockResolvedValueOnce([dosenUser]);

      const result = await service.findByEmail('dosen@example.com');

      expect(result?.role).toBe('DOSEN');
      expect(result?.npm).toBeNull();
    });

    it('should handle special characters in user name', async () => {
      const specialNameUser = {
        id: 1,
        email: 'special@example.com',
        name: "O'Brien-Smith",
        role: 'MAHASISWA',
        npm: '2021001',
      };

      mockDb.limit.mockResolvedValueOnce([specialNameUser]);

      const result = await service.findByEmail('special@example.com');

      expect(result?.name).toBe("O'Brien-Smith");
    });

    it('should return undefined properties as null or undefined', async () => {
      const minimalUser = {
        id: 1,
        email: 'minimal@example.com',
      };

      mockDb.limit.mockResolvedValueOnce([minimalUser]);

      const result = await service.findByEmail('minimal@example.com');

      expect(result).toBeDefined();
      expect(result?.email).toBe('minimal@example.com');
    });
  });
});
