import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test_jwt_token'),
    verify: jest.fn().mockReturnValue({
      sub: 1,
      email: 'test@example.com',
    }),
  };

  const mockUsersService = {
    findByEmail: jest.fn().mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      password: 'hashed_password',
      role: 'MAHASISWA',
    }),
  };

  beforeEach(async () => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have login method', () => {
    expect(typeof service.login).toBe('function');
  });
});
