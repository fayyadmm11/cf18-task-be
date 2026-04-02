import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthResponse = {
    access_token: 'test_token_123',
  };

  const mockAuthService = {
    login: jest.fn().mockResolvedValue(mockAuthResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should return access_token on successful login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await controller.signIn(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(result).toHaveProperty('access_token');
      expect(mockAuthService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('should call authService.login with correct parameters', async () => {
      const loginDto: LoginDto = {
        email: 'mahasiswa@univ.ac.id',
        password: 'securepass123',
      };

      await controller.signIn(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        'mahasiswa@univ.ac.id',
        'securepass123',
      );
    });

    it('should handle different user roles', async () => {
      const studentDto: LoginDto = {
        email: 'student@example.com',
        password: 'password',
      };

      await controller.signIn(studentDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        'student@example.com',
        'password',
      );
    });

    it('should propagate UnauthorizedException from service', async () => {
      mockAuthService.login.mockRejectedValueOnce(
        new UnauthorizedException('Email atau password salah'),
      );

      const loginDto: LoginDto = {
        email: 'wrong@example.com',
        password: 'wrongpass',
      };

      await expect(controller.signIn(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle empty password', async () => {
      mockAuthService.login.mockRejectedValueOnce(
        new UnauthorizedException('Email atau password salah'),
      );

      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: '',
      };

      await expect(controller.signIn(loginDto)).rejects.toThrow();
    });

    it('should handle special characters in email', async () => {
      const loginDto: LoginDto = {
        email: 'test+special@example.com',
        password: 'password123',
      };

      await controller.signIn(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        'test+special@example.com',
        'password123',
      );
    });
  });

  describe('controller initialization', () => {
    it('should have signIn method', () => {
      expect(typeof controller.signIn).toBe('function');
    });

    it('should have authService injected', () => {
      expect(authService).toBeDefined();
    });
  });
});
