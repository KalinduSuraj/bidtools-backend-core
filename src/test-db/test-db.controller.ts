import { Controller, Post, Get } from '@nestjs/common';
import { TestDbService } from './test-db.service';

@Controller('test-db')
export class TestDbController {
  constructor(private readonly service: TestDbService) {}

  @Get()
  TestConnection() {
    return 'DynamoDB API Working';
  }

  @Post()
  testConnection() {
    return this.service.insertTestItem();
  }
}
