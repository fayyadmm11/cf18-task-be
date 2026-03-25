import { Test, TestingModule } from '@nestjs/testing';
import { IrsController } from './irs.controller';

describe('IrsController', () => {
  let controller: IrsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IrsController],
    }).compile();

    controller = module.get<IrsController>(IrsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
