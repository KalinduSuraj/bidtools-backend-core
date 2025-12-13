import { Injectable } from '@nestjs/common';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
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
}
