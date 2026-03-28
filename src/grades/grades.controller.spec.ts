import { Test, TestingModule } from '@nestjs/testing';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

describe('GradesController', () => {
  let controller: GradesController;

  const mockGradesService = {
    inputGrades: jest.fn().mockResolvedValue({ success: true }),
    getStudentGrades: jest.fn().mockResolvedValue([]),
    publishGrades: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradesController],
      providers: [
        {
          provide: GradesService,
          useValue: mockGradesService,
        },
      ],
    }).compile();

    controller = module.get<GradesController>(GradesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
