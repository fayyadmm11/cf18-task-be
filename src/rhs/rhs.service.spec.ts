import { Test, TestingModule } from '@nestjs/testing';
import { RhsService } from './rhs.service';

describe('RhsService', () => {
  let service: RhsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RhsService],
    }).compile();

    service = module.get<RhsService>(RhsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
