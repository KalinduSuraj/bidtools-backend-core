import { Body, Injectable } from '@nestjs/common';
import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynomodbService } from '../common/dynomodb/dynomodb.service';

@Injectable()
export class TestDbService {
  private table = process.env.DYNAMODB_TABLE!;

  constructor(private readonly db: DynomodbService) {}

  async insertTestItem() {
    const item = {
      PK: 'TEST',
      SK: `ITEM#${Date.now()}`,
      message: 'DynamoDB connection successful',
      createdAt: new Date().toISOString(),
    };

    await this.db.client.send(
      new PutCommand({
        TableName: this.table,
        Item: item,
      }),
    );

    return item;
  }

  async getAllTestItem() {
    const result = await this.db.client.send(
      new ScanCommand({
        TableName: this.table,
      }),
    );

    return result.Items;
  }

  async updateTestItem(
    @Body() body: { PK: string; SK: string; message: string },
  ) {
    await this.db.client.send(
      new PutCommand({
        TableName: this.table,
        Item: body,
      }),
    );

    return body;
  }
}
