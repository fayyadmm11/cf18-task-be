import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({
      access_token: 'test_token_123',
      user: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'STUDENT',
      },
    }),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should return access_token and user info on successful login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await controller.signIn(loginDto);

      expect(result).toEqual({
        access_token: 'test_token_123',
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'STUDENT',
        },
      });
      expect(mockAuthService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
    });
  });
});
