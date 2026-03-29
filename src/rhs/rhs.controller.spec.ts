import { Test, TestingModule } from '@nestjs/testing';
import { RhsController } from './rhs.controller';
import { RhsService } from './rhs.service';

describe('RhsController', () => {
  let controller: RhsController;

  const mockRhsService = {
    getRhs: jest.fn().mockResolvedValue([]),
    createRhs: jest.fn().mockResolvedValue({ id: 1 }),
    updateRhs: jest.fn().mockResolvedValue({ id: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RhsController],
      providers: [
        {
          provide: RhsService,
          useValue: mockRhsService,
        },
      ],
    }).compile();

    controller = module.get<RhsController>(RhsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
