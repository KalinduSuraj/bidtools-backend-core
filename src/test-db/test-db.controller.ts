import { Controller, Post, Get, Put, Body } from '@nestjs/common';
import { TestDbService } from './test-db.service';

@Controller('test-db')
export class TestDbController {
  constructor(private readonly service: TestDbService) {}

  @Get()
  getAllTestItems() {
    return this.service.getAllTestItem();
  }

  @Post()
  testConnection() {
    return this.service.insertTestItem();
  }

  @Put()
  updateTestItem(
    @Body('PK') pk: string,
    @Body('SK') sk: string,
    @Body('message') message: string,
  ) {
    return this.service.updateTestItem({ PK: pk, SK: sk, message });
  }
}
