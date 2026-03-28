import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Health Check',
    description: 'Endpoint untuk mengecek kesehatan API',
  })
  @ApiResponse({ status: 200, description: 'API berjalan dengan baik' })
  getHello(): string {
    return this.appService.getHello();
  }
}
