import { Test, TestingModule } from '@nestjs/testing';
import { IrsController } from './irs.controller';
import { IrsService } from './irs.service';

describe('IrsController', () => {
  let controller: IrsController;

  const mockIrsService = {
    getIrs: jest.fn().mockResolvedValue([]),
    createIrs: jest.fn().mockResolvedValue({ id: 1, courseId: 1 }),
    removeIrs: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IrsController],
      providers: [
        {
          provide: IrsService,
          useValue: mockIrsService,
        },
      ],
    }).compile();

    controller = module.get<IrsController>(IrsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
