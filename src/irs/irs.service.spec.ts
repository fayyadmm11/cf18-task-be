import { Test, TestingModule } from '@nestjs/testing';
import { IrsService } from './irs.service';

describe('IrsService', () => {
  let service: IrsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IrsService],
    }).compile();

    service = module.get<IrsService>(IrsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
