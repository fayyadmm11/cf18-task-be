import { Test, TestingModule } from '@nestjs/testing';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

describe('CoursesController', () => {
  let controller: CoursesController;

  const mockCoursesService = {
    findAll: jest.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    }),
    getCourseParticipants: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 1, code: 'IF101' }),
    update: jest.fn().mockResolvedValue({ id: 1, code: 'IF101' }),
    remove: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: mockCoursesService,
        },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated courses', async () => {
      const result = await controller.findAll('1', '10');
      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });
      expect(mockCoursesService.findAll).toHaveBeenCalledWith(1, 10);
    });
  });
});
