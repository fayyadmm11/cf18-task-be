import { Module } from '@nestjs/common';
import { RhsController } from './rhs.controller';
import { RhsService } from './rhs.service';

@Module({
  controllers: [RhsController],
  providers: [RhsService],
})
export class RhsModule {}
