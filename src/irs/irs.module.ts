// src/irs/irs.module.ts
import { Module } from '@nestjs/common';
import { IrsService } from './irs.service';
import { IrsController } from './irs.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  // Tambahkan DatabaseModule ke dalam imports agar IrsService mengenali 'DB_CONNECTION'
  imports: [DatabaseModule],
  controllers: [IrsController],
  providers: [IrsService],
})
export class IrsModule {}
