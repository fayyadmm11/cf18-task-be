import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt di top level
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let usersService: UsersService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    name: 'Test User',
    npm: '123456',
    nip: null,
    role: 'MAHASISWA',
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('test_jwt_token'),
    verify: jest.fn().mockReturnValue({
      sub: 1,
      email: 'test@example.com',
    }),
  };

  const mockUsersService = {
    findByEmail: jest.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('login', () => {
    it('should return access token on successful login', async () => {
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.login('test@example.com', 'password123');

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('test_jwt_token');
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should throw UnauthorizedException if email not found', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);

      await expect(
        service.login('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with correct message if email not found', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);

      await expect(
        service.login('nonexistent@example.com', 'password123'),
      ).rejects.toThrow('Email atau password salah');
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.login('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with correct message if password is incorrect', async () => {
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.login('test@example.com', 'wrongpassword'),
      ).rejects.toThrow('Email atau password salah');
    });

    it('should create JWT payload with user data', async () => {
      mockBcrypt.compare.mockResolvedValue(true as never);

      await service.login('test@example.com', 'password123');

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          npm: mockUser.npm,
          role: mockUser.role,
        }),
      );
    });

    it('should handle DOSEN role in JWT', async () => {
      const dosenUser = {
        ...mockUser,
        role: 'DOSEN',
        npm: null,
        nip: '987654',
      };
      mockUsersService.findByEmail.mockResolvedValueOnce(dosenUser);
      mockBcrypt.compare.mockResolvedValue(true as never);

      await service.login('dosen@example.com', 'password123');

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'DOSEN',
          nip: '987654',
        }),
      );
    });

    it('should call bcrypt.compare with correct parameters', async () => {
      mockBcrypt.compare.mockResolvedValue(true as never);

      await service.login('test@example.com', 'mypassword');

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        'mypassword',
        mockUser.password,
      );
    });
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have login method', () => {
      expect(typeof service.login).toBe('function');
    });

    it('should have usersService injected', () => {
      expect(usersService).toBeDefined();
    });

    it('should have jwtService injected', () => {
      expect(jwtService).toBeDefined();
    });
  });
});
